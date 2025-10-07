import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { AutomationsService } from './automations.service';
import { successResponse } from '../../utils/response';

const automationsService = new AutomationsService();

export class AutomationsController {
  /**
   * GET /api/automations
   */
  async getAutomations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { isActive, triggerType, search, page, limit } = req.query;

      const result = await automationsService.getAutomations({
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        triggerType: triggerType as string,
        search: search as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json(successResponse(result, 'Automações listadas com sucesso'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/automations/:id
   */
  async getAutomationById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const automation = await automationsService.getAutomationById(id);
      res.json(successResponse(automation, 'Automação encontrada'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/automations
   */
  async createAutomation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const automation = await automationsService.createAutomation(req.body);
      res.status(201).json(successResponse(automation, 'Automação criada com sucesso'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/automations/:id
   */
  async updateAutomation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const automation = await automationsService.updateAutomation(id, req.body);
      res.json(successResponse(automation, 'Automação atualizada com sucesso'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/automations/:id
   */
  async deleteAutomation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await automationsService.deleteAutomation(id);
      res.json(successResponse(result, 'Automação deletada com sucesso'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/automations/:id/toggle
   */
  async toggleAutomationStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const automation = await automationsService.toggleAutomationStatus(id);
      res.json(successResponse(automation, 'Status da automação alterado com sucesso'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/automations/:id/execute
   */
  async executeAutomation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { leadId } = req.body;
      const result = await automationsService.executeAutomation(id, leadId);
      res.json(successResponse(result, 'Automação executada com sucesso'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/automations/:id/logs
   */
  async getAutomationLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { success, page, limit } = req.query;

      const result = await automationsService.getAutomationLogs(id, {
        success: success === 'true' ? true : success === 'false' ? false : undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json(successResponse(result, 'Logs listados com sucesso'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/automations/stats
   */
  async getAutomationStats(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const stats = await automationsService.getAutomationStats();
      res.json(successResponse(stats, 'Estatísticas obtidas com sucesso'));
    } catch (error) {
      next(error);
    }
  }
}
