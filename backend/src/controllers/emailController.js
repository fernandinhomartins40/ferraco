const emailService = require('../services/emailService');
const logger = require('../utils/logger');

class EmailController {
  // Enviar email simples
  async sendEmail(req, res) {
    try {
      const { to, subject, html, text, leadId, priority } = req.body;

      if (!to || !subject || (!html && !text)) {
        return res.status(400).json({
          success: false,
          message: 'Parâmetros obrigatórios: to, subject e (html ou text)'
        });
      }

      const result = await emailService.sendEmail({
        to,
        subject,
        html,
        text,
        leadId,
        priority
      });

      res.status(201).json({
        success: true,
        message: 'Email enviado para processamento',
        data: result
      });

    } catch (error) {
      logger.error('Erro no controller ao enviar email', {
        error: error.message,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao enviar email',
        error: error.message
      });
    }
  }

  // Enviar email usando template
  async sendTemplateEmail(req, res) {
    try {
      const { to, templateId, templateName, variables, leadId, priority } = req.body;

      if (!to || (!templateId && !templateName)) {
        return res.status(400).json({
          success: false,
          message: 'Parâmetros obrigatórios: to e (templateId ou templateName)'
        });
      }

      const result = await emailService.sendTemplateEmail({
        to,
        templateId,
        templateName,
        variables,
        leadId,
        priority
      });

      res.status(201).json({
        success: true,
        message: 'Email com template enviado para processamento',
        data: result
      });

    } catch (error) {
      logger.error('Erro no controller ao enviar email com template', {
        error: error.message,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao enviar email com template',
        error: error.message
      });
    }
  }

