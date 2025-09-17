const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Job Service
 * Serviços relacionados a processamento de background jobs
 */
class JobService {
  constructor() {
    this.isProcessing = false;
    this.processingInterval = null;
    this.processingPaused = false;
  }

  /**
   * Lista todos os jobs
   */
  async listJobs(filters = {}) {
    try {
      const {
        type,
        status,
        priority,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      const skip = (page - 1) * limit;

      const where = {};
      if (type) where.type = type;
      if (status) where.status = status;
      if (priority) where.priority = parseInt(priority);

      const jobs = await prisma.backgroundJob.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: parseInt(limit)
      });

      const total = await prisma.backgroundJob.count({ where });

      // Parse JSON fields
      const jobsWithParsedData = jobs.map(job => ({
        ...job,
        data: this._safeJsonParse(job.data),
        result: this._safeJsonParse(job.result)
      }));

      return {
        success: true,
        data: { jobs: jobsWithParsedData },
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error in listJobs:', error);
      throw error;
    }
  }

  /**
   * Obtém um job específico por ID
   */
  async getJobById(jobId) {
    try {
      const job = await prisma.backgroundJob.findUnique({
        where: { id: jobId }
      });

      if (!job) {
        throw new Error('Job não encontrado');
      }

      return {
        success: true,
        data: {
          job: {
            ...job,
            data: this._safeJsonParse(job.data),
            result: this._safeJsonParse(job.result)
          }
        }
      };
    } catch (error) {
      logger.error('Error in getJobById:', error);
      throw error;
    }
  }

  /**
   * Cria um novo job
   */
  async createJob(jobData) {
    try {
      const {
        type,
        name,
        data = {},
        priority = 5,
        maxAttempts = 3,
        scheduledAt
      } = jobData;

      const job = await prisma.backgroundJob.create({
        data: {
          type,
          name,
          data: JSON.stringify(data),
          priority,
          maxAttempts,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null
        }
      });

      // Iniciar processamento se não estiver rodando
      this._startProcessing();

      return {
        success: true,
        data: {
          job: {
            ...job,
            data: this._safeJsonParse(job.data)
          }
        }
      };
    } catch (error) {
      logger.error('Error in createJob:', error);
      throw error;
    }
  }

  /**
   * Cancela um job
   */
  async cancelJob(jobId) {
    try {
      const job = await prisma.backgroundJob.findUnique({
        where: { id: jobId }
      });

      if (!job) {
        throw new Error('Job não encontrado');
      }

      if (job.status === 'RUNNING') {
        throw new Error('Não é possível cancelar um job em execução');
      }

      if (job.status === 'COMPLETED') {
        throw new Error('Não é possível cancelar um job já concluído');
      }

      const cancelledJob = await prisma.backgroundJob.update({
        where: { id: jobId },
        data: {
          status: 'CANCELLED',
          completedAt: new Date(),
          result: JSON.stringify({ cancelled: true, reason: 'Cancelled by user' })
        }
      });

      return {
        success: true,
        data: { job: cancelledJob }
      };
    } catch (error) {
      logger.error('Error in cancelJob:', error);
      throw error;
    }
  }

