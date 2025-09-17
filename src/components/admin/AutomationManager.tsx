import { useState, useEffect } from 'react';
import { Zap, Plus, Edit, Trash2, Play, Pause, Settings, Clock, Target, MessageSquare, Tag, User, CheckCircle, XCircle } from 'lucide-react';
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
import { AutomationRule, AutomationTrigger, AutomationCondition, AutomationAction } from '@/types/lead';
import { automationStorage } from '@/utils/automationStorage';
import { communicationStorage } from '@/utils/communicationStorage';
import { useToast } from '@/hooks/use-toast';

const AutomationManager = () => {
  const { toast } = useToast();
  const [automations, setAutomations] = useState<AutomationRule[]>([]);
  const [stats, setStats] = useState<any>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<AutomationRule | null>(null);
  const [newAutomation, setNewAutomation] = useState({
    name: '',
    description: '',
    trigger: { type: 'lead_created', value: {} } as AutomationTrigger,
    conditions: [] as AutomationCondition[],
    actions: [] as AutomationAction[],
    isActive: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setAutomations(automationStorage.getAutomations());
    setStats(automationStorage.getAutomationStats());
  };

  const handleCreateAutomation = () => {
    const validation = automationStorage.validateAutomation(newAutomation);

    if (!validation.isValid) {
      toast({
        title: 'Erro de validação',
        description: validation.errors.join(', '),
        variant: 'destructive',
      });
      return;
    }

    try {
      automationStorage.createAutomation(newAutomation);
      loadData();
      setIsCreateDialogOpen(false);
      resetNewAutomation();

      toast({
        title: 'Automação criada',
        description: 'Automação criada com sucesso!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao criar automação',
        variant: 'destructive',
      });
    }
  };

  const handleEditAutomation = (automation: AutomationRule) => {
    setSelectedAutomation(automation);
    setNewAutomation({
      name: automation.name,
      description: automation.description,
      trigger: automation.trigger,
      conditions: automation.conditions,
      actions: automation.actions,
      isActive: automation.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateAutomation = () => {
    if (!selectedAutomation) return;

    const validation = automationStorage.validateAutomation(newAutomation);

    if (!validation.isValid) {
      toast({
        title: 'Erro de validação',
        description: validation.errors.join(', '),
        variant: 'destructive',
      });
      return;
    }

    try {
      automationStorage.updateAutomation(selectedAutomation.id, newAutomation);
      loadData();
      setIsEditDialogOpen(false);
      setSelectedAutomation(null);
      resetNewAutomation();

      toast({
        title: 'Automação atualizada',
        description: 'Automação atualizada com sucesso!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar automação',
        variant: 'destructive',
      });
    }
  };

  const handleToggleAutomation = (automation: AutomationRule) => {
    try {
      automationStorage.toggleAutomation(automation.id);
      loadData();

      toast({
        title: automation.isActive ? 'Automação desativada' : 'Automação ativada',
        description: `Automação "${automation.name}" foi ${automation.isActive ? 'desativada' : 'ativada'}.`,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao alterar status da automação',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAutomation = (automation: AutomationRule) => {
    if (!confirm(`Tem certeza que deseja excluir a automação "${automation.name}"?`)) return;

    try {
      automationStorage.deleteAutomation(automation.id);
      loadData();

      toast({
        title: 'Automação excluída',
        description: 'Automação excluída com sucesso!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir automação',
        variant: 'destructive',
      });
    }
  };

  const resetNewAutomation = () => {
    setNewAutomation({
      name: '',
      description: '',
      trigger: { type: 'lead_created', value: {} },
      conditions: [],
      actions: [],
      isActive: true,
    });
  };

  const addCondition = () => {
    setNewAutomation({
      ...newAutomation,
      conditions: [...newAutomation.conditions, { field: 'status', operator: 'equals', value: '' }],
    });
  };

  const updateCondition = (index: number, updates: Partial<AutomationCondition>) => {
    const updatedConditions = [...newAutomation.conditions];
    updatedConditions[index] = { ...updatedConditions[index], ...updates };
    setNewAutomation({ ...newAutomation, conditions: updatedConditions });
  };

  const removeCondition = (index: number) => {
    setNewAutomation({
      ...newAutomation,
      conditions: newAutomation.conditions.filter((_, i) => i !== index),
    });
  };

  const addAction = () => {
    setNewAutomation({
      ...newAutomation,
      actions: [...newAutomation.actions, { type: 'add_note', value: '' }],
    });
  };

  const updateAction = (index: number, updates: Partial<AutomationAction>) => {
    const updatedActions = [...newAutomation.actions];
    updatedActions[index] = { ...updatedActions[index], ...updates };
    setNewAutomation({ ...newAutomation, actions: updatedActions });
  };

  const removeAction = (index: number) => {
    setNewAutomation({
      ...newAutomation,
      actions: newAutomation.actions.filter((_, i) => i !== index),
    });
  };

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'lead_created':
        return <User className="h-4 w-4 text-green-500" />;
      case 'status_changed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'time_based':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'tag_added':
        return <Tag className="h-4 w-4 text-purple-500" />;
      case 'note_added':
        return <MessageSquare className="h-4 w-4 text-indigo-500" />;
      default:
        return <Target className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'send_message':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'change_status':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'add_tag':
        return <Tag className="h-4 w-4 text-purple-500" />;
      case 'add_note':
        return <MessageSquare className="h-4 w-4 text-indigo-500" />;
      default:
        return <Settings className="h-4 w-4 text-gray-500" />;
    }
  };

  const templates = communicationStorage.getTemplates('whatsapp');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Automações</h2>
          <p className="text-muted-foreground">
            Configure workflows automáticos para seus leads
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Nova Automação</span>
        </Button>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="automations">Automações</TabsTrigger>
        </TabsList>

        {/* Dashboard */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <div>
                    <div className="text-2xl font-bold">{stats.total || 0}</div>
                    <div className="text-xs text-muted-foreground">Total Automações</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Play className="h-4 w-4 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">{stats.active || 0}</div>
                    <div className="text-xs text-muted-foreground">Ativas</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">{stats.totalExecutions || 0}</div>
                    <div className="text-xs text-muted-foreground">Execuções</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-purple-500" />
                  <div>
                    <div className="text-2xl font-bold">
                      {stats.recentExecutions?.length || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Recentes</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Executions */}
          <Card>
            <CardHeader>
              <CardTitle>Execuções Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {!stats.recentExecutions || stats.recentExecutions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma execução recente
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.recentExecutions.map((execution: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <div>
                          <div className="text-sm font-medium">{execution.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {execution.count} execuções
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(execution.lastExecuted).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automations */}
        <TabsContent value="automations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Todas as Automações</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Ações</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Execuções</TableHead>
                    <TableHead>Última Execução</TableHead>
                    <TableHead className="text-right">Controles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {automations.map((automation) => (
                    <TableRow key={automation.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{automation.name}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {automation.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getTriggerIcon(automation.trigger.type)}
                          <span className="text-sm capitalize">
                            {automation.trigger.type.replace('_', ' ')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {automation.actions.slice(0, 3).map((action, index) => (
                            <div key={index} className="flex items-center space-x-1">
                              {getActionIcon(action.type)}
                              <span className="text-xs">
                                {action.type.replace('_', ' ')}
                              </span>
                            </div>
                          ))}
                          {automation.actions.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{automation.actions.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={automation.isActive ? 'default' : 'secondary'}>
                          {automation.isActive ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{automation.executionCount}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {automation.lastExecuted
                            ? new Date(automation.lastExecuted).toLocaleDateString('pt-BR')
                            : 'Nunca'
                          }
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleAutomation(automation)}
                            title={automation.isActive ? 'Desativar' : 'Ativar'}
                          >
                            {automation.isActive ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditAutomation(automation)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAutomation(automation)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Automation Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        setIsCreateDialogOpen(open && isCreateDialogOpen);
        setIsEditDialogOpen(open && isEditDialogOpen);
        if (!open) {
          setSelectedAutomation(null);
          resetNewAutomation();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedAutomation ? 'Editar Automação' : 'Criar Nova Automação'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome</label>
                <Input
                  value={newAutomation.name}
                  onChange={(e) => setNewAutomation({ ...newAutomation, name: e.target.value })}
                  placeholder="Ex: Boas-vindas automática"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  value={newAutomation.description}
                  onChange={(e) => setNewAutomation({ ...newAutomation, description: e.target.value })}
                  placeholder="Descreva o que esta automação faz..."
                  rows={2}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newAutomation.isActive}
                  onCheckedChange={(checked) => setNewAutomation({ ...newAutomation, isActive: checked })}
                />
                <label className="text-sm font-medium">Ativo</label>
              </div>
            </div>

            {/* Trigger */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Trigger (Quando executar)</h3>
              <Select
                value={newAutomation.trigger.type}
                onValueChange={(value) => setNewAutomation({
                  ...newAutomation,
                  trigger: { type: value as any, value: {} }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead_created">Novo lead criado</SelectItem>
                  <SelectItem value="status_changed">Status alterado</SelectItem>
                  <SelectItem value="time_based">Baseado em tempo</SelectItem>
                  <SelectItem value="tag_added">Tag adicionada</SelectItem>
                  <SelectItem value="note_added">Nota adicionada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Conditions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Condições</h3>
                <Button variant="outline" size="sm" onClick={addCondition}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Condição
                </Button>
              </div>
              {newAutomation.conditions.map((condition, index) => (
                <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg">
                  <Select
                    value={condition.field}
                    onValueChange={(value) => updateCondition(index, { field: value })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="status">Status</SelectItem>
                      <SelectItem value="tags">Tags</SelectItem>
                      <SelectItem value="source">Origem</SelectItem>
                      <SelectItem value="priority">Prioridade</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={condition.operator}
                    onValueChange={(value) => updateCondition(index, { operator: value as any })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Igual a</SelectItem>
                      <SelectItem value="not_equals">Diferente de</SelectItem>
                      <SelectItem value="contains">Contém</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={condition.value}
                    onChange={(e) => updateCondition(index, { value: e.target.value })}
                    placeholder="Valor"
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCondition(index)}
                    className="text-destructive"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Ações</h3>
                <Button variant="outline" size="sm" onClick={addAction}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Ação
                </Button>
              </div>
              {newAutomation.actions.map((action, index) => (
                <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg">
                  <Select
                    value={action.type}
                    onValueChange={(value) => updateAction(index, { type: value as any })}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="send_message">Enviar mensagem</SelectItem>
                      <SelectItem value="change_status">Alterar status</SelectItem>
                      <SelectItem value="add_tag">Adicionar tag</SelectItem>
                      <SelectItem value="remove_tag">Remover tag</SelectItem>
                      <SelectItem value="add_note">Adicionar nota</SelectItem>
                    </SelectContent>
                  </Select>

                  {action.type === 'send_message' ? (
                    <Select
                      value={action.templateId || ''}
                      onValueChange={(value) => updateAction(index, { templateId: value })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecione um template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={action.value}
                      onChange={(e) => updateAction(index, { value: e.target.value })}
                      placeholder="Valor da ação"
                      className="flex-1"
                    />
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAction(index)}
                    className="text-destructive"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => {
                setIsCreateDialogOpen(false);
                setIsEditDialogOpen(false);
                setSelectedAutomation(null);
                resetNewAutomation();
              }}>
                Cancelar
              </Button>
              <Button onClick={selectedAutomation ? handleUpdateAutomation : handleCreateAutomation}>
                {selectedAutomation ? 'Atualizar' : 'Criar'} Automação
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AutomationManager;