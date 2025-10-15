/**
 * WhatsApp Rate Limiting Middleware
 *
 * Previne banimento do WhatsApp limitando:
 * - Mensagens por minuto
 * - Mensagens por hora
 * - Mensagens para números novos
 * - Ações em grupos
 *
 * Baseado nas melhores práticas do WhatsApp Business API
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface RateLimitStore {
  count: number;
  resetTime: number;
  firstRequest: number;
}

class WhatsAppRateLimiter {
  // Limites por endpoint
  private limits = {
    // Mensagens individuais
    'send-message': {
      perMinute: 20,    // Máximo 20 mensagens por minuto
      perHour: 1000,    // Máximo 1000 mensagens por hora
      burst: 5,         // Máximo 5 mensagens em burst (3 segundos)
    },
    // Mensagens em grupo
    'group-message': {
      perMinute: 10,    // Mais conservador para grupos
      perHour: 500,
      burst: 3,
    },
    // Ações de grupo (adicionar, remover, etc.)
    'group-action': {
      perMinute: 5,
      perHour: 100,
      burst: 2,
    },
    // Alterações de perfil
    'profile-change': {
      perMinute: 2,
      perHour: 20,
      burst: 1,
    },
    // Status/Stories
    'status-post': {
      perMinute: 5,
      perHour: 50,
      burst: 2,
    },
    // Consultas (verificar números, listar contatos, etc.)
    'query': {
      perMinute: 30,
      perHour: 2000,
      burst: 10,
    },
  };

  // Armazenamento de contadores por IP/usuário
  private store: Map<string, RateLimitStore> = new Map();
  private burstStore: Map<string, number[]> = new Map();

  /**
   * Middleware de rate limiting
   */
  limit(category: keyof typeof this.limits) {
    return (req: Request, res: Response, next: NextFunction) => {
      const key = this.getKey(req, category);
      const now = Date.now();

      // Verificar burst (múltiplas requisições em poucos segundos)
      if (!this.checkBurst(key, category, now)) {
        logger.warn(`⚠️ Rate limit BURST excedido: ${key} [${category}]`);
        return res.status(429).json({
          error: 'Muitas requisições em pouco tempo',
          message: 'Aguarde alguns segundos antes de tentar novamente',
          retryAfter: 3,
        });
      }

      // Verificar limite por minuto
      const minuteKey = `${key}:minute`;
      if (!this.checkLimit(minuteKey, this.limits[category].perMinute, 60 * 1000, now)) {
        logger.warn(`⚠️ Rate limit POR MINUTO excedido: ${key} [${category}]`);
        return res.status(429).json({
          error: 'Limite de requisições por minuto excedido',
          message: `Máximo ${this.limits[category].perMinute} requisições por minuto`,
          retryAfter: this.getRetryAfter(minuteKey),
        });
      }

      // Verificar limite por hora
      const hourKey = `${key}:hour`;
      if (!this.checkLimit(hourKey, this.limits[category].perHour, 60 * 60 * 1000, now)) {
        logger.warn(`⚠️ Rate limit POR HORA excedido: ${key} [${category}]`);
        return res.status(429).json({
          error: 'Limite de requisições por hora excedido',
          message: `Máximo ${this.limits[category].perHour} requisições por hora`,
          retryAfter: this.getRetryAfter(hourKey),
        });
      }

      // Adicionar headers de rate limit
      res.setHeader('X-RateLimit-Category', category);
      res.setHeader('X-RateLimit-Minute-Limit', this.limits[category].perMinute);
      res.setHeader('X-RateLimit-Hour-Limit', this.limits[category].perHour);
      res.setHeader('X-RateLimit-Minute-Remaining', this.getRemainingMinute(minuteKey, this.limits[category].perMinute));
      res.setHeader('X-RateLimit-Hour-Remaining', this.getRemainingHour(hourKey, this.limits[category].perHour));

      next();
    };
  }

  /**
   * Gerar chave única para o usuário/IP
   */
  private getKey(req: Request, category: string): string {
    // Usar ID do usuário se autenticado, senão usar IP
    const userId = (req as any).user?.id || 'anonymous';
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return `whatsapp:${category}:${userId}:${ip}`;
  }

  /**
   * Verificar limite de burst (múltiplas requisições rápidas)
   */
  private checkBurst(key: string, category: keyof typeof this.limits, now: number): boolean {
    const burstKey = `${key}:burst`;
    const burstWindow = 3000; // 3 segundos
    const burstLimit = this.limits[category].burst;

    // Obter timestamps das requisições recentes
    let timestamps = this.burstStore.get(burstKey) || [];

    // Remover timestamps antigos
    timestamps = timestamps.filter(ts => now - ts < burstWindow);

    // Verificar se excedeu o burst
    if (timestamps.length >= burstLimit) {
      return false;
    }

    // Adicionar timestamp atual
    timestamps.push(now);
    this.burstStore.set(burstKey, timestamps);

    return true;
  }

  /**
   * Verificar limite (genérico)
   */
  private checkLimit(key: string, limit: number, window: number, now: number): boolean {
    let store = this.store.get(key);

    // Criar novo registro se não existir
    if (!store) {
      store = {
        count: 0,
        resetTime: now + window,
        firstRequest: now,
      };
      this.store.set(key, store);
    }

    // Resetar contadores se a janela expirou
    if (now >= store.resetTime) {
      store.count = 0;
      store.resetTime = now + window;
      store.firstRequest = now;
    }

    // Incrementar contador
    store.count++;

    // Verificar se excedeu o limite
    return store.count <= limit;
  }

  /**
   * Obter tempo para retry (em segundos)
   */
  private getRetryAfter(key: string): number {
    const store = this.store.get(key);
    if (!store) return 60;

    const now = Date.now();
    const remaining = Math.ceil((store.resetTime - now) / 1000);
    return Math.max(1, remaining);
  }

  /**
   * Obter requisições restantes no minuto
   */
  private getRemainingMinute(key: string, limit: number): number {
    const store = this.store.get(key);
    if (!store) return limit;
    return Math.max(0, limit - store.count);
  }

  /**
   * Obter requisições restantes na hora
   */
  private getRemainingHour(key: string, limit: number): number {
    const store = this.store.get(key);
    if (!store) return limit;
    return Math.max(0, limit - store.count);
  }

  /**
   * Limpar armazenamento antigo (executar periodicamente)
   */
  cleanup(): void {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hora

    // Limpar store principal
    for (const [key, store] of this.store.entries()) {
      if (now - store.firstRequest > maxAge) {
        this.store.delete(key);
      }
    }

    // Limpar burst store
    for (const [key, timestamps] of this.burstStore.entries()) {
      const filtered = timestamps.filter(ts => now - ts < 3000);
      if (filtered.length === 0) {
        this.burstStore.delete(key);
      } else {
        this.burstStore.set(key, filtered);
      }
    }

    logger.debug(`🧹 Rate limiter cleanup: ${this.store.size} stores, ${this.burstStore.size} burst stores`);
  }

  /**
   * Obter estatísticas
   */
  getStats(): any {
    return {
      totalStores: this.store.size,
      totalBurstStores: this.burstStore.size,
      limits: this.limits,
    };
  }
}

// Instância singleton
export const whatsappRateLimiter = new WhatsAppRateLimiter();

// Limpar armazenamento a cada 10 minutos
setInterval(() => {
  whatsappRateLimiter.cleanup();
}, 10 * 60 * 1000);

// Middlewares exportáveis
export const sendMessageRateLimit = whatsappRateLimiter.limit('send-message');
export const groupMessageRateLimit = whatsappRateLimiter.limit('group-message');
export const groupActionRateLimit = whatsappRateLimiter.limit('group-action');
export const profileChangeRateLimit = whatsappRateLimiter.limit('profile-change');
export const statusPostRateLimit = whatsappRateLimiter.limit('status-post');
export const queryRateLimit = whatsappRateLimiter.limit('query');
