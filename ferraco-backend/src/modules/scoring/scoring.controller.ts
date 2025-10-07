import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { ScoringService } from './scoring.service';
import { successResponse } from '../../utils/response';

const scoringService = new ScoringService();

export class ScoringController {
  /**
   * POST /api/scoring/calculate/:leadId
   */
  async calculateLeadScore(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { leadId } = req.params;
      const score = await scoringService.calculateLeadScore(leadId);
      res.json(successResponse({ score }, 'Score calculado com sucesso'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/scoring/recalculate-all
   */
  async recalculateAllScores(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await scoringService.recalculateAllScores();
      res.json(successResponse(result, 'Scores recalculados com sucesso'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/scoring/top-leads
   */
  async getTopScoredLeads(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { limit } = req.query;
      const leads = await scoringService.getTopScoredLeads(
        limit ? parseInt(limit as string) : undefined
      );
      res.json(successResponse(leads, 'Leads com maior score obtidos com sucesso'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/scoring/distribution
   */
  async getScoreDistribution(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const distribution = await scoringService.getScoreDistribution();
      res.json(successResponse(distribution, 'Distribuição de scores obtida com sucesso'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/scoring/rules
   */
  async getScoringRules(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const rules = scoringService.getScoringRules();
      res.json(successResponse(rules, 'Regras de pontuação obtidas com sucesso'));
    } catch (error) {
      next(error);
    }
  }
}
