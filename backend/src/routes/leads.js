const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');

// ========================================
// ROTAS BÁSICAS DE LEADS (SEM VALIDAÇÕES)
// ========================================

// GET /api/leads - Buscar todos os leads
router.get('/', leadController.getAllLeads);

// POST /api/leads - Criar um novo lead
router.post('/', leadController.createLead);

// GET /api/leads/stats - Buscar estatísticas de leads
router.get('/stats', leadController.getLeadStats);

// GET /api/leads/:id - Buscar um lead por ID
router.get('/:id', leadController.getLeadById);

// PUT /api/leads/:id - Atualizar um lead
router.put('/:id', leadController.updateLead);

// PATCH /api/leads/:id/status - Atualizar status do lead
router.patch('/:id/status', leadController.updateStatus);

// DELETE /api/leads/:id - Deletar um lead
router.delete('/:id', leadController.deleteLead);

// POST /api/leads/:id/notes - Adicionar nota a um lead
router.post('/:id/notes', leadController.addNote);

module.exports = router;