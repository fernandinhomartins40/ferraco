import { Response } from 'express';
import { webhookService } from './webhook.service';
import { ApiKeyAuthRequest } from '../../middleware/apiKeyAuth';

export class WebhookController {
  /**
   * Cria novo webhook
   */
  async createWebhook(req: ApiKeyAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.apiKey) {
        res.status(401).json({
          success: false,
          error: 'API Key authentication required',
        });
        return;
      }

      const webhook = await webhookService.createWebhook(req.apiKey.id, req.body);

      res.status(201).json({
        success: true,
        data: webhook,
        message: 'Webhook created successfully. Save the secret - it will not be shown again!',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create webhook',
      });
    }
  }

  /**
   * Lista webhooks
   */
  async listWebhooks(req: ApiKeyAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.apiKey) {
        res.status(401).json({
          success: false,
          error: 'API Key authentication required',
        });
        return;
      }

      const webhooks = await webhookService.listWebhooks(req.apiKey.id);

      res.json({
        success: true,
        data: webhooks,
        meta: {
          total: webhooks.length,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to list webhooks',
      });
    }
  }

  /**
   * Busca webhook por ID
   */
  async getWebhook(req: ApiKeyAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.apiKey) {
        res.status(401).json({
          success: false,
          error: 'API Key authentication required',
        });
        return;
      }

      const { id } = req.params;
      const webhook = await webhookService.getWebhookById(id, req.apiKey.id);

      if (!webhook) {
        res.status(404).json({
          success: false,
          error: 'Webhook not found',
        });
        return;
      }

      res.json({
        success: true,
        data: webhook,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get webhook',
      });
    }
  }

  /**
   * Atualiza webhook
   */
  async updateWebhook(req: ApiKeyAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.apiKey) {
        res.status(401).json({
          success: false,
          error: 'API Key authentication required',
        });
        return;
      }

      const { id } = req.params;
      const webhook = await webhookService.updateWebhook(id, req.apiKey.id, req.body);

      res.json({
        success: true,
        data: webhook,
        message: 'Webhook updated successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update webhook',
      });
    }
  }

  /**
   * Deleta webhook
   */
  async deleteWebhook(req: ApiKeyAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.apiKey) {
        res.status(401).json({
          success: false,
          error: 'API Key authentication required',
        });
        return;
      }

      const { id } = req.params;
      await webhookService.deleteWebhook(id, req.apiKey.id);

      res.json({
        success: true,
        message: 'Webhook deleted successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete webhook',
      });
    }
  }

  /**
   * Pausa webhook
   */
  async pauseWebhook(req: ApiKeyAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.apiKey) {
        res.status(401).json({
          success: false,
          error: 'API Key authentication required',
        });
        return;
      }

      const { id } = req.params;
      await webhookService.pauseWebhook(id, req.apiKey.id);

      res.json({
        success: true,
        message: 'Webhook paused successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to pause webhook',
      });
    }
  }

  /**
   * Ativa webhook
   */
  async activateWebhook(req: ApiKeyAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.apiKey) {
        res.status(401).json({
          success: false,
          error: 'API Key authentication required',
        });
        return;
      }

      const { id } = req.params;
      await webhookService.activateWebhook(id, req.apiKey.id);

      res.json({
        success: true,
        message: 'Webhook activated successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to activate webhook',
      });
    }
  }

  /**
   * Testa webhook
   */
  async testWebhook(req: ApiKeyAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.apiKey) {
        res.status(401).json({
          success: false,
          error: 'API Key authentication required',
        });
        return;
      }

      const { id } = req.params;
      const result = await webhookService.testWebhook(id, req.apiKey.id);

      res.json({
        success: result.success,
        message: result.message,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to test webhook',
      });
    }
  }

  /**
   * Lista deliveries de um webhook
   */
  async listDeliveries(req: ApiKeyAuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, limit, offset } = req.query;

      const deliveries = await webhookService.listDeliveries(id, {
        status: status as any,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.json({
        success: true,
        data: deliveries,
        meta: {
          total: deliveries.length,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to list deliveries',
      });
    }
  }
}

export const webhookController = new WebhookController();
