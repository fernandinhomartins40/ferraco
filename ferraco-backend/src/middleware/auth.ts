import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';
import prisma from '../config/database';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
  };
}

/**
 * Middleware de autenticação JWT
 * Verifica o token e adiciona as informações do usuário à request
 */
export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Tentar obter token do cookie primeiro, depois do header Authorization
    let token = req.cookies?.ferraco_auth_token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Token não fornecido',
        error: 'Unauthorized',
      });
      return;
    }

    // Verificar token
    const decoded = jwt.verify(token, jwtConfig.secret) as any;

    // Buscar usuário no banco de dados
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Usuário inválido ou inativo',
        error: 'Unauthorized',
      });
      return;
    }

    // Adicionar informações do usuário à request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions.map(
        (up) => `${up.permission.resource}:${up.permission.action}`
      ),
    };

    next();
  } catch (error: any) {
    logger.error('Auth middleware error:', error);

    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        success: false,
        message: 'Token inválido',
        error: 'Unauthorized',
      });
      return;
    }

    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Token expirado',
        error: 'Unauthorized',
      });
      return;
    }

    res.status(401).json({
      success: false,
      message: 'Erro ao autenticar',
      error: 'Unauthorized',
    });
  }
}

/**
 * Middleware para verificar permissões específicas
 */
export function requirePermission(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Não autenticado',
        error: 'Unauthorized',
      });
      return;
    }

    // Admin tem todas as permissões
    if (user.role === 'ADMIN') {
      next();
      return;
    }

    // Verificar se o usuário tem a permissão específica
    if (user.permissions.includes(permission)) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      message: 'Permissão negada',
      error: 'Forbidden',
    });
  };
}

/**
 * Middleware para verificar role específica
 */
export function requireRole(roles: string | string[]) {
  const roleArray = Array.isArray(roles) ? roles : [roles];

  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Não autenticado',
        error: 'Unauthorized',
      });
      return;
    }

    if (roleArray.includes(user.role)) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      message: 'Role insuficiente',
      error: 'Forbidden',
    });
  };
}
