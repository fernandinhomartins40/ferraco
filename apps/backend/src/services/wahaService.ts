/**
 * WAHA Service - Adapter para WhatsApp HTTP API
 * Substitui WPPConnect por solução mais confiável com webhooks
 */

import axios, { AxiosInstance } from 'axios';
import { EventEmitter } from 'events';

// Configuração da API WAHA
const WAHA_URL = process.env.WAHA_URL || 'http://waha:3000';
const WAHA_API_KEY = process.env.WAHA_API_KEY || ''; // Opcional se não usar autenticação
const SESSION_NAME = process.env.WAHA_SESSION_NAME || 'ferraco-crm';

// Tipos WAHA
export enum WAHAEngine {
  WEBJS = 'WEBJS',
  NOWEB = 'NOWEB',
  VENOM = 'VENOM'
}

export enum WAHASessionStatus {
  STOPPED = 'STOPPED',
  STARTING = 'STARTING',
  SCAN_QR_CODE = 'SCAN_QR_CODE',
  WORKING = 'WORKING',
  FAILED = 'FAILED'
}

export enum WAHAAckStatus {
  ERROR = -1,
  PENDING = 0,
  SERVER = 1,
  DEVICE = 2,      // Entregue (✓✓)
  READ = 3,        // Lido (✓✓ azul)
  PLAYED = 4       // Reproduzido (áudio/vídeo)
}

export interface WAHAMessage {
  id: string;
  timestamp: number;
  from: string;
  to: string;
  body?: string;
  hasMedia: boolean;
  mediaUrl?: string;
  ack?: WAHAAckStatus;
  fromMe: boolean;
  type: 'chat' | 'image' | 'video' | 'audio' | 'document' | 'ptt' | 'location' | 'vcard';
  _data?: {
    id: {
      id: string;
    };
  };
}

export interface WAHASession {
  name: string;
  status: WAHASessionStatus;
  config: {
    engine: WAHAEngine;
    webhooks?: {
      url: string;
      events: string[];
    };
  };
  me?: {
    id: string;
    pushName: string;
  };
}

export interface WAHAContact {
  id: string;
  name?: string;
  pushname?: string;
  number: string;
}

class WAHAService extends EventEmitter {
  private api: AxiosInstance;
  private sessionName: string = SESSION_NAME;
  private qrCode: string | null = null;
  private isConnected: boolean = false;
  private sessionStatus: WAHASessionStatus = WAHASessionStatus.STOPPED;
  private myNumber: string | null = null;

  constructor() {
    super();

    this.api = axios.create({
      baseURL: `${WAHA_URL}/api`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(WAHA_API_KEY && { 'X-Api-Key': WAHA_API_KEY })
      }
    });

