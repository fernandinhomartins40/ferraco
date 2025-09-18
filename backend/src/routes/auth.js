const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, requirePermission } = require('../middleware/authMiddleware');

/**
 * Rotas de Autenticação - Sistema Robusto com Banco de Dados
 * Usa apenas o Sistema 2: authService.js + authMiddleware.js
 */

// ========================================
// ROTAS PÚBLICAS (sem autenticação)
// ========================================

// Login
router.post('/login', authController.login);

// Registro público (se permitido)
router.post('/register', authController.register);

// Recuperação de senha
router.post('/password-reset/request', authController.requestPasswordReset);

// Inicializar sistema (apenas para setup inicial)
router.post('/initialize', authController.initializeSystem);

// ========================================
// ROTAS AUTENTICADAS
// ========================================

// Informações do usuário atual
router.get('/me', authenticateToken, authController.me);

// Logout
router.post('/logout', authenticateToken, authController.logout);

// Alterar senha
router.post('/change-password', authenticateToken, authController.changePassword);

// ========================================
// GERENCIAMENTO DE USUÁRIOS
// ========================================

// Listar usuários (apenas com permissão)
router.get('/users', authenticateToken, authController.listUsers);

// Obter usuário específico
router.get('/users/:id', authenticateToken, authController.getUser);

// Atualizar usuário
router.put('/users/:id', authenticateToken, authController.updateUser);

// ========================================
// GERENCIAMENTO DE ROLES
// ========================================

// Listar roles
router.get('/roles', authenticateToken, authController.listRoles);

// Criar nova role
router.post('/roles', authenticateToken, authController.createRole);

// ========================================
// UTILIDADES
// ========================================

// Verificar permissão específica
router.get('/check-permission/:permission', authenticateToken, authController.checkPermission);

// Estatísticas de autenticação (apenas admin)
router.get('/stats', authenticateToken, authController.getAuthStats);

module.exports = router;