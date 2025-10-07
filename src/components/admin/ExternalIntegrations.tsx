import { useState, useEffect } from 'react';
import {
  Zap,
  Link,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  Globe,
  Database,
  Cloud,
  BarChart3,
  Mail,
  MessageSquare,
  Target,
  Users,
  DollarSign
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { integrationStorage } from '@/utils/integrationStorage';
import { logger } from '@/lib/logger';
import type {
  Integration,
  IntegrationConfig,
  IntegrationCredentials,
  DataMapping
} from '@/types/lead';

const ExternalIntegrations = () => {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [availableIntegrations, setAvailableIntegrations] = useState<Array<{ type: string; name: string; description: string; category: string; icon: string; requiredFields: string[] }>>([]);
  const [stats, setStats] = useState<{ totalIntegrations: number; activeIntegrations: number; successfulSyncs: number; failedSyncs: number; lastSyncDate?: string }>({ totalIntegrations: 0, activeIntegrations: 0, successfulSyncs: 0, failedSyncs: 0 });
  const [syncLogs, setSyncLogs] = useState<Array<{ id: string; integrationId: string; timestamp: string; success: boolean; error?: string; duration: number }>>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isSyncing, setIsSyncing] = useState<Record<string, boolean>>({});
  const [newIntegration, setNewIntegration] = useState({
    name: '',
    type: '' as Integration['type'],
    config: {
      syncFrequency: 'daily' as const,
      webhookUrl: '',
      dataMapping: [] as DataMapping[],
      filters: [],
      actions: []
    },
    credentials: {
      apiKey: '',
      accessToken: '',
      clientId: '',
      clientSecret: '',
      customFields: {}
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allIntegrations = integrationStorage.getIntegrations();
    const available = integrationStorage.getAvailableIntegrations();
    const integrationStats = integrationStorage.getIntegrationStats();
    const logs = integrationStorage.getSyncLogs();

    setIntegrations(allIntegrations);
    setAvailableIntegrations(available);
    setStats(integrationStats);
    setSyncLogs(logs);
  };

  const handleCreateIntegration = () => {
    if (!newIntegration.name || !newIntegration.type) {
      toast({
        title: 'Erro',
        description: 'Nome e tipo são obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    try {
      integrationStorage.createIntegration(
        newIntegration.name,
        newIntegration.type,
        newIntegration.config,
        newIntegration.credentials
      );

      setIsCreateOpen(false);
      setNewIntegration({
        name: '',
        type: '' as Integration['type'],
        config: {
          syncFrequency: 'daily',
          webhookUrl: '',
          dataMapping: [],
          filters: [],
          actions: []
        },
        credentials: {
          apiKey: '',
          accessToken: '',
          clientId: '',
          clientSecret: '',
          customFields: {}
        }
      });
      loadData();

      toast({
        title: 'Integração Criada',
        description: 'Nova integração criada com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao criar integração',
        variant: 'destructive',
      });
    }
  };

  const handleToggleIntegration = async (integrationId: string, enable: boolean) => {
    try {
      let result;
      if (enable) {
        result = integrationStorage.enableIntegration(integrationId);
      } else {
        result = integrationStorage.disableIntegration(integrationId);
      }

      if (result) {
        loadData();
        toast({
          title: enable ? 'Integração Ativada' : 'Integração Desativada',
          description: `Integração ${enable ? 'ativada' : 'desativada'} com sucesso`,
        });
      } else {
        toast({
          title: 'Erro',
          description: 'Erro ao alterar status da integração',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao alterar status da integração',
        variant: 'destructive',
      });
    }
  };

  const handleSyncIntegration = async (integrationId: string) => {
    setIsSyncing(prev => ({ ...prev, [integrationId]: true }));

    try {
      const result = await integrationStorage.syncIntegration(integrationId);

      if (result.success) {
        toast({
          title: 'Sincronização Concluída',
          description: 'Dados sincronizados com sucesso',
        });
      } else {
        toast({
          title: 'Erro na Sincronização',
          description: result.error,
          variant: 'destructive',
        });
      }

      loadData();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao sincronizar integração',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(prev => ({ ...prev, [integrationId]: false }));
    }
  };

  const handleSyncAll = async () => {
    try {
      const result = await integrationStorage.syncAllIntegrations();

      toast({
        title: 'Sincronização em Lote',
        description: `${result.successful}/${result.processed} integrações sincronizadas`,
      });

      if (result.errors.length > 0) {
        logger.error('Erros na sincronização:', result.errors);
      }

      loadData();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao sincronizar integrações',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteIntegration = (integrationId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta integração?')) return;

    try {
      integrationStorage.deleteIntegration(integrationId);
      loadData();

      toast({
        title: 'Integração Excluída',
        description: 'Integração removida com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir integração',
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (status: Integration['syncStatus']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'disabled':
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getIntegrationIcon = (type: Integration['type']) => {
    const icons = {
      zapier: '⚡',
      make: '🔧',
      google_analytics: '📊',
      facebook_ads: '📱',
      instagram_ads: '📸',
      hubspot: '🎯',
      pipedrive: '🎪',
      mailchimp: '📧',
      custom: '🔗'
    };
    return icons[type] || '🔗';
  };

  const renderIntegrationCard = (integration: Integration) => {
    const isLoading = isSyncing[integration.id];
    const available = availableIntegrations.find(a => a.type === integration.type);

    return (
      <Card key={integration.id} className="relative">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{getIntegrationIcon(integration.type)}</div>
              <div>
                <CardTitle className="text-lg">{integration.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {available?.description || integration.type}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(integration.syncStatus)}
              <Badge variant={integration.isEnabled ? 'default' : 'secondary'}>
                {integration.isEnabled ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Status and Last Sync */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Última sincronização:</span>
              <span>
                {integration.lastSync
                  ? new Date(integration.lastSync).toLocaleString()
                  : 'Nunca'}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Frequência:</span>
              <Badge variant="outline">{integration.config.syncFrequency}</Badge>
            </div>

            {integration.errorMessage && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {integration.errorMessage}
                </AlertDescription>
              </Alert>
            )}

            {/* Controls */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={integration.isEnabled}
                  onCheckedChange={(checked) => handleToggleIntegration(integration.id, checked)}
                />
                <span className="text-sm">
                  {integration.isEnabled ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              <div className="flex space-x-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSyncIntegration(integration.id)}
                  disabled={!integration.isEnabled || isLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedIntegration(integration);
                    setIsConfigOpen(true);
                  }}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteIntegration(integration.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Link className="h-6 w-6 text-primary" />
            Integrações Externas
          </h2>
          <p className="text-muted-foreground">
            Conecte seu CRM com ferramentas externas e automatize fluxos
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleSyncAll}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Sincronizar Todas
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Integração
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Link className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold">{stats.totalIntegrations || 0}</div>
                <div className="text-xs text-muted-foreground">Total Integrações</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{stats.activeIntegrations || 0}</div>
                <div className="text-xs text-muted-foreground">Ativas</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{stats.successfulSyncs || 0}</div>
                <div className="text-xs text-muted-foreground">Sincronizações OK</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <div>
                <div className="text-2xl font-bold">{stats.failedSyncs || 0}</div>
                <div className="text-xs text-muted-foreground">Falhas</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Integrações Ativas</TabsTrigger>
          <TabsTrigger value="available">Integrações Disponíveis</TabsTrigger>
          <TabsTrigger value="logs">Logs de Sincronização</TabsTrigger>
        </TabsList>

        {/* Active Integrations */}
        <TabsContent value="active" className="space-y-4">
          {integrations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Link className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Nenhuma Integração Configurada</h3>
                <p className="text-muted-foreground mb-4">
                  Configure integrações para conectar com ferramentas externas
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Integração
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {integrations.map(integration => renderIntegrationCard(integration))}
            </div>
          )}
        </TabsContent>

        {/* Available Integrations */}
        <TabsContent value="available" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableIntegrations.map((integration) => (
              <Card key={integration.type} className="relative">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{integration.icon}</div>
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{integration.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Badge variant="outline">{integration.category}</Badge>

                    <div className="text-sm">
                      <strong>Campos obrigatórios:</strong>
                      <ul className="list-disc list-inside mt-1 text-muted-foreground">
                        {integration.requiredFields.map((field: string) => (
                          <li key={field}>{field}</li>
                        ))}
                      </ul>
                    </div>

                    <Button
                      className="w-full"
                      onClick={() => {
                        setNewIntegration({
                          ...newIntegration,
                          name: integration.name,
                          type: integration.type as Integration['type']
                        });
                        setIsCreateOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Configurar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Sync Logs */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Sincronização</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Integração</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Erro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {syncLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum log de sincronização encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    syncLogs.slice(0, 50).map((log) => {
                      const integration = integrations.find(i => i.id === log.integrationId);
                      return (
                        <TableRow key={log.id}>
                          <TableCell>
                            {new Date(log.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell>{integration?.name || 'Desconhecida'}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {log.success ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              <span>{log.success ? 'Sucesso' : 'Erro'}</span>
                            </div>
                          </TableCell>
                          <TableCell>{log.duration}ms</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {log.error || '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Integration Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Integração</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nome</label>
                <Input
                  value={newIntegration.name}
                  onChange={(e) => setNewIntegration({ ...newIntegration, name: e.target.value })}
                  placeholder="Ex: HubSpot Principal"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Tipo</label>
                <Select
                  value={newIntegration.type}
                  onValueChange={(value) => setNewIntegration({ ...newIntegration, type: value as Integration['type'] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableIntegrations.map(integration => (
                      <SelectItem key={integration.type} value={integration.type}>
                        <div className="flex items-center space-x-2">
                          <span>{integration.icon}</span>
                          <span>{integration.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Frequência de Sincronização</label>
              <Select
                value={newIntegration.config.syncFrequency}
                onValueChange={(value) => setNewIntegration({
                  ...newIntegration,
                  config: { ...newIntegration.config, syncFrequency: value as 'daily' }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Tempo Real</SelectItem>
                  <SelectItem value="hourly">A cada hora</SelectItem>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">URL do Webhook (se aplicável)</label>
              <Input
                value={newIntegration.config.webhookUrl}
                onChange={(e) => setNewIntegration({
                  ...newIntegration,
                  config: { ...newIntegration.config, webhookUrl: e.target.value }
                })}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="text-sm font-medium">API Key</label>
              <Input
                type="password"
                value={newIntegration.credentials.apiKey}
                onChange={(e) => setNewIntegration({
                  ...newIntegration,
                  credentials: { ...newIntegration.credentials, apiKey: e.target.value }
                })}
                placeholder="Chave da API"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateIntegration}>
                Criar Integração
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Configuration Dialog */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Configurar {selectedIntegration?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedIntegration && (
            <div className="space-y-6">
              <Tabs defaultValue="credentials">
                <TabsList>
                  <TabsTrigger value="credentials">Credenciais</TabsTrigger>
                  <TabsTrigger value="mapping">Mapeamento</TabsTrigger>
                  <TabsTrigger value="filters">Filtros</TabsTrigger>
                  <TabsTrigger value="actions">Ações</TabsTrigger>
                </TabsList>

                <TabsContent value="credentials" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">API Key</label>
                      <Input
                        type="password"
                        value={selectedIntegration.credentials.apiKey || ''}
                        placeholder="Chave da API"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Access Token</label>
                      <Input
                        type="password"
                        value={selectedIntegration.credentials.accessToken || ''}
                        placeholder="Token de acesso"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="mapping" className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-3">Mapeamento de Campos</h4>
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2 text-sm font-medium">
                        <span>Campo Local</span>
                        <span>Campo Externo</span>
                        <span>Obrigatório</span>
                      </div>
                      {['name', 'phone', 'email', 'status'].map(field => (
                        <div key={field} className="grid grid-cols-3 gap-2">
                          <Input value={field} disabled />
                          <Input placeholder={`external_${field}`} />
                          <div className="flex items-center">
                            <Switch defaultChecked={field === 'name' || field === 'phone'} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="filters" className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-3">Filtros de Sincronização</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Configure quais dados serão sincronizados
                    </p>
                    {/* Filter configuration would go here */}
                    <div className="text-center py-8 text-muted-foreground">
                      Configuração de filtros em desenvolvimento
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="actions" className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-3">Ações Automatizadas</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Configure ações que serão executadas automaticamente
                    </p>
                    {/* Actions configuration would go here */}
                    <div className="text-center py-8 text-muted-foreground">
                      Configuração de ações em desenvolvimento
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsConfigOpen(false)}>
                  Cancelar
                </Button>
                <Button>
                  Salvar Configurações
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExternalIntegrations;