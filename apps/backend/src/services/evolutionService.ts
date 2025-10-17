/**
 * Evolution API Service - Adapter 100% Open Source para WhatsApp
 *
 * Evolution API usa Baileys (biblioteca oficial do WhatsApp Web)
 * - 100% gratuito e open source
 * - API Key gerada automaticamente (transparente para usuário)
 * - Webhooks confiáveis para mensagens, ACK, QR code
 * - Suporta múltiplas instâncias
 * - Funcionalidades completas semelhante ao WhatsApp Web
 */

import axios, { AxiosInstance } from 'axios';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import crypto from 'crypto';

// Configuração da API Evolution
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://evolution-api:8080';
const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || 'ferraco-crm';
const BACKEND_URL = process.env.BACKEND_URL || 'http://ferraco-crm-vps:3000';

// API Key (obrigatória para Evolution API v2.2.3+)
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';
if (EVOLUTION_API_KEY) {
  logger.info('🔑 Evolution API autenticada com API Key');
} else {
  logger.warn('⚠️  EVOLUTION_API_KEY não configurada - instância não poderá ser criada');
}

// Tipos Evolution API
export enum EvolutionConnectionState {
  CONNECTING = 'connecting',
  OPEN = 'open',
  CLOSE = 'close'
}

export interface EvolutionMessage {
  key: {
    remoteJid: string;      // ID do chat (número@s.whatsapp.net)
    fromMe: boolean;
    id: string;
  };
  message?: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
    imageMessage?: {
      caption?: string;
      url: string;
    };
    videoMessage?: {
      caption?: string;
      url: string;
    };
    audioMessage?: {
      url: string;
    };
    documentMessage?: {
      caption?: string;
      url: string;
      fileName?: string;
    };
  };
  messageTimestamp: number;
  status?: number;           // ACK: 0=PENDING, 1=SERVER, 2=DELIVERED, 3=READ, 4=PLAYED
}

export interface EvolutionContact {
  id: string;
  name?: string;
  pushName?: string;
  profilePictureUrl?: string;
}

export interface EvolutionInstance {
  instance: {
    instanceName: string;
    status: string;
  };
  qrcode?: {
    code: string;           // QR code base64
    base64: string;
  };
}

class EvolutionService extends EventEmitter {
  private api: AxiosInstance;
  private instanceName: string = INSTANCE_NAME;
  private apiKey: string = EVOLUTION_API_KEY;
  private qrCode: string | null = null;
  private isConnected: boolean = false;
  private connectionState: EvolutionConnectionState = EvolutionConnectionState.CLOSE;
  private myNumber: string | null = null;

  constructor() {
    super();

    // Configura headers baseado na presença da API Key
    const headers: any = {
      'Content-Type': 'application/json'
    };

    // Adiciona API Key apenas se estiver configurada
    if (this.apiKey) {
      headers['apikey'] = this.apiKey;
    }

    this.api = axios.create({
      baseURL: `${EVOLUTION_API_URL}`,
      timeout: 30000,
      headers
    });

    logger.info('🚀 Evolution API Service inicializado', {
      url: EVOLUTION_API_URL,
      instance: this.instanceName,
      authenticated: !!this.apiKey
    });
  }

  /**
   * Inicializa a instância Evolution API com retry automático
   *
   * Retry é necessário pois Evolution API pode não estar disponível
   * imediatamente após o backend subir (containers em redes separadas)
   */
  async initialize(): Promise<void> {
    const maxRetries = 5;
    const retryDelay = 5000; // 5 segundos

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`🔄 Tentativa ${attempt}/${maxRetries} - Verificando instância Evolution API...`, {
          instance: this.instanceName,
          url: EVOLUTION_API_URL
        });

        // Verifica se instância existe
        const exists = await this.checkInstanceExists();

        if (!exists) {
          logger.info('➕ Criando nova instância...', { instance: this.instanceName });
          await this.createInstance();
        } else {
          logger.info('✅ Instância já existe', { instance: this.instanceName });

          // Verifica status da conexão
          const status = await this.getConnectionStatus();
          if (status === EvolutionConnectionState.OPEN) {
            this.isConnected = true;
            this.connectionState = EvolutionConnectionState.OPEN;
            logger.info('✅ WhatsApp já está conectado');
            this.emit('ready');
          } else {
            // Instância existe mas não está conectada - precisa conectar para gerar QR Code
            logger.info('📱 Instância existe mas não está conectada. Iniciando conexão...');
            await this.connectInstance();
          }
        }

