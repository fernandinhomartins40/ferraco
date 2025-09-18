const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const logger = require('../utils/logger');

// Middleware para log de acesso ao dashboard
router.use((req, res, next) => {
  logger.info('Acesso às rotas do dashboard', {
    method: req.method,
    url: req.url,
    userId: req.user?.id,
    userRole: req.user?.role,
    ip: req.ip,
  });
  next();
});

/**
 * @swagger
 * /api/dashboard/metrics:
 *   get:
 *     summary: Obter métricas gerais do dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Métricas do dashboard recuperadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     leadsCount:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         novo:
 *                           type: number
 *                         emAndamento:
 *                           type: number
 *                         concluido:
 *                           type: number
 *                     tagsCount:
 *                       type: number
 *                     notesCount:
 *                       type: number
 *                     communicationsCount:
 *                       type: number
 *                     conversionRate:
 *                       type: number
 *                     averageLeadScore:
 *                       type: number
 *                     topSources:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           source:
 *                             type: string
 *                           count:
 *                             type: number
 *                           percentage:
 *                             type: number
 *                     recentActivity:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           type:
 *                             type: string
 *                           description:
 *                             type: string
 *                           timestamp:
 *                             type: string
 *                           leadId:
 *                             type: string
 *                           leadName:
 *                             type: string
 *                     trends:
 *                       type: object
 *                       properties:
 *                         leadsLastWeek:
 *                           type: number
 *                         leadsThisWeek:
 *                           type: number
 *                         conversionsLastWeek:
 *                           type: number
 *                         conversionsThisWeek:
 *                           type: number
 *                     lastUpdated:
 *                       type: string
 *       401:
 *         description: Token inválido ou expirado
 *       403:
 *         description: Permissão insuficiente
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/metrics',
  authenticateToken,
  requirePermission('leads:read'),
  dashboardController.getMetrics
);

/**
 * @swagger
 * /api/dashboard/detailed-metrics:
 *   get:
 *     summary: Obter métricas detalhadas do dashboard com filtros de período
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [1d, 7d, 30d, 90d]
 *           default: 7d
 *         description: Período para as métricas
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início (formato YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim (formato YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Métricas detalhadas recuperadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     period:
 *                       type: object
 *                       properties:
 *                         start:
 *                           type: string
 *                         end:
 *                           type: string
 *                         days:
 *                           type: number
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalLeads:
 *                           type: number
 *                         conversions:
 *                           type: number
 *                         conversionRate:
 *                           type: number
 *                     charts:
 *                       type: object
 *                       properties:
 *                         dailyData:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               date:
 *                                 type: string
 *                               leads:
 *                                 type: number
 *                               conversions:
 *                                 type: number
 *                         statusDistribution:
 *                           type: object
 *                         sourceDistribution:
 *                           type: object
 *       401:
 *         description: Token inválido ou expirado
 *       403:
 *         description: Permissão insuficiente
 *       500:
 *         description: Erro interno do servidor
 */
// Rota removida - getDetailedMetrics não implementada para reduzir complexidade

// Middleware de tratamento de erros específico para dashboard
router.use((error, req, res, next) => {
  logger.error('Erro nas rotas do dashboard', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    userId: req.user?.id,
  });

  res.status(500).json({
    success: false,
    message: 'Erro interno nas métricas do dashboard',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno do servidor',
  });
});

module.exports = router;