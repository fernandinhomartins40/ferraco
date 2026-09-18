
import { logger } from '../../utils/logger';
// T-19 (F-01): usa o singleton em vez de instanciar um PrismaClient proprio.
import { prisma } from '../../config/database';

export interface ChatbotConfigData {
  // Behavior
  botName?: string;
  welcomeMessage?: string;
  tone?: string;
  captureLeads?: boolean;
  requireEmail?: boolean;
  requirePhone?: boolean;
  autoResponse?: boolean;

  // Company Data
  companyName?: string;
  companyDescription?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  workingHours?: string;

  // Products, FAQs, Links (JSON arrays)
  products?: any[];
  faqs?: any[];
  shareLinks?: any[];

  // WhatsApp Templates
  whatsappTemplates?: {
    initial?: string;
    product?: string;
    final?: string;
  };
}

export class ChatbotService {
  /**
   * Busca a configuração do chatbot (sempre retorna um registro)
   */
  async getConfig() {
    try {
      // Busca o primeiro registro ou cria um novo
      let config = await prisma.chatbotConfig.findFirst();

      if (!config) {
        // Cria configuração padrão
        config = await prisma.chatbotConfig.create({
          data: {
            botName: 'Ferraco Bot',
            welcomeMessage:
              'Olá! 👋 Bem-vindo ao chat da Ferraco!\n\nSou o assistente virtual e estou aqui para ajudá-lo.',
            tone: 'friendly',
            companyName: 'Ferraco Equipamentos',
            companyDescription: 'Empresa especializada em equipamentos para pecuária leiteira',
            products: JSON.stringify([]),
            faqs: JSON.stringify([]),
            shareLinks: JSON.stringify([]),
            whatsappTemplates: JSON.stringify({}),
          },
        });
        logger.info('✅ Configuração padrão do chatbot criada');
      }

      // Helper para fazer parse seguro de JSON
      const safeJsonParse = (jsonString: string | null, defaultValue: any = []) => {
        if (!jsonString) return defaultValue;
        try {
          return JSON.parse(jsonString);
        } catch (error) {
          logger.warn(`Failed to parse JSON: ${jsonString}`, error);
          return defaultValue;
        }
      };

      // Parse JSON fields
      return {
        id: config.id,
        isEnabled: config.isEnabled,
        behavior: {
          name: config.botName,
          greeting: config.welcomeMessage,
          tone: config.tone,
          captureLeads: config.captureLeads,
          requireEmail: config.requireEmail,
          requirePhone: config.requirePhone,
          autoResponse: config.autoResponse,
        },
        companyData: {
          name: config.companyName,
          description: config.companyDescription,
          address: config.companyAddress || '',
          phone: config.companyPhone || '',
          email: config.companyEmail || '',
          website: config.companyWebsite || '',
          workingHours: config.workingHours || '',
        },
        products: safeJsonParse(config.products, []),
        faqs: safeJsonParse(config.faqs, []),
        shareLinks: safeJsonParse(config.shareLinks, []),
        whatsappTemplates: safeJsonParse(config.whatsappTemplates, {}),
        updatedAt: config.updatedAt,
      };
    } catch (error) {
      logger.error('Error in getConfig:', error);
      throw error;
    }
  }

  /**
   * Atualiza a configuração do chatbot
   */
  async updateConfig(data: ChatbotConfigData) {
    try {
      // Busca configuração existente
      const existing = await prisma.chatbotConfig.findFirst();

      const configData = {
        botName: data.botName,
        welcomeMessage: data.welcomeMessage,
        tone: data.tone,
        captureLeads: data.captureLeads,
        requireEmail: data.requireEmail,
        requirePhone: data.requirePhone,
        autoResponse: data.autoResponse,
        companyName: data.companyName,
        companyDescription: data.companyDescription,
        companyAddress: data.companyAddress,
        companyPhone: data.companyPhone,
        companyEmail: data.companyEmail,
        companyWebsite: data.companyWebsite,
        workingHours: data.workingHours,
        products: JSON.stringify(data.products || []),
        faqs: JSON.stringify(data.faqs || []),
        shareLinks: JSON.stringify(data.shareLinks || []),
        whatsappTemplates: JSON.stringify(data.whatsappTemplates || {}),
      };

      let config;
      if (existing) {
        // Atualiza registro existente
        config = await prisma.chatbotConfig.update({
          where: { id: existing.id },
          data: configData,
        });
      } else {
        // Cria novo registro
        config = await prisma.chatbotConfig.create({
          data: {
            ...configData,
            welcomeMessage: configData.welcomeMessage || 'Olá! Como posso ajudar?',
            companyName: configData.companyName || 'Empresa',
            companyDescription: configData.companyDescription || 'Descrição da empresa',
          },
        });
      }

      logger.info('Chatbot config updated successfully', { id: config.id });

      // Helper para fazer parse seguro de JSON
      const safeJsonParse = (jsonString: string | null, defaultValue: any = []) => {
        if (!jsonString) return defaultValue;
        try {
          return JSON.parse(jsonString);
        } catch (error) {
          logger.warn(`Failed to parse JSON: ${jsonString}`, error);
          return defaultValue;
        }
      };

      // Retorna no mesmo formato do getConfig
      return {
        id: config.id,
        isEnabled: config.isEnabled,
        behavior: {
          name: config.botName,
          greeting: config.welcomeMessage,
          tone: config.tone,
          captureLeads: config.captureLeads,
          requireEmail: config.requireEmail,
          requirePhone: config.requirePhone,
          autoResponse: config.autoResponse,
        },
        companyData: {
          name: config.companyName,
          description: config.companyDescription,
          address: config.companyAddress || '',
          phone: config.companyPhone || '',
          email: config.companyEmail || '',
          website: config.companyWebsite || '',
          workingHours: config.workingHours || '',
        },
        products: safeJsonParse(config.products, []),
        faqs: safeJsonParse(config.faqs, []),
        shareLinks: safeJsonParse(config.shareLinks, []),
        whatsappTemplates: safeJsonParse(config.whatsappTemplates, {}),
        updatedAt: config.updatedAt,
      };
    } catch (error) {
      logger.error('Error in updateConfig:', error);
      throw error;
    }
  }
}
