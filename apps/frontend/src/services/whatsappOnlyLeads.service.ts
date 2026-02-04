/**
 * WhatsApp Only Leads Service
 *
 * Serviço para gerenciar leads capturados no modo "whatsapp_only"
 */

import { apiClient } from '@/lib/api-client';
import { logger } from '@/lib/logger';

// ============================================================================
// Types
// ============================================================================

export interface WhatsAppOnlyLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  interest: string;
  userAgent: string;
  referer: string;
  mode: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppOnlyLeadsFilters {
  page?: number;
  limit?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  source?: string;
}

export interface WhatsAppOnlyLeadsResponse {
  success: boolean;
  data: WhatsAppOnlyLead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface WhatsAppOnlyLeadsStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  bySource: Record<string, number>;
}

export interface WhatsAppOnlyLeadsStatsResponse {
  success: boolean;
  data: WhatsAppOnlyLeadsStats;
}

// ============================================================================
// WhatsApp Only Leads Service
// ============================================================================

export const whatsappOnlyLeadsService = {
  /**
   * Listar leads WhatsApp Only com paginação e filtros
   */
  async list(filters: WhatsAppOnlyLeadsFilters = {}): Promise<WhatsAppOnlyLeadsResponse> {
    try {
      logger.info('📋 Buscando leads WhatsApp Only', { filters });

      const params = new URLSearchParams();
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.source) params.append('source', filters.source);

      const response = await apiClient.get<WhatsAppOnlyLeadsResponse>(
        `/admin/whatsapp-only-leads?${params.toString()}`
      );

      logger.info('✅ Leads carregados', {
        total: response.data.pagination.total,
        page: response.data.pagination.page,
      });

      return response.data;
    } catch (error: any) {
      logger.error('❌ Erro ao buscar leads WhatsApp Only', {
        error: error.message,
      });
      throw new Error(
        error.response?.data?.message || 'Erro ao buscar leads'
      );
    }
  },

  /**
   * Buscar estatísticas dos leads WhatsApp Only
   */
  async getStats(): Promise<WhatsAppOnlyLeadsStats> {
    try {
      logger.info('📊 Buscando estatísticas de leads WhatsApp Only');

      const response = await apiClient.get<WhatsAppOnlyLeadsStatsResponse>(
        '/admin/whatsapp-only-leads/stats'
      );

      logger.info('✅ Estatísticas carregadas', response.data.data);

      return response.data.data;
    } catch (error: any) {
      logger.error('❌ Erro ao buscar estatísticas', {
        error: error.message,
      });
      throw new Error(
        error.response?.data?.message || 'Erro ao buscar estatísticas'
      );
    }
  },

  /**
   * Exportar leads para Excel
   * @param filters - Filtros opcionais
   * @returns Promise<void> - Inicia download do arquivo
   */
  async exportToExcel(filters: WhatsAppOnlyLeadsFilters = {}): Promise<void> {
    try {
      logger.info('📊 Exportando leads para Excel', { filters });

      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.source) params.append('source', filters.source);

      const response = await apiClient.get(
        `/admin/whatsapp-only-leads/export?${params.toString()}`,
        {
          responseType: 'blob',
        }
      );

      // Criar blob e fazer download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `leads_whatsapp_only_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      logger.info('✅ Exportação concluída');
    } catch (error: any) {
      logger.error('❌ Erro ao exportar leads', {
        error: error.message,
      });
      throw new Error(
        error.response?.data?.message || 'Erro ao exportar leads para Excel'
      );
    }
  },

  /**
   * Formatar telefone para exibição
   */
  formatPhone(phone: string): string {
    // Remove +55 e formata (11) 99999-9999
    const cleaned = phone.replace(/^\+55/, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  },

  /**
   * Formatar source para exibição amigável
   */
  formatSource(source: string): string {
    const sourceMap: Record<string, string> = {
      'landing-page': 'Landing Page',
      'modal-orcamento': 'Modal de Orçamento',
      'chatbot-web': 'Chatbot Web',
      'whatsapp-bot': 'WhatsApp Bot',
    };

    // Verificar se é modal de produto
    if (source.startsWith('modal-produto-')) {
      const productId = source.replace('modal-produto-', '');
      return `Modal de Produto (${productId})`;
    }

    return sourceMap[source] || source;
  },
};
