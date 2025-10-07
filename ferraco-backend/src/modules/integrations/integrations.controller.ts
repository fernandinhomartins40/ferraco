import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { IntegrationsService } from './integrations.service';
import { successResponse } from '../../utils/response';

const integrationsService = new IntegrationsService();

export class IntegrationsController {
  /**
   * GET /api/integrations
   */
  async getIntegrations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { type, isEnabled } = req.query;

      const integrations = await integrationsService.getIntegrations({
        type: type as string,
        isEnabled: isEnabled === 'true' ? true : isEnabled === 'false' ? false : undefined,
      });

      res.json(successResponse(integrations, 'Integrações listadas com sucesso'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/integrations/:id
   */
  async getIntegrationById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const integration = await integrationsService.getIntegrationById(id);
      res.json(successResponse(integration, 'Integração encontrada'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/integrations
   */
  async createIntegration(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const integration = await integrationsService.createIntegration(req.body);
      res.status(201).json(successResponse(integration, 'Integração criada com sucesso'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/integrations/:id
   */
  async updateIntegration(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const integration = await integrationsService.updateIntegration(id, req.body);
      res.json(successResponse(integration, 'Integração atualizada com sucesso'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/integrations/:id
   */
  async deleteIntegration(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await integrationsService.deleteIntegration(id);
      res.json(successResponse(result, 'Integração deletada com sucesso'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/integrations/:id/toggle
   */
  async toggleIntegration(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const integration = await integrationsService.toggleIntegration(id);
      res.json(successResponse(integration, 'Status da integração alterado'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/integrations/:id/test
   */
  async testConnection(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await integrationsService.testConnection(id);
      res.json(successResponse(result, 'Teste de conexão realizado'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/integrations/:id/sync
   */
  async syncIntegration(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await integrationsService.syncIntegration(id);
      res.json(successResponse(result, 'Sincronização iniciada'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/integrations/available-types
   */
  async getAvailableTypes(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const types = integrationsService.getAvailableTypes();
      res.json(successResponse(types, 'Tipos disponíveis obtidos'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/integrations/stats
   */
  async getIntegrationsStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const stats = await integrationsService.getIntegrationsStats();
      res.json(successResponse(stats, 'Estatísticas obtidas com sucesso'));
    } catch (error) {
      next(error);
    }
  }
}
