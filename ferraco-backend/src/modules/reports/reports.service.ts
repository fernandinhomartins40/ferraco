import { getPrismaClient } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { Prisma, ReportType, LeadStatus, CommunicationType } from '@prisma/client';

const prisma = getPrismaClient();

export class ReportsService {
  /**
   * Listar relatórios
   */
  async getReports(filters: {
    type?: string;
    generatedById?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { type, generatedById, search, page = 1, limit = 20 } = filters;

    const where: Prisma.ReportWhereInput = {};

    if (type) {
      where.type = type as ReportType;
    }

    if (generatedById) {
      where.generatedById = generatedById;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ] as any;
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.report.count({ where }),
    ]);

    return {
      data: reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obter relatório por ID
   */
  async getReportById(id: string) {
    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      throw new AppError(404, 'Relatório não encontrado');
    }

    return report;
  }

  /**
   * Criar novo relatório
   */
  async createReport(data: {
    name: string;
    description?: string;
    type: string;
    filters: string;
    generatedById: string;
  }) {
    const { name, description, type, filters, generatedById } = data;

    const report = await prisma.report.create({
      data: {
        name,
        description,
        type: type as ReportType,
        filters,
        widgets: '[]',
        generatedById,
      },
    });

    return report;
  }

  /**
   * Atualizar relatório
   */
  async updateReport(id: string, data: {
    name?: string;
    description?: string;
    type?: string;
    filters?: string;
    data?: string;
  }) {
    const report = await prisma.report.findUnique({ where: { id } });

    if (!report) {
      throw new AppError(404, 'Relatório não encontrado');
    }

    const updateData: Prisma.ReportUpdateInput = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.type && { type: data.type as ReportType }),
      ...(data.filters !== undefined && { filters: data.filters }),
      ...(data.data !== undefined && { data: data.data }),
    };

    const updated = await prisma.report.update({
      where: { id },
      data: updateData,
    });

    return updated;
  }

  /**
   * Deletar relatório
   */
  async deleteReport(id: string) {
    const report = await prisma.report.findUnique({ where: { id } });

    if (!report) {
      throw new AppError(404, 'Relatório não encontrado');
    }

    await prisma.report.delete({ where: { id } });

    return { success: true, message: 'Relatório deletado com sucesso' };
  }

  /**
   * Gerar relatório de leads
   */
  async generateLeadsReport(filters: {
    startDate?: string;
    endDate?: string;
    status?: string;
    source?: string;
    assignedToId?: string;
  }) {
    const { startDate, endDate, status, source, assignedToId } = filters;

    const where: Prisma.LeadWhereInput = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    if (status) {
      where.status = status as LeadStatus;
    }

    if (source) {
      where.source = source;
    }

    if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    const [
      total,
      byStatus,
      bySource,
      byAssignedTo,
      leads,
    ] = await Promise.all([
      prisma.lead.count({ where }),

      prisma.lead.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),

      prisma.lead.groupBy({
        by: ['source'],
        where,
        _count: { id: true },
      }),

      prisma.lead.groupBy({
        by: ['assignedToId'],
        where,
        _count: { id: true },
      }),

      prisma.lead.findMany({
        where,
        include: {
          assignedTo: {
            select: {
              id: true,
              username: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      summary: {
        total,
        byStatus: byStatus.reduce((acc, item) => {
          acc[item.status] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
        bySource: bySource.reduce((acc, item) => {
          acc[item.source] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
        byAssignedTo: byAssignedTo.reduce((acc, item) => {
          if (item.assignedToId) {
            acc[item.assignedToId] = item._count.id;
          }
          return acc;
        }, {} as Record<string, number>),
      },
      leads,
      filters,
      generatedAt: new Date(),
    };
  }

  /**
   * Gerar relatório de comunicações
   */
  async generateCommunicationsReport(filters: {
    startDate?: string;
    endDate?: string;
    type?: string;
    direction?: string;
    leadId?: string;
  }) {
    const { startDate, endDate, type, direction, leadId } = filters;

    const where: Prisma.CommunicationWhereInput = {};

    if (startDate || endDate) {
      where.sentAt = {};
      if (startDate) {
        where.sentAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.sentAt.lte = new Date(endDate);
      }
    }

    if (type) {
      where.type = type as CommunicationType;
    }

    if (direction) {
      where.direction = direction as any;
    }

    if (leadId) {
      where.leadId = leadId;
    }

    const [
      total,
      byType,
      byDirection,
      byStatus,
      communications,
    ] = await Promise.all([
      prisma.communication.count({ where }),

      prisma.communication.groupBy({
        by: ['type'],
        where,
        _count: { id: true },
      }),

      prisma.communication.groupBy({
        by: ['direction'],
        where,
        _count: { id: true },
      }),

      prisma.communication.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),

      prisma.communication.findMany({
        where,
        include: {
          lead: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { sentAt: 'desc' },
      }),
    ]);

    return {
      summary: {
        total,
        byType: byType.reduce((acc, item) => {
          acc[item.type] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
        byDirection: byDirection.reduce((acc, item) => {
          acc[item.direction] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
        byStatus: byStatus.reduce((acc, item) => {
          acc[item.status] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
      },
      communications,
      filters,
      generatedAt: new Date(),
    };
  }

  /**
   * Gerar relatório de funil de vendas
   */
  async generateSalesFunnelReport(filters: {
    startDate?: string;
    endDate?: string;
    pipelineId?: string;
  }) {
    const { startDate, endDate, pipelineId } = filters;

    const where: Prisma.LeadWhereInput = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Pipeline/stages não implementado no modelo Lead atual
    const leads = await prisma.lead.findMany({ where });

    const pipelines = await prisma.pipeline.findMany({
      where: pipelineId ? { id: pipelineId } : undefined,
    });

    const funnelData = pipelines.map((pipeline) => ({
      pipelineId: pipeline.id,
      pipelineName: pipeline.name,
      stages: [] as any[], // TODO: Implementar relação Lead<->Pipeline
    }));

    const conversionRate = leads.length > 0
      ? (leads.filter((l) => l.status === 'CONCLUIDO').length / leads.length) * 100
      : 0;

    return {
      summary: {
        totalLeads: leads.length,
        convertedLeads: leads.filter((l) => l.status === 'CONCLUIDO').length,
        lostLeads: leads.filter((l) => l.status === 'PERDIDO').length,
        conversionRate: Math.round(conversionRate * 100) / 100,
      },
      funnelData,
      filters,
      generatedAt: new Date(),
    };
  }

  /**
   * Gerar relatório de performance de usuários
   */
  async generateUserPerformanceReport(filters: {
    startDate?: string;
    endDate?: string;
    userId?: string;
  }) {
    const { startDate, endDate, userId } = filters;

    const where: Prisma.LeadWhereInput = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    if (userId) {
      where.assignedToId = userId;
    }

    const users = await prisma.user.findMany({
      where: userId ? { id: userId } : undefined,
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    const userStats = await Promise.all(
      users.map(async (user) => {
        const [
          totalLeads,
          convertedLeads,
          lostLeads,
          communications,
          notes,
        ] = await Promise.all([
          prisma.lead.count({
            where: { ...where, assignedToId: user.id },
          }),

          prisma.lead.count({
            where: { ...where, assignedToId: user.id, status: 'CONCLUIDO' },
          }),

          prisma.lead.count({
            where: { ...where, assignedToId: user.id, status: 'PERDIDO' },
          }),

          prisma.communication.count({
            where: {
              sentBy: user.id,
              ...(where.createdAt && { sentAt: where.createdAt as any }),
            },
          }),

          prisma.leadNote.count({
            where: {
              createdById: user.id,
              ...(where.createdAt && { createdAt: where.createdAt as any }),
            } as any,
          }),
        ]);

        const conversionRate = totalLeads > 0
          ? (convertedLeads / totalLeads) * 100
          : 0;

        return {
          userId: user.id,
          username: user.username,
          email: user.email,
          totalLeads,
          convertedLeads,
          lostLeads,
          conversionRate: Math.round(conversionRate * 100) / 100,
          communications,
          notes,
        };
      })
    );

    return {
      userStats: userStats.sort((a, b) => b.totalLeads - a.totalLeads),
      filters,
      generatedAt: new Date(),
    };
  }
}
