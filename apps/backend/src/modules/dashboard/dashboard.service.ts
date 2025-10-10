// ============================================================================
// Dashboard Module - Service
// ============================================================================

import { PrismaClient, DashboardConfig } from '@prisma/client';
import {
  DashboardMetrics,
  LeadsByStatus,
  LeadsBySource,
  RecentActivity,
  TimeSeriesData,
  CreateWidgetDTO,
  UpdateWidgetDTO,
  SaveLayoutDTO,
  WidgetConfig,
  IDashboardService,
} from './dashboard.types';

export class DashboardService implements IDashboardService {
  constructor(private prisma: PrismaClient) {}

  async getMetrics(userId?: string): Promise<DashboardMetrics> {
    const where = userId ? { assignedToId: userId } : {};

    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalLeads,
      newLeadsToday,
      newLeadsThisWeek,
      newLeadsThisMonth,
      openOpportunities,
      totalOpportunityValue,
      wonOpportunities,
      lostOpportunities,
      communicationsToday,
      communicationsThisWeek,
      activeAutomations,
      leadScores,
      convertedLeads,
    ] = await Promise.all([
      this.prisma.lead.count({ where }),
      this.prisma.lead.count({
        where: { ...where, createdAt: { gte: startOfToday } },
      }),
      this.prisma.lead.count({
        where: { ...where, createdAt: { gte: startOfWeek } },
      }),
      this.prisma.lead.count({
        where: { ...where, createdAt: { gte: startOfMonth } },
      }),
      this.prisma.opportunity.count({
        where: { ...where, stage: { notIn: ['WON', 'LOST'] } },
      }),
      this.prisma.opportunity.aggregate({
        where: { ...where, stage: { notIn: ['WON', 'LOST'] } },
        _sum: { value: true },
      }),
      this.prisma.opportunity.count({
        where: { ...where, stage: 'WON' },
      }),
      this.prisma.opportunity.count({
        where: { ...where, stage: 'LOST' },
      }),
      this.prisma.communication.count({
        where: {
          timestamp: { gte: startOfToday },
          ...(userId && { lead: { assignedToId: userId } }),
        },
      }),
      this.prisma.communication.count({
        where: {
          timestamp: { gte: startOfWeek },
          ...(userId && { lead: { assignedToId: userId } }),
        },
      }),
      this.prisma.automation.count({ where: { isActive: true } }),
      this.prisma.lead.aggregate({
        where,
        _avg: { leadScore: true },
      }),
      this.prisma.lead.count({
        where: { ...where, status: 'CONCLUIDO' },
      }),
    ]);

    const averageLeadScore = leadScores._avg.leadScore || 0;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
    const averageTimeToConvert = 0; // TODO: Implementar cálculo real

