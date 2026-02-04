/**
 * WhatsApp Only Leads Routes
 *
 * Rotas para listar e exportar leads capturados no modo whatsapp_only
 */

import { Router } from 'express';
import { WhatsAppOnlyLeadsController } from './whatsapp-only-leads.controller';
import { authenticate, requirePermission } from '../../middleware/auth';

// ============================================================================
// Initialize Controller
// ============================================================================

const router = Router();
const controller = new WhatsAppOnlyLeadsController();

// ============================================================================
// Protected Routes - Require authentication and leads permission
// ============================================================================

// Todas as rotas requerem autenticação
router.use(authenticate);

/**
 * GET /api/admin/whatsapp-only-leads
 * Listar leads WhatsApp Only com paginação e filtros
 */
router.get(
  '/',
  requirePermission('leads', 'read'),
  controller.list
);

/**
 * GET /api/admin/whatsapp-only-leads/export
 * Exportar leads WhatsApp Only para Excel
 */
router.get(
  '/export',
  requirePermission('leads', 'read'),
  controller.exportToExcel
);

/**
 * GET /api/admin/whatsapp-only-leads/stats
 * Estatísticas dos leads WhatsApp Only
 */
router.get(
  '/stats',
  requirePermission('leads', 'read'),
  controller.getStats
);

// ============================================================================
// Export Router
// ============================================================================

export default router;
