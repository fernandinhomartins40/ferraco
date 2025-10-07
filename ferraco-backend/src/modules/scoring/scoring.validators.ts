import { z } from 'zod';

/**
 * Schema para calcular score de lead
 */
export const calculateLeadScoreSchema = z.object({
  params: z.object({
    leadId: z.string().uuid('ID do lead inválido'),
  }),
});

/**
 * Schema para obter top leads
 */
export const getTopScoredLeadsSchema = z.object({
  query: z.object({
    limit: z.string().regex(/^\d+$/, 'Limite deve ser um número').optional(),
  }),
});
