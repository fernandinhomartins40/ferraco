# FASE 10 - IA E ANALYTICS AVANÇADOS

## 📋 VISÃO GERAL

Esta fase implementa os módulos avançados de IA e Analytics do CRM:
- **IA Analytics**: Análise de sentimento, predição de conversão, insights preditivos
- **Chatbot IA**: Conversação inteligente com GPT-4, qualificação automática
- **Lead Scoring Automático**: Pontuação inteligente baseada em ML
- **Detecção de Duplicatas**: Algoritmos avançados de similaridade
- **Recomendações Inteligentes**: Sistema de recomendações baseado em histórico

**Duração Estimada**: 3 semanas (12-15 dias úteis)

---

## 🎯 OBJETIVOS DA FASE

- ✅ Integração completa com OpenAI GPT-4 API
- ✅ Sistema de chatbot com context management
- ✅ Análise de sentimento em tempo real
- ✅ Predição de conversão com ML
- ✅ Detecção inteligente de duplicatas
- ✅ Lead scoring automático
- ✅ Sistema de recomendações personalizadas
- ✅ Validações com Zod sem usar `any`
- ✅ Testes unitários com 90% de coverage

---

## 📦 MÓDULO 1: IA ANALYTICS

### 1.1 Endpoints (8 total)

```typescript
// Análise de Sentimento
POST   /api/ai/sentiment/analyze              // Analisar sentimento de texto
POST   /api/ai/sentiment/batch                // Análise em lote
GET    /api/ai/sentiment/history/:leadId      // Histórico de sentimentos

// Predição de Conversão
POST   /api/ai/conversion/predict             // Predizer conversão de lead
GET    /api/ai/conversion/probability/:leadId // Probabilidade de conversão
POST   /api/ai/conversion/batch               // Predição em lote

// Insights e Recomendações
GET    /api/ai/insights/:leadId               // Insights do lead
GET    /api/ai/recommendations/:leadId        // Recomendações de ações
GET    /api/ai/trends                         // Tendências do pipeline
GET    /api/ai/anomalies                      // Detecção de anomalias

// Lead Scoring Automático
POST   /api/ai/scoring/calculate              // Calcular score
POST   /api/ai/scoring/recalculate-all        // Recalcular todos os scores
GET    /api/ai/scoring/factors/:leadId        // Fatores que afetam o score
```

### 1.2 Tipos TypeScript

**ai-analytics.types.ts**:
```typescript
import { Lead, LeadStatus, LeadPriority } from '@prisma/client';

// ============================================================================
// SENTIMENT ANALYSIS TYPES
// ============================================================================

export enum SentimentType {
  VERY_NEGATIVE = 'VERY_NEGATIVE',
  NEGATIVE = 'NEGATIVE',
  NEUTRAL = 'NEUTRAL',
  POSITIVE = 'POSITIVE',
  VERY_POSITIVE = 'VERY_POSITIVE',
}

export interface SentimentScore {
  overall: number; // -1 a 1
  polarity: SentimentType;
  confidence: number; // 0 a 1
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
  };
}

export interface SentimentAnalysisDTO {
  text: string;
  leadId?: string;
  context?: 'email' | 'note' | 'chat' | 'call';
}

export interface SentimentAnalysisResult {
  id: string;
  leadId?: string;
  text: string;
  sentiment: SentimentScore;
  keywords: string[];
  topics: string[];
  context?: string;
  analyzedAt: Date;
}

export interface BatchSentimentDTO {
  items: Array<{
    id: string;
    text: string;
    leadId?: string;
  }>;
}

export interface BatchSentimentResult {
  results: SentimentAnalysisResult[];
  summary: {
    totalAnalyzed: number;
    avgSentiment: number;
    distribution: Record<SentimentType, number>;
  };
}

// ============================================================================
// CONVERSION PREDICTION TYPES
// ============================================================================

export interface ConversionPredictionDTO {
  leadId: string;
  includeFactors?: boolean;
}

export interface ConversionFactor {
  factor: string;
  impact: number; // -1 a 1
  description: string;
  weight: number; // 0 a 1
}

export interface ConversionPrediction {
  leadId: string;
  probability: number; // 0 a 1
  confidence: number; // 0 a 1
  predictedStatus: LeadStatus;
  estimatedDaysToConvert: number;
  factors: ConversionFactor[];
  recommendations: string[];
  calculatedAt: Date;
}

export interface BatchConversionDTO {
  leadIds: string[];
  includeFactors?: boolean;
}

export interface BatchConversionResult {
  predictions: ConversionPrediction[];
  summary: {
    totalAnalyzed: number;
    avgProbability: number;
    highProbabilityCount: number; // > 0.7
    mediumProbabilityCount: number; // 0.3 - 0.7
    lowProbabilityCount: number; // < 0.3
  };
}

// ============================================================================
// INSIGHTS & RECOMMENDATIONS TYPES
// ============================================================================

export enum InsightType {
  OPPORTUNITY = 'OPPORTUNITY',
  WARNING = 'WARNING',
  TREND = 'TREND',
  ANOMALY = 'ANOMALY',
}

export enum InsightPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface LeadInsight {
  id: string;
  type: InsightType;
  priority: InsightPriority;
  title: string;
  description: string;
  data: Record<string, unknown>;
  actionable: boolean;
  suggestedActions: string[];
  createdAt: Date;
}

export interface LeadInsightsResponse {
  leadId: string;
  insights: LeadInsight[];
  summary: {
    totalInsights: number;
    criticalCount: number;
    opportunitiesCount: number;
    warningsCount: number;
  };
}

export interface LeadRecommendation {
  id: string;
  type: 'action' | 'communication' | 'timing' | 'content';
  priority: InsightPriority;
  title: string;
  description: string;
  rationale: string;
  expectedImpact: number; // 0 a 1
  confidence: number; // 0 a 1
  estimatedEffort: 'low' | 'medium' | 'high';
  createdAt: Date;
}

export interface RecommendationsResponse {
  leadId: string;
  recommendations: LeadRecommendation[];
  nextBestAction: LeadRecommendation;
}

// ============================================================================
// TRENDS & ANOMALIES TYPES
// ============================================================================

export interface TrendDataPoint {
  date: Date;
  value: number;
  label: string;
}

export interface Trend {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  changePercentage: number;
  currentValue: number;
  previousValue: number;
  dataPoints: TrendDataPoint[];
  significance: 'low' | 'medium' | 'high';
}

export interface TrendsResponse {
  period: {
    start: Date;
    end: Date;
  };
  trends: Trend[];
  highlights: string[];
}

export interface Anomaly {
  id: string;
  type: 'spike' | 'drop' | 'pattern_break' | 'outlier';
  metric: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedValue: number;
  expectedValue: number;
  deviation: number;
  detectedAt: Date;
  possibleCauses: string[];
  suggestedActions: string[];
}

export interface AnomaliesResponse {
  anomalies: Anomaly[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

// ============================================================================
// LEAD SCORING TYPES
// ============================================================================

export interface ScoringFactors {
  demographic: number; // 0-25 pontos
  behavioral: number; // 0-25 pontos
  engagement: number; // 0-25 pontos
  fit: number; // 0-25 pontos
}

export interface ScoringBreakdown {
  totalScore: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  factors: ScoringFactors;
  details: {
    factor: string;
    score: number;
    maxScore: number;
    weight: number;
    description: string;
  }[];
  improvementSuggestions: string[];
}

export interface CalculateScoringDTO {
  leadId: string;
  includeBreakdown?: boolean;
}

export interface ScoringResult {
  leadId: string;
  score: number;
  previousScore?: number;
  change?: number;
  breakdown?: ScoringBreakdown;
  calculatedAt: Date;
}

export interface RecalculateAllScoringDTO {
  filters?: {
    status?: LeadStatus[];
    assignedToId?: string;
    updatedAfter?: Date;
  };
}

export interface RecalculateAllResult {
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  averageScore: number;
  scoreDistribution: Record<string, number>;
  processingTime: number;
}
```

### 1.3 Validações Zod

