/**
 * WAHA Webhooks - Recebe e processa webhooks do WAHA
 * Substitui callbacks do WPPConnect por webhooks HTTP confiáveis
 */

import { Router, Request, Response } from 'express';
import wahaService, { WAHAMessage, WAHAAckStatus, WAHASessionStatus } from '../services/wahaService';
import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';

const router = Router();
const prisma = new PrismaClient();

// Socket.IO será injetado pelo server.ts
let io: Server;

export const setSocketIO = (socketIO: Server) => {
  io = socketIO;
  console.log('✅ Socket.IO configurado nos webhooks WAHA');
};

/**
 * Endpoint principal para webhooks WAHA
 * POST /webhooks/waha
 */
router.post('/waha', async (req: Request, res: Response) => {
  try {
    const { event, session, payload } = req.body;

    console.log(`📥 Webhook WAHA recebido: ${event}`, {
      session,
      payloadKeys: Object.keys(payload || {})
    });

    // Processa evento baseado no tipo
    switch (event) {
      case 'message':
        await handleIncomingMessage(payload);
        break;

      case 'message.ack':
        await handleMessageAck(payload);
        break;

      case 'session.status':
        handleSessionStatus(payload);
        break;

      case 'state.change':
        handleStateChange(payload);
        break;

      default:
        console.log('⚠️ Evento não tratado:', event);
    }

    // Sempre responde 200 para não reenviar webhook
    res.status(200).json({ success: true });

  } catch (error: any) {
    console.error('❌ Erro ao processar webhook WAHA:', error);
    // Mesmo com erro, retorna 200 para não reenviar
    res.status(200).json({ success: false, error: error.message });
  }
});

/**
 * Processa mensagem recebida
 */
async function handleIncomingMessage(wahaMessage: WAHAMessage): Promise<void> {
  try {
    console.log('📨 Processando mensagem recebida:', {
      id: wahaMessage.id,
      from: wahaMessage.from,
      fromMe: wahaMessage.fromMe,
      type: wahaMessage.type,
      body: wahaMessage.body?.substring(0, 50)
    });

    // Ignora mensagens antigas (mais de 5 minutos)
    const messageAge = Date.now() - (wahaMessage.timestamp * 1000);
    if (messageAge > 5 * 60 * 1000) {
      console.log('⏭️ Mensagem antiga ignorada:', wahaMessage.id);
      return;
    }

    // Extrai número do contato
    const contactNumber = wahaService.extractPhoneNumber(
      wahaMessage.fromMe ? wahaMessage.to : wahaMessage.from
    );

    // Busca ou cria contato
    let contact = await prisma.whatsAppContact.findUnique({
      where: { phoneNumber: contactNumber }
    });

    if (!contact) {
      console.log('👤 Criando novo contato:', contactNumber);

      // Busca informações do contato no WAHA
      const wahaContact = await wahaService.getContact(contactNumber);

      contact = await prisma.whatsAppContact.create({
        data: {
          phoneNumber: contactNumber,
          name: wahaContact?.name || wahaContact?.pushname || contactNumber,
          profilePicUrl: null,
          isGroup: false
        }
      });

      // Emite evento de novo contato
      if (io) {
        io.emit('contact:new', contact);
      }
    }

    // Busca ou cria conversa
    let conversation = await prisma.whatsAppConversation.findFirst({
      where: { contactId: contact.id }
    });

    if (!conversation) {
      console.log('💬 Criando nova conversa para:', contact.name);

      conversation = await prisma.whatsAppConversation.create({
        data: {
          contactId: contact.id,
          lastMessageAt: new Date(wahaMessage.timestamp * 1000),
          unreadCount: wahaMessage.fromMe ? 0 : 1
        }
      });

      // Emite evento de nova conversa
      if (io) {
        io.emit('conversation:new', conversation);
      }
    }

    // Verifica se mensagem já existe (evita duplicatas)
    const existingMessage = await prisma.whatsAppMessage.findFirst({
      where: {
        OR: [
          { externalId: wahaMessage.id },
          {
            conversationId: conversation.id,
            content: wahaMessage.body || '',
            timestamp: new Date(wahaMessage.timestamp * 1000)
          }
        ]
      }
    });

    if (existingMessage) {
      console.log('⏭️ Mensagem duplicada ignorada:', wahaMessage.id);
      return;
    }

    // Mapeia tipo de mensagem
    let messageType = 'text';
    let mediaUrl: string | undefined;

    if (wahaMessage.hasMedia && wahaMessage.mediaUrl) {
      mediaUrl = wahaMessage.mediaUrl;

      switch (wahaMessage.type) {
        case 'image':
          messageType = 'image';
          break;
        case 'video':
          messageType = 'video';
          break;
        case 'audio':
        case 'ptt':
          messageType = 'audio';
          break;
        case 'document':
          messageType = 'document';
          break;
        default:
          messageType = 'text';
      }
    }

    // Mapeia status ACK
    let status = 'pending';
    if (wahaMessage.ack !== undefined) {
      switch (wahaMessage.ack) {
        case WAHAAckStatus.ERROR:
          status = 'error';
          break;
        case WAHAAckStatus.PENDING:
          status = 'pending';
          break;
        case WAHAAckStatus.SERVER:
          status = 'sent';
          break;
        case WAHAAckStatus.DEVICE:
          status = 'delivered';
          break;
        case WAHAAckStatus.READ:
          status = 'read';
          break;
        case WAHAAckStatus.PLAYED:
          status = 'played';
          break;
      }
    }

    // Salva mensagem no banco
    const message = await prisma.whatsAppMessage.create({
      data: {
        conversationId: conversation.id,
        externalId: wahaMessage.id,
        type: messageType,
        content: wahaMessage.body || '',
        mediaUrl: mediaUrl,
        fromMe: wahaMessage.fromMe,
        status: status,
        timestamp: new Date(wahaMessage.timestamp * 1000)
      }
    });

    console.log('✅ Mensagem salva:', message.id);

    // Atualiza conversa
    const updateData: any = {
      lastMessageAt: new Date(wahaMessage.timestamp * 1000)
    };

    if (!wahaMessage.fromMe) {
      updateData.unreadCount = { increment: 1 };
    }

    await prisma.whatsAppConversation.update({
      where: { id: conversation.id },
      data: updateData
    });

    // Emite eventos WebSocket
    if (io) {
      // Emite mensagem nova
      io.emit('message:new', {
        ...message,
        conversationId: conversation.id
      });

      console.log('📡 WebSocket emitido: message:new', message.id);

      // Emite atualização da conversa
      io.emit('conversation:update', conversation.id);

      console.log('📡 WebSocket emitido: conversation:update', conversation.id);
    } else {
      console.warn('⚠️ Socket.IO não disponível para emitir eventos');
    }

  } catch (error: any) {
    console.error('❌ Erro ao processar mensagem recebida:', error);
    throw error;
  }
}

