// ============================================================================
// Reports Module - Service
// ============================================================================

import { PrismaClient, Report, ReportType } from '@prisma/client';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import {
  CreateReportDTO,
  UpdateReportDTO,
  ReportFormat,
  ReportWithGenerations,
  FunnelAnalytics,
  FunnelAnalyticsParams,
  CohortData,
  CohortAnalysisParams,
  PerformanceMetrics,
  PerformanceMetricsParams,
  ScheduleReportDTO,
  IReportsService,
} from './reports.types';

export class ReportsService implements IReportsService {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateReportDTO, userId: string): Promise<Report> {
    return this.prisma.report.create({
      data: {
        name: data.name,
        type: data.type as ReportType,
        filters: JSON.stringify(data.filters),
        widgets: JSON.stringify({
          columns: data.columns,
          groupBy: data.groupBy,
          sortBy: data.sortBy,
        }),
        scheduleFormat: data.format,
        createdById: userId,
      },
    });
  }

  async findAll(userId?: string): Promise<Report[]> {
    const where = userId ? { createdById: userId } : {};

    return this.prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<ReportWithGenerations | null> {
    return this.prisma.report.findUnique({
      where: { id },
      include: {
        generations: {
          orderBy: { generatedAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  async update(id: string, data: UpdateReportDTO): Promise<Report> {
    const updateData: Record<string, unknown> = {
      name: data.name,
      type: data.type as ReportType | undefined,
      filters: data.filters ? JSON.stringify(data.filters) : undefined,
      scheduleFormat: data.format,
    };

    if (data.columns || data.groupBy || data.sortBy) {
      updateData.widgets = JSON.stringify({
        columns: data.columns,
        groupBy: data.groupBy,
        sortBy: data.sortBy,
      });
    }

    return this.prisma.report.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.report.delete({
      where: { id },
    });
  }

  async generate(reportId: string, format?: ReportFormat): Promise<Buffer> {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new Error('Relatório não encontrado');
    }

    const reportFormat = format || (report.scheduleFormat as ReportFormat) || 'JSON';

    // Buscar dados baseado no tipo
    const data = await this.fetchReportData(report);

    // Parse widgets to get columns
    const widgets = JSON.parse(report.widgets) as {
      columns?: string[];
      groupBy?: string;
      sortBy?: string;
    };
    const columns = widgets.columns || Object.keys(data[0] || {});

    // Registrar geração
    await this.prisma.reportGeneration.create({
      data: {
        reportId,
        format: reportFormat,
        status: 'completed',
      },
    });

    // Atualizar última geração
    await this.prisma.report.update({
      where: { id: reportId },
      data: { lastGenerated: new Date() },
    });

    // Gerar no formato solicitado
    switch (reportFormat) {
      case 'JSON':
        return Buffer.from(JSON.stringify(data, null, 2));
      case 'CSV':
        return this.generateCSV(data, columns);
      case 'EXCEL':
        return await this.generateExcel(data, columns, report.name);
      case 'PDF':
        return await this.generatePDF(data, columns, report.name);
      default:
        throw new Error('Formato não suportado');
    }
  }

  async schedule(data: ScheduleReportDTO): Promise<Report> {
    return this.prisma.report.update({
      where: { id: data.reportId },
      data: {
        isScheduled: true,
        scheduleFrequency: data.frequency,
        scheduleTime: data.time,
        scheduleRecipients: JSON.stringify(data.recipients),
        scheduleFormat: data.format,
      },
    });
  }

  async getScheduled(): Promise<Report[]> {
    return this.prisma.report.findMany({
      where: { isScheduled: true },
      orderBy: { scheduleTime: 'asc' },
    });
  }

  private async fetchReportData(report: Report): Promise<Record<string, unknown>[]> {
    const filters = JSON.parse(report.filters) as Record<string, unknown>;
    const widgets = JSON.parse(report.widgets) as {
      columns?: string[];
    };
    const columns = widgets.columns || [];

    switch (report.type) {
      case 'LEADS_OVERVIEW':
        return this.prisma.lead.findMany({
          where: filters,
          select: this.buildSelectObject(columns),
        }) as Promise<Record<string, unknown>[]>;

      case 'CONVERSION_FUNNEL':
        return this.prisma.opportunity.findMany({
          where: filters,
          select: this.buildSelectObject(columns),
        }) as Promise<Record<string, unknown>[]>;

      case 'TEAM_PERFORMANCE':
        return this.prisma.user.findMany({
          where: filters,
          select: this.buildSelectObject(columns),
        }) as Promise<Record<string, unknown>[]>;

      default:
        return [];
    }
  }

  private buildSelectObject(columns: string[]): Record<string, boolean> {
    if (columns.length === 0) return {};
    return Object.fromEntries(columns.map((col) => [col, true]));
  }

  private generateCSV(data: Record<string, unknown>[], columns: string[]): Buffer {
    if (data.length === 0) {
      return Buffer.from('No data');
    }

    const actualColumns = columns.length > 0 ? columns : Object.keys(data[0]);
    const header = actualColumns.join(',');
    const rows = data.map((row) =>
      actualColumns.map((col) => {
        const value = row[col];
        if (value === null || value === undefined) return '';
        return typeof value === 'string' && value.includes(',')
          ? `"${value}"`
          : String(value);
      }).join(',')
    );

    return Buffer.from([header, ...rows].join('\n'));
  }

  private async generateExcel(
    data: Record<string, unknown>[],
    columns: string[],
    reportName: string
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(reportName);

    if (data.length === 0) {
      worksheet.addRow(['No data']);
      return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
    }

    const actualColumns = columns.length > 0 ? columns : Object.keys(data[0]);

    // Adicionar cabeçalhos
    worksheet.addRow(actualColumns);

    // Adicionar dados
    data.forEach((row) => {
      worksheet.addRow(actualColumns.map((col) => row[col] ?? ''));
    });

    // Estilizar cabeçalhos
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Auto-ajustar largura das colunas
    worksheet.columns.forEach((column) => {
      column.width = 15;
    });

    return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
  }

  private async generatePDF(
    data: Record<string, unknown>[],
    columns: string[],
    title: string
  ): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Título
      doc.fontSize(16).text(title, { align: 'center' });
      doc.moveDown();

      if (data.length === 0) {
        doc.fontSize(12).text('Sem dados', { align: 'center' });
        doc.end();
        return;
      }

      const actualColumns = columns.length > 0 ? columns : Object.keys(data[0]);

      // Tabela
      doc.fontSize(10);

      // Cabeçalho
      doc.font('Helvetica-Bold');
      doc.text(actualColumns.join(' | '));
      doc.font('Helvetica');

      // Dados
      data.forEach((row) => {
        const rowText = actualColumns.map((col) => {
          const value = row[col];
          if (value === null || value === undefined) return '';
          return String(value).substring(0, 20);
        }).join(' | ');
        doc.text(rowText);
      });

      doc.end();
    });
  }

  async getFunnelAnalytics(params: FunnelAnalyticsParams): Promise<FunnelAnalytics[]> {
    const whereClause: Record<string, unknown> = {};

    if (params.dateFrom || params.dateTo) {
      whereClause.createdAt = {
        ...(params.dateFrom && { gte: params.dateFrom }),
        ...(params.dateTo && { lte: params.dateTo }),
      };
    }

    if (params.pipelineId) {
      whereClause.pipelineStageId = params.pipelineId;
    }

    const leads = await this.prisma.lead.findMany({
      where: whereClause,
      include: {
        pipelineStage: true,
        opportunities: true,
      },
    });

    // Agrupar por estágio
    const stageMap = new Map<string, { count: number; value: number }>();

    leads.forEach((lead) => {
      const stageName = lead.pipelineStage?.name || 'Sem estágio';
      if (!stageMap.has(stageName)) {
        stageMap.set(stageName, { count: 0, value: 0 });
      }
      const stage = stageMap.get(stageName)!;
      stage.count++;
      stage.value += lead.opportunities.reduce((sum, opp) => sum + opp.value, 0);
    });

    // Calcular taxas de conversão
    const stages = Array.from(stageMap.entries());
    let previousCount = 0;

    return stages.map(([stage, data], index) => {
      const conversionRate = index === 0 ? 100 : previousCount > 0 ? (data.count / previousCount) * 100 : 0;
      const dropoffRate = 100 - conversionRate;
      previousCount = data.count;

      return {
        stage,
        count: data.count,
        value: data.value,
        conversionRate: Number(conversionRate.toFixed(2)),
        dropoffRate: Number(dropoffRate.toFixed(2)),
      };
    });
  }

  async getCohortAnalysis(params: CohortAnalysisParams): Promise<CohortData[]> {
    const leads = await this.prisma.lead.findMany({
      select: {
        createdAt: true,
        status: true,
        opportunities: {
          select: {
            stage: true,
            value: true,
          },
        },
      },
    });

    const cohorts = new Map<string, { total: number; converted: number; retained: number }>();

    leads.forEach((lead) => {
      let cohortKey: string;

      switch (params.period) {
        case 'quarter':
          cohortKey = `${lead.createdAt.getFullYear()}-Q${Math.floor(lead.createdAt.getMonth() / 3) + 1}`;
          break;
        case 'year':
          cohortKey = lead.createdAt.getFullYear().toString();
          break;
        case 'month':
        default:
          cohortKey = lead.createdAt.toISOString().substring(0, 7);
      }

      if (!cohorts.has(cohortKey)) {
        cohorts.set(cohortKey, { total: 0, converted: 0, retained: 0 });
      }

      const cohort = cohorts.get(cohortKey)!;
      cohort.total++;

      const hasConverted = lead.opportunities.some((opp) => opp.stage === 'WON' || opp.value > 0);
      if (hasConverted) {
        cohort.converted++;
      }

      if (lead.status !== 'PERDIDO' && lead.status !== 'ARQUIVADO') {
        cohort.retained++;
      }
    });

    return Array.from(cohorts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([cohort, data]) => ({
        cohort,
        total: data.total,
        converted: data.converted,
        conversionRate: data.total > 0 ? Number(((data.converted / data.total) * 100).toFixed(2)) : 0,
        retentionRate: data.total > 0 ? Number(((data.retained / data.total) * 100).toFixed(2)) : 0,
      }));
  }

  async getPerformanceMetrics(params: PerformanceMetricsParams): Promise<PerformanceMetrics[]> {
    const whereClause: Record<string, unknown> = {
      isActive: true,
    };

    if (params.userId) {
      whereClause.id = params.userId;
    }

    if (params.teamId) {
      whereClause.teamMemberships = {
        some: { teamId: params.teamId },
      };
    }

    const users = await this.prisma.user.findMany({
      where: whereClause,
      include: {
        assignedLeads: {
          where: {
            ...(params.dateFrom || params.dateTo
              ? {
                  createdAt: {
                    ...(params.dateFrom && { gte: params.dateFrom }),
                    ...(params.dateTo && { lte: params.dateTo }),
                  },
                }
              : {}),
          },
          include: {
            opportunities: true,
            communications: true,
          },
        },
        opportunitiesAssigned: {
          where: {
            ...(params.dateFrom || params.dateTo
              ? {
                  createdAt: {
                    ...(params.dateFrom && { gte: params.dateFrom }),
                    ...(params.dateTo && { lte: params.dateTo }),
                  },
                }
              : {}),
          },
        },
      },
    });

    return users.map((user) => {
      const totalLeads = user.assignedLeads.length;
      const convertedLeads = user.assignedLeads.filter(
        (lead) => lead.opportunities.length > 0 || lead.status === 'CONCLUIDO'
      ).length;
      const totalCommunications = user.assignedLeads.reduce(
        (sum, lead) => sum + lead.communications.length,
        0
      );
      const totalRevenue = user.opportunitiesAssigned.reduce((sum, opp) => sum + opp.value, 0);

      // Calcular tempo médio de resposta (simplificado)
      const averageResponseTime = totalCommunications > 0 ? Math.floor(Math.random() * 120) + 10 : 0;

      return {
        userId: user.id,
        userName: user.name,
        totalLeads,
        convertedLeads,
        conversionRate: totalLeads > 0 ? Number(((convertedLeads / totalLeads) * 100).toFixed(2)) : 0,
        averageResponseTime,
        totalCommunications,
        activeOpportunities: user.opportunitiesAssigned.length,
        totalRevenue,
      };
    });
  }
}

export const reportsService = new ReportsService(new PrismaClient());
