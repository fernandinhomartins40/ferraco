/**
 * WhatsApp Direct Notification Service
 *
 * Serviço para enviar notificações diretas via WhatsApp quando
 * a landing page está configurada no modo "whatsapp_only".
 *
 * Ao invés de criar um lead e automação, envia imediatamente
 * uma mensagem WhatsApp com os dados do lead capturado.
 */

import { whatsappWebJSService } from './whatsappWebJS.service';
import { logger } from '../utils/logger';
import type { PublicCreateLeadInput } from '../modules/leads/public-leads.controller';

export interface LandingPageLeadSettings {
  mode: 'create_lead' | 'whatsapp_only';
  whatsappNumber?: string;
  messageTemplate?: string;
  createLeadAnyway?: boolean; // Se true, cria lead silenciosamente mesmo no modo whatsapp_only
}

export class WhatsAppDirectNotificationService {
  /**
   * Envia notificação WhatsApp direta com os dados do lead
   * @param leadData - Dados do lead capturado
   * @param config - Configurações do sistema
   * @returns Promise<boolean> - true se enviado com sucesso
   */
  async sendLeadNotification(
    leadData: PublicCreateLeadInput,
    config: LandingPageLeadSettings
  ): Promise<boolean> {
    try {
      // Validar configuração
      if (!config.whatsappNumber || !config.messageTemplate) {
        logger.error('❌ Configuração de WhatsApp incompleta para envio direto', {
          hasNumber: !!config.whatsappNumber,
          hasTemplate: !!config.messageTemplate,
        });
        return false;
      }

      // Formatar número (remover espaços, parênteses, etc.)
      const formattedNumber = this.formatWhatsAppNumber(config.whatsappNumber);

      if (!formattedNumber) {
        logger.error('❌ Número de WhatsApp inválido', {
          original: config.whatsappNumber,
        });
        return false;
      }

      // Formatar mensagem substituindo variáveis
      const message = this.formatMessage(leadData, config.messageTemplate);

      logger.info('📤 Enviando notificação WhatsApp direta', {
        to: formattedNumber,
        leadName: leadData.name,
        source: leadData.source,
        interest: leadData.interest,
      });

      // Enviar mensagem via WhatsApp
      await whatsappWebJSService.sendMessage(formattedNumber, message);

      logger.info('✅ Notificação WhatsApp enviada com sucesso', {
        to: formattedNumber,
        leadName: leadData.name,
      });

      return true;
    } catch (error: any) {
      logger.error('❌ Erro ao enviar notificação WhatsApp direta', {
        error: error.message,
        stack: error.stack,
        leadData,
      });
      return false;
    }
  }

  /**
   * Formata mensagem substituindo variáveis pelos dados do lead
   * @param data - Dados do lead
   * @param template - Template da mensagem
   * @returns Mensagem formatada
   */
  private formatMessage(data: PublicCreateLeadInput, template: string): string {
    const timestamp = new Date().toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });

    // Converter interest para string se for array
    const interestStr = data.interest
      ? (Array.isArray(data.interest) ? data.interest.join(', ') : data.interest)
      : 'Não especificado';

    return template
      .replace(/\{\{name\}\}/g, data.name)
      .replace(/\{\{phone\}\}/g, data.phone)
      .replace(/\{\{email\}\}/g, data.email || 'Não informado')
      .replace(/\{\{interest\}\}/g, interestStr)
      .replace(/\{\{source\}\}/g, this.formatSource(data.source))
      .replace(/\{\{timestamp\}\}/g, timestamp);
  }

  /**
   * Formata a fonte (source) para exibição amigável
   * @param source - Source do lead
   * @returns Source formatado
   */
  private formatSource(source: string = 'landing-page'): string {
    const sourceMap: Record<string, string> = {
      'landing-page': 'Landing Page',
      'modal-orcamento': 'Modal de Orçamento',
      'chatbot-web': 'Chatbot Web',
      'whatsapp-bot': 'WhatsApp Bot',
    };

    // Verificar se é modal de produto
    if (source.startsWith('modal-produto-')) {
      const productId = source.replace('modal-produto-', '');
      return `Modal de Produto (${productId})`;
    }

    return sourceMap[source] || source;
  }

  /**
   * Formata número de WhatsApp removendo caracteres especiais
   * e garantindo que tenha o código do país
   * @param number - Número original
   * @returns Número formatado ou null se inválido
   */
  private formatWhatsAppNumber(number: string): string | null {
    // Remover todos os caracteres não numéricos exceto +
    let cleaned = number.replace(/[^\d+]/g, '');

    // Se não começa com +, adicionar +55 (Brasil)
    if (!cleaned.startsWith('+')) {
      cleaned = `+55${cleaned}`;
    }

    // Validar formato básico (deve ter ao menos 12 caracteres: +55 + DDD + número)
    if (cleaned.length < 12) {
      return null;
    }

    return cleaned;
  }

  /**
   * Testa o envio de mensagem WhatsApp
   * @param config - Configurações do sistema
   * @returns Promise<boolean> - true se teste passou
   */
  async testWhatsAppConnection(config: LandingPageLeadSettings): Promise<boolean> {
    try {
      if (!config.whatsappNumber) {
        throw new Error('Número de WhatsApp não configurado');
      }

      const testMessage = `🧪 *Teste de Configuração*\n\nSistema de notificação de leads da landing page está funcionando corretamente!\n\n✅ Configuração validada em ${new Date().toLocaleString('pt-BR')}`;

      const formattedNumber = this.formatWhatsAppNumber(config.whatsappNumber);

      if (!formattedNumber) {
        throw new Error('Número de WhatsApp inválido');
      }

      await whatsappWebJSService.sendMessage(formattedNumber, testMessage);

      logger.info('✅ Teste de WhatsApp realizado com sucesso', {
        to: formattedNumber,
      });

      return true;
    } catch (error: any) {
      logger.error('❌ Falha no teste de WhatsApp', {
        error: error.message,
      });
      return false;
    }
  }
}

// Export singleton instance
export const whatsappDirectNotificationService = new WhatsAppDirectNotificationService();
