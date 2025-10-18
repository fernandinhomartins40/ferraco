/**
 * WhatsApp Automation Service
 *
 * Serviço responsável por automatizar o envio de informações de produtos
 * via WhatsApp após a captação de leads pelo chatbot.
 */

import { prisma } from '../config/database';
import { whatsappService } from './whatsappService';
import { logger } from '../utils/logger';

export class WhatsAppAutomationService {

  /**
   * Cria automação WhatsApp a partir de um lead capturado
   * Extrai produtos de interesse do metadata do lead
   */
  async createAutomationFromLead(leadId: string): Promise<void> {
    try {
      // Buscar lead
      const lead = await prisma.lead.findUnique({
        where: { id: leadId }
      });

      if (!lead) {
        logger.warn(`⚠️  Lead ${leadId} não encontrado`);
        return;
      }

      // Extrair interesse do metadata
      const metadata = JSON.parse(lead.metadata || '{}');
      const interest = metadata.interest;

      if (!interest) {
        logger.info(`ℹ️  Lead ${leadId} (${lead.name}) não manifestou interesse em produtos`);
        return;
      }

      // Buscar configuração do chatbot para validar produtos
      const config = await prisma.chatbotConfig.findFirst();
      if (!config) {
        logger.error('❌ Chatbot config não encontrado');
        return;
      }

      const allProducts = JSON.parse(config.products || '[]');

      // Interest pode ser "Bebedouro" ou múltiplos separados por vírgula
      const productNames = interest.split(',').map((p: string) => p.trim());

      // Validar que produtos existem na configuração
      const validProducts = productNames.filter((name: string) =>
        allProducts.some((p: any) =>
          p.name === name || p.id === name.toLowerCase()
        )
      );

      if (validProducts.length === 0) {
        logger.warn(`⚠️  Lead ${leadId}: nenhum produto válido encontrado em "${interest}"`);
        return;
      }

      // Calcular total de mensagens que serão enviadas
      let totalMessages = 2; // Mensagem inicial + mensagem final

      for (const productName of validProducts) {
        const product = allProducts.find((p: any) =>
          p.name === productName || p.id === productName.toLowerCase()
        );

        if (product) {
          totalMessages += 1; // Texto descritivo do produto
          totalMessages += (product.images?.length || 0);
          totalMessages += (product.videos?.length || 0);
          if (product.specifications && Object.keys(product.specifications).length > 0) {
            totalMessages += 1; // Especificações técnicas
          }
        }
      }

      // Criar automação no banco
      const automation = await prisma.whatsAppAutomation.create({
        data: {
          leadId,
          status: 'PENDING',
          productsToSend: JSON.stringify(validProducts),
          messagesTotal: totalMessages,
          scheduledFor: null // Envio imediato
        }
      });

      logger.info(`✅ Automação ${automation.id} criada para lead ${leadId} (${lead.name})`);
      logger.info(`   Produtos: ${validProducts.join(', ')} (${totalMessages} mensagens)`);

      // Executar automação em background (não bloquear)
      this.executeAutomation(automation.id).catch(err => {
        logger.error(`❌ Erro ao executar automação ${automation.id}:`, err);
      });

    } catch (error) {
      logger.error('❌ Erro ao criar automação WhatsApp:', error);
    }
  }

