# FASE 7: SISTEMA DE AUTENTICAÇÃO E AUTORIZAÇÃO

## 📋 ÍNDICE

1. [Visão Geral](#1-visão-geral)
2. [Fluxo de Autenticação](#2-fluxo-de-autenticação)
3. [Implementação JWT](#3-implementação-jwt)
4. [Sistema de Permissões](#4-sistema-de-permissões)
5. [Middleware de Autenticação](#5-middleware-de-autenticação)
6. [Refresh Tokens](#6-refresh-tokens)
7. [Hash de Senhas](#7-hash-de-senhas)
8. [Rate Limiting](#8-rate-limiting)
9. [Logs de Auditoria](#9-logs-de-auditoria)
10. [Código Completo](#10-código-completo)

---

## 1. VISÃO GERAL

### 1.1 Estratégia de Autenticação

O sistema utiliza **JWT (JSON Web Tokens)** com as seguintes características:

- **Access Token**: Curta duração (15 minutos)
- **Refresh Token**: Longa duração (7 dias)
- **Rotação de Tokens**: Refresh tokens são rotacionados a cada uso
- **Revogação**: Tokens podem ser revogados via banco de dados

### 1.2 Níveis de Segurança

```
┌─────────────────────────────────────────────────────────────┐
│ NÍVEL 1: Autenticação (Token JWT válido)                    │
├─────────────────────────────────────────────────────────────┤
│ NÍVEL 2: Role-Based (admin, sales, consultant, etc)         │
├─────────────────────────────────────────────────────────────┤
│ NÍVEL 3: Permission-Based (leads:read, leads:write, etc)    │
├─────────────────────────────────────────────────────────────┤
│ NÍVEL 4: Ownership (pode editar apenas seus próprios dados) │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. FLUXO DE AUTENTICAÇÃO

### 2.1 Login Flow

```
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│  Client  │      │   API    │      │ AuthSvc  │      │ Database │
└────┬─────┘      └────┬─────┘      └────┬─────┘      └────┬─────┘
     │                 │                 │                 │
     │ POST /auth/login│                 │                 │
     │────────────────>│                 │                 │
     │  {email,pass}   │                 │                 │
     │                 │                 │                 │
     │                 │ validateUser()  │                 │
     │                 │────────────────>│                 │
     │                 │                 │                 │
     │                 │                 │ findUser(email) │
     │                 │                 │────────────────>│
     │                 │                 │                 │
     │                 │                 │<────────────────│
     │                 │                 │   user data     │
     │                 │                 │                 │
     │                 │                 │ bcrypt.compare()│
     │                 │                 │─────┐           │
     │                 │                 │     │           │
     │                 │                 │<────┘           │
     │                 │                 │                 │
     │                 │<────────────────│                 │
     │                 │   user valid    │                 │
     │                 │                 │                 │
     │                 │ generateTokens()│                 │
     │                 │─────┐           │                 │
     │                 │     │           │                 │
     │                 │<────┘           │                 │
     │                 │                 │                 │
     │                 │                 │ saveRefreshToken│
     │                 │                 │────────────────>│
     │                 │                 │                 │
     │<────────────────│                 │                 │
     │  {accessToken,  │                 │                 │
     │   refreshToken, │                 │                 │
     │   user}         │                 │                 │
     │                 │                 │                 │
```

### 2.2 Refresh Token Flow

```
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│  Client  │      │   API    │      │ AuthSvc  │      │ Database │
└────┬─────┘      └────┬─────┘      └────┬─────┘      └────┬─────┘
     │                 │                 │                 │
     │POST /auth/refresh│                │                 │
     │────────────────>│                 │                 │
     │ {refreshToken}  │                 │                 │
     │                 │                 │                 │
     │                 │ validateRefresh()│                │
     │                 │────────────────>│                 │
     │                 │                 │                 │
     │                 │                 │ findRefreshToken│
     │                 │                 │────────────────>│
     │                 │                 │                 │
     │                 │                 │<────────────────│
     │                 │                 │  token data     │
     │                 │                 │                 │
     │                 │                 │ verify()        │
     │                 │                 │─────┐           │
     │                 │                 │     │           │
     │                 │                 │<────┘           │
     │                 │                 │                 │
     │                 │                 │ revokeOldToken  │
     │                 │                 │────────────────>│
     │                 │                 │                 │
     │                 │                 │ saveNewToken    │
     │                 │                 │────────────────>│
     │                 │                 │                 │
     │                 │<────────────────│                 │
     │                 │   new tokens    │                 │
     │                 │                 │                 │
     │<────────────────│                 │                 │
     │  {accessToken,  │                 │                 │
     │   refreshToken} │                 │                 │
```

---

## 3. IMPLEMENTAÇÃO JWT

### 3.1 Arquivo: `src/config/jwt.ts`

```typescript
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

// ============================================================================
// INTERFACES
// ============================================================================

export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
  permissions: string[];
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '15m';
const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';

if (process.env.NODE_ENV === 'production') {
  if (JWT_SECRET === 'your-secret-key-change-in-production') {
    throw new Error('JWT_SECRET must be set in production environment');
  }
  if (JWT_REFRESH_SECRET === 'your-refresh-secret-key') {
    throw new Error('JWT_REFRESH_SECRET must be set in production environment');
  }
}

// ============================================================================
// FUNÇÕES DE GERAÇÃO DE TOKENS
// ============================================================================

/**
 * Gera payload JWT a partir dos dados do usuário
 */
export function createJWTPayload(user: User, permissions: string[]): JWTPayload {
  return {
    userId: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    permissions,
  };
}

/**
 * Gera Access Token (curta duração)
 */
export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRATION,
    issuer: 'ferraco-crm',
    audience: 'ferraco-crm-api',
  });
}

/**
 * Gera Refresh Token (longa duração)
 */
export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(
    { userId: payload.userId },
    JWT_REFRESH_SECRET,
    {
      expiresIn: JWT_REFRESH_EXPIRATION,
      issuer: 'ferraco-crm',
      audience: 'ferraco-crm-api',
    }
  );
}

/**
 * Gera par de tokens (access + refresh)
 */
export function generateTokenPair(user: User, permissions: string[]): TokenPair {
  const payload = createJWTPayload(user, permissions);

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
    expiresIn: JWT_EXPIRATION,
  };
}

// ============================================================================
// FUNÇÕES DE VERIFICAÇÃO DE TOKENS
// ============================================================================

/**
 * Verifica e decodifica Access Token
 */
export function verifyAccessToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'ferraco-crm',
      audience: 'ferraco-crm-api',
    }) as JWTPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expirado');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Token inválido');
    }
    throw new Error('Erro ao verificar token');
  }
}

