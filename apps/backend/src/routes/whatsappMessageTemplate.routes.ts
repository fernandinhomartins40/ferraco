import { Router } from 'express';
import { WhatsAppMessageTemplateController } from '../controllers/whatsappMessageTemplate.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const controller = new WhatsAppMessageTemplateController();

// Todas as rotas requerem autenticação
router.use(authenticate);

router.get('/', controller.getAll.bind(controller));
router.get('/:id', controller.getById.bind(controller));
router.post('/', controller.create.bind(controller));
router.put('/:id', controller.update.bind(controller));
router.delete('/:id', controller.delete.bind(controller));

export default router;
