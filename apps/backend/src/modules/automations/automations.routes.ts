import { Router } from 'express';
import { AutomationsController } from './automations.controller';
import { authenticate } from '../../middleware/auth';

// ============================================================================
// Automations Routes
// ============================================================================

const router = Router();
const controller = new AutomationsController();

// All routes require authentication
router.use(authenticate);

// ========================================================================
// CRUD Routes (5 endpoints)
// ========================================================================

// GET /api/automations - List all automations
router.get('/', controller.listAutomations);

// GET /api/automations/:id - Get automation by ID
router.get('/:id', controller.getAutomation);

// POST /api/automations - Create automation
router.post('/', controller.createAutomation);

// PUT /api/automations/:id - Update automation
router.put('/:id', controller.updateAutomation);

// DELETE /api/automations/:id - Delete automation
router.delete('/:id', controller.deleteAutomation);

// ========================================================================
// Action Routes (3 endpoints)
// ========================================================================

// PUT /api/automations/:id/toggle - Toggle automation active/inactive
router.put('/:id/toggle', controller.toggleAutomation);

// POST /api/automations/test - Test automation without saving
router.post('/test', controller.testAutomation);

// POST /api/automations/execute - Execute automation manually
router.post('/execute', controller.executeAutomation);

// ========================================================================
// Statistics & History Routes (2 endpoints)
// ========================================================================

// GET /api/automations/:id/executions - Get execution history for automation
router.get('/:id/executions', controller.getExecutions);

// GET /api/automations/stats/overview - Get automation statistics
router.get('/stats/overview', controller.getStats);

export default router;
