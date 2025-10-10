import { prisma } from '../../config/database';
import { generateTokenPair } from '../../config/jwt';
import { permissionsService } from './permissions.service';
import { RefreshTokenResponse } from './auth.types';

// ============================================================================
// REFRESH TOKEN SERVICE
// ============================================================================

export class RefreshTokenService {
  /**
   * Create and save refresh token
   */
  async createRefreshToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  /**
   * Validate refresh token
   */
  async validateRefreshToken(token: string): Promise<{ userId: string } | null> {
    const refreshToken = await prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!refreshToken) {
      return null;
    }

    // Check if revoked
    if (refreshToken.revokedAt) {
      return null;
    }

    // Check if expired
    if (refreshToken.expiresAt < new Date()) {
      return null;
    }

    return { userId: refreshToken.userId };
  }

  /**
   * Revoke refresh token
   */
  async revokeRefreshToken(token: string): Promise<void> {
    try {
      await prisma.refreshToken.update({
        where: { token },
        data: {
          revokedAt: new Date(),
        },
      });
    } catch (error) {
      // Token might not exist, ignore error
    }
  }

  /**
   * Revoke all user refresh tokens
   */
  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  /**
   * Rotate refresh token (revoke old, create new)
   */
  async rotateRefreshToken(oldToken: string): Promise<RefreshTokenResponse | null> {
    // Validate old token
    const tokenData = await this.validateRefreshToken(oldToken);

    if (!tokenData) {
      return null;
    }

    // Get user with permissions
    const user = await prisma.user.findUnique({
      where: { id: tokenData.userId },
    });

    if (!user || !user.isActive) {
      return null;
    }

    // Revoke old token
    await this.revokeRefreshToken(oldToken);

    // Get user permissions
    const permissions = await permissionsService.getUserPermissions(user.id);

    // Generate new token pair
    const tokens = generateTokenPair(user, permissions);

    // Save new refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    await this.createRefreshToken(user.id, tokens.refreshToken, expiresAt);

    return tokens;
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          {
            AND: [
              { revokedAt: { not: null } },
              { revokedAt: { lt: thirtyDaysAgo } }
            ]
          },
        ],
      },
    });

    return result.count;
  }

  /**
   * Get active refresh tokens count for user
   */
  async getUserActiveTokensCount(userId: string): Promise<number> {
    const count = await prisma.refreshToken.count({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    return count;
  }

  /**
   * Get all active refresh tokens for user
   */
  async getUserActiveTokens(userId: string) {
    const tokens = await prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
        lastUsedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return tokens;
  }

  /**
   * Update last used timestamp
   */
  async updateLastUsed(token: string): Promise<void> {
    try {
      await prisma.refreshToken.update({
        where: { token },
        data: {
          lastUsedAt: new Date(),
        },
      });
    } catch (error) {
      // Ignore if token doesn't exist
    }
  }
}

export const refreshTokenService = new RefreshTokenService();
