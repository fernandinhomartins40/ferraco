import { Router } from 'express';
import multer from 'multer';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { LeadsExportService } from './leads.export.service';
import { authenticate, requirePermission } from '../../middleware/auth';
import { prisma } from '../../config/database';

// ============================================================================
// Initialize Service and Controller
// ============================================================================

const router = Router();
const service = new LeadsService(prisma);
const exportService = new LeadsExportService(prisma, service);
const controller = new LeadsController(service, exportService);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos CSV e Excel são permitidos'));
    }
  },
});

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

router.get(
  '/stats/timeline',
  requirePermission('leads', 'read'),
  controller.getStatsTimeline
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
// Export/Import Routes (must come before :id routes)
// ==========================================================================

router.get(
  '/export',
  requirePermission('leads', 'read'),
  controller.export
);

router.post(
  '/import',
  requirePermission('leads', 'create'),
  upload.single('file'),
  controller.import
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
