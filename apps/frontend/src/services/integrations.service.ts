/**
 * Integrations Service - Integração com API de Integrações
 */

import axios, { AxiosInstance } from 'axios';

const API_URL = '/api/integrations';

// ============================================================================
// Types
// ============================================================================

export interface Integration {
  id: string;
  name: string;
  type: 'WHATSAPP' | 'EMAIL' | 'WEBHOOK' | 'API' | 'CUSTOM';
  isActive: boolean;
  config: Record<string, any>;
  credentials: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIntegrationData {
  name: string;
  type: 'WHATSAPP' | 'EMAIL' | 'WEBHOOK' | 'API' | 'CUSTOM';
  config?: Record<string, any>;
  credentials?: Record<string, any>;
  isActive?: boolean;
}

export interface UpdateIntegrationData {
  name?: string;
  config?: Record<string, any>;
  credentials?: Record<string, any>;
  isActive?: boolean;
}

// ============================================================================
// API Client with Auth
// ============================================================================

const createApiClient = (): AxiosInstance => {
  const client = axios.create();

  // Interceptor para adicionar token de autenticação
  client.interceptors.request.use(
    (config) => {
      const authStorage = localStorage.getItem('ferraco-auth-storage');
      if (authStorage) {
        try {
          const parsed = JSON.parse(authStorage);
          const token = parsed.state?.token;
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Erro ao ler token de autenticação:', error);
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  return client;
};

const apiClient = createApiClient();

// ============================================================================
// Service Methods
// ============================================================================

export const integrationsService = {
  /**
   * Listar todas as integrações
   */
  async getAll(): Promise<Integration[]> {
    const response = await apiClient.get(API_URL);
    return response.data.data;
  },

  /**
   * Buscar integração por tipo
   */
  async getByType(type: string): Promise<Integration | null> {
    const response = await apiClient.get(`${API_URL}?type=${type}`);
    const integrations = response.data.data;
    return integrations.length > 0 ? integrations[0] : null;
  },

  /**
   * Buscar integração por ID
   */
  async getById(id: string): Promise<Integration> {
    const response = await apiClient.get(`${API_URL}/${id}`);
    return response.data.data;
  },

  /**
   * Criar nova integração
   */
  async create(data: CreateIntegrationData): Promise<Integration> {
    const response = await apiClient.post(API_URL, data);
    return response.data.data;
  },

  /**
   * Atualizar integração
   */
  async update(id: string, data: UpdateIntegrationData): Promise<Integration> {
    const response = await apiClient.put(`${API_URL}/${id}`, data);
    return response.data.data;
  },

  /**
   * Deletar integração
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`${API_URL}/${id}`);
  },

  /**
   * Testar conexão da integração
   */
  async testConnection(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`${API_URL}/${id}/test`);
    return response.data.data;
  },
};
