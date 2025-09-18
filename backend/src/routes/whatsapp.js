const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');
const { body, param, query } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');

/**
 * @route GET /api/whatsapp/webhook
 * @desc Verificar webhook do WhatsApp
 * @access Public (WhatsApp API)
 */
router.get('/webhook', whatsappController.verifyWebhook);

/**
 * @route POST /api/whatsapp/webhook
 * @desc Receber webhooks do WhatsApp
 * @access Public (WhatsApp API)
 */
router.post('/webhook', whatsappController.receiveWebhook);

/**
 * @route POST /api/whatsapp/send
 * @desc Enviar mensagem WhatsApp simples
 * @access Private
 */
router.post('/send',
  [
    body('to')
      .notEmpty()
      .withMessage('Número de telefone é obrigatório')
      .matches(/^\+?[\d\s\-\(\)]+$/)
      .withMessage('Formato de telefone inválido'),
    body('message')
      .notEmpty()
      .withMessage('Mensagem é obrigatória')
      .isLength({ max: 4000 })
      .withMessage('Mensagem deve ter no máximo 4000 caracteres'),
    body('leadId')
      .optional()
      .isUUID()
      .withMessage('ID do lead inválido'),
    body('priority')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Prioridade deve estar entre 1 e 10')
  ],
  validateRequest,
  whatsappController.sendMessage
);

/**
 * @route POST /api/whatsapp/send-template
 * @desc Enviar mensagem WhatsApp usando template
 * @access Private
 */
router.post('/send-template',
  [
    body('to')
      .notEmpty()
      .withMessage('Número de telefone é obrigatório')
      .matches(/^\+?[\d\s\-\(\)]+$/)
      .withMessage('Formato de telefone inválido'),
    body('templateId')
      .optional()
      .isUUID()
      .withMessage('ID do template inválido'),
    body('templateName')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Nome do template inválido'),
    body('variables')
      .optional()
      .isObject()
      .withMessage('Variáveis devem ser um objeto'),
    body('leadId')
      .optional()
      .isUUID()
      .withMessage('ID do lead inválido'),
    body('priority')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Prioridade deve estar entre 1 e 10')
  ],
  validateRequest,
  whatsappController.sendTemplateMessage
);

/**
 * @route GET /api/whatsapp/stats
 * @desc Buscar estatísticas de WhatsApp
 * @access Private
 */
router.get('/stats',
  [
    query('dateFrom')
      .optional()
      .isISO8601()
      .withMessage('Data inicial inválida'),
    query('dateTo')
      .optional()
      .isISO8601()
      .withMessage('Data final inválida')
  ],
  validateRequest,
  whatsappController.getWhatsAppStats
);

// === ROTAS DE TEMPLATES ===

/**
 * @route POST /api/whatsapp/templates
 * @desc Criar template WhatsApp
 * @access Private
 */
