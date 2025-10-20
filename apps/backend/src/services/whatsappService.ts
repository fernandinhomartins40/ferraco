/**
 * WhatsApp Service - Integração com WPPConnect
 *
 * Migrado de Venom Bot para WPPConnect para resolver problemas de:
 * - QR Code não sendo gerado em modo headless/Docker
 * - Instabilidade de conexão
 * - Loops infinitos de reconexão
 *
 * WPPConnect oferece:
 * ✅ QR Code confiável em headless
 * ✅ Callbacks estáveis
 * ✅ Melhor suporte para produção
 * ✅ Documentação clara
 */

import * as wppconnect from '@wppconnect-team/wppconnect';
import type { Whatsapp, Message } from '@wppconnect-team/wppconnect';
import { logger } from '../utils/logger';
import * as path from 'path';
import * as fs from 'fs';
import whatsappChatService from './whatsappChatService';
import { WhatsAppListeners } from './whatsappListeners';
import { Server as SocketIOServer } from 'socket.io';

interface WhatsAppMessage {
  from: string;
  to: string;
  body: string;
  timestamp: Date;
  isGroup: boolean;
  fromMe: boolean;
}

class WhatsAppService {
  private client: Whatsapp | null = null;
  private qrCode: string | null = null;
  private isConnected: boolean = false;
  private sessionsPath: string;
  private isInitializing: boolean = false;
  private listeners: WhatsAppListeners | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;
  private isPolling: boolean = false;
  private io: SocketIOServer | null = null; // ✅ FASE 2: Socket.IO instance

  constructor() {
    // Diretório de sessões (será volume Docker)
    this.sessionsPath = process.env.WHATSAPP_SESSIONS_PATH || path.join(process.cwd(), 'sessions');

    // Criar diretório se não existir
    if (!fs.existsSync(this.sessionsPath)) {
      fs.mkdirSync(this.sessionsPath, { recursive: true });
      logger.info(`📁 Diretório de sessões criado: ${this.sessionsPath}`);
    }
  }

  /**
   * ✅ FASE 2: Configurar Socket.IO para eventos em tempo real
   */
  setSocketIO(io: SocketIOServer): void {
    this.io = io;
    logger.info('✅ Socket.IO configurado no WhatsAppService');

    // Listener para solicitar status/QR via Socket.IO
    this.io.on('connection', (socket) => {
      logger.info(`🔌 Cliente Socket.IO conectado: ${socket.id}`);

      // Cliente solicitou status atual
      socket.on('whatsapp:request-status', () => {
        logger.info('📡 Cliente solicitou status via Socket.IO');
        this.emitStatus();
      });

      // Cliente solicitou QR Code
      socket.on('whatsapp:request-qr', () => {
        logger.info('📡 Cliente solicitou QR Code via Socket.IO');
        if (this.qrCode) {
          socket.emit('whatsapp:qr', this.qrCode);
        }
      });
    });
  }

  /**
   * ✅ FASE 2: Emitir status atual via Socket.IO
   */
  private emitStatus(): void {
    if (!this.io) return;

    const status = this.isConnected ? 'CONNECTED' : (this.isInitializing ? 'INITIALIZING' : 'DISCONNECTED');
    this.io.emit('whatsapp:status', status);
    logger.info(`📡 Status emitido via Socket.IO: ${status}`);
  }

  /**
   * ✅ FASE 2: Emitir QR Code via Socket.IO
   */
  private emitQRCode(qrCode: string): void {
    if (!this.io) return;

    this.io.emit('whatsapp:qr', qrCode);
    logger.info('📡 QR Code emitido via Socket.IO');
  }

  /**
   * ✅ FASE 2: Emitir evento de conexão pronta via Socket.IO
   */
  private emitReady(): void {
    if (!this.io) return;

    this.io.emit('whatsapp:ready');
    this.io.emit('whatsapp:status', 'CONNECTED');
    logger.info('📡 WhatsApp pronto - evento emitido via Socket.IO');
  }

  /**
   * ✅ FASE 2: Emitir evento de desconexão via Socket.IO
   */
  private emitDisconnected(reason: string): void {
    if (!this.io) return;

    this.io.emit('whatsapp:disconnected', reason);
    this.io.emit('whatsapp:status', 'DISCONNECTED');
    logger.info(`📡 WhatsApp desconectado - evento emitido via Socket.IO: ${reason}`);
  }

  /**
   * Inicializar sessão WhatsApp
   * NÃO BLOQUEIA - Retorna imediatamente e conecta em background
   */
  async initialize(): Promise<void> {
    if (this.isInitializing) {
      logger.warn('⚠️  WhatsApp já está inicializando...');
      return;
    }

    logger.info('🚀 Inicializando WhatsApp com WPPConnect em background...');
    this.isInitializing = true;

    // Inicializar em background sem bloquear o servidor
    this.startWhatsAppClient().catch((error) => {
      logger.error('❌ Erro fatal ao inicializar WhatsApp:', error);
      this.isInitializing = false;
    });

    // Retornar imediatamente para não bloquear o servidor
    return Promise.resolve();
  }

