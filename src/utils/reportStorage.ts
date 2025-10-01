import { Report, ReportFilters, ReportWidget, ScheduleConfig, DashboardConfig, DashboardWidget } from '@/types/lead';
import { BaseStorage, StorageItem } from '@/lib/BaseStorage';

interface ReportStorageItem extends StorageItem {
  name: string;
  type: Report['type'];
  filters: ReportFilters;
  widgets: ReportWidget[];
  isScheduled: boolean;
  schedule?: ScheduleConfig;
}

interface DashboardStorageItem extends StorageItem {
  name: string;
  widgets: DashboardWidget[];
  layout: DashboardConfig['layout'];
  isDefault: boolean;
}

class ReportStorageClass extends BaseStorage<ReportStorageItem> {
  private dashboardStorage: BaseStorage<DashboardStorageItem>;

  constructor() {
    super({ key: 'ferraco_reports', enableDebug: false });
    this.dashboardStorage = new BaseStorage<DashboardStorageItem>({
      key: 'ferraco_dashboard_configs',
      enableDebug: false
    });
    this.initializeDefaults();
  }

  getDefaultReports(): Report[] {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return [
      {
        id: 'report-leads-overview',
        name: 'Visão Geral de Leads',
        type: 'leads_overview',
        filters: {
          dateRange: {
            start: thirtyDaysAgo.toISOString(),
            end: now.toISOString(),
          },
        },
        widgets: [
          {
            id: 'widget-total-leads',
            type: 'metric',
            title: 'Total de Leads',
            size: 'small',
            position: { x: 0, y: 0 },
            config: { metric: 'total_leads' },
          },
          {
            id: 'widget-conversion-rate',
            type: 'metric',
            title: 'Taxa de Conversão',
            size: 'small',
            position: { x: 1, y: 0 },
            config: { metric: 'conversion_rate' },
          },
          {
            id: 'widget-leads-by-status',
            type: 'chart',
            title: 'Leads por Status',
            size: 'medium',
            position: { x: 0, y: 1 },
            config: { chartType: 'pie', dataKey: 'status' },
          },
          {
            id: 'widget-leads-timeline',
            type: 'chart',
            title: 'Timeline de Leads',
            size: 'large',
            position: { x: 0, y: 2 },
            config: { chartType: 'line', dataKey: 'created_date' },
          },
        ],
        isScheduled: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'report-conversion-funnel',
        name: 'Funil de Conversão',
        type: 'conversion_funnel',
        filters: {
          dateRange: {
            start: thirtyDaysAgo.toISOString(),
            end: now.toISOString(),
          },
        },
        widgets: [
          {
            id: 'widget-funnel-chart',
            type: 'chart',
            title: 'Funil de Conversão',
            size: 'large',
            position: { x: 0, y: 0 },
            config: { chartType: 'funnel' },
          },
          {
            id: 'widget-conversion-time',
            type: 'metric',
            title: 'Tempo Médio de Conversão',
            size: 'medium',
            position: { x: 1, y: 0 },
            config: { metric: 'avg_conversion_time' },
          },
        ],
        isScheduled: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'report-tag-performance',
        name: 'Performance por Tags',
        type: 'tag_performance',
        filters: {
          dateRange: {
            start: thirtyDaysAgo.toISOString(),
            end: now.toISOString(),
          },
        },
        widgets: [
          {
            id: 'widget-tags-table',
            type: 'table',
            title: 'Performance por Tag',
            size: 'large',
            position: { x: 0, y: 0 },
            config: { showColumns: ['tag', 'count', 'conversion_rate', 'avg_time'] },
          },
        ],
        isScheduled: false,
        createdAt: new Date().toISOString(),
      },
    ];
  }

  createReport(report: Omit<Report, 'id' | 'createdAt'>): Report {
    return this.add(report);
  }

  updateReport(reportId: string, updates: Partial<Report>): boolean {
    return this.update(reportId, updates) !== null;
  }

  deleteReport(reportId: string): boolean {
    return this.delete(reportId);
  }

  // Generate report data
  generateReportData(reportId: string): any {
    const report = this.getById(reportId);
    if (!report) return null;

    const leadStorage = (window as any).leadStorage;
    const tagStorage = (window as any).tagStorage;

    if (!leadStorage) return null;

    const leads = leadStorage.getLeads();
    const filteredLeads = this.applyFilters(leads, report.filters);

    switch (report.type) {
      case 'leads_overview':
        return this.generateLeadsOverviewData(filteredLeads);
      case 'conversion_funnel':
        return this.generateConversionFunnelData(filteredLeads);
      case 'tag_performance':
        return this.generateTagPerformanceData(filteredLeads, tagStorage);
      case 'automation_stats':
        return this.generateAutomationStatsData();
      default:
        return this.generateCustomReportData(filteredLeads, report);
    }
  }

