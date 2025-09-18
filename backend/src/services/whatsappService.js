const { PrismaClient } = require('@prisma/client');
const queueService = require('./queueService');
const logger = require('../utils/logger');
const axios = require('axios');

const prisma = new PrismaClient();

class WhatsAppService {
  constructor() {
    this.isInitialized = false;
    this.apiConfig = {
      baseURL: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0',
      token: process.env.WHATSAPP_ACCESS_TOKEN,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
    };
  }

  // Inicializar serviço WhatsApp
  async initialize() {
    if (this.isInitialized) {
      logger.warn('WhatsAppService já foi inicializado');
      return;
    }

    try {
      // Verificar configurações obrigatórias
      const requiredEnvVars = ['WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID'];
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

      if (missingVars.length > 0) {
        logger.warn('Configurações WhatsApp incompletas, mensagens serão simuladas', {
          missingVars
        });
      } else {
        logger.info('Configurações WhatsApp encontradas');

        // Verificar conexão com a API
        await this.verifyApiConnection();
      }

      // Criar templates padrão se não existirem
      await this.createDefaultTemplates();

      this.isInitialized = true;
      logger.info('WhatsAppService inicializado com sucesso');

    } catch (error) {
      logger.error('Erro ao inicializar WhatsAppService', {
        error: error.message
      });
      throw error;
    }
  }

  // Verificar conexão com a API do WhatsApp
  async verifyApiConnection() {
    try {
      if (!this.apiConfig.token || !this.apiConfig.phoneNumberId) {
        throw new Error('Token ou Phone Number ID não configurados');
      }

      const response = await axios.get(
        `${this.apiConfig.baseURL}/${this.apiConfig.phoneNumberId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiConfig.token}`
          },
          timeout: 10000
        }
      );

