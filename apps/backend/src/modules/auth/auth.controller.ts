import { Request, Response } from 'express';
import { authService } from './auth.service';
import { refreshTokenService } from './refresh-token.service';
import { validatePasswordStrength } from '../../utils/password';
import {
  successResponse,
  errorResponse,
  createdResponse,
  unauthorizedResponse,
  badRequestResponse
} from '../../utils/response';

// ============================================================================
// AUTH CONTROLLER
// ============================================================================

export class AuthController {
  /**
   * POST /api/auth/login
   * User login (aceita email ou username)
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, username, password } = req.body;
      const emailOrUsername = email || username;

      const result = await authService.login(emailOrUsername, password);

      if (!result) {
        unauthorizedResponse(res, 'Invalid credentials');
        return;
      }

      successResponse(res, result, 'Login successful');
    } catch (error) {
      errorResponse(res, error instanceof Error ? error.message : 'Login failed');
    }
  }

  /**
   * POST /api/auth/register
   * User registration
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password, name, role } = req.body;

      // Validate password strength
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.valid) {
        badRequestResponse(res, 'Weak password', passwordValidation.errors);
        return;
      }

      const result = await authService.register({
        username,
        email,
        password,
        name,
        role,
      });

      createdResponse(res, result, 'Registration successful');
    } catch (error) {
      errorResponse(res, error instanceof Error ? error.message : 'Registration failed');
    }
  }

  /**
   * POST /api/auth/refresh
   * Refresh access token
   */
  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      const result = await refreshTokenService.rotateRefreshToken(refreshToken);

      if (!result) {
        unauthorizedResponse(res, 'Invalid refresh token');
        return;
      }

      successResponse(res, result, 'Token refreshed successfully');
    } catch (error) {
      errorResponse(res, error instanceof Error ? error.message : 'Token refresh failed');
    }
  }

  /**
   * POST /api/auth/logout
   * User logout
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      await authService.logout(refreshToken);

      successResponse(res, null, 'Logout successful');
    } catch (error) {
      errorResponse(res, error instanceof Error ? error.message : 'Logout failed');
    }
  }

  /**
   * GET /api/auth/me
   * Get current user
   */
  async me(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        unauthorizedResponse(res, 'Not authenticated');
        return;
      }

      const user = await authService.getUserById(req.user.userId);

      successResponse(res, user, 'User retrieved successfully');
    } catch (error) {
      errorResponse(res, error instanceof Error ? error.message : 'Failed to get user');
    }
  }

  /**
   * PUT /api/auth/change-password
   * Change user password
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        unauthorizedResponse(res, 'Not authenticated');
        return;
      }

      const { currentPassword, newPassword } = req.body;

      // Validate new password strength
      const passwordValidation = validatePasswordStrength(newPassword);
      if (!passwordValidation.valid) {
        badRequestResponse(res, 'Weak password', passwordValidation.errors);
        return;
      }

      await authService.changePassword(
        req.user.userId,
        currentPassword,
        newPassword
      );

      successResponse(res, null, 'Password changed successfully');
    } catch (error) {
      errorResponse(res, error instanceof Error ? error.message : 'Password change failed');
    }
  }

  /**
   * PUT /api/auth/profile
   * Update user profile
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        unauthorizedResponse(res, 'Not authenticated');
        return;
      }

      const { name, avatar, phone } = req.body;

      const user = await authService.updateProfile(req.user.userId, {
        name,
        avatar,
        phone,
      });

      successResponse(res, user, 'Profile updated successfully');
    } catch (error) {
      errorResponse(res, error instanceof Error ? error.message : 'Profile update failed');
    }
  }

  /**
   * POST /api/auth/forgot-password
   * Request password reset
   */
  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      await authService.forgotPassword(email);

      successResponse(
        res,
        null,
        'If the email exists, a password reset link has been sent'
      );
    } catch (error) {
      errorResponse(res, error instanceof Error ? error.message : 'Password reset request failed');
    }
  }

  /**
   * POST /api/auth/reset-password
   * Reset password with token
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, password } = req.body;

      // Validate password strength
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.valid) {
        badRequestResponse(res, 'Weak password', passwordValidation.errors);
        return;
      }

      await authService.resetPassword(token, password);

      successResponse(res, null, 'Password reset successfully');
    } catch (error) {
      errorResponse(res, error instanceof Error ? error.message : 'Password reset failed');
    }
  }

  /**
   * POST /api/auth/complete-first-login
   * Mark first login as complete
   */
  async completeFirstLogin(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        unauthorizedResponse(res, 'Not authenticated');
        return;
      }

      await authService.completeFirstLogin(req.user.userId);

      successResponse(res, null, 'First login completed');
    } catch (error) {
      errorResponse(res, error instanceof Error ? error.message : 'Failed to complete first login');
    }
  }

  /**
   * GET /api/auth/sessions
   * Get active sessions
   */
  async getSessions(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        unauthorizedResponse(res, 'Not authenticated');
        return;
      }

      const sessions = await refreshTokenService.getUserActiveTokens(req.user.userId);

      successResponse(res, sessions, 'Sessions retrieved successfully');
    } catch (error) {
      errorResponse(res, error instanceof Error ? error.message : 'Failed to get sessions');
    }
  }

  /**
   * POST /api/auth/revoke-all-sessions
   * Revoke all user sessions
   */
  async revokeAllSessions(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        unauthorizedResponse(res, 'Not authenticated');
        return;
      }

      await refreshTokenService.revokeAllUserRefreshTokens(req.user.userId);

      successResponse(res, null, 'All sessions revoked successfully');
    } catch (error) {
      errorResponse(res, error instanceof Error ? error.message : 'Failed to revoke sessions');
    }
  }
}

export const authController = new AuthController();
