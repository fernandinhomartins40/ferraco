/**
 * useIntegrations - React Query hooks para integrações
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  integrationsService,
  type CreateIntegrationData,
  type UpdateIntegrationData,
} from '@/services/integrations.service';
import { useToast } from '@/hooks/use-toast';

// Query Keys
export const integrationKeys = {
  all: ['integrations'] as const,
  lists: () => [...integrationKeys.all, 'list'] as const,
  byType: (type: string) => [...integrationKeys.all, 'type', type] as const,
  detail: (id: string) => [...integrationKeys.all, 'detail', id] as const,
};

/**
 * Hook para listar todas as integrações
 */
export const useIntegrations = () => {
  return useQuery({
    queryKey: integrationKeys.lists(),
    queryFn: () => integrationsService.getAll(),
    staleTime: 60000, // 1 minuto
  });
};

/**
 * Hook para buscar integração por tipo (ex: WhatsApp)
 */
export const useIntegrationByType = (type: string) => {
  return useQuery({
    queryKey: integrationKeys.byType(type),
    queryFn: () => integrationsService.getByType(type),
    staleTime: 60000,
  });
};

/**
 * Hook para buscar integração específica
 */
export const useIntegration = (id: string) => {
  return useQuery({
    queryKey: integrationKeys.detail(id),
    queryFn: () => integrationsService.getById(id),
    enabled: !!id,
  });
};

/**
 * Hook para criar integração
 */
export const useCreateIntegration = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateIntegrationData) => integrationsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.lists() });
      toast({
        title: 'Sucesso!',
        description: 'Integração criada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar integração',
        description: error.response?.data?.message || 'Ocorreu um erro ao criar a integração.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook para atualizar integração
 */
export const useUpdateIntegration = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIntegrationData }) =>
      integrationsService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: integrationKeys.detail(variables.id) });
      toast({
        title: 'Sucesso!',
        description: 'Integração atualizada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar integração',
        description: error.response?.data?.message || 'Ocorreu um erro ao atualizar a integração.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook para deletar integração
 */
export const useDeleteIntegration = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => integrationsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.lists() });
      toast({
        title: 'Sucesso!',
        description: 'Integração deletada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao deletar integração',
        description: error.response?.data?.message || 'Ocorreu um erro ao deletar a integração.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook para testar conexão
 */
export const useTestIntegration = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => integrationsService.testConnection(id),
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: 'Conexão bem-sucedida!',
          description: result.message || 'Integração está funcionando corretamente.',
        });
      } else {
        toast({
          title: 'Erro na conexão',
          description: result.message || 'Não foi possível conectar à integração.',
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao testar integração',
        description: error.response?.data?.message || 'Ocorreu um erro ao testar a conexão.',
        variant: 'destructive',
      });
    },
  });
};
