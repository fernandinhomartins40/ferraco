/**
 * Serviço de Tagging Automática de Leads
 *
 * Adiciona tags automaticamente aos leads com base em:
 * - Produtos de interesse
 * - Intenções (orçamento, falar com humano, etc)
 * - Score de qualificação
 * - Tipo de usuário
 */

import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';

export class LeadTaggingService {
  /**
   * Adiciona tags automáticas ao lead baseado na sessão do chatbot
   */
  async addAutomaticTags(leadId: string, sessionData: {
    userResponses: string;
    interest?: string | null;
    segment?: string | null;
    qualificationScore: number;
    currentStepId?: string | null;
  }): Promise<void> {
    try {
      logger.info(`🏷️ Adicionando tags automáticas ao lead ${leadId}`);

      const userResponses = JSON.parse(sessionData.userResponses || '{}');
      const tags: string[] = [];

      // 1. PRODUTOS DE INTERESSE
      if (userResponses.selected_product) {
        const productName = this.extractProductName(userResponses.selected_product);
        if (productName) {
          tags.push(`interesse-${this.slugify(productName)}`);
        }
      }

      // Múltiplos produtos (se houver)
      if (userResponses.selected_products && Array.isArray(userResponses.selected_products)) {
        userResponses.selected_products.forEach((product: string) => {
          tags.push(`interesse-${this.slugify(product)}`);
        });
      }

      // 2. INTENÇÕES
      if (userResponses.wants_pricing || userResponses.urgency) {
        tags.push('quer-orcamento');
      }

      if (userResponses.wants_material) {
        tags.push('quer-material');
      }

      if (userResponses.wants_human || sessionData.currentStepId === 'human_handoff') {
        tags.push('handoff-humano');
      }

      // 3. SCORE DE QUALIFICAÇÃO
      if (sessionData.qualificationScore >= 80) {
        tags.push('score-muito-alto');
      } else if (sessionData.qualificationScore >= 60) {
        tags.push('score-alto');
      } else if (sessionData.qualificationScore >= 40) {
        tags.push('score-medio');
      } else {
        tags.push('score-baixo');
      }

      // 4. TIPO DE USUÁRIO
      if (userResponses.user_type) {
        if (userResponses.user_type.includes('produtor rural')) {
          tags.push('produtor-rural');
        } else if (userResponses.user_type.includes('setor agro')) {
          tags.push('profissional-agro');
        } else if (userResponses.user_type.includes('pesquisando')) {
          tags.push('terceiros');
        }
      }

      // 5. SEGMENTO/ATIVIDADE
      if (userResponses.activity) {
        if (userResponses.activity.includes('leiteira')) {
          tags.push('pecuaria-leiteira');
        } else if (userResponses.activity.includes('corte')) {
          tags.push('pecuaria-corte');
        } else if (userResponses.activity.includes('Agricultura')) {
          tags.push('agricultura');
        }
      }

      // 6. URGÊNCIA
      if (userResponses.urgency) {
        if (userResponses.urgency.includes('urgente')) {
          tags.push('urgencia-alta');
        } else if (userResponses.urgency.includes('1 ou 2 meses')) {
          tags.push('urgencia-media');
        } else if (userResponses.urgency.includes('3 meses')) {
          tags.push('planejamento');
        }
      }

      // Criar ou buscar tags e vincular ao lead
      for (const tagName of tags) {
        await this.ensureTagAndLink(leadId, tagName);
      }

      logger.info(`✅ ${tags.length} tags adicionadas ao lead ${leadId}: ${tags.join(', ')}`);

    } catch (error) {
      logger.error(`❌ Erro ao adicionar tags ao lead ${leadId}:`, error);
    }
  }

  /**
   * Garante que a tag existe e vincula ao lead
   */
  private async ensureTagAndLink(leadId: string, tagName: string): Promise<void> {
    try {
      // Verificar se a tag já existe
      let tag = await prisma.tag.findFirst({
        where: { name: tagName },
      });

      // Se não existe, criar
      if (!tag) {
        tag = await prisma.tag.create({
          data: {
            name: tagName,
            color: this.getTagColor(tagName),
            description: this.getTagDescription(tagName),
            isSystem: true, // Tags automáticas são do sistema
          },
        });
        logger.debug(`🏷️ Tag criada: ${tagName}`);
      }

      // Verificar se já está vinculada ao lead
      const existingLink = await prisma.leadTag.findUnique({
        where: {
          leadId_tagId: {
            leadId,
            tagId: tag.id,
          },
        },
      });

      // Se não está vinculada, vincular
      if (!existingLink) {
        await prisma.leadTag.create({
          data: {
            leadId,
            tagId: tag.id,
          },
        });
        logger.debug(`🔗 Tag ${tagName} vinculada ao lead ${leadId}`);
      }

    } catch (error) {
      logger.error(`❌ Erro ao vincular tag ${tagName} ao lead ${leadId}:`, error);
    }
  }

