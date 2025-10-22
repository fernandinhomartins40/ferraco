import { z } from 'zod';

// ============================================================================
// Request Validators
// ============================================================================

export const CreateWhatsAppAutomationSchema = z.object({
  leadId: z.string().uuid('Lead ID deve ser um UUID válido'),
  productsToSend: z.array(z.string()).min(1, 'Pelo menos um produto deve ser especificado'),
  scheduledFor: z.string().datetime().optional(),
});

export const RetryAutomationSchema = z.object({
  resetMessages: z.boolean().optional().default(false),
});

export const WhatsAppAutomationFiltersSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SENT', 'FAILED']).optional(),
  leadId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export const AutomationIdParamSchema = z.object({
  id: z.string().uuid('Automation ID deve ser um UUID válido'),
});

export const LeadIdParamSchema = z.object({
  leadId: z.string().uuid('Lead ID deve ser um UUID válido'),
});
