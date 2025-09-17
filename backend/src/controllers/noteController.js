const noteService = require('../services/noteService');
const logger = require('../utils/logger');

class NoteController {
  // Criar uma nova nota para um lead
  async createNote(req, res) {
    try {
      const { leadId } = req.params;
      const note = await noteService.createNote(leadId, req.body);

      if (!note) {
        return res.status(404).json({
          success: false,
          message: 'Lead não encontrado',
          error: 'Lead com o ID fornecido não existe'
        });
      }

      res.status(201).json({
        success: true,
        message: 'Nota criada com sucesso',
        data: note
      });
    } catch (error) {
      logger.error('Erro no controller ao criar nota', {
        error: error.message,
        leadId: req.params.leadId,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao criar nota',
        error: error.message
      });
    }
  }

  // Buscar todas as notas de um lead
  async getNotesByLead(req, res) {
    try {
      const { leadId } = req.params;
      const result = await noteService.getNotesByLead(leadId, req.query);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Lead não encontrado',
          error: 'Lead com o ID fornecido não existe'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Notas do lead recuperadas com sucesso',
        data: result.notes,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Erro no controller ao buscar notas do lead', {
        error: error.message,
        leadId: req.params.leadId,
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar notas',
        error: error.message
      });
    }
  }

  // Buscar nota por ID
  async getNoteById(req, res) {
    try {
      const note = await noteService.getNoteById(req.params.id);

      if (!note) {
        return res.status(404).json({
          success: false,
          message: 'Nota não encontrada',
          error: 'Nota com o ID fornecido não existe'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Nota recuperada com sucesso',
        data: note
      });
    } catch (error) {
      logger.error('Erro no controller ao buscar nota por ID', {
        error: error.message,
        noteId: req.params.id
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar nota',
        error: error.message
      });
    }
  }

  // Atualizar nota
  async updateNote(req, res) {
    try {
      const note = await noteService.updateNote(req.params.id, req.body);

      if (!note) {
        return res.status(404).json({
          success: false,
          message: 'Nota não encontrada',
          error: 'Nota com o ID fornecido não existe'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Nota atualizada com sucesso',
        data: note
      });
    } catch (error) {
      logger.error('Erro no controller ao atualizar nota', {
        error: error.message,
        noteId: req.params.id,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao atualizar nota',
        error: error.message
      });
    }
  }

  // Deletar nota
  async deleteNote(req, res) {
    try {
      const result = await noteService.deleteNote(req.params.id);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Nota não encontrada',
          error: 'Nota com o ID fornecido não existe'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Nota deletada com sucesso',
        data: { deleted: true }
      });
    } catch (error) {
      logger.error('Erro no controller ao deletar nota', {
        error: error.message,
        noteId: req.params.id
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao deletar nota',
        error: error.message
      });
    }
  }

  // Buscar estatísticas de notas
  async getNoteStats(req, res) {
    try {
      const stats = await noteService.getNoteStats();
      res.status(200).json({
        success: true,
        message: 'Estatísticas de notas recuperadas com sucesso',
        data: stats
      });
    } catch (error) {
      logger.error('Erro no controller ao buscar estatísticas de notas', {
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar estatísticas',
        error: error.message
      });
    }
  }

  // Buscar notas importantes
  async getImportantNotes(req, res) {
    try {
      const result = await noteService.getImportantNotes(req.query);
      res.status(200).json({
        success: true,
        message: 'Notas importantes recuperadas com sucesso',
        data: result.notes,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Erro no controller ao buscar notas importantes', {
        error: error.message,
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar notas importantes',
        error: error.message
      });
    }
  }

  // Buscar notas por categoria
  async getNotesByCategory(req, res) {
    try {
      const groupedNotes = await noteService.getNotesByCategory();
      res.status(200).json({
        success: true,
        message: 'Notas agrupadas por categoria recuperadas com sucesso',
        data: groupedNotes
      });
    } catch (error) {
      logger.error('Erro no controller ao buscar notas por categoria', {
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar notas por categoria',
        error: error.message
      });
    }
  }

  // Atualizar nota específica de um lead (endpoint alternativo)
  async updateLeadNote(req, res) {
    try {
      const { leadId, noteId } = req.params;

      // Verificar se a nota pertence ao lead
      const note = await noteService.getNoteById(noteId);

      if (!note) {
        return res.status(404).json({
          success: false,
          message: 'Nota não encontrada',
          error: 'Nota com o ID fornecido não existe'
        });
      }

      if (note.leadId !== leadId) {
        return res.status(400).json({
          success: false,
          message: 'Nota não pertence ao lead especificado',
          error: 'ID do lead não corresponde à nota'
        });
      }

      const updatedNote = await noteService.updateNote(noteId, req.body);

      res.status(200).json({
        success: true,
        message: 'Nota do lead atualizada com sucesso',
        data: updatedNote
      });
    } catch (error) {
      logger.error('Erro no controller ao atualizar nota do lead', {
        error: error.message,
        leadId: req.params.leadId,
        noteId: req.params.noteId,
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao atualizar nota do lead',
        error: error.message
      });
    }
  }

  // Deletar nota específica de um lead (endpoint alternativo)
  async deleteLeadNote(req, res) {
    try {
      const { leadId, noteId } = req.params;

      // Verificar se a nota pertence ao lead
      const note = await noteService.getNoteById(noteId);

      if (!note) {
        return res.status(404).json({
          success: false,
          message: 'Nota não encontrada',
          error: 'Nota com o ID fornecido não existe'
        });
      }

      if (note.leadId !== leadId) {
        return res.status(400).json({
          success: false,
          message: 'Nota não pertence ao lead especificado',
          error: 'ID do lead não corresponde à nota'
        });
      }

      const result = await noteService.deleteNote(noteId);

      res.status(200).json({
        success: true,
        message: 'Nota do lead deletada com sucesso',
        data: { deleted: true }
      });
    } catch (error) {
      logger.error('Erro no controller ao deletar nota do lead', {
        error: error.message,
        leadId: req.params.leadId,
        noteId: req.params.noteId
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao deletar nota do lead',
        error: error.message
      });
    }
  }
}

module.exports = new NoteController();