// ============================================================================
// AI Module - Validators
// ============================================================================

import { z } from 'zod';

export const AnalyzeSentimentSchema = z.object({
  leadId: z.string().cuid('ID do lead inválido'),
  content: z.string().optional(),
});

export const PredictConversionSchema = z.object({
  leadId: z.string().cuid('ID do lead inválido'),
});

export const ScoreLeadSchema = z.object({
  leadId: z.string().cuid('ID do lead inválido'),
});

export const ChatbotMessageSchema = z.object({
  sessionId: z.string().min(1, 'Session ID é obrigatório'),
  message: z.string().min(1, 'Mensagem é obrigatória').max(1000),
  context: z.record(z.unknown()).optional(),
});

export const DetectDuplicatesSchema = z.object({
  leadId: z.string().cuid().optional(),
  threshold: z.number().min(0).max(100).optional().default(70),
});

export const GenerateInsightsSchema = z.object({
  period: z.enum(['day', 'week', 'month']).optional().default('week'),
  userId: z.string().cuid().optional(),
});
