/**
 * useWhatsAppWebSocket - Hook para WebSocket real-time do WhatsApp
 */

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

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
  onPresence?: (data: { contactId: string; state: string }) => void;
  onReaction?: (data: { messageId: string; from: string; emoji: string }) => void;
}

export const useWhatsAppWebSocket = (events: WebSocketEvents) => {
  const socketRef = useRef<Socket | null>(null);
  const eventsRef = useRef(events);

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
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
