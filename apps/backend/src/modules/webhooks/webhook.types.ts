import { WebhookStatus, WebhookDeliveryStatus } from '@prisma/client';

export interface CreateWebhookDTO {
  url: string;
  events: string[];
  name?: string;
  description?: string;
  maxRetries?: number;
  retryDelay?: number;
}

export interface UpdateWebhookDTO {
  url?: string;
  events?: string[];
  name?: string;
  description?: string;
  status?: WebhookStatus;
  maxRetries?: number;
  retryDelay?: number;
}

export interface WebhookResponse {
  id: string;
  url: string;
  events: string[];
  status: WebhookStatus;
  name: string | null;
  description: string | null;
  maxRetries: number;
  retryDelay: number;
  lastTriggeredAt: Date | null;
  failureCount: number;
  successCount: number;
  createdAt: Date;
  updatedAt: Date;
  secret: string; // Apenas na criação
}

export interface WebhookDeliveryResponse {
  id: string;
  webhookId: string;
  event: string;
  status: WebhookDeliveryStatus;
  attempts: number;
  maxAttempts: number;
  statusCode: number | null;
  errorMessage: string | null;
  responseTime: number | null;
  createdAt: Date;
  lastAttemptAt: Date | null;
  nextAttemptAt: Date | null;
  completedAt: Date | null;
}

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: any;
  metadata?: {
    leadId?: string;
    userId?: string;
    [key: string]: any;
  };
}

export const WEBHOOK_EVENTS = {
  LEAD_CREATED: 'lead.created',
  LEAD_UPDATED: 'lead.updated',
  LEAD_STATUS_CHANGED: 'lead.status_changed',
  LEAD_DELETED: 'lead.deleted',
  COMMUNICATION_SENT: 'communication.sent',
  COMMUNICATION_FAILED: 'communication.failed',
  WHATSAPP_MESSAGE_RECEIVED: 'whatsapp.message_received',
  WHATSAPP_MESSAGE_SENT: 'whatsapp.message_sent',
  AUTOMATION_EXECUTED: 'automation.executed',
  AUTOMATION_FAILED: 'automation.failed',
} as const;

export type WebhookEventType = (typeof WEBHOOK_EVENTS)[keyof typeof WEBHOOK_EVENTS];
