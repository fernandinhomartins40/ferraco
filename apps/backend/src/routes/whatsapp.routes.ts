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
 * ✅ NOVA ROTA: POST /api/whatsapp/conversations/:id/load-incremental
 * Carregar mensagens incrementalmente (em lotes) para evitar timeout
 * Ideal para conversas com milhares de mensagens
 */
router.post('/conversations/:id/load-incremental', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { batchSize } = req.body; // Opcional: tamanho do lote (padrão: 100)

    // Carregar incrementalmente em background
    whatsappChatService.loadMessagesIncrementally(id, batchSize).catch((error) => {
      logger.error('Erro ao carregar mensagens incrementalmente em background:', error);
    });

    res.json({
      success: true,
      message: 'Carregando mensagens incrementalmente em background...',
    });

  } catch (error: any) {
    logger.error('Erro ao iniciar carregamento incremental:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao carregar mensagens',
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

// ============================================================================
// ⭐ FASE 2: NOVAS ROTAS
// ============================================================================

/**
 * POST /api/whatsapp/send-audio
 * Enviar áudio (Push-to-Talk) via WhatsApp
 *
 * Body:
 * {
 *   "to": "5511999999999",
 *   "audioPath": "https://example.com/audio.ogg" ou caminho local
 * }
 */
router.post('/send-audio', authenticate, async (req: Request, res: Response) => {
  try {
    const { to, audioPath } = req.body;

    if (!to || !audioPath) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros inválidos',
        message: 'Os campos "to" e "audioPath" são obrigatórios',
      });
    }

    if (!whatsappService.isWhatsAppConnected()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está conectado. Escaneie o QR Code primeiro.',
      });
    }

    const messageId = await whatsappService.sendAudio(to, audioPath);

    res.json({
      success: true,
      message: 'Áudio enviado com sucesso',
      to,
      messageId,
    });

  } catch (error: any) {
    logger.error('Erro ao enviar áudio:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao enviar áudio',
      message: error.message,
    });
  }
});

/**
 * POST /api/whatsapp/send-reaction
 * Enviar reação emoji a uma mensagem
 *
 * Body:
 * {
 *   "messageId": "true_5511999999999@c.us_3EB0...",
 *   "emoji": "👍" ou false para remover
 * }
 */
router.post('/send-reaction', authenticate, async (req: Request, res: Response) => {
  try {
    const { messageId, emoji } = req.body;

    if (!messageId || emoji === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros inválidos',
        message: 'Os campos "messageId" e "emoji" são obrigatórios',
      });
    }

    if (!whatsappService.isWhatsAppConnected()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está conectado. Escaneie o QR Code primeiro.',
      });
    }

    const result = await whatsappService.sendReaction(messageId, emoji);

    res.json({
      success: true,
      message: emoji === false ? 'Reação removida com sucesso' : 'Reação enviada com sucesso',
      messageId,
      emoji,
      result,
    });

  } catch (error: any) {
    logger.error('Erro ao enviar reação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao enviar reação',
      message: error.message,
    });
  }
});

/**
 * POST /api/whatsapp/mark-read
 * Marcar chat como lido no WhatsApp
 *
 * Body:
 * {
 *   "chatId": "5511999999999@c.us"
 * }
 */
router.post('/mark-read', authenticate, async (req: Request, res: Response) => {
  try {
    const { chatId } = req.body;

    if (!chatId) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetro inválido',
        message: 'O campo "chatId" é obrigatório',
      });
    }

    if (!whatsappService.isWhatsAppConnected()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está conectado. Escaneie o QR Code primeiro.',
      });
    }

    await whatsappService.markAsRead(chatId);

    res.json({
      success: true,
      message: 'Chat marcado como lido',
      chatId,
    });

  } catch (error: any) {
    logger.error('Erro ao marcar como lido:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao marcar como lido',
      message: error.message,
    });
  }
});

/**
 * POST /api/whatsapp/mark-unread
 * Marcar chat como não lido no WhatsApp
 *
 * Body:
 * {
 *   "chatId": "5511999999999@c.us"
 * }
 */
