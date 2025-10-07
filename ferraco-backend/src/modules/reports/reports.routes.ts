import { Router } from 'express';
import { ReportsController } from './reports.controller';
import { authMiddleware } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import {
  createReportSchema,
  updateReportSchema,
  getReportByIdSchema,
  deleteReportSchema,
  getReportsSchema,
  generateLeadsReportSchema,
  generateCommunicationsReportSchema,
  generateSalesFunnelReportSchema,
  generateUserPerformanceReportSchema,
} from './reports.validators';

const router = Router();
const reportsController = new ReportsController();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

/**
 * POST /api/reports/generate/leads
 * Gerar relatório de leads
 */
router.post('/generate/leads', validate(generateLeadsReportSchema), reportsController.generateLeadsReport.bind(reportsController));

/**
 * POST /api/reports/generate/communications
 * Gerar relatório de comunicações
 */
router.post('/generate/communications', validate(generateCommunicationsReportSchema), reportsController.generateCommunicationsReport.bind(reportsController));

/**
 * POST /api/reports/generate/sales-funnel
 * Gerar relatório de funil de vendas
 */
router.post('/generate/sales-funnel', validate(generateSalesFunnelReportSchema), reportsController.generateSalesFunnelReport.bind(reportsController));

/**
 * POST /api/reports/generate/user-performance
 * Gerar relatório de performance de usuários
 */
router.post('/generate/user-performance', validate(generateUserPerformanceReportSchema), reportsController.generateUserPerformanceReport.bind(reportsController));

/**
 * GET /api/reports
 * Listar relatórios
 */
router.get('/', validate(getReportsSchema), reportsController.getReports.bind(reportsController));

/**
 * GET /api/reports/:id
 * Obter relatório por ID
 */
router.get('/:id', validate(getReportByIdSchema), reportsController.getReportById.bind(reportsController));

/**
 * POST /api/reports
 * Criar novo relatório
 */
router.post('/', validate(createReportSchema), reportsController.createReport.bind(reportsController));

/**
 * PUT /api/reports/:id
 * Atualizar relatório
 */
router.put('/:id', validate(updateReportSchema), reportsController.updateReport.bind(reportsController));

/**
 * DELETE /api/reports/:id
 * Deletar relatório
 */
router.delete('/:id', validate(deleteReportSchema), reportsController.deleteReport.bind(reportsController));

export default router;
