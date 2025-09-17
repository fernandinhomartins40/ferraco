const aiService = require('../services/aiService');
const logger = require('../utils/logger');

/**
 * AI Controller
 * Gerencia todas as operações relacionadas a IA, análises preditivas e scoring
 */
class AIController {
  /**
   * Analisar sentimento e urgência de um lead
   */
  async analyzeLeadSentiment(req, res) {
    try {
      const { leadId } = req.params;
      const result = await aiService.analyzeLeadSentiment(leadId);

      logger.info(`AI sentiment analysis completed - Lead ID: ${leadId}`);

      res.status(200).json({
        success: true,
        message: 'Análise de sentimento concluída com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error(`Error analyzing lead sentiment ${req.params.leadId}:`, error);

      const statusCode = error.message.includes('não encontrado') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Obter análise de IA de um lead
   */
  async getLeadAIAnalysis(req, res) {
    try {
      const { leadId } = req.params;
      const result = await aiService.getLeadAIAnalysis(leadId);

      logger.info(`AI analysis retrieved - Lead ID: ${leadId}`);

      res.status(200).json({
        success: true,
        message: 'Análise de IA recuperada com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error(`Error getting AI analysis ${req.params.leadId}:`, error);

      const statusCode = error.message.includes('não encontrada') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Calcular score de um lead
   */
  async calculateLeadScore(req, res) {
    try {
      const { leadId } = req.params;
      const result = await aiService.calculateLeadScore(leadId);

      logger.info(`Lead score calculated - Lead ID: ${leadId}, Score: ${result.data.score.totalScore}`);

      res.status(200).json({
        success: true,
        message: 'Score do lead calculado com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error(`Error calculating lead score ${req.params.leadId}:`, error);

      const statusCode = error.message.includes('não encontrado') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Obter score de um lead
   */
  async getLeadScore(req, res) {
    try {
      const { leadId } = req.params;
      const result = await aiService.getLeadScore(leadId);

      logger.info(`Lead score retrieved - Lead ID: ${leadId}`);

      res.status(200).json({
        success: true,
        message: 'Score do lead recuperado com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error(`Error getting lead score ${req.params.leadId}:`, error);

      const statusCode = error.message.includes('não encontrado') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Gerar previsão de conversão para um lead
   */
  async generateConversionPrediction(req, res) {
    try {
      const { leadId } = req.params;
      const result = await aiService.generateConversionPrediction(leadId);

      logger.info(`Conversion prediction generated - Lead ID: ${leadId}, Probability: ${result.data.prediction.probability}%`);

      res.status(200).json({
        success: true,
        message: 'Previsão de conversão gerada com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error(`Error generating conversion prediction ${req.params.leadId}:`, error);

      const statusCode = error.message.includes('não encontrado') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Obter previsão de conversão de um lead
   */
  async getConversionPrediction(req, res) {
    try {
      const { leadId } = req.params;
      const result = await aiService.getConversionPrediction(leadId);

      logger.info(`Conversion prediction retrieved - Lead ID: ${leadId}`);

      res.status(200).json({
        success: true,
        message: 'Previsão de conversão recuperada com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error(`Error getting conversion prediction ${req.params.leadId}:`, error);

      const statusCode = error.message.includes('não encontrada') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Detectar leads duplicados
   */
  async detectDuplicateLeads(req, res) {
    try {
      const { leadId } = req.params;
      const result = await aiService.detectDuplicateLeads(leadId);

      logger.info(`Duplicate detection completed - Lead ID: ${leadId}, Found: ${result.data.duplicates.length} potential duplicates`);

      res.status(200).json({
        success: true,
        message: 'Detecção de duplicatas concluída com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error(`Error detecting duplicate leads ${req.params.leadId}:`, error);

      const statusCode = error.message.includes('não encontrado') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Obter insights de IA para o dashboard
   */
  async getAIInsights(req, res) {
    try {
      const { period = 'week' } = req.query;
      const result = await aiService.getAIInsights(period);

      logger.info(`AI insights retrieved for period: ${period}`);

      res.status(200).json({
        success: true,
        message: 'Insights de IA recuperados com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error('Error getting AI insights:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao recuperar insights de IA',
        error: error.message
      });
    }
  }

  /**
   * Processar análise de IA em lote
   */
  async processAIAnalysisBatch(req, res) {
    try {
      const { leadIds, analysisTypes } = req.body;
      const result = await aiService.processAIAnalysisBatch(leadIds, analysisTypes);

      logger.info(`Batch AI analysis started for ${leadIds.length} leads`);

      res.status(202).json({
        success: true,
        message: 'Análise em lote iniciada com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error('Error processing AI analysis batch:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao processar análise em lote',
        error: error.message
      });
    }
  }

  /**
   * Obter recomendações de IA para um lead
   */
  async getLeadRecommendations(req, res) {
    try {
      const { leadId } = req.params;
      const result = await aiService.getLeadRecommendations(leadId);

      logger.info(`AI recommendations retrieved - Lead ID: ${leadId}, Found: ${result.data.recommendations.length} recommendations`);

      res.status(200).json({
        success: true,
        message: 'Recomendações de IA recuperadas com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error(`Error getting lead recommendations ${req.params.leadId}:`, error);

      const statusCode = error.message.includes('não encontrado') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Atualizar configurações de IA
   */
  async updateAISettings(req, res) {
    try {
      const settings = req.body;
      const result = await aiService.updateAISettings(settings);

      logger.info('AI settings updated successfully');

      res.status(200).json({
        success: true,
        message: 'Configurações de IA atualizadas com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error('Error updating AI settings:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar configurações de IA',
        error: error.message
      });
    }
  }

  /**
   * Obter estatísticas de performance da IA
   */
  async getAIPerformanceStats(req, res) {
    try {
      const { period = 'month' } = req.query;
      const result = await aiService.getAIPerformanceStats(period);

      logger.info(`AI performance stats retrieved for period: ${period}`);

      res.status(200).json({
        success: true,
        message: 'Estatísticas de performance da IA recuperadas com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error('Error getting AI performance stats:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao recuperar estatísticas de performance da IA',
        error: error.message
      });
    }
  }
}

module.exports = new AIController();