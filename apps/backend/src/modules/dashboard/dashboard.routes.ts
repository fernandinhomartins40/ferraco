// ============================================================================
// Dashboard Module - Routes
// ============================================================================

import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import {
  CreateWidgetSchema,
  UpdateWidgetSchema,
  SaveLayoutSchema,
  GetMetricsSchema,
  GetRecentActivitySchema,
  GetLeadsOverTimeSchema,
} from './dashboard.validators';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// ============================================================================
// Metrics Routes
// ============================================================================

router.get('/metrics', validate(GetMetricsSchema), dashboardController.getMetrics.bind(dashboardController));
router.get('/leads-by-status', dashboardController.getLeadsByStatus.bind(dashboardController));
router.get('/leads-by-source', dashboardController.getLeadsBySource.bind(dashboardController));
router.get(
  '/recent-activity',
  validate(GetRecentActivitySchema),
  dashboardController.getRecentActivity.bind(dashboardController)
);
router.get(
  '/leads-over-time',
  validate(GetLeadsOverTimeSchema),
  dashboardController.getLeadsOverTime.bind(dashboardController)
);

// ============================================================================
// Widgets Routes
// ============================================================================

router.post('/widgets', validate(CreateWidgetSchema), dashboardController.createWidget.bind(dashboardController));
router.put('/widgets', validate(UpdateWidgetSchema), dashboardController.updateWidget.bind(dashboardController));
router.delete('/widgets/:widgetId', dashboardController.deleteWidget.bind(dashboardController));

// ============================================================================
// Layout Routes
// ============================================================================

router.post('/layout', validate(SaveLayoutSchema), dashboardController.saveLayout.bind(dashboardController));

export default router;
