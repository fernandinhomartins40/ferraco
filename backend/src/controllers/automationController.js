const automationService = require('../services/automationService');
const logger = require('../utils/logger');

/**
 * Automation Controller
 * Gerencia todas as operações relacionadas a automações
 */
class AutomationController {
  /**
   * Listar todas as automações com filtros opcionais
   */
  async listAutomations(req, res) {
    try {
      const result = await automationService.listAutomations(req.query);

      logger.info(`Automations listed successfully - Found: ${result.data.automations.length}`);

      res.status(200).json({
        success: true,
        message: 'Automações recuperadas com sucesso',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Error listing automations:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao listar automações',
        error: error.message
      });
    }
  }

  /**
   * Obter uma automação específica por ID
   */
  async getAutomation(req, res) {
    try {
      const { id } = req.params;
      const result = await automationService.getAutomationById(id);

      logger.info(`Automation retrieved successfully - ID: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Automação recuperada com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error(`Error getting automation ${req.params.id}:`, error);

      const statusCode = error.message.includes('não encontrada') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Criar uma nova automação
   */
  async createAutomation(req, res) {
    try {
      const automationData = req.body;
      const result = await automationService.createAutomation(automationData);

      logger.info(`Automation created successfully - ID: ${result.data.automation.id}, Name: ${result.data.automation.name}`);

      res.status(201).json({
        success: true,
        message: 'Automação criada com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error('Error creating automation:', error);

      const statusCode = error.message.includes('já existe') ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Atualizar uma automação existente
   */
  async updateAutomation(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const result = await automationService.updateAutomation(id, updateData);

      logger.info(`Automation updated successfully - ID: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Automação atualizada com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error(`Error updating automation ${req.params.id}:`, error);

      const statusCode = error.message.includes('não encontrada') ? 404 :
                        error.message.includes('já existe') ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Excluir uma automação
   */
  async deleteAutomation(req, res) {
    try {
      const { id } = req.params;
      const result = await automationService.deleteAutomation(id);

      logger.info(`Automation deleted successfully - ID: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Automação excluída com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error(`Error deleting automation ${req.params.id}:`, error);

      const statusCode = error.message.includes('não encontrada') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Ativar ou desativar uma automação
   */
  async toggleAutomationStatus(req, res) {
    try {
      const { id } = req.params;
      const { active } = req.body;
      const result = await automationService.toggleAutomationStatus(id, active);

      const status = active ? 'ativada' : 'desativada';
      logger.info(`Automation ${status} successfully - ID: ${id}`);

      res.status(200).json({
        success: true,
        message: `Automação ${status} com sucesso`,
        data: result.data
      });
    } catch (error) {
      logger.error(`Error toggling automation status ${req.params.id}:`, error);

      const statusCode = error.message.includes('não encontrada') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Testar uma automação sem executar ações
   */
  async testAutomation(req, res) {
    try {
      const { id } = req.params;
      const { testData } = req.body;
      const result = await automationService.testAutomation(id, testData);

      logger.info(`Automation test completed - ID: ${id}, Trigger Match: ${result.data.triggerMatched}`);

      res.status(200).json({
        success: true,
        message: 'Teste de automação concluído',
        data: result.data
      });
    } catch (error) {
      logger.error(`Error testing automation ${req.params.id}:`, error);

      const statusCode = error.message.includes('não encontrada') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Obter execuções de uma automação
   */
  async getAutomationExecutions(req, res) {
    try {
      const { id } = req.params;
      const result = await automationService.getAutomationExecutions(id, req.query);

      logger.info(`Automation executions retrieved - ID: ${id}, Found: ${result.data.executions.length}`);

      res.status(200).json({
        success: true,
        message: 'Execuções da automação recuperadas com sucesso',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error(`Error getting automation executions ${req.params.id}:`, error);

      const statusCode = error.message.includes('não encontrada') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Obter estatísticas de uma automação específica
   */
  async getAutomationStats(req, res) {
    try {
      const { id } = req.params;
      const result = await automationService.getAutomationStats(id);

      logger.info(`Automation stats retrieved - ID: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Estatísticas da automação recuperadas com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error(`Error getting automation stats ${req.params.id}:`, error);

      const statusCode = error.message.includes('não encontrada') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Obter estatísticas gerais das automações
   */
  async getAutomationsOverview(req, res) {
    try {
      const result = await automationService.getAutomationsOverview();

      logger.info('Automations overview retrieved successfully');

      res.status(200).json({
        success: true,
        message: 'Visão geral das automações recuperada com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error('Error getting automations overview:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao recuperar visão geral das automações',
        error: error.message
      });
    }
  }

  /**
   * Executar triggers manualmente para uma automação específica
   */
  async triggerAutomation(req, res) {
    try {
      const { id } = req.params;
      const { leadId, triggerData } = req.body;
      const result = await automationService.processAutomationTriggers('manual', { leadId, ...triggerData }, [id]);

      logger.info(`Manual automation trigger executed - ID: ${id}, Lead: ${leadId}`);

      res.status(200).json({
        success: true,
        message: 'Automação executada manualmente com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error(`Error manually triggering automation ${req.params.id}:`, error);

      const statusCode = error.message.includes('não encontrada') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Obter tipos de triggers disponíveis
   */
  async getTriggerTypes(req, res) {
    try {
      const triggerTypes = [
        {
          type: 'lead_created',
          name: 'Lead Criado',
          description: 'Executa quando um novo lead é criado',
          conditions: ['status', 'tag', 'source', 'customField']
        },
        {
          type: 'lead_updated',
          name: 'Lead Atualizado',
          description: 'Executa quando um lead é atualizado',
          conditions: ['field', 'status', 'tag', 'customField']
        },
        {
          type: 'tag_added',
          name: 'Tag Adicionada',
          description: 'Executa quando uma tag específica é adicionada',
          conditions: ['tagName', 'tagId']
        },
        {
          type: 'status_changed',
          name: 'Status Alterado',
          description: 'Executa quando o status do lead muda',
          conditions: ['from', 'to']
        },
        {
          type: 'time_based',
          name: 'Baseado em Tempo',
          description: 'Executa após um período específico',
          conditions: ['delay', 'unit', 'fromEvent']
        },
        {
          type: 'custom_field',
          name: 'Campo Personalizado',
          description: 'Executa quando um campo personalizado atende uma condição',
          conditions: ['field', 'operator', 'value']
        }
      ];

      res.status(200).json({
        success: true,
        message: 'Tipos de triggers recuperados com sucesso',
        data: { triggerTypes }
      });
    } catch (error) {
      logger.error('Error getting trigger types:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao recuperar tipos de triggers',
        error: error.message
      });
    }
  }

  /**
   * Obter tipos de ações disponíveis
   */
  async getActionTypes(req, res) {
    try {
      const actionTypes = [
        {
          type: 'add_tag',
          name: 'Adicionar Tag',
          description: 'Adiciona uma tag ao lead',
          parameters: ['tagName', 'tagId']
        },
        {
          type: 'remove_tag',
          name: 'Remover Tag',
          description: 'Remove uma tag do lead',
          parameters: ['tagName', 'tagId']
        },
        {
          type: 'update_status',
          name: 'Atualizar Status',
          description: 'Altera o status do lead',
          parameters: ['newStatus']
        },
        {
          type: 'add_note',
          name: 'Adicionar Nota',
          description: 'Adiciona uma nota ao lead',
          parameters: ['content', 'type']
        },
        {
          type: 'send_webhook',
          name: 'Enviar Webhook',
          description: 'Envia dados para um webhook externo',
          parameters: ['url', 'method', 'headers', 'payload']
        },
        {
          type: 'assign_to',
          name: 'Atribuir Para',
          description: 'Atribui o lead a um usuário específico',
          parameters: ['userId', 'userName']
        }
      ];

      res.status(200).json({
        success: true,
        message: 'Tipos de ações recuperados com sucesso',
        data: { actionTypes }
      });
    } catch (error) {
      logger.error('Error getting action types:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao recuperar tipos de ações',
        error: error.message
      });
    }
  }
}

module.exports = new AutomationController();