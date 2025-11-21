/**
 * MobileKanban - Adaptação do Kanban para mobile com Tabs
 * Mostra uma coluna por vez com navegação por tabs
 */

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Phone,
  Mail,
  Building,
  MoreVertical,
  ArrowRight,
  Zap,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Lead } from '@/services/leads.service';
import type { KanbanColumn } from '@/services/kanbanColumns.service';
import type { AutomationKanbanColumn } from '@/services/automationKanban.service';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MobileKanbanProps {
  leads: Lead[];
  columns: KanbanColumn[];
  onUpdateLeadStatus: (leadId: string, newStatus: string) => Promise<void>;
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  automationColumns?: AutomationKanbanColumn[];
  onMoveToAutomation?: (leadId: string, columnId: string) => void;
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

export const MobileKanban = ({
  leads,
  columns,
  onUpdateLeadStatus,
  onEditLead,
  onDeleteLead,
  automationColumns = [],
  onMoveToAutomation,
}: MobileKanbanProps) => {
  const [activeColumn, setActiveColumn] = useState(columns[0]?.id || '');
  const [selectedAutomationColumn, setSelectedAutomationColumn] = useState<Record<string, string>>({});

  const getLeadsByColumn = (columnId: string) => {
    const column = columns.find(c => c.id === columnId);
    if (!column) return [];
    return leads.filter(lead => lead.status === column.status);
  };

  const getNextColumn = (currentStatus: string) => {
    const currentIndex = columns.findIndex(c => c.status === currentStatus);
    if (currentIndex === -1 || currentIndex === columns.length - 1) return null;
    return columns[currentIndex + 1];
  };

  if (columns.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhuma coluna configurada</p>
      </div>
    );
  }

  return (
    <Tabs value={activeColumn} onValueChange={setActiveColumn} className="w-full">
      {/* Tabs List - Scrollable horizontally */}
      <TabsList className="w-full h-auto flex-wrap md:flex-nowrap justify-start overflow-x-auto mb-4">
        {columns.map((column) => {
          const columnLeads = getLeadsByColumn(column.id);
          return (
            <TabsTrigger
              key={column.id}
              value={column.id}
              className="flex-shrink-0 data-[state=active]:border-b-2"
              style={{ borderColor: column.color }}
            >
              <span>{column.name}</span>
              <Badge variant="secondary" className="ml-2">
                {columnLeads.length}
              </Badge>
            </TabsTrigger>
          );
        })}
      </TabsList>

      {/* Tab Contents */}
      {columns.map((column) => {
        const columnLeads = getLeadsByColumn(column.id);
        const nextColumn = getNextColumn(column.status);

        return (
          <TabsContent key={column.id} value={column.id} className="mt-0">
            <div className="space-y-3">
              {columnLeads.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Nenhum lead nesta coluna
                  </CardContent>
                </Card>
              ) : (
                columnLeads.map((lead) => (
                  <Card
                    key={lead.id}
                    className="active:scale-98 transition-transform touch-none"
                  >
                    <CardContent className="p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-base mb-1">{lead.name}</h3>
                          <Badge
                            className={cn(
                              'text-xs',
                              getPriorityColor(lead.priority),
                              'text-white'
                            )}
                          >
                            {getPriorityLabel(lead.priority)}
                          </Badge>
                        </div>

                        {/* Actions Dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 -mr-2"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEditLead(lead)}>
                              Editar
                            </DropdownMenuItem>
                            {nextColumn && (
                              <DropdownMenuItem
                                onClick={() => onUpdateLeadStatus(lead.id, nextColumn.status)}
                              >
                                Mover para {nextColumn.name}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => onDeleteLead(lead.id)}
                              className="text-destructive"
                            >
                              Deletar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4 flex-shrink-0" />
                          <a
                            href={`tel:${lead.phone}`}
                            className="hover:text-primary active:text-primary truncate"
                          >
                            {lead.phone}
                          </a>
                        </div>

                        {lead.email && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4 flex-shrink-0" />
                            <a
                              href={`mailto:${lead.email}`}
                              className="hover:text-primary active:text-primary truncate"
                            >
                              {lead.email}
                            </a>
                          </div>
                        )}

                        {lead.company && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Building className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{lead.company}</span>
                          </div>
                        )}
                      </div>

                      {/* Quick Action - Move to Next */}
                      {nextColumn && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-4"
                          onClick={() => onUpdateLeadStatus(lead.id, nextColumn.status)}
                        >
                          <span>Mover para {nextColumn.name}</span>
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}

                      {/* Automation Column Selector */}
                      {automationColumns.length > 0 && onMoveToAutomation && (
                        <div className="mt-3 pt-3 border-t">
                          <label className="text-xs font-medium text-muted-foreground mb-2 block flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            Adicionar à Automação
                          </label>
                          <div className="flex gap-2">
                            <Select
                              value={selectedAutomationColumn[lead.id] || ''}
                              onValueChange={(value) =>
                                setSelectedAutomationColumn(prev => ({ ...prev, [lead.id]: value }))
                              }
                            >
                              <SelectTrigger className="h-9 text-sm">
                                <SelectValue placeholder="Selecione a coluna" />
                              </SelectTrigger>
                              <SelectContent>
                                {automationColumns.map((autoCol) => (
                                  <SelectItem key={autoCol.id} value={autoCol.id}>
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: autoCol.color }}
                                      />
                                      <span>{autoCol.name}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              className="h-9 px-3"
                              disabled={!selectedAutomationColumn[lead.id]}
                              onClick={() => {
                                const columnId = selectedAutomationColumn[lead.id];
                                if (columnId) {
                                  onMoveToAutomation(lead.id, columnId);
                                  setSelectedAutomationColumn(prev => {
                                    const newState = { ...prev };
                                    delete newState[lead.id];
                                    return newState;
                                  });
                                }
                              }}
                            >
                              Adicionar
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
  );
};
