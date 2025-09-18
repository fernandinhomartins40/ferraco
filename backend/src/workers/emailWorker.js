const nodemailer = require('nodemailer');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

// Configuração do transportador de email
let transporter = null;

function createEmailTransporter() {
  if (transporter) return transporter;

  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true para 465, false para outras portas
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false
    }
  };

  transporter = nodemailer.createTransporter(config);

  logger.info('Transportador de email configurado', {
    host: config.host,
    port: config.port,
    secure: config.secure
  });

  return transporter;
}

/**
 * Worker para processar jobs de email
 */
async function emailWorker(job) {
  const { data } = job;
  const { type } = data;

  try {
    logger.info('Iniciando processamento de job de email', {
      jobId: job.id,
      type,
      to: data.to,
      subject: data.subject?.substring(0, 50)
    });

    // Atualizar progresso inicial
    await job.progress(10);

    let result;

    switch (type) {
      case 'send_email':
        result = await sendEmail(job, data);
        break;

      case 'send_template_email':
        result = await sendTemplateEmail(job, data);
        break;

      case 'send_bulk_email':
        result = await sendBulkEmail(job, data);
        break;

      case 'send_automation_email':
        result = await sendAutomationEmail(job, data);
        break;

      default:
        throw new Error(`Tipo de job de email desconhecido: ${type}`);
    }

    // Progresso final
    await job.progress(100);

    logger.info('Job de email processado com sucesso', {
      jobId: job.id,
      type,
      success: result?.success || false
    });

    return result;

  } catch (error) {
    logger.error('Erro ao processar job de email', {
      jobId: job.id,
      type,
      error: error.message,
      stack: error.stack
    });

    throw error;
  }
}

/**
 * Enviar email simples
 */
async function sendEmail(job, data) {
  const { to, subject, html, text, attachments, leadId, priority } = data;

  try {
    await job.progress(20);

    const transporter = createEmailTransporter();

    // Verificar configuração
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      throw new Error('Configuração SMTP não encontrada nas variáveis de ambiente');
    }

    await job.progress(40);

    const mailOptions = {
      from: `${process.env.SMTP_FROM_NAME || 'Ferraco CRM'} <${process.env.SMTP_USER}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html: html || undefined,
      text: text || undefined,
      attachments: attachments || undefined
    };

    await job.progress(60);

    // Enviar email
    const info = await transporter.sendMail(mailOptions);

    await job.progress(80);

    // Registrar envio no banco de dados
    const communicationRecord = await prisma.communication.create({
      data: {
        leadId: leadId || null,
        type: 'EMAIL',
        direction: 'OUTBOUND',
        content: JSON.stringify({
          to: mailOptions.to,
          subject,
          html: html?.substring(0, 1000), // Truncar para não sobrecarregar o DB
          text: text?.substring(0, 1000)
        }),
        status: 'SENT',
        externalId: info.messageId,
        sentAt: new Date(),
        metadata: JSON.stringify({
          accepted: info.accepted,
          rejected: info.rejected,
          response: info.response
        })
      }
    });

    await job.progress(95);

    logger.info('Email enviado com sucesso', {
      to: mailOptions.to,
      subject,
      messageId: info.messageId,
      communicationId: communicationRecord.id
    });

    return {
      success: true,
      messageId: info.messageId,
      communicationId: communicationRecord.id,
      accepted: info.accepted,
      rejected: info.rejected
    };

  } catch (error) {
    // Registrar falha no banco de dados
    try {
      await prisma.communication.create({
        data: {
          leadId: leadId || null,
          type: 'EMAIL',
          direction: 'OUTBOUND',
          content: JSON.stringify({
            to,
            subject,
            html: html?.substring(0, 1000),
            text: text?.substring(0, 1000)
          }),
          status: 'FAILED',
          errorMessage: error.message,
          sentAt: new Date()
        }
      });
    } catch (dbError) {
      logger.error('Erro ao registrar falha de email no DB', {
        error: dbError.message
      });
    }

    logger.error('Erro ao enviar email', {
      to,
      subject,
      error: error.message
    });
    throw error;
  }
}

/**
 * Enviar email usando template
 */
async function sendTemplateEmail(job, data) {
  const { to, templateId, variables, leadId } = data;

  try {
    await job.progress(20);

    // Buscar template do banco de dados
    const template = await prisma.emailTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      throw new Error(`Template de email não encontrado: ${templateId}`);
    }

    await job.progress(40);

    // Processar variáveis no template
    let subject = template.subject;
    let html = template.htmlContent;
    let text = template.textContent;

    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{{${key}}}`;
        subject = subject.replace(new RegExp(placeholder, 'g'), value);
        html = html.replace(new RegExp(placeholder, 'g'), value);
        if (text) {
          text = text.replace(new RegExp(placeholder, 'g'), value);
        }
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
          'lead.email': lead.email,
          'lead.phone': lead.phone,
          'lead.status': lead.status
        };

        for (const [key, value] of Object.entries(leadVars)) {
          const placeholder = `{{${key}}}`;
          subject = subject.replace(new RegExp(placeholder, 'g'), value || '');
          html = html.replace(new RegExp(placeholder, 'g'), value || '');
          if (text) {
            text = text.replace(new RegExp(placeholder, 'g'), value || '');
          }
        }
      }
    }

    await job.progress(80);

    // Enviar email processado
    const result = await sendEmail(job, {
      to,
      subject,
      html,
      text,
      leadId,
      templateId
    });

    return {
      ...result,
      templateId,
      templateName: template.name
    };

  } catch (error) {
    logger.error('Erro ao enviar email com template', {
      to,
      templateId,
      error: error.message
    });
    throw error;
  }
}

