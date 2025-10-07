import { getPrismaClient } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { Prisma } from '@prisma/client';

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
      where.type = type;
    }

    if (generatedById) {
      where.generatedById = generatedById;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          generatedBy: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
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
      include: {
        generatedBy: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
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
        type,
        filters,
        generatedById,
      },
      include: {
        generatedBy: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
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

    const updated = await prisma.report.update({
      where: { id },
      data,
      include: {
        generatedBy: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
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
      where.status = status;
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
      where.type = type;
    }

    if (direction) {
      where.direction = direction;
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
          sentBy: {
            select: {
              id: true,
              username: true,
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

    if (pipelineId) {
      where.pipelineId = pipelineId;
    }

    const [
      leads,
      pipelines,
    ] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          pipeline: {
            include: {
              stage: true,
            },
          },
        },
      }),

      prisma.pipeline.findMany({
        where: pipelineId ? { id: pipelineId } : undefined,
        include: {
          stages: {
            include: {
              _count: {
                select: {
                  leads: true,
                },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
      }),
    ]);

    const funnelData = pipelines.map((pipeline) => ({
      pipelineId: pipeline.id,
      pipelineName: pipeline.name,
      stages: pipeline.stages.map((stage) => ({
        stageId: stage.id,
        stageName: stage.name,
        order: stage.order,
        leadsCount: stage._count.leads,
      })),
    }));

    const conversionRate = leads.length > 0
      ? (leads.filter((l) => l.status === 'converted').length / leads.length) * 100
      : 0;

    return {
      summary: {
        totalLeads: leads.length,
        convertedLeads: leads.filter((l) => l.status === 'converted').length,
        lostLeads: leads.filter((l) => l.status === 'lost').length,
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
            where: { ...where, assignedToId: user.id, status: 'converted' },
          }),

          prisma.lead.count({
            where: { ...where, assignedToId: user.id, status: 'lost' },
          }),

          prisma.communication.count({
            where: {
              sentById: user.id,
              sentAt: where.createdAt,
            },
          }),

          prisma.leadNote.count({
            where: {
              createdById: user.id,
              createdAt: where.createdAt,
            },
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
