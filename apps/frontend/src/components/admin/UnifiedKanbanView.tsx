/**
 * UnifiedKanbanView - Kanban Unificado com Drag-and-Drop Entre Tipos
 *
 * Permite arrastar leads entre:
 * - Colunas de Status Normal (KanbanView)
 * - Colunas de Automação WhatsApp (AutomationKanbanView)
 */

import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Phone,
  Mail,
  Building,
  MoreVertical,
  Settings,
  Clock,
  Calendar,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Lead } from '@/services/leads.service';
import type { KanbanColumn } from '@/services/kanbanColumns.service';
import type { AutomationKanbanColumn, AutomationLeadPosition, AutomationSendStatus } from '@/services/automationKanban.service';

interface UnifiedKanbanViewProps {
  // Kanban Normal
  leads: Lead[];
  columns: KanbanColumn[];
  onUpdateLeadStatus: (leadId: string, newStatus: string) => Promise<void>;
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  onEditColumn?: (column: KanbanColumn) => void;
  onDeleteColumn?: (columnId: string) => void;

  // Kanban de Automação
  automationColumns: AutomationKanbanColumn[];
  leadsInAutomation: AutomationLeadPosition[];
  onMoveLeadToAutomationColumn: (leadId: string, columnId: string) => void;
  onRemoveLeadFromAutomation: (leadId: string) => void;
  onEditAutomationColumn?: (column: AutomationKanbanColumn) => void;
  onDeleteAutomationColumn?: (columnId: string) => void;
  onRetryLead?: (leadId: string) => void;
  onRetryColumn?: (columnId: string) => void;
}

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

