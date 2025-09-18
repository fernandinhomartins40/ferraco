const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const queueService = require('./queueService');

const prisma = new PrismaClient();

/**
 * Report Service
 * Sistema completo de geração de relatórios personalizados
 */
class ReportService {
  constructor() {
    this.reportTypes = {
      LEADS: 'leads',
      OPPORTUNITIES: 'opportunities',
      ACTIVITIES: 'activities',
      COMMUNICATIONS: 'communications',
      REVENUE: 'revenue',
      PERFORMANCE: 'performance',
      PIPELINE: 'pipeline',
      FORECAST: 'forecast'
    };

    this.outputFormats = {
      PDF: 'pdf',
      EXCEL: 'excel',
      CSV: 'csv',
      JSON: 'json'
    };

    this.predefinedTemplates = this._initializePredefinedTemplates();
  }

  // ===== GERAÇÃO DE RELATÓRIOS =====

  /**
   * Gerar relatório personalizado
   */
  async generateReport(reportConfig, options = {}) {
    try {
      const {
        name,
        type,
        format = 'pdf',
        filters = {},
        fields = [],
        groupBy = [],
        aggregations = [],
        charts = [],
        template = null
      } = reportConfig;

      const {
        userId,
        scheduled = false,
        saveToFile = true,
        includeCharts = true
      } = options;

      logger.info('Iniciando geração de relatório', {
        name,
        type,
        format,
        userId,
        scheduled
      });

      // Validar configuração
      this._validateReportConfig(reportConfig);

      // Aplicar template se especificado
      const finalConfig = template ?
        this._applyTemplate(template, reportConfig) :
        reportConfig;

      // Coletar dados
      const rawData = await this._collectReportData(type, filters);

      // Processar dados
      const processedData = await this._processReportData(rawData, {
        fields,
        groupBy,
        aggregations,
        filters
      });

      // Gerar gráficos se solicitado
      const chartData = includeCharts && charts.length > 0 ?
        await this._generateChartData(processedData, charts) :
        [];

      // Criar relatório
      const reportResult = await this._createReportOutput(processedData, {
        config: finalConfig,
        format,
        chartData,
        saveToFile
      });

      // Salvar registro do relatório
      const reportRecord = await this._saveReportRecord({
        name,
        type,
        format,
        config: finalConfig,
        userId,
        scheduled,
        filePath: reportResult.filePath,
        size: reportResult.size,
        recordCount: processedData.length
      });

      logger.info('Relatório gerado com sucesso', {
        reportId: reportRecord.id,
        name,
        format,
        recordCount: processedData.length,
        size: reportResult.size
      });

      return {
        success: true,
        data: {
          report: reportRecord,
          file: {
            path: reportResult.filePath,
            url: reportResult.downloadUrl,
            size: reportResult.size
          },
          statistics: {
            recordCount: processedData.length,
            generationTime: reportResult.generationTime,
            format
          }
        }
      };

    } catch (error) {
      logger.error('Erro ao gerar relatório', {
        error: error.message,
        reportConfig
      });
      throw error;
    }
  }

  /**
   * Gerar relatório a partir de template
   */
  async generateFromTemplate(templateId, customConfig = {}, options = {}) {
    try {
      const template = await this._getReportTemplate(templateId);

      if (!template) {
        throw new Error('Template de relatório não encontrado');
      }

      // Mesclar configuração do template com personalizada
      const reportConfig = {
        ...template.config,
        ...customConfig,
        name: customConfig.name || template.name,
        template: templateId
      };

      return await this.generateReport(reportConfig, options);

    } catch (error) {
      logger.error('Erro ao gerar relatório a partir de template', {
        error: error.message,
        templateId
      });
      throw error;
    }
  }

