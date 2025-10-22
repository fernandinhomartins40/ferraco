import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  whatsappAutomationService,
  type WhatsAppAutomationStats,
  type WhatsAppAutomation,
} from '../../services/whatsappAutomation.service';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  Eye,
  RotateCcw
} from 'lucide-react';

export default function WhatsAppAutomations() {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedAutomation, setSelectedAutomation] = useState<string | null>(null);

  // Query: Estatísticas
  const { data: stats, isLoading: statsLoading } = useQuery<WhatsAppAutomationStats>({
    queryKey: ['whatsapp-automations', 'stats'],
    queryFn: () => whatsappAutomationService.getStats(),
    refetchInterval: 10000 // Atualizar a cada 10s
  });

  // Query: Lista de automações
  const { data: automations, isLoading: listLoading } = useQuery({
    queryKey: ['whatsapp-automations', 'list', selectedStatus],
    queryFn: () => whatsappAutomationService.list({
      status: selectedStatus !== 'all' ? selectedStatus as any : undefined,
      limit: 50
    }),
    refetchInterval: 10000
  });

  // Mutation: Retry
  const retryMutation = useMutation({
    mutationFn: ({ id, resetMessages }: { id: string; resetMessages: boolean }) =>
      whatsappAutomationService.retry(id, resetMessages),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-automations'] });
    }
  });

  // Mutation: Retry All Failed
  const retryAllFailedMutation = useMutation({
    mutationFn: () => whatsappAutomationService.retryAllFailed(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-automations'] });
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SENT':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'PROCESSING':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SENT':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'SENT': return 'Enviado';
      case 'FAILED': return 'Falhou';
      case 'PROCESSING': return 'Processando';
      case 'PENDING': return 'Pendente';
      default: return status;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automações WhatsApp</h1>
          <p className="text-sm text-gray-600 mt-1">
            Monitoramento de envio automático de materiais para leads
          </p>
        </div>

        <button
          onClick={() => retryAllFailedMutation.mutate()}
          disabled={retryAllFailedMutation.isPending || stats?.failed === 0}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {retryAllFailedMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Retentar Falhadas ({stats?.failed || 0})
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {statsLoading ? '...' : stats?.total || 0}
              </p>
            </div>
            <MessageSquare className="w-10 h-10 text-blue-600 opacity-20" />
          </div>
        </div>

        {/* Enviadas */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Enviadas</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {statsLoading ? '...' : stats?.sent || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Taxa: {stats?.successRate.toFixed(1)}%
              </p>
            </div>
            <CheckCircle2 className="w-10 h-10 text-green-600 opacity-20" />
          </div>
        </div>

        {/* Pendentes */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendentes</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">
                {statsLoading ? '...' : stats?.pending || 0}
              </p>
              {stats?.isProcessing && (
                <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Processando fila
                </p>
              )}
            </div>
            <Clock className="w-10 h-10 text-yellow-600 opacity-20" />
          </div>
        </div>

        {/* Falhadas */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Falhadas</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {statsLoading ? '...' : stats?.failed || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.totalMessages || 0} mensagens enviadas
              </p>
            </div>
            <XCircle className="w-10 h-10 text-red-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Filtrar por status:</span>
          {['all', 'PENDING', 'PROCESSING', 'SENT', 'FAILED'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'Todos' : getStatusLabel(status)}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Automações */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produtos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progresso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Criado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {listLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                    <p className="text-sm text-gray-500 mt-2">Carregando automações...</p>
                  </td>
                </tr>
              ) : automations?.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-500 mt-2">Nenhuma automação encontrada</p>
                  </td>
                </tr>
              ) : (
                automations?.data.map((automation: WhatsAppAutomation) => {
                  const products = JSON.parse(automation.productsToSend || '[]');
                  const progress = automation.messagesTotal > 0
                    ? (automation.messagesSent / automation.messagesTotal) * 100
                    : 0;

                  return (
                    <tr key={automation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(automation.status)}
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                              automation.status
                            )}`}
                          >
                            {getStatusLabel(automation.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {automation.lead?.name || 'Lead sem nome'}
                        </div>
                        <div className="text-sm text-gray-500">{automation.lead?.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{products.join(', ')}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                automation.status === 'SENT' ? 'bg-green-600' : 'bg-blue-600'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600">
                            {automation.messagesSent}/{automation.messagesTotal}
                          </span>
                        </div>
                        {automation.error && (
                          <p className="text-xs text-red-600 mt-1">{automation.error}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(automation.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedAutomation(automation.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Ver detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {(automation.status === 'FAILED' || automation.status === 'PENDING') && (
                            <button
                              onClick={() =>
                                retryMutation.mutate({
                                  id: automation.id,
                                  resetMessages: automation.status === 'FAILED'
                                })
                              }
                              disabled={retryMutation.isPending}
                              className="text-orange-600 hover:text-orange-900 disabled:opacity-50"
                              title="Retentar"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Footer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900">Como funciona</h3>
            <p className="text-sm text-blue-700 mt-1">
              Quando um lead manifesta interesse em produtos via chatbot, uma automação é criada automaticamente.
              O sistema envia descrições, imagens, vídeos e especificações técnicas dos produtos via WhatsApp.
              As automações com falha podem ser retentadas manualmente.
            </p>
            {stats?.lastExecutionAt && (
              <p className="text-xs text-blue-600 mt-2">
                Última execução: {new Date(stats.lastExecutionAt).toLocaleString('pt-BR')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
