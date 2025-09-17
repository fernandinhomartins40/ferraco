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

  // Buscar estatísticas de leads
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

  // Buscar leads próximos do follow-up
  async getUpcomingFollowUps(req, res) {
    try {
      // Buscar leads com follow-up nos próximos 7 dias
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);

      const leads = await leadService.getAllLeads({
        // Implementar filtro de data no service se necessário
        sortBy: 'nextFollowUp',
        sortOrder: 'asc',
        limit: 50
      });

      // Filtrar leads com follow-up próximo
      const upcomingLeads = leads.leads.filter(lead => {
        if (!lead.nextFollowUp) return false;
        const followUpDate = new Date(lead.nextFollowUp);
        return followUpDate >= today && followUpDate <= nextWeek;
      });

      res.status(200).json({
        success: true,
        message: 'Follow-ups próximos recuperados com sucesso',
        data: upcomingLeads
      });
    } catch (error) {
      logger.error('Erro no controller ao buscar follow-ups próximos', {
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar follow-ups',
        error: error.message
      });
    }
  }

  // Buscar leads por status específico
  async getLeadsByStatus(req, res) {
    try {
      const { status } = req.params;

      // Validar status
      const validStatuses = ['NOVO', 'EM_ANDAMENTO', 'CONCLUIDO'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status inválido. Use: NOVO, EM_ANDAMENTO ou CONCLUIDO'
        });
      }

      const result = await leadService.getAllLeads({
        ...req.query,
        status
      });

      res.status(200).json({
        success: true,
        message: `Leads com status ${status} recuperados com sucesso`,
        data: result.leads,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Erro no controller ao buscar leads por status', {
        error: error.message,
        status: req.params.status
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar leads por status',
        error: error.message
      });
    }
  }

  // Buscar leads por prioridade
  async getLeadsByPriority(req, res) {
    try {
      const { priority } = req.params;

      // Validar prioridade
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH'];
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({
          success: false,
          message: 'Prioridade inválida. Use: LOW, MEDIUM ou HIGH'
        });
      }

      const result = await leadService.getAllLeads({
        ...req.query,
        priority
      });

      res.status(200).json({
        success: true,
        message: `Leads com prioridade ${priority} recuperados com sucesso`,
        data: result.leads,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Erro no controller ao buscar leads por prioridade', {
        error: error.message,
        priority: req.params.priority
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar leads por prioridade',
        error: error.message
      });
    }
  }
}

module.exports = new LeadController();