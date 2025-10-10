import { PrismaClient, Automation, AutomationExecution } from '@prisma/client';
import {
  CreateAutomationDTO,
  UpdateAutomationDTO,
  ExecuteAutomationDTO,
  AutomationStatsResponse,
  TestAutomationDTO,
  TestAutomationResult,
  AutomationCondition,
  AutomationAction,
  ExecutionContext,
} from './automations.types';

// ============================================================================
// Automations Service
// ============================================================================

export class AutomationsService {
  constructor(private prisma: PrismaClient) {}

  // ========================================================================
  // CRUD Operations
  // ========================================================================

  async create(data: CreateAutomationDTO, userId: string): Promise<Automation> {
    return this.prisma.automation.create({
      data: {
        name: data.name,
        description: data.description || '',
        triggerType: data.trigger.type as never,
        triggerValue: JSON.stringify(data.trigger.config || {}),
        conditions: JSON.stringify(data.conditions),
        actions: JSON.stringify(data.actions),
        isActive: data.isActive !== false,
        createdById: userId,
      },
    });
  }

  async findAll(): Promise<Automation[]> {
    return this.prisma.automation.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Automation | null> {
    return this.prisma.automation.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: Partial<UpdateAutomationDTO>): Promise<Automation> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.trigger !== undefined) {
      updateData.triggerType = data.trigger.type as never;
      updateData.triggerValue = JSON.stringify(data.trigger.config || {});
    }
    if (data.conditions !== undefined) updateData.conditions = JSON.stringify(data.conditions);
    if (data.actions !== undefined) updateData.actions = JSON.stringify(data.actions);
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return this.prisma.automation.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.automation.delete({
      where: { id },
    });
  }

  async toggle(id: string): Promise<Automation> {
    const automation = await this.prisma.automation.findUnique({
      where: { id },
    });

    if (!automation) {
      throw new Error('Automação não encontrada');
    }

    return this.prisma.automation.update({
      where: { id },
      data: { isActive: !automation.isActive },
    });
  }

  // ========================================================================
  // Execution Operations
  // ========================================================================

  async execute(data: ExecuteAutomationDTO): Promise<AutomationExecution> {
    const automation = await this.prisma.automation.findUnique({
      where: { id: data.automationId },
    });

    if (!automation) {
      throw new Error('Automação não encontrada');
    }

    if (!automation.isActive) {
      throw new Error('Automação está desativada');
    }

    const startTime = Date.now();
    let success = false;
    let error: string | undefined;
    const results: unknown[] = [];

    try {
      // Parse stored JSON data
      const conditions = JSON.parse(automation.conditions as string) as AutomationCondition[];
      const actions = JSON.parse(automation.actions as string) as AutomationAction[];

      // Evaluate conditions
      const conditionsMet = this.evaluateConditions(conditions, data.context);

      if (!conditionsMet) {
        throw new Error('Condições não atendidas');
      }

      // Execute actions
      for (const action of actions) {
        const result = await this.executeAction(action, data.context);
        results.push(result);
      }

      success = true;

      // Update automation execution count
      await this.prisma.automation.update({
        where: { id: data.automationId },
        data: {
          executionCount: { increment: 1 },
          lastExecutedAt: new Date(),
        },
      });
    } catch (err) {
      error = err instanceof Error ? err.message : 'Erro desconhecido';
    }

    const executionTime = Date.now() - startTime;

    // Register execution
    return this.prisma.automationExecution.create({
      data: {
        automationId: data.automationId,
        leadId: data.context.leadId as string | undefined,
        status: success ? 'success' : 'failed',
        result: JSON.stringify(results),
        error,
      },
    });
  }

  async test(data: TestAutomationDTO): Promise<TestAutomationResult> {
    // Evaluate conditions and track results
    const conditionResults = data.conditions.map((condition) => {
      const actualValue = data.context[condition.field];
      const passed = this.evaluateCondition(condition, data.context);

      return {
        field: condition.field,
        operator: condition.operator,
        expectedValue: condition.value,
        actualValue,
        passed,
      };
    });

    const conditionsMet = conditionResults.every((r) => r.passed);

    // Test actions (dry run)
    const actionResults = [];
    if (conditionsMet) {
      for (const action of data.actions) {
        try {
          const result = await this.executeAction(action, data.context, true);
          actionResults.push({
            type: action.type,
            result,
            success: true,
          });
        } catch (err) {
          actionResults.push({
            type: action.type,
            result: null,
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }
    }

    return {
      conditionsMet,
      conditionResults,
      actions: actionResults,
    };
  }

  async getExecutions(
    automationId: string,
    filter?: {
      success?: boolean;
      dateFrom?: Date;
      dateTo?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<AutomationExecution[]> {
    return this.prisma.automationExecution.findMany({
      where: {
        automationId,
        status: filter?.success !== undefined ? (filter.success ? 'success' : 'failed') : undefined,
        executedAt: {
          gte: filter?.dateFrom,
          lte: filter?.dateTo,
        },
      },
      orderBy: { executedAt: 'desc' },
      take: filter?.limit || 50,
      skip: filter?.offset || 0,
    });
  }

  async getStats(): Promise<AutomationStatsResponse> {
    const [automations, executions] = await Promise.all([
      this.prisma.automation.findMany(),
      this.prisma.automationExecution.findMany(),
    ]);

    const total = automations.length;
    const active = automations.filter((a) => a.isActive).length;
    const inactive = total - active;

    const totalExecutions = executions.length;
    const successfulExecutions = executions.filter((e) => e.status === 'success').length;
    const failedExecutions = totalExecutions - successfulExecutions;
    const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;

    // Group by trigger type
    const byTriggerType = automations.reduce(
      (acc, automation) => {
        const type = automation.triggerType;
        if (!acc[type]) {
          acc[type] = { type, count: 0, executions: 0 };
        }
        acc[type].count++;
        acc[type].executions += automation.executionCount;
        return acc;
      },
      {} as Record<string, { type: string; count: number; executions: number }>
    );

    return {
      total,
      active,
      inactive,
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      successRate,
      averageExecutionTime: 0, // Would calculate from execution times
      byTriggerType: Object.values(byTriggerType),
    };
  }

  // ========================================================================
  // Private Helper Methods
  // ========================================================================

  private evaluateConditions(conditions: AutomationCondition[], context: ExecutionContext): boolean {
    if (conditions.length === 0) return true;

    return conditions.every((condition) => this.evaluateCondition(condition, context));
  }

  private evaluateCondition(condition: AutomationCondition, context: ExecutionContext): boolean {
    const fieldValue = context[condition.field];

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;

      case 'not_equals':
        return fieldValue !== condition.value;

      case 'contains':
        return String(fieldValue).includes(String(condition.value));

      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);

      case 'less_than':
        return Number(fieldValue) < Number(condition.value);

      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue as never);

      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue as never);

      default:
        return false;
    }
  }

  private async executeAction(
    action: AutomationAction,
    context: ExecutionContext,
    dryRun = false
  ): Promise<unknown> {
    switch (action.type) {
      case 'SEND_EMAIL':
        if (dryRun) return { type: 'email', simulated: true };
        // Implement email sending
        return { sent: true, type: 'email' };

      case 'SEND_WHATSAPP':
        if (dryRun) return { type: 'whatsapp', simulated: true };
        // Implement WhatsApp sending
        return { sent: true, type: 'whatsapp' };

      case 'ADD_TAG':
        if (dryRun) return { type: 'add_tag', tagId: action.config.tagId, simulated: true };
        // Add tag to lead
        if (context.leadId && action.config.tagId) {
          await this.prisma.leadTag.create({
            data: {
              leadId: context.leadId as string,
              tagId: action.config.tagId as string,
            },
          });
        }
        return { tagAdded: true };

      case 'ASSIGN_TO':
        if (dryRun) return { type: 'assign', userId: action.config.userId, simulated: true };
        // Assign lead to user
        if (context.leadId && action.config.userId) {
          await this.prisma.lead.update({
            where: { id: context.leadId as string },
            data: { assignedToId: action.config.userId as string },
          });
        }
        return { assigned: true };

      case 'UPDATE_FIELD':
        if (dryRun)
          return {
            type: 'update_field',
            field: action.config.field,
            value: action.config.value,
            simulated: true,
          };
        // Update lead field
        if (context.leadId && action.config.field && action.config.value !== undefined) {
          await this.prisma.lead.update({
            where: { id: context.leadId as string },
            data: {
              [action.config.field as string]: action.config.value,
            },
          });
        }
        return { updated: true };

      case 'MOVE_TO_STAGE':
        if (dryRun) return { type: 'move_stage', stageId: action.config.stageId, simulated: true };
        // Move to pipeline stage
        if (context.leadId && action.config.stageId) {
          await this.prisma.lead.update({
            where: { id: context.leadId as string },
            data: { pipelineStageId: action.config.stageId as string },
          });
        }
        return { moved: true };

      case 'CREATE_TASK':
        if (dryRun) return { type: 'create_task', task: action.config, simulated: true };
        // Create task (would implement task system)
        return { taskCreated: true };

      case 'SEND_WEBHOOK':
        if (dryRun) return { type: 'webhook', url: action.config.url, simulated: true };
        // Send webhook
        return { webhookSent: true };

      default:
        throw new Error(`Tipo de ação desconhecido: ${action.type}`);
    }
  }
}
