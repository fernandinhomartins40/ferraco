import { Report, ReportFilters, ReportWidget, ScheduleConfig, DashboardConfig, DashboardWidget } from '@/types/lead';

const REPORTS_STORAGE_KEY = 'ferraco_reports';
const DASHBOARD_CONFIGS_KEY = 'ferraco_dashboard_configs';

export const reportStorage = {
  // Reports management
  getReports(): Report[] {
    try {
      const reports = localStorage.getItem(REPORTS_STORAGE_KEY);
      return reports ? JSON.parse(reports) : this.getDefaultReports();
    } catch (error) {
      console.error('Error reading reports from localStorage:', error);
      return this.getDefaultReports();
    }
  },

  saveReports(reports: Report[]): void {
    try {
      localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
    } catch (error) {
      console.error('Error saving reports to localStorage:', error);
    }
  },

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
  },

  createReport(report: Omit<Report, 'id' | 'createdAt'>): Report {
    const newReport: Report = {
      ...report,
      id: `report-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
    };

    const reports = this.getReports();
    reports.push(newReport);
    this.saveReports(reports);
    return newReport;
  },

  updateReport(reportId: string, updates: Partial<Report>): boolean {
    const reports = this.getReports();
    const reportIndex = reports.findIndex(report => report.id === reportId);

    if (reportIndex === -1) return false;

    reports[reportIndex] = { ...reports[reportIndex], ...updates };
    this.saveReports(reports);
    return true;
  },

  deleteReport(reportId: string): boolean {
    const reports = this.getReports();
    const filteredReports = reports.filter(report => report.id !== reportId);

    if (filteredReports.length === reports.length) return false;

    this.saveReports(filteredReports);
    return true;
  },

  // Generate report data
  generateReportData(reportId: string): any {
    const report = this.getReports().find(r => r.id === reportId);
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
  },

  // Apply filters to leads
  applyFilters(leads: any[], filters: ReportFilters): any[] {
    let filteredLeads = [...leads];

    // Date range filter
    if (filters.dateRange) {
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);

      filteredLeads = filteredLeads.filter(lead => {
        const leadDate = new Date(lead.createdAt);
        return leadDate >= startDate && leadDate <= endDate;
      });
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      filteredLeads = filteredLeads.filter(lead =>
        filters.status!.includes(lead.status)
      );
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      filteredLeads = filteredLeads.filter(lead =>
        lead.tags && filters.tags!.some(tag => lead.tags.includes(tag))
      );
    }

    // Source filter
    if (filters.source && filters.source.length > 0) {
      filteredLeads = filteredLeads.filter(lead =>
        filters.source!.includes(lead.source || 'unknown')
      );
    }

    // Priority filter
    if (filters.priority && filters.priority.length > 0) {
      filteredLeads = filteredLeads.filter(lead =>
        filters.priority!.includes(lead.priority || 'medium')
      );
    }

    return filteredLeads;
  },

  // Generate leads overview data
  generateLeadsOverviewData(leads: any[]): any {
    const total = leads.length;
    const byStatus = leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {});

    const converted = leads.filter(lead => lead.status === 'concluido').length;
    const conversionRate = total > 0 ? (converted / total) * 100 : 0;

    // Group by date for timeline
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
  },

  // Generate conversion funnel data
  generateConversionFunnelData(leads: any[]): any {
    const stages = [
      { name: 'Leads Capturados', count: leads.length },
      { name: 'Em Contato', count: leads.filter(lead => lead.status !== 'novo').length },
      { name: 'Em Negociação', count: leads.filter(lead => lead.status === 'em_andamento').length },
      { name: 'Convertidos', count: leads.filter(lead => lead.status === 'concluido').length },
    ];

    // Calculate conversion times
    const convertedLeads = leads.filter(lead => lead.status === 'concluido');
    const conversionTimes = convertedLeads.map(lead => {
      const created = new Date(lead.createdAt);
      const updated = new Date(lead.updatedAt);
      return (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24); // days
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
  },

  // Generate tag performance data
  generateTagPerformanceData(leads: any[], tagStorage: any): any {
    if (!tagStorage) return { tagStats: [] };

    const tagStats = tagStorage.getTagStats();

    // Enhance with additional metrics
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

    return {
      tagStats: enhancedStats,
    };
  },

  // Generate automation statistics
  generateAutomationStatsData(): any {
    const automationStorage = (window as any).automationStorage;
    if (!automationStorage) return { stats: null };

    return {
      stats: automationStorage.getAutomationStats(),
    };
  },

  // Generate custom report data
  generateCustomReportData(leads: any[], report: Report): any {
    // This is a flexible function for custom reports
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

    // Process each widget's data requirements
    report.widgets.forEach(widget => {
      switch (widget.config.metric) {
        case 'total_leads':
          data[widget.id] = leads.length;
          break;
        case 'conversion_rate':
          const converted = leads.filter(lead => lead.status === 'concluido').length;
          data[widget.id] = leads.length > 0 ? `${Math.round((converted / leads.length) * 100)}%` : '0%';
          break;
        // Add more metric calculations as needed
      }
    });

    return data;
  },

  // Export report to different formats
  async exportReport(reportId: string, format: 'pdf' | 'excel' | 'json' | 'csv'): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const reportData = this.generateReportData(reportId);
      const report = this.getReports().find(r => r.id === reportId);

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
          // These would require additional libraries
          // For now, return JSON format
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
  },

  // Convert report data to CSV
  convertToCSV(data: any, report: Report): string {
    const lines: string[] = [];

    // Add report header
    lines.push(`Relatório: ${report.name}`);
    lines.push(`Gerado em: ${new Date().toLocaleString('pt-BR')}`);
    lines.push('');

    // Add metrics if available
    if (data.metrics) {
      lines.push('Métricas:');
      Object.entries(data.metrics).forEach(([key, value]) => {
        lines.push(`${key},${value}`);
      });
      lines.push('');
    }

    // Add leads data if available
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
  },

  // Download report file
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
  },

  // Dashboard configurations
  getDashboardConfigs(): DashboardConfig[] {
    try {
      const configs = localStorage.getItem(DASHBOARD_CONFIGS_KEY);
      return configs ? JSON.parse(configs) : this.getDefaultDashboardConfigs();
    } catch (error) {
      console.error('Error reading dashboard configs from localStorage:', error);
      return this.getDefaultDashboardConfigs();
    }
  },

  saveDashboardConfigs(configs: DashboardConfig[]): void {
    try {
      localStorage.setItem(DASHBOARD_CONFIGS_KEY, JSON.stringify(configs));
    } catch (error) {
      console.error('Error saving dashboard configs to localStorage:', error);
    }
  },

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
  },

  createDashboardConfig(config: Omit<DashboardConfig, 'id' | 'createdAt'>): DashboardConfig {
    const newConfig: DashboardConfig = {
      ...config,
      id: `dashboard-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
    };

    const configs = this.getDashboardConfigs();
    configs.push(newConfig);
    this.saveDashboardConfigs(configs);
    return newConfig;
  },

  updateDashboardConfig(configId: string, updates: Partial<DashboardConfig>): boolean {
    const configs = this.getDashboardConfigs();
    const configIndex = configs.findIndex(config => config.id === configId);

    if (configIndex === -1) return false;

    configs[configIndex] = { ...configs[configIndex], ...updates };
    this.saveDashboardConfigs(configs);
    return true;
  },

  // Initialize default data
  initializeDefaultReports(): void {
    const existingReports = this.getReports();
    if (existingReports.length === 0) {
      this.saveReports(this.getDefaultReports());
    }
  },

  initializeDefaultDashboardConfigs(): void {
    const existingConfigs = this.getDashboardConfigs();
    if (existingConfigs.length === 0) {
      this.saveDashboardConfigs(this.getDefaultDashboardConfigs());
    }
  },
};