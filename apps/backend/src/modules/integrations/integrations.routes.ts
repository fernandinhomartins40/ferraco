// ============================================================================
// Integrations Module - Routes
// ============================================================================

import { Router } from 'express';
import { integrationsController } from './integrations.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import {
  CreateIntegrationSchema,
  UpdateIntegrationSchema,
  WebhookPayloadSchema,
} from './integrations.validators';

const router = Router();

// ============================================================================
// CRUD Routes (require authentication)
// ============================================================================

router.get('/', authenticate, integrationsController.findAll.bind(integrationsController));
router.get('/:id', authenticate, integrationsController.findById.bind(integrationsController));
router.post('/', authenticate, validate({ body: CreateIntegrationSchema }), integrationsController.create.bind(integrationsController));
router.put('/:id', authenticate, validate({ body: UpdateIntegrationSchema }), integrationsController.update.bind(integrationsController));
router.delete('/:id', authenticate, integrationsController.delete.bind(integrationsController));

// ============================================================================
// Test & Sync Routes (require authentication)
// ============================================================================

router.post('/:id/test', authenticate, integrationsController.test.bind(integrationsController));
router.post('/:id/sync', authenticate, integrationsController.sync.bind(integrationsController));

// ============================================================================
// Logs Routes (require authentication)
// ============================================================================

router.get('/:id/logs', authenticate, integrationsController.getLogs.bind(integrationsController));

// ============================================================================
// Webhook Routes (public - no authentication)
// ============================================================================

router.post('/webhooks/zapier', validate({ body: WebhookPayloadSchema }), integrationsController.handleZapierWebhook.bind(integrationsController));
router.post('/webhooks/make', validate({ body: WebhookPayloadSchema }), integrationsController.handleMakeWebhook.bind(integrationsController));

export default router;