**ai-analytics.validators.ts**:
```typescript
import { z } from 'zod';
import { LeadStatus } from '@prisma/client';

// ============================================================================
// SENTIMENT ANALYSIS VALIDATORS
// ============================================================================

export const SentimentAnalysisSchema = z.object({
  text: z.string()
    .min(10, 'Texto deve ter no mínimo 10 caracteres')
    .max(5000, 'Texto deve ter no máximo 5000 caracteres'),

  leadId: z.string()
    .cuid('ID de lead inválido')
    .optional(),

  context: z.enum(['email', 'note', 'chat', 'call'])
    .optional(),
});

export const BatchSentimentSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().cuid(),
      text: z.string().min(10).max(5000),
      leadId: z.string().cuid().optional(),
    })
  )
    .min(1, 'Ao menos um item deve ser fornecido')
    .max(100, 'Máximo de 100 itens por lote'),
});

// ============================================================================
// CONVERSION PREDICTION VALIDATORS
// ============================================================================

export const ConversionPredictionSchema = z.object({
  leadId: z.string().cuid('ID de lead inválido'),
  includeFactors: z.boolean().default(true),
});

export const BatchConversionSchema = z.object({
  leadIds: z.array(z.string().cuid())
    .min(1, 'Ao menos um lead deve ser fornecido')
    .max(100, 'Máximo de 100 leads por lote'),
  includeFactors: z.boolean().default(false),
});

// ============================================================================
// SCORING VALIDATORS
// ============================================================================

export const CalculateScoringSchema = z.object({
  leadId: z.string().cuid('ID de lead inválido'),
  includeBreakdown: z.boolean().default(true),
});

export const RecalculateAllScoringSchema = z.object({
  filters: z.object({
    status: z.array(z.nativeEnum(LeadStatus)).optional(),
    assignedToId: z.string().cuid().optional(),
    updatedAfter: z.string().datetime().optional(),
  }).optional(),
});

// ============================================================================
// INSIGHTS & TRENDS VALIDATORS
// ============================================================================

export const TrendsQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
  metrics: z.array(
    z.enum(['leads', 'conversions', 'revenue', 'engagement'])
  ).optional(),
});

export const AnomaliesQuerySchema = z.object({
  severity: z.array(
    z.enum(['low', 'medium', 'high', 'critical'])
  ).optional(),
  limit: z.number().int().positive().max(100).default(20),
});
```

### 1.4 Service Layer - OpenAI Integration

**openai.service.ts**:
```typescript
import OpenAI from 'openai';
import { SentimentScore, ConversionFactor } from './ai-analytics.types';

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export class OpenAIService {
  private client: OpenAI;
  private config: OpenAIConfig;

  constructor(config: OpenAIConfig) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey,
    });
  }

  /**
   * Análise de sentimento usando GPT-4
   */
  async analyzeSentiment(text: string): Promise<SentimentScore> {
    const prompt = `Analise o sentimento do seguinte texto e retorne um JSON com a seguinte estrutura:
{
  "overall": (número de -1 a 1, onde -1 é muito negativo e 1 é muito positivo),
  "polarity": "VERY_NEGATIVE" | "NEGATIVE" | "NEUTRAL" | "POSITIVE" | "VERY_POSITIVE",
  "confidence": (número de 0 a 1 indicando a confiança na análise),
  "emotions": {
    "joy": (0 a 1),
    "sadness": (0 a 1),
    "anger": (0 a 1),
    "fear": (0 a 1),
    "surprise": (0 a 1)
  }
}

Texto para análise:
${text}`;

    const response = await this.client.chat.completions.create({
      model: this.config.model,
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em análise de sentimento. Responda apenas com JSON válido.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Resposta vazia da API OpenAI');
    }

    const result = JSON.parse(content) as SentimentScore;
    return result;
  }

  /**
   * Extração de keywords e topics
   */
  async extractKeywordsAndTopics(text: string): Promise<{
    keywords: string[];
    topics: string[];
  }> {
    const prompt = `Extraia as palavras-chave mais importantes e os tópicos principais do seguinte texto.
Retorne um JSON com esta estrutura:
{
  "keywords": ["palavra1", "palavra2", ...],
  "topics": ["tópico1", "tópico2", ...]
}

Texto:
${text}`;

    const response = await this.client.chat.completions.create({
      model: this.config.model,
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em análise de texto e NLP. Responda apenas com JSON válido.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Resposta vazia da API OpenAI');
    }

    return JSON.parse(content) as { keywords: string[]; topics: string[] };
  }

  /**
   * Predição de conversão com fatores
   */
  async predictConversion(leadData: {
    name: string;
    email?: string;
    phone: string;
    company?: string;
    status: string;
    priority: string;
    score: number;
    source?: string;
    createdAt: Date;
    lastContactedAt?: Date;
    notesCount: number;
    emailsSentCount: number;
    engagementScore: number;
  }): Promise<{
    probability: number;
    factors: ConversionFactor[];
    recommendations: string[];
  }> {
    const prompt = `Analise os dados do lead abaixo e preveja a probabilidade de conversão.
Retorne um JSON com esta estrutura:
{
  "probability": (número de 0 a 1),
  "factors": [
    {
      "factor": "nome do fator",
      "impact": (número de -1 a 1),
      "description": "descrição do impacto",
      "weight": (número de 0 a 1)
    }
  ],
  "recommendations": ["recomendação 1", "recomendação 2", ...]
}

Dados do lead:
${JSON.stringify(leadData, null, 2)}`;

    const response = await this.client.chat.completions.create({
      model: this.config.model,
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em análise de leads e predição de vendas. Analise os dados e forneça insights acionáveis. Responda apenas com JSON válido.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Resposta vazia da API OpenAI');
    }

    return JSON.parse(content);
  }

  /**
   * Geração de insights personalizados
   */
  async generateInsights(leadData: {
    name: string;
    status: string;
    score: number;
    recentActivities: string[];
    sentimentHistory: number[];
    conversionProbability: number;
  }): Promise<{
    insights: Array<{
      type: string;
      priority: string;
      title: string;
      description: string;
      suggestedActions: string[];
    }>;
  }> {
    const prompt = `Com base nos dados do lead abaixo, gere insights estratégicos.
Retorne um JSON com esta estrutura:
{
  "insights": [
    {
      "type": "OPPORTUNITY" | "WARNING" | "TREND" | "ANOMALY",
      "priority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "title": "título curto do insight",
      "description": "descrição detalhada",
      "suggestedActions": ["ação 1", "ação 2"]
    }
  ]
}

Dados do lead:
${JSON.stringify(leadData, null, 2)}`;

    const response = await this.client.chat.completions.create({
      model: this.config.model,
      messages: [
        {
          role: 'system',
          content: 'Você é um consultor de vendas especializado em análise de leads. Forneça insights acionáveis e estratégicos. Responda apenas com JSON válido.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Resposta vazia da API OpenAI');
    }

    return JSON.parse(content);
  }

  /**
   * Geração de recomendações de ações
   */
  async generateRecommendations(leadData: {
    name: string;
    status: string;
    score: number;
    daysSinceLastContact: number;
    engagementLevel: string;
    conversionProbability: number;
  }): Promise<{
    recommendations: Array<{
      type: string;
      priority: string;
      title: string;
      description: string;
      rationale: string;
      expectedImpact: number;
      confidence: number;
      estimatedEffort: string;
    }>;
    nextBestAction: {
      type: string;
      priority: string;
      title: string;
      description: string;
      rationale: string;
      expectedImpact: number;
      confidence: number;
      estimatedEffort: string;
    };
  }> {
    const prompt = `Com base nos dados do lead, gere recomendações de ações priorizadas.
Retorne um JSON com esta estrutura:
{
  "recommendations": [
    {
      "type": "action" | "communication" | "timing" | "content",
      "priority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "title": "título da recomendação",
      "description": "descrição detalhada",
      "rationale": "justificativa",
      "expectedImpact": (0 a 1),
      "confidence": (0 a 1),
      "estimatedEffort": "low" | "medium" | "high"
    }
  ],
  "nextBestAction": { ...mesma estrutura da recomendação mais importante... }
}

Dados do lead:
${JSON.stringify(leadData, null, 2)}`;

    const response = await this.client.chat.completions.create({
      model: this.config.model,
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em estratégia de vendas. Forneça recomendações práticas e acionáveis. Responda apenas com JSON válido.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.6,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Resposta vazia da API OpenAI');
    }

    return JSON.parse(content);
  }
}
```

### 1.5 Service Layer - AI Analytics

