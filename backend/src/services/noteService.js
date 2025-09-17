const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class NoteService {
  // Criar uma nova nota
  async createNote(leadId, data) {
    try {
      // Verificar se o lead existe
      const lead = await prisma.lead.findUnique({
        where: { id: leadId }
      });

      if (!lead) {
        logger.warn('Lead não encontrado para criar nota', { leadId });
        return null;
      }

      const note = await prisma.leadNote.create({
        data: {
          content: data.content,
          important: data.important || false,
          leadId: leadId,
          createdBy: data.createdBy || null,
          category: data.category || null,
          isPrivate: data.isPrivate || false
        },
        include: {
          lead: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true
            }
          }
        }
      });

      logger.info('Nota criada com sucesso', {
        noteId: note.id,
        leadId: leadId,
        leadName: lead.name,
        important: note.important
      });

      return note;
    } catch (error) {
      logger.error('Erro ao criar nota', {
        error: error.message,
        leadId,
        data
      });
      throw new Error(`Erro ao criar nota: ${error.message}`);
    }
  }

  // Buscar todas as notas de um lead
  async getNotesByLead(leadId, filters = {}) {
    try {
      const {
        important,
        category,
        isPrivate,
        search,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      // Verificar se o lead existe
      const lead = await prisma.lead.findUnique({
        where: { id: leadId }
      });

      if (!lead) {
        logger.warn('Lead não encontrado para buscar notas', { leadId });
        return null;
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = {
        leadId: leadId
      };

      // Aplicar filtros
      if (important !== undefined) where.important = important === 'true';
      if (category) where.category = category;
      if (isPrivate !== undefined) where.isPrivate = isPrivate === 'true';

      // Busca por conteúdo
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
                name: true
              }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: parseInt(limit)
        }),
        prisma.leadNote.count({ where })
      ]);

      const totalPages = Math.ceil(total / parseInt(limit));

      logger.info('Notas do lead recuperadas com sucesso', {
        leadId,
        total,
        page: parseInt(page),
        totalPages,
        filters
      });

      return {
        notes,
        pagination: {
          total,
          page: parseInt(page),
          totalPages,
          limit: parseInt(limit)
        }
      };
    } catch (error) {
      logger.error('Erro ao buscar notas do lead', {
        error: error.message,
        leadId,
        filters
      });
      throw new Error(`Erro ao buscar notas: ${error.message}`);
    }
  }

  // Buscar uma nota por ID
  async getNoteById(id) {
    try {
      const note = await prisma.leadNote.findUnique({
        where: { id },
        include: {
          lead: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              status: true
            }
          }
        }
      });

      if (!note) {
        logger.warn('Nota não encontrada', { noteId: id });
        return null;
      }

      logger.info('Nota recuperada com sucesso', {
        noteId: note.id,
        leadId: note.leadId,
        leadName: note.lead.name
      });

      return note;
    } catch (error) {
      logger.error('Erro ao buscar nota por ID', {
        error: error.message,
        noteId: id
      });
      throw new Error(`Erro ao buscar nota: ${error.message}`);
    }
  }

  // Atualizar uma nota
  async updateNote(id, data) {
    try {
      // Verificar se a nota existe
      const existingNote = await prisma.leadNote.findUnique({
        where: { id },
        include: {
          lead: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (!existingNote) {
        logger.warn('Nota não encontrada para atualização', { noteId: id });
        return null;
      }

      const updateData = {};

      // Apenas atualizar campos fornecidos
      if (data.content !== undefined) updateData.content = data.content;
      if (data.important !== undefined) updateData.important = data.important;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.isPrivate !== undefined) updateData.isPrivate = data.isPrivate;

      const note = await prisma.leadNote.update({
        where: { id },
        data: updateData,
        include: {
          lead: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true
            }
          }
        }
      });

      logger.info('Nota atualizada com sucesso', {
        noteId: note.id,
        leadId: note.leadId,
        leadName: note.lead.name,
        updatedFields: Object.keys(updateData)
      });

      return note;
    } catch (error) {
      logger.error('Erro ao atualizar nota', {
        error: error.message,
        noteId: id,
        data
      });
      throw new Error(`Erro ao atualizar nota: ${error.message}`);
    }
  }

  // Deletar uma nota
  async deleteNote(id) {
    try {
      // Verificar se a nota existe
      const existingNote = await prisma.leadNote.findUnique({
        where: { id },
        include: {
          lead: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (!existingNote) {
        logger.warn('Nota não encontrada para exclusão', { noteId: id });
        return null;
      }

      await prisma.leadNote.delete({
        where: { id }
      });

      logger.info('Nota deletada com sucesso', {
        noteId: id,
        leadId: existingNote.leadId,
        leadName: existingNote.lead.name
      });

      return true;
    } catch (error) {
      logger.error('Erro ao deletar nota', {
        error: error.message,
        noteId: id
      });
      throw new Error(`Erro ao deletar nota: ${error.message}`);
    }
  }

  // Buscar estatísticas de notas
  async getNoteStats() {
    try {
      const [
        total,
        important,
        notImportant,
        byCategory,
        privateNotes,
        publicNotes,
        recentNotes
      ] = await Promise.all([
        prisma.leadNote.count(),
        prisma.leadNote.count({ where: { important: true } }),
        prisma.leadNote.count({ where: { important: false } }),
        prisma.leadNote.groupBy({
          by: ['category'],
          _count: { category: true }
        }),
        prisma.leadNote.count({ where: { isPrivate: true } }),
        prisma.leadNote.count({ where: { isPrivate: false } }),
        prisma.leadNote.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Últimos 7 dias
            }
          }
        })
      ]);

      // Buscar notas mais recentes
      const latestNotes = await prisma.leadNote.findMany({
        include: {
          lead: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      });

      const stats = {
        total,
        important,
        notImportant,
        privateNotes,
        publicNotes,
        recentNotes,
        categories: byCategory.map(cat => ({
          category: cat.category || 'Sem categoria',
          count: cat._count.category
        })),
        latest: latestNotes.map(note => ({
          id: note.id,
          content: note.content.length > 100 ?
            note.content.substring(0, 100) + '...' :
            note.content,
          important: note.important,
          leadId: note.leadId,
          leadName: note.lead.name,
          createdAt: note.createdAt
        }))
      };

      logger.info('Estatísticas de notas calculadas', stats);

      return stats;
    } catch (error) {
      logger.error('Erro ao calcular estatísticas de notas', {
        error: error.message
      });
      throw new Error(`Erro ao calcular estatísticas: ${error.message}`);
    }
  }

  // Buscar notas importantes
  async getImportantNotes(filters = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [notes, total] = await Promise.all([
        prisma.leadNote.findMany({
          where: {
            important: true
          },
          include: {
            lead: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                status: true
              }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: parseInt(limit)
        }),
        prisma.leadNote.count({ where: { important: true } })
      ]);

      const totalPages = Math.ceil(total / parseInt(limit));

      logger.info('Notas importantes recuperadas com sucesso', {
        total,
        page: parseInt(page),
        totalPages
      });

      return {
        notes,
        pagination: {
          total,
          page: parseInt(page),
          totalPages,
          limit: parseInt(limit)
        }
      };
    } catch (error) {
      logger.error('Erro ao buscar notas importantes', {
        error: error.message,
        filters
      });
      throw new Error(`Erro ao buscar notas importantes: ${error.message}`);
    }
  }

  // Buscar notas por categoria
  async getNotesByCategory() {
    try {
      const notes = await prisma.leadNote.findMany({
        include: {
          lead: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: [
          { category: 'asc' },
          { createdAt: 'desc' }
        ]
      });

      // Agrupar por categoria
      const groupedNotes = notes.reduce((acc, note) => {
        const category = note.category || 'Sem categoria';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(note);
        return acc;
      }, {});

      logger.info('Notas agrupadas por categoria', {
        categories: Object.keys(groupedNotes).length,
        totalNotes: notes.length
      });

      return groupedNotes;
    } catch (error) {
      logger.error('Erro ao buscar notas por categoria', {
        error: error.message
      });
      throw new Error(`Erro ao buscar notas por categoria: ${error.message}`);
    }
  }
}

module.exports = new NoteService();