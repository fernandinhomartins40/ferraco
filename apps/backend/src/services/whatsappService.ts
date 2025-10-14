/**
 * WhatsApp Service - Integração com Venom Bot
 *
 * Este serviço gerencia a conexão WhatsApp Web usando Venom Bot
 * - Sessão persistente em volume /sessions
 * - QR Code em base64 para frontend
 * - Envio e recebimento de mensagens
 * - Logs salvos no Supabase
 */

import { create, Whatsapp, Message } from 'venom-bot';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs';

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
   * Chamado automaticamente ao iniciar o servidor
   */
  async initialize(): Promise<void> {
    try {
      logger.info('🚀 Inicializando WhatsApp com Venom Bot...');

      this.client = await create(
        {
          session: 'ferraco-crm', // Nome da sessão
          multidevice: true, // Suporte a multidevice
          folderNameToken: this.sessionsPath, // Pasta de sessões
          headless: 'new', // Modo headless (sem interface gráfica)
          useChrome: false, // Usar Chromium padrão
          debug: false,
          logQR: false, // Não logar QR no console
          browserArgs: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
          ],
        },
        // Callback quando QR Code é gerado
        (base64Qr) => {
          this.qrCode = base64Qr;
          logger.info('📱 QR Code gerado! Acesse /api/whatsapp/qr para visualizar');
        },
        // Callback de status da conexão
        (statusSession) => {
          logger.info(`📊 Status da sessão: ${statusSession}`);

          if (statusSession === 'isLogged' || statusSession === 'CONNECTED') {
            this.isConnected = true;
            this.qrCode = null; // Limpar QR code após conectar
            logger.info('✅ WhatsApp conectado com sucesso!');
          } else if (statusSession === 'notLogged' || statusSession === 'qrReadFail') {
            this.isConnected = false;
            logger.warn('⚠️  WhatsApp desconectado. Novo QR será gerado.');
          }
        }
      );

      // Configurar listeners de mensagens
      this.setupMessageListeners();

      logger.info('✅ WhatsApp Service inicializado!');
    } catch (error: any) {
      // Se o erro for "Not Logged", não é um erro fatal - apenas aguardando QR Code
      if (error === 'Not Logged' || error?.message === 'Not Logged') {
        logger.info('⏳ WhatsApp aguardando autenticação (QR Code ou sessão salva)');
        this.isConnected = false;
        return; // Não lançar erro, é comportamento esperado
      }

      logger.error('❌ Erro ao inicializar WhatsApp:', error);
      // Não fazer throw - deixar o servidor continuar funcionando
      this.isConnected = false;
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
        // Ignorar mensagens enviadas por nós
        if (message.fromMe) return;

        const whatsappMessage: WhatsAppMessage = {
          from: message.from,
          to: message.to,
          body: message.body,
          timestamp: new Date(message.timestamp * 1000),
          isGroup: message.isGroupMsg,
          fromMe: message.fromMe,
        };

        logger.info(`📩 Mensagem recebida de ${message.from}: ${message.body}`);

        // Salvar no Supabase (implementar depois)
        await this.saveMessageToDatabase(whatsappMessage);

        // Aqui você pode adicionar lógica de auto-resposta ou chatbot
        // await this.handleIncomingMessage(whatsappMessage);

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
      const hostDevice = await this.client.getHostDevice();
      return {
        phone: hostDevice.id.user,
        name: hostDevice.pushname,
        platform: hostDevice.platform,
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

      // Salvar mensagem enviada no banco
      await this.saveMessageToDatabase({
        from: 'me',
        to: formattedNumber,
        body: message,
        timestamp: new Date(),
        isGroup: false,
        fromMe: true,
      });

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
   * Salvar mensagem no banco de dados (Supabase)
   * @param message Mensagem para salvar
   */
  private async saveMessageToDatabase(message: WhatsAppMessage): Promise<void> {
    try {
      // TODO: Implementar integração com Supabase
      // Exemplo de estrutura da tabela:
      /*
        CREATE TABLE whatsapp_messages (
          id SERIAL PRIMARY KEY,
          from_number VARCHAR(50) NOT NULL,
          to_number VARCHAR(50) NOT NULL,
          message_body TEXT NOT NULL,
          timestamp TIMESTAMPTZ NOT NULL,
          is_group BOOLEAN DEFAULT false,
          from_me BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      */

      logger.info(`💾 Mensagem salva no banco: ${message.from} -> ${message.to}`);
    } catch (error) {
      logger.error('Erro ao salvar mensagem no banco:', error);
    }
  }

  /**
   * Desconectar WhatsApp e limpar sessão
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.logout();
        logger.info('👋 WhatsApp desconectado');
        this.isConnected = false;
        this.qrCode = null;
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
    } else if (this.client === null) {
      message = 'Inicializando WhatsApp...';
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
