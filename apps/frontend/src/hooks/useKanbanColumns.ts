import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kanbanColumnsService, CreateKanbanColumnDto, UpdateKanbanColumnDto } from '../services/kanbanColumns.service';
import { toast } from 'sonner';

export function useKanbanColumns() {
  const queryClient = useQueryClient();

  const { data: columns = [], isLoading, error } = useQuery({
    queryKey: ['kanban-columns'],
    queryFn: () => kanbanColumnsService.getAll(),
  });

  const createColumn = useMutation({
    mutationFn: (data: CreateKanbanColumnDto) => kanbanColumnsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-columns'] });
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
    isLoading,
    error,
    createColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,
  };
}