**ai-analytics.service.ts**:
```typescript
import { PrismaClient, Lead, LeadStatus } from '@prisma/client';
import { OpenAIService } from './openai.service';
import {
  SentimentAnalysisDTO,
  SentimentAnalysisResult,
  BatchSentimentDTO,
  BatchSentimentResult,
  ConversionPredictionDTO,
  ConversionPrediction,
  BatchConversionDTO,
  BatchConversionResult,
  LeadInsightsResponse,
  RecommendationsResponse,
  TrendsResponse,
  AnomaliesResponse,
  CalculateScoringDTO,
  ScoringResult,
  RecalculateAllScoringDTO,
  RecalculateAllResult,
  SentimentType,
  InsightType,
  InsightPriority,
} from './ai-analytics.types';

export class AIAnalyticsService {
  constructor(
    private prisma: PrismaClient,
    private openai: OpenAIService
  ) {}

  // ==========================================================================
  // SENTIMENT ANALYSIS
  // ==========================================================================

  async analyzeSentiment(
    data: SentimentAnalysisDTO
  ): Promise<SentimentAnalysisResult> {
    // Análise de sentimento usando OpenAI
    const sentiment = await this.openai.analyzeSentiment(data.text);

    // Extração de keywords e topics
    const { keywords, topics } = await this.openai.extractKeywordsAndTopics(
      data.text
    );

    // Salvar análise no banco (se leadId fornecido)
    if (data.leadId) {
      await this.prisma.sentimentAnalysis.create({
        data: {
          leadId: data.leadId,
          text: data.text,
          sentiment: sentiment.overall,
          polarity: sentiment.polarity,
          confidence: sentiment.confidence,
          emotions: sentiment.emotions as Record<string, unknown>,
          keywords,
          topics,
          context: data.context,
        },
      });
    }

    return {
      id: crypto.randomUUID(),
      leadId: data.leadId,
      text: data.text,
      sentiment,
      keywords,
      topics,
      context: data.context,
      analyzedAt: new Date(),
    };
  }

  async analyzeSentimentBatch(
    data: BatchSentimentDTO
  ): Promise<BatchSentimentResult> {
    const results: SentimentAnalysisResult[] = [];

    // Processar em paralelo (máximo 5 por vez para não sobrecarregar API)
    const batchSize = 5;
    for (let i = 0; i < data.items.length; i += batchSize) {
      const batch = data.items.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(item =>
          this.analyzeSentiment({
            text: item.text,
            leadId: item.leadId,
          })
        )
      );
      results.push(...batchResults);
    }

    // Calcular sumário
    const distribution: Record<SentimentType, number> = {
      VERY_NEGATIVE: 0,
      NEGATIVE: 0,
      NEUTRAL: 0,
      POSITIVE: 0,
      VERY_POSITIVE: 0,
    };

    let totalSentiment = 0;

    results.forEach(result => {
      distribution[result.sentiment.polarity]++;
      totalSentiment += result.sentiment.overall;
    });

    return {
      results,
      summary: {
        totalAnalyzed: results.length,
        avgSentiment: totalSentiment / results.length,
        distribution,
      },
    };
  }

  async getSentimentHistory(leadId: string): Promise<SentimentAnalysisResult[]> {
    const analyses = await this.prisma.sentimentAnalysis.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return analyses.map(analysis => ({
      id: analysis.id,
      leadId: analysis.leadId,
      text: analysis.text,
      sentiment: {
        overall: analysis.sentiment,
        polarity: analysis.polarity as SentimentType,
        confidence: analysis.confidence,
        emotions: analysis.emotions as {
          joy: number;
          sadness: number;
          anger: number;
          fear: number;
          surprise: number;
        },
      },
      keywords: analysis.keywords,
      topics: analysis.topics,
      context: analysis.context || undefined,
      analyzedAt: analysis.createdAt,
    }));
  }

  // ==========================================================================
  // CONVERSION PREDICTION
  // ==========================================================================

  async predictConversion(
    data: ConversionPredictionDTO
  ): Promise<ConversionPrediction> {
    // Buscar dados do lead
    const lead = await this.prisma.lead.findUnique({
      where: { id: data.leadId },
      include: {
        notes: true,
        sentimentAnalyses: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        communications: {
          orderBy: { sentAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!lead) {
      throw new Error('Lead não encontrado');
    }

    // Calcular métricas de engajamento
    const daysSinceCreation = Math.floor(
      (Date.now() - lead.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    const daysSinceLastContact = lead.lastContactedAt
      ? Math.floor(
          (Date.now() - lead.lastContactedAt.getTime()) / (1000 * 60 * 60 * 24)
        )
      : daysSinceCreation;

    const notesCount = lead.notes.length;
    const emailsSentCount = lead.communications.filter(
      c => c.channel === 'EMAIL'
    ).length;

    const avgSentiment =
      lead.sentimentAnalyses.length > 0
        ? lead.sentimentAnalyses.reduce((sum, s) => sum + s.sentiment, 0) /
          lead.sentimentAnalyses.length
        : 0;

    const engagementScore = this.calculateEngagementScore({
      notesCount,
      emailsSentCount,
      daysSinceLastContact,
      avgSentiment,
    });

    // Usar OpenAI para predição
    const prediction = await this.openai.predictConversion({
      name: lead.name,
      email: lead.email || undefined,
      phone: lead.phone,
      company: lead.company || undefined,
      status: lead.status,
      priority: lead.priority,
      score: lead.score,
      source: lead.source || undefined,
      createdAt: lead.createdAt,
      lastContactedAt: lead.lastContactedAt || undefined,
      notesCount,
      emailsSentCount,
      engagementScore,
    });

    // Determinar status previsto
    const predictedStatus = this.determinePredictedStatus(
      prediction.probability
    );

    // Estimar dias para conversão
    const estimatedDaysToConvert = this.estimateDaysToConvert(
      prediction.probability,
      daysSinceCreation,
      engagementScore
    );

    // Salvar predição
    await this.prisma.conversionPrediction.create({
      data: {
        leadId: data.leadId,
        probability: prediction.probability,
        confidence: 0.8, // Pode ser ajustado
        factors: prediction.factors as Record<string, unknown>[],
        recommendations: prediction.recommendations,
        predictedStatus,
        estimatedDaysToConvert,
      },
    });

    return {
      leadId: data.leadId,
      probability: prediction.probability,
      confidence: 0.8,
      predictedStatus,
      estimatedDaysToConvert,
      factors: data.includeFactors ? prediction.factors : [],
      recommendations: prediction.recommendations,
      calculatedAt: new Date(),
    };
  }

  async predictConversionBatch(
    data: BatchConversionDTO
  ): Promise<BatchConversionResult> {
    const predictions: ConversionPrediction[] = [];

    // Processar em paralelo
    const batchSize = 5;
    for (let i = 0; i < data.leadIds.length; i += batchSize) {
      const batch = data.leadIds.slice(i, i + batchSize);
      const batchPredictions = await Promise.all(
        batch.map(leadId =>
          this.predictConversion({
            leadId,
            includeFactors: data.includeFactors,
          })
        )
      );
      predictions.push(...batchPredictions);
    }

    // Calcular sumário
    const totalAnalyzed = predictions.length;
    const avgProbability =
      predictions.reduce((sum, p) => sum + p.probability, 0) / totalAnalyzed;

    const highProbabilityCount = predictions.filter(p => p.probability > 0.7)
      .length;
    const mediumProbabilityCount = predictions.filter(
      p => p.probability >= 0.3 && p.probability <= 0.7
    ).length;
    const lowProbabilityCount = predictions.filter(p => p.probability < 0.3)
      .length;

    return {
      predictions,
      summary: {
        totalAnalyzed,
        avgProbability,
        highProbabilityCount,
        mediumProbabilityCount,
        lowProbabilityCount,
      },
    };
  }

  async getConversionProbability(leadId: string): Promise<number> {
    const latestPrediction = await this.prisma.conversionPrediction.findFirst({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestPrediction) {
      // Se não houver predição, calcular uma nova
      const prediction = await this.predictConversion({
        leadId,
        includeFactors: false,
      });
      return prediction.probability;
    }

    // Se predição tem mais de 7 dias, recalcular
    const daysSincePrediction = Math.floor(
      (Date.now() - latestPrediction.createdAt.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysSincePrediction > 7) {
      const prediction = await this.predictConversion({
        leadId,
        includeFactors: false,
      });
      return prediction.probability;
    }

    return latestPrediction.probability;
  }

  // ==========================================================================
  // INSIGHTS & RECOMMENDATIONS
  // ==========================================================================

  async getLeadInsights(leadId: string): Promise<LeadInsightsResponse> {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        notes: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        sentimentAnalyses: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        communications: {
          orderBy: { sentAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!lead) {
      throw new Error('Lead não encontrado');
    }

    // Calcular métricas
    const recentActivities = [
      ...lead.notes.slice(0, 5).map(n => `Nota: ${n.content.substring(0, 50)}...`),
      ...lead.communications
        .slice(0, 5)
        .map(c => `${c.channel}: ${c.subject || 'Sem assunto'}`),
    ];

    const sentimentHistory = lead.sentimentAnalyses.map(s => s.sentiment);

    // Buscar ou criar predição de conversão
    const conversionProbability = await this.getConversionProbability(leadId);

    // Gerar insights usando OpenAI
    const { insights: aiInsights } = await this.openai.generateInsights({
      name: lead.name,
      status: lead.status,
      score: lead.score,
      recentActivities,
      sentimentHistory,
      conversionProbability,
    });

    const insights = aiInsights.map((insight, index) => ({
      id: `insight-${leadId}-${index}`,
      type: insight.type as InsightType,
      priority: insight.priority as InsightPriority,
      title: insight.title,
      description: insight.description,
      data: {},
      actionable: insight.suggestedActions.length > 0,
      suggestedActions: insight.suggestedActions,
      createdAt: new Date(),
    }));

    const summary = {
      totalInsights: insights.length,
      criticalCount: insights.filter(i => i.priority === 'CRITICAL').length,
      opportunitiesCount: insights.filter(i => i.type === 'OPPORTUNITY').length,
      warningsCount: insights.filter(i => i.type === 'WARNING').length,
    };

    return {
      leadId,
      insights,
      summary,
    };
  }

  async getLeadRecommendations(
    leadId: string
  ): Promise<RecommendationsResponse> {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      throw new Error('Lead não encontrado');
    }

    const daysSinceLastContact = lead.lastContactedAt
      ? Math.floor(
          (Date.now() - lead.lastContactedAt.getTime()) / (1000 * 60 * 60 * 24)
        )
      : 999;

    const conversionProbability = await this.getConversionProbability(leadId);

    const engagementLevel = this.determineEngagementLevel(lead.score);

    // Gerar recomendações usando OpenAI
    const {
      recommendations: aiRecommendations,
      nextBestAction: aiNextBestAction,
    } = await this.openai.generateRecommendations({
      name: lead.name,
      status: lead.status,
      score: lead.score,
      daysSinceLastContact,
      engagementLevel,
      conversionProbability,
    });

    const recommendations = aiRecommendations.map((rec, index) => ({
      id: `rec-${leadId}-${index}`,
      type: rec.type as 'action' | 'communication' | 'timing' | 'content',
      priority: rec.priority as InsightPriority,
      title: rec.title,
      description: rec.description,
      rationale: rec.rationale,
      expectedImpact: rec.expectedImpact,
      confidence: rec.confidence,
      estimatedEffort: rec.estimatedEffort as 'low' | 'medium' | 'high',
      createdAt: new Date(),
    }));

    const nextBestAction = {
      id: `nba-${leadId}`,
      type: aiNextBestAction.type as 'action' | 'communication' | 'timing' | 'content',
      priority: aiNextBestAction.priority as InsightPriority,
      title: aiNextBestAction.title,
      description: aiNextBestAction.description,
      rationale: aiNextBestAction.rationale,
      expectedImpact: aiNextBestAction.expectedImpact,
      confidence: aiNextBestAction.confidence,
      estimatedEffort: aiNextBestAction.estimatedEffort as 'low' | 'medium' | 'high',
      createdAt: new Date(),
    };

    return {
      leadId,
      recommendations,
      nextBestAction,
    };
  }

  // ==========================================================================
  // TRENDS & ANOMALIES
  // ==========================================================================

  async getTrends(period: '7d' | '30d' | '90d' | '1y'): Promise<TrendsResponse> {
    const daysMap = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
    };

    const days = daysMap[period];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const endDate = new Date();

    // Buscar dados de leads
    const leads = await this.prisma.lead.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Agrupar por data
    const leadsPerDay = new Map<string, number>();
    leads.forEach(lead => {
      const dateKey = lead.createdAt.toISOString().split('T')[0];
      leadsPerDay.set(dateKey, (leadsPerDay.get(dateKey) || 0) + 1);
    });

    // Criar data points
    const dataPoints = Array.from(leadsPerDay.entries()).map(([date, count]) => ({
      date: new Date(date),
      value: count,
      label: date,
    }));

    // Calcular tendência
    const values = dataPoints.map(dp => dp.value);
    const avgFirstHalf =
      values.slice(0, Math.floor(values.length / 2)).reduce((a, b) => a + b, 0) /
      Math.floor(values.length / 2);
    const avgSecondHalf =
      values.slice(Math.floor(values.length / 2)).reduce((a, b) => a + b, 0) /
      (values.length - Math.floor(values.length / 2));

    const changePercentage = ((avgSecondHalf - avgFirstHalf) / avgFirstHalf) * 100;

    const direction =
      changePercentage > 5 ? 'up' : changePercentage < -5 ? 'down' : 'stable';

    const significance =
      Math.abs(changePercentage) > 20
        ? 'high'
        : Math.abs(changePercentage) > 10
        ? 'medium'
        : 'low';

    const trends = [
      {
        metric: 'Novos Leads',
        direction,
        changePercentage,
        currentValue: avgSecondHalf,
        previousValue: avgFirstHalf,
        dataPoints,
        significance,
      },
    ];

    const highlights = [
      `${direction === 'up' ? 'Aumento' : direction === 'down' ? 'Diminuição' : 'Estabilidade'} de ${Math.abs(changePercentage).toFixed(1)}% nos novos leads`,
    ];

    return {
      period: {
        start: startDate,
        end: endDate,
      },
      trends,
      highlights,
    };
  }

  async getAnomalies(
    severity?: Array<'low' | 'medium' | 'high' | 'critical'>,
    limit: number = 20
  ): Promise<AnomaliesResponse> {
    // Buscar métricas históricas
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const leads = await this.prisma.lead.findMany({
      where: {
        createdAt: { gte: last30Days },
      },
    });

    // Agrupar por dia
    const leadsPerDay = new Map<string, number>();
    leads.forEach(lead => {
      const dateKey = lead.createdAt.toISOString().split('T')[0];
      leadsPerDay.set(dateKey, (leadsPerDay.get(dateKey) || 0) + 1);
    });

    const values = Array.from(leadsPerDay.values());
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        values.length
    );

    const anomalies = [];

    // Detectar anomalias (valores fora de 2 desvios padrão)
    for (const [date, count] of leadsPerDay.entries()) {
      const deviation = Math.abs(count - mean) / stdDev;

      if (deviation > 2) {
        const anomalySeverity: 'low' | 'medium' | 'high' | 'critical' =
          deviation > 4
            ? 'critical'
            : deviation > 3
            ? 'high'
            : deviation > 2.5
            ? 'medium'
            : 'low';

        if (!severity || severity.includes(anomalySeverity)) {
          anomalies.push({
            id: `anomaly-${date}`,
            type: (count > mean ? 'spike' : 'drop') as 'spike' | 'drop',
            metric: 'Novos Leads',
            severity: anomalySeverity,
            description: `${count > mean ? 'Pico' : 'Queda'} de ${Math.abs(count - mean).toFixed(0)} leads em ${date}`,
            detectedValue: count,
            expectedValue: mean,
            deviation,
            detectedAt: new Date(date),
            possibleCauses: [
              'Campanha de marketing',
              'Evento externo',
              'Mudança sazonal',
            ],
            suggestedActions: [
              'Investigar causa raiz',
              'Analisar fonte dos leads',
              'Verificar qualidade',
            ],
          });
        }
      }
    }

    const summary = {
      total: anomalies.length,
      critical: anomalies.filter(a => a.severity === 'critical').length,
      high: anomalies.filter(a => a.severity === 'high').length,
      medium: anomalies.filter(a => a.severity === 'medium').length,
      low: anomalies.filter(a => a.severity === 'low').length,
    };

    return {
      anomalies: anomalies.slice(0, limit),
      summary,
    };
  }

  // ==========================================================================
  // LEAD SCORING
  // ==========================================================================

  async calculateLeadScore(
    data: CalculateScoringDTO
  ): Promise<ScoringResult> {
    const lead = await this.prisma.lead.findUnique({
      where: { id: data.leadId },
      include: {
        notes: true,
        communications: true,
        sentimentAnalyses: true,
      },
    });

    if (!lead) {
      throw new Error('Lead não encontrado');
    }

    const previousScore = lead.score;

    // Calcular score por categoria
    const demographic = this.calculateDemographicScore(lead);
    const behavioral = this.calculateBehavioralScore(lead);
    const engagement = this.calculateEngagementScore({
      notesCount: lead.notes.length,
      emailsSentCount: lead.communications.filter(c => c.channel === 'EMAIL')
        .length,
      daysSinceLastContact: lead.lastContactedAt
        ? Math.floor(
            (Date.now() - lead.lastContactedAt.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 999,
      avgSentiment:
        lead.sentimentAnalyses.length > 0
          ? lead.sentimentAnalyses.reduce((sum, s) => sum + s.sentiment, 0) /
            lead.sentimentAnalyses.length
          : 0,
    });
    const fit = this.calculateFitScore(lead);

    const totalScore = Math.round(demographic + behavioral + engagement + fit);

    const grade =
      totalScore >= 90
        ? 'A'
        : totalScore >= 75
        ? 'B'
        : totalScore >= 60
        ? 'C'
        : totalScore >= 45
        ? 'D'
        : 'F';

    // Atualizar score no banco
    await this.prisma.lead.update({
      where: { id: data.leadId },
      data: { score: totalScore },
    });

    const breakdown = data.includeBreakdown
      ? {
          totalScore,
          grade: grade as 'A' | 'B' | 'C' | 'D' | 'F',
          factors: {
            demographic,
            behavioral,
            engagement,
            fit,
          },
          details: [
            {
              factor: 'Dados Demográficos',
              score: demographic,
              maxScore: 25,
              weight: 0.25,
              description: 'Completude de email, empresa, cargo',
            },
            {
              factor: 'Comportamento',
              score: behavioral,
              maxScore: 25,
              weight: 0.25,
              description: 'Histórico de interações e respostas',
            },
            {
              factor: 'Engajamento',
              score: engagement,
              maxScore: 25,
              weight: 0.25,
              description: 'Frequência e qualidade de interações',
            },
            {
              factor: 'Fit',
              score: fit,
              maxScore: 25,
              weight: 0.25,
              description: 'Alinhamento com perfil ideal',
            },
          ],
          improvementSuggestions: this.generateImprovementSuggestions({
            demographic,
            behavioral,
            engagement,
            fit,
          }),
        }
      : undefined;

    return {
      leadId: data.leadId,
      score: totalScore,
      previousScore,
      change: totalScore - previousScore,
      breakdown,
      calculatedAt: new Date(),
    };
  }

  async recalculateAllScores(
    data: RecalculateAllScoringDTO
  ): Promise<RecalculateAllResult> {
    const startTime = Date.now();

    const where: {
      status?: { in: LeadStatus[] };
      assignedToId?: string;
      updatedAt?: { gte: Date };
    } = {};

    if (data.filters?.status) {
      where.status = { in: data.filters.status };
    }

    if (data.filters?.assignedToId) {
      where.assignedToId = data.filters.assignedToId;
    }

    if (data.filters?.updatedAfter) {
      where.updatedAt = { gte: data.filters.updatedAfter };
    }

    const leads = await this.prisma.lead.findMany({ where });

    let successCount = 0;
    let errorCount = 0;
    const scores: number[] = [];

    for (const lead of leads) {
      try {
        const result = await this.calculateLeadScore({
          leadId: lead.id,
          includeBreakdown: false,
        });
        scores.push(result.score);
        successCount++;
      } catch (error) {
        errorCount++;
      }
    }

    const processingTime = Date.now() - startTime;
    const averageScore =
      scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    // Distribuição por grade
    const scoreDistribution: Record<string, number> = {
      A: scores.filter(s => s >= 90).length,
      B: scores.filter(s => s >= 75 && s < 90).length,
      C: scores.filter(s => s >= 60 && s < 75).length,
      D: scores.filter(s => s >= 45 && s < 60).length,
      F: scores.filter(s => s < 45).length,
    };

    return {
      totalProcessed: leads.length,
      successCount,
      errorCount,
      averageScore,
      scoreDistribution,
      processingTime,
    };
  }

  async getScoringFactors(leadId: string): Promise<{
    factors: Array<{
      factor: string;
      score: number;
      maxScore: number;
      weight: number;
      description: string;
    }>;
  }> {
    const result = await this.calculateLeadScore({
      leadId,
      includeBreakdown: true,
    });

    if (!result.breakdown) {
      throw new Error('Breakdown não disponível');
    }

    return {
      factors: result.breakdown.details,
    };
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  private calculateDemographicScore(lead: Lead): number {
    let score = 0;

    // Email presente (+10)
    if (lead.email) score += 10;

    // Empresa presente (+8)
    if (lead.company) score += 8;

    // Cargo presente (+7)
    if (lead.position) score += 7;

    return Math.min(score, 25);
  }

  private calculateBehavioralScore(lead: Lead): number {
    let score = 0;

    // Status avançado
    const statusScores: Record<string, number> = {
      NOVO: 5,
      QUALIFICADO: 10,
      CONTATO: 15,
      PROPOSTA: 20,
      NEGOCIACAO: 22,
      GANHO: 25,
    };

    score += statusScores[lead.status] || 0;

    return Math.min(score, 25);
  }

  private calculateEngagementScore(data: {
    notesCount: number;
    emailsSentCount: number;
    daysSinceLastContact: number;
    avgSentiment: number;
  }): number {
    let score = 0;

    // Notas (+1 por nota, máx 5)
    score += Math.min(data.notesCount, 5);

    // Emails (+1 por email, máx 5)
    score += Math.min(data.emailsSentCount, 5);

    // Recência de contato
    if (data.daysSinceLastContact <= 7) score += 10;
    else if (data.daysSinceLastContact <= 14) score += 7;
    else if (data.daysSinceLastContact <= 30) score += 4;
    else score += 0;

    // Sentimento médio (+5 pontos máx)
    score += Math.max(0, Math.min(5, (data.avgSentiment + 1) * 2.5));

    return Math.min(score, 25);
  }

  private calculateFitScore(lead: Lead): number {
    let score = 15; // Base score

    // Prioridade
    const priorityScores: Record<string, number> = {
      LOW: 0,
      MEDIUM: 5,
      HIGH: 8,
      URGENT: 10,
    };

    score += priorityScores[lead.priority] || 0;

    return Math.min(score, 25);
  }

  private determinePredictedStatus(probability: number): LeadStatus {
    if (probability > 0.8) return 'GANHO';
    if (probability > 0.6) return 'NEGOCIACAO';
    if (probability > 0.4) return 'PROPOSTA';
    if (probability > 0.2) return 'QUALIFICADO';
    return 'CONTATO';
  }

  private estimateDaysToConvert(
    probability: number,
    daysSinceCreation: number,
    engagementScore: number
  ): number {
    const baseDays = 30;
    const probabilityFactor = 1 - probability;
    const engagementFactor = 1 - engagementScore / 25;

    return Math.round(
      baseDays * probabilityFactor * engagementFactor +
        daysSinceCreation * 0.5
    );
  }

  private determineEngagementLevel(score: number): string {
    if (score >= 80) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  }

  private generateImprovementSuggestions(factors: {
    demographic: number;
    behavioral: number;
    engagement: number;
    fit: number;
  }): string[] {
    const suggestions: string[] = [];

    if (factors.demographic < 20) {
      suggestions.push('Completar dados demográficos (email, empresa, cargo)');
    }

    if (factors.behavioral < 15) {
      suggestions.push('Avançar lead no pipeline para aumentar score comportamental');
    }

    if (factors.engagement < 15) {
      suggestions.push(
        'Aumentar frequência de contatos e interações com o lead'
      );
    }

    if (factors.fit < 15) {
      suggestions.push('Qualificar melhor o lead e ajustar prioridade');
    }

    return suggestions;
  }
}
```

