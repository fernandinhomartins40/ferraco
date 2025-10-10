import { PrismaClient, Note, Prisma } from '@prisma/client';
import {
  CreateNoteDTO,
  UpdateNoteDTO,
  NoteFiltersDTO,
  NoteResponse,
  NoteWithRelations,
  NoteStatsResponse,
  NoteCategoryStats,
} from './notes.types';
import { logger } from '../../utils/logger';

// ============================================================================
// NotesService
// ============================================================================

export class NotesService {
  constructor(private prisma: PrismaClient) {}

  // ==========================================================================
  // CRUD Operations
  // ==========================================================================

  async create(data: CreateNoteDTO, userId: string): Promise<NoteResponse> {
    logger.info('Creating new note', { leadId: data.leadId, userId });

    // Verify lead exists
    const lead = await this.prisma.lead.findUnique({
      where: { id: data.leadId },
    });

    if (!lead) {
      throw new Error('Lead não encontrado');
    }

    const note = await this.prisma.note.create({
      data: {
        content: data.content,
        category: data.category || null,
        important: data.isImportant || false,
        leadId: data.leadId,
        createdById: userId,
      },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    logger.info('Note created successfully', { noteId: note.id });

    return this.mapToResponse(note as unknown as NoteWithRelations);
  }

  async findByLeadId(leadId: string): Promise<NoteResponse[]> {
    logger.debug('Finding notes by lead ID', { leadId });

    const notes = await this.prisma.note.findMany({
      where: { leadId },
      orderBy: [
        { important: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        lead: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return notes.map(note => this.mapToResponse(note as unknown as NoteWithRelations));
  }

  async findAll(filters: NoteFiltersDTO): Promise<{
    data: NoteResponse[];
    total: number;
    page: number;
    limit: number;
  }> {
    logger.debug('Finding notes with filters', { filters });

    const where = this.buildWhereClause(filters);
    const orderBy = this.buildOrderByClause(filters);

    const skip = ((filters.page || 1) - 1) * (filters.limit || 20);
    const take = filters.limit || 20;

    const [data, total] = await Promise.all([
      this.prisma.note.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          lead: {
            select: {
              id: true,
              name: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.note.count({ where }),
    ]);

    return {
      data: data.map(note => this.mapToResponse(note as unknown as NoteWithRelations)),
      total,
      page: filters.page || 1,
      limit: filters.limit || 20,
    };
  }

  async findById(id: string): Promise<NoteResponse | null> {
    logger.debug('Finding note by ID', { id });

    const note = await this.prisma.note.findUnique({
      where: { id },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!note) {
      return null;
    }

    return this.mapToResponse(note as unknown as NoteWithRelations);
  }

  async update(id: string, data: UpdateNoteDTO): Promise<NoteResponse> {
    logger.info('Updating note', { id, data });

    // Check if note exists
    const existingNote = await this.prisma.note.findUnique({
      where: { id },
    });

    if (!existingNote) {
      throw new Error('Nota não encontrada');
    }

    const note = await this.prisma.note.update({
      where: { id },
      data: {
        content: data.content,
        category: data.category,
        important: data.isImportant,
      },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    logger.info('Note updated successfully', { noteId: note.id });

    return this.mapToResponse(note as unknown as NoteWithRelations);
  }

  async delete(id: string): Promise<void> {
    logger.info('Deleting note', { id });

    const note = await this.prisma.note.findUnique({
      where: { id },
    });

    if (!note) {
      throw new Error('Nota não encontrada');
    }

    await this.prisma.note.delete({
      where: { id },
    });

    logger.info('Note deleted successfully', { noteId: id });
  }

  // ==========================================================================
  // Special Operations
  // ==========================================================================

  async toggleImportant(id: string): Promise<NoteResponse> {
    logger.info('Toggling note importance', { id });

    const note = await this.prisma.note.findUnique({
      where: { id },
    });

    if (!note) {
      throw new Error('Nota não encontrada');
    }

    const updated = await this.prisma.note.update({
      where: { id },
      data: { important: !note.important },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    logger.info('Note importance toggled', { noteId: id, important: updated.important });

    return this.mapToResponse(updated as unknown as NoteWithRelations);
  }

  async duplicate(id: string, userId: string): Promise<NoteResponse> {
    logger.info('Duplicating note', { id, userId });

    const original = await this.prisma.note.findUnique({
      where: { id },
    });

    if (!original) {
      throw new Error('Nota original não encontrada');
    }

    const duplicated = await this.prisma.note.create({
      data: {
        leadId: original.leadId,
        content: `[CÓPIA] ${original.content}`,
        category: original.category,
        important: original.important,
        createdById: userId,
      },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    logger.info('Note duplicated successfully', { originalId: id, duplicateId: duplicated.id });

    return this.mapToResponse(duplicated as unknown as NoteWithRelations);
  }

  async search(query: string, leadId?: string, limit: number = 20): Promise<NoteResponse[]> {
    logger.debug('Searching notes', { query, leadId, limit });

    const where: Prisma.NoteWhereInput = {
      content: {
        contains: query,
        mode: 'insensitive',
      },
    };

    if (leadId) {
      where.leadId = leadId;
    }

    const notes = await this.prisma.note.findMany({
      where,
      take: limit,
      orderBy: [
        { important: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        lead: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return notes.map(note => this.mapToResponse(note as unknown as NoteWithRelations));
  }

  async getCategories(): Promise<string[]> {
    logger.debug('Fetching note categories');

    const notes = await this.prisma.note.findMany({
      where: {
        category: { not: null },
      },
      select: {
        category: true,
      },
      distinct: ['category'],
    });

    const categories = notes
      .map(n => n.category)
      .filter((c): c is string => c !== null);

    logger.debug('Categories fetched', { count: categories.length });

    return categories;
  }

  async findImportant(leadId?: string, limit: number = 20): Promise<NoteResponse[]> {
    logger.debug('Finding important notes', { leadId, limit });

    const where: Prisma.NoteWhereInput = {
      important: true,
    };

    if (leadId) {
      where.leadId = leadId;
    }

    const notes = await this.prisma.note.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return notes.map(note => this.mapToResponse(note as unknown as NoteWithRelations));
  }

  async getStats(leadId?: string): Promise<NoteStatsResponse> {
    logger.debug('Fetching note statistics', { leadId });

    const where: Prisma.NoteWhereInput = leadId ? { leadId } : {};

    // Calculate date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [total, important, byCategory, recentCount] = await Promise.all([
      this.prisma.note.count({ where }),

      this.prisma.note.count({
        where: { ...where, important: true },
      }),

      this.prisma.note.groupBy({
        by: ['category'],
        where: {
          ...where,
          category: { not: null },
        },
        _count: true,
      }),

      this.prisma.note.count({
        where: {
          ...where,
          createdAt: { gte: sevenDaysAgo },
        },
      }),
    ]);

    const categoryStats: NoteCategoryStats[] = byCategory.map(c => ({
      category: c.category || 'Sem categoria',
      count: c._count,
    }));

    return {
      total,
      important,
      byCategory: categoryStats,
      recentCount,
    };
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  private buildWhereClause(filters: NoteFiltersDTO): Prisma.NoteWhereInput {
    const where: Prisma.NoteWhereInput = {};

    if (filters.leadId) {
      where.leadId = filters.leadId;
    }

    if (filters.category && filters.category.length > 0) {
      where.category = { in: filters.category };
    }

    if (filters.isImportant !== undefined) {
      where.important = filters.isImportant;
    }

    if (filters.createdById) {
      where.createdById = filters.createdById;
    }

    if (filters.search) {
      where.content = {
        contains: filters.search,
        mode: 'insensitive',
      };
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    return where;
  }

  private buildOrderByClause(filters: NoteFiltersDTO): Prisma.NoteOrderByWithRelationInput[] {
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';

    return [
      { important: 'desc' }, // Important notes always first
      { [sortBy]: sortOrder },
    ];
  }

  private mapToResponse(note: NoteWithRelations): NoteResponse {
    return {
      id: note.id,
      content: note.content,
      important: note.important,
      category: note.category,
      leadId: note.leadId,
      lead: note.lead,
      createdBy: note.createdBy,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
  }
}
