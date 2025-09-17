import { Communication, MessageTemplate, WhatsAppConfig } from '@/types/lead';

const COMMUNICATIONS_STORAGE_KEY = 'ferraco_communications';
const TEMPLATES_STORAGE_KEY = 'ferraco_message_templates';
const WHATSAPP_CONFIG_KEY = 'ferraco_whatsapp_config';

export const communicationStorage = {
  // Communications management
  getCommunications(leadId?: string): Communication[] {
    try {
      const communications = localStorage.getItem(COMMUNICATIONS_STORAGE_KEY);
      const allComms = communications ? JSON.parse(communications) : [];

      if (leadId) {
        return allComms.filter((comm: Communication & { leadId: string }) => comm.leadId === leadId);
      }

      return allComms;
    } catch (error) {
      console.error('Error reading communications from localStorage:', error);
      return [];
    }
  },

  saveCommunications(communications: (Communication & { leadId: string })[]): void {
    try {
      localStorage.setItem(COMMUNICATIONS_STORAGE_KEY, JSON.stringify(communications));
    } catch (error) {
      console.error('Error saving communications to localStorage:', error);
    }
  },

  addCommunication(leadId: string, communication: Omit<Communication, 'id' | 'timestamp'>): Communication {
    const newCommunication: Communication & { leadId: string } = {
      ...communication,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      leadId,
    };

    const communications = this.getCommunications();
    communications.push(newCommunication);
    this.saveCommunications(communications);

    return newCommunication;
  },

  updateCommunicationStatus(communicationId: string, status: Communication['status']): boolean {
    const communications = this.getCommunications();
    const commIndex = communications.findIndex(comm => comm.id === communicationId);

    if (commIndex === -1) return false;

    communications[commIndex] = { ...communications[commIndex], status };
    this.saveCommunications(communications);
    return true;
  },

  // Message Templates management
  getTemplates(type?: MessageTemplate['type']): MessageTemplate[] {
    try {
      const templates = localStorage.getItem(TEMPLATES_STORAGE_KEY);
      const allTemplates = templates ? JSON.parse(templates) : this.getDefaultTemplates();

      if (type) {
        return allTemplates.filter((template: MessageTemplate) => template.type === type);
      }

      return allTemplates;
    } catch (error) {
      console.error('Error reading templates from localStorage:', error);
      return this.getDefaultTemplates();
    }
  },

  saveTemplates(templates: MessageTemplate[]): void {
    try {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
    } catch (error) {
      console.error('Error saving templates to localStorage:', error);
    }
  },

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
  },

  createTemplate(template: Omit<MessageTemplate, 'id' | 'createdAt'>): MessageTemplate {
    const newTemplate: MessageTemplate = {
      ...template,
      id: `template-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
    };

    const templates = this.getTemplates();
    templates.push(newTemplate);
    this.saveTemplates(templates);
    return newTemplate;
  },

  updateTemplate(templateId: string, updates: Partial<MessageTemplate>): boolean {
    const templates = this.getTemplates();
    const templateIndex = templates.findIndex(template => template.id === templateId);

    if (templateIndex === -1) return false;

    templates[templateIndex] = { ...templates[templateIndex], ...updates };
    this.saveTemplates(templates);
    return true;
  },

  deleteTemplate(templateId: string): boolean {
    const templates = this.getTemplates();
    const filteredTemplates = templates.filter(template => template.id !== templateId);

    if (filteredTemplates.length === templates.length) return false;

    this.saveTemplates(filteredTemplates);
    return true;
  },

  // WhatsApp Configuration
  getWhatsAppConfig(): WhatsAppConfig {
    try {
      const config = localStorage.getItem(WHATSAPP_CONFIG_KEY);
      return config ? JSON.parse(config) : {
        isEnabled: false,
        isConnected: false,
      };
    } catch (error) {
      console.error('Error reading WhatsApp config from localStorage:', error);
      return { isEnabled: false, isConnected: false };
    }
  },

  saveWhatsAppConfig(config: WhatsAppConfig): void {
    try {
      localStorage.setItem(WHATSAPP_CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Error saving WhatsApp config to localStorage:', error);
    }
  },

  // Template variable processing
  processTemplate(templateContent: string, variables: Record<string, string>): string {
    let processedContent = templateContent;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processedContent = processedContent.replace(regex, value);
    });

    return processedContent;
  },

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
  },

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

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate success/failure (90% success rate)
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
  },

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

      // Add communication record
      this.addCommunication(recipient.leadId, {
        type: 'whatsapp',
        content: processedMessage,
        direction: 'outbound',
        status: result.success ? 'sent' : 'failed',
        templateId,
        metadata: { bulkSend: true, variables },
      });

      // Small delay between messages
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return results;
  },

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
  },

  // Initialize default templates
  initializeDefaultTemplates(): void {
    const existingTemplates = this.getTemplates();
    if (existingTemplates.length === 0) {
      this.saveTemplates(this.getDefaultTemplates());
    }
  },
};