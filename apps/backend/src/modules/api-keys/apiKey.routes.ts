import { Router } from 'express';
import { apiKeyController } from './apiKey.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  createApiKeySchema,
  updateApiKeySchema,
  getApiKeySchema,
  listApiKeysSchema,
  getUsageStatsSchema,
} from './apiKey.validators';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

/**
 * @route   POST /api/api-keys
 * @desc    Cria nova API Key
 * @access  Private
 */
router.post('/', validate(createApiKeySchema), apiKeyController.createApiKey.bind(apiKeyController));

/**
 * @route   GET /api/api-keys
 * @desc    Lista todas as API Keys do usuário
 * @access  Private
 */
router.get('/', validate(listApiKeysSchema), apiKeyController.listApiKeys.bind(apiKeyController));

/**
 * @route   GET /api/api-keys/:id
 * @desc    Busca API Key por ID
 * @access  Private
 */
router.get('/:id', validate(getApiKeySchema), apiKeyController.getApiKey.bind(apiKeyController));

/**
 * @route   PUT /api/api-keys/:id
 * @desc    Atualiza API Key
 * @access  Private
 */
router.put('/:id', validate(updateApiKeySchema), apiKeyController.updateApiKey.bind(apiKeyController));

/**
 * @route   POST /api/api-keys/:id/revoke
 * @desc    Revoga API Key
 * @access  Private
 */
router.post('/:id/revoke', validate(getApiKeySchema), apiKeyController.revokeApiKey.bind(apiKeyController));

/**
 * @route   DELETE /api/api-keys/:id
 * @desc    Deleta API Key
 * @access  Private
 */
router.delete('/:id', validate(getApiKeySchema), apiKeyController.deleteApiKey.bind(apiKeyController));

/**
 * @route   POST /api/api-keys/:id/rotate
 * @desc    Rotaciona API Key (gera nova key/secret)
 * @access  Private
 */
router.post('/:id/rotate', validate(getApiKeySchema), apiKeyController.rotateApiKey.bind(apiKeyController));

/**
 * @route   GET /api/api-keys/:id/usage
 * @desc    Obtém estatísticas de uso
 * @access  Private
 */
router.get('/:id/usage', validate(getUsageStatsSchema), apiKeyController.getUsageStats.bind(apiKeyController));

export default router;
