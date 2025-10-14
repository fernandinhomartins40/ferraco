/**
 * WhatsApp Chat Service
 * Sincroniza mensagens do WPPConnect com o banco PostgreSQL
 * Gerencia conversas e mensagens em tempo real
 */

import { PrismaClient, MessageType, MessageStatus } from '@prisma/client';
import type { Message } from '@wppconnect-team/wppconnect';
import { Server as SocketIOServer } from 'socket.io';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export class WhatsAppChatService {
  private io: SocketIOServer | null = null;
  private whatsappClient: any = null;

  /**
   * Define o servidor WebSocket para emitir eventos real-time
   */
  setSocketServer(io: SocketIOServer): void {
    this.io = io;
    logger.info('📡 WebSocket server configurado no WhatsAppChatService');
  }

  /**
   * Define o cliente WPPConnect
   */
  setWhatsAppClient(client: any): void {
    this.whatsappClient = client;
  }

  /**
   * Sincronizar TODOS os chats e contatos do WhatsApp para o banco
   * Chamado quando WhatsApp conecta pela primeira vez
   */
  async syncAllChatsAndContacts(): Promise<void> {
    if (!this.whatsappClient) {
      logger.warn('⚠️  Cliente WhatsApp não disponível para sincronização');
      return;
    }

    try {
      logger.info('🔄 Iniciando sincronização completa de chats e contatos...');

      // 1. Obter todos os chats
      const allChats = await this.whatsappClient.getAllChats();
      logger.info(`📋 Encontrados ${allChats.length} chats`);

      // 2. Processar cada chat
      for (const chat of allChats) {
        try {
          // Extrair número do telefone
          const phone = chat.id._serialized.replace('@c.us', '').replace('@g.us', '');

          // Pular grupos por enquanto (id termina com @g.us)
          if (chat.id._serialized.includes('@g.us')) {
            continue;
          }

          // Obter informações do contato
          const contactInfo = await this.whatsappClient.getContact(chat.id._serialized);
          const contactName = contactInfo?.name || contactInfo?.pushname || contactInfo?.verifiedName || chat.name || phone;

          // Criar/atualizar contato
          const contact = await prisma.whatsAppContact.upsert({
            where: { phone },
            create: {
              phone,
              name: contactName,
              profilePicUrl: chat.profilePicThumb?.eurl || null,
            },
            update: {
              name: contactName,
              profilePicUrl: chat.profilePicThumb?.eurl || null,
              lastSeenAt: chat.t ? new Date(chat.t * 1000) : null,
            },
          });

          // Criar/atualizar conversa
          const conversation = await prisma.whatsAppConversation.upsert({
            where: { contactId: contact.id },
            create: {
              contactId: contact.id,
              lastMessageAt: chat.t ? new Date(chat.t * 1000) : new Date(),
              lastMessagePreview: chat.lastMessage?.body || null,
              unreadCount: chat.unreadCount || 0,
              isPinned: chat.pin || false,
            },
            update: {
              lastMessageAt: chat.t ? new Date(chat.t * 1000) : new Date(),
              lastMessagePreview: chat.lastMessage?.body || null,
              unreadCount: chat.unreadCount || 0,
              isPinned: chat.pin || false,
            },
          });

          logger.info(`✅ Chat sincronizado: ${contactName} (${phone})`);
        } catch (error) {
          logger.error(`❌ Erro ao sincronizar chat ${chat.id}:`, error);
        }
      }

      logger.info('✅ Sincronização completa de chats finalizada!');
    } catch (error) {
      logger.error('❌ Erro ao sincronizar chats:', error);
    }
  }

  /**
   * Carregar histórico completo de mensagens de um chat
   */
  async loadChatHistory(conversationId: string): Promise<void> {
    if (!this.whatsappClient) {
      logger.warn('⚠️  Cliente WhatsApp não disponível');
      return;
    }

    try {
      // Buscar conversa e contato
      const conversation = await prisma.whatsAppConversation.findUnique({
        where: { id: conversationId },
        include: { contact: true },
      });

      if (!conversation) {
        logger.warn(`⚠️  Conversa ${conversationId} não encontrada`);
        return;
      }

      const chatId = `${conversation.contact.phone}@c.us`;

      logger.info(`📥 Carregando histórico do chat ${conversation.contact.name}...`);

      // Carregar todas as mensagens do chat
      const messages = await this.whatsappClient.loadAndGetAllMessagesInChat(chatId);
      logger.info(`📋 Encontradas ${messages.length} mensagens`);

      // Salvar cada mensagem no banco
      for (const msg of messages) {
        try {
          // Verificar se mensagem já existe
          const existingMessage = await prisma.whatsAppMessage.findUnique({
            where: { whatsappMessageId: msg.id },
          });

          if (existingMessage) continue; // Pular se já existe

          const messageType = this.getMessageType(msg);

          await prisma.whatsAppMessage.create({
            data: {
              conversationId: conversation.id,
              contactId: conversation.contact.id,
              type: messageType,
              content: msg.body || '',
              mediaUrl: null,
              mediaType: msg.mimetype || null,
              fromMe: msg.fromMe || false,
              status: MessageStatus.DELIVERED,
              whatsappMessageId: msg.id,
              timestamp: new Date(msg.timestamp * 1000),
            },
          });
        } catch (error) {
          // Ignorar erros de mensagens duplicadas
        }
      }

      logger.info(`✅ Histórico carregado: ${conversation.contact.name}`);
    } catch (error) {
      logger.error('❌ Erro ao carregar histórico:', error);
    }
  }

  /**
   * Handler principal para mensagens recebidas do WPPConnect
   * Salva no banco e emite evento WebSocket
   */
  async handleIncomingMessage(message: Message): Promise<void> {
    try {
      logger.info(`📩 Mensagem recebida de ${message.from}`);

      // Extrair número de telefone (remover @c.us)
      const phone = message.from.replace('@c.us', '');
      const isFromMe = message.fromMe || false;

      // 1. Buscar ou criar contato
      const contact = await this.findOrCreateContact(
        phone,
        message.sender?.name || message.notifyName || phone
      );

      // 2. Buscar ou criar conversa
      const conversation = await this.findOrCreateConversation(contact.id);

      // 3. Determinar tipo de mensagem
      const messageType = this.getMessageType(message);

      // 4. Salvar mensagem
      const savedMessage = await prisma.whatsAppMessage.create({
        data: {
          conversationId: conversation.id,
          contactId: contact.id,
          type: messageType,
          content: message.body || '',
          mediaUrl: message.mimetype ? await this.getMediaUrl(message) : null,
          mediaType: message.mimetype || null,
          fromMe: isFromMe,
          status: MessageStatus.DELIVERED,
          whatsappMessageId: message.id,
          timestamp: new Date(message.timestamp * 1000),
        },
        include: {
          contact: true,
          conversation: true,
        },
      });

      // 5. Atualizar conversa com última mensagem
      await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: savedMessage.timestamp,
          lastMessagePreview: this.getMessagePreview(savedMessage.content, messageType),
          unreadCount: isFromMe ? 0 : { increment: 1 },
        },
      });

      // 6. Emitir evento WebSocket
      if (this.io) {
        this.io.emit('message:new', savedMessage);
        this.io.emit('conversation:update', conversation.id);
      }

      logger.info(`✅ Mensagem salva: ${savedMessage.id}`);
    } catch (error) {
      logger.error('❌ Erro ao processar mensagem:', error);
    }
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
   * Determina o tipo de mensagem baseado no objeto Message
   */
  private getMessageType(message: Message): MessageType {
    if (message.isMedia) {
      const mime = message.mimetype?.toLowerCase() || '';

      if (mime.includes('image')) return MessageType.IMAGE;
      if (mime.includes('video')) return MessageType.VIDEO;
      if (mime.includes('audio')) return MessageType.AUDIO;
      if (mime.includes('application')) return MessageType.DOCUMENT;

      return MessageType.DOCUMENT;
    }

    if (message.type === 'location' || message.lat) return MessageType.LOCATION;
    if (message.type === 'vcard') return MessageType.CONTACT;

    return MessageType.TEXT;
  }

  /**
   * Obtém URL da mídia (implementação futura: upload para S3/storage)
   */
  private async getMediaUrl(message: Message): Promise<string | null> {
    // TODO: Implementar download e upload de mídia
    // Por enquanto, retorna null
    return null;
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
   */
  async getConversations(limit = 50) {
    return prisma.whatsAppConversation.findMany({
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
   */
  async getMessages(conversationId: string, limit = 100, offset = 0) {
    return prisma.whatsAppMessage.findMany({
      where: { conversationId },
      orderBy: { timestamp: 'asc' },
      take: limit,
      skip: offset,
      include: {
        contact: true,
      },
    });
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
      this.io.emit('message:status', { messageIds, status: MessageStatus.READ });
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
