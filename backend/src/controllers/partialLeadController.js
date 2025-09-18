const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Capturar ou atualizar lead parcial
const capturePartialLead = async (req, res) => {
  try {
    const { sessionId, name, phone, source, url, userAgent, ipAddress } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'SessionId é obrigatório',
      });
    }

    // Buscar lead parcial existente para esta sessão e fonte
    let partialLead = await prisma.partialLead.findFirst({
      where: {
        sessionId,
        source: source || 'website',
        completed: false,
        abandoned: false,
      },
    });

    if (partialLead) {
      // Atualizar lead existente
      partialLead = await prisma.partialLead.update({
        where: { id: partialLead.id },
        data: {
          name: name || '',
          phone: phone || '',
          url: url || '',
          userAgent: userAgent || '',
          ipAddress: ipAddress,
          interactions: { increment: 1 },
          lastUpdate: new Date(),
        },
      });
    } else {
      // Criar novo lead parcial
      partialLead = await prisma.partialLead.create({
        data: {
          sessionId,
          name: name || '',
          phone: phone || '',
          source: source || 'website',
          url: url || '',
          userAgent: userAgent || '',
          ipAddress: ipAddress,
          firstInteraction: new Date(),
        },
      });
    }

    res.json({
      success: true,
      message: 'Lead parcial capturado',
      data: partialLead,
    });
  } catch (error) {
    console.error('Erro ao capturar lead parcial:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message,
    });
  }
};

// Listar leads parciais com filtros
const getPartialLeads = async (req, res) => {
  try {
    const {
      status = 'all',
      dateRange = 'all',
      source,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    // Construir filtros
    const where = {};

    // Filtro por status
    if (status !== 'all') {
      switch (status) {
        case 'active':
          where.completed = false;
          where.abandoned = false;
          break;
        case 'converted':
          where.completed = true;
          break;
        case 'abandoned':
          where.abandoned = true;
          break;
      }
    }

    // Filtro por data
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate;

      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      if (startDate) {
        where.firstInteraction = { gte: startDate };
      }
    }

    // Filtro por fonte
    if (source) {
      where.source = source;
    }

    // Filtro por busca (nome ou telefone)
    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    // Paginação
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Buscar leads parciais
    const [partialLeads, total] = await Promise.all([
      prisma.partialLead.findMany({
        where,
        orderBy: { lastUpdate: 'desc' },
        skip,
        take,
      }),
      prisma.partialLead.count({ where }),
    ]);

    // Calcular estatísticas
    const stats = await getPartialLeadStats();

    res.json({
      success: true,
      data: partialLeads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
      stats,
    });
  } catch (error) {
    console.error('Erro ao buscar leads parciais:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message,
    });
  }
};

// Obter estatísticas dos leads parciais
const getPartialLeadStats = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      total,
      active,
      converted,
      abandoned,
      todayCount,
    ] = await Promise.all([
      prisma.partialLead.count(),
      prisma.partialLead.count({
        where: { completed: false, abandoned: false },
      }),
      prisma.partialLead.count({
        where: { completed: true },
      }),
      prisma.partialLead.count({
        where: { abandoned: true },
      }),
      prisma.partialLead.count({
        where: { firstInteraction: { gte: today } },
      }),
    ]);

    const conversionRate = total > 0 ? (converted / total) * 100 : 0;

    return {
      total,
      active,
      converted,
      abandoned,
      todayCount,
      conversionRate: Math.round(conversionRate * 100) / 100,
    };
  } catch (error) {
    console.error('Erro ao calcular estatísticas:', error);
    return {
      total: 0,
      active: 0,
      converted: 0,
      abandoned: 0,
      todayCount: 0,
      conversionRate: 0,
    };
  }
};

