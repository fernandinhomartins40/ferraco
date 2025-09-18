/**
 * Backend funcionando - versão mínima
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS básico
app.use(cors({
  origin: ['http://localhost:80', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Health check que funciona
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rotas básicas hardcoded até corrigir os controllers
app.get('/api/leads', (req, res) => {
  res.json({
    success: true,
    data: [],
    pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
  });
});

app.get('/api/dashboard/metrics', (req, res) => {
  res.json({
    success: true,
    data: {
      leadsCount: { total: 0, novo: 0, emAndamento: 0, concluido: 0 },
      conversionRate: 0,
      recentActivity: [],
      trends: { leadsLastWeek: 0, leadsThisWeek: 0 }
    }
  });
});

// 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor funcionando na porta ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
});

module.exports = app;