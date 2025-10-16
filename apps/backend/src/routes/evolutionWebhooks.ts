/**
 * Evolution API Webhooks - Recebe e processa webhooks da Evolution API
 *
 * Webhooks recebidos:
 * - QRCODE_UPDATED: QR code atualizado
 * - CONNECTION_UPDATE: Status da conexão (open, close, connecting)
 * - MESSAGES_UPSERT: Novas mensagens (recebidas ou enviadas)
 * - MESSAGES_UPDATE: Atualização de mensagens (ACK - checkmarks)
 * - CONTACTS_UPSERT: Novos contatos
 * - CHATS_UPSERT: Novos chats
 */

import { Router, Request, Response } from 'express';
import evolutionService, { EvolutionConnectionState, EvolutionMessage } from '../services/evolutionService';
import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Socket.IO será injetado pelo server.ts
let io: Server;

export const setSocketIO = (socketIO: Server) => {
  io = socketIO;
  logger.info('✅ Socket.IO configurado nos webhooks Evolution');
};

/**
 * Endpoint principal para webhooks Evolution API
 * POST /webhooks/evolution
 */
router.post('/evolution', async (req: Request, res: Response) => {
  try {
    const { event, instance, data } = req.body;

    logger.info(`📥 Webhook Evolution recebido: ${event}`, {
      instance,
      dataKeys: Object.keys(data || {})
    });

    // Processa evento baseado no tipo
    switch (event) {
      case 'qrcode.updated':
        handleQRCodeUpdated(data);
        break;

      case 'connection.update':
        handleConnectionUpdate(data);
        break;

      case 'messages.upsert':
        await handleMessagesUpsert(data);
        break;

      case 'messages.update':
        await handleMessagesUpdate(data);
        break;

      case 'contacts.upsert':
        await handleContactsUpsert(data);
        break;

      case 'chats.upsert':
        await handleChatsUpsert(data);
        break;

      case 'send.message':
        // Mensagem enviada - já foi processada no sendText
        logger.info('📤 Confirmação de envio:', data);
        break;

      case 'messages.delete':
        await handleMessagesDelete(data);
        break;

      case 'presence.update':
        handlePresenceUpdate(data);
        break;

      case 'groups.upsert':
        await handleGroupsUpsert(data);
        break;

      case 'groups.update':
        await handleGroupsUpdate(data);
        break;

      case 'group.participants.update':
        await handleGroupParticipantsUpdate(data);
        break;

      default:
        logger.info('⚠️ Evento não tratado:', event);
    }

    // Sempre responde 200 para não reenviar webhook
    res.status(200).json({ success: true });

  } catch (error: any) {
    logger.error('❌ Erro ao processar webhook Evolution:', error);
    // Mesmo com erro, retorna 200 para não reenviar
    res.status(200).json({ success: false, error: error.message });
  }
});

/**
 * Processa QR Code atualizado
 */
function handleQRCodeUpdated(data: any): void {
  try {
    const qrCode = data.qrcode?.base64 || data.qrcode?.code;

    if (qrCode) {
      // Atualiza QR code no serviço
      evolutionService.updateQRCode(qrCode);

      // Emite via WebSocket para frontend
      if (io) {
        io.emit('whatsapp:qr', { qrCode });
        logger.info('📱 QR Code enviado via WebSocket');
      }
    }

  } catch (error: any) {
    logger.error('❌ Erro ao processar QR code:', error);
  }
}

/**
 * Processa atualização de conexão
 */
function handleConnectionUpdate(data: any): void {
  try {
    const state = data.state as EvolutionConnectionState;

    logger.info('🔄 Atualização de conexão:', { state });

    // Atualiza estado no serviço
    evolutionService.updateConnectionState(state, data);

    // Emite via WebSocket
    if (io) {
      io.emit('whatsapp:status', {
        connected: state === EvolutionConnectionState.OPEN,
        state: state
      });
      logger.info('📡 Status enviado via WebSocket:', { state });
    }

  } catch (error: any) {
    logger.error('❌ Erro ao processar atualização de conexão:', error);
  }
}

/**
 * Processa novas mensagens (recebidas ou enviadas)
 */
