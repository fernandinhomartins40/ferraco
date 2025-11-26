/**
 * WhatsApp Service - whatsapp-web.js Integration
 *
 * Migrado de WPPConnect para whatsapp-web.js devido a problemas de stack overflow
 * em WPPConnect ao enviar mensagens (getIsGroup/getIsMe recursivo).
 *
 * whatsapp-web.js é mais estável e tem melhor suporte da comunidade.
 */

import { Client, LocalAuth, Message as WWebMessage, MessageMedia, Chat as WWebChat, Location } from 'whatsapp-web.js';
import { logger } from '../utils/logger';
import { Server as SocketIOServer } from 'socket.io';
import * as fs from 'fs';
import * as path from 'path';
import QRCode from 'qrcode';
import { setupWhatsAppListeners, removeWhatsAppListeners } from './whatsappListeners';

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
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 5000; // 5 segundos

  // Circuit Breaker para retry automático
  private circuitBreakerState: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount: number = 0;
  private maxFailures: number = 5;
  private circuitBreakerTimeout: number = 60000; // 60 segundos
  private circuitBreakerTimer: NodeJS.Timeout | null = null;
  private lastFailureTime: number = 0;

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

        // ✅ NOVO: Resetar tentativas de reconexão
        this.resetReconnectAttempts();

        // ✅ NOVO: Configurar listeners avançados
        if (this.io && this.client) {
          setupWhatsAppListeners(this.client, this.io);
        }

        // ✅ NOVO: Iniciar health check automático
        this.startHealthCheck();

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
   * Desconectar corretamente (fecha Puppeteer mas mantém sessão)
   * ✅ CORRIGIDO: Fecha recursos do Puppeteer para evitar memory leak
   */
  async disconnect(): Promise<void> {
    if (!this.client) {
      logger.warn('⚠️  Nenhum cliente para desconectar');
      return;
    }

    try {
      logger.info('🔌 Desconectando cliente WhatsApp...');

      // ✅ NOVO: Parar health check
      this.stopHealthCheck();

      // ✅ NOVO: Remover listeners antes de destruir
      removeWhatsAppListeners(this.client);

      // ✅ CORREÇÃO: Destruir cliente para liberar recursos do Puppeteer
      // A sessão LocalAuth fica salva no disco e será reutilizada na próxima inicialização
      await this.client.destroy();

      // Limpar referências locais
      this.client = null;
      this.isConnected = false;
      this.qrCode = null;
      this.isInitializing = false;
      this.clearQRTimers();

      logger.info('✅ WhatsApp desconectado (sessão preservada no disco)');
    } catch (error: any) {
      logger.error('❌ Erro ao desconectar WhatsApp:', error);

      // Forçar limpeza mesmo com erro
      this.stopHealthCheck();
      this.client = null;
      this.isConnected = false;
      this.isInitializing = false;
      this.clearQRTimers();

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
   * ✅ OTIMIZADO: Usa retry automático com circuit breaker
   */
  async sendTextMessage(to: string, message: string): Promise<any> {
    if (!this.isWhatsAppConnected()) {
      throw new Error('WhatsApp não está conectado');
    }

    const formatted = await this.formatPhoneNumber(to);

    return this.executeWithRetry(
      async () => {
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
      },
      `sendTextMessage para ${formatted}`,
      3, // 3 tentativas
      1000 // 1 segundo de delay inicial
    );
  }

  /**
   * Enviar imagem
   * ✅ OTIMIZADO: Usa retry automático com circuit breaker
   */
  async sendImage(to: string, pathOrBase64: string, filename?: string, caption?: string): Promise<any> {
    if (!this.isWhatsAppConnected()) {
      throw new Error('WhatsApp não está conectado');
    }

    const formatted = await this.formatPhoneNumber(to);

    return this.executeWithRetry(
      async () => {
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
      },
      `sendImage para ${formatted}`,
      3,
      2000 // 2 segundos (mídia é mais pesada)
    );
  }

  /**
   * Enviar áudio
   * ✅ OTIMIZADO: Usa retry automático com circuit breaker
   */
  async sendAudio(to: string, audioPath: string): Promise<any> {
    if (!this.isWhatsAppConnected()) {
      throw new Error('WhatsApp não está conectado');
    }

    const formatted = await this.formatPhoneNumber(to);

    return this.executeWithRetry(
      async () => {
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
      },
      `sendAudio para ${formatted}`,
      3,
      2000
    );
  }

  /**
   * Enviar vídeo
   * ✅ OTIMIZADO: Usa retry automático com circuit breaker
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

    const formatted = await this.formatPhoneNumber(to);

    return this.executeWithRetry(
      async () => {
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
      },
      `sendVideo para ${formatted}`,
      3,
      3000 // 3 segundos (vídeo é mais pesado)
    );
  }

  /**
   * ✅ NOVO: Enviar arquivo/documento
   * ✅ OTIMIZADO: Usa retry automático com circuit breaker
   * @param to Número de destino
   * @param pathOrUrl Caminho local ou URL do arquivo
   * @param filename Nome do arquivo (opcional)
   * @param caption Legenda opcional
   * @returns ID da mensagem no WhatsApp
   */
  async sendFile(to: string, pathOrUrl: string, filename?: string, caption?: string): Promise<string> {
    if (!this.isWhatsAppConnected()) {
      throw new Error('WhatsApp não está conectado');
    }

    const formatted = await this.formatPhoneNumber(to);

    return this.executeWithRetry(
      async () => {
        logger.info(`📄 Enviando documento para ${formatted}`);

        let media: MessageMedia;

        if (pathOrUrl.startsWith('data:')) {
          // Base64 data URI
          const mimeType = pathOrUrl.split(';')[0].split(':')[1];
          media = new MessageMedia(
            mimeType,
            pathOrUrl.split(',')[1],
            filename || 'document.pdf'
          );
        } else if (pathOrUrl.startsWith('http')) {
          // URL remota
          media = await MessageMedia.fromUrl(pathOrUrl);
          if (filename) {
            media.filename = filename;
          }
        } else {
          // Arquivo local
          media = MessageMedia.fromFilePath(pathOrUrl);
          if (filename) {
            media.filename = filename;
          }
        }

        // Enviar como documento
        const sentMsg = await this.client!.sendMessage(formatted, media, {
          caption: caption || '',
          sendMediaAsDocument: true, // Força enviar como documento (não inline)
        });

        logger.info(`✅ Documento enviado: ${sentMsg.id._serialized}`);

        return sentMsg.id._serialized;
      },
      `sendFile para ${formatted}`,
      3,
      2000
    );
  }

  /**
   * Listar conversas usando API nativa do whatsapp-web.js
   * ✅ CORRIGIDO: Usa client.getChats() ao invés de Puppeteer direto
   */
  async getAllConversations(limit: number = 50): Promise<FormattedConversation[]> {
    if (!this.isWhatsAppConnected()) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      const startTime = Date.now();
      logger.info(`📞 Buscando ${limit} conversas...`);

      // ✅ FIX: Tratamento de erro para compatibilidade com WhatsApp Web API changes
      let chats: WWebChat[] = [];

      try {
        const getChatsStart = Date.now();
        chats = await this.client!.getChats();
        const getChatsTime = Date.now() - getChatsStart;
        logger.info(`⏱️  getChats (API nativa): ${getChatsTime}ms (${chats.length} total)`);
      } catch (error: any) {
        logger.error(`❌ Erro ao buscar chats: ${error.message}`);

        // Se o erro é de incompatibilidade de API, retornar array vazio ao invés de falhar
        if (error.message?.includes('Evaluation failed') || error.message?.includes('not a function')) {
          logger.warn('⚠️  WhatsApp Web API mudou. Retornando lista vazia temporariamente.');
          return [];
        }

        throw error;
      }

      // Filtrar apenas conversas privadas (não grupos) e ordenar por timestamp
      const privateChats = chats
        .filter((chat: WWebChat) => !chat.isGroup)
        .sort((a: WWebChat, b: WWebChat) => {
          const timeA = a.timestamp || 0;
          const timeB = b.timestamp || 0;
          return timeB - timeA; // Mais recentes primeiro
        })
        .slice(0, limit);

      logger.info(`📊 Conversas privadas: ${privateChats.length}/${chats.length}`);

      // Formatar conversas com tratamento de erro individual
      const formatStart = Date.now();
      const conversations: FormattedConversation[] = [];

      for (const chat of privateChats) {
        try {
          // Buscar última mensagem
          const messages = await chat.fetchMessages({ limit: 1 });
          const lastMsg = messages.length > 0 ? messages[0] : null;

          conversations.push({
            id: chat.id._serialized,
            name: chat.name || chat.id._serialized.replace('@c.us', ''),
            phone: chat.id.user,
            isGroup: chat.isGroup,
            unreadCount: chat.unreadCount || 0,
            lastMessage: lastMsg ? {
              body: lastMsg.body || '',
              timestamp: lastMsg.timestamp,
              fromMe: lastMsg.fromMe,
            } : null,
            timestamp: chat.timestamp || 0,
          });
        } catch (error: any) {
          logger.warn(`⚠️  Erro ao processar chat ${chat.id._serialized}: ${error.message}`);
          // Continuar com próximo chat
        }
      }

      const formatTime = Date.now() - formatStart;
      logger.info(`⏱️  format: ${formatTime}ms`);

      const totalTime = Date.now() - startTime;
      logger.info(`✅ ${conversations.length} conversas retornadas em ${totalTime}ms`);

      return conversations;
    } catch (error: any) {
      logger.error('❌ Erro ao listar conversas:', error);

      // Tratamento de erro específico
      if (error.message?.includes('not authenticated')) {
        throw new Error('WhatsApp não está autenticado. Por favor, escaneie o QR Code novamente.');
      }
      if (error.message?.includes('timeout')) {
        throw new Error('Timeout ao buscar conversas. Tente novamente.');
      }

      throw new Error(`Erro ao listar conversas: ${error.message}`);
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
   * ✅ NOVO: Marcar chat como lido
   */
  async markChatAsRead(chatId: string): Promise<void> {
    if (!this.isWhatsAppConnected()) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      const chat = await this.client!.getChatById(chatId);
      await chat.sendSeen();
      logger.info(`✅ Chat marcado como lido: ${chatId}`);
    } catch (error: any) {
      logger.error('❌ Erro ao marcar chat como lido:', error);
      throw error;
    }
  }

  /**
   * ✅ NOVO: Marcar chat como não lido
   */
  async markChatAsUnread(chatId: string): Promise<void> {
    if (!this.isWhatsAppConnected()) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      const chat = await this.client!.getChatById(chatId);
      await chat.markUnread();
      logger.info(`✅ Chat marcado como não lido: ${chatId}`);
    } catch (error: any) {
      logger.error('❌ Erro ao marcar chat como não lido:', error);
      throw error;
    }
  }

  /**
   * ✅ NOVO: Enviar reação emoji a uma mensagem
   */
  async sendReaction(messageId: string, emoji: string): Promise<void> {
    if (!this.isWhatsAppConnected()) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      const message = await this.client!.getMessageById(messageId);
      await message.react(emoji);
      logger.info(`✅ Reação enviada: ${emoji} para mensagem ${messageId}`);
    } catch (error: any) {
      logger.error('❌ Erro ao enviar reação:', error);
      throw error;
    }
  }

  /**
   * ✅ NOVO: Remover reação de uma mensagem
   */
  async removeReaction(messageId: string): Promise<void> {
    if (!this.isWhatsAppConnected()) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      const message = await this.client!.getMessageById(messageId);
      await message.react('');
      logger.info(`✅ Reação removida da mensagem ${messageId}`);
    } catch (error: any) {
      logger.error('❌ Erro ao remover reação:', error);
      throw error;
    }
  }

  /**
   * ✅ NOVO: Deletar mensagem
   */
  async deleteMessage(messageId: string, forEveryone: boolean = false): Promise<void> {
    if (!this.isWhatsAppConnected()) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      const message = await this.client!.getMessageById(messageId);
      await message.delete(forEveryone);
      logger.info(`✅ Mensagem deletada (forEveryone: ${forEveryone}): ${messageId}`);
    } catch (error: any) {
      logger.error('❌ Erro ao deletar mensagem:', error);
      throw error;
    }
  }

  /**
   * ✅ NOVO: Encaminhar mensagem
   */
  async forwardMessage(messageId: string, chatIds: string | string[]): Promise<void> {
    if (!this.isWhatsAppConnected()) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      const message = await this.client!.getMessageById(messageId);
      const targets = Array.isArray(chatIds) ? chatIds : [chatIds];

      for (const chatId of targets) {
        const formatted = await this.formatPhoneNumber(chatId);
        await message.forward(formatted);
      }

      logger.info(`✅ Mensagem encaminhada para ${targets.length} contatos`);
    } catch (error: any) {
      logger.error('❌ Erro ao encaminhar mensagem:', error);
      throw error;
    }
  }

  /**
   * ✅ NOVO: Baixar mídia de uma mensagem
   */
  async downloadMedia(messageId: string): Promise<{ data: string; mimetype: string; filename?: string }> {
    if (!this.isWhatsAppConnected()) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      const message = await this.client!.getMessageById(messageId);

      if (!message.hasMedia) {
        throw new Error('Mensagem não contém mídia');
      }

      const media = await message.downloadMedia();

      if (!media) {
        throw new Error('Falha ao baixar mídia');
      }

      logger.info(`✅ Mídia baixada: ${messageId}`);

      return {
        data: media.data,
        mimetype: media.mimetype,
        filename: media.filename,
      };
    } catch (error: any) {
      logger.error('❌ Erro ao baixar mídia:', error);
      throw error;
    }
  }

  /**
   * ✅ NOVO: Arquivar/desarquivar chat
   */
  async archiveChat(chatId: string, archive: boolean = true): Promise<void> {
    if (!this.isWhatsAppConnected()) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      const chat = await this.client!.getChatById(chatId);
      await chat.archive();
      logger.info(`✅ Chat ${archive ? 'arquivado' : 'desarquivado'}: ${chatId}`);
    } catch (error: any) {
      logger.error('❌ Erro ao arquivar chat:', error);
      throw error;
    }
  }

  /**
   * ✅ NOVO: Fixar/desafixar chat
   */
  async pinChat(chatId: string, pin: boolean = true): Promise<void> {
    if (!this.isWhatsAppConnected()) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      const chat = await this.client!.getChatById(chatId);
      await chat.pin();
      logger.info(`✅ Chat ${pin ? 'fixado' : 'desfixado'}: ${chatId}`);
    } catch (error: any) {
      logger.error('❌ Erro ao fixar chat:', error);
      throw error;
    }
  }

  /**
   * ✅ NOVO: Enviar localização GPS
   */
  async sendLocation(to: string, latitude: number, longitude: number): Promise<any> {
    if (!this.isWhatsAppConnected()) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      const formatted = await this.formatPhoneNumber(to);

      // Criar localização com a API correta
      const location = new Location(latitude, longitude);
      const sentMsg = await this.client!.sendMessage(formatted, location);

      logger.info(`✅ Localização enviada: ${sentMsg.id._serialized}`);

      return {
        id: sentMsg.id._serialized,
        ack: sentMsg.ack || 0,
        timestamp: sentMsg.timestamp || Date.now(),
      };
    } catch (error: any) {
      logger.error('❌ Erro ao enviar localização:', error);
      throw error;
    }
  }

  /**
   * ✅ NOVO: Enviar contato vCard
   */
  async sendContact(to: string, contactId: string): Promise<any> {
    if (!this.isWhatsAppConnected()) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      const formatted = await this.formatPhoneNumber(to);
      const contact = await this.client!.getContactById(contactId);
      const sentMsg = await this.client!.sendMessage(formatted, contact);

      logger.info(`✅ Contato enviado: ${sentMsg.id._serialized}`);

      return {
        id: sentMsg.id._serialized,
        ack: sentMsg.ack || 0,
        timestamp: sentMsg.timestamp || Date.now(),
      };
    } catch (error: any) {
      logger.error('❌ Erro ao enviar contato:', error);
      throw error;
    }
  }

  /**
   * ✅ NOVO: Listar todos os contatos
   */
  async getAllContacts(): Promise<any[]> {
    if (!this.isWhatsAppConnected()) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      const contacts = await this.client!.getContacts();

      const formattedContacts = contacts.map((contact) => ({
        id: contact.id._serialized,
        name: contact.name || contact.pushname || contact.number,
        phone: contact.number,
        isMyContact: contact.isMyContact,
        isBlocked: contact.isBlocked,
        profilePicUrl: null, // Será carregado sob demanda
      }));

      logger.info(`✅ ${formattedContacts.length} contatos carregados`);
      return formattedContacts;
    } catch (error: any) {
      logger.error('❌ Erro ao listar contatos:', error);
      throw error;
    }
  }

  /**
   * ✅ NOVO: Obter informações da conta
   */
  async getAccountInfo(): Promise<any> {
    if (!this.isWhatsAppConnected()) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      const state = await this.client!.getState();
      const info = this.client!.info;

      return {
        state,
        wid: info?.wid?._serialized,
        pushname: info?.pushname,
        platform: info?.platform,
      };
    } catch (error: any) {
      logger.error('❌ Erro ao obter info da conta:', error);
      throw error;
    }
  }

  /**
   * ✅ NOVO: Verificar se números estão no WhatsApp
   */
  async checkNumbersOnWhatsApp(phoneNumbers: string | string[]): Promise<any[]> {
    if (!this.isWhatsAppConnected()) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      const numbers = Array.isArray(phoneNumbers) ? phoneNumbers : [phoneNumbers];
      const results = [];

      for (const number of numbers) {
        try {
          const formatted = await this.formatPhoneNumber(number);
          const isRegistered = await this.client!.isRegisteredUser(formatted);

          results.push({
            phone: number,
            exists: isRegistered,
            jid: isRegistered ? formatted : null,
          });
        } catch (error) {
          results.push({
            phone: number,
            exists: false,
            error: 'Número inválido',
          });
        }
      }

      logger.info(`✅ ${results.length} números verificados`);
      return results;
    } catch (error: any) {
      logger.error('❌ Erro ao verificar números:', error);
      throw error;
    }
  }

  /**
   * ✅ NOVO: Obter foto de perfil
   */
  async getProfilePicUrl(contactId: string): Promise<string | null> {
    if (!this.isWhatsAppConnected()) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      const formatted = await this.formatPhoneNumber(contactId);
      const contact = await this.client!.getContactById(formatted);
      const profilePicUrl = await contact.getProfilePicUrl();

      logger.info(`✅ Foto de perfil obtida para ${contactId}`);
      return profilePicUrl;
    } catch (error: any) {
      logger.warn(`⚠️  Foto de perfil não disponível para ${contactId}`);
      return null;
    }
  }

  /**
   * ✅ NOVO: Iniciar health check automático
   */
  startHealthCheck(): void {
    // Limpar intervalo anterior se existir
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Verificar conexão a cada 30 segundos
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 30000);

    logger.info('✅ Health check iniciado (30 segundos)');
  }

  /**
   * ✅ NOVO: Parar health check
   */
  stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      logger.info('✅ Health check parado');
    }
  }

  /**
   * ✅ NOVO: Executar verificação de saúde
   */
  private async performHealthCheck(): Promise<void> {
    try {
      if (!this.client) {
        logger.debug('Health check: Cliente não inicializado');
        return;
      }

      // Verificar estado do cliente
      const state = await this.client.getState();

      if (state === 'CONNECTED') {
        if (!this.isConnected) {
          logger.info('✅ Health check: Conexão restaurada');
          this.isConnected = true;
          this.reconnectAttempts = 0;

          if (this.io) {
            this.io.emit('whatsapp:status', 'CONNECTED');
          }
        }
      } else {
        logger.warn(`⚠️  Health check: Estado anormal - ${state}`);

        if (this.isConnected) {
          this.isConnected = false;

          if (this.io) {
            this.io.emit('whatsapp:status', 'DISCONNECTED');
          }

          // Tentar reconectar
          await this.attemptReconnect();
        }
      }
    } catch (error) {
      logger.error('❌ Erro no health check:', error);

      // Tentar reconectar em caso de erro
      if (this.isConnected) {
        this.isConnected = false;
        await this.attemptReconnect();
      }
    }
  }

  /**
   * ✅ NOVO: Tentar reconexão automática
   */
  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error(`❌ Número máximo de tentativas de reconexão atingido (${this.maxReconnectAttempts})`);

      if (this.io) {
        this.io.emit('whatsapp:reconnect_failed', {
          attempts: this.reconnectAttempts,
          message: 'Falha na reconexão automática. Por favor, reinicialize manualmente.',
        });
      }

      return;
    }

    this.reconnectAttempts++;
    logger.info(`🔄 Tentando reconectar (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    if (this.io) {
      this.io.emit('whatsapp:reconnecting', {
        attempt: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts,
      });
    }

    // Aguardar delay antes de reconectar
    await new Promise(resolve => setTimeout(resolve, this.reconnectDelay));

    try {
      // Destruir cliente atual
      if (this.client) {
        await this.client.destroy();
        this.client = null;
      }

      // Reinicializar
      await this.initialize();

      logger.info('✅ Reconexão bem-sucedida');
      this.reconnectAttempts = 0;

    } catch (error) {
      logger.error(`❌ Falha na tentativa de reconexão ${this.reconnectAttempts}:`, error);

      // Tentar novamente após delay
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => this.attemptReconnect(), this.reconnectDelay * 2);
      }
    }
  }

  /**
   * ✅ NOVO: Resetar contador de reconexões
   */
  resetReconnectAttempts(): void {
    this.reconnectAttempts = 0;
  }

  /**
   * ✅ NOVO: Circuit Breaker - Executar operação com retry automático
   *
   * Implementa padrão Circuit Breaker para prevenir sobrecarga:
   * - CLOSED: Operações normais
   * - OPEN: Muitas falhas, bloqueia operações
   * - HALF_OPEN: Testando se pode retornar ao normal
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<T> {
    // Verificar estado do circuit breaker
    if (this.circuitBreakerState === 'OPEN') {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;

      if (timeSinceLastFailure < this.circuitBreakerTimeout) {
        throw new Error(
          `Circuit breaker OPEN para operações do WhatsApp. ` +
          `Tente novamente em ${Math.ceil((this.circuitBreakerTimeout - timeSinceLastFailure) / 1000)}s`
        );
      }

      // Transição para HALF_OPEN após timeout
      this.circuitBreakerState = 'HALF_OPEN';
      logger.info('🔄 Circuit breaker mudou para HALF_OPEN, testando conexão...');
    }

    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        // Executar operação
        const result = await operation();

        // Sucesso - resetar falhas
        if (this.circuitBreakerState === 'HALF_OPEN') {
          this.circuitBreakerState = 'CLOSED';
          logger.info('✅ Circuit breaker retornou para CLOSED');
        }

        this.failureCount = 0;

        if (attempt > 0) {
          logger.info(`✅ ${operationName} bem-sucedida após ${attempt} tentativa(s)`);
        }

        return result;

      } catch (error: any) {
        lastError = error;
        attempt++;

        logger.warn(
          `⚠️  Tentativa ${attempt}/${maxRetries + 1} falhou para ${operationName}: ${error.message}`
        );

        // Se não há mais tentativas, registrar falha
        if (attempt > maxRetries) {
          this.recordFailure();
          break;
        }

        // Aguardar antes de tentar novamente (exponential backoff)
        const delay = retryDelay * Math.pow(2, attempt - 1);
        logger.info(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Todas as tentativas falharamsendMessage
    throw new Error(
      `${operationName} falhou após ${maxRetries + 1} tentativa(s): ${lastError?.message}`
    );
  }

  /**
   * ✅ NOVO: Registrar falha no circuit breaker
   */
  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    logger.warn(`⚠️  Falhas registradas: ${this.failureCount}/${this.maxFailures}`);

    if (this.failureCount >= this.maxFailures && this.circuitBreakerState !== 'OPEN') {
      this.circuitBreakerState = 'OPEN';
      logger.error('🔴 Circuit breaker ABERTO devido a muitas falhas');

      // Emitir via Socket.IO
      if (this.io) {
        this.io.emit('whatsapp:circuit_breaker', {
          state: 'OPEN',
          failureCount: this.failureCount,
          message: 'WhatsApp está temporariamente indisponível devido a muitas falhas',
        });
      }

      // Configurar timer para tentar HALF_OPEN após timeout
      if (this.circuitBreakerTimer) {
        clearTimeout(this.circuitBreakerTimer);
      }

      this.circuitBreakerTimer = setTimeout(() => {
        this.circuitBreakerState = 'HALF_OPEN';
        logger.info('🔄 Circuit breaker mudou para HALF_OPEN automaticamente');
      }, this.circuitBreakerTimeout);
    }
  }

  /**
   * ✅ NOVO: Resetar circuit breaker manualmente
   */
  resetCircuitBreaker(): void {
    this.circuitBreakerState = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = 0;

    if (this.circuitBreakerTimer) {
      clearTimeout(this.circuitBreakerTimer);
      this.circuitBreakerTimer = null;
    }

    logger.info('✅ Circuit breaker resetado para CLOSED');

    if (this.io) {
      this.io.emit('whatsapp:circuit_breaker', {
        state: 'CLOSED',
        message: 'Circuit breaker resetado',
      });
    }
  }

  /**
   * ✅ NOVO: Obter estado do circuit breaker
   */
  getCircuitBreakerStatus(): { state: string; failureCount: number; maxFailures: number } {
    return {
      state: this.circuitBreakerState,
      failureCount: this.failureCount,
      maxFailures: this.maxFailures,
    };
  }
}

// Exportar instância singleton
export const whatsappWebJSService = new WhatsAppWebJSService();
