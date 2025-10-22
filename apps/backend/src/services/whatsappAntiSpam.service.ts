/**
 * WhatsApp Anti-Spam Protection Service
 *
 * Sistema de proteção contra banimento do WhatsApp com múltiplas camadas:
 * - Rate limiting (sliding window)
 * - Horário comercial
 * - Delays humanizados
 * - Detecção de padrões suspeitos
 * - Circuit breaker
 *
 * Baseado nas melhores práticas do WhatsApp Business API
 */

import { prisma } from '../config/database';
import { logger } from '../utils/logger';

// ============================================================================
// Configurações de Segurança (ajustáveis conforme necessidade)
// ============================================================================

const LIMITS = {
  // Limites por janela de tempo (sliding window)
  PER_MINUTE: 12,           // Máximo 12 mensagens por minuto (WhatsApp recomenda 10-15)
  PER_HOUR: 200,            // Máximo 200 mensagens por hora
  PER_DAY: 1000,            // Máximo 1000 mensagens por dia

  // Limites por destinatário
  PER_CONTACT_PER_DAY: 5,   // Máximo 5 mensagens para o mesmo contato por dia

  // Delays entre mensagens (em milissegundos)
  MIN_DELAY_BETWEEN_MESSAGES: 2000,    // 2 segundos (mínimo)
  MAX_DELAY_BETWEEN_MESSAGES: 8000,    // 8 segundos (máximo)

  DELAY_BETWEEN_AUTOMATIONS: 30000,    // 30 segundos entre automações diferentes
  DELAY_AFTER_MEDIA: 5000,             // 5 segundos após enviar mídia

  // Horário comercial (formato 24h)
  BUSINESS_HOURS: {
    START: 8,   // 08:00
    END: 20,    // 20:00
  },

  // Circuit breaker
  MAX_FAILURES_BEFORE_PAUSE: 5,        // Pausa após 5 falhas consecutivas
  PAUSE_DURATION_MS: 300000,           // Pausa por 5 minutos após muitas falhas
};

// ============================================================================
// Tipos
// ============================================================================

interface MessageRecord {
  timestamp: Date;
  phone: string;
  automationId: string;
  success: boolean;
}

interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  retryAfter?: number; // segundos até poder tentar novamente
  currentCount?: number;
  limit?: number;
}

// ============================================================================
// WhatsAppAntiSpamService
// ============================================================================

export class WhatsAppAntiSpamService {
  private messageHistory: MessageRecord[] = [];
  private failureCount = 0;
  private isPaused = false;
  private pausedUntil: Date | null = null;
  private lastAutomationTimestamp: Date | null = null;

  /**
   * Verifica se pode enviar mensagem agora
   */
  async canSendMessage(phone: string, automationId: string): Promise<RateLimitResult> {
    // 1. Verificar circuit breaker
    if (this.isPaused && this.pausedUntil) {
      const now = new Date();
      if (now < this.pausedUntil) {
        const secondsRemaining = Math.ceil((this.pausedUntil.getTime() - now.getTime()) / 1000);
        return {
          allowed: false,
          reason: `Sistema em pausa devido a falhas consecutivas. Aguarde ${secondsRemaining}s.`,
          retryAfter: secondsRemaining
        };
      } else {
        // Pausa terminou, resetar
        this.isPaused = false;
        this.pausedUntil = null;
        this.failureCount = 0;
        logger.info('✅ Circuit breaker resetado - sistema retomando envios');
      }
    }

    // 2. Verificar horário comercial
    const businessHourCheck = this.isBusinessHours();
    if (!businessHourCheck.allowed) {
      return businessHourCheck;
    }

    // 3. Verificar delay entre automações
    if (this.lastAutomationTimestamp) {
      const timeSinceLastAutomation = Date.now() - this.lastAutomationTimestamp.getTime();
      if (timeSinceLastAutomation < LIMITS.DELAY_BETWEEN_AUTOMATIONS) {
        const remainingMs = LIMITS.DELAY_BETWEEN_AUTOMATIONS - timeSinceLastAutomation;
        return {
          allowed: false,
          reason: 'Aguardando intervalo mínimo entre automações',
          retryAfter: Math.ceil(remainingMs / 1000)
        };
      }
    }

    // 4. Limpar histórico antigo (older than 24h)
    this.cleanupOldRecords();

    // 5. Verificar limites por minuto
    const perMinuteCheck = this.checkPerMinuteLimit();
    if (!perMinuteCheck.allowed) return perMinuteCheck;

    // 6. Verificar limites por hora
    const perHourCheck = this.checkPerHourLimit();
    if (!perHourCheck.allowed) return perHourCheck;

    // 7. Verificar limites por dia
    const perDayCheck = this.checkPerDayLimit();
    if (!perDayCheck.allowed) return perDayCheck;

    // 8. Verificar limites por contato
    const perContactCheck = this.checkPerContactLimit(phone);
    if (!perContactCheck.allowed) return perContactCheck;

    // 9. Verificar padrões suspeitos (burst detection)
    const burstCheck = this.detectBurstPattern();
    if (!burstCheck.allowed) return burstCheck;

    // ✅ Tudo OK - pode enviar
    return { allowed: true };
  }

