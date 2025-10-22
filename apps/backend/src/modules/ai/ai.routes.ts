// ============================================================================
// AI Module - Routes
// ============================================================================

import { Router } from 'express';
import { aiController } from './ai.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import {
  AnalyzeSentimentSchema,
  PredictConversionSchema,
  ScoreLeadSchema,
  ChatbotMessageSchema,
  DetectDuplicatesSchema,
  GenerateInsightsSchema,
} from './ai.validators';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// ============================================================================
// Sentiment Analysis Routes
// ============================================================================

router.post('/sentiment', validate({ body: AnalyzeSentimentSchema }), aiController.analyzeSentiment.bind(aiController));

// ============================================================================
// Conversion Prediction Routes
// ============================================================================

router.post('/predict', validate({ body: PredictConversionSchema }), aiController.predictConversion.bind(aiController));

// ============================================================================
// Lead Scoring Routes
// ============================================================================

router.post('/score', validate({ body: ScoreLeadSchema }), aiController.scoreLeadAutomatically.bind(aiController));

// ============================================================================
// Chatbot Routes
// ============================================================================

router.post('/chatbot', validate({ body: ChatbotMessageSchema }), aiController.processChatbotMessage.bind(aiController));

// ============================================================================
// Duplicate Detection Routes
// ============================================================================

router.post('/duplicates', validate({ body: DetectDuplicatesSchema }), aiController.detectDuplicates.bind(aiController));

// ============================================================================
// Insights Routes
// ============================================================================

router.get('/insights', validate({ query: GenerateInsightsSchema }), aiController.generateInsights.bind(aiController));

// ============================================================================
// Analysis & Prediction Routes
// ============================================================================

router.get('/analysis/:leadId', aiController.getLeadAnalysis.bind(aiController));
router.get('/prediction/:leadId', aiController.getLeadPrediction.bind(aiController));

export default router;
