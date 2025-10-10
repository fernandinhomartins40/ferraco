import { z } from 'zod';

// Regex para validar cor hexadecimal (#000000 ou #FFF)
const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export const CreateTagSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(50, 'Nome deve ter no máximo 50 caracteres')
    .trim(),

  color: z.string()
    .regex(hexColorRegex, 'Cor deve ser um hexadecimal válido (ex: #FF5733)'),

  description: z.string()
    .max(255, 'Descrição deve ter no máximo 255 caracteres')
    .trim()
    .optional(),

  isSystem: z.boolean().optional().default(false),
});

export const UpdateTagSchema = CreateTagSchema.partial().extend({
  id: z.string().cuid('ID inválido'),
});

export const CreateTagRuleSchema = z.object({
  tagId: z.string().cuid('ID da tag inválido'),

  condition: z.object({
    field: z.string()
      .min(1, 'Campo é obrigatório'),

    operator: z.enum(['equals', 'contains', 'startsWith', 'endsWith'], {
      errorMap: () => ({ message: 'Operador inválido' }),
    }),

    value: z.string()
      .min(1, 'Valor é obrigatório'),
  }),

  isActive: z.boolean().default(true),
});

export const TagFiltersSchema = z.object({
  search: z.string().trim().optional(),

  isSystem: z.boolean().optional(),

  isActive: z.boolean().optional(),
});

export const ApplyRulesSchema = z.object({
  leadId: z.string().cuid('ID do lead inválido').optional(),
});

export const BulkDeleteTagsSchema = z.object({
  tagIds: z.array(z.string().cuid())
    .min(1, 'Ao menos uma tag deve ser fornecida')
    .max(50, 'Máximo de 50 tags por operação'),
});
