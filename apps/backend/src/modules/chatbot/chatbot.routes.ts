import { Router } from 'express';
import { ChatbotController } from './chatbot.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();
const chatbotController = new ChatbotController();

/**
 * GET /api/chatbot/config
 * Busca configuração do chatbot
 * Requer autenticação e role ADMIN
 */
router.get('/config', authenticate, requireRole('ADMIN'), chatbotController.getConfig);

/**
 * PUT /api/chatbot/config
 * Atualiza configuração do chatbot
 * Requer autenticação e role ADMIN
 */
router.put('/config', authenticate, requireRole('ADMIN'), chatbotController.updateConfig);

export default router;