  // Apply filters to leads
  applyFilters(leads: any[], filters: ReportFilters): any[] {
    let filteredLeads = [...leads];

    if (filters.dateRange) {
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      filteredLeads = filteredLeads.filter(lead => {
        const leadDate = new Date(lead.createdAt);
        return leadDate >= startDate && leadDate <= endDate;
      });
    }

    if (filters.status && filters.status.length > 0) {
      filteredLeads = filteredLeads.filter(lead => filters.status!.includes(lead.status));
    }

    if (filters.tags && filters.tags.length > 0) {
      filteredLeads = filteredLeads.filter(lead =>
        lead.tags && filters.tags!.some(tag => lead.tags.includes(tag))
      );
    }

    if (filters.source && filters.source.length > 0) {
      filteredLeads = filteredLeads.filter(lead => filters.source!.includes(lead.source || 'unknown'));
    }

    if (filters.priority && filters.priority.length > 0) {
      filteredLeads = filteredLeads.filter(lead => filters.priority!.includes(lead.priority || 'medium'));
    }

    return filteredLeads;
  }

  generateLeadsOverviewData(leads: any[]): any {
    const total = leads.length;
    const byStatus = leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {});

    const converted = leads.filter(lead => lead.status === 'concluido').length;
    const conversionRate = total > 0 ? (converted / total) * 100 : 0;

    const timelineData = leads.reduce((acc, lead) => {
      const date = new Date(lead.createdAt).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const timeline = Object.entries(timelineData)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      total,
      byStatus,
      conversionRate: Math.round(conversionRate * 100) / 100,
      timeline,
      metrics: {
        total_leads: total,
        conversion_rate: `${Math.round(conversionRate)}%`,
        converted_leads: converted,
        pending_leads: leads.filter(lead => lead.status === 'novo').length,
        in_progress_leads: leads.filter(lead => lead.status === 'em_andamento').length,
      },
    };
  }

