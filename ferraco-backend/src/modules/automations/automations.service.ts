import prisma from '../../config/database';
import { PAGINATION } from '../../config/constants';
import { AppError } from '../../middleware/errorHandler';

export class AutomationsService {
  /**
   * Listar automações
   */
  async getAutomations(filters: {
    isActive?: boolean;
    triggerType?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      isActive,
      triggerType,
      search,
      page = PAGINATION.defaultPage,
      limit = PAGINATION.defaultLimit,
    } = filters;

    const where: any = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (triggerType) {
      where.triggerType = triggerType;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [automations, total] = await Promise.all([
      prisma.automation.findMany({
        where,
        include: {
          _count: {
            select: { logs: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * Math.min(limit, PAGINATION.maxLimit),
        take: Math.min(limit, PAGINATION.maxLimit),
      }),
      prisma.automation.count({ where }),
    ]);

    return {
      data: automations,
      pagination: {
        page,
        limit: Math.min(limit, PAGINATION.maxLimit),
        total,
        totalPages: Math.ceil(total / Math.min(limit, PAGINATION.maxLimit)),
      },
    };
  }

  /**
   * Obter automação por ID
   */
  async getAutomationById(id: string) {
    const automation = await prisma.automation.findUnique({
      where: { id },
      include: {
        logs: {
          orderBy: { executedAt: 'desc' },
          take: 10,
          include: {
            lead: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!automation) {
      throw new AppError(404, 'Automação não encontrada');
    }

    return automation;
  }

  /**
   * Criar automação
   */
  async createAutomation(data: {
    name: string;
    description?: string;
    triggerType: string;
    triggerValue?: string;
    conditions: string;
    actions: string;
  }) {
    const automation = await prisma.automation.create({
      data: {
        name: data.name,
        description: data.description,
        triggerType: data.triggerType,
        triggerValue: data.triggerValue,
        conditions: data.conditions,
        actions: data.actions,
        isActive: true,
      },
    });

    return automation;
  }

  /**
   * Atualizar automação
   */
  async updateAutomation(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      triggerType: string;
      triggerValue: string;
      conditions: string;
      actions: string;
      isActive: boolean;
    }>
  ) {
    const automation = await prisma.automation.update({
      where: { id },
      data,
    });

    return automation;
  }

  /**
   * Deletar automação
   */
  async deleteAutomation(id: string) {
    const automation = await prisma.automation.findUnique({ where: { id } });
    if (!automation) {
      throw new AppError(404, 'Automação não encontrada');
    }

    await prisma.automation.delete({ where: { id } });

    return { message: 'Automação deletada com sucesso' };
  }

  /**
   * Toggle status da automação
   */
  async toggleAutomationStatus(id: string) {
    const automation = await prisma.automation.findUnique({ where: { id } });
    if (!automation) {
      throw new AppError(404, 'Automação não encontrada');
    }

    const updated = await prisma.automation.update({
      where: { id },
      data: { isActive: !automation.isActive },
    });

    return updated;
  }

  /**
   * Executar automação manualmente
   */
  async executeAutomation(id: string, leadId?: string) {
    const automation = await prisma.automation.findUnique({ where: { id } });
    if (!automation) {
      throw new AppError(404, 'Automação não encontrada');
    }

    if (!automation.isActive) {
      throw new AppError(400, 'Automação está desativada');
    }

    try {
      // Simular execução (em produção, implementar lógica real)
      const log = await prisma.automationLog.create({
        data: {
          automationId: id,
          leadId: leadId || null,
          success: true,
        },
      });

      // Atualizar contadores
      await prisma.automation.update({
        where: { id },
        data: {
          executionCount: { increment: 1 },
          lastExecuted: new Date(),
        },
      });

      return { success: true, logId: log.id };
    } catch (error: any) {
      await prisma.automationLog.create({
        data: {
          automationId: id,
          leadId: leadId || null,
          success: false,
          errorMessage: error.message,
        },
      });

      throw new AppError(500, 'Erro ao executar automação');
    }
  }

  /**
   * Obter logs de uma automação
   */
  async getAutomationLogs(
    automationId: string,
    filters: {
      success?: boolean;
      page?: number;
      limit?: number;
    }
  ) {
    const { success, page = PAGINATION.defaultPage, limit = PAGINATION.defaultLimit } = filters;

    const where: any = { automationId };

    if (success !== undefined) {
      where.success = success;
    }

    const [logs, total] = await Promise.all([
      prisma.automationLog.findMany({
        where,
        include: {
          lead: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { executedAt: 'desc' },
        skip: (page - 1) * Math.min(limit, PAGINATION.maxLimit),
        take: Math.min(limit, PAGINATION.maxLimit),
      }),
      prisma.automationLog.count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        limit: Math.min(limit, PAGINATION.maxLimit),
        total,
        totalPages: Math.ceil(total / Math.min(limit, PAGINATION.maxLimit)),
      },
    };
  }

  /**
   * Obter estatísticas de automações
   */
  async getAutomationStats() {
    const [total, active, totalExecutions, successRate] = await Promise.all([
      prisma.automation.count(),
      prisma.automation.count({ where: { isActive: true } }),
      prisma.automationLog.count(),
      this.calculateSuccessRate(),
    ]);

    return {
      total,
      active,
      totalExecutions,
      successRate,
    };
  }

  private async calculateSuccessRate() {
    const [successful, failed] = await Promise.all([
      prisma.automationLog.count({ where: { success: true } }),
      prisma.automationLog.count({ where: { success: false } }),
    ]);

    const total = successful + failed;
    return total > 0 ? (successful / total) * 100 : 0;
  }
}
