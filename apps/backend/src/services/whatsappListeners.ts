/**
 * WhatsApp Advanced Listeners
 *
 * Listeners avançados para eventos do WhatsApp:
 * - Presença online/offline
 * - Digitando/gravando
 * - Chamadas de voz/vídeo
 * - Alterações em grupos
 * - Novos contatos
 * - Remoção de mensagens
 * - Reações
 * - Status/Stories
 */

import { Whatsapp } from '@wppconnect-team/wppconnect';
import { logger } from '../utils/logger';
import { Server as SocketIOServer } from 'socket.io';

export class WhatsAppListeners {
  private client: Whatsapp;
  private io?: SocketIOServer;

  constructor(client: Whatsapp, io?: SocketIOServer) {
    this.client = client;
    this.io = io;
  }

  /**
   * Configurar todos os listeners avançados
   */
  setupAllListeners(): void {
    this.setupPresenceListeners();
    this.setupTypingListeners();
    this.setupCallListeners();
    this.setupGroupListeners();
    this.setupContactListeners();
    this.setupMessageListeners();
    this.setupStatusListeners();
    this.setupReactionListeners();

    logger.info('✅ Todos os listeners avançados configurados');
  }

  /**
   * 77. Listener de presença (online/offline)
   */
  private setupPresenceListeners(): void {
    try {
      // @ts-ignore
      this.client.onPresenceChanged?.((presence: any) => {
        logger.debug(`👁️ Presença alterada: ${presence.id} - ${presence.state}`);

        // Emitir via WebSocket
        this.io?.emit('whatsapp:presence', {
          contactId: presence.id,
          state: presence.state, // 'available', 'unavailable', 'composing', 'recording'
          timestamp: new Date(),
        });
      });

      logger.debug('✅ Listener de presença configurado');
    } catch (error) {
      logger.error('❌ Erro ao configurar listener de presença:', error);
    }
  }

  /**
   * 78. Listener de "digitando..."
   */
  private setupTypingListeners(): void {
    try {
      // @ts-ignore
      this.client.onStateChange?.((state: any) => {
        if (state.state === 'composing' || state.state === 'recording') {
          logger.debug(`⌨️ ${state.id} está ${state.state === 'composing' ? 'digitando' : 'gravando'}`);

          this.io?.emit('whatsapp:typing', {
            contactId: state.id,
            isTyping: state.state === 'composing',
            isRecording: state.state === 'recording',
            timestamp: new Date(),
          });
        }
      });

      logger.debug('✅ Listener de digitando configurado');
    } catch (error) {
      logger.error('❌ Erro ao configurar listener de digitando:', error);
    }
  }

  /**
   * 79. Listener de chamadas (voz/vídeo)
   */
  private setupCallListeners(): void {
    try {
      // @ts-ignore
      this.client.onIncomingCall?.((call: any) => {
        logger.info(`📞 Chamada recebida de ${call.peerJid}: ${call.isVideo ? 'Vídeo' : 'Voz'} - ${call.isGroup ? 'Grupo' : 'Individual'}`);

        this.io?.emit('whatsapp:call', {
          from: call.peerJid,
          isVideo: call.isVideo,
          isGroup: call.isGroup,
          timestamp: new Date(),
        });

        // Opcional: Rejeitar chamadas automaticamente
        // this.client.rejectCall(call.id);
      });

      logger.debug('✅ Listener de chamadas configurado');
    } catch (error) {
      logger.error('❌ Erro ao configurar listener de chamadas:', error);
    }
  }

  /**
   * 80. Listener de alterações em grupos
   */
  private setupGroupListeners(): void {
    try {
      // @ts-ignore
      this.client.onParticipantsChanged?.((event: any) => {
        logger.info(`👥 Grupo ${event.groupId} - Ação: ${event.action} - Participantes: ${event.participants?.join(', ')}`);

        this.io?.emit('whatsapp:group-changed', {
          groupId: event.groupId,
          action: event.action, // 'add', 'remove', 'promote', 'demote'
          participants: event.participants,
          by: event.author,
          timestamp: new Date(),
        });
      });

      // @ts-ignore
      this.client.onGroupUpdate?.((group: any) => {
        logger.info(`📝 Grupo ${group.id} atualizado: ${group.subject || 'Sem título'}`);

        this.io?.emit('whatsapp:group-updated', {
          groupId: group.id,
          subject: group.subject,
          description: group.description,
          timestamp: new Date(),
        });
      });

      logger.debug('✅ Listeners de grupo configurados');
    } catch (error) {
      logger.error('❌ Erro ao configurar listeners de grupo:', error);
    }
  }

  /**
   * 81. Listener de novos contatos
   */
  private setupContactListeners(): void {
    try {
      // @ts-ignore
      this.client.onAddedToGroup?.((notification: any) => {
        logger.info(`➕ Adicionado ao grupo ${notification.chatId} por ${notification.author}`);

        this.io?.emit('whatsapp:added-to-group', {
          groupId: notification.chatId,
          by: notification.author,
          timestamp: new Date(),
        });
      });

      logger.debug('✅ Listener de contatos configurado');
    } catch (error) {
      logger.error('❌ Erro ao configurar listener de contatos:', error);
    }
  }

