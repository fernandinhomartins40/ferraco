import { Router } from 'express';
import { webhookController } from './webhook.controller';
import { authenticateDual, requireApiKeyScope } from '../../middleware/apiKeyAuth';

const router = Router();

// Todas as rotas requerem autenticação via API Key
router.use(authenticateDual);
router.use(requireApiKeyScope('webhooks:manage'));

/**
 * @route   POST /api/v1/external/webhooks
 * @desc    Cria novo webhook
 * @access  API Key com scope 'webhooks:manage'
 */
router.post('/', webhookController.createWebhook.bind(webhookController));

/**
 * @route   GET /api/v1/external/webhooks
 * @desc    Lista todos os webhooks
 * @access  API Key com scope 'webhooks:manage'
 */
router.get('/', webhookController.listWebhooks.bind(webhookController));

/**
 * @route   GET /api/v1/external/webhooks/:id
 * @desc    Busca webhook por ID
 * @access  API Key com scope 'webhooks:manage'
 */
router.get('/:id', webhookController.getWebhook.bind(webhookController));

/**
 * @route   PUT /api/v1/external/webhooks/:id
 * @desc    Atualiza webhook
 * @access  API Key com scope 'webhooks:manage'
 */
router.put('/:id', webhookController.updateWebhook.bind(webhookController));

/**
 * @route   DELETE /api/v1/external/webhooks/:id
 * @desc    Deleta webhook
 * @access  API Key com scope 'webhooks:manage'
 */
router.delete('/:id', webhookController.deleteWebhook.bind(webhookController));

/**
 * @route   POST /api/v1/external/webhooks/:id/pause
 * @desc    Pausa webhook
 * @access  API Key com scope 'webhooks:manage'
 */
router.post('/:id/pause', webhookController.pauseWebhook.bind(webhookController));

/**
 * @route   POST /api/v1/external/webhooks/:id/activate
 * @desc    Ativa webhook
 * @access  API Key com scope 'webhooks:manage'
 */
router.post('/:id/activate', webhookController.activateWebhook.bind(webhookController));

/**
 * @route   POST /api/v1/external/webhooks/:id/test
 * @desc    Testa webhook enviando evento de teste
 * @access  API Key com scope 'webhooks:manage'
 */
router.post('/:id/test', webhookController.testWebhook.bind(webhookController));

/**
 * @route   GET /api/v1/external/webhooks/:id/deliveries
 * @desc    Lista deliveries de um webhook
 * @access  API Key com scope 'webhooks:manage'
 */
router.get('/:id/deliveries', webhookController.listDeliveries.bind(webhookController));

export default router;
