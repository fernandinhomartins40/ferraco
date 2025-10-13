/**
 * API Client Centralizado
 * Cliente axios configurado com interceptors de autenticação
 * e tratamento automático de refresh token
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { logger } from './logger';

// Tipo para o storage do Zustand
interface AuthStorage {
  state: {
    token: string | null;
    refreshToken: string | null;
    user: any;
    isAuthenticated: boolean;
  };
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

/**
 * Obtém o token do localStorage
 */
const getToken = (): string | null => {
  try {
    const authStorage = localStorage.getItem('ferraco-auth-storage');
    if (!authStorage) return null;

    const parsed: AuthStorage = JSON.parse(authStorage);
    return parsed.state?.token || null;
  } catch (error) {
    logger.error('Erro ao ler token', { error });
    return null;
  }
};

/**
 * Obtém o refresh token do localStorage
 */
const getRefreshToken = (): string | null => {
  try {
    const authStorage = localStorage.getItem('ferraco-auth-storage');
    if (!authStorage) return null;

    const parsed: AuthStorage = JSON.parse(authStorage);
    return parsed.state?.refreshToken || null;
  } catch (error) {
    logger.error('Erro ao ler refresh token', { error });
    return null;
  }
};

/**
 * Atualiza o token no localStorage
 */
const updateTokens = (accessToken: string, refreshToken: string, user: any) => {
  try {
    const authStorage = localStorage.getItem('ferraco-auth-storage');
    if (!authStorage) return;

    const parsed: AuthStorage = JSON.parse(authStorage);
    parsed.state.token = accessToken;
    parsed.state.refreshToken = refreshToken;
    parsed.state.user = user;
    parsed.state.isAuthenticated = true;

    localStorage.setItem('ferraco-auth-storage', JSON.stringify(parsed));
    logger.info('Tokens atualizados com sucesso');
  } catch (error) {
    logger.error('Erro ao atualizar tokens', { error });
  }
};

/**
 * Limpa a autenticação
 */
const clearAuth = () => {
  try {
    const authStorage = localStorage.getItem('ferraco-auth-storage');
    if (!authStorage) return;

    const parsed: AuthStorage = JSON.parse(authStorage);
    parsed.state.token = null;
    parsed.state.refreshToken = null;
    parsed.state.user = null;
    parsed.state.isAuthenticated = false;

    localStorage.setItem('ferraco-auth-storage', JSON.stringify(parsed));
    logger.info('Autenticação limpa');

    // Redirecionar para login
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  } catch (error) {
    logger.error('Erro ao limpar autenticação', { error });
  }
};

/**
 * Cria instância configurada do axios
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: '/api',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // REQUEST INTERCEPTOR - Adiciona token automaticamente
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = getToken();

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => {
      logger.error('Erro no request interceptor', { error });
      return Promise.reject(error);
    }
  );

  // RESPONSE INTERCEPTOR - Trata erros 401 e refresh token
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      // Se erro 401 e não é tentativa de refresh
      if (error.response?.status === 401 && !originalRequest._retry) {
        // Se já está refreshing, adiciona à fila
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(token => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return client(originalRequest);
            })
            .catch(err => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = getRefreshToken();

        if (!refreshToken) {
          logger.warn('Sem refresh token disponível');
          clearAuth();
          return Promise.reject(error);
        }

        try {
          logger.info('Tentando refresh do token');

          const response = await axios.post('/api/auth/refresh', {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken, user } = response.data.data;

          updateTokens(accessToken, newRefreshToken, user);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          processQueue(null, accessToken);
          isRefreshing = false;

          logger.info('Token refreshed com sucesso');
          return client(originalRequest);
        } catch (refreshError) {
          logger.error('Erro ao fazer refresh do token', { refreshError });
          processQueue(refreshError as Error, null);
          isRefreshing = false;
          clearAuth();
          return Promise.reject(refreshError);
        }
      }

      // Log de erros
      if (error.response) {
        logger.error('Erro na resposta da API', {
          status: error.response.status,
          data: error.response.data,
          url: error.config?.url,
        });
      } else if (error.request) {
        logger.error('Erro na requisição (sem resposta)', {
          url: error.config?.url,
        });
      } else {
        logger.error('Erro ao configurar requisição', {
          message: error.message,
        });
      }

      return Promise.reject(error);
    }
  );

  return client;
};

// Instância única do cliente API
export const apiClient = createApiClient();

// Export de utilidades
export { getToken, getRefreshToken, clearAuth };

export default apiClient;