// Converter lead parcial em lead real
const convertPartialLead = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar lead parcial
    const partialLead = await prisma.partialLead.findUnique({
      where: { id },
    });

    if (!partialLead) {
      return res.status(404).json({
        success: false,
        message: 'Lead parcial não encontrado',
      });
    }

    if (partialLead.completed) {
      return res.status(400).json({
        success: false,
        message: 'Lead parcial já foi convertido',
      });
    }

    if (!partialLead.name.trim() || !partialLead.phone.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Nome e telefone são obrigatórios para conversão',
      });
    }

    // Criar lead real
    const lead = await prisma.lead.create({
      data: {
        name: partialLead.name.trim(),
        phone: partialLead.phone.trim(),
        source: 'recuperacao-admin',
        status: 'NOVO',
        priority: 'MEDIUM',
      },
    });

    // Marcar lead parcial como convertido
    await prisma.partialLead.update({
      where: { id },
      data: {
        completed: true,
        completedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Lead parcial convertido com sucesso',
      data: {
        partialLead: partialLead,
        newLead: lead,
      },
    });
  } catch (error) {
    console.error('Erro ao converter lead parcial:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message,
    });
  }
};

// Marcar lead parcial como abandonado
const markAsAbandoned = async (req, res) => {
  try {
    const { id } = req.params;

    const partialLead = await prisma.partialLead.findUnique({
      where: { id },
    });

    if (!partialLead) {
      return res.status(404).json({
        success: false,
        message: 'Lead parcial não encontrado',
      });
    }

    // Marcar como abandonado
    const updatedLead = await prisma.partialLead.update({
      where: { id },
      data: {
        abandoned: true,
        completedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Lead marcado como abandonado',
      data: updatedLead,
    });
  } catch (error) {
    console.error('Erro ao marcar lead como abandonado:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message,
    });
  }
};

// Marcar lead parcial como convertido (quando usuário submete formulário)
const markAsConverted = async (req, res) => {
  try {
    const { sessionId, source } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'SessionId é obrigatório',
      });
    }

    // Buscar e marcar lead parcial como convertido
    const partialLead = await prisma.partialLead.findFirst({
      where: {
        sessionId,
        source: source || 'website',
        completed: false,
        abandoned: false,
      },
    });

    if (partialLead) {
      await prisma.partialLead.update({
        where: { id: partialLead.id },
        data: {
          completed: true,
          completedAt: new Date(),
        },
      });
    }

    res.json({
      success: true,
      message: 'Lead marcado como convertido',
      data: partialLead,
    });
  } catch (error) {
    console.error('Erro ao marcar lead como convertido:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message,
    });
  }
};

// Limpar leads parciais antigos
const cleanupOldPartialLeads = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    const result = await prisma.partialLead.deleteMany({
      where: {
        lastUpdate: { lt: cutoffDate },
      },
    });

    res.json({
      success: true,
      message: `${result.count} leads parciais antigos foram removidos`,
      data: { removedCount: result.count },
    });
  } catch (error) {
    console.error('Erro ao limpar leads antigos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message,
    });
  }
};

// Exportar leads parciais
const exportPartialLeads = async (req, res) => {
  try {
    const partialLeads = await prisma.partialLead.findMany({
      orderBy: { lastUpdate: 'desc' },
    });

    if (partialLeads.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nenhum lead parcial encontrado para exportar',
      });
    }

    // Gerar CSV
    const headers = [
      'ID', 'Session ID', 'Nome', 'Telefone', 'Fonte', 'URL',
      'Primeira Interação', 'Última Atualização', 'Interações',
      'Convertido', 'Abandonado', 'IP Address'
    ];

    const csvRows = [
      headers.join(','),
      ...partialLeads.map(lead => [
        lead.id,
        lead.sessionId,
        `"${lead.name}"`,
        `"${lead.phone}"`,
        lead.source,
        `"${lead.url}"`,
        lead.firstInteraction.toISOString(),
        lead.lastUpdate.toISOString(),
        lead.interactions,
        lead.completed ? 'Sim' : 'Não',
        lead.abandoned ? 'Sim' : 'Não',
        lead.ipAddress || 'N/A'
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=leads_parciais_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Erro ao exportar leads parciais:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message,
    });
  }
};

module.exports = {
  capturePartialLead,
  getPartialLeads,
  convertPartialLead,
  markAsAbandoned,
  markAsConverted,
  cleanupOldPartialLeads,
  exportPartialLeads,
};