import { prisma } from '../../config/database';
import { randomUUID } from 'crypto';
import {
  defaultConversationFlow,
  replaceVariables,
  calculateQualificationScore,
  type ConversationStep
} from './conversationFlow';

export class ChatbotSessionService {
  /**
   * Inicia uma nova sessão de chatbot
   */
  async startSession(data?: { userAgent?: string; ipAddress?: string }) {
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
        }),
      },
    });

    // Buscar primeiro step do fluxo
    const firstStep = this.getStepById('welcome');

    if (!firstStep) {
      throw new Error('Welcome step not found in conversation flow');
    }

    // Preparar lista de produtos
    const products = JSON.parse(config.products || '[]');
    const productList = products.length > 0
      ? products.map((p: any, idx: number) => `${idx + 1}. ${p.name}`).join('\n')
      : 'Canzis para Vacas Leiteiras (Holandês e Jersey)';

    // Criar mensagem de boas-vindas
    const welcomeMessage = replaceVariables(firstStep.botMessage, {
      companyName: config.companyName,
      companyDescription: config.companyDescription,
      companyAddress: config.companyAddress,
      companyPhone: config.companyPhone,
      productList,
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

    // Executar ações do step atual
    if (currentStep.actions) {
      await this.executeActions(currentStep.actions, session.id);
    }

    // Calcular novo score
    const updatedSession = await prisma.chatbotSession.findUnique({
      where: { sessionId },
    });
    const newScore = calculateQualificationScore({
      ...updatedSession,
      ...capturedData,
    });

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

    // Preparar lista de produtos
    const products = JSON.parse(config.products || '[]');
    const productList = products.length > 0
      ? products.map((p: any, idx: number) => `📦 ${p.name}\n   ${p.description?.substring(0, 80) || ''}...`).join('\n\n')
      : '📦 Canzis para Vacas Leiteiras\n   Sistema de fechamento metálico para vacas Holandesas e Jersey';

    // Criar mensagem do bot
    const botMessage = replaceVariables(nextStep.botMessage, {
      nome: capturedData.capturedName || updatedSession?.capturedName || '',
      interesse: capturedData.interest || updatedSession?.interest || 'equipamentos',
      companyName: config.companyName,
      companyDescription: config.companyDescription,
      companyAddress: config.companyAddress,
      companyPhone: config.companyPhone,
      capturedPhone: capturedData.capturedPhone || updatedSession?.capturedPhone || '',
      productList,
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
    return defaultConversationFlow.find(step => step.id === stepId);
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
    for (const action of actions) {
      switch (action.type) {
        case 'increment_score':
          // Score já é calculado automaticamente
          break;
        case 'set_qualified':
          await prisma.chatbotSession.update({
            where: { id: sessionId },
            data: { isQualified: action.value },
          });
          break;
        case 'create_lead':
          await this.createLeadFromSession(sessionId);
          break;
        case 'send_notification':
          // TODO: Implementar notificação para equipe
          break;
      }
    }
  }

  /**
   * Cria um lead a partir da sessão qualificada
   */
  private async createLeadFromSession(sessionId: string) {
    const session = await prisma.chatbotSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) return;

    // Verificar se já existe lead
    if (session.leadId) return;

    // Criar lead se tiver pelo menos nome e telefone
    if (session.capturedName && session.capturedPhone) {
      // Buscar um usuário admin/system para ser o creator
      const systemUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
      });

      if (!systemUser) return;

      const lead = await prisma.lead.create({
        data: {
          name: session.capturedName,
          phone: session.capturedPhone,
          email: session.capturedEmail,
          source: 'Chatbot',
          status: 'NOVO',
          priority: session.qualificationScore >= 50 ? 'HIGH' : 'MEDIUM',
          leadScore: session.qualificationScore,
          metadata: JSON.stringify({
            sessionId: session.sessionId,
            interest: session.interest,
            segment: session.segment,
            marketingOptIn: session.marketingOptIn,
            userResponses: session.userResponses,
          }),
          createdById: systemUser.id,
        },
      });

      // Atualizar sessão com o leadId
      await prisma.chatbotSession.update({
        where: { id: sessionId },
        data: { leadId: lead.id },
      });
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
