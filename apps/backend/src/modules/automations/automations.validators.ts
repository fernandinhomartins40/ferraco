import { z } from 'zod';

// ============================================================================
// Validation Schemas
// ============================================================================

export const AutomationTriggerSchema = z.object({
  type: z.enum(['LEAD_CREATED', 'LEAD_UPDATED', 'STAGE_CHANGED', 'TAG_ADDED', 'SCHEDULED']),
  config: z.record(z.unknown()).optional(),
});

export const AutomationConditionSchema = z.object({
  field: z.string().min(1),
  operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'in', 'not_in']),
  value: z.union([z.string(), z.number(), z.array(z.string()), z.array(z.number())]),
});

export const AutomationActionSchema = z.object({
  type: z.enum([
    'SEND_EMAIL',
    'SEND_WHATSAPP',
    'ADD_TAG',
    'ASSIGN_TO',
    'CREATE_TASK',
    'UPDATE_FIELD',
    'SEND_WEBHOOK',
    'MOVE_TO_STAGE',
  ]),
  config: z.record(z.unknown()),
});

export const CreateAutomationSchema = z.object({
  name: z.string().min(3).max(100).trim(),
  description: z.string().max(500).optional(),
  trigger: AutomationTriggerSchema,
  conditions: z.array(AutomationConditionSchema).min(0),
  actions: z.array(AutomationActionSchema).min(1, 'Automation must have at least one action'),
  isActive: z.boolean().optional(),
});

export const UpdateAutomationSchema = CreateAutomationSchema.partial().extend({
  id: z.string().cuid(),
});

export const ExecuteAutomationSchema = z.object({
  automationId: z.string().cuid(),
  context: z.record(z.unknown()),
});

export const TestAutomationSchema = z.object({
  trigger: AutomationTriggerSchema,
  conditions: z.array(AutomationConditionSchema),
  actions: z.array(AutomationActionSchema),
  context: z.record(z.unknown()),
});

export const AutomationExecutionFilterSchema = z.object({
  automationId: z.string().cuid(),
  success: z.boolean().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

// ============================================================================
// Validation Helper Types
// ============================================================================

export type AutomationTriggerInput = z.infer<typeof AutomationTriggerSchema>;
export type AutomationConditionInput = z.infer<typeof AutomationConditionSchema>;
export type AutomationActionInput = z.infer<typeof AutomationActionSchema>;
export type CreateAutomationInput = z.infer<typeof CreateAutomationSchema>;
export type UpdateAutomationInput = z.infer<typeof UpdateAutomationSchema>;
export type ExecuteAutomationInput = z.infer<typeof ExecuteAutomationSchema>;
export type TestAutomationInput = z.infer<typeof TestAutomationSchema>;
export type AutomationExecutionFilterInput = z.infer<typeof AutomationExecutionFilterSchema>;
