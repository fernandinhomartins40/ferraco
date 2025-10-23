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
        // Converter para horário de São Paulo (UTC-3)
        const now = new Date();

        // Criar data no timezone de São Paulo
        const brazilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
        const currentHourBrazil = brazilTime.getHours();
        const currentMinuteBrazil = brazilTime.getMinutes();

        logger.info(
          `⏰ Verificação de horário comercial:` +
          `\n  - Hora UTC: ${now.getUTCHours()}:${now.getUTCMinutes().toString().padStart(2, '0')}` +
          `\n  - Hora Brasil: ${currentHourBrazil}:${currentMinuteBrazil.toString().padStart(2, '0')}` +
          `\n  - Horário comercial: ${settings.businessHourStart}h-${settings.businessHourEnd}h`
        );

        if (currentHourBrazil < settings.businessHourStart || currentHourBrazil >= settings.businessHourEnd) {
          logger.info(
            `❌ Fora do horário comercial (Brasil: ${currentHourBrazil}h, Comercial: ${settings.businessHourStart}h-${settings.businessHourEnd}h)`
          );
          return;
        }

        logger.info(
          `✅ Dentro do horário comercial (Brasil: ${currentHourBrazil}h, Comercial: ${settings.businessHourStart}h-${settings.businessHourEnd}h)`
        );
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

      // ========================================
      // PROTEÇÃO ANTI-SPAM: Verificar se já enviou recentemente
      // ========================================
      if (position.lastSentAt && column.recurrenceType !== 'NONE') {
        const isWithinRecurrencePeriod = this.isWithinRecurrencePeriod(
          position.lastSentAt,
          column.recurrenceType,
          column
        );

        if (isWithinRecurrencePeriod) {
          logger.debug(
            `⏭️  Lead ${lead.name} já recebeu mensagem recentemente (último envio: ${position.lastSentAt}). ` +
            `Aguardando próximo período de recorrência.`
          );
          return;
        }
      }

      // Verificar se WhatsApp está conectado
      const isConnected = whatsappService.isWhatsAppConnected();
      if (!isConnected) {
        logger.warn('WhatsApp não conectado, pulando envio');

        // Atualizar status para WHATSAPP_DISCONNECTED
        await prisma.automationLeadPosition.update({
          where: { id: position.id },
          data: {
            status: 'WHATSAPP_DISCONNECTED',
            lastAttemptAt: new Date(),
            lastError: 'WhatsApp não está conectado. Escaneie o QR Code para reconectar.',
          },
        });

        return;
      }

      // Verificar limites de envio
      const canSend = await this.checkRateLimits(settings);
      if (!canSend) {
        logger.warn('Limite de envios atingido, aguardando...');

        // Atualizar status para SCHEDULED
        await prisma.automationLeadPosition.update({
          where: { id: position.id },
          data: {
            status: 'SCHEDULED',
            lastAttemptAt: new Date(),
            lastError: 'Limite de envios atingido. Aguardando próximo ciclo.',
          },
        });

        return;
      }

      // Marcar como SENDING
      await prisma.automationLeadPosition.update({
        where: { id: position.id },
        data: {
          status: 'SENDING',
          lastAttemptAt: new Date(),
        },
      });

      // Preparar mensagem
      let messageContent = column.messageTemplate?.content || 'Olá {{nome}}!';

      // Substituir variáveis
      messageContent = this.replaceVariables(messageContent, lead);

      // Enviar mensagem
      logger.info(`📤 Enviando mensagem para ${lead.name} (${lead.phone})`);

      await whatsappService.sendTextMessage(lead.phone, messageContent);

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

      // Calcular próximo agendamento
      const nextSchedule = this.calculateNextSchedule(column);

      // Se não houver recorrência (NONE), remover lead da coluna de automação
      if (column.recurrenceType === 'NONE' && !nextSchedule) {
        await prisma.automationLeadPosition.delete({
          where: { id: position.id },
        });

        logger.info(
          `✅ Mensagem enviada com sucesso para ${lead.name}. ` +
          `Lead removido da automação (envio único sem recorrência).`
        );
      } else {
        // Atualizar posição como SENT
        await prisma.automationLeadPosition.update({
          where: { id: position.id },
          data: {
            status: 'SENT',
            lastSentAt: new Date(),
            nextScheduledAt: nextSchedule,
            messagesSentCount: position.messagesSentCount + 1,
            lastError: null, // Limpar erro anterior
          },
        });

        logger.info(
          `✅ Mensagem enviada com sucesso para ${lead.name}. ` +
          `Próximo envio: ${nextSchedule ? nextSchedule.toLocaleString('pt-BR') : 'Não agendado'}`
        );
      }

      // Aguardar intervalo configurado
      await this.sleep(column.sendIntervalSeconds * 1000);
    } catch (error) {
      logger.error(`Erro ao processar posição ${position.id}:`, error);

      // Atualizar status como FAILED
      await prisma.automationLeadPosition.update({
        where: { id: position.id },
        data: {
          status: 'FAILED',
          lastAttemptAt: new Date(),
          lastError: error instanceof Error ? error.message : 'Erro desconhecido ao enviar mensagem',
        },
      });
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
   * Calcula próximo agendamento baseado no tipo de recorrência
   */
  private calculateNextSchedule(column: any): Date | null {
    const recurrenceType = column.recurrenceType || 'NONE';

    // Backward compatibility: checar isRecurring antigo
    if (column.isRecurring && recurrenceType === 'NONE') {
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, column.recurringDay || 1);
      return nextMonth;
    }

    const now = new Date();

    switch (recurrenceType) {
      case 'NONE':
        return null; // Envio único

      case 'DAILY':
        // Próximo dia, mesma hora
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;

      case 'WEEKLY':
        // Próximo dia da semana configurado
        if (!column.weekDays) return null;

        const weekDays = JSON.parse(column.weekDays); // [0,1,2,3,4,5,6]
        const currentDay = now.getDay();

        // Encontrar próximo dia da semana na lista
        let daysUntilNext = 7; // Default: próxima semana
        for (const day of weekDays.sort((a: number, b: number) => a - b)) {
          const diff = day - currentDay;
          if (diff > 0 && diff < daysUntilNext) {
            daysUntilNext = diff;
          }
        }

        // Se não encontrou na semana atual, pega o primeiro da próxima semana
        if (daysUntilNext === 7) {
          daysUntilNext = (7 - currentDay) + weekDays[0];
        }

        const nextWeekDay = new Date(now);
        nextWeekDay.setDate(nextWeekDay.getDate() + daysUntilNext);
        return nextWeekDay;

      case 'MONTHLY':
        // Próximo mês, dia específico
        if (!column.monthDay) return null;

        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, column.monthDay);
        return nextMonth;

      case 'CUSTOM_DATES':
        // Próxima data customizada
        if (!column.customDates) return null;

        const dates = JSON.parse(column.customDates).map((d: string) => new Date(d));
        const futureDates = dates.filter((d: Date) => d > now).sort((a: Date, b: Date) => a.getTime() - b.getTime());

        return futureDates.length > 0 ? futureDates[0] : null;

      case 'DAYS_FROM_NOW':
        // X dias a partir de agora
        if (!column.daysFromNow) return null;

        const futureDate = new Date(now);
        futureDate.setDate(futureDate.getDate() + column.daysFromNow);
        return futureDate;

      default:
        return null;
    }
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
   * Verifica se o último envio está dentro do período de recorrência atual
   * Retorna true se já enviou recentemente (bloqueia reenvio)
   * Retorna false se pode enviar novamente
   */
  private isWithinRecurrencePeriod(lastSentAt: Date, recurrenceType: string, column: any): boolean {
    const now = new Date();
    const lastSent = new Date(lastSentAt);

    switch (recurrenceType) {
      case 'NONE':
        // Envio único: se já enviou uma vez, bloquear
        return true;

      case 'DAILY':
        // Verificar se já enviou hoje
        const isSameDay =
          lastSent.getDate() === now.getDate() &&
          lastSent.getMonth() === now.getMonth() &&
          lastSent.getFullYear() === now.getFullYear();
        return isSameDay;

      case 'WEEKLY':
        // Verificar se já enviou nesta semana
        const weekDays = column.weekDays ? JSON.parse(column.weekDays) : [];
        const currentDay = now.getDay();

        // Se hoje é um dia de envio configurado
        if (weekDays.includes(currentDay)) {
          // Verificar se já enviou hoje
          const isSameDayWeekly =
            lastSent.getDate() === now.getDate() &&
            lastSent.getMonth() === now.getMonth() &&
            lastSent.getFullYear() === now.getFullYear();
          return isSameDayWeekly;
        }
        return false;

      case 'MONTHLY':
        // Verificar se já enviou este mês no dia configurado
        const monthDay = column.monthDay || 1;
        const isSameMonth =
          lastSent.getMonth() === now.getMonth() &&
          lastSent.getFullYear() === now.getFullYear() &&
          lastSent.getDate() === monthDay;
        return isSameMonth;

      case 'CUSTOM_DATES':
        // Para datas customizadas, verificar se já enviou hoje
        const isSameDayCustom =
          lastSent.getDate() === now.getDate() &&
          lastSent.getMonth() === now.getMonth() &&
          lastSent.getFullYear() === now.getFullYear();
        return isSameDayCustom;

      case 'DAYS_FROM_NOW':
        // Verificar se já passaram X dias desde o último envio
        const daysFromNow = column.daysFromNow || 0;
        const daysSinceLastSent = Math.floor((now.getTime() - lastSent.getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceLastSent < daysFromNow;

      default:
        return false;
    }
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Reinicia envio de um lead específico (reseta status para PENDING)
   * IMPORTANTE: Usado APENAS para reenvio em caso de falhas (FAILED, WHATSAPP_DISCONNECTED)
   * O retry NÃO bypassa a verificação de período de recorrência
   */
  async retryLead(leadId: string): Promise<void> {
    // Buscar posição atual
    const position = await prisma.automationLeadPosition.findUnique({
      where: { leadId },
      include: { column: true },
    });

    if (!position) {
      logger.error(`Lead ${leadId} não encontrado na automação`);
      return;
    }

    // Permitir retry apenas para status de falha
    if (!['FAILED', 'WHATSAPP_DISCONNECTED'].includes(position.status)) {
      logger.warn(
        `Retry ignorado para lead ${leadId}: status atual é ${position.status}. ` +
        `Retry é permitido apenas para leads com status FAILED ou WHATSAPP_DISCONNECTED.`
      );
      return;
    }

    await prisma.automationLeadPosition.update({
      where: { leadId },
      data: {
        status: 'PENDING',
        lastError: null,
        nextScheduledAt: new Date(), // Enviar imediatamente
      },
    });

    logger.info(`🔄 Retry solicitado para lead ${leadId} (status anterior: ${position.status})`);
  }

  /**
   * Reinicia envio de todos os leads de uma coluna específica
   * IMPORTANTE: Respeita intervalo de envio para evitar banimento WhatsApp
   */
  async retryColumn(columnId: string): Promise<void> {
    // Buscar coluna para obter sendIntervalSeconds
    const column = await prisma.automationKanbanColumn.findUnique({
      where: { id: columnId },
    });

    if (!column) {
      logger.error(`Coluna ${columnId} não encontrada`);
      return;
    }

    // Buscar todos os leads com falha nesta coluna
    const failedLeads = await prisma.automationLeadPosition.findMany({
      where: {
        columnId,
        status: { in: ['FAILED', 'WHATSAPP_DISCONNECTED'] },
      },
      orderBy: {
        createdAt: 'asc', // Priorizar leads mais antigos
      },
    });

    if (failedLeads.length === 0) {
      logger.info(`Nenhum lead com falha encontrado na coluna ${columnId}`);
      return;
    }

    // Distribuir envios respeitando intervalo configurado
    const intervalSeconds = column.sendIntervalSeconds || 60;
    const now = new Date();

    for (let i = 0; i < failedLeads.length; i++) {
      const scheduledTime = new Date(now.getTime() + (i * intervalSeconds * 1000));

      await prisma.automationLeadPosition.update({
        where: { id: failedLeads[i].id },
        data: {
          status: 'PENDING',
          lastError: null,
          nextScheduledAt: scheduledTime,
        },
      });
    }

    logger.info(
      `🔄 Retry agendado para ${failedLeads.length} leads da coluna ${columnId} ` +
      `(intervalo: ${intervalSeconds}s entre envios)`
    );
  }

  /**
   * Reinicia envio de todos os leads com falha (todas as colunas)
   * IMPORTANTE: Respeita intervalo de envio para evitar banimento WhatsApp
   */
  async retryAllFailed(): Promise<void> {
    // Buscar todos os leads com falha, agrupados por coluna
    const failedLeads = await prisma.automationLeadPosition.findMany({
      where: {
        status: { in: ['FAILED', 'WHATSAPP_DISCONNECTED'] },
      },
      include: {
        column: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (failedLeads.length === 0) {
      logger.info('Nenhum lead com falha encontrado');
      return;
    }

    // Agrupar por coluna para respeitar intervalos individuais
    const leadsByColumn = new Map<string, typeof failedLeads>();

    failedLeads.forEach(lead => {
      const columnId = lead.columnId;
      if (!leadsByColumn.has(columnId)) {
        leadsByColumn.set(columnId, []);
      }
      leadsByColumn.get(columnId)!.push(lead);
    });

    // Processar cada coluna respeitando seu intervalo
    let totalScheduled = 0;
    const now = new Date();

    for (const [columnId, leads] of leadsByColumn) {
      const column = leads[0].column;
      const intervalSeconds = column.sendIntervalSeconds || 60;

      for (let i = 0; i < leads.length; i++) {
        const scheduledTime = new Date(now.getTime() + (totalScheduled * intervalSeconds * 1000));

        await prisma.automationLeadPosition.update({
          where: { id: leads[i].id },
          data: {
            status: 'PENDING',
            lastError: null,
            nextScheduledAt: scheduledTime,
          },
        });

        totalScheduled++;
      }
    }

    logger.info(
      `🔄 Retry agendado para ${totalScheduled} leads de ${leadsByColumn.size} colunas ` +
      `(respeitando intervalos individuais de cada coluna)`
    );
  }
}

export const automationSchedulerService = new AutomationSchedulerService();
