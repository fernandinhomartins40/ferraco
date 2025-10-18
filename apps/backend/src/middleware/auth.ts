import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractTokenFromHeader, JWTPayload } from '../config/jwt';
import { unauthorizedResponse, forbiddenResponse } from '../utils/response';
import { prisma } from '../config/database';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      permissions?: string[];
    }
  }
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    const payload = verifyAccessToken(token);

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      unauthorizedResponse(res, 'User not found or inactive');
      return;
    }

    req.user = payload;
    req.permissions = payload.permissions;

    next();
  } catch (error) {
    if (error instanceof Error) {
      unauthorizedResponse(res, error.message);
    } else {
      unauthorizedResponse(res, 'Authentication failed');
    }
  }
}

export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      next();
      return;
    }

    const token = extractTokenFromHeader(authHeader);
    const payload = verifyAccessToken(token);

    req.user = payload;
    req.permissions = payload.permissions;

    next();
  } catch (_error) {
    // Silently fail for optional auth
    next();
  }
}

export function requirePermission(resource: string, action: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.permissions) {
      unauthorizedResponse(res);
      return;
    }

    const permissionString = `${resource}:${action}`;
    const hasPermission = req.permissions.some(
      (p: string) => p === permissionString || p === `${resource}:*` || p === '*:*'
    );

    if (!hasPermission) {
      forbiddenResponse(res, `Missing permission: ${permissionString}`);
      return;
    }

    next();
  };
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      unauthorizedResponse(res);
      return;
    }

    if (!roles.includes(req.user.role)) {
      forbiddenResponse(res, `Required role: ${roles.join(' or ')}`);
      return;
    }

    next();
  };
}

export function requireOwnership(resourceIdParam: string = 'id') {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      unauthorizedResponse(res);
      return;
    }

    // Admins bypass ownership check
    if (req.user.role === 'ADMIN') {
      next();
      return;
    }

    const resourceId = req.params[resourceIdParam];
    const userId = req.user.userId;

    // This is a simplified check - in production, you'd check against the actual resource
    // For example, check if a lead belongs to the user
    try {
      // Example: Check lead ownership
      if (req.baseUrl.includes('/leads')) {
        const lead = await prisma.lead.findUnique({
          where: { id: resourceId },
          select: { assignedToId: true, createdById: true },
        });

        if (!lead) {
          forbiddenResponse(res, 'Resource not found');
          return;
        }

        if (lead.assignedToId !== userId && lead.createdById !== userId) {
          forbiddenResponse(res, 'You do not own this resource');
          return;
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