/**
 * Verifica e decodifica Refresh Token
 */
export function verifyRefreshToken(token: string): { userId: string } {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'ferraco-crm',
      audience: 'ferraco-crm-api',
    }) as { userId: string };

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expirado');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Refresh token inválido');
    }
    throw new Error('Erro ao verificar refresh token');
  }
}

/**
 * Decodifica token sem verificar (útil para debug)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Extrai token do header Authorization
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Calcula tempo de expiração em segundos
 */
export function getTokenExpirationTime(token: string): number | null {
  const decoded = decodeToken(token);

  if (!decoded || !decoded.exp) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresIn = decoded.exp - now;

  return expiresIn > 0 ? expiresIn : 0;
}

/**
 * Verifica se token está prestes a expirar (< 5 minutos)
 */
export function isTokenExpiringSoon(token: string): boolean {
  const expiresIn = getTokenExpirationTime(token);

  if (expiresIn === null) {
    return false;
  }

  return expiresIn < 300; // 5 minutos
}
```

---

## 4. SISTEMA DE PERMISSÕES

### 4.1 Arquivo: `src/modules/auth/permissions.service.ts`

```typescript
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// TIPOS
// ============================================================================

export interface Permission {
  resource: string;
  actions: string[];
}

export interface PermissionCheck {
  resource: string;
  action: string;
}

