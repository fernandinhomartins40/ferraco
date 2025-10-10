import { Router } from 'express';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { authenticate, requirePermission } from '../../middleware/auth';
import { prisma } from '../../config/database';

// ============================================================================
// Notes Routes
// ============================================================================

const router = Router();
const service = new NotesService(prisma);
const controller = new NotesController(service);

// All routes require authentication
router.use(authenticate);

// ==========================================================================
// Notes Routes
// ==========================================================================

/**
 * GET /api/notes
 * List all notes with filters
 */
router.get('/',
  requirePermission('notes', 'read'),
  controller.findAll
);

/**
 * GET /api/notes/lead/:leadId
 * Get all notes for a specific lead
 */
router.get('/lead/:leadId',
  requirePermission('notes', 'read'),
  controller.findByLeadId
);

/**
 * GET /api/notes/search
 * Search notes by content
 */
router.get('/search',
  requirePermission('notes', 'read'),
  controller.search
);

/**
 * GET /api/notes/categories
 * Get all note categories
 */
router.get('/categories',
  requirePermission('notes', 'read'),
  controller.getCategories
);

/**
 * GET /api/notes/important
 * Get all important notes
 */
router.get('/important',
  requirePermission('notes', 'read'),
  controller.findImportant
);

/**
 * GET /api/notes/stats
 * Get notes statistics
 */
router.get('/stats',
  requirePermission('notes', 'read'),
  controller.getStats
);

/**
 * GET /api/notes/:id
 * Get a specific note by ID
 */
router.get('/:id',
  requirePermission('notes', 'read'),
  controller.findById
);

/**
 * POST /api/notes
 * Create a new note
 */
router.post('/',
  requirePermission('notes', 'create'),
  controller.create
);

/**
 * PUT /api/notes/:id
 * Update a note
 */
router.put('/:id',
  requirePermission('notes', 'update'),
  controller.update
);

/**
 * DELETE /api/notes/:id
 * Delete a note
 */
router.delete('/:id',
  requirePermission('notes', 'delete'),
  controller.delete
);

/**
 * PUT /api/notes/:id/important
 * Toggle note importance
 */
router.put('/:id/important',
  requirePermission('notes', 'update'),
  controller.toggleImportant
);

/**
 * POST /api/notes/:id/duplicate
 * Duplicate a note
 */
router.post('/:id/duplicate',
  requirePermission('notes', 'create'),
  controller.duplicate
);

export default router;
