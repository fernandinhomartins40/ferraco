import { getPrismaClient } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

const prisma = getPrismaClient();

export class DuplicatesService {
  /**
   * Normalizar string para comparação
   */
  private normalizeString(str: string): string {
    return str.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  /**
   * Normalizar telefone para comparação
   */
  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  /**
   * Calcular similaridade entre duas strings (Levenshtein distance simplificado)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) {
      return 1.0;
    }

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calcular Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Detectar duplicatas de um lead
   */
  async findDuplicates(leadId: string) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      throw new AppError(404, 'Lead não encontrado');
    }

    const potentialDuplicates: Array<{
      lead: any;
      matchScore: number;
      matchReasons: string[];
    }> = [];

    // Buscar leads com mesmo telefone (normalizado)
    const normalizedPhone = this.normalizePhone(lead.phone);
    const phoneMatches = await prisma.lead.findMany({
      where: {
        id: { not: leadId },
        phone: {
          contains: normalizedPhone,
        },
      },
    });

    phoneMatches.forEach((duplicate) => {
      potentialDuplicates.push({
        lead: duplicate,
        matchScore: 100,
        matchReasons: ['Telefone idêntico'],
      });
    });

    // Buscar leads com mesmo email (se fornecido)
    if (lead.email) {
      const emailMatches = await prisma.lead.findMany({
        where: {
          id: { not: leadId },
          email: {
            equals: lead.email,
            mode: 'insensitive',
          },
        },
      });

      emailMatches.forEach((duplicate) => {
        const existing = potentialDuplicates.find((d) => d.lead.id === duplicate.id);
        if (existing) {
          existing.matchScore = 100;
          existing.matchReasons.push('Email idêntico');
        } else {
          potentialDuplicates.push({
            lead: duplicate,
            matchScore: 100,
            matchReasons: ['Email idêntico'],
          });
        }
      });
    }

    // Buscar leads com nome similar
    const allLeads = await prisma.lead.findMany({
      where: {
        id: { not: leadId },
      },
    });

    const normalizedName = this.normalizeString(lead.name);

    allLeads.forEach((candidate) => {
      const candidateName = this.normalizeString(candidate.name);
      const similarity = this.calculateSimilarity(normalizedName, candidateName);

      // Se similaridade > 80%, considerar como duplicata potencial
      if (similarity > 0.8) {
        const existing = potentialDuplicates.find((d) => d.lead.id === candidate.id);
        const matchScore = Math.round(similarity * 100);

        if (existing) {
          // Já existe, ajustar score se necessário
          if (matchScore > existing.matchScore) {
            existing.matchScore = matchScore;
          }
          existing.matchReasons.push(`Nome similar (${matchScore}%)`);
        } else {
          potentialDuplicates.push({
            lead: candidate,
            matchScore,
            matchReasons: [`Nome similar (${matchScore}%)`],
          });
        }
      }
    });

    // Ordenar por score (maior primeiro)
    potentialDuplicates.sort((a, b) => b.matchScore - a.matchScore);

