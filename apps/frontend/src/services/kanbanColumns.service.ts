import axios, { AxiosInstance } from 'axios';

const API_URL = '/api/kanban-columns';

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

export interface KanbanColumn {
  id: string;
  name: string;
  color: string;
  status: string;
  order: number;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKanbanColumnDto {
  name: string;
  color: string;
  status: string;
}

export interface UpdateKanbanColumnDto {
  name: string;
  color: string;
  status: string;
}

export interface KanbanColumnStats {
  columnId: string;
  name: string;
  color: string;
  status: string;
  count: number;
}

export const kanbanColumnsService = {
  // GET /api/kanban-columns - Listar todas as colunas
  async getAll(): Promise<KanbanColumn[]> {
    const response = await apiClient.get(API_URL);
    return response.data;
  },

  // POST /api/kanban-columns - Criar nova coluna
  async create(data: CreateKanbanColumnDto): Promise<KanbanColumn> {
    const response = await apiClient.post(API_URL, data);
    return response.data;
  },

  // PUT /api/kanban-columns/:id - Atualizar coluna
  async update(id: string, data: UpdateKanbanColumnDto): Promise<KanbanColumn> {
    const response = await apiClient.put(`${API_URL}/${id}`, data);
    return response.data;
  },

  // DELETE /api/kanban-columns/:id - Deletar coluna
  async delete(id: string): Promise<void> {
    await apiClient.delete(`${API_URL}/${id}`);
  },

  // PUT /api/kanban-columns/reorder - Reordenar colunas
  async reorder(columnIds: string[]): Promise<KanbanColumn[]> {
    const response = await apiClient.put(`${API_URL}/reorder`, { columnIds });
    return response.data;
  },

  // GET /api/kanban-columns/stats - Obter estatísticas por coluna
  async getStats(): Promise<KanbanColumnStats[]> {
    const response = await apiClient.get(`${API_URL}/stats`);
    return response.data;
  },
};
