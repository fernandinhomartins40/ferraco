const whatsappService = require('../services/whatsappService');
const logger = require('../utils/logger');

class WhatsAppController {
  // Enviar mensagem WhatsApp simples
  async sendMessage(req, res) {
    try {
      const { to, message, leadId, priority } = req.body;

      if (!to || !message) {
        return res.status(400).json({
          success: false,
          message: 'Parâmetros obrigatórios: to, message'
        });
      }

      const result = await whatsappService.sendMessage({
        to,
        message,
        leadId,
        priority
      });

      res.status(201).json({
        success: true,
        message: 'Mensagem WhatsApp enviada para processamento',
        data: result
      });

    } catch (error) {
      logger.error('Erro no controller ao enviar mensagem WhatsApp', {
        error: error.message,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao enviar mensagem WhatsApp',
        error: error.message
      });
    }
  }

  // Enviar mensagem usando template
  async sendTemplateMessage(req, res) {
    try {
      const { to, templateId, templateName, variables, leadId, priority } = req.body;

      if (!to || (!templateId && !templateName)) {
        return res.status(400).json({
          success: false,
          message: 'Parâmetros obrigatórios: to e (templateId ou templateName)'
        });
      }

      const result = await whatsappService.sendTemplateMessage({
        to,
        templateId,
        templateName,
        variables,
        leadId,
        priority
      });

      res.status(201).json({
        success: true,
        message: 'Mensagem WhatsApp com template enviada para processamento',
        data: result
      });

    } catch (error) {
      logger.error('Erro no controller ao enviar mensagem WhatsApp com template', {
        error: error.message,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao enviar mensagem WhatsApp com template',
        error: error.message
      });
    }
  }

  // Webhook para verificação
  async verifyWebhook(req, res) {
    try {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      if (whatsappService.verifyWebhook(mode, token)) {
        logger.info('Webhook WhatsApp verificado com sucesso');
        res.status(200).send(challenge);
      } else {
        logger.warn('Falha na verificação do webhook WhatsApp');
        res.status(403).json({
          success: false,
          message: 'Webhook verification failed'
        });
      }

    } catch (error) {
      logger.error('Erro no controller ao verificar webhook WhatsApp', {
        error: error.message,
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao verificar webhook',
        error: error.message
      });
    }
  }

