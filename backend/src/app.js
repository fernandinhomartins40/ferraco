/**
 * Ferraco CRM Backend - Solução Real do Problema (sem logger problemático)
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

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
app.get('/api/leads', async (req, res) => {
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
app.post('/api/leads', async (req, res) => {
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
app.get('/api/leads/stats', async (req, res) => {
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
// ROTAS AUTH BÁSICAS
// ========================================

// POST /api/auth/login - Login simples
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email === 'admin@ferraco.com' && password === 'admin123') {
      res.json({
        success: true,
        data: {
          token: 'demo-token-12345',
          user: {
            id: 1,
            email: 'admin@ferraco.com',
            name: 'Admin Ferraco'
          }
        }
      });
    } else {
      res.status(401).json({ success: false, error: 'Credenciais inválidas' });
    }
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// DASHBOARD METRICS
// ========================================

// GET /api/dashboard/metrics - Métricas do dashboard
app.get('/api/dashboard/metrics', async (req, res) => {
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