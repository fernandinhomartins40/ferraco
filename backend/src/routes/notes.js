const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const {
  validateRequest,
  validateParams,
  validateQuery,
  createNoteSchema,
  updateNoteSchema,
  noteFiltersSchema,
  noteIdSchema,
  leadIdSchema,
  leadNoteParamsSchema,
  importantNotesFiltersSchema,
  validateNoteContent,
  validatePrivateNoteAccess
} = require('../validations/noteValidation');

/**
 * @swagger
 * components:
 *   schemas:
 *     Note:
 *       type: object
 *       required:
 *         - content
 *       properties:
 *         id:
 *           type: string
 *           description: ID único da nota
 *         content:
 *           type: string
 *           description: Conteúdo da nota
 *           minLength: 1
 *           maxLength: 2000
 *         important:
 *           type: boolean
 *           description: Se a nota é importante
 *           default: false
 *         category:
 *           type: string
 *           description: Categoria da nota
 *           maxLength: 50
 *         isPrivate:
 *           type: boolean
 *           description: Se a nota é privada
 *           default: false
 *         leadId:
 *           type: string
 *           description: ID do lead associado
 *         createdBy:
 *           type: string
 *           description: Quem criou a nota
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

// ===== ROTAS GERAIS DE NOTAS =====

/**
 * @swagger
 * /api/notes/stats:
 *   get:
 *     summary: Buscar estatísticas de notas
 *     tags: [Notes]
 *     responses:
 *       200:
 *         description: Estatísticas recuperadas com sucesso
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/stats', noteController.getNoteStats);

/**
 * @swagger
 * /api/notes/important:
 *   get:
 *     summary: Buscar notas importantes
 *     tags: [Notes]
 *     parameters:
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
 *           default: "10"
 *         description: Limite por página
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, content, category]
 *           default: createdAt
 *         description: Campo para ordenação
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Ordem de classificação
 *     responses:
 *       200:
 *         description: Notas importantes recuperadas com sucesso
 *       400:
 *         description: Parâmetros inválidos
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/important',
  validateQuery(importantNotesFiltersSchema),
  noteController.getImportantNotes
);

/**
 * @swagger
 * /api/notes/categories:
 *   get:
 *     summary: Buscar notas agrupadas por categoria
 *     tags: [Notes]
 *     responses:
 *       200:
 *         description: Notas agrupadas recuperadas com sucesso
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/categories', noteController.getNotesByCategory);

/**
 * @swagger
 * /api/notes/{id}:
 *   get:
 *     summary: Buscar nota por ID
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da nota
 *     responses:
 *       200:
 *         description: Nota recuperada com sucesso
 *       404:
 *         description: Nota não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:id',
  validateParams(noteIdSchema),
  validatePrivateNoteAccess,
  noteController.getNoteById
);

/**
 * @swagger
 * /api/notes/{id}:
 *   put:
 *     summary: Atualizar uma nota
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da nota
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               important:
 *                 type: boolean
 *               category:
 *                 type: string
 *               isPrivate:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Nota atualizada com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Nota não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/:id',
  validateParams(noteIdSchema),
  validateRequest(updateNoteSchema),
  validateNoteContent,
  validatePrivateNoteAccess,
  noteController.updateNote
);

/**
 * @swagger
 * /api/notes/{id}:
 *   delete:
 *     summary: Deletar uma nota
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da nota
 *     responses:
 *       200:
 *         description: Nota deletada com sucesso
 *       404:
 *         description: Nota não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:id',
  validateParams(noteIdSchema),
  validatePrivateNoteAccess,
  noteController.deleteNote
);

// ===== ROTAS ESPECÍFICAS POR LEAD =====

/**
 * @swagger
 * /api/notes/leads/{leadId}:
 *   post:
 *     summary: Criar uma nova nota para um lead
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do lead
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Note'
 *     responses:
 *       201:
 *         description: Nota criada com sucesso
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
 *                   $ref: '#/components/schemas/Note'
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Lead não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/leads/:leadId',
  validateParams(leadIdSchema),
  validateRequest(createNoteSchema),
  validateNoteContent,
  validatePrivateNoteAccess,
  noteController.createNote
);

/**
 * @swagger
 * /api/notes/leads/{leadId}:
 *   get:
 *     summary: Buscar todas as notas de um lead
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do lead
 *       - in: query
 *         name: important
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filtrar por importância
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtrar por categoria
 *       - in: query
 *         name: isPrivate
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filtrar por privacidade
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por conteúdo
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
 *           default: "20"
 *         description: Limite por página
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, content, important, category]
 *           default: createdAt
 *         description: Campo para ordenação
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Ordem de classificação
 *     responses:
 *       200:
 *         description: Notas do lead recuperadas com sucesso
 *       400:
 *         description: Parâmetros inválidos
 *       404:
 *         description: Lead não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/leads/:leadId',
  validateParams(leadIdSchema),
  validateQuery(noteFiltersSchema),
  validatePrivateNoteAccess,
  noteController.getNotesByLead
);

/**
 * @swagger
 * /api/notes/leads/{leadId}/{noteId}:
 *   put:
 *     summary: Atualizar uma nota específica de um lead
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do lead
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da nota
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               important:
 *                 type: boolean
 *               category:
 *                 type: string
 *               isPrivate:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Nota atualizada com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Nota ou lead não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/leads/:leadId/:noteId',
  validateParams(leadNoteParamsSchema),
  validateRequest(updateNoteSchema),
  validateNoteContent,
  validatePrivateNoteAccess,
  noteController.updateLeadNote
);

/**
 * @swagger
 * /api/notes/leads/{leadId}/{noteId}:
 *   delete:
 *     summary: Deletar uma nota específica de um lead
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do lead
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da nota
 *     responses:
 *       200:
 *         description: Nota deletada com sucesso
 *       400:
 *         description: Nota não pertence ao lead
 *       404:
 *         description: Nota ou lead não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/leads/:leadId/:noteId',
  validateParams(leadNoteParamsSchema),
  validatePrivateNoteAccess,
  noteController.deleteLeadNote
);

module.exports = router;