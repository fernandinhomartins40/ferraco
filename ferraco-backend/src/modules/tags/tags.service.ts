import prisma from '../../config/database';
import { PAGINATION } from '../../config/constants';
import { AppError } from '../../middleware/errorHandler';

export class TagsService {
  /**
   * Listar tags
   */
  async getTags(filters: {
    isActive?: boolean;
    isSystem?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      isActive,
      isSystem,
      search,
      page = PAGINATION.defaultPage,
      limit = PAGINATION.defaultLimit,
    } = filters;

    const where: any = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (isSystem !== undefined) {
      where.isSystem = isSystem;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [tags, total] = await Promise.all([
      prisma.tag.findMany({
        where,
        include: {
          _count: {
            select: { leads: true },
          },
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * Math.min(limit, PAGINATION.maxLimit),
        take: Math.min(limit, PAGINATION.maxLimit),
      }),
      prisma.tag.count({ where }),
    ]);

    return {
      data: tags,
      pagination: {
        page,
        limit: Math.min(limit, PAGINATION.maxLimit),
        total,
        totalPages: Math.ceil(total / Math.min(limit, PAGINATION.maxLimit)),
      },
    };
  }

  /**
   * Obter tag por ID
   */
  async getTagById(id: string) {
    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: { leads: true },
        },
        rules: true,
      },
    });

    if (!tag) {
      throw new AppError(404, 'Tag não encontrada');
    }

    return tag;
  }

  /**
   * Criar tag
   */
  async createTag(data: {
    name: string;
    color: string;
    description?: string;
  }) {
    // Verificar se já existe tag com esse nome
    const existingTag = await prisma.tag.findUnique({
      where: { name: data.name },
    });

    if (existingTag) {
      throw new AppError(409, 'Já existe uma tag com este nome');
    }

    const tag = await prisma.tag.create({
      data: {
        name: data.name,
        color: data.color,
        description: data.description,
        isSystem: false,
        isActive: true,
      },
    });

    return tag;
  }

  /**
   * Atualizar tag
   */
  async updateTag(
    id: string,
    data: Partial<{
      name: string;
      color: string;
      description: string;
      isActive: boolean;
    }>
  ) {
    const tag = await prisma.tag.findUnique({ where: { id } });
    if (!tag) {
      throw new AppError(404, 'Tag não encontrada');
    }

    // Tags do sistema não podem ter o nome alterado
    if (tag.isSystem && data.name && data.name !== tag.name) {
      throw new AppError(400, 'Não é possível alterar o nome de tags do sistema');
    }

    // Verificar nome duplicado
    if (data.name && data.name !== tag.name) {
      const existingTag = await prisma.tag.findUnique({
        where: { name: data.name },
      });
      if (existingTag) {
        throw new AppError(409, 'Já existe uma tag com este nome');
      }
    }

    const updatedTag = await prisma.tag.update({
      where: { id },
      data,
    });

    return updatedTag;
  }

  /**
   * Deletar tag
   */
  async deleteTag(id: string) {
    const tag = await prisma.tag.findUnique({ where: { id } });
    if (!tag) {
      throw new AppError(404, 'Tag não encontrada');
    }

    // Tags do sistema não podem ser deletadas
    if (tag.isSystem) {
      throw new AppError(400, 'Não é possível deletar tags do sistema');
    }

    await prisma.tag.delete({ where: { id } });

    return { message: 'Tag deletada com sucesso' };
  }

  /**
   * Ativar/desativar tag
   */
  async toggleTagStatus(id: string) {
    const tag = await prisma.tag.findUnique({ where: { id } });
    if (!tag) {
      throw new AppError(404, 'Tag não encontrada');
    }

    const updatedTag = await prisma.tag.update({
      where: { id },
      data: { isActive: !tag.isActive },
    });

    return updatedTag;
  }

  /**
   * Obter estatísticas de tags
   */
  async getTagStats() {
    const [total, active, system, withRules] = await Promise.all([
      prisma.tag.count(),
      prisma.tag.count({ where: { isActive: true } }),
      prisma.tag.count({ where: { isSystem: true } }),
      prisma.tag.count({
        where: {
          rules: {
            some: {},
          },
        },
      }),
    ]);

    return {
      total,
      active,
      system,
      withRules,
    };
  }

  /**
   * Obter tags mais usadas
   */
  async getPopularTags(limit = 10) {
    const tags = await prisma.tag.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { leads: true },
        },
      },
      orderBy: {
        leads: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    return tags;
  }

  /**
   * Obter cores predefinidas
   */
  getPredefinedColors() {
    return [
      '#FF0000', // Vermelho
      '#00FF00', // Verde
      '#0000FF', // Azul
      '#FFD700', // Dourado
      '#FFA500', // Laranja
      '#800080', // Roxo
      '#FF1493', // Rosa
      '#00CED1', // Turquesa
      '#FF6347', // Tomate
      '#4B0082', // Índigo
      '#32CD32', // Verde Limão
      '#FF69B4', // Rosa Claro
    ];
  }

  /**
   * Obter regras de tags
   */
  async getTagRules() {
    const rules = await prisma.tagRule.findMany({
      include: {
        tag: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return rules;
  }

  /**
   * Criar/atualizar regra de tag
   */
  async createTagRule(
    tagId: string,
    data: {
      condition: string;
      value: string;
      action: string;
    }
  ) {
    const tag = await prisma.tag.findUnique({ where: { id: tagId } });
    if (!tag) {
      throw new AppError(404, 'Tag não encontrada');
    }

    const rule = await prisma.tagRule.create({
      data: {
        tagId,
        condition: data.condition,
        value: data.value,
        action: data.action,
        isActive: true,
      },
      include: {
        tag: true,
      },
    });

    return rule;
  }

  /**
   * Aplicar tags automáticas a um lead
   */
  async applyAutomaticTags(leadId: string) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      throw new AppError(404, 'Lead não encontrado');
    }

    // Buscar regras ativas
    const rules = await prisma.tagRule.findMany({
      where: { isActive: true },
      include: { tag: true },
    });

    const tagsToApply: string[] = [];

    // Aplicar regras baseadas em condições
    for (const rule of rules) {
      let shouldApply = false;

      switch (rule.condition) {
        case 'status_change':
          shouldApply = lead.status === rule.value;
          break;
        case 'source':
          shouldApply = lead.source === rule.value;
          break;
        // Adicionar mais condições conforme necessário
      }

      if (shouldApply && rule.action === 'add_tag') {
        tagsToApply.push(rule.tagId);
      }
    }

    // Aplicar tags ao lead
    for (const tagId of tagsToApply) {
      await prisma.leadTag.upsert({
        where: {
          leadId_tagId: {
            leadId,
            tagId,
          },
        },
        update: {},
        create: {
          leadId,
          tagId,
        },
      });
    }

    return { appliedTags: tagsToApply.length };
  }
}
