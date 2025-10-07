import { z } from 'zod';

/**
 * Schema para criar comunicação
 */
export const createCommunicationSchema = z.object({
  body: z.object({
    leadId: z.string().uuid('ID do lead inválido'),
    type: z.enum(['email', 'whatsapp', 'sms', 'phone', 'other'], {
      errorMap: () => ({ message: 'Tipo de comunicação inválido' }),
    }),
    direction: z.enum(['inbound', 'outbound'], {
      errorMap: () => ({ message: 'Direção inválida' }),
    }),
    subject: z.string().max(200, 'Assunto deve ter no máximo 200 caracteres').optional(),
    content: z.string().min(1, 'Conteúdo é obrigatório').max(5000, 'Conteúdo deve ter no máximo 5000 caracteres'),
    metadata: z.string().optional(),
  }),
});

/**
 * Schema para atualizar comunicação
 */
export const updateCommunicationSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
  body: z.object({
    subject: z.string().max(200, 'Assunto deve ter no máximo 200 caracteres').optional(),
    content: z.string().max(5000, 'Conteúdo deve ter no máximo 5000 caracteres').optional(),
    status: z.enum(['sent', 'delivered', 'read', 'failed']).optional(),
    metadata: z.string().optional(),
  }),
});

/**
 * Schema para obter comunicação por ID
 */
export const getCommunicationByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
});

/**
 * Schema para deletar comunicação
 */
export const deleteCommunicationSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
});

/**
 * Schema para marcar como lida
 */
export const markAsReadSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
});

/**
 * Schema para listar comunicações
 */
export const getCommunicationsSchema = z.object({
  query: z.object({
    leadId: z.string().uuid('ID do lead inválido').optional(),
    type: z.string().optional(),
    direction: z.string().optional(),
    status: z.string().optional(),
    search: z.string().optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Data inicial inválida (formato: YYYY-MM-DD)').optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Data final inválida (formato: YYYY-MM-DD)').optional(),
    page: z.string().regex(/^\d+$/, 'Página deve ser um número').optional(),
    limit: z.string().regex(/^\d+$/, 'Limite deve ser um número').optional(),
  }),
});

/**
 * Schema para estatísticas
 */
export const getCommunicationStatsSchema = z.object({
  query: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Data inicial inválida (formato: YYYY-MM-DD)').optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Data final inválida (formato: YYYY-MM-DD)').optional(),
    leadId: z.string().uuid('ID do lead inválido').optional(),
  }),
});

/**
 * Schema para enviar email
 */
export const sendEmailSchema = z.object({
  body: z.object({
    leadId: z.string().uuid('ID do lead inválido'),
    subject: z.string().min(1, 'Assunto é obrigatório').max(200, 'Assunto deve ter no máximo 200 caracteres'),
    content: z.string().min(1, 'Conteúdo é obrigatório').max(5000, 'Conteúdo deve ter no máximo 5000 caracteres'),
  }),
});

/**
 * Schema para enviar WhatsApp
 */
export const sendWhatsAppSchema = z.object({
  body: z.object({
    leadId: z.string().uuid('ID do lead inválido'),
    content: z.string().min(1, 'Conteúdo é obrigatório').max(5000, 'Conteúdo deve ter no máximo 5000 caracteres'),
  }),
});
