import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/apiClient';
import {
  ApiTag,
  CreateTagRequest,
  UpdateTagRequest,
  PaginationParams,
  PaginatedResponse,
} from '@/types/api';

// Query Keys para cache management
export const tagKeys = {
  all: ['tags'] as const,
  lists: () => [...tagKeys.all, 'list'] as const,
  list: (filters?: PaginationParams & { search?: string; category?: string }) => [...tagKeys.lists(), filters] as const,
  details: () => [...tagKeys.all, 'detail'] as const,
  detail: (id: string) => [...tagKeys.details(), id] as const,
  rules: () => [...tagKeys.all, 'rules'] as const,
  stats: () => [...tagKeys.all, 'stats'] as const,
  predefined: () => [...tagKeys.all, 'predefined'] as const,
};

// Hook para buscar todas as tags
export function useTags(params?: PaginationParams & { search?: string; category?: string }) {
  return useQuery({
    queryKey: tagKeys.list(params),
    queryFn: async (): Promise<PaginatedResponse<ApiTag>> => {
      const response = await apiClient.get('/tags', params);
      return {
        data: response.data || [],
        pagination: response.pagination || {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
        },
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutos (tags mudam menos frequentemente)
    cacheTime: 30 * 60 * 1000, // 30 minutos
  });
}

// Hook para buscar todas as tags sem paginação (para selects/dropdowns)
export function useAllTags() {
  return useQuery({
    queryKey: [...tagKeys.all, 'all'],
    queryFn: async (): Promise<ApiTag[]> => {
      const response = await apiClient.get('/tags', { limit: 1000 }); // Buscar todas
      return response.data || [];
    },
    staleTime: 15 * 60 * 1000, // 15 minutos
    cacheTime: 30 * 60 * 1000,
  });
}

// Hook para buscar uma tag específica por ID
export function useTag(id: string) {
  return useQuery({
    queryKey: tagKeys.detail(id),
    queryFn: async (): Promise<ApiTag> => {
      const response = await apiClient.get(`/tags/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  });
}

// Hook para criar uma nova tag
export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTagRequest): Promise<ApiTag> => {
      const response = await apiClient.post('/tags', data);
      return response.data;
    },
    onSuccess: (newTag) => {
      // Invalidar cache das listas de tags
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tagKeys.stats() });
      queryClient.invalidateQueries({ queryKey: [...tagKeys.all, 'all'] });

      // Adicionar ao cache individual
      queryClient.setQueryData(tagKeys.detail(newTag.id), newTag);

      toast.success(`Tag "${newTag.name}" criada com sucesso!`);
    },
    onError: (error) => {
      console.error('Erro ao criar tag:', error);
      toast.error('Erro ao criar tag. Tente novamente.');
    },
  });
}

// Hook para atualizar uma tag
export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateTagRequest): Promise<ApiTag> => {
      const response = await apiClient.put(`/tags/${data.id}`, data);
      return response.data;
    },
    onSuccess: (updatedTag) => {
      // Atualizar cache individual
      queryClient.setQueryData(tagKeys.detail(updatedTag.id), updatedTag);

      // Invalidar listas para refletir mudanças
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...tagKeys.all, 'all'] });

      toast.success(`Tag "${updatedTag.name}" atualizada com sucesso!`);
    },
    onError: (error) => {
      console.error('Erro ao atualizar tag:', error);
      toast.error('Erro ao atualizar tag. Tente novamente.');
    },
  });
}

// Hook para deletar uma tag
export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`/tags/${id}`);
    },
    onSuccess: (_, deletedId) => {
      // Remover do cache individual
      queryClient.removeQueries({ queryKey: tagKeys.detail(deletedId) });

      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tagKeys.stats() });
      queryClient.invalidateQueries({ queryKey: [...tagKeys.all, 'all'] });

      toast.success('Tag deletada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao deletar tag:', error);
      toast.error('Erro ao deletar tag. Tente novamente.');
    },
  });
}

// Hook para buscar regras de tags automáticas
export function useTagRules() {
  return useQuery({
    queryKey: tagKeys.rules(),
    queryFn: async () => {
      const response = await apiClient.get('/tags/rules');
      return response.data || [];
    },
    staleTime: 15 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  });
}

// Hook para criar/atualizar regras de tag
export function useManageTagRules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { tagId: string; rules: any[] }) => {
      const response = await apiClient.post(`/tags/${data.tagId}/rules`, { rules: data.rules });
      return response.data;
    },
    onSuccess: () => {
      // Invalidar cache de regras
      queryClient.invalidateQueries({ queryKey: tagKeys.rules() });

      toast.success('Regras de tag atualizadas com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar regras:', error);
      toast.error('Erro ao atualizar regras de tag. Tente novamente.');
    },
  });
}

// Hook para buscar estatísticas de tags
export function useTagStats() {
  return useQuery({
    queryKey: tagKeys.stats(),
    queryFn: async () => {
      const response = await apiClient.get('/tags/stats');
      return response.data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
    cacheTime: 20 * 60 * 1000, // 20 minutos
  });
}

// Hook para buscar cores predefinidas
export function usePredefinedColors() {
  return useQuery({
    queryKey: tagKeys.predefined(),
    queryFn: async () => {
      const response = await apiClient.get('/tags/predefined-colors');
      return response.data || [
        { name: 'Vermelho', value: '#ef4444' },
        { name: 'Azul', value: '#3b82f6' },
        { name: 'Verde', value: '#10b981' },
        { name: 'Amarelo', value: '#f59e0b' },
        { name: 'Roxo', value: '#8b5cf6' },
        { name: 'Rosa', value: '#ec4899' },
        { name: 'Índigo', value: '#6366f1' },
        { name: 'Ciano', value: '#06b6d4' },
        { name: 'Cinza', value: '#6b7280' },
        { name: 'Preto', value: '#374151' },
      ];
    },
    staleTime: Infinity, // Cores não mudam
    cacheTime: Infinity,
  });
}

// Hook para ativar/desativar uma tag
export function useToggleTagStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; isActive: boolean }): Promise<ApiTag> => {
      const response = await apiClient.patch(`/tags/${params.id}/status`, {
        isActive: params.isActive,
      });
      return response.data;
    },
    onSuccess: (updatedTag) => {
      // Atualizar cache individual
      queryClient.setQueryData(tagKeys.detail(updatedTag.id), updatedTag);

      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...tagKeys.all, 'all'] });

      const status = updatedTag.isActive ? 'ativada' : 'desativada';
      toast.success(`Tag "${updatedTag.name}" ${status} com sucesso!`);
    },
    onError: (error) => {
      console.error('Erro ao alterar status da tag:', error);
      toast.error('Erro ao alterar status da tag. Tente novamente.');
    },
  });
}

// Hook para buscar tags mais usadas
export function usePopularTags(limit = 10) {
  return useQuery({
    queryKey: [...tagKeys.all, 'popular', limit],
    queryFn: async () => {
      const response = await apiClient.get('/tags/popular', { limit });
      return response.data || [];
    },
    staleTime: 15 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  });
}

// Hook para buscar tags por categoria
export function useTagsByCategory() {
  return useQuery({
    queryKey: [...tagKeys.all, 'by-category'],
    queryFn: async () => {
      const response = await apiClient.get('/tags/by-category');
      return response.data || {};
    },
    staleTime: 15 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  });
}

// Hook para aplicar tags automáticas a um lead
export function useApplyAutomaticTags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadId: string) => {
      const response = await apiClient.post(`/tags/apply-automatic/${leadId}`);
      return response.data;
    },
    onSuccess: (_, leadId) => {
      // Invalidar cache do lead para refletir novas tags
      queryClient.invalidateQueries({ queryKey: ['leads', 'detail', leadId] });

      toast.success('Tags automáticas aplicadas com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao aplicar tags automáticas:', error);
      toast.error('Erro ao aplicar tags automáticas. Tente novamente.');
    },
  });
}

// Hook utilitário para buscar tags com debounce (para busca)
export function useSearchTags(searchTerm: string, debounceMs = 300) {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState(searchTerm);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);

  return useTags({
    search: debouncedSearchTerm || undefined,
    limit: 50,
  });
}

