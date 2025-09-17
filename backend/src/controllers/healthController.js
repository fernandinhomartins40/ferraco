const healthService = require('../services/healthService');
const logger = require('../utils/logger');

/**
 * Health Controller
 * Controlador para monitoramento de saúde do sistema
 */
class HealthController {
  /**
   * Verificação rápida de saúde (health check básico)
   */
  async quickHealthCheck(req, res) {
    try {
      const startTime = Date.now();

      // Verificação mínima e rápida
      const quickCheck = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        responseTime: Date.now() - startTime
      };

      res.status(200).json({
        success: true,
        message: 'Sistema operacional',
        data: quickCheck
      });

    } catch (error) {
      logger.error('Error in quick health check:', error);

      res.status(503).json({
        success: false,
        message: 'Sistema com problemas',
        error: error.message,
        status: 'unhealthy',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Verificação completa de saúde do sistema
   */
  async fullHealthCheck(req, res) {
    try {
      const result = await healthService.checkSystemHealth();

      const statusCode = result.data.status === 'healthy' ? 200 :
                        result.data.status === 'degraded' ? 200 : 503;

      logger.info('Full health check performed', {
        status: result.data.status,
        duration: result.data.duration,
        requestedBy: req.user?.id || 'anonymous'
      });

      res.status(statusCode).json({
        success: result.success,
        message: `Sistema ${result.data.status === 'healthy' ? 'saudável' : 'com problemas'}`,
        data: result.data
      });

    } catch (error) {
      logger.error('Error in full health check:', error);

      res.status(503).json({
        success: false,
        message: 'Erro na verificação de saúde',
        error: error.message,
        status: 'error',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Obtém histórico de saúde
   */
  async getHealthHistory(req, res) {
    try {
      const { period = 'day', limit = 100 } = req.query;

      const result = await healthService.getHealthHistory(period, parseInt(limit));

      logger.info('Health history retrieved', {
        requestedBy: req.user?.id,
        period,
        limit,
        resultCount: result.data.history.length
      });

      res.status(200).json({
        success: true,
        message: 'Histórico de saúde recuperado com sucesso',
        data: result.data
      });

    } catch (error) {
      logger.error('Error getting health history:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao recuperar histórico de saúde',
        error: error.message
      });
    }
  }

  /**
   * Obtém métricas de saúde
   */
  async getHealthMetrics(req, res) {
    try {
      const { period = 'day' } = req.query;

      const result = await healthService.getHealthMetrics(period);

      logger.info('Health metrics retrieved', {
        requestedBy: req.user?.id,
        period,
        availability: result.data.availability
      });

      res.status(200).json({
        success: true,
        message: 'Métricas de saúde recuperadas com sucesso',
        data: result.data
      });

    } catch (error) {
      logger.error('Error getting health metrics:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao recuperar métricas de saúde',
        error: error.message
      });
    }
  }

  /**
   * Verifica saúde do banco de dados
   */
  async checkDatabaseHealth(req, res) {
    try {
      const result = await healthService.checkDatabaseHealth();

      const statusCode = result.status === 'healthy' ? 200 : 503;

      logger.info('Database health check performed', {
        status: result.status,
        responseTime: result.responseTime,
        requestedBy: req.user?.id || 'anonymous'
      });

      res.status(statusCode).json({
        success: result.status !== 'error',
        message: `Banco de dados ${result.status === 'healthy' ? 'saudável' : 'com problemas'}`,
        data: result
      });

    } catch (error) {
      logger.error('Error checking database health:', error);

      res.status(503).json({
        success: false,
        message: 'Erro na verificação de saúde do banco de dados',
        error: error.message,
        status: 'error'
      });
    }
  }

  /**
   * Verifica recursos do sistema
   */
  async checkSystemResources(req, res) {
    try {
      const result = await healthService.checkSystemResources();

      const statusCode = result.status === 'healthy' ? 200 :
                        result.status === 'degraded' ? 200 : 503;

      res.status(statusCode).json({
        success: result.status !== 'error',
        message: `Recursos do sistema ${result.status === 'healthy' ? 'normais' : 'com problemas'}`,
        data: result
      });

    } catch (error) {
      logger.error('Error checking system resources:', error);

      res.status(503).json({
        success: false,
        message: 'Erro na verificação de recursos do sistema',
        error: error.message,
        status: 'error'
      });
    }
  }

  /**
   * Registra um serviço para monitoramento
   */
  async registerService(req, res) {
    try {
      const { name, url, method, timeout, expectedStatus } = req.body;

      if (!name || !url) {
        return res.status(400).json({
          success: false,
          message: 'Nome e URL do serviço são obrigatórios',
          error: 'MISSING_REQUIRED_FIELDS'
        });
      }

      healthService.registerService(name, {
        url,
        method,
        timeout,
        expectedStatus
      });

      logger.info('Service registered for health monitoring', {
        requestedBy: req.user.id,
        serviceName: name,
        serviceUrl: url
      });

      res.status(200).json({
        success: true,
        message: 'Serviço registrado para monitoramento com sucesso',
        data: { name, url, method, timeout, expectedStatus }
      });

    } catch (error) {
      logger.error('Error registering service:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao registrar serviço para monitoramento',
        error: error.message
      });
    }
  }

  /**
   * Remove um serviço do monitoramento
   */
  async unregisterService(req, res) {
    try {
      const { serviceName } = req.params;

      const removed = healthService.unregisterService(serviceName);

      if (!removed) {
        return res.status(404).json({
          success: false,
          message: 'Serviço não encontrado',
          error: 'SERVICE_NOT_FOUND'
        });
      }

      logger.info('Service unregistered from health monitoring', {
        requestedBy: req.user.id,
        serviceName
      });

      res.status(200).json({
        success: true,
        message: 'Serviço removido do monitoramento com sucesso',
        data: { serviceName, removed: true }
      });

    } catch (error) {
      logger.error('Error unregistering service:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao remover serviço do monitoramento',
        error: error.message
      });
    }
  }

  /**
   * Dashboard de saúde (resumo executivo)
   */
  async getHealthDashboard(req, res) {
    try {
      const { period = 'day' } = req.query;

      // Obter dados do dashboard em paralelo
      const [healthResult, metricsResult] = await Promise.all([
        healthService.checkSystemHealth(),
        healthService.getHealthMetrics(period)
      ]);

      const dashboard = {
        period,
        currentStatus: healthResult.data,
        metrics: metricsResult.data,
        alerts: this._generateDashboardAlerts(healthResult.data, metricsResult.data),
        recommendations: this._generateRecommendations(healthResult.data, metricsResult.data),
        lastUpdated: new Date().toISOString()
      };

      logger.info('Health dashboard retrieved', {
        requestedBy: req.user?.id,
        period,
        overallStatus: healthResult.data.status,
        availability: metricsResult.data.availability
      });

      res.status(200).json({
        success: true,
        message: 'Dashboard de saúde recuperado com sucesso',
        data: dashboard
      });

    } catch (error) {
      logger.error('Error getting health dashboard:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao recuperar dashboard de saúde',
        error: error.message
      });
    }
  }

  /**
   * Endpoint para readiness probe (Kubernetes)
   */
  async readinessCheck(req, res) {
    try {
      // Verificar se o sistema está pronto para receber tráfego
      const dbHealth = await healthService.checkDatabaseHealth();

      if (dbHealth.status === 'healthy') {
        res.status(200).json({
          status: 'ready',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(503).json({
          status: 'not ready',
          reason: 'Database not available',
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      res.status(503).json({
        status: 'not ready',
        reason: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Endpoint para liveness probe (Kubernetes)
   */
  async livenessCheck(req, res) {
    try {
      // Verificação básica se o processo está vivo
      res.status(200).json({
        status: 'alive',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(503).json({
        status: 'dead',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // ==========================================
  // MÉTODOS PRIVADOS
  // ==========================================

  /**
   * Gera alertas para o dashboard
   */
  _generateDashboardAlerts(currentStatus, metrics) {
    const alerts = [...(currentStatus.alerts || [])];

    // Alerta de disponibilidade baixa
    if (metrics.availability < 95) {
      alerts.push({
        type: 'warning',
        message: `Disponibilidade baixa: ${metrics.availability}%`,
        priority: 'medium',
        category: 'availability'
      });
    }

    // Alerta de tendência negativa
    if (metrics.trend === 'degrading') {
      alerts.push({
        type: 'warning',
        message: 'Tendência de degradação detectada',
        priority: 'medium',
        category: 'trend'
      });
    }

    return alerts;
  }

  /**
   * Gera recomendações baseadas no status e métricas
   */
  _generateRecommendations(currentStatus, metrics) {
    const recommendations = [];

    // Recomendações baseadas no status atual
    if (currentStatus.status === 'degraded') {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: 'Considere investigar componentes degradados para evitar problemas futuros'
      });
    }

    // Recomendações baseadas na disponibilidade
    if (metrics.availability < 99) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        message: 'Implementar estratégias de alta disponibilidade para melhorar SLA'
      });
    }

    // Recomendação de monitoramento
    if (metrics.dataPoints < 100) {
      recommendations.push({
        type: 'monitoring',
        priority: 'low',
        message: 'Aumentar frequência de health checks para melhor visibilidade'
      });
    }

    return recommendations;
  }
}

module.exports = new HealthController();