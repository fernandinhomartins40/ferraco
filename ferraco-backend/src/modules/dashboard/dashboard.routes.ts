import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { authMiddleware } from '../../middleware/auth';

const router = Router();
const dashboardController = new DashboardController();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

/**
 * @route GET /api/dashboard/metrics
 * @desc Obter métricas gerais do dashboard
 * @access Private
 */
router.get(
  '/metrics',
  dashboardController.getMetrics.bind(dashboardController)
);

/**
 * @route GET /api/dashboard/detailed-metrics
 * @desc Obter métricas detalhadas com filtros
 * @access Private
 */
router.get(
  '/detailed-metrics',
  dashboardController.getDetailedMetrics.bind(dashboardController)
);

export default router;
