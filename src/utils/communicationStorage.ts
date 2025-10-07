import { Communication, MessageTemplate, WhatsAppConfig } from '@/types/lead';
import { BaseStorage, StorageItem } from '@/lib/BaseStorage';
import { logger } from '@/lib/logger';

interface CommunicationStorageItem extends StorageItem {
  type: Communication['type'];
  content: string;
  direction: Communication['direction'];
  status: Communication['status'];
  templateId?: string;
  metadata?: Record<string, unknown>;
  leadId: string;
  timestamp: string;
}

interface TemplateStorageItem extends StorageItem {
  name: string;
  type: MessageTemplate['type'];
  content: string;
  variables: string[];
  isActive: boolean;
  category?: string;
}

class TemplateStorage extends BaseStorage<TemplateStorageItem> {
  constructor() {
    super({ key: 'ferraco_message_templates', enableDebug: false });
  }
}

class CommunicationStorageClass extends BaseStorage<CommunicationStorageItem> {
  private templateStorage: TemplateStorage;
  private configKey = 'ferraco_whatsapp_config';

  constructor() {
    super({ key: 'ferraco_communications', enableDebug: false });
    this.templateStorage = new TemplateStorage();
    this.initializeDefaultTemplates();
  }

  // Communications management
  getCommunications(leadId?: string): Communication[] {
    if (leadId) {
      return this.filter(comm => comm.leadId === leadId);
    }
    return this.getAll();
  }

  saveCommunications(communications: (Communication & { leadId: string })[]): void {
    this.data = communications as CommunicationStorageItem[];
    this.save();
  }

  addCommunication(leadId: string, communication: Omit<Communication, 'id' | 'timestamp'>): Communication {
    return this.add({
      ...communication,
      leadId,
      timestamp: new Date().toISOString(),
    });
  }

  updateCommunicationStatus(communicationId: string, status: Communication['status']): boolean {
    return this.update(communicationId, { status }) !== null;
  }

  // Message Templates management
  getTemplates(type?: MessageTemplate['type']): MessageTemplate[] {
    const templates = this.templateStorage.getAll();
    if (type) {
      return templates.filter(template => template.type === type) as unknown as MessageTemplate[];
    }
    return templates as unknown as MessageTemplate[];
  }

  saveTemplates(templates: MessageTemplate[]): void {
    // Clear existing and add new templates
    const existingTemplates = this.templateStorage.getAll();
    existingTemplates.forEach(t => this.templateStorage.delete(t.id));
    templates.forEach(t => {
      this.templateStorage.add(t as TemplateStorageItem);
    });
  }

  getDefaultTemplates(): MessageTemplate[] {
    return [
      {
        id: 'template-welcome-whatsapp',
        name: 'Boas-vindas WhatsApp',
        type: 'whatsapp',
        content: 'Olá {{nome}}! 👋\n\nObrigado pelo seu interesse em nossos produtos da Ferraco!\n\nEm breve nossa equipe entrará em contato para apresentar as melhores soluções para sua propriedade.\n\nTem alguma dúvida específica que posso ajudar agora?',
        variables: ['nome'],
        isActive: true,
        createdAt: new Date().toISOString(),
        category: 'welcome',
      },
      {
        id: 'template-follow-up-whatsapp',
        name: 'Follow-up WhatsApp',
        type: 'whatsapp',
        content: 'Oi {{nome}}! 😊\n\nAinda tem interesse em conhecer melhor nossos equipamentos para gado?\n\nTemos algumas novidades que podem ser do seu interesse:\n• Bebedouros automáticos\n• Sistema de contenção\n• Canzis\n\nQue tal conversarmos?',
        variables: ['nome'],
        isActive: true,
        createdAt: new Date().toISOString(),
        category: 'follow_up',
      },
      {
        id: 'template-reminder-whatsapp',
        name: 'Lembrete WhatsApp',
        type: 'whatsapp',
        content: 'Oi {{nome}}! 📞\n\nEste é um lembrete sobre nossa conversa.\n\n{{motivo}}\n\nPodemos reagendar para outro horário que seja melhor para você?',
        variables: ['nome', 'motivo'],
        isActive: true,
        createdAt: new Date().toISOString(),
        category: 'reminder',
      },
      {
        id: 'template-promotional-whatsapp',
        name: 'Promoção WhatsApp',
        type: 'whatsapp',
        content: '🎉 OFERTA ESPECIAL FERRACO! 🎉\n\nOlá {{nome}}!\n\nTemos uma promoção exclusiva em equipamentos para gado:\n\n✅ {{produto}}\n💰 Desconto de {{desconto}}%\n⏰ Válido até {{validade}}\n\nNão perca essa oportunidade!\n\nInteressado? Responda este WhatsApp!',
        variables: ['nome', 'produto', 'desconto', 'validade'],
        isActive: true,
        createdAt: new Date().toISOString(),
        category: 'promotional',
      },
    ];
  }

