import { Response, NextFunction } from 'express';
import { UsersService } from './users.service';
import { AuthenticatedRequest } from '../../middleware/auth';

const usersService = new UsersService();

export class UsersController {
  /**
   * GET /users
   */
  async getUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, role, isActive, page, limit } = req.query;

      const result = await usersService.getUsers({
        search: search as string,
        role: role as any,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json({
        success: true,
        message: 'Usuários obtidos com sucesso',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /users/:id
   */
  async getUserById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = await usersService.getUserById(id);

      res.json({
        success: true,
        message: 'Usuário obtido com sucesso',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /users
   */
  async createUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, username, password, name, role } = req.body;
      const user = await usersService.createUser({ email, username, password, name, role });

      res.status(201).json({
        success: true,
        message: 'Usuário criado com sucesso',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /users/:id
   */
  async updateUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { email, username, name, role, avatar, isActive } = req.body;

      const user = await usersService.updateUser(id, {
        email,
        username,
        name,
        role,
        avatar,
        isActive,
      });

      res.json({
        success: true,
        message: 'Usuário atualizado com sucesso',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /users/:id
   */
  async deleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await usersService.deleteUser(id);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}
