// ============================================================================
// AI Module - Types
// ============================================================================

import { AIAnalysis, ConversionPrediction, LeadScoring, AISentiment, AIUrgencyLevel } from '@prisma/client';

export interface AnalyzeSentimentDTO {
  leadId: string;
  content?: string;
}

export interface SentimentAnalysisResult {
  leadId: string;
  sentiment: AISentiment;
  sentimentScore: number;
  keyTopics: string[];
  urgencyLevel: AIUrgencyLevel;
  confidenceScore: number;
  recommendations: string[];
}

export interface PredictConversionDTO {
  leadId: string;
}

export interface ConversionPredictionResult {
  leadId: string;
  probability: number;
  confidence: number;
  estimatedTimeToConversion: number;
  suggestedActions: string[];
  factors: ConversionFactor[];
}

export interface ConversionFactor {
  name: string;
  impact: number;
  description: string;
}

export interface ScoreLeadDTO {
  leadId: string;
}

export interface LeadScoringResult {
  leadId: string;
  score: number;
  factors: ScoringFactor[];
  recommendations: string[];
}

export interface ScoringFactor {
  name: string;
  points: number;
  weight: number;
  description: string;
}

export interface ChatbotMessageDTO {
  sessionId: string;
  message: string;
  context?: Record<string, unknown>;
}

export interface ChatbotResponse {
  message: string;
  intent: string;
  confidence: number;
  suggestedActions?: string[];
  context?: Record<string, unknown>;
}

export interface DetectDuplicatesDTO {
  leadId?: string;
  threshold?: number;
}

export interface DuplicateDetectionResult {
  leadId: string;
  duplicates: DuplicateMatch[];
  confidence: number;
}

export interface DuplicateMatch {
  id: string;
  name: string;
  email?: string;
  phone: string;
  similarity: number;
  matchingFields: string[];
  suggestedAction: 'MERGE' | 'KEEP_SEPARATE' | 'NEEDS_REVIEW';
}

export interface GenerateInsightsDTO {
  period?: 'day' | 'week' | 'month';
  userId?: string;
}

export interface AIInsights {
  period: string;
  insights: Insight[];
  recommendations: string[];
  trends: Trend[];
}

export interface Insight {
  type: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  suggestedActions?: string[];
}

export interface Trend {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  change: number;
  description: string;
}

export interface AIAnalysisWithRecommendations extends AIAnalysis {
  recommendations?: {
    id: string;
    type: string;
    title: string;
    description: string;
  }[];
}

export interface IAIService {
  analyzeSentiment(data: AnalyzeSentimentDTO): Promise<SentimentAnalysisResult>;
  predictConversion(data: PredictConversionDTO): Promise<ConversionPredictionResult>;
  scoreLeadAutomatically(data: ScoreLeadDTO): Promise<LeadScoringResult>;
  processChatbotMessage(data: ChatbotMessageDTO): Promise<ChatbotResponse>;
  detectDuplicates(data: DetectDuplicatesDTO): Promise<DuplicateDetectionResult[]>;
  generateInsights(data: GenerateInsightsDTO): Promise<AIInsights>;
  getLeadAnalysis(leadId: string): Promise<AIAnalysisWithRecommendations | null>;
  getLeadPrediction(leadId: string): Promise<ConversionPrediction | null>;
}