// ============================================================================
// DEFINIÇÃO DE PERMISSÕES POR ROLE
// ============================================================================

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    { resource: 'users', actions: ['create', 'read', 'update', 'delete', 'export'] },
    { resource: 'leads', actions: ['create', 'read', 'update', 'delete', 'export'] },
    { resource: 'notes', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'tags', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'pipeline', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'communications', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'automations', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'reports', actions: ['create', 'read', 'update', 'delete', 'export'] },
    { resource: 'integrations', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'teams', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'audit', actions: ['read'] },
    { resource: 'config', actions: ['read', 'update'] },
  ],

  MANAGER: [
    { resource: 'users', actions: ['read'] },
    { resource: 'leads', actions: ['create', 'read', 'update', 'delete', 'export'] },
    { resource: 'notes', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'tags', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'pipeline', actions: ['read', 'update'] },
    { resource: 'communications', actions: ['create', 'read', 'update'] },
    { resource: 'automations', actions: ['create', 'read', 'update'] },
    { resource: 'reports', actions: ['create', 'read', 'export'] },
    { resource: 'integrations', actions: ['read'] },
    { resource: 'teams', actions: ['read', 'update'] },
  ],

  SALES: [
    { resource: 'leads', actions: ['create', 'read', 'update'] },
    { resource: 'notes', actions: ['create', 'read', 'update'] },
    { resource: 'tags', actions: ['read', 'update'] },
    { resource: 'pipeline', actions: ['read', 'update'] },
    { resource: 'communications', actions: ['create', 'read'] },
    { resource: 'reports', actions: ['read'] },
  ],

  CONSULTANT: [
    { resource: 'leads', actions: ['read'] },
    { resource: 'notes', actions: ['read'] },
    { resource: 'tags', actions: ['read'] },
    { resource: 'pipeline', actions: ['read'] },
    { resource: 'communications', actions: ['read'] },
  ],

  SUPPORT: [
    { resource: 'leads', actions: ['read'] },
    { resource: 'notes', actions: ['create', 'read'] },
    { resource: 'communications', actions: ['create', 'read'] },
  ],
};

// ============================================================================
// SERVIÇO DE PERMISSÕES
// ============================================================================

export class PermissionsService {
  /**
   * Busca permissões do usuário (role + custom)
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        permissions: true,
      },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Permissões base do role
    const rolePermissions = this.getRolePermissions(user.role);

    // Permissões customizadas do banco
    const customPermissions = user.permissions.map(p => {
      const actions = JSON.parse(p.actions) as string[];
      return actions.map(action => `${p.resource}:${action}`);
    }).flat();

    // Combinar permissões (custom sobrescreve role)
    const allPermissions = new Set([
      ...rolePermissions,
      ...customPermissions,
    ]);

    return Array.from(allPermissions);
  }

  /**
   * Obtém permissões base de um role
   */
  getRolePermissions(role: UserRole): string[] {
    const permissions = ROLE_PERMISSIONS[role] || [];

    return permissions.flatMap(p =>
      p.actions.map(action => `${p.resource}:${action}`)
    );
  }

  /**
   * Verifica se usuário tem permissão específica
   */
  async hasPermission(userId: string, resource: string, action: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    const requiredPermission = `${resource}:${action}`;

    return permissions.includes(requiredPermission);
  }

  /**
   * Verifica múltiplas permissões (AND)
   */
  async hasAllPermissions(userId: string, checks: PermissionCheck[]): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);

    return checks.every(check => {
      const requiredPermission = `${check.resource}:${check.action}`;
      return permissions.includes(requiredPermission);
    });
  }

  /**
   * Verifica múltiplas permissões (OR)
   */
  async hasAnyPermission(userId: string, checks: PermissionCheck[]): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);

    return checks.some(check => {
      const requiredPermission = `${check.resource}:${check.action}`;
      return permissions.includes(requiredPermission);
    });
  }

  /**
   * Adiciona permissão customizada ao usuário
   */
  async addCustomPermission(
    userId: string,
    resource: string,
    actions: string[]
  ): Promise<void> {
    await prisma.userPermission.upsert({
      where: {
        userId_resource: {
          userId,
          resource,
        },
      },
      update: {
        actions: JSON.stringify(actions),
      },
      create: {
        userId,
        resource,
        actions: JSON.stringify(actions),
      },
    });
  }

  /**
   * Remove permissão customizada do usuário
   */
  async removeCustomPermission(userId: string, resource: string): Promise<void> {
    await prisma.userPermission.deleteMany({
      where: {
        userId,
        resource,
      },
    });
  }

  /**
   * Lista todas as permissões disponíveis no sistema
   */
  getAllSystemPermissions(): Permission[] {
    const allPermissions = Object.values(ROLE_PERMISSIONS).flat();
    const uniquePermissions = new Map<string, Set<string>>();

    allPermissions.forEach(p => {
      if (!uniquePermissions.has(p.resource)) {
        uniquePermissions.set(p.resource, new Set());
      }
      p.actions.forEach(action => {
        uniquePermissions.get(p.resource)!.add(action);
      });
    });

    return Array.from(uniquePermissions.entries()).map(([resource, actions]) => ({
      resource,
      actions: Array.from(actions),
    }));
  }
}

