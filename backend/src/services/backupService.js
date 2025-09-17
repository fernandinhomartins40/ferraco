const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const cron = require('node-cron');
const logger = require('../utils/logger');

/**
 * Backup Service
 * Sistema completo de backup automático para SQLite e arquivos
 */
class BackupService {
  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups');
    this.dbPath = path.join(process.cwd(), 'data', 'ferraco.db');
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    this.isRunning = false;
    this.scheduledJobs = [];
  }

  /**
   * Inicializa o sistema de backup
   */
  async initialize() {
    try {
      // Criar diretório de backup se não existir
      await this._ensureBackupDirectory();

      // Configurar backups automáticos
      await this._scheduleAutomaticBackups();

      logger.info('Backup service initialized successfully');

      return {
        success: true,
        message: 'Sistema de backup inicializado com sucesso'
      };
    } catch (error) {
      logger.error('Error initializing backup service:', error);
      throw error;
    }
  }

  /**
   * Executa backup completo do sistema
   */
  async createFullBackup(options = {}) {
    try {
      if (this.isRunning) {
        throw new Error('Backup já está em execução');
      }

      this.isRunning = true;
      const startTime = Date.now();

      const {
        includeDatabase = true,
        includeUploads = true,
        includeLogs = false,
        compression = true
      } = options;

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `ferraco-backup-${timestamp}`;
      const backupPath = path.join(this.backupDir, backupName);

      // Criar diretório para este backup
      await fs.mkdir(backupPath, { recursive: true });

      const results = {
        backupName,
        backupPath,
        timestamp,
        files: [],
        totalSize: 0,
        duration: 0,
        success: true
      };

      // Backup do banco de dados
      if (includeDatabase) {
        const dbBackupResult = await this._backupDatabase(backupPath);
        results.files.push(dbBackupResult);
        results.totalSize += dbBackupResult.size;
      }

      // Backup de uploads
      if (includeUploads) {
        const uploadsBackupResult = await this._backupUploads(backupPath);
        if (uploadsBackupResult) {
          results.files.push(uploadsBackupResult);
          results.totalSize += uploadsBackupResult.size;
        }
      }

      // Backup de logs
      if (includeLogs) {
        const logsBackupResult = await this._backupLogs(backupPath);
        if (logsBackupResult) {
          results.files.push(logsBackupResult);
          results.totalSize += logsBackupResult.size;
        }
      }

      // Criar arquivo de metadados
      const metadataResult = await this._createBackupMetadata(backupPath, results);
      results.files.push(metadataResult);

      // Compactar backup se solicitado
      if (compression) {
        const compressionResult = await this._compressBackup(backupPath);
        if (compressionResult.success) {
          results.compressedFile = compressionResult.filePath;
          results.compressedSize = compressionResult.size;
          results.compressionRatio = (results.totalSize / compressionResult.size).toFixed(2);

          // Remover diretório não compactado
          await this._removeDirectory(backupPath);
        }
      }

      results.duration = Date.now() - startTime;

      // Limpar backups antigos
      await this._cleanupOldBackups();

      logger.info('Full backup completed successfully', {
        backupName,
        duration: results.duration,
        totalSize: results.totalSize,
        filesCount: results.files.length
      });

      this.isRunning = false;

      return {
        success: true,
        data: results
      };
    } catch (error) {
      this.isRunning = false;
      logger.error('Error creating full backup:', error);
      throw error;
    }
  }

  /**
   * Executa backup incremental
   */
  async createIncrementalBackup(lastBackupDate) {
    try {
      if (this.isRunning) {
        throw new Error('Backup já está em execução');
      }

      this.isRunning = true;
      const startTime = Date.now();

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `ferraco-incremental-${timestamp}`;
      const backupPath = path.join(this.backupDir, backupName);

      await fs.mkdir(backupPath, { recursive: true });

      const results = {
        backupName,
        backupPath,
        timestamp,
        type: 'incremental',
        files: [],
        totalSize: 0,
        duration: 0,
        success: true
      };

      // Backup incremental do banco (sempre incluir)
      const dbBackupResult = await this._backupDatabase(backupPath);
      results.files.push(dbBackupResult);
      results.totalSize += dbBackupResult.size;

      // Backup incremental de uploads (apenas arquivos novos/modificados)
      const uploadsBackupResult = await this._backupUploadsIncremental(backupPath, lastBackupDate);
      if (uploadsBackupResult) {
        results.files.push(uploadsBackupResult);
        results.totalSize += uploadsBackupResult.size;
      }

      // Criar metadados
      const metadataResult = await this._createBackupMetadata(backupPath, results);
      results.files.push(metadataResult);

      results.duration = Date.now() - startTime;

      logger.info('Incremental backup completed successfully', {
        backupName,
        duration: results.duration,
        totalSize: results.totalSize,
        since: lastBackupDate
      });

      this.isRunning = false;

      return {
        success: true,
        data: results
      };
    } catch (error) {
      this.isRunning = false;
      logger.error('Error creating incremental backup:', error);
      throw error;
    }
  }

  /**
   * Lista todos os backups disponíveis
   */
  async listBackups() {
    try {
      const backupFiles = await fs.readdir(this.backupDir);
      const backups = [];

      for (const file of backupFiles) {
        const filePath = path.join(this.backupDir, file);
        const stats = await fs.stat(filePath);

        if (stats.isDirectory()) {
          // Backup não compactado
          try {
            const metadataPath = path.join(filePath, 'metadata.json');
            const metadataContent = await fs.readFile(metadataPath, 'utf8');
            const metadata = JSON.parse(metadataContent);

            backups.push({
              name: file,
              type: 'directory',
              path: filePath,
              size: await this._getDirectorySize(filePath),
              createdAt: stats.birthtime,
              metadata
            });
          } catch (e) {
            // Sem metadados, usar informações básicas
            backups.push({
              name: file,
              type: 'directory',
              path: filePath,
              size: await this._getDirectorySize(filePath),
              createdAt: stats.birthtime,
              metadata: null
            });
          }
        } else if (file.endsWith('.tar.gz') || file.endsWith('.zip')) {
          // Backup compactado
          backups.push({
            name: file,
            type: 'compressed',
            path: filePath,
            size: stats.size,
            createdAt: stats.birthtime,
            metadata: null
          });
        }
      }

      // Ordenar por data (mais recente primeiro)
      backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return {
        success: true,
        data: { backups }
      };
    } catch (error) {
      logger.error('Error listing backups:', error);
      throw error;
    }
  }

  /**
   * Restaura backup do banco de dados
   */
  async restoreDatabase(backupName) {
    try {
      const backupPath = path.join(this.backupDir, backupName);
      const dbBackupPath = path.join(backupPath, 'ferraco.db');

      // Verificar se o backup existe
      try {
        await fs.access(dbBackupPath);
      } catch (error) {
        throw new Error('Arquivo de backup do banco não encontrado');
      }

      // Fazer backup do banco atual antes de restaurar
      const currentBackupName = `pre-restore-${Date.now()}`;
      await this.createFullBackup({
        includeUploads: false,
        includeLogs: false,
        compression: false
      });

      // Restaurar banco
      await fs.copyFile(dbBackupPath, this.dbPath);

      logger.info('Database restored successfully', {
        backupName,
        restoredAt: new Date().toISOString()
      });

      return {
        success: true,
        message: 'Banco de dados restaurado com sucesso',
        data: {
          backupName,
          restoredAt: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Error restoring database:', error);
      throw error;
    }
  }

  /**
   * Remove backup específico
   */
  async removeBackup(backupName) {
    try {
      const backupPath = path.join(this.backupDir, backupName);

      // Verificar se o backup existe
      try {
        await fs.access(backupPath);
      } catch (error) {
        throw new Error('Backup não encontrado');
      }

      const stats = await fs.stat(backupPath);

      if (stats.isDirectory()) {
        await this._removeDirectory(backupPath);
      } else {
        await fs.unlink(backupPath);
      }

      logger.info('Backup removed successfully', { backupName });

      return {
        success: true,
        message: 'Backup removido com sucesso'
      };
    } catch (error) {
      logger.error('Error removing backup:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas dos backups
   */
  async getBackupStats() {
    try {
      const backupsResult = await this.listBackups();
      const backups = backupsResult.data.backups;

      const stats = {
        totalBackups: backups.length,
        totalSize: backups.reduce((sum, backup) => sum + backup.size, 0),
        oldestBackup: backups.length > 0 ? backups[backups.length - 1].createdAt : null,
        newestBackup: backups.length > 0 ? backups[0].createdAt : null,
        backupsByType: {
          full: backups.filter(b => !b.name.includes('incremental')).length,
          incremental: backups.filter(b => b.name.includes('incremental')).length
        },
        avgBackupSize: backups.length > 0 ?
          Math.round(backups.reduce((sum, backup) => sum + backup.size, 0) / backups.length) : 0,
        isScheduled: this.scheduledJobs.length > 0,
        nextScheduledBackup: this._getNextScheduledBackup()
      };

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      logger.error('Error getting backup stats:', error);
      throw error;
    }
  }

  // ==========================================
  // MÉTODOS PRIVADOS
  // ==========================================

  /**
   * Garante que o diretório de backup existe
   */
  async _ensureBackupDirectory() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      logger.error('Error creating backup directory:', error);
      throw error;
    }
  }

  /**
   * Agenda backups automáticos
   */
  async _scheduleAutomaticBackups() {
    try {
      // Backup completo diário às 02:00
      const dailyBackup = cron.schedule('0 2 * * *', async () => {
        try {
          logger.info('Starting scheduled daily backup');
          await this.createFullBackup({
            includeDatabase: true,
            includeUploads: true,
            includeLogs: true,
            compression: true
          });
        } catch (error) {
          logger.error('Scheduled daily backup failed:', error);
        }
      }, { scheduled: false });

      // Backup incremental a cada 6 horas
      const incrementalBackup = cron.schedule('0 */6 * * *', async () => {
        try {
          logger.info('Starting scheduled incremental backup');
          const lastBackupDate = await this._getLastBackupDate();
          await this.createIncrementalBackup(lastBackupDate);
        } catch (error) {
          logger.error('Scheduled incremental backup failed:', error);
        }
      }, { scheduled: false });

      // Limpeza semanal (domingos às 03:00)
      const weeklyCleanup = cron.schedule('0 3 * * 0', async () => {
        try {
          logger.info('Starting scheduled backup cleanup');
          await this._cleanupOldBackups();
        } catch (error) {
          logger.error('Scheduled backup cleanup failed:', error);
        }
      }, { scheduled: false });

      this.scheduledJobs = [
        { name: 'daily-backup', job: dailyBackup },
        { name: 'incremental-backup', job: incrementalBackup },
        { name: 'weekly-cleanup', job: weeklyCleanup }
      ];

      // Iniciar jobs se backups automáticos estiverem habilitados
      if (process.env.ENABLE_AUTO_BACKUP !== 'false') {
        this.scheduledJobs.forEach(({ job }) => job.start());
        logger.info('Automatic backups scheduled successfully');
      }
    } catch (error) {
      logger.error('Error scheduling automatic backups:', error);
      throw error;
    }
  }

  /**
   * Faz backup do banco de dados SQLite
   */
  async _backupDatabase(backupPath) {
    try {
      const dbBackupPath = path.join(backupPath, 'ferraco.db');
      await fs.copyFile(this.dbPath, dbBackupPath);

      const stats = await fs.stat(dbBackupPath);

      return {
        type: 'database',
        filename: 'ferraco.db',
        path: dbBackupPath,
        size: stats.size,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error backing up database:', error);
      throw error;
    }
  }

  /**
   * Faz backup dos uploads
   */
  async _backupUploads(backupPath) {
    try {
      // Verificar se diretório de uploads existe
      try {
        await fs.access(this.uploadsDir);
      } catch (error) {
        // Não há uploads para fazer backup
        return null;
      }

      const uploadsBackupPath = path.join(backupPath, 'uploads');
      await this._copyDirectory(this.uploadsDir, uploadsBackupPath);

      const size = await this._getDirectorySize(uploadsBackupPath);

      return {
        type: 'uploads',
        filename: 'uploads',
        path: uploadsBackupPath,
        size,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error backing up uploads:', error);
      throw error;
    }
  }

  /**
   * Faz backup incremental dos uploads
   */
  async _backupUploadsIncremental(backupPath, since) {
    try {
      try {
        await fs.access(this.uploadsDir);
      } catch (error) {
        return null;
      }

      const uploadsBackupPath = path.join(backupPath, 'uploads');
      await fs.mkdir(uploadsBackupPath, { recursive: true });

      const files = await this._getModifiedFiles(this.uploadsDir, since);
      let totalSize = 0;

      for (const file of files) {
        const sourcePath = path.join(this.uploadsDir, file);
        const destPath = path.join(uploadsBackupPath, file);

        // Criar diretórios necessários
        await fs.mkdir(path.dirname(destPath), { recursive: true });
        await fs.copyFile(sourcePath, destPath);

        const stats = await fs.stat(destPath);
        totalSize += stats.size;
      }

      return {
        type: 'uploads-incremental',
        filename: 'uploads',
        path: uploadsBackupPath,
        size: totalSize,
        filesCount: files.length,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error creating incremental uploads backup:', error);
      throw error;
    }
  }

  /**
   * Faz backup dos logs
   */
  async _backupLogs(backupPath) {
    try {
      const logsDir = path.join(process.cwd(), 'logs');

      try {
        await fs.access(logsDir);
      } catch (error) {
        return null;
      }

      const logsBackupPath = path.join(backupPath, 'logs');
      await this._copyDirectory(logsDir, logsBackupPath);

      const size = await this._getDirectorySize(logsBackupPath);

      return {
        type: 'logs',
        filename: 'logs',
        path: logsBackupPath,
        size,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error backing up logs:', error);
      throw error;
    }
  }

  /**
   * Cria arquivo de metadados do backup
   */
  async _createBackupMetadata(backupPath, backupInfo) {
    try {
      const metadata = {
        version: '1.0',
        createdAt: new Date().toISOString(),
        type: backupInfo.type || 'full',
        files: backupInfo.files,
        totalSize: backupInfo.totalSize,
        nodeVersion: process.version,
        platform: process.platform,
        application: 'Ferraco CRM',
        backupService: 'BackupService v1.0'
      };

      const metadataPath = path.join(backupPath, 'metadata.json');
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

      const stats = await fs.stat(metadataPath);

      return {
        type: 'metadata',
        filename: 'metadata.json',
        path: metadataPath,
        size: stats.size,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error creating backup metadata:', error);
      throw error;
    }
  }

  /**
   * Compacta backup usando tar
   */
  async _compressBackup(backupPath) {
    try {
      const backupName = path.basename(backupPath);
      const compressedPath = `${backupPath}.tar.gz`;

      return new Promise((resolve, reject) => {
        const tar = spawn('tar', ['-czf', compressedPath, '-C', path.dirname(backupPath), backupName]);

        tar.on('close', async (code) => {
          if (code === 0) {
            try {
              const stats = await fs.stat(compressedPath);
              resolve({
                success: true,
                filePath: compressedPath,
                size: stats.size
              });
            } catch (error) {
              reject(error);
            }
          } else {
            reject(new Error(`Compressão falhou com código ${code}`));
          }
        });

        tar.on('error', reject);
      });
    } catch (error) {
      logger.error('Error compressing backup:', error);
      throw error;
    }
  }

  /**
   * Remove backups antigos baseado em política de retenção
   */
  async _cleanupOldBackups() {
    try {
      const retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const backupsResult = await this.listBackups();
      const oldBackups = backupsResult.data.backups.filter(
        backup => new Date(backup.createdAt) < cutoffDate
      );

      let removedCount = 0;
      for (const backup of oldBackups) {
        try {
          await this.removeBackup(backup.name);
          removedCount++;
        } catch (error) {
          logger.error(`Failed to remove old backup ${backup.name}:`, error);
        }
      }

      logger.info('Old backups cleanup completed', {
        removedCount,
        retentionDays,
        cutoffDate
      });

      return removedCount;
    } catch (error) {
      logger.error('Error cleaning up old backups:', error);
      throw error;
    }
  }

  /**
   * Métodos auxiliares
   */
  async _copyDirectory(source, destination) {
    await fs.mkdir(destination, { recursive: true });
    const entries = await fs.readdir(source, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(source, entry.name);
      const destPath = path.join(destination, entry.name);

      if (entry.isDirectory()) {
        await this._copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  async _removeDirectory(dirPath) {
    try {
      await fs.rm(dirPath, { recursive: true, force: true });
    } catch (error) {
      logger.error(`Error removing directory ${dirPath}:`, error);
    }
  }

  async _getDirectorySize(dirPath) {
    let size = 0;

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          size += await this._getDirectorySize(entryPath);
        } else {
          const stats = await fs.stat(entryPath);
          size += stats.size;
        }
      }
    } catch (error) {
      // Ignorar erros de acesso a arquivos
    }

    return size;
  }

  async _getModifiedFiles(dirPath, since) {
    const modifiedFiles = [];
    const sinceDate = new Date(since);

    const scanDirectory = async (currentPath, relativePath = '') => {
      try {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(currentPath, entry.name);
          const relativeFilePath = path.join(relativePath, entry.name);

          if (entry.isDirectory()) {
            await scanDirectory(fullPath, relativeFilePath);
          } else {
            const stats = await fs.stat(fullPath);
            if (stats.mtime > sinceDate) {
              modifiedFiles.push(relativeFilePath);
            }
          }
        }
      } catch (error) {
        // Ignorar erros de acesso
      }
    };

    await scanDirectory(dirPath);
    return modifiedFiles;
  }

  async _getLastBackupDate() {
    try {
      const backupsResult = await this.listBackups();
      const backups = backupsResult.data.backups;

      if (backups.length === 0) {
        return new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 horas atrás
      }

      return new Date(backups[0].createdAt);
    } catch (error) {
      logger.error('Error getting last backup date:', error);
      return new Date(Date.now() - 24 * 60 * 60 * 1000);
    }
  }

  _getNextScheduledBackup() {
    if (this.scheduledJobs.length === 0) {
      return null;
    }

    // Calcular próximo backup diário (02:00)
    const now = new Date();
    const next = new Date();
    next.setHours(2, 0, 0, 0);

    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }

    return next.toISOString();
  }
}

module.exports = new BackupService();