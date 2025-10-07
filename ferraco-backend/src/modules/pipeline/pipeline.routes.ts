import { Router } from 'express';
import { PipelineController } from './pipeline.controller';
import { authMiddleware } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import {
  createPipelineSchema,
  updatePipelineSchema,
  getPipelineByIdSchema,
  deletePipelineSchema,
  getPipelinesSchema,
  addStageSchema,
  updateStageSchema,
  deleteStageSchema,
  reorderStagesSchema,
  getPipelineStatsSchema,
} from './pipeline.validators';

const router = Router();
const pipelineController = new PipelineController();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

/**
 * GET /api/pipeline
 * Listar pipelines
 */
router.get('/', validate(getPipelinesSchema), pipelineController.getPipelines.bind(pipelineController));

/**
 * GET /api/pipeline/:id
 * Obter pipeline por ID
 */
router.get('/:id', validate(getPipelineByIdSchema), pipelineController.getPipelineById.bind(pipelineController));

/**
 * POST /api/pipeline
 * Criar pipeline
 */
router.post('/', validate(createPipelineSchema), pipelineController.createPipeline.bind(pipelineController));

/**
 * PUT /api/pipeline/:id
 * Atualizar pipeline
 */
router.put('/:id', validate(updatePipelineSchema), pipelineController.updatePipeline.bind(pipelineController));

/**
 * DELETE /api/pipeline/:id
 * Deletar pipeline
 */
router.delete('/:id', validate(deletePipelineSchema), pipelineController.deletePipeline.bind(pipelineController));

/**
 * POST /api/pipeline/:id/stages
 * Adicionar estágio ao pipeline
 */
router.post('/:id/stages', validate(addStageSchema), pipelineController.addStage.bind(pipelineController));

/**
 * PUT /api/pipeline/stages/:stageId
 * Atualizar estágio
 */
router.put('/stages/:stageId', validate(updateStageSchema), pipelineController.updateStage.bind(pipelineController));

/**
 * DELETE /api/pipeline/stages/:stageId
 * Deletar estágio
 */
router.delete('/stages/:stageId', validate(deleteStageSchema), pipelineController.deleteStage.bind(pipelineController));

/**
 * POST /api/pipeline/:id/reorder
 * Reordenar estágios do pipeline
 */
router.post('/:id/reorder', validate(reorderStagesSchema), pipelineController.reorderStages.bind(pipelineController));

/**
 * GET /api/pipeline/:id/stats
 * Obter estatísticas do pipeline
 */
router.get('/:id/stats', validate(getPipelineStatsSchema), pipelineController.getPipelineStats.bind(pipelineController));

export default router;
