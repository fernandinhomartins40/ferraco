// Tipos de erros padronizados

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: Record<string, unknown>;
  timestamp?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface AuthError extends ApiError {
  type: 'token_expired' | 'unauthorized' | 'forbidden' | 'invalid_credentials';
}

export interface NetworkError extends ApiError {
  type: 'timeout' | 'no_connection' | 'server_error';
  retry?: boolean;
}

// Type guard para erros
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'status' in error
  );
}

export function isAuthError(error: unknown): error is AuthError {
  return isApiError(error) && 'type' in error;
}
