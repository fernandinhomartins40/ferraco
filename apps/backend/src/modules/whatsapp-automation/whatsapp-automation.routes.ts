import { Router } from 'express';
import { whatsappAutomationController } from './whatsapp-automation.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// ============================================================================
// WhatsApp Automation Routes
// All routes require authentication
// ============================================================================

// Statistics (rotas específicas PRIMEIRO)
router.get('/stats', authenticate, whatsappAutomationController.getStats);
router.get('/anti-spam-stats', authenticate, whatsappAutomationController.getAntiSpamStats);

// Emergency controls (rotas específicas PRIMEIRO)
router.post('/reset-anti-spam', authenticate, whatsappAutomationController.resetAntiSpam);

// Failed automations (rotas específicas PRIMEIRO)
router.get('/failed', authenticate, whatsappAutomationController.findAllFailed);
router.post('/retry-all-failed', authenticate, whatsappAutomationController.retryAllFailed);

// By Lead (rotas específicas PRIMEIRO)
router.get('/lead/:leadId', authenticate, whatsappAutomationController.findByLeadId);

// Retry (ANTES das rotas genéricas com :id)
router.post('/:id/retry', authenticate, whatsappAutomationController.retry);

// Schedule (rotas específicas de agendamento)
router.patch('/:id/schedule', authenticate, whatsappAutomationController.updateSchedule);
router.post('/:id/send-now', authenticate, whatsappAutomationController.sendNow);

// CRUD Operations (rotas genéricas POR ÚLTIMO)
router.post('/', authenticate, whatsappAutomationController.create);
router.get('/', authenticate, whatsappAutomationController.findAll);
router.get('/:id', authenticate, whatsappAutomationController.findById);

export default router;
