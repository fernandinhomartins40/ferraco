import axios, { AxiosInstance } from 'axios';

const API_URL = '/api/whatsapp-templates';

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

export interface CreateWhatsAppTemplateDto {
  name: string;
  content: string;
  mediaUrls?: string[];
  mediaType?: string;
}

export interface UpdateWhatsAppTemplateDto extends Partial<CreateWhatsAppTemplateDto> {
  isActive?: boolean;
}

export const whatsappMessageTemplateService = {
  async getAll(): Promise<WhatsAppMessageTemplate[]> {
    const response = await apiClient.get(API_URL);
    return response.data;
  },

  async getById(id: string): Promise<WhatsAppMessageTemplate> {
    const response = await apiClient.get(`${API_URL}/${id}`);
    return response.data;
  },

  async create(data: CreateWhatsAppTemplateDto): Promise<WhatsAppMessageTemplate> {
    const response = await apiClient.post(API_URL, data);
    return response.data;
  },

  async update(id: string, data: UpdateWhatsAppTemplateDto): Promise<WhatsAppMessageTemplate> {
    const response = await apiClient.put(`${API_URL}/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`${API_URL}/${id}`);
  },
};
