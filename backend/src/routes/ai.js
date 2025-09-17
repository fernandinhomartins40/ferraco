const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticateToken } = require('../middleware/auth');

// Middleware de autenticação para todas as rotas
router.use(authenticateToken);

// ==========================================
// ANÁLISE DE SENTIMENTO E IA
// ==========================================

/**
 * @route POST /api/ai/leads/:leadId/sentiment
 * @desc Analisar sentimento e urgência de um lead
 * @access Private
 */
router.post('/leads/:leadId/sentiment', aiController.analyzeLeadSentiment);

/**
 * @route GET /api/ai/leads/:leadId/analysis
 * @desc Obter análise de IA de um lead
 * @access Private
 */
router.get('/leads/:leadId/analysis', aiController.getLeadAIAnalysis);

// ==========================================
// SCORING DE LEADS
// ==========================================

/**
 * @route POST /api/ai/leads/:leadId/score
 * @desc Calcular score de um lead
 * @access Private
 */
router.post('/leads/:leadId/score', aiController.calculateLeadScore);

/**
 * @route GET /api/ai/leads/:leadId/score
 * @desc Obter score de um lead
 * @access Private
 */
router.get('/leads/:leadId/score', aiController.getLeadScore);

// ==========================================
// PREVISÕES DE CONVERSÃO
// ==========================================

/**
 * @route POST /api/ai/leads/:leadId/prediction
 * @desc Gerar previsão de conversão para um lead
 * @access Private
 */
router.post('/leads/:leadId/prediction', aiController.generateConversionPrediction);

/**
 * @route GET /api/ai/leads/:leadId/prediction
 * @desc Obter previsão de conversão de um lead
 * @access Private
 */
router.get('/leads/:leadId/prediction', aiController.getConversionPrediction);

// ==========================================
// DETECÇÃO DE DUPLICATAS
// ==========================================

/**
 * @route POST /api/ai/leads/:leadId/duplicates
 * @desc Detectar leads duplicados
 * @access Private
 */
router.post('/leads/:leadId/duplicates', aiController.detectDuplicateLeads);

// ==========================================
// RECOMENDAÇÕES E INSIGHTS
// ==========================================

/**
 * @route GET /api/ai/leads/:leadId/recommendations
 * @desc Obter recomendações de IA para um lead
 * @access Private
 */
router.get('/leads/:leadId/recommendations', aiController.getLeadRecommendations);

/**
 * @route GET /api/ai/insights
 * @desc Obter insights de IA para o dashboard
 * @query period - day, week, month, quarter
 * @access Private
 */
router.get('/insights', aiController.getAIInsights);

// ==========================================
// PROCESSAMENTO EM LOTE
// ==========================================

/**
 * @route POST /api/ai/batch/analysis
 * @desc Processar análise de IA em lote
 * @body leadIds - Array de IDs de leads
 * @body analysisTypes - Array de tipos de análise
 * @access Private
 */
router.post('/batch/analysis', aiController.processAIAnalysisBatch);

// ==========================================
// CONFIGURAÇÕES E ESTATÍSTICAS
// ==========================================

/**
 * @route PUT /api/ai/settings
 * @desc Atualizar configurações de IA
 * @access Private (Admin only)
 */
router.put('/settings', aiController.updateAISettings);

/**
 * @route GET /api/ai/performance
 * @desc Obter estatísticas de performance da IA
 * @query period - day, week, month, quarter
 * @access Private
 */
router.get('/performance', aiController.getAIPerformanceStats);

module.exports = router;