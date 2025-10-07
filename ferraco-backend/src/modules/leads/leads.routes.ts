import { Router } from 'express';
import { LeadsController } from './leads.controller';
import { validate } from '../../middleware/validation';
import { authMiddleware, requirePermission } from '../../middleware/auth';
import {
  createLeadSchema,
  updateLeadSchema,
  updateLeadStatusSchema,
  leadFiltersSchema,
  leadIdSchema,
} from './leads.validators';

const router = Router();
const leadsController = new LeadsController();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

/**
 * @route GET /api/leads/stats
 * @desc Obter estatísticas de leads
 * @access Private (leads:read)
 */
router.get(
  '/stats',
  requirePermission('leads:read'),
  leadsController.getLeadStats.bind(leadsController)
);

/**
 * @route GET /api/leads
 * @desc Listar leads
 * @access Private (leads:read)
 */
router.get(
  '/',
  requirePermission('leads:read'),
  validate(leadFiltersSchema),
  leadsController.getLeads.bind(leadsController)
);

/**
 * @route GET /api/leads/:id
 * @desc Obter lead por ID
 * @access Private (leads:read)
 */
router.get(
  '/:id',
  requirePermission('leads:read'),
  validate(leadIdSchema),
  leadsController.getLeadById.bind(leadsController)
);

/**
 * @route POST /api/leads
 * @desc Criar novo lead
 * @access Private (leads:write)
 */
router.post(
  '/',
  requirePermission('leads:write'),
  validate(createLeadSchema),
  leadsController.createLead.bind(leadsController)
);

/**
 * @route PUT /api/leads/:id
 * @desc Atualizar lead
 * @access Private (leads:write)
 */
router.put(
  '/:id',
  requirePermission('leads:write'),
  validate(leadIdSchema),
  validate(updateLeadSchema),
  leadsController.updateLead.bind(leadsController)
);

/**
 * @route PATCH /api/leads/:id/status
 * @desc Atualizar status do lead
 * @access Private (leads:write)
 */
router.patch(
  '/:id/status',
  requirePermission('leads:write'),
  validate(leadIdSchema),
  validate(updateLeadStatusSchema),
  leadsController.updateLeadStatus.bind(leadsController)
);

/**
 * @route DELETE /api/leads/:id
 * @desc Deletar lead
 * @access Private (leads:delete)
 */
router.delete(
  '/:id',
  requirePermission('leads:delete'),
  validate(leadIdSchema),
  leadsController.deleteLead.bind(leadsController)
);

export default router;