router.post('/mark-unread', authenticate, async (req: Request, res: Response) => {
  try {
    const { chatId } = req.body;

    if (!chatId) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetro inválido',
        message: 'O campo "chatId" é obrigatório',
      });
    }

    if (!whatsappService.isWhatsAppConnected()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está conectado. Escaneie o QR Code primeiro.',
      });
    }

    await whatsappService.markAsUnread(chatId);

    res.json({
      success: true,
      message: 'Chat marcado como não lido',
      chatId,
    });

  } catch (error: any) {
    logger.error('Erro ao marcar como não lido:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao marcar como não lido',
      message: error.message,
    });
  }
});

/**
 * POST /api/whatsapp/delete-message
 * Deletar mensagem (localmente ou para todos)
 *
 * Body:
 * {
 *   "chatId": "5511999999999@c.us",
 *   "messageId": "true_5511999999999@c.us_3EB0..." ou ["msg1", "msg2"],
 *   "forEveryone": true ou false (opcional, padrão: false)
 * }
 */
router.post('/delete-message', authenticate, async (req: Request, res: Response) => {
  try {
    const { chatId, messageId, forEveryone } = req.body;

    if (!chatId || !messageId) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros inválidos',
        message: 'Os campos "chatId" e "messageId" são obrigatórios',
      });
    }

    if (!whatsappService.isWhatsAppConnected()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está conectado. Escaneie o QR Code primeiro.',
      });
    }

    await whatsappService.deleteMessage(chatId, messageId, forEveryone || false);

    const messageCount = Array.isArray(messageId) ? messageId.length : 1;
    const scope = forEveryone ? 'para todos' : 'localmente';

    res.json({
      success: true,
      message: `${messageCount} mensagem(ns) deletada(s) ${scope}`,
      chatId,
      messageCount,
      forEveryone: forEveryone || false,
    });

  } catch (error: any) {
    logger.error('Erro ao deletar mensagem:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar mensagem',
      message: error.message,
    });
  }
});

// ============================================================================
// ⭐ FASE 3: ROTAS AVANÇADAS
// ============================================================================

/**
 * POST /api/whatsapp/send-file
 * Enviar arquivo genérico (documento, PDF, etc.)
 *
 * Body:
 * {
 *   "to": "5511999999999",
 *   "filePath": "https://example.com/document.pdf" ou caminho local,
 *   "filename": "Contrato.pdf" (opcional),
 *   "caption": "Segue o documento" (opcional)
 * }
 */
router.post('/send-file', authenticate, async (req: Request, res: Response) => {
  try {
    const { to, filePath, filename, caption } = req.body;

    if (!to || !filePath) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros inválidos',
        message: 'Os campos "to" e "filePath" são obrigatórios',
      });
    }

    if (!whatsappService.isWhatsAppConnected()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está conectado. Escaneie o QR Code primeiro.',
      });
    }

    const messageId = await whatsappService.sendFile(to, filePath, filename, caption);

    res.json({
      success: true,
      message: 'Arquivo enviado com sucesso',
      to,
      filename: filename || 'documento',
      messageId,
    });

  } catch (error: any) {
    logger.error('Erro ao enviar arquivo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao enviar arquivo',
      message: error.message,
    });
  }
});

/**
 * POST /api/whatsapp/send-location
 * Enviar localização
 *
 * Body:
 * {
 *   "to": "5511999999999",
 *   "latitude": -23.5505,
 *   "longitude": -46.6333,
 *   "name": "São Paulo, SP" (opcional)
 * }
 */
router.post('/send-location', authenticate, async (req: Request, res: Response) => {
  try {
    const { to, latitude, longitude, name } = req.body;

    if (!to || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros inválidos',
        message: 'Os campos "to", "latitude" e "longitude" são obrigatórios',
      });
    }

    if (!whatsappService.isWhatsAppConnected()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está conectado. Escaneie o QR Code primeiro.',
      });
    }

    const messageId = await whatsappService.sendLocation(to, latitude, longitude, name);

    res.json({
      success: true,
      message: 'Localização enviada com sucesso',
      to,
      latitude,
      longitude,
      name: name || 'Localização',
      messageId,
    });

  } catch (error: any) {
    logger.error('Erro ao enviar localização:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao enviar localização',
      message: error.message,
    });
  }
});

