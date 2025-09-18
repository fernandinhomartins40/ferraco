require('dotenv').config();
const express = require('express');
const cors = require('cors');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check simples
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Testar apenas uma rota por vez
app.use('/api/leads', require('./routes/leads'));

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado' });
});

// Error handler simples
app.use((error, req, res, next) => {
  logger.error('Error:', error);
  res.status(500).json({ error: error.message });
});

const server = app.listen(PORT, () => {
  logger.info(`🚀 Servidor mínimo funcionando na porta ${PORT}`);
});

module.exports = app;