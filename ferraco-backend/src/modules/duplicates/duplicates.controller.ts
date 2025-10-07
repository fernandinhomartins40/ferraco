import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { DuplicatesService } from './duplicates.service';
import { successResponse } from '../../utils/response';

const duplicatesService = new DuplicatesService();

export class DuplicatesController {
  /**
   * GET /api/duplicates/find/:leadId
   */
  async findDuplicates(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { leadId } = req.params;
      const result = await duplicatesService.findDuplicates(leadId);
      res.json(successResponse(result, 'Busca por duplicatas concluída'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/duplicates/mark
   */
  async markAsDuplicate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { leadId, duplicateOfId } = req.body;
      const result = await duplicatesService.markAsDuplicate(leadId, duplicateOfId);
      res.json(successResponse(result, 'Lead marcado como duplicata'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/duplicates/unmark/:leadId
   */
  async unmarkAsDuplicate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { leadId } = req.params;
      const result = await duplicatesService.unmarkAsDuplicate(leadId);
      res.json(successResponse(result, 'Lead desmarcado como duplicata'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/duplicates/merge
   */
  async mergeLeads(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { sourceId, targetId } = req.body;
      const result = await duplicatesService.mergeLeads(sourceId, targetId);
      res.json(successResponse(result, 'Leads mesclados com sucesso'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/duplicates/list
   */
  async getDuplicateLeads(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const duplicates = await duplicatesService.getDuplicateLeads();
      res.json(successResponse(duplicates, 'Duplicatas listadas com sucesso'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/duplicates/scan
   */
  async scanAllLeads(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await duplicatesService.scanAllLeads();
      res.json(successResponse(result, 'Varredura de duplicatas concluída'));
    } catch (error) {
      next(error);
    }
  }
}
