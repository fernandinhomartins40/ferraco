/**
 * WhatsApp Service - whatsapp-web.js Integration
 *
 * Migrado de WPPConnect para whatsapp-web.js devido a problemas de stack overflow
 * em WPPConnect ao enviar mensagens (getIsGroup/getIsMe recursivo).
 *
 * whatsapp-web.js é mais estável e tem melhor suporte da comunidade.
 */

import { Client, LocalAuth, Message as WWebMessage, MessageMedia, Chat as WWebChat } from 'whatsapp-web.js';
import { logger } from '../utils/logger';
import { Server as SocketIOServer } from 'socket.io';
import * as fs from 'fs';
import * as path from 'path';
import QRCode from 'qrcode';

interface FormattedMessage {
  id: string;
  body: string;
  from: string;
  to: string;
  fromMe: boolean;
  timestamp: number;
  type: string;
  hasMedia: boolean;
  mediaUrl?: string;
  mediaType?: string;
  ack?: number;
  status: string;
  quotedMessage?: any;
  contact: {
    id: string;
    phone: string;
    name: string;
  };
}

interface FormattedConversation {
  id: string;
  name: string;
  phone: string;
  isGroup: boolean;
  unreadCount: number;
  lastMessage: {
    body: string;
    timestamp: number;
    fromMe: boolean;
  } | null;
  timestamp: number;
}

class WhatsAppWebJSService {
  private client: Client | null = null;
  private io: SocketIOServer | null = null;
  private isConnected: boolean = false;
  private isInitializing: boolean = false;
  private qrCode: string | null = null;
  private sessionPath: string;

  constructor() {
    // Diretório de sessão (Docker volume em produção)
    this.sessionPath = process.env.NODE_ENV === 'production'
      ? '/app/sessions'
      : path.join(__dirname, '../../sessions');

    // Criar diretório se não existir
    if (!fs.existsSync(this.sessionPath)) {
      fs.mkdirSync(this.sessionPath, { recursive: true });
      logger.info(`📁 Diretório de sessão criado: ${this.sessionPath}`);
    }
  }

  /**
   * Inicializar cliente WhatsApp
   */
  async initialize(): Promise<void> {
    if (this.isInitializing) {
      logger.warn('⚠️  WhatsApp já está sendo inicializado');
      return;
    }

    if (this.client) {
      logger.warn('⚠️  Cliente WhatsApp já existe');
      return;
    }

    this.isInitializing = true;
    logger.info('🚀 Inicializando WhatsApp Web JS...');

    try {
      // Criar cliente com autenticação local
      this.client = new Client({
        authStrategy: new LocalAuth({
          dataPath: this.sessionPath,
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ],
        },
      });

      // Event: QR Code gerado
      this.client.on('qr', async (qr: string) => {
        logger.info('📱 QR Code gerado');

        // Converter QR Code string para Data URI (base64)
        try {
          const qrDataUri = await QRCode.toDataURL(qr, {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            width: 300,
            margin: 1,
          });

          this.qrCode = qrDataUri;
          this.isConnected = false;

          // Emitir via Socket.IO (enviar data URI, não string raw)
          if (this.io) {
            this.io.emit('whatsapp:qr', { qr: qrDataUri });
            this.io.emit('whatsapp:status', 'INITIALIZING');
            logger.info('✅ QR Code emitido via Socket.IO (base64)');
          }
        } catch (error) {
          logger.error('❌ Erro ao gerar QR Code base64:', error);
          this.qrCode = qr; // Fallback para string raw
          if (this.io) {
            this.io.emit('whatsapp:qr', { qr });
            this.io.emit('whatsapp:status', 'INITIALIZING');
          }
        }
      });

      // Event: Cliente pronto
      this.client.on('ready', () => {
        logger.info('✅ WhatsApp conectado e pronto!');
        this.isConnected = true;
        this.isInitializing = false;
        this.qrCode = null;

        // Emitir via Socket.IO
        if (this.io) {
          this.io.emit('whatsapp:ready', { connected: true });
          this.io.emit('whatsapp:status', 'CONNECTED');
          logger.info('✅ Status CONNECTED emitido via Socket.IO');
        }
      });

      // Event: Autenticação bem-sucedida
      this.client.on('authenticated', () => {
        logger.info('✅ WhatsApp autenticado');
      });

      // Event: Falha na autenticação
      this.client.on('auth_failure', (msg) => {
        logger.error('❌ Falha na autenticação:', msg);
        this.isConnected = false;
        this.isInitializing = false;

        if (this.io) {
          this.io.emit('whatsapp:status', 'DISCONNECTED');
          logger.info('✅ Status DISCONNECTED emitido via Socket.IO (auth_failure)');
        }
      });

      // Event: Cliente desconectado
      this.client.on('disconnected', (reason) => {
        logger.warn(`⚠️  WhatsApp desconectado: ${reason}`);
        this.isConnected = false;
        this.qrCode = null;

        if (this.io) {
          this.io.emit('whatsapp:disconnected', { reason });
          this.io.emit('whatsapp:status', 'DISCONNECTED');
          logger.info('✅ Status DISCONNECTED emitido via Socket.IO');
        }
      });

      // Event: Nova mensagem recebida
      this.client.on('message', async (message: WWebMessage) => {
        try {
          logger.info(`📩 Nova mensagem recebida de ${message.from}`);

          const formattedMessage = await this.formatMessage(message);

          if (this.io) {
            this.io.emit('whatsapp:message', formattedMessage);
          }
        } catch (error: any) {
          logger.error('❌ Erro ao processar mensagem recebida:', error);
        }
      });

      // Inicializar cliente
      await this.client.initialize();
      logger.info('✅ Cliente WhatsApp inicializado');

    } catch (error: any) {
      logger.error('❌ Erro ao inicializar WhatsApp:', error);
      this.isInitializing = false;
      this.client = null;
      throw error;
    }
  }

