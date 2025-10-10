import { PrismaClient, Pipeline, PipelineStage, Opportunity } from '@prisma/client';
import {
  CreatePipelineDTO,
  CreateOpportunityDTO,
  MoveOpportunityDTO,
  PipelineStatsResponse,
  FunnelData,
  UpdatePipelineDTO,
  UpdateStageDTO,
  CreateStageDTO,
  OpportunityTimelineEntry,
  ReorderStageDTO,
} from './pipeline.types';

// ============================================================================
// Pipeline Service
// ============================================================================

export class PipelineService {
  constructor(private prisma: PrismaClient) {}

  // ========================================================================
  // Pipeline CRUD Operations
  // ========================================================================

  async createPipeline(data: CreatePipelineDTO, userId: string): Promise<Pipeline> {
    // Se for pipeline padrão, remover padrão dos outros
    if (data.isDefault) {
      await this.prisma.pipeline.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.pipeline.create({
      data: {
        name: data.name,
        description: data.description,
        businessType: 'CRM', // Default type
        isDefault: data.isDefault || false,
        createdById: userId,
        stages: {
          create: data.stages.map((stage) => ({
            name: stage.name,
            order: stage.order,
            color: stage.color,
            expectedDuration: stage.rottenDays || 7,
            description: '',
          })),
        },
      },
      include: {
        stages: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async findAll(): Promise<Pipeline[]> {
    return this.prisma.pipeline.findMany({
      include: {
        stages: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { stages: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Pipeline | null> {
    return this.prisma.pipeline.findUnique({
      where: { id },
      include: {
        stages: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async updatePipeline(id: string, data: Partial<UpdatePipelineDTO>): Promise<Pipeline> {
    // Se for pipeline padrão, remover padrão dos outros
    if (data.isDefault) {
      await this.prisma.pipeline.updateMany({
        where: {
          isDefault: true,
          NOT: { id },
        },
        data: { isDefault: false },
      });
    }

    return this.prisma.pipeline.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        isDefault: data.isDefault,
      },
      include: {
        stages: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async deletePipeline(id: string): Promise<void> {
    await this.prisma.pipeline.delete({
      where: { id },
    });
  }

  // ========================================================================
  // Stage Operations
  // ========================================================================

  async getStagesByPipeline(pipelineId: string): Promise<PipelineStage[]> {
    return this.prisma.pipelineStage.findMany({
      where: { pipelineId },
      orderBy: { order: 'asc' },
    });
  }

  async createStage(pipelineId: string, data: CreateStageDTO): Promise<PipelineStage> {
    return this.prisma.pipelineStage.create({
      data: {
        pipelineId,
        name: data.name,
        order: data.order,
        color: data.color,
        expectedDuration: data.rottenDays || 7,
        description: '',
      },
    });
  }

  async updateStage(id: string, data: UpdateStageDTO): Promise<PipelineStage> {
    return this.prisma.pipelineStage.update({
      where: { id },
      data: {
        name: data.name,
        order: data.order,
        color: data.color,
        expectedDuration: data.rottenDays,
      },
    });
  }

  async deleteStage(id: string): Promise<void> {
    await this.prisma.pipelineStage.delete({
      where: { id },
    });
  }

  async reorderStages(pipelineId: string, reorders: ReorderStageDTO[]): Promise<PipelineStage[]> {
    // Update each stage order in a transaction
    await this.prisma.$transaction(
      reorders.map((reorder) =>
        this.prisma.pipelineStage.update({
          where: { id: reorder.stageId },
          data: { order: reorder.newOrder },
        })
      )
    );

    // Return updated stages
    return this.getStagesByPipeline(pipelineId);
  }

  // ========================================================================
  // Opportunity Operations
  // ========================================================================

  async createOpportunity(data: CreateOpportunityDTO, userId: string): Promise<Opportunity> {
    // Verify stage belongs to pipeline
    const stage = await this.prisma.pipelineStage.findUnique({
      where: { id: data.stageId },
    });

    if (!stage || stage.pipelineId !== data.pipelineId) {
      throw new Error('Stage does not belong to the specified pipeline');
    }

    return this.prisma.opportunity.create({
      data: {
        leadId: data.leadId,
        title: 'Nova Oportunidade',
        description: '',
        value: data.value || 0,
        probability: data.probability || 10,
        stage: data.stageId,
        source: 'CRM',
        expectedCloseDate: data.expectedCloseDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        assignedToId: data.assignedToId || userId,
        createdById: userId,
      },
      include: {
        lead: true,
        assignedTo: true,
      },
    });
  }

  async moveOpportunity(data: MoveOpportunityDTO): Promise<Opportunity> {
    const opportunity = await this.prisma.opportunity.findUnique({
      where: { id: data.opportunityId },
    });

    if (!opportunity) {
      throw new Error('Oportunidade não encontrada');
    }

    // Update opportunity stage
    return this.prisma.opportunity.update({
      where: { id: data.opportunityId },
      data: {
        stage: data.targetStageId,
      },
      include: {
        lead: true,
        assignedTo: true,
      },
    });
  }

  async getOpportunityTimeline(opportunityId: string): Promise<OpportunityTimelineEntry[]> {
    const opportunity = await this.prisma.opportunity.findUnique({
      where: { id: opportunityId },
      select: {
        id: true,
        stage: true,
        createdAt: true,
      },
    });

    if (!opportunity) {
      throw new Error('Oportunidade não encontrada');
    }

    // For now, return simple timeline with current stage
    // In a full implementation, you'd track stage history
    return [
      {
        id: opportunity.id,
        stageId: opportunity.stage,
        stageName: opportunity.stage,
        enteredAt: opportunity.createdAt,
      },
    ];
  }

  // ========================================================================
  // Statistics & Analytics
  // ========================================================================

  async getPipelineStats(pipelineId: string): Promise<PipelineStatsResponse> {
    const stages = await this.prisma.pipelineStage.findMany({
      where: { pipelineId },
      orderBy: { order: 'asc' },
    });

    // Get all opportunities for this pipeline's stages
    const stageIds = stages.map((s) => s.id);
    const opportunities = await this.prisma.opportunity.findMany({
      where: {
        stage: { in: stageIds },
      },
    });

    const totalOpportunities = opportunities.length;
    const totalValue = opportunities.reduce((sum, opp) => sum + (opp.value || 0), 0);
    const avgValue = totalOpportunities > 0 ? totalValue / totalOpportunities : 0;

    // Estatísticas por estágio
    const byStage = stages.map((stage) => {
      const stageOpps = opportunities.filter((opp) => opp.stage === stage.id);
      const stageValue = stageOpps.reduce((sum, opp) => sum + (opp.value || 0), 0);

      return {
        stageId: stage.id,
        stageName: stage.name,
        count: stageOpps.length,
        value: stageValue,
        averageTime: stage.expectedDuration, // Simplified
      };
    });

    return {
      totalOpportunities,
      totalValue,
      averageValue: avgValue,
      conversionRate: 0, // Simplified - would calculate based on closed won/lost
      averageTimeInPipeline: 0, // Simplified - would calculate from history
      byStage,
    };
  }

  async getFunnel(pipelineId: string): Promise<FunnelData[]> {
    const stages = await this.prisma.pipelineStage.findMany({
      where: { pipelineId },
      orderBy: { order: 'asc' },
    });

    const stageIds = stages.map((s) => s.id);
    const opportunities = await this.prisma.opportunity.findMany({
      where: {
        stage: { in: stageIds },
      },
    });

    let previousCount = 0;

    return stages.map((stage, index) => {
      const stageOpps = opportunities.filter((opp) => opp.stage === stage.id);
      const count = stageOpps.length;
      const value = stageOpps.reduce((sum, opp) => sum + (opp.value || 0), 0);
      const conversionRate =
        index === 0 ? 100 : previousCount > 0 ? (count / previousCount) * 100 : 0;

      previousCount = count;

      return {
        stage: stage.name,
        count,
        value,
        conversionRate,
      };
    });
  }
}
