import { z } from 'zod';

/**
 * Schema para buscar duplicatas
 */
export const findDuplicatesSchema = z.object({
  params: z.object({
    leadId: z.string().uuid('ID do lead inválido'),
  }),
});

/**
 * Schema para marcar como duplicata
 */
export const markAsDuplicateSchema = z.object({
  body: z.object({
    leadId: z.string().uuid('ID do lead inválido'),
    duplicateOfId: z.string().uuid('ID do lead original inválido'),
  }),
});

/**
 * Schema para desmarcar como duplicata
 */
export const unmarkAsDuplicateSchema = z.object({
  params: z.object({
    leadId: z.string().uuid('ID do lead inválido'),
  }),
});

/**
 * Schema para mesclar leads
 */
export const mergeLeadsSchema = z.object({
  body: z.object({
    sourceId: z.string().uuid('ID do lead de origem inválido'),
    targetId: z.string().uuid('ID do lead de destino inválido'),
  }),
});
