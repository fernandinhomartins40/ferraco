import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import {
  whatsappAutomationService,
  type WhatsAppAutomationStats,
  type WhatsAppAutomation,
  type WhatsAppAutomationDetail,
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
  TrendingUp,
  X,
  User,
  Phone,
  Mail,
  Calendar,
  Package,
  FileText,
  Image as ImageIcon,
  Video,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function WhatsAppAutomations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedAutomation, setSelectedAutomation] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

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

  // Query: Detalhes da automação selecionada
  const { data: automationDetails, isLoading: detailsLoading } = useQuery<WhatsAppAutomationDetail>({
    queryKey: ['whatsapp-automation-details', selectedAutomation],
    queryFn: () => whatsappAutomationService.getById(selectedAutomation!),
    enabled: !!selectedAutomation,
  });

  // Mutation: Retry
  const retryMutation = useMutation({
    mutationFn: ({ id, resetMessages }: { id: string; resetMessages: boolean }) =>
      whatsappAutomationService.retry(id, resetMessages),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-automations'] });
      toast({
        title: 'Automação retentada',
        description: 'A automação foi adicionada à fila para reprocessamento.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao retentar',
        description: error.message || 'Não foi possível retentar a automação.',
        variant: 'destructive',
      });
    }
  });

  // Mutation: Retry All Failed
  const retryAllFailedMutation = useMutation({
    mutationFn: () => whatsappAutomationService.retryAllFailed(),
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-automations'] });
      toast({
        title: 'Automações retentadas',
        description: `${count} automação(ões) foram adicionadas à fila.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao retentar',
        description: error.message || 'Não foi possível retentar as automações.',
        variant: 'destructive',
      });
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Automações WhatsApp</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Monitoramento de envio automático de materiais para leads
            </p>
          </div>

          <Button
            onClick={() => retryAllFailedMutation.mutate()}
            disabled={retryAllFailedMutation.isPending || stats?.failed === 0}
            variant="destructive"
            className="flex items-center gap-2 w-full sm:w-auto"
            size="sm"
          >
            {retryAllFailedMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Retentar Falhadas</span>
            <span className="sm:hidden">Retentar</span>
            ({stats?.failed || 0})
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
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-sm font-medium shrink-0">Filtrar por status:</span>
              <div className="flex items-center gap-2 flex-wrap">
                {['all', 'PENDING', 'PROCESSING', 'SENT', 'FAILED'].map((status) => (
                  <Button
                    key={status}
                    variant={selectedStatus === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedStatus(status)}
                    className="min-h-[44px]"
                  >
                    {status === 'all' ? 'Todos' : getStatusLabel(status)}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Automações */}
        {listLoading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">Carregando automações...</p>
            </CardContent>
          </Card>
        ) : automations?.data.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">Nenhuma automação encontrada</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Mobile: Cards */}
            <div className="md:hidden space-y-4">
              {automations?.data.map((automation: WhatsAppAutomation) => {
                const products = JSON.parse(automation.productsToSend || '[]');
                const progress = automation.messagesTotal > 0
                  ? (automation.messagesSent / automation.messagesTotal) * 100
                  : 0;

                return (
                  <Card key={automation.id} className="overflow-hidden">
                    <CardContent className="p-4 space-y-3">
                      {/* Status + Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(automation.status)}
                          <Badge variant={automation.status === 'SENT' ? 'default' : automation.status === 'FAILED' ? 'destructive' : 'secondary'}>
                            {getStatusLabel(automation.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedAutomation(automation.id);
                              setDetailsOpen(true);
                            }}
                            title="Ver detalhes"
                            className="h-10 w-10"
                          >
                            <Eye className="h-5 w-5" />
                          </Button>
                          {(automation.status === 'FAILED' || automation.status === 'PENDING') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                retryMutation.mutate({
                                  id: automation.id,
                                  resetMessages: automation.status === 'FAILED'
                                })
                              }
                              disabled={retryMutation.isPending}
                              title="Retentar"
                              className="h-10 w-10"
                            >
                              {retryMutation.isPending ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : (
                                <RotateCcw className="h-5 w-5" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Lead Info */}
                      <div>
                        <div className="text-sm font-medium">
                          {automation.lead?.name || 'Lead sem nome'}
                        </div>
                        <div className="text-sm text-muted-foreground">{automation.lead?.phone}</div>
                      </div>

                      {/* Products */}
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Produtos:</span> {products.join(', ')}
                      </div>

                      {/* Progress */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Progresso</span>
                          <span className="text-xs font-medium">
                            {automation.messagesSent}/{automation.messagesTotal}
                          </span>
                        </div>
                        <div className="bg-secondary rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              automation.status === 'SENT' ? 'bg-green-600' : 'bg-primary'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        {automation.error && (
                          <p className="text-xs text-destructive mt-1">{automation.error}</p>
                        )}
                      </div>

                      {/* Date */}
                      <div className="text-xs text-muted-foreground">
                        {new Date(automation.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Desktop: Table */}
            <Card className="hidden md:block">
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
                      {automations?.data.map((automation: WhatsAppAutomation) => {
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
                                  onClick={() => {
                                    setSelectedAutomation(automation.id);
                                    setDetailsOpen(true);
                                  }}
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
                                    className={retryMutation.isPending ? 'opacity-50' : ''}
                                  >
                                    {retryMutation.isPending ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <RotateCcw className="h-4 w-4" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

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

      {/* Sheet de Detalhes */}
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {detailsLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : automationDetails ? (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Detalhes da Automação
                </SheetTitle>
                <SheetDescription>
                  Informações completas sobre o envio automático via WhatsApp
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                {/* Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      {getStatusIcon(automationDetails.automation.status)}
                      Status da Automação
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Badge variant={automationDetails.automation.status === 'SENT' ? 'default' : automationDetails.automation.status === 'FAILED' ? 'destructive' : 'secondary'}>
                        {getStatusLabel(automationDetails.automation.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Progresso:</span>
                      <span className="text-sm font-medium">
                        {automationDetails.automation.messagesSent}/{automationDetails.automation.messagesTotal} mensagens
                      </span>
                    </div>
                    {automationDetails.automation.error && (
                      <div className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                        <p className="text-sm text-destructive font-medium">Erro:</p>
                        <p className="text-sm text-destructive/80 mt-1">{automationDetails.automation.error}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Informações do Lead */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Informações do Lead
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{automationDetails.automation.lead?.name || 'Sem nome'}</span>
                    </div>
                    {automationDetails.automation.lead?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{automationDetails.automation.lead.phone}</span>
                      </div>
                    )}
                    {automationDetails.automation.lead?.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{automationDetails.automation.lead.email}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Produtos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Produtos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {JSON.parse(automationDetails.automation.productsToSend || '[]').map((product: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{product}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Mensagens */}
                {automationDetails.automation.messages && automationDetails.automation.messages.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Mensagens Enviadas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {automationDetails.automation.messages.map((msg, idx) => (
                          <div key={msg.id} className="border rounded-md p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {msg.messageType === 'text' && <FileText className="h-4 w-4 text-muted-foreground" />}
                                {msg.messageType === 'image' && <ImageIcon className="h-4 w-4 text-muted-foreground" />}
                                {msg.messageType === 'video' && <Video className="h-4 w-4 text-muted-foreground" />}
                                <span className="text-xs font-medium">Mensagem {msg.order}</span>
                              </div>
                              <Badge variant={msg.status === 'SENT' ? 'default' : 'secondary'} className="text-xs">
                                {msg.status === 'SENT' ? 'Enviada' : 'Pendente'}
                              </Badge>
                            </div>
                            {msg.content && (
                              <p className="text-sm text-muted-foreground">{msg.content.substring(0, 100)}{msg.content.length > 100 ? '...' : ''}</p>
                            )}
                            {msg.mediaUrl && (
                              <p className="text-xs text-muted-foreground">Mídia: {msg.mediaUrl}</p>
                            )}
                            {msg.sentAt && (
                              <p className="text-xs text-muted-foreground">
                                Enviada em: {new Date(msg.sentAt).toLocaleString('pt-BR')}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Timeline */}
                {automationDetails.timeline && automationDetails.timeline.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Linha do Tempo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {automationDetails.timeline.map((event, idx) => (
                          <div key={idx} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className="h-2 w-2 rounded-full bg-primary" />
                              {idx < automationDetails.timeline.length - 1 && (
                                <div className="w-px h-full bg-border" />
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <p className="text-sm font-medium">{event.event}</p>
                              <p className="text-xs text-muted-foreground">{event.details}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(event.timestamp).toLocaleString('pt-BR')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Datas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Datas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Criada:</span>
                      <span>{new Date(automationDetails.automation.createdAt).toLocaleString('pt-BR')}</span>
                    </div>
                    {automationDetails.automation.startedAt && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Iniciada:</span>
                        <span>{new Date(automationDetails.automation.startedAt).toLocaleString('pt-BR')}</span>
                      </div>
                    )}
                    {automationDetails.automation.completedAt && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Completada:</span>
                        <span>{new Date(automationDetails.automation.completedAt).toLocaleString('pt-BR')}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Ações */}
                {(automationDetails.automation.status === 'FAILED' || automationDetails.automation.status === 'PENDING') && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        retryMutation.mutate({
                          id: automationDetails.automation.id,
                          resetMessages: automationDetails.automation.status === 'FAILED'
                        });
                        setDetailsOpen(false);
                      }}
                      disabled={retryMutation.isPending}
                      className="flex-1"
                    >
                      {retryMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <RotateCcw className="h-4 w-4 mr-2" />
                      )}
                      Retentar Automação
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mb-4" />
              <p>Não foi possível carregar os detalhes</p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}
