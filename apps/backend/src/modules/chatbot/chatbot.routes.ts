import { Router } from 'express';
import { ChatbotController } from './chatbot.controller';
import { ChatbotSessionController } from './chatbot-session.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();
const chatbotController = new ChatbotController();
const sessionController = new ChatbotSessionController();

// ============================================
// Config Routes (Admin only)
// ============================================

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

// ============================================
// Session Routes (Public - para /chat)
// ============================================

/**
 * POST /api/chatbot/session/start
 * Inicia uma nova sessão de chatbot
 * Público - não requer autenticação
 */
router.post('/session/start', sessionController.startSession);

/**
 * POST /api/chatbot/session/:sessionId/message
 * Envia mensagem na sessão
 * Público - não requer autenticação
 */
router.post('/session/:sessionId/message', sessionController.sendMessage);

/**
 * GET /api/chatbot/session/:sessionId/history
 * Busca histórico da sessão
 * Público - não requer autenticação
 */
router.get('/session/:sessionId/history', sessionController.getSessionHistory);

/**
 * POST /api/chatbot/session/:sessionId/end
 * Encerra uma sessão
 * Público - não requer autenticação
 */
router.post('/session/:sessionId/end', sessionController.endSession);

export default router;
