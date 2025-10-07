import { apiClient } from '@/lib/apiClient';
import { logger } from '@/lib/logger';
import { generateUUID } from '@/utils/uuid';

// Interface dos dados do backend
export interface PartialLead {
  id: string;
  sessionId: string;
  name: string;
  phone: string;
  source: string;
  url: string;
  userAgent: string;
  ipAddress?: string;
  firstInteraction: string;
  lastUpdate: string;
  interactions: number;
  completed: boolean;
  abandoned: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface PartialLeadStats {
  total: number;
  active: number;
  converted: number;
  abandoned: number;
  todayCount: number;
  conversionRate: number;
}

export interface PartialLeadFilters {
  status?: 'all' | 'active' | 'converted' | 'abandoned';
  dateRange?: 'today' | 'week' | 'month' | 'all';
  source?: string;
  search?: string;
  page?: number;
  limit?: number;
}

const SESSION_ID_KEY = 'ferraco_session_id';

// Gerar ou recuperar ID da sessão
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = generateUUID();
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
};

// Obter IP do usuário (melhor esforço)
const getUserIP = async (): Promise<string | undefined> => {
  try {
    // Em produção, você pode usar um serviço como ipapi.co
    // Por enquanto, vamos deixar undefined e o backend pode capturar do req.ip
    return undefined;
  } catch {
    return undefined;
  }
};

export const partialLeadService = {
  // Capturar dados silenciosamente
  async captureFormData(
    name: string,
    phone: string,
    source: string = 'website',
    url: string = window.location.href
  ): Promise<PartialLead | null> {
    try {
      const sessionId = getSessionId();
      const ipAddress = await getUserIP();

      const response = await apiClient.post<PartialLead>('/partial-leads/capture', {
        sessionId,
        name: name.trim(),
        phone: phone.trim(),
        source,
        url,
        userAgent: navigator.userAgent,
        ipAddress,
      });

      if (response.success && response.data) {
        // Log silencioso para debugging (apenas em desenvolvimento)
        if (import.meta.env.DEV) {
          logger.debug('Dados capturados silenciosamente via API:', {
            id: response.data.id,
            name: response.data.name,
            phone: response.data.phone,
            interactions: response.data.interactions,
            source: response.data.source,
          });
        }

        return response.data;
      }

      return null;
    } catch (error) {
      // Falha silenciosa - não queremos interromper a experiência do usuário
      if (import.meta.env.DEV) {
        logger.warn('Erro ao capturar lead parcial (silencioso):', error);
      }
      return null;
    }
  },

  // Marcar lead parcial como convertido
  async markAsConverted(source: string = 'website'): Promise<boolean> {
    try {
      const sessionId = getSessionId();

      const response = await apiClient.post('/partial-leads/mark-converted', {
        sessionId,
        source,
      });

      if (import.meta.env.DEV && response.success) {
        logger.info('Lead parcial marcado como convertido via API');
      }

      return response.success;
    } catch (error) {
      if (import.meta.env.DEV) {
        logger.warn('Erro ao marcar lead como convertido:', error);
      }
      return false;
    }
  },

  // Obter leads parciais (para admin)
  async getPartialLeads(filters: PartialLeadFilters = {}): Promise<{
    leads: PartialLead[];
    stats: PartialLeadStats;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  } | null> {
    try {
      const params = new URLSearchParams();

      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters.dateRange && filters.dateRange !== 'all') {
        params.append('dateRange', filters.dateRange);
      }
      if (filters.source) {
        params.append('source', filters.source);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.page) {
        params.append('page', filters.page.toString());
      }
      if (filters.limit) {
        params.append('limit', filters.limit.toString());
      }

      const response = await apiClient.get<{
        data: PartialLead[];
        stats: PartialLeadStats;
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>(`/partial-leads?${params.toString()}`);

      if (response.success && response.data) {
        return {
          leads: response.data.data,
          stats: response.data.stats,
          pagination: response.data.pagination,
        };
      }

      return null;
    } catch (error) {
      logger.error('Erro ao buscar leads parciais:', error);
      return null;
    }
  },

  // Converter lead parcial em lead real
  async convertPartialLead(partialLeadId: string): Promise<boolean> {
    try {
      const response = await apiClient.post(`/partial-leads/${partialLeadId}/convert`);
      return response.success;
    } catch (error) {
      logger.error('Erro ao converter lead parcial:', error);
      return false;
    }
  },

  // Marcar como abandonado
  async markAsAbandoned(partialLeadId: string): Promise<boolean> {
    try {
      const response = await apiClient.post(`/partial-leads/${partialLeadId}/abandon`);
      return response.success;
    } catch (error) {
      logger.error('Erro ao marcar lead como abandonado:', error);
      return false;
    }
  },

  // Limpar leads antigos
  async cleanupOldLeads(days: number = 30): Promise<{ removedCount: number } | null> {
    try {
      const response = await apiClient.delete<{ removedCount: number }>(`/partial-leads/cleanup?days=${days}`);

      if (response.success && response.data) {
        return { removedCount: response.data.removedCount };
      }

      return null;
    } catch (error) {
      logger.error('Erro ao limpar leads antigos:', error);
      return null;
    }
  },

  // Exportar para CSV
  async exportToCSV(): Promise<boolean> {
    try {
      // Obter todos os leads parciais
      const result = await this.getPartialLeads({ limit: 1000 }); // Limite alto para obter todos

      if (!result || !result.leads.length) {
        logger.warn('Nenhum lead para exportar');
        return false;
      }

      // Converter dados para CSV
      const headers = [
        'ID', 'Nome', 'Telefone', 'Origem', 'URL',
        'Agente Usuário', 'Primeira Interação', 'Última Atualização',
        'Interações', 'Completo', 'Abandonado', 'Criado Em'
      ];

      const csvContent = [
        headers.join(','),
        ...result.leads.map(lead => [
          lead.id,
          `"${lead.name}"`,
          `"${lead.phone}"`,
          `"${lead.source}"`,
          `"${lead.url}"`,
          `"${lead.userAgent}"`,
          lead.firstInteraction,
          lead.lastUpdate,
          lead.interactions,
          lead.completed,
          lead.abandoned,
          lead.createdAt
        ].join(','))
      ].join('\n');

      // Criar e fazer download do arquivo CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `leads_parciais_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      logger.error('Erro ao exportar leads parciais:', error);
      return false;
    }
  },

  // Compatibilidade com a interface anterior (para não quebrar código existente)
  async getStats(): Promise<PartialLeadStats> {
    const result = await this.getPartialLeads({ limit: 1 });
    return result?.stats || {
      total: 0,
      active: 0,
      converted: 0,
      abandoned: 0,
      todayCount: 0,
      conversionRate: 0,
    };
  },

  async filterPartialLeads(filters: PartialLeadFilters): Promise<PartialLead[]> {
    const result = await this.getPartialLeads(filters);
    return result?.leads || [];
  },

  // Método de limpeza (compatibilidade)
  async cleanup(): Promise<number> {
    const result = await this.cleanupOldLeads(30);
    return result?.removedCount || 0;
  },

  // Método para converter (compatibilidade)
  convertToRealLead(partialLeadId: string): Promise<boolean> {
    return this.convertPartialLead(partialLeadId);
  },
};