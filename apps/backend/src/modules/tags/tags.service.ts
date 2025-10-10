import { PrismaClient, Tag, TagRule } from '@prisma/client';
import {
  CreateTagDTO,
  CreateTagRuleDTO,
  TagFiltersDTO,
  TagResponse,
  TagStats,
  TagRuleResponse,
  TagWithCount,
} from './tags.types';

export class TagsService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Criar nova tag
   */
  async create(data: CreateTagDTO): Promise<TagResponse> {
    // Verificar se já existe tag com mesmo nome (case-insensitive)
    const existing = await this.prisma.tag.findFirst({
      where: {
        name: {
          equals: data.name,
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      throw new Error('Tag com este nome já existe');
    }

    const tag = await this.prisma.tag.create({
      data: {
        name: data.name,
        color: data.color,
        description: data.description,
        isSystem: data.isSystem || false,
      },
    });

    return this.mapToResponse(tag);
  }

  /**
   * Buscar todas as tags com filtros
   */
  async findAll(filters?: TagFiltersDTO): Promise<TagResponse[]> {
    const where: Record<string, unknown> = {};

    if (filters?.search) {
      where.name = {
        contains: filters.search,
        mode: 'insensitive',
      };
    }

    if (filters?.isSystem !== undefined) {
      where.isSystem = filters.isSystem;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const tags = await this.prisma.tag.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { leads: true },
        },
      },
    });

    return tags.map((tag) => this.mapToResponseWithCount(tag));
  }

  /**
   * Buscar tag por ID
   */
  async findById(id: string): Promise<TagResponse | null> {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: { leads: true },
        },
      },
    });

    return tag ? this.mapToResponseWithCount(tag) : null;
  }

  /**
   * Buscar apenas tags do sistema
   */
  async findSystemTags(): Promise<TagResponse[]> {
    const tags = await this.prisma.tag.findMany({
      where: { isSystem: true, isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { leads: true },
        },
      },
    });

    return tags.map((tag) => this.mapToResponseWithCount(tag));
  }

  /**
   * Buscar tags mais populares
   */
  async getPopular(limit: number = 10): Promise<TagResponse[]> {
    const tags = await this.prisma.tag.findMany({
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

    return tags.map((tag) => this.mapToResponseWithCount(tag));
  }

  /**
   * Obter estatísticas de uso de tags
   */
  async getStats(): Promise<TagStats> {
    const [totalTags, systemTags, customTags, activeTags, inactiveTags, popularTags] =
      await Promise.all([
        this.prisma.tag.count(),
        this.prisma.tag.count({ where: { isSystem: true } }),
        this.prisma.tag.count({ where: { isSystem: false } }),
        this.prisma.tag.count({ where: { isActive: true } }),
        this.prisma.tag.count({ where: { isActive: false } }),
        this.prisma.tag.findMany({
          take: 10,
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
        }),
      ]);

    // Obter uso de tags por lead
    const tagsWithLeads = await this.prisma.tag.findMany({
      include: {
        _count: {
          select: { leads: true },
        },
      },
    });

    const tagUsageByLead = Object.fromEntries(
      tagsWithLeads.map((tag) => [tag.name, tag._count.leads])
    );

    const mostUsedTags = popularTags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      count: tag._count.leads,
    }));

    return {
      totalTags,
      systemTags,
      customTags,
      activeTags,
      inactiveTags,
      mostUsedTags,
      tagUsageByLead,
    };
  }

  /**
   * Atualizar tag
   */
  async update(id: string, data: Partial<CreateTagDTO>): Promise<TagResponse> {
    // Verificar se a tag existe
    const tag = await this.prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new Error('Tag não encontrada');
    }

    // Se estiver tentando atualizar o nome, verificar duplicatas
    if (data.name && data.name !== tag.name) {
      const existing = await this.prisma.tag.findFirst({
        where: {
          name: {
            equals: data.name,
            mode: 'insensitive',
          },
          id: {
            not: id,
          },
        },
      });

      if (existing) {
        throw new Error('Tag com este nome já existe');
      }
    }

    const updated = await this.prisma.tag.update({
      where: { id },
      data,
    });

    return this.mapToResponse(updated);
  }

  /**
   * Deletar tag
   */
  async delete(id: string): Promise<void> {
    // Verificar se a tag existe e se é do sistema
    const tag = await this.prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new Error('Tag não encontrada');
    }

    if (tag.isSystem) {
      throw new Error('Tags do sistema não podem ser deletadas');
    }

    // Deletar tag (cascade irá remover as relações LeadTag automaticamente)
    await this.prisma.tag.delete({
      where: { id },
    });
  }

  // ============================================================================
  // REGRAS AUTOMÁTICAS
  // ============================================================================

  /**
   * Criar regra de tag automática
   */
  async createRule(data: CreateTagRuleDTO): Promise<TagRuleResponse> {
    // Verificar se a tag existe
    const tag = await this.prisma.tag.findUnique({
      where: { id: data.tagId },
    });

    if (!tag) {
      throw new Error('Tag não encontrada');
    }

    const rule = await this.prisma.tagRule.create({
      data: {
        tagId: data.tagId,
        condition: JSON.stringify(data.condition.field),
        value: JSON.stringify(data.condition),
        action: 'add_tag',
        isActive: data.isActive,
      },
      include: {
        tag: true,
      },
    });

    return this.mapRuleToResponse(rule);
  }

  /**
   * Buscar todas as regras
   */
  async getRules(): Promise<TagRuleResponse[]> {
    const rules = await this.prisma.tagRule.findMany({
      include: {
        tag: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return rules.map((rule) => this.mapRuleToResponse(rule));
  }

  /**
   * Deletar regra
   */
  async deleteRule(id: string): Promise<void> {
    const rule = await this.prisma.tagRule.findUnique({
      where: { id },
    });

    if (!rule) {
      throw new Error('Regra não encontrada');
    }

    await this.prisma.tagRule.delete({
      where: { id },
    });
  }

  /**
   * Aplicar regras automáticas
   */
  async applyRules(leadId?: string): Promise<number> {
    // Buscar regras ativas
    const rules = await this.prisma.tagRule.findMany({
      where: { isActive: true },
      include: { tag: true },
    });

    if (rules.length === 0) {
      return 0;
    }

    // Buscar leads
    const whereClause = leadId ? { id: leadId } : {};
    const leads = await this.prisma.lead.findMany({
      where: whereClause,
    });

    let appliedCount = 0;

    for (const lead of leads) {
      for (const rule of rules) {
        try {
          const condition = JSON.parse(rule.value) as {
            field: string;
            operator: string;
            value: string;
          };

          const fieldValue = lead[condition.field as keyof typeof lead];

          if (typeof fieldValue === 'string') {
            let matches = false;

            switch (condition.operator) {
              case 'equals':
                matches = fieldValue.toLowerCase() === condition.value.toLowerCase();
                break;
              case 'contains':
                matches = fieldValue
                  .toLowerCase()
                  .includes(condition.value.toLowerCase());
                break;
              case 'startsWith':
                matches = fieldValue
                  .toLowerCase()
                  .startsWith(condition.value.toLowerCase());
                break;
              case 'endsWith':
                matches = fieldValue
                  .toLowerCase()
                  .endsWith(condition.value.toLowerCase());
                break;
            }

            if (matches) {
              // Verificar se o lead já tem essa tag
              const existingTag = await this.prisma.leadTag.findFirst({
                where: {
                  leadId: lead.id,
                  tagId: rule.tagId,
                },
              });

              if (!existingTag) {
                // Verificar limite de tags por lead (máximo 20)
                const leadTagsCount = await this.prisma.leadTag.count({
                  where: { leadId: lead.id },
                });

                if (leadTagsCount < 20) {
                  await this.prisma.leadTag.create({
                    data: {
                      leadId: lead.id,
                      tagId: rule.tagId,
                    },
                  });
                  appliedCount++;
                }
              }
            }
          }
        } catch (error) {
          // Ignorar erros de regras individuais e continuar
          console.error(`Erro ao aplicar regra ${rule.id}:`, error);
        }
      }
    }

    return appliedCount;
  }

  // ============================================================================
  // MÉTODOS AUXILIARES
  // ============================================================================

  private mapToResponse(tag: Tag): TagResponse {
    return {
      id: tag.id,
      name: tag.name,
      color: tag.color,
      description: tag.description,
      isSystem: tag.isSystem,
      isActive: tag.isActive,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    };
  }

  private mapToResponseWithCount(tag: TagWithCount): TagResponse {
    return {
      ...this.mapToResponse(tag),
      _count: {
        leads: tag._count.leads,
      },
    };
  }

  private mapRuleToResponse(
    rule: TagRule & { tag: Tag }
  ): TagRuleResponse {
    let condition: { field: string; operator: string; value: string };

    try {
      condition = JSON.parse(rule.value);
    } catch {
      condition = {
        field: rule.condition,
        operator: 'equals',
        value: rule.value,
      };
    }

    return {
      id: rule.id,
      tagId: rule.tagId,
      condition,
      action: rule.action,
      isActive: rule.isActive,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
      tag: {
        id: rule.tag.id,
        name: rule.tag.name,
        color: rule.tag.color,
      },
    };
  }
}
