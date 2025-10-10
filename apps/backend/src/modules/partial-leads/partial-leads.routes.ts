import { Router } from 'express';
import { PartialLeadsController } from './partial-leads.controller';
import { PartialLeadsService } from './partial-leads.service';
import { authenticate, requirePermission } from '../../middleware/auth';
import { prisma } from '../../config/database';

// ============================================================================
// Initialize Service and Controller
// ============================================================================

const router = Router();
const service = new PartialLeadsService(prisma);
const controller = new PartialLeadsController(service);

// ============================================================================
// Protected Routes - All routes require authentication
// ============================================================================

router.use(authenticate);

// ==========================================================================
// Statistics Routes (must come before :id routes)
// ==========================================================================

router.get(
  '/stats',
  requirePermission('partial-leads', 'read'),
  controller.getStats
);

// ==========================================================================
// Session-based Routes (must come before :id routes)
// ==========================================================================

router.get(
  '/session/:sessionId',
  requirePermission('partial-leads', 'read'),
  controller.findBySessionId
);

// ==========================================================================
// Cleanup Routes (must come before :id routes)
// ==========================================================================

router.delete(
  '/cleanup',
  requirePermission('partial-leads', 'delete'),
  controller.cleanup
);

// ==========================================================================
// CRUD Routes
// ==========================================================================

router.get(
  '/',
  requirePermission('partial-leads', 'read'),
  controller.findAll
);

router.post(
  '/',
  requirePermission('partial-leads', 'create'),
  controller.create
);

router.put(
  '/:id',
  requirePermission('partial-leads', 'update'),
  controller.update
);

// ==========================================================================
// Conversion Routes
// ==========================================================================

router.post(
  '/:id/convert',
  requirePermission('partial-leads', 'update'),
  controller.convertToLead
);

router.post(
  '/:id/abandon',
  requirePermission('partial-leads', 'update'),
  controller.markAbandoned
);

// ============================================================================
// Export Router
// ============================================================================

export default router;
