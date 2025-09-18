const leadService = require('../services/leadService');
const logger = require('../utils/logger');

class LeadController {
  // Criar um novo lead
  async createLead(req, res) {
    try {
      const lead = await leadService.createLead(req.body);

      res.status(201).json({
        success: true,
        message: 'Lead criado com sucesso',
        data: lead
      });
    } catch (error) {
      logger.error('Erro no controller ao criar lead', {
        error: error.message,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao criar lead',
        error: error.message
      });
    }
  }

  // Buscar todos os leads
  async getAllLeads(req, res) {
    try {
      const result = await leadService.getAllLeads(req.query);

      res.status(200).json({
        success: true,
        message: 'Leads recuperados com sucesso',
        data: result.leads,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Erro no controller ao buscar leads', {
        error: error.message,
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar leads',
        error: error.message
      });
    }
  }

  // Buscar um lead por ID
  async getLeadById(req, res) {
    try {
      const { id } = req.params;
      const lead = await leadService.getLeadById(id);

      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Lead não encontrado'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Lead recuperado com sucesso',
        data: lead
      });
    } catch (error) {
      logger.error('Erro no controller ao buscar lead por ID', {
        error: error.message,
        leadId: req.params.id
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar lead',
        error: error.message
      });
    }
  }

  // Atualizar um lead
  async updateLead(req, res) {
    try {
      const { id } = req.params;
      const lead = await leadService.updateLead(id, req.body);

      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Lead não encontrado'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Lead atualizado com sucesso',
        data: lead
      });
    } catch (error) {
      logger.error('Erro no controller ao atualizar lead', {
        error: error.message,
        leadId: req.params.id,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao atualizar lead',
        error: error.message
      });
    }
  }

  // Atualizar status do lead
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const lead = await leadService.updateLead(id, { status });

      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Lead não encontrado'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Status atualizado com sucesso',
        data: lead
      });
    } catch (error) {
      logger.error('Erro no controller ao atualizar status', {
        error: error.message,
        leadId: req.params.id,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao atualizar status',
        error: error.message
      });
    }
  }

  // Deletar um lead
  async deleteLead(req, res) {
    try {
      const { id } = req.params;
      const result = await leadService.deleteLead(id);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Lead não encontrado'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Lead deletado com sucesso'
      });
    } catch (error) {
      logger.error('Erro no controller ao deletar lead', {
        error: error.message,
        leadId: req.params.id
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao deletar lead',
        error: error.message
      });
    }
  }

  // Buscar estatísticas básicas de leads
  async getLeadStats(req, res) {
    try {
      const stats = await leadService.getLeadStats();

      res.status(200).json({
        success: true,
        message: 'Estatísticas de leads recuperadas com sucesso',
        data: stats
      });
    } catch (error) {
      logger.error('Erro no controller ao buscar estatísticas de leads', {
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar estatísticas',
        error: error.message
      });
    }
  }

  // Adicionar nota a um lead
  async addNote(req, res) {
    try {
      const { id } = req.params;
      const { content, important, createdBy } = req.body;

      const note = await leadService.addNote(id, content, important, createdBy);

      if (!note) {
        return res.status(404).json({
          success: false,
          message: 'Lead não encontrado'
        });
      }

      res.status(201).json({
        success: true,
        message: 'Nota adicionada com sucesso',
        data: note
      });
    } catch (error) {
      logger.error('Erro no controller ao adicionar nota', {
        error: error.message,
        leadId: req.params.id,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao adicionar nota',
        error: error.message
      });
    }
  }
}

module.exports = new LeadController();