    // Interceptor para logging
    this.api.interceptors.response.use(
      response => response,
      error => {
        console.error('❌ WAHA API Error:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  /**
   * Inicializa a sessão WAHA
   */
  async initialize(): Promise<void> {
    try {
      console.log('🚀 Inicializando WAHA Service...');

      // Testa conectividade antes de tentar inicializar
      const sessions = await this.getSessions();

      if (sessions.length === 0) {
        console.log('⚠️ WAHA disponível mas sem sessões - criando nova sessão');
        await this.startSession();
        return;
      }

      const existingSession = sessions.find((s: WAHASession) => s.name === this.sessionName);

      if (existingSession) {
        console.log('📱 Sessão existente encontrada:', existingSession.status);
        this.sessionStatus = existingSession.status;

        if (existingSession.status === WAHASessionStatus.WORKING) {
          this.isConnected = true;
          this.myNumber = existingSession.me?.id || null;
          console.log('✅ Sessão já está ativa');
          this.emit('ready');
          return;
        }

        if (existingSession.status === WAHASessionStatus.SCAN_QR_CODE) {
          await this.updateQRCode();
        }
      } else {
        // Cria nova sessão
        await this.startSession();
      }

    } catch (error: any) {
      // Se WAHA não está disponível, apenas loga warning ao invés de throw
      if (error.code === 'ECONNREFUSED' || error.code === 'EAI_AGAIN' || error.code === 'ENOTFOUND') {
        console.warn('⚠️ WAHA não disponível:', error.message);
        console.warn('⚠️ WhatsApp não estará disponível até que o WAHA seja configurado');
        return;
      }
      console.error('❌ Erro ao inicializar WAHA:', error.message);
      throw error;
    }
  }

  /**
   * Inicia uma nova sessão
   */
  async startSession(engine: WAHAEngine = WAHAEngine.WEBJS): Promise<void> {
    try {
      console.log(`🔄 Iniciando nova sessão com engine ${engine}...`);

      const response = await this.api.post('/sessions/start', {
        name: this.sessionName,
        config: {
          engine: engine,
          webhooks: {
            url: process.env.BACKEND_URL
              ? `${process.env.BACKEND_URL}/webhooks/waha`
              : 'http://backend:3000/webhooks/waha',
            events: ['message', 'message.ack', 'session.status', 'state.change']
          }
        }
      });

      console.log('✅ Sessão iniciada:', response.data);
      this.sessionStatus = WAHASessionStatus.STARTING;

      // Aguarda QR code estar disponível
      setTimeout(() => this.updateQRCode(), 3000);

    } catch (error: any) {
      console.error('❌ Erro ao iniciar sessão:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Para a sessão atual
   */
  async stopSession(): Promise<void> {
    try {
      await this.api.post('/sessions/stop', { name: this.sessionName });
      this.isConnected = false;
      this.sessionStatus = WAHASessionStatus.STOPPED;
      this.qrCode = null;
      console.log('⏹️ Sessão parada');
    } catch (error: any) {
      console.error('❌ Erro ao parar sessão:', error.message);
      throw error;
    }
  }

  /**
   * Obtém lista de sessões
   */
  async getSessions(): Promise<WAHASession[]> {
    try {
      const response = await this.api.get('/sessions');
      return response.data;
    } catch (error: any) {
      // Se é erro de conexão, re-throw para o initialize() tratar
      if (error.code === 'ECONNREFUSED' || error.code === 'EAI_AGAIN' || error.code === 'ENOTFOUND') {
        throw error;
      }
      console.error('❌ Erro ao buscar sessões:', error.message);
      return [];
    }
  }

  /**
   * Obtém status da sessão atual
   */
  async getSessionStatus(): Promise<WAHASession | null> {
    try {
      const response = await this.api.get(`/sessions/${this.sessionName}`);
      const session = response.data as WAHASession;

      this.sessionStatus = session.status;
      this.isConnected = session.status === WAHASessionStatus.WORKING;

      if (session.me?.id) {
        this.myNumber = session.me.id;
      }

      return session;
    } catch (error: any) {
      console.error('❌ Erro ao buscar status da sessão:', error.message);
      return null;
    }
  }

  /**
   * Atualiza o QR code
   */
  async updateQRCode(): Promise<void> {
    try {
      const response = await this.api.get(`/sessions/${this.sessionName}/qr`);

      if (response.data?.qr) {
        this.qrCode = response.data.qr;
        this.emit('qr', this.qrCode);
        console.log('📱 QR Code atualizado');
      }
    } catch (error: any) {
      console.error('❌ Erro ao buscar QR code:', error.message);
    }
  }

  /**
   * Envia mensagem de texto
   */
  async sendText(to: string, text: string): Promise<WAHAMessage> {
    try {
      const chatId = this.formatPhoneNumber(to);

      const response = await this.api.post('/sendText', {
        session: this.sessionName,
        chatId: chatId,
        text: text
      });

      console.log('📤 Mensagem enviada:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao enviar mensagem:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Envia arquivo/mídia
   */
  async sendFile(to: string, fileUrl: string, caption?: string, filename?: string): Promise<WAHAMessage> {
    try {
      const chatId = this.formatPhoneNumber(to);

      const response = await this.api.post('/sendFile', {
        session: this.sessionName,
        chatId: chatId,
        file: {
          url: fileUrl,
          filename: filename
        },
        caption: caption
      });

      console.log('📤 Arquivo enviado:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao enviar arquivo:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Marca mensagem como lida
   */
  async markAsRead(messageId: string): Promise<void> {
    try {
      await this.api.post('/sendSeen', {
        session: this.sessionName,
        chatId: messageId.split('_')[0], // Extrai o chatId do messageId
        messageId: messageId
      });

      console.log('✓ Mensagem marcada como lida:', messageId);
    } catch (error: any) {
      console.error('❌ Erro ao marcar como lida:', error.message);
    }
  }

  /**
   * Busca mensagens de um chat
   */
  async getMessages(chatId: string, limit: number = 100): Promise<WAHAMessage[]> {
    try {
      const response = await this.api.get('/messages', {
        params: {
          session: this.sessionName,
          chatId: this.formatPhoneNumber(chatId),
          limit: limit
        }
      });

      return response.data || [];
    } catch (error: any) {
      console.error('❌ Erro ao buscar mensagens:', error.message);
      return [];
    }
  }

  /**
   * Busca contatos
   */
  async getContacts(): Promise<WAHAContact[]> {
    try {
      const response = await this.api.get('/contacts', {
        params: { session: this.sessionName }
      });

      return response.data || [];
    } catch (error: any) {
      console.error('❌ Erro ao buscar contatos:', error.message);
      return [];
    }
  }

  /**
   * Busca um contato específico
   */
  async getContact(contactId: string): Promise<WAHAContact | null> {
    try {
      const response = await this.api.get(`/contacts/${this.formatPhoneNumber(contactId)}`, {
        params: { session: this.sessionName }
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao buscar contato:', error.message);
      return null;
    }
  }

  /**
   * Verifica se um número está registrado no WhatsApp
   */
  async checkNumberExists(phoneNumber: string): Promise<boolean> {
    try {
      const response = await this.api.post('/contacts/check-exists', {
        session: this.sessionName,
        phone: this.formatPhoneNumber(phoneNumber)
      });

      return response.data?.exists || false;
    } catch (error: any) {
      console.error('❌ Erro ao verificar número:', error.message);
      return false;
    }
  }

  /**
   * Formata número de telefone para formato WhatsApp
   */
  formatPhoneNumber(phone: string): string {
    // Remove caracteres não numéricos
    let cleaned = phone.replace(/\D/g, '');

    // Se não tem @c.us, adiciona
    if (!phone.includes('@')) {
      // Adiciona código do país se não tiver
      if (cleaned.length === 11 && cleaned.startsWith('0')) {
        cleaned = '55' + cleaned.substring(1); // Brasil
      } else if (cleaned.length === 10) {
        cleaned = '55' + cleaned; // Brasil
      }

      return `${cleaned}@c.us`;
    }

    return phone;
  }

  /**
   * Extrai número limpo do ID do WhatsApp
   */
  extractPhoneNumber(whatsappId: string): string {
    return whatsappId.replace('@c.us', '').replace('@g.us', '');
  }

  // Getters
  getQRCode(): string | null {
    return this.qrCode;
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }

  getSessionStatus(): WAHASessionStatus {
    return this.sessionStatus;
  }

  getMyNumber(): string | null {
    return this.myNumber;
  }

  /**
   * Atualiza status da sessão (chamado por webhooks)
   */
  updateSessionStatusFromWebhook(status: WAHASessionStatus, data?: any): void {
    this.sessionStatus = status;

    switch (status) {
      case WAHASessionStatus.WORKING:
        this.isConnected = true;
        if (data?.me?.id) {
          this.myNumber = data.me.id;
        }
        this.qrCode = null;
        this.emit('ready');
        console.log('✅ WhatsApp conectado e pronto');
        break;

      case WAHASessionStatus.SCAN_QR_CODE:
        this.isConnected = false;
        this.updateQRCode();
        console.log('📱 Aguardando leitura do QR Code');
        break;

      case WAHASessionStatus.FAILED:
        this.isConnected = false;
        this.emit('disconnected');
        console.log('❌ Sessão falhou');
        break;

      case WAHASessionStatus.STOPPED:
        this.isConnected = false;
        this.emit('disconnected');
        console.log('⏹️ Sessão parada');
        break;
    }
  }

  /**
   * Desconecta e limpa recursos
   */
  async disconnect(): Promise<void> {
    await this.stopSession();
    this.removeAllListeners();
  }
}

// Singleton
const wahaService = new WAHAService();
export default wahaService;
