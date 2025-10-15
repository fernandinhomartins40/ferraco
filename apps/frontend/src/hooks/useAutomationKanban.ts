import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  automationKanbanService,
  CreateAutomationColumnDto,
  UpdateAutomationColumnDto,
} from '../services/automationKanban.service';
import { toast } from 'sonner';

export function useAutomationKanban() {
  const queryClient = useQueryClient();

  // Colunas
  const { data: columns = [], isLoading: isLoadingColumns } = useQuery({
    queryKey: ['automation-kanban-columns'],
    queryFn: () => automationKanbanService.getAllColumns(),
  });

  const createColumn = useMutation({
    mutationFn: (data: CreateAutomationColumnDto) => automationKanbanService.createColumn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-kanban-columns'] });
      toast.success('Coluna de automação criada com sucesso');
    },
    onError: () => {
      toast.error('Erro ao criar coluna de automação');
    },
  });

  const updateColumn = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAutomationColumnDto }) =>
      automationKanbanService.updateColumn(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-kanban-columns'] });
      toast.success('Coluna de automação atualizada com sucesso');
    },
    onError: () => {
      toast.error('Erro ao atualizar coluna de automação');
    },
  });

  const deleteColumn = useMutation({
    mutationFn: (id: string) => automationKanbanService.deleteColumn(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-kanban-columns'] });
      toast.success('Coluna de automação removida com sucesso');
    },
    onError: () => {
      toast.error('Erro ao remover coluna de automação');
    },
  });

  const reorderColumns = useMutation({
    mutationFn: (columnIds: string[]) => automationKanbanService.reorderColumns(columnIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-kanban-columns'] });
    },
    onError: () => {
      toast.error('Erro ao reordenar colunas');
    },
  });

  // Leads
  const { data: leadsInAutomation = [], isLoading: isLoadingLeads } = useQuery({
    queryKey: ['automation-kanban-leads'],
    queryFn: () => automationKanbanService.getLeadsInAutomation(),
  });

  const moveLeadToColumn = useMutation({
    mutationFn: ({ leadId, columnId }: { leadId: string; columnId: string }) =>
      automationKanbanService.moveLeadToColumn(leadId, columnId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-kanban-leads'] });
      queryClient.invalidateQueries({ queryKey: ['automation-kanban-columns'] });
      toast.success('Lead movido para coluna de automação');
    },
    onError: () => {
      toast.error('Erro ao mover lead');
    },
  });

  const removeLeadFromAutomation = useMutation({
    mutationFn: (leadId: string) => automationKanbanService.removeLeadFromAutomation(leadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-kanban-leads'] });
      queryClient.invalidateQueries({ queryKey: ['automation-kanban-columns'] });
      toast.success('Lead removido da automação');
    },
    onError: () => {
      toast.error('Erro ao remover lead da automação');
    },
  });

  // Configurações
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['automation-settings'],
    queryFn: () => automationKanbanService.getSettings(),
  });

  const updateSettings = useMutation({
    mutationFn: (data: Partial<any>) => automationKanbanService.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-settings'] });
      toast.success('Configurações atualizadas com sucesso');
    },
    onError: () => {
      toast.error('Erro ao atualizar configurações');
    },
  });

  return {
    columns,
    isLoadingColumns,
    createColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,
    leadsInAutomation,
    isLoadingLeads,
    moveLeadToColumn,
    removeLeadFromAutomation,
    settings,
    isLoadingSettings,
    updateSettings,
  };
}
