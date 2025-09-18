const automationService = require('../services/automationService');
const logger = require('../utils/logger');

/**
 * Worker para processar jobs de automação
 * Este worker é responsável por executar automações em background
 */
async function automationWorker(job) {
  const { data } = job;
  const { type, automationId, leadId, context, priority } = data;

  try {
    logger.info('Iniciando processamento de job de automação', {
      jobId: job.id,
      type,
      automationId,
      leadId
    });

    // Atualizar progresso inicial
    await job.progress(10);

    let result;

    switch (type) {
      case 'execute_automation':
        result = await executeAutomation(job, automationId, leadId, context);
        break;

      case 'execute_automation_batch':
        result = await executeAutomationBatch(job, data);
        break;

      case 'test_automation':
        result = await testAutomation(job, automationId, leadId, context);
        break;

      case 'trigger_automation':
        result = await triggerAutomation(job, data);
        break;

      default:
        throw new Error(`Tipo de job de automação desconhecido: ${type}`);
    }

    // Progresso final
    await job.progress(100);

    logger.info('Job de automação processado com sucesso', {
      jobId: job.id,
      type,
      automationId,
      leadId,
      result: result?.success || false
    });

    return result;

  } catch (error) {
    logger.error('Erro ao processar job de automação', {
      jobId: job.id,
      type,
      automationId,
      leadId,
      error: error.message,
      stack: error.stack
    });

    throw error;
  }
}

/**
 * Executar uma automação específica para um lead
 */
async function executeAutomation(job, automationId, leadId, context = {}) {
  try {
    await job.progress(20);

    const result = await automationService.executeAutomation(automationId, leadId, context);

    await job.progress(80);

    return {
      success: result.success,
      message: result.message,
      executionId: result.execution?.id,
      actionsExecuted: result.results?.length || 0,
      results: result.results
    };

  } catch (error) {
    logger.error('Erro ao executar automação', {
      automationId,
      leadId,
      error: error.message
    });
    throw error;
  }
}

/**
 * Executar automação em lote para múltiplos leads
 */
async function executeAutomationBatch(job, data) {
  const { automationId, leadIds, context } = data;

  try {
    await job.progress(10);

    const results = [];
    const totalLeads = leadIds.length;

    for (let i = 0; i < totalLeads; i++) {
      const leadId = leadIds[i];

      try {
        const result = await automationService.executeAutomation(automationId, leadId, context);
        results.push({
          leadId,
          success: result.success,
          executionId: result.execution?.id,
          actionsExecuted: result.results?.length || 0
        });

        // Atualizar progresso
        const progress = Math.round(((i + 1) / totalLeads) * 80) + 10;
        await job.progress(progress);

      } catch (error) {
        logger.error('Erro ao executar automação para lead', {
          automationId,
          leadId,
          error: error.message
        });

        results.push({
          leadId,
          success: false,
          error: error.message
        });
      }
    }

    await job.progress(100);

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    logger.info('Automação em lote concluída', {
      automationId,
      totalLeads,
      successCount,
      failureCount
    });

    return {
      success: true,
      totalLeads,
      successCount,
      failureCount,
      results
    };

  } catch (error) {
    logger.error('Erro ao executar automação em lote', {
      automationId,
      leadIds: leadIds?.length,
      error: error.message
    });
    throw error;
  }
}

/**
 * Testar uma automação sem executar
 */
async function testAutomation(job, automationId, leadId, context = {}) {
  try {
    await job.progress(30);

    const result = await automationService.testAutomation(automationId, leadId, context);

    await job.progress(90);

    return {
      success: true,
      triggerMet: result.triggerMet,
      wouldExecute: result.wouldExecute,
      lead: result.lead,
      trigger: result.trigger,
      actions: result.actions
    };

  } catch (error) {
    logger.error('Erro ao testar automação', {
      automationId,
      leadId,
      error: error.message
    });
    throw error;
  }
}

/**
 * Processar trigger de automação (ex: lead criado, status alterado)
 */
async function triggerAutomation(job, data) {
  const { triggerType, leadId, context, automationFilters } = data;

  try {
    await job.progress(10);

    // Buscar automações que respondem a este trigger
    const automations = await automationService.getAllAutomations({
      isActive: 'true',
      limit: 100 // Buscar todas as automações ativas
    });

    await job.progress(30);

    const applicableAutomations = automations.automations.filter(automation => {
      const trigger = automation.trigger;
      return trigger.type === triggerType;
    });

    await job.progress(50);

    if (applicableAutomations.length === 0) {
      logger.info('Nenhuma automação encontrada para o trigger', {
        triggerType,
        leadId
      });

      return {
        success: true,
        message: 'No automations found for trigger',
        automationsTriggered: 0
      };
    }

    // Executar automações aplicáveis
    const results = [];
    const totalAutomations = applicableAutomations.length;

    for (let i = 0; i < totalAutomations; i++) {
      const automation = applicableAutomations[i];

      try {
        const result = await automationService.executeAutomation(
          automation.id,
          leadId,
          { ...context, event: triggerType }
        );

        results.push({
          automationId: automation.id,
          automationName: automation.name,
          success: result.success,
          executionId: result.execution?.id,
          actionsExecuted: result.results?.length || 0
        });

        // Atualizar progresso
        const progress = Math.round(((i + 1) / totalAutomations) * 40) + 50;
        await job.progress(progress);

      } catch (error) {
        logger.error('Erro ao executar automação no trigger', {
          automationId: automation.id,
          automationName: automation.name,
          triggerType,
          leadId,
          error: error.message
        });

        results.push({
          automationId: automation.id,
          automationName: automation.name,
          success: false,
          error: error.message
        });
      }
    }

    await job.progress(100);

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    logger.info('Trigger de automação processado', {
      triggerType,
      leadId,
      totalAutomations,
      successCount,
      failureCount
    });

    return {
      success: true,
      triggerType,
      leadId,
      automationsTriggered: totalAutomations,
      successCount,
      failureCount,
      results
    };

  } catch (error) {
    logger.error('Erro ao processar trigger de automação', {
      triggerType,
      leadId,
      error: error.message
    });
    throw error;
  }
}

module.exports = automationWorker;