import { Router } from 'express';
import { IntegrationsController } from './integrations.controller';
import { authMiddleware } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import {
  createIntegrationSchema,
  updateIntegrationSchema,
  getIntegrationByIdSchema,
  deleteIntegrationSchema,
  toggleIntegrationSchema,
  testConnectionSchema,
  syncIntegrationSchema,
  getIntegrationsSchema,
} from './integrations.validators';

const router = Router();
const integrationsController = new IntegrationsController();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

/**
 * GET /api/integrations/stats
 * Obter estatísticas de integrações
 */
router.get('/stats', integrationsController.getIntegrationsStats.bind(integrationsController));

/**
 * GET /api/integrations/available-types
 * Obter tipos de integração disponíveis
 */
router.get('/available-types', integrationsController.getAvailableTypes.bind(integrationsController));

/**
 * GET /api/integrations
 * Listar integrações
 */
router.get('/', validate(getIntegrationsSchema), integrationsController.getIntegrations.bind(integrationsController));

/**
 * GET /api/integrations/:id
 * Obter integração por ID
 */
router.get('/:id', validate(getIntegrationByIdSchema), integrationsController.getIntegrationById.bind(integrationsController));

/**
 * POST /api/integrations
 * Criar integração
 */
router.post('/', validate(createIntegrationSchema), integrationsController.createIntegration.bind(integrationsController));

/**
 * PUT /api/integrations/:id
 * Atualizar integração
 */
router.put('/:id', validate(updateIntegrationSchema), integrationsController.updateIntegration.bind(integrationsController));

/**
 * DELETE /api/integrations/:id
 * Deletar integração
 */
router.delete('/:id', validate(deleteIntegrationSchema), integrationsController.deleteIntegration.bind(integrationsController));

/**
 * PATCH /api/integrations/:id/toggle
 * Ativar/desativar integração
 */
router.patch('/:id/toggle', validate(toggleIntegrationSchema), integrationsController.toggleIntegration.bind(integrationsController));

/**
 * POST /api/integrations/:id/test
 * Testar conexão da integração
 */
router.post('/:id/test', validate(testConnectionSchema), integrationsController.testConnection.bind(integrationsController));

/**
 * POST /api/integrations/:id/sync
 * Sincronizar integração
 */
router.post('/:id/sync', validate(syncIntegrationSchema), integrationsController.syncIntegration.bind(integrationsController));

export default router;