/**
 * POST /api/whatsapp/send-contact
 * Enviar contato vCard
 *
 * Body:
 * {
 *   "to": "5511999999999",
 *   "contactId": "5511888888888@c.us",
 *   "name": "João Silva" (opcional)
 * }
 */
router.post('/send-contact', authenticate, async (req: Request, res: Response) => {
  try {
    const { to, contactId, name } = req.body;

    if (!to || !contactId) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros inválidos',
        message: 'Os campos "to" e "contactId" são obrigatórios',
      });
    }

    if (!whatsappService.isWhatsAppConnected()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está conectado. Escaneie o QR Code primeiro.',
      });
    }

    const messageId = await whatsappService.sendContactVcard(to, contactId, name);

    res.json({
      success: true,
      message: 'Contato enviado com sucesso',
      to,
      contactId,
      name: name || 'Contato',
      messageId,
    });

  } catch (error: any) {
    logger.error('Erro ao enviar contato:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao enviar contato',
      message: error.message,
    });
  }
});

/**
 * POST /api/whatsapp/star-message
 * Estrelar ou desestrelar mensagem
 *
 * Body:
 * {
 *   "messageId": "true_5511999999999@c.us_3EB0...",
 *   "star": true ou false
 * }
 */
router.post('/star-message', authenticate, async (req: Request, res: Response) => {
  try {
    const { messageId, star } = req.body;

    if (!messageId || star === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros inválidos',
        message: 'Os campos "messageId" e "star" são obrigatórios',
      });
    }

    if (!whatsappService.isWhatsAppConnected()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está conectado. Escaneie o QR Code primeiro.',
      });
    }

    await whatsappService.starMessage(messageId, star);

    res.json({
      success: true,
      message: star ? 'Mensagem estrelada com sucesso' : 'Estrela removida com sucesso',
      messageId,
      star,
    });

  } catch (error: any) {
    logger.error('Erro ao estrelar mensagem:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao estrelar mensagem',
      message: error.message,
    });
  }
});

/**
 * GET /api/whatsapp/starred-messages
 * Obter todas as mensagens estreladas
 */
router.get('/starred-messages', authenticate, async (req: Request, res: Response) => {
  try {
    if (!whatsappService.isWhatsAppConnected()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está conectado. Escaneie o QR Code primeiro.',
      });
    }

    const starredMessages = await whatsappService.getStarredMessages();

    res.json({
      success: true,
      messages: starredMessages,
      total: starredMessages.length,
    });

  } catch (error: any) {
    logger.error('Erro ao buscar mensagens estreladas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar mensagens estreladas',
      message: error.message,
    });
  }
});

/**
 * POST /api/whatsapp/archive-chat
 * Arquivar ou desarquivar conversa
 *
 * Body:
 * {
 *   "chatId": "5511999999999@c.us",
 *   "archive": true ou false
 * }
 */
router.post('/archive-chat', authenticate, async (req: Request, res: Response) => {
  try {
    const { chatId, archive } = req.body;

    if (!chatId || archive === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros inválidos',
        message: 'Os campos "chatId" e "archive" são obrigatórios',
      });
    }

    if (!whatsappService.isWhatsAppConnected()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está conectado. Escaneie o QR Code primeiro.',
      });
    }

    await whatsappService.archiveChat(chatId, archive);

    res.json({
      success: true,
      message: archive ? 'Conversa arquivada com sucesso' : 'Conversa desarquivada com sucesso',
      chatId,
      archive,
    });

  } catch (error: any) {
    logger.error('Erro ao arquivar conversa:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao arquivar conversa',
      message: error.message,
    });
  }
});

export default router;
