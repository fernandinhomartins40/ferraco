const backupService = require('../services/backupService');
const logger = require('../utils/logger');

/**
 * Backup Controller
 * Controlador para gerenciamento de backups automáticos
 */
class BackupController {
  /**
   * Cria um backup completo
   */
  async createFullBackup(req, res) {
    try {
      const { includeFiles = true, compression = true } = req.body;

      const result = await backupService.createFullBackup({
        includeFiles,
        compression,
        triggeredBy: req.user.id
      });

      logger.info('Full backup created via API', {
        requestedBy: req.user.id,
        backupId: result.data.backupId,
        size: result.data.size
      });

      res.status(200).json({
        success: true,
        message: 'Backup completo criado com sucesso',
        data: result.data
      });

    } catch (error) {
      logger.error('Error creating full backup:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao criar backup completo',
        error: error.message
      });
    }
  }

  /**
   * Cria um backup incremental
   */
  async createIncrementalBackup(req, res) {
    try {
      const { includeFiles = true, compression = true } = req.body;

      const result = await backupService.createIncrementalBackup({
        includeFiles,
        compression,
        triggeredBy: req.user.id
      });

      logger.info('Incremental backup created via API', {
        requestedBy: req.user.id,
        backupId: result.data.backupId,
        size: result.data.size
      });

      res.status(200).json({
        success: true,
        message: 'Backup incremental criado com sucesso',
        data: result.data
      });

    } catch (error) {
      logger.error('Error creating incremental backup:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao criar backup incremental',
        error: error.message
      });
    }
  }

  /**
   * Lista todos os backups
   */
  async listBackups(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        status,
        startDate,
        endDate
      } = req.query;

      const result = await backupService.listBackups({
        page: parseInt(page),
        limit: parseInt(limit),
        type,
        status,
        startDate,
        endDate
      });

      logger.info('Backups listed', {
        requestedBy: req.user.id,
        resultCount: result.data.backups.length,
        filters: { type, status, startDate, endDate }
      });

      res.status(200).json({
        success: true,
        message: 'Lista de backups recuperada com sucesso',
        data: result.data,
        pagination: result.pagination
      });

    } catch (error) {
      logger.error('Error listing backups:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao listar backups',
        error: error.message
      });
    }
  }

  /**
   * Obtém detalhes de um backup específico
   */
  async getBackupDetails(req, res) {
    try {
      const { backupId } = req.params;

      const result = await backupService.getBackupDetails(backupId);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: 'Backup não encontrado',
          error: 'BACKUP_NOT_FOUND'
        });
      }

      logger.info('Backup details retrieved', {
        requestedBy: req.user.id,
        backupId
      });

      res.status(200).json({
        success: true,
        message: 'Detalhes do backup recuperados com sucesso',
        data: result.data
      });

    } catch (error) {
      logger.error('Error getting backup details:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao recuperar detalhes do backup',
        error: error.message
      });
    }
  }

  /**
   * Restaura um backup
   */
  async restoreBackup(req, res) {
    try {
      const { backupId } = req.params;
      const {
        restoreDatabase = true,
        restoreFiles = true,
        confirmRestore = false
      } = req.body;

      if (!confirmRestore) {
        return res.status(400).json({
          success: false,
          message: 'Confirmação de restauração é obrigatória',
          error: 'RESTORE_CONFIRMATION_REQUIRED'
        });
      }

      const result = await backupService.restoreBackup(backupId, {
        restoreDatabase,
        restoreFiles,
        restoredBy: req.user.id
      });

      logger.warn('Backup restore initiated', {
        requestedBy: req.user.id,
        backupId,
        restoreDatabase,
        restoreFiles
      });

      res.status(200).json({
        success: true,
        message: 'Restauração iniciada com sucesso',
        data: result.data
      });

    } catch (error) {
      logger.error('Error restoring backup:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao restaurar backup',
        error: error.message
      });
    }
  }

  /**
   * Deleta um backup
   */
  async deleteBackup(req, res) {
    try {
      const { backupId } = req.params;
      const { confirmDelete = false } = req.body;

      if (!confirmDelete) {
        return res.status(400).json({
          success: false,
          message: 'Confirmação de exclusão é obrigatória',
          error: 'DELETE_CONFIRMATION_REQUIRED'
        });
      }

      const result = await backupService.deleteBackup(backupId);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: 'Backup não encontrado',
          error: 'BACKUP_NOT_FOUND'
        });
      }

      logger.warn('Backup deleted', {
        requestedBy: req.user.id,
        backupId,
        freedSpace: result.data.freedSpace
      });

      res.status(200).json({
        success: true,
        message: 'Backup deletado com sucesso',
        data: result.data
      });

    } catch (error) {
      logger.error('Error deleting backup:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao deletar backup',
        error: error.message
      });
    }
  }

  /**
   * Obtém estatísticas de backup
   */
  async getBackupStats(req, res) {
    try {
      const { period = 'month' } = req.query;

      const result = await backupService.getBackupStats(period);

      logger.info('Backup stats retrieved', {
        requestedBy: req.user.id,
        period
      });

      res.status(200).json({
        success: true,
        message: 'Estatísticas de backup recuperadas com sucesso',
        data: result.data
      });

    } catch (error) {
      logger.error('Error getting backup stats:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao recuperar estatísticas de backup',
        error: error.message
      });
    }
  }

  /**
   * Obtém configurações de backup
   */
  async getBackupSettings(req, res) {
    try {
      const result = await backupService.getBackupSettings();

      res.status(200).json({
        success: true,
        message: 'Configurações de backup recuperadas com sucesso',
        data: result.data
      });

    } catch (error) {
      logger.error('Error getting backup settings:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao recuperar configurações de backup',
        error: error.message
      });
    }
  }

  /**
   * Atualiza configurações de backup
   */
  async updateBackupSettings(req, res) {
    try {
      const {
        autoBackupEnabled,
        backupSchedule,
        retentionDays,
        maxBackups,
        compressionEnabled,
        webhookUrl
      } = req.body;

      const result = await backupService.updateBackupSettings({
        autoBackupEnabled,
        backupSchedule,
        retentionDays,
        maxBackups,
        compressionEnabled,
        webhookUrl,
        updatedBy: req.user.id
      });

      logger.info('Backup settings updated', {
        requestedBy: req.user.id,
        changes: req.body
      });

      res.status(200).json({
        success: true,
        message: 'Configurações de backup atualizadas com sucesso',
        data: result.data
      });

    } catch (error) {
      logger.error('Error updating backup settings:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar configurações de backup',
        error: error.message
      });
    }
  }

  /**
   * Verifica integridade de um backup
   */
  async verifyBackup(req, res) {
    try {
      const { backupId } = req.params;

      const result = await backupService.verifyBackupIntegrity(backupId);

      logger.info('Backup integrity verified', {
        requestedBy: req.user.id,
        backupId,
        isValid: result.data.isValid
      });

      res.status(200).json({
        success: true,
        message: 'Verificação de integridade concluída',
        data: result.data
      });

    } catch (error) {
      logger.error('Error verifying backup:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao verificar integridade do backup',
        error: error.message
      });
    }
  }

  /**
   * Força limpeza de backups antigos
   */
  async cleanupOldBackups(req, res) {
    try {
      const { dryRun = false } = req.body;

      const result = await backupService.cleanupOldBackups(dryRun);

      logger.info('Backup cleanup performed', {
        requestedBy: req.user.id,
        dryRun,
        cleanedCount: result.data.cleanedBackups?.length || 0,
        freedSpace: result.data.totalFreedSpace
      });

      res.status(200).json({
        success: true,
        message: dryRun ?
          'Simulação de limpeza concluída' :
          'Limpeza de backups concluída',
        data: result.data
      });

    } catch (error) {
      logger.error('Error cleaning up backups:', error);

      res.status(500).json({
        success: false,
        message: 'Erro na limpeza de backups',
        error: error.message
      });
    }
  }

  /**
   * Dashboard de backup (resumo executivo)
   */
  async getBackupDashboard(req, res) {
    try {
      const { period = 'week' } = req.query;

      // Obter dados do dashboard em paralelo
      const [statsResult, settingsResult, recentBackups] = await Promise.all([
        backupService.getBackupStats(period),
        backupService.getBackupSettings(),
        backupService.listBackups({ limit: 5, page: 1 })
      ]);

      const dashboard = {
        period,
        stats: statsResult.data,
        settings: settingsResult.data,
        recentBackups: recentBackups.data.backups,
        alerts: this._generateBackupAlerts(statsResult.data, settingsResult.data),
        lastUpdated: new Date().toISOString()
      };

      logger.info('Backup dashboard retrieved', {
        requestedBy: req.user.id,
        period
      });

      res.status(200).json({
        success: true,
        message: 'Dashboard de backup recuperado com sucesso',
        data: dashboard
      });

    } catch (error) {
      logger.error('Error getting backup dashboard:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao recuperar dashboard de backup',
        error: error.message
      });
    }
  }

  // ==========================================
  // MÉTODOS PRIVADOS
  // ==========================================

  /**
   * Gera alertas baseados nos dados de backup
   */
  _generateBackupAlerts(stats, settings) {
    const alerts = [];

    // Alerta se não há backup recente
    if (stats.daysSinceLastBackup > 7) {
      alerts.push({
        type: 'danger',
        message: `Último backup há ${stats.daysSinceLastBackup} dias`,
        priority: 'high',
        category: 'backup'
      });
    }

    // Alerta se backup automático está desabilitado
    if (!settings.autoBackupEnabled) {
      alerts.push({
        type: 'warning',
        message: 'Backup automático está desabilitado',
        priority: 'medium',
        category: 'settings'
      });
    }

    // Alerta de espaço em disco
    if (stats.diskUsage > 80) {
      alerts.push({
        type: 'warning',
        message: `Uso de disco alto: ${stats.diskUsage}%`,
        priority: 'medium',
        category: 'storage'
      });
    }

    // Alerta de falhas de backup
    if (stats.recentFailures > 2) {
      alerts.push({
        type: 'danger',
        message: `${stats.recentFailures} falhas de backup recentes`,
        priority: 'high',
        category: 'reliability'
      });
    }

    return alerts;
  }
}

module.exports = new BackupController();