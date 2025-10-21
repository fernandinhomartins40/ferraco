import { prisma } from '../../config/database';
import { randomUUID } from 'crypto';
import {
  conversationFlowV3 as conversationFlowV2,
  calculateQualificationScoreV3 as calculateQualificationScoreV2,
  findBestFAQ,
  recommendRelatedProducts,
} from './conversationFlowV3';
import {
  replaceVariablesV2,
  type ConversationStep
} from './conversationFlowV2';
import { whatsappAutomationService } from '../../services/whatsappAutomation.service';
import { logger } from '../../utils/logger';

export class ChatbotSessionService {
  /**
   * Inicia uma nova sessão de chatbot
   */
  async startSession(data?: {
    userAgent?: string;
    ipAddress?: string;
    source?: string;
    campaign?: string;
  }) {
    const sessionId = randomUUID();

    // Buscar config do chatbot
    const config = await prisma.chatbotConfig.findFirst();
    if (!config) {
      throw new Error('Chatbot config not found');
    }

    // Criar sessão
    const session = await prisma.chatbotSession.create({
      data: {
        sessionId,
        currentStage: 1,
        currentStepId: 'welcome',
        conversationData: JSON.stringify({
          userAgent: data?.userAgent,
          ipAddress: data?.ipAddress,
          source: data?.source,
          campaign: data?.campaign,
        }),
      },
    });

    // Buscar primeiro step do fluxo
    const firstStep = this.getStepById('welcome');

    if (!firstStep) {
      throw new Error('Welcome step not found in conversation flow');
    }

    // Preparar lista de produtos - SEMPRE do banco de dados
    const products = JSON.parse(config.products || '[]');
    const productList = products.length > 0
      ? products.map((p: any, idx: number) => `📦 ${p.name}\n   ${p.description?.substring(0, 80) || 'Produto sem descrição'}...`).join('\n\n')
      : 'Nenhum produto cadastrado ainda. Entre em contato conosco!';

    // Criar mensagem de boas-vindas
    const welcomeMessage = replaceVariablesV2(firstStep.botMessage, {
      nome: '',
      interesse: '',
      companyName: config.companyName,
      companyDescription: config.companyDescription,
      companyAddress: config.companyAddress,
      companyPhone: config.companyPhone,
      capturedPhone: '',
      productList,
      selectedProduct: '',
      faqAnswer: '',
    });

    await prisma.chatbotMessage.create({
      data: {
        chatbotSessionId: session.id,
        sender: 'bot',
        content: welcomeMessage,
        intent: 'welcome',
      },
    });

    return {
      session,
      message: welcomeMessage,
      options: firstStep.options || [],
      step: firstStep,
    };
  }

