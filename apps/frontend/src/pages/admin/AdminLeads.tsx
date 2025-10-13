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
} from 'lucide-react';
import { useLeads, useCreateLead, useUpdateLead, useDeleteLead } from '@/hooks/api/useLeads';
import type { Lead, CreateLeadData, UpdateLeadData } from '@/services/leads.service';
import KanbanView from '@/components/admin/KanbanView';
import { useToast } from '@/hooks/use-toast';

const AdminLeads = () => {
  const { toast } = useToast();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

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

  const handleUpdateStatus = async (leadId: string, newStatus: Lead['status']) => {
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
          {isLoading ? (
            <div className="flex items-center justify-center py-12 px-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : leads.length === 0 ? (
            <div className="px-6">
              <Card>
                <CardContent className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nenhum lead encontrado</p>
                  <p className="text-sm">Crie seu primeiro lead para começar</p>
                  <Button
                    className="mt-4"
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Primeiro Lead
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <KanbanView
              leads={leads}
              onUpdateLeadStatus={handleUpdateStatus}
              onEditLead={openEditDialog}
              onDeleteLead={(id) => {
                if (window.confirm('Tem certeza que deseja excluir este lead?')) {
                  deleteLead.mutate(id);
                }
              }}
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
      </div>
      </div>
    </AdminLayout>
  );
};

export default AdminLeads;
