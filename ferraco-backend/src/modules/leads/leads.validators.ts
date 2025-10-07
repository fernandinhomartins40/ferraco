import { z } from 'zod';

export const createLeadSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    phone: z.string().min(8, 'Telefone inválido'),
    email: z.string().email('Email inválido').optional(),
    status: z
      .enum(['NOVO', 'EM_ANDAMENTO', 'CONCLUIDO', 'PERDIDO', 'DESCARTADO'])
      .optional(),
    source: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    assignedToId: z.string().uuid('ID inválido').optional(),
  }),
});

export const updateLeadSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').optional(),
    phone: z.string().min(8, 'Telefone inválido').optional(),
    email: z.string().email('Email inválido').optional(),
    status: z
      .enum(['NOVO', 'EM_ANDAMENTO', 'CONCLUIDO', 'PERDIDO', 'DESCARTADO'])
      .optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    source: z.string().optional(),
    assignedToId: z.string().uuid('ID inválido').optional().nullable(),
    nextFollowUp: z.string().datetime().optional().nullable(),
    leadScore: z.number().min(0).max(100).optional().nullable(),
    pipelineStage: z.string().optional().nullable(),
  }),
});

export const updateLeadStatusSchema = z.object({
  body: z.object({
    status: z.enum(['NOVO', 'EM_ANDAMENTO', 'CONCLUIDO', 'PERDIDO', 'DESCARTADO']),
  }),
});

export const leadFiltersSchema = z.object({
  query: z.object({
    status: z
      .enum(['NOVO', 'EM_ANDAMENTO', 'CONCLUIDO', 'PERDIDO', 'DESCARTADO'])
      .optional(),
    search: z.string().optional(),
    tags: z.union([z.string(), z.array(z.string())]).optional(),
    assignedToId: z.string().uuid().optional(),
    source: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

export const leadIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
});
