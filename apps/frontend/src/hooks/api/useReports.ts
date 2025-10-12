/**
 * useReports - React Query hooks para relatórios e analytics
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import {
  reportsService,
  type FunnelAnalyticsParams,
  type CohortAnalysisParams,
  type PerformanceMetricsParams,
  type ReportFormat,
} from '@/services/reports.service';
import { useToast } from '@/hooks/use-toast';

// Query Keys
export const reportKeys = {
  all: ['reports'] as const,
  funnel: (params?: FunnelAnalyticsParams) => [...reportKeys.all, 'funnel', params] as const,
  cohort: (params: CohortAnalysisParams) => [...reportKeys.all, 'cohort', params] as const,
  performance: (params?: PerformanceMetricsParams) => [...reportKeys.all, 'performance', params] as const,
};

/**
 * Hook para buscar analytics de funil
 */
export const useFunnelAnalytics = (params?: FunnelAnalyticsParams) => {
  return useQuery({
    queryKey: reportKeys.funnel(params),
    queryFn: () => reportsService.getFunnelAnalytics(params),
    staleTime: 300000, // 5 minutos
  });
};

/**
 * Hook para buscar análise de cohort
 */
export const useCohortAnalysis = (params: CohortAnalysisParams) => {
  return useQuery({
    queryKey: reportKeys.cohort(params),
    queryFn: () => reportsService.getCohortAnalysis(params),
    staleTime: 300000,
  });
};

/**
 * Hook para buscar métricas de performance
 */
export const usePerformanceMetrics = (params?: PerformanceMetricsParams) => {
  return useQuery({
    queryKey: reportKeys.performance(params),
    queryFn: () => reportsService.getPerformanceMetrics(params),
    staleTime: 300000,
  });
};

/**
 * Hook para exportar relatório
 */
export const useExportReport = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ format, filters }: { format: ReportFormat; filters?: Record<string, any> }) =>
      reportsService.exportReport(format, filters),
    onSuccess: (blob, variables) => {
      // Criar link de download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio.${variables.format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Sucesso!',
        description: 'Relatório exportado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao exportar relatório',
        description: error.response?.data?.message || 'Ocorreu um erro ao exportar o relatório.',
        variant: 'destructive',
      });
    },
  });
};
