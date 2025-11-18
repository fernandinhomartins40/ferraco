import { PrismaClient, ApiKeyStatus, ApiKeyType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {
  CreateApiKeyDTO,
  UpdateApiKeyDTO,
  ApiKeyResponse,
  ApiKeyUsageStats,
  ValidateApiKeyResult,
} from './apiKey.types';

const prisma = new PrismaClient();

export class ApiKeyService {
  /**
   * Gera uma chave de API criptograficamente segura
   */
  private generateApiKey(prefix: string = 'pk_live'): string {
    const randomBytes = crypto.randomBytes(32);
    const key = randomBytes.toString('base64url').substring(0, 32);
    return `${prefix}_${key}`;
  }

  /**
   * Gera um secret criptograficamente seguro
   */
  private generateSecret(prefix: string = 'sk_live'): string {
    const randomBytes = crypto.randomBytes(48);
    const secret = randomBytes.toString('base64url').substring(0, 48);
    return `${prefix}_${secret}`;
  }

  /**
   * Cria uma nova API Key
   */
  async createApiKey(
    userId: string,
    data: CreateApiKeyDTO
  ): Promise<ApiKeyResponse & { secret: string }> {
    const key = this.generateApiKey();
    const secret = this.generateSecret();
    const secretHash = await bcrypt.hash(secret, 10);

    const apiKey = await prisma.apiKey.create({
      data: {
        name: data.name,
        key,
        secretHash,
        type: data.type || ApiKeyType.WRITE,
        status: ApiKeyStatus.ACTIVE,
        scopes: JSON.stringify(data.scopes),
        rateLimitPerHour: data.rateLimitPerHour || 1000,
        rateLimitPerDay: data.rateLimitPerDay || 10000,
        ipWhitelist: data.ipWhitelist ? JSON.stringify(data.ipWhitelist) : null,
        allowedOrigins: data.allowedOrigins ? JSON.stringify(data.allowedOrigins) : null,
        expiresAt: data.expiresAt || null,
        userId,
      },
    });

    // Log evento
    await prisma.eventLog.create({
      data: {
        eventType: 'API_KEY_CREATED',
        eventName: `API Key created: ${data.name}`,
        resourceType: 'ApiKey',
        resourceId: apiKey.id,
        userId,
        apiKeyId: apiKey.id,
        payload: JSON.stringify({ name: data.name, type: data.type }),
      },
    });

    return this.formatApiKeyResponse(apiKey, secret);
  }

  /**
   * Lista todas as API Keys de um usuário
   */
  async listApiKeys(userId: string, includeRevoked: boolean = false): Promise<ApiKeyResponse[]> {
    const where: any = { userId };

    if (!includeRevoked) {
      where.status = ApiKeyStatus.ACTIVE;
    }

    const apiKeys = await prisma.apiKey.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return apiKeys.map((key) => this.formatApiKeyResponse(key));
  }

  /**
   * Busca uma API Key por ID
   */
  async getApiKeyById(id: string, userId: string): Promise<ApiKeyResponse | null> {
    const apiKey = await prisma.apiKey.findFirst({
      where: { id, userId },
    });

    return apiKey ? this.formatApiKeyResponse(apiKey) : null;
  }

  /**
   * Atualiza uma API Key
   */
  async updateApiKey(
    id: string,
    userId: string,
    data: UpdateApiKeyDTO
  ): Promise<ApiKeyResponse> {
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.scopes !== undefined) updateData.scopes = JSON.stringify(data.scopes);
    if (data.rateLimitPerHour !== undefined) updateData.rateLimitPerHour = data.rateLimitPerHour;
    if (data.rateLimitPerDay !== undefined) updateData.rateLimitPerDay = data.rateLimitPerDay;
    if (data.ipWhitelist !== undefined)
      updateData.ipWhitelist = data.ipWhitelist ? JSON.stringify(data.ipWhitelist) : null;
    if (data.allowedOrigins !== undefined)
      updateData.allowedOrigins = data.allowedOrigins
        ? JSON.stringify(data.allowedOrigins)
        : null;
    if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt;

    const apiKey = await prisma.apiKey.update({
      where: { id, userId },
      data: updateData,
    });

    return this.formatApiKeyResponse(apiKey);
  }

  /**
   * Revoga uma API Key
   */
  async revokeApiKey(id: string, userId: string): Promise<void> {
    await prisma.apiKey.update({
      where: { id, userId },
      data: { status: ApiKeyStatus.REVOKED },
    });

    // Log evento
    await prisma.eventLog.create({
      data: {
        eventType: 'API_KEY_REVOKED',
        eventName: `API Key revoked`,
        resourceType: 'ApiKey',
        resourceId: id,
        userId,
        apiKeyId: id,
        payload: JSON.stringify({ id }),
      },
    });
  }

  /**
   * Deleta uma API Key
   */
  async deleteApiKey(id: string, userId: string): Promise<void> {
    await prisma.apiKey.delete({
      where: { id, userId },
    });
  }

  /**
   * Valida uma API Key e retorna informações
   */
  async validateApiKey(key: string, secret: string): Promise<ValidateApiKeyResult> {
    const apiKey = await prisma.apiKey.findUnique({
      where: { key },
      include: { user: true },
    });

    if (!apiKey) {
      return { isValid: false, error: 'Invalid API key' };
    }

    // Verifica status
    if (apiKey.status !== ApiKeyStatus.ACTIVE) {
      return { isValid: false, error: 'API key is not active' };
    }

    // Verifica expiração
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      // Atualiza status para EXPIRED
      await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { status: ApiKeyStatus.EXPIRED },
      });
      return { isValid: false, error: 'API key has expired' };
    }

    // Verifica secret
    const isSecretValid = await bcrypt.compare(secret, apiKey.secretHash);
    if (!isSecretValid) {
      return { isValid: false, error: 'Invalid API secret' };
    }

    // Atualiza lastUsedAt e usageCount
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: {
        lastUsedAt: new Date(),
        usageCount: { increment: 1 },
      },
    });

    return {
      isValid: true,
      apiKey: {
        id: apiKey.id,
        userId: apiKey.userId,
        scopes: JSON.parse(apiKey.scopes),
        type: apiKey.type,
      },
    };
  }

  /**
   * Verifica se uma API Key tem um scope específico
   */
  hasScope(scopes: string[], requiredScope: string): boolean {
    // Formato: "resource:action" (ex: "leads:read", "leads:write")
    // Permite wildcard: "leads:*", "*:*"

    for (const scope of scopes) {
      if (scope === '*:*') return true; // Admin tem tudo

      const [resource, action] = scope.split(':');
      const [reqResource, reqAction] = requiredScope.split(':');

      if (resource === reqResource || resource === '*') {
        if (action === reqAction || action === '*') {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Registra uso da API
   */
  async logApiUsage(
    apiKeyId: string,
    method: string,
    endpoint: string,
    statusCode: number,
    responseTime: number,
    ipAddress: string,
    userAgent?: string,
    errorMessage?: string
  ): Promise<void> {
    await prisma.apiUsageLog.create({
      data: {
        apiKeyId,
        method,
        endpoint,
        statusCode,
        responseTime,
        ipAddress,
        userAgent,
        errorMessage,
      },
    });
  }

  /**
   * Obtém estatísticas de uso de uma API Key
   */
  async getApiKeyUsageStats(
    apiKeyId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<ApiKeyUsageStats> {
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: apiKeyId },
    });

    if (!apiKey) {
      throw new Error('API Key not found');
    }

    const logs = await prisma.apiUsageLog.findMany({
      where: {
        apiKeyId,
        timestamp: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    });

    const totalRequests = logs.length;
    const successfulRequests = logs.filter((log) => log.statusCode >= 200 && log.statusCode < 400).length;
    const failedRequests = totalRequests - successfulRequests;
    const averageResponseTime =
      totalRequests > 0
        ? logs.reduce((sum, log) => sum + log.responseTime, 0) / totalRequests
        : 0;

    return {
      apiKeyId,
      apiKeyName: apiKey.name,
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      lastUsedAt: apiKey.lastUsedAt,
      periodStart,
      periodEnd,
    };
  }

  /**
   * Verifica rate limit
   */
  async checkRateLimit(apiKeyId: string): Promise<{ allowed: boolean; remaining: number }> {
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: apiKeyId },
    });

    if (!apiKey) {
      return { allowed: false, remaining: 0 };
    }

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const requestsLastHour = await prisma.apiUsageLog.count({
      where: {
        apiKeyId,
        timestamp: { gte: oneHourAgo },
      },
    });

    const remaining = Math.max(0, apiKey.rateLimitPerHour - requestsLastHour);
    const allowed = requestsLastHour < apiKey.rateLimitPerHour;

    return { allowed, remaining };
  }

  /**
   * Formata resposta da API Key
   */
  private formatApiKeyResponse(apiKey: any, secret?: string): any {
    const response: any = {
      id: apiKey.id,
      name: apiKey.name,
      key: apiKey.key,
      type: apiKey.type,
      status: apiKey.status,
      scopes: JSON.parse(apiKey.scopes),
      rateLimitPerHour: apiKey.rateLimitPerHour,
      rateLimitPerDay: apiKey.rateLimitPerDay,
      ipWhitelist: apiKey.ipWhitelist ? JSON.parse(apiKey.ipWhitelist) : null,
      allowedOrigins: apiKey.allowedOrigins ? JSON.parse(apiKey.allowedOrigins) : null,
      lastUsedAt: apiKey.lastUsedAt,
      usageCount: apiKey.usageCount,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
      updatedAt: apiKey.updatedAt,
    };

    if (secret) {
      response.secret = secret;
    }

    return response;
  }

  /**
   * Rotaciona uma API Key (gera nova key mantendo configurações)
   */
  async rotateApiKey(id: string, userId: string): Promise<ApiKeyResponse & { secret: string }> {
    const oldKey = await prisma.apiKey.findFirst({
      where: { id, userId },
    });

    if (!oldKey) {
      throw new Error('API Key not found');
    }

    const key = this.generateApiKey();
    const secret = this.generateSecret();
    const secretHash = await bcrypt.hash(secret, 10);

    const apiKey = await prisma.apiKey.update({
      where: { id, userId },
      data: {
        key,
        secretHash,
        updatedAt: new Date(),
      },
    });

    return this.formatApiKeyResponse(apiKey, secret);
  }
}

export const apiKeyService = new ApiKeyService();
