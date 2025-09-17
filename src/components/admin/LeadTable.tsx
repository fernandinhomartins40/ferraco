import { useState } from 'react';
import { MoreHorizontal, Trash2, MessageSquare, Star, Phone, Tag, Eye, EyeOff } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Lead, LeadStatus } from '@/types/lead';
import { leadStorage } from '@/utils/leadStorage';
import { useToast } from '@/hooks/use-toast';
import LeadNotes from './LeadNotes';

interface LeadTableProps {
  leads: Lead[];
  onLeadsChange: () => void;
}

const statusLabels: Record<LeadStatus, string> = {
  novo: 'Novo',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
};

const statusVariants: Record<LeadStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  novo: 'default',
  em_andamento: 'secondary',
  concluido: 'outline',
};

const LeadTable = ({ leads, onLeadsChange }: LeadTableProps) => {
  const { toast } = useToast();
  const [updatingLeads, setUpdatingLeads] = useState<Set<string>>(new Set());
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [compactView, setCompactView] = useState(false);

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    setUpdatingLeads(prev => new Set(prev).add(leadId));
    
    try {
      const success = leadStorage.updateLeadStatus(leadId, newStatus);
      
      if (success) {
        onLeadsChange();
        toast({
          title: 'Status atualizado',
          description: `Status do lead alterado para ${statusLabels[newStatus].toLowerCase()}.`,
        });
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível atualizar o status do lead.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao atualizar o status.',
        variant: 'destructive'
      });
    } finally {
      setUpdatingLeads(prev => {
        const newSet = new Set(prev);
        newSet.delete(leadId);
        return newSet;
      });
    }
  };

  const handleDeleteLead = async (leadId: string, leadName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o lead "${leadName}"?`)) {
      return;
    }

    try {
      const success = leadStorage.deleteLead(leadId);
      
      if (success) {
        onLeadsChange();
        toast({
          title: 'Lead excluído',
          description: `Lead "${leadName}" foi excluído com sucesso.`,
        });
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível excluir o lead.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao excluir o lead.',
        variant: 'destructive'
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const openNotesDialog = (lead: Lead) => {
    setSelectedLead(lead);
    setShowNotesDialog(true);
  };

  const closeNotesDialog = () => {
    setShowNotesDialog(false);
    setSelectedLead(null);
  };

  if (leads.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground text-lg">Nenhum lead encontrado</div>
        <p className="text-muted-foreground text-sm mt-2">
          Os leads capturados aparecerão aqui
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Table Controls */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Exibindo {leads.length} leads
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCompactView(!compactView)}
            className="flex items-center space-x-2"
          >
            {compactView ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            <span>{compactView ? 'Visão Detalhada' : 'Visão Compacta'}</span>
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
                {!compactView && <TableHead>Criado em</TableHead>}
                {!compactView && <TableHead>Atualizado em</TableHead>}
                <TableHead>Notas</TableHead>
                {!compactView && <TableHead>Tags</TableHead>}
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => {
                const isOldLead = lead.status === 'novo' &&
                  new Date().getTime() - new Date(lead.createdAt).getTime() > 7 * 24 * 60 * 60 * 1000;

                return (
                  <TableRow
                    key={lead.id}
                    className={`transition-colors ${isOldLead ? 'bg-red-50 dark:bg-red-950/20' : ''}`}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <span>{lead.name}</span>
                        {isOldLead && (
                          <Badge variant="destructive" className="text-xs">
                            Antigo
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <a
                          href={`tel:${lead.phone}`}
                          className="text-primary hover:underline flex items-center space-x-1"
                        >
                          <Phone className="h-3 w-3" />
                          <span>{formatPhone(lead.phone)}</span>
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge variant={statusVariants[lead.status]}>
                          {statusLabels[lead.status]}
                        </Badge>
                        {!compactView && (
                          <Select
                            value={lead.status}
                            onValueChange={(value) => handleStatusChange(lead.id, value as LeadStatus)}
                            disabled={updatingLeads.has(lead.id)}
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="novo">Novo</SelectItem>
                              <SelectItem value="em_andamento">Em Andamento</SelectItem>
                              <SelectItem value="concluido">Concluído</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </TableCell>
                    {!compactView && (
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(lead.createdAt)}
                      </TableCell>
                    )}
                    {!compactView && (
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(lead.updatedAt)}
                      </TableCell>
                    )}
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openNotesDialog(lead)}
                        className="flex items-center space-x-1"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>{(lead.notes?.length || 0)}</span>
                        {lead.notes?.some(note => note.important) && (
                          <Star className="h-3 w-3 fill-current text-yellow-500" />
                        )}
                      </Button>
                    </TableCell>
                    {!compactView && (
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {lead.tags?.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              <Tag className="h-2 w-2 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                          {(lead.tags?.length || 0) > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{(lead.tags?.length || 0) - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openNotesDialog(lead)}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Ver Notas ({lead.notes?.length || 0})
                          </DropdownMenuItem>
                          {compactView && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(lead.id, 'novo')}
                                disabled={lead.status === 'novo'}
                              >
                                Status: Novo
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(lead.id, 'em_andamento')}
                                disabled={lead.status === 'em_andamento'}
                              >
                                Status: Em Andamento
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(lead.id, 'concluido')}
                                disabled={lead.status === 'concluido'}
                              >
                                Status: Concluído
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteLead(lead.id, lead.name)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Notes Dialog */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Notas - {selectedLead?.name}</span>
            </DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <LeadNotes
              lead={selectedLead}
              onLeadUpdate={() => {
                onLeadsChange();
                // Update selected lead
                const updatedLeads = leadStorage.getLeads();
                const updatedLead = updatedLeads.find(l => l.id === selectedLead.id);
                if (updatedLead) {
                  setSelectedLead(updatedLead);
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LeadTable;