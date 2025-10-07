import { z } from 'zod';

export const createTagSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida (use formato HEX)'),
    description: z.string().optional(),
  }),
});

export const updateTagSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida (use formato HEX)').optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const createTagRuleSchema = z.object({
  body: z.object({
    condition: z.enum(['status_change', 'time_based', 'source', 'keyword']),
    value: z.string(),
    action: z.enum(['add_tag', 'remove_tag']),
  }),
});

export const tagFiltersSchema = z.object({
  query: z.object({
    isActive: z.enum(['true', 'false']).optional(),
    isSystem: z.enum(['true', 'false']).optional(),
    search: z.string().optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});

export const tagIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
});

export const leadIdSchema = z.object({
  params: z.object({
    leadId: z.string().uuid('ID inválido'),
  }),
});
