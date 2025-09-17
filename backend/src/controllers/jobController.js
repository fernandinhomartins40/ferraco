const jobService = require('../services/jobService');
const logger = require('../utils/logger');

/**
 * Job Controller
 * Gerencia todas as operações relacionadas a background jobs
 */
class JobController {
  /**
   * Listar todos os jobs
   */
  async listJobs(req, res) {
    try {
      const result = await jobService.listJobs(req.query);

      logger.info(`Jobs listed successfully - Found: ${result.data.jobs.length}`);

      res.status(200).json({
        success: true,
        message: 'Jobs recuperados com sucesso',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Error listing jobs:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao listar jobs',
        error: error.message
      });
    }
  }

  /**
   * Obter um job específico
   */
  async getJob(req, res) {
    try {
      const { id } = req.params;
      const result = await jobService.getJobById(id);

      logger.info(`Job retrieved successfully - ID: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Job recuperado com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error(`Error getting job ${req.params.id}:`, error);

      const statusCode = error.message.includes('não encontrado') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Criar um novo job
   */
  async createJob(req, res) {
    try {
      const jobData = req.body;
      const result = await jobService.createJob(jobData);

      logger.info(`Job created successfully - ID: ${result.data.job.id}, Type: ${result.data.job.type}`);

      res.status(201).json({
        success: true,
        message: 'Job criado com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error('Error creating job:', error);

      res.status(500).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Cancelar um job
   */
  async cancelJob(req, res) {
    try {
      const { id } = req.params;
      const result = await jobService.cancelJob(id);

      logger.info(`Job cancelled successfully - ID: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Job cancelado com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error(`Error cancelling job ${req.params.id}:`, error);

      const statusCode = error.message.includes('não encontrado') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Reprocessar um job falhado
   */
  async retryJob(req, res) {
    try {
      const { id } = req.params;
      const result = await jobService.retryJob(id);

      logger.info(`Job retry initiated - ID: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Reprocessamento do job iniciado',
        data: result.data
      });
    } catch (error) {
      logger.error(`Error retrying job ${req.params.id}:`, error);

      const statusCode = error.message.includes('não encontrado') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Obter estatísticas dos jobs
   */
  async getJobStats(req, res) {
    try {
      const { period = 'week' } = req.query;
      const result = await jobService.getJobStats(period);

      logger.info(`Job stats retrieved for period: ${period}`);

      res.status(200).json({
        success: true,
        message: 'Estatísticas dos jobs recuperadas com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error('Error getting job stats:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao recuperar estatísticas dos jobs',
        error: error.message
      });
    }
  }

  /**
   * Processar fila de jobs manualmente
   */
  async processJobQueue(req, res) {
    try {
      const { type, limit = 10 } = req.query;
      const result = await jobService.processJobQueue(type, limit);

      logger.info(`Job queue processing initiated - Type: ${type || 'all'}, Limit: ${limit}`);

      res.status(200).json({
        success: true,
        message: 'Processamento da fila iniciado',
        data: result.data
      });
    } catch (error) {
      logger.error('Error processing job queue:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao processar fila de jobs',
        error: error.message
      });
    }
  }

  /**
   * Obter tipos de jobs disponíveis
   */
  async getJobTypes(req, res) {
    try {
      const jobTypes = [
        {
          type: 'AI_ANALYSIS_BATCH',
          name: 'Análise IA em Lote',
          description: 'Processa análise de IA para múltiplos leads',
          estimatedTime: '2-5 minutos por lead',
          priority: 3
        },
        {
          type: 'LEAD_SCORING_BATCH',
          name: 'Scoring de Leads em Lote',
          description: 'Calcula score para múltiplos leads',
          estimatedTime: '1-2 minutos por lead',
          priority: 2
        },
        {
          type: 'EMAIL_CAMPAIGN',
          name: 'Campanha de Email',
          description: 'Envia emails para lista de leads',
          estimatedTime: '30 segundos por email',
          priority: 4
        },
        {
          type: 'DATA_EXPORT',
          name: 'Exportação de Dados',
          description: 'Exporta dados para diferentes formatos',
          estimatedTime: '5-10 minutos',
          priority: 5
        },
        {
          type: 'AUTOMATION_EXECUTION',
          name: 'Execução de Automação',
          description: 'Executa automações agendadas',
          estimatedTime: '1-3 minutos',
          priority: 2
        },
        {
          type: 'WEBHOOK_DELIVERY',
          name: 'Entrega de Webhook',
          description: 'Envia dados para webhooks externos',
          estimatedTime: '5-30 segundos',
          priority: 1
        },
        {
          type: 'REPORT_GENERATION',
          name: 'Geração de Relatório',
          description: 'Gera relatórios complexos',
          estimatedTime: '2-15 minutos',
          priority: 4
        },
        {
          type: 'DATABASE_CLEANUP',
          name: 'Limpeza do Banco',
          description: 'Remove dados antigos e otimiza banco',
          estimatedTime: '10-30 minutos',
          priority: 5
        },
        {
          type: 'INTEGRATION_SYNC',
          name: 'Sincronização de Integração',
          description: 'Sincroniza dados com sistemas externos',
          estimatedTime: '5-20 minutos',
          priority: 3
        }
      ];

      res.status(200).json({
        success: true,
        message: 'Tipos de jobs recuperados com sucesso',
        data: { jobTypes }
      });
    } catch (error) {
      logger.error('Error getting job types:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao recuperar tipos de jobs',
        error: error.message
      });
    }
  }

  /**
   * Limpar jobs antigos
   */
  async cleanupOldJobs(req, res) {
    try {
      const { days = 30, status = 'COMPLETED' } = req.query;
      const result = await jobService.cleanupOldJobs(days, status);

      logger.info(`Old jobs cleanup completed - Removed: ${result.data.removedCount} jobs`);

      res.status(200).json({
        success: true,
        message: 'Limpeza de jobs antigos concluída',
        data: result.data
      });
    } catch (error) {
      logger.error('Error cleaning up old jobs:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao limpar jobs antigos',
        error: error.message
      });
    }
  }

  /**
   * Agendar job recorrente
   */
  async scheduleRecurringJob(req, res) {
    try {
      const { type, schedule, data } = req.body;
      const result = await jobService.scheduleRecurringJob(type, schedule, data);

      logger.info(`Recurring job scheduled - Type: ${type}, Schedule: ${schedule}`);

      res.status(201).json({
        success: true,
        message: 'Job recorrente agendado com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error('Error scheduling recurring job:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao agendar job recorrente',
        error: error.message
      });
    }
  }

  /**
   * Obter jobs em execução
   */
  async getRunningJobs(req, res) {
    try {
      const result = await jobService.getRunningJobs();

      logger.info(`Running jobs retrieved - Found: ${result.data.runningJobs.length} jobs`);

      res.status(200).json({
        success: true,
        message: 'Jobs em execução recuperados com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error('Error getting running jobs:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao recuperar jobs em execução',
        error: error.message
      });
    }
  }

  /**
   * Pausar processamento de jobs
   */
  async pauseJobProcessing(req, res) {
    try {
      const result = await jobService.pauseJobProcessing();

      logger.info('Job processing paused');

      res.status(200).json({
        success: true,
        message: 'Processamento de jobs pausado',
        data: result.data
      });
    } catch (error) {
      logger.error('Error pausing job processing:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao pausar processamento de jobs',
        error: error.message
      });
    }
  }

  /**
   * Retomar processamento de jobs
   */
  async resumeJobProcessing(req, res) {
    try {
      const result = await jobService.resumeJobProcessing();

      logger.info('Job processing resumed');

      res.status(200).json({
        success: true,
        message: 'Processamento de jobs retomado',
        data: result.data
      });
    } catch (error) {
      logger.error('Error resuming job processing:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao retomar processamento de jobs',
        error: error.message
      });
    }
  }
}

module.exports = new JobController();