        // Se chegou aqui, sucesso!
        logger.info('✅ Evolution API inicializada com sucesso', {
          attempt,
          instance: this.instanceName
        });
        return;

      } catch (error: any) {
        const isLastAttempt = attempt === maxRetries;
        const errorCode = error.code || error.response?.status;

        // Erros de DNS/rede que podem ser resolvidos com retry
        const isRetryableError =
          error.code === 'EAI_AGAIN' ||
          error.code === 'ENOTFOUND' ||
          error.code === 'ECONNREFUSED' ||
          error.code === 'ETIMEDOUT';

        if (!isLastAttempt && isRetryableError) {
          logger.warn(`⚠️  Tentativa ${attempt}/${maxRetries} falhou (${errorCode}) - Tentando novamente em ${retryDelay/1000}s...`, {
            error: error.message,
            code: errorCode
          });
          await this.sleep(retryDelay);
          continue;
        }

        // Se chegou aqui: última tentativa OU erro não-retryable
        logger.error('❌ Erro ao inicializar Evolution API:', {
          attempt,
          error: error.message,
          code: errorCode,
          isRetryable: isRetryableError
        });

        throw error;
      }
    }
  }

  /**
   * Sleep helper para retry
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Verifica se instância existe
   */
  private async checkInstanceExists(): Promise<boolean> {
    try {
      const response = await this.api.get(`/instance/fetchInstances`);
      const instances = response.data;

      return instances.some((inst: any) =>
        inst.instance?.instanceName === this.instanceName
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Cria nova instância com webhook configurado
   */
  async createInstance(): Promise<void> {
    try {
      const webhookUrl = `${BACKEND_URL}/webhooks/evolution`;

      const response = await this.api.post('/instance/create', {
        instanceName: this.instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
        webhook: {
          url: webhookUrl,
          byEvents: false,
          base64: false,
          events: [
            'QRCODE_UPDATED',
            'CONNECTION_UPDATE',
            'MESSAGES_UPSERT',
            'MESSAGES_UPDATE',
            'SEND_MESSAGE',
            'CONTACTS_SET',
            'CONTACTS_UPSERT',
            'CONTACTS_UPDATE',
            'CHATS_SET',
            'CHATS_UPSERT',
            'CHATS_UPDATE',
            'CONNECTION_UPDATE'
          ]
        }
      });

      logger.info('✅ Instância criada com sucesso:', response.data);

      // Conecta a instância
      await this.connectInstance();

    } catch (error: any) {
      const errorDetails = {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      };
      logger.error('❌ Erro ao criar instância:', errorDetails);
      throw error;
    }
  }

  /**
   * Conecta a instância (gera QR code)
   */
  async connectInstance(): Promise<void> {
    try {
      const response = await this.api.get(`/instance/connect/${this.instanceName}`);
      logger.info('📱 Conexão iniciada. Aguardando QR code via webhook...', response.data);

      // QR code virá via webhook QRCODE_UPDATED
      this.connectionState = EvolutionConnectionState.CONNECTING;

    } catch (error: any) {
      logger.error('❌ Erro ao conectar instância:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Busca QR Code diretamente da Evolution API (fallback se webhook falhar)
   */
  async fetchQRCodeDirect(): Promise<string | null> {
    try {
      const response = await this.api.get(`/instance/connect/${this.instanceName}`);

      if (response.data && response.data.code) {
        // QR Code retornado diretamente
        const qrCodeBase64 = `data:image/png;base64,${response.data.code}`;
        logger.info('📱 QR Code obtido diretamente da API');
        return qrCodeBase64;
      }

      if (response.data && response.data.pairingCode) {
        logger.info('📱 Pairing code disponível:', response.data.pairingCode);
      }

      return null;
    } catch (error: any) {
      logger.error('❌ Erro ao buscar QR Code diretamente:', error.message);
      return null;
    }
  }

  /**
   * Obtém status da conexão
   */
  async getConnectionStatus(): Promise<EvolutionConnectionState> {
    try {
      const response = await this.api.get(`/instance/connectionState/${this.instanceName}`);
      const state = response.data?.instance?.state || 'close';

      return state as EvolutionConnectionState;
    } catch (error) {
      return EvolutionConnectionState.CLOSE;
    }
  }

  /**
   * Envia mensagem de texto
   */
  async sendText(to: string, text: string): Promise<EvolutionMessage> {
    try {
      const number = this.formatPhoneNumber(to);

      const response = await this.api.post(`/message/sendText/${this.instanceName}`, {
        number: number,
        text: text
      });

      logger.info('📤 Mensagem enviada:', { to: number, messageId: response.data?.key?.id });
      return response.data;

    } catch (error: any) {
      logger.error('❌ Erro ao enviar mensagem:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Envia arquivo/mídia
   */
  async sendFile(to: string, fileUrl: string, caption?: string, fileName?: string): Promise<EvolutionMessage> {
    try {
      const number = this.formatPhoneNumber(to);

      const response = await this.api.post(`/message/sendMedia/${this.instanceName}`, {
        number: number,
        mediatype: 'document',
        media: fileUrl,
        caption: caption,
        fileName: fileName
      });

      logger.info('📤 Arquivo enviado:', { to: number, messageId: response.data?.key?.id });
      return response.data;

    } catch (error: any) {
      logger.error('❌ Erro ao enviar arquivo:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Envia imagem
   */
  async sendImage(to: string, imageUrl: string, caption?: string): Promise<EvolutionMessage> {
    try {
      const number = this.formatPhoneNumber(to);

      const response = await this.api.post(`/message/sendMedia/${this.instanceName}`, {
        number: number,
        mediatype: 'image',
        media: imageUrl,
        caption: caption
      });

      logger.info('📤 Imagem enviada:', { to: number, messageId: response.data?.key?.id });
      return response.data;

    } catch (error: any) {
      logger.error('❌ Erro ao enviar imagem:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Marca mensagem como lida
   */
  async markAsRead(chatId: string, messageIds: string[]): Promise<void> {
    try {
      await this.api.post(`/chat/markMessageAsRead/${this.instanceName}`, {
        readMessages: messageIds.map(id => ({
          remoteJid: chatId,
          id: id,
          fromMe: false
        }))
      });

      logger.info('✅ Mensagens marcadas como lidas:', { chatId, count: messageIds.length });

    } catch (error: any) {
      logger.error('❌ Erro ao marcar como lida:', error.response?.data || error.message);
    }
  }

  /**
   * Busca contatos
   */
  async fetchContacts(): Promise<EvolutionContact[]> {
    try {
      const response = await this.api.get(`/chat/fetchAllContacts/${this.instanceName}`);
      return response.data || [];
    } catch (error: any) {
      logger.error('❌ Erro ao buscar contatos:', error.message);
      return [];
    }
  }

  /**
   * Busca chats
   */
  async fetchChats(): Promise<any[]> {
    try {
      const response = await this.api.get(`/chat/findChats/${this.instanceName}`);
      return response.data || [];
    } catch (error: any) {
      logger.error('❌ Erro ao buscar chats:', error.message);
      return [];
    }
  }

  /**
   * Busca mensagens de um chat específico
   */
  async fetchMessages(chatId: string, limit: number = 50): Promise<EvolutionMessage[]> {
    try {
      const response = await this.api.get(`/chat/fetchMessages/${this.instanceName}`, {
        params: {
          remoteJid: chatId,
          limit: limit
        }
      });
      return response.data?.messages || [];
    } catch (error: any) {
      logger.error('❌ Erro ao buscar mensagens:', error.message);
      return [];
    }
  }

  /**
   * Busca perfil de um contato
   */
  async fetchProfile(contactId: string): Promise<EvolutionContact | null> {
    try {
      const response = await this.api.get(`/chat/fetchProfile/${this.instanceName}`, {
        params: { number: contactId }
      });
      return response.data || null;
    } catch (error: any) {
      logger.error('❌ Erro ao buscar perfil:', error.message);
      return null;
    }
  }

  /**
   * Envia áudio
   */
  async sendAudio(to: string, audioUrl: string): Promise<EvolutionMessage> {
    try {
      const number = this.formatPhoneNumber(to);

      const response = await this.api.post(`/message/sendMedia/${this.instanceName}`, {
        number: number,
        mediatype: 'audio',
        media: audioUrl
      });

      logger.info('📤 Áudio enviado:', { to: number, messageId: response.data?.key?.id });
      return response.data;

    } catch (error: any) {
      logger.error('❌ Erro ao enviar áudio:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Envia vídeo
   */
  async sendVideo(to: string, videoUrl: string, caption?: string): Promise<EvolutionMessage> {
    try {
      const number = this.formatPhoneNumber(to);

      const response = await this.api.post(`/message/sendMedia/${this.instanceName}`, {
        number: number,
        mediatype: 'video',
        media: videoUrl,
        caption: caption
      });

      logger.info('📤 Vídeo enviado:', { to: number, messageId: response.data?.key?.id });
      return response.data;

    } catch (error: any) {
      logger.error('❌ Erro ao enviar vídeo:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Envia localização
   */
  async sendLocation(to: string, latitude: number, longitude: number, name?: string): Promise<EvolutionMessage> {
    try {
      const number = this.formatPhoneNumber(to);

      const response = await this.api.post(`/message/sendLocation/${this.instanceName}`, {
        number: number,
        latitude: latitude,
        longitude: longitude,
        name: name
      });

      logger.info('📤 Localização enviada:', { to: number, messageId: response.data?.key?.id });
      return response.data;

    } catch (error: any) {
      logger.error('❌ Erro ao enviar localização:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Envia contato
   */
  async sendContact(to: string, contactName: string, contactPhone: string): Promise<EvolutionMessage> {
    try {
      const number = this.formatPhoneNumber(to);

      const response = await this.api.post(`/message/sendContact/${this.instanceName}`, {
        number: number,
        contact: [{
          fullName: contactName,
          phoneNumber: contactPhone
        }]
      });

      logger.info('📤 Contato enviado:', { to: number, messageId: response.data?.key?.id });
      return response.data;

    } catch (error: any) {
      logger.error('❌ Erro ao enviar contato:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Define presença (online, offline, typing, recording)
   */
  async updatePresence(chatId: string, presence: 'available' | 'unavailable' | 'composing' | 'recording'): Promise<void> {
    try {
      await this.api.post(`/chat/updatePresence/${this.instanceName}`, {
        remoteJid: chatId,
        presence: presence
      });

      logger.info('✅ Presença atualizada:', { chatId, presence });

    } catch (error: any) {
      logger.error('❌ Erro ao atualizar presença:', error.response?.data || error.message);
    }
  }

  /**
   * Arquiva/desarquiva chat
   */
  async archiveChat(chatId: string, archive: boolean = true): Promise<void> {
    try {
      await this.api.post(`/chat/archiveChat/${this.instanceName}`, {
        remoteJid: chatId,
        archive: archive
      });

      logger.info(`✅ Chat ${archive ? 'arquivado' : 'desarquivado'}:`, chatId);

    } catch (error: any) {
      logger.error('❌ Erro ao arquivar chat:', error.response?.data || error.message);
    }
  }

  /**
   * Deleta mensagem
   */
  async deleteMessage(chatId: string, messageId: string): Promise<void> {
    try {
      await this.api.delete(`/message/delete/${this.instanceName}`, {
        data: {
          remoteJid: chatId,
          id: messageId
        }
      });

      logger.info('✅ Mensagem deletada:', { chatId, messageId });

    } catch (error: any) {
      logger.error('❌ Erro ao deletar mensagem:', error.response?.data || error.message);
    }
  }

  /**
   * Cria grupo
   */
  async createGroup(name: string, participants: string[]): Promise<any> {
    try {
      const response = await this.api.post(`/group/create/${this.instanceName}`, {
        subject: name,
        participants: participants.map(p => this.formatPhoneNumber(p))
      });

      logger.info('✅ Grupo criado:', response.data);
      return response.data;

    } catch (error: any) {
      logger.error('❌ Erro ao criar grupo:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Atualiza foto de perfil
   */
  async updateProfilePicture(imageUrl: string): Promise<void> {
    try {
      await this.api.put(`/chat/updateProfilePicture/${this.instanceName}`, {
        picture: imageUrl
      });

      logger.info('✅ Foto de perfil atualizada');

    } catch (error: any) {
      logger.error('❌ Erro ao atualizar foto de perfil:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Atualiza nome de perfil
   */
  async updateProfileName(name: string): Promise<void> {
    try {
      await this.api.put(`/chat/updateProfileName/${this.instanceName}`, {
        name: name
      });

      logger.info('✅ Nome de perfil atualizado:', name);

    } catch (error: any) {
      logger.error('❌ Erro ao atualizar nome de perfil:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Atualiza status (recado)
   */
  async updateProfileStatus(status: string): Promise<void> {
    try {
      await this.api.put(`/chat/updateProfileStatus/${this.instanceName}`, {
        status: status
      });

      logger.info('✅ Status atualizado:', status);

    } catch (error: any) {
      logger.error('❌ Erro ao atualizar status:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Reage a uma mensagem com emoji
   */
  async reactToMessage(chatId: string, messageId: string, emoji: string): Promise<void> {
    try {
      await this.api.post(`/message/react/${this.instanceName}`, {
        remoteJid: chatId,
        id: messageId,
        reaction: emoji
      });

      logger.info('👍 Reação enviada:', { chatId, messageId, emoji });

    } catch (error: any) {
      logger.error('❌ Erro ao reagir à mensagem:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Remove reação de uma mensagem
   */
  async removeReaction(chatId: string, messageId: string): Promise<void> {
    try {
      await this.api.post(`/message/react/${this.instanceName}`, {
        remoteJid: chatId,
        id: messageId,
        reaction: '' // Emoji vazio remove a reação
      });

      logger.info('👍 Reação removida:', { chatId, messageId });

    } catch (error: any) {
      logger.error('❌ Erro ao remover reação:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Desconecta instância
   */
  async disconnect(): Promise<void> {
    try {
      // Para regenerar QR Code, precisamos deletar e recriar a instância
      logger.info('🗑️ Deletando instância para regenerar QR Code...');
      await this.deleteInstance();

      logger.info('⏹️ Instância desconectada e deletada');
      this.emit('disconnected');

    } catch (error: any) {
      logger.error('❌ Erro ao desconectar:', error.message);
      throw error;
    }
  }

  /**
   * Deleta instância
   */
  async deleteInstance(): Promise<void> {
    try {
      await this.api.delete(`/instance/delete/${this.instanceName}`);

      this.isConnected = false;
      this.connectionState = EvolutionConnectionState.CLOSE;
      this.qrCode = null;
      this.myNumber = null;

      logger.info('🗑️ Instância deletada');
      this.emit('disconnected');

    } catch (error: any) {
      logger.error('❌ Erro ao deletar instância:', error.message);
      throw error;
    }
  }

  /**
   * Atualiza status da conexão via webhook
   */
  updateConnectionState(state: EvolutionConnectionState, data?: any): void {
    this.connectionState = state;

    switch (state) {
      case EvolutionConnectionState.OPEN:
        this.isConnected = true;
        this.qrCode = null;
        if (data?.me?.id) {
          this.myNumber = data.me.id;
        }
        logger.info('✅ WhatsApp conectado e pronto');
        this.emit('ready');
        break;

      case EvolutionConnectionState.CONNECTING:
        this.isConnected = false;
        logger.info('🔄 Conectando ao WhatsApp...');
        break;

      case EvolutionConnectionState.CLOSE:
        this.isConnected = false;
        this.qrCode = null;
        logger.info('⏹️ WhatsApp desconectado');
        this.emit('disconnected');
        break;
    }
  }

  /**
   * Atualiza QR code via webhook
   */
  updateQRCode(qrCodeData: string): void {
    this.qrCode = qrCodeData;
    this.emit('qr', qrCodeData);
    logger.info('📱 QR Code atualizado via webhook');
  }

  /**
   * Formata número de telefone para formato Evolution API
   * Formato esperado: 5511999999999 (sem + e sem @s.whatsapp.net)
   */
  formatPhoneNumber(phone: string): string {
    // Remove caracteres não numéricos
    let cleaned = phone.replace(/\D/g, '');

    // Remove + se tiver
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }

    // Remove @s.whatsapp.net se tiver
    if (phone.includes('@')) {
      cleaned = phone.split('@')[0];
    }

    // Se não tem código do país, adiciona Brasil (55)
    if (cleaned.length === 11) {
      cleaned = '55' + cleaned;
    }

    return cleaned;
  }

  /**
   * Extrai número de telefone limpo do JID
   */
  extractPhoneNumber(jid: string): string {
    return jid.split('@')[0].replace(/\D/g, '');
  }

  /**
   * Extrai texto da mensagem Evolution
   */
  extractMessageText(message: EvolutionMessage): string {
    if (message.message?.conversation) {
      return message.message.conversation;
    }
    if (message.message?.extendedTextMessage?.text) {
      return message.message.extendedTextMessage.text;
    }
    if (message.message?.imageMessage?.caption) {
      return message.message.imageMessage.caption;
    }
    if (message.message?.videoMessage?.caption) {
      return message.message.videoMessage.caption;
    }
    if (message.message?.documentMessage?.caption) {
      return message.message.documentMessage.caption;
    }
    return '';
  }

  // Getters
  getQRCode(): string | null {
    return this.qrCode;
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }

  getConnectionState(): EvolutionConnectionState {
    return this.connectionState;
  }

  getMyNumber(): string | null {
    return this.myNumber;
  }

  getInstanceName(): string {
    return this.instanceName;
  }

  getApiKey(): string {
    return this.apiKey;
  }

  /**
   * Retorna status completo da conexão (para rotas HTTP)
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      hasQR: !!this.qrCode,
      state: this.connectionState,
      myNumber: this.myNumber
    };
  }

  /**
   * Retorna informações da conta conectada
   */
  getAccountInfo() {
    if (!this.isConnected || !this.myNumber) {
      return null;
    }

    return {
      phone: this.myNumber,
      name: 'WhatsApp Business',
      platform: 'Evolution API'
    };
  }
}

// Singleton
const evolutionService = new EvolutionService();
export default evolutionService;
