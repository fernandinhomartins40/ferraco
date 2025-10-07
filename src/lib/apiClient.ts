import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

// Tipos para as respostas da API
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Tipos para erro da API
export interface ApiError {
  success: false;
  message: string;
  error: string;
  statusCode?: number;
}

// Configuração do cliente Axios
class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;
  private useMock: boolean = import.meta.env.VITE_USE_MOCK_API === 'true';

  constructor() {
    // Base URL dinâmica baseada no ambiente
    // Em produção, usa caminho relativo /api (proxy do Nginx)
    // Em desenvolvimento, usa localhost:3002/api ou variável de ambiente
    let baseURL: string | undefined;

    if (this.useMock) {
      baseURL = undefined;
    } else if (import.meta.env.VITE_API_URL) {
      baseURL = import.meta.env.VITE_API_URL;
    } else if (import.meta.env.PROD) {
      // Em produção, usa caminho relativo (Nginx faz proxy)
      baseURL = '/api';
    } else {
      // Em desenvolvimento local
      baseURL = 'http://localhost:3002/api';
    }

    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.loadTokenFromStorage();
  }

  private setupInterceptors() {
    // Interceptor de requisição - adiciona token automaticamente
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }

        // Log da requisição em desenvolvimento
        if (import.meta.env.DEV) {
          logger.debug(`API ${config.method?.toUpperCase()}: ${config.url}`, {
            data: config.data,
            params: config.params,
            headers: config.headers,
          });
        }

        return config;
      },
      (error) => {
        logger.error('Erro na requisição:', error);
        return Promise.reject(error);
      }
    );

    // Interceptor de resposta - trata erros globalmente
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log da resposta em desenvolvimento
        if (import.meta.env.DEV) {
          logger.debug(`API Response: ${response.config.url}`, response.data);
        }

        return response;
      },
      (error: AxiosError) => {
        const statusCode = error.response?.status;
        const errorData = error.response?.data as ApiError;

        // Log do erro
        logger.error('Erro na resposta da API:', {
          status: statusCode,
          data: errorData,
          url: error.config?.url,
          method: error.config?.method,
        });

        // Tratar diferentes tipos de erro
        switch (statusCode) {
          case 401:
            this.handleUnauthorized(errorData);
            break;
          case 403:
            this.handleForbidden(errorData);
            break;
          case 404:
            this.handleNotFound(errorData);
            break;
          case 422:
            this.handleValidationError(errorData);
            break;
          case 500:
            this.handleServerError(errorData);
            break;
          default:
            this.handleGenericError(error);
        }

        return Promise.reject(error);
      }
    );
  }

  // Gerenciamento de token
  public setToken(token: string) {
    this.token = token;
    // Usar as mesmas chaves do AuthContext
    localStorage.setItem('ferraco_auth_token', token);
    sessionStorage.setItem('ferraco_auth_token', token);
  }

  public removeToken() {
    this.token = null;
    // Usar as mesmas chaves do AuthContext
    localStorage.removeItem('ferraco_auth_token');
    sessionStorage.removeItem('ferraco_auth_token');
    localStorage.removeItem('ferraco_auth_user');
    sessionStorage.removeItem('ferraco_auth_user');
    localStorage.removeItem('ferraco_remember_me');
  }

  private loadTokenFromStorage() {
    // Usar as mesmas chaves do AuthContext
    const token = localStorage.getItem('ferraco_auth_token') || sessionStorage.getItem('ferraco_auth_token');
    if (token) {
      this.token = token;
    }
  }

  // Handlers de erro
  private handleUnauthorized(error?: ApiError) {
    const message = error?.message || 'Sessão expirada. Faça login novamente.';
    toast.error(message);

    // Limpar token e redirecionar para login
    this.removeToken();

    // Disparar evento para o AuthContext
    window.dispatchEvent(new CustomEvent('auth:logout', {
      detail: { reason: 'unauthorized', message }
    }));
  }

  private handleForbidden(error?: ApiError) {
    const message = error?.message || 'Você não tem permissão para esta ação.';
    toast.error(message);
  }

  private handleNotFound(error?: ApiError) {
    const message = error?.message || 'Recurso não encontrado.';
    toast.error(message);
  }

  private handleValidationError(error?: ApiError) {
    const message = error?.message || 'Dados inválidos. Verifique as informações.';
    toast.error(message);
  }

  private handleServerError(error?: ApiError) {
    const message = error?.message || 'Erro interno do servidor. Tente novamente.';
    toast.error(message);
  }

  private handleGenericError(error: AxiosError) {
    if (error.code === 'ECONNABORTED') {
      toast.error('Tempo limite da requisição excedido. Tente novamente.');
    } else if (error.code === 'ERR_NETWORK') {
      toast.error('Erro de conexão. Verifique sua internet.');
    } else {
      toast.error('Erro inesperado. Tente novamente.');
    }
  }

  // Métodos HTTP públicos
  public async get<T = unknown>(url: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    if (this.useMock) {
      return this.makeMockRequest<T>(url, 'GET');
    }
    const response = await this.client.get(url, { params });
    return response.data;
  }

  public async post<T = unknown>(url: string, data?: Record<string, unknown>): Promise<ApiResponse<T>> {
    if (this.useMock) {
      return this.makeMockRequest<T>(url, 'POST', data);
    }
    const response = await this.client.post(url, data);
    return response.data;
  }

  public async put<T = unknown>(url: string, data?: Record<string, unknown>): Promise<ApiResponse<T>> {
    if (this.useMock) {
      return this.makeMockRequest<T>(url, 'PUT', data);
    }
    const response = await this.client.put(url, data);
    return response.data;
  }

  public async patch<T = unknown>(url: string, data?: Record<string, unknown>): Promise<ApiResponse<T>> {
    if (this.useMock) {
      return this.makeMockRequest<T>(url, 'PATCH', data);
    }
    const response = await this.client.patch(url, data);
    return response.data;
  }

  public async delete<T = unknown>(url: string): Promise<ApiResponse<T>> {
    if (this.useMock) {
      return this.makeMockRequest<T>(url, 'DELETE');
    }
    const response = await this.client.delete(url);
    return response.data;
  }

  // Método para upload de arquivos
  public async upload<T = unknown>(url: string, formData: FormData): Promise<ApiResponse<T>> {
    const response = await this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Método para download de arquivos
  public async download(url: string, filename?: string): Promise<void> {
    const response = await this.client.get(url, {
      responseType: 'blob',
    });

    // Criar URL do blob e fazer download
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  // Métodos mock para quando não há backend
  private generateMockData(url: string): Record<string, unknown> {
    if (url.includes('/partial-leads')) {
      return {
        id: Math.random().toString(36).substr(2, 9),
        sessionId: 'mock-session-' + Math.random().toString(36).substr(2, 9),
        name: 'Cliente Mock',
        phone: '+5511999999999',
        source: 'mock',
        url: window.location.href,
        userAgent: navigator.userAgent,
        firstInteraction: new Date().toISOString(),
        lastUpdate: new Date().toISOString(),
        interactions: 1,
        completed: false,
        abandoned: false,
        createdAt: new Date().toISOString(),
      };
    }
    return {};
  }

  private async makeMockRequest<T>(url: string, method: string, data?: Record<string, unknown>): Promise<ApiResponse<T>> {
    // Simular um atraso de rede
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
    
    try {
      // Simular diferentes respostas baseadas no endpoint
      let responseData;
      if (method === 'GET' && url.includes('/health')) {
        responseData = { message: 'OK' };
      } else if (method === 'GET' && url.includes('/partial-leads')) {
        // Simular lista de leads parciais
        responseData = {
          data: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, i) => ({
            ...this.generateMockData(url),
            id: `mock-lead-${i + 1}`
          })),
          stats: {
            total: 10,
            active: 5,
            converted: 3,
            abandoned: 2,
            todayCount: 2,
            conversionRate: 30
          },
          pagination: {
            page: 1,
            limit: 10,
            total: 10,
            totalPages: 1
          }
        };
      } else {
        responseData = this.generateMockData(url);
      }

      return {
        success: true,
        message: 'Operação realizada com sucesso',
        data: responseData as T
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro na requisição mock',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // Método para verificar saúde da API
  public async healthCheck(): Promise<boolean> {
    if (this.useMock) {
      // Simular verificação de saúde
      await new Promise(resolve => setTimeout(resolve, 100));
      return true;
    }
    
    try {
      await this.get('/health');
      return true;
    } catch {
      return false;
    }
  }

  // Getter para acessar cliente Axios diretamente se necessário
  public get axios() {
    return this.client;
  }
}

// Instância singleton do cliente
export const apiClient = new ApiClient();

// Export default para compatibilidade
export default apiClient;

// Utilitários para tratamento de erros
export const isApiError = (error: unknown): error is AxiosError => {
  return typeof error === 'object' && error !== null && 'isAxiosError' in error && error.isAxiosError === true;
};

export const getApiErrorMessage = (error: unknown): string => {
  if (isApiError(error)) {
    const apiError = error.response?.data as ApiError;
    return apiError?.message || apiError?.error || 'Erro na comunicação com o servidor';
  }
  return 'Erro inesperado';
};

// Hook utilitário para usar com React Query
export const createApiErrorHandler = (defaultMessage = 'Erro na operação') => {
  return (error: unknown) => {
    const message = getApiErrorMessage(error);
    toast.error(message || defaultMessage);
    logger.error('API Error:', error);
  };
};