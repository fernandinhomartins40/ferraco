import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
import { errorResponse, serverErrorResponse, validationErrorResponse } from '../utils/response';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error | AppError | ZodError | Prisma.PrismaClientKnownRequestError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  // Log error
  logger.error('Error:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // Zod validation errors
  if (err instanceof ZodError) {
    const errors = err.errors.map(error => ({
      field: error.path.join('.'),
      message: error.message,
      code: error.code,
    }));

    validationErrorResponse(res, errors);
    return;
  }

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    handlePrismaError(err, res);
    return;
  }

  // App errors
  if (err instanceof AppError) {
    errorResponse(res, err.message, err.statusCode);
    return;
  }

  // Default error
  serverErrorResponse(res, process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message);
}

function handlePrismaError(
  err: Prisma.PrismaClientKnownRequestError,
  res: Response
): void {
  switch (err.code) {
    case 'P2002':
      // Unique constraint violation
      errorResponse(res, 'Resource already exists with this value', 409);
      break;

    case 'P2025':
      // Record not found
      errorResponse(res, 'Resource not found', 404);
      break;

    case 'P2003':
      // Foreign key constraint violation
      errorResponse(res, 'Related resource not found', 400);
      break;

    case 'P2014':
      // Required relation violation
      errorResponse(res, 'Invalid relation', 400);
      break;

    default:
      serverErrorResponse(res);
  }
}

export function notFoundHandler(req: Request, res: Response): void {
  errorResponse(res, `Route ${req.method} ${req.url} not found`, 404);
}
