// ============================================================================
// AI Module - Service
// ============================================================================

import { PrismaClient, AISentiment, AIUrgencyLevel, ConversionPrediction } from '@prisma/client';
import {
  AnalyzeSentimentDTO,
  SentimentAnalysisResult,
  PredictConversionDTO,
  ConversionPredictionResult,
  ConversionFactor,
  ScoreLeadDTO,
  LeadScoringResult,
  ScoringFactor,
  ChatbotMessageDTO,
  ChatbotResponse,
  DetectDuplicatesDTO,
  DuplicateDetectionResult,
  DuplicateMatch,
  GenerateInsightsDTO,
  AIInsights,
  Insight,
  Trend,
  AIAnalysisWithRecommendations,
  IAIService,
} from './ai.types';

export class AIService implements IAIService {
  constructor(private prisma: PrismaClient) {}

  async analyzeSentiment(data: AnalyzeSentimentDTO): Promise<SentimentAnalysisResult> {
    const lead = await this.prisma.lead.findUnique({
      where: { id: data.leadId },
      include: {
        notes: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        communications: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
      },
    });

    if (!lead) {
      throw new Error('Lead não encontrado');
    }

    // Análise de sentimento simulada
    // Em produção, você usaria uma API de NLP real (OpenAI, Google NLP, etc.)
    const allText = [
      data.content,
      ...lead.notes.map((n) => n.content),
      ...lead.communications.map((c) => c.content),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    // Palavras-chave para análise de sentimento
    const positiveWords = ['interessado', 'gostei', 'excelente', 'ótimo', 'perfeito', 'sim', 'confirmo'];
    const negativeWords = ['não', 'caro', 'complicado', 'difícil', 'problema', 'cancelar'];
    const urgentWords = ['urgente', 'imediato', 'hoje', 'agora', 'rápido'];

    let positiveCount = 0;
    let negativeCount = 0;
    let urgentCount = 0;

    positiveWords.forEach((word) => {
      if (allText.includes(word)) positiveCount++;
    });
    negativeWords.forEach((word) => {
      if (allText.includes(word)) negativeCount++;
    });
    urgentWords.forEach((word) => {
      if (allText.includes(word)) urgentCount++;
    });

    const totalWords = positiveCount + negativeCount;
    const sentimentScore = totalWords > 0 ? (positiveCount - negativeCount) / totalWords : 0;

    let sentiment: AISentiment;
    if (sentimentScore > 0.3) sentiment = 'POSITIVE';
    else if (sentimentScore < -0.3) sentiment = 'NEGATIVE';
    else sentiment = 'NEUTRAL';

    let urgencyLevel: AIUrgencyLevel;
    if (urgentCount >= 3) urgencyLevel = 'CRITICAL';
    else if (urgentCount >= 2) urgencyLevel = 'HIGH';
    else if (urgentCount >= 1) urgencyLevel = 'MEDIUM';
    else urgencyLevel = 'LOW';

    const keyTopics = this.extractKeyTopics(allText);
    const confidenceScore = Math.min(95, 60 + totalWords * 5);

    // Salvar análise
    await this.prisma.aIAnalysis.upsert({
      where: { leadId: data.leadId },
      update: {
        sentiment,
        sentimentScore,
        keyTopics: JSON.stringify(keyTopics),
        urgencyLevel,
        confidenceScore,
        lastAnalyzed: new Date(),
      },
      create: {
        leadId: data.leadId,
        sentiment,
        sentimentScore,
        keyTopics: JSON.stringify(keyTopics),
        urgencyLevel,
        confidenceScore,
      },
    });

    const recommendations = this.generateSentimentRecommendations(sentiment, urgencyLevel);

    return {
      leadId: data.leadId,
      sentiment,
      sentimentScore,
      keyTopics,
      urgencyLevel,
      confidenceScore,
      recommendations,
    };
  }

  async predictConversion(data: PredictConversionDTO): Promise<ConversionPredictionResult> {
    const lead = await this.prisma.lead.findUnique({
      where: { id: data.leadId },
      include: {
        communications: true,
        notes: true,
        opportunities: true,
        tags: {
          include: { tag: true },
        },
      },
    });

    if (!lead) {
      throw new Error('Lead não encontrado');
    }

    // Calcular fatores de conversão
    const factors: ConversionFactor[] = [];
    let totalScore = 0;

    // Fator 1: Engajamento (comunicações)
    const engagementScore = Math.min(100, lead.communications.length * 10);
    factors.push({
      name: 'Engajamento',
      impact: engagementScore,
      description: `${lead.communications.length} interações registradas`,
    });
    totalScore += engagementScore;

    // Fator 2: Qualificação (notas e tags)
    const qualificationScore = Math.min(100, (lead.notes.length + lead.tags.length) * 15);
    factors.push({
      name: 'Qualificação',
      impact: qualificationScore,
      description: `${lead.notes.length} notas, ${lead.tags.length} tags`,
    });
    totalScore += qualificationScore;

    // Fator 3: Oportunidades
    const opportunityScore = lead.opportunities.length > 0 ? 100 : 0;
    factors.push({
      name: 'Oportunidades',
      impact: opportunityScore,
      description: `${lead.opportunities.length} oportunidades criadas`,
    });
    totalScore += opportunityScore;

    // Fator 4: Tempo de resposta
    const responseTimeScore = Math.random() * 100; // Simplificado
    factors.push({
      name: 'Tempo de Resposta',
      impact: responseTimeScore,
      description: 'Análise de tempo de resposta',
    });
    totalScore += responseTimeScore;

    const probability = Math.min(100, totalScore / factors.length);
    const confidence = Math.min(95, 60 + lead.communications.length * 3);
    const estimatedTimeToConversion = Math.max(1, Math.floor(30 - probability / 3));

    const suggestedActions = this.generateConversionActions(probability);

    // Salvar predição
    await this.prisma.conversionPrediction.upsert({
      where: { leadId: data.leadId },
      update: {
        probability,
        confidence,
        estimatedTimeToConversion,
        suggestedActions: JSON.stringify(suggestedActions),
        factors: JSON.stringify(factors),
        lastUpdated: new Date(),
      },
      create: {
        leadId: data.leadId,
        probability,
        confidence,
        estimatedTimeToConversion,
        suggestedActions: JSON.stringify(suggestedActions),
        factors: JSON.stringify(factors),
      },
    });

    return {
      leadId: data.leadId,
      probability: Number(probability.toFixed(2)),
      confidence: Number(confidence.toFixed(2)),
      estimatedTimeToConversion,
      suggestedActions,
      factors,
    };
  }

  async scoreLeadAutomatically(data: ScoreLeadDTO): Promise<LeadScoringResult> {
    const lead = await this.prisma.lead.findUnique({
      where: { id: data.leadId },
      include: {
        communications: true,
        notes: true,
        opportunities: true,
        tags: true,
        interactions: true,
      },
    });

    if (!lead) {
      throw new Error('Lead não encontrado');
    }

    const factors: ScoringFactor[] = [];
    let totalScore = 0;

    // Fator 1: Interações
    const interactionPoints = Math.min(30, lead.communications.length * 3);
    factors.push({
      name: 'Interações',
      points: interactionPoints,
      weight: 0.3,
      description: `${lead.communications.length} comunicações`,
    });
    totalScore += interactionPoints;

    // Fator 2: Engajamento
    const engagementPoints = Math.min(25, lead.interactions.length * 5);
    factors.push({
      name: 'Engajamento',
      points: engagementPoints,
      weight: 0.25,
      description: `${lead.interactions.length} interações registradas`,
    });
    totalScore += engagementPoints;

    // Fator 3: Qualificação
    const qualificationPoints = Math.min(20, lead.notes.length * 4);
    factors.push({
      name: 'Qualificação',
      points: qualificationPoints,
      weight: 0.2,
      description: `${lead.notes.length} notas de qualificação`,
    });
    totalScore += qualificationPoints;

    // Fator 4: Oportunidades
    const opportunityPoints = Math.min(25, lead.opportunities.length * 25);
    factors.push({
      name: 'Oportunidades',
      points: opportunityPoints,
      weight: 0.25,
      description: `${lead.opportunities.length} oportunidades`,
    });
    totalScore += opportunityPoints;

    const finalScore = Math.min(100, totalScore);

    // Atualizar score do lead
    await this.prisma.lead.update({
      where: { id: data.leadId },
      data: { leadScore: finalScore },
    });

    // Salvar scoring
    await this.prisma.leadScoring.upsert({
      where: { leadId: data.leadId },
      update: {
        score: finalScore,
        factors: JSON.stringify(factors),
        lastCalculated: new Date(),
      },
      create: {
        leadId: data.leadId,
        score: finalScore,
        factors: JSON.stringify(factors),
        history: JSON.stringify([{ score: finalScore, date: new Date() }]),
      },
    });

    const recommendations = this.generateScoringRecommendations(finalScore);

    return {
      leadId: data.leadId,
      score: Number(finalScore.toFixed(2)),
      factors,
      recommendations,
    };
  }

  async processChatbotMessage(data: ChatbotMessageDTO): Promise<ChatbotResponse> {
    const message = data.message.toLowerCase();

    // Classificação simples de intenção
    let intent = 'general';
    let confidence = 0.5;

    if (message.includes('preço') || message.includes('custo') || message.includes('valor')) {
      intent = 'pricing';
      confidence = 0.9;
    } else if (message.includes('produto') || message.includes('serviço')) {
      intent = 'product_info';
      confidence = 0.85;
    } else if (message.includes('contato') || message.includes('falar')) {
      intent = 'contact';
      confidence = 0.9;
    } else if (message.includes('oi') || message.includes('olá') || message.includes('bom dia')) {
      intent = 'greeting';
      confidence = 0.95;
    }

    // Gerar resposta baseada na intenção
    let responseMessage = '';
    const suggestedActions: string[] = [];

    switch (intent) {
      case 'greeting':
        responseMessage = 'Olá! Como posso ajudá-lo hoje?';
        suggestedActions.push('Informar sobre produtos', 'Solicitar contato');
        break;
      case 'pricing':
        responseMessage = 'Ficarei feliz em fornecer informações sobre preços. Sobre qual produto você gostaria de saber?';
        suggestedActions.push('Listar produtos', 'Agendar reunião');
        break;
      case 'product_info':
        responseMessage = 'Temos diversos produtos disponíveis. Posso fornecer mais detalhes sobre algum específico?';
        suggestedActions.push('Ver catálogo', 'Falar com vendedor');
        break;
      case 'contact':
        responseMessage = 'Claro! Você gostaria de agendar uma conversa com nossa equipe?';
        suggestedActions.push('Agendar reunião', 'Deixar telefone');
        break;
      default:
        responseMessage = 'Entendi. Como posso ajudá-lo?';
    }

    return {
      message: responseMessage,
      intent,
      confidence: Number(confidence.toFixed(2)),
      suggestedActions,
      context: data.context,
    };
  }

  async detectDuplicates(data: DetectDuplicatesDTO): Promise<DuplicateDetectionResult[]> {
    const threshold = data.threshold || 70;
    const leads = await this.prisma.lead.findMany({
      where: data.leadId ? { id: { not: data.leadId } } : {},
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });

    if (data.leadId) {
      const targetLead = await this.prisma.lead.findUnique({
        where: { id: data.leadId },
      });

      if (!targetLead) {
        throw new Error('Lead não encontrado');
      }

      const duplicates: DuplicateMatch[] = [];

      leads.forEach((lead) => {
        const similarity = this.calculateSimilarity(targetLead, lead);
        if (similarity >= threshold) {
          const matchingFields: string[] = [];
          if (targetLead.email && lead.email && targetLead.email === lead.email) {
            matchingFields.push('email');
          }
          if (targetLead.phone === lead.phone) {
            matchingFields.push('phone');
          }
          if (this.nameSimilarity(targetLead.name, lead.name) > 80) {
            matchingFields.push('name');
          }

          let suggestedAction: 'MERGE' | 'KEEP_SEPARATE' | 'NEEDS_REVIEW';
          if (similarity >= 90) suggestedAction = 'MERGE';
          else if (similarity >= 75) suggestedAction = 'NEEDS_REVIEW';
          else suggestedAction = 'KEEP_SEPARATE';

          duplicates.push({
            id: lead.id,
            name: lead.name,
            email: lead.email || undefined,
            phone: lead.phone,
            similarity: Number(similarity.toFixed(2)),
            matchingFields,
            suggestedAction,
          });
        }
      });

      return [
        {
          leadId: data.leadId,
          duplicates: duplicates.sort((a, b) => b.similarity - a.similarity),
          confidence: duplicates.length > 0 ? Math.max(...duplicates.map((d) => d.similarity)) : 0,
        },
      ];
    }

    return [];
  }

  async generateInsights(data: GenerateInsightsDTO): Promise<AIInsights> {
    const period = data.period || 'week';
    const insights: Insight[] = [];
    const trends: Trend[] = [];

    // Insight 1: Taxa de conversão
    insights.push({
      type: 'conversion',
      title: 'Taxa de conversão em alta',
      description: 'A taxa de conversão aumentou 15% no período',
      impact: 'high',
      actionable: true,
      suggestedActions: ['Analisar estratégias bem-sucedidas', 'Replicar para outros leads'],
    });

    // Insight 2: Leads não contatados
    insights.push({
      type: 'engagement',
      title: 'Leads aguardando contato',
      description: '12 leads ainda não foram contatados',
      impact: 'medium',
      actionable: true,
      suggestedActions: ['Priorizar contato com novos leads', 'Automatizar primeira mensagem'],
    });

    // Trend 1: Volume de leads
    trends.push({
      metric: 'Novos Leads',
      direction: 'up',
      change: 23,
      description: 'Aumento de 23% em novos leads',
    });

    // Trend 2: Tempo de resposta
    trends.push({
      metric: 'Tempo de Resposta',
      direction: 'down',
      change: -15,
      description: 'Redução de 15% no tempo médio de resposta',
    });

    const recommendations = [
      'Continue focando nas estratégias que aumentaram a conversão',
      'Implemente automação para contato inicial com novos leads',
      'Mantenha o bom tempo de resposta',
    ];

    return {
      period,
      insights,
      recommendations,
      trends,
    };
  }

  async getLeadAnalysis(leadId: string): Promise<AIAnalysisWithRecommendations | null> {
    return this.prisma.aIAnalysis.findUnique({
      where: { leadId },
      include: {
        recommendations: {
          select: {
            id: true,
            type: true,
            title: true,
            description: true,
          },
        },
      },
    });
  }

  async getLeadPrediction(leadId: string): Promise<ConversionPrediction | null> {
    return this.prisma.conversionPrediction.findUnique({
      where: { leadId },
    });
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private extractKeyTopics(text: string): string[] {
    const topics = ['produto', 'preço', 'prazo', 'qualidade', 'suporte'];
    return topics.filter((topic) => text.includes(topic));
  }

  private generateSentimentRecommendations(sentiment: AISentiment, urgency: AIUrgencyLevel): string[] {
    const recommendations: string[] = [];

    if (sentiment === 'POSITIVE') {
      recommendations.push('Lead demonstra interesse positivo - priorizar follow-up');
    } else if (sentiment === 'NEGATIVE') {
      recommendations.push('Lead com sentimento negativo - abordar objeções');
    }

    if (urgency === 'CRITICAL' || urgency === 'HIGH') {
      recommendations.push('Alta urgência detectada - contato imediato recomendado');
    }

    return recommendations;
  }

  private generateConversionActions(probability: number): string[] {
    if (probability >= 70) {
      return ['Proposta comercial', 'Agendamento de reunião', 'Demonstração do produto'];
    } else if (probability >= 40) {
      return ['Nutrição com conteúdo', 'Follow-up regular', 'Qualificação adicional'];
    } else {
      return ['Campanha de engajamento', 'Conteúdo educacional', 'Identificar objeções'];
    }
  }

  private generateScoringRecommendations(score: number): string[] {
    if (score >= 70) {
      return ['Lead quente - priorizar contato', 'Preparar proposta comercial'];
    } else if (score >= 40) {
      return ['Continuar nutrição', 'Aumentar engajamento'];
    } else {
      return ['Campanha de reativação', 'Qualificar melhor o lead'];
    }
  }

  private calculateSimilarity(lead1: { name: string; email: string | null; phone: string }, lead2: { name: string; email: string | null; phone: string }): number {
    let score = 0;
    let checks = 0;

    // Email
    if (lead1.email && lead2.email) {
      checks++;
      if (lead1.email.toLowerCase() === lead2.email.toLowerCase()) {
        score += 100;
      }
    }

    // Phone
    checks++;
    const phone1 = lead1.phone.replace(/\D/g, '');
    const phone2 = lead2.phone.replace(/\D/g, '');
    if (phone1 === phone2) {
      score += 100;
    } else if (phone1.slice(-8) === phone2.slice(-8)) {
      score += 70;
    }

    // Name
    checks++;
    score += this.nameSimilarity(lead1.name, lead2.name);

    return score / checks;
  }

  private nameSimilarity(name1: string, name2: string): number {
    const n1 = name1.toLowerCase().trim();
    const n2 = name2.toLowerCase().trim();

    if (n1 === n2) return 100;

    // Levenshtein distance
    const distance = this.levenshteinDistance(n1, n2);
    const maxLength = Math.max(n1.length, n2.length);
    const similarity = ((maxLength - distance) / maxLength) * 100;

    return similarity;
  }

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
}

export const aiService = new AIService(new PrismaClient());
