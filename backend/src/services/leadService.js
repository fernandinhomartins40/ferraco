const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class LeadService {
  // Criar um novo lead (simplificado)
  async createLead(data) {
    try {
      const lead = await prisma.lead.create({
        data: {
          name: data.name,
          phone: data.phone,
          email: data.email || null,
          status: data.status || 'NOVO',
          source: data.source || 'website',
        },
        include: {
          notes: true,
          tags: {
            include: {
              tag: true
            }
          }
        }
      });

      logger.info('Lead criado com sucesso', {
        leadId: lead.id,
        name: lead.name,
        phone: lead.phone
      });

      return lead;
    } catch (error) {
      logger.error('Erro ao criar lead', {
        error: error.message,
        data
      });
      throw new Error(`Erro ao criar lead: ${error.message}`);
    }
  }

  // Buscar todos os leads com filtros básicos
  async getAllLeads(filters = {}) {
    try {
      const {
        status,
        search,
        tags,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      // Construir where clause
      const where = {};

      if (status && status !== 'todos') {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
          { email: { contains: search, mode: 'insensitive' } }
        ];
      }

      if (tags && tags.length > 0) {
        where.tags = {
          some: {
            tag: {
              name: { in: tags }
            }
          }
        };
      }

      // Buscar com paginação
      const [leads, total] = await Promise.all([
        prisma.lead.findMany({
          where,
          include: {
            notes: true,
            tags: {
              include: {
                tag: true
              }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip: (page - 1) * limit,
          take: parseInt(limit)
        }),
        prisma.lead.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.info('Leads recuperados com sucesso', {
        count: leads.length,
        total,
        page,
        totalPages,
        filters
      });

      return {
        leads,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages
        }
      };
    } catch (error) {
      logger.error('Erro ao buscar leads', {
        error: error.message,
        filters
      });
      throw new Error(`Erro ao buscar leads: ${error.message}`);
    }
  }

  // Buscar um lead por ID
  async getLeadById(id) {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id },
        include: {
          notes: {
            orderBy: { createdAt: 'desc' }
          },
          tags: {
            include: {
              tag: true
            }
          }
        }
      });

      if (!lead) {
        logger.warn('Lead não encontrado', { leadId: id });
        return null;
      }

      logger.info('Lead recuperado com sucesso', {
        leadId: lead.id,
        name: lead.name
      });

      return lead;
    } catch (error) {
      logger.error('Erro ao buscar lead por ID', {
        error: error.message,
        leadId: id
      });
      throw new Error(`Erro ao buscar lead: ${error.message}`);
    }
  }

  // Atualizar um lead
  async updateLead(id, data) {
    try {
      const lead = await prisma.lead.update({
        where: { id },
        data: {
          name: data.name,
          phone: data.phone,
          email: data.email,
          status: data.status,
          source: data.source,
        },
        include: {
          notes: true,
          tags: {
            include: {
              tag: true
            }
          }
        }
      });

      logger.info('Lead atualizado com sucesso', {
        leadId: lead.id,
        name: lead.name
      });

      return lead;
    } catch (error) {
      if (error.code === 'P2025') {
        logger.warn('Lead não encontrado para atualização', { leadId: id });
        return null;
      }

      logger.error('Erro ao atualizar lead', {
        error: error.message,
        leadId: id,
        data
      });
      throw new Error(`Erro ao atualizar lead: ${error.message}`);
    }
  }

  // Deletar um lead
  async deleteLead(id) {
    try {
      await prisma.lead.delete({
        where: { id }
      });

      logger.info('Lead deletado com sucesso', { leadId: id });
      return true;
    } catch (error) {
      if (error.code === 'P2025') {
        logger.warn('Lead não encontrado para deleção', { leadId: id });
        return false;
      }

      logger.error('Erro ao deletar lead', {
        error: error.message,
        leadId: id
      });
      throw new Error(`Erro ao deletar lead: ${error.message}`);
    }
  }

  // Buscar estatísticas básicas de leads
  async getLeadStats() {
    try {
      const [total, byStatus] = await Promise.all([
        prisma.lead.count(),
        prisma.lead.groupBy({
          by: ['status'],
          _count: true
        })
      ]);

      const stats = {
        total,
        byStatus: byStatus.reduce((acc, stat) => {
          acc[stat.status] = stat._count;
          return acc;
        }, {}),
        conversionRate: total > 0 ? ((byStatus.find(s => s.status === 'CONCLUIDO')?._count || 0) / total) * 100 : 0
      };

      logger.info('Estatísticas de leads calculadas', stats);
      return stats;
    } catch (error) {
      logger.error('Erro ao calcular estatísticas de leads', {
        error: error.message
      });
      throw new Error(`Erro ao calcular estatísticas: ${error.message}`);
    }
  }

  // Adicionar nota a um lead
  async addNote(leadId, content, important = false, createdBy = null) {
    try {
      const note = await prisma.leadNote.create({
        data: {
          leadId,
          content,
          important,
          createdBy
        }
      });

      logger.info('Nota adicionada ao lead', {
        leadId,
        noteId: note.id,
        important
      });

      return note;
    } catch (error) {
      if (error.code === 'P2003') {
        logger.warn('Lead não encontrado para adicionar nota', { leadId });
        return null;
      }

      logger.error('Erro ao adicionar nota', {
        error: error.message,
        leadId,
        content
      });
      throw new Error(`Erro ao adicionar nota: ${error.message}`);
    }
  }
}

module.exports = new LeadService();