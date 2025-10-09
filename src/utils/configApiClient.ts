/**
 * API Client para Configurações do Chatbot
 * Substitui localStorage por chamadas à API
 */

import { apiClient } from '@/lib/apiClient';

export interface CompanyData {
  id?: string;
  name: string;
  industry: string;
  description: string;
  differentials: string[];
  targetAudience: string;
  location: string;
  workingHours: string;
  phone?: string;
  website?: string;
}

export interface Product {
  id?: string;
  name: string;
  description: string;
  category: string;
  price?: string;
  keywords: string[];
  benefits: string[];
  isActive: boolean;
  createdAt?: string;
}

export interface FAQItem {
  id?: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
}

export interface ChatbotConfig {
  id?: string;
  toneOfVoice: 'formal' | 'casual' | 'friendly' | 'professional';
  greetingMessage: string;
  enableSmallTalk: boolean;
}

export interface ChatLink {
  id?: string;
  name: string;
  source: string;
  url: string;
  shortCode: string;
  clicks: number;
  leads: number;
  isActive: boolean;
  createdAt?: string;
}

export const configApi = {
  // ============================================
  // COMPANY DATA
  // ============================================

  async getCompanyData(): Promise<CompanyData | null> {
    try {
      const response = await apiClient.get('/config/company');
      return response.data?.data || null;
    } catch (error) {
      console.error('Erro ao buscar dados da empresa:', error);
      return null;
    }
  },

  async saveCompanyData(data: CompanyData): Promise<CompanyData> {
    const response = await apiClient.post('/config/company', data);
    return response.data?.data || response.data;
  },

  // ============================================
  // PRODUCTS
  // ============================================

  async getProducts(): Promise<Product[]> {
    try {
      const response = await apiClient.get('/config/products');
      return response.data?.data || [];
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      return [];
    }
  },

  async createProduct(data: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    const response = await apiClient.post('/config/products', data);
    return response.data?.data || response.data;
  },

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const response = await apiClient.put(`/config/products/${id}`, data);
    return response.data?.data || response.data;
  },

  async deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`/config/products/${id}`);
  },

  // ============================================
  // FAQs
  // ============================================

  async getFAQs(): Promise<FAQItem[]> {
    try {
      const response = await apiClient.get('/config/faqs');
      return response.data?.data || [];
    } catch (error) {
      console.error('Erro ao buscar FAQs:', error);
      return [];
    }
  },

  async createFAQ(data: Omit<FAQItem, 'id'>): Promise<FAQItem> {
    const response = await apiClient.post('/config/faqs', data);
    return response.data?.data || response.data;
  },

  async updateFAQ(id: string, data: Partial<FAQItem>): Promise<FAQItem> {
    const response = await apiClient.put(`/config/faqs/${id}`, data);
    return response.data?.data || response.data;
  },

  async deleteFAQ(id: string): Promise<void> {
    await apiClient.delete(`/config/faqs/${id}`);
  },

  // ============================================
  // CHATBOT CONFIG
  // ============================================

  async getChatbotConfig(): Promise<ChatbotConfig | null> {
    try {
      const response = await apiClient.get('/config/chatbot-config');
      return response.data?.data || null;
    } catch (error) {
      console.error('Erro ao buscar config do chatbot:', error);
      return null;
    }
  },

  async saveChatbotConfig(data: ChatbotConfig): Promise<ChatbotConfig> {
    const response = await apiClient.post('/config/chatbot-config', data);
    return response.data?.data || response.data;
  },

  // ============================================
  // CHAT LINKS
  // ============================================

  async getChatLinks(): Promise<ChatLink[]> {
    try {
      const response = await apiClient.get('/config/chat-links');
      return response.data?.data || [];
    } catch (error) {
      console.error('Erro ao buscar links de chat:', error);
      return [];
    }
  },

  async createChatLink(data: Omit<ChatLink, 'id' | 'createdAt' | 'clicks' | 'leads'>): Promise<ChatLink> {
    const response = await apiClient.post('/config/chat-links', data);
    return response.data?.data || response.data;
  },

  async deleteChatLink(id: string): Promise<void> {
    await apiClient.delete(`/config/chat-links/${id}`);
  },

  // ============================================
  // CHATBOT DATA (Endpoint público - sem autenticação)
  // ============================================

  async getChatbotData(): Promise<{
    config: ChatbotConfig;
    company: CompanyData;
    products: Product[];
    faqs: FAQItem[];
  }> {
    try {
      // Usar fetch diretamente pois não precisa de autenticação
      const API_URL = import.meta.env.VITE_API_URL ||
                      (import.meta.env.PROD ? '/api' : 'http://localhost:3002/api');

      const response = await fetch(`${API_URL}/config/chatbot-data`);
      const result = await response.json();

      return result.data || {
        config: {},
        company: {},
        products: [],
        faqs: []
      };
    } catch (error) {
      console.error('Erro ao buscar dados do chatbot:', error);
      return {
        config: {} as ChatbotConfig,
        company: {} as CompanyData,
        products: [],
        faqs: []
      };
    }
  }
};
