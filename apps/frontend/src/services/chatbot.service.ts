import axios, { AxiosInstance } from 'axios';

const API_URL = '/api/chatbot';

/**
 * Cria instância do axios com interceptor para adicionar token
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_URL,
  });

  // Interceptor para adicionar token em todas as requisições
  client.interceptors.request.use(
    (config) => {
      // Lê o token do localStorage do Zustand
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

export interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  features: string[];
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface ShareLink {
  id: string;
  name: string;
  platform: string;
  url: string;
}

export interface ChatbotConfigResponse {
  id: string;
  isEnabled: boolean;
  behavior: {
    name: string;
    greeting: string;
    tone: string;
    captureLeads: boolean;
    requireEmail: boolean;
    requirePhone: boolean;
    autoResponse: boolean;
  };
  companyData: {
    name: string;
    description: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    workingHours: string;
  };
  products: Product[];
  faqs: FAQItem[];
  shareLinks: ShareLink[];
  updatedAt: string;
}

export interface ChatbotConfigUpdate {
  botName?: string;
  welcomeMessage?: string;
  tone?: string;
  captureLeads?: boolean;
  requireEmail?: boolean;
  requirePhone?: boolean;
  autoResponse?: boolean;
  companyName?: string;
  companyDescription?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  workingHours?: string;
  products?: Product[];
  faqs?: FAQItem[];
  shareLinks?: ShareLink[];
}

export const chatbotService = {
  /**
   * Busca a configuração do chatbot
   */
  async getConfig(): Promise<ChatbotConfigResponse> {
    const response = await apiClient.get('/config');
    return response.data.data;
  },

  /**
   * Atualiza a configuração do chatbot
   */
  async updateConfig(config: ChatbotConfigUpdate): Promise<ChatbotConfigResponse> {
    const response = await apiClient.put('/config', config);
    return response.data.data;
  },
};