  /**
   * Reprocessa um job falhado
   */
  async retryJob(jobId) {
    try {
      const job = await prisma.backgroundJob.findUnique({
        where: { id: jobId }
      });

      if (!job) {
        throw new Error('Job não encontrado');
      }

      if (job.status !== 'FAILED') {
        throw new Error('Apenas jobs falhados podem ser reprocessados');
      }

      const retriedJob = await prisma.backgroundJob.update({
        where: { id: jobId },
        data: {
          status: 'PENDING',
          attempts: 0,
          error: null,
          startedAt: null,
          completedAt: null,
          result: null
        }
      });

      // Iniciar processamento
      this._startProcessing();

      return {
        success: true,
        data: { job: retriedJob }
      };
    } catch (error) {
      logger.error('Error in retryJob:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas dos jobs
   */
  async getJobStats(period = 'week') {
    try {
      const periodDays = this._getPeriodDays(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      // Estatísticas gerais
      const totalJobs = await prisma.backgroundJob.count();
      const pendingJobs = await prisma.backgroundJob.count({
        where: { status: 'PENDING' }
      });
      const runningJobs = await prisma.backgroundJob.count({
        where: { status: 'RUNNING' }
      });
      const completedJobs = await prisma.backgroundJob.count({
        where: { status: 'COMPLETED' }
      });
      const failedJobs = await prisma.backgroundJob.count({
        where: { status: 'FAILED' }
      });

      // Jobs no período
      const periodJobs = await prisma.backgroundJob.count({
        where: {
          createdAt: { gte: startDate }
        }
      });

      // Distribuição por tipo
      const jobsByType = await prisma.backgroundJob.groupBy({
        by: ['type'],
        where: {
          createdAt: { gte: startDate }
        },
        _count: true
      });

      // Distribuição por status
      const jobsByStatus = await prisma.backgroundJob.groupBy({
        by: ['status'],
        _count: true
      });

      // Jobs mais demorados
      const slowestJobs = await prisma.backgroundJob.findMany({
        where: {
          status: 'COMPLETED',
          startedAt: { not: null },
          completedAt: { not: null }
        },
        select: {
          id: true,
          name: true,
          type: true,
          startedAt: true,
          completedAt: true
        },
        orderBy: {
          completedAt: 'desc'
        },
        take: 10
      });

      // Calcular duração para jobs mais demorados
      const slowestJobsWithDuration = slowestJobs.map(job => {
        const duration = job.completedAt.getTime() - job.startedAt.getTime();
        return {
          ...job,
          duration: Math.round(duration / 1000) // em segundos
        };
      }).sort((a, b) => b.duration - a.duration);

      return {
        success: true,
        data: {
          stats: {
            total: totalJobs,
            pending: pendingJobs,
            running: runningJobs,
            completed: completedJobs,
            failed: failedJobs,
            periodJobs,
            successRate: totalJobs > 0 ? ((completedJobs / totalJobs) * 100).toFixed(2) : 0
          },
          distribution: {
            byType: jobsByType.map(item => ({
              type: item.type,
              count: item._count
            })),
            byStatus: jobsByStatus.map(item => ({
              status: item.status,
              count: item._count
            }))
          },
          slowestJobs: slowestJobsWithDuration.slice(0, 5),
          period,
          processingStatus: {
            isProcessing: this.isProcessing,
            isPaused: this.processingPaused
          }
        }
      };
    } catch (error) {
      logger.error('Error in getJobStats:', error);
      throw error;
    }
  }

  /**
   * Processa fila de jobs
   */
  async processJobQueue(type = null, limit = 10) {
    try {
      if (this.processingPaused) {
        throw new Error('Processamento de jobs está pausado');
      }

      const where = {
        status: 'PENDING',
        OR: [
          { scheduledAt: null },
          { scheduledAt: { lte: new Date() } }
        ]
      };

      if (type) {
        where.type = type;
      }

      const jobs = await prisma.backgroundJob.findMany({
        where,
        orderBy: [
          { priority: 'asc' },
          { createdAt: 'asc' }
        ],
        take: limit
      });

      const processedJobs = [];
      for (const job of jobs) {
        try {
          const result = await this._processJob(job);
          processedJobs.push(result);
        } catch (error) {
          logger.error(`Error processing job ${job.id}:`, error);
        }
      }

      return {
        success: true,
        data: {
          processedCount: processedJobs.length,
          availableCount: jobs.length,
          processedJobs
        }
      };
    } catch (error) {
      logger.error('Error in processJobQueue:', error);
      throw error;
    }
  }

  /**
   * Limpa jobs antigos
   */
  async cleanupOldJobs(days = 30, status = 'COMPLETED') {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const where = {
        completedAt: { lt: cutoffDate }
      };

      if (status !== 'ALL') {
        where.status = status;
      }

      const deletedJobs = await prisma.backgroundJob.deleteMany({
        where
      });

      return {
        success: true,
        data: {
          removedCount: deletedJobs.count,
          cutoffDate,
          status
        }
      };
    } catch (error) {
      logger.error('Error in cleanupOldJobs:', error);
      throw error;
    }
  }

  /**
   * Agenda job recorrente
   */
  async scheduleRecurringJob(type, schedule, data = {}) {
    try {
      // Para simplicidade, vamos criar jobs únicos agendados
      // Em produção, usaria uma lib como node-cron
      const scheduleDates = this._parseSchedule(schedule);

      const jobs = [];
      for (const date of scheduleDates) {
        const job = await prisma.backgroundJob.create({
          data: {
            type,
            name: `${type} - Agendado`,
            data: JSON.stringify(data),
            priority: 3,
            scheduledAt: date
          }
        });
        jobs.push(job);
      }

      return {
        success: true,
        data: {
          scheduledJobs: jobs.length,
          schedule,
          nextExecution: scheduleDates[0]
        }
      };
    } catch (error) {
      logger.error('Error in scheduleRecurringJob:', error);
      throw error;
    }
  }

  /**
   * Obtém jobs em execução
   */
  async getRunningJobs() {
    try {
      const runningJobs = await prisma.backgroundJob.findMany({
        where: { status: 'RUNNING' },
        orderBy: { startedAt: 'desc' }
      });

      const jobsWithDuration = runningJobs.map(job => {
        const duration = job.startedAt ? Date.now() - job.startedAt.getTime() : 0;
        return {
          ...job,
          data: this._safeJsonParse(job.data),
          runningTime: Math.round(duration / 1000) // em segundos
        };
      });

      return {
        success: true,
        data: { runningJobs: jobsWithDuration }
      };
    } catch (error) {
      logger.error('Error in getRunningJobs:', error);
      throw error;
    }
  }

  /**
   * Pausa processamento de jobs
   */
  async pauseJobProcessing() {
    try {
      this.processingPaused = true;
      if (this.processingInterval) {
        clearInterval(this.processingInterval);
        this.processingInterval = null;
      }

      return {
        success: true,
        data: { message: 'Processamento pausado' }
      };
    } catch (error) {
      logger.error('Error in pauseJobProcessing:', error);
      throw error;
    }
  }

  /**
   * Retoma processamento de jobs
   */
  async resumeJobProcessing() {
    try {
      this.processingPaused = false;
      this._startProcessing();

      return {
        success: true,
        data: { message: 'Processamento retomado' }
      };
    } catch (error) {
      logger.error('Error in resumeJobProcessing:', error);
      throw error;
    }
  }

  // ==========================================
  // MÉTODOS PRIVADOS
  // ==========================================

  /**
   * Inicia o processamento contínuo de jobs
   */
  _startProcessing() {
    if (this.isProcessing || this.processingPaused) {
      return;
    }

    this.isProcessing = true;

    // Processar jobs a cada 30 segundos
    this.processingInterval = setInterval(async () => {
      if (!this.processingPaused) {
        try {
          await this.processJobQueue(null, 5);
        } catch (error) {
          logger.error('Error in automatic job processing:', error);
        }
      }
    }, 30000);

    logger.info('Job processing started');
  }

  /**
   * Processa um job específico
   */
  async _processJob(job) {
    try {
      // Marcar job como em execução
      await prisma.backgroundJob.update({
        where: { id: job.id },
        data: {
          status: 'RUNNING',
          startedAt: new Date(),
          attempts: job.attempts + 1
        }
      });

      // Simular processamento baseado no tipo
      const result = await this._executeJobByType(job);

      // Marcar job como concluído
      const completedJob = await prisma.backgroundJob.update({
        where: { id: job.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          result: JSON.stringify(result)
        }
      });

      logger.info(`Job completed successfully: ${job.id} - ${job.type}`);
      return completedJob;

    } catch (error) {
      logger.error(`Job failed: ${job.id} - ${job.type}`, error);

      const shouldRetry = job.attempts < job.maxAttempts;
      const status = shouldRetry ? 'PENDING' : 'FAILED';

      const failedJob = await prisma.backgroundJob.update({
        where: { id: job.id },
        data: {
          status,
          error: error.message,
          completedAt: shouldRetry ? null : new Date()
        }
      });

      if (!shouldRetry) {
        logger.warn(`Job permanently failed after ${job.attempts} attempts: ${job.id}`);
      }

      return failedJob;
    }
  }

  /**
   * Executa job baseado no tipo
   */
  async _executeJobByType(job) {
    const jobData = this._safeJsonParse(job.data);

    switch (job.type) {
      case 'AI_ANALYSIS_BATCH':
        return await this._processAIAnalysisBatch(jobData);

      case 'LEAD_SCORING_BATCH':
        return await this._processLeadScoringBatch(jobData);

      case 'EMAIL_CAMPAIGN':
        return await this._processEmailCampaign(jobData);

      case 'DATA_EXPORT':
        return await this._processDataExport(jobData);

      case 'AUTOMATION_EXECUTION':
        return await this._processAutomationExecution(jobData);

      case 'WEBHOOK_DELIVERY':
        return await this._processWebhookDelivery(jobData);

      case 'REPORT_GENERATION':
        return await this._processReportGeneration(jobData);

      case 'DATABASE_CLEANUP':
        return await this._processDatabaseCleanup(jobData);

      case 'INTEGRATION_SYNC':
        return await this._processIntegrationSync(jobData);

      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
  }

  /**
   * Simula processamento de análise IA em lote
   */
  async _processAIAnalysisBatch(data) {
    const { leadIds, analysisTypes } = data;

    // Simular processamento
    await this._sleep(2000 * leadIds.length);

    return {
      processedLeads: leadIds.length,
      analysisTypes,
      completedAt: new Date().toISOString()
    };
  }

  /**
   * Simula processamento de scoring em lote
   */
  async _processLeadScoringBatch(data) {
    const { leadIds } = data;

    // Simular processamento
    await this._sleep(1000 * leadIds.length);

    return {
      processedLeads: leadIds.length,
      avgScore: 75,
      completedAt: new Date().toISOString()
    };
  }

  /**
   * Simula processamento de campanha de email
   */
  async _processEmailCampaign(data) {
    const { recipients, template } = data;

    // Simular envio
    await this._sleep(500 * recipients.length);

    return {
      sentEmails: recipients.length,
      template,
      successRate: 95,
      completedAt: new Date().toISOString()
    };
  }

  /**
   * Simula exportação de dados
   */
  async _processDataExport(data) {
    const { format, filters } = data;

    // Simular exportação
    await this._sleep(5000);

    return {
      format,
      recordCount: 1500,
      fileSize: '2.5MB',
      downloadUrl: '/exports/data_export_' + Date.now() + '.' + format,
      completedAt: new Date().toISOString()
    };
  }

  /**
   * Simula execução de automação
   */
  async _processAutomationExecution(data) {
    const { automationId, targetCount } = data;

    // Simular execução
    await this._sleep(2000);

    return {
      automationId,
      executedTargets: targetCount,
      successCount: Math.floor(targetCount * 0.9),
      completedAt: new Date().toISOString()
    };
  }

  /**
   * Simula entrega de webhook
   */
  async _processWebhookDelivery(data) {
    const { webhookId, payload } = data;

    // Simular entrega
    await this._sleep(1000);

    return {
      webhookId,
      status: 'delivered',
      httpStatus: 200,
      completedAt: new Date().toISOString()
    };
  }

  /**
   * Simula geração de relatório
   */
  async _processReportGeneration(data) {
    const { reportType, period } = data;

    // Simular geração
    await this._sleep(8000);

    return {
      reportType,
      period,
      pages: 25,
      charts: 8,
      downloadUrl: '/reports/report_' + Date.now() + '.pdf',
      completedAt: new Date().toISOString()
    };
  }

  /**
   * Simula limpeza do banco
   */
  async _processDatabaseCleanup(data) {
    const { tables, days } = data;

    // Simular limpeza
    await this._sleep(15000);

    return {
      cleanedTables: tables,
      removedRecords: 2500,
      freedSpace: '150MB',
      completedAt: new Date().toISOString()
    };
  }

  /**
   * Simula sincronização de integração
   */
  async _processIntegrationSync(data) {
    const { integrationType, direction } = data;

    // Simular sincronização
    await this._sleep(10000);

    return {
      integrationType,
      direction,
      syncedRecords: 850,
      errors: 12,
      completedAt: new Date().toISOString()
    };
  }

  /**
   * Métodos auxiliares
   */
  _safeJsonParse(jsonString) {
    try {
      return jsonString ? JSON.parse(jsonString) : {};
    } catch {
      return {};
    }
  }

  _getPeriodDays(period) {
    const periodMap = {
      'day': 1,
      'week': 7,
      'month': 30,
      'quarter': 90,
      'year': 365
    };
    return periodMap[period] || 7;
  }

  _parseSchedule(schedule) {
    // Simples implementação para demonstração
    // Em produção, usaria uma lib como node-cron
    const dates = [];
    const now = new Date();

    if (schedule === 'daily') {
      for (let i = 1; i <= 7; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() + i);
        dates.push(date);
      }
    } else if (schedule === 'weekly') {
      for (let i = 1; i <= 4; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() + (i * 7));
        dates.push(date);
      }
    }

    return dates;
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new JobService();