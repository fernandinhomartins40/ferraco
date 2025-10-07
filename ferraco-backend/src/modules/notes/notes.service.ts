import prisma from '../../config/database';
import { PAGINATION } from '../../config/constants';
import { AppError } from '../../middleware/errorHandler';

export class NotesService {
  /**
   * Listar notas com filtros
   */
  async getNotes(filters: {
    leadId?: string;
    important?: boolean;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      leadId,
      important,
      category,
      search,
      page = PAGINATION.defaultPage,
      limit = PAGINATION.defaultLimit,
    } = filters;

    const where: any = {};

    if (leadId) {
      where.leadId = leadId;
    }

    if (important !== undefined) {
      where.important = important;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.content = { contains: search };
    }

    const [notes, total] = await Promise.all([
      prisma.leadNote.findMany({
        where,
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
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * Math.min(limit, PAGINATION.maxLimit),
        take: Math.min(limit, PAGINATION.maxLimit),
      }),
      prisma.leadNote.count({ where }),
    ]);

    return {
      data: notes,
      pagination: {
        page,
        limit: Math.min(limit, PAGINATION.maxLimit),
        total,
        totalPages: Math.ceil(total / Math.min(limit, PAGINATION.maxLimit)),
      },
    };
  }

  /**
   * Obter nota por ID
   */
  async getNoteById(id: string) {
    const note = await prisma.leadNote.findUnique({
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
          },
        },
      },
    });

    if (!note) {
      throw new AppError(404, 'Nota não encontrada');
    }

    return note;
  }

  /**
   * Obter notas de um lead
   */
  async getLeadNotes(leadId: string) {
    const notes = await prisma.leadNote.findMany({
      where: { leadId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return notes;
  }

  /**
   * Criar nota em um lead
   */
  async createLeadNote(
    leadId: string,
    data: {
      content: string;
      important?: boolean;
      category?: string;
      isPrivate?: boolean;
      createdById?: string;
    }
  ) {
    // Verificar se o lead existe
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      throw new AppError(404, 'Lead não encontrado');
    }

    const note = await prisma.leadNote.create({
      data: {
        content: data.content,
        important: data.important || false,
        category: data.category,
        isPrivate: data.isPrivate || false,
        leadId,
        createdById: data.createdById,
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
          },
        },
      },
    });

    return note;
  }

  /**
   * Atualizar nota
   */
  async updateNote(
    id: string,
    data: Partial<{
      content: string;
      important: boolean;
      category: string;
      isPrivate: boolean;
    }>
  ) {
    const note = await prisma.leadNote.update({
      where: { id },
      data,
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
          },
        },
      },
    });

    return note;
  }

  /**
   * Toggle importância da nota
   */
  async toggleNoteImportance(id: string) {
    const note = await prisma.leadNote.findUnique({ where: { id } });
    if (!note) {
      throw new AppError(404, 'Nota não encontrada');
    }

    const updatedNote = await prisma.leadNote.update({
      where: { id },
      data: { important: !note.important },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return updatedNote;
  }

  /**
   * Deletar nota
   */
  async deleteNote(id: string) {
    const note = await prisma.leadNote.findUnique({ where: { id } });
    if (!note) {
      throw new AppError(404, 'Nota não encontrada');
    }

    await prisma.leadNote.delete({ where: { id } });

    return { message: 'Nota deletada com sucesso' };
  }

  /**
   * Duplicar nota
   */
  async duplicateNote(id: string, createdById?: string) {
    const originalNote = await prisma.leadNote.findUnique({ where: { id } });
    if (!originalNote) {
      throw new AppError(404, 'Nota não encontrada');
    }

    const duplicatedNote = await prisma.leadNote.create({
      data: {
        content: originalNote.content,
        important: originalNote.important,
        category: originalNote.category,
        isPrivate: originalNote.isPrivate,
        leadId: originalNote.leadId,
        createdById: createdById || originalNote.createdById,
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
          },
        },
      },
    });

    return duplicatedNote;
  }

  /**
   * Obter estatísticas de notas
   */
  async getNoteStats() {
    const [total, important, byCategory] = await Promise.all([
      prisma.leadNote.count(),
      prisma.leadNote.count({ where: { important: true } }),
      prisma.leadNote.groupBy({
        by: ['category'],
        _count: true,
      }),
    ]);

    return {
      total,
      important,
      byCategory: byCategory.filter((item) => item.category !== null),
    };
  }

  /**
   * Obter categorias disponíveis
   */
  async getCategories() {
    const categories = await prisma.leadNote.findMany({
      where: {
        category: { not: null },
      },
      select: {
        category: true,
      },
      distinct: ['category'],
    });

    return categories
      .map((item) => item.category)
      .filter((cat): cat is string => cat !== null);
  }
}
