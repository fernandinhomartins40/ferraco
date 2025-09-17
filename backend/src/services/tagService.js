const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class TagService {
  // Criar uma nova tag
  async createTag(data) {
    try {
      const tag = await prisma.tag.create({
        data: {
          name: data.name,
          color: data.color,
          description: data.description || null,
          isSystem: data.isSystem || false,
          category: data.category || null,
          isActive: data.isActive !== false, // default true
          createdBy: data.createdBy || null
        }
      });

      logger.info('Tag criada com sucesso', {
        tagId: tag.id,
        name: tag.name,
        color: tag.color
      });

      return tag;
    } catch (error) {
      logger.error('Erro ao criar tag', {
        error: error.message,
        data
      });
      throw new Error(`Erro ao criar tag: ${error.message}`);
    }
  }

  // Buscar todas as tags com filtros
  async getAllTags(filters = {}) {
    try {
      const {
        isActive,
        category,
        isSystem,
        search,
        page = 1,
        limit = 50,
        sortBy = 'name',
        sortOrder = 'asc'
      } = filters;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = {};

      // Aplicar filtros
      if (isActive !== undefined) where.isActive = isActive === 'true';
      if (category) where.category = category;
      if (isSystem !== undefined) where.isSystem = isSystem === 'true';

      // Busca por nome ou descrição
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { description: { contains: search } }
        ];
      }

      const [tags, total] = await Promise.all([
        prisma.tag.findMany({
          where,
          include: {
            leads: {
              include: {
                lead: {
                  select: {
                    id: true,
                    name: true,
                    status: true
                  }
                }
              }
            },
            _count: {
              select: {
                leads: true
              }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: parseInt(limit)
        }),
        prisma.tag.count({ where })
      ]);

      const totalPages = Math.ceil(total / parseInt(limit));

      logger.info('Tags recuperadas com sucesso', {
        total,
        page: parseInt(page),
        totalPages,
        filters
      });

      return {
        tags,
        pagination: {
          total,
          page: parseInt(page),
          totalPages,
          limit: parseInt(limit)
        }
      };
    } catch (error) {
      logger.error('Erro ao buscar tags', {
        error: error.message,
        filters
      });
      throw new Error(`Erro ao buscar tags: ${error.message}`);
    }
  }

  // Buscar uma tag por ID
  async getTagById(id) {
    try {
      const tag = await prisma.tag.findUnique({
        where: { id },
        include: {
          leads: {
            include: {
              lead: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  email: true,
                  status: true,
                  priority: true,
                  createdAt: true
                }
              }
            }
          },
          rules: true,
          _count: {
            select: {
              leads: true
            }
          }
        }
      });

      if (!tag) {
        logger.warn('Tag não encontrada', { tagId: id });
        return null;
      }

      logger.info('Tag recuperada com sucesso', {
        tagId: tag.id,
        name: tag.name
      });

      return tag;
    } catch (error) {
      logger.error('Erro ao buscar tag por ID', {
        error: error.message,
        tagId: id
      });
      throw new Error(`Erro ao buscar tag: ${error.message}`);
    }
  }

  // Atualizar uma tag
  async updateTag(id, data) {
    try {
      // Verificar se tag existe
      const existingTag = await prisma.tag.findUnique({
        where: { id }
      });

      if (!existingTag) {
        logger.warn('Tag não encontrada para atualização', { tagId: id });
        return null;
      }

      // Não permitir atualização de tags do sistema
      if (existingTag.isSystem && data.name && data.name !== existingTag.name) {
        throw new Error('Não é possível alterar o nome de tags do sistema');
      }

      const updateData = {};

      // Apenas atualizar campos fornecidos
      if (data.name !== undefined) updateData.name = data.name;
      if (data.color !== undefined) updateData.color = data.color;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      const tag = await prisma.tag.update({
        where: { id },
        data: updateData,
        include: {
          _count: {
            select: {
              leads: true
            }
          }
        }
      });

      logger.info('Tag atualizada com sucesso', {
        tagId: tag.id,
        name: tag.name,
        updatedFields: Object.keys(updateData)
      });

      return tag;
    } catch (error) {
      logger.error('Erro ao atualizar tag', {
        error: error.message,
        tagId: id,
        data
      });
      throw new Error(`Erro ao atualizar tag: ${error.message}`);
    }
  }

  // Deletar uma tag
  async deleteTag(id) {
    try {
      // Verificar se tag existe
      const existingTag = await prisma.tag.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              leads: true
            }
          }
        }
      });

      if (!existingTag) {
        logger.warn('Tag não encontrada para exclusão', { tagId: id });
        return null;
      }

      // Não permitir deletar tags do sistema
      if (existingTag.isSystem) {
        throw new Error('Não é possível deletar tags do sistema');
      }

      // Verificar se tag tem leads associados
      if (existingTag._count.leads > 0) {
        throw new Error(`Não é possível deletar tag com ${existingTag._count.leads} leads associados`);
      }

      await prisma.tag.delete({
        where: { id }
      });

      logger.info('Tag deletada com sucesso', {
        tagId: id,
        name: existingTag.name
      });

      return true;
    } catch (error) {
      logger.error('Erro ao deletar tag', {
        error: error.message,
        tagId: id
      });
      throw new Error(`Erro ao deletar tag: ${error.message}`);
    }
  }

  // Buscar estatísticas de tags
  async getTagStats() {
    try {
      const [
        total,
        active,
        inactive,
        systemTags,
        customTags,
        tagsWithLeads
      ] = await Promise.all([
        prisma.tag.count(),
        prisma.tag.count({ where: { isActive: true } }),
        prisma.tag.count({ where: { isActive: false } }),
        prisma.tag.count({ where: { isSystem: true } }),
        prisma.tag.count({ where: { isSystem: false } }),
        prisma.tag.count({
          where: {
            leads: {
              some: {}
            }
          }
        })
      ]);

      // Buscar tags mais utilizadas
      const mostUsedTags = await prisma.tag.findMany({
        include: {
          _count: {
            select: {
              leads: true
            }
          }
        },
        orderBy: {
          leads: {
            _count: 'desc'
          }
        },
        take: 10
      });

      const stats = {
        total,
        active,
        inactive,
        systemTags,
        customTags,
        tagsWithLeads,
        mostUsed: mostUsedTags.map(tag => ({
          id: tag.id,
          name: tag.name,
          color: tag.color,
          leadsCount: tag._count.leads
        }))
      };

      logger.info('Estatísticas de tags calculadas', stats);

      return stats;
    } catch (error) {
      logger.error('Erro ao calcular estatísticas de tags', {
        error: error.message
      });
      throw new Error(`Erro ao calcular estatísticas: ${error.message}`);
    }
  }

  // Associar tag a um lead
  async addTagToLead(leadId, tagId, addedBy = null) {
    try {
      // Verificar se lead e tag existem
      const [lead, tag] = await Promise.all([
        prisma.lead.findUnique({ where: { id: leadId } }),
        prisma.tag.findUnique({ where: { id: tagId } })
      ]);

      if (!lead) {
        logger.warn('Lead não encontrado para associar tag', { leadId });
        return null;
      }

      if (!tag) {
        logger.warn('Tag não encontrada para associar ao lead', { tagId });
        return null;
      }

      // Verificar se associação já existe
      const existingAssociation = await prisma.leadTag.findUnique({
        where: {
          leadId_tagId: {
            leadId,
            tagId
          }
        }
      });

      if (existingAssociation) {
        logger.warn('Tag já associada ao lead', { leadId, tagId });
        return existingAssociation;
      }

      const leadTag = await prisma.leadTag.create({
        data: {
          leadId,
          tagId,
          addedBy
        },
        include: {
          tag: true,
          lead: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      logger.info('Tag associada ao lead com sucesso', {
        leadId,
        tagId,
        tagName: tag.name,
        leadName: lead.name
      });

      return leadTag;
    } catch (error) {
      logger.error('Erro ao associar tag ao lead', {
        error: error.message,
        leadId,
        tagId
      });
      throw new Error(`Erro ao associar tag: ${error.message}`);
    }
  }

  // Remover tag de um lead
  async removeTagFromLead(leadId, tagId) {
    try {
      // Verificar se associação existe
      const existingAssociation = await prisma.leadTag.findUnique({
        where: {
          leadId_tagId: {
            leadId,
            tagId
          }
        },
        include: {
          tag: true,
          lead: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (!existingAssociation) {
        logger.warn('Associação não encontrada', { leadId, tagId });
        return null;
      }

      await prisma.leadTag.delete({
        where: {
          leadId_tagId: {
            leadId,
            tagId
          }
        }
      });

      logger.info('Tag removida do lead com sucesso', {
        leadId,
        tagId,
        tagName: existingAssociation.tag.name,
        leadName: existingAssociation.lead.name
      });

      return true;
    } catch (error) {
      logger.error('Erro ao remover tag do lead', {
        error: error.message,
        leadId,
        tagId
      });
      throw new Error(`Erro ao remover tag: ${error.message}`);
    }
  }

  // Buscar tags por categoria
  async getTagsByCategory() {
    try {
      const tags = await prisma.tag.findMany({
        where: {
          isActive: true
        },
        include: {
          _count: {
            select: {
              leads: true
            }
          }
        },
        orderBy: [
          { category: 'asc' },
          { name: 'asc' }
        ]
      });

      // Agrupar por categoria
      const groupedTags = tags.reduce((acc, tag) => {
        const category = tag.category || 'Sem categoria';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(tag);
        return acc;
      }, {});

      logger.info('Tags agrupadas por categoria', {
        categories: Object.keys(groupedTags).length,
        totalTags: tags.length
      });

      return groupedTags;
    } catch (error) {
      logger.error('Erro ao buscar tags por categoria', {
        error: error.message
      });
      throw new Error(`Erro ao buscar tags por categoria: ${error.message}`);
    }
  }
}

module.exports = new TagService();