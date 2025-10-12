/**
 * KanbanView - Visualização Kanban para Leads com API PostgreSQL
 */

import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Mail, Building, MoreVertical, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Lead } from '@/services/leads.service';

interface KanbanColumn {
  id: string;
  title: string;
  status: Lead['status'];
  color: string;
}

interface KanbanViewProps {
  leads: Lead[];
  onUpdateLeadStatus: (leadId: string, newStatus: Lead['status']) => Promise<void>;
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'novo', title: 'Novos', status: 'NOVO', color: 'bg-blue-100 border-blue-300' },
  { id: 'qualificado', title: 'Qualificados', status: 'QUALIFICADO', color: 'bg-purple-100 border-purple-300' },
  { id: 'em_andamento', title: 'Em Andamento', status: 'EM_ANDAMENTO', color: 'bg-yellow-100 border-yellow-300' },
  { id: 'concluido', title: 'Concluídos', status: 'CONCLUIDO', color: 'bg-green-100 border-green-300' },
  { id: 'perdido', title: 'Perdidos', status: 'PERDIDO', color: 'bg-red-100 border-red-300' },
];

const getPriorityColor = (priority: Lead['priority']) => {
  const colors = {
    LOW: 'bg-gray-500',
    MEDIUM: 'bg-blue-500',
    HIGH: 'bg-orange-500',
    URGENT: 'bg-red-500',
  };
  return colors[priority] || 'bg-gray-500';
};

const getPriorityLabel = (priority: Lead['priority']) => {
  const labels = {
    LOW: 'Baixa',
    MEDIUM: 'Média',
    HIGH: 'Alta',
    URGENT: 'Urgente',
  };
  return labels[priority] || priority;
};

const KanbanView = ({ leads, onUpdateLeadStatus, onEditLead, onDeleteLead }: KanbanViewProps) => {
  const getLeadsByStatus = (status: Lead['status']) => {
    return leads.filter(lead => lead.status === status);
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, draggableId } = result;

    if (!destination) return;

    const newStatus = destination.droppableId as Lead['status'];
    const leadId = draggableId;

    // Atualizar status do lead
    await onUpdateLeadStatus(leadId, newStatus);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((column) => {
          const columnLeads = getLeadsByStatus(column.status);

          return (
            <div key={column.id} className="flex-shrink-0 w-80">
              <Card className={`${column.color} border-2`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>{column.title}</span>
                    <Badge variant="secondary" className="ml-2">
                      {columnLeads.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Droppable droppableId={column.status}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-3 min-h-[200px] p-2 rounded-lg transition-colors ${
                          snapshot.isDraggingOver ? 'bg-white/50' : ''
                        }`}
                      >
                        {columnLeads.map((lead, index) => (
                          <Draggable key={lead.id} draggableId={lead.id} index={index}>
                            {(provided, snapshot) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`cursor-move hover:shadow-lg transition-shadow ${
                                  snapshot.isDragging ? 'shadow-2xl rotate-2' : ''
                                }`}
                              >
                                <CardContent className="p-4">
                                  <div className="space-y-3">
                                    {/* Header com nome e menu */}
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <h4 className="font-semibold text-sm text-foreground line-clamp-1">
                                          {lead.name}
                                        </h4>
                                        {lead.company && (
                                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                            <Building className="w-3 h-3" />
                                            {lead.company}
                                          </p>
                                        )}
                                      </div>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                            <MoreVertical className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={() => onEditLead(lead)}>
                                            Editar
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() => onDeleteLead(lead.id)}
                                            className="text-red-600"
                                          >
                                            Excluir
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>

                                    {/* Contatos */}
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Phone className="w-3 h-3" />
                                        <span>{lead.phone}</span>
                                      </div>
                                      {lead.email && (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                          <Mail className="w-3 h-3" />
                                          <span className="truncate">{lead.email}</span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Footer com prioridade e source */}
                                    <div className="flex items-center justify-between pt-2 border-t">
                                      <Badge
                                        variant="secondary"
                                        className={`${getPriorityColor(lead.priority)} text-white text-xs`}
                                      >
                                        {getPriorityLabel(lead.priority)}
                                      </Badge>
                                      {lead.source && (
                                        <span className="text-xs text-muted-foreground">
                                          {lead.source}
                                        </span>
                                      )}
                                    </div>

                                    {/* Lead Score */}
                                    {lead.leadScore > 0 && (
                                      <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                          <div
                                            className="bg-blue-600 h-1.5 rounded-full"
                                            style={{ width: `${lead.leadScore}%` }}
                                          />
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                          {lead.leadScore}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};

export default KanbanView;
