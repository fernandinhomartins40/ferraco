/**
 * Template Library Service
 */

import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import { templateProcessorService } from '../../services/templateProcessor.service';
import type {
  CreateTemplateDto,
  UpdateTemplateDto,
  TemplateFilters,
  TemplateStats,
  TemplatePreviewResponse,
} from './template-library.types';

export class TemplateLibraryService {
  /**
   * Listar templates com filtros
   */
  async list(filters: TemplateFilters = {}) {
    const where: any = {};

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.isSystem !== undefined) {
      where.isSystem = filters.isSystem;
    }

    if (filters.isFavorite !== undefined) {
      where.isFavorite = filters.isFavorite;
    }

    if (filters.triggerType) {
      where.triggerType = filters.triggerType;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const templates = await prisma.messageTemplateLibrary.findMany({
      where,
      orderBy: [
        { isFavorite: 'desc' },
        { priority: 'desc' },
        { usageCount: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    logger.info(`✅ Listados ${templates.length} templates (filtros: ${JSON.stringify(filters)})`);
    return templates;
  }

  /**
   * Buscar template por ID
   */
  async getById(id: string) {
    const template = await prisma.messageTemplateLibrary.findUnique({
      where: { id },
    });

    if (!template) {
      throw new Error('Template não encontrado');
    }

    return template;
  }

  /**
   * Criar novo template
   */
  async create(data: CreateTemplateDto) {
    // Validar template antes de criar
    const validation = templateProcessorService.validateTemplate(data.content);
    if (!validation.isValid) {
      throw new Error(`Template inválido: ${validation.errors.join(', ')}`);
    }

    // Obter variáveis disponíveis
    const availableVariables = templateProcessorService.getAvailableVariablesAsJSON();

    const template = await prisma.messageTemplateLibrary.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        content: data.content,
        mediaUrls: data.mediaUrls ? JSON.stringify(data.mediaUrls) : null,
        mediaType: data.mediaType,
        availableVariables,
        triggerType: data.triggerType,
        minCaptures: data.minCaptures,
        maxCaptures: data.maxCaptures,
        daysSinceCapture: data.daysSinceCapture,
        triggerConditions: data.triggerConditions ? JSON.stringify(data.triggerConditions) : '{}',
        priority: data.priority || 0,
      },
    });

    logger.info(`✅ Template criado: ${template.name} (${template.id})`);
    return template;
  }

  /**
   * Atualizar template
   */
  async update(id: string, data: UpdateTemplateDto) {
    // Verificar se template existe
    const existing = await this.getById(id);

    // Se está atualizando conteúdo, validar
    if (data.content) {
      const validation = templateProcessorService.validateTemplate(data.content);
      if (!validation.isValid) {
        throw new Error(`Template inválido: ${validation.errors.join(', ')}`);
      }
    }

    // Não permitir editar templates do sistema (exceto isActive e isFavorite)
    if (existing.isSystem) {
      const allowedFields = ['isActive', 'isFavorite'];
      const hasInvalidFields = Object.keys(data).some(key => !allowedFields.includes(key));

      if (hasInvalidFields) {
        throw new Error('Templates do sistema só podem ter isActive e isFavorite modificados');
      }
    }

    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.mediaUrls !== undefined) updateData.mediaUrls = JSON.stringify(data.mediaUrls);
    if (data.mediaType !== undefined) updateData.mediaType = data.mediaType;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;
    if (data.triggerType !== undefined) updateData.triggerType = data.triggerType;
    if (data.minCaptures !== undefined) updateData.minCaptures = data.minCaptures;
    if (data.maxCaptures !== undefined) updateData.maxCaptures = data.maxCaptures;
    if (data.daysSinceCapture !== undefined) updateData.daysSinceCapture = data.daysSinceCapture;
    if (data.triggerConditions !== undefined) updateData.triggerConditions = JSON.stringify(data.triggerConditions);
    if (data.priority !== undefined) updateData.priority = data.priority;

    const template = await prisma.messageTemplateLibrary.update({
      where: { id },
      data: updateData,
    });

    logger.info(`✅ Template atualizado: ${template.name} (${template.id})`);
    return template;
  }