  // Webhook para receber mensagens
  async receiveWebhook(req, res) {
    try {
      const result = await whatsappService.processWebhook(req.body);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Webhook processado com sucesso'
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message || 'Erro ao processar webhook'
        });
      }

    } catch (error) {
      logger.error('Erro no controller ao processar webhook WhatsApp', {
        error: error.message,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao processar webhook',
        error: error.message
      });
    }
  }

  // Criar template WhatsApp
  async createTemplate(req, res) {
    try {
      const { name, content, category, variables, isActive } = req.body;

      if (!name || !content) {
        return res.status(400).json({
          success: false,
          message: 'Parâmetros obrigatórios: name, content'
        });
      }

      const template = await whatsappService.createTemplate({
        name,
        content,
        category,
        variables,
        isActive
      });

      res.status(201).json({
        success: true,
        message: 'Template WhatsApp criado com sucesso',
        data: template
      });

    } catch (error) {
      logger.error('Erro no controller ao criar template WhatsApp', {
        error: error.message,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao criar template WhatsApp',
        error: error.message
      });
    }
  }

  // Buscar todos os templates
  async getAllTemplates(req, res) {
    try {
      const result = await whatsappService.getAllTemplates(req.query);

      res.status(200).json({
        success: true,
        message: 'Templates WhatsApp recuperados com sucesso',
        data: result.templates,
        pagination: result.pagination
      });

    } catch (error) {
      logger.error('Erro no controller ao buscar templates WhatsApp', {
        error: error.message,
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar templates WhatsApp',
        error: error.message
      });
    }
  }

  // Buscar template por ID
  async getTemplateById(req, res) {
    try {
      const { id } = req.params;
      const template = await whatsappService.getTemplateById(id);

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template WhatsApp não encontrado'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Template WhatsApp recuperado com sucesso',
        data: template
      });

    } catch (error) {
      logger.error('Erro no controller ao buscar template WhatsApp por ID', {
        error: error.message,
        templateId: req.params.id
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar template WhatsApp',
        error: error.message
      });
    }
  }

  // Atualizar template
  async updateTemplate(req, res) {
    try {
      const { id } = req.params;
      const template = await whatsappService.updateTemplate(id, req.body);

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template WhatsApp não encontrado'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Template WhatsApp atualizado com sucesso',
        data: template
      });

    } catch (error) {
      logger.error('Erro no controller ao atualizar template WhatsApp', {
        error: error.message,
        templateId: req.params.id,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao atualizar template WhatsApp',
        error: error.message
      });
    }
  }

  // Deletar template
  async deleteTemplate(req, res) {
    try {
      const { id } = req.params;
      const result = await whatsappService.deleteTemplate(id);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Template WhatsApp não encontrado'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Template WhatsApp deletado com sucesso'
      });

    } catch (error) {
      logger.error('Erro no controller ao deletar template WhatsApp', {
        error: error.message,
        templateId: req.params.id
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao deletar template WhatsApp',
        error: error.message
      });
    }
  }

  // Preview de template
  async previewTemplate(req, res) {
    try {
      const { id } = req.params;
      const { variables } = req.body;

      const preview = await whatsappService.previewTemplate(id, variables);

      res.status(200).json({
        success: true,
        message: 'Preview do template WhatsApp gerado com sucesso',
        data: preview
      });

    } catch (error) {
      logger.error('Erro no controller ao gerar preview do template WhatsApp', {
        error: error.message,
        templateId: req.params.id,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao gerar preview',
        error: error.message
      });
    }
  }

  // Buscar estatísticas de WhatsApp
  async getWhatsAppStats(req, res) {
    try {
      const stats = await whatsappService.getWhatsAppStats(req.query);

      res.status(200).json({
        success: true,
        message: 'Estatísticas de WhatsApp recuperadas com sucesso',
        data: stats
      });

    } catch (error) {
      logger.error('Erro no controller ao buscar estatísticas de WhatsApp', {
        error: error.message,
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar estatísticas',
        error: error.message
      });
    }
  }

  // Testar template (enviar para um número específico)
  async testTemplate(req, res) {
    try {
      const { id } = req.params;
      const { phone, variables } = req.body;

      if (!phone) {
        return res.status(400).json({
          success: false,
          message: 'Número de telefone de teste é obrigatório'
        });
      }

      // Verificar se template existe
      const template = await whatsappService.getTemplateById(id);
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template WhatsApp não encontrado'
        });
      }

      // Enviar mensagem de teste
      const result = await whatsappService.sendTemplateMessage({
        to: phone,
        templateId: id,
        variables: {
          ...variables,
          'test.note': 'Esta é uma mensagem de teste'
        },
        priority: 1 // Alta prioridade para testes
      });

      res.status(201).json({
        success: true,
        message: 'Mensagem WhatsApp de teste enviada para processamento',
        data: {
          ...result,
          testPhone: phone,
          templateName: template.name
        }
      });

    } catch (error) {
      logger.error('Erro no controller ao testar template WhatsApp', {
        error: error.message,
        templateId: req.params.id,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao testar template WhatsApp',
        error: error.message
      });
    }
  }

  // Buscar templates por categoria
  async getTemplatesByCategory(req, res) {
    try {
      const { category } = req.params;

      const validCategories = ['GENERAL', 'AUTOMATION', 'CONVERSION', 'FOLLOW_UP', 'NOTIFICATION'];
      if (!validCategories.includes(category.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: `Categoria inválida. Use: ${validCategories.join(', ')}`
        });
      }

      const result = await whatsappService.getAllTemplates({
        ...req.query,
        category: category.toUpperCase()
      });

      res.status(200).json({
        success: true,
        message: `Templates WhatsApp da categoria ${category} recuperados com sucesso`,
        data: result.templates,
        pagination: result.pagination
      });

    } catch (error) {
      logger.error('Erro no controller ao buscar templates WhatsApp por categoria', {
        error: error.message,
        category: req.params.category,
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar templates por categoria',
        error: error.message
      });
    }
  }
}

module.exports = new WhatsAppController();