### 1.6 Controller

**ai-analytics.controller.ts**:
```typescript
import { Request, Response, NextFunction } from 'express';
import { AIAnalyticsService } from './ai-analytics.service';
import {
  SentimentAnalysisSchema,
  BatchSentimentSchema,
  ConversionPredictionSchema,
  BatchConversionSchema,
  CalculateScoringSchema,
  RecalculateAllScoringSchema,
  TrendsQuerySchema,
  AnomaliesQuerySchema,
} from './ai-analytics.validators';

export class AIAnalyticsController {
  constructor(private service: AIAnalyticsService) {}

  // ==========================================================================
  // SENTIMENT ANALYSIS
  // ==========================================================================

  analyzeSentiment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data = SentimentAnalysisSchema.parse(req.body);
      const result = await this.service.analyzeSentiment(data);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  analyzeSentimentBatch = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data = BatchSentimentSchema.parse(req.body);
      const result = await this.service.analyzeSentimentBatch(data);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getSentimentHistory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { leadId } = req.params;
      const result = await this.service.getSentimentHistory(leadId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================================================
  // CONVERSION PREDICTION
  // ==========================================================================

  predictConversion = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data = ConversionPredictionSchema.parse(req.body);
      const result = await this.service.predictConversion(data);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  predictConversionBatch = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data = BatchConversionSchema.parse(req.body);
      const result = await this.service.predictConversionBatch(data);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getConversionProbability = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { leadId } = req.params;
      const probability = await this.service.getConversionProbability(leadId);

      res.status(200).json({
        success: true,
        data: { leadId, probability },
      });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================================================
  // INSIGHTS & RECOMMENDATIONS
  // ==========================================================================

  getLeadInsights = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { leadId } = req.params;
      const result = await this.service.getLeadInsights(leadId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getLeadRecommendations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { leadId } = req.params;
      const result = await this.service.getLeadRecommendations(leadId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getTrends = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { period } = TrendsQuerySchema.parse(req.query);
      const result = await this.service.getTrends(
        period as '7d' | '30d' | '90d' | '1y'
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getAnomalies = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { severity, limit } = AnomaliesQuerySchema.parse(req.query);
      const result = await this.service.getAnomalies(
        severity as Array<'low' | 'medium' | 'high' | 'critical'>,
        limit as number
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================================================
  // LEAD SCORING
  // ==========================================================================

  calculateLeadScore = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data = CalculateScoringSchema.parse(req.body);
      const result = await this.service.calculateLeadScore(data);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  recalculateAllScores = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data = RecalculateAllScoringSchema.parse(req.body);
      const result = await this.service.recalculateAllScores(data);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getScoringFactors = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { leadId } = req.params;
      const result = await this.service.getScoringFactors(leadId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
```

