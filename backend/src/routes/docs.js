const express = require('express');
const router = express.Router();
const documentationController = require('../controllers/documentationController');
const { authenticateToken, requirePermission, requireRole } = require('../middleware/authMiddleware');
const { inputValidation } = require('../middleware/security');

// ==========================================
// ROTAS PÚBLICAS DE DOCUMENTAÇÃO
// ==========================================

/**
 * @route GET /api/docs/spec
 * @desc Serve especificação OpenAPI da API
 * @access Public
 */
router.get('/spec', documentationController.serveApiSpec);

/**
 * @route GET /api/docs/stats
 * @desc Obtém estatísticas básicas da documentação
 * @access Public
 */
router.get('/stats', documentationController.getDocumentationStats);

// ==========================================
// ROTAS AUTENTICADAS DE DOCUMENTAÇÃO
// ==========================================

/**
 * @route POST /api/docs/generate
 * @desc Gera documentação completa da API
 * @access Private (Admin only)
 */
router.post('/generate',
  authenticateToken,
  requireRole('Admin'),
  documentationController.generateCompleteDocumentation
);

/**
 * @route POST /api/docs/generate/:moduleName
 * @desc Gera documentação de um módulo específico
 * @access Private (Admin only)
 */
router.post('/generate/:moduleName',
  authenticateToken,
  requireRole('Admin'),
  inputValidation({
    params: {
      moduleName: { required: true, pattern: /^[a-zA-Z][a-zA-Z0-9_-]*$/, sanitize: true }
    }
  }),
  documentationController.generateModuleDocumentation
);

/**
 * @route GET /api/docs/export
 * @desc Exporta documentação em formato específico
 * @query format (json, yaml, html, markdown, all)
 * @access Private (Admin/Manager)
 */
router.get('/export',
  authenticateToken,
  requirePermission('system.settings'),
  inputValidation({
    query: {
      format: { pattern: /^(json|yaml|html|markdown|all)$/ }
    }
  }),
  documentationController.exportDocumentation
);

/**
 * @route GET /api/docs/files
 * @desc Lista arquivos de documentação disponíveis
 * @access Private (Admin/Manager)
 */
router.get('/files',
  authenticateToken,
  requirePermission('system.logs'),
  documentationController.listDocumentationFiles
);

/**
 * @route GET /api/docs/dashboard
 * @desc Dashboard de documentação (resumo executivo)
 * @access Private (Admin/Manager)
 */
router.get('/dashboard',
  authenticateToken,
  requirePermission('system.logs'),
  documentationController.getDocumentationDashboard
);

// ==========================================
// ROTA PARA SERVIR DOCUMENTAÇÃO HTML
// ==========================================

/**
 * @route GET /api/docs
 * @desc Serve página HTML da documentação interativa
 * @access Public
 */
router.get('/', documentationController.serveDocumentationPage);

module.exports = router;