import { getPrismaClient } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { Prisma } from '@prisma/client';

const prisma = getPrismaClient();

export class PipelineService {
  /**
   * Listar pipelines
   */
  async getPipelines(filters: {
    isDefault?: boolean;
    businessType?: string;
    search?: string;
  }) {
    const { isDefault, businessType, search } = filters;

    const where: Prisma.PipelineWhereInput = {};

    if (isDefault !== undefined) {
      where.isDefault = isDefault;
    }

    if (businessType) {
      where.businessType = businessType;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const pipelines = await prisma.pipeline.findMany({
      where,
      include: {
        stages: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return pipelines;
  }

  /**
   * Obter pipeline por ID
   */
  async getPipelineById(id: string) {
    const pipeline = await prisma.pipeline.findUnique({
      where: { id },
      include: {
        stages: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!pipeline) {
      throw new AppError(404, 'Pipeline não encontrado');
    }

    return pipeline;
  }

  /**
   * Criar pipeline
   */
  async createPipeline(data: {
    name: string;
    description?: string;
    businessType?: string;
    isDefault?: boolean;
  }) {
    const { name, description, businessType, isDefault } = data;

    // Se marcar como default, desmarcar outros
    if (isDefault) {
      await prisma.pipeline.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const pipeline = await prisma.pipeline.create({
      data: {
        name,
        description,
        businessType,
        isDefault: isDefault || false,
      },
      include: {
        stages: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return pipeline;
  }

  /**
   * Atualizar pipeline
   */
  async updatePipeline(id: string, data: {
    name?: string;
    description?: string;
    businessType?: string;
    isDefault?: boolean;
  }) {
    const pipeline = await prisma.pipeline.findUnique({ where: { id } });

    if (!pipeline) {
      throw new AppError(404, 'Pipeline não encontrado');
    }

    // Se marcar como default, desmarcar outros
    if (data.isDefault) {
      await prisma.pipeline.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.pipeline.update({
      where: { id },
      data,
      include: {
        stages: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return updated;
  }

  /**
   * Deletar pipeline
   */
  async deletePipeline(id: string) {
    const pipeline = await prisma.pipeline.findUnique({ where: { id } });

    if (!pipeline) {
      throw new AppError(404, 'Pipeline não encontrado');
    }

    if (pipeline.isDefault) {
      throw new AppError(400, 'Não é possível deletar o pipeline padrão');
    }

    await prisma.pipeline.delete({ where: { id } });

    return { success: true, message: 'Pipeline deletado com sucesso' };
  }

  /**
   * Adicionar estágio ao pipeline
   */
  async addStage(pipelineId: string, data: {
    name: string;
    description?: string;
    color: string;
    order: number;
    expectedDuration?: number;
    conversionRate?: number;
    isClosedWon?: boolean;
    isClosedLost?: boolean;
  }) {
    const pipeline = await prisma.pipeline.findUnique({ where: { id: pipelineId } });

    if (!pipeline) {
      throw new AppError(404, 'Pipeline não encontrado');
    }

    const stage = await prisma.pipelineStage.create({
      data: {
        pipelineId,
        ...data,
      },
    });

    return stage;
  }

  /**
   * Atualizar estágio
   */
  async updateStage(stageId: string, data: {
    name?: string;
    description?: string;
    color?: string;
    order?: number;
    expectedDuration?: number;
    conversionRate?: number;
    isClosedWon?: boolean;
    isClosedLost?: boolean;
  }) {
    const stage = await prisma.pipelineStage.findUnique({ where: { id: stageId } });

    if (!stage) {
      throw new AppError(404, 'Estágio não encontrado');
    }

    const updated = await prisma.pipelineStage.update({
      where: { id: stageId },
      data,
    });

    return updated;
  }

  /**
   * Deletar estágio
   */
  async deleteStage(stageId: string) {
    const stage = await prisma.pipelineStage.findUnique({ where: { id: stageId } });

    if (!stage) {
      throw new AppError(404, 'Estágio não encontrado');
    }

    await prisma.pipelineStage.delete({ where: { id: stageId } });

    return { success: true, message: 'Estágio deletado com sucesso' };
  }

  /**
   * Reordenar estágios
   */
  async reorderStages(pipelineId: string, stageOrders: { id: string; order: number }[]) {
    const pipeline = await prisma.pipeline.findUnique({ where: { id: pipelineId } });

    if (!pipeline) {
      throw new AppError(404, 'Pipeline não encontrado');
    }

    // Atualizar ordem de cada estágio
    await Promise.all(
      stageOrders.map((item) =>
        prisma.pipelineStage.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    );

    return { success: true, message: 'Estágios reordenados com sucesso' };
  }

  /**
   * Obter estatísticas do pipeline
   */
  async getPipelineStats(pipelineId: string) {
    const pipeline = await prisma.pipeline.findUnique({
      where: { id: pipelineId },
      include: {
        stages: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!pipeline) {
      throw new AppError(404, 'Pipeline não encontrado');
    }

    // Contar leads em cada estágio
    const stageStats = await Promise.all(
      pipeline.stages.map(async (stage) => {
        const count = await prisma.lead.count({
          where: { pipelineStage: stage.id },
        });

        return {
          stageId: stage.id,
          stageName: stage.name,
          order: stage.order,
          color: stage.color,
          leadsCount: count,
          expectedDuration: stage.expectedDuration,
          conversionRate: stage.conversionRate,
        };
      })
    );

    const totalLeads = stageStats.reduce((sum, stage) => sum + stage.leadsCount, 0);

    return {
      pipeline: {
        id: pipeline.id,
        name: pipeline.name,
        description: pipeline.description,
      },
      totalLeads,
      stages: stageStats,
    };
  }
}
