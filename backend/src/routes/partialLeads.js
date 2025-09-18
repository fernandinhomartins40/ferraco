const express = require('express');
const router = express.Router();
const {
  capturePartialLead,
  getPartialLeads,
  convertPartialLead,
  markAsAbandoned,
  markAsConverted,
  cleanupOldPartialLeads,
  exportPartialLeads,
} = require('../controllers/partialLeadController');
const { authenticateToken } = require('../middleware/auth');

// Rotas públicas (para captura silenciosa)
router.post('/capture', capturePartialLead);
router.post('/mark-converted', markAsConverted);

// Rotas protegidas (para administradores)
router.get('/', authenticateToken, getPartialLeads);
router.post('/:id/convert', authenticateToken, convertPartialLead);
router.post('/:id/abandon', authenticateToken, markAsAbandoned);
router.delete('/cleanup', authenticateToken, cleanupOldPartialLeads);
router.get('/export', authenticateToken, exportPartialLeads);

module.exports = router;