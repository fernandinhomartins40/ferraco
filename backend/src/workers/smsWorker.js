const twilio = require('twilio');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

// Cliente Twilio
let twilioClient = null;

function createTwilioClient() {
  if (twilioClient) return twilioClient;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('Credenciais do Twilio não encontradas nas variáveis de ambiente');
  }

  twilioClient = twilio(accountSid, authToken);

  logger.info('Cliente Twilio configurado', {
    accountSid: accountSid.substring(0, 10) + '...'
  });

  return twilioClient;
}

/**
 * Worker para processar jobs de SMS
 */
async function smsWorker(job) {
  const { data } = job;
  const { type } = data;

  try {
    logger.info('Iniciando processamento de job de SMS', {
      jobId: job.id,
      type,
      to: data.to,
      message: data.message?.substring(0, 50)
    });

    // Atualizar progresso inicial
    await job.progress(10);

    let result;

    switch (type) {
      case 'send_sms':
        result = await sendSms(job, data);
        break;

      case 'send_template_sms':
        result = await sendTemplateSms(job, data);
        break;

      case 'send_bulk_sms':
        result = await sendBulkSms(job, data);
        break;

      case 'send_automation_sms':
        result = await sendAutomationSms(job, data);
        break;

      default:
        throw new Error(`Tipo de job de SMS desconhecido: ${type}`);
    }

    // Progresso final
    await job.progress(100);

    logger.info('Job de SMS processado com sucesso', {
      jobId: job.id,
      type,
      success: result?.success || false
    });

    return result;

  } catch (error) {
    logger.error('Erro ao processar job de SMS', {
      jobId: job.id,
      type,
      error: error.message,
      stack: error.stack
    });

    throw error;
  }
}

/**
 * Enviar SMS simples
 */
async function sendSms(job, data) {
  const { to, message, leadId, mediaUrl } = data;

  try {
    await job.progress(20);

    const client = createTwilioClient();
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!fromNumber) {
      throw new Error('Número do Twilio não configurado');
    }

    await job.progress(40);

    // Formatar número de telefone (remover caracteres especiais)
    const cleanTo = to.replace(/\D/g, '');
    let formattedTo = cleanTo;

    // Adicionar código do país se não estiver presente
    if (cleanTo.length === 11 && cleanTo.startsWith('0')) {
      formattedTo = '+55' + cleanTo.substring(1);
    } else if (cleanTo.length === 11) {
      formattedTo = '+55' + cleanTo;
    } else if (cleanTo.length === 10) {
      formattedTo = '+55' + cleanTo;
    } else if (!cleanTo.startsWith('55')) {
      formattedTo = '+55' + cleanTo;
    } else if (!cleanTo.startsWith('+')) {
      formattedTo = '+' + cleanTo;
    }

    await job.progress(60);

    const messageOptions = {
      body: message,
      from: fromNumber,
      to: formattedTo
    };

    // Adicionar mídia se fornecida
    if (mediaUrl) {
      messageOptions.mediaUrl = Array.isArray(mediaUrl) ? mediaUrl : [mediaUrl];
    }

    // Enviar SMS
    const smsResponse = await client.messages.create(messageOptions);

    await job.progress(80);

    // Registrar envio no banco de dados
    const communicationRecord = await prisma.communication.create({
      data: {
        leadId: leadId || null,
        type: 'SMS',
        direction: 'OUTBOUND',
        content: JSON.stringify({
          to: formattedTo,
          message,
          mediaUrl
        }),
        status: 'SENT',
        externalId: smsResponse.sid,
        sentAt: new Date(),
        metadata: JSON.stringify({
          status: smsResponse.status,
          direction: smsResponse.direction,
          price: smsResponse.price,
          priceUnit: smsResponse.priceUnit
        })
      }
    });

    await job.progress(95);

    logger.info('SMS enviado com sucesso', {
      to: formattedTo,
      message: message.substring(0, 50),
      sid: smsResponse.sid,
      communicationId: communicationRecord.id
    });

    return {
      success: true,
      sid: smsResponse.sid,
      communicationId: communicationRecord.id,
      status: smsResponse.status,
      to: formattedTo
    };

  } catch (error) {
    // Registrar falha no banco de dados
    try {
      await prisma.communication.create({
        data: {
          leadId: leadId || null,
          type: 'SMS',
          direction: 'OUTBOUND',
          content: JSON.stringify({
            to,
            message,
            mediaUrl
          }),
          status: 'FAILED',
          errorMessage: error.message,
          sentAt: new Date()
        }
      });
    } catch (dbError) {
      logger.error('Erro ao registrar falha de SMS no DB', {
        error: dbError.message
      });
    }

    logger.error('Erro ao enviar SMS', {
      to,
      message: message?.substring(0, 50),
      error: error.message
    });
    throw error;
  }
}

/**
 * Enviar SMS usando template
 */
