import { PrismaClient, Communication, CommunicationType, MessageTemplate } from '@prisma/client';
import axios from 'axios';
import {
  SendWhatsAppDTO,
  SendEmailDTO,
  SendSMSDTO,
  RegisterCallDTO,
  CreateTemplateDTO,
  UpdateTemplateDTO,
  WhatsAppResponse,
  EmailResponse,
  SMSResponse,
  CommunicationHistoryFilter,
} from './communications.types';

// ============================================================================
// Communications Service
// ============================================================================

export class CommunicationsService {
  constructor(private prisma: PrismaClient) {}

  // ========================================================================
  // Message Sending Operations
  // ========================================================================

  async sendWhatsApp(data: SendWhatsAppDTO, userId: string): Promise<Communication> {
    // Process template if provided
    let message = data.message;
    if (data.templateId && data.variables) {
      const template = await this.prisma.messageTemplate.findUnique({
        where: { id: data.templateId },
      });

      if (template) {
        message = this.processTemplate(template.content, data.variables);
      }
    }

    // Send via WhatsApp Business API
    const whatsappResponse = await this.sendWhatsAppMessage(data.phone, message);

    // Register communication
    return this.prisma.communication.create({
      data: {
        leadId: data.leadId,
        type: 'WHATSAPP',
        direction: 'OUTBOUND',
        content: message,
        status: whatsappResponse.success ? 'SENT' : 'FAILED',
        metadata: JSON.stringify({
          templateId: data.templateId,
          variables: data.variables,
          externalId: whatsappResponse.messageId,
          error: whatsappResponse.error,
        }),
        timestamp: new Date(),
      },
    });
  }

  async sendEmail(data: SendEmailDTO, userId: string): Promise<Communication> {
    // Process template if provided
    let { subject, body } = data;
    if (data.templateId) {
      const template = await this.prisma.messageTemplate.findUnique({
        where: { id: data.templateId },
      });

      if (template) {
        body = template.content;
        subject = template.name || subject;
      }
    }

    // Send via SendGrid/SMTP
    const emailResponse = await this.sendEmailMessage({
      to: data.to,
      subject,
      body,
      attachments: data.attachments,
    });

    return this.prisma.communication.create({
      data: {
        leadId: data.leadId,
        type: 'EMAIL',
        direction: 'OUTBOUND',
        content: body,
        status: emailResponse.success ? 'SENT' : 'FAILED',
        metadata: JSON.stringify({
          subject,
          to: data.to,
          attachments: data.attachments?.map((a) => a.filename),
          externalId: emailResponse.messageId,
          error: emailResponse.error,
        }),
        timestamp: new Date(),
      },
    });
  }

  async sendSMS(data: SendSMSDTO, userId: string): Promise<Communication> {
    // Send via Twilio
    const smsResponse = await this.sendSMSMessage(data.phone, data.message);

    return this.prisma.communication.create({
      data: {
        leadId: data.leadId,
        type: 'SMS',
        direction: 'OUTBOUND',
        content: data.message,
        status: smsResponse.success ? 'SENT' : 'FAILED',
        metadata: JSON.stringify({
          externalId: smsResponse.messageId,
          error: smsResponse.error,
        }),
        timestamp: new Date(),
      },
    });
  }

  async registerCall(data: RegisterCallDTO, userId: string): Promise<Communication> {
    return this.prisma.communication.create({
      data: {
        leadId: data.leadId,
        type: 'CALL',
        direction: 'OUTBOUND',
        content: data.notes || '',
        status: 'DELIVERED',
        metadata: JSON.stringify({
          duration: data.duration,
          outcome: data.outcome,
        }),
        timestamp: new Date(),
      },
    });
  }

  // ========================================================================
  // Template Operations
  // ========================================================================

  async createTemplate(data: CreateTemplateDTO): Promise<MessageTemplate> {
    return this.prisma.messageTemplate.create({
      data: {
        name: data.name,
        type: data.type,
        category: data.category as never,
        content: data.content,
        variables: JSON.stringify(data.variables || []),
        isActive: true,
      },
    });
  }

  async listTemplates(type?: CommunicationType): Promise<MessageTemplate[]> {
    return this.prisma.messageTemplate.findMany({
      where: type ? { type } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTemplate(id: string): Promise<MessageTemplate | null> {
    return this.prisma.messageTemplate.findUnique({
      where: { id },
    });
  }

  async updateTemplate(id: string, data: Partial<UpdateTemplateDTO>): Promise<MessageTemplate> {
    return this.prisma.messageTemplate.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        category: data.category as never,
        content: data.content,
        variables: data.variables ? JSON.stringify(data.variables) : undefined,
      },
    });
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.prisma.messageTemplate.delete({
      where: { id },
    });
  }

  // ========================================================================
  // History & Retrieval
  // ========================================================================

