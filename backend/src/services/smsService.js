const { PrismaClient } = require('@prisma/client');
const queueService = require('./queueService');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class SmsService {
  constructor() {
    this.isInitialized = false;
    this.twilioConfig = {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER
    };
  }

  // Inicializar serviço SMS
  async initialize() {
    if (this.isInitialized) {
      logger.warn('SmsService já foi inicializado');
      return;
    }

    try {
      // Verificar configurações obrigatórias
      const requiredEnvVars = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'];
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

      if (missingVars.length > 0) {
        logger.warn('Configurações Twilio incompletas, SMS serão simulados', {
          missingVars
        });
      } else {
        logger.info('Configurações Twilio encontradas');
      }

      // Criar templates padrão se não existirem
      await this.createDefaultTemplates();

      this.isInitialized = true;
      logger.info('SmsService inicializado com sucesso');

    } catch (error) {
      logger.error('Erro ao inicializar SmsService', {
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
          name: 'lead_welcome_sms',
          content: `Olá {{lead.name}}! Obrigado por entrar em contato. Nossa equipe entrará em contato em breve. Ferraco - (11) 99999-9999`,
          category: 'AUTOMATION',
          isActive: true,
          variables: ['lead.name']
        },
        {
          name: 'follow_up_sms',
          content: `Oi {{lead.name}}! Ainda tem interesse em nossos serviços? Entre em contato: {{company.phone}}. Ferraco`,
          category: 'AUTOMATION',
          isActive: true,
          variables: ['lead.name', 'company.phone']
        },
        {
          name: 'lead_converted_sms',
          content: `Parabéns {{lead.name}}! Sua solicitação foi aprovada. Nossa equipe entrará em contato em breve. Ferraco`,
          category: 'CONVERSION',
          isActive: true,
          variables: ['lead.name']
        },
        {
          name: 'appointment_reminder_sms',
          content: `Lembrete: Você tem um agendamento amanhã às {{appointment.time}}. Local: {{appointment.address}}. Ferraco`,
          category: 'NOTIFICATION',
          isActive: true,
          variables: ['appointment.time', 'appointment.address']
        }
      ];

      for (const template of defaultTemplates) {
        const existingTemplate = await prisma.smsTemplate.findUnique({
          where: { name: template.name }
        });

        if (!existingTemplate) {
          await prisma.smsTemplate.create({
            data: template
          });
          logger.info('Template SMS padrão criado', {
            name: template.name,
            category: template.category
          });
        }
      }

    } catch (error) {
      logger.error('Erro ao criar templates SMS padrão', {
        error: error.message
      });
    }
  }

  // Enviar SMS simples
  async sendSms(data) {
    try {
      const { to, message, leadId, priority = 5 } = data;

      if (!to || !message) {
        throw new Error('Parâmetros obrigatórios: to, message');
      }

      // Validar formato da mensagem
      if (message.length > 1600) {
        throw new Error('Mensagem SMS muito longa. Máximo 1600 caracteres.');
      }

      // Limpar número de telefone
      const cleanPhone = this.cleanPhoneNumber(to);

      // Adicionar à fila de processamento
      const job = await queueService.addSmsJob({
        type: 'send_sms',
        to: cleanPhone,
        message,
        leadId,
        priority
      }, {
        priority,
        attempts: 3
      });

      logger.info('SMS adicionado à fila', {
        jobId: job.id,
        to: cleanPhone,
        message: message.substring(0, 50),
        leadId
      });

      return {
        success: true,
        jobId: job.id,
        message: 'SMS adicionado à fila de processamento',
        phone: cleanPhone
      };

    } catch (error) {
      logger.error('Erro ao enviar SMS', {
        error: error.message,
        data
      });
      throw error;
    }
  }

  // Enviar SMS usando template
  async sendTemplateSms(data) {
    try {
      const { to, templateId, templateName, variables = {}, leadId, priority = 5 } = data;

      if (!to || (!templateId && !templateName)) {
        throw new Error('Parâmetros obrigatórios: to e (templateId ou templateName)');
      }

      // Buscar template
      let template;
      if (templateId) {
        template = await prisma.smsTemplate.findUnique({
          where: { id: templateId }
        });
      } else {
        template = await prisma.smsTemplate.findUnique({
          where: { name: templateName }
        });
      }

      if (!template) {
        throw new Error(`Template SMS não encontrado: ${templateId || templateName}`);
      }

      if (!template.isActive) {
        throw new Error(`Template SMS está inativo: ${template.name}`);
      }

      // Limpar número de telefone
      const cleanPhone = this.cleanPhoneNumber(to);

      // Adicionar à fila de processamento
      const job = await queueService.addSmsJob({
        type: 'send_template_sms',
        to: cleanPhone,
        templateId: template.id,
        variables,
        leadId,
        priority
      }, {
        priority,
        attempts: 3
      });

      logger.info('SMS com template adicionado à fila', {
        jobId: job.id,
        to: cleanPhone,
        templateName: template.name,
        leadId
      });

      return {
        success: true,
        jobId: job.id,
        templateName: template.name,
        message: 'SMS com template adicionado à fila de processamento',
        phone: cleanPhone
      };

    } catch (error) {
      logger.error('Erro ao enviar SMS com template', {
        error: error.message,
        data
      });
      throw error;
    }
  }

  // Enviar SMS em lote
  async sendBulkSms(data) {
    try {
      const { recipients, message, templateId, templateName, variables = {}, priority = 3 } = data;

      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        throw new Error('Lista de destinatários é obrigatória');
      }

      if (!templateId && !templateName && !message) {
        throw new Error('Template ou mensagem são obrigatórios');
      }

      // Validar destinatários (máximo 100 por lote para evitar rate limits)
      if (recipients.length > 100) {
        throw new Error('Máximo 100 destinatários por lote');
      }

      const validRecipients = recipients.filter(recipient => {
        if (typeof recipient === 'string') {
          return /^\+?[\d\s\-\(\)]+$/.test(recipient);
        }
        return recipient.phone && /^\+?[\d\s\-\(\)]+$/.test(recipient.phone);
      });

      if (validRecipients.length === 0) {
        throw new Error('Nenhum destinatário válido encontrado');
      }

      // Preparar dados do job
      const jobData = {
        type: 'send_bulk_sms',
        recipients: validRecipients.map(recipient => {
          if (typeof recipient === 'string') {
            return { phone: this.cleanPhoneNumber(recipient) };
          }
          return {
            ...recipient,
            phone: this.cleanPhoneNumber(recipient.phone)
          };
        }),
        priority
      };

      if (templateId || templateName) {
        jobData.templateId = templateId;
        jobData.templateName = templateName;
        jobData.variables = variables;
      } else {
        jobData.message = message;
      }

      // Adicionar à fila de processamento
      const job = await queueService.addSmsJob(jobData, {
        priority,
        attempts: 2,
        timeout: 600000 // 10 minutos timeout para bulk
      });

      logger.info('SMS em lote adicionado à fila', {
        jobId: job.id,
        recipientsCount: validRecipients.length,
        templateId: templateId || templateName,
        message: message?.substring(0, 50)
      });

      return {
        success: true,
        jobId: job.id,
        recipientsCount: validRecipients.length,
        message: 'SMS em lote adicionado à fila de processamento'
      };

    } catch (error) {
      logger.error('Erro ao enviar SMS em lote', {
        error: error.message,
        data
      });
      throw error;
    }
  }

  // Limpar número de telefone para formato brasileiro
  cleanPhoneNumber(phone) {
    // Remover caracteres especiais
    let cleaned = phone.replace(/\D/g, '');

    // Adicionar código do país se necessário (Brasil = 55)
    if (cleaned.length === 11 && cleaned.startsWith('0')) {
      cleaned = '55' + cleaned.substring(1);
    } else if (cleaned.length === 11) {
      cleaned = '55' + cleaned;
    } else if (cleaned.length === 10) {
      cleaned = '55' + cleaned;
    } else if (!cleaned.startsWith('55') && cleaned.length <= 11) {
      cleaned = '55' + cleaned;
    }

    // Formato final: +5511999999999
    return '+' + cleaned;
  }

  // Criar template SMS
  async createTemplate(data) {
    try {
      const {
        name,
        content,
        category = 'GENERAL',
        variables = [],
        isActive = true
      } = data;

      if (!name || !content) {
        throw new Error('Parâmetros obrigatórios: name, content');
      }

      // Validar tamanho do template
      if (content.length > 1600) {
        throw new Error('Conteúdo do template muito longo. Máximo 1600 caracteres.');
      }

      // Verificar se nome já existe
      const existingTemplate = await prisma.smsTemplate.findUnique({
        where: { name }
      });

      if (existingTemplate) {
        throw new Error(`Template SMS com nome '${name}' já existe`);
      }

      // Extrair variáveis do conteúdo automaticamente
      const autoVariables = this.extractVariablesFromContent(content);
      const allVariables = Array.from(new Set([...variables, ...autoVariables]));

      const template = await prisma.smsTemplate.create({
        data: {
          name,
          content,
          category: category.toUpperCase(),
          variables: allVariables,
          isActive
        }
      });

      logger.info('Template SMS criado', {
        templateId: template.id,
        name: template.name,
        category: template.category,
        variablesCount: allVariables.length,
        length: content.length
      });

      return template;

    } catch (error) {
      logger.error('Erro ao criar template SMS', {
        error: error.message,
        data
      });
      throw error;
    }
  }

  // Extrair variáveis do conteúdo do template
  extractVariablesFromContent(content) {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables = new Set();

    let match;
    while ((match = variableRegex.exec(content)) !== null) {
      variables.add(match[1].trim());
    }

    return Array.from(variables);
  }

  // Buscar todos os templates SMS
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
          { content: { contains: search } }
        ];
      }

      const [templates, total] = await Promise.all([
        prisma.smsTemplate.findMany({
          where,
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: parseInt(limit)
        }),
        prisma.smsTemplate.count({ where })
      ]);

      const totalPages = Math.ceil(total / parseInt(limit));

      logger.info('Templates SMS recuperados', {
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
      logger.error('Erro ao buscar templates SMS', {
        error: error.message,
        filters
      });
      throw error;
    }
  }

  // Buscar template por ID
  async getTemplateById(id) {
    try {
      const template = await prisma.smsTemplate.findUnique({
        where: { id }
      });

      if (!template) {
        return null;
      }

      logger.info('Template SMS recuperado', {
        templateId: template.id,
        name: template.name
      });

      return template;

    } catch (error) {
      logger.error('Erro ao buscar template SMS por ID', {
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
      const existingTemplate = await prisma.smsTemplate.findUnique({
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
          const nameExists = await prisma.smsTemplate.findUnique({
            where: { name: data.name }
          });
          if (nameExists) {
            throw new Error(`Template SMS com nome '${data.name}' já existe`);
          }
        }
        updateData.name = data.name;
      }

      if (data.content !== undefined) {
        if (data.content.length > 1600) {
          throw new Error('Conteúdo do template muito longo. Máximo 1600 caracteres.');
        }
        updateData.content = data.content;
      }

      if (data.category !== undefined) updateData.category = data.category.toUpperCase();
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      // Extrair variáveis automaticamente se o conteúdo mudou
      if (data.content !== undefined) {
        const autoVariables = this.extractVariablesFromContent(data.content);
        const customVariables = data.variables || existingTemplate.variables || [];
        updateData.variables = Array.from(new Set([...customVariables, ...autoVariables]));
      } else if (data.variables !== undefined) {
        updateData.variables = data.variables;
      }

      const template = await prisma.smsTemplate.update({
        where: { id },
        data: updateData
      });

      logger.info('Template SMS atualizado', {
        templateId: template.id,
        name: template.name,
        updatedFields: Object.keys(updateData)
      });

      return template;

    } catch (error) {
      logger.error('Erro ao atualizar template SMS', {
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
      const existingTemplate = await prisma.smsTemplate.findUnique({
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

      await prisma.smsTemplate.delete({
        where: { id }
      });

      logger.info('Template SMS deletado', {
        templateId: id,
        name: existingTemplate.name
      });

      return true;

    } catch (error) {
      logger.error('Erro ao deletar template SMS', {
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
        throw new Error('Template SMS não encontrado');
      }

      // Processar variáveis
      let content = template.content;

      for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{{${key}}}`;
        const replacement = value || `[${key}]`;

        content = content.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
      }

      return {
        template: {
          id: template.id,
          name: template.name,
          category: template.category
        },
        preview: {
          content,
          length: content.length,
          smsCount: Math.ceil(content.length / 160) // Aproximado, depende da codificação
        },
        variables: template.variables,
        appliedVariables: variables
      };

    } catch (error) {
      logger.error('Erro ao gerar preview do template SMS', {
        error: error.message,
        templateId,
        variables
      });
      throw error;
    }
  }

  // Estatísticas de SMS
  async getSmsStats(filters = {}) {
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
        byDirection,
        byStatus,
        templates
      ] = await Promise.all([
        prisma.communication.count({
          where: {
            type: 'SMS',
            status: 'SENT',
            ...whereClause
          }
        }),
        prisma.communication.count({
          where: {
            type: 'SMS',
            status: 'FAILED',
            ...whereClause
          }
        }),
        prisma.communication.groupBy({
          by: ['direction'],
          _count: { id: true },
          where: {
            type: 'SMS',
            ...whereClause
          }
        }),
        prisma.communication.groupBy({
          by: ['status'],
          _count: { id: true },
          where: {
            type: 'SMS',
            ...whereClause
          }
        }),
        prisma.smsTemplate.count({
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
        byDirection: byDirection.reduce((acc, item) => {
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

      logger.info('Estatísticas de SMS calculadas', {
        totalSent,
        totalFailed,
        successRate: stats.totals.successRate
      });

      return stats;

    } catch (error) {
      logger.error('Erro ao calcular estatísticas de SMS', {
        error: error.message,
        filters
      });
      throw error;
    }
  }

  // Validar número de telefone
  validatePhoneNumber(phone) {
    const cleaned = this.cleanPhoneNumber(phone);

    // Verificar se tem o formato correto para o Brasil
    const brazilianPhoneRegex = /^\+55\d{10,11}$/;

    if (!brazilianPhoneRegex.test(cleaned)) {
      return {
        valid: false,
        message: 'Número de telefone inválido para o Brasil',
        format: 'Esperado: +55XXXXXXXXXXX (11 ou 12 dígitos após +55)'
      };
    }

    return {
      valid: true,
      formatted: cleaned,
      message: 'Número válido'
    };
  }

  // Estimar custo de SMS (aproximado)
  estimateSmsCount(message) {
    // Codificação GSM 7-bit permite 160 caracteres por SMS
    // Codificação UCS-2 permite 70 caracteres por SMS

    // Verificar se contém caracteres especiais que forçam UCS-2
    const containsSpecialChars = /[^\x00-\x7F]/.test(message);

    const maxCharsPerSms = containsSpecialChars ? 70 : 160;
    const smsCount = Math.ceil(message.length / maxCharsPerSms);

    return {
      length: message.length,
      encoding: containsSpecialChars ? 'UCS-2' : 'GSM 7-bit',
      maxCharsPerSms,
      smsCount,
      estimatedCost: smsCount * 0.10 // R$ 0,10 por SMS (valor aproximado)
    };
  }
}

// Exportar instância singleton
const smsService = new SmsService();

module.exports = smsService;