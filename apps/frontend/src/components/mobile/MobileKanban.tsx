/**
 * MobileKanban - Kanban otimizado para mobile (Accordion vertical)
 *
 * Desktop: Horizontal drag-and-drop (UnifiedKanbanView)
 * Mobile: Accordion vertical com cards expandíveis
 *
 * Suporta:
 * - Colunas normais do Kanban (status de leads)
 * - Colunas de automação do WhatsApp
 */

import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Phone,
  Mail,
  Building,
  MoreVertical,
  ChevronRight,
  Bot,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import type { Lead } from '@/services/leads.service';
import type { KanbanColumn } from '@/services/kanbanColumns.service';
import { cn } from '@/lib/utils';

interface MobileKanbanProps {
  leads: Lead[];
  columns: KanbanColumn[];
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  onUpdateLeadStatus: (leadId: string, newStatus: string) => Promise<void>;
  // Automação WhatsApp (opcional)
  automationColumns?: any[];
  leadsInAutomation?: any[];
  onMoveLeadToAutomationColumn?: (leadId: string, columnId: string) => void;
  onRemoveLeadFromAutomation?: (leadId: string) => void;
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

export function MobileKanban({
  leads,
  columns,
  onEditLead,
  onDeleteLead,
  onUpdateLeadStatus,
  automationColumns = [],
  leadsInAutomation = [],
  onMoveLeadToAutomationColumn,
  onRemoveLeadFromAutomation,
}: MobileKanbanProps) {
  const [expandedColumn, setExpandedColumn] = useState<string | undefined>();

  const getLeadsByColumn = (columnStatus: string) => {
    return leads.filter((lead) => lead.status === columnStatus);
  };

  const getLeadsByAutomationColumn = (columnId: string) => {
    return leadsInAutomation.filter((item: any) => item.columnId === columnId);
  };

  return (
    <div className="space-y-4">
      {/* Colunas Normais do Kanban */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-2">
          Colunas de Status
        </h3>
        <Accordion
          type="single"
          collapsible
          value={expandedColumn}
          onValueChange={setExpandedColumn}
          className="space-y-2"
        >
          {columns.map((column) => {
            const columnLeads = getLeadsByColumn(column.status);

            return (
              <AccordionItem
                key={column.id}
                value={column.id}
                className="border rounded-lg bg-card"
              >
                <AccordionTrigger
                  className="px-4 py-3 hover:no-underline hover:bg-muted/50 rounded-t-lg"
                  style={{
                    borderLeft: `4px solid ${column.color}`,
                  }}
                >
                  <div className="flex items-center justify-between w-full pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{column.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {columnLeads.length}
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>

              <AccordionContent className="px-2 pb-2">
                {columnLeads.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Nenhum lead nesta coluna
                  </div>
                ) : (
                  <div className="space-y-2">
                    {columnLeads.map((lead) => (
                      <Card
                        key={lead.id}
                        className="bg-background hover:bg-muted/50 transition-colors"
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0 space-y-2">
                              {/* Nome */}
                              <div className="font-medium truncate">
                                {lead.name}
                              </div>

                              {/* Info compacta */}
                              <div className="space-y-1 text-xs text-muted-foreground">
                                {lead.phone && (
                                  <div className="flex items-center gap-1.5">
                                    <Phone className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{lead.phone}</span>
                                  </div>
                                )}
                                {lead.email && (
                                  <div className="flex items-center gap-1.5">
                                    <Mail className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{lead.email}</span>
                                  </div>
                                )}
                                {lead.company && (
                                  <div className="flex items-center gap-1.5">
                                    <Building className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{lead.company}</span>
                                  </div>
                                )}
                              </div>

                              {/* Badges */}
                              <div className="flex flex-wrap gap-1.5">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'text-[10px] px-1.5 py-0',
                                    getPriorityColor(lead.priority),
                                    'text-white border-0'
                                  )}
                                >
                                  {getPriorityLabel(lead.priority)}
                                </Badge>
                                {lead.source && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                    {lead.source}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 shrink-0"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEditLead(lead)}>
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    if (confirm('Deseja realmente excluir este lead?')) {
                                      onDeleteLead(lead.id);
                                    }
                                  }}
                                >
                                  Excluir
                                </DropdownMenuItem>

                                {/* Mover para outra coluna */}
                                <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                                  Mover para:
                                </DropdownMenuItem>
                                {columns
                                  .filter((col) => col.status !== lead.status)
                                  .map((col) => (
                                    <DropdownMenuItem
                                      key={col.id}
                                      onClick={() => onUpdateLeadStatus(lead.id, col.status)}
                                      className="pl-6"
                                    >
                                      <ChevronRight className="h-3 w-3 mr-1" />
                                      {col.name}
                                    </DropdownMenuItem>
                                  ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
      </div>

      {/* Colunas de Automação WhatsApp */}
      {automationColumns.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2 px-2">
            <Bot className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-muted-foreground">
              Automação WhatsApp
            </h3>
          </div>
          <Accordion
            type="single"
            collapsible
            className="space-y-2"
          >
            {automationColumns.map((column: any) => {
              const columnLeadsData = getLeadsByAutomationColumn(column.id);

              return (
                <AccordionItem
                  key={`automation-${column.id}`}
                  value={`automation-${column.id}`}
                  className="border rounded-lg bg-card"
                >
                  <AccordionTrigger
                    className="px-4 py-3 hover:no-underline hover:bg-muted/50 rounded-t-lg"
                    style={{
                      borderLeft: `4px solid ${column.color}`,
                    }}
                  >
                    <div className="flex items-center justify-between w-full pr-2">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{column.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {columnLeadsData.length}
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-2 pb-2">
                    {columnLeadsData.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        Nenhum lead nesta automação
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {columnLeadsData.map((item: any) => {
                          const lead = item.lead;
                          if (!lead) return null;

                          return (
                            <Card
                              key={`automation-lead-${lead.id}`}
                              className="bg-background hover:bg-muted/50 transition-colors"
                            >
                              <CardContent className="p-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0 space-y-2">
                                    {/* Nome */}
                                    <div className="font-medium truncate">
                                      {lead.name}
                                    </div>

                                    {/* Info compacta */}
                                    <div className="space-y-1 text-xs text-muted-foreground">
                                      {lead.phone && (
                                        <div className="flex items-center gap-1.5">
                                          <Phone className="h-3 w-3 shrink-0" />
                                          <span className="truncate">{lead.phone}</span>
                                        </div>
                                      )}
                                      {lead.email && (
                                        <div className="flex items-center gap-1.5">
                                          <Mail className="h-3 w-3 shrink-0" />
                                          <span className="truncate">{lead.email}</span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Status da Automação */}
                                    <div className="flex flex-wrap gap-1.5">
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] px-1.5 py-0 border-primary text-primary"
                                      >
                                        Em automação
                                      </Badge>
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 shrink-0"
                                      >
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      {onRemoveLeadFromAutomation && (
                                        <DropdownMenuItem
                                          className="text-destructive"
                                          onClick={() => {
                                            if (confirm('Deseja remover este lead da automação?')) {
                                              onRemoveLeadFromAutomation(lead.id);
                                            }
                                          }}
                                        >
                                          Remover da Automação
                                        </DropdownMenuItem>
                                      )}

                                      {onMoveLeadToAutomationColumn && automationColumns.length > 1 && (
                                        <>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                                            Mover para:
                                          </DropdownMenuItem>
                                          {automationColumns
                                            .filter((col: any) => col.id !== column.id)
                                            .map((col: any) => (
                                              <DropdownMenuItem
                                                key={col.id}
                                                onClick={() => onMoveLeadToAutomationColumn(lead.id, col.id)}
                                                className="pl-6"
                                              >
                                                <ChevronRight className="h-3 w-3 mr-1" />
                                                {col.name}
                                              </DropdownMenuItem>
                                            ))}
                                        </>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      )}
    </div>
  );
}
