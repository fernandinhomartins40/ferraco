import { Router } from 'express';
import { ScoringController } from './scoring.controller';
import { authMiddleware } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import {
  calculateLeadScoreSchema,
  getTopScoredLeadsSchema,
} from './scoring.validators';

const router = Router();
const scoringController = new ScoringController();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

/**
 * GET /api/scoring/rules
 * Obter regras de pontuação
 */
router.get('/rules', scoringController.getScoringRules.bind(scoringController));

/**
 * GET /api/scoring/distribution
 * Obter distribuição de scores
 */
router.get('/distribution', scoringController.getScoreDistribution.bind(scoringController));

/**
 * GET /api/scoring/top-leads
 * Obter leads com maior score
 */
router.get('/top-leads', validate(getTopScoredLeadsSchema), scoringController.getTopScoredLeads.bind(scoringController));

/**
 * POST /api/scoring/calculate/:leadId
 * Calcular score de um lead específico
 */
router.post('/calculate/:leadId', validate(calculateLeadScoreSchema), scoringController.calculateLeadScore.bind(scoringController));

/**
 * POST /api/scoring/recalculate-all
 * Recalcular scores de todos os leads
 */
router.post('/recalculate-all', scoringController.recalculateAllScores.bind(scoringController));

export default router;
