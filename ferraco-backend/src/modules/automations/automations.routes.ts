import { Router } from 'express';
import { AutomationsController } from './automations.controller';
import { authMiddleware } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import {
  createAutomationSchema,
  updateAutomationSchema,
  getAutomationByIdSchema,
  deleteAutomationSchema,
  toggleAutomationStatusSchema,
  executeAutomationSchema,
  getAutomationLogsSchema,
  getAutomationsSchema,
} from './automations.validators';

const router = Router();
const automationsController = new AutomationsController();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

/**
 * GET /api/automations/stats
 * Obter estatísticas de automações
 */
router.get('/stats', automationsController.getAutomationStats.bind(automationsController));

/**
 * GET /api/automations
 * Listar automações com filtros
 */
router.get('/', validate(getAutomationsSchema), automationsController.getAutomations.bind(automationsController));

/**
 * GET /api/automations/:id
 * Obter automação por ID
 */
router.get('/:id', validate(getAutomationByIdSchema), automationsController.getAutomationById.bind(automationsController));

/**
 * POST /api/automations
 * Criar nova automação
 */
router.post('/', validate(createAutomationSchema), automationsController.createAutomation.bind(automationsController));

/**
 * PUT /api/automations/:id
 * Atualizar automação
 */
router.put('/:id', validate(updateAutomationSchema), automationsController.updateAutomation.bind(automationsController));

/**
 * DELETE /api/automations/:id
 * Deletar automação
 */
router.delete('/:id', validate(deleteAutomationSchema), automationsController.deleteAutomation.bind(automationsController));

/**
 * PATCH /api/automations/:id/toggle
 * Ativar/desativar automação
 */
router.patch('/:id/toggle', validate(toggleAutomationStatusSchema), automationsController.toggleAutomationStatus.bind(automationsController));

/**
 * POST /api/automations/:id/execute
 * Executar automação manualmente
 */
router.post('/:id/execute', validate(executeAutomationSchema), automationsController.executeAutomation.bind(automationsController));

/**
 * GET /api/automations/:id/logs
 * Obter logs de execução da automação
 */
router.get('/:id/logs', validate(getAutomationLogsSchema), automationsController.getAutomationLogs.bind(automationsController));

export default router;