  /**
   * Agendar relatório recorrente
   */
  async scheduleReport(reportConfig, scheduleConfig, options = {}) {
    try {
      const {
        frequency = 'weekly', // daily, weekly, monthly, quarterly
        dayOfWeek = 1, // Para weekly
        dayOfMonth = 1, // Para monthly
        time = '08:00',
        enabled = true,
        recipients = []
      } = scheduleConfig;

      const { userId } = options;

      // Criar agendamento
      const scheduledReport = await prisma.scheduledReport.create({
        data: {
          name: reportConfig.name,
          config: JSON.stringify(reportConfig),
          frequency,
          dayOfWeek,
          dayOfMonth,
          time,
          enabled,
          recipients: JSON.stringify(recipients),
          createdBy: userId,
          lastRun: null,
          nextRun: this._calculateNextRun(scheduleConfig)
        }
      });

      // Agendar job recorrente
      const cronExpression = this._buildCronExpression(scheduleConfig);
      await queueService.scheduleRecurringJob('REPORTS', {
        type: 'scheduled_report',
        scheduledReportId: scheduledReport.id,
        reportConfig,
        recipients
      }, cronExpression);

      logger.info('Relatório agendado com sucesso', {
        scheduledReportId: scheduledReport.id,
        frequency,
        nextRun: scheduledReport.nextRun
      });

      return {
        success: true,
        data: {
          scheduledReport,
          cronExpression,
          nextRun: scheduledReport.nextRun
        }
      };

    } catch (error) {
      logger.error('Erro ao agendar relatório', {
        error: error.message,
        reportConfig,
        scheduleConfig
      });
      throw error;
    }
  }

  // ===== TEMPLATES DE RELATÓRIOS =====

  /**
   * Criar template de relatório
   */
  async createReportTemplate(templateData, userId) {
    try {
      const {
        name,
        description,
        category,
        config,
        isPublic = false,
        tags = []
      } = templateData;

      const template = await prisma.reportTemplate.create({
        data: {
          name,
          description,
          category,
          config: JSON.stringify(config),
          isPublic,
          tags: JSON.stringify(tags),
          createdBy: userId
        }
      });

      logger.info('Template de relatório criado', {
        templateId: template.id,
        name,
        category
      });

      return {
        success: true,
        data: {
          template: {
            ...template,
            config: JSON.parse(template.config),
            tags: JSON.parse(template.tags)
          }
        }
      };

    } catch (error) {
      logger.error('Erro ao criar template de relatório', {
        error: error.message,
        templateData
      });
      throw error;
    }
  }

