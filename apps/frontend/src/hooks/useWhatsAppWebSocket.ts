/**
 * useWhatsAppWebSocket - Hook para WebSocket real-time do WhatsApp
 */

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// Use a mesma origem do frontend (funciona tanto em dev quanto em prod)
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

  useEffect(() => {
    // Connect to WebSocket server
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('🔌 WebSocket conectado:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('🔌 WebSocket desconectado');
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Erro de conexão WebSocket:', error);
    });

    // WhatsApp events
    if (events.onNewMessage) {
      socket.on('message:new', events.onNewMessage);
    }

    if (events.onMessageStatus) {
      socket.on('message:status', events.onMessageStatus);
    }

    if (events.onConversationUpdate) {
      socket.on('conversation:update', events.onConversationUpdate);
    }

    // Extended WPPConnect events
    if (events.onTyping) {
      socket.on('whatsapp:typing', events.onTyping);
    }

    if (events.onPresence) {
      socket.on('whatsapp:presence', events.onPresence);
    }

    if (events.onReaction) {
      socket.on('whatsapp:reaction', events.onReaction);
    }

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Helper to subscribe to a specific conversation
  const subscribeToConversation = (conversationId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('subscribe:conversation', conversationId);
    }
  };

  // Helper to unsubscribe from a conversation
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
