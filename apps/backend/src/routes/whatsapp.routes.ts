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
import { whatsappWebJSService } from '../services/whatsappWebJS.service';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const router = Router();

// ==========================================
// CONFIGURAÇÃO DE UPLOAD DE MÍDIA
// ==========================================

// Criar diretório de uploads se não existir
const whatsappUploadsDir = process.env.NODE_ENV === 'production'
  ? '/app/uploads/whatsapp'
  : path.join(__dirname, '../../uploads/whatsapp');

if (!fs.existsSync(whatsappUploadsDir)) {
  fs.mkdirSync(whatsappUploadsDir, { recursive: true });
  logger.info(`📁 Diretório de uploads WhatsApp criado: ${whatsappUploadsDir}`);
}

// Configuração do multer para WhatsApp (aceita TODOS os tipos de arquivo)
const whatsappStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, whatsappUploadsDir);
  },
  filename: (req, file, cb) => {
    // T-06 (F-57): identificador criptográfico no lugar de
    // `Date.now() + Math.random()`, que era derivável por força bruta.
    // O nome original é preservado apenas como prefixo legível, sanitizado.
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40);
    cb(null, `${baseName}-${crypto.randomUUID()}${ext}`);
  },
});

const whatsappFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Aceitar TODOS os tipos de arquivo (imagem, áudio, vídeo, documento, etc.)
  const allowedTypes = [
    // Imagens — T-06 (F-59): 'image/svg+xml' removido. O arquivo é gravado no
    // nosso disco e fica acessível via /uploads antes de seguir ao WhatsApp;
    // um SVG com <script> executaria no domínio da aplicação.
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
    // Áudios
    'audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/wav', 'audio/webm', 'audio/aac', 'audio/m4a',
    // Vídeos
    'video/mp4', 'video/mpeg', 'video/webm', 'video/ogg', 'video/quicktime',
    // Documentos
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/csv',
    // Compactados
    'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // T-06 (F-58): o `else` fazia `cb(null, true)` — aceitava QUALQUER tipo,
    // tornando a allowlist decorativa. Arquivos executáveis chegavam ao disco
    // do servidor, que é servido publicamente em /uploads.
    logger.warn(`⚠️  Upload rejeitado — tipo não permitido: ${file.mimetype}`);
    cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}`));
  }
};

const uploadWhatsappMedia = multer({
  storage: whatsappStorage,
  fileFilter: whatsappFileFilter,
  limits: {
    // T-11 (F-9): era 100 MB, mas o nginx corta em `client_max_body_size 50M`.
    // O usuário transferia o arquivo inteiro e só então recebia 413 — falha
    // tardia e cara. Alinhado com o nginx para rejeitar cedo.
    // Para elevar o teto, aumentar NOS DOIS lugares.
    fileSize: 50 * 1024 * 1024, // 50MB (alinhado com nginx client_max_body_size)
  },
});

// ==========================================
// ROTAS DE CONEXÃO E STATUS
// ==========================================

/**
 * GET /api/whatsapp/qr
 * Obter QR Code para conectar WhatsApp
 * Retorna imagem base64
 */
router.get('/qr', authenticate, async (req: Request, res: Response) => {
  try {
    const qrCode = whatsappWebJSService.getQRCode();

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
    const status = whatsappWebJSService.getStatus();

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
    if (!whatsappWebJSService.isWhatsAppConnected()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está conectado',
      });
    }

    const accountInfo = await whatsappWebJSService.getAccountInfo();

    res.json({
      success: true,
      data: accountInfo,
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

    if (!whatsappWebJSService.isWhatsAppConnected()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está conectado. Escaneie o QR Code primeiro.',
      });
    }

    // Enviar mensagem
    await whatsappWebJSService.sendTextMessage(to, message);

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
    await whatsappWebJSService.disconnect();

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
    await whatsappWebJSService.reinitialize();

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
// ROTAS DE CHAT - NOVA ARQUITETURA STATELESS (whatsapp-web.js)
// ============================================================================

/**
 * GET /api/whatsapp/conversations
 * Compatibilidade: redireciona para lógica v2
 */
router.get('/conversations', authenticate, async (req: Request, res: Response) => {
  try {
    if (!whatsappWebJSService.isWhatsAppConnected()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está conectado',
      });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const conversations = await whatsappWebJSService.getAllConversations(limit);

    res.json({
      success: true,
      conversations,
      total: conversations.length,
      source: 'whatsapp-live',
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
 * ✅ NOVO: GET /api/whatsapp/conversations/v2
 * Busca conversas DIRETAMENTE do WhatsApp (stateless)
 * Enriquece com metadata do PostgreSQL (tags, anotações, vínculo CRM)
 */
router.get('/conversations/v2', authenticate, async (req: Request, res: Response) => {
  try {
    if (!whatsappWebJSService.isWhatsAppConnected()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está conectado',
      });
    }

    const limit = parseInt(req.query.limit as string) || 50;

    // Buscar conversas DIRETO do whatsapp-web.js
    const rawConversations = await whatsappWebJSService.getAllConversations(limit);

    // ✅ FIX: Transformar para formato esperado pelo frontend
    const conversations = rawConversations.map((conv: any) => ({
      id: conv.id,
      contactId: conv.phone,
      lastMessageAt: new Date(conv.timestamp * 1000).toISOString(),
      lastMessagePreview: conv.lastMessage?.body || null,
      unreadCount: conv.unreadCount || 0,
      isPinned: false,
      contact: {
        id: conv.phone,
        phone: conv.phone,
        name: conv.name,
        profilePicUrl: null, // whatsapp-web.js não retorna foto de perfil facilmente
      },
    }));

    res.json({
      success: true,
      conversations,
      total: conversations.length,
      source: 'whatsapp-live', // Indica que veio direto do WPP
    });

  } catch (error: any) {
    logger.error('❌ Erro ao listar conversas (v2):', {
      message: error.message,
      stack: error.stack,
      isConnected: whatsappWebJSService.isWhatsAppConnected(),
    });
    res.status(500).json({
      success: false,
      error: 'Erro ao listar conversas',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

/**
 * ✅ NOVO: GET /api/whatsapp/conversations/:phone/messages/v2
 * Busca mensagens DIRETAMENTE do WhatsApp (stateless)
 * @param phone - Número do telefone (com ou sem código de país)
 */
router.get('/conversations/:phone/messages/v2', authenticate, async (req: Request, res: Response) => {
  try {
    if (!whatsappWebJSService.isWhatsAppConnected()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está conectado',
      });
    }

    const { phone } = req.params;
    const count = parseInt(req.query.count as string) || 100;

    // ✅ Validar formato do número
    if (!phone || phone.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Número de telefone inválido',
      });
    }

    // ✅ LOG para diagnóstico
    logger.info(`📥 GET /conversations/${phone}/messages/v2 (count: ${count})`);

    // Buscar mensagens DIRETO do whatsapp-web.js
    const messages = await whatsappWebJSService.getChatMessages(phone, count);

    res.json({
      success: true,
      messages,
      total: messages.length,
      source: 'whatsapp-live',
    });

  } catch (error: any) {
    // ✅ LOG DETALHADO para diagnóstico
    logger.error('❌ Erro ao listar mensagens (v2):', {
      message: error.message,
      stack: error.stack,
      phone: req.params.phone,
    });

    // ✅ Status HTTP apropriado baseado no tipo de erro
    const statusCode = error.message?.includes('não encontrado') ? 404
      : error.message?.includes('inválido') ? 400
      : error.message?.includes('Timeout') ? 504
      : 500;

    res.status(statusCode).json({
      success: false,
      error: 'Erro ao listar mensagens',
      message: error.message || 'Erro desconhecido ao buscar mensagens',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

/**
 * GET /api/whatsapp/search
 * Buscar conversas por nome ou telefone (stateless - busca direto do WhatsApp)
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

    // Na arquitetura stateless, buscar todas conversas e filtrar
    const allConversations = await whatsappWebJSService.getAllConversations(100);
    const conversations = allConversations.filter(conv =>
      conv.name?.toLowerCase().includes(query.toLowerCase()) ||
      conv.phone.includes(query)
    );

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

    if (!whatsappWebJSService.isWhatsAppConnected()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está conectado. Escaneie o QR Code primeiro.',
      });
    }

    const messageId = await whatsappWebJSService.sendAudio(to, audioPath);

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
 *   "emoji": "👍" ou "" para remover
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

    if (!whatsappWebJSService.isWhatsAppConnected()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está conectado',
      });
    }

    // Enviar ou remover reação
    if (emoji) {
      await whatsappWebJSService.sendReaction(messageId, emoji);
    } else {
      await whatsappWebJSService.removeReaction(messageId);
    }

    res.json({
      success: true,
      message: emoji ? 'Reação enviada com sucesso' : 'Reação removida com sucesso',
      messageId,
      emoji,
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

    if (!whatsappWebJSService.isWhatsAppConnected()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está conectado',
      });
    }

    await whatsappWebJSService.markChatAsRead(chatId);

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

    if (!whatsappWebJSService.isWhatsAppConnected()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está conectado',
      });
    }

    await whatsappWebJSService.markChatAsUnread(chatId);

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
 *   "messageId": "true_5511999999999@c.us_3EB0...",
 *   "forEveryone": true ou false (opcional, padrão: false)
 * }
 */
router.post('/delete-message', authenticate, async (req: Request, res: Response) => {
  try {
    const { messageId, forEveryone = false } = req.body;

    if (!messageId) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros inválidos',
        message: 'O campo "messageId" é obrigatório',
      });
    }

    if (!whatsappWebJSService.isWhatsAppConnected()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está conectado',
      });
    }

    // Suportar array de messageIds
    const messageIds = Array.isArray(messageId) ? messageId : [messageId];

    for (const msgId of messageIds) {
      await whatsappWebJSService.deleteMessage(msgId, forEveryone);
    }

    res.json({
      success: true,
      message: `${messageIds.length} mensagem(ns) deletada(s)`,
      forEveryone,
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

    if (!whatsappWebJSService.isWhatsAppConnected()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está conectado. Escaneie o QR Code primeiro.',
      });
    }

    // ✅ FIX: Implementado usando whatsappWebJSService.sendFile()
    const messageId = await whatsappWebJSService.sendFile(to, filePath, filename, caption);

    res.json({
      success: true,
      message: 'Arquivo enviado com sucesso',
      messageId,
      to,
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
 *   "longitude": -46.6333
 * }
 */
router.post('/send-location', authenticate, async (req: Request, res: Response) => {
  try {
    const { to, latitude, longitude } = req.body;

    if (!to || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros inválidos',
        message: 'Os campos "to", "latitude" e "longitude" são obrigatórios',
      });
    }

    if (!whatsappWebJSService.isWhatsAppConnected()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está conectado',
      });
    }

    const result = await whatsappWebJSService.sendLocation(to, latitude, longitude);

    res.json({
      success: true,
      message: 'Localização enviada com sucesso',
      data: result,
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
 *   "contactId": "5511888888888@c.us"
 * }
 */
router.post('/send-contact', authenticate, async (req: Request, res: Response) => {
  try {
    const { to, contactId } = req.body;

    if (!to || !contactId) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros inválidos',
        message: 'Os campos "to" e "contactId" são obrigatórios',
      });
    }

    if (!whatsappWebJSService.isWhatsAppConnected()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está conectado',
      });
    }

    const result = await whatsappWebJSService.sendContact(to, contactId);

    res.json({
      success: true,
      message: 'Contato enviado com sucesso',
      data: result,
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

    // ⚠️ TODO: Implementar com whatsapp-web.js ou remover
    // starMessage não está disponível no whatsappWebJSService
    return res.status(501).json({
      success: false,
      error: 'Funcionalidade não disponível',
      message: 'starMessage() não implementado em whatsapp-web.js',
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
    // ⚠️ TODO: Implementar com whatsapp-web.js ou remover
    // getStarredMessages não está disponível no whatsappWebJSService
    return res.status(501).json({
      success: false,
      error: 'Funcionalidade não disponível',
      message: 'getStarredMessages() não implementado em whatsapp-web.js',
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
    const { chatId, archive = true } = req.body;

    if (!chatId) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros inválidos',
        message: 'O campo "chatId" é obrigatório',
      });
    }

    if (!whatsappWebJSService.isWhatsAppConnected()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está conectado',
      });
    }

    await whatsappWebJSService.archiveChat(chatId, archive);

    res.json({
      success: true,
      message: `Conversa ${archive ? 'arquivada' : 'desarquivada'} com sucesso`,
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

// ==========================================
// FASE C: FUNCIONALIDADES AUSENTES
// ==========================================

/**
 * GET /api/whatsapp/media/:messageId
 * Servir mídia inline (para exibição no chat)
 *
 * @params messageId - ID da mensagem
 * @returns Arquivo binário inline
 */
router.get('/media/:messageId', authenticate, async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;

    if (!messageId) {
      return res.status(400).json({
        success: false,
        message: 'messageId é obrigatório',
      });
    }

    logger.info(`📥 Servindo mídia inline: ${messageId}`);

    // ⚠️ TODO: Implementar com whatsapp-web.js ou remover
    // downloadMedia não está disponível no whatsappWebJSService
    return res.status(501).json({
      success: false,
      error: 'Funcionalidade não disponível',
      message: 'downloadMedia() não implementado em whatsapp-web.js',
    });

  } catch (error: any) {
    logger.error('❌ Erro ao servir mídia:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao servir mídia',
      message: error.message,
    });
  }
});

/**
 * POST /api/whatsapp/download-media
 * Baixar mídia de uma mensagem (download forçado)
 *
 * @body { messageId: string }
 * @returns Arquivo binário
 */
router.post('/download-media', authenticate, async (req: Request, res: Response) => {
  try {
    const { messageId } = req.body;

    if (!messageId) {
      return res.status(400).json({
        success: false,
        message: 'messageId é obrigatório',
      });
    }

    if (!whatsappWebJSService.isWhatsAppConnected()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está conectado',
      });
    }

    logger.info(`📥 Download de mídia solicitado: ${messageId}`);

    const media = await whatsappWebJSService.downloadMedia(messageId);

    // Retornar mídia como base64
    res.json({
      success: true,
      data: media,
    });

  } catch (error: any) {
    logger.error('❌ Erro ao baixar mídia:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao baixar mídia',
      message: error.message,
    });
  }
});

/**
 * POST /api/whatsapp/forward-message
 * Encaminhar mensagem para um ou mais contatos
 *
 * @body { messageId: string, to: string | string[] }
 */
router.post('/forward-message', authenticate, async (req: Request, res: Response) => {
  try {
    const { messageId, to } = req.body;

    if (!messageId) {
      return res.status(400).json({
        success: false,
        message: 'messageId é obrigatório',
      });
    }

    if (!to) {
      return res.status(400).json({
        success: false,
        message: 'to é obrigatório (número ou array de números)',
      });
    }

    if (!whatsappWebJSService.isWhatsAppConnected()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está conectado',
      });
    }

    logger.info(`📨 Encaminhando mensagem ${messageId} para:`, to);

    await whatsappWebJSService.forwardMessage(messageId, to);

    res.json({
      success: true,
      message: 'Mensagem encaminhada com sucesso',
      messageId,
      to,
    });

  } catch (error: any) {
    logger.error('❌ Erro ao encaminhar mensagem:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao encaminhar mensagem',
      message: error.message,
    });
  }
});

/**
 * POST /api/whatsapp/pin-chat
 * Fixar ou desafixar chat
 *
 * @body { chatId: string, pin: boolean }
 */
router.post('/pin-chat', authenticate, async (req: Request, res: Response) => {
  try {
    const { chatId, pin = true } = req.body;

    if (!chatId) {
      return res.status(400).json({
        success: false,
        message: 'chatId é obrigatório',
      });
    }

    if (!whatsappWebJSService.isWhatsAppConnected()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está conectado',
      });
    }

    logger.info(`📌 ${pin ? 'Fixando' : 'Desfixando'} chat: ${chatId}`);

    await whatsappWebJSService.pinChat(chatId, pin);

    res.json({
      success: true,
      message: `Chat ${pin ? 'fixado' : 'desfixado'} com sucesso`,
      chatId,
      pin,
    });

  } catch (error: any) {
    logger.error('❌ Erro ao fixar/desafixar chat:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao fixar/desafixar chat',
      message: error.message,
    });
  }
});

/**
 * GET /api/whatsapp/contacts
 * Listar todos os contatos do WhatsApp
 */
router.get('/contacts', authenticate, async (req: Request, res: Response) => {
  try {
    if (!whatsappWebJSService.isWhatsAppConnected()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está conectado',
      });
    }

    logger.info('📇 Listando contatos do WhatsApp');

    const contacts = await whatsappWebJSService.getAllContacts();

    res.json({
      success: true,
      data: contacts,
      count: contacts.length,
    });

  } catch (error: any) {
    logger.error('❌ Erro ao listar contatos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar contatos',
      message: error.message,
    });
  }
});

/**
 * POST /api/whatsapp/contacts/check
 * Verificar se número(s) está(ão) no WhatsApp
 *
 * @body { phoneNumbers: string | string[] }
 */
router.post('/contacts/check', authenticate, async (req: Request, res: Response) => {
  try {
    const { phoneNumbers } = req.body;

    if (!phoneNumbers) {
      return res.status(400).json({
        success: false,
        message: 'phoneNumbers é obrigatório (número ou array)',
      });
    }

    if (!whatsappWebJSService.isWhatsAppConnected()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está conectado',
      });
    }

    logger.info('🔍 Verificando números no WhatsApp:', phoneNumbers);

    const results = await whatsappWebJSService.checkNumbersOnWhatsApp(phoneNumbers);

    res.json({
      success: true,
      data: results,
      count: results.length,
    });

  } catch (error: any) {
    logger.error('❌ Erro ao verificar números:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar números',
      message: error.message,
    });
  }
});

/**
 * POST /api/whatsapp/groups
 * Criar grupo no WhatsApp
 *
 * @body { name: string, participants: string[] }
 */
router.post('/groups', authenticate, async (req: Request, res: Response) => {
  try {
    const { name, participants } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'name é obrigatório',
      });
    }

    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'participants é obrigatório e deve conter pelo menos 1 número',
      });
    }

    logger.info(`👥 Criando grupo: ${name} com ${participants.length} participantes`);

    // ⚠️ TODO: Implementar com whatsapp-web.js ou remover
    // createGroup não está disponível no whatsappWebJSService
    return res.status(501).json({
      success: false,
      error: 'Funcionalidade não disponível',
      message: 'createGroup() não implementado em whatsapp-web.js',
    });

  } catch (error: any) {
    logger.error('❌ Erro ao criar grupo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar grupo',
      message: error.message,
    });
  }
});

// ==========================================
// FASE D: MENSAGENS INTERATIVAS E GERENCIAMENTO DE GRUPOS
// ==========================================

/**
 * POST /api/whatsapp/send-list
 * Enviar mensagem de lista interativa
 *
 * @body { to, title, description, buttonText, sections }
 */
router.post('/send-list', authenticate, async (req: Request, res: Response) => {
  try {
    const { to, title, description, buttonText, sections } = req.body;

    if (!to || !title || !buttonText || !sections) {
      return res.status(400).json({
        success: false,
        message: 'to, title, buttonText e sections são obrigatórios',
      });
    }

    logger.info(`📋 Enviando lista interativa para: ${to}`);

    // ⚠️ TODO: Implementar com whatsapp-web.js ou remover
    // sendList não está disponível no whatsappWebJSService
    return res.status(501).json({
      success: false,
      error: 'Funcionalidade não disponível',
      message: 'sendList() não implementado em whatsapp-web.js',
    });

  } catch (error: any) {
    logger.error('❌ Erro ao enviar lista:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao enviar lista',
      message: error.message,
    });
  }
});

/**
 * POST /api/whatsapp/send-buttons
 * Enviar mensagem com botões de resposta
 *
 * @body { to, message, buttons }
 */
router.post('/send-buttons', authenticate, async (req: Request, res: Response) => {
  try {
    const { to, message, buttons } = req.body;

    if (!to || !message || !buttons || !Array.isArray(buttons)) {
      return res.status(400).json({
        success: false,
        message: 'to, message e buttons (array) são obrigatórios',
      });
    }

    logger.info(`🔘 Enviando mensagem com botões para: ${to}`);

    // ⚠️ TODO: Implementar com whatsapp-web.js ou remover
    // sendButtons não está disponível no whatsappWebJSService
    return res.status(501).json({
      success: false,
      error: 'Funcionalidade não disponível',
      message: 'sendButtons() não implementado em whatsapp-web.js',
    });

  } catch (error: any) {
    logger.error('❌ Erro ao enviar botões:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao enviar botões',
      message: error.message,
    });
  }
});

/**
 * POST /api/whatsapp/send-poll
 * Enviar enquete (poll)
 *
 * @body { to, name, options }
 */
router.post('/send-poll', authenticate, async (req: Request, res: Response) => {
  try {
    const { to, name, options } = req.body;

    if (!to || !name || !options || !Array.isArray(options)) {
      return res.status(400).json({
        success: false,
        message: 'to, name e options (array) são obrigatórios',
      });
    }

    logger.info(`📊 Enviando enquete para: ${to}`);

    // ⚠️ TODO: Implementar com whatsapp-web.js ou remover
    // sendPoll não está disponível no whatsappWebJSService
    return res.status(501).json({
      success: false,
      error: 'Funcionalidade não disponível',
      message: 'sendPoll() não implementado em whatsapp-web.js',
    });

  } catch (error: any) {
    logger.error('❌ Erro ao enviar enquete:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao enviar enquete',
      message: error.message,
    });
  }
});

/**
 * GET /api/whatsapp/groups/:id/participants
 * Listar participantes de um grupo
 */
router.get('/groups/:id/participants', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    logger.info(`👥 Listando participantes do grupo: ${id}`);

    // ⚠️ TODO: Implementar com whatsapp-web.js ou remover
    // getGroupParticipants não está disponível no whatsappWebJSService
    return res.status(501).json({
      success: false,
      error: 'Funcionalidade não disponível',
      message: 'getGroupParticipants() não implementado em whatsapp-web.js',
    });

  } catch (error: any) {
    logger.error('❌ Erro ao listar participantes:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar participantes',
      message: error.message,
    });
  }
});

/**
 * POST /api/whatsapp/groups/:id/participants
 * Adicionar participante ao grupo
 *
 * @body { participantNumber }
 */
router.post('/groups/:id/participants', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { participantNumber } = req.body;

    if (!participantNumber) {
      return res.status(400).json({
        success: false,
        message: 'participantNumber é obrigatório',
      });
    }

    logger.info(`👤 Adicionando participante ao grupo ${id}: ${participantNumber}`);

    // ⚠️ TODO: Implementar com whatsapp-web.js ou remover
    // addParticipantToGroup não está disponível no whatsappWebJSService
    return res.status(501).json({
      success: false,
      error: 'Funcionalidade não disponível',
      message: 'addParticipantToGroup() não implementado em whatsapp-web.js',
    });

  } catch (error: any) {
    logger.error('❌ Erro ao adicionar participante:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao adicionar participante',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/whatsapp/groups/:id/participants/:number
 * Remover participante do grupo
 */
router.delete('/groups/:id/participants/:number', authenticate, async (req: Request, res: Response) => {
  try {
    const { id, number } = req.params;

    logger.info(`👤 Removendo participante ${number} do grupo ${id}`);

    // ⚠️ TODO: Implementar com whatsapp-web.js ou remover
    // removeParticipantFromGroup não está disponível no whatsappWebJSService
    return res.status(501).json({
      success: false,
      error: 'Funcionalidade não disponível',
      message: 'removeParticipantFromGroup() não implementado em whatsapp-web.js',
    });

  } catch (error: any) {
    logger.error('❌ Erro ao remover participante:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao remover participante',
      message: error.message,
    });
  }
});

/**
 * PUT /api/whatsapp/groups/:id/description
 * Alterar descrição do grupo
 *
 * @body { description }
 */
router.put('/groups/:id/description', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'description é obrigatório',
      });
    }

    logger.info(`📝 Alterando descrição do grupo ${id}`);

    // ⚠️ TODO: Implementar com whatsapp-web.js ou remover
    // setGroupDescription não está disponível no whatsappWebJSService
    return res.status(501).json({
      success: false,
      error: 'Funcionalidade não disponível',
      message: 'setGroupDescription() não implementado em whatsapp-web.js',
    });

  } catch (error: any) {
    logger.error('❌ Erro ao alterar descrição:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao alterar descrição',
      message: error.message,
    });
  }
});

/**
 * PUT /api/whatsapp/groups/:id/subject
 * Alterar nome/assunto do grupo
 *
 * @body { subject }
 */
router.put('/groups/:id/subject', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { subject } = req.body;

    if (!subject) {
      return res.status(400).json({
        success: false,
        message: 'subject é obrigatório',
      });
    }

    logger.info(`📝 Alterando nome do grupo ${id} para: ${subject}`);

    // ⚠️ TODO: Implementar com whatsapp-web.js ou remover
    // setGroupSubject não está disponível no whatsappWebJSService
    return res.status(501).json({
      success: false,
      error: 'Funcionalidade não disponível',
      message: 'setGroupSubject() não implementado em whatsapp-web.js',
    });

  } catch (error: any) {
    logger.error('❌ Erro ao alterar nome do grupo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao alterar nome do grupo',
      message: error.message,
    });
  }
});

/**
 * POST /api/whatsapp/groups/:id/promote
 * Promover participante a admin
 *
 * @body { participantNumber }
 */
router.post('/groups/:id/promote', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { participantNumber } = req.body;

    if (!participantNumber) {
      return res.status(400).json({
        success: false,
        message: 'participantNumber é obrigatório',
      });
    }

    logger.info(`👑 Promovendo ${participantNumber} a admin no grupo ${id}`);

    // ⚠️ TODO: Implementar com whatsapp-web.js ou remover
    // promoteParticipantToAdmin não está disponível no whatsappWebJSService
    return res.status(501).json({
      success: false,
      error: 'Funcionalidade não disponível',
      message: 'promoteParticipantToAdmin() não implementado em whatsapp-web.js',
    });

  } catch (error: any) {
    logger.error('❌ Erro ao promover participante:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao promover participante',
      message: error.message,
    });
  }
});

/**
 * POST /api/whatsapp/groups/:id/demote
 * Remover admin de participante
 *
 * @body { participantNumber }
 */
router.post('/groups/:id/demote', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { participantNumber } = req.body;

    if (!participantNumber) {
      return res.status(400).json({
        success: false,
        message: 'participantNumber é obrigatório',
      });
    }

    logger.info(`👤 Removendo admin de ${participantNumber} no grupo ${id}`);

    // ⚠️ TODO: Implementar com whatsapp-web.js ou remover
    // demoteParticipantFromAdmin não está disponível no whatsappWebJSService
    return res.status(501).json({
      success: false,
      error: 'Funcionalidade não disponível',
      message: 'demoteParticipantFromAdmin() não implementado em whatsapp-web.js',
    });

  } catch (error: any) {
    logger.error('❌ Erro ao remover admin:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao remover admin',
      message: error.message,
    });
  }
});

// ==========================================
// FASE B: UPLOAD DE MÍDIA PARA WHATSAPP
// ==========================================

/**
 * POST /api/whatsapp/upload-media
 * Upload de arquivo de mídia (áudio, vídeo, imagem, documento)
 *
 * @body FormData com campo 'media' contendo o arquivo
 * @returns { filePath: string, filename: string, mimetype: string, size: number }
 *
 * Uso:
 * 1. Frontend faz upload do arquivo para este endpoint
 * 2. Backend salva no servidor e retorna filePath
 * 3. Frontend usa filePath para chamar /send-audio, /send-file, etc.
 */
router.post(
  '/upload-media',
  authenticate,
  uploadWhatsappMedia.single('media'),
  async (req: Request, res: Response) => {
    try {
      logger.info('📤 Upload de mídia WhatsApp recebido');

      if (!req.file) {
        logger.warn('❌ Nenhum arquivo enviado no upload-media');
        return res.status(400).json({
          success: false,
          message: 'Nenhum arquivo enviado. Use o campo "media" no FormData.',
        });
      }

      const filePath = req.file.path;
      const filename = req.file.filename;
      const mimetype = req.file.mimetype;
      const size = req.file.size;

      logger.info('✅ Mídia WhatsApp salva com sucesso:', {
        filename,
        filePath,
        mimetype,
        size: `${(size / 1024 / 1024).toFixed(2)} MB`,
      });

      // Retornar informações do arquivo
      res.json({
        success: true,
        data: {
          filePath,      // Caminho absoluto no servidor
          filename,      // Nome do arquivo salvo
          originalName: req.file.originalname,
          mimetype,
          size,
        },
        message: 'Mídia enviada com sucesso. Use o filePath para enviar via WhatsApp.',
      });

    } catch (error: any) {
      logger.error('❌ Erro ao fazer upload de mídia WhatsApp:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao fazer upload de mídia',
        message: error.message,
      });
    }
  }
);

/**
 * DELETE /api/whatsapp/upload-media/:filename
 * Deletar arquivo de mídia do servidor
 *
 * @param filename - Nome do arquivo a ser deletado
 */
router.delete('/upload-media/:filename', authenticate, async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;

    if (!filename) {
      return res.status(400).json({
        success: false,
        message: 'Nome do arquivo não fornecido',
      });
    }

    const filePath = path.join(whatsappUploadsDir, filename);

    // Verificar se arquivo existe
    if (!fs.existsSync(filePath)) {
      logger.warn(`⚠️  Arquivo não encontrado para deletar: ${filename}`);
      return res.status(404).json({
        success: false,
        message: 'Arquivo não encontrado',
      });
    }

    // Deletar arquivo
    fs.unlinkSync(filePath);
    logger.info(`🗑️  Mídia WhatsApp deletada: ${filename}`);

    res.json({
      success: true,
      message: 'Arquivo deletado com sucesso',
    });

  } catch (error: any) {
    logger.error('❌ Erro ao deletar mídia WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar mídia',
      message: error.message,
    });
  }
});

// ==========================================
// 🔍 DEBUG: ROTAS DE EXPLORAÇÃO E TESTE DE APIs
// ==========================================

/**
 * GET /api/whatsapp/debug/explore-apis
 * Explorar todas as APIs disponíveis no window.WPP e window.Store
 * Retorna estrutura completa de módulos e funções disponíveis
 */
router.get('/debug/explore-apis', authenticate, async (req: Request, res: Response) => {
  try {
    // ⚠️ TODO: Implementar com whatsapp-web.js ou remover
    // exploreWhatsAppAPIs não está disponível (era específico do WPPConnect)
    return res.status(501).json({
      success: false,
      error: 'Funcionalidade não disponível',
      message: 'exploreWhatsAppAPIs() era específico do WPPConnect',
    });

  } catch (error: any) {
    logger.error('❌ Erro ao explorar APIs:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao explorar APIs',
      message: error.message,
    });
  }
});

/**
 * POST /api/whatsapp/debug/test-send-methods
 * Testar diferentes métodos de envio de mensagem
 *
 * @body { to: string, message?: string }
 */
router.post('/debug/test-send-methods', authenticate, async (req: Request, res: Response) => {
  try {
    const { to, message } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        message: 'Campo "to" é obrigatório',
      });
    }

    // ⚠️ TODO: Implementar com whatsapp-web.js ou remover
    // testAlternativeSendMethods não está disponível (era específico do WPPConnect)
    return res.status(501).json({
      success: false,
      error: 'Funcionalidade não disponível',
      message: 'testAlternativeSendMethods() era específico do WPPConnect',
    });

  } catch (error: any) {
    logger.error('❌ Erro ao testar métodos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao testar métodos',
      message: error.message,
    });
  }
});

export default router;
