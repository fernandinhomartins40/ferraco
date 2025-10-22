import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { whatsappAutomationService, type WhatsAppAutomation } from '@/services/whatsappAutomation.service';

/**
 * Hook para buscar automações de um lead específico
 */
export function useLeadAutomations(leadId: string | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: ['whatsapp-automations', 'lead', leadId],
    queryFn: () => whatsappAutomationService.getByLeadId(leadId!),
    enabled: enabled && !!leadId,
    staleTime: 30000, // 30 segundos
    refetchInterval: 30000, // Auto-refresh a cada 30s
  });
}

/**
 * Hook para buscar última automação de um lead
 */
export function useLeadLastAutomation(leadId: string | undefined) {
  const { data: automations, ...rest } = useLeadAutomations(leadId);

  // Retorna a automação mais recente
  const lastAutomation = automations?.[0] || null;

  return {
    automation: lastAutomation,
    hasAutomation: !!lastAutomation,
    isPending: lastAutomation?.status === 'PENDING',
    isProcessing: lastAutomation?.status === 'PROCESSING',
    isSent: lastAutomation?.status === 'SENT',
    isFailed: lastAutomation?.status === 'FAILED',
    ...rest
  };
}

/**
 * Hook para retry de automação
 */
export function useRetryAutomation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, resetMessages }: { id: string; resetMessages?: boolean }) =>
      whatsappAutomationService.retry(id, resetMessages),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-automations'] });
    }
  });
}

/**
 * Hook para criar automação manual
 */
export function useCreateAutomation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadId, productsToSend }: { leadId: string; productsToSend: string[] }) =>
      whatsappAutomationService.create(leadId, productsToSend),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-automations'] });
    }
  });
}

/**
 * Helper: Retorna cor baseada no status
 */
export function getAutomationStatusColor(status: WhatsAppAutomation['status']) {
  switch (status) {
    case 'SENT':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'FAILED':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'PROCESSING':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

/**
 * Helper: Retorna ícone baseado no status
 */
export function getAutomationStatusIcon(status: WhatsAppAutomation['status']) {
  switch (status) {
    case 'SENT':
      return '✅';
    case 'FAILED':
      return '❌';
    case 'PROCESSING':
      return '⏳';
    case 'PENDING':
      return '⏸️';
    default:
      return '📧';
  }
}

/**
 * Helper: Retorna label baseado no status
 */
export function getAutomationStatusLabel(status: WhatsAppAutomation['status']) {
  switch (status) {
    case 'SENT':
      return 'Material Enviado';
    case 'FAILED':
      return 'Falha no Envio';
    case 'PROCESSING':
      return 'Enviando...';
    case 'PENDING':
      return 'Na Fila';
    default:
      return 'Desconhecido';
  }
}
