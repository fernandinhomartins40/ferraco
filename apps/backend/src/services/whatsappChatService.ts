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

          // Sincronizar mensagens deste chat em background
          this.syncChatMessages(conversation.id, chat.id._serialized).catch((error) => {
            logger.error(`❌ Erro ao sincronizar mensagens de ${contactName}:`, error);
          });

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
   * Sincronizar mensagens de um chat específico
   * Similar ao loadChatHistory mas usando chatId diretamente
   */
  private async syncChatMessages(conversationId: string, chatId: string): Promise<void> {
    try {
      logger.info(`📥 Sincronizando mensagens do chat ${chatId}...`);

      // Usar método moderno WPP.chat.getMessages com count: -1 para TODAS as mensagens
      const messages = await this.whatsappClient.getMessages(chatId, { count: -1 });

      if (!messages || messages.length === 0) {
        logger.info(`⚠️  Nenhuma mensagem encontrada para ${chatId}`);
        return;
      }

      logger.info(`📋 Encontradas ${messages.length} mensagens para sincronizar`);

      let savedCount = 0;
      let skippedCount = 0;

      // Buscar o contato da conversa
      const conversation = await prisma.whatsAppConversation.findUnique({
        where: { id: conversationId },
        include: { contact: true },
      });

      if (!conversation) return;

      // Salvar cada mensagem no banco
      for (const msg of messages) {
        try {
          // Verificar se mensagem já existe
          const existingMessage = await prisma.whatsAppMessage.findUnique({
            where: { whatsappMessageId: msg.id },
          });

          if (existingMessage) {
            skippedCount++;
            continue; // Pular se já existe
          }

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

          savedCount++;
        } catch (error) {
          // Ignorar erros de mensagens duplicadas
        }
      }

      logger.info(`✅ Mensagens sincronizadas para ${conversation.contact.name}: ${savedCount} novas, ${skippedCount} já existentes`);
    } catch (error) {
      logger.error(`❌ Erro ao sincronizar mensagens:`, error);
    }
  }

  /**
   * Carregar histórico completo de mensagens de um chat
   * Usa WPP.chat.getMessages() com count: -1 para carregar TODAS as mensagens
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

      logger.info(`📥 Carregando histórico completo do chat ${conversation.contact.name}...`);

      // Usar método moderno WPP.chat.getMessages com count: -1 para TODAS as mensagens
      const messages = await this.whatsappClient.getMessages(chatId, { count: -1 });
      logger.info(`📋 Encontradas ${messages.length} mensagens no histórico`);

      let savedCount = 0;
      let skippedCount = 0;

      // Salvar cada mensagem no banco
      for (const msg of messages) {
        try {
          // Verificar se mensagem já existe
          const existingMessage = await prisma.whatsAppMessage.findUnique({
            where: { whatsappMessageId: msg.id },
          });

          if (existingMessage) {
            skippedCount++;
            continue; // Pular se já existe
          }

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

          savedCount++;
        } catch (error) {
          // Ignorar erros de mensagens duplicadas
          logger.debug(`⚠️  Erro ao salvar mensagem ${msg.id}:`, error);
        }
      }

      logger.info(`✅ Histórico carregado para ${conversation.contact.name}: ${savedCount} novas, ${skippedCount} já existentes`);
    } catch (error) {
      logger.error('❌ Erro ao carregar histórico:', error);
    }
  }

  /**
   * ✅ NOVO: Salvarmensagem enviada no banco (estratégia híbrida)
   * Garante que TODAS as mensagens (recebidas + enviadas) ficam no banco
   */
  async saveOutgoingMessage(data: {
    to: string;
    content: string;
    whatsappMessageId: string;
    timestamp: Date;
  }): Promise<void> {
    try {
      // Extrair número limpo
      const phone = data.to.replace(/\D/g, '');

      // Buscar ou criar contato
      const contact = await this.findOrCreateContact(phone, phone);

      // Buscar ou criar conversa
      const conversation = await this.findOrCreateConversation(contact.id);

      // Verificar se mensagem já existe
      const existingMessage = await prisma.whatsAppMessage.findUnique({
        where: { whatsappMessageId: data.whatsappMessageId },
      });

      if (existingMessage) {
        logger.debug(`⚠️  Mensagem ${data.whatsappMessageId} já existe no banco`);
        return;
      }

      // Salvar mensagem enviada
      const savedMessage = await prisma.whatsAppMessage.create({
        data: {
          conversationId: conversation.id,
          contactId: contact.id,
          type: MessageType.TEXT,
          content: data.content,
          fromMe: true, // ✅ Mensagem enviada por nós
          status: MessageStatus.SENT,
          whatsappMessageId: data.whatsappMessageId,
          timestamp: data.timestamp,
        },
      });

      // Atualizar conversa
      await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: data.timestamp,
          lastMessagePreview: this.getMessagePreview(data.content, MessageType.TEXT),
        },
      });

      // Emitir evento WebSocket
      if (this.io) {
        this.io.emit('message:new', savedMessage);
        this.io.emit('conversation:update', conversation.id);
      }

      logger.info(`✅ Mensagem enviada salva no banco: ${savedMessage.id}`);
    } catch (error) {
      logger.error('❌ Erro ao salvar mensagem enviada:', error);
    }
  }

  /**
   * ✅ NOVO: Carregamento incremental de mensagens (em lotes)
   * Evita timeout ao carregar milhares de mensagens de uma vez
   */
  async loadMessagesIncrementally(conversationId: string, batchSize = 100): Promise<number> {
    if (!this.whatsappClient) {
      logger.warn('⚠️  Cliente WhatsApp não disponível');
      return 0;
    }

    try {
      const conversation = await prisma.whatsAppConversation.findUnique({
        where: { id: conversationId },
        include: { contact: true },
      });

      if (!conversation) return 0;

      const chatId = `${conversation.contact.phone}@c.us`;
      let totalSaved = 0;
      let lastMessageId: string | null = null;
      let hasMore = true;

      logger.info(`🔄 Carregamento incremental para ${conversation.contact.name}...`);

      while (hasMore) {
        // Buscar lote de mensagens
        const batch = await this.whatsappClient.getMessages(chatId, {
          count: batchSize,
          direction: 'before',
          ...(lastMessageId && { id: lastMessageId }),
        });

        if (!batch || batch.length === 0) {
          hasMore = false;
          break;
        }

        // Salvar lote
        for (const msg of batch) {
          try {
            const existingMessage = await prisma.whatsAppMessage.findUnique({
              where: { whatsappMessageId: msg.id },
            });

            if (existingMessage) continue;

            await prisma.whatsAppMessage.create({
              data: {
                conversationId: conversation.id,
                contactId: conversation.contact.id,
                type: this.getMessageType(msg),
                content: msg.body || '',
                mediaType: msg.mimetype || null,
                fromMe: msg.fromMe || false,
                status: MessageStatus.DELIVERED,
                whatsappMessageId: msg.id,
                timestamp: new Date(msg.timestamp * 1000),
              },
            });

            totalSaved++;
          } catch (error) {
            // Ignorar erros
          }
        }

        // Atualizar último ID para próximo lote
        lastMessageId = batch[batch.length - 1].id;

        // Se retornou menos que o batchSize, chegamos ao fim
        if (batch.length < batchSize) {
          hasMore = false;
        }

        logger.info(`📥 Lote processado: ${batch.length} mensagens (${totalSaved} novas)`);
      }

      // Marcar como totalmente sincronizado
      await prisma.whatsAppConversation.update({
        where: { id: conversationId },
        data: {
          fullySynced: true,
          lastSyncedAt: new Date(),
          syncedMessageCount: totalSaved,
        },
      });

      logger.info(`✅ Carregamento incremental concluído: ${totalSaved} mensagens novas`);
      return totalSaved;
    } catch (error) {
      logger.error('❌ Erro ao carregar mensagens incrementalmente:', error);
      return 0;
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

      // 4. Verificar se mensagem já existe (evitar duplicatas)
      const existingMessage = await prisma.whatsAppMessage.findUnique({
        where: { whatsappMessageId: message.id },
        include: {
          contact: true,
          conversation: true,
        },
      });

      if (existingMessage) {
        logger.debug(`⚠️  Mensagem ${message.id} já existe, ignorando duplicata`);
        return;
      }

      // 5. Salvar mensagem
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
          this.io.emit('message:status', {
            messageIds: [message.id],
            status,
            readAt,
            deliveredAt,
          });
          logger.info(`📡 WebSocket emitido: message:status para ${message.id} com status ${status}`);
        } else {
          logger.warn('⚠️  Socket.io não disponível para emitir evento');
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