  /**
   * Processa uma mensagem do usuário
   */
  async processMessage(sessionId: string, userMessage: string, optionId?: string) {
    // Buscar sessão
    const session = await prisma.chatbotSession.findUnique({
      where: { sessionId },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    if (!session.isActive) {
      throw new Error('Session is not active');
    }

    // Buscar config
    const config = await prisma.chatbotConfig.findFirst();
    if (!config) {
      throw new Error('Chatbot config not found');
    }

    // Salvar mensagem do usuário
    await prisma.chatbotMessage.create({
      data: {
        chatbotSessionId: session.id,
        sender: 'user',
        content: userMessage,
      },
    });

    // Buscar step atual
    const currentStep = this.getStepById(session.currentStepId || 'welcome');
    if (!currentStep) {
      throw new Error('Current step not found');
    }

    // Processar resposta baseado no tipo de step
    let nextStepId: string | null = null;
    let capturedData: any = {};
    const userResponses = JSON.parse(session.userResponses || '{}');

    // Se foi clicado um botão de opção
    if (optionId && currentStep.options) {
      const selectedOption = currentStep.options.find(opt => opt.id === optionId);
      if (selectedOption) {
        nextStepId = selectedOption.nextStepId;

        // Capturar dado se especificado
        if (selectedOption.captureAs) {
          capturedData[selectedOption.captureAs] = selectedOption.label;
          userResponses[selectedOption.captureAs] = selectedOption.label;

          // Atualizar campos específicos
          if (selectedOption.captureAs === 'segment') {
            capturedData.segment = selectedOption.label;
          }
          if (selectedOption.captureAs === 'marketing_opt_in') {
            capturedData.marketingOptIn = true;
          }
        }
      }
    }
    // Se é captura de input de texto
    else if (currentStep.captureInput) {
      const { type, field, nextStepId: nextStep } = currentStep.captureInput;
      nextStepId = nextStep;

      // Validar e capturar baseado no tipo
      switch (type) {
        case 'name':
          capturedData.capturedName = userMessage;
          userResponses.name = userMessage;
          break;
        case 'email':
          // Validação básica de email
          if (!/\S+@\S+\.\S+/.test(userMessage)) {
            return this.createErrorResponse('Por favor, forneça um email válido.');
          }
          capturedData.capturedEmail = userMessage;
          userResponses.email = userMessage;
          break;
        case 'phone':
          // Validação básica de telefone
          const cleanPhone = userMessage.replace(/\D/g, '');
          if (cleanPhone.length < 10) {
            return this.createErrorResponse('Por favor, forneça um telefone válido.');
          }
          capturedData.capturedPhone = userMessage;
          userResponses.phone = userMessage;
          break;
        case 'text':
          capturedData[field] = userMessage;
          userResponses[field] = userMessage;
          if (field === 'interest') {
            capturedData.interest = userMessage;
          }
          break;
      }
    }

    // Se não conseguiu determinar próximo step, usar fallback
    if (!nextStepId) {
      return this.createFallbackResponse(session, config);
    }

    // Buscar próximo step
    const nextStep = this.getStepById(nextStepId);
    if (!nextStep) {
      return this.createFallbackResponse(session, config);
    }

    // Executar ações do step atual (ações ao sair do step)
    if (currentStep.actions) {
      await this.executeActions(currentStep.actions, session.id);
    }

    // Executar ações do próximo step (ações ao entrar no step)
    if (nextStep.actions) {
      await this.executeActions(nextStep.actions, session.id);
    }

    // Calcular novo score com contagem de mensagens
    const updatedSession = await prisma.chatbotSession.findUnique({
      where: { sessionId },
    });

    const messageCount = await prisma.chatbotMessage.count({
      where: { chatbotSessionId: session.id }
    });

    const newScore = calculateQualificationScoreV2({
      ...updatedSession,
      ...capturedData,
    }, messageCount);

    // Filtrar apenas campos válidos do Prisma schema
    const validFields = {
      capturedName: capturedData.capturedName,
      capturedEmail: capturedData.capturedEmail,
      capturedPhone: capturedData.capturedPhone,
      interest: capturedData.interest,
      segment: capturedData.segment,
      marketingOptIn: capturedData.marketingOptIn,
    };

    // Remover campos undefined
    Object.keys(validFields).forEach(key => {
      if (validFields[key] === undefined) {
        delete validFields[key];
      }
    });

    // Atualizar sessão
    await prisma.chatbotSession.update({
      where: { sessionId },
      data: {
        currentStepId: nextStepId,
        currentStage: nextStep.stage,
        userResponses: JSON.stringify(userResponses),
        qualificationScore: newScore,
        ...validFields,
      },
    });

    // Preparar lista de produtos com opções dinâmicas - SEMPRE do banco de dados
    const products = JSON.parse(config.products || '[]');
    const productList = products.length > 0
      ? products.map((p: any, idx: number) => `📦 ${p.name}\n   ${p.description?.substring(0, 80) || 'Produto sem descrição'}...`).join('\n\n')
      : 'Nenhum produto cadastrado ainda. Entre em contato conosco!';

    // Atualizar opções dinâmicas de produtos se for o step show_products
    if (nextStepId === 'show_products' && nextStep.options && products.length > 0) {
      const productOptions = products.map((p: any, idx: number) => ({
        id: `prod${idx + 1}`,
        label: `📦 ${p.name}`,
        nextStepId: 'product_interest',
        captureAs: 'selected_product',
      }));

      // Substituir as primeiras opções por produtos reais
      nextStep.options = [
        ...productOptions,
        ...nextStep.options.filter(opt => opt.id.startsWith('opt_')),
      ];
    }

    // Preparar resposta FAQ se necessário (com busca inteligente)
    let faqAnswer = '';
    if (nextStepId === 'faq_response') {
      const faqs = JSON.parse(config.faqs || '[]');
      const userQuestion = userResponses.faq_question || '';

      const bestFAQ = findBestFAQ(userQuestion, faqs);

      if (bestFAQ) {
        faqAnswer = `**${bestFAQ.question}**\n\n${bestFAQ.answer}`;
      } else {
        faqAnswer = 'Hmm, não encontrei uma resposta exata para essa dúvida. 🤔\n\nMas posso te conectar com um especialista que vai te ajudar!';
      }
    }

    // Preparar detalhes do produto selecionado
    let productDetails = '';
    let productBenefits = '';
    let relatedProducts = '';

    if (nextStepId === 'product_details' && userResponses.selected_product) {
      const products = JSON.parse(config.products || '[]');
      const selectedProduct = products.find((p: any) =>
        userResponses.selected_product.includes(p.name)
      );

      if (selectedProduct) {
        productDetails = `**${selectedProduct.name}**\n\n${selectedProduct.description}\n\n💰 **Preço:** ${selectedProduct.price || 'Sob consulta'}`;

        productBenefits = selectedProduct.features && selectedProduct.features.length > 0
          ? selectedProduct.features.map((f: string) => `✅ ${f}`).join('\n')
          : 'Entre em contato para mais informações técnicas.';

        const related = recommendRelatedProducts(selectedProduct.name, products, 2);
        relatedProducts = related.length > 0
          ? related.map((p: any) => `• ${p.name}`).join('\n')
          : 'Veja todos os nossos produtos!';
      }
    }

    // Criar mensagem do bot
    const botMessage = replaceVariablesV2(nextStep.botMessage, {
      nome: capturedData.capturedName || updatedSession?.capturedName || '',
      interesse: capturedData.interest || updatedSession?.interest || userResponses.selected_product || 'equipamentos',
      companyName: config.companyName,
      companyDescription: config.companyDescription,
      companyAddress: config.companyAddress,
      companyPhone: config.companyPhone,
      companyWebsite: config.companyWebsite,
      workingHours: config.workingHours,
      capturedPhone: capturedData.capturedPhone || updatedSession?.capturedPhone || '',
      productList,
      productDetails,
      productBenefits,
      relatedProducts,
      selectedProduct: userResponses.selected_product || '',
      faqAnswer,
    });

    await prisma.chatbotMessage.create({
      data: {
        chatbotSessionId: session.id,
        sender: 'bot',
        content: botMessage,
      },
    });

    return {
      message: botMessage,
      options: nextStep.options || [],
      step: nextStep,
      session: await prisma.chatbotSession.findUnique({ where: { sessionId } }),
    };
  }

  /**
   * Busca um step pelo ID
   */
  private getStepById(stepId: string): ConversationStep | undefined {
    return conversationFlowV2.find(step => step.id === stepId);
  }

  /**
   * Cria resposta de erro de validação
   */
  private createErrorResponse(errorMessage: string) {
    return {
      message: errorMessage,
      options: [],
      isError: true,
    };
  }

  /**
   * Cria resposta de fallback
   */
  private async createFallbackResponse(session: any, config: any) {
    const fallbackMessage = config.fallbackMessage || 'Desculpe, não entendi. Pode reformular?';

    await prisma.chatbotMessage.create({
      data: {
        chatbotSessionId: session.id,
        sender: 'bot',
        content: fallbackMessage,
      },
    });

    return {
      message: fallbackMessage,
      options: [],
    };
  }

  /**
   * Executa ações do step
   */
  private async executeActions(actions: any[], sessionId: string) {
    logger.debug(`🔧 Executando ${actions.length} ação(ões) para sessão ${sessionId}`);

    for (const action of actions) {
      logger.debug(`🔧 Executando ação: ${action.type}`);

      switch (action.type) {
        case 'increment_score':
          // Score já é calculado automaticamente
          break;
        case 'set_qualified':
          await prisma.chatbotSession.update({
            where: { id: sessionId },
            data: { isQualified: action.value },
          });
          logger.info(`✅ Sessão ${sessionId} marcada como qualificada: ${action.value}`);
          break;
        case 'create_lead':
          logger.info(`🎯 Criando lead para sessão ${sessionId}`);
          await this.createLeadFromSession(sessionId);
          break;
        case 'send_notification':
          // TODO: Implementar notificação para equipe
          logger.debug(`📧 Notificação para equipe (não implementado)`);
          break;
      }
    }
  }

  /**
   * Cria um lead a partir da sessão qualificada
   */
  private async createLeadFromSession(sessionId: string) {
    logger.info(`📝 Iniciando criação de lead para sessão ${sessionId}`);

    const session = await prisma.chatbotSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      logger.warn(`⚠️ Sessão ${sessionId} não encontrada`);
      return;
    }

    // Verificar se já existe lead
    if (session.leadId) {
      logger.info(`ℹ️ Lead já existe para sessão ${sessionId}: ${session.leadId}`);
      return;
    }

    // Criar lead se tiver pelo menos nome e telefone
    if (!session.capturedName || !session.capturedPhone) {
      logger.warn(`⚠️ Sessão ${sessionId} não possui dados mínimos (nome: ${session.capturedName}, telefone: ${session.capturedPhone})`);
      return;
    }

    logger.info(`✅ Sessão ${sessionId} possui dados válidos - criando lead...`);

    if (session.capturedName && session.capturedPhone) {
      // Buscar um usuário admin/system para ser o creator
      const systemUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
      });

      if (!systemUser) {
        logger.error(`❌ Nenhum usuário ADMIN encontrado no sistema - não foi possível criar lead`);
        return;
      }

      logger.info(`👤 Usando usuário ${systemUser.name} (${systemUser.email}) como criador do lead`);

      // Extrair source e campaign do conversationData
      let conversationData: any = {};
      try {
        conversationData = JSON.parse(session.conversationData || '{}');
      } catch (error) {
        logger.error('Erro ao parsear conversationData:', error);
      }

      const leadSource = conversationData.source || 'Chatbot';
      const campaign = conversationData.campaign;

      // Parse user responses para verificar handoff humano
      const userResponses = JSON.parse(session.userResponses || '{}');
      const isHumanHandoff = session.currentStepId === 'human_handoff';

      // Determinar prioridade baseado no contexto
      // Status sempre será "NOVO" - a movimentação entre colunas é feita manualmente no Kanban
      let status = 'NOVO';
      let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';

      if (isHumanHandoff) {
        // ⭐ HANDOFF HUMANO - Prioridade máxima
        priority = 'HIGH';
      } else {
        // Prioridade baseada no score
        if (session.qualificationScore >= 60) priority = 'HIGH';
        else if (session.qualificationScore >= 40) priority = 'MEDIUM';
        else priority = 'LOW';
      }

      // Determinar tipo de usuário
      let userType = 'generico';
      if (userResponses.user_type?.includes('produtor rural')) userType = 'produtor_rural';
      else if (userResponses.user_type?.includes('setor agro')) userType = 'profissional_agro';
      else if (userResponses.user_type?.includes('pesquisando')) userType = 'terceiros';

      // Extrair urgência
      let urgency = '';
      if (userResponses.urgency?.includes('urgente')) urgency = '15_dias';
      else if (userResponses.urgency?.includes('1 ou 2 meses')) urgency = '1_2_meses';
      else if (userResponses.urgency?.includes('3 meses')) urgency = '3_meses_mais';
      else if (userResponses.urgency?.includes('não tenho prazo')) urgency = 'sem_prazo';

      logger.info(`💾 Criando lead no banco de dados - Nome: ${session.capturedName}, Telefone: ${session.capturedPhone}, Status: ${status}, Prioridade: ${priority}`);

      const lead = await prisma.lead.create({
        data: {
          name: session.capturedName,
          phone: session.capturedPhone,
          email: session.capturedEmail,
          source: leadSource,
          status: status,
          priority: priority,
          leadScore: session.qualificationScore,
          metadata: JSON.stringify({
            sessionId: session.sessionId,
            interest: session.interest,
            segment: session.segment,
            marketingOptIn: session.marketingOptIn,
            userResponses: session.userResponses,
            campaign: campaign,
            // ⭐ NOVOS CAMPOS CONFORME DOCUMENTO
            userType: userType,
            activity: userResponses.activity || '',
            profession: userResponses.profession || '',
            relation: userResponses.proxy_relation || '',
            urgency: urgency,
            wantsPrice: userResponses.wants_pricing === 'wants_pricing',
            wantsMaterial: userResponses.wants_material === 'wants_material',
            requiresHumanAttendance: isHumanHandoff,
            handoffStage: isHumanHandoff ? session.currentStepId : '',
            handoffReason: isHumanHandoff ? 'usuario_pediu_equipe' : '',
            capturedAt: new Date().toISOString(),
            conversationStage: session.currentStage,
          }),
          createdById: systemUser.id,
        },
      });

      logger.info(`✅ Lead criado com sucesso! ID: ${lead.id}, Nome: ${lead.name}, Status: ${lead.status}`);

      // Atualizar sessão com o leadId
      await prisma.chatbotSession.update({
        where: { id: sessionId },
        data: {
          leadId: lead.id,
          isQualified: true, // Marcar como qualificado ao criar lead
        },
      });

      logger.info(`✅ Sessão ${sessionId} atualizada com leadId: ${lead.id}`);

      // ✅ NOVO: Criar automação WhatsApp em background
      logger.info(`🤖 Criando automação WhatsApp para lead ${lead.id} (${lead.name})`);
      whatsappAutomationService.createAutomationFromLead(lead.id)
        .catch(err => logger.error('❌ Erro ao criar automação WhatsApp:', err));

      // ⭐ NOVO: Se for handoff humano, iniciar bot do WhatsApp
      if (isHumanHandoff) {
        logger.info(`👨‍💼 Iniciando bot do WhatsApp para handoff humano - Lead ${lead.id}`);

        // Importação dinâmica para evitar circular dependency
        import('../whatsapp-bot/whatsapp-bot.service').then(module => {
          const { whatsappBotService } = module;
          whatsappBotService.startBotConversation(lead.id)
            .catch(err => logger.error('❌ Erro ao iniciar bot do WhatsApp:', err));
        }).catch(err => logger.error('❌ Erro ao importar whatsapp-bot.service:', err));
      }
    }
  }

  /**
   * Busca histórico da sessão
   */
  async getSessionHistory(sessionId: string) {
    const session = await prisma.chatbotSession.findUnique({
      where: { sessionId },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    return session;
  }

  /**
   * Encerra uma sessão
   */
  async endSession(sessionId: string) {
    await prisma.chatbotSession.update({
      where: { sessionId },
      data: {
        isActive: false,
        endedAt: new Date(),
      },
    });
  }
}
