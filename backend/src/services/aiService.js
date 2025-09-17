const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * AI Service
 * Serviços relacionados a IA, análises preditivas e scoring de leads
 */
class AIService {
  /**
   * Analisa sentimento e urgência de um lead
   */
  async analyzeLeadSentiment(leadId) {
    try {
      // Buscar o lead e suas informações
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: {
          notes: true,
          communications: true,
          interactions: true
        }
      });

      if (!lead) {
        throw new Error('Lead não encontrado');
      }

      // Simular análise de sentimento (em produção usaria API de IA real)
      const textData = [
        lead.name,
        ...lead.notes.map(note => note.content),
        ...lead.communications.map(comm => comm.content),
        ...lead.interactions.map(int => int.description)
      ].join(' ');

      const analysis = this._simulateAISentimentAnalysis(textData, lead);

      // Salvar ou atualizar análise
      const aiAnalysis = await prisma.aIAnalysis.upsert({
        where: { leadId },
        update: {
          sentimentScore: analysis.sentimentScore,
          sentiment: analysis.sentiment,
          urgencyLevel: analysis.urgencyLevel,
          confidenceScore: analysis.confidenceScore,
          keyTopics: JSON.stringify(analysis.keyTopics),
          recommendations: JSON.stringify(analysis.recommendations),
          lastAnalyzed: new Date()
        },
        create: {
          leadId,
          sentimentScore: analysis.sentimentScore,
          sentiment: analysis.sentiment,
          urgencyLevel: analysis.urgencyLevel,
          confidenceScore: analysis.confidenceScore,
          keyTopics: JSON.stringify(analysis.keyTopics),
          recommendations: JSON.stringify(analysis.recommendations)
        }
      });