  /**
   * Deletar template (soft delete)
   */
  async delete(id: string) {
    const existing = await this.getById(id);

    // Não permitir deletar templates do sistema
    if (existing.isSystem) {
      throw new Error('Templates do sistema não podem ser deletados');
    }

    // Verificar se está sendo usado em colunas
    const usedInColumns = await prisma.automationKanbanColumn.count({
      where: {
        templateLibraryId: id,
        isActive: true,
      },
    });

    if (usedInColumns > 0) {
      throw new Error(`Template está sendo usado em ${usedInColumns} coluna(s) de automação`);
    }

    // Soft delete
    await prisma.messageTemplateLibrary.update({
      where: { id },
      data: { isActive: false },
    });

    logger.info(`✅ Template deletado (soft): ${existing.name} (${id})`);
  }

  /**
   * Duplicar template
   */
  async duplicate(id: string) {
    const original = await this.getById(id);

    const duplicate = await prisma.messageTemplateLibrary.create({
      data: {
        name: `${original.name} (Cópia)`,
        description: original.description,
        category: original.category,
        content: original.content,
        mediaUrls: original.mediaUrls,
        mediaType: original.mediaType,
        availableVariables: original.availableVariables,
        isSystem: false, // Cópias nunca são do sistema
        triggerType: original.triggerType,
        minCaptures: original.minCaptures,
        maxCaptures: original.maxCaptures,
        daysSinceCapture: original.daysSinceCapture,
        triggerConditions: original.triggerConditions,
        priority: original.priority,
      },
    });

    logger.info(`✅ Template duplicado: ${original.name} → ${duplicate.name}`);
    return duplicate;
  }

  /**
   * Gerar preview do template
   */
  async generatePreview(templateId?: string, content?: string): Promise<TemplatePreviewResponse> {
    let templateContent = content;

    if (templateId) {
      const template = await this.getById(templateId);
      templateContent = template.content;
    }

    if (!templateContent) {
      throw new Error('Template content é obrigatório');
    }

    const validation = templateProcessorService.validateTemplate(templateContent);
    const processed = templateProcessorService.generatePreview(templateContent);
    const variables = templateProcessorService.extractVariables(templateContent);

    return {
      original: templateContent,
      processed,
      variables,
      validation: {
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings,
      },
    };
  }

  /**
   * Incrementar contador de uso
   */
  async incrementUsageCount(id: string) {
    await prisma.messageTemplateLibrary.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });
  }

  /**
   * Obter estatísticas
   */
  async getStats(): Promise<TemplateStats> {
    const templates = await prisma.messageTemplateLibrary.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        isActive: true,
        isSystem: true,
        isFavorite: true,
        usageCount: true,
      },
    });

    const byCategory: any = {
      AUTOMATION: 0,
      RECURRENCE: 0,
      GENERIC: 0,
      CUSTOM: 0,
      SYSTEM: 0,
    };

    templates.forEach(t => {
      byCategory[t.category] = (byCategory[t.category] || 0) + 1;
    });

    const mostUsed = templates
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10)
      .map(t => ({
        id: t.id,
        name: t.name,
        usageCount: t.usageCount,
      }));

    return {
      total: templates.length,
      byCategory,
      active: templates.filter(t => t.isActive).length,
      inactive: templates.filter(t => !t.isActive).length,
      system: templates.filter(t => t.isSystem).length,
      custom: templates.filter(t => !t.isSystem).length,
      favorites: templates.filter(t => t.isFavorite).length,
      mostUsed,
    };
  }

  /**
   * Obter variáveis disponíveis
   */
  getAvailableVariables() {
    return templateProcessorService.getAvailableVariablesByCategory();
  }
}

export const templateLibraryService = new TemplateLibraryService();
