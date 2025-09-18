import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { toast } from 'sonner';

// Tipos para as respostas da API
export interface ApiResponse<T = any> {
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

  constructor() {
    // Base URL dinâmica baseada no ambiente
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

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
          console.log(`🔄 API ${config.method?.toUpperCase()}: ${config.url}`, {
            data: config.data,
            params: config.params,
            headers: config.headers,
          });
        }

        return config;
      },
      (error) => {
        console.error('❌ Erro na requisição:', error);
        return Promise.reject(error);
      }
    );

    // Interceptor de resposta - trata erros globalmente
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log da resposta em desenvolvimento
        if (import.meta.env.DEV) {
          console.log(`✅ API Response: ${response.config.url}`, response.data);
        }

        return response;
      },
      (error: AxiosError) => {
        const statusCode = error.response?.status;
        const errorData = error.response?.data as ApiError;

        // Log do erro
        console.error('❌ Erro na resposta da API:', {
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
  public async get<T = any>(url: string, params?: object): Promise<ApiResponse<T>> {
    const response = await this.client.get(url, { params });
    return response.data;
  }

  public async post<T = any>(url: string, data?: object): Promise<ApiResponse<T>> {
    const response = await this.client.post(url, data);
    return response.data;
  }

  public async put<T = any>(url: string, data?: object): Promise<ApiResponse<T>> {
    const response = await this.client.put(url, data);
    return response.data;
  }

  public async patch<T = any>(url: string, data?: object): Promise<ApiResponse<T>> {
    const response = await this.client.patch(url, data);
    return response.data;
  }

  public async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    const response = await this.client.delete(url);
    return response.data;
  }

  // Método para upload de arquivos
  public async upload<T = any>(url: string, formData: FormData): Promise<ApiResponse<T>> {
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

  // Método para verificar saúde da API
  public async healthCheck(): Promise<boolean> {
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
export const isApiError = (error: any): error is AxiosError => {
  return error?.isAxiosError === true;
};

export const getApiErrorMessage = (error: any): string => {
  if (isApiError(error)) {
    const apiError = error.response?.data as ApiError;
    return apiError?.message || apiError?.error || 'Erro na comunicação com o servidor';
  }
  return 'Erro inesperado';
};

// Hook utilitário para usar com React Query
export const createApiErrorHandler = (defaultMessage = 'Erro na operação') => {
  return (error: any) => {
    const message = getApiErrorMessage(error);
    toast.error(message || defaultMessage);
    console.error('API Error:', error);
  };
};