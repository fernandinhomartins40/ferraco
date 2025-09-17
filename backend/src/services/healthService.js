const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Health Service
 * Serviço para monitoramento de saúde do sistema
 */
class HealthService {
  constructor() {
    this.healthHistory = [];
    this.alerts = [];
    this.services = new Map();
    this.thresholds = {
      cpu: { warning: 70, critical: 85 },
      memory: { warning: 80, critical: 90 },
      disk: { warning: 80, critical: 90 },
      database: { responseTime: 1000 },
      api: { responseTime: 2000 }
    };

    // Registrar serviços principais para monitoramento
    this._registerServices();
  }

  /**
   * Verifica saúde geral do sistema
   */
  async checkSystemHealth() {
    try {
      const startTime = Date.now();
      const checks = [];

      // Executar todas as verificações em paralelo
      const [
        databaseHealth,
        systemResourcesHealth,
        diskHealth,
        servicesHealth,
        dependenciesHealth
      ] = await Promise.allSettled([
        this.checkDatabaseHealth(),
        this.checkSystemResources(),
        this.checkDiskSpace(),
        this.checkRegisteredServices(),
        this.checkExternalDependencies()
      ]);

      // Processar resultados
      checks.push(this._processCheckResult('database', databaseHealth));
      checks.push(this._processCheckResult('system_resources', systemResourcesHealth));
      checks.push(this._processCheckResult('disk_space', diskHealth));
      checks.push(this._processCheckResult('services', servicesHealth));
      checks.push(this._processCheckResult('dependencies', dependenciesHealth));

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Calcular status geral
      const overallStatus = this._calculateOverallStatus(checks);

      const healthReport = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        duration,
        checks,
        summary: this._generateSummary(checks),
        alerts: this._generateHealthAlerts(checks)
      };

      // Salvar no histórico
      this._saveHealthHistory(healthReport);

      return {
        success: true,
        data: healthReport
      };

    } catch (error) {
      logger.error('Error checking system health:', error);

      return {
        success: false,
        data: {
          status: 'error',
          timestamp: new Date().toISOString(),
          error: error.message,
          checks: []
        }
      };
    }
  }

  /**
   * Verifica saúde do banco de dados
   */
  async checkDatabaseHealth() {
    const startTime = Date.now();

    try {
      // Testar conexão básica
      await prisma.$queryRaw`SELECT 1`;

      // Testar performance
      const performanceStart = Date.now();
      await prisma.user.count();
      const performanceTime = Date.now() - performanceStart;

      // Verificar tamanho do banco
      const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './data/database.db';
      let dbSize = 0;

      try {
        const stats = await fs.stat(dbPath);
        dbSize = stats.size;
      } catch {
        // Arquivo não existe ou erro de acesso
      }

      const responseTime = Date.now() - startTime;
      const status = this._evaluateResponseTime(responseTime, this.thresholds.database.responseTime);

      return {
        status,
        responseTime,
        performanceTime,
        dbSize: this._formatBytes(dbSize),
        details: {
          connected: true,
          queryPerformance: performanceTime < 500 ? 'good' : performanceTime < 1000 ? 'fair' : 'poor',
          size: dbSize
        }
      };

    } catch (error) {
      logger.error('Database health check failed:', error);

      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message,
        details: {
          connected: false,
          error: error.code || 'UNKNOWN_ERROR'
        }
      };
    }
  }

  /**
   * Verifica recursos do sistema
   */
  async checkSystemResources() {
    try {
      const cpuUsage = await this._getCpuUsage();
      const memoryUsage = this._getMemoryUsage();
      const loadAverage = os.loadavg();

      const cpuStatus = this._evaluateThreshold(cpuUsage, this.thresholds.cpu);
      const memoryStatus = this._evaluateThreshold(memoryUsage.percentage, this.thresholds.memory);

      const overallStatus = this._getWorstStatus([cpuStatus, memoryStatus]);

      return {
        status: overallStatus,
        cpu: {
          usage: cpuUsage,
          status: cpuStatus,
          cores: os.cpus().length
        },
        memory: {
          ...memoryUsage,
          status: memoryStatus
        },
        loadAverage: {
          '1min': loadAverage[0],
          '5min': loadAverage[1],
          '15min': loadAverage[2]
        },
        uptime: os.uptime()
      };

    } catch (error) {
      logger.error('System resources check failed:', error);

      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Verifica espaço em disco
   */
  async checkDiskSpace() {
    try {
      const diskUsage = await this._getDiskUsage();
      const status = this._evaluateThreshold(diskUsage.percentage, this.thresholds.disk);

      return {
        status,
        ...diskUsage
      };

    } catch (error) {
      logger.error('Disk space check failed:', error);

      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Verifica serviços registrados
   */
  async checkRegisteredServices() {
    try {
      const serviceChecks = [];

      for (const [serviceName, serviceConfig] of this.services) {
        const serviceHealth = await this._checkService(serviceName, serviceConfig);
        serviceChecks.push({
          name: serviceName,
          ...serviceHealth
        });
      }

      const failedServices = serviceChecks.filter(s => s.status === 'unhealthy');
      const overallStatus = failedServices.length === 0 ? 'healthy' :
                          failedServices.length < serviceChecks.length ? 'degraded' : 'unhealthy';

      return {
        status: overallStatus,
        services: serviceChecks,
        summary: {
          total: serviceChecks.length,
          healthy: serviceChecks.filter(s => s.status === 'healthy').length,
          degraded: serviceChecks.filter(s => s.status === 'degraded').length,
          unhealthy: serviceChecks.filter(s => s.status === 'unhealthy').length
        }
      };

    } catch (error) {
      logger.error('Services check failed:', error);

      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Verifica dependências externas
   */
  async checkExternalDependencies() {
    try {
      const dependencies = [
        {
          name: 'Node.js',
          version: process.version,
          required: '>=16.0.0'
        }
      ];

      // Verificar outras dependências se necessário
      const dependencyChecks = dependencies.map(dep => ({
        ...dep,
        status: this._checkDependencyVersion(dep.version, dep.required) ? 'healthy' : 'unhealthy'
      }));

      const failedDeps = dependencyChecks.filter(d => d.status === 'unhealthy');
      const overallStatus = failedDeps.length === 0 ? 'healthy' : 'unhealthy';

      return {
        status: overallStatus,
        dependencies: dependencyChecks
      };

    } catch (error) {
      logger.error('Dependencies check failed:', error);

      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Obtém histórico de saúde
   */
  async getHealthHistory(period = 'day', limit = 100) {
    try {
      const periodDays = this._getPeriodDays(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      const filteredHistory = this.healthHistory
        .filter(record => new Date(record.timestamp) >= startDate)
        .slice(-limit)
        .reverse();

      return {
        success: true,
        data: {
          history: filteredHistory,
          period,
          total: filteredHistory.length
        }
      };

    } catch (error) {
      logger.error('Error getting health history:', error);
      throw error;
    }
  }

  /**
   * Obtém métricas de saúde
   */
  async getHealthMetrics(period = 'day') {
    try {
      const periodDays = this._getPeriodDays(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      const relevantHistory = this.healthHistory
        .filter(record => new Date(record.timestamp) >= startDate);

      if (relevantHistory.length === 0) {
        return {
          success: true,
          data: {
            availability: 0,
            averageResponseTime: 0,
            errorRate: 0,
            period,
            dataPoints: 0
          }
        };
      }

      // Calcular métricas
      const healthyChecks = relevantHistory.filter(r => r.status === 'healthy').length;
      const availability = (healthyChecks / relevantHistory.length) * 100;

      const avgResponseTime = relevantHistory.reduce((acc, r) => acc + r.duration, 0) / relevantHistory.length;

      const errorChecks = relevantHistory.filter(r => r.status === 'error').length;
      const errorRate = (errorChecks / relevantHistory.length) * 100;

      return {
        success: true,
        data: {
          availability: Math.round(availability * 100) / 100,
          averageResponseTime: Math.round(avgResponseTime),
          errorRate: Math.round(errorRate * 100) / 100,
          period,
          dataPoints: relevantHistory.length,
          trend: this._calculateTrend(relevantHistory)
        }
      };

    } catch (error) {
      logger.error('Error getting health metrics:', error);
      throw error;
    }
  }

  /**
   * Registra um serviço para monitoramento
   */
  registerService(name, config) {
    this.services.set(name, {
      url: config.url,
      method: config.method || 'GET',
      timeout: config.timeout || 5000,
      expectedStatus: config.expectedStatus || 200,
      ...config
    });

    logger.info('Service registered for health monitoring', { name, config });
  }

  /**
   * Remove um serviço do monitoramento
   */
  unregisterService(name) {
    const removed = this.services.delete(name);

    if (removed) {
      logger.info('Service unregistered from health monitoring', { name });
    }

    return removed;
  }

  // ==========================================
  // MÉTODOS PRIVADOS
  // ==========================================

  /**
   * Registra serviços padrão para monitoramento
   */
  _registerServices() {
    // Registrar API principal
    this.registerService('main_api', {
      url: `http://localhost:${process.env.PORT || 3000}/api/health`,
      method: 'GET',
      timeout: 2000
    });

    // Adicionar outros serviços conforme necessário
  }

  /**
   * Verifica um serviço específico
   */
  async _checkService(name, config) {
    const startTime = Date.now();

    try {
      // Simular verificação de serviço (em produção usaria HTTP client)
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));

      const responseTime = Date.now() - startTime;
      const status = responseTime < config.timeout ? 'healthy' : 'degraded';

      return {
        status,
        responseTime,
        lastChecked: new Date().toISOString()
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message,
        lastChecked: new Date().toISOString()
      };
    }
  }

  /**
   * Processa resultado de verificação
   */
  _processCheckResult(name, result) {
    if (result.status === 'fulfilled') {
      return {
        name,
        ...result.value
      };
    } else {
      return {
        name,
        status: 'error',
        error: result.reason?.message || 'Unknown error'
      };
    }
  }

  /**
   * Calcula status geral baseado em todas as verificações
   */
  _calculateOverallStatus(checks) {
    const statuses = checks.map(check => check.status);

    if (statuses.includes('error') || statuses.includes('unhealthy')) {
      return 'unhealthy';
    }

    if (statuses.includes('degraded')) {
      return 'degraded';
    }

    return 'healthy';
  }

  /**
   * Gera resumo das verificações
   */
  _generateSummary(checks) {
    return {
      total: checks.length,
      healthy: checks.filter(c => c.status === 'healthy').length,
      degraded: checks.filter(c => c.status === 'degraded').length,
      unhealthy: checks.filter(c => c.status === 'unhealthy').length,
      error: checks.filter(c => c.status === 'error').length
    };
  }

  /**
   * Gera alertas baseados nas verificações
   */
  _generateHealthAlerts(checks) {
    const alerts = [];

    checks.forEach(check => {
      if (check.status === 'unhealthy') {
        alerts.push({
          type: 'danger',
          message: `${check.name} está com problemas`,
          priority: 'high',
          category: 'health'
        });
      } else if (check.status === 'degraded') {
        alerts.push({
          type: 'warning',
          message: `${check.name} está degradado`,
          priority: 'medium',
          category: 'health'
        });
      }
    });

    return alerts;
  }

  /**
   * Salva no histórico de saúde
   */
  _saveHealthHistory(healthReport) {
    this.healthHistory.push(healthReport);

    // Manter apenas os últimos 1000 registros
    if (this.healthHistory.length > 1000) {
      this.healthHistory = this.healthHistory.slice(-1000);
    }
  }

  /**
   * Obtém uso de CPU
   */
  async _getCpuUsage() {
    return new Promise((resolve) => {
      const startMeasure = process.cpuUsage();

      setTimeout(() => {
        const endMeasure = process.cpuUsage(startMeasure);
        const totalUsage = (endMeasure.user + endMeasure.system) / 1000000; // Convert to seconds
        const percentage = (totalUsage / 0.1) * 100; // 100ms measurement window

        resolve(Math.min(100, Math.max(0, percentage)));
      }, 100);
    });
  }

  /**
   * Obtém uso de memória
   */
  _getMemoryUsage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const percentage = (usedMemory / totalMemory) * 100;

    return {
      total: this._formatBytes(totalMemory),
      used: this._formatBytes(usedMemory),
      free: this._formatBytes(freeMemory),
      percentage: Math.round(percentage * 100) / 100
    };
  }

  /**
   * Obtém uso de disco
   */
  async _getDiskUsage() {
    try {
      // Simular uso de disco (em produção usaria bibliotecas específicas)
      const used = 45 * 1024 * 1024 * 1024; // 45GB
      const total = 100 * 1024 * 1024 * 1024; // 100GB
      const free = total - used;
      const percentage = (used / total) * 100;

      return {
        total: this._formatBytes(total),
        used: this._formatBytes(used),
        free: this._formatBytes(free),
        percentage: Math.round(percentage * 100) / 100
      };
    } catch {
      throw new Error('Unable to get disk usage information');
    }
  }

  /**
   * Avalia tempo de resposta
   */
  _evaluateResponseTime(responseTime, threshold) {
    if (responseTime > threshold * 2) return 'unhealthy';
    if (responseTime > threshold) return 'degraded';
    return 'healthy';
  }

  /**
   * Avalia threshold
   */
  _evaluateThreshold(value, thresholds) {
    if (value >= thresholds.critical) return 'unhealthy';
    if (value >= thresholds.warning) return 'degraded';
    return 'healthy';
  }

  /**
   * Obtém o pior status de uma lista
   */
  _getWorstStatus(statuses) {
    if (statuses.includes('unhealthy')) return 'unhealthy';
    if (statuses.includes('degraded')) return 'degraded';
    if (statuses.includes('error')) return 'error';
    return 'healthy';
  }

  /**
   * Verifica versão de dependência
   */
  _checkDependencyVersion(current, required) {
    // Implementação simplificada de comparação de versão
    const currentVersion = current.replace('v', '');
    const requiredVersion = required.replace('>=', '');

    return currentVersion >= requiredVersion;
  }

  /**
   * Formata bytes para formato legível
   */
  _formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Obtém número de dias baseado no período
   */
  _getPeriodDays(period) {
    const periodMap = {
      'hour': 1/24,
      'day': 1,
      'week': 7,
      'month': 30,
      'quarter': 90,
      'year': 365
    };
    return periodMap[period] || 1;
  }

  /**
   * Calcula tendência dos dados
   */
  _calculateTrend(history) {
    if (history.length < 2) return 'stable';

    const recent = history.slice(-10); // Últimos 10 registros
    const healthyCount = recent.filter(r => r.status === 'healthy').length;
    const healthyRate = healthyCount / recent.length;

    const older = history.slice(-20, -10); // 10 registros anteriores
    const olderHealthyCount = older.filter(r => r.status === 'healthy').length;
    const olderHealthyRate = olderHealthyCount / (older.length || 1);

    const difference = healthyRate - olderHealthyRate;

    if (difference > 0.1) return 'improving';
    if (difference < -0.1) return 'degrading';
    return 'stable';
  }
}

module.exports = new HealthService();