  async getHistory(filter: CommunicationHistoryFilter): Promise<Communication[]> {
    return this.prisma.communication.findMany({
      where: {
        leadId: filter.leadId,
        type: filter.type,
        status: filter.status,
        timestamp: {
          gte: filter.dateFrom,
          lte: filter.dateTo,
        },
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  async getCommunicationById(id: string): Promise<Communication | null> {
    return this.prisma.communication.findUnique({
      where: { id },
      include: {
        lead: true,
        template: true,
      },
    });
  }

  // ========================================================================
  // Webhook Handlers
  // ========================================================================

  async handleWhatsAppWebhook(data: {
    messageId: string;
    status: string;
    timestamp: string;
    error?: string;
  }): Promise<void> {
    // Find communication by external ID
    const communications = await this.prisma.communication.findMany({
      where: {
        type: 'WHATSAPP',
      },
    });

    const communication = communications.find((c) => {
      const metadata = c.metadata ? JSON.parse(c.metadata as string) : {};
      return metadata.externalId === data.messageId;
    });

    if (communication) {
      const statusMap: Record<string, 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'> = {
        sent: 'SENT',
        delivered: 'DELIVERED',
        read: 'READ',
        failed: 'FAILED',
      };

      await this.prisma.communication.update({
        where: { id: communication.id },
        data: {
          status: statusMap[data.status] || 'PENDING',
          deliveredAt: data.status === 'delivered' ? new Date(data.timestamp) : undefined,
          readAt: data.status === 'read' ? new Date(data.timestamp) : undefined,
        },
      });
    }
  }

  async handleSendGridWebhook(data: {
    email: string;
    event: string;
    timestamp: number;
    messageId: string;
  }): Promise<void> {
    // Find communication by external ID
    const communications = await this.prisma.communication.findMany({
      where: {
        type: 'EMAIL',
      },
    });

    const communication = communications.find((c) => {
      const metadata = c.metadata ? JSON.parse(c.metadata as string) : {};
      return metadata.externalId === data.messageId;
    });

    if (communication) {
      const updates: Record<string, Date | string> = {};

      if (data.event === 'delivered') {
        updates.status = 'DELIVERED';
        updates.deliveredAt = new Date(data.timestamp * 1000);
      } else if (data.event === 'open') {
        updates.status = 'READ';
        updates.readAt = new Date(data.timestamp * 1000);
      } else if (data.event === 'bounce' || data.event === 'dropped') {
        updates.status = 'FAILED';
      }

      await this.prisma.communication.update({
        where: { id: communication.id },
        data: updates as never,
      });
    }
  }

  // ========================================================================
  // Private Helper Methods
  // ========================================================================

  private async sendWhatsAppMessage(phone: string, message: string): Promise<WhatsAppResponse> {
    try {
      // Mock implementation - replace with actual WhatsApp Business API
      if (!process.env.WHATSAPP_API_URL || !process.env.WHATSAPP_API_TOKEN) {
        // Simulate success in development
        return {
          success: true,
          messageId: `wa_${Date.now()}`,
        };
      }

      const response = await axios.post(
        `${process.env.WHATSAPP_API_URL}/messages`,
        {
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: { body: message },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        messageId: response.data.messages[0].id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async sendEmailMessage(data: {
    to: string;
    subject: string;
    body: string;
    attachments?: Array<{ filename: string; content: string }>;
  }): Promise<EmailResponse> {
    try {
      // Mock implementation - replace with actual SendGrid API
      if (!process.env.SENDGRID_API_KEY) {
        // Simulate success in development
        return {
          success: true,
          messageId: `email_${Date.now()}`,
        };
      }

      const response = await axios.post(
        'https://api.sendgrid.com/v3/mail/send',
        {
          personalizations: [{ to: [{ email: data.to }] }],
          from: { email: process.env.EMAIL_FROM || 'noreply@example.com' },
          subject: data.subject,
          content: [{ type: 'text/html', value: data.body }],
          attachments: data.attachments,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        messageId: response.headers['x-message-id'] || `email_${Date.now()}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async sendSMSMessage(phone: string, message: string): Promise<SMSResponse> {
    try {
      // Mock implementation - replace with actual Twilio API
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        // Simulate success in development
        return {
          success: true,
          messageId: `sms_${Date.now()}`,
        };
      }

      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
        new URLSearchParams({
          To: phone,
          From: process.env.TWILIO_PHONE_NUMBER!,
          Body: message,
        }),
        {
          auth: {
            username: process.env.TWILIO_ACCOUNT_SID!,
            password: process.env.TWILIO_AUTH_TOKEN!,
          },
        }
      );

      return {
        success: true,
        messageId: response.data.sid,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private processTemplate(template: string, variables: Record<string, string>): string {
    let processed = template;

    Object.entries(variables).forEach(([key, value]) => {
      processed = processed.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    return processed;
  }
}
