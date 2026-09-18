/**
 * useWhatsAppWebSocket - Hook para WebSocket real-time do WhatsApp
 */

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { getToken } from '@/lib/apiClient';

const BACKEND_URL = import.meta.env.VITE_API_URL || window.location.origin;

interface Message {
  id: string;
  conversationId: string;
  type: string;
  content: string;
  fromMe: boolean;
  status: string;
  timestamp: string;
}

interface WebSocketEvents {
  onNewMessage?: (message: Message) => void;
  onMessageStatus?: (data: { messageIds: string[]; status: string }) => void;
  onConversationUpdate?: (conversationId: string) => void;
  onTyping?: (data: { contactId: string; isTyping: boolean; isRecording: boolean }) => void;
  onPresence?: (data: { contactId: string; state: string; isOnline: boolean; isTyping: boolean; isRecording: boolean }) => void;
  onReaction?: (data: { messageId: string; emoji: string; timestamp: Date }) => void;
  // ✅ NOVOS EVENTOS NATIVOS
  onMessageRevoked?: (data: { messageId: string; from: string; to: string }) => void;
  onMessageEdited?: (data: { chatId: string; messageId: string; newContent: string; timestamp: Date }) => void;
  onStateChange?: (state: string) => void;
}

export const useWhatsAppWebSocket = (events: WebSocketEvents) => {
  const socketRef = useRef<Socket | null>(null);
  const eventsRef = useRef(events);

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    // T-02: o servidor exige JWT no handshake. Sem token não há conexão.
    const token = getToken();
    if (!token) {
      console.warn('🔒 WebSocket: sem token de autenticação — conexão não iniciada');
      return;
    }

    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      auth: { token }, // T-02
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 WebSocket conectado:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('🔌 WebSocket desconectado');
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Erro de conexão WebSocket:', error);

      // T-02: relê o token a cada tentativa para não reconectar em laço
      // com um access token já expirado (~15 min de vida).
      const freshToken = getToken();
      if (freshToken) {
        socket.auth = { token: freshToken };
      } else {
        console.warn('🔒 WebSocket: sem token válido — interrompendo reconexão');
        socket.disconnect();
      }
    });

    socket.on('message:new', (data) => {
      if (eventsRef.current.onNewMessage) {
        eventsRef.current.onNewMessage(data);
      }
    });

    socket.on('message:status', (data) => {
      if (eventsRef.current.onMessageStatus) {
        eventsRef.current.onMessageStatus(data);
      }
    });

    socket.on('conversation:update', (conversationId) => {
      if (eventsRef.current.onConversationUpdate) {
        eventsRef.current.onConversationUpdate(conversationId);
      }
    });

    socket.on('whatsapp:typing', (data) => {
      if (eventsRef.current.onTyping) {
        eventsRef.current.onTyping(data);
      }
    });

    socket.on('whatsapp:presence', (data) => {
      if (eventsRef.current.onPresence) {
        eventsRef.current.onPresence(data);
      }
    });

    socket.on('whatsapp:reaction', (data) => {
      if (eventsRef.current.onReaction) {
        eventsRef.current.onReaction(data);
      }
    });

    // ✅ NOVOS EVENTOS NATIVOS
    socket.on('message:revoked', (data) => {
      if (eventsRef.current.onMessageRevoked) {
        eventsRef.current.onMessageRevoked(data);
      }
    });

    socket.on('message:edited', (data) => {
      if (eventsRef.current.onMessageEdited) {
        eventsRef.current.onMessageEdited(data);
      }
    });

    socket.on('whatsapp:state-change', (state) => {
      if (eventsRef.current.onStateChange) {
        eventsRef.current.onStateChange(state);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const subscribeToConversation = (conversationId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('subscribe:conversation', conversationId);
    }
  };

  const unsubscribeFromConversation = (conversationId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('unsubscribe:conversation', conversationId);
    }
  };

  return {
    socket: socketRef.current,
    subscribeToConversation,
    unsubscribeFromConversation,
  };
};
