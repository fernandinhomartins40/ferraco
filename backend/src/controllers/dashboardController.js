const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class DashboardController {
  // Obter métricas simples do dashboard
  async getMetrics(req, res) {
    try {
      // Buscar contagens básicas de leads por status
      const leadsCount = await this.getLeadsCount();

      // Calcular taxa de conversão simples
      const conversionRate = this.calculateConversionRate(leadsCount);

      // Buscar atividade recente simples
      const recentActivity = await this.getRecentActivity();

      // Buscar tendências básicas
      const trends = await this.getBasicTrends();

      const metrics = {
        leadsCount,
        conversionRate,
        recentActivity,
        trends,
        lastUpdated: new Date().toISOString(),
      };

      logger.info('Métricas básicas do dashboard geradas', {
        totalLeads: leadsCount.total,
        userId: req.user?.id,
      });

      res.status(200).json({
        success: true,
        message: 'Métricas do dashboard recuperadas com sucesso',
        data: metrics,
      });
    } catch (error) {
      logger.error('Erro ao gerar métricas do dashboard', {
        error: error.message,
        userId: req.user?.id,
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao gerar métricas',
        error: error.message,
      });
    }
  }

  // Buscar contagens básicas de leads por status
  async getLeadsCount() {
    const total = await prisma.lead.count();
    const novo = await prisma.lead.count({ where: { status: 'NOVO' } });
    const emAndamento = await prisma.lead.count({ where: { status: 'EM_ANDAMENTO' } });
    const concluido = await prisma.lead.count({ where: { status: 'CONCLUIDO' } });

    return {
      total,
      novo,
      emAndamento,
      concluido,
    };
  }

  // Calcular taxa de conversão simples
  calculateConversionRate(leadsCount) {
    if (leadsCount.total === 0) return 0;
    return Math.round((leadsCount.concluido / leadsCount.total) * 100 * 100) / 100;
  }

  // Buscar atividade recente básica
  async getRecentActivity() {
    const activities = [];

    // Leads criados recentemente (últimos 5)
    const recentLeads = await prisma.lead.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    recentLeads.forEach(lead => {
      activities.push({
        id: `lead-${lead.id}`,
        type: 'lead_created',
        description: `Lead "${lead.name}" foi criado`,
        timestamp: lead.createdAt.toISOString(),
        leadId: lead.id,
        leadName: lead.name,
      });
    });

    // Ordenar por timestamp mais recente
    return activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);
  }

  // Buscar tendências básicas (apenas esta semana vs semana passada)
  async getBasicTrends() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfWeek.getDate() - 7);

    // Leads desta semana
    const leadsThisWeek = await prisma.lead.count({
      where: {
        createdAt: {
          gte: startOfWeek,
        },
      },
    });

    // Leads da semana passada
    const leadsLastWeek = await prisma.lead.count({
      where: {
        createdAt: {
          gte: startOfLastWeek,
          lt: startOfWeek,
        },
      },
    });

    return {
      leadsLastWeek,
      leadsThisWeek,
    };
  }
}

module.exports = new DashboardController();