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
  Loader2,
  CheckCircle,
  Settings2,
  Bot,
  Layers,
  Download,
  Upload,
} from 'lucide-react';
import { useLeads, useCreateLead, useUpdateLead, useDeleteLead } from '@/hooks/api/useLeads';
import type { Lead, CreateLeadData, UpdateLeadData } from '@/services/leads.service';
import UnifiedKanbanView from '@/components/admin/UnifiedKanbanView';
import { RecurrenceConfig } from '@/components/admin/RecurrenceConfig';
import { useToast } from '@/hooks/use-toast';
import { useKanbanColumns } from '@/hooks/useKanbanColumns';
import { useAutomationKanban } from '@/hooks/useAutomationKanban';
import { useWhatsAppTemplates } from '@/hooks/useWhatsAppTemplates';
import type { KanbanColumn, CreateKanbanColumnDto, UpdateKanbanColumnDto } from '@/services/kanbanColumns.service';
import { VariableInserter, DEFAULT_LEAD_VARIABLES, PRODUCT_VARIABLES } from '@/components/ui/variable-inserter';
import { useVariableInsertion } from '@/hooks/useVariableInsertion';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileKanban } from '@/components/mobile/MobileKanban';

const AdminLeads = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // State
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
    // ✅ NOVO: Sistema de Recorrência Avançado
    recurrenceType: 'NONE' as import('@/services/automationKanban.service').RecurrenceType,
    weekDays: undefined as string | undefined,
    monthDay: undefined as number | undefined,
    customDates: undefined as string | undefined,
    daysFromNow: undefined as number | undefined,
    // Campos antigos (manter para backward compatibility)
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

  // Import/Export State
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    errors: any[];
  } | null>(null);

  // Variable Insertion Hook
  const templateVariableInsertion = useVariableInsertion();

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
    retryLead,
    retryColumn,
    retryAllFailed,
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

  // Export/Import Handlers
  const handleExport = async (format: 'csv' | 'excel' | 'json') => {
    try {
      setIsExporting(true);

      // Get token from ferraco-auth-storage
      const authStorage = localStorage.getItem('ferraco-auth-storage');
      let token = '';

      if (authStorage) {
        try {
          const parsed = JSON.parse(authStorage);
          token = parsed.state?.token || '';
        } catch (error) {
          console.error('Erro ao ler token:', error);
        }
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/leads/export?format=${format}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao exportar leads');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads.${format === 'excel' ? 'xlsx' : format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Exportação concluída',
        description: 'Os leads foram exportados com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível exportar os leads.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      setIsImporting(true);

      // Get token from ferraco-auth-storage
      const authStorage = localStorage.getItem('ferraco-auth-storage');
      let token = '';

      if (authStorage) {
        try {
          const parsed = JSON.parse(authStorage);
          token = parsed.state?.token || '';
        } catch (error) {
          console.error('Erro ao ler token:', error);
        }
      }

      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/leads/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro ao importar leads');
      }

      const result = await response.json();
      setImportResult(result.data);

      toast({
        title: 'Importação concluída',
        description: `${result.data.success} leads importados com sucesso.`,
      });

      // Refresh leads list
      await leadsQuery.refetch();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível importar os leads.',
        variant: 'destructive',
      });
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
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
      // ✅ NOVO: Sistema de Recorrência Avançado
      recurrenceType: column.recurrenceType || 'NONE',
      weekDays: column.weekDays,
      monthDay: column.monthDay,
      customDates: column.customDates,
      daysFromNow: column.daysFromNow,
      // Campos antigos (backward compatibility)
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
      // ✅ NOVO: Sistema de Recorrência Avançado
      recurrenceType: 'NONE',
      weekDays: undefined,
      monthDay: undefined,
      customDates: undefined,
      daysFromNow: undefined,
      // Campos antigos (manter para backward compatibility)
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
        {/* Header - Mobile Responsivo */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Leads</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Gerencie seus leads do banco de dados PostgreSQL
            </p>
          </div>

          {/* Mobile: Grid 2x3 | Desktop: Flex horizontal */}
          <div className="grid grid-cols-2 gap-2 md:flex md:items-center md:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              className="min-h-[44px]"
              title="Exportar CSV"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 md:mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 md:mr-2" />
              )}
              <span className="hidden md:inline">Exportar CSV</span>
              <span className="md:hidden text-xs">CSV</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('excel')}
              disabled={isExporting}
              className="min-h-[44px]"
              title="Exportar Excel"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 md:mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 md:mr-2" />
              )}
              <span className="hidden md:inline">Exportar Excel</span>
              <span className="md:hidden text-xs">Excel</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImportDialogOpen(true)}
              className="min-h-[44px]"
              title="Importar Leads"
            >
              <Upload className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Importar Leads</span>
              <span className="md:hidden text-xs">Importar</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetColumnForm();
                setIsEditColumnMode(false);
                setIsColumnDialogOpen(true);
              }}
              className="min-h-[44px]"
              title="Gerenciar Colunas"
            >
              <Settings2 className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Gerenciar Colunas</span>
              <span className="md:hidden text-xs">Colunas</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetAutomationColumnForm();
                setIsEditAutomationColumnMode(false);
                setIsAutomationColumnDialogOpen(true);
              }}
              className="min-h-[44px] col-span-2 md:col-span-1"
              title="Nova Coluna de Automação"
            >
              <Bot className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Nova Coluna de Automação</span>
              <span className="md:hidden text-xs">Automação</span>
            </Button>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => resetForm()}
                  size="sm"
                  className="min-h-[44px] col-span-2 md:col-span-1"
                >
                  <Plus className="h-4 w-4 mr-2" />
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

        {/* Filtro de Status - Mobile Responsivo */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Label className="text-sm font-medium shrink-0">Filtrar por status:</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px] min-h-[44px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {columns.map((column) => (
                    <SelectItem key={column.id} value={column.status}>
                      {column.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Título do Kanban de Automação - Mobile Responsivo */}
        <div className="px-2 md:px-6 mt-8">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 md:h-6 md:w-6 text-primary shrink-0" />
            <h2 className="text-xl md:text-2xl font-bold">Automação de Mensagens WhatsApp</h2>
          </div>
          <p className="text-muted-foreground mt-1">
            Arraste leads entre colunas de status e automação para gerenciar o fluxo de vendas
          </p>
        </div>

        {/* Kanban Unificado - Full width */}
        <div className="-mx-6">
          {isLoading || isLoadingColumns || isLoadingAutomationColumns ? (
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
          ) : isMobile ? (
            <MobileKanban
              leads={leads}
              columns={columns}
              onEditLead={openEditDialog}
              onDeleteLead={(id) => {
                if (window.confirm('Tem certeza que deseja excluir este lead?')) {
                  deleteLead.mutate(id);
                }
              }}
              onUpdateLeadStatus={handleUpdateStatus}
            />
          ) : (
            <UnifiedKanbanView
              // Kanban Normal
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
              // Kanban de Automação
              automationColumns={automationColumns}
              leadsInAutomation={leadsInAutomation}
              onMoveLeadToAutomationColumn={(leadId, columnId) => {
                moveToAutomationColumn.mutate({ leadId, columnId });
              }}
              onRemoveLeadFromAutomation={removeLeadFromAutomation.mutate}
              onEditAutomationColumn={openEditAutomationColumnDialog}
              onDeleteAutomationColumn={handleDeleteAutomationColumn}
              onRetryLead={(leadId) => retryLead.mutate(leadId)}
              onRetryColumn={(columnId) => retryColumn.mutate(columnId)}
            />
          )}
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
                  value={automationColumnFormData.messageTemplateId || 'none'}
                  onValueChange={(value) =>
                    setAutomationColumnFormData({
                      ...automationColumnFormData,
                      messageTemplateId: value === 'none' ? '' : value
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
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

              {/* ✅ NOVO: Sistema de Recorrência Avançado */}
              <div className="border-t pt-4">
                <RecurrenceConfig
                  recurrenceType={automationColumnFormData.recurrenceType}
                  weekDays={automationColumnFormData.weekDays}
                  monthDay={automationColumnFormData.monthDay}
                  customDates={automationColumnFormData.customDates}
                  daysFromNow={automationColumnFormData.daysFromNow}
                  onChange={(config) =>
                    setAutomationColumnFormData({
                      ...automationColumnFormData,
                      ...config,
                    })
                  }
                />
              </div>
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
                  ref={templateVariableInsertion.textareaRef}
                  id="template-content"
                  value={templateFormData.content}
                  onChange={(e) => setTemplateFormData({ ...templateFormData, content: e.target.value })}
                  onBlur={templateVariableInsertion.handleBlur}
                  placeholder="Digite sua mensagem ou use os botões abaixo para inserir variáveis"
                  className="w-full min-h-[100px] p-2 border rounded-md"
                />

                <VariableInserter
                  variables={[...DEFAULT_LEAD_VARIABLES, ...PRODUCT_VARIABLES]}
                  onInsert={(variable) =>
                    templateVariableInsertion.insertVariable(
                      variable,
                      templateFormData.content,
                      (newValue) => setTemplateFormData({ ...templateFormData, content: newValue })
                    )
                  }
                  variant="buttons"
                  className="mt-2"
                />
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

        {/* Import Dialog */}
        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Importar Leads</DialogTitle>
              <DialogDescription>
                Faça upload de um arquivo CSV ou Excel com os leads para importação.
                Os leads importados serão marcados com origem "IMPORT".
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="file-upload">Arquivo CSV ou Excel *</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  disabled={isImporting}
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Arquivo selecionado: {selectedFile.name}
                  </p>
                )}
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Formato do arquivo:</strong><br />
                  O arquivo deve conter as colunas: Nome, Telefone (obrigatórios) e opcionalmente:
                  Email, Empresa, Cargo, Status, Prioridade, Origem
                </AlertDescription>
              </Alert>

              {importResult && (
                <Alert className={importResult.failed > 0 ? 'border-orange-200 bg-orange-50' : 'border-green-200 bg-green-50'}>
                  <AlertDescription>
                    <strong>Resultado da importação:</strong><br />
                    ✅ {importResult.success} leads importados com sucesso<br />
                    {importResult.failed > 0 && (
                      <>
                        ❌ {importResult.failed} leads falharam<br />
                        {importResult.errors.length > 0 && (
                          <details className="mt-2">
                            <summary className="cursor-pointer">Ver erros</summary>
                            <ul className="mt-2 text-xs">
                              {importResult.errors.slice(0, 5).map((error, idx) => (
                                <li key={idx}>
                                  {error.lead?.name || 'Lead sem nome'}: {error.error}
                                </li>
                              ))}
                              {importResult.errors.length > 5 && (
                                <li>... e mais {importResult.errors.length - 5} erros</li>
                              )}
                            </ul>
                          </details>
                        )}
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsImportDialogOpen(false);
                  setSelectedFile(null);
                  setImportResult(null);
                }}
              >
                {importResult ? 'Fechar' : 'Cancelar'}
              </Button>
              {!importResult && (
                <Button
                  onClick={handleImport}
                  disabled={isImporting || !selectedFile}
                >
                  {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Importar
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminLeads;
