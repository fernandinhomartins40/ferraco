const express = require('express');
const router = express.Router();
const crmController = require('../controllers/crmController');
const { authenticateToken } = require('../middleware/auth');

// Middleware de autenticação para todas as rotas
router.use(authenticateToken);

// ==========================================
// PIPELINE MANAGEMENT
// ==========================================

/**
 * @route GET /api/crm/pipelines
 * @desc Listar todos os pipelines
 * @query businessType - Filtrar por tipo de negócio
 * @query isDefault - Filtrar pipelines padrão
 * @access Private
 */
router.get('/pipelines', crmController.listPipelines);

/**
 * @route GET /api/crm/pipelines/:id
 * @desc Obter um pipeline específico
 * @access Private
 */
router.get('/pipelines/:id', crmController.getPipeline);

/**
 * @route POST /api/crm/pipelines
 * @desc Criar um novo pipeline
 * @body name, description, businessType, stages[]
 * @access Private
 */
router.post('/pipelines', crmController.createPipeline);

/**
 * @route PUT /api/crm/pipelines/:id
 * @desc Atualizar um pipeline
 * @access Private
 */
router.put('/pipelines/:id', crmController.updatePipeline);

/**
 * @route DELETE /api/crm/pipelines/:id
 * @desc Excluir um pipeline
 * @access Private
 */
router.delete('/pipelines/:id', crmController.deletePipeline);

// ==========================================
// PIPELINE STAGES
// ==========================================

/**
 * @route GET /api/crm/pipelines/:pipelineId/stages
 * @desc Obter estágios de um pipeline
 * @access Private
 */
router.get('/pipelines/:pipelineId/stages', crmController.getPipelineStages);

/**
 * @route POST /api/crm/pipelines/:pipelineId/stages
 * @desc Criar estágio no pipeline
 * @body name, description, color, expectedDuration
 * @access Private
 */
router.post('/pipelines/:pipelineId/stages', crmController.createPipelineStage);

/**
 * @route PUT /api/crm/stages/:stageId
 * @desc Atualizar estágio do pipeline
 * @access Private
 */
router.put('/stages/:stageId', crmController.updatePipelineStage);

// ==========================================
// OPPORTUNITIES
// ==========================================

/**
 * @route GET /api/crm/opportunities
 * @desc Listar oportunidades
 * @query stage, pipelineId, leadId, page, limit, sortBy, sortOrder
 * @access Private
 */
router.get('/opportunities', crmController.listOpportunities);

/**
 * @route GET /api/crm/opportunities/:id
 * @desc Obter oportunidade específica
 * @access Private
 */
router.get('/opportunities/:id', crmController.getOpportunity);

/**
 * @route POST /api/crm/opportunities
 * @desc Criar nova oportunidade
 * @body title, description, value, currency, probability, expectedCloseDate, stage, leadId, pipelineId, assignedTo
 * @access Private
 */
router.post('/opportunities', crmController.createOpportunity);

/**
 * @route PUT /api/crm/opportunities/:id
 * @desc Atualizar oportunidade
 * @access Private
 */
router.put('/opportunities/:id', crmController.updateOpportunity);

/**
 * @route PUT /api/crm/opportunities/:id/stage
 * @desc Mover oportunidade para outro estágio
 * @body newStage, reason
 * @access Private
 */
router.put('/opportunities/:id/stage', crmController.moveOpportunityStage);

/**
 * @route PUT /api/crm/opportunities/:id/close
 * @desc Fechar oportunidade (won/lost)
 * @body status (won/lost), reason, actualValue
 * @access Private
 */
router.put('/opportunities/:id/close', crmController.closeOpportunity);

/**
 * @route GET /api/crm/opportunities/:id/activities
 * @desc Obter atividades de uma oportunidade
 * @access Private
 */
router.get('/opportunities/:id/activities', crmController.getOpportunityActivities);

// ==========================================
// ANALYTICS E RELATÓRIOS
// ==========================================

/**
 * @route GET /api/crm/pipelines/:pipelineId/stats
 * @desc Obter estatísticas do pipeline
 * @query period - week, month, quarter, year
 * @access Private
 */
router.get('/pipelines/:pipelineId/stats', crmController.getPipelineStats);

/**
 * @route GET /api/crm/overview
 * @desc Obter visão geral do CRM
 * @query period - week, month, quarter, year
 * @access Private
 */
router.get('/overview', crmController.getCRMOverview);

/**
 * @route GET /api/crm/pipelines/:pipelineId/funnel
 * @desc Gerar relatório de funil de vendas
 * @query startDate, endDate
 * @access Private
 */
router.get('/pipelines/:pipelineId/funnel', crmController.getSalesFunnelReport);

/**
 * @route GET /api/crm/forecast
 * @desc Obter previsão de vendas
 * @query period - week, month, quarter, year
 * @access Private
 */
router.get('/forecast', crmController.getSalesForecast);

module.exports = router;