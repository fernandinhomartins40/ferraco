/**
 * Lead Recurrence Service
 *
 * Gerencia a detecção e rastreamento de leads recorrentes.
 * Um lead é considerado recorrente quando demonstra interesse múltiplas vezes.
 *
 * Features:
 * - Detecção automática de recorrência por telefone
 * - Registro de histórico completo de capturas
 * - Análise de padrões de interesse
 * - Incremento de score para leads recorrentes
 */

import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { statsCacheService } from './statsCache.service';

export interface CaptureData {
  phone: string;
  name: string;
  email?: string;
  source: string;
  interest?: string | string[]; // Produto(s) de interesse
  metadata?: Record<string, any>;
  userAgent?: string;
  ipAddress?: string;
  campaign?: string;
}

export interface RecurrenceResult {
  lead: any;
  isRecurrent: boolean;
  captureNumber: number;
  previousInterests: string[];
  daysSinceLastCapture: number | null;
  interestChanged: boolean;
}

export class LeadRecurrenceService {
  /**
   * Detecta se lead é recorrente e registra nova captura
   */
  async handleLeadCapture(data: CaptureData): Promise<RecurrenceResult> {
    try {
      // Normalizar telefone
      const normalizedPhone = this.normalizePhone(data.phone);

      // 1. Buscar lead existente
      const existingLead = await prisma.lead.findFirst({
        where: { phone: normalizedPhone },
        include: {
          captures: {
            orderBy: { createdAt: 'desc' },
            take: 10, // Últimas 10 capturas
          },
        },
      });

      const isRecurrent = !!existingLead;
      const captureNumber = isRecurrent ? existingLead.captureCount + 1 : 1;

      // 2. Calcular dias desde última captura
      let daysSinceLastCapture: number | null = null;
      if (isRecurrent && existingLead.lastCapturedAt) {
        const diffMs = Date.now() - new Date(existingLead.lastCapturedAt).getTime();
        daysSinceLastCapture = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      }

      // 3. Extrair interesses anteriores
      const previousInterests = this.extractPreviousInterests(existingLead?.captures || []);

      // 4. Normalizar interesse atual
      const currentInterest = this.normalizeInterest(data.interest);

      // 5. Verificar se interesse mudou
      const interestChanged = this.hasInterestChanged(previousInterests, currentInterest);

      // 6. Atualizar ou criar lead
      const lead = isRecurrent
        ? await this.updateRecurrentLead(existingLead, data, captureNumber, currentInterest)
        : await this.createNewLead(data, currentInterest);

      // 7. Registrar captura no histórico
      await this.recordCapture(lead.id, data, captureNumber, currentInterest);

      // 8. Log da operação
      if (isRecurrent) {
        logger.info(
          `🔄 Lead recorrente detectado: ${lead.name} (${normalizedPhone}) - ` +
          `Captura #${captureNumber} - ` +
          `${daysSinceLastCapture} dias desde última captura - ` +
          `Interesse ${interestChanged ? 'MUDOU' : 'mantido'}`
        );
      } else {
        logger.info(`✨ Novo lead criado: ${lead.name} (${normalizedPhone})`);
      }

      return {
        lead,
        isRecurrent,
        captureNumber,
        previousInterests,
        daysSinceLastCapture,
        interestChanged,
      };
    } catch (error) {
      logger.error('❌ Erro ao processar captura de lead:', error);
      throw error;
    }
  }

