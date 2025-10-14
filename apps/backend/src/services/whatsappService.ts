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
          logger.info(`📱 QR Code gerado! Tentativa ${attempt}/5`);
          logger.info('✅ Acesse /api/whatsapp/qr para visualizar o QR Code');

          if (attempt >= 5) {
            logger.warn('⚠️  Limite de tentativas atingido. QR Code expirou.');
            this.qrCode = null;
          }
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
        logger.info(`📩 Mensagem recebida de ${message.from}: ${message.body}`);

        // Sincronizar mensagem com o banco via WhatsAppChatService
        await whatsappChatService.handleIncomingMessage(message);

      } catch (error) {
        logger.error('Erro ao processar mensagem:', error);
      }
    });

    logger.info('✅ Listeners de mensagens configurados');
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
      const hostDevice: any = await this.client.getHostDevice();
      return {
        phone: hostDevice?.id?.user || hostDevice?.wid?.user || 'Desconhecido',
        name: hostDevice?.pushname || 'WhatsApp',
        platform: 'WPPConnect',
      };
    } catch (error) {
      logger.error('Erro ao obter informações da conta:', error);
      throw error;
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

      await this.client.sendText(formattedNumber, message);

      logger.info(`✅ Mensagem enviada para ${to}`);

    } catch (error) {
      logger.error(`Erro ao enviar mensagem para ${to}:`, error);
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
  }

  /**
   * Obter status da conexão
   */
  getStatus(): { connected: boolean; hasQR: boolean; message: string } {
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
    };
  }
}

// Exportar instância única (Singleton)
export const whatsappService = new WhatsAppService();
