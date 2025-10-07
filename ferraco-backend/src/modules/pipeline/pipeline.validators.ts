import { z } from 'zod';

/**
 * Schema para criar pipeline
 */
export const createPipelineSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
    description: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
    businessType: z.string().max(50, 'Tipo de negócio deve ter no máximo 50 caracteres').optional(),
    isDefault: z.boolean().optional(),
  }),
});

/**
 * Schema para atualizar pipeline
 */
export const updatePipelineSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
  body: z.object({
    name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres').optional(),
    description: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
    businessType: z.string().max(50, 'Tipo de negócio deve ter no máximo 50 caracteres').optional(),
    isDefault: z.boolean().optional(),
  }),
});

/**
 * Schema para obter pipeline por ID
 */
export const getPipelineByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
});

/**
 * Schema para deletar pipeline
 */
export const deletePipelineSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
});

/**
 * Schema para listar pipelines
 */
export const getPipelinesSchema = z.object({
  query: z.object({
    isDefault: z.enum(['true', 'false']).optional(),
    businessType: z.string().optional(),
    search: z.string().optional(),
  }),
});

/**
 * Schema para adicionar estágio
 */
export const addStageSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID do pipeline inválido'),
  }),
  body: z.object({
    name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
    description: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida (formato: #RRGGBB)'),
    order: z.number().int().min(0, 'Ordem deve ser maior ou igual a 0'),
    expectedDuration: z.number().int().positive('Duração esperada deve ser positiva').optional(),
    conversionRate: z.number().min(0).max(100, 'Taxa de conversão deve estar entre 0 e 100').optional(),
    isClosedWon: z.boolean().optional(),
    isClosedLost: z.boolean().optional(),
  }),
});

/**
 * Schema para atualizar estágio
 */
export const updateStageSchema = z.object({
  params: z.object({
    stageId: z.string().uuid('ID do estágio inválido'),
  }),
  body: z.object({
    name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres').optional(),
    description: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida (formato: #RRGGBB)').optional(),
    order: z.number().int().min(0, 'Ordem deve ser maior ou igual a 0').optional(),
    expectedDuration: z.number().int().positive('Duração esperada deve ser positiva').optional(),
    conversionRate: z.number().min(0).max(100, 'Taxa de conversão deve estar entre 0 e 100').optional(),
    isClosedWon: z.boolean().optional(),
    isClosedLost: z.boolean().optional(),
  }),
});

/**
 * Schema para deletar estágio
 */
export const deleteStageSchema = z.object({
  params: z.object({
    stageId: z.string().uuid('ID do estágio inválido'),
  }),
});

/**
 * Schema para reordenar estágios
 */
export const reorderStagesSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID do pipeline inválido'),
  }),
  body: z.object({
    stages: z.array(
      z.object({
        id: z.string().uuid('ID do estágio inválido'),
        order: z.number().int().min(0, 'Ordem deve ser maior ou igual a 0'),
      })
    ).min(1, 'É necessário fornecer pelo menos um estágio'),
  }),
});

/**
 * Schema para obter estatísticas
 */
export const getPipelineStatsSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID do pipeline inválido'),
  }),
});
