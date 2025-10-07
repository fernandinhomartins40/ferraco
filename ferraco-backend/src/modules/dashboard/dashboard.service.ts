import prisma from '../../config/database';

export class DashboardService {
  /**
   * Obter métricas gerais do dashboard
   */
  async getMetrics() {
    const [leadsCount, recentActivity, trends] = await Promise.all([
      this.getLeadsCount(),
      this.getRecentActivity(),
      this.getTrends(),
    ]);

    const conversionRate = leadsCount.total > 0
      ? (leadsCount.concluido / leadsCount.total) * 100
      : 0;

    return {
      leadsCount,
      conversionRate: Number(conversionRate.toFixed(2)),
      recentActivity,
      trends,
    };
  }

  /**
   * Obter métricas detalhadas com filtros
   */
  async getDetailedMetrics(filters: {
    startDate?: Date;
    endDate?: Date;
    assignedToId?: string;
    source?: string;
  }) {
    const { startDate, endDate, assignedToId, source } = filters;

    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    if (source) {
      where.source = source;
    }

    const [
      totalLeads,
      leadsByStatus,
      leadsBySource,
      leadsByPriority,
      avgResponseTime,
      topPerformers,
    ] = await Promise.all([
      prisma.lead.count({ where }),
      this.getLeadsByStatus(where),
      this.getLeadsBySource(where),
      this.getLeadsByPriority(where),
      this.getAvgResponseTime(where),
      this.getTopPerformers(where),
    ]);

    return {
      totalLeads,
      leadsByStatus,
      leadsBySource,
      leadsByPriority,
      avgResponseTime,
      topPerformers,
    };
  }

  // Métodos auxiliares privados

  private async getLeadsCount() {
    const [total, novo, emAndamento, concluido] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { status: 'NOVO' } }),
      prisma.lead.count({ where: { status: 'EM_ANDAMENTO' } }),
      prisma.lead.count({ where: { status: 'CONCLUIDO' } }),
    ]);

    return { total, novo, emAndamento, concluido };
  }

  private async getRecentActivity() {
    const recentLeads = await prisma.lead.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });

    return recentLeads.map((lead) => ({
      id: lead.id,
      type: 'lead_created' as const,
      description: `Novo lead: ${lead.name}`,
      timestamp: lead.createdAt.toISOString(),
      leadId: lead.id,
      leadName: lead.name,
    }));
  }

  private async getTrends() {
    const now = new Date();
    const lastWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [leadsLastWeek, leadsThisWeek] = await Promise.all([
      prisma.lead.count({
        where: {
          createdAt: {
            gte: new Date(lastWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000),
            lt: lastWeekStart,
          },
        },
      }),
      prisma.lead.count({
        where: {
          createdAt: {
            gte: thisWeekStart,
          },
        },
      }),
    ]);

    return { leadsLastWeek, leadsThisWeek };
  }

  private async getLeadsByStatus(where: any) {
    const statuses = await prisma.lead.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    return statuses.map((item) => ({
      status: item.status,
      count: item._count,
    }));
  }

  private async getLeadsBySource(where: any) {
    const sources = await prisma.lead.groupBy({
      by: ['source'],
      where,
      _count: true,
      orderBy: {
        _count: {
          source: 'desc',
        },
      },
      take: 10,
    });

    return sources.map((item) => ({
      source: item.source,
      count: item._count,
    }));
  }

  private async getLeadsByPriority(where: any) {
    const priorities = await prisma.lead.groupBy({
      by: ['priority'],
      where,
      _count: true,
    });

    return priorities.map((item) => ({
      priority: item.priority,
      count: item._count,
    }));
  }

  private async getAvgResponseTime(where: any) {
    // Calcular tempo médio entre criação do lead e primeira nota
    const leadsWithNotes = await prisma.lead.findMany({
      where,
      select: {
        createdAt: true,
        notes: {
          orderBy: { createdAt: 'asc' },
          take: 1,
          select: {
            createdAt: true,
          },
        },
      },
    });

    const responseTimes = leadsWithNotes
      .filter((lead) => lead.notes.length > 0)
      .map((lead) => {
        const firstNoteTime = lead.notes[0].createdAt.getTime();
        const leadCreatedTime = lead.createdAt.getTime();
        return (firstNoteTime - leadCreatedTime) / (1000 * 60 * 60); // em horas
      });

    if (responseTimes.length === 0) return 0;

    const avgHours =
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    return Number(avgHours.toFixed(2));
  }

  private async getTopPerformers(where: any) {
    const performers = await prisma.lead.groupBy({
      by: ['assignedToId'],
      where: {
        ...where,
        assignedToId: { not: null },
      },
      _count: true,
      orderBy: {
        _count: {
          assignedToId: 'desc',
        },
      },
      take: 5,
    });

    const performersWithNames = await Promise.all(
      performers.map(async (p) => {
        const user = await prisma.user.findUnique({
          where: { id: p.assignedToId! },
          select: { id: true, name: true },
        });
        return {
          userId: p.assignedToId!,
          userName: user?.name || 'Desconhecido',
          leadsCount: p._count,
        };
      })
    );

    return performersWithNames;
  }
}
