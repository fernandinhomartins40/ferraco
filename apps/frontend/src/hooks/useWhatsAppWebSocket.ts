/**
 * useWhatsAppWebSocket - Hook para WebSocket real-time do WhatsApp
 */

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
