import { Response } from 'express';

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    [key: string]: any;
  };
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: {
    field?: string;
    value?: any;
    message?: string;
    [key: string]: any;
  };
  meta?: {
    timestamp: string;
    [key: string]: any;
  };
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Helper para criar resposta de sucesso padronizada
 */
export function successResponse<T>(
  res: Response,
  data: T,
  options?: {
    status?: number;
    message?: string;
    meta?: Record<string, any>;
  }
): Response {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...options?.meta,
    },
  };

  if (options?.message) {
    response.message = options.message;
  }

  return res.status(options?.status || 200).json(response);
}

/**
 * Helper para criar resposta de erro padronizada
 */
export function errorResponse(
  res: Response,
  error: string | Error,
  options?: {
    status?: number;
    code?: string;
    details?: Record<string, any>;
    meta?: Record<string, any>;
  }
): Response {
  const errorMessage = error instanceof Error ? error.message : error;

  const response: ApiErrorResponse = {
    success: false,
    error: errorMessage,
    code: options?.code,
    details: options?.details,
    meta: {
      timestamp: new Date().toISOString(),
      ...options?.meta,
    },
  };

  return res.status(options?.status || 500).json(response);
}

/**
 * Helper para criar resposta paginada
 */
export function paginatedResponse<T>(
  res: Response,
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
  },
  options?: {
    message?: string;
    meta?: Record<string, any>;
  }
): Response {
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return successResponse(res, data, {
    meta: {
      pagination: {
        ...pagination,
        totalPages,
      },
      ...options?.meta,
    },
    message: options?.message,
  });
}

/**
 * Códigos de erro padrão
 */
export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  MISSING_API_CREDENTIALS: 'MISSING_API_CREDENTIALS',
  INVALID_API_CREDENTIALS: 'INVALID_API_CREDENTIALS',
  INSUFFICIENT_SCOPE: 'INSUFFICIENT_SCOPE',
  FORBIDDEN: 'FORBIDDEN',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  LEAD_NOT_FOUND: 'LEAD_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  API_KEY_NOT_FOUND: 'API_KEY_NOT_FOUND',
  WEBHOOK_NOT_FOUND: 'WEBHOOK_NOT_FOUND',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',

  // Business Logic
  OPERATION_FAILED: 'OPERATION_FAILED',
  CONFLICT: 'CONFLICT',

  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

/**
 * Middleware para adicionar helpers de response ao res object
 */
export function responseHelpers(req: any, res: any, next: any) {
  res.success = function <T>(data: T, options?: Parameters<typeof successResponse>[2]) {
    return successResponse(res, data, options);
  };

  res.error = function (error: string | Error, options?: Parameters<typeof errorResponse>[2]) {
    return errorResponse(res, error, options);
  };

  res.paginated = function <T>(
    data: T[],
    pagination: Parameters<typeof paginatedResponse>[2],
    options?: Parameters<typeof paginatedResponse>[3]
  ) {
    return paginatedResponse(res, data, pagination, options);
  };

  next();
}
