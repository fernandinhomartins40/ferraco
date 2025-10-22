import { apiClient } from '../lib/apiClient';

// ============================================================================
// Types
// ============================================================================

export interface WhatsAppAutomationStats {
  total: number;
  pending: number;
  processing: number;
  sent: number;
  failed: number;
  totalMessages: number;
  successRate: number;
  lastExecutionAt: string | null;
  queueSize: number;
  isProcessing: boolean;
}

export interface WhatsAppAutomation {
  id: string;
  leadId: string;
  status: 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED';
  productsToSend: string;
  messagesTotal: number;
  messagesSent: number;
  error?: string | null;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  lead?: {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
  };
  messages?: WhatsAppAutomationMessage[];
}

export interface WhatsAppAutomationMessage {
  id: string;
  automationId: string;
  messageType: string;
  content?: string | null;
  mediaUrl?: string | null;
  status: string;
  order: number;
  sentAt?: string | null;
}

export interface WhatsAppAutomationDetail {
  automation: WhatsAppAutomation;
  timeline: Array<{
    timestamp: string;
    event: string;
    details: string;
  }>;
}

export interface WhatsAppAutomationFilters {
  status?: 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED';
  leadId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// Service
// ============================================================================

export const whatsappAutomationService = {
  /**
   * Buscar estatísticas gerais
   */
  async getStats(): Promise<WhatsAppAutomationStats> {
    const response = await apiClient.get('/whatsapp-automations/stats');
    return response.data.data;
  },

  /**
   * Listar automações com filtros
   */
  async list(filters?: WhatsAppAutomationFilters): Promise<{
    data: WhatsAppAutomation[];
    total: number;
    page: number;
    limit: number;
  }> {
    const response = await apiClient.get('/whatsapp-automations', { params: filters });
    return response.data;
  },

  /**
   * Buscar detalhes de uma automação
   */
  async getById(id: string): Promise<WhatsAppAutomationDetail> {
    const response = await apiClient.get(`/whatsapp-automations/${id}`);
    return response.data.data;
  },

  /**
   * Buscar automações de um lead
   */
  async getByLeadId(leadId: string): Promise<WhatsAppAutomation[]> {
    const response = await apiClient.get(`/whatsapp-automations/lead/${leadId}`);
    return response.data.data;
  },

  /**
   * Criar nova automação
   */
  async create(leadId: string, productsToSend: string[]): Promise<WhatsAppAutomation> {
    const response = await apiClient.post('/whatsapp-automations', {
      leadId,
      productsToSend
    });
    return response.data.data;
  },

  /**
   * Retry de automação específica
   */
  async retry(id: string, resetMessages: boolean = false): Promise<void> {
    await apiClient.post(`/whatsapp-automations/${id}/retry`, {
      resetMessages
    });
  },

  /**
   * Retry em lote de automações falhadas
   */
  async retryAllFailed(leadId?: string): Promise<number> {
    const response = await apiClient.post('/whatsapp-automations/retry-all-failed', {
      leadId
    });
    return response.data.data.count;
  },

  /**
   * Listar apenas automações falhadas
   */
  async listFailed(): Promise<WhatsAppAutomation[]> {
    const response = await apiClient.get('/whatsapp-automations/failed');
    return response.data.data;
  }
};
