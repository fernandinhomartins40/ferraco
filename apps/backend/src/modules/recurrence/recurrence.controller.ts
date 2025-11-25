import { Request, Response, NextFunction } from 'express';
import { recurrenceMessageTemplateService } from '../../services/recurrenceMessageTemplate.service';
import { leadRecurrenceService } from '../../services/leadRecurrence.service';
import { logger } from '../../utils/logger';
import { successResponse, createdResponse, badRequestResponse } from '../../utils/response';

export class RecurrenceController {
  /**
   * GET /api/recurrence/templates
   * Lista todos os templates de recorrência
   */
  async listTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const { isActive, trigger } = req.query;

      const filters: any = {};
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (trigger) filters.trigger = trigger as string;

      const templates = await recurrenceMessageTemplateService.list(filters);

      successResponse(res, templates);
    } catch (error) {
      logger.error('Error listing recurrence templates:', error);
      next(error);
    }
  }

  /**
   * GET /api/recurrence/templates/:id
   * Busca template por ID
   */
  async getTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const template = await recurrenceMessageTemplateService.getById(id);

      if (!template) {
        return badRequestResponse(res, 'Template não encontrado');
      }

      successResponse(res, template);
    } catch (error) {
      logger.error('Error getting recurrence template:', error);
      next(error);
    }
  }

  /**
   * POST /api/recurrence/templates
   * Cria novo template de recorrência
   */
  async createTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body;

      const template = await recurrenceMessageTemplateService.create(data);

      logger.info(`Template de recorrência criado: ${template.id}`);

      createdResponse(res, template, 'Template criado com sucesso');
    } catch (error) {
      logger.error('Error creating recurrence template:', error);
      next(error);
    }
  }

  /**
   * PUT /api/recurrence/templates/:id
   * Atualiza template de recorrência
   */
  async updateTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = req.body;

      const template = await recurrenceMessageTemplateService.update(id, data);

      logger.info(`Template de recorrência atualizado: ${template.id}`);

      successResponse(res, template);
    } catch (error) {
      logger.error('Error updating recurrence template:', error);
      next(error);
    }
  }

  /**
   * DELETE /api/recurrence/templates/:id
   * Deleta template de recorrência
   */
  async deleteTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await recurrenceMessageTemplateService.delete(id);

      logger.info(`Template de recorrência deletado: ${id}`);

      successResponse(res, { message: 'Template deletado com sucesso' });
    } catch (error) {
      logger.error('Error deleting recurrence template:', error);
      next(error);
    }
  }

  /**
   * GET /api/recurrence/stats/templates
   * Estatísticas de uso dos templates
   */
  async getTemplateStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await recurrenceMessageTemplateService.getUsageStats();

      successResponse(res, stats);
    } catch (error) {
      logger.error('Error getting template stats:', error);
      next(error);
    }
  }

  /**
   * GET /api/recurrence/stats/leads
   * Estatísticas de recorrência de leads
   * Query params: period ('7d' | '30d' | '90d' | 'all'), source, interest
   */
  async getLeadStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { period, source, interest } = req.query;

      // Validar período
      const validPeriods = ['7d', '30d', '90d', 'all'];
      const selectedPeriod = period && validPeriods.includes(period as string)
        ? (period as '7d' | '30d' | '90d' | 'all')
        : undefined;

      // Filtros adicionais
      const filters: any = {};
      if (source) filters.source = source as string;
      if (interest) filters.interest = interest as string;

      const stats = await leadRecurrenceService.getRecurrenceStats(
        selectedPeriod,
        Object.keys(filters).length > 0 ? filters : undefined
      );

      successResponse(res, stats);
    } catch (error) {
      logger.error('Error getting lead recurrence stats:', error);
      next(error);
    }
  }

  /**
   * GET /api/recurrence/stats/trends
   * Tendências de capturas ao longo do tempo
   * Query params: period ('7d' | '30d' | '90d' | 'all'), groupBy ('day' | 'week' | 'month')
   */
  async getCaptureTrends(req: Request, res: Response, next: NextFunction) {
    try {
      const { period, groupBy } = req.query;

      // Validar período
      const validPeriods = ['7d', '30d', '90d', 'all'];
      const selectedPeriod = period && validPeriods.includes(period as string)
        ? (period as '7d' | '30d' | '90d' | 'all')
        : '30d';

      // Validar groupBy
      const validGroupBy = ['day', 'week', 'month'];
      const selectedGroupBy = groupBy && validGroupBy.includes(groupBy as string)
        ? (groupBy as 'day' | 'week' | 'month')
        : undefined;

      const trends = await leadRecurrenceService.getCaptureTrends(
        selectedPeriod,
        selectedGroupBy
      );

      successResponse(res, trends);
    } catch (error) {
      logger.error('Error getting capture trends:', error);
      next(error);
    }
  }

  /**
   * GET /api/recurrence/leads/:leadId/captures
   * Histórico de capturas de um lead
   */
  async getLeadCaptureHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { leadId } = req.params;

      const history = await leadRecurrenceService.getLeadCaptureHistory(leadId);

      successResponse(res, history);
    } catch (error) {
      logger.error('Error getting lead capture history:', error);
      next(error);
    }
  }
}

export const recurrenceController = new RecurrenceController();
