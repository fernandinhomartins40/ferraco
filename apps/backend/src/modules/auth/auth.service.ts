import { UserRole } from '@prisma/client';
import { prisma } from '../../config/database';
import { hashPassword, comparePassword } from '../../utils/password';
import { generateTokenPair } from '../../config/jwt';
import { refreshTokenService } from './refresh-token.service';
import { permissionsService } from './permissions.service';
import {
  IAuthService,
  LoginResponse,
  RegisterResponse,
  RegisterData,
  UserWithPermissions
} from './auth.types';

// ============================================================================
// AUTH SERVICE
// ============================================================================

export class AuthService implements IAuthService {
  /**
   * User login
   */
  async login(email: string, password: string): Promise<LoginResponse | null> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('User account is inactive');
    }

    // Get user permissions
    const permissions = await permissionsService.getUserPermissions(user.id);

    // Generate token pair
    const tokens = generateTokenPair(user, permissions);

    // Save refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    await refreshTokenService.createRefreshToken(user.id, tokens.refreshToken, expiresAt);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Return response without password
    const { password: _, ...safeUser } = user;

    return {
      ...tokens,
      user: {
        ...safeUser,
        permissions,
      },
    };
  }

  /**
   * User registration
   */
  async register(data: RegisterData): Promise<RegisterResponse> {
    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingEmail) {
      throw new Error('Email already registered');
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUsername) {
      throw new Error('Username already taken');
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: data.role || UserRole.CONSULTANT,
      },
    });

    // Get user permissions
    const permissions = await permissionsService.getUserPermissions(user.id);

    // Generate token pair
    const tokens = generateTokenPair(user, permissions);

    // Save refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    await refreshTokenService.createRefreshToken(user.id, tokens.refreshToken, expiresAt);

    // Return response without password
    const { password: _, ...safeUser } = user;

    return {
      ...tokens,
      user: {
        ...safeUser,
        permissions,
      },
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    return refreshTokenService.rotateRefreshToken(refreshToken);
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Revoke all refresh tokens (force re-login on all devices)
    await refreshTokenService.revokeAllUserRefreshTokens(userId);
  }

  /**
   * Logout user
   */
  async logout(refreshToken: string): Promise<void> {
    await refreshTokenService.revokeRefreshToken(refreshToken);
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserWithPermissions> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        isFirstLogin: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const permissions = await permissionsService.getUserPermissions(userId);

    return {
      ...user,
      permissions,
    };
  }

  /**
   * Forgot password - generate reset token
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists or not
      return;
    }

    // Generate reset token (you would implement this)
    // For now, just a placeholder
    // In production, you'd generate a unique token and send it via email

    // TODO: Implement password reset token generation and email sending
    // Example: Generate a unique token, save to DB, send email
    console.log(`Password reset requested for user: ${user.email}`);
  }

  /**
   * Reset password with token
   */
  async resetPassword(_token: string, _newPassword: string): Promise<void> {
    // TODO: Implement password reset with token validation
    throw new Error('Password reset not implemented yet');
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    data: {
      name?: string;
      avatar?: string | null;
      phone?: string | null;
    }
  ): Promise<UserWithPermissions> {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        isFirstLogin: true,
      },
    });

    const permissions = await permissionsService.getUserPermissions(userId);

    return {
      ...user,
      permissions,
    };
  }

  /**
   * Mark first login as complete
   */
  async completeFirstLogin(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { isFirstLogin: false },
    });
  }

  /**
   * Deactivate user account
   */
  async deactivateUser(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    // Revoke all refresh tokens
    await refreshTokenService.revokeAllUserRefreshTokens(userId);
  }

  /**
   * Activate user account
   */
  async activateUser(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });
  }
}

export const authService = new AuthService();
