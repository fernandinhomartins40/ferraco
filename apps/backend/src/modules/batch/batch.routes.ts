import { Router } from 'express';
import { batchController } from './batch.controller';
import { authenticateDual } from '../../middleware/apiKeyAuth';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateDual);

/**
 * @route   POST /api/v1/external/batch
 * @desc    Executa múltiplas operações em lote
 * @access  Private (JWT ou API Key)
 */
router.post('/', batchController.executeBatch.bind(batchController));

export default router;
