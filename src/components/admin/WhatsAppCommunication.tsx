import { useState, useEffect } from 'react';
import { MessageSquare, Send, Users, Settings, Plus, Edit, Trash2, CheckCircle, XCircle, Clock, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { MessageTemplate, WhatsAppConfig, Communication, Lead } from '@/types/lead';
import { communicationStorage } from '@/utils/communicationStorage';
import { leadStorage } from '@/utils/leadStorage';
import { useToast } from '@/hooks/use-toast';

const WhatsAppCommunication = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<WhatsAppConfig>({ isEnabled: false, isConnected: false });
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isBulkSendOpen, setIsBulkSendOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    content: '',
    category: 'custom' as MessageTemplate['category'],
  });
  const [bulkSend, setBulkSend] = useState({
    templateId: '',
    selectedLeads: [] as string[],
    customVariables: {} as Record<string, string>,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setConfig(communicationStorage.getWhatsAppConfig());
    setTemplates(communicationStorage.getTemplates('whatsapp'));
    setCommunications(communicationStorage.getCommunications());
    setLeads(leadStorage.getLeads());
  };

  const handleConfigUpdate = (updates: Partial<WhatsAppConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    communicationStorage.saveWhatsAppConfig(newConfig);

    toast({
      title: 'Configuração atualizada',
      description: 'Configurações do WhatsApp foram salvas.',
    });
  };

  const handleCreateTemplate = () => {
    if (!newTemplate.name.trim() || !newTemplate.content.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome e conteúdo são obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    try {
      const variables = communicationStorage.extractVariables(newTemplate.content);

      communicationStorage.createTemplate({
        ...newTemplate,
        type: 'whatsapp',
        variables,
        isActive: true,
      });

      loadData();
      setIsTemplateDialogOpen(false);
      setNewTemplate({ name: '', content: '', category: 'custom' });

      toast({
        title: 'Template criado',
        description: 'Template de mensagem criado com sucesso!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao criar template',
        variant: 'destructive',
      });
    }
  };

  const handleEditTemplate = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setNewTemplate({
      name: template.name,
      content: template.content,
      category: template.category,
    });
    setIsTemplateDialogOpen(true);
  };

  const handleUpdateTemplate = () => {
    if (!selectedTemplate) return;

    try {
      const variables = communicationStorage.extractVariables(newTemplate.content);

      communicationStorage.updateTemplate(selectedTemplate.id, {
        ...newTemplate,
        variables,
      });

      loadData();
      setIsTemplateDialogOpen(false);
      setSelectedTemplate(null);
      setNewTemplate({ name: '', content: '', category: 'custom' });

      toast({
        title: 'Template atualizado',
        description: 'Template de mensagem atualizado com sucesso!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar template',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTemplate = (template: MessageTemplate) => {
    if (!confirm(`Tem certeza que deseja excluir o template "${template.name}"?`)) return;

    try {
      communicationStorage.deleteTemplate(template.id);
      loadData();

      toast({
        title: 'Template excluído',
        description: 'Template excluído com sucesso!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir template',
        variant: 'destructive',
      });
    }
  };

  const handleBulkSend = async () => {
    if (!bulkSend.templateId || bulkSend.selectedLeads.length === 0) {
      toast({
        title: 'Erro',
        description: 'Selecione um template e pelo menos um lead',
        variant: 'destructive',
      });
      return;
    }

    const selectedLeadsData = leads.filter(lead => bulkSend.selectedLeads.includes(lead.id));
    const recipients = selectedLeadsData.map(lead => ({
      leadId: lead.id,
      phone: lead.phone,
      name: lead.name,
    }));

    try {
      const results = await communicationStorage.sendBulkMessages(
        recipients,
        bulkSend.templateId,
        bulkSend.customVariables
      );

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      toast({
        title: 'Envio em massa concluído',
        description: `${successCount} mensagens enviadas, ${failureCount} falharam.`,
      });

      setIsBulkSendOpen(false);
      setBulkSend({ templateId: '', selectedLeads: [], customVariables: {} });
      loadData();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro no envio em massa',
        variant: 'destructive',
      });
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: Communication['status']) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <MessageCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const stats = communicationStorage.getCommunicationStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">WhatsApp Business</h2>
          <p className="text-muted-foreground">
            Gerencie comunicação e templates de mensagem
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={config.isConnected ? 'default' : 'destructive'}>
            {config.isConnected ? 'Conectado' : 'Desconectado'}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="communications">Comunicações</TabsTrigger>
          <TabsTrigger value="bulk-send">Envio em Massa</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        {/* Dashboard */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <div>
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <div className="text-xs text-muted-foreground">Total Mensagens</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">{stats.byStatus.sent || 0}</div>
                    <div className="text-xs text-muted-foreground">Enviadas</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <div>
                    <div className="text-2xl font-bold">{stats.byStatus.failed || 0}</div>
                    <div className="text-xs text-muted-foreground">Falhas</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">{templates.length}</div>
                    <div className="text-xs text-muted-foreground">Templates</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Communications */}
          <Card>
            <CardHeader>
              <CardTitle>Comunicações Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma comunicação ainda
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.recentActivity.map((comm) => (
                    <div key={comm.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(comm.status)}
                        <div>
                          <div className="text-sm font-medium">
                            {comm.type.toUpperCase()} - {comm.direction === 'outbound' ? 'Enviado' : 'Recebido'}
                          </div>
                          <div className="text-xs text-muted-foreground truncate max-w-xs">
                            {comm.content}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatTimestamp(comm.timestamp)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Templates de Mensagem</h3>
            <Button onClick={() => setIsTemplateDialogOpen(true)} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Novo Template</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className={!template.isActive ? 'opacity-60' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <Badge variant="outline">{template.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-muted-foreground max-h-20 overflow-y-auto">
                    {template.content}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {template.variables.map((variable) => (
                      <Badge key={variable} variant="secondary" className="text-xs">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant={template.isActive ? 'default' : 'secondary'}>
                      {template.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEditTemplate(template)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Communications */}
        <TabsContent value="communications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Comunicações</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Direção</TableHead>
                    <TableHead>Conteúdo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data/Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {communications.slice(0, 50).map((comm) => (
                    <TableRow key={comm.id}>
                      <TableCell>
                        <Badge variant="outline">{comm.type.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={comm.direction === 'outbound' ? 'default' : 'secondary'}>
                          {comm.direction === 'outbound' ? 'Enviado' : 'Recebido'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate">{comm.content}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(comm.status)}
                          <span className="capitalize">{comm.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatTimestamp(comm.timestamp)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Send */}
        <TabsContent value="bulk-send" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Envio em Massa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Template</label>
                <Select
                  value={bulkSend.templateId}
                  onValueChange={(value) => setBulkSend({ ...bulkSend, templateId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.filter(t => t.isActive).map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} ({template.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Leads ({bulkSend.selectedLeads.length} selecionados)</label>
                <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
                  {leads.map((lead) => (
                    <div key={lead.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={bulkSend.selectedLeads.includes(lead.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBulkSend({
                              ...bulkSend,
                              selectedLeads: [...bulkSend.selectedLeads, lead.id]
                            });
                          } else {
                            setBulkSend({
                              ...bulkSend,
                              selectedLeads: bulkSend.selectedLeads.filter(id => id !== lead.id)
                            });
                          }
                        }}
                      />
                      <span className="text-sm">{lead.name} ({lead.phone})</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleBulkSend}
                disabled={!config.isConnected || !bulkSend.templateId || bulkSend.selectedLeads.length === 0}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar para {bulkSend.selectedLeads.length} leads
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do WhatsApp Business</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Ativar WhatsApp</label>
                  <p className="text-xs text-muted-foreground">
                    Habilita o envio de mensagens via WhatsApp
                  </p>
                </div>
                <Switch
                  checked={config.isEnabled}
                  onCheckedChange={(checked) => handleConfigUpdate({ isEnabled: checked })}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Business Phone ID</label>
                <Input
                  value={config.businessPhoneId || ''}
                  onChange={(e) => handleConfigUpdate({ businessPhoneId: e.target.value })}
                  placeholder="Seu Business Phone ID"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Access Token</label>
                <Input
                  type="password"
                  value={config.accessToken || ''}
                  onChange={(e) => handleConfigUpdate({ accessToken: e.target.value })}
                  placeholder="Seu Access Token"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Webhook Token</label>
                <Input
                  value={config.webhookToken || ''}
                  onChange={(e) => handleConfigUpdate({ webhookToken: e.target.value })}
                  placeholder="Token do Webhook"
                />
              </div>

              <div className="pt-4 border-t">
                <Button
                  onClick={() => handleConfigUpdate({ isConnected: !config.isConnected })}
                  variant={config.isConnected ? 'destructive' : 'default'}
                >
                  {config.isConnected ? 'Desconectar' : 'Testar Conexão'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? 'Editar Template' : 'Criar Novo Template'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome do Template</label>
              <Input
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                placeholder="Ex: Boas-vindas"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Categoria</label>
              <Select
                value={newTemplate.category}
                onValueChange={(value) => setNewTemplate({ ...newTemplate, category: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="welcome">Boas-vindas</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                  <SelectItem value="reminder">Lembrete</SelectItem>
                  <SelectItem value="promotional">Promocional</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Conteúdo</label>
              <Textarea
                value={newTemplate.content}
                onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                placeholder="Use {{nome}} para variáveis. Ex: Olá {{nome}}! Como posso ajudar?"
                rows={6}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use {`{{variavel}}`} para criar variáveis dinâmicas
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={selectedTemplate ? handleUpdateTemplate : handleCreateTemplate}>
                {selectedTemplate ? 'Atualizar' : 'Criar'} Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WhatsAppCommunication;