async function handleMessagesUpsert(data: any): Promise<void> {
  try {
    const messages: EvolutionMessage[] = data.messages || [];

    for (const msg of messages) {
      logger.info('📨 Processando mensagem:', {
        id: msg.key?.id,
        fromMe: msg.key?.fromMe,
        remoteJid: msg.key?.remoteJid
      });

      // Ignora mensagens antigas (mais de 5 minutos)
      const messageTimestamp = msg.messageTimestamp * 1000;
      const messageAge = Date.now() - messageTimestamp;

      if (messageAge > 5 * 60 * 1000) {
        logger.info('⏭️ Mensagem antiga ignorada:', { id: msg.key?.id, age: messageAge });
        continue;
      }

      // Extrai número do contato (remove @s.whatsapp.net)
      const contactNumber = evolutionService.extractPhoneNumber(msg.key.remoteJid);

      // Busca ou cria contato
      let contact = await prisma.whatsAppContact.findUnique({
        where: { phoneNumber: contactNumber }
      });

      if (!contact) {
        logger.info('👤 Criando novo contato:', contactNumber);

        contact = await prisma.whatsAppContact.create({
          data: {
            phoneNumber: contactNumber,
            name: contactNumber, // Será atualizado via webhook CONTACTS_UPSERT
            profilePictureUrl: null
          }
        });
      }

      // Busca ou cria conversa
      let conversation = await prisma.whatsAppConversation.findUnique({
        where: { contactId: contact.id }
      });

      if (!conversation) {
        logger.info('💬 Criando nova conversa:', contact.phoneNumber);

        conversation = await prisma.whatsAppConversation.create({
          data: {
            contactId: contact.id,
            lastMessage: '',
            lastMessageAt: new Date(),
            unreadCount: 0
          }
        });
      }

      // Extrai texto da mensagem
      const messageText = evolutionService.extractMessageText(msg);

      // Salva mensagem no banco
      const savedMessage = await prisma.whatsAppMessage.create({
        data: {
          conversationId: conversation.id,
          messageId: msg.key.id,
          fromMe: msg.key.fromMe,
          body: messageText,
          timestamp: new Date(messageTimestamp),
          status: msg.status || 0,
          mediaUrl: null // TODO: extrair URL de mídia se houver
        }
      });

      // Atualiza última mensagem da conversa
      await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: {
          lastMessage: messageText.substring(0, 100),
          lastMessageAt: new Date(messageTimestamp),
          unreadCount: msg.key.fromMe ? 0 : { increment: 1 }
        }
      });

      // Emite via WebSocket para frontend atualizar em tempo real
      if (io) {
        io.emit('whatsapp:message', {
          conversationId: conversation.id,
          message: {
            id: savedMessage.id,
            messageId: savedMessage.messageId,
            fromMe: savedMessage.fromMe,
            body: savedMessage.body,
            timestamp: savedMessage.timestamp,
            status: savedMessage.status
          }
        });

        logger.info('📡 Mensagem enviada via WebSocket:', {
          conversationId: conversation.id,
          fromMe: msg.key.fromMe
        });
      }
    }

  } catch (error: any) {
    logger.error('❌ Erro ao processar mensagens:', error);
  }
}

/**
 * Processa atualização de mensagens (ACK - checkmarks)
 */
async function handleMessagesUpdate(data: any): Promise<void> {
  try {
    const updates: any[] = data.messages || [];

    for (const update of updates) {
      const messageId = update.key?.id;
      const status = update.update?.status;

      if (!messageId || status === undefined) {
        continue;
      }

      logger.info('✓ Atualizando status da mensagem:', {
        messageId,
        status,
        statusName: getStatusName(status)
      });

      // Atualiza no banco
      const message = await prisma.whatsAppMessage.updateMany({
        where: { messageId: messageId },
        data: { status: status }
      });

      if (message.count === 0) {
        logger.warn('⚠️ Mensagem não encontrada para atualizar ACK:', messageId);
        continue;
      }

      // Busca mensagem atualizada para pegar conversationId
      const updatedMessage = await prisma.whatsAppMessage.findFirst({
        where: { messageId: messageId }
      });

      if (!updatedMessage) continue;

      // Emite via WebSocket para atualizar checkmarks no frontend
      if (io) {
        io.emit('whatsapp:message:ack', {
          conversationId: updatedMessage.conversationId,
          messageId: messageId,
          status: status,
          statusName: getStatusName(status)
        });

        logger.info(`📡 ACK enviado via WebSocket: ${getStatusName(status)} (${status === 3 ? '✓✓ AZUL' : ''})`);
      }
    }

  } catch (error: any) {
    logger.error('❌ Erro ao processar atualização de mensagens:', error);
  }
}

/**
 * Processa novos contatos
 */
async function handleContactsUpsert(data: any): Promise<void> {
  try {
    const contacts: any[] = data.contacts || [];

    for (const contact of contacts) {
      const phoneNumber = evolutionService.extractPhoneNumber(contact.id);
      const name = contact.name || contact.pushName || contact.notify || phoneNumber;

      await prisma.whatsAppContact.upsert({
        where: { phoneNumber },
        update: {
          name: name,
          profilePictureUrl: contact.profilePictureUrl || null
        },
        create: {
          phoneNumber,
          name,
          profilePictureUrl: contact.profilePictureUrl || null
        }
      });

      logger.info('👤 Contato atualizado:', { phoneNumber, name });
    }

  } catch (error: any) {
    logger.error('❌ Erro ao processar contatos:', error);
  }
}

/**
 * Processa novos chats
 */
