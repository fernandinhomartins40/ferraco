import { useDrag } from 'react-dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Mail, Calendar, GripVertical, Tag } from 'lucide-react';
import { ApiLead } from '@/types/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LeadCardProps {
  lead: ApiLead;
  columnId: string;
  index: number;
  onMoveLead: (leadId: string, targetColumnId: string, targetOrder: number) => void;
  onClick: () => void;
  onAddTag: (leadId: string) => void;
}

const LeadCard = ({ lead, columnId, index, onMoveLead, onClick, onAddTag }: LeadCardProps) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'LEAD_CARD',
    item: { leadId: lead.id, sourceColumnId: columnId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  const getSourceBadgeColor = (source: string) => {
    const colors: Record<string, string> = {
      website: 'bg-blue-100 text-blue-800',
      whatsapp: 'bg-green-100 text-green-800',
      instagram: 'bg-pink-100 text-pink-800',
      facebook: 'bg-blue-100 text-blue-800',
      email: 'bg-purple-100 text-purple-800'
    };
    return colors[source] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card
      ref={drag}
      className={`cursor-move hover:shadow-md transition-all ${
        isDragging ? 'opacity-50 rotate-2' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-3 space-y-2">
        {/* Drag Handle and Name */}
        <div className="flex items-start space-x-2">
          <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate">{lead.name}</h4>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-1 text-xs text-muted-foreground">
          {lead.phone && (
            <div className="flex items-center space-x-1">
              <Phone className="h-3 w-3" />
              <span className="truncate">{lead.phone}</span>
            </div>
          )}
          {lead.email && (
            <div className="flex items-center space-x-1">
              <Mail className="h-3 w-3" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
        </div>

        {/* Source and Date */}
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className={`text-xs ${getSourceBadgeColor(lead.source)}`}>
            {lead.source}
          </Badge>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(lead.createdAt), 'dd/MM', { locale: ptBR })}</span>
          </div>
        </div>

        {/* Tags and Add Tag Button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1 flex-1 min-w-0">
            {lead.tags && lead.tags.length > 0 ? (
              <>
                {lead.tags.slice(0, 2).map((leadTag) => (
                  <Badge key={leadTag.tagId} variant="outline" className="text-xs">
                    {leadTag.tag.name}
                  </Badge>
                ))}
                {lead.tags.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{lead.tags.length - 2}
                  </Badge>
                )}
              </>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onAddTag(lead.id);
            }}
            title="Adicionar tags"
          >
            <Tag className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeadCard;
