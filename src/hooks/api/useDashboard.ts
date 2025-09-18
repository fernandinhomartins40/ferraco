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
      const response = await apiClient.get('/dashboard/metrics');
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos (dados do dashboard podem mudar frequentemente)
    cacheTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: true, // Atualizar quando voltar para a aba
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
    cacheTime: 10 * 60 * 1000, // 10 minutos
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