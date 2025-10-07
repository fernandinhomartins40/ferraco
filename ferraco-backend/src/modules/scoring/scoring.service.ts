import { getPrismaClient } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

const prisma = getPrismaClient();

export class ScoringService {
  /**
   * Calcular score de um lead
   */
  async calculateLeadScore(leadId: string): Promise<number> {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        notes: true,
        tags: {
          include: { tag: true },
        },
        communications: true,
      },
    });

    if (!lead) {
      throw new AppError(404, 'Lead não encontrado');
    }

    let score = 0;

    // 1. Score baseado em notas (max 20 pontos)
    const notesScore = Math.min(lead.notes.length * 2, 20);
    score += notesScore;

    // 2. Score baseado em notas importantes (max 15 pontos)
    const importantNotes = lead.notes.filter((n) => n.important).length;
    const importantNotesScore = Math.min(importantNotes * 5, 15);
    score += importantNotesScore;

    // 3. Score baseado em comunicações (max 20 pontos)
    const communicationsScore = Math.min(lead.communications.length * 3, 20);
    score += communicationsScore;

    // 4. Score baseado em tags (max 15 pontos)
    const tagsScore = Math.min(lead.tags.length * 3, 15);
    score += tagsScore;

    // 5. Score baseado em prioridade (max 15 pontos)
    const priorityScores: Record<string, number> = {
      URGENT: 15,
      HIGH: 10,
      MEDIUM: 5,
      LOW: 0,
    };
    const priorityScore = priorityScores[lead.priority] || 0;
    score += priorityScore;

    // 6. Score baseado em status (max 15 pontos)
    const statusScores: Record<string, number> = {
      NOVO: 5,
      EM_ANDAMENTO: 10,
      CONCLUIDO: 15,
      PERDIDO: 0,
      DESCARTADO: 0,
    };
    const statusScore = statusScores[lead.status] || 0;
    score += statusScore;

    // 7. Bonus: Email fornecido (+5 pontos)
    if (lead.email) {
      score += 5;
    }

    // 8. Bonus: Próximo follow-up agendado (+5 pontos)
    if (lead.nextFollowUp) {
      score += 5;
    }

    // Total máximo: 100 pontos
    const finalScore = Math.min(score, 100);

    // Atualizar score no banco
    await prisma.lead.update({
      where: { id: leadId },
      data: { leadScore: finalScore },
    });

    return finalScore;
  }

  /**
   * Recalcular scores de todos os leads
   */
  async recalculateAllScores() {
    const leads = await prisma.lead.findMany({
      select: { id: true },
    });

    const results = await Promise.all(
      leads.map(async (lead) => {
        try {
          const score = await this.calculateLeadScore(lead.id);
          return { leadId: lead.id, score, success: true };
        } catch (error) {
          return { leadId: lead.id, score: 0, success: false, error };
        }
      })
    );

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return {
      total: leads.length,
      successful,
      failed,
      results,
    };
  }

  /**
   * Obter leads com maior score
   */
  async getTopScoredLeads(limit: number = 10) {
    const leads = await prisma.lead.findMany({
      where: {
        leadScore: { not: null },
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
        tags: {
          include: { tag: true },
        },
      },
      orderBy: {
        leadScore: 'desc',
      },
      take: limit,
    });

    return leads;
  }

  /**
   * Obter distribuição de scores
   */
  async getScoreDistribution() {
    const leads = await prisma.lead.findMany({
      where: {
        leadScore: { not: null },
      },
      select: {
        leadScore: true,
      },
    });

    // Distribuir em faixas
    const distribution = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0,
    };

    leads.forEach((lead) => {
      const score = lead.leadScore || 0;
      if (score <= 20) distribution['0-20']++;
      else if (score <= 40) distribution['21-40']++;
      else if (score <= 60) distribution['41-60']++;
      else if (score <= 80) distribution['61-80']++;
      else distribution['81-100']++;
    });

    const total = leads.length;
    const average = total > 0
      ? leads.reduce((sum, lead) => sum + (lead.leadScore || 0), 0) / total
      : 0;

    return {
      total,
      average: Math.round(average * 100) / 100,
      distribution,
    };
  }

  /**
   * Obter regras de pontuação (para documentação)
   */
  getScoringRules() {
    return {
      rules: [
        {
          category: 'Notas',
          description: 'Quantidade de notas do lead',
          points: 'Até 20 pontos (2 pontos por nota)',
        },
        {
          category: 'Notas Importantes',
          description: 'Notas marcadas como importantes',
          points: 'Até 15 pontos (5 pontos por nota importante)',
        },
        {
          category: 'Comunicações',
          description: 'Histórico de comunicações',
          points: 'Até 20 pontos (3 pontos por comunicação)',
        },
        {
          category: 'Tags',
          description: 'Tags associadas ao lead',
          points: 'Até 15 pontos (3 pontos por tag)',
        },
        {
          category: 'Prioridade',
          description: 'Prioridade definida para o lead',
          points: 'URGENT: 15, HIGH: 10, MEDIUM: 5, LOW: 0',
        },
        {
          category: 'Status',
          description: 'Status atual do lead',
          points: 'CONCLUIDO: 15, EM_ANDAMENTO: 10, NOVO: 5, outros: 0',
        },
        {
          category: 'Email',
          description: 'Email fornecido',
          points: '+5 pontos',
        },
        {
          category: 'Follow-up',
          description: 'Próximo follow-up agendado',
          points: '+5 pontos',
        },
      ],
      maxScore: 100,
    };
  }
}
