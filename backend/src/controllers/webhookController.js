const webhookService = require('../services/webhookService');
const logger = require('../utils/logger');

/**
 * Webhook Controller
 * Gerencia todas as operações relacionadas a webhooks e integrações
 */
class WebhookController {
  /**
   * Listar todos os webhooks
   */
  async listWebhooks(req, res) {
    try {
      const result = await webhookService.listWebhooks(req.query);

      logger.info(`Webhooks listed successfully - Found: ${result.data.webhooks.length}`);

      res.status(200).json({
        success: true,
        message: 'Webhooks recuperados com sucesso',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Error listing webhooks:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao listar webhooks',
        error: error.message
      });
    }
  }

  /**
   * Obter um webhook específico
   */
  async getWebhook(req, res) {
    try {
      const { id } = req.params;
      const result = await webhookService.getWebhookById(id);

      logger.info(`Webhook retrieved successfully - ID: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Webhook recuperado com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error(`Error getting webhook ${req.params.id}:`, error);

      const statusCode = error.message.includes('não encontrado') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Criar um novo webhook
   */
  async createWebhook(req, res) {
    try {
      const webhookData = req.body;
      const result = await webhookService.createWebhook(webhookData);

      logger.info(`Webhook created successfully - ID: ${result.data.webhook.id}, URL: ${result.data.webhook.url}`);

      res.status(201).json({
        success: true,
        message: 'Webhook criado com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error('Error creating webhook:', error);

      const statusCode = error.message.includes('já existe') ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Atualizar um webhook
   */
  async updateWebhook(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const result = await webhookService.updateWebhook(id, updateData);

      logger.info(`Webhook updated successfully - ID: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Webhook atualizado com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error(`Error updating webhook ${req.params.id}:`, error);

      const statusCode = error.message.includes('não encontrado') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Excluir um webhook
   */
  async deleteWebhook(req, res) {
    try {
      const { id } = req.params;
      const result = await webhookService.deleteWebhook(id);

      logger.info(`Webhook deleted successfully - ID: ${id}`);

      res.status(200).json({
        success: true,
        message: 'Webhook excluído com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error(`Error deleting webhook ${req.params.id}:`, error);

      const statusCode = error.message.includes('não encontrado') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Ativar ou desativar um webhook
   */
  async toggleWebhookStatus(req, res) {
    try {
      const { id } = req.params;
      const { active } = req.body;
      const result = await webhookService.toggleWebhookStatus(id, active);

      const status = active ? 'ativado' : 'desativado';
      logger.info(`Webhook ${status} successfully - ID: ${id}`);

      res.status(200).json({
        success: true,
        message: `Webhook ${status} com sucesso`,
        data: result.data
      });
    } catch (error) {
      logger.error(`Error toggling webhook status ${req.params.id}:`, error);

      const statusCode = error.message.includes('não encontrado') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Testar um webhook
   */
  async testWebhook(req, res) {
    try {
      const { id } = req.params;
      const { testPayload } = req.body;
      const result = await webhookService.testWebhook(id, testPayload);

      logger.info(`Webhook test completed - ID: ${id}, Status: ${result.data.status}`);

      res.status(200).json({
        success: true,
        message: 'Teste de webhook concluído',
        data: result.data
      });
    } catch (error) {
      logger.error(`Error testing webhook ${req.params.id}:`, error);

      const statusCode = error.message.includes('não encontrado') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Obter entregas de um webhook
   */
  async getWebhookDeliveries(req, res) {
    try {
      const { id } = req.params;
      const result = await webhookService.getWebhookDeliveries(id, req.query);

      logger.info(`Webhook deliveries retrieved - ID: ${id}, Found: ${result.data.deliveries.length}`);

      res.status(200).json({
        success: true,
        message: 'Entregas do webhook recuperadas com sucesso',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error(`Error getting webhook deliveries ${req.params.id}:`, error);

      const statusCode = error.message.includes('não encontrado') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Reenviar entrega falhada
   */
  async retryWebhookDelivery(req, res) {
    try {
      const { deliveryId } = req.params;
      const result = await webhookService.retryWebhookDelivery(deliveryId);

      logger.info(`Webhook delivery retry initiated - Delivery ID: ${deliveryId}`);

      res.status(200).json({
        success: true,
        message: 'Reenvio de webhook iniciado',
        data: result.data
      });
    } catch (error) {
      logger.error(`Error retrying webhook delivery ${req.params.deliveryId}:`, error);

      const statusCode = error.message.includes('não encontrada') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Obter estatísticas de um webhook
   */
  async getWebhookStats(req, res) {
    try {
      const { id } = req.params;
      const { period = 'week' } = req.query;
      const result = await webhookService.getWebhookStats(id, period);

      logger.info(`Webhook stats retrieved - ID: ${id}, Period: ${period}`);

      res.status(200).json({
        success: true,
        message: 'Estatísticas do webhook recuperadas com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error(`Error getting webhook stats ${req.params.id}:`, error);

      const statusCode = error.message.includes('não encontrado') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Obter eventos disponíveis para webhooks
   */
  async getAvailableEvents(req, res) {
    try {
      const events = [
        {
          event: 'lead.created',
          name: 'Lead Criado',
          description: 'Disparado quando um novo lead é criado',
          payload: {
            lead: 'Dados completos do lead',
            timestamp: 'Data/hora do evento'
          }
        },
        {
          event: 'lead.updated',
          name: 'Lead Atualizado',
          description: 'Disparado quando um lead é atualizado',
          payload: {
            lead: 'Dados atualizados do lead',
            changes: 'Campos que foram modificados',
            timestamp: 'Data/hora do evento'
          }
        },
        {
          event: 'lead.status_changed',
          name: 'Status do Lead Alterado',
          description: 'Disparado quando o status do lead muda',
          payload: {
            lead: 'Dados do lead',
            previousStatus: 'Status anterior',
            newStatus: 'Novo status',
            timestamp: 'Data/hora do evento'
          }
        },
        {
          event: 'opportunity.created',
          name: 'Oportunidade Criada',
          description: 'Disparado quando uma nova oportunidade é criada',
          payload: {
            opportunity: 'Dados completos da oportunidade',
            lead: 'Dados do lead relacionado',
            timestamp: 'Data/hora do evento'
          }
        },
        {
          event: 'opportunity.stage_changed',
          name: 'Estágio da Oportunidade Alterado',
          description: 'Disparado quando uma oportunidade muda de estágio',
          payload: {
            opportunity: 'Dados da oportunidade',
            previousStage: 'Estágio anterior',
            newStage: 'Novo estágio',
            timestamp: 'Data/hora do evento'
          }
        },
        {
          event: 'opportunity.closed',
          name: 'Oportunidade Fechada',
          description: 'Disparado quando uma oportunidade é fechada (ganha ou perdida)',
          payload: {
            opportunity: 'Dados da oportunidade',
            status: 'won ou lost',
            value: 'Valor final',
            timestamp: 'Data/hora do evento'
          }
        },
        {
          event: 'automation.executed',
          name: 'Automação Executada',
          description: 'Disparado quando uma automação é executada',
          payload: {
            automation: 'Dados da automação',
            lead: 'Lead que disparou a automação',
            result: 'Resultado da execução',
            timestamp: 'Data/hora do evento'
          }
        }
      ];

      res.status(200).json({
        success: true,
        message: 'Eventos disponíveis recuperados com sucesso',
        data: { events }
      });
    } catch (error) {
      logger.error('Error getting available events:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao recuperar eventos disponíveis',
        error: error.message
      });
    }
  }

  /**
   * Dispara webhook manualmente
   */
  async triggerWebhook(req, res) {
    try {
      const { id } = req.params;
      const { event, payload } = req.body;
      const result = await webhookService.triggerWebhook(id, event, payload);

      logger.info(`Webhook triggered manually - ID: ${id}, Event: ${event}`);

      res.status(200).json({
        success: true,
        message: 'Webhook disparado com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error(`Error triggering webhook ${req.params.id}:`, error);

      const statusCode = error.message.includes('não encontrado') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Obter logs de webhook para debug
   */
  async getWebhookLogs(req, res) {
    try {
      const { id } = req.params;
      const { limit = 50 } = req.query;
      const result = await webhookService.getWebhookLogs(id, limit);

      logger.info(`Webhook logs retrieved - ID: ${id}, Found: ${result.data.logs.length} logs`);

      res.status(200).json({
        success: true,
        message: 'Logs do webhook recuperados com sucesso',
        data: result.data
      });
    } catch (error) {
      logger.error(`Error getting webhook logs ${req.params.id}:`, error);

      const statusCode = error.message.includes('não encontrado') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }
}

module.exports = new WebhookController();