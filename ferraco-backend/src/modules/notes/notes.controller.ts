import { Response, NextFunction } from 'express';
import { NotesService } from './notes.service';
import { AuthenticatedRequest } from '../../middleware/auth';

const notesService = new NotesService();

export class NotesController {
  /**
   * GET /notes
   */
  async getNotes(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { leadId, important, category, search, page, limit } = req.query;

      const result = await notesService.getNotes({
        leadId: leadId as string,
        important: important === 'true' ? true : important === 'false' ? false : undefined,
        category: category as string,
        search: search as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json({
        success: true,
        message: 'Notas obtidas com sucesso',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /notes/:id
   */
  async getNoteById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const note = await notesService.getNoteById(id);

      res.json({
        success: true,
        message: 'Nota obtida com sucesso',
        data: { note },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /leads/:leadId/notes
   */
  async getLeadNotes(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { leadId } = req.params;
      const notes = await notesService.getLeadNotes(leadId);

      res.json({
        success: true,
        message: 'Notas do lead obtidas com sucesso',
        data: { notes },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /leads/:leadId/notes
   */
  async createLeadNote(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { leadId } = req.params;
      const { content, important, category, isPrivate } = req.body;

      const note = await notesService.createLeadNote(leadId, {
        content,
        important,
        category,
        isPrivate,
        createdById: req.user!.id,
      });

      res.status(201).json({
        success: true,
        message: 'Nota criada com sucesso',
        data: { note },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /notes/:id
   */
  async updateNote(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { content, important, category, isPrivate } = req.body;

      const note = await notesService.updateNote(id, {
        content,
        important,
        category,
        isPrivate,
      });

      res.json({
        success: true,
        message: 'Nota atualizada com sucesso',
        data: { note },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /notes/:id/importance
   */
  async toggleNoteImportance(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const note = await notesService.toggleNoteImportance(id);

      res.json({
        success: true,
        message: 'Importância da nota alterada com sucesso',
        data: { note },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /notes/:id
   */
  async deleteNote(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const result = await notesService.deleteNote(id);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /notes/:id/duplicate
   */
  async duplicateNote(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const note = await notesService.duplicateNote(id, req.user!.id);

      res.status(201).json({
        success: true,
        message: 'Nota duplicada com sucesso',
        data: { note },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /notes/stats
   */
  async getNoteStats(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const stats = await notesService.getNoteStats();

      res.json({
        success: true,
        message: 'Estatísticas obtidas com sucesso',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /notes/categories
   */
  async getCategories(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const categories = await notesService.getCategories();

      res.json({
        success: true,
        message: 'Categorias obtidas com sucesso',
        data: { categories },
      });
    } catch (error) {
      next(error);
    }
  }
}
