import { z } from 'zod';

export const createNoteSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Conteúdo é obrigatório'),
    important: z.boolean().optional(),
    category: z.string().optional(),
    isPrivate: z.boolean().optional(),
  }),
});

export const updateNoteSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Conteúdo é obrigatório').optional(),
    important: z.boolean().optional(),
    category: z.string().optional(),
    isPrivate: z.boolean().optional(),
  }),
});

export const noteFiltersSchema = z.object({
  query: z.object({
    leadId: z.string().uuid().optional(),
    important: z.enum(['true', 'false']).optional(),
    category: z.string().optional(),
    search: z.string().optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});

export const noteIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
});

export const leadIdSchema = z.object({
  params: z.object({
    leadId: z.string().uuid('ID inválido'),
  }),
});
