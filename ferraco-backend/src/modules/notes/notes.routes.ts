import { Router } from 'express';
import { NotesController } from './notes.controller';
import { validate } from '../../middleware/validation';
import { authMiddleware, requirePermission } from '../../middleware/auth';
import {
  createNoteSchema,
  updateNoteSchema,
  noteFiltersSchema,
  noteIdSchema,
  leadIdSchema,
} from './notes.validators';

const router = Router();
const notesController = new NotesController();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

/**
 * @route GET /api/notes/stats
 * @desc Obter estatísticas de notas
 * @access Private (notes:read)
 */
router.get(
  '/stats',
  requirePermission('notes:read'),
  notesController.getNoteStats.bind(notesController)
);

/**
 * @route GET /api/notes/categories
 * @desc Obter categorias disponíveis
 * @access Private (notes:read)
 */
router.get(
  '/categories',
  requirePermission('notes:read'),
  notesController.getCategories.bind(notesController)
);

/**
 * @route GET /api/notes
 * @desc Listar notas
 * @access Private (notes:read)
 */
router.get(
  '/',
  requirePermission('notes:read'),
  validate(noteFiltersSchema),
  notesController.getNotes.bind(notesController)
);

/**
 * @route GET /api/notes/:id
 * @desc Obter nota por ID
 * @access Private (notes:read)
 */
router.get(
  '/:id',
  requirePermission('notes:read'),
  validate(noteIdSchema),
  notesController.getNoteById.bind(notesController)
);

/**
 * @route PUT /api/notes/:id
 * @desc Atualizar nota
 * @access Private (notes:write)
 */
router.put(
  '/:id',
  requirePermission('notes:write'),
  validate(noteIdSchema),
  validate(updateNoteSchema),
  notesController.updateNote.bind(notesController)
);

/**
 * @route PATCH /api/notes/:id/importance
 * @desc Toggle importância da nota
 * @access Private (notes:write)
 */
router.patch(
  '/:id/importance',
  requirePermission('notes:write'),
  validate(noteIdSchema),
  notesController.toggleNoteImportance.bind(notesController)
);

/**
 * @route DELETE /api/notes/:id
 * @desc Deletar nota
 * @access Private (notes:delete)
 */
router.delete(
  '/:id',
  requirePermission('notes:delete'),
  validate(noteIdSchema),
  notesController.deleteNote.bind(notesController)
);

/**
 * @route POST /api/notes/:id/duplicate
 * @desc Duplicar nota
 * @access Private (notes:write)
 */
router.post(
  '/:id/duplicate',
  requirePermission('notes:write'),
  validate(noteIdSchema),
  notesController.duplicateNote.bind(notesController)
);

/**
 * @route GET /api/leads/:leadId/notes
 * @desc Obter notas de um lead
 * @access Private (notes:read)
 */
router.get(
  '/leads/:leadId',
  requirePermission('notes:read'),
  validate(leadIdSchema),
  notesController.getLeadNotes.bind(notesController)
);

/**
 * @route POST /api/leads/:leadId/notes
 * @desc Criar nota em um lead
 * @access Private (notes:write)
 */
router.post(
  '/leads/:leadId',
  requirePermission('notes:write'),
  validate(leadIdSchema),
  validate(createNoteSchema),
  notesController.createLeadNote.bind(notesController)
);

export default router;
