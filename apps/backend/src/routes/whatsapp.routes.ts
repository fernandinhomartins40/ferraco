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
import evolutionService from '../services/evolutionService';
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
    const qrCode = evolutionService.getQRCode();

    if (!qrCode) {
      return res.status(404).json({
        success: false,
        message: 'QR Code não disponível. WhatsApp já está conectado ou aguardando inicialização.',
      });
    }

    res.json({
      success: true,
      qrCode: qrCode,
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
    const status = evolutionService.getConnectionStatus();

    res.json({
      success: true,
      status: {
        connected: status.isConnected,
        hasQR: status.hasQR,
        message: status.isConnected
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
    const status = evolutionService.getConnectionStatus();

    if (!status.isConnected) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está conectado',
      });
    }

    const accountInfo = evolutionService.getAccountInfo();

    res.json({
      success: true,
      account: {
        phone: accountInfo?.phone || status.myNumber || 'Desconhecido',
        name: accountInfo?.name || 'WhatsApp',
        platform: accountInfo?.platform || 'WhatsApp Web'
      },
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

    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros inválidos',
        message: 'Os campos "to" e "message" são obrigatórios',
      });
    }

    const status = evolutionService.getConnectionStatus();
    if (!status.isConnected) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está conectado. Escaneie o QR Code primeiro.',
      });
    }

    const result = await evolutionService.sendText(to, message);

    res.json({
      success: true,
      message: 'Mensagem enviada com sucesso',
      to,
      messageId: result.key?.id,
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
    await evolutionService.disconnect();

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
    logger.info('🔄 Reinicializando WhatsApp...');

    // Deletar instância
    await evolutionService.disconnect();

    // Aguardar 3 segundos para garantir que a instância foi deletada
    logger.info('⏳ Aguardando 3 segundos antes de recriar...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Recriar instância
    await evolutionService.initialize();

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
 * POST /api/whatsapp/sync-chats
 * Sincronizar todos os chats e contatos do WhatsApp
 */
router.post('/sync-chats', authenticate, async (req: Request, res: Response) => {
  try {
    const chats = await evolutionService.getAllChats();

    res.json({
      success: true,
      message: `${chats.length} chats sincronizados`,
      count: chats.length
    });
  } catch (error: any) {
    logger.error('Erro ao sincronizar chats:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao sincronizar chats',
      message: error.message
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
      await whatsappChatService.markAsRead(messageIds);
    }

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
