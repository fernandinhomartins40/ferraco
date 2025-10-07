import { useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { KanbanColumn as KanbanColumnType } from '@/utils/kanbanStorage';
import { ApiLead } from '@/types/api';
import LeadCard from './LeadCard';

interface KanbanColumnProps {
  column: KanbanColumnType;
  leads: ApiLead[];
  onEditColumn: (column: KanbanColumnType) => void;
  onDeleteColumn: (columnId: string) => void;
  onMoveLead: (leadId: string, targetColumnId: string, targetOrder: number) => void;
  onLeadClick: (lead: ApiLead) => void;
  onAddTag: (leadId: string) => void;
}

const KanbanColumn = ({
  column,
  leads,
  onEditColumn,
  onDeleteColumn,
  onMoveLead,
  onLeadClick,
  onAddTag
}: KanbanColumnProps) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'LEAD_CARD',
    drop: (item: { leadId: string; sourceColumnId: string }) => {
      if (item.sourceColumnId !== column.id) {
        onMoveLead(item.leadId, column.id, leads.length);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  });

  return (
    <div
      ref={drop}
      className="flex-shrink-0 w-80 flex flex-col max-h-full"
    >
      {/* Column Header */}
      <div
        className="p-3 rounded-t-lg flex items-center justify-between"
        style={{ backgroundColor: column.color }}
      >
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-white">{column.name}</h3>
          <Badge variant="secondary" className="bg-white/20 text-white">
            {leads.length}
          </Badge>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEditColumn(column)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar Coluna
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDeleteColumn(column.id)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Deletar Coluna
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Column Content */}
      <div
        className={`flex-1 p-3 bg-muted/30 rounded-b-lg space-y-2 overflow-y-auto ${
          isOver ? 'bg-primary/10 ring-2 ring-primary' : ''
        }`}
        style={{ minHeight: '400px' }}
      >
        {leads.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            Arraste leads para cá
          </div>
        ) : (
          leads.map((lead, index) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              columnId={column.id}
              index={index}
              onMoveLead={onMoveLead}
              onAddTag={onAddTag}
              onClick={() => onLeadClick(lead)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
