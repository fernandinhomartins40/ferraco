const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { body, param, query } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');

/**
 * @route POST /api/reports/generate
 * @desc Gerar relatório personalizado
 * @access Private
 */
router.post('/generate',
  [
    body('name')
      .notEmpty()
      .withMessage('Nome do relatório é obrigatório')
      .isLength({ min: 3, max: 100 })
      .withMessage('Nome deve ter entre 3 e 100 caracteres'),
    body('type')
      .notEmpty()
      .withMessage('Tipo de relatório é obrigatório')
      .isIn(['leads', 'opportunities', 'activities', 'communications', 'revenue', 'performance', 'pipeline', 'forecast'])
      .withMessage('Tipo de relatório inválido'),
    body('format')
      .optional()
      .isIn(['pdf', 'excel', 'csv', 'json'])
      .withMessage('Formato inválido'),
    body('filters')
      .optional()
      .isObject()
      .withMessage('Filtros devem ser um objeto'),
    body('fields')
      .optional()
      .isArray()
      .withMessage('Campos devem ser um array'),
    body('groupBy')
      .optional()
      .isArray()
      .withMessage('GroupBy deve ser um array'),
    body('aggregations')
      .optional()
      .isArray()
      .withMessage('Agregações devem ser um array'),
    body('charts')
      .optional()
      .isArray()
      .withMessage('Gráficos devem ser um array'),
    body('template')
      .optional()
      .isString()
      .withMessage('Template deve ser uma string')
  ],
  validateRequest,
  reportController.generateReport
);

/**
 * @route POST /api/reports/generate/template/:templateId
 * @desc Gerar relatório a partir de template
 * @access Private
 */
router.post('/generate/template/:templateId',
  [
    param('templateId')
      .notEmpty()
      .withMessage('ID do template é obrigatório'),
    body('name')
      .optional()
      .isLength({ min: 3, max: 100 })
      .withMessage('Nome deve ter entre 3 e 100 caracteres'),
    body('filters')
      .optional()
      .isObject()
      .withMessage('Filtros devem ser um objeto'),
    body('format')
      .optional()
      .isIn(['pdf', 'excel', 'csv', 'json'])
      .withMessage('Formato inválido')
  ],
  validateRequest,
  reportController.generateFromTemplate
);

/**
 * @route POST /api/reports/schedule
 * @desc Agendar relatório recorrente
 * @access Private
 */
router.post('/schedule',
  [
    body('reportConfig')
      .notEmpty()
      .withMessage('Configuração do relatório é obrigatória')
      .isObject()
      .withMessage('Configuração deve ser um objeto'),
    body('reportConfig.name')
      .notEmpty()
      .withMessage('Nome do relatório é obrigatório'),
    body('reportConfig.type')
      .notEmpty()
      .withMessage('Tipo do relatório é obrigatório')
      .isIn(['leads', 'opportunities', 'activities', 'communications', 'revenue', 'performance', 'pipeline', 'forecast'])
      .withMessage('Tipo de relatório inválido'),
    body('scheduleConfig')
      .notEmpty()
      .withMessage('Configuração de agendamento é obrigatória')
      .isObject()
      .withMessage('Configuração deve ser um objeto'),
    body('scheduleConfig.frequency')
      .notEmpty()
      .withMessage('Frequência é obrigatória')
      .isIn(['daily', 'weekly', 'monthly', 'quarterly'])
      .withMessage('Frequência inválida'),
    body('scheduleConfig.time')
      .notEmpty()
      .withMessage('Horário é obrigatório')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Formato de horário inválido (HH:MM)'),
    body('scheduleConfig.recipients')
      .optional()
      .isArray()
      .withMessage('Destinatários devem ser um array'),
    body('scheduleConfig.dayOfWeek')
      .optional()
      .isInt({ min: 0, max: 6 })
      .withMessage('Dia da semana deve estar entre 0 e 6'),
    body('scheduleConfig.dayOfMonth')
      .optional()
      .isInt({ min: 1, max: 31 })
      .withMessage('Dia do mês deve estar entre 1 e 31')
  ],
  validateRequest,
  reportController.scheduleReport
);

