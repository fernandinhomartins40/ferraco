const crmService = require('../services/crmService');
const logger = require('../utils/logger');

/**
 * CRM Controller
 * Gerencia todas as operações relacionadas a CRM, pipelines e oportunidades
 */
class CRMController {
  // ==========================================
  // PIPELINE MANAGEMENT
  // ==========================================

  /**
   * Listar todos os pipelines
   */
  async listPipelines(req, res) {
    try {
      const result = await crmService.listPipelines(req.query);

      logger.info(`Pipelines listed successfully - Found: ${result.data.pipelines.length}`);

      res.status(200).json({
        success: true,
        message: 'Pipelines recuperados com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error('Error listing pipelines:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao listar pipelines',
        error: error.message
      });
    }
  }

  /**
   * Obter um pipeline específico
   */
  async getPipeline(req, res) {
    try {
      const { id } = req.params;
      const result = await crmService.getPipelineById(id);

      logger.info(`Pipeline retrieved successfully - ID: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Pipeline recuperado com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error(`Error getting pipeline ${req.params.id}:`, error);

      const statusCode = error.message.includes('não encontrado') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Criar um novo pipeline
   */
  async createPipeline(req, res) {
    try {
      const pipelineData = req.body;
      const result = await crmService.createPipeline(pipelineData);

      logger.info(`Pipeline created successfully - ID: ${result.data.pipeline.id}, Name: ${result.data.pipeline.name}`);

      res.status(201).json({
        success: true,
        message: 'Pipeline criado com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error('Error creating pipeline:', error);

      const statusCode = error.message.includes('já existe') ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Atualizar um pipeline
   */
  async updatePipeline(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const result = await crmService.updatePipeline(id, updateData);

      logger.info(`Pipeline updated successfully - ID: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Pipeline atualizado com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error(`Error updating pipeline ${req.params.id}:`, error);

      const statusCode = error.message.includes('não encontrado') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Excluir um pipeline
   */
  async deletePipeline(req, res) {
    try {
      const { id } = req.params;
      const result = await crmService.deletePipeline(id);

      logger.info(`Pipeline deleted successfully - ID: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Pipeline excluído com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error(`Error deleting pipeline ${req.params.id}:`, error);

      const statusCode = error.message.includes('não encontrado') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  // ==========================================
  // PIPELINE STAGES
  // ==========================================

  /**
   * Obter estágios de um pipeline
   */
  async getPipelineStages(req, res) {
    try {
      const { pipelineId } = req.params;
      const result = await crmService.getPipelineStages(pipelineId);

      logger.info(`Pipeline stages retrieved - Pipeline ID: ${pipelineId}, Found: ${result.data.stages.length} stages`);

      res.status(200).json({
        success: true,
        message: 'Estágios do pipeline recuperados com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error(`Error getting pipeline stages ${req.params.pipelineId}:`, error);

      const statusCode = error.message.includes('não encontrado') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Criar estágio no pipeline
   */
  async createPipelineStage(req, res) {
    try {
      const { pipelineId } = req.params;
      const stageData = { ...req.body, pipelineId };
      const result = await crmService.createPipelineStage(stageData);

      logger.info(`Pipeline stage created - Pipeline ID: ${pipelineId}, Stage: ${result.data.stage.name}`);

      res.status(201).json({
        success: true,
        message: 'Estágio criado com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error(`Error creating pipeline stage:`, error);

      res.status(500).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Atualizar estágio do pipeline
   */
  async updatePipelineStage(req, res) {
    try {
      const { stageId } = req.params;
      const updateData = req.body;
      const result = await crmService.updatePipelineStage(stageId, updateData);

      logger.info(`Pipeline stage updated - Stage ID: ${stageId}`);

      res.status(200).json({
        success: true,
        message: 'Estágio atualizado com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error(`Error updating pipeline stage ${req.params.stageId}:`, error);

      const statusCode = error.message.includes('não encontrado') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  // ==========================================
  // OPPORTUNITIES
  // ==========================================

  /**
   * Listar oportunidades
   */
  async listOpportunities(req, res) {
    try {
      const result = await crmService.listOpportunities(req.query);

      logger.info(`Opportunities listed successfully - Found: ${result.data.opportunities.length}`);

      res.status(200).json({
        success: true,
        message: 'Oportunidades recuperadas com sucesso',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Error listing opportunities:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao listar oportunidades',
        error: error.message
      });
    }
  }

  /**
   * Obter oportunidade específica
   */
  async getOpportunity(req, res) {
    try {
      const { id } = req.params;
      const result = await crmService.getOpportunityById(id);

      logger.info(`Opportunity retrieved successfully - ID: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Oportunidade recuperada com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error(`Error getting opportunity ${req.params.id}:`, error);

      const statusCode = error.message.includes('não encontrada') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Criar nova oportunidade
   */
  async createOpportunity(req, res) {
    try {
      const opportunityData = req.body;
      const result = await crmService.createOpportunity(opportunityData);

      logger.info(`Opportunity created successfully - ID: ${result.data.opportunity.id}, Title: ${result.data.opportunity.title}`);

      res.status(201).json({
        success: true,
        message: 'Oportunidade criada com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error('Error creating opportunity:', error);

      res.status(500).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Atualizar oportunidade
   */
  async updateOpportunity(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const result = await crmService.updateOpportunity(id, updateData);

      logger.info(`Opportunity updated successfully - ID: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Oportunidade atualizada com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error(`Error updating opportunity ${req.params.id}:`, error);

      const statusCode = error.message.includes('não encontrada') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Mover oportunidade para outro estágio
   */
  async moveOpportunityStage(req, res) {
    try {
      const { id } = req.params;
      const { newStage, reason } = req.body;
      const result = await crmService.moveOpportunityStage(id, newStage, reason);

      logger.info(`Opportunity moved to new stage - ID: ${id}, New Stage: ${newStage}`);

      res.status(200).json({
        success: true,
        message: 'Oportunidade movida para novo estágio com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error(`Error moving opportunity stage ${req.params.id}:`, error);

      const statusCode = error.message.includes('não encontrada') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Fechar oportunidade (won/lost)
   */
  async closeOpportunity(req, res) {
    try {
      const { id } = req.params;
      const { status, reason, actualValue } = req.body;
      const result = await crmService.closeOpportunity(id, status, reason, actualValue);

      logger.info(`Opportunity closed - ID: ${id}, Status: ${status}`);

      res.status(200).json({
        success: true,
        message: `Oportunidade ${status === 'won' ? 'ganha' : 'perdida'} com sucesso`,
        data: result.data
      });
    } catch (error) {
      logger.error(`Error closing opportunity ${req.params.id}:`, error);

      const statusCode = error.message.includes('não encontrada') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  // ==========================================
  // PIPELINE ANALYTICS
  // ==========================================

  /**
   * Obter estatísticas do pipeline
   */
  async getPipelineStats(req, res) {
    try {
      const { pipelineId } = req.params;
      const { period = 'month' } = req.query;
      const result = await crmService.getPipelineStats(pipelineId, period);

      logger.info(`Pipeline stats retrieved - Pipeline ID: ${pipelineId}, Period: ${period}`);

      res.status(200).json({
        success: true,
        message: 'Estatísticas do pipeline recuperadas com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error(`Error getting pipeline stats ${req.params.pipelineId}:`, error);

      const statusCode = error.message.includes('não encontrado') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Obter visão geral do CRM
   */
  async getCRMOverview(req, res) {
    try {
      const { period = 'month' } = req.query;
      const result = await crmService.getCRMOverview(period);

      logger.info(`CRM overview retrieved for period: ${period}`);

      res.status(200).json({
        success: true,
        message: 'Visão geral do CRM recuperada com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error('Error getting CRM overview:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao recuperar visão geral do CRM',
        error: error.message
      });
    }
  }

  /**
   * Gerar relatório de funil de vendas
   */
  async getSalesFunnelReport(req, res) {
    try {
      const { pipelineId } = req.params;
      const { startDate, endDate } = req.query;
      const result = await crmService.generateSalesFunnelReport(pipelineId, startDate, endDate);

      logger.info(`Sales funnel report generated - Pipeline ID: ${pipelineId}`);

      res.status(200).json({
        success: true,
        message: 'Relatório de funil de vendas gerado com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error(`Error generating sales funnel report:`, error);

      res.status(500).json({
        success: false,
        message: 'Erro ao gerar relatório de funil de vendas',
        error: error.message
      });
    }
  }

  /**
   * Obter previsão de vendas
   */
  async getSalesForecast(req, res) {
    try {
      const { period = 'quarter' } = req.query;
      const result = await crmService.generateSalesForecast(period);

      logger.info(`Sales forecast generated for period: ${period}`);

      res.status(200).json({
        success: true,
        message: 'Previsão de vendas gerada com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error('Error generating sales forecast:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao gerar previsão de vendas',
        error: error.message
      });
    }
  }

  /**
   * Obter atividades de uma oportunidade
   */
  async getOpportunityActivities(req, res) {
    try {
      const { id } = req.params;
      const result = await crmService.getOpportunityActivities(id);

      logger.info(`Opportunity activities retrieved - ID: ${id}, Found: ${result.data.activities.length} activities`);

      res.status(200).json({
        success: true,
        message: 'Atividades da oportunidade recuperadas com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error(`Error getting opportunity activities ${req.params.id}:`, error);

      const statusCode = error.message.includes('não encontrada') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }
}

module.exports = new CRMController();