    return {
      totalLeads,
      newLeadsToday,
      newLeadsThisWeek,
      newLeadsThisMonth,
      openOpportunities,
      totalOpportunityValue: totalOpportunityValue._sum.value || 0,
      wonOpportunities,
      lostOpportunities,
      communicationsToday,
      communicationsThisWeek,
      activeAutomations,
      averageLeadScore: Number(averageLeadScore.toFixed(2)),
      conversionRate: Number(conversionRate.toFixed(2)),
      averageTimeToConvert,
    };
  }

  async getLeadsByStatus(userId?: string): Promise<LeadsByStatus> {
    const where = userId ? { assignedToId: userId } : {};

    const leads = await this.prisma.lead.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    return Object.fromEntries(leads.map((l) => [l.status, l._count]));
  }

  async getLeadsBySource(userId?: string): Promise<LeadsBySource> {
    const where = userId ? { assignedToId: userId } : {};

    const leads = await this.prisma.lead.groupBy({
      by: ['source'],
      where,
      _count: true,
    });

    return Object.fromEntries(leads.map((l) => [l.source || 'Desconhecido', l._count]));
  }

  async getRecentActivity(userId?: string, limit = 20): Promise<RecentActivity[]> {
    const activities: RecentActivity[] = [];

    // Buscar leads criados recentemente
    const recentLeads = await this.prisma.lead.findMany({
      where: userId ? { assignedToId: userId } : {},
      orderBy: { createdAt: 'desc' },
      take: Math.floor(limit / 2),
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    recentLeads.forEach((lead) => {
      activities.push({
        id: lead.id,
        type: 'lead_created',
        title: 'Novo Lead',
        description: `Lead "${lead.name}" foi criado`,
        timestamp: lead.createdAt,
        userId: lead.createdBy.id,
        userName: lead.createdBy.name,
        leadId: lead.id,
        leadName: lead.name,
      });
    });

    // Buscar comunicações recentes
    const recentCommunications = await this.prisma.communication.findMany({
      where: userId ? { lead: { assignedToId: userId } } : {},
      orderBy: { timestamp: 'desc' },
      take: Math.floor(limit / 4),
      include: {
        lead: {
          select: { id: true, name: true },
        },
      },
    });

    recentCommunications.forEach((comm) => {
      activities.push({
        id: comm.id,
        type: 'communication_sent',
        title: `${comm.type} enviado`,
        description: `${comm.type} enviado para ${comm.lead.name}`,
        timestamp: comm.timestamp,
        leadId: comm.lead.id,
        leadName: comm.lead.name,
      });
    });

    // Buscar oportunidades criadas recentemente
    const recentOpportunities = await this.prisma.opportunity.findMany({
      where: userId ? { assignedToId: userId } : {},
      orderBy: { createdAt: 'desc' },
      take: Math.floor(limit / 4),
      include: {
        lead: {
          select: { id: true, name: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    recentOpportunities.forEach((opp) => {
      activities.push({
        id: opp.id,
        type: 'opportunity_created',
        title: 'Nova Oportunidade',
        description: `Oportunidade "${opp.title}" criada`,
        timestamp: opp.createdAt,
        userId: opp.createdBy.id,
        userName: opp.createdBy.name,
        leadId: opp.lead.id,
        leadName: opp.lead.name,
      });
    });

    // Ordenar por timestamp
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit);
  }

  async getLeadsOverTime(userId?: string, period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<TimeSeriesData[]> {
    const where = userId ? { assignedToId: userId } : {};
    const now = new Date();
    let startDate: Date;
    let groupBy: 'day' | 'week' | 'month';

    switch (period) {
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        groupBy = 'month';
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);
        groupBy = 'week';
        break;
      case 'daily':
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        groupBy = 'day';
    }

    const leads = await this.prisma.lead.findMany({
      where: {
        ...where,
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const dataMap = new Map<string, number>();

    leads.forEach((lead) => {
      let key: string;
      const date = lead.createdAt;

      switch (groupBy) {
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'day':
        default:
          key = date.toISOString().split('T')[0];
      }

      dataMap.set(key, (dataMap.get(key) || 0) + 1);
    });

    return Array.from(dataMap.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async createWidget(userId: string, data: CreateWidgetDTO): Promise<DashboardConfig> {
    let config = await this.prisma.dashboardConfig.findFirst({
      where: { userId },
    });

    if (!config) {
      config = await this.prisma.dashboardConfig.create({
        data: {
          userId,
          name: 'Meu Dashboard',
          widgets: JSON.stringify([]),
        },
      });
    }

    const widgets = JSON.parse(config.widgets) as WidgetConfig[];
    const newWidget: WidgetConfig = {
      id: `widget-${Date.now()}`,
      ...data,
      config: data.config || {},
    };

    widgets.push(newWidget);

    return this.prisma.dashboardConfig.update({
      where: { id: config.id },
      data: { widgets: JSON.stringify(widgets) },
    });
  }

  async updateWidget(userId: string, data: UpdateWidgetDTO): Promise<DashboardConfig> {
    const config = await this.prisma.dashboardConfig.findFirst({
      where: { userId },
    });

    if (!config) {
      throw new Error('Dashboard config não encontrado');
    }

    const widgets = JSON.parse(config.widgets) as WidgetConfig[];
    const widgetIndex = widgets.findIndex((w) => w.id === data.id);

    if (widgetIndex === -1) {
      throw new Error('Widget não encontrado');
    }

    widgets[widgetIndex] = {
      ...widgets[widgetIndex],
      ...data,
    };

    return this.prisma.dashboardConfig.update({
      where: { id: config.id },
      data: { widgets: JSON.stringify(widgets) },
    });
  }

  async deleteWidget(userId: string, widgetId: string): Promise<DashboardConfig> {
    const config = await this.prisma.dashboardConfig.findFirst({
      where: { userId },
    });

    if (!config) {
      throw new Error('Dashboard config não encontrado');
    }

    const widgets = JSON.parse(config.widgets) as WidgetConfig[];
    const filteredWidgets = widgets.filter((w) => w.id !== widgetId);

    return this.prisma.dashboardConfig.update({
      where: { id: config.id },
      data: { widgets: JSON.stringify(filteredWidgets) },
    });
  }

  async saveLayout(userId: string, data: SaveLayoutDTO): Promise<DashboardConfig> {
    let config = await this.prisma.dashboardConfig.findFirst({
      where: { userId },
    });

    if (!config) {
      config = await this.prisma.dashboardConfig.create({
        data: {
          userId,
          name: 'Meu Dashboard',
          widgets: JSON.stringify(data.widgets),
        },
      });
    } else {
      config = await this.prisma.dashboardConfig.update({
        where: { id: config.id },
        data: { widgets: JSON.stringify(data.widgets) },
      });
    }

    return config;
  }
}

export const dashboardService = new DashboardService(new PrismaClient());
