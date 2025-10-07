/**
 * Authentication utilities and HTTP interceptors
 */

import { User } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

// Storage keys
export const AUTH_STORAGE_KEYS = {
  TOKEN: 'ferraco_auth_token',
  USER: 'ferraco_auth_user',
  REMEMBER_ME: 'ferraco_remember_me',
} as const;

// Helper para obter URL base da API
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (import.meta.env.PROD) {
    return '/api'; // Produção: usa caminho relativo (proxy Nginx)
  }
  return 'http://localhost:3002/api'; // Desenvolvimento
};

// API Configuration
export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

/**
 * Token management utilities
 */
export class TokenManager {
  static getToken(): string | null {
    try {
      return localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN);
    } catch (error) {
      logger.error('Failed to get token from storage:', error);
      return null;
    }
  }

  static setToken(token: string): void {
    try {
      localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, token);
    } catch (error) {
      logger.error('Failed to save token to storage:', error);
    }
  }

  static removeToken(): void {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
    } catch (error) {
      logger.error('Failed to remove token from storage:', error);
    }
  }

  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      return Date.now() >= expirationTime;
    } catch (error) {
      logger.error('Failed to parse token:', error);
      return true;
    }
  }

  static getTokenExpiration(token: string): Date | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return new Date(payload.exp * 1000);
    } catch (error) {
      logger.error('Failed to get token expiration:', error);
      return null;
    }
  }

  static getTokenPayload(token: string): Record<string, unknown> | null {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
      logger.error('Failed to get token payload:', error);
      return null;
    }
  }
}

/**
 * User data management utilities
 */
export class UserManager {
  static getUser(): User | null {
    try {
      const userStr = localStorage.getItem(AUTH_STORAGE_KEYS.USER);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      logger.error('Failed to get user from storage:', error);
      return null;
    }
  }

  static setUser(user: User): void {
    try {
      localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
      logger.error('Failed to save user to storage:', error);
    }
  }

  static removeUser(): void {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
    } catch (error) {
      logger.error('Failed to remove user from storage:', error);
    }
  }

  static clearAuthData(): void {
    TokenManager.removeToken();
    UserManager.removeUser();
    try {
      localStorage.removeItem(AUTH_STORAGE_KEYS.REMEMBER_ME);
    } catch (error) {
      logger.error('Failed to clear auth data:', error);
    }
  }
}

/**
 * HTTP Response types
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

/**
 * Custom HTTP client with JWT interceptors
 */
export class HttpClient {
  private baseURL: string;
  private timeout: number;

  constructor(baseURL: string = API_CONFIG.BASE_URL, timeout: number = API_CONFIG.TIMEOUT) {
    this.baseURL = baseURL;
    this.timeout = timeout;
  }

  private async request<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add JWT token if available and not a login request
    const token = TokenManager.getToken();
    if (token && !endpoint.includes('/auth/login')) {
      // Check if token is expired
      if (TokenManager.isTokenExpired(token)) {
        UserManager.clearAuthData();
        throw new ApiError('Token expirado. Faça login novamente.', 401, 'TOKEN_EXPIRED');
      }

      headers['Authorization'] = `Bearer ${token}`;
    }

    // Prepare request config
    const config: RequestInit = {
      ...options,
      headers,
      signal: AbortSignal.timeout(this.timeout),
    };

    try {
      const response = await fetch(url, config);

      // Handle different response statuses
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const data = await response.json();
      return data;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('Timeout na requisição. Tente novamente.', 408, 'TIMEOUT');
      }

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(
        error instanceof Error ? error.message : 'Erro de conexão. Verifique sua internet.',
        0,
        'NETWORK_ERROR'
      );
    }
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let errorCode = 'HTTP_ERROR';

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
      errorCode = errorData.code || errorCode;
    } catch (parseError) {
      // Failed to parse error response, use default message
    }

    // Handle specific status codes
    switch (response.status) {
      case 401:
        // Unauthorized - clear auth data and redirect
        UserManager.clearAuthData();
        errorMessage = 'Sessão expirada. Faça login novamente.';
        errorCode = 'UNAUTHORIZED';

        // Redirect to login if not already there
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        break;

      case 403:
        errorMessage = 'Acesso negado. Você não tem permissão para esta ação.';
        errorCode = 'FORBIDDEN';
        break;

      case 404:
        errorMessage = 'Recurso não encontrado.';
        errorCode = 'NOT_FOUND';
        break;

      case 422:
        errorMessage = 'Dados inválidos. Verifique as informações enviadas.';
        errorCode = 'VALIDATION_ERROR';
        break;

      case 429:
        errorMessage = 'Muitas tentativas. Aguarde um momento.';
        errorCode = 'RATE_LIMIT';
        break;

      case 500:
        errorMessage = 'Erro interno do servidor. Tente novamente.';
        errorCode = 'SERVER_ERROR';
        break;

      case 503:
        errorMessage = 'Serviço temporariamente indisponível.';
        errorCode = 'SERVICE_UNAVAILABLE';
        break;
    }

    throw new ApiError(errorMessage, response.status, errorCode);
  }

  // HTTP Methods
  async get<T = unknown>(endpoint: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    let url = endpoint;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      url += `?${searchParams.toString()}`;
    }

    return this.request<T>(url, { method: 'GET' });
  }

  async post<T = unknown>(endpoint: string, data?: Record<string, unknown>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = unknown>(endpoint: string, data?: Record<string, unknown>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T = unknown>(endpoint: string, data?: Record<string, unknown>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Create custom error class
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Default HTTP client instance
export const httpClient = new HttpClient();

/**
 * Authentication API calls
 */
export class AuthAPI {
  static async login(username: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    return httpClient.post('/auth/login', { username, password });
  }

  static async logout(): Promise<ApiResponse> {
    return httpClient.post('/auth/logout');
  }

  static async me(): Promise<ApiResponse<{ user: User }>> {
    return httpClient.get('/auth/me');
  }

  static async verifyToken(token: string): Promise<ApiResponse<{ valid: boolean; user?: User }>> {
    return httpClient.post('/auth/verify-token', { token });
  }

  static async getUsers(): Promise<ApiResponse<{ users: User[]; total: number }>> {
    return httpClient.get('/auth/users');
  }

  static async getUser(id: string): Promise<ApiResponse<{ user: User }>> {
    return httpClient.get(`/auth/users/${id}`);
  }

  static async getStatus(): Promise<ApiResponse> {
    return httpClient.get('/auth/status');
  }
}

/**
 * Utility functions
 */
export const formatAuthError = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    const errorObj = error as { response?: { data?: { message?: string } }; message?: string };
    if (errorObj?.response?.data?.message) {
      return errorObj.response.data.message;
    }

    if (errorObj?.message) {
      return errorObj.message;
    }
  }

  return 'Erro desconhecido. Tente novamente.';
};

export const isAuthError = (error: unknown): boolean => {
  return error instanceof ApiError && [401, 403].includes(error.status);
};

export const shouldRetry = (error: unknown, attempt: number): boolean => {
  if (attempt >= API_CONFIG.RETRY_ATTEMPTS) {
    return false;
  }

  if (error instanceof ApiError) {
    // Don't retry auth errors or client errors
    if (error.status >= 400 && error.status < 500) {
      return false;
    }

    // Retry server errors and network errors
    return error.status >= 500 || error.status === 0;
  }

  return true;
};

export default {
  TokenManager,
  UserManager,
  HttpClient,
  httpClient,
  AuthAPI,
  ApiError,
  formatAuthError,
  isAuthError,
  shouldRetry,
};