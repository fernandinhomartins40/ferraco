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

const BACKEND_URL = import.meta.env.VITE_API_URL || window.location.origin;

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

  // ✅ FASE 3: Atualizar QR Code via State Machine
  const handleQRCode = useCallback((qrCode: string) => {
    console.log('📱 [Socket.IO] QR Code recebido');
    qrAttemptRef.current += 1;

    dispatch({
      type: 'QR_RECEIVED',
      qrCode,
      attempt: qrAttemptRef.current,
    });

    events?.onQRCode?.(qrCode);
  }, [events]);

  // ✅ FASE 3: Atualizar status via State Machine
  const handleStatusChange = useCallback((status: WhatsAppStatus) => {
    console.log('🔄 [Socket.IO] Status alterado:', status);

    // Mapear status para ação da State Machine
    const action = mapSocketStatusToAction(status, connectionState);
    if (action) {
      dispatch(action);
    }

    events?.onStatusChange?.(status);

    // Se QR scaneado com sucesso, transitar para authenticating
    if (status === 'qrReadSuccess') {
      dispatch({ type: 'QR_SCANNED' });
    }
  }, [events, connectionState]);

  // ✅ FASE 3: WhatsApp pronto via State Machine
  const handleReady = useCallback((account?: WhatsAppAccount) => {
    console.log('✅ [Socket.IO] WhatsApp pronto para uso');

    // Se account não fornecido, criar placeholder
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
  }, [events]);

  // ✅ FASE 3: Desconexão via State Machine
  const handleDisconnected = useCallback((reason?: string) => {
    console.log('❌ [Socket.IO] WhatsApp desconectado:', reason);

    dispatch({
      type: 'DISCONNECTED',
      reason: reason || 'Desconectado',
    });

    events?.onDisconnected?.(reason || 'Desconectado');
  }, [events]);

  // ✅ FASE 3: Erro via State Machine
  const handleError = useCallback((error: string, recoverable: boolean = true) => {
    console.error('❌ [Socket.IO] Erro:', error);

    dispatch({
      type: 'ERROR',
      error,
      recoverable,
    });

    events?.onError?.(error);
  }, [events]);

  // ✅ FASE 3: Conectar Socket.IO e inicializar State Machine
  useEffect(() => {
    console.log('🔌 [Socket.IO] Conectando ao backend:', BACKEND_URL);

    // Transitar para initializing
    dispatch({ type: 'INITIALIZE' });

    const socket = io(BACKEND_URL, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      timeout: 20000,
    });

    socketRef.current = socket;

    // Eventos de conexão Socket.IO
    socket.on('connect', () => {
      console.log('✅ [Socket.IO] Conectado com ID:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.warn('⚠️ [Socket.IO] Desconectado:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ [Socket.IO] Erro de conexão:', error);
      handleError(`Erro de conexão: ${error.message}`, true);
    });

    // Eventos do WhatsApp
    socket.on('whatsapp:qr', handleQRCode);
    socket.on('whatsapp:status', handleStatusChange);
    socket.on('whatsapp:ready', handleReady);
    socket.on('whatsapp:disconnected', handleDisconnected);
    socket.on('whatsapp:error', (error: string) => handleError(error, true));

    // Cleanup ao desmontar
    return () => {
      console.log('🔌 [Socket.IO] Desconectando...');
      socket.off('whatsapp:qr', handleQRCode);
      socket.off('whatsapp:status', handleStatusChange);
      socket.off('whatsapp:ready', handleReady);
      socket.off('whatsapp:disconnected', handleDisconnected);
      socket.off('whatsapp:error');
      socket.disconnect();
      socketRef.current = null;

      // Resetar state machine
      dispatch({ type: 'RESET' });
    };
  }, [handleQRCode, handleStatusChange, handleReady, handleDisconnected, handleError]);

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
    isConnected: connectionState.type === 'connected',
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
