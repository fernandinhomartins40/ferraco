import { z } from 'zod';

/**
 * Schema para criar automação
 */
export const createAutomationSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
    description: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
    triggerType: z.enum(['lead_created', 'lead_updated', 'status_changed', 'tag_added', 'note_added', 'time_based', 'manual'], {
      errorMap: () => ({ message: 'Tipo de gatilho inválido' }),
    }),
    triggerValue: z.string().max(200, 'Valor do gatilho deve ter no máximo 200 caracteres').optional(),
    conditions: z.string().min(1, 'Condições são obrigatórias'),
    actions: z.string().min(1, 'Ações são obrigatórias'),
  }),
});

/**
 * Schema para atualizar automação
 */
export const updateAutomationSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
  body: z.object({
    name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres').optional(),
    description: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
    triggerType: z.enum(['lead_created', 'lead_updated', 'status_changed', 'tag_added', 'note_added', 'time_based', 'manual']).optional(),
    triggerValue: z.string().max(200, 'Valor do gatilho deve ter no máximo 200 caracteres').optional(),
    conditions: z.string().optional(),
    actions: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

/**
 * Schema para obter automação por ID
 */
export const getAutomationByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
});

/**
 * Schema para deletar automação
 */
export const deleteAutomationSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
});

/**
 * Schema para toggle status
 */
export const toggleAutomationStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
});

/**
 * Schema para executar automação
 */
export const executeAutomationSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
  body: z.object({
    leadId: z.string().uuid('ID do lead inválido').optional(),
  }),
});

/**
 * Schema para obter logs
 */
export const getAutomationLogsSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
  query: z.object({
    success: z.enum(['true', 'false']).optional(),
    page: z.string().regex(/^\d+$/, 'Página deve ser um número').optional(),
    limit: z.string().regex(/^\d+$/, 'Limite deve ser um número').optional(),
  }),
});

/**
 * Schema para listar automações
 */
export const getAutomationsSchema = z.object({
  query: z.object({
    isActive: z.enum(['true', 'false']).optional(),
    triggerType: z.string().optional(),
    search: z.string().optional(),
    page: z.string().regex(/^\d+$/, 'Página deve ser um número').optional(),
    limit: z.string().regex(/^\d+$/, 'Limite deve ser um número').optional(),
  }),
});
