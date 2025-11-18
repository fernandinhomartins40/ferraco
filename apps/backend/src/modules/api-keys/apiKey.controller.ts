import { Request, Response } from 'express';
import { apiKeyService } from './apiKey.service';
import { AuthRequest } from '../../middleware/auth';

export class ApiKeyController {
  /**
   * Cria nova API Key
   */
  async createApiKey(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const apiKey = await apiKeyService.createApiKey(userId, req.body);

      res.status(201).json({
        success: true,
        data: apiKey,
        message: 'API Key created successfully. Save the secret - it will not be shown again!',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create API key',
      });
    }
  }

  /**
   * Lista todas as API Keys do usuário
   */
  async listApiKeys(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const includeRevoked = req.query.includeRevoked === 'true';

      const apiKeys = await apiKeyService.listApiKeys(userId, includeRevoked);

      res.json({
        success: true,
        data: apiKeys,
        meta: {
          total: apiKeys.length,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to list API keys',
      });
    }
  }

  /**
   * Busca API Key por ID
   */
  async getApiKey(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const apiKey = await apiKeyService.getApiKeyById(id, userId);

      if (!apiKey) {
        res.status(404).json({
          success: false,
          error: 'API Key not found',
        });
        return;
      }

      res.json({
        success: true,
        data: apiKey,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get API key',
      });
    }
  }

  /**
   * Atualiza API Key
   */
  async updateApiKey(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const apiKey = await apiKeyService.updateApiKey(id, userId, req.body);

      res.json({
        success: true,
        data: apiKey,
        message: 'API Key updated successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update API key',
      });
    }
  }

  /**
   * Revoga API Key
   */
  async revokeApiKey(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await apiKeyService.revokeApiKey(id, userId);

      res.json({
        success: true,
        message: 'API Key revoked successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to revoke API key',
      });
    }
  }

  /**
   * Deleta API Key
   */
  async deleteApiKey(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await apiKeyService.deleteApiKey(id, userId);

      res.json({
        success: true,
        message: 'API Key deleted successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete API key',
      });
    }
  }

  /**
   * Rotaciona API Key (gera nova key/secret)
   */
  async rotateApiKey(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const apiKey = await apiKeyService.rotateApiKey(id, userId);

      res.json({
        success: true,
        data: apiKey,
        message: 'API Key rotated successfully. Save the new secret - it will not be shown again!',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to rotate API key',
      });
    }
  }

  /**
   * Obtém estatísticas de uso
   */
  async getUsageStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { periodStart, periodEnd } = req.query;

      const stats = await apiKeyService.getApiKeyUsageStats(
        id,
        new Date(periodStart as string),
        new Date(periodEnd as string)
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get usage stats',
      });
    }
  }
}

export const apiKeyController = new ApiKeyController();
