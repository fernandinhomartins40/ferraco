import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { AuthenticatedRequest } from '../../middleware/auth';

const authService = new AuthService();

export class AuthController {
  /**
   * POST /auth/login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      // Salvar token em cookie HTTP-only seguro
      res.cookie('ferraco_auth_token', result.token, {
        httpOnly: true,       // Não acessível via JavaScript
        secure: process.env.NODE_ENV === 'production', // HTTPS apenas em produção
        sameSite: 'lax',      // Proteção CSRF
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
        path: '/',
        domain: process.env.COOKIE_DOMAIN || undefined // Domínio do cookie para produção
      });

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
   */
  async logout(_req: Request, res: Response): Promise<void> {
    // Limpar cookie do token
    res.clearCookie('ferraco_auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      domain: process.env.COOKIE_DOMAIN || undefined
    });

    res.json({
      success: true,
      message: 'Logout realizado com sucesso',
    });
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