/**
 * Enviar emails em lote
 */
async function sendBulkEmail(job, data) {
  const { recipients, subject, html, text, templateId, variables } = data;

  try {
    await job.progress(10);

    const results = [];
    const totalRecipients = recipients.length;

    for (let i = 0; i < totalRecipients; i++) {
      const recipient = recipients[i];

      try {
        let emailData;

        if (templateId) {
          // Usar template
          emailData = {
            to: recipient.email,
            templateId,
            variables: {
              ...variables,
              ...recipient.variables
            },
            leadId: recipient.leadId
          };

          const result = await sendTemplateEmail(job, emailData);
          results.push({
            email: recipient.email,
            success: result.success,
            messageId: result.messageId,
            communicationId: result.communicationId
          });

        } else {
          // Envio direto
          emailData = {
            to: recipient.email,
            subject,
            html,
            text,
            leadId: recipient.leadId
          };

          const result = await sendEmail(job, emailData);
          results.push({
            email: recipient.email,
            success: result.success,
            messageId: result.messageId,
            communicationId: result.communicationId
          });
        }

        // Atualizar progresso
        const progress = Math.round(((i + 1) / totalRecipients) * 80) + 10;
        await job.progress(progress);

        // Delay entre envios para evitar rate limiting
        if (i < totalRecipients - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (error) {
        logger.error('Erro ao enviar email em lote para destinatário', {
          email: recipient.email,
          error: error.message
        });

        results.push({
          email: recipient.email,
          success: false,
          error: error.message
        });
      }
    }

    await job.progress(100);

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    logger.info('Envio em lote concluído', {
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
    logger.error('Erro ao enviar emails em lote', {
      recipients: recipients?.length,
      error: error.message
    });
    throw error;
  }
}

/**
 * Enviar email de automação
 */
async function sendAutomationEmail(job, data) {
  const { leadId, automationId, templateId, subject, html, text, variables } = data;

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

    if (!lead.email) {
      throw new Error(`Lead ${leadId} não possui email`);
    }

    await job.progress(40);

    // Preparar variáveis do lead
    const leadVariables = {
      'lead.name': lead.name,
      'lead.email': lead.email,
      'lead.phone': lead.phone,
      'lead.status': lead.status,
      'lead.tags': lead.tags.map(t => t.tag.name).join(', '),
      ...variables
    };

    await job.progress(60);

    let result;

    if (templateId) {
      // Usar template
      result = await sendTemplateEmail(job, {
        to: lead.email,
        templateId,
        variables: leadVariables,
        leadId: leadId
      });
    } else {
      // Processar subject e content com variáveis
      let processedSubject = subject;
      let processedHtml = html;
      let processedText = text;

      for (const [key, value] of Object.entries(leadVariables)) {
        const placeholder = `{{${key}}}`;
        if (processedSubject) {
          processedSubject = processedSubject.replace(new RegExp(placeholder, 'g'), value || '');
        }
        if (processedHtml) {
          processedHtml = processedHtml.replace(new RegExp(placeholder, 'g'), value || '');
        }
        if (processedText) {
          processedText = processedText.replace(new RegExp(placeholder, 'g'), value || '');
        }
      }

      result = await sendEmail(job, {
        to: lead.email,
        subject: processedSubject,
        html: processedHtml,
        text: processedText,
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
            emailSent: result.success,
            messageId: result.messageId,
            communicationId: result.communicationId
          })
        }
      });
    }

    return {
      ...result,
      leadId,
      automationId,
      leadEmail: lead.email
    };

  } catch (error) {
    logger.error('Erro ao enviar email de automação', {
      leadId,
      automationId,
      error: error.message
    });
    throw error;
  }
}

module.exports = emailWorker;