router.post('/templates',
  [
    body('name')
      .notEmpty()
      .withMessage('Nome é obrigatório')
      .isLength({ min: 3, max: 100 })
      .withMessage('Nome deve ter entre 3 e 100 caracteres')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Nome deve conter apenas letras, números, _ e -'),
    body('content')
      .notEmpty()
      .withMessage('Conteúdo é obrigatório')
      .isLength({ max: 4000 })
      .withMessage('Conteúdo deve ter no máximo 4000 caracteres'),
    body('category')
      .optional()
      .isIn(['GENERAL', 'AUTOMATION', 'CONVERSION', 'FOLLOW_UP', 'NOTIFICATION'])
      .withMessage('Categoria inválida'),
    body('variables')
      .optional()
      .isArray()
      .withMessage('Variáveis devem ser um array'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive deve ser boolean')
  ],
  validateRequest,
  whatsappController.createTemplate
);

/**
 * @route GET /api/whatsapp/templates
 * @desc Buscar todos os templates WhatsApp
 * @access Private
 */
router.get('/templates',
  [
    query('category')
      .optional()
      .isIn(['GENERAL', 'AUTOMATION', 'CONVERSION', 'FOLLOW_UP', 'NOTIFICATION'])
      .withMessage('Categoria inválida'),
    query('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive deve ser boolean'),
    query('search')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Busca deve ter no máximo 100 caracteres'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Página deve ser um número positivo'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limite deve estar entre 1 e 100'),
    query('sortBy')
      .optional()
      .isIn(['name', 'content', 'category', 'createdAt', 'updatedAt'])
      .withMessage('Campo de ordenação inválido'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Ordem de classificação inválida')
  ],
  validateRequest,
  whatsappController.getAllTemplates
);

/**
 * @route GET /api/whatsapp/templates/category/:category
 * @desc Buscar templates WhatsApp por categoria
 * @access Private
 */
router.get('/templates/category/:category',
  [
    param('category')
      .isIn(['GENERAL', 'AUTOMATION', 'CONVERSION', 'FOLLOW_UP', 'NOTIFICATION'])
      .withMessage('Categoria inválida'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Página deve ser um número positivo'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limite deve estar entre 1 e 100')
  ],
  validateRequest,
  whatsappController.getTemplatesByCategory
);

/**
 * @route GET /api/whatsapp/templates/:id
 * @desc Buscar template WhatsApp por ID
 * @access Private
 */
router.get('/templates/:id',
  [
    param('id')
      .isUUID()
      .withMessage('ID do template inválido')
  ],
  validateRequest,
  whatsappController.getTemplateById
);

/**
 * @route PUT /api/whatsapp/templates/:id
 * @desc Atualizar template WhatsApp
 * @access Private
 */
router.put('/templates/:id',
  [
    param('id')
      .isUUID()
      .withMessage('ID do template inválido'),
    body('name')
      .optional()
      .isLength({ min: 3, max: 100 })
      .withMessage('Nome deve ter entre 3 e 100 caracteres')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Nome deve conter apenas letras, números, _ e -'),
    body('content')
      .optional()
      .isLength({ max: 4000 })
      .withMessage('Conteúdo deve ter no máximo 4000 caracteres'),
    body('category')
      .optional()
      .isIn(['GENERAL', 'AUTOMATION', 'CONVERSION', 'FOLLOW_UP', 'NOTIFICATION'])
      .withMessage('Categoria inválida'),
    body('variables')
      .optional()
      .isArray()
      .withMessage('Variáveis devem ser um array'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive deve ser boolean')
  ],
  validateRequest,
  whatsappController.updateTemplate
);

/**
 * @route DELETE /api/whatsapp/templates/:id
 * @desc Deletar template WhatsApp
 * @access Private
 */
router.delete('/templates/:id',
  [
    param('id')
      .isUUID()
      .withMessage('ID do template inválido')
  ],
  validateRequest,
  whatsappController.deleteTemplate
);

/**
 * @route POST /api/whatsapp/templates/:id/preview
 * @desc Gerar preview do template WhatsApp
 * @access Private
 */
router.post('/templates/:id/preview',
  [
    param('id')
      .isUUID()
      .withMessage('ID do template inválido'),
    body('variables')
      .optional()
      .isObject()
      .withMessage('Variáveis devem ser um objeto')
  ],
  validateRequest,
  whatsappController.previewTemplate
);

/**
 * @route POST /api/whatsapp/templates/:id/test
 * @desc Testar template WhatsApp enviando mensagem
 * @access Private
 */
router.post('/templates/:id/test',
  [
    param('id')
      .isUUID()
      .withMessage('ID do template inválido'),
    body('phone')
      .notEmpty()
      .withMessage('Número de telefone de teste é obrigatório')
      .matches(/^\+?[\d\s\-\(\)]+$/)
      .withMessage('Formato de telefone inválido'),
    body('variables')
      .optional()
      .isObject()
      .withMessage('Variáveis devem ser um objeto')
  ],
  validateRequest,
  whatsappController.testTemplate
);

module.exports = router;