  generateConversionFunnelData(leads: any[]): any {
    const stages = [
      { name: 'Leads Capturados', count: leads.length },
      { name: 'Em Contato', count: leads.filter(lead => lead.status !== 'novo').length },
      { name: 'Em Negociação', count: leads.filter(lead => lead.status === 'em_andamento').length },
      { name: 'Convertidos', count: leads.filter(lead => lead.status === 'concluido').length },
    ];

    const convertedLeads = leads.filter(lead => lead.status === 'concluido');
    const conversionTimes = convertedLeads.map(lead => {
      const created = new Date(lead.createdAt);
      const updated = new Date(lead.updatedAt);
      return (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    });

    const avgConversionTime = conversionTimes.length > 0
      ? conversionTimes.reduce((sum, time) => sum + time, 0) / conversionTimes.length
      : 0;

    return {
      stages,
      avgConversionTime: Math.round(avgConversionTime * 10) / 10,
      metrics: {
        avg_conversion_time: `${Math.round(avgConversionTime)} dias`,
        conversion_rate: stages.length > 0 ? `${Math.round((stages[3].count / stages[0].count) * 100)}%` : '0%',
      },
    };
  }

  generateTagPerformanceData(leads: any[], tagStorage: any): any {
    if (!tagStorage) return { tagStats: [] };

    const tagStats = tagStorage.getTagStats();
    const enhancedStats = tagStats.map((stat: any) => {
      const leadsWithTag = leads.filter(lead =>
        lead.tags && lead.tags.includes(stat.tagName.toLowerCase())
      );

      return {
        ...stat,
        recentLeads: leadsWithTag.filter(lead =>
          new Date(lead.createdAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
      };
    });

    return { tagStats: enhancedStats };
  }

  generateAutomationStatsData(): any {
    const automationStorage = (window as any).automationStorage;
    if (!automationStorage) return { stats: null };
    return { stats: automationStorage.getAutomationStats() };
  }

  generateCustomReportData(leads: any[], report: Report): any {
    const data: any = {
      leads,
      summary: {
        total: leads.length,
        byStatus: leads.reduce((acc, lead) => {
          acc[lead.status] = (acc[lead.status] || 0) + 1;
          return acc;
        }, {}),
      },
    };

    report.widgets.forEach(widget => {
      switch (widget.config.metric) {
        case 'total_leads':
          data[widget.id] = leads.length;
          break;
        case 'conversion_rate':
          const converted = leads.filter(lead => lead.status === 'concluido').length;
          data[widget.id] = leads.length > 0 ? `${Math.round((converted / leads.length) * 100)}%` : '0%';
          break;
      }
    });

    return data;
  }

  async exportReport(reportId: string, format: 'pdf' | 'excel' | 'json' | 'csv'): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const reportData = this.generateReportData(reportId);
      const report = this.getById(reportId);

      if (!reportData || !report) {
        return { success: false, error: 'Relatório não encontrado' };
      }

      switch (format) {
        case 'json':
          return {
            success: true,
            data: {
              filename: `${report.name}_${new Date().toISOString().split('T')[0]}.json`,
              content: JSON.stringify(reportData, null, 2),
              mimeType: 'application/json',
            },
          };

        case 'csv':
          const csvContent = this.convertToCSV(reportData, report);
          return {
            success: true,
            data: {
              filename: `${report.name}_${new Date().toISOString().split('T')[0]}.csv`,
              content: csvContent,
              mimeType: 'text/csv',
            },
          };

        case 'excel':
        case 'pdf':
          return {
            success: false,
            error: `Formato ${format} não implementado ainda`,
          };

        default:
          return { success: false, error: 'Formato não suportado' };
      }
    } catch (error) {
      return { success: false, error: `Erro ao exportar: ${error}` };
    }
  }

  convertToCSV(data: any, report: Report): string {
    const lines: string[] = [];

    lines.push(`Relatório: ${report.name}`);
    lines.push(`Gerado em: ${new Date().toLocaleString('pt-BR')}`);
    lines.push('');

    if (data.metrics) {
      lines.push('Métricas:');
      Object.entries(data.metrics).forEach(([key, value]) => {
        lines.push(`${key},${value}`);
      });
      lines.push('');
    }

    if (data.leads && Array.isArray(data.leads)) {
      lines.push('Dados dos Leads:');
      lines.push('Nome,Telefone,Status,Criado em,Tags');

      data.leads.forEach((lead: any) => {
        const tags = (lead.tags || []).join(';');
        const createdAt = new Date(lead.createdAt).toLocaleString('pt-BR');
        lines.push(`"${lead.name}","${lead.phone}","${lead.status}","${createdAt}","${tags}"`);
      });
    }

    return lines.join('\n');
  }

  downloadReport(filename: string, content: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  // Dashboard configurations
  getDashboardConfigs(): DashboardConfig[] {
    return this.dashboardStorage.getAll();
  }

  saveDashboardConfigs(configs: DashboardConfig[]): void {
    this.dashboardStorage.data = configs as DashboardStorageItem[];
    this.dashboardStorage.save();
  }

  getDefaultDashboardConfigs(): DashboardConfig[] {
    return [
      {
        id: 'dashboard-default',
        name: 'Dashboard Padrão',
        widgets: [
          {
            id: 'widget-stats-overview',
            type: 'stats',
            title: 'Visão Geral',
            size: 'lg',
            position: { x: 0, y: 0, w: 4, h: 2 },
            config: {},
            isVisible: true,
          },
          {
            id: 'widget-leads-chart',
            type: 'chart',
            title: 'Tendências',
            size: 'lg',
            position: { x: 0, y: 2, w: 6, h: 3 },
            config: { chartType: 'area' },
            isVisible: true,
          },
          {
            id: 'widget-recent-leads',
            type: 'recent_leads',
            title: 'Leads Recentes',
            size: 'md',
            position: { x: 6, y: 2, w: 3, h: 3 },
            config: { limit: 5 },
            isVisible: true,
          },
          {
            id: 'widget-alerts',
            type: 'alerts',
            title: 'Alertas',
            size: 'sm',
            position: { x: 4, y: 0, w: 2, h: 2 },
            config: {},
            isVisible: true,
          },
          {
            id: 'widget-quick-actions',
            type: 'quick_actions',
            title: 'Ações Rápidas',
            size: 'sm',
            position: { x: 6, y: 0, w: 3, h: 2 },
            config: {},
            isVisible: true,
          },
        ],
        layout: 'grid',
        isDefault: true,
        createdAt: new Date().toISOString(),
      },
    ];
  }

  createDashboardConfig(config: Omit<DashboardConfig, 'id' | 'createdAt'>): DashboardConfig {
    return this.dashboardStorage.add(config);
  }

  updateDashboardConfig(configId: string, updates: Partial<DashboardConfig>): boolean {
    return this.dashboardStorage.update(configId, updates) !== null;
  }

  initializeDefaults(): void {
    if (this.count() === 0) {
      const defaultReports = this.getDefaultReports();
      defaultReports.forEach(report => {
        this.data.push(report as ReportStorageItem);
      });
      this.save();
    }

    if (this.dashboardStorage.count() === 0) {
      const defaultDashboards = this.getDefaultDashboardConfigs();
      defaultDashboards.forEach(dashboard => {
        this.dashboardStorage.data.push(dashboard as DashboardStorageItem);
      });
      this.dashboardStorage.save();
    }
  }

  // Legacy API compatibility
  getReports = () => this.getAll();
  saveReports = (reports: Report[]) => {
    this.data = reports as ReportStorageItem[];
    this.save();
  };
  initializeDefaultReports = () => this.initializeDefaults();
  initializeDefaultDashboardConfigs = () => this.initializeDefaults();
}

export const reportStorage = new ReportStorageClass();
