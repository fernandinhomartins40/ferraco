const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * CRM Service
 * Serviços relacionados a CRM, pipelines e oportunidades
 */
class CRMService {
  // ==========================================
  // PIPELINE MANAGEMENT
  // ==========================================

  /**
   * Lista todos os pipelines
   */
  async listPipelines(filters = {}) {
    try {
      const { businessType, isDefault } = filters;

      const where = {};
      if (businessType) where.businessType = businessType;
      if (isDefault !== undefined) where.isDefault = isDefault === 'true';

      const pipelines = await prisma.pipeline.findMany({
        where,
        include: {
          stages: {
            orderBy: { order: 'asc' }
          },
          opportunities: {
            select: { id: true, value: true, stage: true, createdAt: true }
          },
          _count: {
            select: {
              opportunities: true,
              stages: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Calcular estatísticas para cada pipeline
      const pipelinesWithStats = pipelines.map(pipeline => ({
        ...pipeline,
        stats: {
          totalOpportunities: pipeline._count.opportunities,
          totalStages: pipeline._count.stages,
          totalValue: pipeline.opportunities.reduce((sum, opp) => sum + opp.value, 0),
          avgDealSize: pipeline.opportunities.length > 0 ?
            pipeline.opportunities.reduce((sum, opp) => sum + opp.value, 0) / pipeline.opportunities.length : 0
        }
      }));

      return {
        success: true,
        data: { pipelines: pipelinesWithStats }
      };
    } catch (error) {
      logger.error('Error in listPipelines:', error);
      throw error;
    }
  }

  /**
   * Obtém um pipeline específico por ID
   */
  async getPipelineById(pipelineId) {
    try {
      const pipeline = await prisma.pipeline.findUnique({
        where: { id: pipelineId },
        include: {
          stages: {
            orderBy: { order: 'asc' }
          },
          opportunities: {
            include: {
              lead: {
                select: { id: true, name: true, phone: true, email: true }
              }
            }
          }
        }
      });

      if (!pipeline) {
        throw new Error('Pipeline não encontrado');
      }

      // Agrupar oportunidades por estágio
      const stagesWithOpportunities = pipeline.stages.map(stage => ({
        ...stage,
        opportunities: pipeline.opportunities.filter(opp => opp.stage === stage.name),
        stats: {
          count: pipeline.opportunities.filter(opp => opp.stage === stage.name).length,
          totalValue: pipeline.opportunities
            .filter(opp => opp.stage === stage.name)
            .reduce((sum, opp) => sum + opp.value, 0)
        }
      }));

      return {
        success: true,
        data: {
          pipeline: {
            ...pipeline,
            stages: stagesWithOpportunities
          }
        }
      };
    } catch (error) {
      logger.error('Error in getPipelineById:', error);
      throw error;
    }
  }

  /**
   * Cria um novo pipeline
   */
  async createPipeline(pipelineData) {
    try {
      const { name, description, businessType, stages = [] } = pipelineData;

      // Verificar se já existe pipeline com mesmo nome
      const existingPipeline = await prisma.pipeline.findFirst({
        where: { name }
      });

      if (existingPipeline) {
        throw new Error('Já existe um pipeline com este nome');
      }

      // Criar pipeline com estágios
      const pipeline = await prisma.pipeline.create({
        data: {
          name,
          description,
          businessType,
          stages: {
            create: stages.map((stage, index) => ({
              name: stage.name,
              description: stage.description,
              color: stage.color || '#3B82F6',
              order: index,
              expectedDuration: stage.expectedDuration || 7,
              automations: JSON.stringify(stage.automations || [])
            }))
          }
        },
        include: {
          stages: {
            orderBy: { order: 'asc' }
          }
        }
      });

      return {
        success: true,
        data: { pipeline }
      };
    } catch (error) {
      logger.error('Error in createPipeline:', error);
      throw error;
    }
  }

  /**
   * Atualiza um pipeline
   */
  async updatePipeline(pipelineId, updateData) {
    try {
      const pipeline = await prisma.pipeline.findUnique({
        where: { id: pipelineId }
      });

      if (!pipeline) {
        throw new Error('Pipeline não encontrado');
      }

      const updatedPipeline = await prisma.pipeline.update({
        where: { id: pipelineId },
        data: updateData,
        include: {
          stages: {
            orderBy: { order: 'asc' }
          }
        }
      });

      return {
        success: true,
        data: { pipeline: updatedPipeline }
      };
    } catch (error) {
      logger.error('Error in updatePipeline:', error);
      throw error;
    }
  }

  /**
   * Exclui um pipeline
   */
  async deletePipeline(pipelineId) {
    try {
      const pipeline = await prisma.pipeline.findUnique({
        where: { id: pipelineId },
        include: { opportunities: true }
      });

      if (!pipeline) {
        throw new Error('Pipeline não encontrado');
      }

      if (pipeline.opportunities.length > 0) {
        throw new Error('Não é possível excluir pipeline com oportunidades');
      }

      await prisma.pipeline.delete({
        where: { id: pipelineId }
      });

      return {
        success: true,
        data: { message: 'Pipeline excluído com sucesso' }
      };
    } catch (error) {
      logger.error('Error in deletePipeline:', error);
      throw error;
    }
  }

  // ==========================================
  // PIPELINE STAGES
  // ==========================================

  /**
   * Obtém estágios de um pipeline
   */
  async getPipelineStages(pipelineId) {
    try {
      const pipeline = await prisma.pipeline.findUnique({
        where: { id: pipelineId }
      });

      if (!pipeline) {
        throw new Error('Pipeline não encontrado');
      }

      const stages = await prisma.pipelineStage.findMany({
        where: { pipelineId },
        orderBy: { order: 'asc' }
      });

      return {
        success: true,
        data: { stages }
      };
    } catch (error) {
      logger.error('Error in getPipelineStages:', error);
      throw error;
    }
  }

  /**
   * Cria um estágio no pipeline
   */
  async createPipelineStage(stageData) {
    try {
      const { pipelineId, name, description, color, expectedDuration } = stageData;

      // Obter próxima ordem
      const lastStage = await prisma.pipelineStage.findFirst({
        where: { pipelineId },
        orderBy: { order: 'desc' }
      });

      const nextOrder = lastStage ? lastStage.order + 1 : 0;

      const stage = await prisma.pipelineStage.create({
        data: {
          pipelineId,
          name,
          description,
          color: color || '#3B82F6',
          order: nextOrder,
          expectedDuration: expectedDuration || 7,
          automations: JSON.stringify([])
        }
      });

      return {
        success: true,
        data: { stage }
      };
    } catch (error) {
      logger.error('Error in createPipelineStage:', error);
      throw error;
    }
  }

  /**
   * Atualiza um estágio do pipeline
   */
  async updatePipelineStage(stageId, updateData) {
    try {
      const stage = await prisma.pipelineStage.findUnique({
        where: { id: stageId }
      });

      if (!stage) {
        throw new Error('Estágio não encontrado');
      }

      const updatedStage = await prisma.pipelineStage.update({
        where: { id: stageId },
        data: updateData
      });

      return {
        success: true,
        data: { stage: updatedStage }
      };
    } catch (error) {
      logger.error('Error in updatePipelineStage:', error);
      throw error;
    }
  }

  // ==========================================
  // OPPORTUNITIES
  // ==========================================

  /**
   * Lista oportunidades
   */
  async listOpportunities(filters = {}) {
    try {
      const {
        stage,
        pipelineId,
        leadId,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      const skip = (page - 1) * limit;

      const where = {};
      if (stage) where.stage = stage;
      if (pipelineId) where.pipelineId = pipelineId;
      if (leadId) where.leadId = leadId;

      const opportunities = await prisma.opportunity.findMany({
        where,
        include: {
          lead: {
            select: { id: true, name: true, phone: true, email: true, status: true }
          },
          pipeline: {
            select: { id: true, name: true, businessType: true }
          },
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 3
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: parseInt(limit)
      });

      const total = await prisma.opportunity.count({ where });

      return {
        success: true,
        data: { opportunities },
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error in listOpportunities:', error);
      throw error;
    }
  }

  /**
   * Obtém uma oportunidade específica
   */
  async getOpportunityById(opportunityId) {
    try {
      const opportunity = await prisma.opportunity.findUnique({
        where: { id: opportunityId },
        include: {
          lead: true,
          pipeline: {
            include: {
              stages: {
                orderBy: { order: 'asc' }
              }
            }
          },
          activities: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!opportunity) {
        throw new Error('Oportunidade não encontrada');
      }

      return {
        success: true,
        data: { opportunity }
      };
    } catch (error) {
      logger.error('Error in getOpportunityById:', error);
      throw error;
    }
  }

  /**
   * Cria uma nova oportunidade
   */
  async createOpportunity(opportunityData) {
    try {
      const {
        title,
        description,
        value,
        currency = 'BRL',
        probability,
        expectedCloseDate,
        stage,
        leadId,
        pipelineId,
        assignedTo
      } = opportunityData;

      // Verificar se lead e pipeline existem
      const lead = await prisma.lead.findUnique({ where: { id: leadId } });
      if (!lead) {
        throw new Error('Lead não encontrado');
      }

      const pipeline = await prisma.pipeline.findUnique({ where: { id: pipelineId } });
      if (!pipeline) {
        throw new Error('Pipeline não encontrado');
      }

      const opportunity = await prisma.opportunity.create({
        data: {
          title,
          description,
          value,
          currency,
          probability,
          expectedCloseDate: new Date(expectedCloseDate),
          stage,
          leadId,
          pipelineId,
          assignedTo
        },
        include: {
          lead: {
            select: { id: true, name: true, phone: true, email: true }
          },
          pipeline: {
            select: { id: true, name: true }
          }
        }
      });

      // Registrar atividade
      await this._logOpportunityActivity(opportunity.id, 'OPPORTUNITY_CREATED', 'Oportunidade criada');

      return {
        success: true,
        data: { opportunity }
      };
    } catch (error) {
      logger.error('Error in createOpportunity:', error);
      throw error;
    }
  }

  /**
   * Atualiza uma oportunidade
   */
  async updateOpportunity(opportunityId, updateData) {
    try {
      const opportunity = await prisma.opportunity.findUnique({
        where: { id: opportunityId }
      });

      if (!opportunity) {
        throw new Error('Oportunidade não encontrada');
      }

      const updatedOpportunity = await prisma.opportunity.update({
        where: { id: opportunityId },
        data: updateData,
        include: {
          lead: {
            select: { id: true, name: true, phone: true, email: true }
          },
          pipeline: {
            select: { id: true, name: true }
          }
        }
      });

      // Registrar atividade de atualização
      await this._logOpportunityActivity(opportunityId, 'OPPORTUNITY_UPDATED', 'Oportunidade atualizada');

      return {
        success: true,
        data: { opportunity: updatedOpportunity }
      };
    } catch (error) {
      logger.error('Error in updateOpportunity:', error);
      throw error;
    }
  }

  /**
   * Move oportunidade para outro estágio
   */
  async moveOpportunityStage(opportunityId, newStage, reason = '') {
    try {
      const opportunity = await prisma.opportunity.findUnique({
        where: { id: opportunityId }
      });

      if (!opportunity) {
        throw new Error('Oportunidade não encontrada');
      }

      const previousStage = opportunity.stage;

      const updatedOpportunity = await prisma.opportunity.update({
        where: { id: opportunityId },
        data: { stage: newStage },
        include: {
          lead: {
            select: { id: true, name: true }
          }
        }
      });

      // Registrar atividade de mudança de estágio
      await this._logOpportunityActivity(
        opportunityId,
        'STAGE_CHANGED',
        `Movida de "${previousStage}" para "${newStage}"${reason ? `. Motivo: ${reason}` : ''}`,
        JSON.stringify({ from: previousStage, to: newStage }),
        JSON.stringify({ stage: newStage, reason })
      );

      return {
        success: true,
        data: { opportunity: updatedOpportunity }
      };
    } catch (error) {
      logger.error('Error in moveOpportunityStage:', error);
      throw error;
    }
  }

  /**
   * Fecha uma oportunidade (ganha ou perdida)
   */
  async closeOpportunity(opportunityId, status, reason = '', actualValue = null) {
    try {
      const opportunity = await prisma.opportunity.findUnique({
        where: { id: opportunityId }
      });

      if (!opportunity) {
        throw new Error('Oportunidade não encontrada');
      }

      const updateData = {
        actualCloseDate: new Date()
      };

      if (actualValue !== null) {
        updateData.value = actualValue;
      }

      const updatedOpportunity = await prisma.opportunity.update({
        where: { id: opportunityId },
        data: updateData,
        include: {
          lead: {
            select: { id: true, name: true }
          }
        }
      });

      // Registrar atividade de fechamento
      await this._logOpportunityActivity(
        opportunityId,
        status === 'won' ? 'OPPORTUNITY_WON' : 'OPPORTUNITY_LOST',
        `Oportunidade ${status === 'won' ? 'ganha' : 'perdida'}${reason ? `. Motivo: ${reason}` : ''}`,
        null,
        JSON.stringify({ status, reason, actualValue })
      );

      return {
        success: true,
        data: { opportunity: updatedOpportunity }
      };
    } catch (error) {
      logger.error('Error in closeOpportunity:', error);
      throw error;
    }
  }

  // ==========================================
  // ANALYTICS E RELATÓRIOS
  // ==========================================

  /**
   * Obtém estatísticas de um pipeline
   */
  async getPipelineStats(pipelineId, period = 'month') {
    try {
      const pipeline = await prisma.pipeline.findUnique({
        where: { id: pipelineId }
      });

      if (!pipeline) {
        throw new Error('Pipeline não encontrado');
      }

      const periodDays = this._getPeriodDays(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      // Estatísticas básicas
      const totalOpportunities = await prisma.opportunity.count({
        where: { pipelineId }
      });

      const totalValue = await prisma.opportunity.aggregate({
        where: { pipelineId },
        _sum: { value: true }
      });

      const wonOpportunities = await prisma.opportunity.count({
        where: {
          pipelineId,
          actualCloseDate: { not: null },
          // Assumindo que oportunidades "won" tem um estágio específico
        }
      });

      // Distribuição por estágio
      const stageDistribution = await prisma.opportunity.groupBy({
        by: ['stage'],
        where: { pipelineId },
        _count: true,
        _sum: { value: true }
      });

      // Taxa de conversão por estágio
      const stages = await prisma.pipelineStage.findMany({
        where: { pipelineId },
        orderBy: { order: 'asc' }
      });

      const conversionRates = await this._calculateStageConversionRates(pipelineId, stages);

      return {
        success: true,
        data: {
          stats: {
            totalOpportunities,
            totalValue: totalValue._sum.value || 0,
            wonOpportunities,
            winRate: totalOpportunities > 0 ? (wonOpportunities / totalOpportunities * 100).toFixed(2) : 0,
            avgDealSize: totalOpportunities > 0 ? (totalValue._sum.value || 0) / totalOpportunities : 0
          },
          stageDistribution: stageDistribution.map(stage => ({
            stage: stage.stage,
            count: stage._count,
            value: stage._sum.value || 0
          })),
          conversionRates
        }
      };
    } catch (error) {
      logger.error('Error in getPipelineStats:', error);
      throw error;
    }
  }

  /**
   * Obtém visão geral do CRM
   */
  async getCRMOverview(period = 'month') {
    try {
      const periodDays = this._getPeriodDays(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      // Estatísticas gerais
      const totalOpportunities = await prisma.opportunity.count();
      const totalPipelines = await prisma.pipeline.count();
      const totalValue = await prisma.opportunity.aggregate({
        _sum: { value: true }
      });

      // Oportunidades criadas no período
      const newOpportunities = await prisma.opportunity.count({
        where: {
          createdAt: { gte: startDate }
        }
      });

      // Top pipelines por valor
      const topPipelines = await prisma.pipeline.findMany({
        include: {
          opportunities: {
            select: { value: true }
          }
        },
        take: 5
      });

      const topPipelinesWithStats = topPipelines.map(pipeline => ({
        ...pipeline,
        totalValue: pipeline.opportunities.reduce((sum, opp) => sum + opp.value, 0),
        opportunityCount: pipeline.opportunities.length
      })).sort((a, b) => b.totalValue - a.totalValue);

      // Forecast para próximo período
      const forecast = await this._generateSimpleForecast(period);

      return {
        success: true,
        data: {
          overview: {
            totalOpportunities,
            totalPipelines,
            totalValue: totalValue._sum.value || 0,
            newOpportunities,
            period
          },
          topPipelines: topPipelinesWithStats,
          forecast
        }
      };
    } catch (error) {
      logger.error('Error in getCRMOverview:', error);
      throw error;
    }
  }

  /**
   * Gera relatório de funil de vendas
   */
  async generateSalesFunnelReport(pipelineId, startDate, endDate) {
    try {
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const stages = await prisma.pipelineStage.findMany({
        where: { pipelineId },
        orderBy: { order: 'asc' }
      });

      const funnelData = [];

      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];

        const opportunities = await prisma.opportunity.findMany({
          where: {
            pipelineId,
            stage: stage.name,
            createdAt: { gte: start, lte: end }
          }
        });

        const totalValue = opportunities.reduce((sum, opp) => sum + opp.value, 0);
        const avgValue = opportunities.length > 0 ? totalValue / opportunities.length : 0;

        // Calcular conversão para próximo estágio
        let conversionRate = 0;
        if (i < stages.length - 1) {
          const nextStage = stages[i + 1];
          const convertedOpportunities = await prisma.opportunity.count({
            where: {
              pipelineId,
              stage: nextStage.name,
              createdAt: { gte: start, lte: end }
            }
          });
          conversionRate = opportunities.length > 0 ? (convertedOpportunities / opportunities.length * 100) : 0;
        }

        funnelData.push({
          stage: stage.name,
          order: stage.order,
          opportunities: opportunities.length,
          totalValue,
          avgValue,
          conversionRate: parseFloat(conversionRate.toFixed(2))
        });
      }

      return {
        success: true,
        data: {
          funnel: funnelData,
          period: { start, end },
          totalOpportunities: funnelData.reduce((sum, stage) => sum + stage.opportunities, 0),
          totalValue: funnelData.reduce((sum, stage) => sum + stage.totalValue, 0)
        }
      };
    } catch (error) {
      logger.error('Error in generateSalesFunnelReport:', error);
      throw error;
    }
  }

  /**
   * Gera previsão de vendas
   */
  async generateSalesForecast(period = 'quarter') {
    try {
      const periodDays = this._getPeriodDays(period);

      // Oportunidades em aberto
      const openOpportunities = await prisma.opportunity.findMany({
        where: {
          actualCloseDate: null,
          expectedCloseDate: {
            lte: new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000)
          }
        },
        include: {
          pipeline: {
            select: { name: true }
          }
        }
      });

      // Calcular valores por probabilidade
      const pessimistic = openOpportunities.reduce((sum, opp) =>
        sum + (opp.value * (opp.probability * 0.5) / 100), 0);

      const realistic = openOpportunities.reduce((sum, opp) =>
        sum + (opp.value * opp.probability / 100), 0);

      const optimistic = openOpportunities.reduce((sum, opp) =>
        sum + (opp.value * Math.min(opp.probability * 1.2, 100) / 100), 0);

      // Agrupar por pipeline
      const pipelineForecast = {};
      openOpportunities.forEach(opp => {
        const pipelineName = opp.pipeline.name;
        if (!pipelineForecast[pipelineName]) {
          pipelineForecast[pipelineName] = {
            opportunities: 0,
            totalValue: 0,
            weightedValue: 0
          };
        }
        pipelineForecast[pipelineName].opportunities++;
        pipelineForecast[pipelineName].totalValue += opp.value;
        pipelineForecast[pipelineName].weightedValue += (opp.value * opp.probability / 100);
      });

      return {
        success: true,
        data: {
          forecast: {
            period,
            pessimistic: Math.round(pessimistic),
            realistic: Math.round(realistic),
            optimistic: Math.round(optimistic),
            totalOpportunities: openOpportunities.length,
            avgProbability: openOpportunities.length > 0 ?
              openOpportunities.reduce((sum, opp) => sum + opp.probability, 0) / openOpportunities.length : 0
          },
          byPipeline: Object.entries(pipelineForecast).map(([name, data]) => ({
            pipeline: name,
            ...data
          }))
        }
      };
    } catch (error) {
      logger.error('Error in generateSalesForecast:', error);
      throw error;
    }
  }

  /**
   * Obtém atividades de uma oportunidade
   */
  async getOpportunityActivities(opportunityId) {
    try {
      const opportunity = await prisma.opportunity.findUnique({
        where: { id: opportunityId }
      });

      if (!opportunity) {
        throw new Error('Oportunidade não encontrada');
      }

      const activities = await prisma.opportunityActivity.findMany({
        where: { opportunityId },
        orderBy: { createdAt: 'desc' }
      });

      return {
        success: true,
        data: { activities }
      };
    } catch (error) {
      logger.error('Error in getOpportunityActivities:', error);
      throw error;
    }
  }

  // ==========================================
  // MÉTODOS PRIVADOS
  // ==========================================

  /**
   * Registra atividade de oportunidade
   */
  async _logOpportunityActivity(opportunityId, type, description, previousValue = null, newValue = null) {
    try {
      await prisma.opportunityActivity.create({
        data: {
          opportunityId,
          type,
          description,
          previousValue,
          newValue
        }
      });
    } catch (error) {
      logger.error('Error logging opportunity activity:', error);
    }
  }

  /**
   * Calcula taxa de conversão entre estágios
   */
  async _calculateStageConversionRates(pipelineId, stages) {
    const conversionRates = [];

    for (let i = 0; i < stages.length - 1; i++) {
      const currentStage = stages[i];
      const nextStage = stages[i + 1];

      const currentCount = await prisma.opportunity.count({
        where: { pipelineId, stage: currentStage.name }
      });

      const nextCount = await prisma.opportunity.count({
        where: { pipelineId, stage: nextStage.name }
      });

      const rate = currentCount > 0 ? (nextCount / currentCount * 100) : 0;

      conversionRates.push({
        from: currentStage.name,
        to: nextStage.name,
        rate: parseFloat(rate.toFixed(2))
      });
    }

    return conversionRates;
  }

  /**
   * Obtém número de dias baseado no período
   */
  _getPeriodDays(period) {
    const periodMap = {
      'week': 7,
      'month': 30,
      'quarter': 90,
      'year': 365
    };
    return periodMap[period] || 30;
  }

  /**
   * Gera previsão simples baseada em dados históricos
   */
  async _generateSimpleForecast(period) {
    const periodDays = this._getPeriodDays(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const historicalData = await prisma.opportunity.aggregate({
      where: {
        createdAt: { gte: startDate },
        actualCloseDate: { not: null }
      },
      _sum: { value: true },
      _count: true
    });

    const avgDealSize = historicalData._count > 0 ?
      (historicalData._sum.value || 0) / historicalData._count : 0;

    const dealsPerPeriod = historicalData._count;

    return {
      expectedDeals: dealsPerPeriod,
      expectedValue: Math.round(avgDealSize * dealsPerPeriod),
      avgDealSize: Math.round(avgDealSize),
      basedOnPeriod: period
    };
  }
}

module.exports = new CRMService();