import { Router } from 'express';
import { AutomationKanbanController } from '../controllers/automationKanban.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const controller = new AutomationKanbanController();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Configurações globais
router.get('/settings', controller.getSettings.bind(controller));
router.put('/settings', controller.updateSettings.bind(controller));

// Gerenciamento de colunas
router.get('/columns', controller.getAllColumns.bind(controller));
router.post('/columns', controller.createColumn.bind(controller));
router.put('/columns/reorder', controller.reorderColumns.bind(controller));
router.put('/columns/:id', controller.updateColumn.bind(controller));
router.delete('/columns/:id', controller.deleteColumn.bind(controller));

// Gerenciamento de leads
router.get('/leads', controller.getLeadsInAutomation.bind(controller));
router.post('/leads/:leadId/move', controller.moveLeadToColumn.bind(controller));
router.delete('/leads/:leadId', controller.removeLeadFromAutomation.bind(controller));

// Retry de envios
router.post('/leads/:leadId/retry', controller.retryLead.bind(controller));
router.post('/columns/:columnId/retry', controller.retryColumn.bind(controller));
router.post('/retry-all-failed', controller.retryAllFailed.bind(controller));

export default router;
