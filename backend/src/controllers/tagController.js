const tagService = require('../services/tagService');
const logger = require('../utils/logger');

class TagController {
  // Criar uma nova tag
  async createTag(req, res) {
    try {
      const tag = await tagService.createTag(req.body);
      res.status(201).json({
        success: true,
        message: 'Tag criada com sucesso',
        data: tag
      });
    } catch (error) {
      logger.error('Erro no controller ao criar tag', {
        error: error.message,
        body: req.body
      });

      if (error.message.includes('unique constraint')) {
        return res.status(409).json({
          success: false,
          message: 'Tag com este nome já existe',
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao criar tag',
        error: error.message
      });
    }
  }

  // Buscar todas as tags
  async getAllTags(req, res) {
    try {
      const result = await tagService.getAllTags(req.query);
      res.status(200).json({
        success: true,
        message: 'Tags recuperadas com sucesso',
        data: result.tags,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Erro no controller ao buscar tags', {
        error: error.message,
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar tags',
        error: error.message
      });
    }
  }

  // Buscar tag por ID
  async getTagById(req, res) {
    try {
      const tag = await tagService.getTagById(req.params.id);

      if (!tag) {
        return res.status(404).json({
          success: false,
          message: 'Tag não encontrada',
          error: 'Tag com o ID fornecido não existe'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Tag recuperada com sucesso',
        data: tag
      });
    } catch (error) {
      logger.error('Erro no controller ao buscar tag por ID', {
        error: error.message,
        tagId: req.params.id
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar tag',
        error: error.message
      });
    }
  }

  // Atualizar tag
  async updateTag(req, res) {
    try {
      const tag = await tagService.updateTag(req.params.id, req.body);

      if (!tag) {
        return res.status(404).json({
          success: false,
          message: 'Tag não encontrada',
          error: 'Tag com o ID fornecido não existe'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Tag atualizada com sucesso',
        data: tag
      });
    } catch (error) {
      logger.error('Erro no controller ao atualizar tag', {
        error: error.message,
        tagId: req.params.id,
        body: req.body
      });

      if (error.message.includes('único') || error.message.includes('unique')) {
        return res.status(409).json({
          success: false,
          message: 'Tag com este nome já existe',
          error: error.message
        });
      }

      if (error.message.includes('sistema')) {
        return res.status(403).json({
          success: false,
          message: 'Operação não permitida',
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao atualizar tag',
        error: error.message
      });
    }
  }

  // Deletar tag
  async deleteTag(req, res) {
    try {
      const result = await tagService.deleteTag(req.params.id);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Tag não encontrada',
          error: 'Tag com o ID fornecido não existe'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Tag deletada com sucesso',
        data: { deleted: true }
      });
    } catch (error) {
      logger.error('Erro no controller ao deletar tag', {
        error: error.message,
        tagId: req.params.id
      });

      if (error.message.includes('sistema')) {
        return res.status(403).json({
          success: false,
          message: 'Não é possível deletar tags do sistema',
          error: error.message
        });
      }

      if (error.message.includes('leads associados')) {
        return res.status(409).json({
          success: false,
          message: 'Tag possui leads associados',
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao deletar tag',
        error: error.message
      });
    }
  }

  // Buscar estatísticas de tags
  async getTagStats(req, res) {
    try {
      const stats = await tagService.getTagStats();
      res.status(200).json({
        success: true,
        message: 'Estatísticas de tags recuperadas com sucesso',
        data: stats
      });
    } catch (error) {
      logger.error('Erro no controller ao buscar estatísticas de tags', {
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar estatísticas',
        error: error.message
      });
    }
  }

  // Associar tag a um lead
  async addTagToLead(req, res) {
    try {
      const { leadId, tagId } = req.params;
      const { addedBy } = req.body;

      const result = await tagService.addTagToLead(leadId, tagId, addedBy);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Lead ou tag não encontrados',
          error: 'Verifique se o lead e a tag existem'
        });
      }

      res.status(201).json({
        success: true,
        message: 'Tag associada ao lead com sucesso',
        data: result
      });
    } catch (error) {
      logger.error('Erro no controller ao associar tag ao lead', {
        error: error.message,
        leadId: req.params.leadId,
        tagId: req.params.tagId
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao associar tag',
        error: error.message
      });
    }
  }

  // Remover tag de um lead
  async removeTagFromLead(req, res) {
    try {
      const { leadId, tagId } = req.params;

      const result = await tagService.removeTagFromLead(leadId, tagId);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Associação não encontrada',
          error: 'A tag não está associada a este lead'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Tag removida do lead com sucesso',
        data: { removed: true }
      });
    } catch (error) {
      logger.error('Erro no controller ao remover tag do lead', {
        error: error.message,
        leadId: req.params.leadId,
        tagId: req.params.tagId
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao remover tag',
        error: error.message
      });
    }
  }

  // Buscar tags por categoria
  async getTagsByCategory(req, res) {
    try {
      const groupedTags = await tagService.getTagsByCategory();
      res.status(200).json({
        success: true,
        message: 'Tags agrupadas por categoria recuperadas com sucesso',
        data: groupedTags
      });
    } catch (error) {
      logger.error('Erro no controller ao buscar tags por categoria', {
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar tags por categoria',
        error: error.message
      });
    }
  }
}

module.exports = new TagController();