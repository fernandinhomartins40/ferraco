/**
 * Ferraco CRM Backend - Sistema Unificado LIMPO
 * USANDO APENAS SISTEMA 2: Banco de Dados (authService.js + authMiddleware.js)
 * Versão sem logger problemático para teste
 */

// Carregar variáveis de ambiente
require('dotenv').config({ path: './.env' });

console.log('🔧 Ferraco CRM - Sistema Unificado de Autenticação');
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  PORT:', process.env.PORT);
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? 'DEFINED' : 'NOT DEFINED');
console.log('  JWT_SECRET:', process.env.JWT_SECRET ? 'DEFINED' : 'NOT DEFINED');

const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

// CORS
app.use(cors({
  origin: [
    'http://localhost:80',
    'http://localhost:3000',
    'http://localhost:5173',
    'https://ferraco.netlify.app'
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware de log simples
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    system: 'Sistema Unificado - Banco de Dados',
    database: 'Connected'
  });
});

// Status do sistema
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'Ferraco CRM - Sistema Unificado Ativo',
    data: {
      authSystem: 'Database + Prisma (Sistema 2)',
      features: [
        'Autenticação JWT com sessões',
        'Roles dinâmicos no banco',
        'Auditoria completa',
        'Permissões granulares'
      ],
      timestamp: new Date().toISOString()
    }
  });
});

// Rotas de autenticação
try {
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  console.log('✅ Rotas de auth carregadas');
} catch (error) {
  console.error('❌ Erro ao carregar rotas de auth:', error.message);
}

// Rotas básicas
const basicRoutes = [
  { path: '/api/leads', file: './routes/leads' },
  { path: '/api/tags', file: './routes/tags' },
  { path: '/api/notes', file: './routes/notes' },
  { path: '/api/partial-leads', file: './routes/partialLeads' }
];

basicRoutes.forEach(route => {
  try {
    const routeModule = require(route.file);
    app.use(route.path, routeModule);
    console.log(`✅ Rota carregada: ${route.path}`);
  } catch (error) {
    console.log(`⚠️  Rota não encontrada: ${route.path}`);
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
    error: 'NOT_FOUND',
    path: req.originalUrl
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('❌ Erro:', error.message);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: 'INTERNAL_SERVER_ERROR'
  });
});

// Função para testar banco
async function testDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Conexão com banco estabelecida');

    const userCount = await prisma.user.count();
    const roleCount = await prisma.userRole.count();

    if (userCount === 0 || roleCount === 0) {
      console.log('⚠️  Banco vazio. Use: POST /api/auth/initialize');
    } else {
      console.log(`📊 Sistema: ${userCount} usuários, ${roleCount} roles`);
    }

    return true;
  } catch (error) {
    console.error('❌ Erro no banco:', error.message);
    return false;
  }
}

// Inicializar servidor
async function start() {
  try {
    const dbOk = await testDatabase();

    if (!dbOk) {
      console.error('❌ Banco não conectado');
      process.exit(1);
    }

    const server = app.listen(PORT, () => {
      console.log('\n🎉 ========================================');
      console.log('    FERRACO CRM - SISTEMA UNIFICADO');
      console.log('🎉 ========================================');
      console.log(`🚀 Servidor na porta ${PORT}`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`📋 Health: http://localhost:${PORT}/api/health`);
      console.log(`🔐 Auth: Sistema de Banco de Dados`);
      console.log('========================================\n');
    });

    return server;
  } catch (error) {
    console.error('❌ Erro ao iniciar:', error);
    process.exit(1);
  }
}

// Inicializar
if (require.main === module) {
  start();
}

module.exports = app;