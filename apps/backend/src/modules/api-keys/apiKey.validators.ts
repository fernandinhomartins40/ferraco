import { z } from 'zod';
import { ApiKeyType, ApiKeyStatus } from '@prisma/client';

export const createApiKeySchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(100),
    type: z.nativeEnum(ApiKeyType).optional(),
    scopes: z.array(z.string()).min(1, 'At least one scope is required'),
    rateLimitPerHour: z.number().int().min(1).max(100000).optional(),
    rateLimitPerDay: z.number().int().min(1).max(1000000).optional(),
    ipWhitelist: z.array(z.string().ip()).optional(),
    allowedOrigins: z.array(z.string().url()).optional(),
    expiresAt: z.string().datetime().transform((val) => new Date(val)).optional(),
  }),
});

export const updateApiKeySchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    name: z.string().min(3).max(100).optional(),
    status: z.nativeEnum(ApiKeyStatus).optional(),
    scopes: z.array(z.string()).optional(),
    rateLimitPerHour: z.number().int().min(1).max(100000).optional(),
    rateLimitPerDay: z.number().int().min(1).max(1000000).optional(),
    ipWhitelist: z.array(z.string().ip()).optional(),
    allowedOrigins: z.array(z.string().url()).optional(),
    expiresAt: z.string().datetime().transform((val) => new Date(val)).optional(),
  }),
});

export const getApiKeySchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const getUsageStatsSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  query: z.object({
    periodStart: z.string().datetime().transform((val) => new Date(val)),
    periodEnd: z.string().datetime().transform((val) => new Date(val)),
  }),
});

export const listApiKeysSchema = z.object({
  query: z.object({
    includeRevoked: z
      .string()
      .transform((val) => val === 'true')
      .optional(),
  }),
});
