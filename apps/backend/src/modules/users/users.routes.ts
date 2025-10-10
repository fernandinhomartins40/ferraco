import { Router } from 'express';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { authenticate, requireRole } from '../../middleware/auth';
import { prisma } from '../../config/database';

// ============================================================================
// Initialize Service and Controller
// ============================================================================

const router = Router();
const service = new UsersService(prisma);
const controller = new UsersController(service);

// ============================================================================
// Protected Routes - All routes require authentication
// ============================================================================

router.use(authenticate);

// ==========================================================================
// Statistics Routes (must come before :id routes)
// ==========================================================================

router.get(
  '/stats',
  requireRole('ADMIN'),
  controller.getStats
);

// ==========================================================================
// CRUD Routes
// ==========================================================================

router.get(
  '/',
  requireRole('ADMIN', 'MANAGER'),
  controller.findAll
);

router.get(
  '/:id',
  requireRole('ADMIN', 'MANAGER'),
  controller.findById
);

router.post(
  '/',
  requireRole('ADMIN'),
  controller.create
);

router.put(
  '/:id',
  requireRole('ADMIN'),
  controller.update
);

router.delete(
  '/:id',
  requireRole('ADMIN'),
  controller.delete
);

// ==========================================================================
// Password Management Routes
// ==========================================================================

router.put(
  '/:id/password',
  requireRole('ADMIN'),
  controller.updatePassword
);

// ==========================================================================
// User Status Management Routes
// ==========================================================================

router.put(
  '/:id/activate',
  requireRole('ADMIN'),
  controller.activate
);

router.put(
  '/:id/deactivate',
  requireRole('ADMIN'),
  controller.deactivate
);

// ============================================================================
// Export Router
// ============================================================================

export default router;
