const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const authMiddleware = require('../middleware/auth');

// Middleware de autenticação para todas as rotas
router.use(authMiddleware);

// ==========================================
// JOB MANAGEMENT
// ==========================================

/**
 * @route GET /api/jobs
 * @desc Listar todos os jobs
 * @query type, status, priority, page, limit, sortBy, sortOrder
 * @access Private
 */
router.get('/', jobController.listJobs);

/**
 * @route GET /api/jobs/:id
 * @desc Obter um job específico
 * @access Private
 */
router.get('/:id', jobController.getJob);

/**
 * @route POST /api/jobs
 * @desc Criar um novo job
 * @body type, name, data, priority, maxAttempts, scheduledAt
 * @access Private
 */
router.post('/', jobController.createJob);

/**
 * @route PUT /api/jobs/:id/cancel
 * @desc Cancelar um job
 * @access Private
 */
router.put('/:id/cancel', jobController.cancelJob);

/**
 * @route PUT /api/jobs/:id/retry
 * @desc Reprocessar um job falhado
 * @access Private
 */
router.put('/:id/retry', jobController.retryJob);

// ==========================================
// JOB PROCESSING
// ==========================================

/**
 * @route POST /api/jobs/process
 * @desc Processar fila de jobs manualmente
 * @query type, limit
 * @access Private
 */
router.post('/process', jobController.processJobQueue);

/**
 * @route GET /api/jobs/status/running
 * @desc Obter jobs em execução
 * @access Private
 */
router.get('/status/running', jobController.getRunningJobs);

/**
 * @route PUT /api/jobs/processing/pause
 * @desc Pausar processamento de jobs
 * @access Private (Admin only)
 */
router.put('/processing/pause', jobController.pauseJobProcessing);

/**
 * @route PUT /api/jobs/processing/resume
 * @desc Retomar processamento de jobs
 * @access Private (Admin only)
 */
router.put('/processing/resume', jobController.resumeJobProcessing);

// ==========================================
// JOB ANALYTICS
// ==========================================

/**
 * @route GET /api/jobs/stats
 * @desc Obter estatísticas dos jobs
 * @query period - day, week, month, quarter, year
 * @access Private
 */
router.get('/stats', jobController.getJobStats);

// ==========================================
// JOB CONFIGURATION
// ==========================================

/**
 * @route GET /api/jobs/types/available
 * @desc Obter tipos de jobs disponíveis
 * @access Private
 */
router.get('/types/available', jobController.getJobTypes);

/**
 * @route POST /api/jobs/schedule/recurring
 * @desc Agendar job recorrente
 * @body type, schedule, data
 * @access Private
 */
router.post('/schedule/recurring', jobController.scheduleRecurringJob);

// ==========================================
// JOB MAINTENANCE
// ==========================================

/**
 * @route DELETE /api/jobs/cleanup
 * @desc Limpar jobs antigos
 * @query days, status
 * @access Private (Admin only)
 */
router.delete('/cleanup', jobController.cleanupOldJobs);

module.exports = router;