/**
 * Token Cleanup Service
 * Serviço para limpeza automática de tokens expirados
 */

import { CronJob } from 'cron';
import { refreshTokenService } from '../modules/auth/refresh-token.service';
import { logger } from '../utils/logger';

export class TokenCleanupService {
  private job: CronJob | null = null;

  /**
   * Iniciar serviço de limpeza automática
   * Executa todos os dias às 3h da manhã
   */
  start() {
    // Executar limpeza todo dia às 3h da manhã (horário de São Paulo)
    this.job = new CronJob(
      '0 3 * * *',
      async () => {
        try {
          logger.info('🧹 Iniciando limpeza automática de tokens expirados...');
          const count = await refreshTokenService.cleanupExpiredTokens();
          logger.info(`✅ ${count} tokens expirados removidos com sucesso`);
        } catch (error) {
          logger.error('❌ Erro na limpeza automática de tokens', { error });
        }
      },
      null,
      true, // Start imediatamente
      'America/Sao_Paulo'
    );

    logger.info('✅ Token cleanup service iniciado (execução diária às 3h)');
  }

  /**
   * Parar serviço de limpeza automática
   */
  stop() {
    if (this.job) {
      this.job.stop();
      logger.info('🛑 Token cleanup service parado');
    }
  }

  /**
   * Executar limpeza manualmente (útil para testes)
   */
  async runNow(): Promise<number> {
    logger.info('🧹 Executando limpeza manual de tokens...');
    const count = await refreshTokenService.cleanupExpiredTokens();
    logger.info(`✅ ${count} tokens removidos`);
    return count;
  }
}

export const tokenCleanupService = new TokenCleanupService();
