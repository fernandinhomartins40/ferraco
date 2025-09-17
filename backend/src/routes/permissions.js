const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');
const { authenticateToken, requirePermission, requireRole } = require('../middleware/authMiddleware');
const { inputValidation } = require('../middleware/security');

// Middleware de autenticação para todas as rotas
router.use(authenticateToken);

// ==========================================
// CONSULTA DE PERMISSÕES
// ==========================================

/**
 * @route GET /api/permissions
 * @desc Lista todas as permissões disponíveis
 * @query category, level, isActive, includeCustom, includeSystem, page, limit
 * @access Private (Admin/Manager)
 */
router.get('/',
  requirePermission('users.manage_roles'),
  inputValidation({
    query: {
      category: { minLength: 1, maxLength: 50, sanitize: true },
      level: { pattern: /^(read|write|delete|admin|super)$/ },
      isActive: { type: 'boolean' },
      includeCustom: { type: 'boolean' },
      includeSystem: { type: 'boolean' },
      page: { type: 'int', min: 1 },
      limit: { type: 'int', min: 1, max: 100 }
    }
  }),
  permissionController.listPermissions
);

/**
 * @route GET /api/permissions/dashboard
 * @desc Dashboard de permissões (resumo executivo)
 * @access Private (Admin only)
 */
router.get('/dashboard',
  requireRole('Admin'),
  permissionController.getPermissionsDashboard
);

// ==========================================
// CRIAÇÃO DE PERMISSÕES
// ==========================================

/**
 * @route POST /api/permissions
 * @desc Cria uma nova permissão customizada
 * @body name, description, category, level
 * @access Private (Admin only)
 */
router.post('/',
  requireRole('Admin'),
  inputValidation({
    body: {
      name: { required: true, minLength: 3, maxLength: 100, pattern: /^[a-z0-9_.]+$/, sanitize: true },
      description: { required: true, minLength: 5, maxLength: 255, sanitize: true },
      category: { required: true, minLength: 2, maxLength: 50, sanitize: true },
      level: { required: true, pattern: /^(read|write|delete|admin|super)$/ }
    }
  }),
  permissionController.createPermission
);

// ==========================================
// ATRIBUIÇÃO DE PERMISSÕES
// ==========================================

/**
 * @route POST /api/permissions/users/:userId/assign
 * @desc Atribui permissões a um usuário
 * @body permissions (array)
 * @access Private (Admin only)
 */
router.post('/users/:userId/assign',
  requireRole('Admin'),
  inputValidation({
    params: {
      userId: { required: true, type: 'uuid' }
    },
    body: {
      permissions: { required: true, type: 'array', minItems: 1 }
    }
  }),
  permissionController.assignPermissionsToUser
);

/**
 * @route POST /api/permissions/roles/:roleId/assign
 * @desc Atribui permissões a um role
 * @body permissions (array)
 * @access Private (Admin only)
 */
router.post('/roles/:roleId/assign',
  requireRole('Admin'),
  inputValidation({
    params: {
      roleId: { required: true, type: 'uuid' }
    },
    body: {
      permissions: { required: true, type: 'array', minItems: 1 }
    }
  }),
  permissionController.assignPermissionsToRole
);

// ==========================================
// CONSULTA DE PERMISSÕES DE USUÁRIOS
// ==========================================

/**
 * @route GET /api/permissions/users/:userId
 * @desc Obtém todas as permissões de um usuário
 * @access Private (Admin/Manager ou próprio usuário)
 */
router.get('/users/:userId',
  inputValidation({
    params: {
      userId: { required: true, type: 'uuid' }
    }
  }),
  (req, res, next) => {
    // Permitir que usuário consulte suas próprias permissões
    if (req.user.id === req.params.userId) {
      return next();
    }
    // Senão, requer permissão administrativa
    return requirePermission('users.manage_roles')(req, res, next);
  },
  permissionController.getUserPermissions
);

/**
 * @route GET /api/permissions/users/:userId/check
 * @desc Verifica se um usuário tem uma permissão específica
 * @query permission
 * @access Private (Admin/Manager ou próprio usuário)
 */
router.get('/users/:userId/check',
  inputValidation({
    params: {
      userId: { required: true, type: 'uuid' }
    },
    query: {
      permission: { required: true, minLength: 3, maxLength: 100, sanitize: true }
    }
  }),
  (req, res, next) => {
    // Permitir que usuário consulte suas próprias permissões
    if (req.user.id === req.params.userId) {
      return next();
    }
    // Senão, requer permissão administrativa
    return requirePermission('users.manage_roles')(req, res, next);
  },
  permissionController.checkUserPermission
);

// ==========================================
// TEMPLATES DE PERMISSÕES
// ==========================================

/**
 * @route POST /api/permissions/templates
 * @desc Cria um template de permissões
 * @body name, description, permissions, roleLevel
 * @access Private (Admin only)
 */
router.post('/templates',
  requireRole('Admin'),
  inputValidation({
    body: {
      name: { required: true, minLength: 3, maxLength: 100, sanitize: true },
      description: { required: true, minLength: 5, maxLength: 255, sanitize: true },
      permissions: { required: true, type: 'array', minItems: 1 },
      roleLevel: { required: true, type: 'int', min: 1, max: 100 }
    }
  }),
  permissionController.createPermissionTemplate
);

/**
 * @route POST /api/permissions/roles/:roleId/apply-template
 * @desc Aplica um template de permissões a um role
 * @body templateId
 * @access Private (Admin only)
 */
router.post('/roles/:roleId/apply-template',
  requireRole('Admin'),
  inputValidation({
    params: {
      roleId: { required: true, type: 'uuid' }
    },
    body: {
      templateId: { required: true, type: 'uuid' }
    }
  }),
  permissionController.applyPermissionTemplate
);

module.exports = router;