import { Router } from 'express';
import { authenticateDual, requireApiKeyScope, logApiUsage } from '../../middleware/apiKeyAuth';
import { responseHelpers } from '../../utils/apiResponse';

// Import controllers
import { LeadsController } from '../leads/leads.controller';
import { LeadsService } from '../leads/leads.service';
import { LeadsExportService } from '../leads/leads.export.service';
import { webhookRoutes } from '../webhooks';
import { batchRoutes } from '../batch';
import { prisma } from '../../config/database';

const router = Router();

// Middleware global
router.use(responseHelpers);
router.use((req, res, next) => {
  const startTime = Date.now();
  logApiUsage(startTime)(req, res, next);
});
router.use(authenticateDual);

// Initialize Leads controller
const leadsService = new LeadsService(prisma);
const leadsExportService = new LeadsExportService(prisma, leadsService);
const leadsController = new LeadsController(leadsService, leadsExportService);

// ============================================================================
// LEADS ENDPOINTS
// ============================================================================

/**
 * @swagger
 * /api/v1/external/leads:
 *   get:
 *     summary: Lista todos os leads
 *     description: Retorna uma lista paginada de leads com filtros opcionais
 *     tags: [Leads]
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 *         ApiSecretAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Itens por página
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [NOVO, QUALIFICADO, EM_ANDAMENTO, CONCLUIDO, PERDIDO, ARQUIVADO]
 *         description: Filtrar por status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nome, email ou telefone
 *     responses:
 *       200:
 *         description: Lista de leads retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Lead'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/leads', requireApiKeyScope('leads:read'), leadsController.findAll.bind(leadsController));

/**
 * @swagger
 * /api/v1/external/leads/{id}:
 *   get:
 *     summary: Busca um lead por ID
 *     description: Retorna os detalhes de um lead específico
 *     tags: [Leads]
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 *         ApiSecretAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do lead
 *     responses:
 *       200:
 *         description: Lead encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Lead'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/leads/:id', requireApiKeyScope('leads:read'), leadsController.findById.bind(leadsController));

/**
 * @swagger
 * /api/v1/external/leads:
 *   post:
 *     summary: Cria um novo lead
 *     description: Cria um novo lead no sistema
 *     tags: [Leads]
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 *         ApiSecretAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateLeadInput'
 *     responses:
 *       201:
 *         description: Lead criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Lead'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/leads', requireApiKeyScope('leads:write'), leadsController.create.bind(leadsController));

/**
 * @swagger
 * /api/v1/external/leads/{id}:
 *   put:
 *     summary: Atualiza um lead
 *     description: Atualiza os dados de um lead existente
 *     tags: [Leads]
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 *         ApiSecretAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do lead
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateLeadInput'
 *     responses:
 *       200:
 *         description: Lead atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Lead'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.put('/leads/:id', requireApiKeyScope('leads:write'), leadsController.update.bind(leadsController));

/**
 * @swagger
 * /api/v1/external/leads/{id}:
 *   delete:
 *     summary: Deleta um lead
 *     description: Remove um lead do sistema permanentemente
 *     tags: [Leads]
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 *         ApiSecretAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do lead
 *     responses:
 *       200:
 *         description: Lead deletado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Lead deletado com sucesso
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.delete('/leads/:id', requireApiKeyScope('leads:delete'), leadsController.delete.bind(leadsController));

// ============================================================================
// WEBHOOKS & BATCH
// ============================================================================

router.use('/webhooks', webhookRoutes);
router.use('/batch', batchRoutes);

export default router;
