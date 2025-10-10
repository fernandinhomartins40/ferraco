import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{
    field: string;
    message: string;
    code?: string;
  }>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function successResponse<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  };

  return res.status(statusCode).json(response);
}

export function createdResponse<T>(
  res: Response,
  data: T,
  message: string = 'Resource created successfully'
): Response {
  return successResponse(res, data, message, 201);
}

export function paginatedResponse<T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number
): Response {
  const response: ApiResponse<T[]> = {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };

  return res.status(200).json(response);
}

export function errorResponse(
  res: Response,
  message: string,
  statusCode: number = 400,
  errors?: Array<{ field: string; message: string; code?: string }>
): Response {
  const response: ApiResponse = {
    success: false,
    message,
    errors,
  };

  return res.status(statusCode).json(response);
}

export function notFoundResponse(
  res: Response,
  message: string = 'Resource not found'
): Response {
  return errorResponse(res, message, 404);
}

export function unauthorizedResponse(
  res: Response,
  message: string = 'Unauthorized'
): Response {
  return errorResponse(res, message, 401);
}

export function forbiddenResponse(
  res: Response,
  message: string = 'Forbidden'
): Response {
  return errorResponse(res, message, 403);
}

export function badRequestResponse(
  res: Response,
  message: string = 'Bad Request',
  errors?: Array<{ field?: string; message: string; code?: string }> | string[]
): Response {
  // Convert string array to error objects
  const formattedErrors = Array.isArray(errors)
    ? errors.map(err => typeof err === 'string' ? { message: err } : err)
    : errors;

  return errorResponse(res, message, 400, formattedErrors);
}

export function validationErrorResponse(
  res: Response,
  errors: Array<{ field: string; message: string; code?: string }>
): Response {
  return errorResponse(res, 'Validation Error', 400, errors);
}

export function serverErrorResponse(
  res: Response,
  message: string = 'Internal Server Error'
): Response {
  return errorResponse(res, message, 500);
}

export function noContentResponse(res: Response): Response {
  return res.status(204).send();
}