  /**
   * Configurar Socket.IO
   */
  setSocketIO(io: SocketIOServer): void {
    this.io = io;
    logger.info('✅ Socket.IO configurado para WhatsApp Web JS');
  }

  /**
   * Verificar se está conectado
   */
  isWhatsAppConnected(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Obter QR Code
   */
  getQRCode(): string | null {
    return this.qrCode;
  }

  /**
   * Obter status
   */
  getStatus() {
    let message = 'Inicializando...';

    if (this.isConnected) {
      message = 'Conectado';
    } else if (this.qrCode !== null) {
      message = 'Aguardando leitura do QR Code';
    } else if (this.isInitializing) {
      message = 'Inicializando WhatsApp...';
    } else if (this.client === null) {
      message = 'Não inicializado';
    }

    return {
      connected: this.isConnected,
      hasQR: this.qrCode !== null,
      message,
      isInitializing: this.isInitializing,
    };
  }

  /**
   * Desconectar
   */
  async disconnect(): Promise<void> {
    if (!this.client) {
      logger.warn('⚠️  Nenhum cliente para desconectar');
      return;
    }

    try {
      await this.client.destroy();
      this.client = null;
      this.isConnected = false;
      this.qrCode = null;
      logger.info('✅ WhatsApp desconectado');
    } catch (error: any) {
      logger.error('❌ Erro ao desconectar WhatsApp:', error);
      throw error;
    }
  }

  /**
   * Enviar mensagem de texto
   */
  async sendTextMessage(to: string, message: string): Promise<any> {
    if (!this.isWhatsAppConnected()) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      const formatted = await this.formatPhoneNumber(to);
      logger.info(`📨 Enviando mensagem para ${formatted}`);

      const sentMsg = await this.client!.sendMessage(formatted, message);

      logger.info(`✅ Mensagem enviada: ${sentMsg.id._serialized}`);

      return {
        id: sentMsg.id._serialized,
        ack: sentMsg.ack || 0,
        timestamp: sentMsg.timestamp || Date.now(),
        from: formatted,
        body: message,
      };
    } catch (error: any) {
      logger.error('❌ Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  /**
   * Enviar imagem
   */
  async sendImage(to: string, pathOrBase64: string, filename?: string, caption?: string): Promise<any> {
    if (!this.isWhatsAppConnected()) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      const formatted = await this.formatPhoneNumber(to);
      logger.info(`🖼️  Enviando imagem para ${formatted}`);

      // Criar media a partir de base64 ou path
      let media: MessageMedia;

      if (pathOrBase64.startsWith('data:')) {
        // Base64 data URI
        media = new MessageMedia(
          'image/jpeg',
          pathOrBase64.split(',')[1],
          filename || 'image.jpg'
        );
      } else if (pathOrBase64.startsWith('http')) {
        // URL remota
        media = await MessageMedia.fromUrl(pathOrBase64);
      } else {
        // Arquivo local
        media = MessageMedia.fromFilePath(pathOrBase64);
      }

      const sentMsg = await this.client!.sendMessage(formatted, media, {
        caption: caption || '',
      });

      logger.info(`✅ Imagem enviada: ${sentMsg.id._serialized}`);

      return {
        id: sentMsg.id._serialized,
        ack: sentMsg.ack || 0,
        timestamp: sentMsg.timestamp || Date.now(),
      };
    } catch (error: any) {
      logger.error('❌ Erro ao enviar imagem:', error);
      throw error;
    }
  }

  /**
   * Enviar áudio
   */
  async sendAudio(to: string, audioPath: string): Promise<any> {
    if (!this.isWhatsAppConnected()) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      const formatted = await this.formatPhoneNumber(to);
      logger.info(`🎤 Enviando áudio para ${formatted}`);

      let media: MessageMedia;

      if (audioPath.startsWith('http')) {
        media = await MessageMedia.fromUrl(audioPath);
      } else {
        media = MessageMedia.fromFilePath(audioPath);
      }

      // Enviar como PTT (Push-to-Talk)
      const sentMsg = await this.client!.sendMessage(formatted, media, {
        sendAudioAsVoice: true,
      });

      logger.info(`✅ Áudio enviado: ${sentMsg.id._serialized}`);

      return {
        id: sentMsg.id._serialized,
        ack: sentMsg.ack || 0,
        timestamp: sentMsg.timestamp || Date.now(),
      };
    } catch (error: any) {
      logger.error('❌ Erro ao enviar áudio:', error);
      throw error;
    }
  }

  /**
   * Listar conversas
   */
  async getAllConversations(limit: number = 50): Promise<FormattedConversation[]> {
    if (!this.isWhatsAppConnected()) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      logger.info(`📞 Buscando ${limit} conversas...`);

      const chats = await this.client!.getChats();

      // Filtrar apenas conversas privadas (não grupos)
      const privateChats = chats.filter((chat: WWebChat) => !chat.isGroup).slice(0, limit);

      const conversations: FormattedConversation[] = await Promise.all(
        privateChats.map(async (chat: WWebChat) => {
          const lastMessage = chat.lastMessage;

          return {
            id: chat.id._serialized,
            name: chat.name || chat.id.user,
            phone: chat.id.user,
            isGroup: chat.isGroup,
            unreadCount: chat.unreadCount || 0,
            lastMessage: lastMessage
              ? {
                  body: lastMessage.body || '',
                  timestamp: lastMessage.timestamp || 0,
                  fromMe: lastMessage.fromMe || false,
                }
              : null,
            timestamp: chat.timestamp || 0,
            // profilePicUrl removido - não está disponível na API do whatsapp-web.js
          };
        })
      );

      logger.info(`✅ ${conversations.length} conversas retornadas`);

      return conversations;
    } catch (error: any) {
      logger.error('❌ Erro ao listar conversas:', error);
      throw error;
    }
  }

