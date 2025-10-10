import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import prisma from '../../config/database';
import { jwtConfig } from '../../config/jwt';
import { AppError } from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';

export class RefreshTokenService {
  /**
   * Gerar novo refresh token
   */
  async generate(userId: string): Promise<string> {
    // Gerar token aleatório seguro
    const token = randomBytes(40).toString('hex');

    // Expiração: 30 dias
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Salvar no banco
    await prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });

    logger.info('Refresh token generated', { userId });

    return token;
  }

  /**
   * Validar refresh token e gerar novo access token
   */
  async refresh(refreshToken: string): Promise<{
    accessToken: string;
    expiresIn: string;
    user: {
      id: string;
      email: string;
      username: string;
      name: string;
      role: string;
      avatar: string | null;
      permissions: string[];
    };
  }> {
    // Buscar refresh token no banco
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    // Validações
    if (!tokenRecord) {
      logger.warn('Refresh token not found', { token: refreshToken.substring(0, 10) + '...' });
      throw new AppError(401, 'Refresh token inválido');
    }

    if (tokenRecord.expiresAt < new Date()) {
      logger.warn('Refresh token expired', { userId: tokenRecord.userId });
      // Limpar token expirado
      await this.revoke(refreshToken);
      throw new AppError(401, 'Refresh token expirado');
    }

    if (!tokenRecord.user.isActive) {
      logger.warn('Refresh token for inactive user', { userId: tokenRecord.user.id });
      throw new AppError(401, 'Usuário inativo');
    }

    // Gerar novo access token
    const permissions = tokenRecord.user.permissions.map(
      (up) => `${up.permission.resource}:${up.permission.action}`
    );

    const payload = {
      userId: tokenRecord.user.id,
      email: tokenRecord.user.email,
      role: tokenRecord.user.role,
      permissions,
    };

    const accessToken = jwt.sign(payload, jwtConfig.secret, {
      expiresIn: '15m', // Access token de curta duração
    } as jwt.SignOptions);

    logger.info('Access token refreshed', {
      userId: tokenRecord.user.id,
      email: tokenRecord.user.email,
    });

    return {
      accessToken,
      expiresIn: '15m',
      user: {
        id: tokenRecord.user.id,
        email: tokenRecord.user.email,
        username: tokenRecord.user.username,
        name: tokenRecord.user.name,
        role: tokenRecord.user.role,
        avatar: tokenRecord.user.avatar,
        permissions,
      },
    };
  }

  /**
   * Revogar refresh token (logout)
   */
  async revoke(refreshToken: string): Promise<void> {
    try {
      await prisma.refreshToken.delete({
        where: { token: refreshToken },
      });

      logger.info('Refresh token revoked', { token: refreshToken.substring(0, 10) + '...' });
    } catch (error) {
      // Token já foi deletado ou não existe
      logger.warn('Attempted to revoke non-existent refresh token');
    }
  }

  /**
   * Revogar todos os refresh tokens de um usuário
   */
  async revokeAllForUser(userId: string): Promise<void> {
    const result = await prisma.refreshToken.deleteMany({
      where: { userId },
    });

    logger.info('All refresh tokens revoked for user', { userId, count: result.count });
  }

  /**
   * Limpar tokens expirados (executar periodicamente)
   */
  async cleanExpired(): Promise<number> {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    if (result.count > 0) {
      logger.info('Expired refresh tokens cleaned', { count: result.count });
    }

    return result.count;
  }
}

export default new RefreshTokenService();
