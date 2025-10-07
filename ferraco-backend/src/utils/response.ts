import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  details?: any;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Resposta de sucesso padronizada
 */
export function successResponse<T>(
  data: T,
  message = 'Operação realizada com sucesso'
): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
  };
}

/**
 * Resposta de erro padronizada
 */
export function errorResponse(
  message: string,
  error?: string,
  details?: any
): ApiResponse {
  return {
    success: false,
    message,
    error: error || 'Error',
    ...(details && { details }),
  };
}

/**
 * Resposta com paginação
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  },
  message = 'Dados obtidos com sucesso'
): ApiResponse<T[]> {
  return {
    success: true,
    message,
    data,
    pagination,
  };
}
