// ============================================================================
// Dashboard Module - Validators
// ============================================================================

import { z } from 'zod';

export const WidgetPositionSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  w: z.number().int().min(1).max(12),
  h: z.number().int().min(1).max(12),
});

export const CreateWidgetSchema = z.object({
  type: z.string().min(1, 'Tipo é obrigatório'),
  title: z.string().min(1, 'Título é obrigatório').max(100),
  position: WidgetPositionSchema,
  config: z.record(z.unknown()).optional(),
});

export const UpdateWidgetSchema = CreateWidgetSchema.partial().extend({
  id: z.string().cuid('ID inválido'),
});

export const SaveLayoutSchema = z.object({
  widgets: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      title: z.string(),
      position: WidgetPositionSchema,
      config: z.record(z.unknown()),
    })
  ),
});

export const GetMetricsSchema = z.object({
  userId: z.string().cuid().optional(),
});

export const GetRecentActivitySchema = z.object({
  userId: z.string().cuid().optional(),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
});

export const GetLeadsOverTimeSchema = z.object({
  userId: z.string().cuid().optional(),
  period: z.enum(['daily', 'weekly', 'monthly']).optional().default('daily'),
});
