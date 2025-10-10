import { Request, Response, NextFunction } from 'express';
import { NotesService } from './notes.service';
import {
  CreateNoteSchema,
  UpdateNoteSchema,
  NoteFiltersSchema,
  NoteIdParamSchema,
  LeadIdParamSchema,
  SearchNotesSchema,
} from './notes.validators';
import { CreateNoteDTO, UpdateNoteDTO } from './notes.types';
import { successResponse, createdResponse, noContentResponse } from '../../utils/response';

// ============================================================================
// NotesController
// ============================================================================

export class NotesController {
  constructor(private service: NotesService) {}

  // ==========================================================================
  // CRUD Operations
  // ==========================================================================

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = CreateNoteSchema.parse(req.body);
      const data: CreateNoteDTO = validatedData as CreateNoteDTO;
      const note = await this.service.create(data, req.user!.userId);

      createdResponse(res, note, 'Nota criada com sucesso');
    } catch (error) {
      next(error);
    }
  };

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = NoteFiltersSchema.parse(req.query);
      const result = await this.service.findAll(filters);

      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  };

  findByLeadId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { leadId } = LeadIdParamSchema.parse(req.params);
      const notes = await this.service.findByLeadId(leadId);

      successResponse(res, notes);
    } catch (error) {
      next(error);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = NoteIdParamSchema.parse(req.params);
      const note = await this.service.findById(id);

      if (!note) {
        res.status(404).json({
          success: false,
          message: 'Nota não encontrada',
        });
        return;
      }

      successResponse(res, note);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = NoteIdParamSchema.parse(req.params);
      const validatedData = UpdateNoteSchema.parse(req.body);
      const data: UpdateNoteDTO = validatedData as UpdateNoteDTO;
      const note = await this.service.update(id, data);

      successResponse(res, note, 'Nota atualizada com sucesso');
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = NoteIdParamSchema.parse(req.params);
      await this.service.delete(id);

      noContentResponse(res);
    } catch (error) {
      next(error);
    }
  };

  // ==========================================================================
  // Special Operations
  // ==========================================================================

  toggleImportant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = NoteIdParamSchema.parse(req.params);
      const note = await this.service.toggleImportant(id);

      successResponse(res, note, 'Status de importância alterado com sucesso');
    } catch (error) {
      next(error);
    }
  };

  duplicate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = NoteIdParamSchema.parse(req.params);
      const note = await this.service.duplicate(id, req.user!.userId);

      createdResponse(res, note, 'Nota duplicada com sucesso');
    } catch (error) {
      next(error);
    }
  };

  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { query, leadId, limit } = SearchNotesSchema.parse(req.query);
      const notes = await this.service.search(query, leadId, limit);

      successResponse(res, notes);
    } catch (error) {
      next(error);
    }
  };

  getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = await this.service.getCategories();

      successResponse(res, categories);
    } catch (error) {
      next(error);
    }
  };

  findImportant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const leadId = req.query.leadId as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const notes = await this.service.findImportant(leadId, limit);

      successResponse(res, notes);
    } catch (error) {
      next(error);
    }
  };

  getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const leadId = req.query.leadId as string | undefined;
      const stats = await this.service.getStats(leadId);

      successResponse(res, stats);
    } catch (error) {
      next(error);
    }
  };
}