const formatInterval = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}min`;
};

const getStatusConfig = (status: AutomationSendStatus) => {
  const configs = {
    PENDING: {
      label: 'Aguardando',
      color: 'bg-gray-500',
      icon: Clock,
      description: 'Aguardando envio'
    },
    SENDING: {
      label: 'Enviando',
      color: 'bg-blue-500',
      icon: Loader2,
      description: 'Enviando mensagem...'
    },
    SENT: {
      label: 'Enviado',
      color: 'bg-green-500',
      icon: CheckCircle2,
      description: 'Mensagem enviada com sucesso'
    },
    FAILED: {
      label: 'Falha',
      color: 'bg-red-500',
      icon: XCircle,
      description: 'Falha ao enviar mensagem'
    },
    WHATSAPP_DISCONNECTED: {
      label: 'WhatsApp Offline',
      color: 'bg-orange-500',
      icon: WifiOff,
      description: 'WhatsApp não conectado'
    },
    RATE_LIMITED: {
      label: 'Limite Atingido',
      color: 'bg-yellow-500',
      icon: Clock,
      description: 'Limite de envios atingido, aguardando próximo ciclo'
    },
    SCHEDULED: {
      label: 'Agendado',
      color: 'bg-purple-500',
      icon: Calendar,
      description: 'Agendado para data futura'
    },
  };
  return configs[status] || configs.PENDING;
};

const UnifiedKanbanView = ({
  leads,
  columns,
  onUpdateLeadStatus,
  onEditLead,
  onDeleteLead,
  onEditColumn,
  onDeleteColumn,
  automationColumns,
  leadsInAutomation,
  onMoveLeadToAutomationColumn,
  onRemoveLeadFromAutomation,
  onEditAutomationColumn,
  onDeleteAutomationColumn,
  onRetryLead,
  onRetryColumn,
}: UnifiedKanbanViewProps) => {

  // Função auxiliar: pegar leads por status (colunas normais)
  const getLeadsByStatus = (status: string) => {
    return leads.filter(lead => lead.status === status);
  };

  // Função auxiliar: pegar leads por coluna de automação
  const getLeadsByAutomationColumn = (columnId: string) => {
    return leadsInAutomation
      .filter(pos => pos.columnId === columnId)
      .map(pos => {
        const lead = leads.find(l => l.id === pos.leadId);
        return lead ? { ...lead, position: pos } : null;
      })
      .filter(Boolean);
  };

  // Handler unificado de drag-and-drop
  const handleDragEnd = async (result: DropResult) => {
    const { destination, draggableId } = result;

    if (!destination) return;

    const destinationId = destination.droppableId;
    const leadId = draggableId;

    // Verificar se é coluna de status normal ou coluna de automação
    const isAutomationColumn = destinationId.startsWith('automation-');
    const isNormalColumn = !isAutomationColumn;

    if (isAutomationColumn) {
      // Mover para coluna de automação
      const automationColumnId = destinationId.replace('automation-', '');
      onMoveLeadToAutomationColumn(leadId, automationColumnId);
    } else {
      // Mover para coluna de status normal
      const newStatus = destinationId;

      // Se estava em automação, remover primeiro
      const leadInAutomation = leadsInAutomation.find(pos => pos.leadId === leadId);
      if (leadInAutomation) {
        onRemoveLeadFromAutomation(leadId);
      }

      await onUpdateLeadStatus(leadId, newStatus);
    }
  };

  // Renderizar card de lead (unificado para ambos os tipos)
  const renderLeadCard = (
    lead: Lead,
    index: number,
    isAutomation: boolean = false,
    position?: AutomationLeadPosition
  ) => (
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
                    {isAutomation && (
                      <DropdownMenuItem
                        onClick={() => onRemoveLeadFromAutomation(lead.id)}
                        className="text-orange-600"
                      >
                        Remover da Automação
                      </DropdownMenuItem>
                    )}
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

              {/* Origem do Lead */}
              {lead.source && lead.source === 'IMPORT' && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 text-xs">
                  Lead Importado
                </Badge>
              )}

              {/* Informações de Automação (se aplicável) */}
              {isAutomation && position && (
                <div className="space-y-2 pt-2 border-t">
                  {/* Badge de Status */}
                  {position.status && (() => {
                    const statusConfig = getStatusConfig(position.status);
                    const StatusIcon = statusConfig.icon;
                    return (
                      <div className="flex items-center justify-between">
                        <Badge className={`${statusConfig.color} text-white text-xs flex items-center gap-1`}>
                          <StatusIcon className={`h-3 w-3 ${position.status === 'SENDING' ? 'animate-spin' : ''}`} />
                          {statusConfig.label}
                        </Badge>
                        {/* Botão de Retry para status com falha ou limite atingido */}
                        {(['FAILED', 'WHATSAPP_DISCONNECTED', 'RATE_LIMITED'] as const).includes(position.status) && onRetryLead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRetryLead(lead.id);
                            }}
                            title="Tentar enviar novamente"
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Reenviar
                          </Button>
                        )}
                      </div>
                    );
                  })()}

                  {/* Mensagem de erro */}
                  {position.lastError && (
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      <div className="flex items-start gap-1">
                        <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span>{position.lastError}</span>
                      </div>
                    </div>
                  )}

                  {/* Contador de mensagens */}
                  {position.messagesSentCount > 0 && (
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <MessageSquare className="h-3 w-3" />
                      <span>{position.messagesSentCount} enviadas</span>
                    </div>
                  )}

                  {/* Próximo agendamento */}
                  {position.nextScheduledAt && position.status !== 'SENT' && (
                    <div className="flex items-center gap-1 text-xs text-orange-600">
                      <Clock className="h-3 w-3" />
                      <span>
                        Próximo: {new Date(position.nextScheduledAt).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}
                </div>
              )}

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
              {((lead.score || lead.leadScore) && (lead.score || lead.leadScore) > 0) && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full"
                      style={{ width: `${lead.score || lead.leadScore}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {lead.score || lead.leadScore}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="w-full space-y-8">
        {/* Kanban de Status Normal */}
        <div className="px-6 overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {columns.map((column) => {
              const columnLeads = getLeadsByStatus(column.status);

              return (
                <div key={column.id} className="flex-shrink-0 w-80">
                  <Card
                    className="border-2"
                    style={{ borderColor: column.color, backgroundColor: `${column.color}20` }}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{column.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{columnLeads.length}</Badge>
                          {!column.isSystem && onEditColumn && onDeleteColumn && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEditColumn(column)}>
                                  Editar Coluna
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => onDeleteColumn(column.id)}
                                  className="text-red-600"
                                >
                                  Excluir Coluna
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
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
                            {columnLeads.map((lead, index) => renderLeadCard(lead, index, false))}
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
        </div>

        {/* Kanban de Automação WhatsApp */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {automationColumns.map((column) => {
              const columnLeads = getLeadsByAutomationColumn(column.id);

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
                          {onEditAutomationColumn && onDeleteAutomationColumn && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEditAutomationColumn(column)}>
                                  <Settings className="mr-2 h-4 w-4" />
                                  Configurar Coluna
                                </DropdownMenuItem>
                                {onRetryColumn && (
                                  <DropdownMenuItem
                                    onClick={() => onRetryColumn(column.id)}
                                    className="text-blue-600"
                                  >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Reenviar Falhados
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => onDeleteAutomationColumn(column.id)}
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
                        {column.messageTemplate && (
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-3 w-3" />
                            <span className="truncate">Template: {column.messageTemplate.name}</span>
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    <Droppable droppableId={`automation-${column.id}`}>
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
                            return renderLeadCard(lead, index, true, lead.position);
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
      </div>
    </DragDropContext>
  );
};

export default UnifiedKanbanView;