  /**
   * Inicia o cliente WhatsApp (executa em background)
   */
  private async startWhatsAppClient(): Promise<void> {
    try {
      this.client = await wppconnect.create(
        'ferraco-crm', // session name
        // Callback QR Code
        (base64Qrimg: string, asciiQR: string, attempt: number) => {
          this.qrCode = base64Qrimg;
          logger.info(`📱 QR Code gerado! Tentativa ${attempt}`);
          logger.info('✅ Acesse /api/whatsapp/qr para visualizar o QR Code');

          // ✅ FASE 2: Emitir QR Code via Socket.IO
          this.emitQRCode(base64Qrimg);

          // QR code é regenerado automaticamente pelo WPPConnect
          // Não anular o código, sempre manter o mais recente disponível
        },
        // Callback status
        (statusSession: string, session: string) => {
          logger.info(`📊 [${session}] Status: ${statusSession}`);

          switch (statusSession) {
            case 'inChat':
            case 'isLogged':
            case 'qrReadSuccess':
            case 'chatsAvailable':
              this.isConnected = true;
              this.qrCode = null;
              this.isInitializing = false;
              logger.info('✅ WhatsApp conectado com sucesso!');

              // ✅ FASE 2: Emitir evento de conexão pronta via Socket.IO
              this.emitReady();

              // ⭐ SYNC AUTOMÁTICO: Carregar últimos 20 chats ao conectar
              if (this.client) {
                whatsappChatService.setWhatsAppClient(this.client);
                
                // Sync em background (não bloqueia)
                whatsappChatService.syncRecentChats(20).catch((error) => {
                  logger.error('Erro no sync automático:', error);
                });
              }
              break;

            case 'notLogged':
            case 'qrReadError':
            case 'qrReadFail':
              this.isConnected = false;
              logger.info('⏳ Aguardando leitura do QR Code...');

              // ✅ FASE 2: Emitir status via Socket.IO
              this.emitStatus();
              break;

            case 'desconnectedMobile':
            case 'serverClose':
            case 'deleteToken':
              this.isConnected = false;
              this.qrCode = null;
              logger.warn('⚠️  WhatsApp desconectado');

              // ✅ FASE 2: Emitir evento de desconexão via Socket.IO
              this.emitDisconnected(statusSession);
              break;

            case 'autocloseCalled':
            case 'browserClose':
              this.isConnected = false;
              this.isInitializing = false;
              logger.warn('🔄 Navegador fechado');

              // ✅ FASE 2: Emitir evento de desconexão via Socket.IO
              this.emitDisconnected(statusSession);
              break;

            default:
              logger.debug(`🔄 Status: ${statusSession}`);

              // ✅ FASE 2: Emitir status genérico via Socket.IO
              this.emitStatus();
          }
        },
        undefined, // onLoadingScreen
        undefined, // catchLinkCode
        // Options
        {
          headless: 'new' as any,
          devtools: false,
          debug: false,
          disableWelcome: true,
          updatesLog: false,
          autoClose: 0,
          folderNameToken: this.sessionsPath,
          mkdirFolderToken: '',
          logQR: false,
          puppeteerOptions: {
            headless: 'new' as any,
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-accelerated-2d-canvas',
              '--no-first-run',
              '--no-zygote',
              '--disable-gpu',
              '--disable-software-rasterizer',
              '--disable-extensions',
            ],
          },
        }
      );

      // Configurar listeners de mensagens
      this.setupMessageListeners();

      // Configurar listeners de ACK (confirmação de leitura/entrega)
      this.setupAckListeners();

      // Configurar listeners avançados (presença, digitando, chamadas, etc.)
      this.listeners = new WhatsAppListeners(this.client);
      this.listeners.setupAllListeners();
      this.listeners.setupPollListeners();
      this.listeners.setupDownloadListeners();
      this.listeners.setupSyncListeners();
      this.listeners.setupBatteryListeners();

      // ⭐ FASE 1: Configurar Phone Watchdog (monitoramento de conexão)
      this.setupPhoneWatchdog();

      logger.info('✅ WhatsApp Service (WPPConnect) inicializado!');
      this.isInitializing = false;

    } catch (error: any) {
      const errorMsg = error?.message || error?.toString() || String(error);

      logger.error('❌ Erro ao inicializar WhatsApp:', {
        error: errorMsg,
        stack: error?.stack,
      });

      this.isConnected = false;
      this.isInitializing = false;
    }
  }

  /**
   * Configurar listeners para mensagens recebidas
   */
  private setupMessageListeners(): void {
    if (!this.client) {
      logger.error('Cliente WhatsApp não inicializado');
      return;
    }

    // ✅ ARQUITETURA STATELESS: Listener apenas emite WebSocket (NÃO persiste)
    this.client.onMessage(async (message: Message) => {
      try {
        // Filtros de mensagens
        if (message.isGroupMsg || message.from === 'status@broadcast' || message.fromMe) {
          return;
        }

        logger.info(`📩 Nova mensagem de ${message.from}: ${message.body?.substring(0, 50) || '(mídia)'}...`);

        const normalizedPhone = message.from.replace('@c.us', '');

        // Verificar se tem bot ativo
        try {
          const { prisma } = await import('../config/database');

          const botSession = await prisma.whatsAppBotSession.findFirst({
            where: {
              phone: normalizedPhone.replace(/\D/g, ''),
              isActive: true,
              handedOffToHuman: false,
            },
          });

          if (botSession) {
            logger.info(`🤖 Roteando para bot - Sessão ${botSession.id}`);
            const { whatsappBotService } = await import('../modules/whatsapp-bot/whatsapp-bot.service');
            await whatsappBotService.processUserMessage(normalizedPhone.replace(/\D/g, ''), message.body);
            return;
          }
        } catch (error) {
          logger.error('Erro ao verificar bot:', error);
        }

        // ✅ STATELESS: Apenas emitir WebSocket (frontend busca do WPP on-demand)
        if (this.io) {
          this.io.sockets.emit('message:new', {
            from: message.from,
            phone: normalizedPhone,
            body: message.body || '',
            type: message.type,
            timestamp: new Date(message.timestamp * 1000),
            fromMe: false,
          });

          logger.info(`📡 WebSocket emitido para ${normalizedPhone}`);
        }

      } catch (error: any) {
        logger.error('Erro ao processar mensagem:', error);
      }
    });

    logger.info('✅ Listeners de mensagens configurados');
  }

  /**
   * ⭐ FASE 1: Configurar Phone Watchdog - Monitoramento ativo de conexão
   * Verifica status do telefone a cada 30 segundos
   */
  private setupPhoneWatchdog(): void {
    if (!this.client) {
      logger.error('❌ Cliente WhatsApp não inicializado para Phone Watchdog');
      return;
    }

    try {
      // Iniciar monitoramento a cada 30 segundos
      this.client.startPhoneWatchdog(30000);
      logger.info('✅ Phone Watchdog ativado (verificação a cada 30s)');
    } catch (error) {
      logger.error('❌ Erro ao iniciar Phone Watchdog:', error);
    }
  }

  /**
   * Configurar listeners para ACKs (confirmações de leitura/entrega)
   */
  private setupAckListeners(): void {
    if (!this.client) {
      logger.error('Cliente WhatsApp não inicializado');
      return;
    }

    // Listener para mudanças de status (ACK)
    this.client.onAck(async (ack: any) => {
      try {
        // Normalizar messageId (pode vir como objeto ou string)
        let messageId: string;
        if (typeof ack.id === 'string') {
          messageId = ack.id;
        } else if (ack.id?._serialized) {
          messageId = ack.id._serialized;
        } else if (typeof ack.id === 'object') {
          messageId = JSON.stringify(ack.id);
        } else {
          logger.warn('⚠️  ACK com ID inválido:', ack);
          return;
        }

        const ackCode = ack.ack;

        // ⭐ FASE 2: Mapeamento completo de ACK incluindo PLAYED (ACK 5)
        const statusName =
          ackCode === 0 ? 'CLOCK' :      // Pendente no relógio
          ackCode === 1 ? 'SENT' :       // Enviado (1 check)
          ackCode === 2 ? 'SENT' :       // Server recebeu
          ackCode === 3 ? 'DELIVERED' :  // Entregue (2 checks)
          ackCode === 4 ? 'READ' :       // Lido (2 checks azuis)
          ackCode === 5 ? 'PLAYED' :     // ⭐ Reproduzido (áudio/vídeo)
          'UNKNOWN';

        logger.info(`📨 ACK: ${messageId.substring(0, 20)}... -> ${statusName} (${ackCode})`);

        // Atualizar status da mensagem no banco (já emite WebSocket internamente)
        await whatsappChatService.updateMessageStatus(messageId, ackCode);

      } catch (error) {
        logger.error('Erro ao processar ACK:', error);
      }
    });

    // ⭐ FASE 1: Polling com controle de concorrência e timeout
    // Como o onAck pode não disparar para DELIVERED/READ, vamos fazer polling
    this.pollingInterval = setInterval(async () => {
      if (this.isPolling) {
        logger.warn('⚠️  Polling anterior ainda em execução, pulando iteração...');
        return;
      }

      this.isPolling = true;

      try {
        // Timeout de 8 segundos para evitar travamentos
        await Promise.race([
          this.checkRecentMessagesStatus(),
          new Promise<void>((_, reject) =>
            setTimeout(() => reject(new Error('Polling timeout')), 8000)
          )
        ]);
      } catch (error: any) {
        if (error.message === 'Polling timeout') {
          logger.error('⏱️  Polling timeout - operação demorou mais de 8s');
        } else {
          logger.error('❌ Erro no polling de status:', error);
        }
      } finally {
        this.isPolling = false;
      }
    }, 10000); // Verificar a cada 10 segundos

    logger.info('✅ Listeners de ACK configurados + polling de status ativado (com timeout)');
  }

  /**
   * ⭐ NOVO: Verificar status de mensagens recentes
   */
  private async checkRecentMessagesStatus(): Promise<void> {
    try {
      const { prisma } = await import('../config/database');

      // ⭐ FIX: Buscar mensagens enviadas nos últimos 5 minutos que ainda não foram lidas
      // INCLUINDO mensagens DELIVERED para detectar mudança para READ
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      const recentMessages = await prisma.whatsAppMessage.findMany({
        where: {
          fromMe: true,
          status: { in: ['PENDING', 'SENT', 'DELIVERED'] }, // ✅ DELIVERED incluído para detectar READ
          timestamp: { gte: fiveMinutesAgo },
          whatsappMessageId: { not: null },
        },
        take: 50, // Limitar para não sobrecarregar
      });

      if (recentMessages.length === 0) return;

      logger.debug(`🔍 Verificando status de ${recentMessages.length} mensagens recentes`);

      // Verificar status de cada mensagem no WhatsApp
      for (const msg of recentMessages) {
        try {
          if (!msg.whatsappMessageId || !this.client) continue;

          // Buscar status atualizado da mensagem via WPPConnect
          const messageStatus = await this.client.getMessageById(msg.whatsappMessageId);

          if (messageStatus && messageStatus.ack) {
            const currentAckCode = messageStatus.ack;

            // Mapear para nosso enum
            let newStatus: string | null = null;
            switch (currentAckCode) {
              case 3:
                if (msg.status !== 'DELIVERED' && msg.status !== 'READ') {
                  newStatus = 'DELIVERED';
                }
                break;
              case 4:
              case 5:
                if (msg.status !== 'READ') {
                  newStatus = 'READ';
                }
                break;
            }

            // Se o status mudou, atualizar BD e emitir WebSocket
            if (newStatus) {
              logger.info(`🔄 Polling: ${msg.id} -> ${newStatus} (ACK=${currentAckCode})`);
              await whatsappChatService.updateMessageStatus(msg.whatsappMessageId, currentAckCode);

              // CRÍTICO: Emitir WebSocket após polling atualizar
              // updateMessageStatus já emite WebSocket internamente, mas vamos garantir
            }
          }
        } catch (error) {
          // Silencioso - mensagem pode não existir mais no WhatsApp
        }
      }
    } catch (error) {
      logger.error('Erro no polling de status:', error);
    }
  }

  /**
   * Obter QR Code em base64
   * @returns QR Code em formato data:image/png;base64 ou null
   */
  getQRCode(): string | null {
    return this.qrCode;
  }

  /**
   * Verificar se está conectado
   * @returns true se conectado
   */
  isWhatsAppConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Obter informações da conta conectada
   */
  async getAccountInfo(): Promise<any> {
    if (!this.client || !this.isConnected) {
      throw new Error('WhatsApp não conectado');
    }

    try {
      // Tentar obter informações do dispositivo
      const hostDevice: any = await this.client.getHostDevice().catch(() => null);

      // Se getHostDevice falhar, tentar alternativas
      if (hostDevice) {
        return {
          phone: hostDevice?.id?.user || hostDevice?.wid?.user || 'Desconhecido',
          name: hostDevice?.pushname || 'WhatsApp Business',
          platform: 'WPPConnect',
          connected: true,
        };
      }

      // Fallback: retornar informações básicas
      return {
        phone: 'Conectado',
        name: 'WhatsApp Business',
        platform: 'WPPConnect',
        connected: true,
      };
    } catch (error) {
      logger.error('Erro ao obter informações da conta:', error);

      // Retornar informações mínimas mesmo em caso de erro
      return {
        phone: 'Conectado',
        name: 'WhatsApp Business',
        platform: 'WPPConnect',
        connected: this.isConnected,
      };
    }
  }

  /**
   * ⭐ FASE 1: Enviar mensagem de texto com validações e retry
   * @param to Número do destinatário (com código do país, ex: 5511999999999)
   * @param message Mensagem a ser enviada
   */
  async sendTextMessage(to: string, message: string): Promise<void> {
    // Validações iniciais
    if (!this.client) {
      throw new Error('Cliente WhatsApp não inicializado. Reinicie o serviço.');
    }

    if (!this.isConnected) {
      throw new Error('WhatsApp não conectado. Escaneie o QR Code primeiro.');
    }

    if (!message || typeof message !== 'string' || message.trim() === '') {
      throw new Error('Mensagem vazia não pode ser enviada');
    }

    const timestamp = new Date().toISOString();
    const toMasked = to.substring(0, 8) + '***';

    // Log estruturado
    logger.info('📨 Enviando mensagem de texto', {
      to: toMasked,
      messageLength: message.length,
      timestamp,
      sessionActive: this.isConnected,
      clientInitialized: !!this.client,
    });

    // Usar retry logic
    await this.sendWithRetry(async () => {
      try {
        // Formatar número para o padrão do WhatsApp (com validação)
        const formattedNumber = this.formatPhoneNumber(to);

        // Enviar mensagem via WPPConnect
        const result = await this.client!.sendText(formattedNumber, message);

        logger.info(`✅ Mensagem enviada com sucesso`, {
          to: toMasked,
          messageId: result.id?._serialized || result.id,
          timestamp: new Date().toISOString(),
        });

        // ✅ CRÍTICO: Extrair número limpo do ID retornado pelo WhatsApp para garantir consistência
        // O WhatsApp retorna IDs no formato: true_5511999999999@c.us_MESSAGEID ou 5511999999999@c.us
        let phoneFromResult = formattedNumber.replace('@c.us', '');
        if (result.id?._serialized) {
          const parts = result.id._serialized.split('@')[0].split('_');
          // Pegar a última parte que contém o número (ignora 'true' e outros prefixos)
          phoneFromResult = parts[parts.length - 1];
        }

        // Salvar mensagem enviada no banco (estratégia híbrida)
        await whatsappChatService.saveOutgoingMessage({
          to: phoneFromResult, // ✅ Usar número do WhatsApp, não o número original
          content: message,
          whatsappMessageId: result.id || `${Date.now()}_${to}`,
          timestamp: new Date(),
        });

      } catch (error: any) {
        logger.error('❌ Erro ao enviar mensagem', {
          error: error.message,
          stack: error.stack,
          to: toMasked,
          attemptedAt: new Date().toISOString(),
          wasConnected: this.isConnected,
        });
        throw error;
      }
    });
  }

  /**
   * ⭐ FASE 1: Enviar imagem com validações e retry
   * @param to Número de destino
   * @param imageUrl URL da imagem
   * @param caption Legenda opcional
   * @returns ID da mensagem no WhatsApp
   */
  async sendImage(to: string, imageUrl: string, caption?: string): Promise<string | undefined> {
    // Validações iniciais
    if (!this.client) {
      throw new Error('Cliente WhatsApp não inicializado. Reinicie o serviço.');
    }

    if (!this.isConnected) {
      throw new Error('WhatsApp não conectado. Escaneie o QR Code primeiro.');
    }

    if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
      throw new Error('URL da imagem inválida');
    }

    const toMasked = to.substring(0, 8) + '***';

    logger.info('🖼️ Enviando imagem', {
      to: toMasked,
      imageUrl: imageUrl.substring(0, 50) + '...',
      hasCaption: !!caption,
      timestamp: new Date().toISOString(),
    });

    return await this.sendWithRetry(async () => {
      try {
        const formattedNumber = this.formatPhoneNumber(to);

        // Enviar imagem via WPPConnect
        const result = await this.client!.sendImage(
          formattedNumber,
          imageUrl,
          'image',
          caption || ''
        );

        logger.info(`✅ Imagem enviada com sucesso`, {
          to: toMasked,
          messageId: result.id,
        });

        return result.id;

      } catch (error: any) {
        logger.error('❌ Erro ao enviar imagem', {
          error: error.message,
          to: toMasked,
          imageUrl: imageUrl.substring(0, 50) + '...',
        });
        throw error;
      }
    });
  }

  /**
   * ⭐ FASE 1: Enviar vídeo com validações e retry
   * @param to Número de destino
   * @param videoUrl URL do vídeo
   * @param caption Legenda opcional
   * @returns ID da mensagem no WhatsApp
   */
  async sendVideo(to: string, videoUrl: string, caption?: string): Promise<string | undefined> {
    // Validações iniciais
    if (!this.client) {
      throw new Error('Cliente WhatsApp não inicializado. Reinicie o serviço.');
    }

    if (!this.isConnected) {
      throw new Error('WhatsApp não conectado. Escaneie o QR Code primeiro.');
    }

    if (!videoUrl || typeof videoUrl !== 'string' || videoUrl.trim() === '') {
      throw new Error('URL do vídeo inválida');
    }

    const toMasked = to.substring(0, 8) + '***';

    logger.info('🎥 Enviando vídeo', {
      to: toMasked,
      videoUrl: videoUrl.substring(0, 50) + '...',
      hasCaption: !!caption,
      timestamp: new Date().toISOString(),
    });

    return await this.sendWithRetry(async () => {
      try {
        const formattedNumber = this.formatPhoneNumber(to);

        // Enviar vídeo via WPPConnect
        const result = await this.client!.sendVideoAsGif(
          formattedNumber,
          videoUrl,
          'video.mp4',
          caption || ''
        );

        logger.info(`✅ Vídeo enviado com sucesso`, {
          to: toMasked,
          messageId: result.id,
        });

        return result.id;

      } catch (error: any) {
        logger.error('❌ Erro ao enviar vídeo', {
          error: error.message,
          to: toMasked,
          videoUrl: videoUrl.substring(0, 50) + '...',
        });
        throw error;
      }
    });
  }

  /**
   * ⭐ FASE 2: Enviar áudio (Push-to-Talk)
   * @param to Número de destino
   * @param audioPath Caminho ou URL do arquivo de áudio
   * @param caption Legenda opcional
   * @returns ID da mensagem no WhatsApp
   */
  async sendAudio(to: string, audioPath: string, caption?: string): Promise<string | undefined> {
    // Validações iniciais
    if (!this.client) {
      throw new Error('Cliente WhatsApp não inicializado. Reinicie o serviço.');
    }

    if (!this.isConnected) {
      throw new Error('WhatsApp não conectado. Escaneie o QR Code primeiro.');
    }

    if (!audioPath || typeof audioPath !== 'string' || audioPath.trim() === '') {
      throw new Error('Caminho do áudio inválido');
    }

    const toMasked = to.substring(0, 8) + '***';

    logger.info('🎤 Enviando áudio (PTT)', {
      to: toMasked,
      audioPath: audioPath.substring(0, 50) + '...',
      hasCaption: !!caption,
      timestamp: new Date().toISOString(),
    });

    return await this.sendWithRetry(async () => {
      try {
        const formattedNumber = this.formatPhoneNumber(to);

        // Enviar áudio como PTT (Push-to-Talk) via WPPConnect
        const result = await this.client!.sendPtt(formattedNumber, audioPath);

        logger.info(`✅ Áudio enviado com sucesso`, {
          to: toMasked,
          messageId: result.id,
        });

        return result.id;

      } catch (error: any) {
        logger.error('❌ Erro ao enviar áudio', {
          error: error.message,
          to: toMasked,
          audioPath: audioPath.substring(0, 50) + '...',
        });
        throw error;
      }
    });
  }

  /**
   * ⭐ FASE 2: Enviar reação a uma mensagem
   * @param messageId ID da mensagem (serialized)
   * @param emoji Emoji da reação (ou false para remover)
   * @returns Resultado da operação
   */
  async sendReaction(messageId: string, emoji: string | false): Promise<{ sendMsgResult: string }> {
    // Validações iniciais
    if (!this.client) {
      throw new Error('Cliente WhatsApp não inicializado. Reinicie o serviço.');
    }

    if (!this.isConnected) {
      throw new Error('WhatsApp não conectado. Escaneie o QR Code primeiro.');
    }

    if (!messageId || typeof messageId !== 'string' || messageId.trim() === '') {
      throw new Error('ID da mensagem inválido');
    }

    const action = emoji === false ? 'remover' : 'enviar';
    const emojiDisplay = emoji === false ? '(removendo)' : emoji;

    logger.info(`${emoji === false ? '🚫' : '👍'} ${action === 'remover' ? 'Removendo' : 'Enviando'} reação`, {
      messageId: messageId.substring(0, 20) + '...',
      emoji: emojiDisplay,
      timestamp: new Date().toISOString(),
    });

    return await this.sendWithRetry(async () => {
      try {
        // Enviar reação via WPPConnect
        const result = await this.client!.sendReactionToMessage(messageId, emoji);

        logger.info(`✅ Reação ${action === 'remover' ? 'removida' : 'enviada'} com sucesso`, {
          messageId: messageId.substring(0, 20) + '...',
          emoji: emojiDisplay,
        });

        return result;

      } catch (error: any) {
        logger.error(`❌ Erro ao ${action} reação`, {
          error: error.message,
          messageId: messageId.substring(0, 20) + '...',
          emoji: emojiDisplay,
        });
        throw error;
      }
    });
  }

  /**
   * ⭐ FASE 2: Marcar mensagem como lida
   * @param chatId ID do chat (ex: 5511999999999@c.us)
   * @returns void
   */
  async markAsRead(chatId: string): Promise<void> {
    // Validações iniciais
    if (!this.client) {
      throw new Error('Cliente WhatsApp não inicializado. Reinicie o serviço.');
    }

    if (!this.isConnected) {
      throw new Error('WhatsApp não conectado. Escaneie o QR Code primeiro.');
    }

    if (!chatId || typeof chatId !== 'string' || chatId.trim() === '') {
      throw new Error('ID do chat inválido');
    }

    logger.info('👁️ Marcando chat como lido', {
      chatId: chatId.substring(0, 20) + '...',
      timestamp: new Date().toISOString(),
    });

    await this.sendWithRetry(async () => {
      try {
        // Marcar como lido via WPPConnect
        await this.client!.sendSeen(chatId);

        logger.info(`✅ Chat marcado como lido`, {
          chatId: chatId.substring(0, 20) + '...',
        });

      } catch (error: any) {
        logger.error('❌ Erro ao marcar como lido', {
          error: error.message,
          chatId: chatId.substring(0, 20) + '...',
        });
        throw error;
      }
    });
  }

  /**
   * ⭐ FASE 2: Marcar chat como não lido
   * @param chatId ID do chat (ex: 5511999999999@c.us)
   * @returns void
   */
  async markAsUnread(chatId: string): Promise<void> {
    // Validações iniciais
    if (!this.client) {
      throw new Error('Cliente WhatsApp não inicializado. Reinicie o serviço.');
    }

    if (!this.isConnected) {
      throw new Error('WhatsApp não conectado. Escaneie o QR Code primeiro.');
    }

    if (!chatId || typeof chatId !== 'string' || chatId.trim() === '') {
      throw new Error('ID do chat inválido');
    }

    logger.info('👀 Marcando chat como não lido', {
      chatId: chatId.substring(0, 20) + '...',
      timestamp: new Date().toISOString(),
    });

    await this.sendWithRetry(async () => {
      try {
        // Marcar como não lido via WPPConnect
        await this.client!.markUnseenMessage(chatId);

        logger.info(`✅ Chat marcado como não lido`, {
          chatId: chatId.substring(0, 20) + '...',
        });

      } catch (error: any) {
        logger.error('❌ Erro ao marcar como não lido', {
          error: error.message,
          chatId: chatId.substring(0, 20) + '...',
        });
        throw error;
      }
    });
  }

  /**
   * ⭐ FASE 2: Deletar mensagem
   * @param chatId ID do chat
   * @param messageId ID da mensagem ou array de IDs
   * @param forEveryone Se true, deleta para todos; se false, deleta apenas localmente
   * @returns void
   */
  async deleteMessage(
    chatId: string,
    messageId: string | string[],
    forEveryone: boolean = false
  ): Promise<void> {
    // Validações iniciais
    if (!this.client) {
      throw new Error('Cliente WhatsApp não inicializado. Reinicie o serviço.');
    }

    if (!this.isConnected) {
      throw new Error('WhatsApp não conectado. Escaneie o QR Code primeiro.');
    }

    if (!chatId || typeof chatId !== 'string' || chatId.trim() === '') {
      throw new Error('ID do chat inválido');
    }

    if (!messageId) {
      throw new Error('ID da mensagem inválido');
    }

    const messageIds = Array.isArray(messageId) ? messageId : [messageId];
    const scope = forEveryone ? 'para todos' : 'localmente';

    logger.info(`🗑️ Deletando mensagem ${scope}`, {
      chatId: chatId.substring(0, 20) + '...',
      messageCount: messageIds.length,
      forEveryone,
      timestamp: new Date().toISOString(),
    });

    await this.sendWithRetry(async () => {
      try {
        // Deletar mensagem via WPPConnect
        await this.client!.deleteMessage(chatId, messageIds, forEveryone);

        logger.info(`✅ Mensagem deletada ${scope}`, {
          chatId: chatId.substring(0, 20) + '...',
          messageCount: messageIds.length,
        });

      } catch (error: any) {
        logger.error(`❌ Erro ao deletar mensagem ${scope}`, {
          error: error.message,
          chatId: chatId.substring(0, 20) + '...',
          messageCount: messageIds.length,
        });
        throw error;
      }
    });
  }

  /**
   * ⭐ FASE 3: Enviar arquivo genérico (documento, PDF, etc.)
   * @param to Número de destino
   * @param filePath Caminho ou URL do arquivo
   * @param filename Nome do arquivo a ser exibido
   * @param caption Legenda opcional
   * @returns ID da mensagem no WhatsApp
   */
  async sendFile(
    to: string,
    filePath: string,
    filename?: string,
    caption?: string
  ): Promise<string | undefined> {
    // Validações iniciais
    if (!this.client) {
      throw new Error('Cliente WhatsApp não inicializado. Reinicie o serviço.');
    }

    if (!this.isConnected) {
      throw new Error('WhatsApp não conectado. Escaneie o QR Code primeiro.');
    }

    if (!filePath || typeof filePath !== 'string' || filePath.trim() === '') {
      throw new Error('Caminho do arquivo inválido');
    }

    const toMasked = to.substring(0, 8) + '***';
    const displayFilename = filename || 'documento';

    logger.info('📎 Enviando arquivo', {
      to: toMasked,
      filePath: filePath.substring(0, 50) + '...',
      filename: displayFilename,
      hasCaption: !!caption,
      timestamp: new Date().toISOString(),
    });

    return await this.sendWithRetry(async () => {
      try {
        const formattedNumber = this.formatPhoneNumber(to);

        // Enviar arquivo via WPPConnect
        const result = await this.client!.sendFile(
          formattedNumber,
          filePath,
          displayFilename,
          caption || ''
        );

        logger.info(`✅ Arquivo enviado com sucesso`, {
          to: toMasked,
          filename: displayFilename,
          messageId: result.id,
        });

        return result.id;

      } catch (error: any) {
        logger.error('❌ Erro ao enviar arquivo', {
          error: error.message,
          to: toMasked,
          filePath: filePath.substring(0, 50) + '...',
          filename: displayFilename,
        });
        throw error;
      }
    });
  }

  /**
   * ⭐ FASE 3: Enviar localização
   * @param to Número de destino
   * @param latitude Latitude
   * @param longitude Longitude
   * @param name Nome do local (opcional)
   * @returns ID da mensagem no WhatsApp
   */
  async sendLocation(
    to: string,
    latitude: number,
    longitude: number,
    name?: string
  ): Promise<string | undefined> {
    // Validações iniciais
    if (!this.client) {
      throw new Error('Cliente WhatsApp não inicializado. Reinicie o serviço.');
    }

    if (!this.isConnected) {
      throw new Error('WhatsApp não conectado. Escaneie o QR Code primeiro.');
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new Error('Latitude e longitude devem ser números');
    }

    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude inválida. Deve estar entre -90 e 90');
    }

    if (longitude < -180 || longitude > 180) {
      throw new Error('Longitude inválida. Deve estar entre -180 e 180');
    }

    const toMasked = to.substring(0, 8) + '***';
    const locationName = name || 'Localização';

    logger.info('📍 Enviando localização', {
      to: toMasked,
      latitude,
      longitude,
      name: locationName,
      timestamp: new Date().toISOString(),
    });

    return await this.sendWithRetry(async () => {
      try {
        const formattedNumber = this.formatPhoneNumber(to);

        // Enviar localização via WPPConnect
        const result = await this.client!.sendLocation(
          formattedNumber,
          latitude,
          longitude,
          locationName
        );

        logger.info(`✅ Localização enviada com sucesso`, {
          to: toMasked,
          latitude,
          longitude,
          messageId: result.id,
        });

        return result.id;

      } catch (error: any) {
        logger.error('❌ Erro ao enviar localização', {
          error: error.message,
          to: toMasked,
          latitude,
          longitude,
        });
        throw error;
      }
    });
  }

  /**
   * ⭐ FASE 3: Enviar contato vCard
   * @param to Número de destino
   * @param contactId ID do contato no formato WhatsApp (ex: 5511999999999@c.us)
   * @param name Nome do contato
   * @returns ID da mensagem no WhatsApp
   */
  async sendContactVcard(
    to: string,
    contactId: string,
    name?: string
  ): Promise<string | undefined> {
    // Validações iniciais
    if (!this.client) {
      throw new Error('Cliente WhatsApp não inicializado. Reinicie o serviço.');
    }

    if (!this.isConnected) {
      throw new Error('WhatsApp não conectado. Escaneie o QR Code primeiro.');
    }

    if (!contactId || typeof contactId !== 'string' || contactId.trim() === '') {
      throw new Error('ID do contato inválido');
    }

    const toMasked = to.substring(0, 8) + '***';
    const contactName = name || 'Contato';

    logger.info('👤 Enviando contato vCard', {
      to: toMasked,
      contactId: contactId.substring(0, 15) + '...',
      name: contactName,
      timestamp: new Date().toISOString(),
    });

    return await this.sendWithRetry(async () => {
      try {
        const formattedNumber = this.formatPhoneNumber(to);

        // Enviar vCard via WPPConnect
        const result = await this.client!.sendContactVcard(
          formattedNumber,
          contactId,
          contactName
        );

        logger.info(`✅ Contato vCard enviado com sucesso`, {
          to: toMasked,
          contactName,
          messageId: result.id,
        });

        return result.id;

      } catch (error: any) {
        logger.error('❌ Erro ao enviar contato vCard', {
          error: error.message,
          to: toMasked,
          contactId: contactId.substring(0, 15) + '...',
        });
        throw error;
      }
    });
  }

  /**
   * ⭐ FASE 3: Estrelar mensagem
   * @param messageId ID da mensagem
   * @param star Se true, estrela; se false, remove estrela
   * @returns void
   */
  async starMessage(messageId: string, star: boolean = true): Promise<void> {
    // Validações iniciais
    if (!this.client) {
      throw new Error('Cliente WhatsApp não inicializado. Reinicie o serviço.');
    }

    if (!this.isConnected) {
      throw new Error('WhatsApp não conectado. Escaneie o QR Code primeiro.');
    }

    if (!messageId || typeof messageId !== 'string' || messageId.trim() === '') {
      throw new Error('ID da mensagem inválido');
    }

    const action = star ? 'estrelando' : 'removendo estrela';

    logger.info(`⭐ ${star ? 'Estrelando' : 'Removendo estrela de'} mensagem`, {
      messageId: messageId.substring(0, 20) + '...',
      star,
      timestamp: new Date().toISOString(),
    });

    await this.sendWithRetry(async () => {
      try {
        // Estrelar/desestrelar mensagem via WPPConnect
        await this.client!.starMessage(messageId, star);

        logger.info(`✅ Mensagem ${star ? 'estrelada' : 'não estrelada'} com sucesso`, {
          messageId: messageId.substring(0, 20) + '...',
          star,
        });

      } catch (error: any) {
        logger.error(`❌ Erro ao ${action} mensagem`, {
          error: error.message,
          messageId: messageId.substring(0, 20) + '...',
        });
        throw error;
      }
    });
  }

  /**
   * ⭐ FASE 3: Obter mensagens estreladas
   * @returns Array de mensagens estreladas
   */
  async getStarredMessages(): Promise<any[]> {
    // Validações iniciais
    if (!this.client) {
      throw new Error('Cliente WhatsApp não inicializado. Reinicie o serviço.');
    }

    if (!this.isConnected) {
      throw new Error('WhatsApp não conectado. Escaneie o QR Code primeiro.');
    }

    logger.info('⭐ Buscando mensagens estreladas', {
      timestamp: new Date().toISOString(),
    });

    return await this.sendWithRetry(async () => {
      try {
        // Obter mensagens estreladas via WPPConnect
        const starredMessages = await this.client!.getStarredMessages();

        logger.info(`✅ ${starredMessages.length} mensagens estreladas encontradas`);

        return starredMessages;

      } catch (error: any) {
        logger.error('❌ Erro ao buscar mensagens estreladas', {
          error: error.message,
        });
        throw error;
      }
    });
  }

  /**
   * ⭐ FASE 3: Arquivar conversa
   * @param chatId ID do chat
   * @param archive Se true, arquiva; se false, desarquiva
   * @returns void
   */
  async archiveChat(chatId: string, archive: boolean = true): Promise<void> {
    // Validações iniciais
    if (!this.client) {
      throw new Error('Cliente WhatsApp não inicializado. Reinicie o serviço.');
    }

    if (!this.isConnected) {
      throw new Error('WhatsApp não conectado. Escaneie o QR Code primeiro.');
    }

    if (!chatId || typeof chatId !== 'string' || chatId.trim() === '') {
      throw new Error('ID do chat inválido');
    }

    const action = archive ? 'arquivando' : 'desarquivando';

    logger.info(`📦 ${archive ? 'Arquivando' : 'Desarquivando'} conversa`, {
      chatId: chatId.substring(0, 20) + '...',
      archive,
      timestamp: new Date().toISOString(),
    });

    await this.sendWithRetry(async () => {
      try {
        // Arquivar/desarquivar chat via WPPConnect
        await this.client!.archiveChat(chatId, archive);

        logger.info(`✅ Conversa ${archive ? 'arquivada' : 'desarquivada'} com sucesso`, {
          chatId: chatId.substring(0, 20) + '...',
          archive,
        });

      } catch (error: any) {
        logger.error(`❌ Erro ao ${action} conversa`, {
          error: error.message,
          chatId: chatId.substring(0, 20) + '...',
        });
        throw error;
      }
    });
  }

  /**
   * ⭐ FASE 1: Retry Logic com Exponential Backoff
   * @param fn Função assíncrona a ser executada
   * @param retries Número de tentativas (padrão: 3)
   * @param delay Delay inicial em ms (padrão: 2000ms)
   * @returns Resultado da função
   */
  private async sendWithRetry<T>(
    fn: () => Promise<T>,
    retries: number = 3,
    delay: number = 2000
  ): Promise<T> {
    let lastError: any;

    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;

        // Não fazer retry em erros permanentes
        const errorMsg = error?.message || '';
        const isPermanentError =
          errorMsg.includes('não conectado') ||
          errorMsg.includes('não inicializado') ||
          errorMsg.includes('inválido');

        if (isPermanentError) {
          logger.error('❌ Erro permanente detectado, abortando retry:', errorMsg);
          throw error;
        }

        if (i < retries - 1) {
          logger.warn(`⚠️  Tentativa ${i + 1}/${retries} falhou. Retrying em ${delay}ms...`, {
            error: errorMsg,
          });
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        }
      }
    }

    logger.error(`❌ Todas as ${retries} tentativas falharam`);
    throw lastError;
  }

  // ==========================================
  // FASE C: FUNCIONALIDADES AUSENTES
  // ==========================================

  /**
   * ⭐ FASE C: Download de mídia de uma mensagem
   * @param messageId ID da mensagem
   * @returns Buffer do arquivo
   */
  async downloadMedia(messageId: string): Promise<Buffer> {
    logger.info(`📥 Baixando mídia da mensagem: ${messageId}`);

    if (!this.client) {
      throw new Error('Cliente WhatsApp não inicializado');
    }

    if (!this.isConnected) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      // Baixar mídia usando WPPConnect
      const mediaData = await this.client.decryptFile(messageId);
      logger.info(`✅ Mídia baixada com sucesso: ${messageId}`);
      return Buffer.from(mediaData);
    } catch (error: any) {
      logger.error(`❌ Erro ao baixar mídia: ${messageId}`, error);
      throw new Error(`Erro ao baixar mídia: ${error.message}`);
    }
  }

  /**
   * ⭐ FASE C: Encaminhar mensagem
   * @param messageId ID da mensagem a encaminhar
   * @param to Destinatário(s) - string ou array
   */
  async forwardMessage(messageId: string, to: string | string[]): Promise<void> {
    logger.info(`📨 Encaminhando mensagem ${messageId} para:`, to);

    if (!this.client) {
      throw new Error('Cliente WhatsApp não inicializado');
    }

    if (!this.isConnected) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      const recipients = Array.isArray(to) ? to : [to];

      for (const recipient of recipients) {
        const formattedNumber = this.formatPhoneNumber(recipient);
        await this.client.forwardMessages(formattedNumber, [messageId], false);
        logger.info(`✅ Mensagem encaminhada para: ${formattedNumber}`);
      }
    } catch (error: any) {
      logger.error(`❌ Erro ao encaminhar mensagem: ${messageId}`, error);
      throw new Error(`Erro ao encaminhar mensagem: ${error.message}`);
    }
  }

  /**
   * ⭐ FASE C: Fixar/Desafixar chat
   * @param chatId ID do chat
   * @param pin true para fixar, false para desafixar
   */
  async pinChat(chatId: string, pin: boolean = true): Promise<void> {
    logger.info(`📌 ${pin ? 'Fixando' : 'Desfixando'} chat: ${chatId}`);

    if (!this.client) {
      throw new Error('Cliente WhatsApp não inicializado');
    }

    if (!this.isConnected) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      await this.client.pinChat(chatId, pin);
      logger.info(`✅ Chat ${pin ? 'fixado' : 'desfixado'}: ${chatId}`);
    } catch (error: any) {
      logger.error(`❌ Erro ao ${pin ? 'fixar' : 'desfixar'} chat: ${chatId}`, error);
      throw new Error(`Erro ao ${pin ? 'fixar' : 'desfixar'} chat: ${error.message}`);
    }
  }

  /**
   * ⭐ FASE C: Listar todos os contatos
   * @returns Lista de contatos
   */
  async getContacts(): Promise<any[]> {
    logger.info('📇 Listando contatos do WhatsApp');

    if (!this.client) {
      throw new Error('Cliente WhatsApp não inicializado');
    }

    if (!this.isConnected) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      const contacts = await this.client.getAllContacts();
      logger.info(`✅ ${contacts.length} contatos recuperados`);
      return contacts;
    } catch (error: any) {
      logger.error('❌ Erro ao listar contatos:', error);
      throw new Error(`Erro ao listar contatos: ${error.message}`);
    }
  }

  /**
   * ⭐ FASE C: Verificar se número(s) está(ão) no WhatsApp
   * @param phoneNumbers Número ou array de números
   * @returns Array com status de cada número
   */
  async checkNumbersOnWhatsApp(phoneNumbers: string | string[]): Promise<any[]> {
    logger.info('🔍 Verificando números no WhatsApp:', phoneNumbers);

    if (!this.client) {
      throw new Error('Cliente WhatsApp não inicializado');
    }

    if (!this.isConnected) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      const numbers = Array.isArray(phoneNumbers) ? phoneNumbers : [phoneNumbers];
      const results = [];

      for (const phoneNumber of numbers) {
        try {
          const formatted = this.formatPhoneNumber(phoneNumber);
          const numberExists = await this.client.checkNumberStatus(formatted);

          results.push({
            phoneNumber,
            formatted,
            exists: numberExists.numberExists || false,
            status: numberExists,
          });

          logger.info(`✅ ${phoneNumber} → ${numberExists.numberExists ? 'EXISTE' : 'NÃO EXISTE'}`);
        } catch (error: any) {
          results.push({
            phoneNumber,
            exists: false,
            error: error.message,
          });
          logger.warn(`⚠️  Erro ao verificar ${phoneNumber}: ${error.message}`);
        }
      }

      return results;
    } catch (error: any) {
      logger.error('❌ Erro ao verificar números:', error);
      throw new Error(`Erro ao verificar números: ${error.message}`);
    }
  }

  /**
   * ⭐ FASE C: Criar grupo
   * @param name Nome do grupo
   * @param participants Array de números dos participantes
   * @returns Informações do grupo criado
   */
  async createGroup(name: string, participants: string[]): Promise<any> {
    logger.info(`👥 Criando grupo: ${name} com ${participants.length} participantes`);

    if (!this.client) {
      throw new Error('Cliente WhatsApp não inicializado');
    }

    if (!this.isConnected) {
      throw new Error('WhatsApp não está conectado');
    }

    if (!name || name.trim() === '') {
      throw new Error('Nome do grupo não pode ser vazio');
    }

    if (!participants || participants.length === 0) {
      throw new Error('É necessário pelo menos 1 participante');
    }

    try {
      // Formatar números dos participantes
      const formattedParticipants = participants.map(p => this.formatPhoneNumber(p));

      // Criar grupo
      const group = await this.client.createGroup(name, formattedParticipants);

      logger.info(`✅ Grupo criado: ${name} (ID: ${group.gid})`);
      return group;
    } catch (error: any) {
      logger.error(`❌ Erro ao criar grupo: ${name}`, error);
      throw new Error(`Erro ao criar grupo: ${error.message}`);
    }
  }

  // ==========================================
  // FASE D: FUNCIONALIDADES AVANÇADAS
  // ==========================================

  /**
   * ⭐ FASE D: Enviar mensagem de lista interativa
   * @param to Número do destinatário
   * @param title Título da lista
   * @param description Descrição
   * @param buttonText Texto do botão
   * @param sections Seções da lista com opções
   */
  async sendList(
    to: string,
    title: string,
    description: string,
    buttonText: string,
    sections: Array<{ title: string; rows: Array<{ title: string; description?: string; rowId: string }> }>
  ): Promise<string | undefined> {
    logger.info(`📋 Enviando lista interativa para: ${to}`);

    if (!this.client) {
      throw new Error('Cliente WhatsApp não inicializado');
    }

    if (!this.isConnected) {
      throw new Error('WhatsApp não está conectado');
    }

    const formattedNumber = this.formatPhoneNumber(to);

    return this.sendWithRetry(async () => {
      try {
        const result = await this.client!.sendListMessage(formattedNumber, {
          buttonText,
          description,
          title,
          sections,
        });

        logger.info(`✅ Lista enviada para ${formattedNumber}`);
        return result.id;
      } catch (error: any) {
        logger.error(`❌ Erro ao enviar lista para ${formattedNumber}:`, error);
        throw error;
      }
    });
  }

  /**
   * ⭐ FASE D: Enviar mensagem com botões de resposta
   * @param to Número do destinatário
   * @param message Texto da mensagem
   * @param buttons Array de botões (máx 3)
   */
  async sendButtons(
    to: string,
    message: string,
    buttons: Array<{ buttonText: string; buttonId: string }>
  ): Promise<string | undefined> {
    logger.info(`🔘 Enviando mensagem com botões para: ${to}`);

    if (!this.client) {
      throw new Error('Cliente WhatsApp não inicializado');
    }

    if (!this.isConnected) {
      throw new Error('WhatsApp não está conectado');
    }

    if (buttons.length > 3) {
      throw new Error('WhatsApp permite no máximo 3 botões');
    }

    const formattedNumber = this.formatPhoneNumber(to);

    return this.sendWithRetry(async () => {
      try {
        const result = await this.client!.sendButtons(formattedNumber, message, buttons);

        logger.info(`✅ Mensagem com botões enviada para ${formattedNumber}`);
        return result.id;
      } catch (error: any) {
        logger.error(`❌ Erro ao enviar botões para ${formattedNumber}:`, error);
        throw error;
      }
    });
  }

  /**
   * ⭐ FASE D: Enviar enquete (poll)
   * @param to Número do destinatário
   * @param name Título da enquete
   * @param options Array de opções (2-12 opções)
   */
  async sendPoll(
    to: string,
    name: string,
    options: string[]
  ): Promise<string | undefined> {
    logger.info(`📊 Enviando enquete para: ${to}`);

    if (!this.client) {
      throw new Error('Cliente WhatsApp não inicializado');
    }

    if (!this.isConnected) {
      throw new Error('WhatsApp não está conectado');
    }

    if (options.length < 2 || options.length > 12) {
      throw new Error('Enquetes devem ter entre 2 e 12 opções');
    }

    const formattedNumber = this.formatPhoneNumber(to);

    return this.sendWithRetry(async () => {
      try {
        const result = await this.client!.sendPollMessage(formattedNumber, name, options);

        logger.info(`✅ Enquete enviada para ${formattedNumber}`);
        return result.id;
      } catch (error: any) {
        logger.error(`❌ Erro ao enviar enquete para ${formattedNumber}:`, error);
        throw error;
      }
    });
  }

  /**
   * ⭐ FASE D: Adicionar participante ao grupo
   * @param groupId ID do grupo
   * @param participantNumber Número do participante
   */
  async addParticipantToGroup(groupId: string, participantNumber: string): Promise<void> {
    logger.info(`👤 Adicionando participante ${participantNumber} ao grupo ${groupId}`);

    if (!this.client) {
      throw new Error('Cliente WhatsApp não inicializado');
    }

    if (!this.isConnected) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      const formattedNumber = this.formatPhoneNumber(participantNumber);
      await this.client.addParticipant(groupId, [formattedNumber]);

      logger.info(`✅ Participante adicionado: ${formattedNumber}`);
    } catch (error: any) {
      logger.error(`❌ Erro ao adicionar participante:`, error);
      throw new Error(`Erro ao adicionar participante: ${error.message}`);
    }
  }

  /**
   * ⭐ FASE D: Remover participante do grupo
   * @param groupId ID do grupo
   * @param participantNumber Número do participante
   */
  async removeParticipantFromGroup(groupId: string, participantNumber: string): Promise<void> {
    logger.info(`👤 Removendo participante ${participantNumber} do grupo ${groupId}`);

    if (!this.client) {
      throw new Error('Cliente WhatsApp não inicializado');
    }

    if (!this.isConnected) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      const formattedNumber = this.formatPhoneNumber(participantNumber);
      await this.client.removeParticipant(groupId, [formattedNumber]);

      logger.info(`✅ Participante removido: ${formattedNumber}`);
    } catch (error: any) {
      logger.error(`❌ Erro ao remover participante:`, error);
      throw new Error(`Erro ao remover participante: ${error.message}`);
    }
  }

  /**
   * ⭐ FASE D: Alterar descrição do grupo
   * @param groupId ID do grupo
   * @param description Nova descrição
   */
  async setGroupDescription(groupId: string, description: string): Promise<void> {
    logger.info(`📝 Alterando descrição do grupo ${groupId}`);

    if (!this.client) {
      throw new Error('Cliente WhatsApp não inicializado');
    }

    if (!this.isConnected) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      await this.client.setGroupDescription(groupId, description);
      logger.info(`✅ Descrição do grupo atualizada`);
    } catch (error: any) {
      logger.error(`❌ Erro ao alterar descrição:`, error);
      throw new Error(`Erro ao alterar descrição: ${error.message}`);
    }
  }

  /**
   * ⭐ FASE D: Alterar assunto/nome do grupo
   * @param groupId ID do grupo
   * @param subject Novo nome
   */
  async setGroupSubject(groupId: string, subject: string): Promise<void> {
    logger.info(`📝 Alterando nome do grupo ${groupId} para: ${subject}`);

    if (!this.client) {
      throw new Error('Cliente WhatsApp não inicializado');
    }

    if (!this.isConnected) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      await this.client.setGroupSubject(groupId, subject);
      logger.info(`✅ Nome do grupo atualizado`);
    } catch (error: any) {
      logger.error(`❌ Erro ao alterar nome:`, error);
      throw new Error(`Erro ao alterar nome: ${error.message}`);
    }
  }

  /**
   * ⭐ FASE D: Promover participante a admin
   * @param groupId ID do grupo
   * @param participantNumber Número do participante
   */
  async promoteParticipantToAdmin(groupId: string, participantNumber: string): Promise<void> {
    logger.info(`👑 Promovendo ${participantNumber} a admin no grupo ${groupId}`);

    if (!this.client) {
      throw new Error('Cliente WhatsApp não inicializado');
    }

    if (!this.isConnected) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      const formattedNumber = this.formatPhoneNumber(participantNumber);
      await this.client.promoteParticipant(groupId, [formattedNumber]);

      logger.info(`✅ Participante promovido a admin`);
    } catch (error: any) {
      logger.error(`❌ Erro ao promover participante:`, error);
      throw new Error(`Erro ao promover participante: ${error.message}`);
    }
  }

  /**
   * ⭐ FASE D: Remover admin de participante
   * @param groupId ID do grupo
   * @param participantNumber Número do participante
   */
  async demoteParticipantFromAdmin(groupId: string, participantNumber: string): Promise<void> {
    logger.info(`👤 Removendo admin de ${participantNumber} no grupo ${groupId}`);

    if (!this.client) {
      throw new Error('Cliente WhatsApp não inicializado');
    }

    if (!this.isConnected) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      const formattedNumber = this.formatPhoneNumber(participantNumber);
      await this.client.demoteParticipant(groupId, [formattedNumber]);

      logger.info(`✅ Admin removido do participante`);
    } catch (error: any) {
      logger.error(`❌ Erro ao remover admin:`, error);
      throw new Error(`Erro ao remover admin: ${error.message}`);
    }
  }

  /**
   * ⭐ FASE D: Listar participantes do grupo
   * @param groupId ID do grupo
   */
  async getGroupParticipants(groupId: string): Promise<any[]> {
    logger.info(`👥 Listando participantes do grupo ${groupId}`);

    if (!this.client) {
      throw new Error('Cliente WhatsApp não inicializado');
    }

    if (!this.isConnected) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      const metadata = await this.client.getGroupMetadata(groupId);
      logger.info(`✅ ${metadata.participants.length} participantes recuperados`);
      return metadata.participants;
    } catch (error: any) {
      logger.error(`❌ Erro ao listar participantes:`, error);
      throw new Error(`Erro ao listar participantes: ${error.message}`);
    }
  }

  /**
   * ⭐ FASE 1: Formatar e validar número de telefone
   * @param phoneNumber Número de telefone
   * @returns Número formatado (ex: 5511999999999@c.us)
   * @throws Error se número inválido
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Validar entrada não vazia
    if (!phoneNumber || typeof phoneNumber !== 'string' || phoneNumber.trim() === '') {
      throw new Error('Número de telefone vazio ou inválido');
    }

    // Remover todos os caracteres não numéricos
    let cleaned = phoneNumber.replace(/\D/g, '');

    // Validações de comprimento
    if (cleaned.length < 10) {
      throw new Error(`Número muito curto: ${phoneNumber}. Mínimo 10 dígitos.`);
    }

    if (cleaned.length > 15) {
      throw new Error(`Número muito longo: ${phoneNumber}. Máximo 15 dígitos.`);
    }

    // Adicionar código do país se não tiver (Brasil = 55)
    if (cleaned.length === 10 || cleaned.length === 11) {
      cleaned = '55' + cleaned;
    }

    // Formato WhatsApp: número@c.us
    const formatted = `${cleaned}@c.us`;

    logger.debug(`📞 Número formatado: ${phoneNumber} -> ${formatted}`);
    return formatted;
  }

  /**
   * Obter o cliente WPPConnect (usado pelo WhatsAppChatService)
   */
  getClient(): Whatsapp | null {
    return this.client;
  }

  /**
   * ⭐ FASE 1: Desconectar WhatsApp com cleanup completo
   * Após desconectar, reinicializa automaticamente para gerar novo QR code
   */
  async disconnect(): Promise<void> {
    // Parar polling
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      logger.info('⏹️  Polling de status interrompido');
    }

    // Parar Phone Watchdog
    if (this.client) {
      try {
        this.client.stopPhoneWatchdog?.();
        logger.info('⏹️  Phone Watchdog interrompido');
      } catch (error) {
        logger.warn('⚠️  Erro ao parar Phone Watchdog:', error);
      }
    }

    // Desconectar cliente
    if (this.client) {
      try {
        await this.client.close();
        logger.info('👋 WhatsApp desconectado');
        this.isConnected = false;
        this.qrCode = null;
        this.client = null;
      } catch (error) {
        logger.error('Erro ao desconectar WhatsApp:', error);
      }
    }

    // Aguardar 2 segundos antes de reinicializar
    logger.info('🔄 Gerando novo QR Code em 2 segundos...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Reinicializar para gerar novo QR code
    this.isInitializing = false;
    await this.initialize();
  }

  // ============================================================================
  // ✅ NOVA ARQUITETURA STATELESS (WPPConnect-First)
  // ============================================================================

  /**
   * ✅ STATELESS: Busca todas as conversas direto do WhatsApp
   * Enriquece com metadata do PostgreSQL (tags, leadId, etc)
   */
  async getAllConversations(limit: number = 50): Promise<any[]> {
    if (!this.client) {
      throw new Error('WhatsApp não conectado');
    }

    try {
      // 1. Buscar TODAS as conversas do WhatsApp
      const allChats = await this.client.getAllChats();

      // 2. Filtrar apenas conversas privadas (não grupos)
      const privateChats = allChats
        .filter((chat: any) => !chat.isGroup)
        .sort((a: any, b: any) => (b.t || 0) - (a.t || 0))
        .slice(0, limit);

      // 3. Enriquecer com metadata do PostgreSQL
      const { prisma } = await import('../config/database');

      const enrichedChats = await Promise.all(
        privateChats.map(async (chat: any) => {
          const phone = chat.id._serialized.replace('@c.us', '');

          // Buscar metadata do contato no PostgreSQL
          const contactMetadata = await prisma.whatsAppContact.findUnique({
            where: { phone },
            include: {
              lead: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  status: true,
                },
              },
            },
          });

          return {
            id: chat.id._serialized,
            phone,
            name: chat.name || contactMetadata?.name || phone,
            profilePicUrl: chat.profilePicThumb?.eurl || contactMetadata?.profilePicUrl || null,
            lastMessageAt: chat.t ? new Date(chat.t * 1000) : null,
            lastMessagePreview: chat.lastMessage?.body || null,
            unreadCount: chat.unreadCount || 0,
            isPinned: chat.pin || false,
            isArchived: chat.archive || false,
            // Metadata do CRM
            lead: contactMetadata?.lead || null,
            tags: contactMetadata?.tags || [],
            contact: {
              id: phone,
              phone,
              name: chat.name || contactMetadata?.name || phone,
              profilePicUrl: chat.profilePicThumb?.eurl || contactMetadata?.profilePicUrl || null,
            },
          };
        })
      );

      return enrichedChats;
    } catch (error: any) {
      logger.error('Erro ao buscar conversas do WhatsApp:', error);
      throw error;
    }
  }

  /**
   * ✅ STATELESS: Busca mensagens de uma conversa direto do WhatsApp
   */
  async getChatMessages(phone: string, count: number = 100): Promise<any[]> {
    if (!this.client) {
      throw new Error('WhatsApp não conectado');
    }

    try {
      // Formatar chat ID
      const cleanPhone = phone.replace(/\D/g, '');
      const chatId = cleanPhone.includes('@c.us') ? cleanPhone : `${cleanPhone}@c.us`;

      // Buscar mensagens DIRETO do WPPConnect
      const messages = await this.client.getMessages(chatId, {
        count,
        direction: 'before',
      });

      // Formatar mensagens para o formato esperado pelo frontend
      return messages.map((msg: any) => ({
        id: msg.id,
        conversationId: chatId,
        type: msg.type,
        content: msg.body || '',
        mediaUrl: msg.mediaUrl || null,
        mediaType: msg.mimetype || null,
        fromMe: msg.fromMe || false,
        status: this.mapAckToStatus(msg.ack),
        timestamp: new Date(msg.timestamp * 1000),
        quotedMessage: msg.quotedMsg ? {
          id: msg.quotedMsg.id,
          content: msg.quotedMsg.body || '',
          fromMe: msg.quotedMsg.fromMe || false,
        } : null,
        contact: {
          id: cleanPhone,
          phone: cleanPhone,
          name: cleanPhone,
        },
      }));
    } catch (error: any) {
      logger.error(`Erro ao buscar mensagens de ${phone}:`, error);
      throw error;
    }
  }

  /**
   * Helper: Mapear ACK do WhatsApp para status
   */
  private mapAckToStatus(ack?: number): string {
    switch (ack) {
      case 0: return 'ERROR';
      case 1: return 'PENDING';
      case 2: return 'SENT';
      case 3: return 'DELIVERED';
      case 4: return 'READ';
      case 5: return 'PLAYED';
      default: return 'SENT';
    }
  }

  /**
   * Reinicializar conexão WhatsApp (gerar novo QR code)
   */
  async reinitialize(): Promise<void> {
    logger.info('🔄 Reinicializando WhatsApp...');

    // Desconectar sessão atual se existir
    await this.disconnect();

    // Resetar estados
    this.isInitializing = false;
    this.isConnected = false;
    this.qrCode = null;
    this.client = null;

    // Aguardar 2 segundos antes de reiniciar
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Inicializar novamente
    await this.initialize();

    logger.info('✅ WhatsApp reinicializado');
  }

  /**
   * ✅ MELHORIA: Obter status da conexão com informações de WebSocket
   */
  getStatus(): {
    connected: boolean;
    hasQR: boolean;
    message: string;
    isInitializing: boolean;
    socketIO: {
      initialized: boolean;
      connectedClients: number;
    };
  } {
    let message = 'Inicializando...';

    if (this.isConnected) {
      message = 'Conectado';
    } else if (this.qrCode !== null) {
      message = 'Aguardando leitura do QR Code';
    } else if (this.isInitializing) {
      message = 'Inicializando WhatsApp...';
    } else if (this.client === null) {
      message = 'Não inicializado';
    } else {
      message = 'Aguardando QR Code...';
    }

    // ✅ MELHORIA: Incluir informações de WebSocket
    let connectedClients = 0;
    try {
      if (this.io && this.io.engine) {
        connectedClients = this.io.engine.clientsCount || 0;
      }
    } catch (error) {
      // Silencioso - apenas retornar 0
    }

    return {
      connected: this.isConnected,
      hasQR: this.qrCode !== null,
      message,
      isInitializing: this.isInitializing,
      socketIO: {
        initialized: this.io !== null,
        connectedClients,
      },
    };
  }

  /**
   * ✅ FASE 2: Configurar Socket.IO (unificado)
   * Substitui setSocketServer() - agora usa setSocketIO() declarado acima
   * @param io Instância do Socket.IO
   */
  setSocketServer(io: SocketIOServer): void {
    // Configurar Socket.IO no serviço principal
    this.setSocketIO(io);

    // Configurar Socket.IO nos listeners avançados
    if (this.listeners) {
      this.listeners.setSocketServer(io);
      logger.info('✅ Socket.IO configurado para listeners avançados do WhatsApp');
    }
  }
}

// Exportar instância única (Singleton)
export const whatsappService = new WhatsAppService();