      logger.info('Conexão com WhatsApp API verificada', {
        phoneNumberId: this.apiConfig.phoneNumberId,
        status: response.status
      });

    } catch (error) {
      logger.warn('Falha na verificação da WhatsApp API', {
        error: error.message
      });
      // Não falhar a inicialização, apenas logar
    }
  }

  // Criar templates padrão
  async createDefaultTemplates() {
    try {
      const defaultTemplates = [
        {
          name: 'lead_welcome_whatsapp',
          content: `Olá, {{lead.name}}! 👋

Obrigado por entrar em contato conosco. Recebemos suas informações e nossa equipe entrará em contato em breve.

*Seus dados:*
• Nome: {{lead.name}}
• Telefone: {{lead.phone}}

Atenciosamente,
*Equipe Ferraco* 🔧`,
          category: 'AUTOMATION',
          isActive: true,
          variables: ['lead.name', 'lead.phone']
        },
        {
          name: 'follow_up_whatsapp',
          content: `Oi, {{lead.name}}! 😊

Notamos que você demonstrou interesse em nossos serviços. Ainda podemos ajudá-lo?

Entre em contato conosco:
📞 {{company.phone}}
💬 WhatsApp: {{company.whatsapp}}

*Equipe Ferraco* ⚡`,
          category: 'AUTOMATION',
          isActive: true,
          variables: ['lead.name', 'company.phone', 'company.whatsapp']
        },
        {
          name: 'lead_converted_whatsapp',
          content: `🎉 Parabéns, {{lead.name}}!

Sua solicitação foi aprovada! Nossa equipe entrará em contato em breve para dar continuidade.

*Próximos passos:*
1️⃣ Contato da equipe técnica
2️⃣ Agendamento de visita (se necessário)
3️⃣ Proposta detalhada

Obrigado por escolher a *Ferraco*! 🔧✨`,
          category: 'CONVERSION',
          isActive: true,
          variables: ['lead.name']
        }
      ];

      for (const template of defaultTemplates) {
        const existingTemplate = await prisma.whatsappTemplate.findUnique({
          where: { name: template.name }
        });

        if (!existingTemplate) {
          await prisma.whatsappTemplate.create({
            data: template
          });
          logger.info('Template WhatsApp padrão criado', {
            name: template.name,
            category: template.category
          });
        }
      }

    } catch (error) {
      logger.error('Erro ao criar templates WhatsApp padrão', {
        error: error.message
      });
    }
  }

  // Enviar mensagem WhatsApp simples
  async sendMessage(data) {
    try {
      const { to, message, leadId, priority = 5 } = data;

      if (!to || !message) {
        throw new Error('Parâmetros obrigatórios: to, message');
      }

      // Limpar número de telefone
      const cleanPhone = this.cleanPhoneNumber(to);

      // Adicionar à fila de processamento
      const job = await queueService.addWhatsAppJob({
        type: 'send_whatsapp',
        to: cleanPhone,
        message,
        leadId,
        priority
      }, {
        priority,
        attempts: 3
      });

      logger.info('Mensagem WhatsApp adicionada à fila', {
        jobId: job.id,
        to: cleanPhone,
        message: message.substring(0, 50),
        leadId
      });

      return {
        success: true,
        jobId: job.id,
        message: 'Mensagem WhatsApp adicionada à fila de processamento',
        phone: cleanPhone
      };

    } catch (error) {
      logger.error('Erro ao enviar mensagem WhatsApp', {
        error: error.message,
        data
      });
      throw error;
    }
  }

  // Enviar mensagem usando template
  async sendTemplateMessage(data) {
    try {
      const { to, templateId, templateName, variables = {}, leadId, priority = 5 } = data;

      if (!to || (!templateId && !templateName)) {
        throw new Error('Parâmetros obrigatórios: to e (templateId ou templateName)');
      }

      // Buscar template
      let template;
      if (templateId) {
        template = await prisma.whatsappTemplate.findUnique({
          where: { id: templateId }
        });
      } else {
        template = await prisma.whatsappTemplate.findUnique({
          where: { name: templateName }
        });
      }

      if (!template) {
        throw new Error(`Template WhatsApp não encontrado: ${templateId || templateName}`);
      }

      if (!template.isActive) {
        throw new Error(`Template WhatsApp está inativo: ${template.name}`);
      }

      // Limpar número de telefone
      const cleanPhone = this.cleanPhoneNumber(to);

      // Adicionar à fila de processamento
      const job = await queueService.addWhatsAppJob({
        type: 'send_template_whatsapp',
        to: cleanPhone,
        templateId: template.id,
        variables,
        leadId,
        priority
      }, {
        priority,
        attempts: 3
      });

      logger.info('Mensagem WhatsApp com template adicionada à fila', {
        jobId: job.id,
        to: cleanPhone,
        templateName: template.name,
        leadId
      });

      return {
        success: true,
        jobId: job.id,
        templateName: template.name,
        message: 'Mensagem WhatsApp com template adicionada à fila de processamento',
        phone: cleanPhone
      };

    } catch (error) {
      logger.error('Erro ao enviar mensagem WhatsApp com template', {
        error: error.message,
        data
      });
      throw error;
    }
  }

  // Enviar mensagem real através da API do WhatsApp
  async sendWhatsAppAPIMessage(to, message) {
    try {
      if (!this.apiConfig.token || !this.apiConfig.phoneNumberId) {
        // Simular envio se não há configuração
        logger.info('Simulando envio de WhatsApp (configuração incompleta)', {
          to,
          message: message.substring(0, 50)
        });
        return {
          success: true,
          messageId: `sim_${Date.now()}`,
          simulated: true
        };
      }

      const cleanPhone = this.cleanPhoneNumber(to);

      const payload = {
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'text',
        text: {
          body: message
        }
      };

      const response = await axios.post(
        `${this.apiConfig.baseURL}/${this.apiConfig.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiConfig.token}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      logger.info('Mensagem WhatsApp enviada via API', {
        to: cleanPhone,
        messageId: response.data.messages?.[0]?.id,
        status: response.status
      });

      return {
        success: true,
        messageId: response.data.messages?.[0]?.id,
        response: response.data,
        simulated: false
      };

    } catch (error) {
      logger.error('Erro ao enviar via WhatsApp API', {
        to,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  // Limpar número de telefone para formato WhatsApp
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

    return cleaned;
  }

  // Criar template WhatsApp
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

      // Verificar se nome já existe
      const existingTemplate = await prisma.whatsappTemplate.findUnique({
        where: { name }
      });

      if (existingTemplate) {
        throw new Error(`Template WhatsApp com nome '${name}' já existe`);
      }

      // Extrair variáveis do conteúdo automaticamente
      const autoVariables = this.extractVariablesFromContent(content);
      const allVariables = Array.from(new Set([...variables, ...autoVariables]));

      const template = await prisma.whatsappTemplate.create({
        data: {
          name,
          content,
          category: category.toUpperCase(),
          variables: allVariables,
          isActive
        }
      });

      logger.info('Template WhatsApp criado', {
        templateId: template.id,
        name: template.name,
        category: template.category,
        variablesCount: allVariables.length
      });

      return template;

    } catch (error) {
      logger.error('Erro ao criar template WhatsApp', {
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

  // Buscar todos os templates WhatsApp
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
        prisma.whatsappTemplate.findMany({
          where,
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: parseInt(limit)
        }),
        prisma.whatsappTemplate.count({ where })
      ]);

      const totalPages = Math.ceil(total / parseInt(limit));

      logger.info('Templates WhatsApp recuperados', {
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
      logger.error('Erro ao buscar templates WhatsApp', {
        error: error.message,
        filters
      });
      throw error;
    }
  }

  // Buscar template por ID
  async getTemplateById(id) {
    try {
      const template = await prisma.whatsappTemplate.findUnique({
        where: { id }
      });

      if (!template) {
        return null;
      }

      logger.info('Template WhatsApp recuperado', {
        templateId: template.id,
        name: template.name
      });

      return template;

    } catch (error) {
      logger.error('Erro ao buscar template WhatsApp por ID', {
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
      const existingTemplate = await prisma.whatsappTemplate.findUnique({
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
          const nameExists = await prisma.whatsappTemplate.findUnique({
            where: { name: data.name }
          });
          if (nameExists) {
            throw new Error(`Template WhatsApp com nome '${data.name}' já existe`);
          }
        }
        updateData.name = data.name;
      }

      if (data.content !== undefined) updateData.content = data.content;
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

      const template = await prisma.whatsappTemplate.update({
        where: { id },
        data: updateData
      });

      logger.info('Template WhatsApp atualizado', {
        templateId: template.id,
        name: template.name,
        updatedFields: Object.keys(updateData)
      });

      return template;

    } catch (error) {
      logger.error('Erro ao atualizar template WhatsApp', {
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
      const existingTemplate = await prisma.whatsappTemplate.findUnique({
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

      await prisma.whatsappTemplate.delete({
        where: { id }
      });

      logger.info('Template WhatsApp deletado', {
        templateId: id,
        name: existingTemplate.name
      });

      return true;

    } catch (error) {
      logger.error('Erro ao deletar template WhatsApp', {
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
        throw new Error('Template WhatsApp não encontrado');
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
          content
        },
        variables: template.variables,
        appliedVariables: variables
      };

    } catch (error) {
      logger.error('Erro ao gerar preview do template WhatsApp', {
        error: error.message,
        templateId,
        variables
      });
      throw error;
    }
  }

  // Estatísticas de WhatsApp
  async getWhatsAppStats(filters = {}) {
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
            type: 'WHATSAPP',
            status: 'SENT',
            ...whereClause
          }
        }),
        prisma.communication.count({
          where: {
            type: 'WHATSAPP',
            status: 'FAILED',
            ...whereClause
          }
        }),
        prisma.communication.groupBy({
          by: ['direction'],
          _count: { id: true },
          where: {
            type: 'WHATSAPP',
            ...whereClause
          }
        }),
        prisma.communication.groupBy({
          by: ['status'],
          _count: { id: true },
          where: {
            type: 'WHATSAPP',
            ...whereClause
          }
        }),
        prisma.whatsappTemplate.count({
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

      logger.info('Estatísticas de WhatsApp calculadas', {
        totalSent,
        totalFailed,
        successRate: stats.totals.successRate
      });

      return stats;

    } catch (error) {
      logger.error('Erro ao calcular estatísticas de WhatsApp', {
        error: error.message,
        filters
      });
      throw error;
    }
  }

  // Verificar webhook (para receber mensagens)
  verifyWebhook(mode, token) {
    const verifyToken = this.apiConfig.webhookVerifyToken;

    if (mode === 'subscribe' && token === verifyToken) {
      logger.info('Webhook WhatsApp verificado com sucesso');
      return true;
    }

    logger.warn('Falha na verificação do webhook WhatsApp', {
      mode,
      receivedToken: token ? 'presente' : 'ausente'
    });
    return false;
  }

  // Processar webhook recebido (mensagens recebidas)
  async processWebhook(body) {
    try {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (!value) {
        logger.warn('Webhook WhatsApp sem dados válidos', { body });
        return { success: false, message: 'No valid data' };
      }

      // Processar mensagens recebidas
      if (value.messages) {
        for (const message of value.messages) {
          await this.processIncomingMessage(message, value.contacts?.[0]);
        }
      }

      // Processar status de mensagens enviadas
      if (value.statuses) {
        for (const status of value.statuses) {
          await this.processMessageStatus(status);
        }
      }

      return { success: true, message: 'Webhook processed' };

    } catch (error) {
      logger.error('Erro ao processar webhook WhatsApp', {
        error: error.message,
        body
      });
      throw error;
    }
  }

  // Processar mensagem recebida
  async processIncomingMessage(message, contact) {
    try {
      const phoneNumber = message.from;
      const messageText = message.text?.body || '';
      const messageId = message.id;

      logger.info('Mensagem WhatsApp recebida', {
        from: phoneNumber,
        messageId,
        text: messageText.substring(0, 100)
      });

      // Buscar lead pelo telefone
      const lead = await prisma.lead.findFirst({
        where: {
          phone: {
            contains: phoneNumber.slice(-10) // Últimos 10 dígitos
          }
        }
      });

      // Registrar comunicação
      await prisma.communication.create({
        data: {
          leadId: lead?.id || null,
          type: 'WHATSAPP',
          direction: 'INBOUND',
          content: JSON.stringify({
            from: phoneNumber,
            text: messageText,
            messageId,
            contact
          }),
          status: 'RECEIVED',
          externalId: messageId,
          sentAt: new Date()
        }
      });

      // Disparar trigger se lead encontrado
      if (lead) {
        const triggerService = require('./triggerService');
        await triggerService.onCommunicationReceived(lead, {
          type: 'WHATSAPP',
          direction: 'INBOUND',
          content: JSON.stringify({ text: messageText })
        });
      }

    } catch (error) {
      logger.error('Erro ao processar mensagem WhatsApp recebida', {
        error: error.message,
        message
      });
    }
  }

  // Processar status de mensagem
  async processMessageStatus(status) {
    try {
      const messageId = status.id;
      const statusType = status.status; // sent, delivered, read, failed

      logger.info('Status de mensagem WhatsApp', {
        messageId,
        status: statusType
      });

      // Atualizar status na comunicação
      await prisma.communication.updateMany({
        where: {
          externalId: messageId,
          type: 'WHATSAPP'
        },
        data: {
          status: statusType.toUpperCase(),
          metadata: JSON.stringify({
            timestamp: status.timestamp,
            recipientId: status.recipient_id
          })
        }
      });

    } catch (error) {
      logger.error('Erro ao processar status de mensagem WhatsApp', {
        error: error.message,
        status
      });
    }
  }
}

// Exportar instância singleton
const whatsappService = new WhatsAppService();

module.exports = whatsappService;