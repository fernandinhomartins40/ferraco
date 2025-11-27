import axios, { AxiosInstance } from 'axios';

const API_URL = '/api/template-library';

const createApiClient = (): AxiosInstance => {
  const client = axios.create();

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
          console.error('Erro ao parsear auth storage:', error);
        }
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  return client;
};

const apiClient = createApiClient();

export enum TemplateLibraryCategory {
  AUTOMATION = 'AUTOMATION',
  RECURRENCE = 'RECURRENCE',
  GENERIC = 'GENERIC',
  CUSTOM = 'CUSTOM',
  SYSTEM = 'SYSTEM',
}

export interface MessageTemplateLibrary {
  id: string;
  name: string;
  description?: string;
  category: TemplateLibraryCategory;
  content: string;
  mediaUrls?: string;
  mediaType?: string;
  availableVariables: string;
  isActive: boolean;
  isSystem: boolean;
  isFavorite: boolean;
  usageCount: number;
  triggerType?: string;
  minCaptures?: number;
  maxCaptures?: number;
  daysSinceCapture?: number;
  triggerConditions?: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateDto {
  name: string;
  description?: string;
  category: TemplateLibraryCategory;
  content: string;
  mediaUrls?: string[];
  mediaType?: string;
  triggerType?: string;
  minCaptures?: number;
  maxCaptures?: number;
  daysSinceCapture?: number;
  triggerConditions?: Record<string, any>;
  priority?: number;
}

export interface UpdateTemplateDto {
  name?: string;
  description?: string;
  category?: TemplateLibraryCategory;
  content?: string;
  mediaUrls?: string[];
  mediaType?: string;
  isActive?: boolean;
  isFavorite?: boolean;
  triggerType?: string;
  minCaptures?: number;
  maxCaptures?: number;
  daysSinceCapture?: number;
  triggerConditions?: Record<string, any>;
  priority?: number;
}

export interface TemplateFilters {
  category?: TemplateLibraryCategory;
  isActive?: boolean;
  isSystem?: boolean;
  isFavorite?: boolean;
  triggerType?: string;
  search?: string;
}

export interface TemplateVariable {
  key: string;
  description: string;
  category: 'lead' | 'company' | 'system' | 'capture';
  example: string;
}

export interface TemplatePreviewResponse {
  original: string;
  processed: string;
  variables: string[];
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
}

export interface TemplateStats {
  total: number;
  byCategory: Record<TemplateLibraryCategory, number>;
  active: number;
  inactive: number;
  system: number;
  custom: number;
  favorites: number;
  mostUsed: Array<{
    id: string;
    name: string;
    usageCount: number;
  }>;
}

export const templateLibraryService = {
  /**
   * Listar templates com filtros
   */
  async list(filters?: TemplateFilters): Promise<MessageTemplateLibrary[]> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.category) params.append('category', filters.category);
      if (filters.isActive !== undefined) params.append('isActive', String(filters.isActive));
      if (filters.isSystem !== undefined) params.append('isSystem', String(filters.isSystem));
      if (filters.isFavorite !== undefined) params.append('isFavorite', String(filters.isFavorite));
      if (filters.triggerType) params.append('triggerType', filters.triggerType);
      if (filters.search) params.append('search', filters.search);
    }

    const response = await apiClient.get(`${API_URL}?${params.toString()}`);
    return response.data;
  },

  /**
   * Buscar template por ID
   */
  async getById(id: string): Promise<MessageTemplateLibrary> {
    const response = await apiClient.get(`${API_URL}/${id}`);
    return response.data;
  },

  /**
   * Criar novo template
   */
  async create(data: CreateTemplateDto): Promise<MessageTemplateLibrary> {
    const response = await apiClient.post(API_URL, data);
    return response.data;
  },

  /**
   * Atualizar template
   */
  async update(id: string, data: UpdateTemplateDto): Promise<MessageTemplateLibrary> {
    const response = await apiClient.put(`${API_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Deletar template
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`${API_URL}/${id}`);
  },

  /**
   * Duplicar template
   */
  async duplicate(id: string): Promise<MessageTemplateLibrary> {
    const response = await apiClient.post(`${API_URL}/${id}/duplicate`);
    return response.data;
  },

  /**
   * Gerar preview do template
   */
  async preview(templateId?: string, content?: string): Promise<TemplatePreviewResponse> {
    const response = await apiClient.post(`${API_URL}/preview`, {
      templateId,
      content,
    });
    return response.data;
  },

  /**
   * Obter estatísticas
   */
  async getStats(): Promise<TemplateStats> {
    const response = await apiClient.get(`${API_URL}/stats`);
    return response.data;
  },

  /**
   * Obter variáveis disponíveis
   */
  async getAvailableVariables(): Promise<Record<string, TemplateVariable[]>> {
    const response = await apiClient.get(`${API_URL}/variables`);
    return response.data;
  },
};
