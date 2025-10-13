import { PrismaClient, LeadPriority } from '@prisma/client';
import {
  CreatePartialLeadDTO,
  UpdatePartialLeadDTO,
  ConvertToLeadDTO,
  PartialLeadResponse,
  PartialLeadStatsResponse,
  PartialLeadWithRelations,
} from './partial-leads.types';
import { logger } from '../../utils/logger';

// ============================================================================
// PartialLeadsService
// ============================================================================

export class PartialLeadsService {
  constructor(private prisma: PrismaClient) {}

  // ==========================================================================
  // CRUD Operations
  // ==========================================================================

  async create(data: CreatePartialLeadDTO): Promise<PartialLeadResponse> {
    logger.info('Creating new partial lead', { sessionId: data.sessionId });

    // Check if partial lead with this sessionId already exists
    const existing = await this.prisma.partialLead.findUnique({
      where: { sessionId: data.sessionId },
    });

    if (existing) {
      // Update the existing one instead
      return this.update(existing.id, {
        name: data.name,
        email: data.email,
        phone: data.phone,
      });
    }

    const partialLead = await this.prisma.partialLead.create({
      data: {
        sessionId: data.sessionId,
        name: data.name || null,
        email: data.email || null,
        phone: data.phone || null,
        source: data.source,
        url: data.url,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress || null,
        interactions: 1,
      },
    });

    logger.info('Partial lead created successfully', { id: partialLead.id });

    return this.mapToResponse(partialLead);
  }

  async findBySessionId(sessionId: string): Promise<PartialLeadResponse | null> {
    logger.debug('Finding partial lead by session ID', { sessionId });

    const partialLead = await this.prisma.partialLead.findUnique({
      where: { sessionId },
    });

    if (!partialLead) {
      return null;
    }

    return this.mapToResponse(partialLead);
  }

  async findAll(): Promise<PartialLeadResponse[]> {
    logger.debug('Finding all partial leads');

    const partialLeads = await this.prisma.partialLead.findMany({
      where: {
        completed: false,
        abandoned: false,
      },
      orderBy: { lastUpdate: 'desc' },
    });

    return partialLeads.map(this.mapToResponse);
  }

  async update(id: string, data: UpdatePartialLeadDTO): Promise<PartialLeadResponse> {
    logger.info('Updating partial lead', { id, data });

    const partialLead = await this.prisma.partialLead.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        email: data.email !== undefined ? data.email : undefined,
        phone: data.phone !== undefined ? data.phone : undefined,
        interactions: {
          increment: 1,
        },
      },
    });

    logger.info('Partial lead updated successfully', { id });

    return this.mapToResponse(partialLead);
  }

  async convertToLead(
    id: string,
    conversionData: ConvertToLeadDTO,
    userId: string
  ): Promise<{ leadId: string }> {
    logger.info('Converting partial lead to full lead', { id, userId });

    const partialLead = await this.prisma.partialLead.findUnique({
      where: { id },
    });

    if (!partialLead) {
      throw new Error('Partial lead não encontrado');
    }

    if (partialLead.completed) {
      throw new Error('Partial lead já foi convertido');
    }

    if (!partialLead.name || !partialLead.phone) {
      throw new Error('Partial lead deve ter nome e telefone para ser convertido');
    }

    // Create the full lead
    const lead = await this.prisma.lead.create({
      data: {
        name: partialLead.name,
        email: partialLead.email,
        phone: partialLead.phone,
        source: partialLead.source,
        status: 'NOVO',
        priority: (conversionData.priority as LeadPriority) || LeadPriority.MEDIUM,
        createdById: userId,
        assignedToId: conversionData.assignedToId || userId,
        tags: conversionData.tags && conversionData.tags.length > 0
          ? {
              create: conversionData.tags.map(tagId => ({
                tagId,
              })),
            }
          : undefined,
      },
    });

    // Mark partial lead as completed
    await this.prisma.partialLead.update({
      where: { id },
      data: {
        completed: true,
        completedAt: new Date(),
        convertedToLeadId: lead.id,
      },
    });

    logger.info('Partial lead converted to lead successfully', {
      partialLeadId: id,
      leadId: lead.id,
    });

    return { leadId: lead.id };
  }

  async markAbandoned(id: string): Promise<PartialLeadResponse> {
    logger.info('Marking partial lead as abandoned', { id });

    const partialLead = await this.prisma.partialLead.update({
      where: { id },
      data: {
        abandoned: true,
      },
    });

    logger.info('Partial lead marked as abandoned', { id });

    return this.mapToResponse(partialLead);
  }

  async cleanup(olderThanDays: number): Promise<{ deletedCount: number }> {
    logger.info('Cleaning up old partial leads', { olderThanDays });

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.prisma.partialLead.deleteMany({
      where: {
        OR: [
          {
            abandoned: true,
            createdAt: { lt: cutoffDate },
          },
          {
            completed: true,
            createdAt: { lt: cutoffDate },
          },
          {
            completed: false,
            abandoned: false,
            createdAt: { lt: cutoffDate },
          },
        ],
      },
    });

    logger.info('Cleanup completed', { deletedCount: result.count });

    return { deletedCount: result.count };
  }

  async getStats(): Promise<PartialLeadStatsResponse> {
    logger.debug('Getting partial leads stats');

    const [total, completed, abandoned, active] = await Promise.all([
      this.prisma.partialLead.count(),
      this.prisma.partialLead.count({ where: { completed: true } }),
      this.prisma.partialLead.count({ where: { abandoned: true } }),
      this.prisma.partialLead.count({
        where: { completed: false, abandoned: false },
      }),
    ]);

    const conversionRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      total,
      completed,
      abandoned,
      active,
      conversionRate: Math.round(conversionRate * 100) / 100,
    };
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  private mapToResponse(partialLead: PartialLeadWithRelations): PartialLeadResponse {
    return {
      id: partialLead.id,
      sessionId: partialLead.sessionId,
      name: partialLead.name,
      email: partialLead.email,
      phone: partialLead.phone,
      source: partialLead.source,
      url: partialLead.url,
      userAgent: partialLead.userAgent,
      ipAddress: partialLead.ipAddress,
      firstInteraction: partialLead.firstInteraction,
      lastUpdate: partialLead.lastUpdate,
      interactions: partialLead.interactions,
      completed: partialLead.completed,
      abandoned: partialLead.abandoned,
      convertedToLeadId: partialLead.convertedToLeadId,
      completedAt: partialLead.completedAt,
      createdAt: partialLead.createdAt,
    };
  }
}
