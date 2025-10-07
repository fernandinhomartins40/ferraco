import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { PipelineService } from './pipeline.service';
import { successResponse } from '../../utils/response';

const pipelineService = new PipelineService();

export class PipelineController {
  /**
   * GET /api/pipeline
   */
  async getPipelines(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { isDefault, businessType, search } = req.query;

      const pipelines = await pipelineService.getPipelines({
        isDefault: isDefault === 'true' ? true : isDefault === 'false' ? false : undefined,
        businessType: businessType as string,
        search: search as string,
      });

      res.json(successResponse(pipelines, 'Pipelines listados com sucesso'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/pipeline/:id
   */
  async getPipelineById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const pipeline = await pipelineService.getPipelineById(id);
      res.json(successResponse(pipeline, 'Pipeline encontrado'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/pipeline
   */
  async createPipeline(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const pipeline = await pipelineService.createPipeline(req.body);
      res.status(201).json(successResponse(pipeline, 'Pipeline criado com sucesso'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/pipeline/:id
   */
  async updatePipeline(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const pipeline = await pipelineService.updatePipeline(id, req.body);
      res.json(successResponse(pipeline, 'Pipeline atualizado com sucesso'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/pipeline/:id
   */
  async deletePipeline(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await pipelineService.deletePipeline(id);
      res.json(successResponse(result, 'Pipeline deletado com sucesso'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/pipeline/:id/stages
   */
  async addStage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const stage = await pipelineService.addStage(id, req.body);
      res.status(201).json(successResponse(stage, 'Estágio criado com sucesso'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/pipeline/stages/:stageId
   */
  async updateStage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { stageId } = req.params;
      const stage = await pipelineService.updateStage(stageId, req.body);
      res.json(successResponse(stage, 'Estágio atualizado com sucesso'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/pipeline/stages/:stageId
   */
  async deleteStage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { stageId } = req.params;
      const result = await pipelineService.deleteStage(stageId);
      res.json(successResponse(result, 'Estágio deletado com sucesso'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/pipeline/:id/reorder
   */
  async reorderStages(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { stages } = req.body;
      const result = await pipelineService.reorderStages(id, stages);
      res.json(successResponse(result, 'Estágios reordenados com sucesso'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/pipeline/:id/stats
   */
  async getPipelineStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const stats = await pipelineService.getPipelineStats(id);
      res.json(successResponse(stats, 'Estatísticas obtidas com sucesso'));
    } catch (error) {
      next(error);
    }
  }
}
