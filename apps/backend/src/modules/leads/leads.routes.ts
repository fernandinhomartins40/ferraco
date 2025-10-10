import { Router } from 'express';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { authenticate, requirePermission } from '../../middleware/auth';
import { prisma } from '../../config/database';

// ============================================================================
// Initialize Service and Controller
// ============================================================================

const router = Router();
const service = new LeadsService(prisma);
const controller = new LeadsController(service);

// ============================================================================
// Public Routes (if any)
// ============================================================================
// None for now - all routes require authentication

// ============================================================================
// Protected Routes - All routes require authentication
// ============================================================================

router.use(authenticate);

// ==========================================================================
// Statistics Routes (must come before :id routes)
// ==========================================================================

router.get(
  '/stats',
  requirePermission('leads', 'read'),
  controller.getStats
);

router.get(
  '/stats/by-status',
  requirePermission('leads', 'read'),
  controller.getStatsByStatus
);

router.get(
  '/stats/by-source',
  requirePermission('leads', 'read'),
  controller.getStatsBySource
);

// ==========================================================================
// Search and Filter Routes (must come before :id routes)
// ==========================================================================

router.get(
  '/search',
  requirePermission('leads', 'read'),
  controller.search
);

router.get(
  '/filters',
  requirePermission('leads', 'read'),
  controller.advancedFilters
);

// ==========================================================================
// Duplicate Routes (must come before :id routes)
// ==========================================================================

router.get(
  '/duplicates',
  requirePermission('leads', 'read'),
  controller.findDuplicates
);

router.post(
  '/merge',
  requirePermission('leads', 'update'),
  controller.merge
);

// ==========================================================================
// Export Routes (must come before :id routes)
// ==========================================================================

router.get(
  '/export',
  requirePermission('leads', 'read'),
  controller.export
);

// ==========================================================================
// Bulk Operations (must come before :id routes)
// ==========================================================================

router.put(
  '/bulk',
  requirePermission('leads', 'update'),
  controller.bulkUpdate
);

// ==========================================================================
// CRUD Routes
// ==========================================================================

router.post(
  '/',
  requirePermission('leads', 'create'),
  controller.create
);

router.get(
  '/',
  requirePermission('leads', 'read'),
  controller.findAll
);

router.get(
  '/:id',
  requirePermission('leads', 'read'),
  controller.findById
);

router.put(
  '/:id',
  requirePermission('leads', 'update'),
  controller.update
);

router.delete(
  '/:id',
  requirePermission('leads', 'delete'),
  controller.delete
);

// ==========================================================================
// Timeline and History Routes
// ==========================================================================

router.get(
  '/:id/timeline',
  requirePermission('leads', 'read'),
  controller.getTimeline
);

router.get(
  '/:id/history',
  requirePermission('leads', 'read'),
  controller.getHistory
);

// ============================================================================
// Export Router
// ============================================================================

export default router;
