/**
 * WhatsApp Routes - Rotas para integração WhatsApp
 *
 * Rotas disponíveis:
 * - GET /api/whatsapp/qr - Obter QR Code para conectar
 * - GET /api/whatsapp/status - Verificar status da conexão
 * - POST /api/whatsapp/send - Enviar mensagem
 * - GET /api/whatsapp/account - Informações da conta conectada
 * - POST /api/whatsapp/disconnect - Desconectar sessão
 *
 * Rotas de Chat:
 * - GET /api/whatsapp/conversations - Listar conversas
 * - GET /api/whatsapp/conversations/:id - Detalhes de uma conversa
 * - GET /api/whatsapp/conversations/:id/messages - Mensagens de uma conversa
 * - POST /api/whatsapp/conversations/:id/read - Marcar mensagens como lidas
 * - GET /api/whatsapp/search - Buscar conversas
 */

import { Router, Request, Response } from 'express';
import { whatsappService } from '../services/whatsappService';
import whatsappChatService from '../services/whatsappChatService';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/whatsapp/qr
 * Obter QR Code para conectar WhatsApp
 * Retorna imagem base64
 */
router.get('/qr', authenticate, async (req: Request, res: Response) => {
  try {
    const qrCode = whatsappService.getQRCode();

    if (!qrCode) {
      return res.status(404).json({
        success: false,
        message: 'QR Code não disponível. WhatsApp já está conectado ou aguardando inicialização.',
      });
    }

    // Retornar QR Code em base64
    res.json({
      success: true,
      qrCode: qrCode, // Já vem no formato data:image/png;base64,...
      message: 'Escaneie o QR Code com o WhatsApp no seu celular',
    });

  } catch (error: any) {
    logger.error('Erro ao obter QR Code:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao gerar QR Code',
      message: error.message,
    });
  }
});

/**
 * GET /api/whatsapp/status
 * Verificar status da conexão WhatsApp
 */
router.get('/status', authenticate, async (req: Request, res: Response) => {
  try {
    const status = whatsappService.getStatus();

    res.json({
      success: true,
      status: {
        connected: status.connected,
        hasQR: status.hasQR,
        message: status.connected
          ? 'WhatsApp conectado'
          : status.hasQR
          ? 'Aguardando leitura do QR Code'
          : 'Inicializando...',
      },
    });

  } catch (error: any) {
    logger.error('Erro ao verificar status:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar status',
      message: error.message,
    });
  }
});

/**
 * GET /api/whatsapp/account
 * Obter informações da conta WhatsApp conectada
 */
router.get('/account', authenticate, async (req: Request, res: Response) => {
  try {
    if (!whatsappService.isWhatsAppConnected()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está conectado',
      });
    }

    const accountInfo = await whatsappService.getAccountInfo();

    res.json({
      success: true,
      account: accountInfo,
    });

  } catch (error: any) {
    logger.error('Erro ao obter informações da conta:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter informações da conta',
      message: error.message,
    });
  }
});

/**
 * POST /api/whatsapp/send
 * Enviar mensagem de texto via WhatsApp
 *
 * Body:
 * {
 *   "to": "5511999999999",  // Número com código do país
 *   "message": "Olá! Mensagem de teste"
 * }
 */
router.post('/send', authenticate, async (req: Request, res: Response) => {
  try {
    const { to, message } = req.body;

    // Validações
    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros inválidos',
        message: 'Os campos "to" e "message" são obrigatórios',
      });
    }

    if (!whatsappService.isWhatsAppConnected()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está conectado. Escaneie o QR Code primeiro.',
      });
    }

    // Enviar mensagem
    await whatsappService.sendTextMessage(to, message);

    res.json({
      success: true,
      message: 'Mensagem enviada com sucesso',
      to,
    });

  } catch (error: any) {
    logger.error('Erro ao enviar mensagem:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao enviar mensagem',
      message: error.message,
    });
  }
});

/**
 * POST /api/whatsapp/disconnect
 * Desconectar sessão WhatsApp
 */
router.post('/disconnect', authenticate, async (req: Request, res: Response) => {
  try {
    await whatsappService.disconnect();

    res.json({
      success: true,
      message: 'WhatsApp desconectado com sucesso',
    });

  } catch (error: any) {
    logger.error('Erro ao desconectar WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao desconectar WhatsApp',
      message: error.message,
    });
  }
});

/**
 * POST /api/whatsapp/reinitialize
 * Reinicializar WhatsApp (gerar novo QR code)
 */