async function sendTemplateSms(job, data) {
  const { to, templateId, variables, leadId } = data;

  try {
    await job.progress(20);

    // Buscar template do banco de dados
    const template = await prisma.smsTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      throw new Error(`Template de SMS não encontrado: ${templateId}`);
    }

    await job.progress(40);

    // Processar variáveis no template
    let message = template.content;

    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{{${key}}}`;
        message = message.replace(new RegExp(placeholder, 'g'), value);
      }
    }

    await job.progress(60);

    // Buscar dados do lead se fornecido
    if (leadId && !variables?.lead) {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId }
      });

      if (lead) {
        // Substituir variáveis do lead
        const leadVars = {
          'lead.name': lead.name,
          'lead.phone': lead.phone,
          'lead.status': lead.status
        };

        for (const [key, value] of Object.entries(leadVars)) {
          const placeholder = `{{${key}}}`;
          message = message.replace(new RegExp(placeholder, 'g'), value || '');
        }
      }
    }

    await job.progress(80);

    // Enviar SMS processado
    const result = await sendSms(job, {
      to,
      message,
      leadId,
      templateId
    });

    return {
      ...result,
      templateId,
      templateName: template.name
    };

  } catch (error) {
    logger.error('Erro ao enviar SMS com template', {
      to,
      templateId,
      error: error.message
    });
    throw error;
  }
}

/**
 * Enviar SMS em lote
 */
async function sendBulkSms(job, data) {
  const { recipients, message, templateId, variables } = data;

  try {
    await job.progress(10);

    const results = [];
    const totalRecipients = recipients.length;

    for (let i = 0; i < totalRecipients; i++) {
      const recipient = recipients[i];

      try {
        let smsData;

        if (templateId) {
          // Usar template
          smsData = {
            to: recipient.phone,
            templateId,
            variables: {
              ...variables,
              ...recipient.variables
            },
            leadId: recipient.leadId
          };

          const result = await sendTemplateSms(job, smsData);
          results.push({
            phone: recipient.phone,
            success: result.success,
            sid: result.sid,
            communicationId: result.communicationId
          });

        } else {
          // Envio direto
          smsData = {
            to: recipient.phone,
            message,
            leadId: recipient.leadId
          };

          const result = await sendSms(job, smsData);
          results.push({
            phone: recipient.phone,
            success: result.success,
            sid: result.sid,
            communicationId: result.communicationId
          });
        }

        // Atualizar progresso
        const progress = Math.round(((i + 1) / totalRecipients) * 80) + 10;
        await job.progress(progress);

        // Delay entre envios para respeitar rate limits
        if (i < totalRecipients - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 segundo entre SMS
        }

      } catch (error) {
        logger.error('Erro ao enviar SMS em lote para destinatário', {
          phone: recipient.phone,
          error: error.message
        });

        results.push({
          phone: recipient.phone,
          success: false,
          error: error.message
        });
      }
    }

    await job.progress(100);

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    logger.info('Envio de SMS em lote concluído', {
      totalRecipients,
      successCount,
      failureCount
    });

    return {
      success: true,
      totalRecipients,
      successCount,
      failureCount,
      results
    };

  } catch (error) {
    logger.error('Erro ao enviar SMS em lote', {
      recipients: recipients?.length,
      error: error.message
    });
    throw error;
  }
}

/**
 * Enviar SMS de automação
 */
async function sendAutomationSms(job, data) {
  const { leadId, automationId, templateId, message, variables } = data;

  try {
    await job.progress(20);

    // Buscar dados do lead
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        tags: { include: { tag: true } }
      }
    });

    if (!lead) {
      throw new Error(`Lead não encontrado: ${leadId}`);
    }

    if (!lead.phone) {
      throw new Error(`Lead ${leadId} não possui telefone`);
    }

    await job.progress(40);

    // Preparar variáveis do lead
    const leadVariables = {
      'lead.name': lead.name,
      'lead.phone': lead.phone,
      'lead.status': lead.status,
      'lead.tags': lead.tags.map(t => t.tag.name).join(', '),
      ...variables
    };

    await job.progress(60);

    let result;

    if (templateId) {
      // Usar template
      result = await sendTemplateSms(job, {
        to: lead.phone,
        templateId,
        variables: leadVariables,
        leadId: leadId
      });
    } else {
      // Processar message com variáveis
      let processedMessage = message;

      for (const [key, value] of Object.entries(leadVariables)) {
        const placeholder = `{{${key}}}`;
        if (processedMessage) {
          processedMessage = processedMessage.replace(new RegExp(placeholder, 'g'), value || '');
        }
      }

      result = await sendSms(job, {
        to: lead.phone,
        message: processedMessage,
        leadId: leadId
      });
    }

    await job.progress(90);

    // Registrar ação de automação se fornecida
    if (automationId) {
      await prisma.automationExecution.updateMany({
        where: {
          automationId,
          leadId,
          status: 'RUNNING'
        },
        data: {
          result: JSON.stringify({
            smsSent: result.success,
            sid: result.sid,
            communicationId: result.communicationId
          })
        }
      });
    }

    return {
      ...result,
      leadId,
      automationId,
      leadPhone: lead.phone
    };

  } catch (error) {
    logger.error('Erro ao enviar SMS de automação', {
      leadId,
      automationId,
      error: error.message
    });
    throw error;
  }
}

module.exports = smsWorker;