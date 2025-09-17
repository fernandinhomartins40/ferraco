const express = require('express');
const router = express.Router();

const leadController = require('../controllers/leadController');
const {
  validateRequest,
  validateParams,
  validateQuery,
  createLeadSchema,
  updateLeadSchema,
  leadFiltersSchema,
  leadIdSchema,
  addNoteSchema
} = require('../validations/leadValidation');

// ========================================
// ROTAS PRINCIPAIS DE LEADS
// ========================================

// GET /api/leads - Buscar todos os leads com filtros
router.get('/',
  validateQuery(leadFiltersSchema),
  leadController.getAllLeads
);

// POST /api/leads - Criar um novo lead
router.post('/',
  validateRequest(createLeadSchema),
  leadController.createLead
);

// GET /api/leads/stats - Buscar estatísticas de leads
router.get('/stats',
  leadController.getLeadStats
);

// GET /api/leads/upcoming-followups - Buscar follow-ups próximos
router.get('/upcoming-followups',
  leadController.getUpcomingFollowUps
);

// GET /api/leads/status/:status - Buscar leads por status
router.get('/status/:status',
  validateQuery(leadFiltersSchema),
  leadController.getLeadsByStatus
);

// GET /api/leads/priority/:priority - Buscar leads por prioridade
router.get('/priority/:priority',
  validateQuery(leadFiltersSchema),
  leadController.getLeadsByPriority
);

// GET /api/leads/:id - Buscar um lead por ID
router.get('/:id',
  validateParams(leadIdSchema),
  leadController.getLeadById
);

// PUT /api/leads/:id - Atualizar um lead
router.put('/:id',
  validateParams(leadIdSchema),
  validateRequest(updateLeadSchema),
  leadController.updateLead
);

// DELETE /api/leads/:id - Deletar um lead
router.delete('/:id',
  validateParams(leadIdSchema),
  leadController.deleteLead
);

// ========================================
// ROTAS DE NOTAS
// ========================================

// POST /api/leads/:id/notes - Adicionar nota a um lead
router.post('/:id/notes',
  validateParams(leadIdSchema),
  validateRequest(addNoteSchema),
  leadController.addNote
);

// ========================================
// MIDDLEWARE DE DOCUMENTAÇÃO
// ========================================

// Middleware para adicionar documentação das rotas
router.use((req, res, next) => {
  // Adicionar headers de documentação se solicitado
  if (req.query.docs === 'true') {
    res.setHeader('X-API-Docs', JSON.stringify({
      routes: {
        'GET /api/leads': {
          description: 'Buscar todos os leads com filtros opcionais',
          queryParams: {
            status: 'NOVO | EM_ANDAMENTO | CONCLUIDO',
            priority: 'LOW | MEDIUM | HIGH',
            source: 'string',
            assignedTo: 'string',
            search: 'string (busca em nome, email, telefone)',
            page: 'number (default: 1)',
            limit: 'number (default: 10)',
            sortBy: 'createdAt | updatedAt | name | status | priority',
            sortOrder: 'asc | desc'
          }
        },
        'POST /api/leads': {
          description: 'Criar um novo lead',
          requiredFields: ['name', 'phone'],
          optionalFields: ['email', 'status', 'source', 'priority', 'assignedTo', 'nextFollowUp', 'leadScore', 'pipelineStage']
        },
        'GET /api/leads/:id': {
          description: 'Buscar um lead específico por ID'
        },
        'PUT /api/leads/:id': {
          description: 'Atualizar um lead existente'
        },
        'DELETE /api/leads/:id': {
          description: 'Deletar um lead'
        },
        'GET /api/leads/stats': {
          description: 'Buscar estatísticas gerais de leads'
        },
        'POST /api/leads/:id/notes': {
          description: 'Adicionar uma nota a um lead',
          requiredFields: ['content'],
          optionalFields: ['important', 'createdBy']
        }
      }
    }));
  }
  next();
});

// ========================================
// MIDDLEWARE DE ERRO ESPECÍFICO
// ========================================

// Middleware para tratamento de erros específicos das rotas de leads
router.use((error, req, res, next) => {
  if (error.name === 'PrismaClientKnownRequestError') {
    // Erro específico do Prisma
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'Conflito: dados duplicados detectados',
        error: 'Já existe um lead com essas informações'
      });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Lead não encontrado',
        error: 'O lead solicitado não existe'
      });
    }
  }

  // Repassar outros erros para o middleware global
  next(error);
});

module.exports = router;