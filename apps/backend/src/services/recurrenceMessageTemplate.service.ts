/**
 * Recurrence Message Template Service
 *
 * Gerencia templates de mensagens para leads recorrentes.
 * Seleciona a mensagem mais apropriada baseada em:
 * - Número de capturas
 * - Dias desde última captura
 * - Mudança de interesse
 * - Score do lead
 */

import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import type { RecurrenceResult } from './leadRecurrence.service';

export interface TemplateMatch {
  template: any;
  matchScore: number; // 0-100, quanto maior melhor o match
  reason: string;
}

export class RecurrenceMessageTemplateService {
  /**
   * Seleciona melhor template para um lead recorrente
   */
  async selectBestTemplate(
    recurrenceData: RecurrenceResult,
    leadScore: number
  ): Promise<TemplateMatch | null> {
    try {
      const { captureNumber, daysSinceLastCapture, interestChanged, previousInterests } = recurrenceData;

      // Buscar todos os templates ativos
      const templates = await prisma.recurrenceMessageTemplate.findMany({
        where: { isActive: true },
        orderBy: { priority: 'desc' },
      });

      if (templates.length === 0) {
        logger.warn('⚠️ Nenhum template de recorrência ativo encontrado');
        return null;
      }

      // Calcular score de match para cada template
      const matches: TemplateMatch[] = [];

      for (const template of templates) {
        const matchScore = this.calculateMatchScore(
          template,
          captureNumber,
          daysSinceLastCapture,
          interestChanged,
          leadScore
        );

        if (matchScore > 0) {
          matches.push({
            template,
            matchScore,
            reason: this.explainMatch(template, captureNumber, interestChanged),
          });
        }
      }

      // Ordenar por score de match (maior primeiro)
      matches.sort((a, b) => {
        // Priorizar: matchScore > priority do template
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore;
        }
        return b.template.priority - a.template.priority;
      });

      const bestMatch = matches[0] || null;

      if (bestMatch) {
        logger.info(
          `✅ Template selecionado: "${bestMatch.template.name}" ` +
          `(match: ${bestMatch.matchScore}%, motivo: ${bestMatch.reason})`
        );

        // Incrementar contador de uso
        await this.incrementUsageCount(bestMatch.template.id);
      } else {
        logger.warn('⚠️ Nenhum template adequado encontrado para este lead recorrente');
      }

      return bestMatch;
    } catch (error) {
      logger.error('❌ Erro ao selecionar template de recorrência:', error);
      return null;
    }
  }

  /**
   * Calcula score de match (0-100)
   */
  private calculateMatchScore(
    template: any,
    captureNumber: number,
    daysSinceLastCapture: number | null,
    interestChanged: boolean,
    leadScore: number
  ): number {
    let score = 0;

    // Parse condições do template
    const conditions = JSON.parse(template.conditions || '{}');

    // 1. Verificar minCaptures (obrigatório)
    if (captureNumber < template.minCaptures) {
      return 0; // Não elegível
    }

    // 2. Verificar maxCaptures (se definido)
    if (template.maxCaptures && captureNumber > template.maxCaptures) {
      return 0; // Não elegível
    }

    // 3. Score base: match perfeito de captureNumber
    if (captureNumber === template.minCaptures) {
      score += 40; // Match exato
    } else {
      score += 20; // Elegível mas não exato
    }

    // 4. Verificar daysSinceLastCapture
    if (template.daysSinceLastCapture && daysSinceLastCapture !== null) {
      const daysDiff = Math.abs(daysSinceLastCapture - template.daysSinceLastCapture);

      if (daysDiff === 0) {
        score += 30; // Match perfeito
      } else if (daysDiff <= 7) {
        score += 20; // Próximo
      } else if (daysDiff <= 30) {
        score += 10; // Razoável
      }
    } else if (!template.daysSinceLastCapture) {
      score += 15; // Template não requer dias específicos
    }

    // 5. Verificar condição de mudança de interesse
    if (conditions.sameInterest !== undefined) {
      if (conditions.sameInterest === !interestChanged) {
        score += 20; // Match de condição de interesse
      } else {
        score -= 10; // Condição não atendida
      }
    }

    // 6. Verificar score mínimo do lead
    if (conditions.minScore !== undefined) {
      if (leadScore >= conditions.minScore) {
        score += 10; // Lead atende score mínimo
      } else {
        return 0; // Não elegível
      }
    }

    // Garantir que score está entre 0-100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Explica porque o template foi escolhido
   */
  private explainMatch(template: any, captureNumber: number, interestChanged: boolean): string {
    const reasons: string[] = [];

    if (captureNumber === template.minCaptures) {
      reasons.push(`captura #${captureNumber}`);
    }

    if (interestChanged) {
      reasons.push('interesse mudou');
    } else {
      reasons.push('mesmo interesse');
    }

    const conditions = JSON.parse(template.conditions || '{}');
    if (conditions.minScore) {
      reasons.push(`score >= ${conditions.minScore}`);
    }

    return reasons.join(', ');
  }

  /**
   * Incrementa contador de uso do template
   */
  private async incrementUsageCount(templateId: string) {
    await prisma.recurrenceMessageTemplate.update({
      where: { id: templateId },
      data: { usageCount: { increment: 1 } },
    });
  }

  /**
   * Processa template substituindo variáveis
   */
  processTemplate(
    template: string,
    data: {
      lead: any;
      captureNumber: number;
      daysSinceLastCapture: number | null;
      previousInterests: string[];
      currentInterest: string[];
    }
  ): string {
    let processed = template;

    // Substituir variáveis do lead
    processed = processed.replace(/\{\{lead\.name\}\}/g, data.lead.name || '');
    processed = processed.replace(/\{\{lead\.phone\}\}/g, data.lead.phone || '');
    processed = processed.replace(/\{\{lead\.email\}\}/g, data.lead.email || '');

    // Substituir captureNumber
    processed = processed.replace(/\{\{captureNumber\}\}/g, data.captureNumber.toString());

    // Substituir daysSinceLastCapture
    if (data.daysSinceLastCapture !== null) {
      processed = processed.replace(/\{\{daysSinceLastCapture\}\}/g, data.daysSinceLastCapture.toString());
    }

    // Substituir previousInterests
    const previousInterestsStr = data.previousInterests.join(', ') || 'nossos produtos';
    processed = processed.replace(/\{\{previousInterests\}\}/g, previousInterestsStr);

    // Substituir currentInterest
    const currentInterestStr = data.currentInterest.join(', ') || 'nossos produtos';
    processed = processed.replace(/\{\{currentInterest\}\}/g, currentInterestStr);

    return processed;
  }

  /**
   * CRUD - Criar template
   */
  async create(data: {
    name: string;
    description?: string;
    trigger: string;
    minCaptures: number;
    maxCaptures?: number;
    daysSinceLastCapture?: number;
    conditions?: Record<string, any>;
    content: string;
    mediaUrls?: string[];
    mediaType?: string;
    priority?: number;
  }) {
    return await prisma.recurrenceMessageTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        trigger: data.trigger,
        minCaptures: data.minCaptures,
        maxCaptures: data.maxCaptures,
        daysSinceLastCapture: data.daysSinceLastCapture,
        conditions: JSON.stringify(data.conditions || {}),
        content: data.content,
        mediaUrls: data.mediaUrls ? JSON.stringify(data.mediaUrls) : null,
        mediaType: data.mediaType,
        priority: data.priority || 0,
      },
    });
  }

  /**
   * CRUD - Listar templates
   */
  async list(filters?: { isActive?: boolean; trigger?: string }) {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.trigger) {
      where.trigger = filters.trigger;
    }

    return await prisma.recurrenceMessageTemplate.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * CRUD - Buscar por ID
   */
  async getById(id: string) {
    return await prisma.recurrenceMessageTemplate.findUnique({
      where: { id },
    });
  }

  /**
   * CRUD - Atualizar template
   */
  async update(id: string, data: Partial<{
    name: string;
    description: string;
    trigger: string;
    minCaptures: number;
    maxCaptures: number;
    daysSinceLastCapture: number;
    conditions: Record<string, any>;
    content: string;
    mediaUrls: string[];
    mediaType: string;
    priority: number;
    isActive: boolean;
  }>) {
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.trigger !== undefined) updateData.trigger = data.trigger;
    if (data.minCaptures !== undefined) updateData.minCaptures = data.minCaptures;
    if (data.maxCaptures !== undefined) updateData.maxCaptures = data.maxCaptures;
    if (data.daysSinceLastCapture !== undefined) updateData.daysSinceLastCapture = data.daysSinceLastCapture;
    if (data.conditions !== undefined) updateData.conditions = JSON.stringify(data.conditions);
    if (data.content !== undefined) updateData.content = data.content;
    if (data.mediaUrls !== undefined) updateData.mediaUrls = JSON.stringify(data.mediaUrls);
    if (data.mediaType !== undefined) updateData.mediaType = data.mediaType;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return await prisma.recurrenceMessageTemplate.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * CRUD - Deletar template
   */
  async delete(id: string) {
    return await prisma.recurrenceMessageTemplate.delete({
      where: { id },
    });
  }

  /**
   * Obter estatísticas de uso dos templates
   */
  async getUsageStats() {
    const templates = await prisma.recurrenceMessageTemplate.findMany({
      select: {
        id: true,
        name: true,
        trigger: true,
        content: true, // ADICIONADO para preview
        usageCount: true,
        isActive: true,
      },
      orderBy: { usageCount: 'desc' },
    });

    const totalUsage = templates.reduce((sum, t) => sum + t.usageCount, 0);

    return {
      templates: templates.map((t) => ({
        ...t,
        usagePercentage: totalUsage > 0 ? (t.usageCount / totalUsage) * 100 : 0,
      })),
      totalUsage,
      activeCount: templates.filter((t) => t.isActive).length,
      inactiveCount: templates.filter((t) => !t.isActive).length,
    };
  }
}

export const recurrenceMessageTemplateService = new RecurrenceMessageTemplateService();
