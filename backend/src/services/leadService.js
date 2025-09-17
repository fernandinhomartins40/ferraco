const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class LeadService {
  // Criar um novo lead
  async createLead(data) {
    try {
      const lead = await prisma.lead.create({
        data: {
          name: data.name,
          phone: data.phone,
          email: data.email || null,
          status: data.status || 'NOVO',
          source: data.source || 'website',
          priority: data.priority || 'MEDIUM',
          assignedTo: data.assignedTo || null,
          nextFollowUp: data.nextFollowUp ? new Date(data.nextFollowUp) : null,
          leadScore: data.leadScore || null,
          pipelineStage: data.pipelineStage || null
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

  // Buscar todos os leads com filtros
  async getAllLeads(filters = {}) {
    try {
      const {
        status,
        priority,
        source,
        assignedTo,
        search,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = {};

      // Aplicar filtros
      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (source) where.source = source;
      if (assignedTo) where.assignedTo = assignedTo;

      // Busca por nome, email ou telefone
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } }
        ];
      }

      const [leads, total] = await Promise.all([
        prisma.lead.findMany({
          where,
          include: {
            notes: {
              orderBy: { createdAt: 'desc' },
              take: 3
            },
            tags: {
              include: {
                tag: true
              }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: parseInt(limit)
        }),
        prisma.lead.count({ where })
      ]);

      const totalPages = Math.ceil(total / parseInt(limit));

      logger.info('Leads recuperados com sucesso', {
        total,
        page: parseInt(page),
        totalPages,
        filters
      });

      return {
        leads,
        pagination: {
          total,
          page: parseInt(page),
          totalPages,
          limit: parseInt(limit)
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
          },
          communications: {
            orderBy: { createdAt: 'desc' },
            take: 10
          },
          interactions: {
            orderBy: { createdAt: 'desc' },
            take: 5
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
      // Verificar se lead existe
      const existingLead = await prisma.lead.findUnique({
        where: { id }
      });

      if (!existingLead) {
        logger.warn('Lead não encontrado para atualização', { leadId: id });
        return null;
      }

      const updateData = {};

      // Apenas atualizar campos fornecidos
      if (data.name !== undefined) updateData.name = data.name;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.source !== undefined) updateData.source = data.source;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo;
      if (data.nextFollowUp !== undefined) {
        updateData.nextFollowUp = data.nextFollowUp ? new Date(data.nextFollowUp) : null;
      }
      if (data.leadScore !== undefined) updateData.leadScore = data.leadScore;
      if (data.pipelineStage !== undefined) updateData.pipelineStage = data.pipelineStage;

      const lead = await prisma.lead.update({
        where: { id },
        data: updateData,
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
        name: lead.name,
        updatedFields: Object.keys(updateData)
      });

      return lead;
    } catch (error) {
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
      // Verificar se lead existe
      const existingLead = await prisma.lead.findUnique({
        where: { id }
      });

      if (!existingLead) {
        logger.warn('Lead não encontrado para exclusão', { leadId: id });
        return null;
      }

      await prisma.lead.delete({
        where: { id }
      });

      logger.info('Lead deletado com sucesso', {
        leadId: id,
        name: existingLead.name
      });

      return true;
    } catch (error) {
      logger.error('Erro ao deletar lead', {
        error: error.message,
        leadId: id
      });
      throw new Error(`Erro ao deletar lead: ${error.message}`);
    }
  }

  // Buscar estatísticas de leads
  async getLeadStats() {
    try {
      const [
        total,
        novos,
        emAndamento,
        concluidos,
        highPriority,
        mediumPriority,
        lowPriority
      ] = await Promise.all([
        prisma.lead.count(),
        prisma.lead.count({ where: { status: 'NOVO' } }),
        prisma.lead.count({ where: { status: 'EM_ANDAMENTO' } }),
        prisma.lead.count({ where: { status: 'CONCLUIDO' } }),
        prisma.lead.count({ where: { priority: 'HIGH' } }),
        prisma.lead.count({ where: { priority: 'MEDIUM' } }),
        prisma.lead.count({ where: { priority: 'LOW' } })
      ]);

      const stats = {
        total,
        byStatus: {
          novo: novos,
          emAndamento,
          concluido: concluidos
        },
        byPriority: {
          high: highPriority,
          medium: mediumPriority,
          low: lowPriority
        }
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
      // Verificar se lead existe
      const lead = await prisma.lead.findUnique({
        where: { id: leadId }
      });

      if (!lead) {
        logger.warn('Lead não encontrado para adicionar nota', { leadId });
        return null;
      }

      const note = await prisma.leadNote.create({
        data: {
          content,
          important,
          leadId,
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
      logger.error('Erro ao adicionar nota ao lead', {
        error: error.message,
        leadId,
        content
      });
      throw new Error(`Erro ao adicionar nota: ${error.message}`);
    }
  }
}

module.exports = new LeadService();