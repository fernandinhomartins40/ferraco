const { PrismaClient } = require('@prisma/client');
const queueService = require('./queueService');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class EmailService {
  constructor() {
    this.isInitialized = false;
  }

  // Inicializar serviço de email
  async initialize() {
    if (this.isInitialized) {
      logger.warn('EmailService já foi inicializado');
      return;
    }

    try {
      // Verificar configurações SMTP obrigatórias
      const requiredEnvVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD'];
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

      if (missingVars.length > 0) {
        logger.warn('Configurações SMTP incompletas, emails serão simulados', {
          missingVars
        });
      } else {
        logger.info('Configurações SMTP encontradas');
      }

      // Criar templates padrão se não existirem
      await this.createDefaultTemplates();

      this.isInitialized = true;
      logger.info('EmailService inicializado com sucesso');

    } catch (error) {
      logger.error('Erro ao inicializar EmailService', {
        error: error.message
      });
      throw error;
    }
  }

  // Criar templates padrão
  async createDefaultTemplates() {
    try {
      const defaultTemplates = [
        {
          name: 'lead_welcome',
          subject: 'Bem-vindo, {{lead.name}}!',
          htmlContent: `
            <h2>Olá, {{lead.name}}!</h2>
            <p>Obrigado por entrar em contato conosco. Recebemos suas informações e nossa equipe entrará em contato em breve.</p>
            <p><strong>Dados do seu contato:</strong></p>
            <ul>
              <li>Nome: {{lead.name}}</li>
              <li>Email: {{lead.email}}</li>
              <li>Telefone: {{lead.phone}}</li>
            </ul>
            <p>Atenciosamente,<br>Equipe Ferraco</p>
          `,
          textContent: `
            Olá, {{lead.name}}!

            Obrigado por entrar em contato conosco. Recebemos suas informações e nossa equipe entrará em contato em breve.

            Dados do seu contato:
            - Nome: {{lead.name}}
            - Email: {{lead.email}}
            - Telefone: {{lead.phone}}

            Atenciosamente,
            Equipe Ferraco
          `,
          category: 'AUTOMATION',
          isActive: true,
          variables: ['lead.name', 'lead.email', 'lead.phone']
        },
        {
          name: 'follow_up_reminder',
          subject: 'Não esqueça de nós, {{lead.name}}!',
          htmlContent: `
            <h2>Olá, {{lead.name}}!</h2>
            <p>Notamos que você demonstrou interesse em nossos serviços há alguns dias.</p>
            <p>Gostaríamos de saber se ainda tem interesse ou se podemos ajudá-lo de alguma forma.</p>
            <p>Entre em contato conosco:</p>
            <ul>
              <li>Telefone: {{company.phone}}</li>
              <li>Email: {{company.email}}</li>
              <li>WhatsApp: {{company.whatsapp}}</li>
            </ul>
            <p>Atenciosamente,<br>Equipe Ferraco</p>
          `,
          textContent: `
            Olá, {{lead.name}}!

            Notamos que você demonstrou interesse em nossos serviços há alguns dias.

            Gostaríamos de saber se ainda tem interesse ou se podemos ajudá-lo de alguma forma.

            Entre em contato conosco:
            - Telefone: {{company.phone}}
            - Email: {{company.email}}
            - WhatsApp: {{company.whatsapp}}

            Atenciosamente,
            Equipe Ferraco
          `,
          category: 'AUTOMATION',
          isActive: true,
          variables: ['lead.name', 'company.phone', 'company.email', 'company.whatsapp']
        },
        {
          name: 'lead_converted',
          subject: 'Parabéns, {{lead.name}}! Sua solicitação foi aprovada',
          htmlContent: `
            <h2>Parabéns, {{lead.name}}!</h2>
            <p>É com grande satisfação que informamos que sua solicitação foi aprovada!</p>
            <p>Nossa equipe entrará em contato em breve para dar continuidade ao processo.</p>
            <p><strong>Próximos passos:</strong></p>
            <ol>
              <li>Nossa equipe técnica entrará em contato</li>
              <li>Agendaremos uma visita técnica (se necessário)</li>
              <li>Enviaremos a proposta detalhada</li>
            </ol>
            <p>Obrigado por escolher a Ferraco!</p>
            <p>Atenciosamente,<br>Equipe Ferraco</p>
          `,
          textContent: `
            Parabéns, {{lead.name}}!

            É com grande satisfação que informamos que sua solicitação foi aprovada!

            Nossa equipe entrará em contato em breve para dar continuidade ao processo.

            Próximos passos:
            1. Nossa equipe técnica entrará em contato
            2. Agendaremos uma visita técnica (se necessário)
            3. Enviaremos a proposta detalhada

            Obrigado por escolher a Ferraco!

            Atenciosamente,
            Equipe Ferraco
          `,
          category: 'CONVERSION',
          isActive: true,
          variables: ['lead.name']
        }
      ];

      for (const template of defaultTemplates) {
        const existingTemplate = await prisma.emailTemplate.findUnique({
          where: { name: template.name }
        });

        if (!existingTemplate) {
          await prisma.emailTemplate.create({
            data: template
          });
          logger.info('Template de email padrão criado', {
            name: template.name,
            category: template.category
          });
        }
      }

    } catch (error) {
      logger.error('Erro ao criar templates padrão', {
        error: error.message
      });
    }
  }

  // Enviar email simples
  async sendEmail(data) {
    try {
      const { to, subject, html, text, leadId, priority = 5 } = data;

      if (!to || !subject || (!html && !text)) {
        throw new Error('Parâmetros obrigatórios: to, subject e (html ou text)');
      }

      // Adicionar à fila de processamento
      const job = await queueService.addEmailJob({
        type: 'send_email',
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
        leadId,
        priority
      }, {
        priority,
        attempts: 5
      });

      logger.info('Email adicionado à fila', {
        jobId: job.id,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        leadId
      });

      return {
        success: true,
        jobId: job.id,
        message: 'Email adicionado à fila de processamento'
      };

    } catch (error) {
      logger.error('Erro ao enviar email', {
        error: error.message,
        data
      });
      throw error;
    }
  }

  // Enviar email usando template
  async sendTemplateEmail(data) {
    try {
      const { to, templateId, templateName, variables = {}, leadId, priority = 5 } = data;

      if (!to || (!templateId && !templateName)) {
        throw new Error('Parâmetros obrigatórios: to e (templateId ou templateName)');
      }

      // Buscar template
      let template;
      if (templateId) {
        template = await prisma.emailTemplate.findUnique({
          where: { id: templateId }
        });
      } else {
        template = await prisma.emailTemplate.findUnique({
          where: { name: templateName }
        });
      }

      if (!template) {
        throw new Error(`Template não encontrado: ${templateId || templateName}`);
      }

      if (!template.isActive) {
        throw new Error(`Template está inativo: ${template.name}`);
      }

      // Adicionar à fila de processamento
      const job = await queueService.addEmailJob({
        type: 'send_template_email',
        to: Array.isArray(to) ? to : [to],
        templateId: template.id,
        variables,
        leadId,
        priority
      }, {
        priority,
        attempts: 5
      });

      logger.info('Email com template adicionado à fila', {
        jobId: job.id,
        to: Array.isArray(to) ? to.join(', ') : to,
        templateName: template.name,
        leadId
      });

      return {
        success: true,
        jobId: job.id,
        templateName: template.name,
        message: 'Email com template adicionado à fila de processamento'
      };

    } catch (error) {
      logger.error('Erro ao enviar email com template', {
        error: error.message,
        data
      });
      throw error;
    }
  }

  // Enviar emails em lote
  async sendBulkEmail(data) {
    try {
      const { recipients, subject, html, text, templateId, templateName, variables = {}, priority = 3 } = data;

      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        throw new Error('Lista de destinatários é obrigatória');
      }

      if (!templateId && !templateName && (!subject || (!html && !text))) {
        throw new Error('Template ou (subject + html/text) são obrigatórios');
      }

      // Validar destinatários
      const validRecipients = recipients.filter(recipient => {
        if (typeof recipient === 'string') {
          return recipient.includes('@');
        }
        return recipient.email && recipient.email.includes('@');
      });

      if (validRecipients.length === 0) {
        throw new Error('Nenhum destinatário válido encontrado');
      }

      // Preparar dados do job
      const jobData = {
        type: 'send_bulk_email',
        recipients: validRecipients.map(recipient => {
          if (typeof recipient === 'string') {
            return { email: recipient };
          }
          return recipient;
        }),
        priority
      };

      if (templateId || templateName) {
        jobData.templateId = templateId;
        jobData.templateName = templateName;
        jobData.variables = variables;
      } else {
        jobData.subject = subject;
        jobData.html = html;
        jobData.text = text;
      }

      // Adicionar à fila de processamento
      const job = await queueService.addEmailJob(jobData, {
        priority,
        attempts: 3,
        timeout: 300000 // 5 minutos timeout para bulk
      });

      logger.info('Email em lote adicionado à fila', {
        jobId: job.id,
        recipientsCount: validRecipients.length,
        templateId: templateId || templateName,
        subject
      });

      return {
        success: true,
        jobId: job.id,
        recipientsCount: validRecipients.length,
        message: 'Email em lote adicionado à fila de processamento'
      };

    } catch (error) {
      logger.error('Erro ao enviar email em lote', {
        error: error.message,
        data
      });
      throw error;
    }
  }

  // Criar novo template
  async createTemplate(data) {
    try {
      const {
        name,
        subject,
        htmlContent,
        textContent,
        category = 'GENERAL',
        variables = [],
        isActive = true
      } = data;

      if (!name || !subject || !htmlContent) {
        throw new Error('Parâmetros obrigatórios: name, subject, htmlContent');
      }

      // Verificar se nome já existe
      const existingTemplate = await prisma.emailTemplate.findUnique({
        where: { name }
      });

      if (existingTemplate) {
        throw new Error(`Template com nome '${name}' já existe`);
      }

      // Extrair variáveis do conteúdo automaticamente
      const autoVariables = this.extractVariablesFromContent(htmlContent, textContent);
      const allVariables = Array.from(new Set([...variables, ...autoVariables]));

      const template = await prisma.emailTemplate.create({
        data: {
          name,
          subject,
          htmlContent,
          textContent,
          category: category.toUpperCase(),
          variables: allVariables,
          isActive
        }
      });

      logger.info('Template de email criado', {
        templateId: template.id,
        name: template.name,
        category: template.category,
        variablesCount: allVariables.length
      });

      return template;

    } catch (error) {
      logger.error('Erro ao criar template', {
        error: error.message,
        data
      });
      throw error;
    }
  }

  // Extrair variáveis do conteúdo do template
  extractVariablesFromContent(htmlContent, textContent = '') {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables = new Set();

    // Extrair do HTML
    let match;
    while ((match = variableRegex.exec(htmlContent)) !== null) {
      variables.add(match[1].trim());
    }

    // Extrair do texto
    if (textContent) {
      variableRegex.lastIndex = 0; // Reset regex
      while ((match = variableRegex.exec(textContent)) !== null) {
        variables.add(match[1].trim());
      }
    }

    return Array.from(variables);
  }

  // Buscar todos os templates
  async getAllTemplates(filters = {}) {
    try {
      const {
        category,
        isActive,
        search,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const where = {};

      // Aplicar filtros
      if (category) where.category = category.toUpperCase();
      if (isActive !== undefined) where.isActive = isActive === 'true';

      if (search) {
        where.OR = [
          { name: { contains: search } },
          { subject: { contains: search } }
        ];
      }

      const [templates, total] = await Promise.all([
        prisma.emailTemplate.findMany({
          where,
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: parseInt(limit)
        }),
        prisma.emailTemplate.count({ where })
      ]);

      const totalPages = Math.ceil(total / parseInt(limit));

      logger.info('Templates de email recuperados', {
        total,
        page: parseInt(page),
        totalPages,
        filters
      });

      return {
        templates,
        pagination: {
          total,
          page: parseInt(page),
          totalPages,
          limit: parseInt(limit)
        }
      };

    } catch (error) {
      logger.error('Erro ao buscar templates', {
        error: error.message,
        filters
      });
      throw error;
    }
  }

  // Buscar template por ID
  async getTemplateById(id) {
    try {
      const template = await prisma.emailTemplate.findUnique({
        where: { id }
      });

      if (!template) {
        return null;
      }

      logger.info('Template recuperado', {
        templateId: template.id,
        name: template.name
      });

      return template;

    } catch (error) {
      logger.error('Erro ao buscar template por ID', {
        error: error.message,
        templateId: id
      });
      throw error;
    }
  }

  // Atualizar template
  async updateTemplate(id, data) {
    try {
      // Verificar se template existe
      const existingTemplate = await prisma.emailTemplate.findUnique({
        where: { id }
      });

      if (!existingTemplate) {
        return null;
      }

      const updateData = {};

      // Apenas atualizar campos fornecidos
      if (data.name !== undefined) {
        // Verificar se novo nome já existe (apenas se mudou)
        if (data.name !== existingTemplate.name) {
          const nameExists = await prisma.emailTemplate.findUnique({
            where: { name: data.name }
          });
          if (nameExists) {
            throw new Error(`Template com nome '${data.name}' já existe`);
          }
        }
        updateData.name = data.name;
      }

      if (data.subject !== undefined) updateData.subject = data.subject;
      if (data.htmlContent !== undefined) updateData.htmlContent = data.htmlContent;
      if (data.textContent !== undefined) updateData.textContent = data.textContent;
      if (data.category !== undefined) updateData.category = data.category.toUpperCase();
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      // Extrair variáveis automaticamente se o conteúdo mudou
      if (data.htmlContent !== undefined || data.textContent !== undefined) {
        const autoVariables = this.extractVariablesFromContent(
          data.htmlContent || existingTemplate.htmlContent,
          data.textContent || existingTemplate.textContent
        );
        const customVariables = data.variables || existingTemplate.variables || [];
        updateData.variables = Array.from(new Set([...customVariables, ...autoVariables]));
      } else if (data.variables !== undefined) {
        updateData.variables = data.variables;
      }

      const template = await prisma.emailTemplate.update({
        where: { id },
        data: updateData
      });

      logger.info('Template atualizado', {
        templateId: template.id,
        name: template.name,
        updatedFields: Object.keys(updateData)
      });

      return template;

    } catch (error) {
      logger.error('Erro ao atualizar template', {
        error: error.message,
        templateId: id,
        data
      });
      throw error;
    }
  }

  // Deletar template
  async deleteTemplate(id) {
    try {
      // Verificar se template existe
      const existingTemplate = await prisma.emailTemplate.findUnique({
        where: { id }
      });

      if (!existingTemplate) {
        return null;
      }

      // Verificar se template está sendo usado em automações
      const automationUsage = await prisma.automation.count({
        where: {
          actions: {
            contains: `"templateId":"${id}"`
          }
        }
      });

      if (automationUsage > 0) {
        throw new Error(`Template está sendo usado em ${automationUsage} automação(ões)`);
      }

      await prisma.emailTemplate.delete({
        where: { id }
      });

      logger.info('Template deletado', {
        templateId: id,
        name: existingTemplate.name
      });

      return true;

    } catch (error) {
      logger.error('Erro ao deletar template', {
        error: error.message,
        templateId: id
      });
      throw error;
    }
  }

  // Preview de template com variáveis
  async previewTemplate(templateId, variables = {}) {
    try {
      const template = await this.getTemplateById(templateId);

      if (!template) {
        throw new Error('Template não encontrado');
      }

      // Processar variáveis
      let subject = template.subject;
      let htmlContent = template.htmlContent;
      let textContent = template.textContent;

      for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{{${key}}}`;
        const replacement = value || `[${key}]`;

        subject = subject.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
        htmlContent = htmlContent.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
        if (textContent) {
          textContent = textContent.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
        }
      }

      return {
        template: {
          id: template.id,
          name: template.name,
          category: template.category
        },
        preview: {
          subject,
          htmlContent,
          textContent
        },
        variables: template.variables,
        appliedVariables: variables
      };

    } catch (error) {
      logger.error('Erro ao gerar preview do template', {
        error: error.message,
        templateId,
        variables
      });
      throw error;
    }
  }

  // Estatísticas de email
  async getEmailStats(filters = {}) {
    try {
      const { dateFrom, dateTo } = filters;

      const whereClause = {};
      if (dateFrom) whereClause.sentAt = { gte: new Date(dateFrom) };
      if (dateTo) {
        whereClause.sentAt = whereClause.sentAt || {};
        whereClause.sentAt.lte = new Date(dateTo);
      }

      const [
        totalSent,
        totalFailed,
        byType,
        byStatus,
        templates
      ] = await Promise.all([
        prisma.communication.count({
          where: {
            type: 'EMAIL',
            status: 'SENT',
            ...whereClause
          }
        }),
        prisma.communication.count({
          where: {
            type: 'EMAIL',
            status: 'FAILED',
            ...whereClause
          }
        }),
        prisma.communication.groupBy({
          by: ['direction'],
          _count: { id: true },
          where: {
            type: 'EMAIL',
            ...whereClause
          }
        }),
        prisma.communication.groupBy({
          by: ['status'],
          _count: { id: true },
          where: {
            type: 'EMAIL',
            ...whereClause
          }
        }),
        prisma.emailTemplate.count({
          where: { isActive: true }
        })
      ]);

      const stats = {
        totals: {
          sent: totalSent,
          failed: totalFailed,
          total: totalSent + totalFailed,
          successRate: totalSent + totalFailed > 0 ?
            Math.round((totalSent / (totalSent + totalFailed)) * 100) : 0
        },
        byDirection: byType.reduce((acc, item) => {
          acc[item.direction.toLowerCase()] = item._count.id;
          return acc;
        }, {}),
        byStatus: byStatus.reduce((acc, item) => {
          acc[item.status.toLowerCase()] = item._count.id;
          return acc;
        }, {}),
        templates: {
          active: templates
        }
      };

      logger.info('Estatísticas de email calculadas', {
        totalSent,
        totalFailed,
        successRate: stats.totals.successRate
      });

      return stats;

    } catch (error) {
      logger.error('Erro ao calcular estatísticas de email', {
        error: error.message,
        filters
      });
      throw error;
    }
  }
}

// Exportar instância singleton
const emailService = new EmailService();

module.exports = emailService;