import { Request, Response } from 'express';
import { PipelineService } from './pipeline.service';
import { prisma } from '../../config/database';
import { successResponse, errorResponse, notFoundResponse } from '../../utils/response';
import {
  CreatePipelineSchema,
  UpdatePipelineSchema,
  CreateStageSchema,
  UpdateStageSchema,
  CreateOpportunitySchema,
  MoveOpportunitySchema,
  ReorderStageSchema,
} from './pipeline.validators';
import {
  CreatePipelineDTO,
  UpdatePipelineDTO,
  CreateStageDTO,
  UpdateStageDTO,
  ReorderStageDTO,
  CreateOpportunityDTO,
  MoveOpportunityDTO,
} from './pipeline.types';
import { z } from 'zod';
import { formatZodErrors } from '../../utils/zodHelpers';

// ============================================================================
// Pipeline Controller
// ============================================================================

export class PipelineController {
  private service: PipelineService;

  constructor() {
    this.service = new PipelineService(prisma);
  }

  // ========================================================================
  // Pipeline Endpoints
  // ========================================================================

  listPipelines = async (_req: Request, res: Response): Promise<void> => {
    try {
      const pipelines = await this.service.findAll();
      successResponse(res, pipelines, 'Pipelines retrieved successfully');
    } catch (error) {
      errorResponse(res, error instanceof Error ? error.message : 'Failed to retrieve pipelines');
    }
  };

  getPipeline = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const pipeline = await this.service.findById(id);

      if (!pipeline) {
        notFoundResponse(res, 'Pipeline not found');
        return;
      }

      successResponse(res, pipeline, 'Pipeline retrieved successfully');
    } catch (error) {
      errorResponse(res, error instanceof Error ? error.message : 'Failed to retrieve pipeline');
    }
  };

  createPipeline = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = CreatePipelineSchema.parse(req.body) as unknown as CreatePipelineDTO;
      const userId = req.user!.userId;

      const pipeline = await this.service.createPipeline(data, userId);
      successResponse(res, pipeline, 'Pipeline created successfully', 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errorResponse(res, 'Validation error', 400, formatZodErrors(error.errors));
      } else {
        errorResponse(res, error instanceof Error ? error.message : 'Failed to create pipeline');
      }
    }
  };

  updatePipeline = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data = UpdatePipelineSchema.partial().parse(req.body) as unknown as Partial<UpdatePipelineDTO>;

      const pipeline = await this.service.updatePipeline(id, data);
      successResponse(res, pipeline, 'Pipeline updated successfully');
    } catch (error) {
      if (error instanceof z.ZodError) {
        errorResponse(res, 'Validation error', 400, formatZodErrors(error.errors));
      } else {
        errorResponse(res, error instanceof Error ? error.message : 'Failed to update pipeline');
      }
    }
  };

  deletePipeline = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.service.deletePipeline(id);
      successResponse(res, null, 'Pipeline deleted successfully');
    } catch (error) {
      errorResponse(res, error instanceof Error ? error.message : 'Failed to delete pipeline');
    }
  };

  // ========================================================================
  // Stage Endpoints
  // ========================================================================

  listStages = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const stages = await this.service.getStagesByPipeline(id);
      successResponse(res, stages, 'Stages retrieved successfully');
    } catch (error) {
      errorResponse(res, error instanceof Error ? error.message : 'Failed to retrieve stages');
    }
  };

  createStage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data = CreateStageSchema.parse(req.body) as unknown as CreateStageDTO;

      const stage = await this.service.createStage(id, data);
      successResponse(res, stage, 'Stage created successfully', 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errorResponse(res, 'Validation error', 400, formatZodErrors(error.errors));
      } else {
        errorResponse(res, error instanceof Error ? error.message : 'Failed to create stage');
      }
    }
  };

  updateStage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data = UpdateStageSchema.parse(req.body) as unknown as UpdateStageDTO;

      const stage = await this.service.updateStage(id, data);
      successResponse(res, stage, 'Stage updated successfully');
    } catch (error) {
      if (error instanceof z.ZodError) {
        errorResponse(res, 'Validation error', 400, formatZodErrors(error.errors));
      } else {
        errorResponse(res, error instanceof Error ? error.message : 'Failed to update stage');
      }
    }
  };

  deleteStage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.service.deleteStage(id);
      successResponse(res, null, 'Stage deleted successfully');
    } catch (error) {
      errorResponse(res, error instanceof Error ? error.message : 'Failed to delete stage');
    }
  };

  reorderStages = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const reorders = z.array(ReorderStageSchema).parse(req.body) as unknown as ReorderStageDTO[];

      const stages = await this.service.reorderStages(id, reorders);
      successResponse(res, stages, 'Stages reordered successfully');
    } catch (error) {
      if (error instanceof z.ZodError) {
        errorResponse(res, 'Validation error', 400, formatZodErrors(error.errors));
      } else {
        errorResponse(res, error instanceof Error ? error.message : 'Failed to reorder stages');
      }
    }
  };

  // ========================================================================
  // Opportunity Endpoints
  // ========================================================================

  createOpportunity = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = CreateOpportunitySchema.parse(req.body) as unknown as CreateOpportunityDTO;
      const userId = req.user!.userId;

      const opportunity = await this.service.createOpportunity(data, userId);
      successResponse(res, opportunity, 'Opportunity created successfully', 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errorResponse(res, 'Validation error', 400, formatZodErrors(error.errors));
      } else {
        errorResponse(res, error instanceof Error ? error.message : 'Failed to create opportunity');
      }
    }
  };

  moveOpportunity = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data = MoveOpportunitySchema.parse(req.body) as unknown as MoveOpportunityDTO;

      const opportunity = await this.service.moveOpportunity({
        opportunityId: id,
        targetStageId: data.targetStageId,
        reason: data.reason,
      });
      successResponse(res, opportunity, 'Opportunity moved successfully');
    } catch (error) {
      if (error instanceof z.ZodError) {
        errorResponse(res, 'Validation error', 400, formatZodErrors(error.errors));
      } else {
        errorResponse(res, error instanceof Error ? error.message : 'Failed to move opportunity');
      }
    }
  };

  getOpportunityTimeline = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const timeline = await this.service.getOpportunityTimeline(id);
      successResponse(res, timeline, 'Timeline retrieved successfully');
    } catch (error) {
      errorResponse(res, error instanceof Error ? error.message : 'Failed to retrieve timeline');
    }
  };

  // ========================================================================
  // Statistics Endpoints
  // ========================================================================

  getPipelineStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const stats = await this.service.getPipelineStats(id);
      successResponse(res, stats, 'Statistics retrieved successfully');
    } catch (error) {
      errorResponse(res, error instanceof Error ? error.message : 'Failed to retrieve statistics');
    }
  };

  getFunnel = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const funnel = await this.service.getFunnel(id);
      successResponse(res, funnel, 'Funnel retrieved successfully');
    } catch (error) {
      errorResponse(res, error instanceof Error ? error.message : 'Failed to retrieve funnel');
    }
  };
}
