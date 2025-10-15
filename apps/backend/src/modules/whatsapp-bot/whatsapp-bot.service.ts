/**
 * WhatsApp Bot Service
 *
 * Gerencia conversas automatizadas do bot WhatsApp que dá continuidade
 * à conversa iniciada no chat web.
 *
 * Fluxo:
 * 1. Lead solicita "Falar com equipe" no chat web
 * 2. Lead é criado com status "ATENDIMENTO_HUMANO"
 * 3. Sistema dispara bot WhatsApp automaticamente
 * 4. Bot envia materiais e responde dúvidas
 * 5. Bot transfere para atendente humano
 */

import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import whatsappService from '../../services/whatsappService';
import {
  getWhatsAppBotStepById,
  getNextWhatsAppBotStep,
  type WhatsAppBotStep,
} from './conversationFlowWhatsApp';
import { findBestFAQ } from '../chatbot/conversationFlowV3';

interface BotContext {
  leadId: string;
  leadName: string;
  leadPhone: string;
  interesse: string;
  companyName: string;
  companyPhone: string;
  companyAddress: string;
  companyWebsite: string;
  workingHours: string;
  [key: string]: any;
}

export class WhatsAppBotService {
  /**
   * Inicia conversa do bot automaticamente para um lead
   * Chamado quando lead é criado com status ATENDIMENTO_HUMANO
   */
  async startBotConversation(leadId: string): Promise<void> {
    try {
      logger.info(`🤖 Iniciando bot WhatsApp para lead ${leadId}`);

      // Buscar dados do lead
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
      });

      if (!lead) {
        logger.error(`Lead ${leadId} não encontrado`);
        return;
      }

      // Parse metadata
      const metadata = JSON.parse(lead.metadata || '{}');

      // Buscar configuração da empresa
      const chatbotConfig = await prisma.chatbotConfig.findFirst();
      if (!chatbotConfig) {
        logger.error('ChatbotConfig não encontrado');
        return;
      }

      // Criar ou buscar sessão do bot WhatsApp
      let botSession = await prisma.whatsAppBotSession.findFirst({
        where: { leadId, isActive: true },
      });

      if (!botSession) {
        botSession = await prisma.whatsAppBotSession.create({
          data: {
            leadId,
            phone: lead.phone,
            currentStepId: 'initial_context',
            contextData: JSON.stringify({
              leadName: lead.name,
              interesse: metadata.interest || 'nossos produtos',
              companyName: chatbotConfig.companyName,
              companyPhone: chatbotConfig.companyPhone,
              companyAddress: chatbotConfig.companyAddress,
              companyWebsite: chatbotConfig.companyWebsite,
              workingHours: chatbotConfig.workingHours,
            }),
            isActive: true,
          },
        });

        logger.info(`✅ Sessão do bot criada: ${botSession.id}`);
      }