  /**
   * 82. Listener de remoção de mensagens
   */
  private setupMessageListeners(): void {
    try {
      // @ts-ignore
      this.client.onRevokedMessage?.((message: any) => {
        logger.info(`🗑️ Mensagem removida: ${message.id}`);

        this.io?.emit('whatsapp:message-revoked', {
          messageId: message.id,
          chatId: message.chatId,
          by: message.author || message.from,
          timestamp: new Date(),
        });
      });

      // @ts-ignore
      this.client.onMessageEdit?.((message: any) => {
        logger.info(`✏️ Mensagem editada: ${message.id}`);

        this.io?.emit('whatsapp:message-edited', {
          messageId: message.id,
          chatId: message.chatId,
          newContent: message.body,
          timestamp: new Date(),
        });
      });

      logger.debug('✅ Listeners de mensagens configurados');
    } catch (error) {
      logger.error('❌ Erro ao configurar listeners de mensagens:', error);
    }
  }

  /**
   * 83. Listener de status/stories
   */
  private setupStatusListeners(): void {
    try {
      // @ts-ignore
      this.client.onLiveLocation?.((location: any) => {
        logger.debug(`📍 Localização ao vivo de ${location.id}`);

        this.io?.emit('whatsapp:live-location', {
          from: location.id,
          latitude: location.lat,
          longitude: location.lng,
          accuracy: location.accuracy,
          timestamp: new Date(),
        });
      });

      logger.debug('✅ Listeners de status configurados');
    } catch (error) {
      logger.error('❌ Erro ao configurar listeners de status:', error);
    }
  }

  /**
   * 84. Listener de reações
   */
  private setupReactionListeners(): void {
    try {
      // @ts-ignore
      this.client.onReactionMessage?.((reaction: any) => {
        logger.info(`${reaction.reaction} Reação de ${reaction.from} na mensagem ${reaction.msgId}`);

        this.io?.emit('whatsapp:reaction', {
          messageId: reaction.msgId,
          from: reaction.from,
          emoji: reaction.reaction,
          timestamp: new Date(),
        });
      });

      logger.debug('✅ Listener de reações configurado');
    } catch (error) {
      logger.error('❌ Erro ao configurar listener de reações:', error);
    }
  }

  /**
   * Listener de poll/enquete responses
   */
  setupPollListeners(): void {
    try {
      // @ts-ignore
      this.client.onPollResponse?.((response: any) => {
        logger.info(`📊 Resposta de enquete de ${response.sender}: ${response.selectedOptions}`);

        this.io?.emit('whatsapp:poll-response', {
          pollId: response.pollId,
          from: response.sender,
          selectedOptions: response.selectedOptions,
          timestamp: new Date(),
        });
      });

      logger.debug('✅ Listener de enquetes configurado');
    } catch (error) {
      logger.error('❌ Erro ao configurar listener de enquetes:', error);
    }
  }

  /**
   * Listener de downloads completos
   */
  setupDownloadListeners(): void {
    try {
      // @ts-ignore
      this.client.onStreamChange?.((stream: any) => {
        logger.debug(`📥 Stream alterado: ${stream.state}`);

        this.io?.emit('whatsapp:stream-changed', {
          state: stream.state,
          timestamp: new Date(),
        });
      });

      logger.debug('✅ Listener de downloads configurado');
    } catch (error) {
      logger.error('❌ Erro ao configurar listener de downloads:', error);
    }
  }

  /**
   * Listener de sincronização de contatos
   */
  setupSyncListeners(): void {
    try {
      // @ts-ignore
      this.client.onInterfaceChange?.((state: any) => {
        logger.debug(`🔄 Interface alterada: ${state.displayInfo}`);

        this.io?.emit('whatsapp:interface-changed', {
          state: state.displayInfo,
          mode: state.mode,
          timestamp: new Date(),
        });
      });

      logger.debug('✅ Listener de sincronização configurado');
    } catch (error) {
      logger.error('❌ Erro ao configurar listener de sincronização:', error);
    }
  }

  /**
   * Listener de battery status
   */
  setupBatteryListeners(): void {
    try {
      // @ts-ignore
      this.client.onBatteryChange?.((battery: any) => {
        logger.debug(`🔋 Bateria: ${battery.battery}% - ${battery.plugged ? 'Carregando' : 'Descarregando'}`);

        this.io?.emit('whatsapp:battery', {
          level: battery.battery,
          plugged: battery.plugged,
          timestamp: new Date(),
        });
      });

      logger.debug('✅ Listener de bateria configurado');
    } catch (error) {
      logger.error('❌ Erro ao configurar listener de bateria:', error);
    }
  }

  /**
   * Atualizar instância do Socket.IO
   */
  setSocketServer(io: SocketIOServer): void {
    this.io = io;
    logger.info('✅ Socket.IO configurado para listeners');
  }
}
