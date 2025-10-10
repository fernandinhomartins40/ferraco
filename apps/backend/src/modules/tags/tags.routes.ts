import { Router } from 'express';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';
import { authenticate } from '../../middleware/auth';
import { prisma } from '../../config/database';

const router = Router();
const service = new TagsService(prisma);
const controller = new TagsController(service);

// Todas as rotas requerem autenticação
router.use(authenticate);

// Rotas especiais (devem vir antes das rotas com :id)
router.get('/system', controller.findSystemTags);
router.get('/popular', controller.getPopular);
router.get('/stats', controller.getStats);

// Regras automáticas
router.post('/rules', controller.createRule);
router.get('/rules', controller.getRules);
router.delete('/rules/:id', controller.deleteRule);
router.post('/apply-rules', controller.applyRules);

// CRUD básico
router.get('/', controller.findAll);
router.get('/:id', controller.findById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
