import { Router } from 'express';
import { ChatbotController } from './chatbot.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';

const router = Router();
const chatbotController = new ChatbotController();

/**
 * GET /api/chatbot/config
 * Busca configuração do chatbot
 * Requer autenticação e permissão config:read
 */
router.get('/config', authenticate, authorize(['config:read']), chatbotController.getConfig);

/**
 * PUT /api/chatbot/config
 * Atualiza configuração do chatbot
 * Requer autenticação e permissão config:update
 */
router.put('/config', authenticate, authorize(['config:update']), chatbotController.updateConfig);

export default router;
