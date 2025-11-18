import { ApiKeyType, ApiKeyStatus } from '@prisma/client';

export interface CreateApiKeyDTO {
  name: string;
  type?: ApiKeyType;
  scopes: string[];
  rateLimitPerHour?: number;
  rateLimitPerDay?: number;
  ipWhitelist?: string[];
  allowedOrigins?: string[];
  expiresAt?: Date;
}

export interface UpdateApiKeyDTO {
  name?: string;
  status?: ApiKeyStatus;
  scopes?: string[];
  rateLimitPerHour?: number;
  rateLimitPerDay?: number;
  ipWhitelist?: string[];
  allowedOrigins?: string[];
  expiresAt?: Date;
}

export interface ApiKeyResponse {
  id: string;
  name: string;
  key: string;
  secret?: string; // Só retorna na criação
  type: ApiKeyType;
  status: ApiKeyStatus;
  scopes: string[];
  rateLimitPerHour: number;
  rateLimitPerDay: number;
  ipWhitelist: string[] | null;
  allowedOrigins: string[] | null;
  lastUsedAt: Date | null;
  usageCount: number;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKeyUsageStats {
  apiKeyId: string;
  apiKeyName: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastUsedAt: Date | null;
  periodStart: Date;
  periodEnd: Date;
}

export interface ValidateApiKeyResult {
  isValid: boolean;
  apiKey?: {
    id: string;
    userId: string;
    scopes: string[];
    type: ApiKeyType;
  };
  error?: string;
}
