import { Request, Response, NextFunction } from 'express';
import { PartialLeadsService } from './partial-leads.service';
import {
  CreatePartialLeadSchema,
  UpdatePartialLeadSchema,
  ConvertToLeadSchema,
  PartialLeadIdParamSchema,
  SessionIdParamSchema,
  CleanupQuerySchema,
} from './partial-leads.validators';
import { z } from 'zod';
import { logger } from '../../utils/logger';
import {
  successResponse,
  createdResponse,
  notFoundResponse,
  badRequestResponse,
  noContentResponse,
} from '../../utils/response';

// ============================================================================
// PartialLeadsController
// ============================================================================

export class PartialLeadsController {
  constructor(private service: PartialLeadsService) {}

  // ==========================================================================
  // CRUD Operations
  // ==========================================================================

  /**
   * GET /api/partial-leads
   * List all partial leads
   */
  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const partialLeads = await this.service.findAll();

      successResponse(res, partialLeads);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/partial-leads/session/:sessionId
   * Get partial lead by session ID
   */
  findBySessionId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sessionId } = SessionIdParamSchema.parse(req.params);
      const partialLead = await this.service.findBySessionId(sessionId);

      if (!partialLead) {
        notFoundResponse(res, 'Partial lead não encontrado');
        return;
      }

      successResponse(res, partialLead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        badRequestResponse(res, 'Erro de validação', error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        })));
        return;
      }

      next(error);
    }
  };

  /**
   * POST /api/partial-leads
   * Create a new partial lead
   */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = CreatePartialLeadSchema.parse(req.body);
      const partialLead = await this.service.create(validatedData);

      createdResponse(res, partialLead, 'Partial lead criado com sucesso');
    } catch (error) {
      if (error instanceof z.ZodError) {
        badRequestResponse(res, 'Erro de validação', error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        })));
        return;
      }

      next(error);
    }
  };

  /**
   * PUT /api/partial-leads/:id
   * Update a partial lead
   */
  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = PartialLeadIdParamSchema.parse(req.params);
      const validatedData = UpdatePartialLeadSchema.parse(req.body);

      const partialLead = await this.service.update(id, validatedData);

      successResponse(res, partialLead, 'Partial lead atualizado com sucesso');
    } catch (error) {
      if (error instanceof z.ZodError) {
        badRequestResponse(res, 'Erro de validação', error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        })));
        return;
      }

      next(error);
    }
  };

  /**
   * POST /api/partial-leads/:id/convert
   * Convert partial lead to full lead
   */
  convertToLead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = PartialLeadIdParamSchema.parse(req.params);
      const conversionData = ConvertToLeadSchema.parse(req.body);

      const result = await this.service.convertToLead(
        id,
        conversionData,
        req.user!.userId
      );

      successResponse(res, result, 'Partial lead convertido para lead com sucesso');
    } catch (error) {
      if (error instanceof z.ZodError) {
        badRequestResponse(res, 'Erro de validação', error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        })));
        return;
      }

      if (error instanceof Error && error.message.includes('não encontrado')) {
        notFoundResponse(res, error.message);
        return;
      }

      if (error instanceof Error) {
        badRequestResponse(res, error.message);
        return;
      }

      next(error);
    }
  };

  /**
   * POST /api/partial-leads/:id/abandon
   * Mark partial lead as abandoned
   */
  markAbandoned = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = PartialLeadIdParamSchema.parse(req.params);
      const partialLead = await this.service.markAbandoned(id);

      successResponse(res, partialLead, 'Partial lead marcado como abandonado');
    } catch (error) {
      if (error instanceof z.ZodError) {
        badRequestResponse(res, 'Erro de validação', error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        })));
        return;
      }

      next(error);
    }
  };

  /**
   * DELETE /api/partial-leads/cleanup
   * Cleanup old partial leads
   */
  cleanup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { olderThan } = CleanupQuerySchema.parse(req.query);
      const result = await this.service.cleanup(olderThan);

      successResponse(res, result, `${result.deletedCount} partial leads removidos`);
    } catch (error) {
      if (error instanceof z.ZodError) {
        badRequestResponse(res, 'Erro de validação', error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        })));
        return;
      }

      next(error);
    }
  };

  /**
   * GET /api/partial-leads/stats
   * Get partial leads statistics
   */
  getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.service.getStats();

      successResponse(res, stats);
    } catch (error) {
      next(error);
    }
  };
}
