import { Router } from 'express';
import { KanbanColumnController } from '../controllers/kanbanColumn.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const controller = new KanbanColumnController();

// Todas as rotas requerem autenticação
router.use(authenticate);

// GET /api/kanban-columns/stats - Obter estatísticas por coluna (MUST BE BEFORE '/')
router.get('/stats', controller.getStats.bind(controller));

// GET /api/kanban-columns - Listar todas as colunas
router.get('/', controller.getAll.bind(controller));

// POST /api/kanban-columns - Criar nova coluna
router.post('/', controller.create.bind(controller));

// PUT /api/kanban-columns/reorder - Reordenar colunas
router.put('/reorder', controller.reorder.bind(controller));

// PUT /api/kanban-columns/:id - Atualizar coluna
router.put('/:id', controller.update.bind(controller));

// DELETE /api/kanban-columns/:id - Deletar coluna
router.delete('/:id', controller.delete.bind(controller));

export default router;
