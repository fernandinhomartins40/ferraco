import { z } from 'zod';

/**
 * Schema para criar integração
 */
export const createIntegrationSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
    type: z.enum(['ZAPIER', 'MAKE', 'GOOGLE_ANALYTICS', 'FACEBOOK_ADS', 'INSTAGRAM_ADS', 'HUBSPOT', 'PIPEDRIVE', 'MAILCHIMP', 'CUSTOM'], {
      errorMap: () => ({ message: 'Tipo de integração inválido' }),
    }),
    config: z.string().min(1, 'Configuração é obrigatória'),
    credentials: z.string().min(1, 'Credenciais são obrigatórias'),
  }),
});

/**
 * Schema para atualizar integração
 */
export const updateIntegrationSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
  body: z.object({
    name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres').optional(),
    config: z.string().optional(),
    credentials: z.string().optional(),
  }),
});

/**
 * Schema para obter integração por ID
 */
export const getIntegrationByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
});

/**
 * Schema para deletar integração
 */
export const deleteIntegrationSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
});

/**
 * Schema para toggle integração
 */
export const toggleIntegrationSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
});

/**
 * Schema para testar conexão
 */
export const testConnectionSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
});

/**
 * Schema para sincronizar
 */
export const syncIntegrationSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
});

/**
 * Schema para listar integrações
 */
export const getIntegrationsSchema = z.object({
  query: z.object({
    type: z.string().optional(),
    isEnabled: z.enum(['true', 'false']).optional(),
  }),
});
