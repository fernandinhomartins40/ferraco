/**
 * AdminLeads - Gerenciamento de Leads com API Real
 * MIGRADO de kanbanStorage para PostgreSQL API
 */

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  Plus,
  Search,
  Loader2,
  CheckCircle,
  Settings2,
  Bot,
  Layers,
} from 'lucide-react';
import { useLeads, useCreateLead, useUpdateLead, useDeleteLead } from '@/hooks/api/useLeads';
import type { Lead, CreateLeadData, UpdateLeadData } from '@/services/leads.service';
import KanbanView from '@/components/admin/KanbanView';
import AutomationKanbanView from '@/components/admin/AutomationKanbanView';
import { useToast } from '@/hooks/use-toast';
import { useKanbanColumns } from '@/hooks/useKanbanColumns';
import { useAutomationKanban } from '@/hooks/useAutomationKanban';
import { useWhatsAppTemplates } from '@/hooks/useWhatsAppTemplates';
import type { KanbanColumn, CreateKanbanColumnDto, UpdateKanbanColumnDto } from '@/services/kanbanColumns.service';

const AdminLeads = () => {
  const { toast } = useToast();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Column Management State
  const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false);
  const [isEditColumnMode, setIsEditColumnMode] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<KanbanColumn | null>(null);
  const [columnFormData, setColumnFormData] = useState<CreateKanbanColumnDto>({
    name: '',
    color: '#3B82F6',
    status: '',
  });

  // Automation Column Management State
  const [isAutomationColumnDialogOpen, setIsAutomationColumnDialogOpen] = useState(false);
  const [isEditAutomationColumnMode, setIsEditAutomationColumnMode] = useState(false);
  const [selectedAutomationColumn, setSelectedAutomationColumn] = useState<any>(null);
  const [automationColumnFormData, setAutomationColumnFormData] = useState({
    name: '',
    color: '#10B981',
    description: '',
    sendIntervalSeconds: 60,
    scheduledDate: '',
    isRecurring: false,
    recurringDay: undefined as number | undefined,
    messageTemplateId: '',
    productIds: [] as string[],
  });

  // Template Management State
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [templateFormData, setTemplateFormData] = useState({
    name: '',
    content: '',
    mediaUrls: [] as string[],
    mediaType: '',
  });

  // Form state
  const [formData, setFormData] = useState<CreateLeadData>({
    name: '',
    phone: '',
    email: '',
    company: '',
    source: 'website',
    priority: 'MEDIUM',
  });

  // API Hooks
  const { data: leadsData, isLoading } = useLeads({
    search: searchQuery || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();

  // Kanban Columns Hooks
  const {
    columns,
    isLoading: isLoadingColumns,
    createColumn,
    updateColumn,
    deleteColumn,
  } = useKanbanColumns();

  // Automation Kanban Hooks
  const {
    columns: automationColumns,
    isLoadingColumns: isLoadingAutomationColumns,
    leadsInAutomation,
    moveLeadToColumn: moveToAutomationColumn,
    removeLeadFromAutomation,
    createColumn: createAutomationColumn,
    updateColumn: updateAutomationColumn,
    deleteColumn: deleteAutomationColumn,
  } = useAutomationKanban();

  // WhatsApp Templates Hooks
  const { templates, createTemplate, updateTemplate, deleteTemplate } = useWhatsAppTemplates();

  const leads = leadsData?.data || [];

  // Handlers
  const handleCreate = async () => {
    if (!formData.name || !formData.phone) {
      return;
    }

    await createLead.mutateAsync(formData);
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleEdit = async () => {
    if (!selectedLead) return;

    const updateData: UpdateLeadData = {
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      company: formData.company,
      source: formData.source,
      priority: formData.priority,
    };

    await updateLead.mutateAsync({ id: selectedLead.id, data: updateData });
    setIsEditDialogOpen(false);
    setSelectedLead(null);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja deletar este lead?')) {
      await deleteLead.mutateAsync(id);
    }
  };

  const openEditDialog = (lead: Lead) => {
    setSelectedLead(lead);
    setFormData({
      name: lead.name,
      phone: lead.phone,
      email: lead.email || '',
      company: lead.company || '',
      source: lead.source || 'website',
      priority: lead.priority,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateStatus = async (leadId: string, newStatus: string) => {
    try {
      await updateLead.mutateAsync({
        id: leadId,
        data: { status: newStatus },
      });
      toast({
        title: 'Status atualizado',
        description: 'O status do lead foi atualizado com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status do lead.',
        variant: 'destructive',
      });
    }
  };

  // Column Handlers
  const handleCreateColumn = async () => {
    if (!columnFormData.name || !columnFormData.status) {
      return;
    }

    await createColumn.mutateAsync(columnFormData);
    setIsColumnDialogOpen(false);
    resetColumnForm();
  };

  const handleEditColumn = async () => {
    if (!selectedColumn) return;

    await updateColumn.mutateAsync({
      id: selectedColumn.id,
      data: {
        name: columnFormData.name,
        color: columnFormData.color,
        status: columnFormData.status,
      },
    });
    setIsColumnDialogOpen(false);
    setIsEditColumnMode(false);
    setSelectedColumn(null);
    resetColumnForm();
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (confirm('Tem certeza que deseja remover esta coluna?')) {
      await deleteColumn.mutateAsync(columnId);
    }
  };

  const openEditColumnDialog = (column: KanbanColumn) => {
    setSelectedColumn(column);
    setColumnFormData({
      name: column.name,
      color: column.color,
      status: column.status,
    });
    setIsEditColumnMode(true);
    setIsColumnDialogOpen(true);
  };

  const resetColumnForm = () => {
    setColumnFormData({
      name: '',
      color: '#3B82F6',
      status: '',
    });
  };

  // Automation Column Handlers
  const handleCreateAutomationColumn = async () => {
    if (!automationColumnFormData.name) {
      return;
    }

    await createAutomationColumn.mutateAsync({
      ...automationColumnFormData,
      scheduledDate: automationColumnFormData.scheduledDate || undefined,
      productIds: automationColumnFormData.productIds.length > 0 ? automationColumnFormData.productIds : undefined,
      messageTemplateId: automationColumnFormData.messageTemplateId || undefined,
    });
    setIsAutomationColumnDialogOpen(false);
    resetAutomationColumnForm();
  };

  const handleEditAutomationColumn = async () => {
    if (!selectedAutomationColumn) return;

    await updateAutomationColumn.mutateAsync({
      id: selectedAutomationColumn.id,
      data: {
        ...automationColumnFormData,
        scheduledDate: automationColumnFormData.scheduledDate || undefined,
        productIds: automationColumnFormData.productIds.length > 0 ? automationColumnFormData.productIds : undefined,
        messageTemplateId: automationColumnFormData.messageTemplateId || undefined,
      },
    });
    setIsAutomationColumnDialogOpen(false);
    setIsEditAutomationColumnMode(false);
    setSelectedAutomationColumn(null);
    resetAutomationColumnForm();
  };

  const handleDeleteAutomationColumn = async (columnId: string) => {
    if (confirm('Tem certeza que deseja remover esta coluna de automação?')) {
      await deleteAutomationColumn.mutateAsync(columnId);
    }
  };

  const openEditAutomationColumnDialog = (column: any) => {
    setSelectedAutomationColumn(column);
    setAutomationColumnFormData({
      name: column.name,
      color: column.color,
      description: column.description || '',
      sendIntervalSeconds: column.sendIntervalSeconds,
      scheduledDate: column.scheduledDate || '',
      isRecurring: column.isRecurring,
      recurringDay: column.recurringDay,
      messageTemplateId: column.messageTemplateId || '',
      productIds: column.productIds ? JSON.parse(column.productIds) : [],
    });
    setIsEditAutomationColumnMode(true);
    setIsAutomationColumnDialogOpen(true);
  };

  const resetAutomationColumnForm = () => {
    setAutomationColumnFormData({
      name: '',
      color: '#10B981',
      description: '',
      sendIntervalSeconds: 60,
      scheduledDate: '',
      isRecurring: false,
      recurringDay: undefined,
      messageTemplateId: '',
      productIds: [],
    });
  };

  // Template Handlers
  const handleCreateTemplate = async () => {
    if (!templateFormData.name || !templateFormData.content) {
      return;
    }

    await createTemplate.mutateAsync(templateFormData);
    setIsTemplateDialogOpen(false);
    resetTemplateForm();
  };

  const resetTemplateForm = () => {
    setTemplateFormData({
      name: '',
      content: '',
      mediaUrls: [],
      mediaType: '',
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      company: '',
      source: 'website',
      priority: 'MEDIUM',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      NOVO: { label: 'Novo', className: 'bg-blue-100 text-blue-800' },
      QUALIFICADO: { label: 'Qualificado', className: 'bg-green-100 text-green-800' },
      EM_ANDAMENTO: { label: 'Em Andamento', className: 'bg-yellow-100 text-yellow-800' },
      CONCLUIDO: { label: 'Concluído', className: 'bg-purple-100 text-purple-800' },
      PERDIDO: { label: 'Perdido', className: 'bg-red-100 text-red-800' },
      ARQUIVADO: { label: 'Arquivado', className: 'bg-gray-100 text-gray-800' },
    };
    const variant = variants[status] || variants.NOVO;
    return (
      <Badge className={variant.className} variant="outline">
        {variant.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      LOW: { label: 'Baixa', className: 'bg-gray-100 text-gray-800' },
      MEDIUM: { label: 'Média', className: 'bg-blue-100 text-blue-800' },
      HIGH: { label: 'Alta', className: 'bg-orange-100 text-orange-800' },
      URGENT: { label: 'Urgente', className: 'bg-red-100 text-red-800' },
    };
    const variant = variants[priority] || variants.MEDIUM;
    return (
      <Badge className={variant.className} variant="outline" size="sm">
        {variant.label}
      </Badge>
    );
  };

  return (
    <AdminLayout>
      <div className="w-full flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Leads</h1>
            <p className="text-muted-foreground">
              Gerencie seus leads do banco de dados PostgreSQL
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => {
                resetColumnForm();
                setIsEditColumnMode(false);
                setIsColumnDialogOpen(true);
              }}
            >
              <Settings2 className="mr-2 h-4 w-4" />
              Gerenciar Colunas
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Lead
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Lead</DialogTitle>
                <DialogDescription>
                  Adicione um novo lead ao sistema. Os dados serão salvos no banco de dados.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <Label htmlFor="company">Empresa</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Nome da empresa"
                  />
                </div>
                <div>
                  <Label htmlFor="source">Origem</Label>
                  <Select
                    value={formData.source}
                    onValueChange={(value) => setFormData({ ...formData, source: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="indicacao">Indicação</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Baixa</SelectItem>
                      <SelectItem value="MEDIUM">Média</SelectItem>
                      <SelectItem value="HIGH">Alta</SelectItem>
                      <SelectItem value="URGENT">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={createLead.isPending || !formData.name || !formData.phone}
                >
                  {createLead.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Lead
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Alert de dados reais */}
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            ✅ Todos os leads são REAIS e persistidos no PostgreSQL. Não há simulações.
          </AlertDescription>
        </Alert>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, telefone ou email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="NOVO">Novo</SelectItem>
                  <SelectItem value="QUALIFICADO">Qualificado</SelectItem>
                  <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                  <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                  <SelectItem value="PERDIDO">Perdido</SelectItem>
                  <SelectItem value="ARQUIVADO">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Kanban View - Full width */}
        <div className="-mx-6">
          {isLoading || isLoadingColumns ? (
            <div className="flex items-center justify-center py-12 px-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : columns.length === 0 ? (
            <div className="px-6">
              <Card>
                <CardContent className="text-center py-12 text-muted-foreground">
                  <Settings2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nenhuma coluna configurada</p>
                  <p className="text-sm">Configure as colunas do Kanban para começar</p>
                  <Button
                    className="mt-4"
                    onClick={() => {
                      resetColumnForm();
                      setIsEditColumnMode(false);
                      setIsColumnDialogOpen(true);
                    }}
                  >
                    <Settings2 className="mr-2 h-4 w-4" />
                    Gerenciar Colunas
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <KanbanView
              leads={leads}
              columns={columns}
              onUpdateLeadStatus={handleUpdateStatus}
              onEditLead={openEditDialog}
              onDeleteLead={(id) => {
                if (window.confirm('Tem certeza que deseja excluir este lead?')) {
                  deleteLead.mutate(id);
                }
              }}
              onEditColumn={openEditColumnDialog}
              onDeleteColumn={handleDeleteColumn}
            />
          )}
        </div>

        {/* Separador e Título do Kanban de Automação */}
        <Separator className="my-8" />

        <div className="space-y-4">
          <div className="flex items-center justify-between px-6">
            <div>
              <div className="flex items-center gap-2">
                <Bot className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">Automação de Mensagens WhatsApp</h2>
              </div>
              <p className="text-muted-foreground mt-1">
                Arraste leads para colunas de automação para agendar envios automáticos de mensagens
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                resetAutomationColumnForm();
                setIsEditAutomationColumnMode(false);
                setIsAutomationColumnDialogOpen(true);
              }}
            >
              <Settings2 className="mr-2 h-4 w-4" />
              Nova Coluna de Automação
            </Button>
          </div>

          {/* Kanban de Automação */}
          <div className="-mx-6">
            {isLoadingAutomationColumns ? (
              <div className="flex items-center justify-center py-12 px-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : automationColumns.length === 0 ? (
              <div className="px-6">
                <Card>
                  <CardContent className="text-center py-12 text-muted-foreground">
                    <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Nenhuma coluna de automação configurada</p>
                    <p className="text-sm">Configure colunas para automatizar o envio de mensagens</p>
                    <Button
                      className="mt-4"
                      onClick={() => {
                        toast({
                          title: 'Em desenvolvimento',
                          description: 'Funcionalidade em breve.',
                        });
                      }}
                    >
                      <Settings2 className="mr-2 h-4 w-4" />
                      Criar Primeira Coluna
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <AutomationKanbanView
                columns={automationColumns}
                leadsPositions={leadsInAutomation}
                availableLeads={leads}
                onMoveLeadToColumn={(leadId, columnId) => {
                  moveToAutomationColumn({ leadId, columnId });
                }}
                onRemoveLeadFromAutomation={removeLeadFromAutomation.mutate}
                onEditColumn={openEditAutomationColumnDialog}
                onDeleteColumn={handleDeleteAutomationColumn}
              />
            )}
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Lead</DialogTitle>
              <DialogDescription>
                Atualize as informações do lead. As alterações serão salvas no banco de dados.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nome *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Telefone *</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-company">Empresa</Label>
                <Input
                  id="edit-company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedLead(null);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleEdit}
                disabled={updateLead.isPending || !formData.name || !formData.phone}
              >
                {updateLead.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Column Management Dialog */}
        <Dialog open={isColumnDialogOpen} onOpenChange={setIsColumnDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEditColumnMode ? 'Editar Coluna' : 'Nova Coluna do Kanban'}
              </DialogTitle>
              <DialogDescription>
                {isEditColumnMode
                  ? 'Atualize as informações da coluna.'
                  : 'Crie uma nova coluna personalizada para o kanban.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="column-name">Nome da Coluna *</Label>
                <Input
                  id="column-name"
                  value={columnFormData.name}
                  onChange={(e) =>
                    setColumnFormData({ ...columnFormData, name: e.target.value })
                  }
                  placeholder="Ex: Negociação"
                />
              </div>
              <div>
                <Label htmlFor="column-status">Status *</Label>
                <Input
                  id="column-status"
                  value={columnFormData.status}
                  onChange={(e) =>
                    setColumnFormData({ ...columnFormData, status: e.target.value.toUpperCase() })
                  }
                  placeholder="Ex: NEGOCIACAO"
                  disabled={isEditColumnMode}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Este status será atribuído aos leads quando movidos para esta coluna
                </p>
              </div>
              <div>
                <Label htmlFor="column-color">Cor da Coluna</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="column-color"
                    type="color"
                    value={columnFormData.color}
                    onChange={(e) =>
                      setColumnFormData({ ...columnFormData, color: e.target.value })
                    }
                    className="w-20 h-10"
                  />
                  <Input
                    value={columnFormData.color}
                    onChange={(e) =>
                      setColumnFormData({ ...columnFormData, color: e.target.value })
                    }
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsColumnDialogOpen(false);
                  setIsEditColumnMode(false);
                  setSelectedColumn(null);
                  resetColumnForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={isEditColumnMode ? handleEditColumn : handleCreateColumn}
                disabled={
                  (isEditColumnMode ? updateColumn.isPending : createColumn.isPending) ||
                  !columnFormData.name ||
                  !columnFormData.status
                }
              >
                {(isEditColumnMode ? updateColumn.isPending : createColumn.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditColumnMode ? 'Salvar Alterações' : 'Criar Coluna'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Automation Column Dialog */}
        <Dialog open={isAutomationColumnDialogOpen} onOpenChange={setIsAutomationColumnDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditAutomationColumnMode ? 'Editar Coluna de Automação' : 'Nova Coluna de Automação'}
              </DialogTitle>
              <DialogDescription>
                Configure uma coluna para automação de envio de mensagens WhatsApp
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="automation-column-name">Nome da Coluna *</Label>
                <Input
                  id="automation-column-name"
                  value={automationColumnFormData.name}
                  onChange={(e) =>
                    setAutomationColumnFormData({ ...automationColumnFormData, name: e.target.value })
                  }
                  placeholder="Ex: Primeiro Contato"
                />
              </div>

              <div>
                <Label htmlFor="automation-column-description">Descrição</Label>
                <Input
                  id="automation-column-description"
                  value={automationColumnFormData.description}
                  onChange={(e) =>
                    setAutomationColumnFormData({ ...automationColumnFormData, description: e.target.value })
                  }
                  placeholder="Descreva o objetivo desta coluna"
                />
              </div>

              <div>
                <Label htmlFor="automation-column-color">Cor da Coluna</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="automation-column-color"
                    type="color"
                    value={automationColumnFormData.color}
                    onChange={(e) =>
                      setAutomationColumnFormData({ ...automationColumnFormData, color: e.target.value })
                    }
                    className="w-20 h-10"
                  />
                  <Input
                    value={automationColumnFormData.color}
                    onChange={(e) =>
                      setAutomationColumnFormData({ ...automationColumnFormData, color: e.target.value })
                    }
                    placeholder="#10B981"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="send-interval">Intervalo entre Envios (segundos)</Label>
                <Input
                  id="send-interval"
                  type="number"
                  min="10"
                  value={automationColumnFormData.sendIntervalSeconds}
                  onChange={(e) =>
                    setAutomationColumnFormData({
                      ...automationColumnFormData,
                      sendIntervalSeconds: parseInt(e.target.value) || 60,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Tempo de espera entre envios para evitar bloqueios
                </p>
              </div>

              <div>
                <Label htmlFor="template-select">Template de Mensagem</Label>
                <Select
                  value={automationColumnFormData.messageTemplateId}
                  onValueChange={(value) =>
                    setAutomationColumnFormData({ ...automationColumnFormData, messageTemplateId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto mt-1"
                  onClick={() => setIsTemplateDialogOpen(true)}
                >
                  + Criar novo template
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is-recurring"
                  checked={automationColumnFormData.isRecurring}
                  onChange={(e) =>
                    setAutomationColumnFormData({
                      ...automationColumnFormData,
                      isRecurring: e.target.checked,
                    })
                  }
                  className="rounded"
                />
                <Label htmlFor="is-recurring">Envio Recorrente Mensal</Label>
              </div>

              {automationColumnFormData.isRecurring && (
                <div>
                  <Label htmlFor="recurring-day">Dia do Mês (1-31)</Label>
                  <Input
                    id="recurring-day"
                    type="number"
                    min="1"
                    max="31"
                    value={automationColumnFormData.recurringDay || ''}
                    onChange={(e) =>
                      setAutomationColumnFormData({
                        ...automationColumnFormData,
                        recurringDay: parseInt(e.target.value) || undefined,
                      })
                    }
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAutomationColumnDialogOpen(false);
                  setIsEditAutomationColumnMode(false);
                  setSelectedAutomationColumn(null);
                  resetAutomationColumnForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={isEditAutomationColumnMode ? handleEditAutomationColumn : handleCreateAutomationColumn}
                disabled={
                  (isEditAutomationColumnMode
                    ? updateAutomationColumn.isPending
                    : createAutomationColumn.isPending) || !automationColumnFormData.name
                }
              >
                {(isEditAutomationColumnMode
                  ? updateAutomationColumn.isPending
                  : createAutomationColumn.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditAutomationColumnMode ? 'Salvar Alterações' : 'Criar Coluna'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Template Dialog */}
        <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Template de Mensagem</DialogTitle>
              <DialogDescription>
                Crie um template reutilizável para suas mensagens
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="template-name">Nome do Template *</Label>
                <Input
                  id="template-name"
                  value={templateFormData.name}
                  onChange={(e) => setTemplateFormData({ ...templateFormData, name: e.target.value })}
                  placeholder="Ex: Boas-vindas"
                />
              </div>
              <div>
                <Label htmlFor="template-content">Conteúdo da Mensagem *</Label>
                <textarea
                  id="template-content"
                  value={templateFormData.content}
                  onChange={(e) => setTemplateFormData({ ...templateFormData, content: e.target.value })}
                  placeholder="Use {{nome}}, {{produto}}, etc. para variáveis"
                  className="w-full min-h-[100px] p-2 border rounded-md"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Variáveis disponíveis: {'{{nome}}'}, {'{{telefone}}'}, {'{{produto}}'}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateTemplate}
                disabled={createTemplate.isPending || !templateFormData.name || !templateFormData.content}
              >
                {createTemplate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminLeads;
