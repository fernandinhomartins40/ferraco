/**
 * FASE 3: State Machine Types para WhatsApp
 * Discriminated Unions garantem type safety em todos os estados
 */

export interface WhatsAppAccount {
  phone: string;
  name: string;
  platform: string;
  profilePicUrl?: string;
}

/**
 * Estados possíveis da conexão WhatsApp (Discriminated Union)
 * Cada estado tem `type` como discriminador + dados específicos
 */
export type WhatsAppConnectionState =
  | { type: 'idle' } // Estado inicial (não inicializado)
  | { type: 'initializing' } // Iniciando conexão
  | { type: 'qr-available'; qrCode: string; attempt: number } // QR disponível para scan
  | { type: 'authenticating' } // QR scaneado, aguardando autenticação
  | { type: 'connected'; account: WhatsAppAccount } // Conectado com sucesso
  | { type: 'disconnected'; reason?: string } // Desconectado
  | { type: 'error'; error: string; recoverable: boolean }; // Erro (recuperável ou não)

/**
 * Ações que podem alterar o estado
 */
export type WhatsAppAction =
  | { type: 'INITIALIZE' }
  | { type: 'QR_RECEIVED'; qrCode: string; attempt: number }
  | { type: 'QR_SCANNED' } // QR foi scaneado (antes de auth completa)
  | { type: 'CONNECTED'; account: WhatsAppAccount }
  | { type: 'DISCONNECTED'; reason?: string }
  | { type: 'ERROR'; error: string; recoverable?: boolean }
  | { type: 'RESET' }; // Resetar para idle

/**
 * Helper: Type guards para cada estado
 */
export const isIdle = (state: WhatsAppConnectionState): state is { type: 'idle' } =>
  state.type === 'idle';

export const isInitializing = (state: WhatsAppConnectionState): state is { type: 'initializing' } =>
  state.type === 'initializing';

export const isQRAvailable = (
  state: WhatsAppConnectionState
): state is { type: 'qr-available'; qrCode: string; attempt: number } =>
  state.type === 'qr-available';

export const isAuthenticating = (state: WhatsAppConnectionState): state is { type: 'authenticating' } =>
  state.type === 'authenticating';

export const isConnected = (
  state: WhatsAppConnectionState
): state is { type: 'connected'; account: WhatsAppAccount } =>
  state.type === 'connected';

export const isDisconnected = (
  state: WhatsAppConnectionState
): state is { type: 'disconnected'; reason?: string } =>
  state.type === 'disconnected';

export const isError = (
  state: WhatsAppConnectionState
): state is { type: 'error'; error: string; recoverable: boolean } =>
  state.type === 'error';

/**
 * Helper: Verificar se pode tentar reconectar
 */
export const canReconnect = (state: WhatsAppConnectionState): boolean => {
  if (isError(state)) {
    return state.recoverable;
  }
  if (isDisconnected(state)) {
    return true;
  }
  return false;
};

/**
 * Helper: Obter status de conexão simplificado
 */
export const getConnectionStatus = (
  state: WhatsAppConnectionState
): 'online' | 'offline' | 'connecting' | 'error' => {
  switch (state.type) {
    case 'connected':
      return 'online';
    case 'idle':
    case 'disconnected':
      return 'offline';
    case 'initializing':
    case 'qr-available':
    case 'authenticating':
      return 'connecting';
    case 'error':
      return 'error';
  }
};
