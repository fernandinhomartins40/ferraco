/**
 * AutomationKanbanView - Kanban de Automação de Mensagens WhatsApp
 */

import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Mail, MoreVertical, Settings, Clock, Calendar, MessageSquare } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Lead } from '@/services/leads.service';
import type { AutomationKanbanColumn, AutomationLeadPosition } from '@/services/automationKanban.service';

interface AutomationKanbanViewProps {
  columns: AutomationKanbanColumn[];
  leadsPositions: AutomationLeadPosition[];
  availableLeads: Lead[];
  onMoveLeadToColumn: (leadId: string, columnId: string) => void;
  onRemoveLeadFromAutomation: (leadId: string) => void;
  onEditColumn?: (column: AutomationKanbanColumn) => void;
  onDeleteColumn?: (columnId: string) => void;
}

const AutomationKanbanView = ({
  columns,
  leadsPositions,
  availableLeads,
  onMoveLeadToColumn,
  onRemoveLeadFromAutomation,
  onEditColumn,
  onDeleteColumn,
}: AutomationKanbanViewProps) => {
  const getLeadsByColumn = (columnId: string) => {
    return leadsPositions
      .filter(pos => pos.columnId === columnId)
      .map(pos => {
        const lead = availableLeads.find(l => l.id === pos.leadId);
        return lead ? { ...lead, position: pos } : null;
      })
      .filter(Boolean);
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, draggableId } = result;

    if (!destination) return;

    const columnId = destination.droppableId;
    const leadId = draggableId;

    onMoveLeadToColumn(leadId, columnId);
  };

  const formatInterval = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}min`;
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="w-full overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {columns.map((column) => {
            const columnLeads = getLeadsByColumn(column.id);

            return (
              <div key={column.id} className="flex-shrink-0 w-80">
                <Card
                  className="border-2"
                  style={{
                    borderColor: column.color,
                    backgroundColor: `${column.color}15`,
                  }}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span className="truncate">{column.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{columnLeads.length}</Badge>
                        {onEditColumn && onDeleteColumn && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onEditColumn(column)}>
                                <Settings className="mr-2 h-4 w-4" />
                                Configurar Coluna
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onDeleteColumn(column.id)}
                                className="text-red-600"
                              >
                                Remover Coluna
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </CardTitle>

                    {/* Informações da Coluna */}
                    <div className="space-y-1 text-xs text-muted-foreground mt-2">
                      {column.description && (
                        <p className="truncate">{column.description}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>Intervalo: {formatInterval(column.sendIntervalSeconds)}</span>
                      </div>
                      {column.scheduledDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Agendado: {new Date(column.scheduledDate).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      )}
                      {column.isRecurring && column.recurringDay && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          <span>Recorrente: Dia {column.recurringDay}</span>
                        </div>
                      )}
                      {(column.templateLibrary || column.messageTemplate) && (
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-3 w-3" />
                          <span className="truncate">
                            Template: {column.templateLibrary?.name || column.messageTemplate?.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <CardContent
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-2 min-h-[200px] ${
                          snapshot.isDraggingOver ? 'bg-accent/50' : ''
                        }`}
                      >
                        {columnLeads.map((item: any, index: number) => {
                          if (!item) return null;
                          const lead = item as Lead & { position: AutomationLeadPosition };

                          return (
                            <Draggable key={lead.id} draggableId={lead.id} index={index}>
                              {(provided, snapshot) => (
                                <Card
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`cursor-move hover:shadow-md transition-shadow ${
                                    snapshot.isDragging ? 'shadow-lg rotate-2' : ''
                                  }`}
                                >
                                  <CardContent className="p-3">
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-sm truncate">
                                          {lead.name}
                                        </h4>
                                        {lead.company && (
                                          <p className="text-xs text-muted-foreground truncate">
                                            {lead.company}
                                          </p>
                                        )}
                                      </div>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                            <MoreVertical className="h-3 w-3" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem
                                            onClick={() => onRemoveLeadFromAutomation(lead.id)}
                                            className="text-red-600"
                                          >
                                            Remover da Automação
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>

                                    <div className="space-y-1">
                                      {lead.phone && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                          <Phone className="h-3 w-3" />
                                          <span className="truncate">{lead.phone}</span>
                                        </div>
                                      )}
                                      {lead.email && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                          <Mail className="h-3 w-3" />
                                          <span className="truncate">{lead.email}</span>
                                        </div>
                                      )}
                                      {lead.position?.messagesSentCount > 0 && (
                                        <div className="flex items-center gap-1 text-xs">
                                          <MessageSquare className="h-3 w-3 text-green-600" />
                                          <span>{lead.position.messagesSentCount} enviadas</span>
                                        </div>
                                      )}
                                      {lead.position?.nextScheduledAt && (
                                        <div className="flex items-center gap-1 text-xs text-orange-600">
                                          <Clock className="h-3 w-3" />
                                          <span>
                                            Próximo:{' '}
                                            {new Date(lead.position.nextScheduledAt).toLocaleString(
                                              'pt-BR'
                                            )}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </CardContent>
                    )}
                  </Droppable>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </DragDropContext>
  );
};

export default AutomationKanbanView;
