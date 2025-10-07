import { LeadStatus, LeadPriority } from '@prisma/client';
import prisma from '../../config/database';
import { PAGINATION } from '../../config/constants';
import { AppError } from '../../middleware/errorHandler';

export class LeadsService {
  /**
   * Listar leads com filtros e paginação
   */
  async getLeads(filters: {
    status?: LeadStatus;
    search?: string;
    tags?: string[];
    assignedToId?: string;
    source?: string;
    priority?: LeadPriority;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      status,
      search,
      tags = [],
      assignedToId,
      source,
      priority,
      page = PAGINATION.defaultPage,
      limit = PAGINATION.defaultLimit,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (source) {
      where.source = source;
    }

    if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (tags.length > 0) {
      where.tags = {
        some: {
          tag: {
            name: { in: tags },
          },
        },
      };
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          notes: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          tags: {
            include: { tag: true },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * Math.min(limit, PAGINATION.maxLimit),
        take: Math.min(limit, PAGINATION.maxLimit),
      }),
      prisma.lead.count({ where }),
    ]);

    return {
      data: leads,
      pagination: {
        page,
        limit: Math.min(limit, PAGINATION.maxLimit),
        total,
        totalPages: Math.ceil(total / Math.min(limit, PAGINATION.maxLimit)),
      },
    };
  }

  /**
   * Obter lead por ID
   */
  async getLeadById(id: string) {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        notes: {
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        tags: {
          include: { tag: true },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!lead) {
      throw new AppError(404, 'Lead não encontrado');
    }

    return lead;
  }

  /**
   * Criar novo lead
   */
  async createLead(data: {
    name: string;
    phone: string;
    email?: string;
    status?: LeadStatus;
    source?: string;
    priority?: LeadPriority;
    assignedToId?: string;
    createdById?: string;
  }) {
    const lead = await prisma.lead.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        status: data.status || 'NOVO',
        source: data.source || 'website',
        priority: data.priority || 'MEDIUM',
        assignedToId: data.assignedToId,
        createdById: data.createdById,
      },
      include: {
        notes: true,
        tags: { include: { tag: true } },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return lead;
  }

  /**
   * Atualizar lead
   */
  async updateLead(
    id: string,
    data: Partial<{
      name: string;
      phone: string;
      email: string;
      status: LeadStatus;
      priority: LeadPriority;
      source: string;
      assignedToId: string;
      nextFollowUp: Date;
      leadScore: number;
      pipelineStage: string;
    }>
  ) {
    const lead = await prisma.lead.update({
      where: { id },
      data,
      include: {
        notes: true,
        tags: { include: { tag: true } },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return lead;
  }

  /**
   * Atualizar apenas o status do lead
   */
  async updateLeadStatus(id: string, status: LeadStatus) {
    const lead = await prisma.lead.update({
      where: { id },
      data: { status },
      include: {
        tags: { include: { tag: true } },
      },
    });

    return lead;
  }

  /**
   * Deletar lead
   */
  async deleteLead(id: string) {
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      throw new AppError(404, 'Lead não encontrado');
    }

    await prisma.lead.delete({ where: { id } });

    return { message: 'Lead deletado com sucesso' };
  }

  /**
   * Obter estatísticas de leads
   */
  async getLeadStats() {
    const [total, novo, emAndamento, concluido, perdido, descartado] =
      await Promise.all([
        prisma.lead.count(),
        prisma.lead.count({ where: { status: 'NOVO' } }),
        prisma.lead.count({ where: { status: 'EM_ANDAMENTO' } }),
        prisma.lead.count({ where: { status: 'CONCLUIDO' } }),
        prisma.lead.count({ where: { status: 'PERDIDO' } }),
        prisma.lead.count({ where: { status: 'DESCARTADO' } }),
      ]);

    const conversionRate = total > 0 ? (concluido / total) * 100 : 0;

    return {
      total,
      novo,
      emAndamento,
      concluido,
      perdido,
      descartado,
      conversionRate: Number(conversionRate.toFixed(2)),
    };
  }
}
