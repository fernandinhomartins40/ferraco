import { Request, Response, NextFunction } from 'express';
import { apiKeyService } from '../modules/api-keys';

export interface ApiKeyAuthRequest extends Request {
  apiKey?: {
    id: string;
    userId: string;
    scopes: string[];
    type: string;
  };
  isApiKeyAuth?: boolean;
}

/**
 * Middleware de autenticação via API Key
 * Suporta dois formatos:
 * 1. Header: Authorization: Bearer pk_live_xxx:sk_live_yyy
 * 2. Headers separados: X-API-Key: pk_live_xxx, X-API-Secret: sk_live_yyy
 */
export const authenticateApiKey = async (
  req: ApiKeyAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let key: string | undefined;
    let secret: string | undefined;

    // Método 1: Authorization header com formato "Bearer pk:sk"
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (token.includes(':')) {
        [key, secret] = token.split(':');
      }
    }

    // Método 2: Headers separados
    if (!key || !secret) {
      key = req.headers['x-api-key'] as string;
      secret = req.headers['x-api-secret'] as string;
    }

    if (!key || !secret) {
      res.status(401).json({
        success: false,
        error: 'API Key and Secret are required',
        code: 'MISSING_API_CREDENTIALS',
      });
      return;
    }

    // Valida API Key
    const validation = await apiKeyService.validateApiKey(key, secret);

    if (!validation.isValid || !validation.apiKey) {
      res.status(401).json({
        success: false,
        error: validation.error || 'Invalid API credentials',
        code: 'INVALID_API_CREDENTIALS',
      });
      return;
    }

    // Verifica rate limit
    const { allowed, remaining } = await apiKeyService.checkRateLimit(validation.apiKey.id);

    // Adiciona headers de rate limit
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', new Date(Date.now() + 3600000).toISOString());

    if (!allowed) {
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        meta: {
          remaining: 0,
          resetAt: new Date(Date.now() + 3600000).toISOString(),
        },
      });
      return;
    }

    // Anexa informações da API Key ao request
    req.apiKey = validation.apiKey;
    req.isApiKeyAuth = true;

    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Internal server error during API key authentication',
      code: 'AUTH_ERROR',
    });
  }
};

/**
 * Middleware que verifica se a API Key tem um scope específico
 */
export const requireApiKeyScope = (requiredScope: string) => {
  return (req: ApiKeyAuthRequest, res: Response, next: NextFunction): void => {
    if (!req.apiKey) {
      res.status(401).json({
        success: false,
        error: 'API Key authentication required',
        code: 'MISSING_API_KEY',
      });
      return;
    }

    const hasScope = apiKeyService.hasScope(req.apiKey.scopes, requiredScope);

    if (!hasScope) {
      res.status(403).json({
        success: false,
        error: `Missing required scope: ${requiredScope}`,
        code: 'INSUFFICIENT_SCOPE',
        meta: {
          requiredScope,
          availableScopes: req.apiKey.scopes,
        },
      });
      return;
    }

    next();
  };
};

/**
 * Middleware dual: aceita JWT OU API Key
 */
export const authenticateDual = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Tenta autenticação via API Key primeiro
  const hasApiKeyHeaders =
    (req.headers.authorization && req.headers.authorization.includes(':')) ||
    (req.headers['x-api-key'] && req.headers['x-api-secret']);

  if (hasApiKeyHeaders) {
    return authenticateApiKey(req, res, next);
  }

  // Fallback para autenticação JWT
  // Assume que authenticate middleware já está disponível
  const { authenticate } = require('./auth');
  return authenticate(req, res, next);
};

/**
 * Middleware para logging de uso da API
 */
export const logApiUsage = (startTime: number) => {
  return async (req: ApiKeyAuthRequest, res: Response, next: NextFunction): Promise<void> => {
    // Captura o status code original
    const originalJson = res.json.bind(res);

    res.json = function (body: any): Response {
      // Log apenas se autenticado via API Key
      if (req.apiKey && req.isApiKeyAuth) {
        const responseTime = Date.now() - startTime;
        const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
        const userAgent = req.headers['user-agent'];

        // Log assíncrono (não bloqueia response)
        apiKeyService
          .logApiUsage(
            req.apiKey.id,
            req.method,
            req.path,
            res.statusCode,
            responseTime,
            ipAddress,
            userAgent,
            body.success === false ? body.error : undefined
          )
          .catch((error) => {
            console.error('Failed to log API usage:', error);
          });
      }

      return originalJson(body);
    };

    next();
  };
};

/**
 * Middleware para verificar IP whitelist
 */
export const checkIpWhitelist = async (
  req: ApiKeyAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.apiKey) {
    return next();
  }

  // TODO: Implementar verificação de IP whitelist
  // Precisaria buscar ipWhitelist da API Key e validar contra req IP

  next();
};
