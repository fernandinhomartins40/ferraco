import { z } from 'zod';
import { CommunicationType } from '@prisma/client';

// ============================================================================
// Validation Schemas
// ============================================================================

export const SendWhatsAppSchema = z.object({
  leadId: z.string().cuid(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Número de telefone inválido'),
  message: z.string().min(1).max(4096),
  templateId: z.string().cuid().optional(),
  variables: z.record(z.string()).optional(),
});

export const SendEmailSchema = z.object({
  leadId: z.string().cuid(),
  to: z.string().email('Email inválido'),
  subject: z.string().min(1).max(200),
  body: z.string().min(1),
  templateId: z.string().cuid().optional(),
  attachments: z
    .array(
      z.object({
        filename: z.string(),
        content: z.string(),
      })
    )
    .optional(),
});

export const SendSMSSchema = z.object({
  leadId: z.string().cuid(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Número de telefone inválido'),
  message: z.string().min(1).max(160),
});

export const RegisterCallSchema = z.object({
  leadId: z.string().cuid(),
  duration: z.number().int().min(0).max(86400), // Max 24 hours in seconds
  notes: z.string().max(1000).optional(),
  outcome: z.string().max(200).optional(),
});

export const CreateTemplateSchema = z.object({
  name: z.string().min(3).max(100).trim(),
  type: z.nativeEnum(CommunicationType),
  category: z.string().min(2).max(50),
  content: z.string().min(1).max(10000),
  subject: z.string().max(200).optional(),
  variables: z.array(z.string()).optional(),
});

export const UpdateTemplateSchema = CreateTemplateSchema.partial().extend({
  id: z.string().cuid(),
});

export const WebhookWhatsAppSchema = z.object({
  messageId: z.string(),
  status: z.enum(['sent', 'delivered', 'read', 'failed']),
  timestamp: z.string(),
  error: z.string().optional(),
});

export const WebhookSendGridSchema = z.object({
  email: z.string().email(),
  event: z.enum(['delivered', 'open', 'click', 'bounce', 'dropped']),
  timestamp: z.number(),
  messageId: z.string(),
});

export const CommunicationHistoryFilterSchema = z.object({
  leadId: z.string().cuid(),
  type: z.nativeEnum(CommunicationType).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  status: z.enum(['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED']).optional(),
});

// ============================================================================
// Validation Helper Types
// ============================================================================

export type SendWhatsAppInput = z.infer<typeof SendWhatsAppSchema>;
export type SendEmailInput = z.infer<typeof SendEmailSchema>;
export type SendSMSInput = z.infer<typeof SendSMSSchema>;
export type RegisterCallInput = z.infer<typeof RegisterCallSchema>;
export type CreateTemplateInput = z.infer<typeof CreateTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof UpdateTemplateSchema>;
export type WebhookWhatsAppInput = z.infer<typeof WebhookWhatsAppSchema>;
export type WebhookSendGridInput = z.infer<typeof WebhookSendGridSchema>;
export type CommunicationHistoryFilterInput = z.infer<typeof CommunicationHistoryFilterSchema>;
