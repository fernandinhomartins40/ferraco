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

      // 1. Buscar lead existente (incluindo arquivados)
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
      const wasArchived = existingLead?.status === 'ARQUIVADO';

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
        if (wasArchived) {
          logger.info(
            `♻️ Lead ARQUIVADO reativado: ${lead.name} (${normalizedPhone}) - ` +
            `Captura #${captureNumber} - ` +
            `${daysSinceLastCapture} dias desde última captura - ` +
            `Status alterado para NOVO`
          );
        } else {
          logger.info(
            `🔄 Lead recorrente detectado: ${lead.name} (${normalizedPhone}) - ` +
            `Captura #${captureNumber} - ` +
            `${daysSinceLastCapture} dias desde última captura - ` +
            `Interesse ${interestChanged ? 'MUDOU' : 'mantido'}`
          );
        }
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

    // ✅ FIX: Reativar lead se estava arquivado
    const wasArchived = existingLead.status === 'ARQUIVADO';
    const newStatus = wasArchived ? 'NOVO' : existingLead.status;

    return await prisma.lead.update({
      where: { id: existingLead.id },
      data: {
        name: data.name || existingLead.name, // Atualizar nome se fornecido
        email: data.email || existingLead.email, // Atualizar email se fornecido
        status: newStatus, // ✅ Reativar como NOVO se estava arquivado
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
   * Obtém estatísticas de recorrência
   */
  async getRecurrenceStats(): Promise<{
    totalLeads: number;
    recurrentLeads: number;
    avgCapturesPerLead: number;
    topRecurrentLeads: any[];
  }> {
    const [totalLeads, recurrentLeads, avgResult, topLeads] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { captureCount: { gt: 1 } } }),
      prisma.lead.aggregate({ _avg: { captureCount: true } }),
      prisma.lead.findMany({
        where: { captureCount: { gt: 1 } },
        orderBy: { captureCount: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          phone: true,
          captureCount: true,
          lastCapturedAt: true,
          leadScore: true,
        },
      }),
    ]);

    return {
      totalLeads,
      recurrentLeads,
      avgCapturesPerLead: avgResult._avg.captureCount || 1,
      topRecurrentLeads: topLeads,
    };
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
