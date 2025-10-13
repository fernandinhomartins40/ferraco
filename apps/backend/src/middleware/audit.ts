import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'apiKey'];

function sanitizeData(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...data };

  for (const field of SENSITIVE_FIELDS) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

export async function auditLogger(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const startTime = Date.now();

  // Capture response
  const originalSend = res.json;
  let responseBody: unknown;

  res.json = function (body: unknown) {
    responseBody = body;
    return originalSend.call(this, body);
  };

  res.on('finish', async () => {
    const duration = Date.now() - startTime;
    const userId = req.user?.userId;

    // Only log authenticated requests or failed auth attempts
    if (userId || (req.url.includes('/auth') && res.statusCode >= 400)) {
      try {
        await prisma.auditLog.create({
          data: {
            userId: userId || 'anonymous',
            userName: req.user?.name || req.user?.email || 'anonymous',
            action: `${req.method} ${req.url}`,
            resource: extractResource(req.url) || 'unknown',
            resourceId: req.params.id || 'none',
            ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
            userAgent: req.headers['user-agent'] || 'unknown',
            method: req.method,
            path: req.url,
            statusCode: res.statusCode,
            requestBody: sanitizeData(req.body || {}),
            responseBody: res.statusCode >= 400 ? responseBody : null,
            duration,
          },
        });
      } catch (error) {
        logger.error('Failed to create audit log:', error);
      }
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      logger.info(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    }
  });

  next();
}

function extractResource(url: string): string | null {
  const match = url.match(/\/api\/([^/?]+)/);
  return match ? match[1] : null;
}
