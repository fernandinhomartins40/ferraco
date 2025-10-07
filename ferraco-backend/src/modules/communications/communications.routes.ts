import { Router } from 'express';
import { CommunicationsController } from './communications.controller';
import { authMiddleware } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import {
  createCommunicationSchema,
  updateCommunicationSchema,
  getCommunicationByIdSchema,
  deleteCommunicationSchema,
  markAsReadSchema,
  getCommunicationsSchema,
  getCommunicationStatsSchema,
  sendEmailSchema,
  sendWhatsAppSchema,
} from './communications.validators';

const router = Router();
const communicationsController = new CommunicationsController();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

/**
 * GET /api/communications/stats
 * Obter estatísticas de comunicações
 */
router.get('/stats', validate(getCommunicationStatsSchema), communicationsController.getCommunicationStats.bind(communicationsController));

/**
 * POST /api/communications/email
 * Enviar email para lead
 */
router.post('/email', validate(sendEmailSchema), communicationsController.sendEmail.bind(communicationsController));

/**
 * POST /api/communications/whatsapp
 * Enviar WhatsApp para lead
 */
router.post('/whatsapp', validate(sendWhatsAppSchema), communicationsController.sendWhatsApp.bind(communicationsController));

/**
 * GET /api/communications
 * Listar comunicações com filtros
 */
router.get('/', validate(getCommunicationsSchema), communicationsController.getCommunications.bind(communicationsController));

/**
 * GET /api/communications/:id
 * Obter comunicação por ID
 */
router.get('/:id', validate(getCommunicationByIdSchema), communicationsController.getCommunicationById.bind(communicationsController));

/**
 * POST /api/communications
 * Criar nova comunicação
 */
router.post('/', validate(createCommunicationSchema), communicationsController.createCommunication.bind(communicationsController));

/**
 * PUT /api/communications/:id
 * Atualizar comunicação
 */
router.put('/:id', validate(updateCommunicationSchema), communicationsController.updateCommunication.bind(communicationsController));

/**
 * DELETE /api/communications/:id
 * Deletar comunicação
 */
router.delete('/:id', validate(deleteCommunicationSchema), communicationsController.deleteCommunication.bind(communicationsController));

/**
 * PATCH /api/communications/:id/read
 * Marcar comunicação como lida
 */
router.patch('/:id/read', validate(markAsReadSchema), communicationsController.markAsRead.bind(communicationsController));

export default router;
