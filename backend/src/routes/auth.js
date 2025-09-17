const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const {
  authenticateToken,
  requireRole,
  requirePermission
} = require('../middleware/auth');
const {
  validateRequest,
  validateParams,
  validateQuery,
  loginSchema,
  verifyTokenSchema,
  userIdSchema,
  userFiltersSchema,
  validatePasswordStrength
} = require('../validations/authValidation');

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: Nome de usuário
 *           minLength: 3
 *           maxLength: 50
 *         password:
 *           type: string
 *           description: Senha do usuário
 *           minLength: 6
 *           maxLength: 100
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/User'
 *             token:
 *               type: string
 *               description: JWT token
 *             expiresIn:
 *               type: string
 *               description: Tempo de expiração do token
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID único do usuário
 *         username:
 *           type: string
 *           description: Nome de usuário
 *         name:
 *           type: string
 *           description: Nome completo
 *         role:
 *           type: string
 *           enum: [admin, sales, consultant]
 *           description: Papel do usuário
 *         email:
 *           type: string
 *           description: Email do usuário
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 *           description: Lista de permissões
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Realizar login no sistema
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             username: admin
 *             password: admin123
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Username e password são obrigatórios
 *                 error:
 *                   type: string
 *       401:
 *         description: Credenciais inválidas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Credenciais inválidas
 *                 error:
 *                   type: string
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/login',
  validateRequest(loginSchema),
  validatePasswordStrength,
  authController.login
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obter informações do usuário logado
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Informações do usuário recuperadas com sucesso
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
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Token não fornecido ou inválido
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/me',
  authenticateToken,
  authController.me
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Realizar logout do sistema
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout realizado com sucesso
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
 *                   type: object
 *       401:
 *         description: Token não fornecido ou inválido
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/logout',
  authenticateToken,
  authController.logout
);

/**
 * @swagger
 * /api/auth/verify-token:
 *   post:
 *     summary: Verificar se um token JWT é válido
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token JWT para verificar
 *           example:
 *             token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Token válido
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
 *                   type: object
 *                   properties:
 *                     valid:
 *                       type: boolean
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Token inválido ou expirado
 *       400:
 *         description: Token não fornecido
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/verify-token',
  validateRequest(verifyTokenSchema),
  authController.verifyToken
);

/**
 * @swagger
 * /api/auth/status:
 *   get:
 *     summary: Obter status do sistema de autenticação
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Status recuperado com sucesso
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
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: number
 *                     activeUsers:
 *                       type: number
 *                     roles:
 *                       type: array
 *                       items:
 *                         type: string
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                     systemInfo:
 *                       type: object
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/status', authController.status);

// ===== ROTAS ADMINISTRATIVAS =====

/**
 * @swagger
 * /api/auth/users:
 *   get:
 *     summary: Listar todos os usuários (apenas admin)
 *     tags: [Authentication, Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, sales, consultant, all]
 *           default: all
 *         description: Filtrar por papel
 *       - in: query
 *         name: active
 *         schema:
 *           type: string
 *           enum: [true, false, all]
 *           default: all
 *         description: Filtrar por status ativo
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nome ou username
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
 *           enum: [username, name, role, email]
 *           default: username
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
 *         description: Usuários recuperados com sucesso
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
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                     total:
 *                       type: number
 *       401:
 *         description: Token não fornecido ou inválido
 *       403:
 *         description: Permissão insuficiente (apenas admin)
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/users',
  authenticateToken,
  requireRole('admin'),
  validateQuery(userFiltersSchema),
  authController.listUsers
);

/**
 * @swagger
 * /api/auth/users/{id}:
 *   get:
 *     summary: Obter informações de um usuário específico (apenas admin)
 *     tags: [Authentication, Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Usuário recuperado com sucesso
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
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Token não fornecido ou inválido
 *       403:
 *         description: Permissão insuficiente (apenas admin)
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/users/:id',
  authenticateToken,
  requireRole('admin'),
  validateParams(userIdSchema),
  authController.getUser
);

module.exports = router;