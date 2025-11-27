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
 * @swagger
 * /api/api-keys:
 *   post:
 *     summary: Cria uma nova API Key
 *     description: Cria uma nova chave de API com permissões e limites configuráveis
 *     tags: [API Keys]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, scopes]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Integração Zapier
 *               scopes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["leads:read", "leads:write"]
 *               rateLimitPerHour:
 *                 type: integer
 *                 default: 1000
 *               rateLimitPerDay:
 *                 type: integer
 *                 default: 10000
 *     responses:
 *       201:
 *         description: API Key criada com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/', validate(createApiKeySchema), apiKeyController.createApiKey.bind(apiKeyController));

/**
 * @swagger
 * /api/api-keys:
 *   get:
 *     summary: Lista todas as API Keys
 *     description: Retorna todas as API Keys do usuário autenticado
 *     tags: [API Keys]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de API Keys
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', validate(listApiKeysSchema), apiKeyController.listApiKeys.bind(apiKeyController));

/**
 * @swagger
 * /api/api-keys/{id}:
 *   get:
 *     summary: Busca uma API Key por ID
 *     description: Retorna os detalhes de uma API Key específica
 *     tags: [API Keys]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: API Key encontrada
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/:id', validate(getApiKeySchema), apiKeyController.getApiKey.bind(apiKeyController));

/**
 * @swagger
 * /api/api-keys/{id}:
 *   put:
 *     summary: Atualiza uma API Key
 *     description: Atualiza nome, scopes ou rate limits de uma API Key
 *     tags: [API Keys]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               scopes:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: API Key atualizada
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/:id', validate(updateApiKeySchema), apiKeyController.updateApiKey.bind(apiKeyController));

/**
 * @swagger
 * /api/api-keys/{id}/revoke:
 *   post:
 *     summary: Revoga uma API Key
 *     description: Revoga uma API Key, impedindo seu uso futuro
 *     tags: [API Keys]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: API Key revogada
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/:id/revoke', validate(getApiKeySchema), apiKeyController.revokeApiKey.bind(apiKeyController));

/**
 * @swagger
 * /api/api-keys/{id}:
 *   delete:
 *     summary: Deleta uma API Key
 *     description: Remove permanentemente uma API Key do sistema
 *     tags: [API Keys]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: API Key deletada
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.delete('/:id', validate(getApiKeySchema), apiKeyController.deleteApiKey.bind(apiKeyController));

/**
 * @swagger
 * /api/api-keys/{id}/rotate:
 *   post:
 *     summary: Rotaciona uma API Key
 *     description: Gera novos valores de key e secret, invalidando os anteriores
 *     tags: [API Keys]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: API Key rotacionada com sucesso
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/:id/rotate', validate(getApiKeySchema), apiKeyController.rotateApiKey.bind(apiKeyController));

/**
 * @swagger
 * /api/api-keys/{id}/usage:
 *   get:
 *     summary: Estatísticas de uso
 *     description: Retorna estatísticas de uso da API Key
 *     tags: [API Keys]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estatísticas retornadas
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/:id/usage', validate(getUsageStatsSchema), apiKeyController.getUsageStats.bind(apiKeyController));

export default router;
