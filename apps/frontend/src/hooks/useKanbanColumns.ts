import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kanbanColumnsService, CreateKanbanColumnDto, UpdateKanbanColumnDto } from '../services/kanbanColumns.service';
import { toast } from 'sonner';

export function useKanbanColumns() {
  const queryClient = useQueryClient();

  const { data: columns = [], isLoading, error } = useQuery({
    queryKey: ['kanban-columns'],
    queryFn: () => kanbanColumnsService.getAll(),
  });

  const { data: columnStats = [], isLoading: isLoadingStats } = useQuery({
    queryKey: ['kanban-columns-stats'],
    queryFn: () => kanbanColumnsService.getStats(),
    staleTime: 30000, // 30 seconds
  });

  const createColumn = useMutation({
    mutationFn: (data: CreateKanbanColumnDto) => kanbanColumnsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-columns'] });
      queryClient.invalidateQueries({ queryKey: ['kanban-columns-stats'] });
      toast.success('Coluna criada com sucesso');
    },
    onError: () => {
      toast.error('Erro ao criar coluna');
    },
  });

  const updateColumn = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateKanbanColumnDto }) =>
      kanbanColumnsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-columns'] });
      queryClient.invalidateQueries({ queryKey: ['kanban-columns-stats'] });
      toast.success('Coluna atualizada com sucesso');
    },
    onError: () => {
      toast.error('Erro ao atualizar coluna');
    },
  });

  const deleteColumn = useMutation({
    mutationFn: (id: string) => kanbanColumnsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-columns'] });
      queryClient.invalidateQueries({ queryKey: ['kanban-columns-stats'] });
      toast.success('Coluna removida com sucesso');
    },
    onError: () => {
      toast.error('Erro ao remover coluna');
    },
  });

  const reorderColumns = useMutation({
    mutationFn: (columnIds: string[]) => kanbanColumnsService.reorder(columnIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-columns'] });
    },
    onError: () => {
      toast.error('Erro ao reordenar colunas');
    },
  });

  return {
    columns,
    columnStats,
    isLoading,
    isLoadingStats,
    error,
    createColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,
  };
}
