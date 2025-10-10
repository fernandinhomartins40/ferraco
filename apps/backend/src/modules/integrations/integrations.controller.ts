// ============================================================================
// Integrations Module - Controller
// ============================================================================

import { Request, Response } from 'express';
import { integrationsService } from './integrations.service';
import { AuthRequest } from '../../middleware/auth';

export class IntegrationsController {
  // ============================================================================
  // CRUD Operations
  // ============================================================================

  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const integration = await integrationsService.create(req.body, userId);

      res.status(201).json({
        success: true,
        data: integration,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar integração',
      });
    }
  }

  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const integrations = await integrationsService.findAll();

      res.status(200).json({
        success: true,
        data: integrations,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar integrações',
      });
    }
  }

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const integration = await integrationsService.findById(id);

      if (!integration) {
        res.status(404).json({
          success: false,
          error: 'Integração não encontrada',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: integration,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar integração',
      });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const integration = await integrationsService.update(id, { ...req.body, id });

      res.status(200).json({
        success: true,
        data: integration,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar integração',
      });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await integrationsService.delete(id);

      res.status(200).json({
        success: true,
        message: 'Integração deletada com sucesso',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao deletar integração',
      });
    }
  }

  // ============================================================================
  // Test & Sync Operations
  // ============================================================================

  async test(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await integrationsService.test(id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao testar integração',
      });
    }
  }

  async sync(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await integrationsService.sync(id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao sincronizar integração',
      });
    }
  }

  // ============================================================================
  // Webhook Handlers
  // ============================================================================

  async handleZapierWebhook(req: Request, res: Response): Promise<void> {
    try {
      const payload = {
        event: req.body.event || 'unknown',
        data: req.body.data || req.body,
        timestamp: new Date(req.body.timestamp || Date.now()),
        source: 'Zapier',
      };

      await integrationsService.handleZapierWebhook(payload);

      res.status(200).json({
        success: true,
        message: 'Webhook processado com sucesso',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao processar webhook do Zapier',
      });
    }
  }

  async handleMakeWebhook(req: Request, res: Response): Promise<void> {
    try {
      const payload = {
        event: req.body.event || 'unknown',
        data: req.body.data || req.body,
        timestamp: new Date(req.body.timestamp || Date.now()),
        source: 'Make',
      };

      await integrationsService.handleMakeWebhook(payload);

      res.status(200).json({
        success: true,
        message: 'Webhook processado com sucesso',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao processar webhook do Make',
      });
    }
  }

  // ============================================================================
  // Logs
  // ============================================================================

  async getLogs(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const logs = await integrationsService.getLogs(id, limit);

      res.status(200).json({
        success: true,
        data: logs,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar logs',
      });
    }
  }
}

export const integrationsController = new IntegrationsController();
