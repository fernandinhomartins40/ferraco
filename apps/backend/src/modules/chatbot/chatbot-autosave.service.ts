/**
 * Serviço de Auto-Save de Sessões do Chatbot
 *
 * Responsável por:
 * - Detectar sessões inativas há mais de 2 minutos
 * - Salvar leads parciais automaticamente
 * - Prevenir perda de dados em caso de abandono
 */

import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import { ChatbotSessionService } from './chatbot-session.service';

export class ChatbotAutosaveService {
  private chatbotSessionService: ChatbotSessionService;
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;

  constructor() {
    this.chatbotSessionService = new ChatbotSessionService();
  }

  /**
   * Inicia o serviço de auto-save (executado a cada 2 minutos)
   */
  start(intervalMinutes: number = 2) {
    if (this.isRunning) {
      logger.warn('⚠️ Auto-save service já está rodando');
      return;
    }

    this.isRunning = true;
    const intervalMs = intervalMinutes * 60 * 1000;

    logger.info(`🚀 Iniciando auto-save service (intervalo: ${intervalMinutes} minutos)`);

    // Executar imediatamente na inicialização
    this.checkInactiveSessions();

    // Depois executar periodicamente
    this.intervalId = setInterval(() => {
      this.checkInactiveSessions();
    }, intervalMs);
  }

  /**
   * Para o serviço de auto-save
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      this.isRunning = false;
      logger.info('🛑 Auto-save service parado');
    }
  }

  /**
   * Verifica sessões inativas e tenta salvar leads parciais
   */
  private async checkInactiveSessions() {
    try {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

      // Buscar sessões ativas mas sem atividade há 2+ minutos
      const inactiveSessions = await prisma.chatbotSession.findMany({
        where: {
          isActive: true,
          leadId: null, // Ainda não criou lead
          capturedName: { not: null }, // Tem nome
          capturedPhone: { not: null }, // Tem telefone
          updatedAt: { lt: twoMinutesAgo }, // Sem atividade há 2+ minutos
        },
        select: {
          sessionId: true,
          capturedName: true,
          capturedPhone: true,
          updatedAt: true,
        },
      });

      if (inactiveSessions.length === 0) {
        logger.debug('✅ Nenhuma sessão inativa com dados a salvar');
        return;
      }

      logger.info(`💾 Encontradas ${inactiveSessions.length} sessões inativas - tentando auto-save`);

      let savedCount = 0;
      for (const session of inactiveSessions) {
        const minutesInactive = Math.floor(
          (Date.now() - session.updatedAt.getTime()) / (60 * 1000)
        );

        logger.info(
          `🔍 Sessão ${session.sessionId}: ${session.capturedName} (${session.capturedPhone}) - ${minutesInactive}min inativa`
        );

        const saved = await this.chatbotSessionService.savePartialLead(session.sessionId);
        if (saved) {
          savedCount++;
        }
      }

      logger.info(`✅ Auto-save concluído: ${savedCount}/${inactiveSessions.length} leads salvos`);
    } catch (error) {
      logger.error('❌ Erro ao verificar sessões inativas:', error);
    }
  }

  /**
   * Força verificação imediata (útil para testes)
   */
  async checkNow(): Promise<void> {
    await this.checkInactiveSessions();
  }
}

// Instância singleton
export const chatbotAutosaveService = new ChatbotAutosaveService();
