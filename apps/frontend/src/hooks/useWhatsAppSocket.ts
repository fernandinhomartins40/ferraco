/**
 * useWhatsAppSocket - Hook para gerenciar conexão e eventos Socket.IO do WhatsApp
 * FASE 3: Integração com State Machine
 */

import { useEffect, useRef, useReducer, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  WhatsAppConnectionState,
  WhatsAppAccount,
  isConnected,
  isQRAvailable,
  isError,
  getConnectionStatus,
} from '@/types/whatsapp.types';
import { whatsappReducer, initialWhatsAppState, mapSocketStatusToAction } from '@/reducers/whatsapp.reducer';
import { getToken } from '@/lib/apiClient';

// ✅ FIX: Garantir URL correta em produção
const BACKEND_URL = import.meta.env.VITE_API_URL || window.location.origin;
console.log('🔌 [Socket.IO] VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('🔌 [Socket.IO] window.location.origin:', window.location.origin);
console.log('🔌 [Socket.IO] BACKEND_URL final:', BACKEND_URL);

// Manter compatibilidade com Fase 2
export type WhatsAppStatus =
  | 'notConnected'
  | 'qrReadSuccess'
  | 'qrReadFail'
  | 'autocloseCalled'
  | 'desconnectedMobile'
  | 'browserClose'
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'INITIALIZING';

interface WhatsAppSocketEvents {
  onQRCode?: (qrCode: string) => void;
  onStatusChange?: (status: WhatsAppStatus) => void;
  onReady?: () => void;
  onDisconnected?: (reason: string) => void;
  onError?: (error: string) => void;
}

/**
 * Hook para gerenciar conexão Socket.IO com WhatsApp
 * FASE 3: Agora usa State Machine para gerenciamento robusto de estados
 */
export const useWhatsAppSocket = (events?: WhatsAppSocketEvents) => {
  const socketRef = useRef<Socket | null>(null);
  const qrAttemptRef = useRef<number>(0);

  // ✅ FASE 3: Substituir useState por useReducer + State Machine
  const [connectionState, dispatch] = useReducer(whatsappReducer, initialWhatsAppState);

  // ✅ Removidas funções useCallback que causavam dependências no useEffect

  // ✅ FASE 3: Conectar Socket.IO e inicializar State Machine
  useEffect(() => {
    console.log('🔌 [Socket.IO] Conectando ao backend:', BACKEND_URL);

    // Transitar para initializing
    dispatch({ type: 'INITIALIZE' });

    // T-02: o servidor exige JWT no handshake. Sem token não há conexão,
    // então nem tentamos — evita um laço de reconexão que sempre falha.
    const token = getToken();
    if (!token) {
      console.warn('🔒 [Socket.IO] Sem token de autenticação — conexão não iniciada');
      dispatch({ type: 'ERROR', error: 'Não autenticado', recoverable: false });
      return;
    }

    const socket = io(BACKEND_URL, {
      path: '/socket.io/',
      transports: ['polling', 'websocket'], // ✅ FIX: polling primeiro (mais compatível)
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      timeout: 20000,
      withCredentials: true, // ✅ FIX: Enviar cookies para autenticação
      autoConnect: true,
      forceNew: false,
      auth: { token }, // T-02: canal recomendado — não vai para a query string
    });

    socketRef.current = socket;

    // Eventos de conexão Socket.IO
    socket.on('connect', () => {
      console.log('✅ [Socket.IO] Conectado com ID:', socket.id);
      console.log('✅ [Socket.IO] Transport:', socket.io.engine.transport.name);
    });

    socket.on('disconnect', (reason) => {
      console.warn('⚠️ [Socket.IO] Desconectado:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ [Socket.IO] Erro de conexão:', error);
      console.error('❌ [Socket.IO] Erro detalhe:', error.message);
      console.error('❌ [Socket.IO] Tentando URL:', BACKEND_URL);

      // T-02: o access token vive ~15 min. Numa reconexão após expirar, o
      // handshake falha e o Socket.IO retentaria com o MESMO token — laço
      // garantido. Relemos o token a cada tentativa: o interceptor do
      // apiClient o renova, então normalmente já haverá um token novo.
      const freshToken = getToken();
      if (freshToken) {
        socket.auth = { token: freshToken };
      } else {
        // Sem token não há o que retentar — para de bater no servidor.
        console.warn('🔒 [Socket.IO] Sem token válido — interrompendo reconexão');
        socket.disconnect();
        dispatch({ type: 'ERROR', error: 'Sessão expirada', recoverable: false });
      }
    });

    socket.io.on('error', (error) => {
      console.error('❌ [Socket.IO Engine] Erro:', error);
    });

    socket.io.on('reconnect_attempt', (attempt) => {
      console.log(`🔄 [Socket.IO] Tentativa de reconexão ${attempt}`);
    });

    socket.io.on('reconnect_failed', () => {
      console.error('❌ [Socket.IO] Falha em todas as tentativas de reconexão');
    });

    // Eventos do WhatsApp - usar funções inline para evitar dependências
    socket.on('whatsapp:qr', (data: string | { qr: string }) => {
      console.log('📱 [Socket.IO] QR Code recebido');
      // Fix: Backend emite { qr: "..." } mas também suporta string direta
      const qrCode = typeof data === 'string' ? data : data.qr;
      qrAttemptRef.current += 1;
      dispatch({
        type: 'QR_RECEIVED',
        qrCode,
        attempt: qrAttemptRef.current,
      });
      events?.onQRCode?.(qrCode);
    });

    socket.on('whatsapp:status', (status: WhatsAppStatus) => {
      console.log('🔄 [Socket.IO] Status alterado:', status);
      const action = mapSocketStatusToAction(status, connectionState);
      if (action) {
        dispatch(action);
      }
      events?.onStatusChange?.(status);
      if (status === 'qrReadSuccess') {
        dispatch({ type: 'QR_SCANNED' });
      }
    });

    socket.on('whatsapp:ready', (account?: WhatsAppAccount) => {
      console.log('✅ [Socket.IO] WhatsApp pronto para uso');
      const accountData: WhatsAppAccount = account || {
        phone: 'Conectado',
        name: 'WhatsApp',
        platform: 'web',
      };
      dispatch({
        type: 'CONNECTED',
        account: accountData,
      });
      events?.onReady?.();
    });

    socket.on('whatsapp:disconnected', (reason?: string) => {
      console.log('❌ [Socket.IO] WhatsApp desconectado:', reason);
      dispatch({
        type: 'DISCONNECTED',
        reason: reason || 'Desconectado',
      });
      events?.onDisconnected?.(reason || 'Desconectado');
    });

    socket.on('whatsapp:error', (error: string) => {
      console.error('❌ [Socket.IO] Erro:', error);
      dispatch({
        type: 'ERROR',
        error,
        recoverable: true,
      });
      events?.onError?.(error);
    });

    // ✅ NOVO: Evento de QR Code expirado
    socket.on('whatsapp:qr-expired', () => {
      console.warn('⏱️ [Socket.IO] QR Code expirado');
      // Limpar QR code atual e aguardar novo
      dispatch({
        type: 'INITIALIZE',
      });
      events?.onError?.('QR Code expirado. Gerando novo...');
    });

    // Cleanup ao desmontar
    return () => {
      console.log('🔌 [Socket.IO] Desconectando...');
      socket.off('whatsapp:qr');
      socket.off('whatsapp:status');
      socket.off('whatsapp:ready');
      socket.off('whatsapp:disconnected');
      socket.off('whatsapp:error');
      socket.off('whatsapp:qr-expired');
      socket.disconnect();
      socketRef.current = null;

      // Resetar state machine
      dispatch({ type: 'RESET' });
    };
  }, []); // ✅ FIX: Array vazio - só conecta uma vez

  // Helper: Solicitar status atual
  const requestStatus = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('📡 [Socket.IO] Solicitando status...');
      socketRef.current.emit('whatsapp:request-status');
    }
  }, []);

  // Helper: Solicitar novo QR Code
  const requestQRCode = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('📡 [Socket.IO] Solicitando QR Code...');
      socketRef.current.emit('whatsapp:request-qr');
    }
  }, []);

  // Helper: Reiniciar conexão
  const reconnect = useCallback(() => {
    console.log('🔄 [Socket.IO] Reiniciando conexão...');
    dispatch({ type: 'RESET' });
    dispatch({ type: 'INITIALIZE' });
    requestStatus();
  }, [requestStatus]);

  // ✅ FASE 3: Retornar estado da State Machine + compatibilidade com Fase 2
  return {
    // State Machine state (NOVO)
    connectionState,

    // Compatibilidade com Fase 2 (mapeamento)
    qrCode: isQRAvailable(connectionState) ? connectionState.qrCode : null,
    status: mapStateToLegacyStatus(connectionState),
    isConnected: isConnected(connectionState),
    error: isError(connectionState) ? connectionState.error : null,
    account: isConnected(connectionState) ? connectionState.account : null,

    // Helpers
    socket: socketRef.current,
    requestStatus,
    requestQRCode,
    reconnect,

    // Type guards (úteis para componentes)
    isIdle: connectionState.type === 'idle',
    isInitializing: connectionState.type === 'initializing',
    isQRAvailable: connectionState.type === 'qr-available',
    isAuthenticating: connectionState.type === 'authenticating',
    isDisconnected: connectionState.type === 'disconnected',
    isError: connectionState.type === 'error',

    // Status simplificado
    connectionStatus: getConnectionStatus(connectionState),
  };
};

/**
 * ✅ FASE 3: Mapear State Machine para status legado (compatibilidade)
 */
function mapStateToLegacyStatus(state: WhatsAppConnectionState): WhatsAppStatus {
  switch (state.type) {
    case 'idle':
      return 'DISCONNECTED';
    case 'initializing':
      return 'INITIALIZING';
    case 'qr-available':
      return 'notConnected';
    case 'authenticating':
      return 'qrReadSuccess';
    case 'connected':
      return 'CONNECTED';
    case 'disconnected':
      return state.reason?.includes('mobile') ? 'desconnectedMobile' : 'DISCONNECTED';
    case 'error':
      return 'qrReadFail';
  }
}
