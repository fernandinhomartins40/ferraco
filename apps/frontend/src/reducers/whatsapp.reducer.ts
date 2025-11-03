/**
 * FASE 3: WhatsApp State Machine Reducer
 * Gerencia transições de estado com validações
 */

import { WhatsAppConnectionState, WhatsAppAction } from '@/types/whatsapp.types';

/**
 * Estado inicial
 */
export const initialWhatsAppState: WhatsAppConnectionState = {
  type: 'idle',
};

/**
 * Reducer: Gerencia transições de estado
 * Valida transições permitidas para evitar estados inconsistentes
 */
export function whatsappReducer(
  state: WhatsAppConnectionState,
  action: WhatsAppAction
): WhatsAppConnectionState {
  // Log para debug
  console.log('🔄 [State Machine] Transição:', state.type, '->', action.type);

  switch (action.type) {
    case 'INITIALIZE':
      // Permitido de: idle, disconnected, error
      if (state.type === 'idle' || state.type === 'disconnected' || state.type === 'error') {
        return { type: 'initializing' };
      }
      console.warn(`⚠️ Transição INITIALIZE inválida de ${state.type}`);
      return state;

    case 'QR_RECEIVED':
      // Permitido de: initializing, qr-available (atualização), disconnected (reconexão)
      if (state.type === 'initializing' || state.type === 'qr-available' || state.type === 'disconnected') {
        return {
          type: 'qr-available',
          qrCode: action.qrCode,
          attempt: action.attempt,
        };
      }
      console.warn(`⚠️ Transição QR_RECEIVED inválida de ${state.type}`);
      return state;

    case 'QR_SCANNED':
      // Permitido apenas de: qr-available
      if (state.type === 'qr-available') {
        return { type: 'authenticating' };
      }
      console.warn(`⚠️ Transição QR_SCANNED inválida de ${state.type}`);
      return state;

    case 'CONNECTED':
      // Permitido de: authenticating, qr-available (auth direta)
      if (state.type === 'authenticating' || state.type === 'qr-available' || state.type === 'initializing') {
        return {
          type: 'connected',
          account: action.account,
        };
      }
      console.warn(`⚠️ Transição CONNECTED inválida de ${state.type}`);
      return state;

    case 'DISCONNECTED':
      // Permitido de qualquer estado (exceto já disconnected)
      if (state.type !== 'disconnected') {
        return {
          type: 'disconnected',
          reason: action.reason,
        };
      }
      return state;

    case 'ERROR':
      // Permitido de qualquer estado
      return {
        type: 'error',
        error: action.error,
        recoverable: action.recoverable ?? true, // Default: erro recuperável
      };

    case 'RESET':
      // Permitido de qualquer estado
      return { type: 'idle' };

    default:
      // TypeScript garante que nunca chegamos aqui
      return state;
  }
}

/**
 * Helper: Mapear status do Socket.IO para ações do reducer
 */
export function mapSocketStatusToAction(
  socketStatus: string,
  currentState: WhatsAppConnectionState
): WhatsAppAction | null {
  switch (socketStatus) {
    case 'INITIALIZING':
      return { type: 'INITIALIZE' };

    case 'CONNECTED':
      // Precisa de account (será tratado separadamente)
      return null;

    case 'DISCONNECTED':
      return { type: 'DISCONNECTED', reason: 'Desconectado do servidor' };

    case 'notConnected':
      return { type: 'DISCONNECTED', reason: 'Não conectado' };

    case 'qrReadSuccess':
      return { type: 'QR_SCANNED' };

    case 'qrReadFail':
      return { type: 'ERROR', error: 'Falha ao ler QR Code', recoverable: true };

    case 'autocloseCalled':
      return { type: 'DISCONNECTED', reason: 'Sessão encerrada automaticamente' };

    case 'desconnectedMobile':
      return { type: 'DISCONNECTED', reason: 'Desconectado do celular' };

    case 'browserClose':
      return { type: 'ERROR', error: 'Navegador fechado', recoverable: true };

    default:
      console.warn(`⚠️ Status não mapeado: ${socketStatus}`);
      return null;
  }
}

