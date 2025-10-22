import { Request, Response, NextFunction } from 'express';
import { LeadsService } from './leads.service';
import {
  CreateLeadSchema,
  UpdateLeadSchema,
  LeadFiltersSchema,
  MergeLeadsSchema,
  BulkUpdateLeadsSchema,
  LeadIdParamSchema,
  DuplicateSearchSchema,
} from './leads.validators';
import { UpdateLeadDTO, CreateLeadDTO, MergeLeadsDTO } from './leads.types';
import { z } from 'zod';
import { logger } from '../../utils/logger';
import {
  successResponse,
  createdResponse,
  notFoundResponse,
  badRequestResponse,
  paginatedResponse,
} from '../../utils/response';
import { ValidationError, formatZodErrors } from '../../utils/zodHelpers';

// ============================================================================
// LeadsController
// ============================================================================

export class LeadsController {
  constructor(private service: LeadsService) {}

  // ==========================================================================
  // CRUD Operations
  // ==========================================================================

  /**
   * POST /api/leads
   * Create a new lead
   */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = CreateLeadSchema.parse(req.body) as CreateLeadDTO;
      const lead = await this.service.create(validatedData, req.user!.userId);

      createdResponse(res, lead, 'Lead criado com sucesso');
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
   * GET /api/leads
   * List all leads with filters and pagination
   */
  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = LeadFiltersSchema.parse(req.query);
      const result = await this.service.findAll(filters);

      paginatedResponse(res, result.data, result.page, result.limit, result.total);
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
   * GET /api/leads/:id
   * Get lead by ID
   */
  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = LeadIdParamSchema.parse(req.params);
      const lead = await this.service.findById(id);

      if (!lead) {
        notFoundResponse(res, 'Lead não encontrado');
        return;
      }

      successResponse(res, lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        badRequestResponse(res, 'ID inválido', error.errors.map(e => ({
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
   * PUT /api/leads/:id
   * Update lead by ID
   */
  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = LeadIdParamSchema.parse(req.params);
      const validatedData = UpdateLeadSchema.parse({ ...req.body, id }) as UpdateLeadDTO;

      const lead = await this.service.update(id, validatedData);

      successResponse(res, lead, 'Lead atualizado com sucesso');
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
   * DELETE /api/leads/:id
   * Delete lead by ID (soft delete)
   */
  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = LeadIdParamSchema.parse(req.params);
      await this.service.delete(id);

      res.status(204).send();
    } catch (error) {
      if (error instanceof z.ZodError) {
        badRequestResponse(res, 'ID inválido', error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        })));
        return;
      }

      next(error);
    }
  };

  // ==========================================================================
  // Search and Filters
  // ==========================================================================

  /**
   * GET /api/leads/search
   * Search leads by text
   */
  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = LeadFiltersSchema.parse({
        ...req.query,
        search: req.query.q || req.query.search,
      });

      const result = await this.service.findAll(filters);

      paginatedResponse(res, result.data, result.page, result.limit, result.total);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/leads/filters
   * Advanced filters (same as findAll but with explicit route)
   */
  advancedFilters = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = LeadFiltersSchema.parse(req.query);
      const result = await this.service.findAll(filters);

      paginatedResponse(res, result.data, result.page, result.limit, result.total);
    } catch (error) {
      next(error);
    }
  };

  // ==========================================================================
  // Statistics
  // ==========================================================================

  /**
   * GET /api/leads/stats
   * Get general lead statistics
   */
  getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.service.getStats();

      successResponse(res, stats);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/leads/stats/by-status
   * Get statistics by status
   */
  getStatsByStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.service.getStats();

      successResponse(res, stats.byStatus);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/leads/stats/by-source
   * Get statistics by source
   */
  getStatsBySource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.service.getStats();

      successResponse(res, stats.bySource);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/leads/stats/timeline
   * Get leads timeline (daily counts)
   */
  getStatsTimeline = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const days = parseInt(req.query.days as string) || 30;

      if (days < 1 || days > 365) {
        throw new ValidationError('Days must be between 1 and 365');
      }

      const timeline = await this.service.getTimeline(days);

      successResponse(res, timeline);
    } catch (error) {
      next(error);
    }
  };

  // ==========================================================================
  // Timeline and History
  // ==========================================================================

  /**
   * GET /api/leads/:id/timeline
   * Get lead timeline
   */
  getTimeline = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = LeadIdParamSchema.parse(req.params);

      // For now, return empty timeline
      // This would typically fetch notes, interactions, communications, etc.
      logger.info('Timeline endpoint called', { leadId: id });

      successResponse(res, {
        leadId: id,
        events: [],
        message: 'Timeline functionality to be implemented',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/leads/:id/history
   * Get lead change history
   */
  getHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = LeadIdParamSchema.parse(req.params);

      // For now, return empty history
      // This would typically fetch audit logs for this lead
      logger.info('History endpoint called', { leadId: id });

      successResponse(res, {
        leadId: id,
        changes: [],
        message: 'History functionality to be implemented',
      });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================================================
  // Duplicates
  // ==========================================================================

  /**
   * GET /api/leads/duplicates
   * Find duplicate leads
   */
  findDuplicates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const criteria = DuplicateSearchSchema.parse(req.query);
      const duplicates = await this.service.findDuplicates(criteria);

      successResponse(res, duplicates);
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
   * POST /api/leads/merge
   * Merge duplicate leads
   */
  merge = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = MergeLeadsSchema.parse(req.body) as MergeLeadsDTO;
      const lead = await this.service.merge(validatedData);

      successResponse(res, lead, 'Leads mesclados com sucesso');
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

  // ==========================================================================
  // Export
  // ==========================================================================

  /**
   * GET /api/leads/export
   * Export leads (CSV, Excel, JSON)
   */
  export = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const format = (req.query.format as string) || 'json';
      const filters = LeadFiltersSchema.parse({
        ...req.query,
        limit: 10000, // Max export limit
      });

      const result = await this.service.findAll(filters);

      // For now, just return JSON
      // In production, implement CSV/Excel export
      logger.info('Export endpoint called', { format, count: result.data.length });

      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=leads.json');
        res.json(result.data);
      } else {
        badRequestResponse(res, 'Formato de exportação não suportado. Use: json');
      }
    } catch (error) {
      next(error);
    }
  };

  // ==========================================================================
  // Bulk Operations
  // ==========================================================================

  /**
   * PUT /api/leads/bulk
   * Bulk update leads
   */
  bulkUpdate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = BulkUpdateLeadsSchema.parse(req.body);

      // Update each lead
      const updatePromises = validatedData.leadIds.map(async (leadId) => {
        try {
          return await this.service.update(leadId, { ...validatedData.updates, id: leadId } as UpdateLeadDTO);
        } catch (error) {
          logger.error('Failed to update lead in bulk operation', { leadId, error });
          return null;
        }
      });

      const results = await Promise.all(updatePromises);
      const successful = results.filter(r => r !== null);

      successResponse(res, {
        updated: successful.length,
        failed: results.length - successful.length,
        leads: successful,
      }, `${successful.length} leads atualizados com sucesso`);
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
}