async function handleChatsUpsert(data: any): Promise<void> {
  try {
    const chats: any[] = data.chats || [];

    for (const chat of chats) {
      const phoneNumber = evolutionService.extractPhoneNumber(chat.id);

      // Busca ou cria contato
      let contact = await prisma.whatsAppContact.findUnique({
        where: { phoneNumber }
      });

      if (!contact) {
        contact = await prisma.whatsAppContact.create({
          data: {
            phoneNumber,
            name: chat.name || phoneNumber,
            profilePictureUrl: null
          }
        });
      }

      // Busca ou cria conversa
      const conversation = await prisma.whatsAppConversation.upsert({
        where: { contactId: contact.id },
        update: {
          unreadCount: chat.unreadCount || 0
        },
        create: {
          contactId: contact.id,
          lastMessage: '',
          lastMessageAt: new Date(),
          unreadCount: chat.unreadCount || 0
        }
      });

      logger.info('💬 Chat atualizado:', { phoneNumber, conversationId: conversation.id });
    }

  } catch (error: any) {
    logger.error('❌ Erro ao processar chats:', error);
  }
}

/**
 * Helper: Nome do status ACK
 */
function getStatusName(status: number): string {
  switch (status) {
    case 0: return 'PENDING';
    case 1: return 'SERVER';
    case 2: return 'DELIVERED';
    case 3: return 'READ';
    case 4: return 'PLAYED';
    default: return 'UNKNOWN';
  }
}

/**
 * Processa deleção de mensagens
 */
async function handleMessagesDelete(data: any): Promise<void> {
  try {
    const messages: any[] = data.messages || [];

    for (const msg of messages) {
      const messageId = msg.key?.id;

      if (!messageId) continue;

      logger.info('🗑️ Deletando mensagem:', messageId);

      // Marca como deletada no banco
      await prisma.whatsAppMessage.updateMany({
        where: { whatsappMessageId: messageId },
        data: { isDeleted: true }
      });

      // Busca mensagem para pegar conversationId
      const message = await prisma.whatsAppMessage.findFirst({
        where: { whatsappMessageId: messageId }
      });

      if (!message) continue;

      // Emite via WebSocket
      if (io) {
        io.emit('whatsapp:message:deleted', {
          conversationId: message.conversationId,
          messageId: messageId
        });

        logger.info('📡 Deleção enviada via WebSocket');
      }
    }

  } catch (error: any) {
    logger.error('❌ Erro ao processar deleção de mensagens:', error);
  }
}

/**
 * Processa atualização de presença
 */
function handlePresenceUpdate(data: any): void {
  try {
    const { id, presences } = data;

    if (!presences) return;

    logger.info('👁️ Atualização de presença:', { id, presences });

    // Emite via WebSocket
    if (io) {
      io.emit('whatsapp:presence', {
        contactId: id,
        presences: presences
      });
    }

  } catch (error: any) {
    logger.error('❌ Erro ao processar presença:', error);
  }
}

/**
 * Processa novos grupos
 */
async function handleGroupsUpsert(data: any): Promise<void> {
  try {
    const groups: any[] = data.groups || [];

    for (const group of groups) {
      logger.info('👥 Novo grupo detectado:', {
        id: group.id,
        subject: group.subject
      });

      const phoneNumber = evolutionService.extractPhoneNumber(group.id);

      // Cria contato para o grupo
      await prisma.whatsAppContact.upsert({
        where: { phoneNumber },
        update: {
          name: group.subject || phoneNumber,
          profilePictureUrl: group.profilePictureUrl || null
        },
        create: {
          phoneNumber,
          name: group.subject || phoneNumber,
          profilePictureUrl: group.profilePictureUrl || null
        }
      });
    }

  } catch (error: any) {
    logger.error('❌ Erro ao processar grupos:', error);
  }
}

/**
 * Processa atualização de grupos
 */
async function handleGroupsUpdate(data: any): Promise<void> {
  try {
    const updates: any[] = data.groups || [];

    for (const update of updates) {
      logger.info('👥 Grupo atualizado:', {
        id: update.id,
        subject: update.subject
      });

      const phoneNumber = evolutionService.extractPhoneNumber(update.id);

      // Atualiza contato do grupo
      await prisma.whatsAppContact.upsert({
        where: { phoneNumber },
        update: {
          name: update.subject || phoneNumber,
          profilePictureUrl: update.profilePictureUrl || null
        },
        create: {
          phoneNumber,
          name: update.subject || phoneNumber,
          profilePictureUrl: update.profilePictureUrl || null
        }
      });
    }

  } catch (error: any) {
    logger.error('❌ Erro ao processar atualização de grupos:', error);
  }
}

/**
 * Processa atualização de participantes de grupo
 */
async function handleGroupParticipantsUpdate(data: any): Promise<void> {
  try {
    const { id, participants, action } = data;

    logger.info('👥 Participantes atualizados:', {
      groupId: id,
      participants,
      action
    });

    // Emite via WebSocket
    if (io) {
      io.emit('whatsapp:group:participants', {
        groupId: id,
        participants,
        action
      });
    }

  } catch (error: any) {
    logger.error('❌ Erro ao processar participantes de grupo:', error);
  }
}

/**
 * Health check
 */
router.get('/evolution/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Evolution API Webhooks',
    socketIO: io ? 'connected' : 'not configured',
    timestamp: new Date().toISOString()
  });
});

export default router;
