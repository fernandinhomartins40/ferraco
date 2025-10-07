import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { DashboardMetrics } from '@/types/api';

// Query Keys para cache management
export const dashboardKeys = {
  all: ['dashboard'] as const,
  metrics: () => [...dashboardKeys.all, 'metrics'] as const,
  detailedMetrics: (params?: { period?: string; startDate?: string; endDate?: string }) =>
    [...dashboardKeys.all, 'detailed-metrics', params] as const,
};

// Hook para buscar métricas gerais do dashboard
export function useDashboardMetrics() {
  return useQuery({
    queryKey: dashboardKeys.metrics(),
    queryFn: async (): Promise<DashboardMetrics> => {
      // DEMO MODE: Return mock data instead of API call
      return {
        leadsCount: {
          total: 150,
          novo: 45,
          emAndamento: 67,
          concluido: 38
        },
        conversionRate: 25.3,
        trends: {
          leadsThisWeek: 32,
          leadsLastWeek: 28
        },
        recentActivity: [
          { id: '1', type: 'lead_created' as const, timestamp: new Date().toISOString(), description: 'Novo lead capturado' },
          { id: '2', type: 'lead_created' as const, timestamp: new Date(Date.now() - 3600000).toISOString(), description: 'Lead atualizado' },
          { id: '3', type: 'lead_created' as const, timestamp: new Date(Date.now() - 7200000).toISOString(), description: 'Lead concluído' }
        ]
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutos (dados do dashboard podem mudar frequentemente)
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false, // Disabled in demo mode
  });
}

// Hook para buscar métricas detalhadas com filtros
export function useDetailedDashboardMetrics(params?: {
  period?: '1d' | '7d' | '30d' | '90d';
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: dashboardKeys.detailedMetrics(params),
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/detailed-metrics', params);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    enabled: true, // Sempre ativo
  });
}

// Hook para forçar atualização de métricas do dashboard
export function useRefreshDashboard() {
  const queryClient = useQueryClient();

  return {
    refreshAll: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
    refreshMetrics: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.metrics() });
    },
    refreshDetailed: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.detailedMetrics() });
    },
  };
}