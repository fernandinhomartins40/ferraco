import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';
import {
  CreateUserSchema,
  UpdateUserSchema,
  UpdatePasswordSchema,
  UserFiltersSchema,
  UserIdParamSchema,
} from './users.validators';
import { z } from 'zod';
import { logger } from '../../utils/logger';
import {
  successResponse,
  createdResponse,
  notFoundResponse,
  badRequestResponse,
  paginatedResponse,
  noContentResponse,
} from '../../utils/response';

// ============================================================================
// UsersController
// ============================================================================

export class UsersController {
  constructor(private service: UsersService) {}

  // ==========================================================================
  // CRUD Operations
  // ==========================================================================

  /**
   * GET /api/users
   * List all users with filters and pagination
   */
  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = UserFiltersSchema.parse(req.query);
      const result = await this.service.findAll(filters);

      paginatedResponse(res, result.data, result.page, result.limit, result.total);
    } catch (error) {
      if (error instanceof z.ZodError) {
        badRequestResponse(res, 'Erro de validação', error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        })));
        return;
      }

      next(error);
    }
  };

  /**
   * GET /api/users/:id
   * Get a user by ID
   */
  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = UserIdParamSchema.parse(req.params);
      const user = await this.service.findById(id);

      if (!user) {
        notFoundResponse(res, 'Usuário não encontrado');
        return;
      }

      successResponse(res, user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        badRequestResponse(res, 'Erro de validação', error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        })));
        return;
      }

      next(error);
    }
  };

  /**
   * POST /api/users
   * Create a new user
   */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = CreateUserSchema.parse(req.body);
      const user = await this.service.create(validatedData);

      createdResponse(res, user, 'Usuário criado com sucesso');
    } catch (error) {
      if (error instanceof z.ZodError) {
        badRequestResponse(res, 'Erro de validação', error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        })));
        return;
      }

      if (error instanceof Error && (
        error.message.includes('já está em uso') ||
        error.message.includes('already exists')
      )) {
        badRequestResponse(res, error.message);
        return;
      }

      next(error);
    }
  };

  /**
   * PUT /api/users/:id
   * Update a user
   */
  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = UserIdParamSchema.parse(req.params);
      const validatedData = UpdateUserSchema.parse(req.body);

      const user = await this.service.update(id, validatedData);

      successResponse(res, user, 'Usuário atualizado com sucesso');
    } catch (error) {
      if (error instanceof z.ZodError) {
        badRequestResponse(res, 'Erro de validação', error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        })));
        return;
      }

      if (error instanceof Error && error.message.includes('não encontrado')) {
        notFoundResponse(res, error.message);
        return;
      }

      if (error instanceof Error && error.message.includes('já está em uso')) {
        badRequestResponse(res, error.message);
        return;
      }

      next(error);
    }
  };

  /**
   * DELETE /api/users/:id
   * Soft delete a user
   */
  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = UserIdParamSchema.parse(req.params);

      await this.service.delete(id);

      noContentResponse(res);
    } catch (error) {
      if (error instanceof z.ZodError) {
        badRequestResponse(res, 'Erro de validação', error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        })));
        return;
      }

      if (error instanceof Error && error.message.includes('não encontrado')) {
        notFoundResponse(res, error.message);
        return;
      }

      next(error);
    }
  };

  /**
   * PUT /api/users/:id/password
   * Update user password
   */
  updatePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = UserIdParamSchema.parse(req.params);
      const validatedData = UpdatePasswordSchema.parse(req.body);

      await this.service.updatePassword(id, validatedData);

      successResponse(res, null, 'Senha atualizada com sucesso');
    } catch (error) {
      if (error instanceof z.ZodError) {
        badRequestResponse(res, 'Erro de validação', error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        })));
        return;
      }

      if (error instanceof Error && error.message.includes('não encontrado')) {
        notFoundResponse(res, error.message);
        return;
      }

      if (error instanceof Error && error.message.includes('incorreta')) {
        badRequestResponse(res, error.message);
        return;
      }

      next(error);
    }
  };

  /**
   * PUT /api/users/:id/activate
   * Activate a user
   */
  activate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = UserIdParamSchema.parse(req.params);
      const user = await this.service.activate(id);

      successResponse(res, user, 'Usuário ativado com sucesso');
    } catch (error) {
      if (error instanceof z.ZodError) {
        badRequestResponse(res, 'Erro de validação', error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        })));
        return;
      }

      next(error);
    }
  };

  /**
   * PUT /api/users/:id/deactivate
   * Deactivate a user
   */
  deactivate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = UserIdParamSchema.parse(req.params);
      const user = await this.service.deactivate(id);

      successResponse(res, user, 'Usuário desativado com sucesso');
    } catch (error) {
      if (error instanceof z.ZodError) {
        badRequestResponse(res, 'Erro de validação', error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        })));
        return;
      }

      next(error);
    }
  };

  /**
   * GET /api/users/stats
   * Get user statistics
   */
  getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.service.getStats();

      successResponse(res, stats);
    } catch (error) {
      next(error);
    }
  };
}
