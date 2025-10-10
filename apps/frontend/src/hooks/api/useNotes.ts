import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/apiClient';
import {
  ApiLeadNote,
  CreateNoteRequest,
  PaginationParams,
  PaginatedResponse,
} from '@/types/api';
import { logger } from '@/lib/logger';

// Query Keys para cache management
export const noteKeys = {
  all: ['notes'] as const,
  lists: () => [...noteKeys.all, 'list'] as const,
  list: (filters?: PaginationParams & { search?: string; leadId?: string; category?: string; important?: boolean }) => [...noteKeys.lists(), filters] as const,
  details: () => [...noteKeys.all, 'detail'] as const,
  detail: (id: string) => [...noteKeys.details(), id] as const,
  byLead: (leadId: string) => [...noteKeys.all, 'byLead', leadId] as const,
  stats: () => [...noteKeys.all, 'stats'] as const,
  categories: () => [...noteKeys.all, 'categories'] as const,
};

// Hook para buscar todas as notas com filtros e paginação
export function useNotes(params?: PaginationParams & { search?: string; leadId?: string; category?: string; important?: boolean }) {
  return useQuery({
    queryKey: noteKeys.list(params),
    queryFn: async (): Promise<PaginatedResponse<ApiLeadNote>> => {
      const response = await apiClient.get<PaginatedResponse<ApiLeadNote> | ApiLeadNote[]>(
        '/notes',
        { params: params as Record<string, unknown> }
      );
      const data = response.data;

      if (Array.isArray(data)) {
        return {
          data: data,
          pagination: { page: 1, limit: 10, total: data.length, totalPages: 1 },
        };
      }

      if (data && typeof data === 'object' && 'data' in data) {
        return data as PaginatedResponse<ApiLeadNote>;
      }

      return {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutos (notas mudam frequentemente)
    gcTime:5 * 60 * 1000, // 5 minutos
  });
}

// Hook para buscar uma nota específica por ID
export function useNote(id: string) {
  return useQuery({
    queryKey: noteKeys.detail(id),
    queryFn: async (): Promise<ApiLeadNote> => {
      const response = await apiClient.get<ApiLeadNote>(`/notes/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    gcTime:5 * 60 * 1000,
  });
}

// Hook para buscar notas de um lead específico
export function useNotesByLead(leadId: string) {
  return useQuery({
    queryKey: noteKeys.byLead(leadId),
    queryFn: async (): Promise<ApiLeadNote[]> => {
      const response = await apiClient.get<ApiLeadNote[] | { data: ApiLeadNote[] }>(`/leads/${leadId}/notes`);
      const data = response.data;
      if (Array.isArray(data)) {
        return data;
      }
      if (data && typeof data === 'object' && 'data' in data) {
        return data.data || [];
      }
      return [];
    },
    enabled: !!leadId,
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime:3 * 60 * 1000,
  });
}

// Hook para criar uma nova nota
export function useCreateNote(leadId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateNoteRequest & { leadId?: string }): Promise<ApiLeadNote> => {
      const noteLeadId = data.leadId || leadId;
      if (!noteLeadId) {
        throw new Error('Lead ID é obrigatório para criar uma nota');
      }

      const response = await apiClient.post<ApiLeadNote>(`/leads/${noteLeadId}/notes`, {
        content: data.content,
        important: data.important,
      });
      return response.data;
    },
    onSuccess: (newNote) => {
      const noteLeadId = newNote.leadId;

      // Invalidar cache das listas de notas
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });

      // Invalidar cache específico do lead
      if (noteLeadId) {
        queryClient.invalidateQueries({ queryKey: noteKeys.byLead(noteLeadId) });
        queryClient.invalidateQueries({ queryKey: ['leads', 'detail', noteLeadId] });
      }

      // Invalidar estatísticas
      queryClient.invalidateQueries({ queryKey: noteKeys.stats() });

      // Adicionar ao cache individual
      queryClient.setQueryData(noteKeys.detail(newNote.id), newNote);

      toast.success('Nota criada com sucesso!');
    },
    onError: (error) => {
      logger.error('Erro ao criar nota:', error);
      toast.error('Erro ao criar nota. Tente novamente.');
    },
  });
}

// Hook para atualizar uma nota
export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; content?: string; important?: boolean; category?: string; isPrivate?: boolean }): Promise<ApiLeadNote> => {
      const response = await apiClient.put(`/notes/${data.id}`, data as unknown as Record<string, unknown>);
      return response.data as ApiLeadNote;
    },
    onSuccess: (updatedNote) => {
      // Atualizar cache individual
      queryClient.setQueryData(noteKeys.detail(updatedNote.id), updatedNote);

      // Invalidar listas para refletir mudanças
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: noteKeys.byLead(updatedNote.leadId) });

      // Invalidar cache do lead
      queryClient.invalidateQueries({ queryKey: ['leads', 'detail', updatedNote.leadId] });

      toast.success('Nota atualizada com sucesso!');
    },
    onError: (error) => {
      logger.error('Erro ao atualizar nota:', error);
      toast.error('Erro ao atualizar nota. Tente novamente.');
    },
  });
}

// Hook para deletar uma nota
export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`/notes/${id}`);
    },
    onSuccess: (_, deletedId) => {
      // Obter dados da nota antes de remover do cache para invalidar o lead correto
      const cachedNote = queryClient.getQueriesData({ queryKey: noteKeys.detail(deletedId) })[0]?.[1] as ApiLeadNote | undefined;

      // Remover do cache individual
      queryClient.removeQueries({ queryKey: noteKeys.detail(deletedId) });

      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: noteKeys.stats() });

      // Invalidar cache do lead se disponível
      if (cachedNote?.leadId) {
        queryClient.invalidateQueries({ queryKey: noteKeys.byLead(cachedNote.leadId) });
        queryClient.invalidateQueries({ queryKey: ['leads', 'detail', cachedNote.leadId] });
      }

      toast.success('Nota deletada com sucesso!');
    },
    onError: (error) => {
      logger.error('Erro ao deletar nota:', error);
      toast.error('Erro ao deletar nota. Tente novamente.');
    },
  });
}

// Hook para marcar/desmarcar nota como importante
export function useToggleNoteImportance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; important: boolean }): Promise<ApiLeadNote> => {
      const response = await apiClient.patch(`/notes/${params.id}/importance`, {
        important: params.important,
      } as unknown as Record<string, unknown>);
      return response.data as ApiLeadNote;
    },
    onSuccess: (updatedNote) => {
      // Atualizar cache individual
      queryClient.setQueryData(noteKeys.detail(updatedNote.id), updatedNote);

      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: noteKeys.byLead(updatedNote.leadId) });

      const status = updatedNote.important ? 'marcada como importante' : 'desmarcada como importante';
      toast.success(`Nota ${status}!`);
    },
    onError: (error) => {
      logger.error('Erro ao alterar importância da nota:', error);
      toast.error('Erro ao alterar status da nota. Tente novamente.');
    },
  });
}

// Hook para buscar estatísticas de notas
export function useNoteStats() {
  return useQuery({
    queryKey: noteKeys.stats(),
    queryFn: async () => {
      const response = await apiClient.get('/notes/stats');
      return response.data || {
        total: 0,
        important: 0,
        byCategory: {},
        byLead: {},
        recent: [],
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime:15 * 60 * 1000, // 15 minutos
  });
}

// Hook para buscar categorias de notas
export function useNoteCategories() {
  return useQuery({
    queryKey: noteKeys.categories(),
    queryFn: async () => {
      const response = await apiClient.get('/notes/categories');
      return response.data || [
        'Reunião',
        'Ligação',
        'Email',
        'WhatsApp',
        'Proposta',
        'Negociação',
        'Follow-up',
        'Interesse',
        'Objeção',
        'Fechamento',
        'Pós-venda',
        'Outros'
      ];
    },
    staleTime: 30 * 60 * 1000, // 30 minutos (categorias mudam raramente)
    gcTime:60 * 60 * 1000, // 1 hora
  });
}

// Hook para buscar notas importantes
export function useImportantNotes(limit = 10) {
  return useQuery({
    queryKey: [...noteKeys.all, 'important', limit],
    queryFn: async () => {
      const response = await apiClient.get<ApiLeadNote[]>('/notes', { params: { important: true, limit } });
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime:10 * 60 * 1000,
  });
}

// Hook para buscar notas por categoria
export function useNotesByCategory(category: string) {
  return useQuery({
    queryKey: [...noteKeys.all, 'category', category],
    queryFn: async () => {
      const response = await apiClient.get<ApiLeadNote[]>('/notes', { params: { category } });
      return response.data || [];
    },
    enabled: !!category,
    staleTime: 5 * 60 * 1000,
    gcTime:10 * 60 * 1000,
  });
}

// Hook para busca de notas com debounce
export function useSearchNotes(searchTerm: string, debounceMs = 300) {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState(searchTerm);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);

  return useNotes({
    search: debouncedSearchTerm || undefined,
    limit: 50,
  });
}

// Hook para duplicar uma nota
export function useDuplicateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { noteId: string; newLeadId?: string }): Promise<ApiLeadNote> => {
      const response = await apiClient.post(`/notes/${params.noteId}/duplicate`, {
        newLeadId: params.newLeadId,
      } as unknown as Record<string, unknown>);
      return response.data as ApiLeadNote;
    },
    onSuccess: (duplicatedNote) => {
      // Invalidar cache das listas
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: noteKeys.byLead(duplicatedNote.leadId) });

      // Adicionar ao cache individual
      queryClient.setQueryData(noteKeys.detail(duplicatedNote.id), duplicatedNote);

      toast.success('Nota duplicada com sucesso!');
    },
    onError: (error) => {
      logger.error('Erro ao duplicar nota:', error);
      toast.error('Erro ao duplicar nota. Tente novamente.');
    },
  });
}

// Hook utilitário para prefetch de nota
export function usePrefetchNote() {
  const queryClient = useQueryClient();

  return React.useCallback(
    (id: string) => {
      queryClient.prefetchQuery({
        queryKey: noteKeys.detail(id),
        queryFn: async () => {
          const response = await apiClient.get(`/notes/${id}`);
          return response.data;
        },
        staleTime: 2 * 60 * 1000,
      });
    },
    [queryClient]
  );
}