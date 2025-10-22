import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  AlertTriangle,
  RotateCcw,
  Eye,
  TrendingUp
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
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'PROCESSING':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
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
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Automações WhatsApp</h1>
            <p className="text-muted-foreground">
              Monitoramento de envio automático de materiais para leads
            </p>
          </div>

          <Button
            onClick={() => retryAllFailedMutation.mutate()}
            disabled={retryAllFailedMutation.isPending || stats?.failed === 0}
            variant="destructive"
            className="flex items-center gap-2"
          >
            {retryAllFailedMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Retentar Falhadas ({stats?.failed || 0})
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : stats?.total || 0}
              </div>
            </CardContent>
          </Card>

          {/* Enviadas */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enviadas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statsLoading ? '...' : stats?.sent || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Taxa: {stats?.successRate.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          {/* Pendentes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {statsLoading ? '...' : stats?.pending || 0}
              </div>
              {stats?.isProcessing && (
                <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Processando fila
                </p>
              )}
            </CardContent>
          </Card>

          {/* Falhadas */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Falhadas</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {statsLoading ? '...' : stats?.failed || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.totalMessages || 0} mensagens enviadas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">Filtrar por status:</span>
              {['all', 'PENDING', 'PROCESSING', 'SENT', 'FAILED'].map((status) => (
                <Button
                  key={status}
                  variant={selectedStatus === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedStatus(status)}
                >
                  {status === 'all' ? 'Todos' : getStatusLabel(status)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Automações */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Lead
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Produtos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Progresso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Criado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {listLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                        <p className="text-sm text-muted-foreground mt-2">Carregando automações...</p>
                      </td>
                    </tr>
                  ) : automations?.data.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto" />
                        <p className="text-sm text-muted-foreground mt-2">Nenhuma automação encontrada</p>
                      </td>
                    </tr>
                  ) : (
                    automations?.data.map((automation: WhatsAppAutomation) => {
                      const products = JSON.parse(automation.productsToSend || '[]');
                      const progress = automation.messagesTotal > 0
                        ? (automation.messagesSent / automation.messagesTotal) * 100
                        : 0;

                      return (
                        <tr key={automation.id} className="hover:bg-muted/50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(automation.status)}
                              <Badge variant={automation.status === 'SENT' ? 'default' : automation.status === 'FAILED' ? 'destructive' : 'secondary'}>
                                {getStatusLabel(automation.status)}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium">
                              {automation.lead?.name || 'Lead sem nome'}
                            </div>
                            <div className="text-sm text-muted-foreground">{automation.lead?.phone}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">{products.join(', ')}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-secondary rounded-full h-2 max-w-[100px]">
                                <div
                                  className={`h-2 rounded-full ${
                                    automation.status === 'SENT' ? 'bg-green-600' : 'bg-primary'
                                  }`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {automation.messagesSent}/{automation.messagesTotal}
                              </span>
                            </div>
                            {automation.error && (
                              <p className="text-xs text-destructive mt-1">{automation.error}</p>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
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
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedAutomation(automation.id)}
                                title="Ver detalhes"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>

                              {(automation.status === 'FAILED' || automation.status === 'PENDING') && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    retryMutation.mutate({
                                      id: automation.id,
                                      resetMessages: automation.status === 'FAILED'
                                    })
                                  }
                                  disabled={retryMutation.isPending}
                                  title="Retentar"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
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
          </CardContent>
        </Card>

        {/* Info Footer */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
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
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