  /**
   * Buscar mensagens de uma conversa
   */
  async getChatMessages(phone: string, count: number = 100): Promise<FormattedMessage[]> {
    if (!this.isWhatsAppConnected()) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      const chatId = await this.formatPhoneNumber(phone);
      logger.info(`💬 Buscando ${count} mensagens de ${chatId}...`);

      const chat = await this.client!.getChatById(chatId);
      const messages = await chat.fetchMessages({ limit: count });

      const formattedMessages: FormattedMessage[] = await Promise.all(
        messages.map((msg: WWebMessage) => this.formatMessage(msg))
      );

      logger.info(`✅ ${formattedMessages.length} mensagens retornadas`);

      return formattedMessages;
    } catch (error: any) {
      logger.error('❌ Erro ao buscar mensagens:', error);
      throw error;
    }
  }

  /**
   * Formatar mensagem
   */
  private async formatMessage(msg: WWebMessage): Promise<FormattedMessage> {
    const contact = await msg.getContact();

    return {
      id: msg.id._serialized,
      body: msg.body || '',
      from: msg.from,
      to: msg.to || '',
      fromMe: msg.fromMe,
      timestamp: msg.timestamp,
      type: msg.type,
      hasMedia: msg.hasMedia,
      ack: msg.ack || 0,
      status: this.mapAckToStatus(msg.ack),
      contact: {
        id: contact.id._serialized,
        phone: contact.id.user,
        name: contact.name || contact.pushname || contact.id.user,
      },
    };
  }

  /**
   * Formatar número de telefone
   */
  private async formatPhoneNumber(phone: string): Promise<string> {
    // Remover caracteres não numéricos
    let cleaned = phone.replace(/\D/g, '');

    // Se não começar com código do país, adicionar 55 (Brasil)
    if (!cleaned.startsWith('55') && cleaned.length === 11) {
      cleaned = '55' + cleaned;
    }

    // Adicionar @c.us
    return `${cleaned}@c.us`;
  }

  /**
   * Mapear ACK para status
   */
  private mapAckToStatus(ack?: number): string {
    switch (ack) {
      case 0:
        return 'ERROR';
      case 1:
        return 'PENDING';
      case 2:
        return 'SENT';
      case 3:
        return 'DELIVERED';
      case 4:
        return 'READ';
      case 5:
        return 'PLAYED';
      default:
        return 'SENT';
    }
  }

  /**
   * Validar conexão
   */
  private validateConnection(): void {
    if (!this.isWhatsAppConnected()) {
      throw new Error('WhatsApp não está conectado');
    }
  }
}

// Exportar instância singleton
export const whatsappWebJSService = new WhatsAppWebJSService();
