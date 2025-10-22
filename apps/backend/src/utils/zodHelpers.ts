import { ZodIssue } from 'zod';

export interface FormattedValidationError {
  field: string;
  message: string;
  code?: string;
}

/**
 * Formata erros do Zod para o formato esperado pelos controllers
 */
export function formatZodErrors(errors: ZodIssue[]): FormattedValidationError[] {
  return errors.map((error) => ({
    field: error.path.join('.'),
    message: error.message,
    code: error.code,
  }));
}

/**
 * Classe de erro de validação customizada
 */
export class ValidationError extends Error {
  public statusCode: number;
  public errors?: FormattedValidationError[];

  constructor(message: string, errors?: FormattedValidationError[]) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}
