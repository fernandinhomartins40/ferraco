/**
 * Webhook Retry Service
 *
 * T-16 (F-84/F-83): `processPendingDeliveries()` estava implementado em
 * webhook.service.ts e NUNCA era chamado — nenhum consumidor da fila de
 * retry existia. O reenvio dependia apenas de `setTimeout` em memória, que
 * se perde a cada restart do processo (e o deploy atual leva 6–20 min).
 *
 * Resultado: entregas falhas a consumidores EXTERNOS eram abandonadas
 * silenciosamente, embora o estado já estivesse persistido no banco.
 *
 * Este serviço segue o padrão de `token-cleanup.service.ts`.
 */

import { CronJob } from 'cron';
import { webhookService } from '../modules/webhooks/webhook.service';
import { logger } from '../utils/logger';

export class WebhookRetryService {
  private job: CronJob | null = null;

  // Guarda contra ciclos sobrepostos, pelo mesmo motivo de T-23: uma rodada
  // pode enfrentar timeouts de rede e exceder o intervalo do cron.
  private isProcessing = false;

  /**
   * Inicia o consumidor da fila de retry.
   * Executa a cada minuto: `processPendingDeliveries()` já filtra por
   * `nextAttemptAt <= now` e limita a 100 por rodada, então a frequência
   * alta não implica carga alta.
   */
  start(): void {
    if (this.job) {
      logger.warn('Webhook retry service já está rodando');
      return;
    }

    this.job = new CronJob(
      '* * * * *', // a cada minuto
      async () => {
        if (this.isProcessing) {
          logger.debug('⏭️  Retry de webhooks ainda em execução — tick ignorado');
          return;
        }

        this.isProcessing = true;
        try {
          await webhookService.processPendingDeliveries();
        } catch (error) {
          logger.error('❌ Erro ao processar fila de webhooks', { error });
        } finally {
          this.isProcessing = false;
        }
      },
      null,
      true, // start imediato
      'America/Sao_Paulo'
    );

    logger.info('✅ Webhook retry service iniciado (execução a cada minuto)');
  }

  /**
   * Para o consumidor.
   */
  stop(): void {
    if (this.job) {
      this.job.stop();
      this.job = null;
      this.isProcessing = false;
      logger.info('🛑 Webhook retry service parado');
    }
  }

  /**
   * Executa uma rodada manualmente (útil para testes).
   */
  async runNow(): Promise<void> {
    logger.info('🔁 Processando fila de webhooks manualmente...');
    await webhookService.processPendingDeliveries();
  }
}

export const webhookRetryService = new WebhookRetryService();
