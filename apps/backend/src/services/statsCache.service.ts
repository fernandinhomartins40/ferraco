/**
 * Statistics Cache Service
 *
 * Sistema de cache em memória para estatísticas computacionalmente caras.
 * Utiliza Map nativo do Node.js com expiração automática (TTL).
 *
 * Features:
 * - Cache por chave com TTL configurável
 * - Limpeza automática de entradas expiradas
 * - Métodos para invalidação manual
 * - Suporte a cache condicional
 *
 * Alternativa futura: Migrar para Redis em produção de alta escala
 */

import { logger } from '../utils/logger';

interface CacheEntry<T> {
  data: T;
  expiresAt: number; // timestamp em ms
  createdAt: number;
}

export class StatsCacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 30 * 1000; // 30 segundos padrão
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Iniciar limpeza automática a cada 60 segundos
    this.startCleanup();
  }

  /**
   * Armazena dados no cache com TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const ttlMs = ttl || this.defaultTTL;
    const now = Date.now();

    this.cache.set(key, {
      data,
      expiresAt: now + ttlMs,
      createdAt: now,
    });

    logger.debug(`📦 Cache SET: ${key} (TTL: ${ttlMs}ms)`);
  }

  /**
   * Recupera dados do cache
   * Retorna null se não existir ou expirou
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      logger.debug(`❌ Cache MISS: ${key}`);
      return null;
    }

    // Verificar expiração
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      logger.debug(`⏰ Cache EXPIRED: ${key}`);
      return null;
    }

    logger.debug(`✅ Cache HIT: ${key} (age: ${Date.now() - entry.createdAt}ms)`);
    return entry.data as T;
  }

  /**
   * Verifica se chave existe e não expirou
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Remove entrada do cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      logger.debug(`🗑️  Cache DELETE: ${key}`);
    }
    return deleted;
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    logger.info(`🧹 Cache CLEARED: ${size} entries removed`);
  }

  /**
   * Limpa entradas expiradas
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`🧹 Cache cleanup: ${cleaned} expired entries removed`);
    }
  }

  /**
   * Inicia limpeza automática
   */
  private startCleanup(): void {
    if (this.cleanupInterval) return;

    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000); // A cada 60 segundos

    logger.info('✅ Stats cache service started (cleanup interval: 60s)');
  }

  /**
   * Para limpeza automática
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.info('⏹️  Stats cache service stopped');
    }
  }

  /**
   * Gera chave de cache baseada em parâmetros
   */
  generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');

    return `${prefix}:${sortedParams}`;
  }

  /**
   * Wrapper para cache com fallback
   * Se não existir no cache, executa fn() e armazena o resultado
   */
  async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Tentar buscar do cache
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Executar função e armazenar resultado
    logger.debug(`🔄 Cache COMPUTING: ${key}`);
    const result = await fn();
    this.set(key, result, ttl);

    return result;
  }

  /**
   * Invalida cache por padrão (regex)
   * Ex: invalidatePattern(/^recurrence:/) invalida todas as chaves que começam com "recurrence:"
   */
  invalidatePattern(pattern: RegExp): number {
    let invalidated = 0;

    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    if (invalidated > 0) {
      logger.info(`🗑️  Cache INVALIDATED by pattern ${pattern}: ${invalidated} entries`);
    }

    return invalidated;
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats(): {
    size: number;
    keys: string[];
    oldestEntry: { key: string; age: number } | null;
  } {
    const now = Date.now();
    let oldestEntry: { key: string; age: number } | null = null;

    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.createdAt;
      if (!oldestEntry || age > oldestEntry.age) {
        oldestEntry = { key, age };
      }
    }

    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      oldestEntry,
    };
  }
}

// Singleton
export const statsCacheService = new StatsCacheService();
