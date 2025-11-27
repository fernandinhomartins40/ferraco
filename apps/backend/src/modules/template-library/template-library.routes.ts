/**
 * Template Library Routes
 */

import { Router } from 'express';
import { TemplateLibraryController } from './template-library.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
const controller = new TemplateLibraryController();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Rotas de utilitários (antes das rotas com :id)
router.post('/preview', controller.preview.bind(controller));
router.get('/stats', controller.getStats.bind(controller));
router.get('/variables', controller.getAvailableVariables.bind(controller));

// CRUD de templates
router.get('/', controller.list.bind(controller));
router.get('/:id', controller.getById.bind(controller));
router.post('/', controller.create.bind(controller));
router.put('/:id', controller.update.bind(controller));
router.delete('/:id', controller.delete.bind(controller));

// Operações especiais
router.post('/:id/duplicate', controller.duplicate.bind(controller));

export default router;