### 1.7 Routes

**ai-analytics.routes.ts**:
```typescript
import { Router } from 'express';
import { AIAnalyticsController } from './ai-analytics.controller';
import { AIAnalyticsService } from './ai-analytics.service';
import { OpenAIService } from './openai.service';
import { authenticate, requirePermission } from '../../middleware/auth.middleware';
import { prisma } from '../../config/database';

const router = Router();

// Inicializar OpenAI Service
const openaiService = new OpenAIService({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4-turbo-preview',
  temperature: 0.7,
  maxTokens: 2000,
});

const service = new AIAnalyticsService(prisma, openaiService);
const controller = new AIAnalyticsController(service);

// Todas as rotas requerem autenticação
router.use(authenticate);

// Sentiment Analysis
router.post(
  '/sentiment/analyze',
  requirePermission('ai', 'create'),
  controller.analyzeSentiment
);

router.post(
  '/sentiment/batch',
  requirePermission('ai', 'create'),
  controller.analyzeSentimentBatch
);

router.get(
  '/sentiment/history/:leadId',
  requirePermission('ai', 'read'),
  controller.getSentimentHistory
);

// Conversion Prediction
router.post(
  '/conversion/predict',
  requirePermission('ai', 'create'),
  controller.predictConversion
);

router.post(
  '/conversion/batch',
  requirePermission('ai', 'create'),
  controller.predictConversionBatch
);

router.get(
  '/conversion/probability/:leadId',
  requirePermission('ai', 'read'),
  controller.getConversionProbability
);

// Insights & Recommendations
router.get(
  '/insights/:leadId',
  requirePermission('ai', 'read'),
  controller.getLeadInsights
);

router.get(
  '/recommendations/:leadId',
  requirePermission('ai', 'read'),
  controller.getLeadRecommendations
);

router.get('/trends', requirePermission('ai', 'read'), controller.getTrends);

router.get('/anomalies', requirePermission('ai', 'read'), controller.getAnomalies);

// Lead Scoring
router.post(
  '/scoring/calculate',
  requirePermission('ai', 'create'),
  controller.calculateLeadScore
);

router.post(
  '/scoring/recalculate-all',
  requirePermission('ai', 'create'),
  controller.recalculateAllScores
);

router.get(
  '/scoring/factors/:leadId',
  requirePermission('ai', 'read'),
  controller.getScoringFactors
);

export default router;
```

