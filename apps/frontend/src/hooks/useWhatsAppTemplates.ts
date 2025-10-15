import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  whatsappMessageTemplateService,
  CreateWhatsAppTemplateDto,
  UpdateWhatsAppTemplateDto,
} from '../services/whatsappMessageTemplate.service';
import { toast } from 'sonner';

export function useWhatsAppTemplates() {
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['whatsapp-templates'],
    queryFn: () => whatsappMessageTemplateService.getAll(),
  });

  const createTemplate = useMutation({
    mutationFn: (data: CreateWhatsAppTemplateDto) => whatsappMessageTemplateService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
      toast.success('Template criado com sucesso');
    },
    onError: () => {
      toast.error('Erro ao criar template');
    },
  });

  const updateTemplate = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWhatsAppTemplateDto }) =>
      whatsappMessageTemplateService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
      toast.success('Template atualizado com sucesso');
    },
    onError: () => {
      toast.error('Erro ao atualizar template');
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: (id: string) => whatsappMessageTemplateService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
      toast.success('Template removido com sucesso');
    },
    onError: () => {
      toast.error('Erro ao remover template');
    },
  });

  return {
    templates,
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}
