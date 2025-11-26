/**
 * WhatsApp Listeners - Sistema robusto de event listeners
 *
 * Gerencia todos os eventos do WhatsApp de forma centralizada
 * Integra com Socket.IO, bot service e processamento de mensagens
 */

import { Client, Message as WWebMessage, Chat as WWebChat } from 'whatsapp-web.js';
import { Server as SocketIOServer } from 'socket.io';
import { logger } from '../utils/logger';
import { whatsappBotService } from '../modules/whatsapp-bot/whatsapp-bot.service';
import { prisma } from '../config/database';

/**
 * Configura todos os event listeners do WhatsApp
 */
export function setupWhatsAppListeners(client: Client, io: SocketIOServer): void {
  logger.info('🎧 Configurando WhatsApp event listeners...');

  // ==========================================
  // EVENTOS DE CONEXÃO E AUTENTICAÇÃO
  // ==========================================

  /**
   * Evento: Mensagem recebida (todas as mensagens, inclusive enviadas)
   */
  client.on('message', async (message: WWebMessage) => {
    try {
      await handleIncomingMessage(message, io);
    } catch (error) {
      logger.error('❌ Erro ao processar mensagem:', error);
    }
  });

  /**
   * Evento: Nova mensagem criada (incluindo enviadas por nós)
   */
  client.on('message_create', async (message: WWebMessage) => {
    try {
      // Emitir via Socket.IO para atualização em tempo real
      io.emit('whatsapp:message_create', {
        id: message.id._serialized,
        from: message.from,
        to: message.to,
        body: message.body,
        fromMe: message.fromMe,
        timestamp: message.timestamp,
        type: message.type,
        hasMedia: message.hasMedia,
      });
    } catch (error) {
      logger.error('❌ Erro ao processar message_create:', error);
    }
  });

  /**
   * Evento: ACK (confirmação de entrega/leitura)
   */
  client.on('message_ack', async (message: WWebMessage, ack: number) => {
    try {
      logger.debug(`📬 ACK recebido: ${message.id._serialized} - ACK: ${ack}`);

      // Emitir via Socket.IO
      io.emit('whatsapp:message_ack', {
        messageId: message.id._serialized,
        ack,
        status: mapAckToStatus(ack),
      });
    } catch (error) {
      logger.error('❌ Erro ao processar message_ack:', error);
    }
  });

  /**
   * Evento: Mensagem revogada (deletada para todos)
   */
  client.on('message_revoke_everyone', async (message: WWebMessage, revokedMessage: WWebMessage | null) => {
    try {
      logger.info(`🗑️  Mensagem revogada: ${message.id._serialized}`);

      // Emitir via Socket.IO
      io.emit('whatsapp:message_revoked', {
        messageId: message.id._serialized,
        chatId: message.from,
      });
    } catch (error) {
      logger.error('❌ Erro ao processar message_revoke_everyone:', error);
    }
  });

  /**
   * Evento: Mensagem revogada apenas para mim
   */
  client.on('message_revoke_me', async (message: WWebMessage) => {
    try {
      logger.info(`🗑️  Mensagem revogada (apenas para mim): ${message.id._serialized}`);
    } catch (error) {
      logger.error('❌ Erro ao processar message_revoke_me:', error);
    }
  });

  /**
   * Evento: Reação em mensagem
   */
  client.on('message_reaction', async (reaction: any) => {
    try {
      logger.info(`❤️  Reação recebida: ${reaction.reaction} em ${reaction.msgId._serialized}`);

      // Emitir via Socket.IO
      io.emit('whatsapp:message_reaction', {
        messageId: reaction.msgId._serialized,
        reaction: reaction.reaction,
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error('❌ Erro ao processar message_reaction:', error);
    }
  });

  // ==========================================
  // EVENTOS DE CHAT
  // ==========================================

  /**
   * Evento: Chat arquivado
   */
  client.on('chat_archived', async (chat: WWebChat, archived: boolean) => {
    try {
      logger.info(`📦 Chat ${archived ? 'arquivado' : 'desarquivado'}: ${chat.id._serialized}`);

      io.emit('whatsapp:chat_archived', {
        chatId: chat.id._serialized,
        archived,
      });
    } catch (error) {
      logger.error('❌ Erro ao processar chat_archived:', error);
    }
  });

  /**
   * Evento: Chat removido (conversa deletada)
   */
  client.on('chat_removed', async (chat: WWebChat) => {
    try {
      logger.info(`🗑️  Chat removido: ${chat.id._serialized}`);

      io.emit('whatsapp:chat_removed', {
        chatId: chat.id._serialized,
      });
    } catch (error) {
      logger.error('❌ Erro ao processar chat_removed:', error);
    }
  });

  // ==========================================
  // EVENTOS DE GRUPO
  // ==========================================

  /**
   * Evento: Participante adicionado ao grupo
   */
  client.on('group_join', async (notification: any) => {
    try {
      logger.info(`👥 Novo participante no grupo: ${notification.chatId}`);

      io.emit('whatsapp:group_join', {
        groupId: notification.chatId,
        participants: notification.recipientIds,
        author: notification.author,
      });
    } catch (error) {
      logger.error('❌ Erro ao processar group_join:', error);
    }
  });

  /**
   * Evento: Participante saiu/foi removido do grupo
   */
  client.on('group_leave', async (notification: any) => {
    try {
      logger.info(`👋 Participante saiu do grupo: ${notification.chatId}`);

      io.emit('whatsapp:group_leave', {
        groupId: notification.chatId,
        participants: notification.recipientIds,
        author: notification.author,
      });
    } catch (error) {
      logger.error('❌ Erro ao processar group_leave:', error);
    }
  });

  /**
   * Evento: Informações do grupo atualizadas
   */
  client.on('group_update', async (notification: any) => {
    try {
      logger.info(`📝 Grupo atualizado: ${notification.chatId}`);

      io.emit('whatsapp:group_update', {
        groupId: notification.chatId,
        type: notification.type,
        author: notification.author,
      });
    } catch (error) {
      logger.error('❌ Erro ao processar group_update:', error);
    }
  });

  // ==========================================
  // EVENTOS DE CONTATO E PRESENÇA
  // ==========================================

  /**
   * Evento: Mudança no status de presença (online/offline/digitando)
   */
  client.on('change_state', async (state: string) => {
    try {
      logger.debug(`🟢 Estado alterado: ${state}`);
    } catch (error) {
      logger.error('❌ Erro ao processar change_state:', error);
    }
  });

  /**
   * Evento: Contato alterado
   */
  client.on('contact_changed', async (message: WWebMessage, oldId: string, newId: string, isContact: boolean) => {
    try {
      logger.info(`📱 Contato alterado: ${oldId} → ${newId}`);
    } catch (error) {
      logger.error('❌ Erro ao processar contact_changed:', error);
    }
  });

  // ==========================================
  // EVENTOS DE MÍDIA E DOWNLOAD
  // ==========================================

  /**
   * Evento: Download de mídia em progresso
   */
  client.on('media_uploaded', async (message: WWebMessage) => {
    try {
      logger.info(`📤 Mídia enviada: ${message.id._serialized}`);
    } catch (error) {
      logger.error('❌ Erro ao processar media_uploaded:', error);
    }
  });

  // ==========================================
  // EVENTOS DE CALL (LIGAÇÃO)
  // ==========================================

  /**
   * Evento: Chamada recebida
   */
  client.on('call', async (call: any) => {
    try {
      logger.info(`📞 Ligação recebida de: ${call.from}`);

      // Emitir via Socket.IO
      io.emit('whatsapp:call', {
        from: call.from,
        timestamp: call.timestamp,
        isVideo: call.isVideo,
        isGroup: call.isGroup,
      });

      // Opcionalmente: Auto-rejeitar chamadas
      // await call.reject();
    } catch (error) {
      logger.error('❌ Erro ao processar call:', error);
    }
  });

  logger.info('✅ WhatsApp event listeners configurados com sucesso');
}

/**
 * Processa mensagem recebida
 */
async function handleIncomingMessage(message: WWebMessage, io: SocketIOServer): Promise<void> {
  // Ignorar mensagens enviadas por nós
  if (message.fromMe) {
    return;
  }

  logger.info(`📩 Mensagem recebida de ${message.from}: "${message.body?.substring(0, 50)}..."`);

  // ✅ FIX: Tratamento de erro para compatibilidade com WhatsApp Web API changes
  let contact: any = null;
  let chat: any = null;

  try {
    contact = await message.getContact();
  } catch (error) {
    logger.warn(`⚠️  Não foi possível obter contato: ${error}`);
    // Fallback: extrair dados básicos do message object
    contact = {
      id: { _serialized: message.from },
      number: message.from.replace('@c.us', '').replace('@g.us', ''),
      name: null,
      pushname: null,
    };
  }

  try {
    chat = await message.getChat();
  } catch (error) {
    logger.warn(`⚠️  Não foi possível obter chat: ${error}`);
    // Fallback
    chat = {
      id: { _serialized: message.from },
      name: contact?.name || message.from,
      isGroup: message.from.includes('@g.us'),
    };
  }

  // Formatar mensagem
  const formattedMessage = {
    id: message.id._serialized,
    body: message.body || '',
    from: message.from,
    to: message.to || '',
    fromMe: message.fromMe,
    timestamp: message.timestamp,
    type: message.type,
    hasMedia: message.hasMedia,
    ack: message.ack || 0,
    status: mapAckToStatus(message.ack),
    contact: {
      id: contact?.id?._serialized || message.from,
      phone: contact?.number || message.from.replace('@c.us', '').replace('@g.us', ''),
      name: contact?.name || contact?.pushname || contact?.number || message.from,
    },
    chat: {
      id: chat?.id?._serialized || message.from,
      name: chat?.name || message.from,
      isGroup: chat?.isGroup || false,
    },
  };

  // Emitir via Socket.IO para room específica
  io.to(`conversation:${message.from}`).emit('whatsapp:message', formattedMessage);

  // Emitir broadcast geral
  io.emit('whatsapp:new_message', formattedMessage);

  // Processar com bot do WhatsApp (se houver sessão ativa)
  try {
    await whatsappBotService.processUserMessage(message.from, message.body || '');
  } catch (error) {
    // Falha silenciosa - não há sessão de bot ativa para este contato
    logger.debug('Mensagem não processada pelo bot (sem sessão ativa)');
  }

  // Salvar comunicação no banco de dados (opcional)
  try {
    await saveCommunicationToDatabase(formattedMessage);
  } catch (error) {
    logger.warn('Erro ao salvar comunicação no banco:', error);
  }
}

/**
 * Salva comunicação no banco de dados
 */
async function saveCommunicationToDatabase(message: any): Promise<void> {
  try {
    // Buscar ou criar lead baseado no telefone
    const phone = message.contact.phone.replace(/\D/g, '');

    let lead = await prisma.lead.findFirst({
      where: { phone },
    });

    // Se não existir lead, criar um novo
    if (!lead) {
      // Buscar usuário do sistema (ou primeiro admin disponível)
      const systemUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: 'system@ferraco.com' },
            { role: 'ADMIN' }
          ]
        }
      });

      if (!systemUser) {
        logger.warn('Nenhum usuário disponível para criar lead via WhatsApp');
        return;
      }

      lead = await prisma.lead.create({
        data: {
          name: message.contact.name,
          email: `${phone}@whatsapp.temp`,
          phone,
          source: 'WHATSAPP',
          status: 'NOVO',
          createdById: systemUser.id,
        },
      });
    }

    // Salvar comunicação
    await prisma.communication.create({
      data: {
        leadId: lead.id,
        type: 'WHATSAPP',
        direction: 'INBOUND',
        content: message.body,
        metadata: JSON.stringify({
          messageId: message.id,
          from: message.from,
          timestamp: message.timestamp,
          hasMedia: message.hasMedia,
        }),
      },
    });

    logger.debug(`✅ Comunicação salva para lead ${lead.id}`);
  } catch (error) {
    logger.error('❌ Erro ao salvar comunicação:', error);
  }
}

/**
 * Mapeia ACK para status legível
 */
function mapAckToStatus(ack?: number): string {
  switch (ack) {
    case 0:
      return 'ERROR';
    case 1:
      return 'PENDING';
    case 2:
      return 'SENT';
    case 3:
      return 'DELIVERED';
    case 4:
      return 'READ';
    case 5:
      return 'PLAYED';
    default:
      return 'SENT';
  }
}

/**
 * Remove listeners (cleanup)
 */
export function removeWhatsAppListeners(client: Client): void {
  logger.info('🧹 Removendo WhatsApp event listeners...');
  client.removeAllListeners();
  logger.info('✅ Event listeners removidos');
}
