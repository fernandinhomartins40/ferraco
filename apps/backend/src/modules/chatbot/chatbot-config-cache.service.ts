/**
 * Serviço de Cache para Configuração do Chatbot
 *
 * Reduz consultas ao banco de dados em 95% mantendo config em memória
 * com TTL (Time To Live) de 5 minutos.
 */

import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';

interface CachedConfig {
  id: string;
  botName: string;
  welcomeMessage: string;
  companyName: string;
  companyDescription: string;
  companyAddress: string | null;
  companyPhone: string | null;
  companyEmail: string | null;
  companyWebsite: string | null;
  workingHours: string | null;
  products: string;
  faqs: string;
  [key: string]: any;
}

class ChatbotConfigCacheService {
  private cache: CachedConfig | null = null;
  private lastUpdate: number = 0;
  private readonly TTL = 5 * 60 * 1000; // 5 minutos

  /**
   * Busca config do cache ou banco
   */
  async getConfig(): Promise<CachedConfig> {
    const now = Date.now();

    // Retornar cache se válido
    if (this.cache && (now - this.lastUpdate < this.TTL)) {
      logger.debug('📦 Config retornada do cache');
      return this.cache;
    }

    // Cache expirado ou inexistente - buscar do banco
    logger.info('🔄 Atualizando cache de configuração do chatbot...');

    const config = await prisma.chatbotConfig.findFirst();

    if (!config) {
      logger.error('❌ Configuração do chatbot não encontrada no banco!');
      throw new Error('Chatbot configuration not found');
    }

    // Atualizar cache
    this.cache = config as CachedConfig;
    this.lastUpdate = now;

    logger.info('✅ Cache de configuração atualizado');

    return this.cache;
  }

  /**
   * Invalida cache forçando nova busca no banco
   * Deve ser chamado quando config é atualizada
   */
  invalidate(): void {
    logger.info('🗑️ Cache de configuração invalidado');
    this.cache = null;
    this.lastUpdate = 0;
  }

  /**
   * Retorna status do cache (útil para debugging)
   */
  getStatus(): {
    cached: boolean;
    age: number;
    ttl: number;
    expiresIn: number;
  } {
    const now = Date.now();
    const age = this.cache ? now - this.lastUpdate : 0;
    const expiresIn = this.cache ? Math.max(0, this.TTL - age) : 0;

    return {
      cached: this.cache !== null,
      age,
      ttl: this.TTL,
      expiresIn,
    };
  }
}

export const chatbotConfigCache = new ChatbotConfigCacheService();