  // Enviar email em lote
  async sendBulkEmail(req, res) {
    try {
      const { recipients, subject, html, text, templateId, templateName, variables, priority } = req.body;

      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Lista de destinatários é obrigatória'
        });
      }

      const result = await emailService.sendBulkEmail({
        recipients,
        subject,
        html,
        text,
        templateId,
        templateName,
        variables,
        priority
      });

      res.status(201).json({
        success: true,
        message: 'Email em lote enviado para processamento',
        data: result
      });

    } catch (error) {
      logger.error('Erro no controller ao enviar email em lote', {
        error: error.message,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao enviar email em lote',
        error: error.message
      });
    }
  }

  // Criar template de email
  async createTemplate(req, res) {
    try {
      const { name, subject, htmlContent, textContent, category, variables, isActive } = req.body;

      if (!name || !subject || !htmlContent) {
        return res.status(400).json({
          success: false,
          message: 'Parâmetros obrigatórios: name, subject, htmlContent'
        });
      }

      const template = await emailService.createTemplate({
        name,
        subject,
        htmlContent,
        textContent,
        category,
        variables,
        isActive
      });

      res.status(201).json({
        success: true,
        message: 'Template de email criado com sucesso',
        data: template
      });

    } catch (error) {
      logger.error('Erro no controller ao criar template', {
        error: error.message,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao criar template',
        error: error.message
      });
    }
  }

  // Buscar todos os templates
  async getAllTemplates(req, res) {
    try {
      const result = await emailService.getAllTemplates(req.query);

      res.status(200).json({
        success: true,
        message: 'Templates de email recuperados com sucesso',
        data: result.templates,
        pagination: result.pagination
      });

    } catch (error) {
      logger.error('Erro no controller ao buscar templates', {
        error: error.message,
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar templates',
        error: error.message
      });
    }
  }

  // Buscar template por ID
  async getTemplateById(req, res) {
    try {
      const { id } = req.params;
      const template = await emailService.getTemplateById(id);

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template não encontrado'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Template recuperado com sucesso',
        data: template
      });

    } catch (error) {
      logger.error('Erro no controller ao buscar template por ID', {
        error: error.message,
        templateId: req.params.id
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar template',
        error: error.message
      });
    }
  }

  // Atualizar template
  async updateTemplate(req, res) {
    try {
      const { id } = req.params;
      const template = await emailService.updateTemplate(id, req.body);

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template não encontrado'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Template atualizado com sucesso',
        data: template
      });

    } catch (error) {
      logger.error('Erro no controller ao atualizar template', {
        error: error.message,
        templateId: req.params.id,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao atualizar template',
        error: error.message
      });
    }
  }

  // Deletar template
  async deleteTemplate(req, res) {
    try {
      const { id } = req.params;
      const result = await emailService.deleteTemplate(id);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Template não encontrado'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Template deletado com sucesso'
      });

    } catch (error) {
      logger.error('Erro no controller ao deletar template', {
        error: error.message,
        templateId: req.params.id
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao deletar template',
        error: error.message
      });
    }
  }

  // Preview de template
  async previewTemplate(req, res) {
    try {
      const { id } = req.params;
      const { variables } = req.body;

      const preview = await emailService.previewTemplate(id, variables);

      res.status(200).json({
        success: true,
        message: 'Preview do template gerado com sucesso',
        data: preview
      });

    } catch (error) {
      logger.error('Erro no controller ao gerar preview do template', {
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

  // Buscar estatísticas de email
  async getEmailStats(req, res) {
    try {
      const stats = await emailService.getEmailStats(req.query);

      res.status(200).json({
        success: true,
        message: 'Estatísticas de email recuperadas com sucesso',
        data: stats
      });

    } catch (error) {
      logger.error('Erro no controller ao buscar estatísticas de email', {
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

      const result = await emailService.getAllTemplates({
        ...req.query,
        category: category.toUpperCase()
      });

      res.status(200).json({
        success: true,
        message: `Templates da categoria ${category} recuperados com sucesso`,
        data: result.templates,
        pagination: result.pagination
      });

    } catch (error) {
      logger.error('Erro no controller ao buscar templates por categoria', {
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

  // Testar template (enviar para um email específico)
  async testTemplate(req, res) {
    try {
      const { id } = req.params;
      const { email, variables } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email de teste é obrigatório'
        });
      }

      // Verificar se template existe
      const template = await emailService.getTemplateById(id);
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template não encontrado'
        });
      }

      // Enviar email de teste
      const result = await emailService.sendTemplateEmail({
        to: email,
        templateId: id,
        variables: {
          ...variables,
          'test.note': 'Este é um email de teste'
        },
        priority: 1 // Alta prioridade para testes
      });

      res.status(201).json({
        success: true,
        message: 'Email de teste enviado para processamento',
        data: {
          ...result,
          testEmail: email,
          templateName: template.name
        }
      });

    } catch (error) {
      logger.error('Erro no controller ao testar template', {
        error: error.message,
        templateId: req.params.id,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao testar template',
        error: error.message
      });
    }
  }

  // Duplicar template
  async duplicateTemplate(req, res) {
    try {
      const { id } = req.params;
      const { newName } = req.body;

      if (!newName) {
        return res.status(400).json({
          success: false,
          message: 'Nome do novo template é obrigatório'
        });
      }

      // Buscar template original
      const originalTemplate = await emailService.getTemplateById(id);
      if (!originalTemplate) {
        return res.status(404).json({
          success: false,
          message: 'Template original não encontrado'
        });
      }

      // Criar novo template baseado no original
      const newTemplate = await emailService.createTemplate({
        name: newName,
        subject: `${originalTemplate.subject} (Cópia)`,
        htmlContent: originalTemplate.htmlContent,
        textContent: originalTemplate.textContent,
        category: originalTemplate.category,
        variables: originalTemplate.variables,
        isActive: false // Criar como inativo por padrão
      });

      res.status(201).json({
        success: true,
        message: 'Template duplicado com sucesso',
        data: newTemplate
      });

    } catch (error) {
      logger.error('Erro no controller ao duplicar template', {
        error: error.message,
        templateId: req.params.id,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao duplicar template',
        error: error.message
      });
    }
  }
}

module.exports = new EmailController();