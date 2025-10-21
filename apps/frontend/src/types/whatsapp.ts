/**
 * WhatsApp Types - Tipos completos para WPPConnect
 */

export interface Contact {
  id: string;
  phone: string;
  name: string | null;
  profilePicUrl: string | null;
  isMyContact?: boolean;
  isGroup?: boolean;
  isBusiness?: boolean;
}

export interface Conversation {
  id: string;
  phone: string;
  name: string | null;
  contact: Contact;
  lastMessage?: {
    content: string;
    timestamp: string;
    fromMe: boolean;
  };
  unreadCount?: number;
  isArchived?: boolean;
  isPinned?: boolean;
  isMuted?: boolean;
  timestamp?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'ptt' | 'document' | 'sticker' | 'location' | 'vcard' | 'list' | 'buttons' | 'poll';
  content: string;
  mediaUrl: string | null;
  mediaType: string | null;
  fromMe: boolean;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'PLAYED' | 'ERROR' | 'FAILED';
  timestamp: string;
  contact: Contact;
  reactions?: Array<{ emoji: string; from: string }>;
  quotedMessage?: Message;
  isStarred?: boolean;
  isForwarded?: boolean;
  from?: string;
  to?: string;
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  vCards?: string[];
  listMessage?: {
    title: string;
    description: string;
    buttonText: string;
    sections: Array<{
      title: string;
      rows: Array<{
        title: string;
        description?: string;
        rowId: string;
      }>;
    }>;
  };
  buttonsMessage?: {
    text: string;
    buttons: Array<{
      buttonText: string;
      buttonId: string;
    }>;
  };
  pollMessage?: {
    name: string;
    options: string[];
    selectableCount?: number;
  };
}

export interface GroupMetadata {
  id: string;
  subject: string;
  description?: string;
  owner: string;
  creation: number;
  participants: GroupParticipant[];
  admins: string[];
  groupInviteLink?: string;
}

export interface GroupParticipant {
  id: string;
  phone: string;
  name?: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export interface MessageSendOptions {
  to: string;
  message?: string;
  quotedMessageId?: string;
  mentions?: string[];
}

export interface MediaSendOptions extends MessageSendOptions {
  filePath: string;
  filename?: string;
  caption?: string;
}

export interface LocationSendOptions extends MessageSendOptions {
  latitude: number;
  longitude: number;
  name?: string;
}

export interface ContactSendOptions extends MessageSendOptions {
  contactId: string;
  name?: string;
}

export interface ListSendOptions extends MessageSendOptions {
  title: string;
  description: string;
  buttonText: string;
  sections: Array<{
    title: string;
    rows: Array<{
      title: string;
      description?: string;
      rowId: string;
    }>;
  }>;
}

export interface ButtonsSendOptions extends MessageSendOptions {
  buttons: Array<{
    buttonText: string;
  }>;
}

export interface PollSendOptions extends MessageSendOptions {
  name: string;
  options: string[];
  selectableCount?: number;
}

export interface WhatsAppStatus {
  connected: boolean;
  hasQR: boolean;
  message: string;
}

export interface WhatsAppAccount {
  id: string;
  phone: string;
  name: string;
  profilePicUrl?: string;
  isBusiness: boolean;
}

export interface ChatAction {
  type: 'archive' | 'unarchive' | 'pin' | 'unpin' | 'mute' | 'unmute' | 'delete';
  chatId: string;
}

export interface MessageAction {
  type: 'delete' | 'star' | 'unstar' | 'forward' | 'reply' | 'react' | 'download';
  messageId: string;
  forEveryone?: boolean;
  emoji?: string;
  to?: string | string[];
}