  /**
   * Buscar templates disponíveis
   */
  async getAvailableTemplates(userId, options = {}) {
    try {
      const {
        category,
        search,
        includePublic = true,
        page = 1,
        limit = 20
      } = options;

      const skip = (page - 1) * limit;

      const where = {
        OR: [
          { createdBy: userId },
          ...(includePublic ? [{ isPublic: true }] : [])
        ]
      };

      if (category) {
        where.category = category;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [templates, total] = await Promise.all([
        prisma.reportTemplate.findMany({
          where,
          include: {
            _count: {
              select: { reports: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.reportTemplate.count({ where })
      ]);

      const enrichedTemplates = templates.map(template => ({
        ...template,
        config: JSON.parse(template.config || '{}'),
        tags: JSON.parse(template.tags || '[]'),
        usageCount: template._count.reports
      }));

      return {
        success: true,
        data: {
          templates: enrichedTemplates,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: limit
          }
        }
      };

    } catch (error) {
      logger.error('Erro ao buscar templates', {
        error: error.message,
        userId,
        options
      });
      throw error;
    }
  }

  // ===== HISTÓRICO E GESTÃO =====

  /**
   * Buscar histórico de relatórios
   */
  async getReportHistory(userId, options = {}) {
    try {
      const {
        type,
        format,
        dateFrom,
        dateTo,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      const skip = (page - 1) * limit;

      const where = { createdBy: userId };

      if (type) where.type = type;
      if (format) where.format = format;
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo);
      }

      const [reports, total] = await Promise.all([
        prisma.report.findMany({
          where,
          include: {
            template: {
              select: {
                id: true,
                name: true,
                category: true
              }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit
        }),
        prisma.report.count({ where })
      ]);

      const enrichedReports = reports.map(report => ({
        ...report,
        config: JSON.parse(report.config || '{}'),
        downloadUrl: this._getDownloadUrl(report.filePath)
      }));

      return {
        success: true,
        data: {
          reports: enrichedReports,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: limit
          }
        }
      };

    } catch (error) {
      logger.error('Erro ao buscar histórico de relatórios', {
        error: error.message,
        userId,
        options
      });
      throw error;
    }
  }

  /**
   * Baixar relatório
   */
  async downloadReport(reportId, userId) {
    try {
      const report = await prisma.report.findFirst({
        where: {
          id: reportId,
          createdBy: userId
        }
      });

      if (!report) {
        throw new Error('Relatório não encontrado ou sem permissão');
      }

      if (!report.filePath || !(await this._fileExists(report.filePath))) {
        throw new Error('Arquivo do relatório não encontrado');
      }

      // Atualizar contagem de downloads
      await prisma.report.update({
        where: { id: reportId },
        data: {
          downloadCount: { increment: 1 },
          lastDownloaded: new Date()
        }
      });

      return {
        success: true,
        data: {
          filePath: report.filePath,
          fileName: path.basename(report.filePath),
          contentType: this._getContentType(report.format),
          size: report.size
        }
      };

    } catch (error) {
      logger.error('Erro ao baixar relatório', {
        error: error.message,
        reportId,
        userId
      });
      throw error;
    }
  }

  // ===== ANÁLISES E ESTATÍSTICAS =====

  /**
   * Obter estatísticas de relatórios
   */
  async getReportStats(userId, period = '30d') {
    try {
      const periodMap = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365
      };

      const days = periodMap[period] || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [
        totalReports,
        reportsByType,
        reportsByFormat,
        avgGenerationTime,
        mostUsedTemplates,
        recentActivity
      ] = await Promise.all([
        prisma.report.count({
          where: {
            createdBy: userId,
            createdAt: { gte: startDate }
          }
        }),
        this._getReportsByType(userId, startDate),
        this._getReportsByFormat(userId, startDate),
        this._getAvgGenerationTime(userId, startDate),
        this._getMostUsedTemplates(userId, startDate),
        this._getRecentReportActivity(userId, startDate)
      ]);

      return {
        success: true,
        data: {
          period: {
            type: period,
            startDate: startDate.toISOString(),
            endDate: new Date().toISOString()
          },
          overview: {
            totalReports,
            avgGenerationTime: Math.round(avgGenerationTime || 0),
            mostPopularType: reportsByType[0]?.type || 'N/A',
            mostPopularFormat: reportsByFormat[0]?.format || 'N/A'
          },
          distribution: {
            byType: reportsByType,
            byFormat: reportsByFormat
          },
          templates: {
            mostUsed: mostUsedTemplates
          },
          activity: recentActivity
        }
      };

    } catch (error) {
      logger.error('Erro ao obter estatísticas de relatórios', {
        error: error.message,
        userId,
        period
      });
      throw error;
    }
  }

  // ===== MÉTODOS PRIVADOS =====

  /**
   * Validar configuração do relatório
   */
  _validateReportConfig(config) {
    const { name, type, format } = config;

    if (!name || typeof name !== 'string') {
      throw new Error('Nome do relatório é obrigatório');
    }

    if (!type || !this.reportTypes[type.toUpperCase()]) {
      throw new Error('Tipo de relatório inválido');
    }

    if (!format || !this.outputFormats[format.toUpperCase()]) {
      throw new Error('Formato de relatório inválido');
    }
  }

  /**
   * Aplicar template ao relatório
   */
  _applyTemplate(templateId, config) {
    const template = this.predefinedTemplates[templateId];
    if (!template) {
      throw new Error('Template não encontrado');
    }

    return {
      ...template,
      ...config,
      fields: config.fields || template.fields,
      filters: { ...template.filters, ...config.filters }
    };
  }

  /**
   * Coletar dados para o relatório
   */
  async _collectReportData(type, filters) {
    switch (type.toLowerCase()) {
      case 'leads':
        return await this._getLeadsData(filters);
      case 'opportunities':
        return await this._getOpportunitiesData(filters);
      case 'activities':
        return await this._getActivitiesData(filters);
      case 'communications':
        return await this._getCommunicationsData(filters);
      case 'revenue':
        return await this._getRevenueData(filters);
      case 'performance':
        return await this._getPerformanceData(filters);
      case 'pipeline':
        return await this._getPipelineData(filters);
      case 'forecast':
        return await this._getForecastData(filters);
      default:
        throw new Error(`Tipo de relatório não suportado: ${type}`);
    }
  }

  /**
   * Processar dados do relatório
   */
  async _processReportData(rawData, options) {
    const { fields, groupBy, aggregations, filters } = options;

    let processedData = [...rawData];

    // Aplicar filtros adicionais
    if (filters.search) {
      processedData = this._applySearchFilter(processedData, filters.search);
    }

    // Selecionar campos específicos
    if (fields.length > 0) {
      processedData = processedData.map(record =>
        this._selectFields(record, fields)
      );
    }

    // Agrupar dados
    if (groupBy.length > 0) {
      processedData = this._groupData(processedData, groupBy, aggregations);
    }

    return processedData;
  }

  /**
   * Criar saída do relatório
   */
  async _createReportOutput(data, options) {
    const { config, format, chartData, saveToFile } = options;
    const startTime = Date.now();

    let result;

    switch (format.toLowerCase()) {
      case 'pdf':
        result = await this._createPDFReport(data, config, chartData, saveToFile);
        break;
      case 'excel':
        result = await this._createExcelReport(data, config, chartData, saveToFile);
        break;
      case 'csv':
        result = await this._createCSVReport(data, config, saveToFile);
        break;
      case 'json':
        result = await this._createJSONReport(data, config, saveToFile);
        break;
      default:
        throw new Error(`Formato não suportado: ${format}`);
    }

    result.generationTime = Date.now() - startTime;
    return result;
  }

  /**
   * Inicializar templates pré-definidos
   */
  _initializePredefinedTemplates() {
    return {
      'leads_summary': {
        name: 'Resumo de Leads',
        type: 'leads',
        fields: ['name', 'email', 'phone', 'status', 'source', 'createdAt'],
        filters: {},
        groupBy: ['status'],
        aggregations: [{ field: 'id', operation: 'count' }]
      },
      'sales_pipeline': {
        name: 'Pipeline de Vendas',
        type: 'opportunities',
        fields: ['title', 'value', 'probability', 'stage', 'expectedCloseDate'],
        filters: { status: 'ACTIVE' },
        groupBy: ['stage'],
        aggregations: [
          { field: 'value', operation: 'sum' },
          { field: 'id', operation: 'count' }
        ]
      },
      'monthly_performance': {
        name: 'Performance Mensal',
        type: 'performance',
        fields: ['period', 'leadsGenerated', 'opportunitiesCreated', 'revenue'],
        filters: { period: 'month' },
        groupBy: ['month'],
        aggregations: [
          { field: 'revenue', operation: 'sum' },
          { field: 'leadsGenerated', operation: 'sum' }
        ]
      }
    };
  }

  // Métodos auxiliares de coleta de dados
  async _getLeadsData(filters) {
    const where = this._buildWhereClause(filters);
    return await prisma.lead.findMany({
      where,
      include: {
        tags: { include: { tag: true } },
        leadScoring: true,
        opportunities: {
          select: { value: true, stage: true }
        }
      }
    });
  }

  async _getOpportunitiesData(filters) {
    const where = this._buildWhereClause(filters);
    return await prisma.opportunity.findMany({
      where,
      include: {
        lead: {
          select: { name: true, email: true }
        },
        pipeline: {
          select: { name: true }
        }
      }
    });
  }

  // Mais métodos auxiliares continuarão...
  _buildWhereClause(filters) {
    const where = {};

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    if (filters.status) where.status = filters.status;
    if (filters.source) where.source = filters.source;
    if (filters.assignedTo) where.assignedTo = filters.assignedTo;

    return where;
  }

  async _saveReportRecord(data) {
    return await prisma.report.create({
      data: {
        name: data.name,
        type: data.type,
        format: data.format,
        config: JSON.stringify(data.config),
        filePath: data.filePath,
        size: data.size,
        recordCount: data.recordCount,
        createdBy: data.userId,
        scheduled: data.scheduled,
        templateId: data.config.template
      }
    });
  }

  _getContentType(format) {
    const types = {
      pdf: 'application/pdf',
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      csv: 'text/csv',
      json: 'application/json'
    };
    return types[format.toLowerCase()] || 'application/octet-stream';
  }

  async _fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  _getDownloadUrl(filePath) {
    if (!filePath) return null;
    const fileName = path.basename(filePath);
    return `/api/reports/download/${fileName}`;
  }

  _calculateNextRun(scheduleConfig) {
    // Implementar lógica de cálculo da próxima execução
    const now = new Date();
    // Simplificado - implementar lógica completa baseada na frequência
    return new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24h
  }

  _buildCronExpression(scheduleConfig) {
    const { frequency, dayOfWeek, dayOfMonth, time } = scheduleConfig;
    const [hour, minute] = time.split(':');

    switch (frequency) {
      case 'daily':
        return `${minute} ${hour} * * *`;
      case 'weekly':
        return `${minute} ${hour} * * ${dayOfWeek}`;
      case 'monthly':
        return `${minute} ${hour} ${dayOfMonth} * *`;
      default:
        return `${minute} ${hour} * * 1`; // Default weekly on Monday
    }
  }

  // Métodos para estatísticas
  async _getReportsByType(userId, startDate) {
    const result = await prisma.report.groupBy({
      by: ['type'],
      where: {
        createdBy: userId,
        createdAt: { gte: startDate }
      },
      _count: { type: true },
      orderBy: { _count: { type: 'desc' } }
    });

    return result.map(item => ({
      type: item.type,
      count: item._count.type
    }));
  }

  async _getReportsByFormat(userId, startDate) {
    const result = await prisma.report.groupBy({
      by: ['format'],
      where: {
        createdBy: userId,
        createdAt: { gte: startDate }
      },
      _count: { format: true },
      orderBy: { _count: { format: 'desc' } }
    });

    return result.map(item => ({
      format: item.format,
      count: item._count.format
    }));
  }

  async _getAvgGenerationTime(userId, startDate) {
    const result = await prisma.report.aggregate({
      where: {
        createdBy: userId,
        createdAt: { gte: startDate }
      },
      _avg: { generationTime: true }
    });

    return result._avg.generationTime || 0;
  }

  async _getMostUsedTemplates(userId, startDate) {
    return await prisma.report.groupBy({
      by: ['templateId'],
      where: {
        createdBy: userId,
        createdAt: { gte: startDate },
        templateId: { not: null }
      },
      _count: { templateId: true },
      orderBy: { _count: { templateId: 'desc' } },
      take: 5
    });
  }

  async _getRecentReportActivity(userId, startDate) {
    return await prisma.report.findMany({
      where: {
        createdBy: userId,
        createdAt: { gte: startDate }
      },
      select: {
        name: true,
        type: true,
        format: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
  }

  // ===== MÉTODOS DE CRIAÇÃO DE RELATÓRIOS =====

  /**
   * Criar relatório em PDF
   */
  async _createPDFReport(data, config, chartData, saveToFile) {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const fileName = `${config.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      const filePath = saveToFile ? path.join(__dirname, '../../uploads/reports', fileName) : null;

      if (saveToFile) {
        // Garantir que o diretório existe
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        doc.pipe(require('fs').createWriteStream(filePath));
      }

      // Header do relatório
      doc.fontSize(20).text(config.name, { align: 'center' });
      doc.fontSize(12).text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'right' });
      doc.moveDown(2);

      // Resumo
      if (data.length > 0) {
        doc.fontSize(14).text('Resumo', { underline: true });
        doc.fontSize(12);
        doc.text(`Total de registros: ${data.length}`);
        doc.moveDown();

        // Dados em formato tabela simplificada
        doc.fontSize(14).text('Dados', { underline: true });
        doc.fontSize(10);

        // Headers da tabela
        if (data.length > 0) {
          const headers = Object.keys(data[0]);
          let yPosition = doc.y;
          let xPosition = 50;

          headers.forEach(header => {
            doc.text(header, xPosition, yPosition, { width: 80, align: 'left' });
            xPosition += 85;
          });
          doc.moveDown();

          // Dados (limitado a primeiros 50 registros para PDF)
          data.slice(0, 50).forEach(record => {
            yPosition = doc.y;
            xPosition = 50;

            headers.forEach(header => {
              const value = record[header] ? String(record[header]).substring(0, 15) : '';
              doc.text(value, xPosition, yPosition, { width: 80, align: 'left' });
              xPosition += 85;
            });
            doc.moveDown(0.5);

            // Nova página se necessário
            if (doc.y > 700) {
              doc.addPage();
            }
          });
        }
      }

      // Finalizar o PDF
      doc.end();

      const stats = saveToFile ? await fs.stat(filePath) : { size: 0 };

      return {
        filePath,
        downloadUrl: this._getDownloadUrl(filePath),
        size: stats.size,
        buffer: saveToFile ? null : doc // Para retorno direto
      };

    } catch (error) {
      logger.error('Erro ao criar PDF', { error: error.message });
      throw error;
    }
  }

  /**
   * Criar relatório em Excel
   */
  async _createExcelReport(data, config, chartData, saveToFile) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(config.name.substring(0, 31)); // Excel limit

      const fileName = `${config.name.replace(/\s+/g, '_')}_${Date.now()}.xlsx`;
      const filePath = saveToFile ? path.join(__dirname, '../../uploads/reports', fileName) : null;

      if (data.length > 0) {
        // Headers
        const headers = Object.keys(data[0]);
        worksheet.addRow(headers);

        // Estilizar headers
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };

        // Dados
        data.forEach(record => {
          const row = headers.map(header => record[header]);
          worksheet.addRow(row);
        });

        // Auto-ajustar largura das colunas
        headers.forEach((header, index) => {
          const column = worksheet.getColumn(index + 1);
          const maxLength = Math.max(
            header.length,
            ...data.slice(0, 100).map(record =>
              String(record[header] || '').length
            )
          );
          column.width = Math.min(Math.max(maxLength + 2, 10), 50);
        });

        // Adicionar filtros
        worksheet.autoFilter = {
          from: 'A1',
          to: { row: 1, column: headers.length }
        };
      }

      // Adicionar sheet de resumo se houver dados
      if (data.length > 0) {
        const summarySheet = workbook.addWorksheet('Resumo');
        summarySheet.addRow(['Estatística', 'Valor']);
        summarySheet.addRow(['Total de Registros', data.length]);
        summarySheet.addRow(['Data de Geração', new Date().toLocaleString('pt-BR')]);
        summarySheet.addRow(['Tipo de Relatório', config.type]);

        // Estilizar sheet de resumo
        const summaryHeaderRow = summarySheet.getRow(1);
        summaryHeaderRow.font = { bold: true };
        summaryHeaderRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
      }

      if (saveToFile) {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await workbook.xlsx.writeFile(filePath);
        const stats = await fs.stat(filePath);

        return {
          filePath,
          downloadUrl: this._getDownloadUrl(filePath),
          size: stats.size
        };
      } else {
        const buffer = await workbook.xlsx.writeBuffer();
        return {
          filePath: null,
          downloadUrl: null,
          size: buffer.length,
          buffer
        };
      }

    } catch (error) {
      logger.error('Erro ao criar Excel', { error: error.message });
      throw error;
    }
  }

  /**
   * Criar relatório em CSV
   */
  async _createCSVReport(data, config, saveToFile) {
    try {
      const fileName = `${config.name.replace(/\s+/g, '_')}_${Date.now()}.csv`;
      const filePath = saveToFile ? path.join(__dirname, '../../uploads/reports', fileName) : null;

      if (data.length === 0) {
        const content = 'Nenhum dado encontrado';
        if (saveToFile) {
          await fs.mkdir(path.dirname(filePath), { recursive: true });
          await fs.writeFile(filePath, content, 'utf8');
          const stats = await fs.stat(filePath);
          return {
            filePath,
            downloadUrl: this._getDownloadUrl(filePath),
            size: stats.size
          };
        } else {
          return {
            filePath: null,
            downloadUrl: null,
            size: content.length,
            content
          };
        }
      }

      // Headers
      const headers = Object.keys(data[0]);
      let csvContent = headers.join(',') + '\n';

      // Dados
      data.forEach(record => {
        const row = headers.map(header => {
          const value = record[header];
          // Escapar aspas e quebras de linha
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        });
        csvContent += row.join(',') + '\n';
      });

      if (saveToFile) {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, csvContent, 'utf8');
        const stats = await fs.stat(filePath);

        return {
          filePath,
          downloadUrl: this._getDownloadUrl(filePath),
          size: stats.size
        };
      } else {
        return {
          filePath: null,
          downloadUrl: null,
          size: Buffer.byteLength(csvContent, 'utf8'),
          content: csvContent
        };
      }

    } catch (error) {
      logger.error('Erro ao criar CSV', { error: error.message });
      throw error;
    }
  }

  /**
   * Criar relatório em JSON
   */
  async _createJSONReport(data, config, saveToFile) {
    try {
      const fileName = `${config.name.replace(/\s+/g, '_')}_${Date.now()}.json`;
      const filePath = saveToFile ? path.join(__dirname, '../../uploads/reports', fileName) : null;

      const reportData = {
        metadata: {
          name: config.name,
          type: config.type,
          generatedAt: new Date().toISOString(),
          recordCount: data.length,
          config: config
        },
        data: data
      };

      const jsonContent = JSON.stringify(reportData, null, 2);

      if (saveToFile) {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, jsonContent, 'utf8');
        const stats = await fs.stat(filePath);

        return {
          filePath,
          downloadUrl: this._getDownloadUrl(filePath),
          size: stats.size
        };
      } else {
        return {
          filePath: null,
          downloadUrl: null,
          size: Buffer.byteLength(jsonContent, 'utf8'),
          content: reportData
        };
      }

    } catch (error) {
      logger.error('Erro ao criar JSON', { error: error.message });
      throw error;
    }
  }

  // ===== MÉTODOS DE COLETA DE DADOS ESPECÍFICOS =====

  async _getActivitiesData(filters) {
    const where = this._buildWhereClause(filters);
    return await prisma.interaction.findMany({
      where,
      include: {
        lead: {
          select: { name: true, email: true }
        }
      }
    });
  }

  async _getCommunicationsData(filters) {
    const where = this._buildWhereClause(filters);
    return await prisma.communication.findMany({
      where,
      include: {
        lead: {
          select: { name: true, email: true }
        }
      }
    });
  }

  async _getRevenueData(filters) {
    const where = this._buildWhereClause(filters);

    // Buscar oportunidades fechadas (won)
    const opportunities = await prisma.opportunity.findMany({
      where: {
        ...where,
        status: 'WON'
      },
      include: {
        lead: {
          select: { name: true, source: true }
        },
        pipeline: {
          select: { name: true }
        }
      }
    });

    // Agrupar por mês/período
    return opportunities.map(opp => ({
      id: opp.id,
      title: opp.title,
      value: opp.value,
      closedDate: opp.actualCloseDate,
      leadName: opp.lead.name,
      leadSource: opp.lead.source,
      pipeline: opp.pipeline.name,
      period: new Date(opp.actualCloseDate).toISOString().substring(0, 7) // YYYY-MM
    }));
  }

  async _getPerformanceData(filters) {
    const startDate = filters.dateFrom ? new Date(filters.dateFrom) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const endDate = filters.dateTo ? new Date(filters.dateTo) : new Date();

    const [
      leadsCount,
      opportunitiesCount,
      wonOpportunities,
      totalRevenue,
      avgDealSize,
      conversionRate
    ] = await Promise.all([
      prisma.lead.count({
        where: { createdAt: { gte: startDate, lte: endDate } }
      }),
      prisma.opportunity.count({
        where: { createdAt: { gte: startDate, lte: endDate } }
      }),
      prisma.opportunity.count({
        where: {
          status: 'WON',
          actualCloseDate: { gte: startDate, lte: endDate }
        }
      }),
      prisma.opportunity.aggregate({
        where: {
          status: 'WON',
          actualCloseDate: { gte: startDate, lte: endDate }
        },
        _sum: { value: true }
      }),
      prisma.opportunity.aggregate({
        where: {
          status: 'WON',
          actualCloseDate: { gte: startDate, lte: endDate }
        },
        _avg: { value: true }
      }),
      // Calcular taxa de conversão
      this._calculateConversionRate(startDate, endDate)
    ]);

    return [{
      period: `${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`,
      leadsGenerated: leadsCount,
      opportunitiesCreated: opportunitiesCount,
      opportunitiesWon: wonOpportunities,
      totalRevenue: totalRevenue._sum.value || 0,
      avgDealSize: Math.round(avgDealSize._avg.value || 0),
      conversionRate: Math.round(conversionRate * 100) / 100
    }];
  }

  async _getPipelineData(filters) {
    const where = this._buildWhereClause(filters);

    return await prisma.pipeline.findMany({
      where,
      include: {
        stages: {
          include: {
            opportunities: {
              where: { status: 'ACTIVE' },
              select: {
                id: true,
                title: true,
                value: true,
                probability: true
              }
            }
          }
        },
        _count: {
          select: { opportunities: true }
        }
      }
    });
  }

  async _getForecastData(filters) {
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 3); // 3 meses à frente

    const opportunities = await prisma.opportunity.findMany({
      where: {
        status: 'ACTIVE',
        expectedCloseDate: { lte: futureDate },
        ...this._buildWhereClause(filters)
      },
      include: {
        lead: {
          select: { name: true }
        },
        pipeline: {
          select: { name: true }
        }
      }
    });

    return opportunities.map(opp => ({
      id: opp.id,
      title: opp.title,
      value: opp.value,
      probability: opp.probability,
      expectedValue: Math.round(opp.value * (opp.probability / 100)),
      expectedCloseDate: opp.expectedCloseDate,
      leadName: opp.lead.name,
      pipeline: opp.pipeline.name,
      stage: opp.stage
    }));
  }

  // Métodos auxiliares para processamento
  _applySearchFilter(data, searchTerm) {
    const term = searchTerm.toLowerCase();
    return data.filter(record => {
      return Object.values(record).some(value =>
        String(value).toLowerCase().includes(term)
      );
    });
  }

  _selectFields(record, fields) {
    const result = {};
    fields.forEach(field => {
      if (record.hasOwnProperty(field)) {
        result[field] = record[field];
      }
    });
    return result;
  }

  _groupData(data, groupBy, aggregations) {
    const groups = {};

    data.forEach(record => {
      const key = groupBy.map(field => record[field]).join('|');
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(record);
    });

    return Object.entries(groups).map(([key, records]) => {
      const keyValues = key.split('|');
      const result = {};

      // Adicionar campos de agrupamento
      groupBy.forEach((field, index) => {
        result[field] = keyValues[index];
      });

      // Aplicar agregações
      aggregations.forEach(agg => {
        const { field, operation } = agg;
        const values = records.map(r => r[field]).filter(v => v !== null && v !== undefined);

        switch (operation) {
          case 'count':
            result[`${field}_count`] = records.length;
            break;
          case 'sum':
            result[`${field}_sum`] = values.reduce((sum, val) => sum + Number(val), 0);
            break;
          case 'avg':
            result[`${field}_avg`] = values.length > 0
              ? values.reduce((sum, val) => sum + Number(val), 0) / values.length
              : 0;
            break;
          case 'min':
            result[`${field}_min`] = values.length > 0 ? Math.min(...values.map(Number)) : 0;
            break;
          case 'max':
            result[`${field}_max`] = values.length > 0 ? Math.max(...values.map(Number)) : 0;
            break;
        }
      });

      return result;
    });
  }

  async _calculateConversionRate(startDate, endDate) {
    const leads = await prisma.lead.count({
      where: { createdAt: { gte: startDate, lte: endDate } }
    });

    const conversions = await prisma.opportunity.count({
      where: {
        status: 'WON',
        actualCloseDate: { gte: startDate, lte: endDate }
      }
    });

    return leads > 0 ? conversions / leads : 0;
  }

  async _getReportTemplate(templateId) {
    if (this.predefinedTemplates[templateId]) {
      return {
        id: templateId,
        name: this.predefinedTemplates[templateId].name,
        config: this.predefinedTemplates[templateId]
      };
    }

    return await prisma.reportTemplate.findUnique({
      where: { id: templateId }
    });
  }

  async _generateChartData(data, charts) {
    // Implementar geração de dados para gráficos
    return charts.map(chart => ({
      type: chart.type,
      title: chart.title,
      data: this._processChartData(data, chart)
    }));
  }

  _processChartData(data, chart) {
    // Implementar processamento específico para cada tipo de gráfico
    switch (chart.type) {
      case 'bar':
      case 'column':
        return this._processBarChartData(data, chart);
      case 'pie':
        return this._processPieChartData(data, chart);
      case 'line':
        return this._processLineChartData(data, chart);
      default:
        return [];
    }
  }

  _processBarChartData(data, chart) {
    // Implementar lógica para gráficos de barras
    return [];
  }

  _processPieChartData(data, chart) {
    // Implementar lógica para gráficos de pizza
    return [];
  }

  _processLineChartData(data, chart) {
    // Implementar lógica para gráficos de linha
    return [];
  }
}

module.exports = new ReportService();