const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class AutomationService {
  // Criar uma nova automação
  async createAutomation(data) {
    try {
      const automation = await prisma.automation.create({
        data: {
          name: data.name,
          description: data.description || null,
          isActive: data.isActive !== false,
          trigger: JSON.stringify(data.trigger), // Converter objeto para JSON
          actions: JSON.stringify(data.actions), // Converter array para JSON
          priority: data.priority || 1,
          createdBy: data.createdBy || null
        }
      });

      logger.info('Automação criada com sucesso', {
        automationId: automation.id,
        name: automation.name,
        trigger: data.trigger.type
      });

      // Retornar com dados parseados
      return {
        ...automation,
        trigger: JSON.parse(automation.trigger),
        actions: JSON.parse(automation.actions)
      };
    } catch (error) {
      logger.error('Erro ao criar automação', {
        error: error.message,
        data
      });
      throw new Error(`Erro ao criar automação: ${error.message}`);
    }
  }

  // Buscar todas as automações
  async getAllAutomations(filters = {}) {
    try {
      const {
        isActive,
        priority,
        triggerType,
        search,
        page = 1,
        limit = 20,
        sortBy = 'priority',
        sortOrder = 'asc'
      } = filters;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const where = {};

      // Aplicar filtros
      if (isActive !== undefined) where.isActive = isActive === 'true';
      if (priority) where.priority = parseInt(priority);

      // Busca por nome ou descrição
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { description: { contains: search } }
        ];
      }

      const [automations, total] = await Promise.all([
        prisma.automation.findMany({
          where,
          include: {
            executions: {
              take: 5,
              orderBy: { executedAt: 'desc' },
              include: {
                lead: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            },
            _count: {
              select: {
                executions: true
              }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: parseInt(limit)
        }),
        prisma.automation.count({ where })
      ]);

      const totalPages = Math.ceil(total / parseInt(limit));

      // Parse JSON fields
      const parsedAutomations = automations.map(automation => ({
        ...automation,
        trigger: JSON.parse(automation.trigger),
        actions: JSON.parse(automation.actions)
      }));

      logger.info('Automações recuperadas com sucesso', {
        total,
        page: parseInt(page),
        totalPages,
        filters
      });

      return {
        automations: parsedAutomations,
        pagination: {
          total,
          page: parseInt(page),
          totalPages,
          limit: parseInt(limit)
        }
      };
    } catch (error) {
      logger.error('Erro ao buscar automações', {
        error: error.message,
        filters
      });
      throw new Error(`Erro ao buscar automações: ${error.message}`);
    }
  }

  // Buscar automação por ID
  async getAutomationById(id) {
    try {
      const automation = await prisma.automation.findUnique({
        where: { id },
        include: {
          executions: {
            orderBy: { executedAt: 'desc' },
            take: 10,
            include: {
              lead: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                  status: true
                }
              }
            }
          },
          _count: {
            select: {
              executions: true
            }
          }
        }
      });

      if (!automation) {
        logger.warn('Automação não encontrada', { automationId: id });
        return null;
      }

      logger.info('Automação recuperada com sucesso', {
        automationId: automation.id,
        name: automation.name
      });

      // Parse JSON fields
      return {
        ...automation,
        trigger: JSON.parse(automation.trigger),
        actions: JSON.parse(automation.actions)
      };
    } catch (error) {
      logger.error('Erro ao buscar automação por ID', {
        error: error.message,
        automationId: id
      });
      throw new Error(`Erro ao buscar automação: ${error.message}`);
    }
  }

  // Atualizar uma automação
  async updateAutomation(id, data) {
    try {
      // Verificar se automação existe
      const existingAutomation = await prisma.automation.findUnique({
        where: { id }
      });

      if (!existingAutomation) {
        logger.warn('Automação não encontrada para atualização', { automationId: id });
        return null;
      }

      const updateData = {};

      // Apenas atualizar campos fornecidos
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.trigger !== undefined) updateData.trigger = JSON.stringify(data.trigger);
      if (data.actions !== undefined) updateData.actions = JSON.stringify(data.actions);
      if (data.priority !== undefined) updateData.priority = data.priority;

      const automation = await prisma.automation.update({
        where: { id },
        data: updateData,
        include: {
          _count: {
            select: {
              executions: true
            }
          }
        }
      });

      logger.info('Automação atualizada com sucesso', {
        automationId: automation.id,
        name: automation.name,
        updatedFields: Object.keys(updateData)
      });

      // Parse JSON fields
      return {
        ...automation,
        trigger: JSON.parse(automation.trigger),
        actions: JSON.parse(automation.actions)
      };
    } catch (error) {
      logger.error('Erro ao atualizar automação', {
        error: error.message,
        automationId: id,
        data
      });
      throw new Error(`Erro ao atualizar automação: ${error.message}`);
    }
  }

  // Deletar uma automação
  async deleteAutomation(id) {
    try {
      // Verificar se automação existe
      const existingAutomation = await prisma.automation.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              executions: true
            }
          }
        }
      });

      if (!existingAutomation) {
        logger.warn('Automação não encontrada para exclusão', { automationId: id });
        return null;
      }

      // Verificar se tem execuções em andamento
      const runningExecutions = await prisma.automationExecution.count({
        where: {
          automationId: id,
          status: 'RUNNING'
        }
      });

      if (runningExecutions > 0) {
        throw new Error(`Não é possível deletar automação com ${runningExecutions} execuções em andamento`);
      }

      await prisma.automation.delete({
        where: { id }
      });

      logger.info('Automação deletada com sucesso', {
        automationId: id,
        name: existingAutomation.name,
        executionsCount: existingAutomation._count.executions
      });

      return true;
    } catch (error) {
      logger.error('Erro ao deletar automação', {
        error: error.message,
        automationId: id
      });
      throw new Error(`Erro ao deletar automação: ${error.message}`);
    }
  }

  // Executar uma automação para um lead específico
  async executeAutomation(automationId, leadId, context = {}) {
    try {
      // Buscar automação
      const automation = await prisma.automation.findUnique({
        where: { id: automationId }
      });

      if (!automation) {
        throw new Error('Automação não encontrada');
      }

      if (!automation.isActive) {
        throw new Error('Automação está inativa');
      }

      // Buscar lead
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: {
          tags: { include: { tag: true } },
          notes: true,
          communications: true
        }
      });

      if (!lead) {
        throw new Error('Lead não encontrado');
      }

      // Criar registro de execução
      const execution = await prisma.automationExecution.create({
        data: {
          automationId,
          leadId,
          status: 'RUNNING'
        }
      });

      try {
        const trigger = JSON.parse(automation.trigger);
        const actions = JSON.parse(automation.actions);

        // Verificar se o trigger é atendido
        const triggerMet = await this.evaluateTrigger(trigger, lead, context);

        if (!triggerMet) {
          await prisma.automationExecution.update({
            where: { id: execution.id },
            data: {
              status: 'FAILED',
              errorMessage: 'Condições do trigger não foram atendidas',
              completedAt: new Date()
            }
          });

          return {
            success: false,
            message: 'Trigger conditions not met',
            execution
          };
        }

        // Executar ações
        const results = [];
        for (const action of actions) {
          const actionResult = await this.executeAction(action, lead, context);
          results.push(actionResult);
        }

        // Atualizar execução como sucesso
        const updatedExecution = await prisma.automationExecution.update({
          where: { id: execution.id },
          data: {
            status: 'SUCCESS',
            result: JSON.stringify({
              triggerMet: true,
              actionsExecuted: results.length,
              results
            }),
            completedAt: new Date()
          },
          include: {
            automation: true,
            lead: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        });

        logger.info('Automação executada com sucesso', {
          automationId,
          leadId,
          executionId: execution.id,
          actionsExecuted: results.length
        });

        return {
          success: true,
          message: 'Automation executed successfully',
          execution: updatedExecution,
          results
        };

      } catch (actionError) {
        // Atualizar execução como falha
        await prisma.automationExecution.update({
          where: { id: execution.id },
          data: {
            status: 'FAILED',
            errorMessage: actionError.message,
            completedAt: new Date()
          }
        });

        throw actionError;
      }

    } catch (error) {
      logger.error('Erro ao executar automação', {
        error: error.message,
        automationId,
        leadId
      });
      throw new Error(`Erro ao executar automação: ${error.message}`);
    }
  }

  // Avaliar se um trigger é atendido
  async evaluateTrigger(trigger, lead, context) {
    const { type, conditions } = trigger;

    switch (type) {
      case 'lead_created':
        return context.event === 'lead_created';

      case 'lead_updated':
        return context.event === 'lead_updated';

      case 'tag_added':
        if (!context.tagId) return false;
        return lead.tags.some(leadTag => leadTag.tagId === context.tagId);

      case 'status_changed':
        return context.event === 'status_changed' &&
               conditions.from === context.previousStatus &&
               conditions.to === lead.status;

      case 'time_based':
        // Implementar lógica baseada em tempo
        const now = new Date();
        const leadCreatedDate = new Date(lead.createdAt);
        const hoursDiff = (now - leadCreatedDate) / (1000 * 60 * 60);

        return hoursDiff >= conditions.hoursAfterCreation;

      case 'custom_field':
        // Avaliar condições customizadas
        return this.evaluateConditions(conditions, lead);

      default:
        logger.warn('Tipo de trigger não reconhecido', { triggerType: type });
        return false;
    }
  }

  // Executar uma ação específica
  async executeAction(action, lead, context) {
    const { type, value, config } = action;

    switch (type) {
      case 'add_tag':
        // Adicionar tag ao lead
        const tag = await prisma.tag.findFirst({
          where: { name: value }
        });

        if (tag) {
          await prisma.leadTag.create({
            data: {
              leadId: lead.id,
              tagId: tag.id,
              addedBy: 'automation'
            }
          }).catch(() => {}); // Ignorar se já existe
        }

        return { type, success: true, result: `Tag "${value}" added` };

      case 'remove_tag':
        // Remover tag do lead
        const tagToRemove = await prisma.tag.findFirst({
          where: { name: value }
        });

        if (tagToRemove) {
          await prisma.leadTag.delete({
            where: {
              leadId_tagId: {
                leadId: lead.id,
                tagId: tagToRemove.id
              }
            }
          }).catch(() => {}); // Ignorar se não existe
        }

        return { type, success: true, result: `Tag "${value}" removed` };

      case 'update_status':
        // Atualizar status do lead
        await prisma.lead.update({
          where: { id: lead.id },
          data: { status: value }
        });

        return { type, success: true, result: `Status updated to "${value}"` };

      case 'add_note':
        // Adicionar nota ao lead
        await prisma.leadNote.create({
          data: {
            leadId: lead.id,
            content: value,
            important: config?.important || false,
            category: 'Automation',
            createdBy: 'automation'
          }
        });

        return { type, success: true, result: 'Note added' };

      case 'send_webhook':
        // Enviar webhook (será implementado no sistema de webhooks)
        return { type, success: true, result: 'Webhook queued' };

      case 'assign_to':
        // Atribuir lead a um usuário
        await prisma.lead.update({
          where: { id: lead.id },
          data: { assignedTo: value }
        });

        return { type, success: true, result: `Lead assigned to "${value}"` };

      default:
        logger.warn('Tipo de ação não reconhecido', { actionType: type });
        return { type, success: false, result: 'Unknown action type' };
    }
  }

  // Avaliar condições customizadas
  evaluateConditions(conditions, lead) {
    for (const condition of conditions) {
      const { field, operator, value } = condition;
      const leadValue = lead[field];

      switch (operator) {
        case 'equals':
          if (leadValue !== value) return false;
          break;
        case 'contains':
          if (!leadValue || !leadValue.toString().toLowerCase().includes(value.toLowerCase())) return false;
          break;
        case 'greater_than':
          if (Number(leadValue) <= Number(value)) return false;
          break;
        case 'less_than':
          if (Number(leadValue) >= Number(value)) return false;
          break;
        default:
          return false;
      }
    }

    return true;
  }

  // Buscar estatísticas de automações
  async getAutomationStats() {
    try {
      const [
        totalAutomations,
        activeAutomations,
        inactiveAutomations,
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        runningExecutions
      ] = await Promise.all([
        prisma.automation.count(),
        prisma.automation.count({ where: { isActive: true } }),
        prisma.automation.count({ where: { isActive: false } }),
        prisma.automationExecution.count(),
        prisma.automationExecution.count({ where: { status: 'SUCCESS' } }),
        prisma.automationExecution.count({ where: { status: 'FAILED' } }),
        prisma.automationExecution.count({ where: { status: 'RUNNING' } })
      ]);

      // Buscar automações mais executadas
      const topAutomations = await prisma.automation.findMany({
        include: {
          _count: {
            select: {
              executions: true
            }
          }
        },
        orderBy: {
          executions: {
            _count: 'desc'
          }
        },
        take: 5
      });

      const stats = {
        totals: {
          automations: totalAutomations,
          activeAutomations,
          inactiveAutomations,
          executions: totalExecutions
        },
        executions: {
          successful: successfulExecutions,
          failed: failedExecutions,
          running: runningExecutions,
          successRate: totalExecutions > 0 ?
            Math.round((successfulExecutions / totalExecutions) * 100) : 0
        },
        topAutomations: topAutomations.map(automation => ({
          id: automation.id,
          name: automation.name,
          executionsCount: automation._count.executions,
          isActive: automation.isActive
        }))
      };

      logger.info('Estatísticas de automações calculadas', stats);

      return stats;
    } catch (error) {
      logger.error('Erro ao calcular estatísticas de automações', {
        error: error.message
      });
      throw new Error(`Erro ao calcular estatísticas: ${error.message}`);
    }
  }

  // Testar uma automação sem executar
  async testAutomation(automationId, leadId, context = {}) {
    try {
      const automation = await prisma.automation.findUnique({
        where: { id: automationId }
      });

      if (!automation) {
        throw new Error('Automação não encontrada');
      }

      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: {
          tags: { include: { tag: true } },
          notes: true
        }
      });

      if (!lead) {
        throw new Error('Lead não encontrado');
      }

      const trigger = JSON.parse(automation.trigger);
      const actions = JSON.parse(automation.actions);

      // Avaliar trigger
      const triggerMet = await this.evaluateTrigger(trigger, lead, context);

      // Simular execução das ações (sem realmente executar)
      const actionSimulations = actions.map(action => ({
        type: action.type,
        value: action.value,
        wouldExecute: triggerMet,
        description: this.getActionDescription(action)
      }));

      logger.info('Teste de automação executado', {
        automationId,
        leadId,
        triggerMet,
        actionsCount: actions.length
      });

      return {
        triggerMet,
        lead: {
          id: lead.id,
          name: lead.name,
          status: lead.status
        },
        trigger: {
          ...trigger,
          conditionsMet: triggerMet
        },
        actions: actionSimulations,
        wouldExecute: triggerMet
      };

    } catch (error) {
      logger.error('Erro ao testar automação', {
        error: error.message,
        automationId,
        leadId
      });
      throw new Error(`Erro ao testar automação: ${error.message}`);
    }
  }

  // Obter descrição de uma ação
  getActionDescription(action) {
    const { type, value, config } = action;

    switch (type) {
      case 'add_tag':
        return `Adicionar tag "${value}"`;
      case 'remove_tag':
        return `Remover tag "${value}"`;
      case 'update_status':
        return `Atualizar status para "${value}"`;
      case 'add_note':
        return `Adicionar nota: "${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"`;
      case 'assign_to':
        return `Atribuir lead para "${value}"`;
      case 'send_webhook':
        return `Enviar webhook para "${value}"`;
      default:
        return `Ação desconhecida: ${type}`;
    }
  }
}

module.exports = new AutomationService();