      // Enviar mensagem inicial
      await this.sendBotMessage(botSession.id);

    } catch (error) {
      logger.error(`❌ Erro ao iniciar bot WhatsApp para lead ${leadId}:`, error);
    }
  }

  /**
   * Processa mensagem recebida do usuário no WhatsApp
   */
  async processUserMessage(phone: string, message: string): Promise<void> {
    try {
      // Normalizar número de telefone
      const normalizedPhone = this.normalizePhone(phone);

      // Buscar sessão ativa do bot para este número
      const botSession = await prisma.whatsAppBotSession.findFirst({
        where: {
          phone: normalizedPhone,
          isActive: true,
          handedOffToHuman: false, // Só processar se ainda não foi transferido para humano
        },
      });

      if (!botSession) {
        // Não há sessão de bot ativa, mensagem vai para atendimento humano normal
        logger.info(`Sem sessão de bot ativa para ${normalizedPhone}, indo para atendimento humano`);
        return;
      }

      logger.info(`📩 Processando mensagem do bot: ${phone} -> "${message}"`);

      // Parse contexto
      const context: BotContext = JSON.parse(botSession.contextData || '{}');
      context.leadId = botSession.leadId;
      context.leadPhone = botSession.phone;

      // Salvar mensagem do usuário
      await prisma.whatsAppBotMessage.create({
        data: {
          botSessionId: botSession.id,
          sender: 'user',
          content: message,
        },
      });

      // Determinar próximo step baseado na resposta
      const currentStepId = botSession.currentStepId;
      let nextStepId = getNextWhatsAppBotStep(currentStepId, message, context);

      // Se o step atual exige captura de input (ex: perguntas FAQ)
      const currentStep = getWhatsAppBotStepById(currentStepId);
      if (currentStep?.captureInput && currentStep.captureInput.type === 'text') {
        // Processar input capturado (ex: buscar FAQ)
        await this.processTextInput(botSession.id, message, context);
        return; // processTextInput já envia próxima mensagem
      }

      // Se não encontrou próximo step, tentar match inteligente
      if (!nextStepId) {
        nextStepId = this.intelligentMatch(message, currentStepId);
      }

      // Se ainda não encontrou, manter no mesmo step e pedir clarificação
      if (!nextStepId) {
        await this.sendClarificationMessage(botSession.phone, currentStep);
        return;
      }

      // Atualizar sessão com próximo step
      await prisma.whatsAppBotSession.update({
        where: { id: botSession.id },
        data: {
          currentStepId: nextStepId,
          contextData: JSON.stringify(context),
        },
      });

      // Enviar mensagem do próximo step
      await this.sendBotMessage(botSession.id);

    } catch (error) {
      logger.error('❌ Erro ao processar mensagem do usuário:', error);
    }
  }

  /**
   * Envia mensagem do bot baseado no step atual
   */
  private async sendBotMessage(botSessionId: string): Promise<void> {
    try {
      const botSession = await prisma.whatsAppBotSession.findUnique({
        where: { id: botSessionId },
      });

      if (!botSession) {
        logger.error(`Sessão ${botSessionId} não encontrada`);
        return;
      }

      const step = getWhatsAppBotStepById(botSession.currentStepId);
      if (!step) {
        logger.error(`Step ${botSession.currentStepId} não encontrado`);
        return;
      }

      const context: BotContext = JSON.parse(botSession.contextData || '{}');

      // Gerar mensagem
      let messageText: string;
      if (typeof step.botMessage === 'function') {
        messageText = step.botMessage(context);
      } else {
        messageText = step.botMessage;
      }

      // Substituir variáveis
      messageText = this.replaceVariables(messageText, context);

      // Executar ações antes de enviar mensagem (se houver)
      if (step.actions) {
        await this.executeActions(step.actions, botSession, context);
      }

      // Enviar mensagem
      await whatsappService.sendTextMessage(botSession.phone, messageText);

      // Salvar mensagem do bot
      await prisma.whatsAppBotMessage.create({
        data: {
          botSessionId: botSession.id,
          sender: 'bot',
          content: messageText,
        },
      });

      logger.info(`✅ Mensagem enviada para ${botSession.phone}: "${messageText.substring(0, 50)}..."`);

      // Se o step tem opções, enviar como botões/lista
      if (step.options && step.options.length > 0) {
        const optionsText = step.options
          .map(opt => opt.label)
          .join('\n');

        await whatsappService.sendTextMessage(
          botSession.phone,
          optionsText
        );
      }

      // Se step não aguarda resposta, avançar automaticamente
      if (step.awaitResponse === false && !step.actions?.some(a => a.type === 'handoff_to_human')) {
        // Delay de 2 segundos para parecer mais humano
        setTimeout(async () => {
          const nextStep = this.getAutomaticNextStep(step);
          if (nextStep) {
            await prisma.whatsAppBotSession.update({
              where: { id: botSessionId },
              data: { currentStepId: nextStep },
            });
            await this.sendBotMessage(botSessionId);
          }
        }, 2000);
      }

    } catch (error) {
      logger.error('❌ Erro ao enviar mensagem do bot:', error);
    }
  }

  /**
   * Processa input de texto capturado (ex: perguntas FAQ)
   */
  private async processTextInput(
    botSessionId: string,
    userInput: string,
    context: BotContext
  ): Promise<void> {
    try {
      const botSession = await prisma.whatsAppBotSession.findUnique({
        where: { id: botSessionId },
      });

      if (!botSession) return;

      const currentStep = getWhatsAppBotStepById(botSession.currentStepId);
      if (!currentStep || !currentStep.captureInput) return;

      // Se é pergunta FAQ, buscar resposta
      if (botSession.currentStepId === 'handle_question') {
        const chatbotConfig = await prisma.chatbotConfig.findFirst();
        const faqs = JSON.parse(chatbotConfig?.faqs || '[]');

        const bestFAQ = findBestFAQ(userInput, faqs);

        // Atualizar contexto
        context.faqAnswer = bestFAQ ? `**${bestFAQ.question}**\n\n${bestFAQ.answer}` : '';
        context.foundAnswer = !!bestFAQ;

        // Ir para step de resposta
        await prisma.whatsAppBotSession.update({
          where: { id: botSessionId },
          data: {
            currentStepId: 'answer_question',
            contextData: JSON.stringify(context),
          },
        });

        await this.sendBotMessage(botSessionId);
      }

    } catch (error) {
      logger.error('Erro ao processar texto capturado:', error);
    }
  }

  /**
   * Executa ações do step (envio de mídia, handoff, etc)
   */
  private async executeActions(
    actions: any[],
    botSession: any,
    context: BotContext
  ): Promise<void> {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'send_product_materials':
            await this.sendProductMaterials(botSession, context);
            break;

          case 'send_media':
            if (action.data?.type === 'location') {
              await this.sendLocation(botSession);
            }
            break;

          case 'handoff_to_human':
            await this.handoffToHuman(botSession);
            break;

          case 'schedule_followup':
            await this.scheduleFollowup(botSession, action.data);
            break;
        }
      } catch (error) {
        logger.error(`Erro ao executar ação ${action.type}:`, error);
      }
    }
  }

  /**
   * Envia materiais do produto (PDFs, imagens, vídeos, preços)
   */
  private async sendProductMaterials(botSession: any, context: BotContext): Promise<void> {
    try {
      logger.info(`📦 Enviando materiais do produto para ${botSession.phone}`);

      // Buscar produto de interesse
      const chatbotConfig = await prisma.chatbotConfig.findFirst();
      const products = JSON.parse(chatbotConfig?.products || '[]');

      // Encontrar produto de interesse baseado no contexto
      let product = products.find((p: any) =>
        context.interesse && p.name.toLowerCase().includes(context.interesse.toLowerCase())
      );

      // Se não encontrou, pegar primeiro produto
      if (!product && products.length > 0) {
        product = products[0];
      }

      if (!product) {
        logger.warn('Nenhum produto cadastrado');
        await whatsappService.sendTextMessage(
          botSession.phone,
          '📦 Nossos produtos estão sendo atualizados. Um especialista vai te enviar os materiais em breve!'
        );
        return;
      }

      logger.info(`📦 Enviando materiais do produto: ${product.name}`);

      // 1. Enviar descrição do produto
      const descriptionMessage = `📦 **${product.name}**\n\n${product.description || 'Produto de alta qualidade'}`;
      await whatsappService.sendTextMessage(botSession.phone, descriptionMessage);
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 2. Enviar imagens (se houver)
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        logger.info(`📸 Enviando ${product.images.length} imagens`);

        for (const imageUrl of product.images.slice(0, 3)) { // Máximo 3 imagens
          try {
            await whatsappService.sendImage(
              botSession.phone,
              imageUrl,
              product.name
            );
            logger.info(`✅ Imagem enviada: ${imageUrl}`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Delay entre envios
          } catch (error) {
            logger.error(`❌ Erro ao enviar imagem ${imageUrl}:`, error);
          }
        }
      }

      // 3. Enviar características/benefícios
      if (product.features && Array.isArray(product.features) && product.features.length > 0) {
        const featuresMessage = `✅ **Características:**\n\n${product.features.map((f: string) => `• ${f}`).join('\n')}`;
        await whatsappService.sendTextMessage(botSession.phone, featuresMessage);
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // 4. Enviar preço (se disponível)
      if (product.price) {
        const priceMessage = `💰 **Valor:** ${product.price}\n\n_Condições especiais disponíveis. Consulte nosso time!_`;
        await whatsappService.sendTextMessage(botSession.phone, priceMessage);
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // 5. Enviar PDF/documentos (se houver)
      if (product.pdfUrl) {
        try {
          // Nota: WPPConnect tem sendFile para documentos
          logger.info(`📄 PDF disponível: ${product.pdfUrl}`);
          // await whatsappService.sendFile(botSession.phone, product.pdfUrl, 'document', `${product.name}.pdf`);
          // Por enquanto, enviar como mensagem de texto com link
          await whatsappService.sendTextMessage(
            botSession.phone,
            `📄 Catálogo completo: ${product.pdfUrl}`
          );
        } catch (error) {
          logger.error('Erro ao enviar PDF:', error);
        }
      }

      // 6. Enviar vídeo (se houver)
      if (product.videoUrl) {
        try {
          await whatsappService.sendVideo(
            botSession.phone,
            product.videoUrl,
            `🎥 Veja ${product.name} em ação!`
          );
          logger.info(`✅ Vídeo enviado: ${product.videoUrl}`);
        } catch (error) {
          logger.error('Erro ao enviar vídeo:', error);
        }
      }

      logger.info('✅ Materiais enviados com sucesso');

    } catch (error) {
      logger.error('❌ Erro ao enviar materiais:', error);
      // Enviar mensagem de erro amigável
      await whatsappService.sendTextMessage(
        botSession.phone,
        'Ops, tive um problema ao enviar os materiais. Vou te conectar com a equipe! 👨‍💼'
      );
    }
  }

  /**
   * Envia localização GPS da loja
   */
  private async sendLocation(botSession: any): Promise<void> {
    try {
      const chatbotConfig = await prisma.chatbotConfig.findFirst();

      if (!chatbotConfig?.companyAddress) {
        logger.warn('Endereço não configurado');
        await whatsappService.sendTextMessage(
          botSession.phone,
          `📍 Entre em contato conosco:\n\n${chatbotConfig?.companyPhone || 'Telefone não disponível'}`
        );
        return;
      }

      // Enviar endereço como texto
      const locationMessage = `📍 **Nosso endereço:**\n\n${chatbotConfig.companyAddress}\n\n📞 ${chatbotConfig.companyPhone || ''}`;
      await whatsappService.sendTextMessage(botSession.phone, locationMessage);

      // TODO: Se tiver coordenadas GPS configuradas, pode enviar localização real:
      // const latitude = chatbotConfig.latitude || '-23.5505';
      // const longitude = chatbotConfig.longitude || '-46.6333';
      // await whatsappService.sendLocation(botSession.phone, latitude, longitude);

      logger.info(`📍 Localização enviada para ${botSession.phone}`);

    } catch (error) {
      logger.error('Erro ao enviar localização:', error);
    }
  }

  /**
   * Transfere conversa para atendente humano
   */
  private async handoffToHuman(botSession: any): Promise<void> {
    try {
      logger.info(`👨‍💼 Transferindo ${botSession.phone} para atendimento humano`);

      // Atualizar sessão
      await prisma.whatsAppBotSession.update({
        where: { id: botSession.id },
        data: {
          handedOffToHuman: true,
          handoffAt: new Date(),
        },
      });

      // Atualizar lead
      await prisma.lead.update({
        where: { id: botSession.leadId },
        data: {
          status: 'EM_ATENDIMENTO',
        },
      });

      // TODO: Notificar equipe de atendimento
      logger.info(`✅ Lead ${botSession.leadId} transferido para atendimento humano`);

    } catch (error) {
      logger.error('Erro ao fazer handoff:', error);
    }
  }

  /**
   * Agenda follow-up
   */
  private async scheduleFollowup(botSession: any, data: any): Promise<void> {
    try {
      const delay = data?.delay || '1day';
      // TODO: Implementar agendamento com sistema de tarefas
      logger.info(`📅 Follow-up agendado para ${botSession.phone} em ${delay}`);
    } catch (error) {
      logger.error('Erro ao agendar follow-up:', error);
    }
  }

  /**
   * Envia mensagem de clarificação quando não entende resposta
   */
  private async sendClarificationMessage(phone: string, currentStep: WhatsAppBotStep | undefined): Promise<void> {
    const message = `Desculpa, não entendi sua resposta. 🤔\n\nPode escolher uma das opções acima ou digitar sua dúvida?`;
    await whatsappService.sendTextMessage(phone, message);
  }

  /**
   * Match inteligente de mensagens do usuário
   */
  private intelligentMatch(message: string, currentStepId: string): string | null {
    const lowerMessage = message.toLowerCase();

    // Keywords para handoff
    if (lowerMessage.includes('atendente') ||
        lowerMessage.includes('humano') ||
        lowerMessage.includes('pessoa') ||
        lowerMessage.includes('vendedor')) {
      return 'handoff_to_sales';
    }

    // Keywords para preço
    if (lowerMessage.includes('preço') ||
        lowerMessage.includes('valor') ||
        lowerMessage.includes('quanto custa')) {
      return 'talk_pricing';
    }

    // Keywords para localização
    if (lowerMessage.includes('endereço') ||
        lowerMessage.includes('onde fica') ||
        lowerMessage.includes('localização')) {
      return 'store_location';
    }

    return null;
  }

  /**
   * Substitui variáveis no texto
   */
  private replaceVariables(text: string, context: BotContext): string {
    let result = text;

    Object.keys(context).forEach(key => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, context[key] || '');
    });

    return result;
  }

  /**
   * Obtém próximo step automático (quando não aguarda resposta)
   */
  private getAutomaticNextStep(step: WhatsAppBotStep): string | null {
    // Se o step tem só uma opção ou ação específica, seguir para ela
    if (step.id === 'send_materials') {
      return 'after_materials';
    }

    return null;
  }

  /**
   * Normaliza número de telefone
   */
  private normalizePhone(phone: string): string {
    // Remove caracteres não numéricos
    let normalized = phone.replace(/\D/g, '');

    // Remove prefixo do WhatsApp se houver (@c.us)
    normalized = normalized.replace(/@c\.us$/, '');

    // Garantir que tem código do país (55 para Brasil)
    if (!normalized.startsWith('55') && normalized.length === 11) {
      normalized = '55' + normalized;
    }

    return normalized;
  }
}

// Exportar instância singleton
export const whatsappBotService = new WhatsAppBotService();
export default whatsappBotService;
