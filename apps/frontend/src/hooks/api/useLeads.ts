import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsService, type Lead, type CreateLeadData, type UpdateLeadData, type LeadFilters } from '@/services/leads.service';
import { useToast } from '@/hooks/use-toast';

// Query Keys
export const leadKeys = {
  all: ['leads'] as const,
  lists: () => [...leadKeys.all, 'list'] as const,
  list: (filters?: LeadFilters) => [...leadKeys.lists(), filters] as const,
  detail: (id: string) => [...leadKeys.all, 'detail', id] as const,
  stats: () => [...leadKeys.all, 'stats'] as const,
  statsByStatus: () => [...leadKeys.all, 'stats-by-status'] as const,
  statsBySource: () => [...leadKeys.all, 'stats-by-source'] as const,
  timeline: (days: number) => [...leadKeys.all, 'timeline', days] as const,
  duplicates: () => [...leadKeys.all, 'duplicates'] as const,
};

/**
 * Hook para listar leads com filtros
 */
export const useLeads = (filters?: LeadFilters) => {
  return useQuery({
    queryKey: leadKeys.list(filters),
    queryFn: () => leadsService.getAll(filters),
    staleTime: 30000, // 30 segundos
  });
};

/**
 * Hook para buscar um lead específico
 */
export const useLead = (id: string) => {
  return useQuery({
    queryKey: leadKeys.detail(id),
    queryFn: () => leadsService.getById(id),
    enabled: !!id,
  });
};

/**
 * Hook para buscar leads (busca textual)
 */
export const useLeadsSearch = (query: string, filters?: LeadFilters) => {
  return useQuery({
    queryKey: ['leads-search', query, filters],
    queryFn: () => leadsService.search(query, filters),
    enabled: query.length >= 2,
  });
};

/**
 * Hook para estatísticas de leads
 */
export const useLeadsStats = () => {
  return useQuery({
    queryKey: leadKeys.stats(),
    queryFn: () => leadsService.getStats(),
    staleTime: 60000, // 1 minuto
  });
};

/**
 * Hook para estatísticas por status
 */
export const useLeadsStatsByStatus = () => {
  return useQuery({
    queryKey: leadKeys.statsByStatus(),
    queryFn: () => leadsService.getStatsByStatus(),
    staleTime: 60000,
  });
};

/**
 * Hook para estatísticas por origem
 */
export const useLeadsStatsBySource = () => {
  return useQuery({
    queryKey: leadKeys.statsBySource(),
    queryFn: () => leadsService.getStatsBySource(),
    staleTime: 60000,
  });
};

/**
 * Hook para timeline de leads
 */
export const useLeadsTimeline = (days: number = 30) => {
  return useQuery({
    queryKey: leadKeys.timeline(days),
    queryFn: () => leadsService.getTimeline(days),
    staleTime: 300000, // 5 minutos
  });
};

/**
 * Hook para criar lead
 */
export const useCreateLead = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateLeadData) => leadsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadKeys.stats() });
      queryClient.invalidateQueries({ queryKey: leadKeys.statsByStatus() });
      queryClient.invalidateQueries({ queryKey: leadKeys.statsBySource() });
      queryClient.invalidateQueries({ queryKey: ['kanban-columns-stats'] });
      toast({
        title: 'Sucesso!',
        description: 'Lead criado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar lead',
        description: error.response?.data?.message || 'Ocorreu um erro ao criar o lead.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook para atualizar lead
 */
export const useUpdateLead = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLeadData }) =>
      leadsService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: leadKeys.stats() });
      queryClient.invalidateQueries({ queryKey: leadKeys.statsByStatus() });
      queryClient.invalidateQueries({ queryKey: ['kanban-columns-stats'] });
      toast({
        title: 'Sucesso!',
        description: 'Lead atualizado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar lead',
        description: error.response?.data?.message || 'Ocorreu um erro ao atualizar o lead.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook para deletar lead
 */
export const useDeleteLead = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => leadsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadKeys.stats() });
      queryClient.invalidateQueries({ queryKey: leadKeys.statsByStatus() });
      queryClient.invalidateQueries({ queryKey: leadKeys.statsBySource() });
      queryClient.invalidateQueries({ queryKey: ['kanban-columns-stats'] });
      toast({
        title: 'Sucesso!',
        description: 'Lead deletado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao deletar lead',
        description: error.response?.data?.message || 'Ocorreu um erro ao deletar o lead.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook para atualização em massa
 */
export const useBulkUpdateLeads = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ ids, data }: { ids: string[]; data: UpdateLeadData }) =>
      leadsService.bulkUpdate(ids, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadKeys.stats() });
      toast({
        title: 'Sucesso!',
        description: `${result.updated} leads atualizados com sucesso.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro na atualização em massa',
        description: error.response?.data?.message || 'Ocorreu um erro na atualização.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook para buscar duplicatas
 */
export const useLeadsDuplicates = () => {
  return useQuery({
    queryKey: leadKeys.duplicates(),
    queryFn: () => leadsService.findDuplicates(),
    staleTime: 300000, // 5 minutos
  });
};

/**
 * Hook para mesclar leads
 */
export const useMergeLeads = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ primaryId, duplicateIds }: { primaryId: string; duplicateIds: string[] }) =>
      leadsService.merge(primaryId, duplicateIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadKeys.duplicates() });
      queryClient.invalidateQueries({ queryKey: leadKeys.stats() });
      toast({
        title: 'Sucesso!',
        description: 'Leads mesclados com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao mesclar leads',
        description: error.response?.data?.message || 'Ocorreu um erro ao mesclar os leads.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook para exportar leads
 */
export const useExportLeads = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ filters, format }: { filters?: LeadFilters; format?: 'csv' | 'xlsx' }) =>
      leadsService.export(filters, format),
    onSuccess: (blob, variables) => {
      // Criar link de download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads.${variables.format || 'csv'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Sucesso!',
        description: 'Leads exportados com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao exportar leads',
        description: error.response?.data?.message || 'Ocorreu um erro ao exportar os leads.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook para timeline de um lead
 */
export const useLeadTimeline = (id: string) => {
  return useQuery({
    queryKey: ['lead-timeline', id],
    queryFn: () => leadsService.getLeadTimeline(id),
    enabled: !!id,
  });
};

/**
 * Hook para histórico de um lead
 */
export const useLeadHistory = (id: string) => {
  return useQuery({
    queryKey: ['lead-history', id],
    queryFn: () => leadsService.getLeadHistory(id),
    enabled: !!id,
  });
};

// Legacy compatibility - manter para não quebrar código existente
export { useLeads as default };
export { useLeadsStats as useLeadStats };
export { useUpdateLead as useUpdateLeadStatus };
export { useCreateLead as useCreateLeadNote };
