import { z } from 'zod';

// ============================================================================
// Request Validators
// ============================================================================

export const CreateWhatsAppAutomationSchema = z.object({
  leadId: z.string().cuid('Lead ID deve ser um CUID válido'),
  productsToSend: z.array(z.string()).min(1, 'Pelo menos um produto deve ser especificado'),
  scheduledFor: z.string().datetime().optional(),
});

export const RetryAutomationSchema = z.object({
  resetMessages: z.boolean().optional().default(false),
});

export const WhatsAppAutomationFiltersSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SENT', 'FAILED']).optional(),
  leadId: z.string().cuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

// ✅ CORREÇÃO: Aceitar CUID ao invés de UUID (Prisma usa CUID por padrão)
export const AutomationIdParamSchema = z.object({
  id: z.string().cuid('Automation ID deve ser um CUID válido'),
});

export const LeadIdParamSchema = z.object({
  leadId: z.string().cuid('Lead ID deve ser um CUID válido'),
});
