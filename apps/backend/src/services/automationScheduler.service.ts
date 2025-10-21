import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { whatsappService } from './whatsappService';

const prisma = new PrismaClient();

/**
 * Serviço de Automação de Envios
 * Processa colunas de automação e envia mensagens programadas
 */
class AutomationSchedulerService {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  /**
   * Inicia o scheduler
   */
  start() {
    if (this.isRunning) {
      logger.warn('Automation scheduler já está rodando');
      return;
    }

    logger.info('🤖 Iniciando Automation Scheduler...');
    this.isRunning = true;

    // Processa a cada 30 segundos
    this.intervalId = setInterval(() => {
      this.processAutomations().catch((error) => {
        logger.error('Erro ao processar automações:', error);
      });
    }, 30000);

    // Executa imediatamente
    this.processAutomations().catch((error) => {
      logger.error('Erro ao processar automações:', error);
    });
  }

  /**
   * Para o scheduler
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    logger.info('🛑 Automation Scheduler parado');
  }

  /**
   * Processa todas as automações pendentes
   */
  async processAutomations() {
    try {
      // Buscar configurações globais
      const settings = await prisma.automationSettings.findFirst();

      if (!settings) {
        return;
      }

      // Verificar horário comercial
      if (settings.sendOnlyBusinessHours) {
        const now = new Date();
        const currentHour = now.getHours();

        if (currentHour < settings.businessHourStart || currentHour >= settings.businessHourEnd) {
          logger.debug('Fora do horário comercial, pulando processamento');
          return;
        }
      }

      // Buscar todas as posições de leads que precisam ser processadas
      const positions = await prisma.automationLeadPosition.findMany({
        where: {
          OR: [
            { nextScheduledAt: null }, // Nunca enviado
            { nextScheduledAt: { lte: new Date() } }, // Hora de enviar
          ],
        },
        include: {
          lead: true,
          column: {
            include: {
              messageTemplate: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      logger.info(`📋 Processando ${positions.length} automações pendentes`);

      for (const position of positions) {
        await this.processPosition(position, settings);
      }
    } catch (error) {
      logger.error('Erro ao processar automações:', error);
    }
  }

  /**
   * Processa uma posição individual
   */
  private async processPosition(position: any, settings: any) {
    try {
      const { lead, column } = position;

      // Verificar se WhatsApp está conectado
      const isConnected = await whatsappService.isConnected();
      if (!isConnected) {
        logger.warn('WhatsApp não conectado, pulando envio');
        return;
      }

      // Verificar limites de envio
      const canSend = await this.checkRateLimits(settings);
      if (!canSend) {
        logger.warn('Limite de envios atingido, aguardando...');
        return;
      }

      // Preparar mensagem
      let messageContent = column.messageTemplate?.content || 'Olá {{nome}}!';

      // Substituir variáveis
      messageContent = this.replaceVariables(messageContent, lead);

      // Enviar mensagem
      logger.info(`📤 Enviando mensagem para ${lead.name} (${lead.phone})`);

      await whatsappService.sendMessage(lead.phone, messageContent);

      // Enviar mídias se houver
      if (column.messageTemplate?.mediaUrls) {
        const mediaUrls = JSON.parse(column.messageTemplate.mediaUrls);
        for (const mediaUrl of mediaUrls) {
          if (column.messageTemplate.mediaType === 'IMAGE') {
            await whatsappService.sendImage(lead.phone, mediaUrl);
          } else if (column.messageTemplate.mediaType === 'VIDEO') {
            await whatsappService.sendVideo(lead.phone, mediaUrl);
          }
        }
      }

      // Atualizar posição
      await prisma.automationLeadPosition.update({
        where: { id: position.id },
        data: {
          lastSentAt: new Date(),
          nextScheduledAt: this.calculateNextSchedule(column),
          messagesSentCount: position.messagesSentCount + 1,
        },
      });

      logger.info(`✅ Mensagem enviada com sucesso para ${lead.name}`);

      // Aguardar intervalo configurado
      await this.sleep(column.sendIntervalSeconds * 1000);
    } catch (error) {
      logger.error(`Erro ao processar posição ${position.id}:`, error);
    }
  }

  /**
   * Substitui variáveis no template
   */
  private replaceVariables(content: string, lead: any): string {
    return content
      .replace(/\{\{nome\}\}/g, lead.name || '')
      .replace(/\{\{telefone\}\}/g, lead.phone || '')
      .replace(/\{\{email\}\}/g, lead.email || '')
      .replace(/\{\{empresa\}\}/g, lead.company || '');
  }

  /**
   * Calcula próximo agendamento
   */
  private calculateNextSchedule(column: any): Date | null {
    if (!column.isRecurring) {
      return null; // Envio único
    }

    // Calcular próximo mês no dia especificado
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, column.recurringDay || 1);

    return nextMonth;
  }

  /**
   * Verifica limites de taxa de envio
   */
  private async checkRateLimits(settings: any): Promise<boolean> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Contar mensagens enviadas na última hora
    const sentLastHour = await prisma.automationLeadPosition.count({
      where: {
        lastSentAt: {
          gte: oneHourAgo,
        },
      },
    });

    if (sentLastHour >= settings.maxMessagesPerHour) {
      return false;
    }

    // Contar mensagens enviadas nas últimas 24 horas
    const sentLastDay = await prisma.automationLeadPosition.count({
      where: {
        lastSentAt: {
          gte: oneDayAgo,
        },
      },
    });

    if (sentLastDay >= settings.maxMessagesPerDay) {
      return false;
    }

    return true;
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const automationSchedulerService = new AutomationSchedulerService();