---

## 📦 MÓDULO 2: CHATBOT IA

### 2.1 Endpoints (5 total)

```typescript
// Sessões de Conversa
POST   /api/chatbot/sessions                  // Criar sessão
GET    /api/chatbot/sessions/:id              // Buscar sessão
DELETE /api/chatbot/sessions/:id              // Encerrar sessão

// Mensagens
POST   /api/chatbot/messages                  // Enviar mensagem
GET    /api/chatbot/messages/:sessionId       // Histórico da sessão

// Qualificação de Leads
POST   /api/chatbot/qualify-lead              // Qualificar lead da sessão
GET    /api/chatbot/qualified-leads           // Listar leads qualificados
```

### 2.2 Tipos TypeScript

**chatbot.types.ts**:
```typescript
export enum MessageRole {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  SYSTEM = 'SYSTEM',
}

export enum Intent {
  GREETING = 'GREETING',
  PRODUCT_INQUIRY = 'PRODUCT_INQUIRY',
  PRICING = 'PRICING',
  SCHEDULING = 'SCHEDULING',
  CONTACT = 'CONTACT',
  COMPLAINT = 'COMPLAINT',
  FAREWELL = 'FAREWELL',
  UNKNOWN = 'UNKNOWN',
}

export interface Entity {
  type: 'product' | 'date' | 'time' | 'location' | 'person' | 'organization';
  value: string;
  confidence: number;
}

export interface ConversationContext {
  leadId?: string;
  intent?: Intent;
  entities: Entity[];
  sentiment: number;
  conversationStage: 'greeting' | 'qualifying' | 'informing' | 'closing';
  capturedData: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    interest?: string;
  };
  metadata: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  intent?: Intent;
  entities: Entity[];
  sentiment?: number;
  createdAt: Date;
}

export interface ChatSession {
  id: string;
  userId?: string;
  leadId?: string;
  context: ConversationContext;
  status: 'active' | 'completed' | 'abandoned';
  startedAt: Date;
  endedAt?: Date;
  messagesCount: number;
  isQualified: boolean;
}

export interface CreateSessionDTO {
  userId?: string;
  initialMessage?: string;
}

export interface SendMessageDTO {
  sessionId: string;
  content: string;
}

export interface ChatbotResponse {
  message: ChatMessage;
  reply: string;
  suggestions?: string[];
  context: ConversationContext;
}

export interface QualifyLeadDTO {
  sessionId: string;
  forceQualification?: boolean;
}

export interface QualifiedLeadResult {
  leadId: string;
  sessionId: string;
  qualificationScore: number;
  capturedData: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    interest?: string;
  };
  conversationSummary: string;
}
```

### 2.3 Service Layer - Chatbot

**chatbot.service.ts**:
```typescript
import { PrismaClient } from '@prisma/client';
import { OpenAIService } from './openai.service';
import {
  CreateSessionDTO,
  SendMessageDTO,
  ChatSession,
  ChatMessage,
  ChatbotResponse,
  QualifyLeadDTO,
  QualifiedLeadResult,
  Intent,
  Entity,
  ConversationContext,
  MessageRole,
} from './chatbot.types';

export class ChatbotService {
  constructor(
    private prisma: PrismaClient,
    private openai: OpenAIService
  ) {}

  /**
   * Criar nova sessão de chat
   */
  async createSession(data: CreateSessionDTO): Promise<ChatSession> {
    const context: ConversationContext = {
      entities: [],
      sentiment: 0,
      conversationStage: 'greeting',
      capturedData: {},
      metadata: {},
    };

    const session = await this.prisma.chatSession.create({
      data: {
        userId: data.userId,
        context: context as Record<string, unknown>,
        status: 'active',
        messagesCount: 0,
        isQualified: false,
      },
    });

    // Se houver mensagem inicial, processar
    if (data.initialMessage) {
      await this.sendMessage({
        sessionId: session.id,
        content: data.initialMessage,
      });
    }

    return this.mapSessionToResponse(session);
  }

  /**
   * Buscar sessão por ID
   */
  async getSession(id: string): Promise<ChatSession | null> {
    const session = await this.prisma.chatSession.findUnique({
      where: { id },
    });

    return session ? this.mapSessionToResponse(session) : null;
  }

  /**
   * Encerrar sessão
   */
  async endSession(id: string): Promise<void> {
    await this.prisma.chatSession.update({
      where: { id },
      data: {
        status: 'completed',
        endedAt: new Date(),
      },
    });
  }

  /**
   * Enviar mensagem e receber resposta
   */
  async sendMessage(data: SendMessageDTO): Promise<ChatbotResponse> {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: data.sessionId },
    });

    if (!session) {
      throw new Error('Sessão não encontrada');
    }

    if (session.status !== 'active') {
      throw new Error('Sessão não está ativa');
    }

    // Salvar mensagem do usuário
    const userMessage = await this.prisma.chatMessage.create({
      data: {
        sessionId: data.sessionId,
        role: MessageRole.USER,
        content: data.content,
        entities: [],
      },
    });

    // Buscar histórico de mensagens
    const history = await this.prisma.chatMessage.findMany({
      where: { sessionId: data.sessionId },
      orderBy: { createdAt: 'asc' },
      take: 10, // Últimas 10 mensagens
    });

    // Processar mensagem com IA
    const { intent, entities, sentiment } = await this.analyzeMessage(
      data.content
    );

    // Atualizar contexto da sessão
    const context = session.context as ConversationContext;
    context.intent = intent;
    context.entities = [...context.entities, ...entities];
    context.sentiment = sentiment;

    // Capturar dados do lead
    this.extractLeadData(data.content, entities, context);

    // Gerar resposta usando OpenAI
    const reply = await this.generateReply(
      data.content,
      history.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      context
    );

    // Salvar resposta do assistente
    const assistantMessage = await this.prisma.chatMessage.create({
      data: {
        sessionId: data.sessionId,
        role: MessageRole.ASSISTANT,
        content: reply,
        intent,
        entities: entities as Record<string, unknown>[],
        sentiment,
      },
    });

    // Atualizar sessão
    await this.prisma.chatSession.update({
      where: { id: data.sessionId },
      data: {
        context: context as Record<string, unknown>,
        messagesCount: { increment: 2 }, // user + assistant
      },
    });

    // Gerar sugestões de resposta rápida
    const suggestions = this.generateSuggestions(intent, context);

    return {
      message: this.mapMessageToResponse(assistantMessage),
      reply,
      suggestions,
      context,
    };
  }

  /**
   * Buscar histórico de mensagens
   */
  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    const messages = await this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });

    return messages.map(msg => this.mapMessageToResponse(msg));
  }

  /**
   * Qualificar lead da sessão
   */
  async qualifyLead(data: QualifyLeadDTO): Promise<QualifiedLeadResult> {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: data.sessionId },
      include: {
        messages: true,
      },
    });

    if (!session) {
      throw new Error('Sessão não encontrada');
    }

    const context = session.context as ConversationContext;

    // Verificar se tem dados mínimos para qualificar
    if (
      !data.forceQualification &&
      (!context.capturedData.phone || !context.capturedData.name)
    ) {
      throw new Error(
        'Dados insuficientes para qualificação. É necessário ao menos nome e telefone.'
      );
    }

    // Calcular score de qualificação
    const qualificationScore = this.calculateQualificationScore(context);

    // Gerar sumário da conversa
    const conversationSummary = await this.generateConversationSummary(
      session.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }))
    );

    // Criar ou atualizar lead
    const leadId = context.leadId || (await this.createLeadFromSession(context));

    // Atualizar sessão
    await this.prisma.chatSession.update({
      where: { id: data.sessionId },
      data: {
        leadId,
        isQualified: true,
        context: {
          ...(context as Record<string, unknown>),
          qualificationScore,
        },
      },
    });

    return {
      leadId,
      sessionId: data.sessionId,
      qualificationScore,
      capturedData: context.capturedData,
      conversationSummary,
    };
  }

  /**
   * Listar leads qualificados
   */
  async getQualifiedLeads(limit: number = 50): Promise<QualifiedLeadResult[]> {
    const sessions = await this.prisma.chatSession.findMany({
      where: {
        isQualified: true,
        leadId: { not: null },
      },
      include: {
        messages: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return Promise.all(
      sessions.map(async session => {
        const context = session.context as ConversationContext;

        return {
          leadId: session.leadId!,
          sessionId: session.id,
          qualificationScore:
            (context.metadata?.qualificationScore as number) || 0,
          capturedData: context.capturedData,
          conversationSummary: await this.generateConversationSummary(
            session.messages.map(msg => ({
              role: msg.role,
              content: msg.content,
            }))
          ),
        };
      })
    );
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Analisar mensagem para detectar intent, entities e sentiment
   */
  private async analyzeMessage(content: string): Promise<{
    intent: Intent;
    entities: Entity[];
    sentiment: number;
  }> {
    const prompt = `Analise a seguinte mensagem e retorne um JSON com:
{
  "intent": "GREETING" | "PRODUCT_INQUIRY" | "PRICING" | "SCHEDULING" | "CONTACT" | "COMPLAINT" | "FAREWELL" | "UNKNOWN",
  "entities": [
    {
      "type": "product" | "date" | "time" | "location" | "person" | "organization",
      "value": "valor extraído",
      "confidence": 0.0-1.0
    }
  ],
  "sentiment": -1.0 a 1.0
}

