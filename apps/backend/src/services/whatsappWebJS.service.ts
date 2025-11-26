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
  private qrDebounceTimer: NodeJS.Timeout | null = null;
  private qrTimeoutTimer: NodeJS.Timeout | null = null;

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
      // ✅ FIX: Implementar debounce de 100ms para evitar atualizações muito rápidas
      this.client.on('qr', async (qr: string) => {
        // Limpar timer anterior se existir
        if (this.qrDebounceTimer) {
          clearTimeout(this.qrDebounceTimer);
        }

        // Debounce de 100ms (reduzido de 500ms para melhor UX)
        this.qrDebounceTimer = setTimeout(async () => {
          logger.info('📱 QR Code gerado (debounced 100ms)');

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
            } else {
              logger.warn('⚠️  Socket.IO não configurado - QR code não será emitido automaticamente');
            }

            // ✅ FIX: Iniciar timer de timeout (60 segundos)
            this.startQRTimeout();

          } catch (error) {
            logger.error('❌ Erro ao gerar QR Code base64:', error);
            this.qrCode = qr; // Fallback para string raw
            if (this.io) {
              this.io.emit('whatsapp:qr', { qr });
              this.io.emit('whatsapp:status', 'INITIALIZING');
            }
          }
        }, 100); // Aguardar apenas 100ms (UX mais responsiva)
      });

      // Event: Cliente pronto
      this.client.on('ready', () => {
        logger.info('✅ WhatsApp conectado e pronto!');
        this.isConnected = true;
        this.isInitializing = false;
        this.qrCode = null;

        // ✅ FIX: Limpar timers ao conectar
        this.clearQRTimers();

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

        // ✅ FIX: Limpar timers em falha
        this.clearQRTimers();

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
      // ✅ FIX: Sempre resetar flag em caso de erro
      this.isInitializing = false;
      this.client = null;
      this.clearQRTimers();
      throw error;
    } finally {
      // ✅ FIX: Garantir que isInitializing seja resetado em qualquer cenário
      // (só se não conectou com sucesso)
      if (!this.isConnected) {
        this.isInitializing = false;
      }
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
   * Desconectar (mantém sessão para reconexão automática)
   * ⚠️ IMPORTANTE: Não usa logout() nem destroy() para preservar sessão LocalAuth
   */
  async disconnect(): Promise<void> {
    if (!this.client) {
      logger.warn('⚠️  Nenhum cliente para desconectar');
      return;
    }

    try {
      // ✅ FIX CRÍTICO: NÃO chamar logout() ou destroy()
      // Apenas limpar variáveis locais e deixar sessão intacta no disco
      // whatsapp-web.js vai reconectar automaticamente na próxima inicialização

      logger.info('🔌 Desconectando cliente (mantendo sessão LocalAuth)...');

      // Limpar apenas referências locais
      this.client = null;
      this.isConnected = false;
      this.qrCode = null;
      this.isInitializing = false;
      this.clearQRTimers();

      logger.info('✅ WhatsApp desconectado (sessão LocalAuth preservada no disco)');
    } catch (error: any) {
      logger.error('❌ Erro ao desconectar WhatsApp:', error);
      this.client = null;
      this.isConnected = false;
      this.isInitializing = false;
      throw error;
    }
  }

  /**
   * ✅ NOVO: Logout completo (remove sessão e gera novo QR code)
   */
  async logout(): Promise<void> {
    if (!this.client) {
      logger.warn('⚠️  Nenhum cliente para fazer logout');
      return;
    }

    try {
      logger.info('🔓 Fazendo logout e removendo sessão...');

      // Destruir cliente E sessão
      await this.client.destroy();
      this.client = null;
      this.isConnected = false;
      this.qrCode = null;
      this.isInitializing = false;
      this.clearQRTimers();

      // Deletar arquivos de sessão manualmente
      this.deleteSessionFiles();

      logger.info('✅ Logout completo (sessão removida)');
    } catch (error: any) {
      logger.error('❌ Erro ao fazer logout:', error);
      this.client = null;
      this.isConnected = false;
      this.isInitializing = false;
      throw error;
    }
  }

  /**
   * ✅ NOVO: Reinicializar WhatsApp (gerar novo QR code)
   */
  async reinitialize(): Promise<void> {
    logger.info('🔄 Reinicializando WhatsApp...');

    try {
      // 1. Fazer logout completo (remove sessão)
      if (this.client) {
        await this.logout();
      }

      // 2. Aguardar 1 segundo para garantir limpeza
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3. Inicializar novamente (vai gerar novo QR code)
      await this.initialize();

      logger.info('✅ WhatsApp reinicializado com sucesso');
    } catch (error: any) {
      logger.error('❌ Erro ao reinicializar WhatsApp:', error);
      throw error;
    }
  }

  /**
   * ✅ NOVO: Limpar timers de QR code
   */
  private clearQRTimers(): void {
    if (this.qrDebounceTimer) {
      clearTimeout(this.qrDebounceTimer);
      this.qrDebounceTimer = null;
    }
    if (this.qrTimeoutTimer) {
      clearTimeout(this.qrTimeoutTimer);
      this.qrTimeoutTimer = null;
    }
  }

  /**
   * ✅ NOVO: Iniciar timeout para QR code (60 segundos)
   */
  private startQRTimeout(): void {
    // Limpar timeout anterior
    if (this.qrTimeoutTimer) {
      clearTimeout(this.qrTimeoutTimer);
    }

    // Criar novo timeout de 60 segundos
    this.qrTimeoutTimer = setTimeout(() => {
      if (!this.isConnected && this.qrCode) {
        logger.warn('⏱️  QR Code expirado (60 segundos). Gerando novo...');

        // Emitir evento de expiração
        if (this.io) {
          this.io.emit('whatsapp:qr-expired');
        }

        // Limpar QR code atual
        this.qrCode = null;

        // whatsapp-web.js vai gerar automaticamente um novo QR code
      }
    }, 60000); // 60 segundos
  }

  /**
   * ✅ NOVO: Deletar arquivos de sessão
   */
  private deleteSessionFiles(): void {
    try {
      if (fs.existsSync(this.sessionPath)) {
        // Deletar todos os arquivos da sessão
        const files = fs.readdirSync(this.sessionPath);
        for (const file of files) {
          const filePath = path.join(this.sessionPath, file);
          const stat = fs.statSync(filePath);

          if (stat.isDirectory()) {
            // Deletar diretório recursivamente
            fs.rmSync(filePath, { recursive: true, force: true });
          } else {
            // Deletar arquivo
            fs.unlinkSync(filePath);
          }
        }
        logger.info('🗑️  Arquivos de sessão deletados');
      }
    } catch (error) {
      logger.error('❌ Erro ao deletar arquivos de sessão:', error);
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
   * Enviar vídeo
   * Compatível com whatsappService (WPPConnect) - mantém mesma assinatura
   * @param to Número de destino
   * @param videoUrl URL do vídeo ou caminho local
   * @param caption Legenda opcional
   * @param asGif Se true, envia como GIF (não recomendado - aumenta tamanho)
   * @returns ID da mensagem no WhatsApp
   */
  async sendVideo(to: string, videoUrl: string, caption?: string, asGif: boolean = false): Promise<string | undefined> {
    if (!this.isWhatsAppConnected()) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      const formatted = await this.formatPhoneNumber(to);
      logger.info(`🎥 Enviando vídeo para ${formatted}${asGif ? ' (como GIF)' : ''}`);

      let media: MessageMedia;

      if (videoUrl.startsWith('data:')) {
        // Base64 data URI
        media = new MessageMedia(
          asGif ? 'image/gif' : 'video/mp4',
          videoUrl.split(',')[1],
          asGif ? 'video.gif' : 'video.mp4'
        );
      } else if (videoUrl.startsWith('http')) {
        // URL remota
        media = await MessageMedia.fromUrl(videoUrl);
      } else {
        // Arquivo local
        media = MessageMedia.fromFilePath(videoUrl);
      }

      const sentMsg = await this.client!.sendMessage(formatted, media, {
        caption: caption || '',
        sendMediaAsDocument: false, // Enviar como vídeo inline, não como documento
      });

      logger.info(`✅ Vídeo enviado: ${sentMsg.id._serialized}`);

      return sentMsg.id._serialized;
    } catch (error: any) {
      logger.error('❌ Erro ao enviar vídeo:', error);
      throw error;
    }
  }

  /**
   * Listar conversas
   * ✅ OTIMIZADO: Logs de performance
   */
  async getAllConversations(limit: number = 50): Promise<FormattedConversation[]> {
    if (!this.isWhatsAppConnected()) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      const startTime = Date.now();
      logger.info(`📞 Buscando ${limit} conversas...`);

      // ✅ FIX: Usar método alternativo via Puppeteer direto (contorna bug do getChats)
      const getChatsStart = Date.now();
      const chats = await this.client!.pupPage!.evaluate(() => {
        // @ts-ignore - Código roda no browser via Puppeteer
        // Acessar Store do WhatsApp Web diretamente
        // @ts-ignore
        const Store = window.Store || window.WWebJS?.getStore?.();
        if (!Store || !Store.Chat) {
          throw new Error('WhatsApp Store não disponível');
        }

        // Buscar todos os chats
        const allChats = Store.Chat.getModelsArray();

        // Mapear para formato simples (sem objetos complexos do Puppeteer)
        return allChats.map((chat: any) => ({
          id: chat.id?._serialized || chat.id,
          name: chat.name || chat.contact?.name || '',
          isGroup: chat.isGroup || false,
          unreadCount: chat.unreadCount || 0,
          timestamp: chat.t || Date.now() / 1000,
          lastMessage: chat.lastReceivedKey ? {
            body: chat.lastReceivedKey.fromMe ? '' : (chat.lastMessage?.body || ''),
            timestamp: chat.t || 0,
            fromMe: chat.lastReceivedKey.fromMe || false
          } : null
        }));
      });

      const getChatsTime = Date.now() - getChatsStart;
      logger.info(`⏱️  getChats (via Puppeteer): ${getChatsTime}ms (${chats.length} total)`);

      // Filtrar apenas conversas privadas (não grupos)
      const privateChats = chats.filter((chat: any) => !chat.isGroup).slice(0, limit);
      logger.info(`📊 Conversas privadas: ${privateChats.length}/${chats.length}`);

      const formatStart = Date.now();
      const conversations: FormattedConversation[] = privateChats.map((chat: any) => {
        return {
          id: chat.id,
          name: chat.name || chat.id.replace('@c.us', ''),
          phone: chat.id.replace('@c.us', ''),
          isGroup: chat.isGroup,
          unreadCount: chat.unreadCount || 0,
          lastMessage: chat.lastMessage,
          timestamp: chat.timestamp || 0,
        };
      });
      const formatTime = Date.now() - formatStart;
      logger.info(`⏱️  format: ${formatTime}ms`);

      const totalTime = Date.now() - startTime;
      logger.info(`✅ ${conversations.length} conversas retornadas em ${totalTime}ms`);

      return conversations;
    } catch (error: any) {
      logger.error('❌ Erro ao listar conversas:', error);
      throw error;
    }
  }

  /**
   * Buscar mensagens de uma conversa
   * ✅ OTIMIZADO: Logs de performance para identificar lentidão
   */
  async getChatMessages(phone: string, count: number = 100): Promise<FormattedMessage[]> {
    if (!this.isWhatsAppConnected()) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      const startTime = Date.now();
      const chatId = await this.formatPhoneNumber(phone);
      logger.info(`💬 Buscando ${count} mensagens de ${chatId}...`);

      // Step 1: Get chat
      const getChatStart = Date.now();
      const chat = await this.client!.getChatById(chatId);
      const getChatTime = Date.now() - getChatStart;
      logger.info(`⏱️  getChatById: ${getChatTime}ms`);

      // Step 2: Fetch messages
      const fetchStart = Date.now();
      const messages = await chat.fetchMessages({ limit: count });
      const fetchTime = Date.now() - fetchStart;
      logger.info(`⏱️  fetchMessages: ${fetchTime}ms (${messages.length} msgs)`);

      // Step 3: Format messages
      const formatStart = Date.now();
      const formattedMessages: FormattedMessage[] = await Promise.all(
        messages.map((msg: WWebMessage) => this.formatMessage(msg))
      );
      const formatTime = Date.now() - formatStart;
      logger.info(`⏱️  formatMessage: ${formatTime}ms`);

      const totalTime = Date.now() - startTime;
      logger.info(`✅ ${formattedMessages.length} mensagens retornadas em ${totalTime}ms`);

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
