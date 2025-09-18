const fs = require('fs').promises;
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Worker para processar jobs de limpeza
 */
async function cleanupWorker(job) {
  const { data } = job;
  const { type } = data;

  try {
    logger.info('Iniciando processamento de job de limpeza', {
      jobId: job.id,
      type
    });

    await job.progress(10);

    let result;

    switch (type) {
      case 'cleanup_task':
        result = await performCleanup(job, data);
        break;

      case 'cleanup_old_records':
        result = await cleanupOldRecords(job, data);
        break;

      case 'cleanup_temp_files':
        result = await cleanupTempFiles(job, data);
        break;

      case 'cleanup_logs':
        result = await cleanupLogs(job, data);
        break;

      default:
        throw new Error(`Tipo de job de limpeza desconhecido: ${type}`);
    }

    await job.progress(100);

    logger.info('Job de limpeza processado com sucesso', {
      jobId: job.id,
      type,
      success: result?.success || false
    });

    return result;

  } catch (error) {
    logger.error('Erro ao processar job de limpeza', {
      jobId: job.id,
      type,
      error: error.message
    });
    throw error;
  }
}

async function performCleanup(job, data) {
  const { tasks = ['old_records', 'temp_files', 'logs'] } = data;

  const results = [];

  for (const task of tasks) {
    try {
      let result;

      switch (task) {
        case 'old_records':
          result = await cleanupOldRecords(job, { daysOld: 90 });
          break;
        case 'temp_files':
          result = await cleanupTempFiles(job, { daysOld: 7 });
          break;
        case 'logs':
          result = await cleanupLogs(job, { daysOld: 30 });
          break;
        default:
          logger.warn(`Tarefa de limpeza desconhecida: ${task}`);
          continue;
      }

      results.push({ task, success: true, ...result });

    } catch (error) {
      logger.error(`Erro na tarefa de limpeza '${task}'`, {
        error: error.message
      });
      results.push({ task, success: false, error: error.message });
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;

  return {
    success: true,
    totalTasks: tasks.length,
    successCount,
    failureCount,
    results
  };
}

async function cleanupOldRecords(job, data) {
  const { daysOld = 90 } = data;

  try {
    await job.progress(20);

    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

    const cleanupOperations = [
      // Execuções de automação antigas (sucesso)
      prisma.automationExecution.deleteMany({
        where: {
          status: 'SUCCESS',
          completedAt: { lt: cutoffDate }
        }
      }),

      // Logs de webhook antigos (sucesso)
      prisma.webhookLog.deleteMany({
        where: {
          success: true,
          sentAt: { lt: cutoffDate }
        }
      }),

      // Comunicações antigas (não falhas)
      prisma.communication.deleteMany({
        where: {
          status: { not: 'FAILED' },
          sentAt: { lt: cutoffDate }
        }
      }),

      // Análises de sentimento antigas
      prisma.sentimentAnalysis.deleteMany({
        where: {
          analyzedAt: { lt: cutoffDate }
        }
      })
    ];

    await job.progress(60);

    const results = await Promise.all(cleanupOperations);

    await job.progress(90);

    const totalDeleted = results.reduce((sum, result) => sum + result.count, 0);

    logger.info('Registros antigos limpos', {
      daysOld,
      cutoffDate,
      totalDeleted,
      breakdown: {
        automationExecutions: results[0].count,
        webhookLogs: results[1].count,
        communications: results[2].count,
        sentimentAnalyses: results[3].count
      }
    });

    return {
      success: true,
      daysOld,
      totalDeleted,
      breakdown: {
        automationExecutions: results[0].count,
        webhookLogs: results[1].count,
        communications: results[2].count,
        sentimentAnalyses: results[3].count
      }
    };

  } catch (error) {
    logger.error('Erro ao limpar registros antigos', {
      daysOld,
      error: error.message
    });
    throw error;
  }
}

async function cleanupTempFiles(job, data) {
  const { daysOld = 7 } = data;

  try {
    await job.progress(20);

    const tempDirs = [
      path.join(process.cwd(), 'temp'),
      path.join(process.cwd(), 'uploads', 'temp'),
      path.join(process.cwd(), 'reports', 'temp')
    ];

    const cutoffDate = Date.now() - daysOld * 24 * 60 * 60 * 1000;
    let totalFilesDeleted = 0;
    let totalSizeFreed = 0;

    await job.progress(40);

    for (const tempDir of tempDirs) {
      try {
        await fs.access(tempDir);
        const files = await fs.readdir(tempDir);

        await job.progress(50 + (tempDirs.indexOf(tempDir) * 20));

        for (const file of files) {
          const filePath = path.join(tempDir, file);
          const stats = await fs.stat(filePath);

          if (stats.mtime.getTime() < cutoffDate) {
            await fs.unlink(filePath);
            totalFilesDeleted++;
            totalSizeFreed += stats.size;
          }
        }

      } catch (error) {
        // Diretório não existe ou erro de acesso - não é crítico
        logger.debug(`Erro ao acessar diretório temporário: ${tempDir}`, {
          error: error.message
        });
      }
    }

    await job.progress(90);

    logger.info('Arquivos temporários limpos', {
      daysOld,
      totalFilesDeleted,
      totalSizeFreed: `${(totalSizeFreed / 1024 / 1024).toFixed(2)} MB`
    });

    return {
      success: true,
      daysOld,
      totalFilesDeleted,
      totalSizeFreed
    };

  } catch (error) {
    logger.error('Erro ao limpar arquivos temporários', {
      daysOld,
      error: error.message
    });
    throw error;
  }
}

async function cleanupLogs(job, data) {
  const { daysOld = 30 } = data;

  try {
    await job.progress(20);

    const logDirs = [
      path.join(process.cwd(), 'logs'),
      path.join(process.cwd(), 'backend', 'logs'),
      path.join(process.cwd(), 'var', 'log')
    ];

    const cutoffDate = Date.now() - daysOld * 24 * 60 * 60 * 1000;
    let totalLogFilesDeleted = 0;
    let totalLogSizeFreed = 0;

    await job.progress(40);

    for (const logDir of logDirs) {
      try {
        await fs.access(logDir);
        const files = await fs.readdir(logDir);

        await job.progress(50 + (logDirs.indexOf(logDir) * 20));

        for (const file of files) {
          // Apenas arquivos de log antigos
          if (file.endsWith('.log') || file.endsWith('.log.gz')) {
            const filePath = path.join(logDir, file);
            const stats = await fs.stat(filePath);

            if (stats.mtime.getTime() < cutoffDate) {
              await fs.unlink(filePath);
              totalLogFilesDeleted++;
              totalLogSizeFreed += stats.size;
            }
          }
        }

      } catch (error) {
        // Diretório não existe ou erro de acesso - não é crítico
        logger.debug(`Erro ao acessar diretório de logs: ${logDir}`, {
          error: error.message
        });
      }
    }

    await job.progress(90);

    logger.info('Arquivos de log limpos', {
      daysOld,
      totalLogFilesDeleted,
      totalLogSizeFreed: `${(totalLogSizeFreed / 1024 / 1024).toFixed(2)} MB`
    });

    return {
      success: true,
      daysOld,
      totalLogFilesDeleted,
      totalLogSizeFreed
    };

  } catch (error) {
    logger.error('Erro ao limpar arquivos de log', {
      daysOld,
      error: error.message
    });
    throw error;
  }
}

module.exports = cleanupWorker;