const auditService = require('../services/auditService');
const logger = require('../utils/logger');

/**
 * Audit Controller
 * Controlador para consulta e gerenciamento de logs de auditoria
 */
class AuditController {
  /**
   * Lista logs de auditoria
   */
  async listAuditLogs(req, res) {
    try {
      const result = await auditService.listAuditLogs(req.query);

      logger.info('Audit logs retrieved', {
        requestedBy: req.user.id,
        filters: req.query,
        resultCount: result.data.logs.length
      });

      res.status(200).json({
        success: true,
        message: 'Logs de auditoria recuperados com sucesso',
        data: result.data,
        pagination: result.pagination
      });

    } catch (error) {
      logger.error('Error listing audit logs:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao recuperar logs de auditoria',
        error: error.message
      });
    }
  }

  /**
   * Obtém estatísticas de auditoria
   */
  async getAuditStats(req, res) {
    try {
      const { period = 'week' } = req.query;
      const result = await auditService.getAuditStats(period);

      logger.info('Audit stats retrieved', {
        requestedBy: req.user.id,
        period
      });

      res.status(200).json({
        success: true,
        message: 'Estatísticas de auditoria recuperadas com sucesso',
        data: result.data
      });

    } catch (error) {
      logger.error('Error getting audit stats:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao recuperar estatísticas de auditoria',
        error: error.message
      });
    }
  }

  /**
   * Obtém logs de auditoria de um usuário específico
   */
  async getUserAuditLogs(req, res) {
    try {
      const { userId } = req.params;
      const result = await auditService.getUserAuditLogs(userId, req.query);

      logger.info('User audit logs retrieved', {
        requestedBy: req.user.id,
        targetUserId: userId,
        resultCount: result.data.logs.length
      });

      res.status(200).json({
        success: true,
        message: 'Logs de auditoria do usuário recuperados com sucesso',
        data: result.data,
        pagination: result.pagination
      });

    } catch (error) {
      logger.error('Error getting user audit logs:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao recuperar logs de auditoria do usuário',
        error: error.message
      });
    }
  }

  /**
   * Obtém eventos de segurança suspeitos
   */
  async getSecurityEvents(req, res) {
    try {
      const result = await auditService.getSecurityEvents(req.query);

      logger.info('Security events retrieved', {
        requestedBy: req.user.id,
        filters: req.query,
        eventCount: result.data.events.length
      });

      res.status(200).json({
        success: true,
        message: 'Eventos de segurança recuperados com sucesso',
        data: result.data,
        pagination: result.pagination
      });

    } catch (error) {
      logger.error('Error getting security events:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao recuperar eventos de segurança',
        error: error.message
      });
    }
  }

  /**
   * Gera relatório de compliance
   */
  async generateComplianceReport(req, res) {
    try {
      const { period = 'month' } = req.query;
      const result = await auditService.generateComplianceReport(period);

      logger.info('Compliance report generated', {
        requestedBy: req.user.id,
        period,
        complianceScore: result.data.report.overview.complianceScore
      });

      res.status(200).json({
        success: true,
        message: 'Relatório de compliance gerado com sucesso',
        data: result.data
      });

    } catch (error) {
      logger.error('Error generating compliance report:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao gerar relatório de compliance',
        error: error.message
      });
    }
  }

  /**
   * Exporta logs de auditoria
   */
  async exportAuditLogs(req, res) {
    try {
      const { format = 'json', ...filters } = req.query;

      // Obter logs sem paginação para export
      const result = await auditService.listAuditLogs({
        ...filters,
        limit: 10000 // Limite para export
      });

      const filename = `audit_logs_${new Date().toISOString().split('T')[0]}.${format}`;

      logger.info('Audit logs exported', {
        requestedBy: req.user.id,
        format,
        recordCount: result.data.logs.length
      });

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Converter para CSV
        const csvData = this._convertToCSV(result.data.logs);
        res.send(csvData);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        res.json({
          success: true,
          message: 'Export de logs de auditoria',
          exportedAt: new Date().toISOString(),
          recordCount: result.data.logs.length,
          data: result.data.logs
        });
      }

    } catch (error) {
      logger.error('Error exporting audit logs:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao exportar logs de auditoria',
        error: error.message
      });
    }
  }

  /**
   * Busca em logs de auditoria
   */
  async searchAuditLogs(req, res) {
    try {
      const { query, field = 'all' } = req.body;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Termo de busca é obrigatório',
          error: 'MISSING_SEARCH_QUERY'
        });
      }

      // Construir filtros baseados no campo de busca
      let filters = {};

      switch (field) {
        case 'user':
          filters.userName = query;
          break;
        case 'action':
          filters.action = query;
          break;
        case 'resource':
          filters.resource = query;
          break;
        case 'ip':
          filters.ipAddress = query;
          break;
        default:
          // Busca em todos os campos (implementação simplificada)
          filters = {
            ...filters,
            userName: query
          };
      }

      const result = await auditService.listAuditLogs({
        ...filters,
        ...req.query
      });

      logger.info('Audit logs search performed', {
        requestedBy: req.user.id,
        searchQuery: query,
        field,
        resultCount: result.data.logs.length
      });

      res.status(200).json({
        success: true,
        message: 'Busca em logs de auditoria concluída',
        data: result.data,
        pagination: result.pagination,
        searchQuery: query,
        searchField: field
      });

    } catch (error) {
      logger.error('Error searching audit logs:', error);

      res.status(500).json({
        success: false,
        message: 'Erro na busca de logs de auditoria',
        error: error.message
      });
    }
  }

  /**
   * Limpa logs antigos
   */
  async cleanupOldLogs(req, res) {
    try {
      const { retentionDays = 90 } = req.body;

      const result = await auditService.cleanupOldLogs(retentionDays);

      logger.info('Audit logs cleanup performed', {
        requestedBy: req.user.id,
        retentionDays,
        deletedCount: result.data.deletedCount
      });

      res.status(200).json({
        success: true,
        message: 'Limpeza de logs antigos concluída',
        data: result.data
      });

    } catch (error) {
      logger.error('Error cleaning up old logs:', error);

      res.status(500).json({
        success: false,
        message: 'Erro na limpeza de logs antigos',
        error: error.message
      });
    }
  }

  /**
   * Dashboard de auditoria (resumo executivo)
   */
  async getAuditDashboard(req, res) {
    try {
      const { period = 'week' } = req.query;

      // Obter estatísticas e eventos de segurança em paralelo
      const [statsResult, securityResult] = await Promise.all([
        auditService.getAuditStats(period),
        auditService.getSecurityEvents({ period, limit: 10 })
      ]);

      const dashboard = {
        period,
        stats: statsResult.data,
        recentSecurityEvents: securityResult.data.events,
        securitySummary: securityResult.data.summary,
        alerts: this._generateAlerts(statsResult.data, securityResult.data),
        lastUpdated: new Date().toISOString()
      };

      logger.info('Audit dashboard retrieved', {
        requestedBy: req.user.id,
        period
      });

      res.status(200).json({
        success: true,
        message: 'Dashboard de auditoria recuperado com sucesso',
        data: dashboard
      });

    } catch (error) {
      logger.error('Error getting audit dashboard:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao recuperar dashboard de auditoria',
        error: error.message
      });
    }
  }

  // ==========================================
  // MÉTODOS PRIVADOS
  // ==========================================

  /**
   * Converte logs para formato CSV
   */
  _convertToCSV(logs) {
    if (logs.length === 0) return '';

    const headers = [
      'timestamp',
      'userId',
      'userName',
      'action',
      'resource',
      'resourceId',
      'success',
      'ipAddress',
      'userAgent'
    ];

    const csvRows = [headers.join(',')];

    logs.forEach(log => {
      const row = headers.map(header => {
        let value = log[header] || '';

        // Escapar aspas duplas e quebras de linha
        if (typeof value === 'string') {
          value = value.replace(/"/g, '""');
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            value = `"${value}"`;
          }
        }

        return value;
      });

      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  /**
   * Gera alertas baseados nos dados de auditoria
   */
  _generateAlerts(stats, securityData) {
    const alerts = [];

    // Alerta de alta taxa de falhas
    if (stats.overview.successRate < 90) {
      alerts.push({
        type: 'warning',
        message: `Taxa de sucesso baixa: ${stats.overview.successRate}%`,
        priority: 'high',
        category: 'performance'
      });
    }

    // Alerta de eventos de segurança
    if (securityData.summary.total > 50) {
      alerts.push({
        type: 'danger',
        message: `${securityData.summary.total} eventos de segurança detectados`,
        priority: 'critical',
        category: 'security'
      });
    }

    // Alerta de IP suspeito
    const suspiciousIPs = stats.activeIPs.filter(ip => ip.requestCount > 1000);
    if (suspiciousIPs.length > 0) {
      alerts.push({
        type: 'warning',
        message: `${suspiciousIPs.length} IP(s) com atividade suspeita`,
        priority: 'medium',
        category: 'security'
      });
    }

    return alerts;
  }
}

module.exports = new AuditController();