  /**
   * Extrai nome limpo do produto de strings como "📦 Bebedouro"
   */
  private extractProductName(productString: string): string | null {
    if (!productString) return null;

    // Remover emojis e caracteres especiais
    const cleaned = productString
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Remove emojis
      .replace(/[📦🎯✅❌]/g, '') // Remove emojis específicos
      .trim();

    return cleaned || null;
  }

  /**
   * Converte texto em slug (ex: "Pecuária Leiteira" -> "pecuaria-leiteira")
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .trim();
  }

  /**
   * Retorna cor baseada no tipo de tag
   */
  private getTagColor(tagName: string): string {
    if (tagName.startsWith('interesse-')) return '#3B82F6'; // Azul
    if (tagName.startsWith('score-')) {
      if (tagName.includes('muito-alto')) return '#10B981'; // Verde
      if (tagName.includes('alto')) return '#34D399'; // Verde claro
      if (tagName.includes('medio')) return '#F59E0B'; // Amarelo
      return '#EF4444'; // Vermelho
    }
    if (tagName === 'quer-orcamento') return '#F59E0B'; // Amarelo
    if (tagName === 'quer-material') return '#8B5CF6'; // Roxo
    if (tagName === 'handoff-humano') return '#EF4444'; // Vermelho
    if (tagName.includes('urgencia-alta')) return '#EF4444'; // Vermelho
    if (tagName.includes('urgencia-media')) return '#F59E0B'; // Amarelo
    if (tagName === 'planejamento') return '#6B7280'; // Cinza

    return '#6B7280'; // Cinza padrão
  }

  /**
   * Retorna descrição baseada no nome da tag
   */
  private getTagDescription(tagName: string): string {
    const descriptions: Record<string, string> = {
      'quer-orcamento': 'Lead solicitou orçamento',
      'quer-material': 'Lead solicitou material informativo',
      'handoff-humano': 'Lead solicitou atendimento humano',
      'score-muito-alto': 'Qualificação muito alta (80+)',
      'score-alto': 'Qualificação alta (60-79)',
      'score-medio': 'Qualificação média (40-59)',
      'score-baixo': 'Qualificação baixa (<40)',
      'produtor-rural': 'Produtor rural',
      'profissional-agro': 'Profissional do setor agropecuário',
      'terceiros': 'Pesquisando para terceiros',
      'pecuaria-leiteira': 'Atua em pecuária leiteira',
      'pecuaria-corte': 'Atua em pecuária de corte',
      'agricultura': 'Atua em agricultura',
      'urgencia-alta': 'Necessidade urgente (15 dias)',
      'urgencia-media': 'Necessidade em 1-2 meses',
      'planejamento': 'Em fase de planejamento (3+ meses)',
    };

    if (descriptions[tagName]) {
      return descriptions[tagName];
    }

    if (tagName.startsWith('interesse-')) {
      const product = tagName.replace('interesse-', '').replace(/-/g, ' ');
      return `Interesse em ${product}`;
    }

    return `Tag gerada automaticamente: ${tagName}`;
  }

  /**
   * Extrai lista de produtos selecionados da sessão
   */
  extractSelectedProducts(userResponses: any): string[] {
    const products: string[] = [];

    // Produto único
    if (userResponses.selected_product) {
      const product = this.extractProductName(userResponses.selected_product);
      if (product) products.push(product);
    }

    // Múltiplos produtos
    if (userResponses.selected_products && Array.isArray(userResponses.selected_products)) {
      userResponses.selected_products.forEach((product: string) => {
        const cleaned = this.extractProductName(product);
        if (cleaned && !products.includes(cleaned)) {
          products.push(cleaned);
        }
      });
    }

    return products;
  }
}

export const leadTaggingService = new LeadTaggingService();
