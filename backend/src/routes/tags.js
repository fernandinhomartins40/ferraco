const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');
const {
  validateRequest,
  validateParams,
  validateQuery,
  createTagSchema,
  updateTagSchema,
  tagFiltersSchema,
  tagIdSchema,
  tagLeadAssociationSchema,
  associationParamsSchema,
  validateUniqueTagName
} = require('../validations/tagValidation');

/**
 * @swagger
 * components:
 *   schemas:
 *     Tag:
 *       type: object
 *       required:
 *         - name
 *         - color
 *       properties:
 *         id:
 *           type: string
 *           description: ID único da tag
 *         name:
 *           type: string
 *           description: Nome da tag
 *           minLength: 2
 *           maxLength: 50
 *         color:
 *           type: string
 *           description: Cor da tag em formato hexadecimal
 *           pattern: ^#[0-9A-Fa-f]{6}$
 *         description:
 *           type: string
 *           description: Descrição da tag
 *           maxLength: 200
 *         category:
 *           type: string
 *           description: Categoria da tag
 *           maxLength: 30
 *         isActive:
 *           type: boolean
 *           description: Se a tag está ativa
 *           default: true
 *         isSystem:
 *           type: boolean
 *           description: Se é uma tag do sistema
 *           default: false
 *         createdBy:
 *           type: string
 *           description: Quem criou a tag
 *           maxLength: 100
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Data da última atualização
 */

/**
 * @swagger
 * /api/tags:
 *   post:
 *     summary: Criar uma nova tag
 *     tags: [Tags]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Tag'
 *     responses:
 *       201:
 *         description: Tag criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Tag'
 *       400:
 *         description: Dados inválidos
 *       409:
 *         description: Tag com este nome já existe
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/',
  validateRequest(createTagSchema),
  validateUniqueTagName,
  tagController.createTag
);

/**
 * @swagger
 * /api/tags:
 *   get:
 *     summary: Buscar todas as tags
 *     tags: [Tags]
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filtrar por status ativo
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtrar por categoria
 *       - in: query
 *         name: isSystem
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filtrar por tags do sistema
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nome ou descrição
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *           default: "1"
 *         description: Página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *           default: "50"
 *         description: Limite por página
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, createdAt, category, isActive]
 *           default: name
 *         description: Campo para ordenação
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Ordem de classificação
 *     responses:
 *       200:
 *         description: Tags recuperadas com sucesso
 *       400:
 *         description: Parâmetros inválidos
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/',
  validateQuery(tagFiltersSchema),
  tagController.getAllTags
);

/**
 * @swagger
 * /api/tags/stats:
 *   get:
 *     summary: Buscar estatísticas de tags
 *     tags: [Tags]
 *     responses:
 *       200:
 *         description: Estatísticas recuperadas com sucesso
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/stats', tagController.getTagStats);

/**
 * @swagger
 * /api/tags/categories:
 *   get:
 *     summary: Buscar tags agrupadas por categoria
 *     tags: [Tags]
 *     responses:
 *       200:
 *         description: Tags agrupadas recuperadas com sucesso
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/categories', tagController.getTagsByCategory);

/**
 * @swagger
 * /api/tags/{id}:
 *   get:
 *     summary: Buscar tag por ID
 *     tags: [Tags]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da tag
 *     responses:
 *       200:
 *         description: Tag recuperada com sucesso
 *       404:
 *         description: Tag não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:id',
  validateParams(tagIdSchema),
  tagController.getTagById
);

/**
 * @swagger
 * /api/tags/{id}:
 *   put:
 *     summary: Atualizar uma tag
 *     tags: [Tags]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da tag
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               color:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Tag atualizada com sucesso
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Operação não permitida em tags do sistema
 *       404:
 *         description: Tag não encontrada
 *       409:
 *         description: Tag com este nome já existe
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/:id',
  validateParams(tagIdSchema),
  validateRequest(updateTagSchema),
  validateUniqueTagName,
  tagController.updateTag
);

/**
 * @swagger
 * /api/tags/{id}:
 *   delete:
 *     summary: Deletar uma tag
 *     tags: [Tags]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da tag
 *     responses:
 *       200:
 *         description: Tag deletada com sucesso
 *       403:
 *         description: Não é possível deletar tags do sistema
 *       404:
 *         description: Tag não encontrada
 *       409:
 *         description: Tag possui leads associados
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:id',
  validateParams(tagIdSchema),
  tagController.deleteTag
);

/**
 * @swagger
 * /api/tags/leads/{leadId}/{tagId}:
 *   post:
 *     summary: Associar tag a um lead
 *     tags: [Tags]
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do lead
 *       - in: path
 *         name: tagId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da tag
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               addedBy:
 *                 type: string
 *                 description: Quem adicionou a tag
 *     responses:
 *       201:
 *         description: Tag associada com sucesso
 *       404:
 *         description: Lead ou tag não encontrados
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/leads/:leadId/:tagId',
  validateParams(associationParamsSchema),
  tagController.addTagToLead
);

/**
 * @swagger
 * /api/tags/leads/{leadId}/{tagId}:
 *   delete:
 *     summary: Remover tag de um lead
 *     tags: [Tags]
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do lead
 *       - in: path
 *         name: tagId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da tag
 *     responses:
 *       200:
 *         description: Tag removida com sucesso
 *       404:
 *         description: Associação não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/leads/:leadId/:tagId',
  validateParams(associationParamsSchema),
  tagController.removeTagFromLead
);

module.exports = router;