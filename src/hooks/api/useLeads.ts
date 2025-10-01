import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/apiClient';
import {
  ApiLead,
  CreateLeadRequest,
  UpdateLeadRequest,
  LeadFilters,
  PaginationParams,
  PaginatedResponse,
  CreateNoteRequest,
  ApiLeadNote,
} from '@/types/api';
import { logger } from '@/lib/logger';

// Query Keys simplificados
export const leadKeys = {
  all: ['leads'] as const,
  lists: () => [...leadKeys.all, 'list'] as const,
  list: (filters?: LeadFilters & PaginationParams) => [...leadKeys.lists(), filters] as const,
  detail: (id: string) => [...leadKeys.all, 'detail', id] as const,
  stats: () => [...leadKeys.all, 'stats'] as const,
};

// 1. Hook para buscar leads com filtros e paginação
export function useLeads(params?: LeadFilters & PaginationParams) {
  return useQuery({
    queryKey: leadKeys.list(params),
    queryFn: async (): Promise<PaginatedResponse<ApiLead>> => {
      const response = await apiClient.get('/leads', params);
      return {
        data: response.data || [],
        pagination: response.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });
}

// 2. Hook para criar um novo lead
export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateLeadRequest): Promise<ApiLead> => {
      const response = await apiClient.post('/leads', data);
      return response.data;
    },
    onSuccess: (newLead) => {
      // Invalidar cache das listas de leads
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadKeys.stats() });

      // Adicionar ao cache individual
      queryClient.setQueryData(leadKeys.detail(newLead.id), newLead);

      toast.success(`Lead "${newLead.name}" criado com sucesso!`);
    },
    onError: (error) => {
      logger.error('Erro ao criar lead:', error);
      toast.error('Erro ao criar lead. Tente novamente.');
    },
  });
}

// 3. Hook para atualizar um lead (inclui status)
export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateLeadRequest): Promise<ApiLead> => {
      const response = await apiClient.put(`/leads/${data.id}`, data);
      return response.data;
    },
    onSuccess: (updatedLead) => {
      // Atualizar cache individual
      queryClient.setQueryData(leadKeys.detail(updatedLead.id), updatedLead);

      // Invalidar listas para refletir mudanças
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadKeys.stats() });

      toast.success(`Lead "${updatedLead.name}" atualizado com sucesso!`);
    },
    onError: (error) => {
      logger.error('Erro ao atualizar lead:', error);
      toast.error('Erro ao atualizar lead. Tente novamente.');
    },
  });
}

// Hook específico para atualizar apenas status (mais simples)
export function useUpdateLeadStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; status: 'NOVO' | 'EM_ANDAMENTO' | 'CONCLUIDO' }): Promise<ApiLead> => {
      const response = await apiClient.patch(`/leads/${params.id}/status`, { status: params.status });
      return response.data;
    },
    onSuccess: (updatedLead) => {
      // Atualizar cache individual
      queryClient.setQueryData(leadKeys.detail(updatedLead.id), updatedLead);

      // Invalidar listas para refletir mudanças no status
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadKeys.stats() });

      const statusLabels = {
        NOVO: 'Novo',
        EM_ANDAMENTO: 'Em Andamento',
        CONCLUIDO: 'Concluído',
      };

      toast.success(`Status alterado para "${statusLabels[updatedLead.status]}"!`);
    },
    onError: (error) => {
      logger.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status. Tente novamente.');
    },
  });
}

// 4. Hook para deletar um lead
export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`/leads/${id}`);
    },
    onSuccess: (_, deletedId) => {
      // Remover do cache individual
      queryClient.removeQueries({ queryKey: leadKeys.detail(deletedId) });

      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadKeys.stats() });

      toast.success('Lead deletado com sucesso!');
    },
    onError: (error) => {
      logger.error('Erro ao deletar lead:', error);
      toast.error('Erro ao deletar lead. Tente novamente.');
    },
  });
}

// 5. Hook para estatísticas de leads
export function useLeadStats() {
  return useQuery({
    queryKey: leadKeys.stats(),
    queryFn: async () => {
      const response = await apiClient.get('/leads/stats');
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
    cacheTime: 15 * 60 * 1000, // 15 minutos
  });
}

// Hook para adicionar nota (consolidado aqui ao invés de arquivo separado)
export function useCreateLeadNote(leadId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateNoteRequest): Promise<ApiLeadNote> => {
      const response = await apiClient.post(`/leads/${leadId}/notes`, data);
      return response.data;
    },
    onSuccess: () => {
      // Atualizar cache do lead (pode incluir contagem de notas)
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(leadId) });
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });

      toast.success('Nota adicionada com sucesso!');
    },
    onError: (error) => {
      logger.error('Erro ao criar nota:', error);
      toast.error('Erro ao adicionar nota. Tente novamente.');
    },
  });
}