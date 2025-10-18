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

              // ✅ SIMPLIFICADO: Apenas define o cliente, sem sync automática
              // O sistema só envia mensagens, não precisa carregar histórico
              if (this.client) {
                whatsappChatService.setWhatsAppClient(this.client);
              }
              break;

            case 'notLogged':
            case 'qrReadError':
            case 'qrReadFail':
              this.isConnected = false;
              logger.info('⏳ Aguardando leitura do QR Code...');
              break;

            case 'desconnectedMobile':
            case 'serverClose':
            case 'deleteToken':
              this.isConnected = false;
              this.qrCode = null;
              logger.warn('⚠️  WhatsApp desconectado');
              break;

            case 'autocloseCalled':
            case 'browserClose':
              this.isConnected = false;
              this.isInitializing = false;
              logger.warn('🔄 Navegador fechado');
              break;

            default:
              logger.debug(`🔄 Status: ${statusSession}`);
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

    // Listener para todas as mensagens
    this.client.onMessage(async (message: Message) => {
      try {
        // Ignorar mensagens de grupo, status/broadcast e mensagens enviadas por nós
        if (message.isGroupMsg || message.fromMe || message.from === 'status@broadcast') {
          return;
        }

        logger.info(`📩 Mensagem recebida de ${message.from}: ${message.body}`);

        // Normalizar número de telefone
        const normalizedPhone = message.from.replace('@c.us', '').replace(/\D/g, '');

        // ⭐ NOVO: Verificar se existe sessão ativa do bot do WhatsApp
        try {
          const { prisma } = await import('../config/database');

          const botSession = await prisma.whatsAppBotSession.findFirst({
            where: {
              phone: normalizedPhone,
              isActive: true,
              handedOffToHuman: false,
            },
          });

          // Se houver sessão ativa do bot, rotear para o bot
          if (botSession) {
            logger.info(`🤖 Mensagem roteada para bot do WhatsApp - Sessão ${botSession.id}`);

            const { whatsappBotService } = await import('../modules/whatsapp-bot/whatsapp-bot.service');
            await whatsappBotService.processUserMessage(normalizedPhone, message.body);
            return;
          }
        } catch (error) {
          logger.error('Erro ao verificar sessão do bot:', error);
          // Continuar para atendimento humano em caso de erro
        }

        // Caso contrário, rotear para atendimento humano (sistema de chat existente)
        logger.info(`👤 Mensagem roteada para atendimento humano`);
        await whatsappChatService.handleIncomingMessage(message);

      } catch (error) {
        logger.error('Erro ao processar mensagem:', error);
      }
    });

    logger.info('✅ Listeners de mensagens configurados');
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
        const statusName = ackCode === 1 ? 'PENDING' : ackCode === 2 ? 'SENT' : ackCode === 3 ? 'DELIVERED' : ackCode === 4 || ackCode === 5 ? 'READ' : 'UNKNOWN';

        logger.info(`📨 ACK: ${messageId.substring(0, 20)}... -> ${statusName} (${ackCode})`);

        // Atualizar status da mensagem no banco (já emite WebSocket internamente)
        await whatsappChatService.updateMessageStatus(messageId, ackCode);

      } catch (error) {
        logger.error('Erro ao processar ACK:', error);
      }
    });

    // ⭐ NOVO: Polling para verificar status de mensagens recentes
    // Como o onAck pode não disparar para DELIVERED/READ, vamos fazer polling
    setInterval(async () => {
      try {
        await this.checkRecentMessagesStatus();
      } catch (error) {
        logger.error('Erro ao verificar status de mensagens:', error);
      }
    }, 10000); // Verificar a cada 10 segundos

    logger.info('✅ Listeners de ACK configurados + polling de status ativado');
  }

  /**
   * ⭐ NOVO: Verificar status de mensagens recentes
   */
  private async checkRecentMessagesStatus(): Promise<void> {
    try {
      const { prisma } = await import('../config/database');

      // Buscar mensagens enviadas nos últimos 5 minutos que ainda não foram lidas
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      const recentMessages = await prisma.whatsAppMessage.findMany({
        where: {
          fromMe: true,
          status: { in: ['PENDING', 'SENT', 'DELIVERED'] },
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
   * Obter status da conexão (compatibilidade com Evolution API)
   */
  getConnectionStatus(): { connected: boolean; qrCode: string | null } {
    return {
      connected: this.isConnected,
      qrCode: this.qrCode,
    };
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
   * Enviar mensagem de texto
   * @param to Número do destinatário (com código do país, ex: 5511999999999)
   * @param message Mensagem a ser enviada
   */
  async sendTextMessage(to: string, message: string): Promise<void> {
    if (!this.client || !this.isConnected) {
      throw new Error('WhatsApp não conectado. Escaneie o QR Code primeiro.');
    }

    try {
      // Formatar número para o padrão do WhatsApp
      const formattedNumber = this.formatPhoneNumber(to);

      // Enviar mensagem via WPPConnect
      const result = await this.client.sendText(formattedNumber, message);

      logger.info(`✅ Mensagem enviada para ${to}`);
      logger.info(`📨 ID da mensagem retornado pelo WPPConnect:`, {
        'result.id': result.id,
        'tipo': typeof result.id,
        'serialized': result.id?._serialized || 'N/A'
      });

      // ✅ NOVO: Salvar mensagem enviada no banco (estratégia híbrida)
      await whatsappChatService.saveOutgoingMessage({
        to: to,
        content: message,
        whatsappMessageId: result.id || `${Date.now()}_${to}`,
        timestamp: new Date(),
      });

    } catch (error) {
      logger.error(`Erro ao enviar mensagem para ${to}:`, error);
      throw error;
    }
  }

  /**
   * Enviar imagem via WhatsApp
   * @param to Número de destino
   * @param imageUrl URL da imagem
   * @param caption Legenda opcional
   * @returns ID da mensagem no WhatsApp
   */
  async sendImage(to: string, imageUrl: string, caption?: string): Promise<string | undefined> {
    if (!this.client || !this.isConnected) {
      throw new Error('WhatsApp não conectado. Escaneie o QR Code primeiro.');
    }

    try {
      const formattedNumber = this.formatPhoneNumber(to);

      // Enviar imagem via WPPConnect
      const result = await this.client.sendImage(
        formattedNumber,
        imageUrl,
        'image',
        caption || ''
      );

      logger.info(`✅ Imagem enviada para ${to}`);

      return result.id;

    } catch (error) {
      logger.error(`❌ Erro ao enviar imagem para ${to}:`, error);
      throw error;
    }
  }

  /**
   * Enviar vídeo via WhatsApp
   * @param to Número de destino
   * @param videoUrl URL do vídeo
   * @param caption Legenda opcional
   * @returns ID da mensagem no WhatsApp
   */
  async sendVideo(to: string, videoUrl: string, caption?: string): Promise<string | undefined> {
    if (!this.client || !this.isConnected) {
      throw new Error('WhatsApp não conectado. Escaneie o QR Code primeiro.');
    }

    try {
      const formattedNumber = this.formatPhoneNumber(to);

      // Enviar vídeo via WPPConnect
      const result = await this.client.sendVideoAsGif(
        formattedNumber,
        videoUrl,
        'video.mp4',
        caption || ''
      );

      logger.info(`✅ Vídeo enviado para ${to}`);

      return result.id;

    } catch (error) {
      logger.error(`❌ Erro ao enviar vídeo para ${to}:`, error);
      throw error;
    }
  }

  /**
   * Formatar número de telefone para o padrão WhatsApp
   * @param phoneNumber Número de telefone
   * @returns Número formatado (ex: 5511999999999@c.us)
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remover caracteres não numéricos
    let cleaned = phoneNumber.replace(/\D/g, '');

    // Adicionar código do país se não tiver (Brasil = 55)
    if (!cleaned.startsWith('55')) {
      cleaned = '55' + cleaned;
    }

    // Adicionar sufixo do WhatsApp
    return `${cleaned}@c.us`;
  }

  /**
   * Obter o cliente WPPConnect (usado pelo WhatsAppChatService)
   */
  getClient(): Whatsapp | null {
    return this.client;
  }

  /**
   * Desconectar WhatsApp e limpar sessão
   * Após desconectar, reinicializa automaticamente para gerar novo QR code
   */
  async disconnect(): Promise<void> {
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
   * Obter status da conexão
   */
  getStatus(): { connected: boolean; hasQR: boolean; message: string; isInitializing: boolean } {
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

    return {
      connected: this.isConnected,
      hasQR: this.qrCode !== null,
      message,
      isInitializing: this.isInitializing,
    };
  }

  /**
   * Configurar Socket.IO para listeners avançados
   * @param io Instância do Socket.IO
   */
  setSocketServer(io: SocketIOServer): void {
    if (this.listeners) {
      this.listeners.setSocketServer(io);
      logger.info('✅ Socket.IO configurado para listeners avançados do WhatsApp');
    }
  }
}

// Exportar instância única (Singleton)
export const whatsappService = new WhatsAppService();
