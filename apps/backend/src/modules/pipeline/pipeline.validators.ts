import { z } from 'zod';

// ============================================================================
// Validation Schemas
// ============================================================================

export const CreateStageSchema = z.object({
  name: z.string().min(2).max(50).trim(),
  order: z.number().int().min(0),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor inválida (formato: #RRGGBB)'),
  rottenDays: z.number().int().positive().optional(),
});

export const CreatePipelineSchema = z.object({
  name: z.string().min(3).max(100).trim(),
  description: z.string().max(500).optional(),
  isDefault: z.boolean().optional(),
  stages: z.array(CreateStageSchema).min(1, 'Pipeline deve ter ao menos 1 estágio'),
});

export const UpdatePipelineSchema = CreatePipelineSchema.partial().extend({
  id: z.string().cuid(),
});

export const UpdateStageSchema = z.object({
  name: z.string().min(2).max(50).trim().optional(),
  order: z.number().int().min(0).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor inválida (formato: #RRGGBB)').optional(),
  rottenDays: z.number().int().positive().optional(),
});

export const CreateOpportunitySchema = z.object({
  leadId: z.string().cuid(),
  pipelineId: z.string().cuid(),
  stageId: z.string().cuid(),
  value: z.number().positive().optional(),
  probability: z.number().min(0).max(100).optional(),
  expectedCloseDate: z.string().datetime().optional(),
  assignedToId: z.string().cuid().optional(),
});

export const MoveOpportunitySchema = z.object({
  opportunityId: z.string().cuid(),
  targetStageId: z.string().cuid(),
  reason: z.string().max(500).optional(),
});

export const ReorderStageSchema = z.object({
  stageId: z.string().cuid(),
  newOrder: z.number().int().min(0),
});

// ============================================================================
// Validation Helper Types
// ============================================================================

export type CreateStageInput = z.infer<typeof CreateStageSchema>;
export type CreatePipelineInput = z.infer<typeof CreatePipelineSchema>;
export type UpdatePipelineInput = z.infer<typeof UpdatePipelineSchema>;
export type UpdateStageInput = z.infer<typeof UpdateStageSchema>;
export type CreateOpportunityInput = z.infer<typeof CreateOpportunitySchema>;
export type MoveOpportunityInput = z.infer<typeof MoveOpportunitySchema>;
export type ReorderStageInput = z.infer<typeof ReorderStageSchema>;