      return {
        success: true,
        data: {
          analysis: {
            ...aiAnalysis,
            keyTopics: JSON.parse(aiAnalysis.keyTopics),
            recommendations: JSON.parse(aiAnalysis.recommendations)
          }
        }
      };
    } catch (error) {
      logger.error('Error in analyzeLeadSentiment:', error);
      throw error;
    }
  }

  /**
   * Obtém análise de IA de um lead
   */
  async getLeadAIAnalysis(leadId) {
    try {
      const analysis = await prisma.aIAnalysis.findUnique({
        where: { leadId },
        include: {
          lead: {
            select: { id: true, name: true, status: true }
          }
        }
      });

      if (!analysis) {
        throw new Error('Análise de IA não encontrada para este lead');
      }

      return {
        success: true,
        data: {
          analysis: {
            ...analysis,
            keyTopics: JSON.parse(analysis.keyTopics),
            recommendations: JSON.parse(analysis.recommendations)
          }
        }
      };
    } catch (error) {
      logger.error('Error in getLeadAIAnalysis:', error);
      throw error;
    }
  }

  /**
   * Calcula score de um lead
   */
  async calculateLeadScore(leadId) {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: {
          notes: true,
          communications: true,
          interactions: true,
          tags: { include: { tag: true } }
        }
      });

      if (!lead) {
        throw new Error('Lead não encontrado');
      }

      const scoring = this._calculateLeadScoring(lead);

      // Salvar ou atualizar score
      const leadScore = await prisma.leadScoring.upsert({
        where: { leadId },
        update: {
          totalScore: scoring.totalScore,
          demographicScore: scoring.demographicScore,
          behaviorScore: scoring.behaviorScore,
          engagementScore: scoring.engagementScore,
          sourceScore: scoring.sourceScore,
          factors: JSON.stringify(scoring.factors),
          lastUpdated: new Date()
        },
        create: {
          leadId,
          totalScore: scoring.totalScore,
          demographicScore: scoring.demographicScore,
          behaviorScore: scoring.behaviorScore,
          engagementScore: scoring.engagementScore,
          sourceScore: scoring.sourceScore,
          factors: JSON.stringify(scoring.factors)
        }
      });

      // Atualizar score no lead
      await prisma.lead.update({
        where: { id: leadId },
        data: { leadScore: scoring.totalScore }
      });

      return {
        success: true,
        data: {
          score: {
            ...leadScore,
            factors: JSON.parse(leadScore.factors)
          }
        }
      };
    } catch (error) {
      logger.error('Error in calculateLeadScore:', error);
      throw error;
    }
  }

  /**
   * Obtém score de um lead
   */
  async getLeadScore(leadId) {
    try {
      const score = await prisma.leadScoring.findUnique({
        where: { leadId },
        include: {
          lead: {
            select: { id: true, name: true, leadScore: true }
          }
        }
      });

      if (!score) {
        throw new Error('Score não encontrado para este lead');
      }

      return {
        success: true,
        data: {
          score: {
            ...score,
            factors: JSON.parse(score.factors)
          }
        }
      };
    } catch (error) {
      logger.error('Error in getLeadScore:', error);
      throw error;
    }
  }

  /**
   * Gera previsão de conversão para um lead
   */
  async generateConversionPrediction(leadId) {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: {
          notes: true,
          communications: true,
          interactions: true,
          tags: { include: { tag: true } },
          leadScoring: true,
          aiAnalysis: true
        }
      });

      if (!lead) {
        throw new Error('Lead não encontrado');
      }

      const prediction = this._generateConversionPrediction(lead);

      // Salvar previsão
      const conversionPrediction = await prisma.conversionPrediction.create({
        data: {
          leadId,
          probability: prediction.probability,
          confidence: prediction.confidence,
          estimatedTimeToConversion: prediction.estimatedTimeToConversion,
          factors: JSON.stringify(prediction.factors),
          suggestedActions: JSON.stringify(prediction.suggestedActions)
        }
      });

      return {
        success: true,
        data: {
          prediction: {
            ...conversionPrediction,
            factors: JSON.parse(conversionPrediction.factors),
            suggestedActions: JSON.parse(conversionPrediction.suggestedActions)
          }
        }
      };
    } catch (error) {
      logger.error('Error in generateConversionPrediction:', error);
      throw error;
    }
  }

  /**
   * Obtém previsão de conversão de um lead
   */
  async getConversionPrediction(leadId) {
    try {
      const predictions = await prisma.conversionPrediction.findMany({
        where: { leadId },
        orderBy: { lastUpdated: 'desc' },
        take: 1,
        include: {
          lead: {
            select: { id: true, name: true, status: true }
          }
        }
      });

      if (predictions.length === 0) {
        throw new Error('Previsão de conversão não encontrada para este lead');
      }

      const prediction = predictions[0];

      return {
        success: true,
        data: {
          prediction: {
            ...prediction,
            factors: JSON.parse(prediction.factors),
            suggestedActions: JSON.parse(prediction.suggestedActions)
          }
        }
      };
    } catch (error) {
      logger.error('Error in getConversionPrediction:', error);
      throw error;
    }
  }

  /**
   * Detecta leads duplicados
   */
  async detectDuplicateLeads(leadId) {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId }
      });

      if (!lead) {
        throw new Error('Lead não encontrado');
      }

      // Buscar potenciais duplicatas baseado em telefone, email ou nome similar
      const potentialDuplicates = await prisma.lead.findMany({
        where: {
          AND: [
            { id: { not: leadId } },
            {
              OR: [
                { phone: lead.phone },
                { email: lead.email },
                { name: { contains: lead.name.split(' ')[0] } }
              ]
            }
          ]
        }
      });

      const duplicates = potentialDuplicates.map(duplicate => ({
        id: duplicate.id,
        name: duplicate.name,
        phone: duplicate.phone,
        email: duplicate.email,
        similarity: this._calculateSimilarity(lead, duplicate),
        reasons: this._getDuplicateReasons(lead, duplicate)
      }));

      // Salvar detecção de duplicatas
      if (duplicates.length > 0) {
        await prisma.duplicateDetection.create({
          data: {
            leadId,
            potentialDuplicates: JSON.stringify(duplicates),
            confidence: Math.max(...duplicates.map(d => d.similarity))
          }
        });
      }

      return {
        success: true,
        data: {
          duplicates,
          hasDuplicates: duplicates.length > 0,
          highConfidenceDuplicates: duplicates.filter(d => d.similarity > 0.8)
        }
      };
    } catch (error) {
      logger.error('Error in detectDuplicateLeads:', error);
      throw error;
    }
  }

  /**
   * Obtém insights de IA para o dashboard
   */
  async getAIInsights(period = 'week') {
    try {
      const periodMap = {
        'day': 1,
        'week': 7,
        'month': 30,
        'quarter': 90
      };

      const days = periodMap[period] || 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Estatísticas gerais
      const totalLeads = await prisma.lead.count();
      const analyzedLeads = await prisma.aIAnalysis.count();
      const scoredLeads = await prisma.leadScoring.count();
      const predictedLeads = await prisma.conversionPrediction.count();

      // Distribuição de sentimentos
      const sentimentDistribution = await prisma.aIAnalysis.groupBy({
        by: ['sentiment'],
        _count: true,
        where: {
          lastAnalyzed: { gte: startDate }
        }
      });

      // Top tópicos
      const topTopics = await this._getTopTopics(startDate);

      // Previsões de alta conversão
      const highConversionLeads = await prisma.conversionPrediction.findMany({
        where: {
          probability: { gte: 0.7 },
          lastUpdated: { gte: startDate }
        },
        include: {
          lead: {
            select: { id: true, name: true, status: true }
          }
        },
        orderBy: { probability: 'desc' },
        take: 10
      });

      return {
        success: true,
        data: {
          insights: {
            period,
            analytics: {
              totalLeads,
              analyzedLeads,
              scoredLeads,
              predictedLeads,
              analysisRate: ((analyzedLeads / totalLeads) * 100).toFixed(2)
            },
            sentimentDistribution: sentimentDistribution.map(item => ({
              sentiment: item.sentiment,
              count: item._count,
              percentage: ((item._count / analyzedLeads) * 100).toFixed(2)
            })),
            topTopics,
            highConversionLeads: highConversionLeads.map(pred => ({
              lead: pred.lead,
              probability: pred.probability,
              confidence: pred.confidence
            }))
          }
        }
      };
    } catch (error) {
      logger.error('Error in getAIInsights:', error);
      throw error;
    }
  }

  /**
   * Processa análise de IA em lote
   */
  async processAIAnalysisBatch(leadIds, analysisTypes) {
    try {
      const jobData = {
        leadIds,
        analysisTypes,
        status: 'PENDING',
        createdAt: new Date()
      };

      // Criar job em background
      const job = await prisma.backgroundJob.create({
        data: {
          type: 'AI_ANALYSIS_BATCH',
          name: `Análise IA em lote - ${leadIds.length} leads`,
          data: JSON.stringify(jobData),
          priority: 3
        }
      });

      return {
        success: true,
        data: {
          jobId: job.id,
          leadCount: leadIds.length,
          analysisTypes,
          estimatedTime: leadIds.length * 2 // 2 segundos por lead
        }
      };
    } catch (error) {
      logger.error('Error in processAIAnalysisBatch:', error);
      throw error;
    }
  }

  /**
   * Obtém recomendações de IA para um lead
   */
  async getLeadRecommendations(leadId) {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: {
          aiAnalysis: true,
          leadScoring: true,
          conversionPredictions: {
            orderBy: { lastUpdated: 'desc' },
            take: 1
          }
        }
      });

      if (!lead) {
        throw new Error('Lead não encontrado');
      }

      const recommendations = this._generateRecommendations(lead);

      return {
        success: true,
        data: {
          recommendations,
          basedon: {
            hasAIAnalysis: !!lead.aiAnalysis,
            hasScoring: !!lead.leadScoring,
            hasPrediction: lead.conversionPredictions.length > 0
          }
        }
      };
    } catch (error) {
      logger.error('Error in getLeadRecommendations:', error);
      throw error;
    }
  }

  // ==========================================
  // MÉTODOS PRIVADOS - SIMULAÇÃO DE IA
  // ==========================================

  /**
   * Simula análise de sentimento usando IA
   */
  _simulateAISentimentAnalysis(textData, lead) {
    // Simular análise baseada em palavras-chave e padrões
    const positiveWords = ['interessado', 'comprar', 'urgente', 'aprovado', 'sim', 'perfeito'];
    const negativeWords = ['não', 'caro', 'problema', 'reclamação', 'cancelar', 'impossível'];
    const urgentWords = ['urgente', 'imediato', 'hoje', 'agora', 'pressa'];

    const text = textData.toLowerCase();

    let sentimentScore = 0.5; // neutro

    positiveWords.forEach(word => {
      if (text.includes(word)) sentimentScore += 0.1;
    });

    negativeWords.forEach(word => {
      if (text.includes(word)) sentimentScore -= 0.1;
    });

    sentimentScore = Math.max(0, Math.min(1, sentimentScore));

    const sentiment = sentimentScore > 0.6 ? 'POSITIVE' :
                     sentimentScore < 0.4 ? 'NEGATIVE' : 'NEUTRAL';

    const urgencyLevel = urgentWords.some(word => text.includes(word)) ? 'HIGH' :
                        lead.priority === 'HIGH' ? 'MEDIUM' : 'LOW';

    const keyTopics = this._extractKeyTopics(text);
    const recommendations = this._generateAIRecommendations(sentiment, urgencyLevel, lead);

    return {
      sentimentScore,
      sentiment,
      urgencyLevel,
      confidenceScore: 0.75 + Math.random() * 0.2, // 75-95%
      keyTopics,
      recommendations
    };
  }

  /**
   * Calcula scoring de lead
   */
  _calculateLeadScoring(lead) {
    let demographicScore = 0;
    let behaviorScore = 0;
    let engagementScore = 0;
    let sourceScore = 0;

    // Score demográfico
    if (lead.email) demographicScore += 20;
    if (lead.phone) demographicScore += 20;
    if (lead.name && lead.name.length > 5) demographicScore += 10;

    // Score comportamental
    behaviorScore += Math.min(lead.notes.length * 5, 30);
    behaviorScore += Math.min(lead.interactions.length * 10, 40);

    // Score de engajamento
    const recentCommunications = lead.communications.filter(
      comm => new Date(comm.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;
    engagementScore += Math.min(recentCommunications * 15, 45);
    engagementScore += lead.tags.length * 5;

    // Score de fonte
    const sourceScores = {
      'website': 20,
      'referral': 30,
      'social': 15,
      'ads': 10,
      'direct': 25
    };
    sourceScore = sourceScores[lead.source] || 10;

    const totalScore = demographicScore + behaviorScore + engagementScore + sourceScore;

    return {
      totalScore,
      demographicScore,
      behaviorScore,
      engagementScore,
      sourceScore,
      factors: {
        demographic: { score: demographicScore, factors: ['email', 'phone', 'name'] },
        behavior: { score: behaviorScore, factors: ['notes', 'interactions'] },
        engagement: { score: engagementScore, factors: ['communications', 'tags'] },
        source: { score: sourceScore, factors: ['source_quality'] }
      }
    };
  }

  /**
   * Gera previsão de conversão
   */
  _generateConversionPrediction(lead) {
    let probability = 0.3; // base 30%

    // Fatores que aumentam probabilidade
    if (lead.leadScoring?.totalScore > 80) probability += 0.3;
    if (lead.aiAnalysis?.sentiment === 'POSITIVE') probability += 0.2;
    if (lead.aiAnalysis?.urgencyLevel === 'HIGH') probability += 0.15;
    if (lead.interactions.length > 3) probability += 0.1;
    if (lead.tags.some(t => t.tag.name.includes('qualificado'))) probability += 0.15;

    probability = Math.min(probability, 0.95);

    const estimatedDays = probability > 0.7 ? 7 : probability > 0.5 ? 14 : 30;

    return {
      probability: parseFloat(probability.toFixed(2)),
      confidence: 0.8 + Math.random() * 0.15,
      estimatedTimeToConversion: estimatedDays,
      factors: [
        { name: 'Lead Score', impact: lead.leadScoring?.totalScore || 0 },
        { name: 'Sentimento', impact: lead.aiAnalysis?.sentiment || 'NEUTRAL' },
        { name: 'Urgência', impact: lead.aiAnalysis?.urgencyLevel || 'MEDIUM' },
        { name: 'Interações', impact: lead.interactions.length }
      ],
      suggestedActions: this._getSuggestedActions(probability, lead)
    };
  }

  /**
   * Calcula similaridade entre leads
   */
  _calculateSimilarity(lead1, lead2) {
    let similarity = 0;

    if (lead1.phone === lead2.phone) similarity += 0.4;
    if (lead1.email === lead2.email) similarity += 0.4;

    const name1 = lead1.name.toLowerCase();
    const name2 = lead2.name.toLowerCase();
    if (name1 === name2) similarity += 0.3;
    else if (name1.includes(name2.split(' ')[0]) || name2.includes(name1.split(' ')[0])) similarity += 0.15;

    return Math.min(similarity, 1.0);
  }

  /**
   * Métodos auxiliares
   */
  _extractKeyTopics(text) {
    const topics = ['produto', 'preço', 'entrega', 'suporte', 'pagamento', 'contrato'];
    return topics.filter(topic => text.includes(topic));
  }

  _generateAIRecommendations(sentiment, urgency, lead) {
    const recommendations = [];

    if (sentiment === 'POSITIVE') {
      recommendations.push('Acelerar processo de fechamento');
    }
    if (urgency === 'HIGH') {
      recommendations.push('Priorizar contato imediato');
    }
    if (lead.interactions.length === 0) {
      recommendations.push('Realizar primeira interação');
    }

    return recommendations;
  }

  _getDuplicateReasons(lead1, lead2) {
    const reasons = [];
    if (lead1.phone === lead2.phone) reasons.push('Mesmo telefone');
    if (lead1.email === lead2.email) reasons.push('Mesmo email');
    if (lead1.name.toLowerCase() === lead2.name.toLowerCase()) reasons.push('Mesmo nome');
    return reasons;
  }

  _getSuggestedActions(probability, lead) {
    const actions = [];

    if (probability > 0.7) {
      actions.push('Acelerar processo de fechamento', 'Preparar proposta comercial');
    } else if (probability > 0.5) {
      actions.push('Agendar reunião de apresentação', 'Enviar material complementar');
    } else {
      actions.push('Qualificar necessidades', 'Nutrição com conteúdo educativo');
    }

    return actions;
  }

  _generateRecommendations(lead) {
    const recommendations = [];

    if (lead.aiAnalysis?.sentiment === 'POSITIVE') {
      recommendations.push({
        type: 'action',
        priority: 'HIGH',
        title: 'Lead com sentimento positivo',
        description: 'Acelere o processo de fechamento, este lead demonstra interesse'
      });
    }

    if (lead.leadScoring?.totalScore > 80) {
      recommendations.push({
        type: 'priority',
        priority: 'HIGH',
        title: 'Lead altamente qualificado',
        description: 'Score alto - priorize este lead nas suas atividades'
      });
    }

    if (lead.conversionPredictions[0]?.probability > 0.7) {
      recommendations.push({
        type: 'opportunity',
        priority: 'MEDIUM',
        title: 'Alta probabilidade de conversão',
        description: 'Prepare uma proposta comercial personalizada'
      });
    }

    return recommendations;
  }

  async _getTopTopics(startDate) {
    // Simulação de top tópicos
    return [
      { topic: 'preço', mentions: 45 },
      { topic: 'produto', mentions: 38 },
      { topic: 'entrega', mentions: 22 },
      { topic: 'suporte', mentions: 15 }
    ];
  }

  async updateAISettings(settings) {
    // Implementar salvamento de configurações de IA
    return { success: true, data: { settings } };
  }

  async getAIPerformanceStats(period) {
    // Implementar estatísticas de performance da IA
    return {
      success: true,
      data: {
        period,
        accuracy: 0.85,
        predictions: 150,
        correctPredictions: 127
      }
    };
  }
}

module.exports = new AIService();