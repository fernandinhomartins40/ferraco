const aiService = require('../services/aiService');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Worker para processar detecção de duplicatas em background
 */
class DuplicateDetectionWorker {
  /**
   * Processa job de detecção individual de duplicatas
   */
  static async processDetectDuplicates(job) {
    const { leadId, options = {} } = job.data;

    logger.info('Iniciando job de detecção de duplicatas', {
      jobId: job.id,
      leadId,
      options
    });

    try {
      const result = await aiService.detectDuplicateLeads(leadId, options);

      // Adicionar ao log do job
      const jobLog = {
        leadId,
        duplicatesFound: result.data.duplicates.length,
        highConfidenceDuplicates: result.data.statistics.highConfidence,
        algorithms: options.algorithms || [],
        threshold: options.threshold || 0.75,
        completedAt: new Date()
      };

      logger.info('Job de detecção concluído', {
        jobId: job.id,
        ...jobLog
      });

      return {
        success: true,
        data: result.data,
        jobLog
      };

    } catch (error) {
      logger.error('Erro no job de detecção de duplicatas', {
        jobId: job.id,
        leadId,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Processa job de detecção em lote
   */
  static async processBulkDetection(job) {
    const { options = {} } = job.data;

    logger.info('Iniciando job de detecção em lote', {
      jobId: job.id,
      options
    });

    try {
      // Atualizar progresso do job
      await job.progress(10);

      const result = await aiService.runBulkDuplicateDetection(options);

      await job.progress(90);

      const jobLog = {
        totalLeads: result.data.statistics.totalLeads,
        duplicatesFound: result.data.statistics.duplicatesFound,
        duplicateGroups: result.data.statistics.duplicateGroups,
        errors: result.data.statistics.errors,
        successRate: result.data.statistics.successRate,
        completedAt: new Date()
      };

      logger.info('Job de detecção em lote concluído', {
        jobId: job.id,
        ...jobLog
      });

      await job.progress(100);

      return {
        success: true,
        data: result.data,
        jobLog
      };

    } catch (error) {
      logger.error('Erro no job de detecção em lote', {
        jobId: job.id,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Processa job de merge de leads
   */
  static async processMergeLeads(job) {
    const { primaryLeadId, duplicateLeadIds, options = {} } = job.data;

    logger.info('Iniciando job de merge de leads', {
      jobId: job.id,
      primaryLeadId,
      duplicateCount: duplicateLeadIds.length,
      options
    });

    try {
      const result = await aiService.mergeLeads(primaryLeadId, duplicateLeadIds, options);

      const jobLog = {
        primaryLeadId,
        duplicateLeadIds,
        mergedItems: result.data.statistics.totalItemsMerged,
        strategy: options.strategy || 'keep_primary',
        completedAt: new Date()
      };

      logger.info('Job de merge concluído', {
        jobId: job.id,
        ...jobLog
      });

      return {
        success: true,
        data: result.data,
        jobLog
      };

    } catch (error) {
      logger.error('Erro no job de merge de leads', {
        jobId: job.id,
        primaryLeadId,
        duplicateLeadIds,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Processa job de verificação preventiva em lote
   */
  static async processPreventiveCheck(job) {
    const { leadData, options = {} } = job.data;

    logger.info('Iniciando job de verificação preventiva', {
      jobId: job.id,
      leadData: {
        name: leadData.name?.substring(0, 20),
        hasEmail: !!leadData.email,
        hasPhone: !!leadData.phone
      }
    });

    try {
      const result = await aiService.preventiveDuplicateCheck(leadData);

      const jobLog = {
        leadData: {
          name: leadData.name,
          email: leadData.email,
          phone: leadData.phone
        },
        duplicatesFound: result.data.duplicatesFound,
        matchesCount: result.data.matches.length,
        recommendation: result.data.recommendation,
        completedAt: new Date()
      };

      logger.info('Job de verificação preventiva concluído', {
        jobId: job.id,
        ...jobLog
      });

      return {
        success: true,
        data: result.data,
        jobLog
      };

    } catch (error) {
      logger.error('Erro no job de verificação preventiva', {
        jobId: job.id,
        leadData,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Processa job de limpeza automática de duplicatas
   */
  static async processAutoCleanup(job) {
    const {
      autoMergeThreshold = 0.9,
      maxMergesPerRun = 10,
      dryRun = false
    } = job.data;

    logger.info('Iniciando job de limpeza automática', {
      jobId: job.id,
      autoMergeThreshold,
      maxMergesPerRun,
      dryRun
    });

    try {
      await job.progress(10);

      // Buscar detecções de alta confiança não resolvidas
      const highConfidenceDetections = await prisma.duplicateDetection.findMany({
        where: {
          confidence: { gte: autoMergeThreshold },
          resolved: false
        },
        include: {
          lead: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              status: true
            }
          }
        },
        orderBy: { confidence: 'desc' },
        take: maxMergesPerRun
      });

      await job.progress(30);

      const results = {
        detections: highConfidenceDetections.length,
        merged: 0,
        errors: 0,
        dryRun,
        mergeResults: []
      };

      for (let i = 0; i < highConfidenceDetections.length; i++) {
        const detection = highConfidenceDetections[i];

        try {
          const potentialDuplicates = JSON.parse(detection.potentialDuplicates || '[]');

          if (potentialDuplicates.length > 0) {
            const duplicateLeadIds = potentialDuplicates
              .filter(d => d.overallSimilarity >= autoMergeThreshold)
              .map(d => d.candidate.id);

            if (!dryRun && duplicateLeadIds.length > 0) {
              const mergeResult = await aiService.mergeLeads(
                detection.leadId,
                duplicateLeadIds,
                {
                  strategy: 'keep_primary',
                  deleteAfterMerge: false // Seguro para auto-merge
                }
              );

              // Marcar detecção como resolvida
              await aiService.resolveDuplicate(detection.id, 'auto_merged');

              results.merged++;
              results.mergeResults.push({
                detectionId: detection.id,
                primaryLeadId: detection.leadId,
                mergedLeadIds: duplicateLeadIds,
                confidence: detection.confidence
              });
            } else if (dryRun) {
              results.mergeResults.push({
                detectionId: detection.id,
                primaryLeadId: detection.leadId,
                wouldMergeIds: duplicateLeadIds,
                confidence: detection.confidence,
                action: 'DRY_RUN'
              });
            }
          }

          // Atualizar progresso
          await job.progress(30 + (i / highConfidenceDetections.length) * 60);

        } catch (error) {
          results.errors++;
          logger.error('Erro ao processar detecção para auto-merge', {
            detectionId: detection.id,
            error: error.message
          });
        }
      }

      await job.progress(100);

      const jobLog = {
        ...results,
        autoMergeThreshold,
        maxMergesPerRun,
        completedAt: new Date()
      };

      logger.info('Job de limpeza automática concluído', {
        jobId: job.id,
        ...jobLog
      });

      return {
        success: true,
        data: results,
        jobLog
      };

    } catch (error) {
      logger.error('Erro no job de limpeza automática', {
        jobId: job.id,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Processa job de recálculo de scores de similaridade
   */
  static async processRecalculateSimilarity(job) {
    const { leadIds = [], algorithm = 'fuzzy' } = job.data;

    logger.info('Iniciando job de recálculo de similaridade', {
      jobId: job.id,
      leadsCount: leadIds.length,
      algorithm
    });

    try {
      const results = {
        processed: 0,
        updated: 0,
        errors: 0,
        errorDetails: []
      };

      for (let i = 0; i < leadIds.length; i++) {
        const leadId = leadIds[i];

        try {
          // Reprocessar detecção de duplicatas
          const result = await aiService.detectDuplicateLeads(leadId, {
            algorithms: [algorithm],
            threshold: 0.5, // Threshold baixo para capturar mais duplicatas
            includeAI: false // Para performance
          });

          if (result.data.duplicates.length > 0) {
            results.updated++;
          }
          results.processed++;

          // Atualizar progresso
          await job.progress((i / leadIds.length) * 100);

        } catch (error) {
          results.errors++;
          results.errorDetails.push({
            leadId,
            error: error.message
          });

          logger.warn('Erro ao recalcular similaridade para lead', {
            leadId,
            error: error.message
          });
        }
      }

      const jobLog = {
        ...results,
        algorithm,
        totalLeads: leadIds.length,
        completedAt: new Date()
      };

      logger.info('Job de recálculo de similaridade concluído', {
        jobId: job.id,
        ...jobLog
      });

      return {
        success: true,
        data: results,
        jobLog
      };

    } catch (error) {
      logger.error('Erro no job de recálculo de similaridade', {
        jobId: job.id,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Processa job de estatísticas de duplicatas
   */
  static async processGenerateStats(job) {
    const { period = '30d', includeDetails = false } = job.data;

    logger.info('Iniciando job de geração de estatísticas', {
      jobId: job.id,
      period,
      includeDetails
    });

    try {
      await job.progress(20);

      const dashboard = await aiService.getDuplicatesDashboard({
        period,
        includeResolved: true
      });

      await job.progress(60);

      // Estatísticas adicionais se solicitado
      let additionalStats = {};
      if (includeDetails) {
        const periodMap = {
          '7d': 7,
          '30d': 30,
          '90d': 90,
          '1y': 365
        };

        const days = periodMap[period] || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        additionalStats = {
          topDuplicateSources: await this._getTopDuplicateSources(startDate),
          algorithmEffectiveness: await this._getAlgorithmEffectiveness(startDate),
          mergePatterns: await this._getMergePatterns(startDate)
        };
      }

      await job.progress(90);

      const results = {
        dashboard: dashboard.data,
        additionalStats,
        period,
        generatedAt: new Date(),
        includeDetails
      };

      await job.progress(100);

      const jobLog = {
        period,
        includeDetails,
        totalDetections: dashboard.data.overview.totalDetections,
        completedAt: new Date()
      };

      logger.info('Job de geração de estatísticas concluído', {
        jobId: job.id,
        ...jobLog
      });

      return {
        success: true,
        data: results,
        jobLog
      };

    } catch (error) {
      logger.error('Erro no job de geração de estatísticas', {
        jobId: job.id,
        error: error.message
      });

      throw error;
    }
  }

  // ===== MÉTODOS AUXILIARES =====

  static async _getTopDuplicateSources(startDate) {
    // Implementar lógica para identificar as principais fontes de duplicatas
    return {
      sources: [
        { source: 'website', duplicates: 45, percentage: 35 },
        { source: 'social', duplicates: 32, percentage: 25 },
        { source: 'referral', duplicates: 25, percentage: 20 },
        { source: 'ads', duplicates: 26, percentage: 20 }
      ]
    };
  }

  static async _getAlgorithmEffectiveness(startDate) {
    // Implementar lógica para avaliar efetividade dos algoritmos
    return {
      effectiveness: {
        exact: { accuracy: 0.95, falsePositives: 0.02 },
        fuzzy: { accuracy: 0.78, falsePositives: 0.15 },
        semantic: { accuracy: 0.85, falsePositives: 0.08 },
        phonetic: { accuracy: 0.65, falsePositives: 0.25 }
      }
    };
  }

  static async _getMergePatterns(startDate) {
    // Implementar lógica para identificar padrões de merge
    return {
      patterns: {
        averageMergeTime: '2.5 hours',
        preferredStrategy: 'keep_primary',
        peakMergeHours: ['09:00-11:00', '14:00-16:00'],
        automaticMergeRate: '25%'
      }
    };
  }
}

module.exports = DuplicateDetectionWorker;