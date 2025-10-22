import { Router } from 'express';
import { whatsappAutomationController } from './whatsapp-automation.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// ============================================================================
// WhatsApp Automation Routes
// All routes require authentication
// ============================================================================

// Statistics
router.get('/stats', authenticate, whatsappAutomationController.getStats);
router.get('/anti-spam-stats', authenticate, whatsappAutomationController.getAntiSpamStats);

// Emergency controls
router.post('/reset-anti-spam', authenticate, whatsappAutomationController.resetAntiSpam);

// Failed automations
router.get('/failed', authenticate, whatsappAutomationController.findAllFailed);
router.post('/retry-all-failed', authenticate, whatsappAutomationController.retryAllFailed);

// CRUD Operations
router.post('/', authenticate, whatsappAutomationController.create);
router.get('/', authenticate, whatsappAutomationController.findAll);
router.get('/:id', authenticate, whatsappAutomationController.findById);

// Retry
router.post('/:id/retry', authenticate, whatsappAutomationController.retry);

// By Lead
router.get('/lead/:leadId', authenticate, whatsappAutomationController.findByLeadId);

export default router;
