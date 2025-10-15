import axios, { AxiosInstance } from 'axios';

const API_URL = '/api/automation-kanban';

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

export interface AutomationKanbanColumn {
  id: string;
  name: string;
  color: string;
  order: number;
  isActive: boolean;
  description?: string;
  sendIntervalSeconds: number;
  scheduledDate?: string;
  isRecurring: boolean;
  recurringDay?: number;
  messageTemplateId?: string;
  messageTemplate?: WhatsAppMessageTemplate;
  productIds?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    leads: number;
  };
}

export interface WhatsAppMessageTemplate {
  id: string;
  name: string;
  content: string;
  mediaUrls?: string;
  mediaType?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationLeadPosition {
  id: string;
  leadId: string;
  columnId: string;
  lastSentAt?: string;
  nextScheduledAt?: string;
  messagesSentCount: number;
  createdAt: string;
  updatedAt: string;
  lead?: any;
  column?: AutomationKanbanColumn;
}

export interface AutomationSettings {
  id: string;
  columnIntervalSeconds: number;
  maxMessagesPerHour: number;
  maxMessagesPerDay: number;
  sendOnlyBusinessHours: boolean;
  businessHourStart: number;
  businessHourEnd: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAutomationColumnDto {
  name: string;
  color: string;
  description?: string;
  sendIntervalSeconds?: number;
  scheduledDate?: string;
  isRecurring?: boolean;
  recurringDay?: number;
  messageTemplateId?: string;
  productIds?: string[];
}

export interface UpdateAutomationColumnDto extends Partial<CreateAutomationColumnDto> {}

export const automationKanbanService = {
  // Colunas
  async getAllColumns(): Promise<AutomationKanbanColumn[]> {
    const response = await apiClient.get(`${API_URL}/columns`);
    return response.data;
  },

  async createColumn(data: CreateAutomationColumnDto): Promise<AutomationKanbanColumn> {
    const response = await apiClient.post(`${API_URL}/columns`, data);
    return response.data;
  },

  async updateColumn(id: string, data: UpdateAutomationColumnDto): Promise<AutomationKanbanColumn> {
    const response = await apiClient.put(`${API_URL}/columns/${id}`, data);
    return response.data;
  },

  async deleteColumn(id: string): Promise<void> {
    await apiClient.delete(`${API_URL}/columns/${id}`);
  },

  async reorderColumns(columnIds: string[]): Promise<AutomationKanbanColumn[]> {
    const response = await apiClient.put(`${API_URL}/columns/reorder`, { columnIds });
    return response.data;
  },

  // Leads
  async getLeadsInAutomation(): Promise<AutomationLeadPosition[]> {
    const response = await apiClient.get(`${API_URL}/leads`);
    return response.data;
  },

  async moveLeadToColumn(leadId: string, columnId: string): Promise<AutomationLeadPosition> {
    const response = await apiClient.post(`${API_URL}/leads/${leadId}/move`, { columnId });
    return response.data;
  },

  async removeLeadFromAutomation(leadId: string): Promise<void> {
    await apiClient.delete(`${API_URL}/leads/${leadId}`);
  },

  // Configurações
  async getSettings(): Promise<AutomationSettings> {
    const response = await apiClient.get(`${API_URL}/settings`);
    return response.data;
  },

  async updateSettings(data: Partial<AutomationSettings>): Promise<AutomationSettings> {
    const response = await apiClient.put(`${API_URL}/settings`, data);
    return response.data;
  },
};