/**
 * Processa atualização de ACK (status da mensagem)
 * CRÍTICO: Este é o evento que resolve o problema das checkmarks azuis!
 */
async function handleMessageAck(ackData: any): Promise<void> {
  try {
    const { id, ack, from, to } = ackData;

    console.log('✓ ACK recebido:', {
      messageId: id,
      ack: ack,
      ackName: WAHAAckStatus[ack]
    });

    // Mapeia ACK code para status
    let status = 'pending';
    switch (ack) {
      case WAHAAckStatus.ERROR:
        status = 'error';
        break;
      case WAHAAckStatus.PENDING:
        status = 'pending';
        break;
      case WAHAAckStatus.SERVER:
        status = 'sent';
        break;
      case WAHAAckStatus.DEVICE:
        status = 'delivered'; // ✓✓
        break;
      case WAHAAckStatus.READ:
        status = 'read'; // ✓✓ AZUL - FINALMENTE FUNCIONA!
        break;
      case WAHAAckStatus.PLAYED:
        status = 'played';
        break;
    }

    // Busca mensagem no banco pelo externalId
    const message = await prisma.whatsAppMessage.findFirst({
      where: { externalId: id }
    });

    if (!message) {
      console.warn('⚠️ Mensagem não encontrada para ACK:', id);
      return;
    }

    // Atualiza status da mensagem
    const updatedMessage = await prisma.whatsAppMessage.update({
      where: { id: message.id },
      data: { status: status }
    });

    console.log(`✅ Status atualizado: ${message.id} -> ${status}`);

    // Emite evento WebSocket para frontend atualizar em tempo real
    if (io) {
      io.emit('message:status', {
        messageIds: [message.id],
        status: status
      });

      console.log(`📡 WebSocket emitido: message:status -> ${status} (✓✓${status === 'read' ? ' AZUL' : ''})`);
    } else {
      console.warn('⚠️ Socket.IO não disponível para emitir ACK');
    }

  } catch (error: any) {
    console.error('❌ Erro ao processar ACK:', error);
  }
}

/**
 * Processa mudança de status da sessão
 */
function handleSessionStatus(statusData: any): void {
  try {
    const { status } = statusData;

    console.log('📊 Status da sessão:', status);

    // Atualiza status no serviço
    wahaService.updateSessionStatusFromWebhook(status as WAHASessionStatus, statusData);

    // Emite evento WebSocket
    if (io) {
      io.emit('whatsapp:status', {
        connected: status === WAHASessionStatus.WORKING,
        status: status
      });
    }

  } catch (error: any) {
    console.error('❌ Erro ao processar status da sessão:', error);
  }
}

/**
 * Processa mudança de estado (typing, presence, etc)
 */
function handleStateChange(stateData: any): void {
  try {
    console.log('🔄 Mudança de estado:', stateData);

    // Emite evento WebSocket para frontend
    if (io && stateData.type) {
      switch (stateData.type) {
        case 'typing':
          io.emit('whatsapp:typing', {
            contactId: stateData.from,
            isTyping: stateData.isTyping || false,
            isRecording: stateData.isRecording || false
          });
          break;

        case 'presence':
          io.emit('whatsapp:presence', {
            contactId: stateData.from,
            state: stateData.state
          });
          break;
      }
    }

  } catch (error: any) {
    console.error('❌ Erro ao processar mudança de estado:', error);
  }
}

/**
 * Health check para verificar se webhooks estão funcionando
 */
router.get('/waha/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'WAHA Webhooks',
    socketIO: io ? 'connected' : 'not configured',
    timestamp: new Date().toISOString()
  });
});

export default router;
