import { PrismaClient, Lead, Prisma, LeadPriority } from '@prisma/client';
import {
  CreateLeadDTO,
  UpdateLeadDTO,
  LeadFiltersDTO,
  MergeLeadsDTO,
  LeadResponse,
  LeadStatsResponse,
  DuplicateMatch,
  LeadWithRelations,
} from './leads.types';
import { logger } from '../../utils/logger';

// ============================================================================
// LeadsService
// ============================================================================

export class LeadsService {
  constructor(private prisma: PrismaClient) {}

  // ==========================================================================
  // CRUD Operations
  // ==========================================================================

  async create(data: CreateLeadDTO, userId: string): Promise<LeadResponse> {
    logger.info('Creating new lead', { data, userId });

    // Check for duplicates before creating
    const duplicates = await this.findDuplicates({
      phone: data.phone,
      email: data.email,
    });

    if (duplicates.length > 0) {
      logger.warn('Duplicate lead detected', { phone: data.phone, email: data.email });
      throw new Error('Lead duplicado detectado. Já existe um lead com este telefone ou email.');
    }

    // Calculate initial score
    const score = this.calculateLeadScore(data);

    // Prepare custom fields
    const customFields = data.customFields ? JSON.stringify(data.customFields) : null;

    const lead = await this.prisma.lead.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone,
        status: data.status || 'NOVO',
        priority: data.priority || LeadPriority.MEDIUM,
        source: data.source || null,
        leadScore: score,
        metadata: customFields,
        createdById: userId,
        assignedToId: data.assignedToId || userId,
        tags: data.tags && data.tags.length > 0 ? {
          create: data.tags.map(tagId => ({
            tagId,
          })),
        } : undefined,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
    });

    logger.info('Lead created successfully', { leadId: lead.id });

    return this.mapToResponse(lead as unknown as LeadWithRelations);
  }

  async findAll(filters: LeadFiltersDTO): Promise<{
    data: LeadResponse[];
    total: number;
    page: number;
    limit: number;
  }> {
    logger.debug('Finding leads with filters', { filters });

    const where = this.buildWhereClause(filters);
    const orderBy = this.buildOrderByClause(filters);

    const skip = ((filters.page || 1) - 1) * (filters.limit || 20);
    const take = filters.limit || 20;

    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          tags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      data: data.map(lead => this.mapToResponse(lead as unknown as LeadWithRelations)),
      total,
      page: filters.page || 1,
      limit: filters.limit || 20,
    };
  }

  async findById(id: string): Promise<LeadResponse | null> {
    logger.debug('Finding lead by ID', { id });

    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
    });

    if (!lead) {
      return null;
    }

    return this.mapToResponse(lead as unknown as LeadWithRelations);
  }

  async update(id: string, data: UpdateLeadDTO): Promise<LeadResponse> {
    logger.info('Updating lead', { id, data });

    // Check if lead exists
    const existingLead = await this.prisma.lead.findUnique({
      where: { id },
    });

    if (!existingLead) {
      throw new Error('Lead não encontrado');
    }

    // Recalculate score if relevant data changed
    let score = existingLead.leadScore;
    if (data.email !== undefined || data.phone !== undefined || data.company !== undefined) {
      score = this.calculateLeadScore({
        ...existingLead,
        ...data,
      } as CreateLeadDTO);
    }

    // Prepare custom fields
    const customFields = data.customFields ? JSON.stringify(data.customFields) : undefined;

    // Update lead
    const lead = await this.prisma.lead.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        status: data.status,
        priority: data.priority,
        source: data.source,
        assignedToId: data.assignedToId,
        leadScore: score,
        metadata: customFields,
        tags: data.tags ? {
          deleteMany: {},
          create: data.tags.map(tagId => ({
            tagId,
          })),
        } : undefined,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
    });

    logger.info('Lead updated successfully', { leadId: lead.id });

    return this.mapToResponse(lead as unknown as LeadWithRelations);
  }

  async delete(id: string): Promise<void> {
    logger.info('Deleting lead (soft delete)', { id });

    const lead = await this.prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      throw new Error('Lead não encontrado');
    }

    // Soft delete by marking as archived
    await this.prisma.lead.update({
      where: { id },
      data: {
        status: 'ARQUIVADO',
      },
    });

    logger.info('Lead deleted successfully', { leadId: id });
  }

  // ==========================================================================
  // Statistics
  // ==========================================================================

  async getStats(): Promise<LeadStatsResponse> {
    logger.debug('Fetching lead statistics');

    const [total, byStatus, byPriority, avgScore] = await Promise.all([
      this.prisma.lead.count({
        where: { status: { not: 'ARQUIVADO' } },
      }),

      this.prisma.lead.groupBy({
        by: ['status'],
        where: { status: { not: 'ARQUIVADO' } },
        _count: true,
      }),

      this.prisma.lead.groupBy({
        by: ['priority'],
        where: { status: { not: 'ARQUIVADO' } },
        _count: true,
      }),

      this.prisma.lead.aggregate({
        where: { status: { not: 'ARQUIVADO' } },
        _avg: { leadScore: true },
      }),
    ]);

    // Group by source
    const leadsBySource = await this.prisma.lead.groupBy({
      by: ['source'],
      where: { status: { not: 'ARQUIVADO' } },
      _count: true,
    });

    // Calculate conversion rate
    const convertedLeads = await this.prisma.lead.count({
      where: {
        status: 'CONCLUIDO',
      },
    });

    const conversionRate = total > 0 ? (convertedLeads / total) * 100 : 0;

    return {
      total,
      byStatus: Object.fromEntries(
        byStatus.map(s => [s.status, s._count])
      ),
      byPriority: Object.fromEntries(
        byPriority.map(p => [p.priority, p._count])
      ),
      bySource: Object.fromEntries(
        leadsBySource.map(s => [s.source || 'Desconhecido', s._count])
      ),
      averageScore: avgScore._avg.leadScore || 0,
      conversionRate: Math.round(conversionRate * 100) / 100,
    };
  }

  async getTimeline(days: number = 30): Promise<{ date: string; count: number }[]> {
    logger.debug('Fetching lead timeline', { days });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const leads = await this.prisma.lead.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
        status: { not: 'ARQUIVADO' },
      },
      select: {
        createdAt: true,
      },
    });

    // Agrupar leads por data
    const timeline: Record<string, number> = {};
    const today = new Date();

    // Inicializar todos os dias com 0
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      timeline[dateStr] = 0;
    }

    // Contar leads por dia
    leads.forEach(lead => {
      const dateStr = lead.createdAt.toISOString().split('T')[0];
      if (timeline[dateStr] !== undefined) {
        timeline[dateStr]++;
      }
    });

    return Object.entries(timeline).map(([date, count]) => ({
      date,
      count,
    }));
  }

  // ==========================================================================
  // Duplicates
  // ==========================================================================

  async findDuplicates(criteria: {
    phone?: string;
    email?: string;
  }): Promise<DuplicateMatch[]> {
    logger.debug('Finding duplicate leads', { criteria });

    if (!criteria.phone && !criteria.email) {
      return [];
    }

    const whereConditions: Prisma.LeadWhereInput[] = [];

    if (criteria.phone) {
      whereConditions.push({ phone: criteria.phone });
    }

    if (criteria.email) {
      whereConditions.push({ email: criteria.email });
    }

    const leads = await this.prisma.lead.findMany({
      where: {
        status: { not: 'ARQUIVADO' },
        OR: whereConditions,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
    });

    // Calculate similarity scores
    const duplicates: DuplicateMatch[] = leads.map(lead => {
      const matches: { field: string; similarity: number }[] = [];
      let totalScore = 0;

      if (criteria.phone && lead.phone === criteria.phone) {
        matches.push({ field: 'phone', similarity: 100 });
        totalScore += 100;
      }

      if (criteria.email && lead.email === criteria.email) {
        matches.push({ field: 'email', similarity: 100 });
        totalScore += 100;
      }

      const averageScore = matches.length > 0 ? totalScore / matches.length : 0;

      return {
        lead: this.mapToResponse(lead as unknown as LeadWithRelations),
        score: averageScore,
        matches,
      };
    });

    return duplicates.filter(d => d.score > 0);
  }

  async merge(data: MergeLeadsDTO): Promise<LeadResponse> {
    logger.info('Merging leads', { data });

    // Fetch all leads
    const [primary, ...duplicates] = await Promise.all([
      this.prisma.lead.findUnique({ where: { id: data.primaryLeadId } }),
      ...data.duplicateLeadIds.map(id =>
        this.prisma.lead.findUnique({ where: { id } })
      ),
    ]);

    if (!primary) {
      throw new Error('Lead principal não encontrado');
    }

    if (duplicates.some(d => !d)) {
      throw new Error('Um ou mais leads duplicados não foram encontrados');
    }

    // Merge data based on fieldsToKeep
    const mergedData: Partial<Lead> = { ...primary };
    const firstDuplicate = duplicates[0]!;

    Object.entries(data.fieldsToKeep).forEach(([field, source]) => {
      if (source === 'duplicate') {
        const value = firstDuplicate[field as keyof Lead];
        if (value !== undefined) {
          (mergedData as Record<string, unknown>)[field] = value;
        }
      }
    });

    // Collect all tags from duplicates
    const duplicateTags = await this.prisma.leadTag.findMany({
      where: {
        leadId: { in: data.duplicateLeadIds },
      },
      select: { tagId: true },
      distinct: ['tagId'],
    });

    // Update primary lead
    const updated = await this.prisma.lead.update({
      where: { id: data.primaryLeadId },
      data: {
        name: mergedData.name,
        email: mergedData.email,
        phone: mergedData.phone!,
        status: mergedData.status,
        priority: mergedData.priority,
        source: mergedData.source,
        leadScore: mergedData.leadScore,
        metadata: mergedData.metadata,
        tags: {
          connectOrCreate: duplicateTags.map(t => ({
            where: {
              leadId_tagId: {
                leadId: data.primaryLeadId,
                tagId: t.tagId,
              },
            },
            create: {
              tagId: t.tagId,
            },
          })),
        },
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
    });

    // Archive duplicates
    await this.prisma.lead.updateMany({
      where: { id: { in: data.duplicateLeadIds } },
      data: {
        status: 'ARQUIVADO',
        isDuplicate: true,
        duplicateOfId: data.primaryLeadId,
      },
    });

    logger.info('Leads merged successfully', { primaryLeadId: data.primaryLeadId });

    return this.mapToResponse(updated as unknown as LeadWithRelations);
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  private buildWhereClause(filters: LeadFiltersDTO): Prisma.LeadWhereInput {
    const where: Prisma.LeadWhereInput = {
      status: { not: 'ARQUIVADO' },
    };

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } },
        { company: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.status && filters.status.length > 0) {
      where.status = { in: filters.status };
    }

    if (filters.priority && filters.priority.length > 0) {
      where.priority = { in: filters.priority };
    }

    if (filters.source && filters.source.length > 0) {
      where.source = { in: filters.source };
    }

    if (filters.assignedToId) {
      where.assignedToId = filters.assignedToId;
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        some: {
          tagId: { in: filters.tags },
        },
      };
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    if (filters.hasEmail !== undefined) {
      where.email = filters.hasEmail ? { not: null } : null;
    }

    if (filters.hasPhone !== undefined) {
      where.phone = filters.hasPhone ? { not: null } : null;
    }

    return where;
  }

  private buildOrderByClause(filters: LeadFiltersDTO): Prisma.LeadOrderByWithRelationInput {
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';

    return {
      [sortBy]: sortOrder,
    };
  }

  private mapToResponse(lead: LeadWithRelations): LeadResponse {
    let customFields: Record<string, unknown> = {};

    if (lead.metadata) {
      try {
        customFields = JSON.parse(lead.metadata);
      } catch (e) {
        logger.error('Failed to parse lead metadata', { leadId: lead.id, error: e });
      }
    }

    return {
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: null,
      position: null,
      source: lead.source,
      status: lead.status,
      priority: lead.priority,
      score: lead.leadScore,
      assignedTo: lead.assignedTo || null,
      tags: lead.tags.map(t => t.tag),
      customFields,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      lastContactedAt: lead.lastContactedAt,
      nextFollowUpAt: lead.nextFollowUpAt,
    };
  }

  private calculateLeadScore(data: Partial<CreateLeadDTO>): number {
    let score = 0;

    // Base score
    score += 20;

    // Email provided
    if (data.email) {
      score += 15;
    }

    // Phone provided
    if (data.phone) {
      score += 15;
    }

    // Company provided
    if (data.company) {
      score += 20;
    }

    // Source is known
    if (data.source && data.source !== 'unknown') {
      score += 10;
    }

    // Priority bonus
    if (data.priority === LeadPriority.HIGH) {
      score += 10;
    } else if (data.priority === LeadPriority.URGENT) {
      score += 20;
    }

    return Math.min(score, 100);
  }
}
