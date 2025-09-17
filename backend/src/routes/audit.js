const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticateToken, requirePermission, requireRole } = require('../middleware/authMiddleware');

// Middleware de autenticação para todas as rotas
router.use(authenticateToken);

// ==========================================
// CONSULTA DE LOGS DE AUDITORIA
// ==========================================

/**
 * @route GET /api/audit/logs
 * @desc Listar logs de auditoria
 * @query userId, userName, action, resource, success, startDate, endDate, ipAddress, page, limit, sortBy, sortOrder
 * @access Private (Admin/Manager com permissão)
 */
router.get('/logs', requirePermission('audit.read'), auditController.listAuditLogs);

/**
 * @route GET /api/audit/stats
 * @desc Obter estatísticas de auditoria
 * @query period - day, week, month, quarter, year
 * @access Private (Admin/Manager)
 */
router.get('/stats', requirePermission('audit.read'), auditController.getAuditStats);

/**
 * @route GET /api/audit/users/:userId/logs
 * @desc Obter logs de auditoria de um usuário específico
 * @access Private (Admin/Manager)
 */
router.get('/users/:userId/logs', requirePermission('audit.read'), auditController.getUserAuditLogs);

/**
 * @route GET /api/audit/dashboard
 * @desc Dashboard de auditoria (resumo executivo)
 * @query period
 * @access Private (Admin/Manager)
 */
router.get('/dashboard', requirePermission('audit.read'), auditController.getAuditDashboard);

// ==========================================
// EVENTOS DE SEGURANÇA
// ==========================================

/**
 * @route GET /api/audit/security/events
 * @desc Obter eventos de segurança suspeitos
 * @query severity, period, page, limit
 * @access Private (Admin only)
 */
router.get('/security/events', requireRole('Admin'), auditController.getSecurityEvents);

// ==========================================
// RELATÓRIOS E COMPLIANCE
// ==========================================

/**
 * @route GET /api/audit/compliance/report
 * @desc Gerar relatório de compliance
 * @query period
 * @access Private (Admin only)
 */
router.get('/compliance/report', requireRole('Admin'), auditController.generateComplianceReport);

/**
 * @route GET /api/audit/export
 * @desc Exportar logs de auditoria
 * @query format (json/csv), outros filtros de logs
 * @access Private (Admin/Manager)
 */
router.get('/export', requirePermission('audit.export'), auditController.exportAuditLogs);

// ==========================================
// BUSCA E PESQUISA
// ==========================================

/**
 * @route POST /api/audit/search
 * @desc Buscar em logs de auditoria
 * @body query, field (user/action/resource/ip/all)
 * @access Private (Admin/Manager)
 */
router.post('/search', requirePermission('audit.read'), auditController.searchAuditLogs);

// ==========================================
// MANUTENÇÃO E ADMINISTRAÇÃO
// ==========================================

/**
 * @route DELETE /api/audit/cleanup
 * @desc Limpar logs antigos baseado em política de retenção
 * @body retentionDays
 * @access Private (Admin only)
 */
router.delete('/cleanup', requireRole('Admin'), auditController.cleanupOldLogs);

module.exports = router;