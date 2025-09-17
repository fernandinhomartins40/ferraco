const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Audit Service
 * Serviços para gerenciamento e consulta de logs de auditoria
 */
class AuditService {
  /**
   * Lista logs de auditoria com filtros
   */
  async listAuditLogs(filters = {}) {
    try {
      const {
        userId,
        userName,
        action,
        resource,
        success,
        startDate,
        endDate,
        ipAddress,
        page = 1,
        limit = 50,
        sortBy = 'timestamp',
        sortOrder = 'desc'
      } = filters;

      const where = {};

      // Filtros
      if (userId) where.userId = userId;
      if (userName) where.userName = { contains: userName };
      if (action) where.action = { contains: action };
      if (resource) where.resource = resource;
      if (success !== undefined) where.success = success === 'true';
      if (ipAddress) where.ipAddress = { contains: ipAddress };

      // Filtro de data
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = new Date(startDate);
        if (endDate) where.timestamp.lte = new Date(endDate);
      }

      const skip = (page - 1) * limit;

      const auditLogs = await prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: {
                select: { name: true, level: true }
              }
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: parseInt(limit)
      });

      const total = await prisma.auditLog.count({ where });

      // Parse details JSON
      const logsWithDetails = auditLogs.map(log => ({
        ...log,
        details: this._safeJsonParse(log.details)
      }));

      return {
        success: true,
        data: { logs: logsWithDetails },
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error in listAuditLogs:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de auditoria
   */
  async getAuditStats(period = 'week') {
    try {
      const periodDays = this._getPeriodDays(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      // Total de logs
      const totalLogs = await prisma.auditLog.count();
      const periodLogs = await prisma.auditLog.count({
        where: { timestamp: { gte: startDate } }
      });

      // Sucessos e falhas
      const successCount = await prisma.auditLog.count({
        where: {
          success: true,
          timestamp: { gte: startDate }
        }
      });

      const failureCount = await prisma.auditLog.count({
        where: {
          success: false,
          timestamp: { gte: startDate }
        }
      });

      // Distribuição por ação
      const actionStats = await prisma.auditLog.groupBy({
        by: ['action'],
        where: { timestamp: { gte: startDate } },
        _count: true,
        orderBy: { _count: { action: 'desc' } },
        take: 10
      });

      // Distribuição por recurso
      const resourceStats = await prisma.auditLog.groupBy({
        by: ['resource'],
        where: { timestamp: { gte: startDate } },
        _count: true,
        orderBy: { _count: { resource: 'desc' } },
        take: 10
      });

      // Usuários mais ativos
      const activeUsers = await prisma.auditLog.groupBy({
        by: ['userId', 'userName'],
        where: {
          timestamp: { gte: startDate },
          userId: { not: null }
        },
        _count: true,
        orderBy: { _count: { userId: 'desc' } },
        take: 10
      });

      // IPs mais ativos
      const activeIPs = await prisma.auditLog.groupBy({
        by: ['ipAddress'],
        where: { timestamp: { gte: startDate } },
        _count: true,
        orderBy: { _count: { ipAddress: 'desc' } },
        take: 10
      });

      // Falhas de segurança (tentativas de acesso negadas)
      const securityEvents = await prisma.auditLog.count({
        where: {
          success: false,
          timestamp: { gte: startDate },
          OR: [
            { action: { contains: 'LOGIN' } },
            { details: { contains: 'PERMISSION_DENIED' } },
            { details: { contains: 'UNAUTHORIZED' } }
          ]
        }
      });

      return {
        success: true,
        data: {
          overview: {
            totalLogs,
            periodLogs,
            successCount,
            failureCount,
            successRate: periodLogs > 0 ? ((successCount / periodLogs) * 100).toFixed(2) : 0,
            securityEvents
          },
          distribution: {
            byAction: actionStats.map(item => ({
              action: item.action,
              count: item._count
            })),
            byResource: resourceStats.map(item => ({
              resource: item.resource,
              count: item._count
            }))
          },
          activeUsers: activeUsers.map(item => ({
            userId: item.userId,
            userName: item.userName,
            activityCount: item._count
          })),
          activeIPs: activeIPs.map(item => ({
            ipAddress: item.ipAddress,
            requestCount: item._count
          })),
          period
        }
      };
    } catch (error) {
      logger.error('Error in getAuditStats:', error);
      throw error;
    }
  }

  /**
   * Obtém logs de auditoria de um usuário específico
   */
  async getUserAuditLogs(userId, filters = {}) {
    try {
      const {
        action,
        resource,
        success,
        startDate,
        endDate,
        page = 1,
        limit = 20
      } = filters;

      const where = { userId };

      if (action) where.action = { contains: action };
      if (resource) where.resource = resource;
      if (success !== undefined) where.success = success === 'true';

      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = new Date(startDate);
        if (endDate) where.timestamp.lte = new Date(endDate);
      }

      const skip = (page - 1) * limit;

      const logs = await prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: parseInt(limit)
      });

      const total = await prisma.auditLog.count({ where });

      const logsWithDetails = logs.map(log => ({
        ...log,
        details: this._safeJsonParse(log.details)
      }));

      return {
        success: true,
        data: { logs: logsWithDetails },
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error in getUserAuditLogs:', error);
      throw error;
    }
  }

  /**
   * Obtém eventos de segurança suspeitos
   */
  async getSecurityEvents(filters = {}) {
    try {
      const {
        severity = 'all', // low, medium, high, critical, all
        period = 'day',
        page = 1,
        limit = 50
      } = filters;

      const periodDays = this._getPeriodDays(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      let where = {
        timestamp: { gte: startDate },
        OR: [
          // Falhas de login
          { action: 'LOGIN', success: false },
          // Tentativas de acesso negado
          { success: false, details: { contains: 'PERMISSION_DENIED' } },
          // Tentativas de acesso não autorizado
          { success: false, details: { contains: 'UNAUTHORIZED' } },
          // Múltiplas tentativas do mesmo IP
          { success: false, action: { contains: 'AUTH' } }
        ]
      };

      const skip = (page - 1) * limit;

      const securityLogs = await prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: parseInt(limit)
      });

      const total = await prisma.auditLog.count({ where });

      // Classificar por severidade
      const classifiedLogs = securityLogs.map(log => {
        const logWithDetails = {
          ...log,
          details: this._safeJsonParse(log.details)
        };

        logWithDetails.severity = this._classifySecuritySeverity(logWithDetails);
        return logWithDetails;
      });

      // Filtrar por severidade se especificado
      const filteredLogs = severity === 'all' ?
        classifiedLogs :
        classifiedLogs.filter(log => log.severity === severity);

      return {
        success: true,
        data: {
          events: filteredLogs,
          summary: {
            total,
            period,
            severityCount: this._countBySeverity(classifiedLogs)
          }
        },
        pagination: {
          total: filteredLogs.length,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(filteredLogs.length / limit)
        }
      };
    } catch (error) {
      logger.error('Error in getSecurityEvents:', error);
      throw error;
    }
  }

  /**
   * Gera relatório de compliance de auditoria
   */
  async generateComplianceReport(period = 'month') {
    try {
      const periodDays = this._getPeriodDays(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);
      const endDate = new Date();

      // Estatísticas gerais
      const totalActivities = await prisma.auditLog.count({
        where: { timestamp: { gte: startDate, lte: endDate } }
      });

      // Atividades críticas (CREATE, UPDATE, DELETE)
      const criticalActivities = await prisma.auditLog.count({
        where: {
          timestamp: { gte: startDate, lte: endDate },
          action: {
            in: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT']
          }
        }
      });

      // Usuários únicos ativos
      const activeUsers = await prisma.auditLog.groupBy({
        by: ['userId'],
        where: {
          timestamp: { gte: startDate, lte: endDate },
          userId: { not: null }
        },
        _count: true
      });

      // Recursos mais acessados
      const resourceAccess = await prisma.auditLog.groupBy({
        by: ['resource'],
        where: { timestamp: { gte: startDate, lte: endDate } },
        _count: true,
        orderBy: { _count: { resource: 'desc' } }
      });

      // Falhas de segurança
      const securityFailures = await prisma.auditLog.count({
        where: {
          timestamp: { gte: startDate, lte: endDate },
          success: false,
          action: { contains: 'AUTH' }
        }
      });

      // Acessos por horário (para detectar atividades fora do horário)
      const hourlyAccess = await this._getHourlyAccessPattern(startDate, endDate);

      return {
        success: true,
        data: {
          report: {
            period: {
              start: startDate,
              end: endDate,
              days: periodDays
            },
            overview: {
              totalActivities,
              criticalActivities,
              uniqueActiveUsers: activeUsers.length,
              securityFailures,
              complianceScore: this._calculateComplianceScore({
                totalActivities,
                criticalActivities,
                securityFailures
              })
            },
            resourceAccess: resourceAccess.map(item => ({
              resource: item.resource,
              accessCount: item._count
            })),
            hourlyPattern: hourlyAccess,
            recommendations: this._generateComplianceRecommendations({
              securityFailures,
              totalActivities,
              hourlyAccess
            })
          },
          generatedAt: new Date(),
          generatedBy: 'system'
        }
      };
    } catch (error) {
      logger.error('Error in generateComplianceReport:', error);
      throw error;
    }
  }

  /**
   * Limpa logs antigos baseado em política de retenção
   */
  async cleanupOldLogs(retentionDays = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const deletedLogs = await prisma.auditLog.deleteMany({
        where: {
          timestamp: { lt: cutoffDate },
          // Manter logs críticos por mais tempo
          action: {
            notIn: ['LOGIN_FAILED', 'SECURITY_VIOLATION', 'DATA_BREACH', 'ADMIN_ACTION']
          }
        }
      });

      logger.info('Audit logs cleanup completed', {
        deletedCount: deletedLogs.count,
        cutoffDate,
        retentionDays
      });

      return {
        success: true,
        data: {
          deletedCount: deletedLogs.count,
          cutoffDate,
          retentionDays
        }
      };
    } catch (error) {
      logger.error('Error in cleanupOldLogs:', error);
      throw error;
    }
  }

  // ==========================================
  // MÉTODOS PRIVADOS
  // ==========================================

  /**
   * Parse seguro de JSON
   */
  _safeJsonParse(jsonString) {
    try {
      return jsonString ? JSON.parse(jsonString) : {};
    } catch {
      return {};
    }
  }

  /**
   * Obtém número de dias baseado no período
   */
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

  /**
   * Classifica severidade de evento de segurança
   */
  _classifySecuritySeverity(log) {
    if (log.action === 'LOGIN' && !log.success) {
      return 'high';
    }

    if (log.details?.error?.includes('PERMISSION_DENIED')) {
      return 'medium';
    }

    if (log.details?.error?.includes('UNAUTHORIZED')) {
      return 'high';
    }

    if (log.action.includes('DELETE') && !log.success) {
      return 'critical';
    }

    return 'low';
  }

  /**
   * Conta logs por severidade
   */
  _countBySeverity(logs) {
    return logs.reduce((acc, log) => {
      acc[log.severity] = (acc[log.severity] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Obtém padrão de acesso por horário
   */
  async _getHourlyAccessPattern(startDate, endDate) {
    // Simular padrão por hora (em produção seria uma query mais complexa)
    const hourlyPattern = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: Math.floor(Math.random() * 100) // Placeholder
    }));

    return hourlyPattern;
  }

  /**
   * Calcula score de compliance
   */
  _calculateComplianceScore({ totalActivities, criticalActivities, securityFailures }) {
    if (totalActivities === 0) return 100;

    const securityFailureRate = (securityFailures / totalActivities) * 100;
    const criticalActivityRate = (criticalActivities / totalActivities) * 100;

    // Score baseado em taxa de falhas de segurança (menor é melhor)
    let score = 100 - (securityFailureRate * 10);

    // Bonus por ter atividades críticas auditadas
    if (criticalActivityRate > 20) {
      score += 10;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Gera recomendações de compliance
   */
  _generateComplianceRecommendations({ securityFailures, totalActivities, hourlyAccess }) {
    const recommendations = [];

    if (securityFailures > totalActivities * 0.1) {
      recommendations.push({
        type: 'security',
        priority: 'high',
        message: 'Alta taxa de falhas de segurança detectada. Revisar políticas de acesso.'
      });
    }

    if (totalActivities < 100) {
      recommendations.push({
        type: 'monitoring',
        priority: 'medium',
        message: 'Baixa atividade de auditoria. Verificar se todos os sistemas estão logando corretamente.'
      });
    }

    recommendations.push({
      type: 'maintenance',
      priority: 'low',
      message: 'Executar limpeza de logs antigos conforme política de retenção.'
    });

    return recommendations;
  }
}

module.exports = new AuditService();