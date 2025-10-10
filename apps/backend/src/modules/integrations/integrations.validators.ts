// ============================================================================
// Integrations Module - Validators
// ============================================================================

import { z } from 'zod';

export const CreateIntegrationSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100).trim(),
  type: z.enum([
    'ZAPIER',
    'MAKE',
    'GOOGLE_ANALYTICS',
    'FACEBOOK_ADS',
    'INSTAGRAM_ADS',
    'HUBSPOT',
    'PIPEDRIVE',
    'MAILCHIMP',
    'WEBHOOK',
    'CUSTOM',
  ], {
    errorMap: () => ({ message: 'Tipo de integração inválido' }),
  }),
  config: z.record(z.unknown()),
  credentials: z.record(z.unknown()).optional(),
  syncFrequency: z.enum(['REALTIME', 'HOURLY', 'DAILY', 'WEEKLY']).optional().default('DAILY'),
  isEnabled: z.boolean().optional().default(true),
});

export const UpdateIntegrationSchema = CreateIntegrationSchema.partial().extend({
  id: z.string().cuid('ID inválido'),
});

export const TestIntegrationSchema = z.object({
  id: z.string().cuid('ID inválido'),
});

export const SyncIntegrationSchema = z.object({
  id: z.string().cuid('ID inválido'),
});

export const WebhookPayloadSchema = z.object({
  event: z.string().min(1, 'Evento é obrigatório'),
  data: z.record(z.unknown()),
  timestamp: z.string().datetime().or(z.date()).optional(),
  source: z.string().optional(),
});

export const GetLogsSchema = z.object({
  id: z.string().cuid('ID inválido'),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
});
