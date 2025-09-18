const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Worker para processar jobs de webhook
 */
async function webhookWorker(job) {
  const { data } = job;
  const { type } = data;

  try {
    logger.info('Iniciando processamento de job de webhook', {
      jobId: job.id,
      type,
      url: data.url,
      method: data.method
    });

    await job.progress(10);

    let result;

    switch (type) {
      case 'send_webhook':
        result = await sendWebhook(job, data);
        break;

      default:
        throw new Error(`Tipo de job de webhook desconhecido: ${type}`);
    }

    await job.progress(100);

    logger.info('Job de webhook processado com sucesso', {
      jobId: job.id,
      type,
      success: result?.success || false
    });

    return result;

  } catch (error) {
    logger.error('Erro ao processar job de webhook', {
      jobId: job.id,
      type,
      error: error.message
    });
    throw error;
  }
}

async function sendWebhook(job, data) {
  const { url, method = 'POST', headers = {}, payload, leadId, automationId } = data;

  try {
    await job.progress(30);

    const config = {
      method: method.toLowerCase(),
      url,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Ferraco-CRM/1.0',
        ...headers
      },
      timeout: 30000, // 30 segundos
      validateStatus: (status) => status < 500 // Considerar 4xx como sucesso parcial
    };

    if (payload && (method.toLowerCase() === 'post' || method.toLowerCase() === 'put')) {
      config.data = payload;
    }

    await job.progress(60);

    const response = await axios(config);

    await job.progress(80);

    // Registrar webhook no banco de dados
    const webhookRecord = await prisma.webhookLog.create({
      data: {
        leadId: leadId || null,
        automationId: automationId || null,
        url,
        method: method.toUpperCase(),
        headers: JSON.stringify(headers),
        payload: JSON.stringify(payload),
        responseStatus: response.status,
        responseHeaders: JSON.stringify(response.headers),
        responseBody: JSON.stringify(response.data),
        sentAt: new Date(),
        success: response.status < 400
      }
    });

    await job.progress(95);

    logger.info('Webhook enviado com sucesso', {
      url,
      method,
      status: response.status,
      webhookId: webhookRecord.id
    });

    return {
      success: response.status < 400,
      status: response.status,
      response: response.data,
      webhookId: webhookRecord.id
    };

  } catch (error) {
    // Registrar falha no banco de dados
    try {
      await prisma.webhookLog.create({
        data: {
          leadId: leadId || null,
          automationId: automationId || null,
          url,
          method: method.toUpperCase(),
          headers: JSON.stringify(headers),
          payload: JSON.stringify(payload),
          responseStatus: error.response?.status || 0,
          responseHeaders: JSON.stringify(error.response?.headers || {}),
          responseBody: JSON.stringify(error.response?.data || error.message),
          sentAt: new Date(),
          success: false,
          errorMessage: error.message
        }
      });
    } catch (dbError) {
      logger.error('Erro ao registrar falha de webhook no DB', {
        error: dbError.message
      });
    }

    logger.error('Erro ao enviar webhook', {
      url,
      method,
      error: error.message,
      status: error.response?.status
    });
    throw error;
  }
}

module.exports = webhookWorker;