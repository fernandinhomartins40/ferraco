const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Worker para processar jobs do WhatsApp Business
 * TODO: Implementar integração real com WhatsApp Business API
 */
async function whatsappWorker(job) {
  const { data } = job;
  const { type } = data;

  try {
    logger.info('Iniciando processamento de job do WhatsApp', {
      jobId: job.id,
      type,
      to: data.to,
      message: data.message?.substring(0, 50)
    });

    await job.progress(10);

    let result;

    switch (type) {
      case 'send_whatsapp':
        result = await sendWhatsApp(job, data);
        break;

      case 'send_template_whatsapp':
        result = await sendTemplateWhatsApp(job, data);
        break;

      case 'send_automation_whatsapp':
        result = await sendAutomationWhatsApp(job, data);
        break;

      default:
        throw new Error(`Tipo de job do WhatsApp desconhecido: ${type}`);
    }

    await job.progress(100);

    logger.info('Job do WhatsApp processado com sucesso', {
      jobId: job.id,
      type,
      success: result?.success || false
    });

    return result;

  } catch (error) {
    logger.error('Erro ao processar job do WhatsApp', {
      jobId: job.id,
      type,
      error: error.message
    });
    throw error;
  }
}

async function sendWhatsApp(job, data) {
  const { to, message, leadId } = data;

  try {
    await job.progress(30);

    // TODO: Implementar integração real com WhatsApp Business API
    // Por enquanto, simular envio e registrar no banco

    const communicationRecord = await prisma.communication.create({
      data: {
        leadId: leadId || null,
        type: 'WHATSAPP',
        direction: 'OUTBOUND',
        content: JSON.stringify({ to, message }),
        status: 'SENT', // Em produção, seria baseado na resposta da API
        sentAt: new Date()
      }
    });

    await job.progress(90);

    logger.info('WhatsApp enviado (simulado)', {
      to,
      message: message.substring(0, 50),
      communicationId: communicationRecord.id
    });

    return {
      success: true,
      communicationId: communicationRecord.id,
      to,
      simulated: true
    };

  } catch (error) {
    logger.error('Erro ao enviar WhatsApp', { to, error: error.message });
    throw error;
  }
}

async function sendTemplateWhatsApp(job, data) {
  const { to, templateId, variables, leadId } = data;

  try {
    await job.progress(20);

    const template = await prisma.whatsappTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      throw new Error(`Template do WhatsApp não encontrado: ${templateId}`);
    }

    let message = template.content;

    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{{${key}}}`;
        message = message.replace(new RegExp(placeholder, 'g'), value);
      }
    }

    await job.progress(60);

    const result = await sendWhatsApp(job, { to, message, leadId });

    return {
      ...result,
      templateId,
      templateName: template.name
    };

  } catch (error) {
    logger.error('Erro ao enviar WhatsApp com template', {
      to, templateId, error: error.message
    });
    throw error;
  }
}

async function sendAutomationWhatsApp(job, data) {
  const { leadId, automationId, templateId, message, variables } = data;

  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });

    if (!lead || !lead.phone) {
      throw new Error(`Lead ${leadId} não possui telefone para WhatsApp`);
    }

    const leadVariables = {
      'lead.name': lead.name,
      'lead.phone': lead.phone,
      'lead.status': lead.status,
      ...variables
    };

    let result;

    if (templateId) {
      result = await sendTemplateWhatsApp(job, {
        to: lead.phone,
        templateId,
        variables: leadVariables,
        leadId
      });
    } else {
      let processedMessage = message;
      for (const [key, value] of Object.entries(leadVariables)) {
        const placeholder = `{{${key}}}`;
        processedMessage = processedMessage.replace(new RegExp(placeholder, 'g'), value || '');
      }

      result = await sendWhatsApp(job, {
        to: lead.phone,
        message: processedMessage,
        leadId
      });
    }

    return { ...result, leadId, automationId };

  } catch (error) {
    logger.error('Erro ao enviar WhatsApp de automação', {
      leadId, automationId, error: error.message
    });
    throw error;
  }
}

module.exports = whatsappWorker;