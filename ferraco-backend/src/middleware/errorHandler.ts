import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

/**
 * Interface para erros personalizados
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Middleware global de tratamento de erros
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error('Error:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  // Erro personalizado da aplicação
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      error: error.message,
    });
    return;
  }

  // Erro de validação do Zod
  if (error instanceof ZodError) {
    const messages = error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    res.status(422).json({
      success: false,
      message: 'Erro de validação',
      error: 'Validation Error',
      details: messages,
    });
    return;
  }

  // Erros do Prisma
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (error.code === 'P2002') {
      res.status(409).json({
        success: false,
        message: 'Registro duplicado',
        error: 'Duplicate Entry',
        field: error.meta?.target,
      });
      return;
    }

    // Record not found
    if (error.code === 'P2025') {
      res.status(404).json({
        success: false,
        message: 'Registro não encontrado',
        error: 'Not Found',
      });
      return;
    }

    // Foreign key constraint failed
    if (error.code === 'P2003') {
      res.status(400).json({
        success: false,
        message: 'Referência inválida',
        error: 'Foreign Key Constraint',
      });
      return;
    }
  }

  // Erro genérico do Prisma
  if (error instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      message: 'Erro de validação do banco de dados',
      error: 'Database Validation Error',
    });
    return;
  }

  // Erro de conexão com o banco
  if (error instanceof Prisma.PrismaClientInitializationError) {
    res.status(503).json({
      success: false,
      message: 'Erro ao conectar com o banco de dados',
      error: 'Database Connection Error',
    });
    return;
  }

  // Erro JWT
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Token inválido',
      error: 'Unauthorized',
    });
    return;
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token expirado',
      error: 'Unauthorized',
    });
    return;
  }

  // Erro genérico
  const statusCode = 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Erro interno do servidor'
      : error.message;

  res.status(statusCode).json({
    success: false,
    message,
    error: 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
}

/**
 * Middleware para rotas não encontradas
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Rota não encontrada: ${req.method} ${req.path}`,
    error: 'Not Found',
  });
}
