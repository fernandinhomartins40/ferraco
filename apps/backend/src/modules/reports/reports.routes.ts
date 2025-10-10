// ============================================================================
// Reports Module - Routes
// ============================================================================

import { Router } from 'express';
import { reportsController } from './reports.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import {
  CreateReportSchema,
  UpdateReportSchema,
  ScheduleReportSchema,
  FunnelAnalyticsSchema,
  CohortAnalysisSchema,
  PerformanceMetricsSchema,
} from './reports.validators';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// ============================================================================
// CRUD Routes
// ============================================================================

router.get('/', reportsController.findAll.bind(reportsController));
router.get('/:id', reportsController.findById.bind(reportsController));
router.post('/', validate(CreateReportSchema), reportsController.create.bind(reportsController));
router.put('/:id', validate(UpdateReportSchema), reportsController.update.bind(reportsController));
router.delete('/:id', reportsController.delete.bind(reportsController));

// ============================================================================
// Generation & Download Routes
// ============================================================================

router.post('/:id/generate', reportsController.generate.bind(reportsController));
router.get('/:id/download', reportsController.download.bind(reportsController));

// ============================================================================
// Scheduling Routes
// ============================================================================

router.post('/:id/schedule', validate(ScheduleReportSchema), reportsController.schedule.bind(reportsController));
router.get('/scheduled/list', reportsController.getScheduled.bind(reportsController));

// ============================================================================
// Analytics Routes
// ============================================================================

router.get(
  '/analytics/funnel',
  validate(FunnelAnalyticsSchema),
  reportsController.getFunnelAnalytics.bind(reportsController)
);
router.get(
  '/analytics/cohort',
  validate(CohortAnalysisSchema),
  reportsController.getCohortAnalysis.bind(reportsController)
);
router.get(
  '/analytics/performance',
  validate(PerformanceMetricsSchema),
  reportsController.getPerformanceMetrics.bind(reportsController)
);

export default router;
