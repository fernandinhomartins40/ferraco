const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');
const { authenticateToken } = require('../middleware/auth');

// Middleware de autenticação para todas as rotas
router.use(authenticateToken);

// ==========================================
// WEBHOOK MANAGEMENT
// ==========================================

/**
 * @route GET /api/webhooks
 * @desc Listar todos os webhooks
 * @query isActive, event, page, limit
 * @access Private
 */
router.get('/', webhookController.listWebhooks);

/**
 * @route GET /api/webhooks/:id
 * @desc Obter um webhook específico
 * @access Private
 */
router.get('/:id', webhookController.getWebhook);

/**
 * @route POST /api/webhooks
 * @desc Criar um novo webhook
 * @body name, url, events[], headers, secret, retryPolicy
 * @access Private
 */
router.post('/', webhookController.createWebhook);

/**
 * @route PUT /api/webhooks/:id
 * @desc Atualizar um webhook
 * @access Private
 */
router.put('/:id', webhookController.updateWebhook);

/**
 * @route DELETE /api/webhooks/:id
 * @desc Excluir um webhook
 * @access Private
 */
router.delete('/:id', webhookController.deleteWebhook);

// ==========================================
// WEBHOOK OPERATIONS
// ==========================================

/**
 * @route PUT /api/webhooks/:id/toggle
 * @desc Ativar ou desativar um webhook
 * @body active (boolean)
 * @access Private
 */
router.put('/:id/toggle', webhookController.toggleWebhookStatus);

/**
 * @route POST /api/webhooks/:id/test
 * @desc Testar um webhook
 * @body testPayload (optional)
 * @access Private
 */
router.post('/:id/test', webhookController.testWebhook);

/**
 * @route POST /api/webhooks/:id/trigger
 * @desc Dispara webhook manualmente
 * @body event, payload
 * @access Private
 */
router.post('/:id/trigger', webhookController.triggerWebhook);

// ==========================================
// WEBHOOK DELIVERIES
// ==========================================

/**
 * @route GET /api/webhooks/:id/deliveries
 * @desc Obter entregas de um webhook
 * @query status, event, page, limit
 * @access Private
 */
router.get('/:id/deliveries', webhookController.getWebhookDeliveries);

/**
 * @route POST /api/webhooks/deliveries/:deliveryId/retry
 * @desc Reenviar entrega falhada
 * @access Private
 */
router.post('/deliveries/:deliveryId/retry', webhookController.retryWebhookDelivery);

// ==========================================
// WEBHOOK ANALYTICS
// ==========================================

/**
 * @route GET /api/webhooks/:id/stats
 * @desc Obter estatísticas de um webhook
 * @query period - day, week, month, quarter, year
 * @access Private
 */
router.get('/:id/stats', webhookController.getWebhookStats);

/**
 * @route GET /api/webhooks/:id/logs
 * @desc Obter logs de webhook para debug
 * @query limit
 * @access Private
 */
router.get('/:id/logs', webhookController.getWebhookLogs);

// ==========================================
// WEBHOOK CONFIGURATION
// ==========================================

/**
 * @route GET /api/webhooks/events/available
 * @desc Obter eventos disponíveis para webhooks
 * @access Private
 */
router.get('/events/available', webhookController.getAvailableEvents);

module.exports = router;