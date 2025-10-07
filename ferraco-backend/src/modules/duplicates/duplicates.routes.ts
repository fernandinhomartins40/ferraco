import { Router } from 'express';
import { DuplicatesController } from './duplicates.controller';
import { authMiddleware } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import {
  findDuplicatesSchema,
  markAsDuplicateSchema,
  unmarkAsDuplicateSchema,
  mergeLeadsSchema,
} from './duplicates.validators';

const router = Router();
const duplicatesController = new DuplicatesController();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

/**
 * GET /api/duplicates/list
 * Listar todos os leads marcados como duplicatas
 */
router.get('/list', duplicatesController.getDuplicateLeads.bind(duplicatesController));

/**
 * POST /api/duplicates/scan
 * Executar varredura completa em busca de duplicatas
 */
router.post('/scan', duplicatesController.scanAllLeads.bind(duplicatesController));

/**
 * GET /api/duplicates/find/:leadId
 * Buscar duplicatas de um lead específico
 */
router.get('/find/:leadId', validate(findDuplicatesSchema), duplicatesController.findDuplicates.bind(duplicatesController));

/**
 * POST /api/duplicates/mark
 * Marcar lead como duplicata
 */
router.post('/mark', validate(markAsDuplicateSchema), duplicatesController.markAsDuplicate.bind(duplicatesController));

/**
 * POST /api/duplicates/unmark/:leadId
 * Desmarcar lead como duplicata
 */
router.post('/unmark/:leadId', validate(unmarkAsDuplicateSchema), duplicatesController.unmarkAsDuplicate.bind(duplicatesController));

/**
 * POST /api/duplicates/merge
 * Mesclar dois leads
 */
router.post('/merge', validate(mergeLeadsSchema), duplicatesController.mergeLeads.bind(duplicatesController));

export default router;