Mensagem: ${content}`;

    const response = await this.openai.client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            'Você é um especialista em NLP. Analise a mensagem e extraia intent, entities e sentiment. Responda apenas com JSON válido.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');

    return {
      intent: result.intent as Intent,
      entities: result.entities as Entity[],
      sentiment: result.sentiment as number,
    };
  }

  /**
   * Gerar resposta usando GPT-4
   */
  private async generateReply(
    userMessage: string,
    history: Array<{ role: string; content: string }>,
    context: ConversationContext
  ): Promise<string> {
    const systemPrompt = `Você é um assistente de vendas inteligente para uma empresa de equipamentos agrícolas.

Objetivos:
1. Ser amigável e profissional
2. Qualificar leads capturando: nome, telefone, email, empresa, interesse
3. Responder perguntas sobre produtos
4. Agendar demonstrações
5. Encaminhar para vendedor quando apropriado

Contexto atual:
- Estágio da conversa: ${context.conversationStage}
- Dados capturados: ${JSON.stringify(context.capturedData)}
- Intent detectado: ${context.intent || 'desconhecido'}

Seja conciso (máx 3 parágrafos). Se faltar informação importante, pergunte de forma natural.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10).map(msg => ({
        role: msg.role.toLowerCase(),
        content: msg.content,
      })),
      { role: 'user', content: userMessage },
    ];

    const response = await this.openai.client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: messages as Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
      }>,
      temperature: 0.8,
      max_tokens: 300,
    });

    return response.choices[0]?.message?.content || 'Desculpe, não entendi.';
  }

  /**
   * Extrair dados do lead da mensagem
   */
  private extractLeadData(
    content: string,
    entities: Entity[],
    context: ConversationContext
  ): void {
    // Extrair email (regex)
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const emailMatch = content.match(emailRegex);
    if (emailMatch) {
      context.capturedData.email = emailMatch[0];
    }

    // Extrair telefone (regex brasileiro)
    const phoneRegex = /(?:\+55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}/;
    const phoneMatch = content.match(phoneRegex);
    if (phoneMatch) {
      context.capturedData.phone = phoneMatch[0].replace(/\D/g, '');
    }

    // Extrair nome de entidades
    const personEntity = entities.find(e => e.type === 'person');
    if (personEntity && !context.capturedData.name) {
      context.capturedData.name = personEntity.value;
    }

    // Extrair empresa
    const orgEntity = entities.find(e => e.type === 'organization');
    if (orgEntity && !context.capturedData.company) {
      context.capturedData.company = orgEntity.value;
    }

    // Extrair interesse (produto)
    const productEntity = entities.find(e => e.type === 'product');
    if (productEntity) {
      context.capturedData.interest = productEntity.value;
    }
  }

  /**
   * Gerar sugestões de resposta rápida
   */
  private generateSuggestions(
    intent: Intent,
    context: ConversationContext
  ): string[] {
    const suggestions: string[] = [];

    if (intent === Intent.GREETING) {
      suggestions.push(
        'Quero saber sobre produtos',
        'Preciso de um orçamento',
        'Quero agendar uma visita'
      );
    } else if (intent === Intent.PRODUCT_INQUIRY) {
      suggestions.push(
        'Quanto custa?',
        'Quais as especificações?',
        'Tem pronta entrega?'
      );
    } else if (intent === Intent.PRICING) {
      suggestions.push(
        'Aceita parcelamento?',
        'Tem desconto para pagamento à vista?',
        'Gostaria de um orçamento formal'
      );
    }

    return suggestions;
  }

  /**
   * Gerar sumário da conversa
   */
  private async generateConversationSummary(
    messages: Array<{ role: string; content: string }>
  ): Promise<string> {
    const conversation = messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const prompt = `Resuma a seguinte conversa em 2-3 frases, destacando:
1. Interesse principal do lead
2. Principais dúvidas ou objeções
3. Próximos passos sugeridos

Conversa:
${conversation}`;

    const response = await this.openai.client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em resumir conversas de vendas.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 200,
    });

    return response.choices[0]?.message?.content || 'Sem resumo disponível';
  }

  /**
   * Calcular score de qualificação
   */
  private calculateQualificationScore(context: ConversationContext): number {
    let score = 0;

    // Dados capturados (0-60 pontos)
    if (context.capturedData.name) score += 10;
    if (context.capturedData.phone) score += 20;
    if (context.capturedData.email) score += 15;
    if (context.capturedData.company) score += 10;
    if (context.capturedData.interest) score += 5;

    // Sentimento (0-20 pontos)
    score += Math.max(0, (context.sentiment + 1) * 10);

    // Estágio da conversa (0-20 pontos)
    const stageScores = {
      greeting: 5,
      qualifying: 10,
      informing: 15,
      closing: 20,
    };
    score += stageScores[context.conversationStage] || 0;

    return Math.min(100, Math.round(score));
  }

  /**
   * Criar lead a partir da sessão
   */
  private async createLeadFromSession(
    context: ConversationContext
  ): Promise<string> {
    if (!context.capturedData.name || !context.capturedData.phone) {
      throw new Error('Dados insuficientes para criar lead');
    }

    const lead = await this.prisma.lead.create({
      data: {
        name: context.capturedData.name,
        phone: context.capturedData.phone,
        email: context.capturedData.email,
        company: context.capturedData.company,
        source: 'chatbot',
        status: 'NOVO',
        priority: 'MEDIUM',
        score: this.calculateQualificationScore(context),
        customFields: {
          interest: context.capturedData.interest,
        } as Record<string, unknown>,
      },
    });

    return lead.id;
  }

  private mapSessionToResponse(session: {
    id: string;
    userId: string | null;
    leadId: string | null;
    context: Record<string, unknown>;
    status: string;
    startedAt: Date;
    endedAt: Date | null;
    messagesCount: number;
    isQualified: boolean;
  }): ChatSession {
    return {
      id: session.id,
      userId: session.userId || undefined,
      leadId: session.leadId || undefined,
      context: session.context as ConversationContext,
      status: session.status as 'active' | 'completed' | 'abandoned',
      startedAt: session.startedAt,
      endedAt: session.endedAt || undefined,
      messagesCount: session.messagesCount,
      isQualified: session.isQualified,
    };
  }

  private mapMessageToResponse(message: {
    id: string;
    sessionId: string;
    role: string;
    content: string;
    intent: string | null;
    entities: Record<string, unknown>[];
    sentiment: number | null;
    createdAt: Date;
  }): ChatMessage {
    return {
      id: message.id,
      sessionId: message.sessionId,
      role: message.role as MessageRole,
      content: message.content,
      intent: message.intent as Intent | undefined,
      entities: message.entities as Entity[],
      sentiment: message.sentiment || undefined,
      createdAt: message.createdAt,
    };
  }
}
```

### 2.4 Controller & Routes

**chatbot.controller.ts**:
```typescript
import { Request, Response, NextFunction } from 'express';
import { ChatbotService } from './chatbot.service';

export class ChatbotController {
  constructor(private service: ChatbotService) {}

  createSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await this.service.createSession({
        userId: req.user?.id,
        initialMessage: req.body.initialMessage,
      });

      res.status(201).json({
        success: true,
        data: session,
      });
    } catch (error) {
      next(error);
    }
  };

  getSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await this.service.getSession(req.params.id);

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Sessão não encontrada',
        });
      }

      res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      next(error);
    }
  };

  endSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.endSession(req.params.id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  sendMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.sendMessage(req.body);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getMessages = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const messages = await this.service.getMessages(req.params.sessionId);

      res.json({
        success: true,
        data: messages,
      });
    } catch (error) {
      next(error);
    }
  };

  qualifyLead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.qualifyLead(req.body);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getQualifiedLeads = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const leads = await this.service.getQualifiedLeads(limit);

      res.json({
        success: true,
        data: leads,
      });
    } catch (error) {
      next(error);
    }
  };
}
```

**chatbot.routes.ts**:
```typescript
import { Router } from 'express';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { OpenAIService } from './openai.service';
import { authenticate } from '../../middleware/auth.middleware';
import { prisma } from '../../config/database';

