/**
 * Evolution API Routes - Rotas completas para WhatsApp
 *
 * Funcionalidades:
 * - Gerenciamento de conexão (QR code, status)
 * - Envio de mensagens (texto, mídia, áudio, vídeo, localização, contato)
 * - Buscar conversas e mensagens
 * - Gerenciar contatos
 * - Criar e gerenciar grupos
 * - Atualizar perfil
 * - Presença (online, digitando, gravando)
 */

import { Router, Request, Response } from 'express';
import evolutionService from '../services/evolutionService';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// ============================================================================
// CONEXÃO E STATUS
// ============================================================================

/**
 * GET /api/evolution/status
 * Retorna status da conexão WhatsApp
 */
router.get('/status', authenticate, async (req: Request, res: Response) => {
  try {
    const status = {
      connected: evolutionService.getIsConnected(),
      state: evolutionService.getConnectionState(),
      qrCode: evolutionService.getQRCode(),
      myNumber: evolutionService.getMyNumber(),
      instance: evolutionService.getInstanceName()
    };

    res.json({ success: true, data: status });

  } catch (error: any) {
    logger.error('❌ Erro ao obter status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/evolution/connect
 * Inicia conexão WhatsApp (gera QR code)
 */
router.post('/connect', authenticate, async (req: Request, res: Response) => {
  try {
    await evolutionService.initialize();

    res.json({
      success: true,
      message: 'Conexão iniciada. Aguarde o QR code via WebSocket.'
    });

  } catch (error: any) {
    logger.error('❌ Erro ao conectar:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/evolution/disconnect
 * Desconecta WhatsApp
 */
router.post('/disconnect', authenticate, async (req: Request, res: Response) => {
  try {
    await evolutionService.disconnect();

    res.json({
      success: true,
      message: 'WhatsApp desconectado com sucesso'
    });

  } catch (error: any) {
    logger.error('❌ Erro ao desconectar:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// ENVIO DE MENSAGENS
// ============================================================================

/**
 * POST /api/evolution/send/text
 * Envia mensagem de texto
 */
router.post('/send/text', authenticate, async (req: Request, res: Response) => {
  try {
    const { to, text } = req.body;

    if (!to || !text) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: to, text'
      });
    }

    const result = await evolutionService.sendText(to, text);

    res.json({
      success: true,
      data: result,
      message: 'Mensagem enviada com sucesso'
    });

  } catch (error: any) {
    logger.error('❌ Erro ao enviar mensagem:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/evolution/send/image
 * Envia imagem
 */
router.post('/send/image', authenticate, async (req: Request, res: Response) => {
  try {
    const { to, imageUrl, caption } = req.body;

    if (!to || !imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: to, imageUrl'
      });
    }

    const result = await evolutionService.sendImage(to, imageUrl, caption);

    res.json({
      success: true,
      data: result,
      message: 'Imagem enviada com sucesso'
    });

  } catch (error: any) {
    logger.error('❌ Erro ao enviar imagem:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/evolution/send/video
 * Envia vídeo
 */
router.post('/send/video', authenticate, async (req: Request, res: Response) => {
  try {
    const { to, videoUrl, caption } = req.body;

    if (!to || !videoUrl) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: to, videoUrl'
      });
    }

    const result = await evolutionService.sendVideo(to, videoUrl, caption);

    res.json({
      success: true,
      data: result,
      message: 'Vídeo enviado com sucesso'
    });

  } catch (error: any) {
    logger.error('❌ Erro ao enviar vídeo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/evolution/send/audio
 * Envia áudio
 */
router.post('/send/audio', authenticate, async (req: Request, res: Response) => {
  try {
    const { to, audioUrl } = req.body;

    if (!to || !audioUrl) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: to, audioUrl'
      });
    }

    const result = await evolutionService.sendAudio(to, audioUrl);

    res.json({
      success: true,
      data: result,
      message: 'Áudio enviado com sucesso'
    });

  } catch (error: any) {
    logger.error('❌ Erro ao enviar áudio:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/evolution/send/file
 * Envia arquivo/documento
 */
router.post('/send/file', authenticate, async (req: Request, res: Response) => {
  try {
    const { to, fileUrl, caption, fileName } = req.body;

    if (!to || !fileUrl) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: to, fileUrl'
      });
    }

    const result = await evolutionService.sendFile(to, fileUrl, caption, fileName);

    res.json({
      success: true,
      data: result,
      message: 'Arquivo enviado com sucesso'
    });

  } catch (error: any) {
    logger.error('❌ Erro ao enviar arquivo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/evolution/send/location
 * Envia localização
 */
router.post('/send/location', authenticate, async (req: Request, res: Response) => {
  try {
    const { to, latitude, longitude, name } = req.body;

    if (!to || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: to, latitude, longitude'
      });
    }

    const result = await evolutionService.sendLocation(to, latitude, longitude, name);

    res.json({
      success: true,
      data: result,
      message: 'Localização enviada com sucesso'
    });

  } catch (error: any) {
    logger.error('❌ Erro ao enviar localização:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/evolution/send/contact
 * Envia contato
 */
router.post('/send/contact', authenticate, async (req: Request, res: Response) => {
  try {
    const { to, contactName, contactPhone } = req.body;

    if (!to || !contactName || !contactPhone) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: to, contactName, contactPhone'
      });
    }

    const result = await evolutionService.sendContact(to, contactName, contactPhone);

    res.json({
      success: true,
      data: result,
      message: 'Contato enviado com sucesso'
    });

  } catch (error: any) {
    logger.error('❌ Erro ao enviar contato:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// CONVERSAS E MENSAGENS
// ============================================================================

/**
 * GET /api/evolution/chats
 * Busca todas as conversas
 */
router.get('/chats', authenticate, async (req: Request, res: Response) => {
  try {
    const chats = await evolutionService.fetchChats();

    res.json({
      success: true,
      data: chats,
      count: chats.length
    });

  } catch (error: any) {
    logger.error('❌ Erro ao buscar chats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/evolution/messages/:chatId
 * Busca mensagens de um chat específico
 */
router.get('/messages/:chatId', authenticate, async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const messages = await evolutionService.fetchMessages(chatId, limit);

    res.json({
      success: true,
      data: messages,
      count: messages.length
    });

  } catch (error: any) {
    logger.error('❌ Erro ao buscar mensagens:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/evolution/messages/mark-read
 * Marca mensagens como lidas
 */
router.post('/messages/mark-read', authenticate, async (req: Request, res: Response) => {
  try {
    const { chatId, messageIds } = req.body;

    if (!chatId || !messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: chatId, messageIds (array)'
      });
    }

    await evolutionService.markAsRead(chatId, messageIds);

    res.json({
      success: true,
      message: `${messageIds.length} mensagens marcadas como lidas`
    });

  } catch (error: any) {
    logger.error('❌ Erro ao marcar como lida:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/evolution/messages/:chatId/:messageId
 * Deleta uma mensagem
 */
router.delete('/messages/:chatId/:messageId', authenticate, async (req: Request, res: Response) => {
  try {
    const { chatId, messageId } = req.params;

    await evolutionService.deleteMessage(chatId, messageId);

    res.json({
      success: true,
      message: 'Mensagem deletada com sucesso'
    });

  } catch (error: any) {
    logger.error('❌ Erro ao deletar mensagem:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// CONTATOS
// ============================================================================

/**
 * GET /api/evolution/contacts
 * Busca todos os contatos
 */
router.get('/contacts', authenticate, async (req: Request, res: Response) => {
  try {
    const contacts = await evolutionService.fetchContacts();

    res.json({
      success: true,
      data: contacts,
      count: contacts.length
    });

  } catch (error: any) {
    logger.error('❌ Erro ao buscar contatos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/evolution/contacts/:contactId/profile
 * Busca perfil de um contato
 */
router.get('/contacts/:contactId/profile', authenticate, async (req: Request, res: Response) => {
  try {
    const { contactId } = req.params;

    const profile = await evolutionService.fetchProfile(contactId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Perfil não encontrado'
      });
    }

    res.json({
      success: true,
      data: profile
    });

  } catch (error: any) {
    logger.error('❌ Erro ao buscar perfil:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// PRESENÇA
// ============================================================================

/**
 * POST /api/evolution/presence
 * Atualiza presença em um chat
 */
router.post('/presence', authenticate, async (req: Request, res: Response) => {
  try {
    const { chatId, presence } = req.body;

    if (!chatId || !presence) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: chatId, presence'
      });
    }

    if (!['available', 'unavailable', 'composing', 'recording'].includes(presence)) {
      return res.status(400).json({
        success: false,
        error: 'Presença inválida. Use: available, unavailable, composing, recording'
      });
    }

    await evolutionService.updatePresence(chatId, presence);

    res.json({
      success: true,
      message: 'Presença atualizada com sucesso'
    });

  } catch (error: any) {
    logger.error('❌ Erro ao atualizar presença:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// CHAT MANAGEMENT
// ============================================================================

/**
 * POST /api/evolution/chat/archive
 * Arquiva um chat
 */
router.post('/chat/archive', authenticate, async (req: Request, res: Response) => {
  try {
    const { chatId, archive = true } = req.body;

    if (!chatId) {
      return res.status(400).json({
        success: false,
        error: 'Campo obrigatório: chatId'
      });
    }

    await evolutionService.archiveChat(chatId, archive);

    res.json({
      success: true,
      message: `Chat ${archive ? 'arquivado' : 'desarquivado'} com sucesso`
    });

  } catch (error: any) {
    logger.error('❌ Erro ao arquivar chat:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// GRUPOS
// ============================================================================

/**
 * POST /api/evolution/group/create
 * Cria um grupo
 */
router.post('/group/create', authenticate, async (req: Request, res: Response) => {
  try {
    const { name, participants } = req.body;

    if (!name || !participants || !Array.isArray(participants)) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: name, participants (array de números)'
      });
    }

    const result = await evolutionService.createGroup(name, participants);

    res.json({
      success: true,
      data: result,
      message: 'Grupo criado com sucesso'
    });

  } catch (error: any) {
    logger.error('❌ Erro ao criar grupo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// PERFIL
// ============================================================================

/**
 * PUT /api/evolution/profile/picture
 * Atualiza foto de perfil
 */
router.put('/profile/picture', authenticate, async (req: Request, res: Response) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'Campo obrigatório: imageUrl'
      });
    }

    await evolutionService.updateProfilePicture(imageUrl);

    res.json({
      success: true,
      message: 'Foto de perfil atualizada com sucesso'
    });

  } catch (error: any) {
    logger.error('❌ Erro ao atualizar foto de perfil:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/evolution/profile/name
 * Atualiza nome de perfil
 */
router.put('/profile/name', authenticate, async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Campo obrigatório: name'
      });
    }

    await evolutionService.updateProfileName(name);

    res.json({
      success: true,
      message: 'Nome de perfil atualizado com sucesso'
    });

  } catch (error: any) {
    logger.error('❌ Erro ao atualizar nome de perfil:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/evolution/profile/status
 * Atualiza status/recado
 */
router.put('/profile/status', authenticate, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Campo obrigatório: status'
      });
    }

    await evolutionService.updateProfileStatus(status);

    res.json({
      success: true,
      message: 'Status atualizado com sucesso'
    });

  } catch (error: any) {
    logger.error('❌ Erro ao atualizar status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// INFORMAÇÕES
// ============================================================================

/**
 * GET /api/evolution/info
 * Retorna informações sobre a API Evolution
 */
router.get('/info', authenticate, async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        service: 'Evolution API',
        version: '2.0',
        instance: evolutionService.getInstanceName(),
        features: [
          'Envio de texto, imagem, vídeo, áudio, documento, localização, contato',
          'Recebimento de mensagens em tempo real via WebSocket',
          'Status de mensagens (enviado, entregue, lido)',
          'Gerenciamento de conversas e contatos',
          'Criação e gerenciamento de grupos',
          'Presença (online, offline, digitando, gravando áudio)',
          'Atualização de perfil (foto, nome, status)',
          'QR Code automático via webhook',
          'API Key gerada automaticamente'
        ]
      }
    });

  } catch (error: any) {
    logger.error('❌ Erro ao obter info:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
