/**
 * WhatsApp Chat Service
 * Sincroniza mensagens do WAHA com o banco PostgreSQL
 * Gerencia conversas e mensagens em tempo real
 */

import { PrismaClient, MessageType, MessageStatus } from '@prisma/client';
import { Server as SocketIOServer } from 'socket.io';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export class WhatsAppChatService {
  private io: SocketIOServer | null = null;

  /**
   * Define o servidor WebSocket para emitir eventos real-time
   */
  setSocketServer(io: SocketIOServer): void {
    this.io = io;
    logger.info('📡 WebSocket server configurado no WhatsAppChatService');
  }

  /**
   * Busca ou cria um contato no banco
   */
  private async findOrCreateContact(phone: string, name: string) {
    let contact = await prisma.whatsAppContact.findUnique({
      where: { phone },
    });

    if (!contact) {
      // Tentar vincular com Lead existente
      const lead = await prisma.lead.findFirst({
        where: { phone },
      });

      contact = await prisma.whatsAppContact.create({
        data: {
          phone,
          name,
          leadId: lead?.id || null,
        },
      });

      logger.info(`👤 Novo contato criado: ${phone}`);
    }

    return contact;
  }

  /**
   * Busca ou cria uma conversa para o contato
   */
  private async findOrCreateConversation(contactId: string) {
    let conversation = await prisma.whatsAppConversation.findFirst({
      where: { contactId },
    });

    if (!conversation) {
      conversation = await prisma.whatsAppConversation.create({
        data: {
          contactId,
          lastMessageAt: new Date(),
        },
      });

      logger.info(`💬 Nova conversa criada: ${conversation.id}`);
    }

    return conversation;
  }

  /**
   * Determina o tipo de mensagem (compatível com WAHA)
   */
  private getMessageType(messageData: any): MessageType {
    if (!messageData) return MessageType.TEXT;

    const type = messageData.type?.toLowerCase() || '';

    if (type.includes('image')) return MessageType.IMAGE;
    if (type.includes('video')) return MessageType.VIDEO;
    if (type.includes('audio') || type === 'ptt') return MessageType.AUDIO;
    if (type.includes('document')) return MessageType.DOCUMENT;
    if (type === 'location') return MessageType.LOCATION;
    if (type === 'vcard') return MessageType.CONTACT;

    return MessageType.TEXT;
  }

  /**
   * Gera preview curto da mensagem para exibir na lista
   */
  private getMessagePreview(content: string, type: MessageType): string {
    if (type !== MessageType.TEXT) {
      const typeLabels: Record<MessageType, string> = {
        TEXT: '',
        IMAGE: '📷 Imagem',
        VIDEO: '🎥 Vídeo',
        AUDIO: '🎵 Áudio',
        DOCUMENT: '📄 Documento',
        STICKER: '🎨 Sticker',
        LOCATION: '📍 Localização',
        CONTACT: '👤 Contato',
        LINK: '🔗 Link',
      };
      return typeLabels[type];
    }

    return content.length > 50 ? content.substring(0, 50) + '...' : content;
  }

  /**
   * Lista todas as conversas (ordenadas por última mensagem)
   * ✅ SIMPLIFICADO: Só retorna conversas onde O SISTEMA enviou mensagens
   */
  async getConversations(limit = 50) {
    return prisma.whatsAppConversation.findMany({
      where: {
        messages: {
          some: {
            fromMe: true, // ✅ Só conversas com mensagens enviadas pelo sistema
          },
        },
      },
      take: limit,
      orderBy: { lastMessageAt: 'desc' },
      include: {
        contact: true,
        messages: {
          take: 1,
          orderBy: { timestamp: 'desc' },
        },
      },
    });
  }

  /**
   * Busca uma conversa específica
   */
  async getConversation(conversationId: string) {
    return prisma.whatsAppConversation.findUnique({
      where: { id: conversationId },
      include: {
        contact: true,
      },
    });
  }

  /**
   * Lista mensagens de uma conversa (com paginação)
   * ✅ CORRIGIDO: Retorna TODAS as mensagens (enviadas e recebidas)
   */
  async getMessages(conversationId: string, limit = 100, offset = 0) {
    return prisma.whatsAppMessage.findMany({
      where: {
        conversationId,
        // ✅ REMOVIDO filtro fromMe - agora mostra todas as mensagens
      },
      orderBy: { timestamp: 'asc' },
      take: limit,
      skip: offset,
      include: {
        contact: true,
      },
    });
  }

  /**
   * ✅ NOVO: Atualiza status da mensagem baseado no ACK do WhatsApp
   * ACK codes:
   * 0 = ERROR
   * 1 = PENDING
   * 2 = SERVER (enviado para servidor WhatsApp)
   * 3 = DEVICE (entregue no dispositivo do destinatário)
   * 4 = READ (lido pelo destinatário)
   * 5 = PLAYED (áudio/vídeo reproduzido)
   */
  async updateMessageStatus(whatsappMessageId: string, ackCode: number): Promise<void> {
    try {
      // Mapear ACK code para MessageStatus
      let status: MessageStatus;
      let readAt: Date | null = null;
      let deliveredAt: Date | null = null;

      switch (ackCode) {
        case 0:
          status = MessageStatus.FAILED;
          break;
        case 1:
          status = MessageStatus.PENDING;
          break;
        case 2:
          status = MessageStatus.SENT;
          break;
        case 3:
          status = MessageStatus.DELIVERED;
          deliveredAt = new Date();
          break;
        case 4:
        case 5:
          status = MessageStatus.READ;
          readAt = new Date();
          deliveredAt = new Date();
          break;
        default:
          status = MessageStatus.SENT;
      }

      // Atualizar mensagem no banco
      const updated = await prisma.whatsAppMessage.updateMany({
        where: { whatsappMessageId },
        data: {
          status,
          ...(readAt && { readAt }),
          ...(deliveredAt && { deliveredAt }),
        },
      });

      if (updated.count > 0) {
        logger.info(`✅ Status atualizado: ${whatsappMessageId} -> ${status} (${updated.count} mensagem(ns))`);

        // Buscar mensagem atualizada para obter o ID
        const message = await prisma.whatsAppMessage.findFirst({
          where: { whatsappMessageId },
          select: { id: true },
        });

        if (!message) {
          logger.warn(`⚠️  Mensagem ${whatsappMessageId} não encontrada após update`);
          return;
        }

        // Emitir evento WebSocket
        if (this.io) {
          this.io.sockets.sockets.forEach((socket) => {
            socket.emit('message:status', {
              messageIds: [message.id],
              status,
              readAt,
              deliveredAt,
            });
          });
        }
      } else {
        logger.warn(`⚠️  Nenhuma mensagem encontrada com whatsappMessageId: ${whatsappMessageId}`);
      }
    } catch (error) {
      logger.error(`❌ Erro ao atualizar status da mensagem ${whatsappMessageId}:`, error);
    }
  }

  /**
   * Marca mensagens como lidas
   */
  async markAsRead(messageIds: string[]) {
    const updated = await prisma.whatsAppMessage.updateMany({
      where: {
        id: { in: messageIds },
        status: { not: MessageStatus.READ },
      },
      data: {
        status: MessageStatus.READ,
        readAt: new Date(),
      },
    });

    // Emitir evento de atualização
    if (this.io && updated.count > 0) {
      this.io.sockets.sockets.forEach((socket) => {
        socket.emit('message:status', { messageIds, status: MessageStatus.READ });
      });
    }

    return updated;
  }

  /**
   * Atualiza contador de não lidas da conversa
   */
  async updateUnreadCount(conversationId: string) {
    const unreadCount = await prisma.whatsAppMessage.count({
      where: {
        conversationId,
        fromMe: false,
        status: { not: MessageStatus.READ },
      },
    });

    await prisma.whatsAppConversation.update({
      where: { id: conversationId },
      data: { unreadCount },
    });

    return unreadCount;
  }

  /**
   * Busca conversas por termo (nome ou telefone)
   */
  async searchConversations(query: string) {
    return prisma.whatsAppConversation.findMany({
      where: {
        OR: [
          { contact: { name: { contains: query, mode: 'insensitive' } } },
          { contact: { phone: { contains: query } } },
        ],
      },
      include: {
        contact: true,
      },
      orderBy: { lastMessageAt: 'desc' },
    });
  }
}

export default new WhatsAppChatService();