const router = Router();

const openaiService = new OpenAIService({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4-turbo-preview',
  temperature: 0.7,
  maxTokens: 2000,
});

const service = new ChatbotService(prisma, openaiService);
const controller = new ChatbotController(service);

// Sessões
router.post('/sessions', controller.createSession);
router.get('/sessions/:id', controller.getSession);
router.delete('/sessions/:id', authenticate, controller.endSession);

// Mensagens
router.post('/messages', controller.sendMessage);
router.get('/messages/:sessionId', controller.getMessages);

// Qualificação
router.post('/qualify-lead', authenticate, controller.qualifyLead);
router.get('/qualified-leads', authenticate, controller.getQualifiedLeads);

export default router;
```

---

## 📦 MÓDULO 3: DETECÇÃO DE DUPLICATAS

### 3.1 Algoritmos de Similaridade

**duplicates.service.ts**:
```typescript
import { PrismaClient, Lead } from '@prisma/client';

export interface DuplicateMatch {
  leadId: string;
  duplicateId: string;
  similarityScore: number;
  matchedFields: Array<{
    field: string;
    similarity: number;
    value1: string;
    value2: string;
  }>;
}

export class DuplicatesService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Detectar duplicatas usando múltiplos algoritmos
   */
  async detectDuplicates(
    threshold: number = 0.85
  ): Promise<DuplicateMatch[]> {
    const leads = await this.prisma.lead.findMany({
      where: { deletedAt: null },
    });

    const duplicates: DuplicateMatch[] = [];

    for (let i = 0; i < leads.length; i++) {
      for (let j = i + 1; j < leads.length; j++) {
        const similarity = this.calculateSimilarity(leads[i], leads[j]);

        if (similarity.score >= threshold) {
          duplicates.push({
            leadId: leads[i].id,
            duplicateId: leads[j].id,
            similarityScore: similarity.score,
            matchedFields: similarity.fields,
          });
        }
      }
    }

    return duplicates;
  }

  /**
   * Calcular similaridade entre dois leads
   */
  private calculateSimilarity(
    lead1: Lead,
    lead2: Lead
  ): {
    score: number;
    fields: Array<{
      field: string;
      similarity: number;
      value1: string;
      value2: string;
    }>;
  } {
    const fields: Array<{
      field: string;
      similarity: number;
      value1: string;
      value2: string;
    }> = [];

    let totalSimilarity = 0;
    let totalWeight = 0;

    // Nome (peso 0.3)
    if (lead1.name && lead2.name) {
      const nameSim = this.levenshteinSimilarity(lead1.name, lead2.name);
      fields.push({
        field: 'name',
        similarity: nameSim,
        value1: lead1.name,
        value2: lead2.name,
      });
      totalSimilarity += nameSim * 0.3;
      totalWeight += 0.3;
    }

    // Telefone (peso 0.4)
    if (lead1.phone && lead2.phone) {
      const phoneSim = this.phoneSimilarity(lead1.phone, lead2.phone);
      fields.push({
        field: 'phone',
        similarity: phoneSim,
        value1: lead1.phone,
        value2: lead2.phone,
      });
      totalSimilarity += phoneSim * 0.4;
      totalWeight += 0.4;
    }

    // Email (peso 0.3)
    if (lead1.email && lead2.email) {
      const emailSim = lead1.email === lead2.email ? 1 : 0;
      fields.push({
        field: 'email',
        similarity: emailSim,
        value1: lead1.email,
        value2: lead2.email,
      });
      totalSimilarity += emailSim * 0.3;
      totalWeight += 0.3;
    }

    const score = totalWeight > 0 ? totalSimilarity / totalWeight : 0;

    return { score, fields };
  }

  /**
   * Similaridade de Levenshtein normalizada
   */
  private levenshteinSimilarity(str1: string, str2: string): number {
    const s1 = this.normalize(str1);
    const s2 = this.normalize(str2);

    const distance = this.levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);

    return maxLength === 0 ? 1 : 1 - distance / maxLength;
  }

  /**
   * Distância de Levenshtein
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
            matrix[i - 1][j - 1] + 1, // substituição
            matrix[i][j - 1] + 1, // inserção
            matrix[i - 1][j] + 1 // remoção
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Similaridade de telefone (remove formatação)
   */
  private phoneSimilarity(phone1: string, phone2: string): number {
    const p1 = phone1.replace(/\D/g, '');
    const p2 = phone2.replace(/\D/g, '');

    // Comparar últimos 9 dígitos (número sem DDD)
    const num1 = p1.slice(-9);
    const num2 = p2.slice(-9);

    return num1 === num2 ? 1 : 0;
  }

  /**
   * Normalizar string
   */
  private normalize(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
}
```

---

## 🧪 TESTES UNITÁRIOS

**ai-analytics.service.test.ts**:
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIAnalyticsService } from './ai-analytics.service';
import { OpenAIService } from './openai.service';
import { PrismaClient } from '@prisma/client';

const mockPrisma = {
  lead: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  sentimentAnalysis: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
} as unknown as PrismaClient;

const mockOpenAI = {
  analyzeSentiment: vi.fn(),
  extractKeywordsAndTopics: vi.fn(),
  predictConversion: vi.fn(),
} as unknown as OpenAIService;

describe('AIAnalyticsService', () => {
  let service: AIAnalyticsService;

  beforeEach(() => {
    service = new AIAnalyticsService(mockPrisma, mockOpenAI);
    vi.clearAllMocks();
  });

  describe('analyzeSentiment', () => {
    it('deve analisar sentimento com sucesso', async () => {
      const mockSentiment = {
        overall: 0.8,
        polarity: 'POSITIVE',
        confidence: 0.9,
        emotions: {
          joy: 0.8,
          sadness: 0.1,
          anger: 0,
          fear: 0,
          surprise: 0.1,
        },
      };

      mockOpenAI.analyzeSentiment = vi.fn().mockResolvedValue(mockSentiment);
      mockOpenAI.extractKeywordsAndTopics = vi
        .fn()
        .mockResolvedValue({ keywords: ['produto'], topics: ['vendas'] });

      const result = await service.analyzeSentiment({
        text: 'Adorei o produto!',
      });

      expect(result.sentiment.overall).toBe(0.8);
      expect(result.keywords).toContain('produto');
    });
  });
});
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Módulo IA Analytics
- [ ] Criar tipos TypeScript (ai-analytics.types.ts)
- [ ] Criar validações Zod (ai-analytics.validators.ts)
- [ ] Implementar OpenAI Service (openai.service.ts)
- [ ] Implementar AI Analytics Service (ai-analytics.service.ts)
- [ ] Implementar controller (ai-analytics.controller.ts)
- [ ] Criar rotas (ai-analytics.routes.ts)
- [ ] Adicionar schema Prisma para SentimentAnalysis
- [ ] Adicionar schema Prisma para ConversionPrediction
- [ ] Implementar testes unitários (90% coverage)
- [ ] Documentar endpoints (Swagger/OpenAPI)

### Módulo Chatbot IA
- [ ] Criar tipos TypeScript (chatbot.types.ts)
- [ ] Implementar Chatbot Service (chatbot.service.ts)
- [ ] Implementar controller (chatbot.controller.ts)
- [ ] Criar rotas (chatbot.routes.ts)
- [ ] Adicionar schema Prisma para ChatSession
- [ ] Adicionar schema Prisma para ChatMessage
- [ ] Implementar testes unitários
- [ ] Integrar com frontend

### Módulo Detecção de Duplicatas
- [ ] Implementar algoritmo de Levenshtein
- [ ] Implementar comparação fonética (Soundex)
- [ ] Implementar normalização de dados
- [ ] Criar service (duplicates.service.ts)
- [ ] Implementar testes de algoritmos
- [ ] Integrar com módulo de Leads

### Integrações
- [ ] Configurar variável OPENAI_API_KEY
- [ ] Registrar rotas no app.ts
- [ ] Configurar permissões de IA
- [ ] Implementar rate limiting para API OpenAI
- [ ] Criar job de recálculo automático de scores
- [ ] Testar fluxo completo
- [ ] Monitorar custos de API OpenAI

---

## 📊 MÉTRICAS DE SUCESSO

- ✅ **Coverage de testes**: ≥ 90%
- ✅ **Tempo de resposta**: < 2s para análises (API externa)
- ✅ **Precisão de sentiment**: ≥ 85%
- ✅ **Precisão de duplicatas**: ≥ 90%
- ✅ **Zero uso de `any`**: 100% tipado
- ✅ **Qualificação de leads**: ≥ 70% de precisão
- ✅ **Custo OpenAI**: < $100/mês para 1000 leads

---

## 🚀 PRÓXIMOS PASSOS

Após concluir Fase 10:
1. **Treinar** modelos com dados históricos
2. **Otimizar** prompts para melhor performance
3. **Implementar** cache de respostas comuns
4. **Monitorar** custos e performance
5. **Ajustar** algoritmos baseado em feedback

---

**Última atualização**: 2025-10-10
**Status**: Documentação completa - Pronta para implementação
**Linhas**: ~2800
