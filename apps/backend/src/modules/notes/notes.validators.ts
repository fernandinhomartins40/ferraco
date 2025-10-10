import { z } from 'zod';

// ============================================================================
// Note Validators
// ============================================================================

export const CreateNoteSchema = z.object({
  leadId: z.string()
    .cuid('ID do lead inválido'),

  content: z.string()
    .min(1, 'Conteúdo da nota não pode estar vazio')
    .max(5000, 'Conteúdo da nota deve ter no máximo 5000 caracteres')
    .trim(),

  category: z.string()
    .max(50, 'Categoria deve ter no máximo 50 caracteres')
    .trim()
    .optional(),

  isImportant: z.boolean()
    .optional()
    .default(false),

  isPinned: z.boolean()
    .optional()
    .default(false),

  mentions: z.array(z.string().cuid('ID de usuário mencionado inválido'))
    .optional()
    .default([]),

  attachments: z.array(
    z.object({
      name: z.string(),
      url: z.string().url(),
      type: z.string(),
      size: z.number().int().positive(),
    })
  ).optional()
    .default([]),
});

export const UpdateNoteSchema = z.object({
  content: z.string()
    .min(1, 'Conteúdo da nota não pode estar vazio')
    .max(5000, 'Conteúdo da nota deve ter no máximo 5000 caracteres')
    .trim()
    .optional(),

  category: z.string()
    .max(50, 'Categoria deve ter no máximo 50 caracteres')
    .trim()
    .optional(),

  isImportant: z.boolean()
    .optional(),

  isPinned: z.boolean()
    .optional(),

  mentions: z.array(z.string().cuid('ID de usuário mencionado inválido'))
    .optional(),

  attachments: z.array(
    z.object({
      name: z.string(),
      url: z.string().url(),
      type: z.string(),
      size: z.number().int().positive(),
    })
  ).optional(),
});

export const NoteFiltersSchema = z.object({
  leadId: z.string().cuid().optional(),

  category: z.union([
    z.string(),
    z.array(z.string()),
  ]).optional().transform((val) => {
    if (!val) return undefined;
    return Array.isArray(val) ? val : [val];
  }),

  isImportant: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true'),
  ]).optional(),

  isPinned: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true'),
  ]).optional(),

  createdById: z.string().cuid().optional(),

  search: z.string().trim().optional(),

  dateFrom: z.string().datetime().optional().transform((val) => {
    return val ? new Date(val) : undefined;
  }),

  dateTo: z.string().datetime().optional().transform((val) => {
    return val ? new Date(val) : undefined;
  }),

  page: z.union([
    z.number().int().positive(),
    z.string().transform((val) => parseInt(val, 10)),
  ]).default(1),

  limit: z.union([
    z.number().int().positive().max(100),
    z.string().transform((val) => Math.min(parseInt(val, 10), 100)),
  ]).default(20),

  sortBy: z.enum(['createdAt', 'updatedAt']).default('createdAt'),

  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const NoteIdParamSchema = z.object({
  id: z.string().cuid('ID da nota inválido'),
});

export const LeadIdParamSchema = z.object({
  leadId: z.string().cuid('ID do lead inválido'),
});

export const ToggleImportantSchema = z.object({
  isImportant: z.boolean().optional(),
});

export const SearchNotesSchema = z.object({
  query: z.string()
    .min(1, 'Consulta de busca não pode estar vazia')
    .max(200, 'Consulta de busca deve ter no máximo 200 caracteres')
    .trim(),

  leadId: z.string().cuid().optional(),

  limit: z.union([
    z.number().int().positive().max(100),
    z.string().transform((val) => Math.min(parseInt(val, 10), 100)),
  ]).default(20),
});

// ============================================================================
// Type Inference
// ============================================================================

export type CreateNoteInput = z.infer<typeof CreateNoteSchema>;
export type UpdateNoteInput = z.infer<typeof UpdateNoteSchema>;
export type NoteFiltersInput = z.infer<typeof NoteFiltersSchema>;
export type SearchNotesInput = z.infer<typeof SearchNotesSchema>;