/**
 * @route GET /api/reports/scheduled
 * @desc Buscar relatórios agendados
 * @access Private
 */
router.get('/scheduled',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Página deve ser um número positivo'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limite deve estar entre 1 e 100'),
    query('enabled')
      .optional()
      .isBoolean()
      .withMessage('Enabled deve ser boolean')
  ],
  validateRequest,
  reportController.getScheduledReports
);

/**
 * @route PUT /api/reports/scheduled/:id
 * @desc Atualizar relatório agendado
 * @access Private
 */
router.put('/scheduled/:id',
  [
    param('id')
      .isUUID()
      .withMessage('ID do relatório agendado inválido'),
    body('enabled')
      .optional()
      .isBoolean()
      .withMessage('Enabled deve ser boolean'),
    body('scheduleConfig')
      .optional()
      .isObject()
      .withMessage('Configuração deve ser um objeto')
  ],
  validateRequest,
  reportController.updateScheduledReport
);

/**
 * @route DELETE /api/reports/scheduled/:id
 * @desc Cancelar relatório agendado
 * @access Private
 */
router.delete('/scheduled/:id',
  [
    param('id')
      .isUUID()
      .withMessage('ID do relatório agendado inválido')
  ],
  validateRequest,
  reportController.cancelScheduledReport
);

/**
 * @route GET /api/reports/templates
 * @desc Buscar templates disponíveis
 * @access Private
 */
