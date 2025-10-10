import { Router } from 'express';
import { CommunicationsController } from './communications.controller';
import { authenticate } from '../../middleware/auth';

// ============================================================================
// Communications Routes
// ============================================================================

const router = Router();
const controller = new CommunicationsController();

// ========================================================================
// Message Sending Routes (4 endpoints) - All require authentication
// ========================================================================

// POST /api/communications/whatsapp - Send WhatsApp message
router.post('/whatsapp', authenticate, controller.sendWhatsApp);

// POST /api/communications/email - Send Email
router.post('/email', authenticate, controller.sendEmail);

// POST /api/communications/sms - Send SMS
router.post('/sms', authenticate, controller.sendSMS);

// POST /api/communications/call - Register call
router.post('/call', authenticate, controller.registerCall);

// ========================================================================
// Template Routes (4 endpoints) - All require authentication
// ========================================================================

// GET /api/communications/templates - List templates
router.get('/templates', authenticate, controller.listTemplates);

// POST /api/communications/templates - Create template
router.post('/templates', authenticate, controller.createTemplate);

// PUT /api/communications/templates/:id - Update template
router.put('/templates/:id', authenticate, controller.updateTemplate);

// DELETE /api/communications/templates/:id - Delete template
router.delete('/templates/:id', authenticate, controller.deleteTemplate);

// ========================================================================
// History Routes (2 endpoints) - All require authentication
// ========================================================================

// GET /api/communications/history/:leadId - Get communication history for a lead
router.get('/history/:leadId', authenticate, controller.getHistory);

// GET /api/communications/:id - Get specific communication
router.get('/:id', authenticate, controller.getCommunication);

// ========================================================================
// Webhook Routes (2 endpoints) - NO authentication (external services)
// ========================================================================

// POST /api/communications/webhook/whatsapp - WhatsApp status webhook
router.post('/webhook/whatsapp', controller.handleWhatsAppWebhook);

// POST /api/communications/webhook/sendgrid - SendGrid event webhook
router.post('/webhook/sendgrid', controller.handleSendGridWebhook);

export default router;
