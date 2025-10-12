import axios from 'axios';

const API_URL = '/api/chatbot';

/**
 * Recupera o token de autenticação do storage
 */
const getAuthToken = (): string | null => {
  const authStorage = localStorage.getItem('ferraco-auth-storage');
  if (!authStorage) return null;

  try {
    const parsed = JSON.parse(authStorage);
    return parsed.state?.token || null;
  } catch {
    return null;
  }
};

/**
 * Cria headers com autenticação
 */
const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

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
    const response = await axios.get(`${API_URL}/config`, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  /**
   * Atualiza a configuração do chatbot
   */
  async updateConfig(config: ChatbotConfigUpdate): Promise<ChatbotConfigResponse> {
    const response = await axios.put(`${API_URL}/config`, config, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },
};
