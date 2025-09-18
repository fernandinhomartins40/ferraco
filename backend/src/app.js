/**
 * Ferraco CRM Backend - Sistema Unificado de Autenticação
 * USANDO APENAS SISTEMA 2: Banco de Dados (authService.js + authMiddleware.js)
 * Sistema robusto com Prisma, roles dinâmicos, sessões e auditoria
 */

// Carregar variáveis de ambiente
require('dotenv').config({ path: './.env' });

// Debug das variáveis de ambiente
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

// ========================================
// MIDDLEWARES GLOBAIS
// ========================================

// CORS
app.use(cors({
  origin: [
    'http://localhost:80',
    'http://localhost:3000',
    'http://localhost:5173',
    'https://ferraco.netlify.app',
    'https://ferraco-crm.vercel.app'
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware de log de requisições
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// ========================================
// IMPORTAR MIDDLEWARES E CONTROLADORES
// ========================================

const { authenticateToken, requirePermission } = require('./middleware/authMiddleware');

// ========================================
// ROTAS PRINCIPAIS
// ========================================

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
        'Permissões granulares',
        'Sistema de recuperação de senha'
      ],
      timestamp: new Date().toISOString()
    }
  });
});

// ========================================
// IMPORTAR E USAR ROTAS
// ========================================

// Rotas de autenticação (Sistema 2 robusto)
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Rotas de leads
const leadRoutes = require('./routes/leads');
app.use('/api/leads', leadRoutes);

// Rotas de tags
const tagRoutes = require('./routes/tags');
app.use('/api/tags', tagRoutes);

// Rotas de notas
const noteRoutes = require('./routes/notes');
app.use('/api/notes', noteRoutes);

// Rotas de leads parciais
const partialLeadRoutes = require('./routes/partialLeads');
app.use('/api/partial-leads', partialLeadRoutes);

// Rotas extras que podem existir
const routesToInclude = [
  { path: '/api/activities', file: './routes/activities' },
  { path: '/api/dashboard', file: './routes/dashboard' },
  { path: '/api/duplicates', file: './routes/duplicates' },
  { path: '/api/emails', file: './routes/emails' },
  { path: '/api/opportunities', file: './routes/opportunities' },
  { path: '/api/pipelines', file: './routes/pipelines' },
  { path: '/api/reports', file: './routes/reports' },
  { path: '/api/whatsapp', file: './routes/whatsapp' }
];

routesToInclude.forEach(route => {
  try {
    const routeModule = require(route.file);
    app.use(route.path, routeModule);
    console.log(`✅ Rota carregada: ${route.path}`);
  } catch (error) {
    console.log(`⚠️  Rota opcional não encontrada: ${route.path}`);
  }
});

// ========================================
// MIDDLEWARE DE ERRO GLOBAL
// ========================================

// 404 - Rota não encontrada
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
    error: 'NOT_FOUND',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handler global
app.use((error, req, res, next) => {
  console.error('❌ Erro global capturado:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Erro do Prisma
  if (error.code && error.code.startsWith('P')) {
    return res.status(400).json({
      success: false,
      message: 'Erro de banco de dados',
      error: 'DATABASE_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
  }

  // Erro de validação
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Erro de validação',
      error: 'VALIDATION_ERROR',
      details: error.message
    });
  }

  // Erro genérico
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: 'INTERNAL_SERVER_ERROR',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// ========================================
// INICIALIZAÇÃO DO SERVIDOR
// ========================================

// Função para testar conexão com banco
async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Conexão com banco de dados estabelecida');

    // Verificar se dados foram inicializados
    const userCount = await prisma.user.count();
    const roleCount = await prisma.userRole.count();

    if (userCount === 0 || roleCount === 0) {
      console.log('⚠️  Banco vazio. Execute: /api/auth/initialize para criar dados iniciais');
    } else {
      console.log(`📊 Sistema inicializado: ${userCount} usuários, ${roleCount} roles`);
    }

    return true;
  } catch (error) {
    console.error('❌ Erro na conexão com banco:', error.message);
    return false;
  }
}

// Função para graceful shutdown
async function gracefulShutdown(signal) {
  console.log(`\n🔄 Recebido sinal ${signal}. Encerrando servidor graciosamente...`);

  try {
    await prisma.$disconnect();
    console.log('✅ Conexão com banco encerrada');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro durante shutdown:', error);
    process.exit(1);
  }
}

// Handlers para sinais de sistema
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Inicializar servidor
async function startServer() {
  try {
    // Testar conexão com banco
    const dbConnected = await testDatabaseConnection();

    if (!dbConnected) {
      console.error('❌ Não foi possível conectar ao banco. Verifique DATABASE_URL');
      process.exit(1);
    }

    // Iniciar servidor
    const server = app.listen(PORT, () => {
      console.log('\n🎉 ========================================');
      console.log('    FERRACO CRM - SISTEMA UNIFICADO');
      console.log('🎉 ========================================');
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`🌐 Local: http://localhost:${PORT}`);
      console.log(`📋 Health: http://localhost:${PORT}/api/health`);
      console.log(`🔐 Sistema: Banco de Dados (Robusto)`);
      console.log('========================================\n');
    });

    // Configurar timeout do servidor
    server.timeout = 120000; // 2 minutos

    return server;
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Inicializar aplicação
if (require.main === module) {
  startServer();
}

module.exports = app;