router.get('/templates',
  [
    query('category')
      .optional()
      .isString()
      .withMessage('Categoria deve ser uma string'),
    query('search')
      .optional()
      .isString()
      .withMessage('Busca deve ser uma string'),
    query('includePublic')
      .optional()
      .isBoolean()
      .withMessage('includePublic deve ser boolean'),
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
  reportController.getAvailableTemplates
);

/**
 * @route POST /api/reports/templates
 * @desc Criar template de relatório
 * @access Private
 */
router.post('/templates',
  [
    body('name')
      .notEmpty()
      .withMessage('Nome do template é obrigatório')
      .isLength({ min: 3, max: 100 })
      .withMessage('Nome deve ter entre 3 e 100 caracteres'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Descrição deve ter no máximo 500 caracteres'),
    body('category')
      .notEmpty()
      .withMessage('Categoria é obrigatória')
      .isString()
      .withMessage('Categoria deve ser uma string'),
    body('config')
      .notEmpty()
      .withMessage('Configuração é obrigatória')
      .isObject()
      .withMessage('Configuração deve ser um objeto'),
    body('isPublic')
      .optional()
      .isBoolean()
      .withMessage('isPublic deve ser boolean'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags devem ser um array')
  ],
  validateRequest,
  reportController.createTemplate
);

/**
 * @route GET /api/reports/templates/:id
 * @desc Buscar template específico
 * @access Private
 */
router.get('/templates/:id',
  [
    param('id')
      .notEmpty()
      .withMessage('ID do template é obrigatório')
  ],
  validateRequest,
  reportController.getTemplate
);

/**
 * @route PUT /api/reports/templates/:id
 * @desc Atualizar template
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
      .withMessage('Nome deve ter entre 3 e 100 caracteres'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Descrição deve ter no máximo 500 caracteres'),
    body('config')
      .optional()
      .isObject()
      .withMessage('Configuração deve ser um objeto')
  ],
  validateRequest,
  reportController.updateTemplate
);

/**
 * @route DELETE /api/reports/templates/:id
 * @desc Deletar template
 * @access Private
 */
router.delete('/templates/:id',
  [
    param('id')
      .isUUID()
      .withMessage('ID do template inválido')
  ],
  validateRequest,
  reportController.deleteTemplate
);

/**
 * @route GET /api/reports/history
 * @desc Buscar histórico de relatórios
 * @access Private
 */
router.get('/history',
  [
    query('type')
      .optional()
      .isIn(['leads', 'opportunities', 'activities', 'communications', 'revenue', 'performance', 'pipeline', 'forecast'])
      .withMessage('Tipo de relatório inválido'),
    query('format')
      .optional()
      .isIn(['pdf', 'excel', 'csv', 'json'])
      .withMessage('Formato inválido'),
    query('dateFrom')
      .optional()
      .isISO8601()
      .withMessage('Data inicial inválida'),
    query('dateTo')
      .optional()
      .isISO8601()
      .withMessage('Data final inválida'),
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
      .isIn(['name', 'type', 'format', 'createdAt', 'size'])
      .withMessage('Campo de ordenação inválido'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Ordem de classificação inválida')
  ],
  validateRequest,
  reportController.getReportHistory
);

/**
 * @route GET /api/reports/:id
 * @desc Buscar relatório específico
 * @access Private
 */
router.get('/:id',
  [
    param('id')
      .isUUID()
      .withMessage('ID do relatório inválido')
  ],
  validateRequest,
  reportController.getReport
);

/**
 * @route GET /api/reports/:id/download
 * @desc Baixar relatório
 * @access Private
 */
router.get('/:id/download',
  [
    param('id')
      .isUUID()
      .withMessage('ID do relatório inválido')
  ],
  validateRequest,
  reportController.downloadReport
);

/**
 * @route DELETE /api/reports/:id
 * @desc Deletar relatório
 * @access Private
 */
router.delete('/:id',
  [
    param('id')
      .isUUID()
      .withMessage('ID do relatório inválido')
  ],
  validateRequest,
  reportController.deleteReport
);

/**
 * @route GET /api/reports/stats/overview
 * @desc Obter estatísticas de relatórios
 * @access Private
 */
router.get('/stats/overview',
  [
    query('period')
      .optional()
      .isIn(['7d', '30d', '90d', '1y'])
      .withMessage('Período inválido')
  ],
  validateRequest,
  reportController.getReportStats
);

/**
 * @route GET /api/reports/stats/usage
 * @desc Obter estatísticas de uso por tipo/formato
 * @access Private
 */
router.get('/stats/usage',
  [
    query('period')
      .optional()
      .isIn(['7d', '30d', '90d', '1y'])
      .withMessage('Período inválido'),
    query('groupBy')
      .optional()
      .isIn(['type', 'format', 'template'])
      .withMessage('Agrupamento inválido')
  ],
  validateRequest,
  reportController.getUsageStats
);

// ===== BULK OPERATIONS =====

/**
 * @route POST /api/reports/bulk/generate
 * @desc Gerar múltiplos relatórios
 * @access Private
 */
router.post('/bulk/generate',
  [
    body('reports')
      .isArray({ min: 1 })
      .withMessage('reports deve ser um array com pelo menos 1 item'),
    body('reports.*.name')
      .notEmpty()
      .withMessage('Nome do relatório é obrigatório'),
    body('reports.*.type')
      .notEmpty()
      .withMessage('Tipo do relatório é obrigatório')
      .isIn(['leads', 'opportunities', 'activities', 'communications', 'revenue', 'performance', 'pipeline', 'forecast'])
      .withMessage('Tipo de relatório inválido'),
    body('format')
      .optional()
      .isIn(['pdf', 'excel', 'csv', 'json'])
      .withMessage('Formato inválido'),
    body('async')
      .optional()
      .isBoolean()
      .withMessage('Async deve ser boolean')
  ],
  validateRequest,
  reportController.bulkGenerateReports
);

/**
 * @route POST /api/reports/bulk/schedule
 * @desc Agendar múltiplos relatórios
 * @access Private
 */
router.post('/bulk/schedule',
  [
    body('schedules')
      .isArray({ min: 1 })
      .withMessage('schedules deve ser um array com pelo menos 1 item'),
    body('schedules.*.reportConfig')
      .notEmpty()
      .withMessage('Configuração do relatório é obrigatória'),
    body('schedules.*.scheduleConfig')
      .notEmpty()
      .withMessage('Configuração de agendamento é obrigatória')
  ],
  validateRequest,
  reportController.bulkScheduleReports
);

/**
 * @route DELETE /api/reports/bulk/delete
 * @desc Deletar múltiplos relatórios
 * @access Private
 */
router.delete('/bulk/delete',
  [
    body('reportIds')
      .isArray({ min: 1 })
      .withMessage('reportIds deve ser um array com pelo menos 1 item'),
    body('reportIds.*')
      .isUUID()
      .withMessage('ID de relatório inválido')
  ],
  validateRequest,
  reportController.bulkDeleteReports
);

// ===== EXPORT & SHARING =====

/**
 * @route POST /api/reports/:id/share
 * @desc Compartilhar relatório
 * @access Private
 */
router.post('/:id/share',
  [
    param('id')
      .isUUID()
      .withMessage('ID do relatório inválido'),
    body('recipients')
      .isArray({ min: 1 })
      .withMessage('recipients deve ser um array com pelo menos 1 item'),
    body('recipients.*')
      .isEmail()
      .withMessage('Email inválido'),
    body('message')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Mensagem deve ter no máximo 500 caracteres'),
    body('includeData')
      .optional()
      .isBoolean()
      .withMessage('includeData deve ser boolean')
  ],
  validateRequest,
  reportController.shareReport
);

/**
 * @route GET /api/reports/export/config/:id
 * @desc Exportar configuração de relatório
 * @access Private
 */
router.get('/export/config/:id',
  [
    param('id')
      .isUUID()
      .withMessage('ID do relatório inválido')
  ],
  validateRequest,
  reportController.exportReportConfig
);

/**
 * @route POST /api/reports/import/config
 * @desc Importar configuração de relatório
 * @access Private
 */
router.post('/import/config',
  [
    body('config')
      .notEmpty()
      .withMessage('Configuração é obrigatória')
      .isObject()
      .withMessage('Configuração deve ser um objeto'),
    body('name')
      .optional()
      .isString()
      .withMessage('Nome deve ser uma string')
  ],
  validateRequest,
  reportController.importReportConfig
);

// ===== PREVIEW & VALIDATION =====

/**
 * @route POST /api/reports/preview
 * @desc Visualizar prévia do relatório (primeiros registros)
 * @access Private
 */
router.post('/preview',
  [
    body('type')
      .notEmpty()
      .withMessage('Tipo de relatório é obrigatório')
      .isIn(['leads', 'opportunities', 'activities', 'communications', 'revenue', 'performance', 'pipeline', 'forecast'])
      .withMessage('Tipo de relatório inválido'),
    body('filters')
      .optional()
      .isObject()
      .withMessage('Filtros devem ser um objeto'),
    body('fields')
      .optional()
      .isArray()
      .withMessage('Campos devem ser um array'),
    body('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limite deve estar entre 1 e 100')
  ],
  validateRequest,
  reportController.previewReport
);

/**
 * @route POST /api/reports/validate
 * @desc Validar configuração de relatório
 * @access Private
 */
router.post('/validate',
  [
    body('config')
      .notEmpty()
      .withMessage('Configuração é obrigatória')
      .isObject()
      .withMessage('Configuração deve ser um objeto'),
    body('config.type')
      .notEmpty()
      .withMessage('Tipo é obrigatório'),
    body('config.name')
      .notEmpty()
      .withMessage('Nome é obrigatório')
  ],
  validateRequest,
  reportController.validateReportConfig
);

module.exports = router;