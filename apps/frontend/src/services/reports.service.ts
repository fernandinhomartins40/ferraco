/**
 * Reports Service - Integração com API de Relatórios
 */

import axios, { AxiosInstance } from 'axios';

const API_URL = '/api/reports';

// ============================================================================
// Types
// ============================================================================

export interface FunnelAnalytics {
  stage: string;
  count: number;
  value: number;
  conversionRate: number;
  dropoffRate: number;
}

export interface CohortData {
  cohort: string;
  total: number;
  converted: number;
  conversionRate: number;
  retentionRate?: number;
}

export interface PerformanceMetrics {
  userId: string;
  userName: string;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  averageResponseTime: number;
  totalCommunications: number;
  activeOpportunities: number;
  totalRevenue: number;
}

export interface FunnelAnalyticsParams {
  dateFrom?: Date;
  dateTo?: Date;
  pipelineId?: string;
}

export interface CohortAnalysisParams {
  metric: 'retention' | 'conversion';
  period?: 'month' | 'quarter' | 'year';
}

export interface PerformanceMetricsParams {
  userId?: string;
  teamId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export type ReportFormat = 'JSON' | 'CSV' | 'EXCEL' | 'PDF';

// ============================================================================
// API Client with Auth
// ============================================================================

const createApiClient = (): AxiosInstance => {
  const client = axios.create();

  // Interceptor para adicionar token de autenticação
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

// ============================================================================
// Service Methods
// ============================================================================

export const reportsService = {
  /**
   * Buscar analytics de funil de vendas
   */
  async getFunnelAnalytics(params?: FunnelAnalyticsParams): Promise<FunnelAnalytics[]> {
    const response = await apiClient.get(`${API_URL}/analytics/funnel`, {
      params: {
        dateFrom: params?.dateFrom?.toISOString(),
        dateTo: params?.dateTo?.toISOString(),
        pipelineId: params?.pipelineId,
      },
    });
    return response.data.data;
  },

  /**
   * Buscar análise de cohort
   */
  async getCohortAnalysis(params: CohortAnalysisParams): Promise<CohortData[]> {
    const response = await apiClient.get(`${API_URL}/analytics/cohort`, {
      params,
    });
    return response.data.data;
  },

  /**
   * Buscar métricas de performance
   */
  async getPerformanceMetrics(params?: PerformanceMetricsParams): Promise<PerformanceMetrics[]> {
    const response = await apiClient.get(`${API_URL}/analytics/performance`, {
      params: {
        userId: params?.userId,
        teamId: params?.teamId,
        dateFrom: params?.dateFrom?.toISOString(),
        dateTo: params?.dateTo?.toISOString(),
      },
    });
    return response.data.data;
  },

  /**
   * Exportar relatório
   */
  async exportReport(format: ReportFormat, filters?: Record<string, any>): Promise<Blob> {
    const response = await apiClient.get(`${API_URL}/export`, {
      params: { format, ...filters },
      responseType: 'blob',
    });
    return response.data;
  },
};
