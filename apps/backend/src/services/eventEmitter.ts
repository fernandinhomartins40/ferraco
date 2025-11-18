import { EventEmitter } from 'events';
import { webhookService } from '../modules/webhooks';
import { PrismaClient, EventType } from '@prisma/client';

const prisma = new PrismaClient();

class WebhookEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setupListeners();
  }

  /**
   * Configura listeners para eventos do sistema
   */
  private setupListeners(): void {
    // Lead events
    this.on('lead.created', this.handleLeadCreated.bind(this));
    this.on('lead.updated', this.handleLeadUpdated.bind(this));
    this.on('lead.status_changed', this.handleLeadStatusChanged.bind(this));
    this.on('lead.deleted', this.handleLeadDeleted.bind(this));

    // Communication events
    this.on('communication.sent', this.handleCommunicationSent.bind(this));
    this.on('communication.failed', this.handleCommunicationFailed.bind(this));

    // WhatsApp events
    this.on('whatsapp.message_received', this.handleWhatsAppMessageReceived.bind(this));
    this.on('whatsapp.message_sent', this.handleWhatsAppMessageSent.bind(this));

    // Automation events
    this.on('automation.executed', this.handleAutomationExecuted.bind(this));
    this.on('automation.failed', this.handleAutomationFailed.bind(this));
  }

  /**
   * Emite evento e dispara webhooks
   */
  async emitWebhookEvent(event: string, data: any, metadata?: any): Promise<void> {
    // Log evento no banco
    await this.logEvent(event, data, metadata);

    // Emite evento para listeners internos
    this.emit(event, { data, metadata });

    // Dispara webhooks
    await webhookService.triggerEvent(event, { data, metadata });
  }

  /**
   * Loga evento no banco de dados
   */
  private async logEvent(event: string, data: any, metadata?: any): Promise<void> {
    try {
      const eventTypeMap: Record<string, EventType> = {
        'lead.created': EventType.LEAD_CREATED,
        'lead.updated': EventType.LEAD_UPDATED,
        'lead.status_changed': EventType.LEAD_STATUS_CHANGED,
        'lead.deleted': EventType.LEAD_DELETED,
        'communication.sent': EventType.COMMUNICATION_SENT,
        'communication.failed': EventType.COMMUNICATION_FAILED,
        'whatsapp.message_received': EventType.WHATSAPP_MESSAGE_RECEIVED,
        'whatsapp.message_sent': EventType.WHATSAPP_MESSAGE_SENT,
        'automation.executed': EventType.AUTOMATION_EXECUTED,
        'automation.failed': EventType.AUTOMATION_FAILED,
      };

      const eventType = eventTypeMap[event];
      if (!eventType) return;

      await prisma.eventLog.create({
        data: {
          eventType,
          eventName: event,
          resourceType: metadata?.resourceType || 'Unknown',
          resourceId: metadata?.resourceId || data.id || 'unknown',
          userId: metadata?.userId,
          apiKeyId: metadata?.apiKeyId,
          payload: JSON.stringify({ data, metadata }),
        },
      });
    } catch (error) {
      console.error('Failed to log event:', error);
    }
  }

  // ========================================================================
  // Event Handlers
  // ========================================================================

  private async handleLeadCreated(payload: any): Promise<void> {
    console.log('[Event] Lead created:', payload.data.id);
  }

  private async handleLeadUpdated(payload: any): Promise<void> {
    console.log('[Event] Lead updated:', payload.data.id);
  }

  private async handleLeadStatusChanged(payload: any): Promise<void> {
    console.log('[Event] Lead status changed:', payload.data.id, '->', payload.data.status);
  }

  private async handleLeadDeleted(payload: any): Promise<void> {
    console.log('[Event] Lead deleted:', payload.data.id);
  }

  private async handleCommunicationSent(payload: any): Promise<void> {
    console.log('[Event] Communication sent:', payload.data.id);
  }

  private async handleCommunicationFailed(payload: any): Promise<void> {
    console.error('[Event] Communication failed:', payload.data.id);
  }

  private async handleWhatsAppMessageReceived(payload: any): Promise<void> {
    console.log('[Event] WhatsApp message received:', payload.data.from);
  }

  private async handleWhatsAppMessageSent(payload: any): Promise<void> {
    console.log('[Event] WhatsApp message sent:', payload.data.to);
  }

  private async handleAutomationExecuted(payload: any): Promise<void> {
    console.log('[Event] Automation executed:', payload.data.id);
  }

  private async handleAutomationFailed(payload: any): Promise<void> {
    console.error('[Event] Automation failed:', payload.data.id);
  }
}

// Singleton instance
export const eventEmitter = new WebhookEventEmitter();

/**
 * Helper functions para emitir eventos comuns
 */
export const emitLeadCreated = (lead: any, userId?: string) =>
  eventEmitter.emitWebhookEvent('lead.created', lead, {
    resourceType: 'Lead',
    resourceId: lead.id,
    userId,
  });

export const emitLeadUpdated = (lead: any, userId?: string) =>
  eventEmitter.emitWebhookEvent('lead.updated', lead, {
    resourceType: 'Lead',
    resourceId: lead.id,
    userId,
  });

export const emitLeadStatusChanged = (lead: any, oldStatus: string, newStatus: string, userId?: string) =>
  eventEmitter.emitWebhookEvent('lead.status_changed', { ...lead, oldStatus, newStatus }, {
    resourceType: 'Lead',
    resourceId: lead.id,
    userId,
  });

export const emitLeadDeleted = (leadId: string, userId?: string) =>
  eventEmitter.emitWebhookEvent('lead.deleted', { id: leadId }, {
    resourceType: 'Lead',
    resourceId: leadId,
    userId,
  });

export const emitCommunicationSent = (communication: any, userId?: string) =>
  eventEmitter.emitWebhookEvent('communication.sent', communication, {
    resourceType: 'Communication',
    resourceId: communication.id,
    userId,
  });

export const emitWhatsAppMessageReceived = (message: any) =>
  eventEmitter.emitWebhookEvent('whatsapp.message_received', message, {
    resourceType: 'WhatsAppMessage',
    resourceId: message.id || message.messageId,
  });

export const emitAutomationExecuted = (automation: any, userId?: string) =>
  eventEmitter.emitWebhookEvent('automation.executed', automation, {
    resourceType: 'Automation',
    resourceId: automation.id,
    userId,
  });