  /**
   * Atualiza lead recorrente
   */
  private async updateRecurrentLead(
    existingLead: any,
    data: CaptureData,
    captureNumber: number,
    currentInterest: string[]
  ) {
    // Merge metadata existente com novo
    const existingMetadata = JSON.parse(existingLead.metadata || '{}');
    const newMetadata = {
      ...existingMetadata,
      ...data.metadata,
      lastCaptureSource: data.source,
      captureHistory: [
        ...(existingMetadata.captureHistory || []),
        {
          captureNumber,
          source: data.source,
          interest: currentInterest,
          timestamp: new Date().toISOString(),
        },
      ].slice(-10), // Manter apenas últimas 10 capturas no metadata
    };

    // Calcular boost de score (lead recorrente vale mais)
    const scoreBoost = this.calculateRecurrenceScoreBoost(captureNumber);

    return await prisma.lead.update({
      where: { id: existingLead.id },
      data: {
        name: data.name || existingLead.name, // Atualizar nome se fornecido
        email: data.email || existingLead.email, // Atualizar email se fornecido
        captureCount: captureNumber,
        lastCapturedAt: new Date(),
        metadata: JSON.stringify(newMetadata),
        leadScore: existingLead.leadScore + scoreBoost,
        // Aumentar prioridade para leads muito recorrentes
        priority: captureNumber >= 3 ? 'HIGH' : captureNumber >= 2 ? 'MEDIUM' : existingLead.priority,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Cria novo lead
   */
  private async createNewLead(data: CaptureData, currentInterest: string[]) {
    // Buscar primeiro admin para ser o criador
    const systemUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      orderBy: { createdAt: 'asc' },
    });

    if (!systemUser) {
      throw new Error('Nenhum usuário admin encontrado para criar lead');
    }

    const metadata = {
      ...data.metadata,
      lastCaptureSource: data.source,
      interest: currentInterest.length > 0 ? currentInterest : undefined,
      captureHistory: [
        {
          captureNumber: 1,
          source: data.source,
          interest: currentInterest,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    // ✅ CORREÇÃO: Adicionar opt-in automático para leads de formulários/chatbot
    const isOptInSource = [
      'landing-page',
      'chatbot-web',
      'whatsapp-bot',
      'modal-orcamento',
    ].includes(data.source) || data.source?.startsWith('modal-produto-');

    return await prisma.lead.create({
      data: {
        name: data.name,
        phone: this.normalizePhone(data.phone),
        email: data.email,
        source: data.source,
        status: 'NOVO',
        priority: 'MEDIUM',
        metadata: JSON.stringify(metadata),
        captureCount: 1,
        firstCapturedAt: new Date(),
        lastCapturedAt: new Date(),
        createdById: systemUser.id,
      },
    });
  }

  /**
   * Registra captura no histórico
   */
  private async recordCapture(
    leadId: string,
    data: CaptureData,
    captureNumber: number,
    currentInterest: string[]
  ) {
    await prisma.leadCapture.create({
      data: {
        leadId,
        source: data.source,
        interest: JSON.stringify(currentInterest),
        metadata: JSON.stringify(data.metadata || {}),
        captureNumber,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
        campaign: data.campaign,
      },
    });
  }

  /**
   * Extrai interesses anteriores do histórico de capturas
   */
  private extractPreviousInterests(captures: any[]): string[] {
    const allInterests = new Set<string>();

    for (const capture of captures) {
      try {
        const interests = JSON.parse(capture.interest || '[]');
        if (Array.isArray(interests)) {
          interests.forEach((i) => allInterests.add(i));
        }
      } catch (error) {
        logger.warn(`Erro ao parsear interesse da captura ${capture.id}`);
      }
    }

    return Array.from(allInterests);
  }

  /**
   * Normaliza interesse (pode ser string ou array)
   */
  private normalizeInterest(interest?: string | string[]): string[] {
    if (!interest) return [];

    if (Array.isArray(interest)) {
      return interest.filter((i) => i && i.trim() !== '');
    }

    if (typeof interest === 'string') {
      // Se for string separada por vírgula
      return interest
        .split(',')
        .map((i) => i.trim())
        .filter((i) => i !== '');
    }

    return [];
  }

  /**
   * Verifica se interesse mudou
   */
  private hasInterestChanged(previousInterests: string[], currentInterest: string[]): boolean {
    if (currentInterest.length === 0) return false;
    if (previousInterests.length === 0) return true;

    // Verificar se há novos interesses
    const newInterests = currentInterest.filter((i) => !previousInterests.includes(i));
    return newInterests.length > 0;
  }

  /**
   * Calcula boost de score baseado no número de capturas
   */
  private calculateRecurrenceScoreBoost(captureNumber: number): number {
    // 2ª captura: +10 pontos
    // 3ª captura: +20 pontos
    // 4ª+ captura: +30 pontos
    if (captureNumber === 2) return 10;
    if (captureNumber === 3) return 20;
    if (captureNumber >= 4) return 30;
    return 0;
  }

  /**
   * Normaliza telefone
   */
  private normalizePhone(phone: string): string {
    // Remove espaços, parênteses, hífens
    let normalized = phone.replace(/[\s\-\(\)]/g, '');

    // Adiciona +55 se não tiver código do país
    if (!normalized.startsWith('+')) {
      normalized = `+55${normalized}`;
    }

    return normalized;
  }

  /**
   * Calcula período de data baseado no filtro
   */
  private calculateDateFilter(period?: '7d' | '30d' | '90d' | 'all'): Date | null {
    if (!period || period === 'all') return null;

    const now = new Date();
    const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
    const days = daysMap[period];

    const date = new Date(now);
    date.setDate(date.getDate() - days);
    return date;
  }

  /**
   * Obtém estatísticas de recorrência
   * @param period Período de filtro: '7d', '30d', '90d', 'all' (padrão: 'all')
   * @param filters Filtros adicionais: source, interest
   */
  async getRecurrenceStats(
    period?: '7d' | '30d' | '90d' | 'all',
    filters?: {
      source?: string;
      interest?: string;
    }
  ): Promise<{
    totalLeads: number;
    recurrentLeads: number;
    avgCapturesPerLead: number;
    topRecurrentLeads: any[];
  }> {
    // ✅ Cache: Gerar chave baseada nos parâmetros
    const cacheKey = statsCacheService.generateKey('recurrence:stats', {
      period: period || 'all',
      source: filters?.source || 'all',
      interest: filters?.interest || 'all',
    });

    // Tentar buscar do cache
    return statsCacheService.getOrSet(
      cacheKey,
      async () => {
        const dateFilter = this.calculateDateFilter(period);

        // Construir filtro de data
        const whereClause: any = dateFilter ? { createdAt: { gte: dateFilter } } : {};
        const whereRecurrent: any = {
          captureCount: { gt: 1 },
          ...(dateFilter ? { createdAt: { gte: dateFilter } } : {})
        };

        // ✅ Filtros avançados
        if (filters?.source) {
          whereClause.source = filters.source;
          whereRecurrent.source = filters.source;
        }

        if (filters?.interest) {
          // Buscar leads que tenham o interesse no metadata
          const metadataFilter = {
            metadata: {
              contains: filters.interest // Busca textual no JSON
            }
          };
          whereClause.AND = [whereClause.AND || {}, metadataFilter];
          whereRecurrent.AND = [whereRecurrent.AND || {}, metadataFilter];
        }

        const [totalLeads, recurrentLeads, avgResult, topLeads] = await Promise.all([
          prisma.lead.count({ where: whereClause }),
          prisma.lead.count({ where: whereRecurrent }),
          prisma.lead.aggregate({
            where: whereClause,
            _avg: { captureCount: true }
          }),
          prisma.lead.findMany({
            where: whereRecurrent,
            orderBy: { captureCount: 'desc' },
            take: 10,
            select: {
              id: true,
              name: true,
              phone: true,
              captureCount: true,
              lastCapturedAt: true,
              leadScore: true,
              source: true,
            },
          }),
        ]);

        return {
          totalLeads,
          recurrentLeads,
          avgCapturesPerLead: avgResult._avg.captureCount || 1,
          topRecurrentLeads: topLeads,
        };
      },
      30 * 1000 // TTL: 30 segundos
    );
  }

  /**
   * Obtém tendências de capturas ao longo do tempo
   * @param period Período de filtro: '7d', '30d', '90d', 'all' (padrão: '30d')
   * @param groupBy Agrupar por 'day', 'week' ou 'month' (padrão: auto baseado no período)
   */
  async getCaptureTrends(
    period: '7d' | '30d' | '90d' | 'all' = '30d',
    groupBy?: 'day' | 'week' | 'month'
  ): Promise<{
    period: string;
    newLeads: number;
    recurrentLeads: number;
    totalCaptures: number;
  }[]> {
    // Auto-detectar agrupamento se não especificado
    const autoGroupBy = groupBy || (period === '7d' ? 'day' : period === '30d' ? 'week' : 'month');

    // ✅ Cache: Gerar chave baseada nos parâmetros
    const cacheKey = statsCacheService.generateKey('recurrence:trends', {
      period,
      groupBy: autoGroupBy,
    });

    return statsCacheService.getOrSet(
      cacheKey,
      async () => {
        const dateFilter = this.calculateDateFilter(period);

        // Buscar todas as capturas no período
        const captures = await prisma.leadCapture.findMany({
          where: dateFilter ? { createdAt: { gte: dateFilter } } : {},
          include: {
            lead: {
              select: {
                captureCount: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        });

        // Agrupar capturas por período
        const grouped = new Map<string, { new: number; recurrent: number; total: number }>();

        for (const capture of captures) {
          const date = new Date(capture.createdAt);
          let key: string;

          if (autoGroupBy === 'day') {
            key = date.toISOString().split('T')[0]; // YYYY-MM-DD
          } else if (autoGroupBy === 'week') {
            // Primeira data da semana
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            key = weekStart.toISOString().split('T')[0];
          } else {
            // month
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          }

          if (!grouped.has(key)) {
            grouped.set(key, { new: 0, recurrent: 0, total: 0 });
          }

          const stats = grouped.get(key)!;
          stats.total++;

          // captureNumber === 1 significa que é nova captura (primeira vez)
          if (capture.captureNumber === 1) {
            stats.new++;
          } else {
            stats.recurrent++;
          }
        }

        // Converter para array e formatar
        const trends = Array.from(grouped.entries()).map(([period, stats]) => ({
          period,
          newLeads: stats.new,
          recurrentLeads: stats.recurrent,
          totalCaptures: stats.total,
        }));

        // Ordenar por período
        trends.sort((a, b) => a.period.localeCompare(b.period));

        return trends;
      },
      60 * 1000 // TTL: 60 segundos (trends são mais estáveis)
    );
  }

  /**
   * Obtém histórico de capturas de um lead
   */
  async getLeadCaptureHistory(leadId: string) {
    return await prisma.leadCapture.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const leadRecurrenceService = new LeadRecurrenceService();
