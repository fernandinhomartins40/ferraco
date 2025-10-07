import { z } from 'zod';

/**
 * Schema para criar relatório
 */
export const createReportSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Nome é obrigatório').max(200, 'Nome deve ter no máximo 200 caracteres'),
    description: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
    type: z.enum(['leads', 'communications', 'sales_funnel', 'user_performance', 'custom'], {
      errorMap: () => ({ message: 'Tipo de relatório inválido' }),
    }),
    filters: z.string().min(1, 'Filtros são obrigatórios'),
  }),
});

/**
 * Schema para atualizar relatório
 */
export const updateReportSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
  body: z.object({
    name: z.string().min(1, 'Nome é obrigatório').max(200, 'Nome deve ter no máximo 200 caracteres').optional(),
    description: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
    type: z.enum(['leads', 'communications', 'sales_funnel', 'user_performance', 'custom']).optional(),
    filters: z.string().optional(),
    data: z.string().optional(),
  }),
});

/**
 * Schema para obter relatório por ID
 */
export const getReportByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
});

/**
 * Schema para deletar relatório
 */
export const deleteReportSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
});

/**
 * Schema para listar relatórios
 */
export const getReportsSchema = z.object({
  query: z.object({
    type: z.string().optional(),
    generatedById: z.string().uuid('ID do usuário inválido').optional(),
    search: z.string().optional(),
    page: z.string().regex(/^\d+$/, 'Página deve ser um número').optional(),
    limit: z.string().regex(/^\d+$/, 'Limite deve ser um número').optional(),
  }),
});

/**
 * Schema para gerar relatório de leads
 */
export const generateLeadsReportSchema = z.object({
  body: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Data inicial inválida (formato: YYYY-MM-DD)').optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Data final inválida (formato: YYYY-MM-DD)').optional(),
    status: z.string().optional(),
    source: z.string().optional(),
    assignedToId: z.string().uuid('ID do usuário inválido').optional(),
  }),
});

/**
 * Schema para gerar relatório de comunicações
 */
export const generateCommunicationsReportSchema = z.object({
  body: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Data inicial inválida (formato: YYYY-MM-DD)').optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Data final inválida (formato: YYYY-MM-DD)').optional(),
    type: z.string().optional(),
    direction: z.string().optional(),
    leadId: z.string().uuid('ID do lead inválido').optional(),
  }),
});

/**
 * Schema para gerar relatório de funil de vendas
 */
export const generateSalesFunnelReportSchema = z.object({
  body: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Data inicial inválida (formato: YYYY-MM-DD)').optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Data final inválida (formato: YYYY-MM-DD)').optional(),
    pipelineId: z.string().uuid('ID do pipeline inválido').optional(),
  }),
});

/**
 * Schema para gerar relatório de performance de usuários
 */
export const generateUserPerformanceReportSchema = z.object({
  body: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Data inicial inválida (formato: YYYY-MM-DD)').optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Data final inválida (formato: YYYY-MM-DD)').optional(),
    userId: z.string().uuid('ID do usuário inválido').optional(),
  }),
});
