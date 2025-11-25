import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  recurrenceService,
  type CreateTemplateData,
  type UpdateTemplateData,
} from '@/services/recurrence.service';
import { useToast } from '@/hooks/use-toast';

// Query Keys
export const recurrenceKeys = {
  all: ['recurrence'] as const,
  templates: () => [...recurrenceKeys.all, 'templates'] as const,
  template: (id: string) => [...recurrenceKeys.all, 'template', id] as const,
  templatesList: (filters?: { isActive?: boolean; trigger?: string }) =>
    [...recurrenceKeys.templates(), filters] as const,
  stats: () => [...recurrenceKeys.all, 'stats'] as const,
  leadStats: () => [...recurrenceKeys.stats(), 'leads'] as const,
  templateStats: () => [...recurrenceKeys.stats(), 'templates'] as const,
  captureHistory: (leadId: string) => [...recurrenceKeys.all, 'captures', leadId] as const,
};

/**
 * Hook para listar templates de recorrência
 */
export const useRecurrenceTemplates = (filters?: { isActive?: boolean; trigger?: string }) => {
  return useQuery({
    queryKey: recurrenceKeys.templatesList(filters),
    queryFn: () => recurrenceService.listTemplates(filters),
    staleTime: 60000, // 1 minuto
  });
};

/**
 * Hook para buscar um template específico
 */
export const useRecurrenceTemplate = (id: string) => {
  return useQuery({
    queryKey: recurrenceKeys.template(id),
    queryFn: () => recurrenceService.getTemplate(id),
    enabled: !!id,
  });
};

/**
 * Hook para criar template
 */
export const useCreateTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateTemplateData) => recurrenceService.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurrenceKeys.templates() });
      toast({
        title: 'Sucesso!',
        description: 'Template criado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar template',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook para atualizar template
 */
export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTemplateData }) =>
      recurrenceService.updateTemplate(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: recurrenceKeys.templates() });
      queryClient.invalidateQueries({ queryKey: recurrenceKeys.template(variables.id) });
      toast({
        title: 'Sucesso!',
        description: 'Template atualizado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar template',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook para deletar template
 */
export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => recurrenceService.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurrenceKeys.templates() });
      toast({
        title: 'Sucesso!',
        description: 'Template deletado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao deletar template',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook para estatísticas de leads recorrentes
 */
export const useRecurrenceLeadStats = (filters?: {
  period?: '7d' | '30d' | '90d' | 'all';
  source?: string;
  interest?: string;
}) => {
  return useQuery({
    queryKey: [...recurrenceKeys.leadStats(), filters],
    queryFn: () => recurrenceService.getLeadStats(filters),
    staleTime: 30000, // 30 segundos
  });
};

/**
 * Hook para tendências de capturas
 */
export const useCaptureTrends = (filters?: {
  period?: '7d' | '30d' | '90d' | 'all';
  groupBy?: 'day' | 'week' | 'month';
}) => {
  return useQuery({
    queryKey: [...recurrenceKeys.all, 'trends', filters],
    queryFn: () => recurrenceService.getCaptureTrends(filters),
    staleTime: 60000, // 60 segundos (mais estável)
  });
};

/**
 * Hook para estatísticas de uso de templates
 */
export const useRecurrenceTemplateStats = () => {
  return useQuery({
    queryKey: recurrenceKeys.templateStats(),
    queryFn: () => recurrenceService.getTemplateStats(),
    staleTime: 30000, // 30 segundos
  });
};

/**
 * Hook para histórico de capturas de um lead
 */
export const useLeadCaptureHistory = (leadId: string) => {
  return useQuery({
    queryKey: recurrenceKeys.captureHistory(leadId),
    queryFn: () => recurrenceService.getLeadCaptureHistory(leadId),
    enabled: !!leadId,
  });
};
