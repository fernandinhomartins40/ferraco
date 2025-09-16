import { useState } from 'react';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Lead, LeadStatus } from '@/types/lead';
import { leadStorage } from '@/utils/leadStorage';
import { useToast } from '@/hooks/use-toast';

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
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead>Atualizado em</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell className="font-medium">{lead.name}</TableCell>
              <TableCell>
                <a 
                  href={`tel:${lead.phone}`}
                  className="text-primary hover:underline"
                >
                  {formatPhone(lead.phone)}
                </a>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Badge variant={statusVariants[lead.status]}>
                    {statusLabels[lead.status]}
                  </Badge>
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
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(lead.createdAt)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(lead.updatedAt)}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default LeadTable;