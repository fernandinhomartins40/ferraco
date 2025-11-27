/**
 * useTemplateLibrary - Hook para gerenciar templates da biblioteca centralizada
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templateLibraryService } from '@/services/templateLibrary.service';
import type {
  CreateTemplateDto,
  UpdateTemplateDto,
  TemplateFilters,
} from '@/services/templateLibrary.service';
import { useToast } from './use-toast';

export function useTemplateLibrary(filters?: TemplateFilters) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query para listar templates
  const {
    data: templates,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['template-library', filters],
    queryFn: () => templateLibraryService.list(filters),
  });

  // Query para estatísticas
  const { data: stats } = useQuery({
    queryKey: ['template-library-stats'],
    queryFn: () => templateLibraryService.getStats(),
  });

  // Mutation para criar template
  const createTemplate = useMutation({
    mutationFn: (data: CreateTemplateDto) => templateLibraryService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-library'] });
      queryClient.invalidateQueries({ queryKey: ['template-library-stats'] });
      toast({
        title: 'Template criado',
        description: 'O template foi criado com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar template',
        description: error.message || 'Ocorreu um erro ao criar o template',
        variant: 'destructive',
      });
    },
  });

  // Mutation para atualizar template
  const updateTemplate = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTemplateDto }) =>
      templateLibraryService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-library'] });
      queryClient.invalidateQueries({ queryKey: ['template-library-stats'] });
      toast({
        title: 'Template atualizado',
        description: 'O template foi atualizado com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar template',
        description: error.message || 'Ocorreu um erro ao atualizar o template',
        variant: 'destructive',
      });
    },
  });

  // Mutation para deletar template
  const deleteTemplate = useMutation({
    mutationFn: (id: string) => templateLibraryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-library'] });
      queryClient.invalidateQueries({ queryKey: ['template-library-stats'] });
      toast({
        title: 'Template deletado',
        description: 'O template foi deletado com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao deletar template',
        description: error.message || 'Ocorreu um erro ao deletar o template',
        variant: 'destructive',
      });
    },
  });

  // Mutation para duplicar template
  const duplicateTemplate = useMutation({
    mutationFn: (id: string) => templateLibraryService.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-library'] });
      queryClient.invalidateQueries({ queryKey: ['template-library-stats'] });
      toast({
        title: 'Template duplicado',
        description: 'O template foi duplicado com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao duplicar template',
        description: error.message || 'Ocorreu um erro ao duplicar o template',
        variant: 'destructive',
      });
    },
  });

  return {
    templates,
    isLoading,
    error,
    stats,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
  };
}