  /**
   * Registra mensagem enviada
   */
  recordMessage(phone: string, automationId: string, success: boolean): void {
    this.messageHistory.push({
      timestamp: new Date(),
      phone,
      automationId,
      success
    });

    this.lastAutomationTimestamp = new Date();

    if (!success) {
      this.failureCount++;
      logger.warn(`⚠️ Falha registrada (${this.failureCount}/${LIMITS.MAX_FAILURES_BEFORE_PAUSE})`);

      // Ativar circuit breaker se muitas falhas
      if (this.failureCount >= LIMITS.MAX_FAILURES_BEFORE_PAUSE) {
        this.activateCircuitBreaker();
      }
    } else {
      // Reset failure count em sucesso
      this.failureCount = 0;
    }

    // Log de estatísticas a cada 50 mensagens
    if (this.messageHistory.length % 50 === 0) {
      this.logStats();
    }
  }

  /**
   * Calcula delay humanizado entre mensagens
   */
  getHumanizedDelay(isMedia: boolean = false): number {
    // Delay base variável para parecer humano
    const baseDelay = LIMITS.MIN_DELAY_BETWEEN_MESSAGES +
      Math.random() * (LIMITS.MAX_DELAY_BETWEEN_MESSAGES - LIMITS.MIN_DELAY_BETWEEN_MESSAGES);

    // Delay adicional para mídia
    const mediaDelay = isMedia ? LIMITS.DELAY_AFTER_MEDIA : 0;

    // Variação aleatória ±20%
    const randomVariation = 0.8 + Math.random() * 0.4;

    return Math.floor((baseDelay + mediaDelay) * randomVariation);
  }

  /**
   * Obtém estatísticas de uso
   */
  getStats(): {
    messagesLastMinute: number;
    messagesLastHour: number;
    messagesLastDay: number;
    failureRate: number;
    isPaused: boolean;
    pausedUntil: Date | null;
  } {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const messagesLastMinute = this.messageHistory.filter(m => m.timestamp.getTime() > oneMinuteAgo).length;
    const messagesLastHour = this.messageHistory.filter(m => m.timestamp.getTime() > oneHourAgo).length;
    const messagesLastDay = this.messageHistory.filter(m => m.timestamp.getTime() > oneDayAgo).length;

    const totalMessages = this.messageHistory.length;
    const failedMessages = this.messageHistory.filter(m => !m.success).length;
    const failureRate = totalMessages > 0 ? (failedMessages / totalMessages) * 100 : 0;

    return {
      messagesLastMinute,
      messagesLastHour,
      messagesLastDay,
      failureRate,
      isPaused: this.isPaused,
      pausedUntil: this.pausedUntil
    };
  }

  /**
   * Reset manual (emergência)
   */
  reset(): void {
    this.messageHistory = [];
    this.failureCount = 0;
    this.isPaused = false;
    this.pausedUntil = null;
    this.lastAutomationTimestamp = null;
    logger.warn('🔄 Anti-spam service resetado manualmente');
  }

  // ============================================================================
  // Métodos Privados
  // ============================================================================

  /**
   * Verifica se está dentro do horário comercial
   */
  private isBusinessHours(): RateLimitResult {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay(); // 0 = Domingo, 6 = Sábado

    // Verificar final de semana
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return {
        allowed: false,
        reason: 'Envio pausado durante o final de semana',
        retryAfter: this.getSecondsUntilMonday()
      };
    }

    // Verificar horário
    if (hour < LIMITS.BUSINESS_HOURS.START || hour >= LIMITS.BUSINESS_HOURS.END) {
      return {
        allowed: false,
        reason: `Envio pausado fora do horário comercial (${LIMITS.BUSINESS_HOURS.START}h-${LIMITS.BUSINESS_HOURS.END}h)`,
        retryAfter: this.getSecondsUntilBusinessHours()
      };
    }

