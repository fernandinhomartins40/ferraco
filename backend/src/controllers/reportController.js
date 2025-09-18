const reportService = require('../services/reportService');
const queueService = require('../services/queueService');
const logger = require('../utils/logger');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class ReportController {
  // ===== GERAÇÃO DE RELATÓRIOS =====

  // Gerar relatório personalizado
  async generateReport(req, res) {
    try {
      const reportConfig = req.body;
      const userId = req.user?.id;

      const result = await reportService.generateReport(reportConfig, {
        userId,
        scheduled: false,
        saveToFile: true,
        includeCharts: true
      });

      res.status(201).json({
        success: true,
        message: 'Relatório gerado com sucesso',
        data: result.data
      });

    } catch (error) {
      logger.error('Erro no controller ao gerar relatório', {
        error: error.message,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao gerar relatório',
        error: error.message
      });
    }
  }

  // Gerar relatório a partir de template
  async generateFromTemplate(req, res) {
    try {
      const { templateId } = req.params;
      const customConfig = req.body;
      const userId = req.user?.id;

      const result = await reportService.generateFromTemplate(templateId, customConfig, {
        userId,
        scheduled: false,
        saveToFile: true,
        includeCharts: true
      });

      res.status(201).json({
        success: true,
        message: 'Relatório gerado a partir de template com sucesso',
        data: result.data
      });

    } catch (error) {
      logger.error('Erro no controller ao gerar relatório de template', {
        error: error.message,
        templateId: req.params.templateId,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao gerar relatório de template',
        error: error.message
      });
    }
  }

  // Agendar relatório recorrente
  async scheduleReport(req, res) {
    try {
      const { reportConfig, scheduleConfig } = req.body;
      const userId = req.user?.id;

      const result = await reportService.scheduleReport(reportConfig, scheduleConfig, {
        userId
      });

      res.status(201).json({
        success: true,
        message: 'Relatório agendado com sucesso',
        data: result.data
      });

    } catch (error) {
      logger.error('Erro no controller ao agendar relatório', {
        error: error.message,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao agendar relatório',
        error: error.message
      });
    }
  }

  // ===== GESTÃO DE AGENDAMENTOS =====

  // Buscar relatórios agendados
  async getScheduledReports(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        enabled
      } = req.query;

      const userId = req.user?.id;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = { createdBy: userId };
      if (enabled !== undefined) {
        where.enabled = enabled === 'true';
      }

      const [scheduledReports, total] = await Promise.all([
        prisma.scheduledReport.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit)
        }),
        prisma.scheduledReport.count({ where })
      ]);

      const enrichedReports = scheduledReports.map(report => ({
        ...report,
        config: JSON.parse(report.config || '{}'),
        recipients: JSON.parse(report.recipients || '[]')
      }));

      res.status(200).json({
        success: true,
        message: 'Relatórios agendados recuperados com sucesso',
        data: {
          scheduledReports: enrichedReports,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalItems: total,
            itemsPerPage: parseInt(limit)
          }
        }
      });

    } catch (error) {
      logger.error('Erro no controller ao buscar relatórios agendados', {
        error: error.message,
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar agendamentos',
        error: error.message
      });
    }
  }

  // Atualizar relatório agendado
  async updateScheduledReport(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user?.id;

      const updatedReport = await prisma.scheduledReport.update({
        where: {
          id,
          createdBy: userId
        },
        data: {
          ...updateData,
          ...(updateData.scheduleConfig && {
            frequency: updateData.scheduleConfig.frequency,
            dayOfWeek: updateData.scheduleConfig.dayOfWeek,
            dayOfMonth: updateData.scheduleConfig.dayOfMonth,
            time: updateData.scheduleConfig.time,
            recipients: JSON.stringify(updateData.scheduleConfig.recipients || [])
          }),
          updatedAt: new Date()
        }
      });

      res.status(200).json({
        success: true,
        message: 'Relatório agendado atualizado com sucesso',
        data: {
          ...updatedReport,
          config: JSON.parse(updatedReport.config || '{}'),
          recipients: JSON.parse(updatedReport.recipients || '[]')
        }
      });

    } catch (error) {
      logger.error('Erro no controller ao atualizar relatório agendado', {
        error: error.message,
        reportId: req.params.id,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao atualizar agendamento',
        error: error.message
      });
    }
  }

  // Cancelar relatório agendado
  async cancelScheduledReport(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      await prisma.scheduledReport.delete({
        where: {
          id,
          createdBy: userId
        }
      });

      res.status(200).json({
        success: true,
        message: 'Relatório agendado cancelado com sucesso'
      });

    } catch (error) {
      logger.error('Erro no controller ao cancelar relatório agendado', {
        error: error.message,
        reportId: req.params.id
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao cancelar agendamento',
        error: error.message
      });
    }
  }

  // ===== GESTÃO DE TEMPLATES =====

  // Buscar templates disponíveis
  async getAvailableTemplates(req, res) {
    try {
      const userId = req.user?.id;
      const options = req.query;

      const result = await reportService.getAvailableTemplates(userId, options);

      res.status(200).json({
        success: true,
        message: 'Templates recuperados com sucesso',
        data: result.data
      });

    } catch (error) {
      logger.error('Erro no controller ao buscar templates', {
        error: error.message,
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar templates',
        error: error.message
      });
    }
  }

  // Criar template de relatório
  async createTemplate(req, res) {
    try {
      const templateData = req.body;
      const userId = req.user?.id;

      const result = await reportService.createReportTemplate(templateData, userId);

      res.status(201).json({
        success: true,
        message: 'Template criado com sucesso',
        data: result.data
      });

    } catch (error) {
      logger.error('Erro no controller ao criar template', {
        error: error.message,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao criar template',
        error: error.message
      });
    }
  }

  // Buscar template específico
  async getTemplate(req, res) {
    try {
      const { id } = req.params;

      const template = await prisma.reportTemplate.findUnique({
        where: { id },
        include: {
          _count: {
            select: { reports: true }
          }
        }
      });

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template não encontrado'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Template recuperado com sucesso',
        data: {
          template: {
            ...template,
            config: JSON.parse(template.config || '{}'),
            tags: JSON.parse(template.tags || '[]'),
            usageCount: template._count.reports
          }
        }
      });

    } catch (error) {
      logger.error('Erro no controller ao buscar template', {
        error: error.message,
        templateId: req.params.id
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar template',
        error: error.message
      });
    }
  }

  // Atualizar template
  async updateTemplate(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user?.id;

      const updatedTemplate = await prisma.reportTemplate.update({
        where: {
          id,
          createdBy: userId
        },
        data: {
          ...updateData,
          ...(updateData.config && { config: JSON.stringify(updateData.config) }),
          ...(updateData.tags && { tags: JSON.stringify(updateData.tags) }),
          updatedAt: new Date()
        }
      });

      res.status(200).json({
        success: true,
        message: 'Template atualizado com sucesso',
        data: {
          template: {
            ...updatedTemplate,
            config: JSON.parse(updatedTemplate.config || '{}'),
            tags: JSON.parse(updatedTemplate.tags || '[]')
          }
        }
      });

    } catch (error) {
      logger.error('Erro no controller ao atualizar template', {
        error: error.message,
        templateId: req.params.id,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao atualizar template',
        error: error.message
      });
    }
  }

  // Deletar template
  async deleteTemplate(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      await prisma.reportTemplate.delete({
        where: {
          id,
          createdBy: userId
        }
      });

      res.status(200).json({
        success: true,
        message: 'Template deletado com sucesso'
      });

    } catch (error) {
      logger.error('Erro no controller ao deletar template', {
        error: error.message,
        templateId: req.params.id
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao deletar template',
        error: error.message
      });
    }
  }

  // ===== HISTÓRICO E GESTÃO =====

  // Buscar histórico de relatórios
  async getReportHistory(req, res) {
    try {
      const userId = req.user?.id;
      const options = req.query;

      const result = await reportService.getReportHistory(userId, options);

      res.status(200).json({
        success: true,
        message: 'Histórico de relatórios recuperado com sucesso',
        data: result.data
      });

    } catch (error) {
      logger.error('Erro no controller ao buscar histórico', {
        error: error.message,
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar histórico',
        error: error.message
      });
    }
  }

  // Buscar relatório específico
  async getReport(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const report = await prisma.report.findFirst({
        where: {
          id,
          createdBy: userId
        },
        include: {
          template: {
            select: {
              id: true,
              name: true,
              category: true
            }
          }
        }
      });

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Relatório não encontrado'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Relatório recuperado com sucesso',
        data: {
          report: {
            ...report,
            config: JSON.parse(report.config || '{}'),
            downloadUrl: report.filePath ? `/api/reports/${id}/download` : null
          }
        }
      });

    } catch (error) {
      logger.error('Erro no controller ao buscar relatório', {
        error: error.message,
        reportId: req.params.id
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar relatório',
        error: error.message
      });
    }
  }

  // Baixar relatório
  async downloadReport(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const result = await reportService.downloadReport(id, userId);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: result.message || 'Relatório não encontrado'
        });
      }

      const { filePath, fileName, contentType, size } = result.data;

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', size);

      const fs = require('fs');
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);

    } catch (error) {
      logger.error('Erro no controller ao baixar relatório', {
        error: error.message,
        reportId: req.params.id
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao baixar relatório',
        error: error.message
      });
    }
  }

  // Deletar relatório
  async deleteReport(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      await prisma.report.delete({
        where: {
          id,
          createdBy: userId
        }
      });

      res.status(200).json({
        success: true,
        message: 'Relatório deletado com sucesso'
      });

    } catch (error) {
      logger.error('Erro no controller ao deletar relatório', {
        error: error.message,
        reportId: req.params.id
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao deletar relatório',
        error: error.message
      });
    }
  }

  // ===== ESTATÍSTICAS =====

  // Obter estatísticas de relatórios
  async getReportStats(req, res) {
    try {
      const userId = req.user?.id;
      const { period = '30d' } = req.query;

      const result = await reportService.getReportStats(userId, period);

      res.status(200).json({
        success: true,
        message: 'Estatísticas recuperadas com sucesso',
        data: result.data
      });

    } catch (error) {
      logger.error('Erro no controller ao buscar estatísticas', {
        error: error.message,
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar estatísticas',
        error: error.message
      });
    }
  }

  // Obter estatísticas de uso
  async getUsageStats(req, res) {
    try {
      const { period = '30d', groupBy = 'type' } = req.query;
      const userId = req.user?.id;

      const periodMap = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365
      };

      const days = periodMap[period] || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      let usageStats;

      switch (groupBy) {
        case 'type':
          usageStats = await prisma.report.groupBy({
            by: ['type'],
            where: {
              createdBy: userId,
              createdAt: { gte: startDate }
            },
            _count: { type: true },
            orderBy: { _count: { type: 'desc' } }
          });
          break;

        case 'format':
          usageStats = await prisma.report.groupBy({
            by: ['format'],
            where: {
              createdBy: userId,
              createdAt: { gte: startDate }
            },
            _count: { format: true },
            orderBy: { _count: { format: 'desc' } }
          });
          break;

        case 'template':
          usageStats = await prisma.report.groupBy({
            by: ['templateId'],
            where: {
              createdBy: userId,
              createdAt: { gte: startDate },
              templateId: { not: null }
            },
            _count: { templateId: true },
            orderBy: { _count: { templateId: 'desc' } }
          });
          break;

        default:
          usageStats = [];
      }

      res.status(200).json({
        success: true,
        message: 'Estatísticas de uso recuperadas com sucesso',
        data: {
          period: {
            type: period,
            startDate: startDate.toISOString(),
            endDate: new Date().toISOString()
          },
          groupBy,
          stats: usageStats.map(stat => ({
            [groupBy]: stat[groupBy],
            count: stat._count[groupBy] || stat._count.templateId
          }))
        }
      });

    } catch (error) {
      logger.error('Erro no controller ao buscar estatísticas de uso', {
        error: error.message,
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar estatísticas',
        error: error.message
      });
    }
  }

  // ===== OPERAÇÕES EM LOTE =====

  // Gerar múltiplos relatórios
  async bulkGenerateReports(req, res) {
    try {
      const { reports, format = 'pdf', async = true } = req.body;
      const userId = req.user?.id;

      if (async) {
        // Processar em background
        const job = await queueService.addReportJob({
          type: 'bulk_generate',
          reports,
          format,
          userId
        });

        res.status(202).json({
          success: true,
          message: 'Geração em lote iniciada',
          data: {
            jobId: job.id,
            reportCount: reports.length,
            estimatedTime: reports.length * 30 // 30 segundos por relatório
          }
        });
      } else {
        // Processar sincronamente
        const results = [];
        const errors = [];

        for (const reportConfig of reports) {
          try {
            const result = await reportService.generateReport(reportConfig, {
              userId,
              scheduled: false,
              saveToFile: true
            });
            results.push(result.data);
          } catch (error) {
            errors.push({
              reportConfig,
              error: error.message
            });
          }
        }

        res.status(200).json({
          success: true,
          message: `${results.length} relatório(s) gerado(s) com sucesso`,
          data: {
            successful: results,
            failed: errors,
            summary: {
              total: reports.length,
              successful: results.length,
              failed: errors.length
            }
          }
        });
      }

    } catch (error) {
      logger.error('Erro no controller ao gerar relatórios em lote', {
        error: error.message,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao gerar relatórios em lote',
        error: error.message
      });
    }
  }

  // Agendar múltiplos relatórios
  async bulkScheduleReports(req, res) {
    try {
      const { schedules } = req.body;
      const userId = req.user?.id;

      const results = [];
      const errors = [];

      for (const schedule of schedules) {
        try {
          const result = await reportService.scheduleReport(
            schedule.reportConfig,
            schedule.scheduleConfig,
            { userId }
          );
          results.push(result.data);
        } catch (error) {
          errors.push({
            schedule,
            error: error.message
          });
        }
      }

      res.status(200).json({
        success: true,
        message: `${results.length} relatório(s) agendado(s) com sucesso`,
        data: {
          successful: results,
          failed: errors,
          summary: {
            total: schedules.length,
            successful: results.length,
            failed: errors.length
          }
        }
      });

    } catch (error) {
      logger.error('Erro no controller ao agendar relatórios em lote', {
        error: error.message,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao agendar relatórios em lote',
        error: error.message
      });
    }
  }

  // Deletar múltiplos relatórios
  async bulkDeleteReports(req, res) {
    try {
      const { reportIds } = req.body;
      const userId = req.user?.id;

      const result = await prisma.report.deleteMany({
        where: {
          id: { in: reportIds },
          createdBy: userId
        }
      });

      res.status(200).json({
        success: true,
        message: `${result.count} relatório(s) deletado(s) com sucesso`,
        data: {
          deletedCount: result.count,
          requestedCount: reportIds.length
        }
      });

    } catch (error) {
      logger.error('Erro no controller ao deletar relatórios em lote', {
        error: error.message,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao deletar relatórios em lote',
        error: error.message
      });
    }
  }

  // ===== COMPARTILHAMENTO E EXPORT =====

  // Compartilhar relatório
  async shareReport(req, res) {
    try {
      const { id } = req.params;
      const { recipients, message, includeData = true } = req.body;
      const userId = req.user?.id;

      // Verificar se o relatório existe e pertence ao usuário
      const report = await prisma.report.findFirst({
        where: {
          id,
          createdBy: userId
        }
      });

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Relatório não encontrado'
        });
      }

      // Adicionar job de compartilhamento
      const job = await queueService.addEmailJob({
        type: 'share_report',
        reportId: id,
        recipients,
        message,
        includeData,
        sharedBy: userId
      });

      res.status(200).json({
        success: true,
        message: 'Relatório será compartilhado em breve',
        data: {
          jobId: job.id,
          recipients: recipients.length
        }
      });

    } catch (error) {
      logger.error('Erro no controller ao compartilhar relatório', {
        error: error.message,
        reportId: req.params.id,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao compartilhar relatório',
        error: error.message
      });
    }
  }

  // Exportar configuração de relatório
  async exportReportConfig(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const report = await prisma.report.findFirst({
        where: {
          id,
          createdBy: userId
        }
      });

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Relatório não encontrado'
        });
      }

      const config = {
        name: report.name,
        type: report.type,
        format: report.format,
        config: JSON.parse(report.config || '{}'),
        exportedAt: new Date().toISOString(),
        exportedBy: userId
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="report_config_${report.name}.json"`);
      res.status(200).json(config);

    } catch (error) {
      logger.error('Erro no controller ao exportar configuração', {
        error: error.message,
        reportId: req.params.id
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao exportar configuração',
        error: error.message
      });
    }
  }

  // Importar configuração de relatório
  async importReportConfig(req, res) {
    try {
      const { config, name } = req.body;
      const userId = req.user?.id;

      // Validar configuração importada
      if (!config.type || !config.name) {
        return res.status(400).json({
          success: false,
          message: 'Configuração inválida: tipo e nome são obrigatórios'
        });
      }

      const reportConfig = {
        ...config,
        name: name || `${config.name} (Importado)`,
        template: null // Resetar template
      };

      const result = await reportService.generateReport(reportConfig, {
        userId,
        scheduled: false,
        saveToFile: true
      });

      res.status(201).json({
        success: true,
        message: 'Configuração importada e relatório gerado com sucesso',
        data: result.data
      });

    } catch (error) {
      logger.error('Erro no controller ao importar configuração', {
        error: error.message,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao importar configuração',
        error: error.message
      });
    }
  }

  // ===== PREVIEW E VALIDAÇÃO =====

  // Visualizar prévia do relatório
  async previewReport(req, res) {
    try {
      const { type, filters = {}, fields = [], limit = 10 } = req.body;

      // Usar o serviço para coletar dados de amostra
      const previewConfig = {
        name: 'Preview',
        type,
        format: 'json',
        filters,
        fields
      };

      // Gerar uma versão limitada do relatório
      const result = await reportService.generateReport(previewConfig, {
        userId: req.user?.id,
        scheduled: false,
        saveToFile: false
      });

      // Limitar os dados retornados
      const previewData = result.data.file.content.data.slice(0, limit);

      res.status(200).json({
        success: true,
        message: 'Prévia do relatório gerada com sucesso',
        data: {
          preview: previewData,
          totalRecords: result.data.statistics.recordCount,
          previewLimit: limit,
          type,
          fields: previewData.length > 0 ? Object.keys(previewData[0]) : []
        }
      });

    } catch (error) {
      logger.error('Erro no controller ao gerar prévia', {
        error: error.message,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao gerar prévia',
        error: error.message
      });
    }
  }

  // Validar configuração de relatório
  async validateReportConfig(req, res) {
    try {
      const { config } = req.body;

      const validationResult = {
        isValid: true,
        errors: [],
        warnings: []
      };

      // Validações básicas
      if (!config.name) {
        validationResult.errors.push('Nome é obrigatório');
      }

      if (!config.type) {
        validationResult.errors.push('Tipo é obrigatório');
      }

      const validTypes = ['leads', 'opportunities', 'activities', 'communications', 'revenue', 'performance', 'pipeline', 'forecast'];
      if (config.type && !validTypes.includes(config.type)) {
        validationResult.errors.push('Tipo de relatório inválido');
      }

      const validFormats = ['pdf', 'excel', 'csv', 'json'];
      if (config.format && !validFormats.includes(config.format)) {
        validationResult.errors.push('Formato inválido');
      }

      // Validações de filtros
      if (config.filters) {
        if (config.filters.dateFrom && config.filters.dateTo) {
          const dateFrom = new Date(config.filters.dateFrom);
          const dateTo = new Date(config.filters.dateTo);
          if (dateFrom > dateTo) {
            validationResult.errors.push('Data inicial deve ser anterior à data final');
          }
        }
      }

      // Avisos
      if (config.fields && config.fields.length === 0) {
        validationResult.warnings.push('Nenhum campo específico selecionado - todos os campos serão incluídos');
      }

      if (config.groupBy && config.groupBy.length > 0 && (!config.aggregations || config.aggregations.length === 0)) {
        validationResult.warnings.push('Agrupamento definido sem agregações - considere adicionar agregações');
      }

      validationResult.isValid = validationResult.errors.length === 0;

      res.status(200).json({
        success: true,
        message: validationResult.isValid ? 'Configuração válida' : 'Configuração inválida',
        data: validationResult
      });

    } catch (error) {
      logger.error('Erro no controller ao validar configuração', {
        error: error.message,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao validar configuração',
        error: error.message
      });
    }
  }
}

module.exports = new ReportController();