  /**
   * Executa uma automação de envio WhatsApp
   */
  async executeAutomation(automationId: string): Promise<void> {
    const automation = await prisma.whatsAppAutomation.findUnique({
      where: { id: automationId },
      include: { lead: true }
    });

    if (!automation) {
      logger.error(`❌ Automação ${automationId} não encontrada`);
      return;
    }

    // Marcar como processando
    await prisma.whatsAppAutomation.update({
      where: { id: automationId },
      data: {
        status: 'PROCESSING',
        startedAt: new Date()
      }
    });

    const lead = automation.lead;
    const phone = lead.phone;

    logger.info(`🚀 Iniciando automação ${automationId} para ${lead.name} (${phone})`);

    try {
      // Buscar configuração e produtos
      const config = await prisma.chatbotConfig.findFirst();
      if (!config) throw new Error('Chatbot config não encontrado');

      const allProducts = JSON.parse(config.products || '[]');
      const productNames = JSON.parse(automation.productsToSend);

      let order = 1;

      // 1. MENSAGEM INICIAL
      await this.sendText(
        automationId,
        phone,
        `Olá ${lead.name}! 👋\n\nConforme nossa conversa no site, seguem mais informações sobre o(s) produto(s) de seu interesse.`,
        order++
      );

      await this.delay(2000);

      // 2. PARA CADA PRODUTO
      for (const productName of productNames) {
        const product = allProducts.find((p: any) =>
          p.name === productName || p.id === productName.toLowerCase()
        );

        if (!product) {
          logger.warn(`⚠️  Produto "${productName}" não encontrado na configuração`);
          continue;
        }

        logger.info(`   📦 Enviando produto: ${product.name}`);

        // 2.1 Descrição do produto
        const description = product.detailedDescription || product.description;
        await this.sendText(
          automationId,
          phone,
          `📦 *${product.name}*\n\n${description}`,
          order++
        );
        await this.delay(2000);

        // 2.2 Imagens
        if (product.images && product.images.length > 0) {
          logger.info(`   🖼️  Enviando ${product.images.length} imagem(ns)`);
          for (const imageUrl of product.images) {
            await this.sendImage(automationId, phone, imageUrl, order++);
            await this.delay(3000);
          }
        }

        // 2.3 Vídeos
        if (product.videos && product.videos.length > 0) {
          logger.info(`   🎥 Enviando ${product.videos.length} vídeo(s)`);
          for (const videoUrl of product.videos) {
            await this.sendVideo(automationId, phone, videoUrl, order++);
            await this.delay(4000);
          }
        }

        // 2.4 Especificações técnicas
        if (product.specifications && Object.keys(product.specifications).length > 0) {
          const specs = Object.entries(product.specifications)
            .map(([key, value]) => `• *${key}:* ${value}`)
            .join('\n');

          await this.sendText(
            automationId,
            phone,
            `📋 *Especificações Técnicas:*\n\n${specs}`,
            order++
          );
          await this.delay(2000);
        }
      }

      // 3. MENSAGEM FINAL
      const companyPhone = config.companyPhone || '';
      const finalMessage = productNames.length > 1
        ? 'os produtos'
        : 'o produto';

      await this.sendText(
        automationId,
        phone,
        `✅ Essas são as informações sobre ${finalMessage} de seu interesse!\n\n👨‍💼 Um vendedor da Ferraco entrará em contato em breve para esclarecer dúvidas e auxiliar na sua compra.\n\n${companyPhone ? `📞 Caso prefira, você pode nos ligar: ${companyPhone}` : ''}`,
        order++
      );

      // Marcar como concluído
      await prisma.whatsAppAutomation.update({
        where: { id: automationId },
        data: {
          status: 'SENT',
          completedAt: new Date()
        }
      });

      logger.info(`✅ Automação ${automationId} concluída com sucesso!`);

    } catch (error: any) {
      logger.error(`❌ Erro ao executar automação ${automationId}:`, error);

      await prisma.whatsAppAutomation.update({
        where: { id: automationId },
        data: {
          status: 'FAILED',
          error: error.message
        }
      });

      throw error;
    }
  }

  /**
   * Envia mensagem de texto
   */
  private async sendText(
    automationId: string,
    phone: string,
    content: string,
    order: number
  ): Promise<void> {
    try {
      const result = await whatsappService.sendTextMessage(phone, content);

      await prisma.whatsAppAutomationMessage.create({
        data: {
          automationId,
          messageType: 'TEXT',
          content,
          status: 'SENT',
          whatsappMessageId: result?.id || undefined,
          order,
          sentAt: new Date()
        }
      });

      await this.incrementMessageCount(automationId);

    } catch (error) {
      logger.error(`❌ Erro ao enviar texto (ordem ${order}):`, error);
      throw error;
    }
  }

  /**
   * Envia imagem
   */
  private async sendImage(
    automationId: string,
    phone: string,
    imageUrl: string,
    order: number
  ): Promise<void> {
    try {
      const msgId = await whatsappService.sendImage(phone, imageUrl);

      await prisma.whatsAppAutomationMessage.create({
        data: {
          automationId,
          messageType: 'IMAGE',
          mediaUrl: imageUrl,
          status: 'SENT',
          whatsappMessageId: msgId || undefined,
          order,
          sentAt: new Date()
        }
      });

      await this.incrementMessageCount(automationId);

    } catch (error) {
      logger.error(`❌ Erro ao enviar imagem (ordem ${order}):`, error);
      throw error;
    }
  }

  /**
   * Envia vídeo
   */
  private async sendVideo(
    automationId: string,
    phone: string,
    videoUrl: string,
    order: number
  ): Promise<void> {
    try {
      const msgId = await whatsappService.sendVideo(phone, videoUrl);

      await prisma.whatsAppAutomationMessage.create({
        data: {
          automationId,
          messageType: 'VIDEO',
          mediaUrl: videoUrl,
          status: 'SENT',
          whatsappMessageId: msgId || undefined,
          order,
          sentAt: new Date()
        }
      });

      await this.incrementMessageCount(automationId);

    } catch (error) {
      logger.error(`❌ Erro ao enviar vídeo (ordem ${order}):`, error);
      throw error;
    }
  }

  /**
   * Incrementa contador de mensagens enviadas
   */
  private async incrementMessageCount(automationId: string): Promise<void> {
    await prisma.whatsAppAutomation.update({
      where: { id: automationId },
      data: { messagesSent: { increment: 1 } }
    });
  }

  /**
   * Delay entre mensagens
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const whatsappAutomationService = new WhatsAppAutomationService();