    return { allowed: true };
  }

  /**
   * Verifica limite por minuto
   */
  private checkPerMinuteLimit(): RateLimitResult {
    const oneMinuteAgo = Date.now() - 60 * 1000;
    const count = this.messageHistory.filter(m => m.timestamp.getTime() > oneMinuteAgo).length;

    if (count >= LIMITS.PER_MINUTE) {
      return {
        allowed: false,
        reason: 'Limite por minuto atingido',
        retryAfter: 60,
        currentCount: count,
        limit: LIMITS.PER_MINUTE
      };
    }

    return { allowed: true };
  }

  /**
   * Verifica limite por hora
   */
  private checkPerHourLimit(): RateLimitResult {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const count = this.messageHistory.filter(m => m.timestamp.getTime() > oneHourAgo).length;

    if (count >= LIMITS.PER_HOUR) {
      return {
        allowed: false,
        reason: 'Limite por hora atingido',
        retryAfter: 3600,
        currentCount: count,
        limit: LIMITS.PER_HOUR
      };
    }

    return { allowed: true };
  }

  /**
   * Verifica limite por dia
   */
  private checkPerDayLimit(): RateLimitResult {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const count = this.messageHistory.filter(m => m.timestamp.getTime() > oneDayAgo).length;

    if (count >= LIMITS.PER_DAY) {
      return {
        allowed: false,
        reason: 'Limite diário atingido',
        retryAfter: 86400,
        currentCount: count,
        limit: LIMITS.PER_DAY
      };
    }

    return { allowed: true };
  }

  /**
   * Verifica limite por contato
   */
  private checkPerContactLimit(phone: string): RateLimitResult {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const count = this.messageHistory.filter(
      m => m.timestamp.getTime() > oneDayAgo && m.phone === phone
    ).length;

    if (count >= LIMITS.PER_CONTACT_PER_DAY) {
      return {
        allowed: false,
        reason: `Limite de mensagens para ${phone} atingido hoje`,
        retryAfter: 86400,
        currentCount: count,
        limit: LIMITS.PER_CONTACT_PER_DAY
      };
    }

    return { allowed: true };
  }

  /**
   * Detecta padrão de burst (envio muito rápido)
   */
  private detectBurstPattern(): RateLimitResult {
    const last10Seconds = Date.now() - 10 * 1000;
    const recentMessages = this.messageHistory.filter(m => m.timestamp.getTime() > last10Seconds);

    // Se enviou mais de 5 mensagens em 10 segundos, é suspeito
    if (recentMessages.length > 5) {
      logger.warn(`⚠️ Padrão de burst detectado: ${recentMessages.length} mensagens em 10s`);
      return {
        allowed: false,
        reason: 'Padrão de envio muito rápido detectado (proteção anti-burst)',
        retryAfter: 30
      };
    }

    return { allowed: true };
  }

  /**
   * Ativa circuit breaker
   */
  private activateCircuitBreaker(): void {
    this.isPaused = true;
    this.pausedUntil = new Date(Date.now() + LIMITS.PAUSE_DURATION_MS);

    logger.error(
      `🚨 CIRCUIT BREAKER ATIVADO - Sistema pausado por ${LIMITS.PAUSE_DURATION_MS / 1000}s devido a ${this.failureCount} falhas consecutivas`
    );
  }

  /**
   * Limpa registros antigos (>24h)
   */
  private cleanupOldRecords(): void {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const initialLength = this.messageHistory.length;

    this.messageHistory = this.messageHistory.filter(m => m.timestamp.getTime() > oneDayAgo);

    const cleaned = initialLength - this.messageHistory.length;
    if (cleaned > 0) {
      logger.debug(`🧹 ${cleaned} registros antigos removidos do histórico`);
    }
  }

  /**
   * Calcula segundos até segunda-feira 8h
   */
  private getSecondsUntilMonday(): number {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;

    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + daysUntilMonday);
    nextMonday.setHours(LIMITS.BUSINESS_HOURS.START, 0, 0, 0);

    return Math.ceil((nextMonday.getTime() - now.getTime()) / 1000);
  }

  /**
   * Calcula segundos até próximo horário comercial
   */
  private getSecondsUntilBusinessHours(): number {
    const now = new Date();
    const hour = now.getHours();

    let nextBusinessHour = new Date(now);

    if (hour < LIMITS.BUSINESS_HOURS.START) {
      // Antes do horário, aguardar até START
      nextBusinessHour.setHours(LIMITS.BUSINESS_HOURS.START, 0, 0, 0);
    } else {
      // Após o horário, aguardar até amanhã START
      nextBusinessHour.setDate(now.getDate() + 1);
      nextBusinessHour.setHours(LIMITS.BUSINESS_HOURS.START, 0, 0, 0);
    }

    return Math.ceil((nextBusinessHour.getTime() - now.getTime()) / 1000);
  }

  /**
   * Log de estatísticas
   */
  private logStats(): void {
    const stats = this.getStats();
    logger.info('📊 Estatísticas Anti-Spam:', {
      messagesLastMinute: `${stats.messagesLastMinute}/${LIMITS.PER_MINUTE}`,
      messagesLastHour: `${stats.messagesLastHour}/${LIMITS.PER_HOUR}`,
      messagesLastDay: `${stats.messagesLastDay}/${LIMITS.PER_DAY}`,
      failureRate: `${stats.failureRate.toFixed(2)}%`,
      isPaused: stats.isPaused
    });
  }
}

export const whatsappAntiSpamService = new WhatsAppAntiSpamService();
