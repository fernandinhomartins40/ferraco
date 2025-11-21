import axios, { AxiosInstance } from 'axios';

const API_URL = '/api/leads';

/**
 * Cria instância do axios com interceptor para adicionar token
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create();

  // Interceptor para adicionar token em todas as requisições
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

// ============================================
// Types
// ============================================

export interface Lead {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
  company?: string | null;
  position?: string | null;
  status: string; // Status dinâmico baseado nas colunas Kanban
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  source?: string | null;
  score?: number;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  } | null;
  assignedToId?: string | null;
  assignedAt?: string | null;
  teamId?: string | null;
  pipelineStageId?: string | null;
  leadScore?: number;
  isDuplicate?: boolean;
  nextFollowUpAt?: string | null;
  lastContactedAt?: string | null;
  metadata?: string | null;
  customFields?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  tags?: Array<{ id: string; name: string; color: string }>;
  notes?: Array<{ id: string; content: string; createdAt: string }>;
}

export interface CreateLeadData {
  name: string;
  phone: string;
  email?: string;
  company?: string;
  position?: string;
  source?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignedToId?: string;
  teamId?: string;
  metadata?: Record<string, any>;
}

export interface UpdateLeadData extends Partial<CreateLeadData> {
  status?: string; // Status dinâmico baseado nas colunas Kanban
  pipelineStageId?: string;
  nextFollowUpAt?: string;
}

export interface ArchivedLeadsResponse {
  data: Lead[];
  total: number;
}

export interface LeadFilters {
  status?: string;
  priority?: string;
  source?: string;
  assignedToId?: string;
  teamId?: string;
  pipelineStageId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface LeadStats {
  total: number;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  byPriority: Record<string, number>;
  conversionRate: number;
  averageLeadScore: number;
  todayCount: number;
  weekCount: number;
  monthCount: number;
}

export interface LeadTimeline {
  date: string;
  count: number;
}

// ============================================
// Leads Service
// ============================================

export const leadsService = {
  /**
   * Listar todos os leads com filtros, paginação e ordenação
   */
  async getAll(filters?: LeadFilters): Promise<{ data: Lead[]; total: number; page: number; totalPages: number }> {
    const response = await apiClient.get(API_URL, { params: filters });
    return {
      data: response.data.data,
      total: response.data.pagination?.total || 0,
      page: response.data.pagination?.page || 1,
      totalPages: response.data.pagination?.totalPages || 1,
    };
  },

  /**
   * Buscar lead por ID
   */
  async getById(id: string): Promise<Lead> {
    const response = await apiClient.get(`${API_URL}/${id}`);
    return response.data.data;
  },

  /**
   * Criar novo lead
   */
  async create(data: CreateLeadData): Promise<Lead> {
    const response = await apiClient.post(API_URL, data);
    return response.data.data;
  },

  /**
   * Atualizar lead
   */
  async update(id: string, data: UpdateLeadData): Promise<Lead> {
    const response = await apiClient.put(`${API_URL}/${id}`, data);
    return response.data.data;
  },

  /**
   * Deletar lead
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`${API_URL}/${id}`);
  },

  /**
   * Buscar leads (busca textual)
   */
  async search(query: string, filters?: LeadFilters): Promise<{ data: Lead[]; total: number }> {
    const response = await apiClient.get(`${API_URL}/search`, {
      params: { q: query, ...filters },
    });
    return response.data.data;
  },

  /**
   * Obter estatísticas gerais
   */
  async getStats(): Promise<LeadStats> {
    const response = await apiClient.get(`${API_URL}/stats`);
    return response.data.data;
  },

  /**
   * Obter estatísticas por status
   */
  async getStatsByStatus(): Promise<Record<string, number>> {
    const response = await apiClient.get(`${API_URL}/stats/by-status`);
    return response.data.data;
  },

  /**
   * Obter estatísticas por origem
   */
  async getStatsBySource(): Promise<Record<string, number>> {
    const response = await apiClient.get(`${API_URL}/stats/by-source`);
    return response.data.data;
  },

  /**
   * Obter timeline de leads (últimos 30 dias)
   */
  async getTimeline(days: number = 30): Promise<LeadTimeline[]> {
    const response = await apiClient.get(`${API_URL}/stats/timeline`, {
      params: { days },
    });
    return response.data.data;
  },

  /**
   * Atualização em massa
   */
  async bulkUpdate(ids: string[], data: UpdateLeadData): Promise<{ updated: number }> {
    const response = await apiClient.put(`${API_URL}/bulk`, { ids, data });
    return response.data.data;
  },

  /**
   * Encontrar duplicatas
   */
  async findDuplicates(): Promise<Array<{ lead: Lead; duplicates: Lead[] }>> {
    const response = await apiClient.get(`${API_URL}/duplicates`);
    return response.data.data;
  },

  /**
   * Mesclar leads
   */
  async merge(primaryId: string, duplicateIds: string[]): Promise<Lead> {
    const response = await apiClient.post(`${API_URL}/merge`, {
      primaryId,
      duplicateIds,
    });
    return response.data.data;
  },

  /**
   * Exportar leads
   */
  async export(filters?: LeadFilters, format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
    const response = await apiClient.get(`${API_URL}/export`, {
      params: { ...filters, format },
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Obter histórico/timeline de um lead
   */
  async getLeadTimeline(id: string): Promise<any[]> {
    const response = await apiClient.get(`${API_URL}/${id}/timeline`);
    return response.data.data;
  },

  /**
   * Obter histórico de alterações de um lead
   */
  async getLeadHistory(id: string): Promise<any[]> {
    const response = await apiClient.get(`${API_URL}/${id}/history`);
    return response.data.data;
  },

  /**
   * Obter leads arquivados
   */
  async getArchivedLeads(): Promise<ArchivedLeadsResponse> {
    const response = await apiClient.get(`${API_URL}/archived`);
    return response.data.data;
  },

  /**
   * Restaurar lead arquivado
   */
  async restoreArchivedLead(id: string): Promise<Lead> {
    const response = await apiClient.post(`${API_URL}/${id}/restore`);
    return response.data.data;
  },
};