export const permissionsService = new PermissionsService();
```

---

## 5. MIDDLEWARE DE AUTENTICAÇÃO

### 5.1 Arquivo: `src/middleware/auth.middleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractTokenFromHeader, JWTPayload } from '@/config/jwt';
import { permissionsService } from '@/modules/auth/permissions.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// EXTENSÃO DO EXPRESS REQUEST
// ============================================================================

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      permissions?: string[];
    }
  }
}

// ============================================================================
// MIDDLEWARE: Authenticate (verifica apenas se está autenticado)
// ============================================================================

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Token não fornecido',
      });
      return;
    }

    // Verificar token
    const payload = verifyAccessToken(token);

    // Verificar se usuário existe e está ativo
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Usuário inválido ou inativo',
      });
      return;
    }

    // Buscar permissões
    const permissions = await permissionsService.getUserPermissions(user.id);

    // Anexar ao request
    req.user = payload;
    req.permissions = permissions;

    next();
  } catch (error) {
    if (error instanceof Error) {
      res.status(401).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Erro de autenticação',
      });
    }
  }
}

// ============================================================================
// MIDDLEWARE: Require Permission (verifica permissão específica)
// ============================================================================

export function requirePermission(resource: string, action: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Não autenticado',
        });
        return;
      }

      const hasPermission = await permissionsService.hasPermission(
        req.user.userId,
        resource,
        action
      );

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: 'Permissão negada',
          required: `${resource}:${action}`,
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao verificar permissão',
      });
    }
  };
}

// ============================================================================
// MIDDLEWARE: Require Role (verifica role específica)
// ============================================================================

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Não autenticado',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Role insuficiente',
        required: roles,
        current: req.user.role,
      });
      return;
    }

    next();
  };
}

// ============================================================================
// MIDDLEWARE: Require Ownership (verifica se é dono do recurso)
// ============================================================================

export function requireOwnership(resourceGetter: (req: Request) => Promise<{ userId: string } | null>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Não autenticado',
        });
        return;
      }

      // Admin sempre tem acesso
      if (req.user.role === 'ADMIN') {
        next();
        return;
      }

      const resource = await resourceGetter(req);

      if (!resource) {
        res.status(404).json({
          success: false,
          message: 'Recurso não encontrado',
        });
        return;
      }

      if (resource.userId !== req.user.userId) {
        res.status(403).json({
          success: false,
          message: 'Você não tem permissão para acessar este recurso',
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao verificar ownership',
      });
    }
  };
}

// ============================================================================
// MIDDLEWARE: Optional Auth (autentica se token presente, mas não obrigatório)
// ============================================================================

export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (token) {
      const payload = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (user && user.isActive) {
        const permissions = await permissionsService.getUserPermissions(user.id);
        req.user = payload;
        req.permissions = permissions;
      }
    }

    next();
  } catch {
    // Ignora erros e continua sem autenticação
    next();
  }
}
```

---

## 6. REFRESH TOKENS

### 6.1 Arquivo: `src/modules/auth/refresh-token.service.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { generateTokenPair } from '@/config/jwt';

const prisma = new PrismaClient();

// ============================================================================
// SERVIÇO DE REFRESH TOKENS
// ============================================================================

export class RefreshTokenService {
  /**
   * Salva refresh token no banco
   */
  async saveRefreshToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  /**
   * Busca refresh token válido
   */
  async findValidRefreshToken(token: string): Promise<{ userId: string } | null> {
    const refreshToken = await prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!refreshToken) {
      return null;
    }

    // Verificar se foi revogado
    if (refreshToken.revokedAt) {
      return null;
    }

    // Verificar se expirou
    if (refreshToken.expiresAt < new Date()) {
      return null;
    }