router.post('/reinitialize', authenticate, async (req: Request, res: Response) => {
  try {
    await whatsappService.reinitialize();

    res.json({
      success: true,
      message: 'WhatsApp reinicializado. Novo QR Code será gerado em alguns segundos.',
    });

  } catch (error: any) {
    logger.error('Erro ao reinicializar WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao reinicializar WhatsApp',
      message: error.message,
    });
  }
});

// ============================================================================
// ROTAS DE CHAT
// ============================================================================

/**
 * GET /api/whatsapp/conversations
 * Listar todas as conversas (ordenadas por última mensagem)
 */
router.get('/conversations', authenticate, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const conversations = await whatsappChatService.getConversations(limit);

    res.json({
      success: true,
      conversations,
      total: conversations.length,
    });

  } catch (error: any) {
    logger.error('Erro ao listar conversas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar conversas',
      message: error.message,
    });
  }
});

/**
 * GET /api/whatsapp/conversations/:id
 * Obter detalhes de uma conversa específica
 */
router.get('/conversations/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const conversation = await whatsappChatService.getConversation(id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversa não encontrada',
      });
    }

    res.json({
      success: true,
      conversation,
    });

  } catch (error: any) {
    logger.error('Erro ao obter conversa:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter conversa',
      message: error.message,
    });
  }
});

/**
 * GET /api/whatsapp/conversations/:id/messages
 * Listar mensagens de uma conversa (com paginação)
 */
router.get('/conversations/:id/messages', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    const messages = await whatsappChatService.getMessages(id, limit, offset);

    res.json({
      success: true,
      messages,
      total: messages.length,
      limit,
      offset,
    });

  } catch (error: any) {
    logger.error('Erro ao listar mensagens:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar mensagens',
      message: error.message,
    });
  }
});

/**
 * POST /api/whatsapp/conversations/:id/load-history
 * Carregar histórico completo de mensagens de uma conversa
 */
router.post('/conversations/:id/load-history', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Carregar histórico em background
    whatsappChatService.loadChatHistory(id).catch((error) => {
      logger.error('Erro ao carregar histórico em background:', error);
    });

    res.json({
      success: true,
      message: 'Carregando histórico de mensagens em background...',
    });

  } catch (error: any) {
    logger.error('Erro ao iniciar carregamento de histórico:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao carregar histórico',
      message: error.message,
    });
  }
});

/**
 * POST /api/whatsapp/sync-chats
 * Sincronizar todos os chats e contatos do WhatsApp
 */
router.post('/sync-chats', authenticate, async (req: Request, res: Response) => {
  try {
    if (!whatsappService.isWhatsAppConnected()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está conectado',
      });
    }

    // Sincronizar em background
    whatsappChatService.syncAllChatsAndContacts().catch((error) => {
      logger.error('Erro ao sincronizar chats em background:', error);
    });

    res.json({
      success: true,
      message: 'Sincronizando chats e contatos em background...',
    });

  } catch (error: any) {
    logger.error('Erro ao iniciar sincronização:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao sincronizar chats',
      message: error.message,
    });
  }
});

/**
 * POST /api/whatsapp/conversations/:id/read
 * Marcar mensagens de uma conversa como lidas
 *
 * Body:
 * {
 *   "messageIds": ["msg1", "msg2", ...]  // Opcional: IDs específicos
 * }
 */
router.post('/conversations/:id/read', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { messageIds } = req.body;

    if (messageIds && Array.isArray(messageIds)) {
      // Marcar mensagens específicas
      await whatsappChatService.markAsRead(messageIds);
    }

    // Atualizar contador de não lidas
    const unreadCount = await whatsappChatService.updateUnreadCount(id);

    res.json({
      success: true,
      message: 'Mensagens marcadas como lidas',
      unreadCount,
    });

  } catch (error: any) {
    logger.error('Erro ao marcar mensagens como lidas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao marcar mensagens como lidas',
      message: error.message,
    });
  }
});

/**
 * GET /api/whatsapp/search
 * Buscar conversas por nome ou telefone
 *
 * Query params:
 * - q: termo de busca
 */
router.get('/search', authenticate, async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Query de busca deve ter pelo menos 2 caracteres',
      });
    }

    const conversations = await whatsappChatService.searchConversations(query.trim());

    res.json({
      success: true,
      conversations,
      total: conversations.length,
      query,
    });

  } catch (error: any) {
    logger.error('Erro ao buscar conversas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar conversas',
      message: error.message,
    });
  }
});

export default router;
