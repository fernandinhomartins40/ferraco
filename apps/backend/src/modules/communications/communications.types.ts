import { Communication, CommunicationType, CommunicationStatus, MessageTemplate } from '@prisma/client';

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

export interface SendWhatsAppDTO {
  leadId: string;
  phone: string;
  message: string;
  templateId?: string;
  variables?: Record<string, string>;
}

export interface SendEmailDTO {
  leadId: string;
  to: string;
  subject: string;
  body: string;
  templateId?: string;
  attachments?: Array<{ filename: string; content: string }>;
}

export interface SendSMSDTO {
  leadId: string;
  phone: string;
  message: string;
}

export interface RegisterCallDTO {
  leadId: string;
  duration: number;
  notes?: string;
  outcome?: string;
}

export interface CreateTemplateDTO {
  name: string;
  type: CommunicationType;
  category: string;
  content: string;
  subject?: string;
  variables?: string[];
}

export interface UpdateTemplateDTO extends Partial<CreateTemplateDTO> {
  id: string;
}

export interface WebhookWhatsAppPayload {
  messageId: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  error?: string;
}

export interface WebhookSendGridPayload {
  email: string;
  event: 'delivered' | 'open' | 'click' | 'bounce' | 'dropped';
  timestamp: number;
  messageId: string;
}

// ============================================================================
// Response Types
// ============================================================================

export interface CommunicationResponse {
  id: string;
  leadId: string;
  type: CommunicationType;
  direction: string;
  status: CommunicationStatus;
  content: string;
  recipient?: string;
  subject?: string;
  sentBy?: {
    id: string;
    name: string;
    email: string;
  };
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface TemplateResponse {
  id: string;
  name: string;
  type: CommunicationType;
  category: string;
  content: string;
  subject?: string;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunicationHistoryFilter {
  leadId: string;
  type?: CommunicationType;
  dateFrom?: Date;
  dateTo?: Date;
  status?: CommunicationStatus;
}

// ============================================================================
// Integration Response Types
// ============================================================================

export interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============================================================================
// Type Utilities
// ============================================================================

export type CommunicationWithRelations = Communication & {
  lead?: {
    id: string;
    name: string;
    email: string | null;
    phone: string;
  };
  template?: MessageTemplate;
};
