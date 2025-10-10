// Stub para apiClient (backend foi removido)
// Retorna sempre dados vazios para compatibilidade
import type { ApiResponse, PaginatedResponse } from '@ferraco/shared';

export interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface RequestConfig {
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
}

class ApiClient {
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig = {}) {
    this.config = config;
  }

  async get<T = unknown>(
    url: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    console.log('[ApiClient Stub] GET', url, config);
    return {
      data: null as T,
      success: false,
      message: 'Backend não disponível (stub mode)',
    };
  }

  async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    console.log('[ApiClient Stub] POST', url, data, config);
    return {
      data: null as T,
      success: false,
      message: 'Backend não disponível (stub mode)',
    };
  }

  async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    console.log('[ApiClient Stub] PUT', url, data, config);
    return {
      data: null as T,
      success: false,
      message: 'Backend não disponível (stub mode)',
    };
  }

  async patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    console.log('[ApiClient Stub] PATCH', url, data, config);
    return {
      data: null as T,
      success: false,
      message: 'Backend não disponível (stub mode)',
    };
  }

  async delete<T = unknown>(
    url: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    console.log('[ApiClient Stub] DELETE', url, config);
    return {
      data: null as T,
      success: false,
      message: 'Backend não disponível (stub mode)',
    };
  }
}

export const apiClient = new ApiClient();

export default apiClient;