    return {
      originalLead: lead,
      duplicatesFound: potentialDuplicates.length,
      duplicates: potentialDuplicates,
    };
  }

  /**
   * Marcar lead como duplicata
   */
  async markAsDuplicate(leadId: string, duplicateOfId: string) {
    const [lead, originalLead] = await Promise.all([
      prisma.lead.findUnique({ where: { id: leadId } }),
      prisma.lead.findUnique({ where: { id: duplicateOfId } }),
    ]);

    if (!lead) {
      throw new AppError(404, 'Lead não encontrado');
    }

    if (!originalLead) {
      throw new AppError(404, 'Lead original não encontrado');
    }

    if (leadId === duplicateOfId) {
      throw new AppError(400, 'Lead não pode ser duplicata de si mesmo');
    }

    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: {
        isDuplicate: true,
        duplicateOfId,
      },
      include: {
        duplicateOf: true,
      },
    });

    return updated;
  }

  /**
   * Desmarcar lead como duplicata
   */
  async unmarkAsDuplicate(leadId: string) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });

    if (!lead) {
      throw new AppError(404, 'Lead não encontrado');
    }

    if (!lead.isDuplicate) {
      throw new AppError(400, 'Lead não está marcado como duplicata');
    }

    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: {
        isDuplicate: false,
        duplicateOfId: null,
      },
    });

    return updated;
  }

  /**
   * Mesclar dois leads (transferir dados do duplicado para o original)
   */
  async mergeLeads(sourceId: string, targetId: string) {
    const [source, target] = await Promise.all([
      prisma.lead.findUnique({
        where: { id: sourceId },
        include: {
          notes: true,
          tags: true,
          communications: true,
        },
      }),
      prisma.lead.findUnique({ where: { id: targetId } }),
    ]);

    if (!source) {
      throw new AppError(404, 'Lead de origem não encontrado');
    }

    if (!target) {
      throw new AppError(404, 'Lead de destino não encontrado');
    }

    if (sourceId === targetId) {
      throw new AppError(400, 'Não é possível mesclar um lead consigo mesmo');
    }

    // Transferir notas
    await prisma.leadNote.updateMany({
      where: { leadId: sourceId },
      data: { leadId: targetId },
    });

    // Transferir tags (evitar duplicatas)
    for (const leadTag of source.tags) {
      await prisma.leadTag.upsert({
        where: {
          leadId_tagId: {
            leadId: targetId,
            tagId: leadTag.tagId,
          },
        },
        update: {},
        create: {
          leadId: targetId,
          tagId: leadTag.tagId,
        },
      });
    }

    // Transferir comunicações
    await prisma.communication.updateMany({
      where: { leadId: sourceId },
      data: { leadId: targetId },
    });

    // Atualizar informações do lead destino (mesclar dados)
    const mergedData: any = {};

    if (!target.email && source.email) {
      mergedData.email = source.email;
    }

    if (source.priority === 'URGENT' || source.priority === 'HIGH') {
      if (target.priority === 'LOW' || target.priority === 'MEDIUM') {
        mergedData.priority = source.priority;
      }
    }

    if (source.nextFollowUp && !target.nextFollowUp) {
      mergedData.nextFollowUp = source.nextFollowUp;
    }

    if (Object.keys(mergedData).length > 0) {
      await prisma.lead.update({
        where: { id: targetId },
        data: mergedData,
      });
    }

    // Marcar lead de origem como duplicata e deletar
    await prisma.lead.update({
      where: { id: sourceId },
      data: {
        isDuplicate: true,
        duplicateOfId: targetId,
      },
    });

    // Opcionalmente, deletar o lead de origem
    await prisma.lead.delete({
      where: { id: sourceId },
    });

    return {
      success: true,
      message: 'Leads mesclados com sucesso',
      mergedLead: await prisma.lead.findUnique({
        where: { id: targetId },
        include: {
          notes: true,
          tags: { include: { tag: true } },
          communications: true,
        },
      }),
    };
  }

  /**
   * Listar todos os leads marcados como duplicatas
   */
  async getDuplicateLeads() {
    const duplicates = await prisma.lead.findMany({
      where: {
        isDuplicate: true,
      },
      include: {
        duplicateOf: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return duplicates;
  }

  /**
   * Executar varredura completa em busca de duplicatas
   */
  async scanAllLeads() {
    const allLeads = await prisma.lead.findMany({
      where: {
        isDuplicate: false,
      },
    });

    const report: Array<{
      leadId: string;
      leadName: string;
      duplicatesCount: number;
    }> = [];

    for (const lead of allLeads) {
      const result = await this.findDuplicates(lead.id);
      if (result.duplicatesFound > 0) {
        report.push({
          leadId: lead.id,
          leadName: lead.name,
          duplicatesCount: result.duplicatesFound,
        });
      }
    }

    return {
      totalLeadsScanned: allLeads.length,
      leadsWithDuplicates: report.length,
      report,
    };
  }
}
