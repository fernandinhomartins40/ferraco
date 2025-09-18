/**
 * Ferraco CRM Backend - Solução Real do Problema (sem logger problemático)
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

// CORS
app.use(cors({
  origin: ['http://localhost:80', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ========================================

// Middleware para verificar JWT e sessão ativa
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ success: false, error: 'Token de acesso necessário' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verificar se a sessão ainda está ativa no banco
    const session = await prisma.session.findFirst({
      where: {
        token,
        userId: decoded.userId,
        expiresAt: { gt: new Date() }
      }
    });

    if (!session) {
      return res.status(401).json({ success: false, error: 'Sessão expirada ou inválida' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token inválido:', error.message);
    return res.status(403).json({ success: false, error: 'Token inválido' });
  }
}

// Middleware para verificar permissões
function requirePermission(permission) {
  return async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        include: { role: true }
      });

      if (!user || !user.isActive) {
        return res.status(403).json({ success: false, error: 'Usuário inativo' });
      }

      const permissions = JSON.parse(user.role.permissions || '[]');
      if (!permissions.includes(permission)) {
        return res.status(403).json({ success: false, error: 'Permissão insuficiente' });
      }

      next();
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      return res.status(500).json({ success: false, error: 'Erro interno' });
    }
  };
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ========================================
// ROTAS LEADS IMPLEMENTADAS DIRETAMENTE
// ========================================

// GET /api/leads - Buscar todos os leads
app.get('/api/leads', authenticateToken, requirePermission('leads:read'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    const where = {};
    if (status && status !== 'todos') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          notes: true,
          tags: { include: { tag: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit)
      }),
      prisma.lead.count({ where })
    ]);

    res.json({
      success: true,
      data: leads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar leads:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/leads - Criar um novo lead
app.post('/api/leads', authenticateToken, requirePermission('leads:write'), async (req, res) => {
  try {
    const { name, phone, email, status = 'NOVO', source = 'website' } = req.body;

    const lead = await prisma.lead.create({
      data: { name, phone, email, status, source },
      include: {
        notes: true,
        tags: { include: { tag: true } }
      }
    });

    console.log(`Lead criado: ${lead.name} (${lead.phone})`);
    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    console.error('Erro ao criar lead:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/leads/stats - Estatísticas de leads
app.get('/api/leads/stats', authenticateToken, requirePermission('leads:read'), async (req, res) => {
  try {
    const [total, byStatus] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.groupBy({
        by: ['status'],
        _count: true
      })
    ]);

    const stats = {
      total,
      byStatus: byStatus.reduce((acc, stat) => {
        acc[stat.status] = stat._count;
        return acc;
      }, {}),
      conversionRate: total > 0 ? ((byStatus.find(s => s.status === 'CONCLUIDO')?._count || 0) / total) * 100 : 0
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Erro ao calcular stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// DEBUG ENDPOINT (TEMPORÁRIO)
// ========================================

// GET /api/debug - Debug temporário para diagnosticar problema
app.get('/api/debug', async (req, res) => {
  try {
    console.log('🔍 Endpoint debug chamado');

    // Verificar variáveis de ambiente
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL,
      JWT_SECRET: !!process.env.JWT_SECRET,
      JWT_SECRET_LENGTH: process.env.JWT_SECRET?.length,
      PORT: process.env.PORT
    };

    // Verificar conexão com banco
    const userCount = await prisma.user.count();
    const roleCount = await prisma.userRole.count();

    // Verificar usuário admin específico
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@ferraco.com' },
      include: { role: true }
    });

    // Informações de debug
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: envVars,
      database: {
        connected: true,
        userCount,
        roleCount,
        adminExists: !!adminUser,
        adminInfo: adminUser ? {
          id: adminUser.id,
          email: adminUser.email,
          isActive: adminUser.isActive,
          hasRole: !!adminUser.role,
          roleName: adminUser.role?.name,
          hasPermissions: !!adminUser.role?.permissions
        } : null
      }
    };

    console.log('🔍 Debug info:', JSON.stringify(debugInfo, null, 2));

    res.json({
      success: true,
      debug: debugInfo
    });

  } catch (error) {
    console.error('❌ Erro no debug:', error);
    res.status(500).json({
      success: false,
      error: 'Erro no debug',
      details: {
        message: error.message,
        code: error.code
      }
    });
  }
});

// ========================================
// ROTAS AUTH BÁSICAS
// ========================================

// POST /api/auth/login - Login com autenticação real
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔐 Iniciando login:', { email: req.body.email, hasPassword: !!req.body.password });
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('❌ Campos obrigatórios faltando');
      return res.status(400).json({
        success: false,
        error: 'Email e senha são obrigatórios'
      });
    }

    console.log('🔍 Buscando usuário no banco...', { email });
    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true }
    });

    if (!user) {
      console.log('❌ Usuário não encontrado:', { email });
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas'
      });
    }

    console.log('✅ Usuário encontrado:', { id: user.id, email: user.email, isActive: user.isActive, hasRole: !!user.role });

    if (!user.isActive) {
      console.log('❌ Usuário inativo');
      return res.status(401).json({
        success: false,
        error: 'Usuário inativo'
      });
    }

    console.log('🔑 Verificando senha...');
    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('❌ Senha inválida');
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas'
      });
    }

    console.log('✅ Senha válida. Gerando JWT...');
    console.log('🔧 JWT_SECRET defined:', !!process.env.JWT_SECRET);
    // Gerar JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        roleId: user.roleId
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    console.log('✅ JWT gerado. Criando sessão...');
    // Criar sessão no banco
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias
      }
    });

    console.log('✅ Sessão criada. Atualizando último login...');
    // Atualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    console.log('✅ Login realizado com sucesso:', user.email);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role.name,
          permissions: JSON.parse(user.role.permissions || '[]'),
          avatar: user.avatar
        }
      }
    });

  } catch (error) {
    console.error('❌ Erro detalhado no login:', {
      message: error.message,
      code: error.code,
      stack: error.stack?.split('\n').slice(0, 3)
    });
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// POST /api/auth/register - Registro de novos usuários
app.post('/api/auth/register', authenticateToken, requirePermission('users:write'), async (req, res) => {
  try {
    const { email, name, password, roleId } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email, nome e senha são obrigatórios'
      });
    }

    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email já está em uso'
      });
    }

    // Verificar se a role existe
    const role = await prisma.userRole.findUnique({
      where: { id: roleId || undefined }
    });

    if (roleId && !role) {
      return res.status(400).json({
        success: false,
        error: 'Role inválida'
      });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Usar role padrão "User" se não especificada
    const defaultRole = role || await prisma.userRole.findFirst({
      where: { name: 'User' }
    });

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        roleId: defaultRole.id,
        preferences: JSON.stringify({
          theme: 'light',
          language: 'pt-BR',
          notifications: true
        })
      },
      include: { role: true }
    });

    console.log(`✅ Usuário registrado: ${newUser.email}`);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role.name,
          isActive: newUser.isActive
        }
      }
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// POST /api/auth/logout - Logout do usuário
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      // Remover sessão do banco
      await prisma.session.deleteMany({
        where: { token }
      });
    }

    console.log(`✅ Logout realizado: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });

  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// GET /api/auth/me - Obter dados do usuário logado
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { role: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role.name,
          permissions: JSON.parse(user.role.permissions || '[]'),
          avatar: user.avatar,
          lastLogin: user.lastLogin,
          preferences: JSON.parse(user.preferences || '{}')
        }
      }
    });

  } catch (error) {
    console.error('Erro ao obter dados do usuário:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ========================================
// DASHBOARD METRICS
// ========================================

// GET /api/dashboard/metrics - Métricas do dashboard
app.get('/api/dashboard/metrics', authenticateToken, requirePermission('leads:read'), async (req, res) => {
  try {
    // Contagem básica de leads por status
    const total = await prisma.lead.count();
    const novo = await prisma.lead.count({ where: { status: 'NOVO' } });
    const emAndamento = await prisma.lead.count({ where: { status: 'EM_ANDAMENTO' } });
    const concluido = await prisma.lead.count({ where: { status: 'CONCLUIDO' } });

    // Taxa de conversão
    const conversionRate = total > 0 ? Math.round((concluido / total) * 100 * 100) / 100 : 0;

    // Atividade recente
    const recentLeads = await prisma.lead.findMany({
      select: { id: true, name: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const recentActivity = recentLeads.map(lead => ({
      id: `lead-${lead.id}`,
      type: 'lead_created',
      description: `Lead "${lead.name}" foi criado`,
      timestamp: lead.createdAt.toISOString()
    }));

    res.json({
      success: true,
      data: {
        leadsCount: { total, novo, emAndamento, concluido },
        conversionRate,
        recentActivity,
        trends: { leadsThisWeek: 0, leadsLastWeek: 0 }
      }
    });
  } catch (error) {
    console.error('Erro ao gerar métricas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado' });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ error: error.message });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Ferraco CRM Backend funcionando na porta ${PORT}!`);
  console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/api/dashboard/metrics`);
  console.log(`👥 Leads: http://localhost:${PORT}/api/leads`);
});

module.exports = app;