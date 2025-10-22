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
import { leadTaggingService } from './lead-tagging.service';
import { chatbotConfigCache } from './chatbot-config-cache.service';

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

    // Buscar config do chatbot (COM CACHE)
    const config = await chatbotConfigCache.getConfig();

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

    // Buscar config (COM CACHE)
    const config = await chatbotConfigCache.getConfig();

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

    // 🔍 DIAGNÓSTICO CRÍTICO: Log do step atual
    logger.info(`🔍 [DIAGNÓSTICO-CRITICO] Step atual: ${session.currentStepId}`);
    logger.info(`   Opções estáticas no step: ${currentStep.options?.length || 0}`);
    if (currentStep.options && currentStep.options.length > 0) {
      logger.info(`   IDs das opções: ${currentStep.options.map(o => o.id).join(', ')}`);
    }

    // Processar resposta baseado no tipo de step
    let nextStepId: string | null = null;
    let capturedData: any = {};
    const userResponses = JSON.parse(session.userResponses || '{}');

    // Se foi clicado um botão de opção
    if (optionId && currentStep.options) {
      // 🔍 DIAGNÓSTICO: Log de captura de opção
      logger.debug(`🔍 [DIAGNÓSTICO] Processando opção selecionada:`);
      logger.debug(`   Option ID recebido: ${optionId}`);
      logger.debug(`   Current Step ID: ${session.currentStepId}`);
      logger.debug(`   Opções disponíveis no step: ${currentStep.options.map(o => o.id).join(', ')}`);

      const selectedOption = currentStep.options.find(opt => opt.id === optionId);

      if (!selectedOption) {
        logger.warn(`❌ [DIAGNÓSTICO-CRITICO] Opção ${optionId} NÃO ENCONTRADA em currentStep.options!`);
        logger.warn(`   Step atual: ${session.currentStepId}`);
        logger.warn(`   Opções disponíveis: ${currentStep.options.map(o => `${o.id} (${o.label})`).join(', ')}`);
        logger.warn(`   ⚠️  Isto significa que a opção dinâmica foi perdida!`);
      }

      if (selectedOption) {
        logger.debug(`   ✅ Opção encontrada: ${selectedOption.label}`);
        logger.debug(`   captureAs: ${selectedOption.captureAs || 'N/A'}`);
        logger.debug(`   nextStepId: ${selectedOption.nextStepId}`);

        nextStepId = selectedOption.nextStepId;

        // Capturar dado se especificado
        if (selectedOption.captureAs) {
          logger.debug(`   🎯 Capturando dado: ${selectedOption.captureAs} = ${selectedOption.label}`);
          capturedData[selectedOption.captureAs] = selectedOption.label;
          userResponses[selectedOption.captureAs] = selectedOption.label;

          // ⭐ NOVO: Capturar IDs dos produtos selecionados
          if (selectedOption.captureAs === 'selected_product_id') {
            logger.info(`🛒 [DIAGNÓSTICO] CAPTURANDO PRODUTO!`);
            logger.info(`   Produto ID: ${selectedOption.id}`);
            logger.info(`   Produto Label: ${selectedOption.label}`);
            logger.info(`   Produto Name: ${(selectedOption as any).productName}`);

            // Inicializar arrays se não existirem
            if (!userResponses.selected_product_ids) {
              userResponses.selected_product_ids = [];
              logger.debug(`   Criou array selected_product_ids`);
            }
            if (!userResponses.selected_products) {
              userResponses.selected_products = [];
              logger.debug(`   Criou array selected_products`);
            }

            // Adicionar ID do produto
            if (!userResponses.selected_product_ids.includes(selectedOption.id)) {
              userResponses.selected_product_ids.push(selectedOption.id);
              logger.info(`   ✅ ID adicionado a selected_product_ids: ${selectedOption.id}`);
            } else {
              logger.debug(`   ℹ️  ID já existe em selected_product_ids`);
            }

            // Adicionar nome do produto (sem emoji para compatibilidade)
            const productName = (selectedOption as any).productName || selectedOption.label.replace(/📦\s*/g, '');
            if (!userResponses.selected_products.includes(productName)) {
              userResponses.selected_products.push(productName);
              logger.info(`   ✅ Nome adicionado a selected_products: ${productName}`);
            } else {
              logger.debug(`   ℹ️  Nome já existe em selected_products`);
            }

            logger.info(`   📊 Estado atual:`);
            logger.info(`      selected_product_ids: ${JSON.stringify(userResponses.selected_product_ids)}`);
            logger.info(`      selected_products: ${JSON.stringify(userResponses.selected_products)}`);
          }

          // Manter compatibilidade com selected_product antigo
          if (selectedOption.captureAs === 'selected_product') {
            if (!userResponses.selected_products) {
              userResponses.selected_products = [];
            }
            // Adicionar produto se ainda não estiver na lista
            if (!userResponses.selected_products.includes(selectedOption.label)) {
              userResponses.selected_products.push(selectedOption.label);
            }
          }

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

    // ⭐ AUTO-SAVE PARCIAL: A cada 5 mensagens, tentar salvar lead parcial
    if (messageCount > 0 && messageCount % 5 === 0) {
      logger.debug(`🔄 Auto-save check na mensagem ${messageCount}`);
      await this.savePartialLead(sessionId).catch(err =>
        logger.error('Erro ao fazer auto-save parcial:', err)
      );
    }

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
      const productOptions = products.map((p: any) => ({
        id: p.id || p._id || `prod_${p.name.toLowerCase().replace(/\s+/g, '_')}`, // Usar ID real do produto
        label: `📦 ${p.name}`,
        nextStepId: 'product_details', // ⭐ NOVO: Mostrar detalhes antes de capturar interesse
        captureAs: 'selected_product_id', // Capturar ID ao invés do nome
        productName: p.name, // Guardar nome para referência
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

    // Preparar lista de produtos já selecionados (para mostrar no product_interest)
    let selectedProductsList = '';
    if (nextStepId === 'product_interest') {
      // Pegar todos os produtos selecionados ou usar o produto atual
      const allProducts = userResponses.selected_products && userResponses.selected_products.length > 0
        ? userResponses.selected_products
        : [userResponses.selected_product].filter(Boolean);

      if (allProducts.length > 0) {
        selectedProductsList = allProducts
          .map((p: string, idx: number) => `${idx + 1}. ${p}`)
          .join('\n');
      } else {
        selectedProductsList = '(nenhum produto selecionado ainda)';
      }
    }

    // ⭐ NOVO: Preparar variáveis individuais do produto selecionado (para o step product_details)
    let productName = '';
    let productDescription = '';
    let productPrice = '';
    let productSpecifications = '';
    let productDetails = '';
    let productBenefits = '';
    let relatedProducts = '';

    if (nextStepId === 'product_details') {
      // Buscar o último produto selecionado pelo ID
      const lastProductId = userResponses.selected_product_ids?.slice(-1)[0];

      if (lastProductId) {
        const selectedProduct = products.find((p: any) => {
          const productId = p.id || p._id || `prod_${p.name.toLowerCase().replace(/\s+/g, '_')}`;
          return productId === lastProductId;
        });

        if (selectedProduct) {
          productName = selectedProduct.name;
          productDescription = selectedProduct.description || 'Descrição não disponível';
          productPrice = selectedProduct.price || selectedProduct.valor || 'Consulte-nos';
          productSpecifications = selectedProduct.specifications || selectedProduct.especificacoes || 'Especificações técnicas disponíveis mediante contato';

          // Manter formato antigo para compatibilidade
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
      productName, // ⭐ NOVO: Nome do produto selecionado
      productDescription, // ⭐ NOVO: Descrição do produto
      productPrice, // ⭐ NOVO: Preço do produto
      productSpecifications, // ⭐ NOVO: Especificações do produto
      productDetails,
      productBenefits,
      relatedProducts,
      selectedProduct: userResponses.selected_product || '',
      selectedProductsList,
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
   * Auto-save parcial de sessões: Cria lead se tiver dados mínimos mas ainda não criou
   * Previne perda de leads em caso de abandono
   */
  async savePartialLead(sessionId: string): Promise<boolean> {
    try {
      const session = await prisma.chatbotSession.findUnique({
        where: { sessionId },
      });

      if (!session) {
        return false;
      }

      // Se já tem lead, não precisa criar novamente
      if (session.leadId) {
        return false;
      }

      // Se tem nome + telefone mas ainda não criou lead, criar agora
      if (session.capturedName && session.capturedPhone) {
        logger.info(`💾 Auto-save parcial: Criando lead para sessão ${sessionId} (nome: ${session.capturedName}, telefone: ${session.capturedPhone})`);
        await this.createLeadFromSession(session.id);
        return true;
      }

      return false;
    } catch (error) {
      logger.error(`❌ Erro ao fazer auto-save parcial da sessão ${sessionId}:`, error);
      return false;
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

      // 🔍 DIAGNÓSTICO: Log do estado da sessão ANTES do parse
      logger.info(`🔍 [DIAGNÓSTICO] Estado da sessão ANTES de extrair produtos:`);
      logger.info(`   📋 Session ID: ${session.id}`);
      logger.info(`   📋 sessionId (UUID): ${session.sessionId}`);
      logger.info(`   📋 currentStepId: ${session.currentStepId}`);
      logger.info(`   📋 userResponses (RAW do banco): ${session.userResponses}`);
      logger.info(`   📋 Tipo de userResponses: ${typeof session.userResponses}`);
      logger.info(`   📋 Length do JSON string: ${session.userResponses?.length || 0} caracteres`);

      // Parse user responses para verificar handoff humano
      const userResponses = JSON.parse(session.userResponses || '{}');

      // 🔍 DIAGNÓSTICO: Log DEPOIS do parse
      logger.info(`🔍 [DIAGNÓSTICO] userResponses APÓS JSON.parse():`);
      logger.info(`   📊 Tipo: ${typeof userResponses}`);
      logger.info(`   📊 Keys disponíveis: ${Object.keys(userResponses).join(', ')}`);
      logger.info(`   📊 Conteúdo completo: ${JSON.stringify(userResponses, null, 2)}`);

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

      // Extrair produtos selecionados
      logger.info(`🔍 Extraindo produtos selecionados para lead`);
      logger.info(`   userResponses.selected_product_ids: ${JSON.stringify(userResponses.selected_product_ids || [])}`);
      logger.info(`   userResponses.selected_products: ${JSON.stringify(userResponses.selected_products || [])}`);
      logger.info(`   userResponses.selected_product: ${userResponses.selected_product || 'N/A'}`);

      const selectedProducts = leadTaggingService.extractSelectedProducts(userResponses);

      logger.info(`✅ Produtos extraídos: ${JSON.stringify(selectedProducts)}`);
      logger.info(`   Total de produtos: ${selectedProducts.length}`);

      // Determinar se deve triggerar bot WhatsApp
      const shouldTriggerWhatsAppBot = isHumanHandoff || Boolean(userResponses.wants_pricing);

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
            // 🆕 NOVOS CAMPOS PARA INTEGRAÇÃO COM BOTS
            selectedProducts: selectedProducts,
            productsCount: selectedProducts.length,
            shouldTriggerWhatsAppBot: shouldTriggerWhatsAppBot,
            shouldAddToKanbanAutomation: true,
            wantsHumanContact: isHumanHandoff,
            wantsPricing: Boolean(userResponses.wants_pricing),
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

      // 🏷️ NOVO: Adicionar tags automáticas
      logger.info(`🏷️ Adicionando tags automáticas ao lead ${lead.id}`);
      leadTaggingService.addAutomaticTags(lead.id, {
        userResponses: session.userResponses,
        interest: session.interest,
        segment: session.segment,
        qualificationScore: session.qualificationScore,
        currentStepId: session.currentStepId,
      }).catch(err => logger.error('❌ Erro ao adicionar tags:', err));

      // ✅ NOVO: Criar automação WhatsApp em background
      logger.info(`🤖 Criando automação WhatsApp para lead ${lead.id} (${lead.name})`);
      whatsappAutomationService.createAutomationFromLead(lead.id)
        .catch(err => logger.error('❌ Erro ao criar automação WhatsApp:', err));

      // ⭐ NOVO: Trigger condicional do bot WhatsApp
      // Só inicia bot se usuário pediu handoff humano OU orçamento
      if (shouldTriggerWhatsAppBot) {
        logger.info(`🤖 Iniciando bot do WhatsApp - Lead ${lead.id} (Motivo: ${isHumanHandoff ? 'handoff humano' : 'quer orçamento'})`);

        // Importação dinâmica para evitar circular dependency
        import('../whatsapp-bot/whatsapp-bot.service').then(module => {
          const { whatsappBotService } = module;
          whatsappBotService.startBotConversation(lead.id)
            .catch(err => logger.error('❌ Erro ao iniciar bot do WhatsApp:', err));
        }).catch(err => logger.error('❌ Erro ao importar whatsapp-bot.service:', err));
      } else {
        logger.info(`ℹ️ Bot WhatsApp não iniciado para lead ${lead.id} - Usuário não solicitou handoff ou orçamento`);
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
    // ⭐ AUTO-SAVE: Tentar salvar lead parcial antes de encerrar
    logger.info(`🔚 Encerrando sessão ${sessionId} - verificando auto-save`);
    await this.savePartialLead(sessionId).catch(err =>
      logger.error('Erro ao fazer auto-save no encerramento:', err)
    );

    await prisma.chatbotSession.update({
      where: { sessionId },
      data: {
        isActive: false,
        endedAt: new Date(),
      },
    });
  }
}
