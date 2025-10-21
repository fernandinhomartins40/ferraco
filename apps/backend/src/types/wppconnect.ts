/**
 * Tipos TypeScript para WPPConnect
 * Baseado na documentação oficial: https://wppconnect.io/wppconnect/classes/Whatsapp.html
 * Versão: @wppconnect-team/wppconnect v1.37.5+
 */

import type { Whatsapp, Message as WPPMessage, Contact as WPPContact, Chat as WPPChat } from '@wppconnect-team/wppconnect';

// ============================================================================
// EXPORTS PRINCIPAIS
// ============================================================================

export type { Whatsapp, WPPMessage as Message, WPPContact as Contact, WPPChat as Chat };

// ============================================================================
// OPÇÕES DE ENVIO DE MENSAGENS
// ============================================================================

export interface SendMessageOptions {
  quotedMessageId?: string;
  mentions?: string[];
  createChat?: boolean;
  delay?: number;
  detectMentioned?: boolean;
  markIsRead?: boolean;
  waitForAck?: boolean;
}

export interface TextMessageOptions extends SendMessageOptions {
  // Opções específicas para mensagens de texto
}

export interface FileMessageOptions extends SendMessageOptions {
  filename?: string;
  caption?: string;
}

export interface LocationMessageOptions {
  latitude: number;
  longitude: number;
  title?: string;
}

export interface ListMessageOptions {
  buttonText: string;
  description: string;
  sections: Array<{
    title: string;
    rows: Array<{
      id: string;
      title: string;
      description?: string;
    }>;
  }>;
}

export interface ButtonMessageOptions {
  title?: string;
  subtitle?: string;
  buttons: Array<{
    id: string;
    text: string;
  }>;
  useTemplateButtons?: boolean;
  footer?: string;
}

export interface PollMessageOptions {
  pollName: string;
  options: string[];
  selectableCount?: number;
}

// ============================================================================
// RESULTADOS DE ENVIO
// ============================================================================

export interface SendMessageReturn {
  ack?: number;
  id: string | { _serialized: string };
  sendMsgResult?: string;
  [key: string]: any;
}

// ============================================================================
// CHAT E MENSAGENS
// ============================================================================

export interface GetMessagesOptions {
  count?: number;
  id?: string;
  direction?: 'before' | 'after';
  fromMe?: boolean;
  onlyUnread?: boolean;
}

export interface ChatState {
  state: 'composing' | 'recording' | 'available' | 'unavailable';
}

// ============================================================================
// GRUPOS
// ============================================================================

export interface GroupMember {
  id: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export interface ParticipantResult {
  statusCode?: number;
  message?: string;
  isGroupAdmin?: boolean;
}

export interface GroupInviteInfo {
  id: string;
  subject: string;
  subjectOwner?: string;
  subjectTime?: number;
  size?: number;
  participants?: Array<{ id: string }>;
  desc?: string;
  descId?: string;
  descOwner?: string;
  descTime?: number;
}

// ============================================================================
// CONTATOS
// ============================================================================

export interface NumberProfile {
  numberExists: boolean;
  id?: string;
  isBusiness?: boolean;
  canReceiveMessage?: boolean;
  [key: string]: any;
}

export interface ProfilePicThumbObj {
  eurl?: string;
  id?: string;
  img?: string;
  imgFull?: string;
  raw?: string;
  tag?: string;
}

export interface NumberStatusResult {
  numberExists: boolean;
  id?: {
    user: string;
    server: string;
    _serialized: string;
  };
  status?: number;
  isBusiness?: boolean;
  canReceiveMessage?: boolean;
  [key: string]: any;
}

// ============================================================================
// PERFIL E DISPOSITIVO
// ============================================================================

export interface HostDevice {
  phone: {
    wa_version: string;
    os_version: string;
    device_manufacturer: string;
    device_model: string;
    os_build_number: string;
  };
  pushname: string;
  wa_version: string;
  battery: number;
  plugged: boolean;
  platform: string;
  [key: string]: any;
}

export interface BusinessProfile {
  id?: string;
  tag?: string;
  description?: string;
  categories?: Array<{ id: string; localized_display_name: string }>;
  email?: string;
  website?: string[];
  [key: string]: any;
}

// ============================================================================
// LABELS/ETIQUETAS
// ============================================================================

export interface Label {
  id: string;
  name: string;
  hexColor?: string;
  [key: string]: any;
}

// ============================================================================
// PRESENÇA
// ============================================================================

export interface PresenceEvent {
  id: string;
  state: 'available' | 'composing' | 'recording' | 'unavailable';
  timestamp?: number;
  [key: string]: any;
}

// ============================================================================
// COMUNIDADES (WhatsApp Communities)
// ============================================================================

export interface Community {
  id: string;
  name: string;
  description?: string;
  [key: string]: any;
}

// ============================================================================
// PRODUTOS (WhatsApp Business Catalog)
// ============================================================================

export interface Product {
  id: string;
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  url?: string;
  imageUrl?: string;
  [key: string]: any;
}

// ============================================================================
// CONFIGURAÇÕES E LIMITES
// ============================================================================

export interface LimitOptions {
  maxMediaSize?: number;
  maxFileSize?: number;
  maxShare?: number;
  statusVideoMaxDuration?: number;
  maxPinnedConversations?: number;
}

// ============================================================================
// FORMATOS DE ID
// ============================================================================

/**
 * Formatos de ID suportados pelo WhatsApp
 * - Contato individual: '5511999999999@c.us'
 * - Grupo: '120363123456789@g.us'
 * - Broadcast: 'número@broadcast'
 */
export type WhatsAppId = string;

/**
 * Formato de ID de mensagem do WhatsApp
 * Exemplo: 'true_5511999999999@c.us_3EB0XXXXX'
 */
export type MessageId = string;

// ============================================================================
// ESTADOS DE CONEXÃO
// ============================================================================

export type ConnectionState =
  | 'CONNECTED'
  | 'OPENING'
  | 'PAIRING'
  | 'TIMEOUT'
  | 'DISCONNECTED'
  | 'CONFLICT'
  | 'UNPAIRED'
  | 'UNLAUNCHED'
  | 'PROXYBLOCK'
  | 'TOS_BLOCK'
  | 'SMB_TOS_BLOCK';

// ============================================================================
// TIPOS AUXILIARES
// ============================================================================

export interface WPPConnectError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Tipo helper para funções que retornam Promise<boolean>
 */
export type BooleanResult = Promise<boolean>;

/**
 * Tipo helper para callbacks de eventos
 */
export type EventCallback<T = any> = (event: T) => void | Promise<void>;