  createTemplate(template: Omit<MessageTemplate, 'id' | 'createdAt'>): MessageTemplate {
    return this.templateStorage.add(template as TemplateStorageItem) as unknown as MessageTemplate;
  }

  updateTemplate(templateId: string, updates: Partial<MessageTemplate>): boolean {
    return this.templateStorage.update(templateId, updates) !== null;
  }

  deleteTemplate(templateId: string): boolean {
    return this.templateStorage.delete(templateId);
  }

  // WhatsApp Configuration
  getWhatsAppConfig(): WhatsAppConfig {
    try {
      const config = localStorage.getItem(this.configKey);
      return config ? JSON.parse(config) : { isEnabled: false, isConnected: false };
    } catch (error) {
      logger.error('Error reading WhatsApp config from localStorage:', error);
      return { isEnabled: false, isConnected: false };
    }
  }

  saveWhatsAppConfig(config: WhatsAppConfig): void {
    try {
      localStorage.setItem(this.configKey, JSON.stringify(config));
    } catch (error) {
      logger.error('Error saving WhatsApp config to localStorage:', error);
    }
  }

  // Template variable processing
  processTemplate(templateContent: string, variables: Record<string, string>): string {
    let processedContent = templateContent;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processedContent = processedContent.replace(regex, value);
    });

    return processedContent;
  }

  // Extract variables from template
  extractVariables(templateContent: string): string[] {
    const regex = /{{([^}]+)}}/g;
    const variables: string[] = [];
    let match;

    while ((match = regex.exec(templateContent)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    return variables;
  }

  // Send WhatsApp message (simulation)
  async sendWhatsAppMessage(
    phone: string,
    message: string,
    templateId?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const config = this.getWhatsAppConfig();

    if (!config.isEnabled || !config.isConnected) {
      return {
        success: false,
        error: 'WhatsApp não está configurado ou conectado',
      };
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    const success = Math.random() > 0.1;

    if (success) {
      return {
        success: true,
        messageId: `msg_${crypto.randomUUID()}`,
      };
    } else {
      return {
        success: false,
        error: 'Falha no envio da mensagem',
      };
    }
  }

  // Bulk message sending
  async sendBulkMessages(
    recipients: Array<{ leadId: string; phone: string; name: string }>,
    templateId: string,
    customVariables?: Record<string, string>
  ): Promise<Array<{ leadId: string; success: boolean; messageId?: string; error?: string }>> {
    const template = this.getTemplates().find(t => t.id === templateId);

    if (!template) {
      return recipients.map(recipient => ({
        leadId: recipient.leadId,
        success: false,
        error: 'Template não encontrado',
      }));
    }

    const results = [];

    for (const recipient of recipients) {
      const variables = {
        nome: recipient.name,
        ...customVariables,
      };

      const processedMessage = this.processTemplate(template.content, variables);
      const result = await this.sendWhatsAppMessage(recipient.phone, processedMessage, templateId);

      results.push({
        leadId: recipient.leadId,
        ...result,
      });

      this.addCommunication(recipient.leadId, {
        type: 'whatsapp',
        content: processedMessage,
        direction: 'outbound',
        status: result.success ? 'sent' : 'failed',
        templateId,
        metadata: { bulkSend: true, variables },
      });

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return results;
  }

  // Get communication statistics
  getCommunicationStats(leadId?: string): {
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    recentActivity: Communication[];
  } {
    const communications = this.getCommunications(leadId);

    const byType = communications.reduce((acc, comm) => {
      acc[comm.type] = (acc[comm.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byStatus = communications.reduce((acc, comm) => {
      acc[comm.status] = (acc[comm.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recentActivity = communications
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    return {
      total: communications.length,
      byType,
      byStatus,
      recentActivity,
    };
  }

  // Initialize default templates
  initializeDefaultTemplates(): void {
    if (this.templateStorage.count() === 0) {
      const defaultTemplates = this.getDefaultTemplates();
      defaultTemplates.forEach(template => {
        this.templateStorage.add(template as TemplateStorageItem);
      });
    }
  }
}

export const communicationStorage = new CommunicationStorageClass();
