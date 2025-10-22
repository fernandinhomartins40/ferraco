import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

/**
 * Validar configuração JWT
 * Garante que o JWT_SECRET seja seguro e adequado para o ambiente
 */
function validateJWTConfig(): string {
  const secret = process.env.JWT_SECRET;
  const nodeEnv = process.env.NODE_ENV;

  // Produção: JWT_SECRET é obrigatório
  if (nodeEnv === 'production') {
    if (!secret) {
      throw new Error(
        '❌ JWT_SECRET é obrigatório em produção!\n' +
        'Configure via variável de ambiente ou GitHub Secrets'
      );
    }

    if (secret.length < 32) {
      throw new Error(
        `❌ JWT_SECRET deve ter no mínimo 32 caracteres (atual: ${secret.length})\n` +
        'Gere um secret seguro com: openssl rand -hex 32'
      );
    }

    if (secret === 'your-secret-key-change-in-production') {
      throw new Error(
        '❌ JWT_SECRET padrão detectado em produção!\n' +
        'Altere para um valor seguro gerado aleatoriamente'
      );
    }

    console.log('✅ JWT_SECRET configurado corretamente (produção)');
    return secret;
  }

  // Desenvolvimento: usar secret padrão com warning
  if (!secret) {
    console.warn(
      '⚠️  JWT_SECRET não configurado - usando valor padrão de desenvolvimento\n' +
      'ATENÇÃO: NÃO USE EM PRODUÇÃO!'
    );
    return 'development-secret-DO-NOT-USE-IN-PRODUCTION-PLEASE-CHANGE-ME';
  }

  if (secret === 'your-secret-key-change-in-production') {
    console.warn(
      '⚠️  JWT_SECRET padrão detectado - altere para um valor personalizado\n' +
      'Gere um secret seguro com: openssl rand -hex 32'
    );
  }

  return secret;
}

const JWT_SECRET = validateJWTConfig();
const JWT_ACCESS_EXPIRATION = process.env.JWT_ACCESS_EXPIRATION || '15m';
const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';

export interface JWTPayload {
  userId: string;
  id: string; // Alias for userId for backward compatibility
  email: string;
  role: string;
  permissions: string[];
  type: 'access' | 'refresh';
  name?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export function createJWTPayload(
  user: Pick<User, 'id' | 'email' | 'role'>,
  permissions: string[],
  type: 'access' | 'refresh'
): JWTPayload {
  return {
    userId: user.id,
    id: user.id, // Include id as alias
    email: user.email,
    role: user.role,
    permissions,
    type,
  };
}

export function generateAccessToken(payload: Omit<JWTPayload, 'type'>): string {
  const tokenPayload: JWTPayload = { ...payload, type: 'access' };
  return jwt.sign(tokenPayload as object, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRATION as string });
}

export function generateRefreshToken(payload: Omit<JWTPayload, 'type'>): string {
  const tokenPayload: JWTPayload = { ...payload, type: 'refresh' };
  return jwt.sign(tokenPayload as object, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRATION as string });
}

export function generateTokenPair(
  user: Pick<User, 'id' | 'email' | 'role'>,
  permissions: string[]
): TokenPair {
  const payload = { userId: user.id, email: user.email, role: user.role, permissions };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
    expiresIn: JWT_ACCESS_EXPIRATION,
  };
}

export function verifyAccessToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

export function verifyRefreshToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
}

export function extractTokenFromHeader(authHeader?: string): string {
  if (!authHeader) {
    throw new Error('Authorization header missing');
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new Error('Invalid authorization header format');
  }

  return parts[1];
}
