const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const crypto = require('crypto');
const axios = require('axios');

const prisma = new PrismaClient();

/**
 * Webhook Service
 * Serviços relacionados a webhooks e integrações externas
 */
class WebhookService {
  /**
   * Lista todos os webhooks
   */
  async listWebhooks(filters = {}) {
    try {
      const {
        isActive,
        event,
        page = 1,
        limit = 20
      } = filters;

      const skip = (page - 1) * limit;

      const where = {};
      if (isActive !== undefined) where.isActive = isActive === 'true';
      if (event) {
        where.events = {
          contains: event
        };
      }

      const webhooks = await prisma.webhook.findMany({
        where,
        include: {
          deliveries: {
            orderBy: { deliveredAt: 'desc' },
            take: 5
          },
          _count: {
            select: {
              deliveries: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      });

      const total = await prisma.webhook.count({ where });

      // Calcular estatísticas para cada webhook
      const webhooksWithStats = await Promise.all(
        webhooks.map(async (webhook) => {
          const stats = await this._calculateWebhookStats(webhook.id);
          return {
            ...webhook,
            events: JSON.parse(webhook.events),
            headers: webhook.headers ? JSON.parse(webhook.headers) : null,
            retryPolicy: JSON.parse(webhook.retryPolicy),
            stats
          };
        })
      );

      return {
        success: true,
        data: { webhooks: webhooksWithStats },
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error in listWebhooks:', error);
      throw error;
    }
  }

  /**
   * Obtém um webhook específico por ID
   */
  async getWebhookById(webhookId) {
    try {
      const webhook = await prisma.webhook.findUnique({
        where: { id: webhookId },
        include: {
          deliveries: {
            orderBy: { deliveredAt: 'desc' },
            take: 10
          }
        }
      });

      if (!webhook) {
        throw new Error('Webhook não encontrado');
      }

      const stats = await this._calculateWebhookStats(webhookId);

      return {
        success: true,
        data: {
          webhook: {
            ...webhook,
            events: JSON.parse(webhook.events),
            headers: webhook.headers ? JSON.parse(webhook.headers) : null,
            retryPolicy: JSON.parse(webhook.retryPolicy),
            stats
          }
        }
      };
    } catch (error) {
      logger.error('Error in getWebhookById:', error);
      throw error;
    }
  }

  /**
   * Cria um novo webhook
   */
  async createWebhook(webhookData) {
    try {
      const {
        name,
        url,
        events,
        headers = {},
        secret,
        retryPolicy = {
          maxAttempts: 3,
          backoffMultiplier: 2,
          initialDelay: 1000
        }
      } = webhookData;

      // Validar URL
      if (!this._isValidUrl(url)) {
        throw new Error('URL inválida');
      }

      // Verificar se já existe webhook com mesma URL
      const existingWebhook = await prisma.webhook.findFirst({
        where: { url }
      });

      if (existingWebhook) {
        throw new Error('Já existe um webhook com esta URL');
      }

      // Gerar secret se não fornecido
      const webhookSecret = secret || crypto.randomBytes(32).toString('hex');

      const webhook = await prisma.webhook.create({
        data: {
          name,
          url,
          events: JSON.stringify(events),
          secret: webhookSecret,
          headers: headers ? JSON.stringify(headers) : null,
          retryPolicy: JSON.stringify(retryPolicy)
        }
      });

      return {
        success: true,
        data: {
          webhook: {
            ...webhook,
            events: JSON.parse(webhook.events),
            headers: webhook.headers ? JSON.parse(webhook.headers) : null,
            retryPolicy: JSON.parse(webhook.retryPolicy)
          }
        }
      };
    } catch (error) {
      logger.error('Error in createWebhook:', error);
      throw error;
    }
  }

  /**
   * Atualiza um webhook
   */
  async updateWebhook(webhookId, updateData) {
    try {
      const webhook = await prisma.webhook.findUnique({
        where: { id: webhookId }
      });

      if (!webhook) {
        throw new Error('Webhook não encontrado');
      }

      // Preparar dados para atualização
      const updateFields = { ...updateData };

      if (updateData.events) {
        updateFields.events = JSON.stringify(updateData.events);
      }

      if (updateData.headers) {
        updateFields.headers = JSON.stringify(updateData.headers);
      }

      if (updateData.retryPolicy) {
        updateFields.retryPolicy = JSON.stringify(updateData.retryPolicy);
      }

      const updatedWebhook = await prisma.webhook.update({
        where: { id: webhookId },
        data: updateFields
      });

      return {
        success: true,
        data: {
          webhook: {
            ...updatedWebhook,
            events: JSON.parse(updatedWebhook.events),
            headers: updatedWebhook.headers ? JSON.parse(updatedWebhook.headers) : null,
            retryPolicy: JSON.parse(updatedWebhook.retryPolicy)
          }
        }
      };
    } catch (error) {
      logger.error('Error in updateWebhook:', error);
      throw error;
    }
  }

  /**
   * Exclui um webhook
   */
  async deleteWebhook(webhookId) {
    try {
      const webhook = await prisma.webhook.findUnique({
        where: { id: webhookId }
      });

      if (!webhook) {
        throw new Error('Webhook não encontrado');
      }

      await prisma.webhook.delete({
        where: { id: webhookId }
      });

      return {
        success: true,
        data: { message: 'Webhook excluído com sucesso' }
      };
    } catch (error) {
      logger.error('Error in deleteWebhook:', error);
      throw error;
    }
  }

  /**
   * Ativa ou desativa um webhook
   */
  async toggleWebhookStatus(webhookId, isActive) {
    try {
      const webhook = await prisma.webhook.findUnique({
        where: { id: webhookId }
      });

      if (!webhook) {
        throw new Error('Webhook não encontrado');
      }

      const updatedWebhook = await prisma.webhook.update({
        where: { id: webhookId },
        data: { isActive }
      });

      return {
        success: true,
        data: { webhook: updatedWebhook }
      };
    } catch (error) {
      logger.error('Error in toggleWebhookStatus:', error);
      throw error;
    }
  }

  /**
   * Testa um webhook
   */
  async testWebhook(webhookId, testPayload = {}) {
    try {
      const webhook = await prisma.webhook.findUnique({
        where: { id: webhookId }
      });

      if (!webhook) {
        throw new Error('Webhook não encontrado');
      }

      const payload = {
        event: 'webhook.test',
        timestamp: new Date().toISOString(),
        data: testPayload,
        test: true
      };

      const delivery = await this._deliverWebhook(webhook, 'webhook.test', payload);

      return {
        success: true,
        data: {
          status: delivery.status,
          httpStatus: delivery.httpStatus,
          response: delivery.response,
          deliveredAt: delivery.deliveredAt
        }
      };
    } catch (error) {
      logger.error('Error in testWebhook:', error);
      throw error;
    }
  }

  /**
   * Obtém entregas de um webhook
   */
  async getWebhookDeliveries(webhookId, filters = {}) {
    try {
      const {
        status,
        event,
        page = 1,
        limit = 20
      } = filters;

      const skip = (page - 1) * limit;

      const where = { webhookId };
      if (status) where.status = status;
      if (event) where.event = event;

      const deliveries = await prisma.webhookDelivery.findMany({
        where,
        orderBy: { deliveredAt: 'desc' },
        skip,
        take: parseInt(limit)
      });

      const total = await prisma.webhookDelivery.count({ where });

      return {
        success: true,
        data: { deliveries },
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error in getWebhookDeliveries:', error);
      throw error;
    }
  }

  /**
   * Reenvia uma entrega falhada
   */
  async retryWebhookDelivery(deliveryId) {
    try {
      const delivery = await prisma.webhookDelivery.findUnique({
        where: { id: deliveryId },
        include: { webhook: true }
      });

      if (!delivery) {
        throw new Error('Entrega não encontrada');
      }

      if (delivery.status === 'SUCCESS') {
        throw new Error('Não é possível reenviar uma entrega bem-sucedida');
      }

      const payload = JSON.parse(delivery.payload);
      const newDelivery = await this._deliverWebhook(delivery.webhook, delivery.event, payload);

      return {
        success: true,
        data: { delivery: newDelivery }
      };
    } catch (error) {
      logger.error('Error in retryWebhookDelivery:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de um webhook
   */
  async getWebhookStats(webhookId, period = 'week') {
    try {
      const webhook = await prisma.webhook.findUnique({
        where: { id: webhookId }
      });

      if (!webhook) {
        throw new Error('Webhook não encontrado');
      }

      const periodDays = this._getPeriodDays(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      const stats = await this._calculateWebhookStats(webhookId, startDate);

      return {
        success: true,
        data: { stats }
      };
    } catch (error) {
      logger.error('Error in getWebhookStats:', error);
      throw error;
    }
  }

  /**
   * Dispara webhook manualmente
   */
  async triggerWebhook(webhookId, event, payload) {
    try {
      const webhook = await prisma.webhook.findUnique({
        where: { id: webhookId }
      });

      if (!webhook) {
        throw new Error('Webhook não encontrado');
      }

      const webhookPayload = {
        event,
        timestamp: new Date().toISOString(),
        data: payload,
        manual: true
      };

      const delivery = await this._deliverWebhook(webhook, event, webhookPayload);

      return {
        success: true,
        data: { delivery }
      };
    } catch (error) {
      logger.error('Error in triggerWebhook:', error);
      throw error;
    }
  }

  /**
   * Dispara webhooks para um evento específico
   */
  async triggerWebhooksForEvent(event, payload) {
    try {
      const webhooks = await prisma.webhook.findMany({
        where: {
          isActive: true,
          events: {
            contains: event
          }
        }
      });

      const webhookPayload = {
        event,
        timestamp: new Date().toISOString(),
        data: payload
      };

      const deliveries = await Promise.all(
        webhooks.map(webhook => this._deliverWebhook(webhook, event, webhookPayload))
      );

      logger.info(`Triggered ${deliveries.length} webhooks for event: ${event}`);

      return {
        success: true,
        data: {
          deliveries,
          webhookCount: webhooks.length
        }
      };
    } catch (error) {
      logger.error('Error in triggerWebhooksForEvent:', error);
      throw error;
    }
  }

  /**
   * Obtém logs de webhook para debug
   */
  async getWebhookLogs(webhookId, limit = 50) {
    try {
      const webhook = await prisma.webhook.findUnique({
        where: { id: webhookId }
      });

      if (!webhook) {
        throw new Error('Webhook não encontrado');
      }

      const logs = await prisma.webhookDelivery.findMany({
        where: { webhookId },
        orderBy: { deliveredAt: 'desc' },
        take: parseInt(limit),
        select: {
          id: true,
          event: true,
          status: true,
          httpStatus: true,
          response: true,
          attemptCount: true,
          deliveredAt: true
        }
      });

      return {
        success: true,
        data: { logs }
      };
    } catch (error) {
      logger.error('Error in getWebhookLogs:', error);
      throw error;
    }
  }

  // ==========================================
  // MÉTODOS PRIVADOS
  // ==========================================

  /**
   * Entrega webhook para URL específica
   */
  async _deliverWebhook(webhook, event, payload) {
    try {
      const events = JSON.parse(webhook.events);

      // Verificar se o webhook está inscrito neste evento
      if (!events.includes(event)) {
        logger.debug(`Webhook ${webhook.id} not subscribed to event: ${event}`);
        return null;
      }

      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Ferraco-CRM-Webhook/1.0'
      };

      // Adicionar headers customizados
      if (webhook.headers) {
        const customHeaders = JSON.parse(webhook.headers);
        Object.assign(headers, customHeaders);
      }

      // Adicionar assinatura se secret estiver configurado
      if (webhook.secret) {
        const signature = this._generateSignature(payload, webhook.secret);
        headers['X-Webhook-Signature'] = signature;
      }

      let delivery;
      let attempt = 0;
      const retryPolicy = JSON.parse(webhook.retryPolicy);
      const maxAttempts = retryPolicy.maxAttempts || 3;

      while (attempt < maxAttempts) {
        try {
          attempt++;

          const response = await axios.post(webhook.url, payload, {
            headers,
            timeout: 30000 // 30 segundos
          });

          // Sucesso
          delivery = await prisma.webhookDelivery.create({
            data: {
              webhookId: webhook.id,
              event,
              payload: JSON.stringify(payload),
              status: 'SUCCESS',
              httpStatus: response.status,
              response: JSON.stringify({
                headers: response.headers,
                data: response.data
              }).substring(0, 5000), // Limitar tamanho
              attemptCount: attempt
            }
          });

          logger.info(`Webhook delivered successfully: ${webhook.id} - ${event}`);
          break;

        } catch (error) {
          const isLastAttempt = attempt >= maxAttempts;

          if (isLastAttempt) {
            // Falha definitiva
            delivery = await prisma.webhookDelivery.create({
              data: {
                webhookId: webhook.id,
                event,
                payload: JSON.stringify(payload),
                status: 'FAILED',
                httpStatus: error.response?.status || 0,
                response: error.message.substring(0, 1000),
                attemptCount: attempt
              }
            });

            logger.error(`Webhook delivery failed permanently: ${webhook.id} - ${event}`, error);
          } else {
            // Aguardar antes da próxima tentativa
            const delay = retryPolicy.initialDelay * Math.pow(retryPolicy.backoffMultiplier, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      return delivery;
    } catch (error) {
      logger.error('Error in _deliverWebhook:', error);
      throw error;
    }
  }

  /**
   * Gera assinatura para webhook
   */
  _generateSignature(payload, secret) {
    const payloadString = JSON.stringify(payload);
    return 'sha256=' + crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');
  }

  /**
   * Valida se URL é válida
   */
  _isValidUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Calcula estatísticas de webhook
   */
  async _calculateWebhookStats(webhookId, startDate = null) {
    try {
      const where = { webhookId };
      if (startDate) {
        where.deliveredAt = { gte: startDate };
      }

      const totalDeliveries = await prisma.webhookDelivery.count({ where });

      const successfulDeliveries = await prisma.webhookDelivery.count({
        where: { ...where, status: 'SUCCESS' }
      });

      const failedDeliveries = await prisma.webhookDelivery.count({
        where: { ...where, status: 'FAILED' }
      });

      const pendingDeliveries = await prisma.webhookDelivery.count({
        where: { ...where, status: 'PENDING' }
      });

      const successRate = totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries * 100) : 0;

      // Estatísticas por evento
      const eventStats = await prisma.webhookDelivery.groupBy({
        by: ['event'],
        where,
        _count: true
      });

      return {
        totalDeliveries,
        successfulDeliveries,
        failedDeliveries,
        pendingDeliveries,
        successRate: parseFloat(successRate.toFixed(2)),
        eventStats: eventStats.map(stat => ({
          event: stat.event,
          count: stat._count
        }))
      };
    } catch (error) {
      logger.error('Error calculating webhook stats:', error);
      return {
        totalDeliveries: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
        pendingDeliveries: 0,
        successRate: 0,
        eventStats: []
      };
    }
  }

  /**
   * Obtém número de dias baseado no período
   */
  _getPeriodDays(period) {
    const periodMap = {
      'day': 1,
      'week': 7,
      'month': 30,
      'quarter': 90,
      'year': 365
    };
    return periodMap[period] || 7;
  }
}

module.exports = new WebhookService();