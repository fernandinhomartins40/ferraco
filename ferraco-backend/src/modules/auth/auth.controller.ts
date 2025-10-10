import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { AuthenticatedRequest } from '../../middleware/auth';
import refreshTokenService from './refresh-token.service';

const authService = new AuthService();

export class AuthController {
  /**
   * POST /auth/login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      // Token retornado no JSON - frontend salva no localStorage
      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/register
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, username, password, name } = req.body;
      const user = await authService.register({ email, username, password, name });

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
   * GET /auth/me
   */
  async me(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const user = await authService.me(userId);

      res.json({
        success: true,
        message: 'Usuário autenticado',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/logout
   * 🔐 ATUALIZADO: Revoga refresh token
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await refreshTokenService.revoke(refreshToken);
      }

      res.json({
        success: true,
        message: 'Logout realizado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/refresh
   * 🔐 NOVO: Endpoint para renovar access token
   */
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token é obrigatório',
        });
        return;
      }

      const result = await refreshTokenService.refresh(refreshToken);

      res.json({
        success: true,
        message: 'Token renovado com sucesso',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/change-password
   */
  async changePassword(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword } = req.body;

      const result = await authService.changePassword(userId, currentPassword, newPassword);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}