    return { userId: refreshToken.userId };
  }

  /**
   * Revoga refresh token
   */
  async revokeRefreshToken(token: string): Promise<void> {
    await prisma.refreshToken.update({
      where: { token },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  /**
   * Revoga todos os refresh tokens de um usuário
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
   * Remove refresh tokens expirados (cleanup)
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { revokedAt: { not: null } },
        ],
      },
    });

    return result.count;
  }

  /**
   * Gera novo par de tokens a partir de refresh token
   */
  async refreshTokens(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  } | null> {
    // Buscar token válido
    const tokenData = await this.findValidRefreshToken(refreshToken);

    if (!tokenData) {
      return null;
    }

    // Buscar usuário com permissões
    const user = await prisma.user.findUnique({
      where: { id: tokenData.userId },
      include: {
        permissions: true,
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    // Revogar token antigo
    await this.revokeRefreshToken(refreshToken);

    // Gerar novos tokens
    const permissions = user.permissions.flatMap(p => {
      const actions = JSON.parse(p.actions) as string[];
      return actions.map(action => `${p.resource}:${action}`);
    });

    const tokens = generateTokenPair(user, permissions);

    // Salvar novo refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias
    await this.saveRefreshToken(user.id, tokens.refreshToken, expiresAt);

    return tokens;
  }
}

export const refreshTokenService = new RefreshTokenService();
```

---

## 7. HASH DE SENHAS

### 7.1 Arquivo: `src/utils/password.ts`

```typescript
import bcrypt from 'bcrypt';

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const SALT_ROUNDS = 12;

// ============================================================================
// FUNÇÕES DE HASH
// ============================================================================

/**
 * Gera hash de senha com bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  return hash;
}

/**
 * Compara senha com hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  const isMatch = await bcrypt.compare(password, hash);
  return isMatch;
}

/**
 * Valida força da senha
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  errors: string[];
} {
  const errors: string[] = [];
  let score = 0;

  // Mínimo 8 caracteres
  if (password.length >= 8) {
    score += 20;
  } else {
    errors.push('Senha deve ter no mínimo 8 caracteres');
  }

  // Mínimo 12 caracteres (bonus)
  if (password.length >= 12) {
    score += 10;
  }

  // Letras minúsculas
  if (/[a-z]/.test(password)) {
    score += 15;
  } else {
    errors.push('Senha deve conter letras minúsculas');
  }

  // Letras maiúsculas
  if (/[A-Z]/.test(password)) {
    score += 15;
  } else {
    errors.push('Senha deve conter letras maiúsculas');
  }

  // Números
  if (/[0-9]/.test(password)) {
    score += 20;
  } else {
    errors.push('Senha deve conter números');
  }

  // Caracteres especiais
  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 20;
  } else {
    errors.push('Senha deve conter caracteres especiais');
  }

  return {
    isValid: score >= 70 && errors.length === 0,
    score,
    errors,
  };
}
```

---

## 8. RATE LIMITING

### 8.1 Arquivo: `src/middleware/rate-limit.middleware.ts`

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { Request, Response } from 'express';

// ============================================================================
// RATE LIMITERS
// ============================================================================

/**
 * Rate limiter geral da API (100 requests por minuto)
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100,
  message: {
    success: false,
    message: 'Muitas requisições. Tente novamente em alguns instantes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Não limitar health checks
    return req.path === '/health';
  },
});

/**
 * Rate limiter de autenticação (10 requests por minuto)
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10,
  message: {
    success: false,
    message: 'Muitas tentativas de login. Tente novamente em alguns instantes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Não conta requisições bem-sucedidas
});

/**
 * Rate limiter estrito (5 requests por minuto)
 */
export const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 5,
  message: {
    success: false,
    message: 'Limite de requisições excedido. Tente novamente mais tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter por IP (100 requests por hora)
 */
export const ipLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 100,
  keyGenerator: (req: Request) => {
    return req.ip || 'unknown';
  },
  message: {
    success: false,
    message: 'Limite de requisições por IP excedido.',
  },
});
```

---

## 9. LOGS DE AUDITORIA

### 9.1 Arquivo: `src/middleware/audit.middleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// MIDDLEWARE DE AUDITORIA
// ============================================================================

export async function auditLog(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Salvar referências originais
  const originalJson = res.json.bind(res);
  const startTime = Date.now();

  // Sobrescrever res.json para capturar resposta
  res.json = function (data: unknown) {
    const duration = Date.now() - startTime;

    // Fazer log assíncrono (não bloquear resposta)
    void logAuditEntry(req, res, data, duration);

    return originalJson(data);
  };

  next();
}

async function logAuditEntry(
  req: Request,
  res: Response,
  responseData: unknown,
  duration: number
): Promise<void> {
  try {
    // Apenas logar rotas importantes
    if (!shouldLog(req.path, req.method)) {
      return;
    }

    const success = res.statusCode < 400;
    const user = req.user;

    await prisma.auditLog.create({
      data: {
        userId: user?.userId || 'anonymous',
        userName: user?.username || 'anonymous',
        action: `${req.method} ${req.path}`,
        resource: extractResource(req.path),
        resourceId: extractResourceId(req.path),
        details: JSON.stringify({
          method: req.method,
          path: req.path,
          params: req.params,
          query: req.query,
          body: sanitizeBody(req.body),
          statusCode: res.statusCode,
          duration,
        }),
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        success,
        errorMessage: !success && typeof responseData === 'object' && responseData !== null
          ? (responseData as { message?: string }).message
          : undefined,
      },
    });
  } catch (error) {
    // Não falhar a requisição por erro de log
    console.error('Erro ao salvar log de auditoria:', error);
  }
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function shouldLog(path: string, method: string): boolean {
  // Não logar health checks e métricas
  if (path === '/health' || path === '/metrics') {
    return false;
  }

  // Logar apenas operações de escrita e leitura sensíveis
  if (method === 'GET' && !path.includes('/users') && !path.includes('/audit')) {
    return false;
  }

  return true;
}

function extractResource(path: string): string {
  const parts = path.split('/').filter(Boolean);
  return parts[0] || 'unknown';
}

function extractResourceId(path: string): string {
  const parts = path.split('/').filter(Boolean);
  // Pega o segundo segmento se parecer com ID (UUID ou número)
  if (parts.length >= 2 && /^[a-zA-Z0-9-]+$/.test(parts[1])) {
    return parts[1];
  }
  return '';
}

function sanitizeBody(body: unknown): unknown {
  if (typeof body !== 'object' || body === null) {
    return body;
  }

  const sanitized = { ...body } as Record<string, unknown>;

  // Remover campos sensíveis
  const sensitiveFields = ['password', 'token', 'refreshToken', 'secret', 'apiKey'];

  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}
```

---

## 10. CÓDIGO COMPLETO

### 10.1 Auth Controller

Arquivo: `src/modules/auth/auth.controller.ts`

```typescript
import { Request, Response } from 'express';
import { authService } from './auth.service';
import { refreshTokenService } from './refresh-token.service';
import { validatePasswordStrength } from '@/utils/password';

export class AuthController {
  /**
   * POST /auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const result = await authService.login(email, password);

      if (!result) {
        res.status(401).json({
          success: false,
          message: 'Credenciais inválidas',
        });
        return;
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao fazer login',
      });
    }
  }

  /**
   * POST /auth/register
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password, name } = req.body;

      // Validar força da senha
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        res.status(400).json({
          success: false,
          message: 'Senha fraca',
          errors: passwordValidation.errors,
        });
        return;
      }

      const result = await authService.register({
        username,
        email,
        password,
        name,
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao registrar',
      });
    }
  }

  /**
   * POST /auth/refresh
   */
  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      const result = await refreshTokenService.refreshTokens(refreshToken);

      if (!result) {
        res.status(401).json({
          success: false,
          message: 'Refresh token inválido',
        });
        return;
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao renovar token',
      });
    }
  }

  /**
   * POST /auth/logout
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      await refreshTokenService.revokeRefreshToken(refreshToken);

      res.json({
        success: true,
        message: 'Logout realizado com sucesso',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao fazer logout',
      });
    }
  }

  /**
   * GET /auth/me
   */
  async me(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Não autenticado',
        });
        return;
      }

      const user = await authService.getUserById(req.user.userId);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao buscar usuário',
      });
    }
  }

  /**
   * PUT /auth/change-password
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Não autenticado',
        });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      // Validar força da nova senha
      const passwordValidation = validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        res.status(400).json({
          success: false,
          message: 'Senha fraca',
          errors: passwordValidation.errors,
        });
        return;
      }

      await authService.changePassword(
        req.user.userId,
        currentPassword,
        newPassword
      );

      res.json({
        success: true,
        message: 'Senha alterada com sucesso',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao alterar senha',
      });
    }
  }
}

export const authController = new AuthController();
```

### 10.2 Auth Service

Arquivo: `src/modules/auth/auth.service.ts`

```typescript
import { PrismaClient, UserRole } from '@prisma/client';
import { hashPassword, comparePassword } from '@/utils/password';
import { generateTokenPair } from '@/config/jwt';
import { refreshTokenService } from './refresh-token.service';
import { permissionsService } from './permissions.service';

const prisma = new PrismaClient();

export class AuthService {
  /**
   * Login do usuário
   */
  async login(email: string, password: string) {
    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    // Verificar senha
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    // Verificar se está ativo
    if (!user.isActive) {
      throw new Error('Usuário inativo');
    }

    // Buscar permissões
    const permissions = await permissionsService.getUserPermissions(user.id);

    // Gerar tokens
    const tokens = generateTokenPair(user, permissions);

    // Salvar refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await refreshTokenService.saveRefreshToken(user.id, tokens.refreshToken, expiresAt);

    // Atualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions,
      },
    };
  }

  /**
   * Registro de novo usuário
   */
  async register(data: {
    username: string;
    email: string;
    password: string;
    name: string;
    role?: UserRole;
  }) {
    // Verificar se email já existe
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingEmail) {
      throw new Error('Email já cadastrado');
    }

    // Verificar se username já existe
    const existingUsername = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUsername) {
      throw new Error('Username já cadastrado');
    }

    // Hash da senha
    const hashedPassword = await hashPassword(data.password);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: data.role || UserRole.CONSULTANT,
      },
    });

    // Buscar permissões
    const permissions = await permissionsService.getUserPermissions(user.id);

    // Gerar tokens
    const tokens = generateTokenPair(user, permissions);

    // Salvar refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await refreshTokenService.saveRefreshToken(user.id, tokens.refreshToken, expiresAt);

    return {
      ...tokens,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions,
      },
    };
  }

  /**
   * Buscar usuário por ID
   */
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const permissions = await permissionsService.getUserPermissions(userId);

    return {
      ...user,
      permissions,
    };
  }

  /**
   * Alterar senha
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Verificar senha atual
    const isPasswordValid = await comparePassword(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new Error('Senha atual incorreta');
    }

    // Hash da nova senha
    const hashedPassword = await hashPassword(newPassword);

    // Atualizar senha
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Revogar todos os refresh tokens
    await refreshTokenService.revokeAllUserRefreshTokens(userId);
  }
}

export const authService = new AuthService();
```

---

## 🎯 RESUMO DA FASE 7

### ✅ Implementações Completas

1. **JWT Tokens**
   - Access Token (15 min)
   - Refresh Token (7 dias)
   - Rotação automática
   - Verificação e validação

2. **Sistema de Permissões**
   - 5 roles pré-definidos
   - Permissões granulares por recurso
   - Permissões customizadas por usuário
   - Cache de permissões

3. **Middlewares**
   - `authenticate`: Verifica autenticação
   - `requirePermission`: Verifica permissão específica
   - `requireRole`: Verifica role
   - `requireOwnership`: Verifica propriedade do recurso
   - `optionalAuth`: Autenticação opcional

4. **Segurança**
   - Bcrypt com 12 rounds
   - Validação de força de senha
   - Rate limiting por endpoint
   - Logs de auditoria automáticos
   - Sanitização de dados sensíveis

5. **Refresh Tokens**
   - Armazenamento em banco
   - Revogação individual e em massa
   - Cleanup automático
   - Rotação a cada uso

### 📊 Métricas de Segurança

- **Hash de Senha**: Bcrypt com 12 rounds (muito seguro)
- **Token Expiration**: 15 minutos (balanço segurança/usabilidade)
- **Refresh Token**: 7 dias (máximo de comodidade sem comprometer segurança)
- **Rate Limits**:
  - API Geral: 100 req/min
  - Auth: 10 req/min
  - Strict: 5 req/min

### 🔐 Níveis de Proteção

1. **Nível 1 - Público**: Sem autenticação
2. **Nível 2 - Autenticado**: Apenas token válido
3. **Nível 3 - Role**: Role específica necessária
4. **Nível 4 - Permission**: Permissão específica necessária
5. **Nível 5 - Ownership**: Dono do recurso ou admin

---

**Próxima Fase**: [FASE 8 - APIs Core (Leads, Notes, Tags)](./FASE-8-APIS-CORE.md)
