import { useDrop } from 'react-dnd';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, Zap } from 'lucide-react';
import { SpecialSection as SpecialSectionType } from '@/utils/kanbanStorage';
import { ApiLead } from '@/types/api';
import LeadCard from './LeadCard';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SpecialSectionProps {
  section: SpecialSectionType;
  leads: ApiLead[];
  onMoveLead: (leadId: string, targetColumnId: string, targetOrder: number) => void;
  onLeadClick: (lead: ApiLead) => void;
  onAddTag: (leadId: string) => void;
}

const SpecialSection = ({
  section,
  leads,
  onMoveLead,
  onLeadClick,
  onAddTag
}: SpecialSectionProps) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'LEAD_CARD',
    drop: (item: { leadId: string; sourceColumnId: string }) => {
      if (item.sourceColumnId !== section.id) {
        onMoveLead(item.leadId, section.id, leads.length);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  });

  return (
    <div className="flex-shrink-0 w-80">
      <Card
        ref={drop}
        className={`border-2 transition-all ${
          isOver ? 'border-primary ring-2 ring-primary' : 'border-dashed'
        }`}
        style={{ borderColor: section.color }}
      >
        {/* Header com Gradiente */}
        <div
          className={`p-4 bg-gradient-to-r ${section.gradient} rounded-t-lg`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-3xl">{section.icon}</span>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-white">{section.name}</h3>
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    {leads.length}
                  </Badge>
                </div>
                <p className="text-xs text-white/90 mt-1">
                  {section.description}
                </p>
              </div>
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-white/80 hover:text-white cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <div className="space-y-2">
                    <p className="font-semibold">Funcionalidades Especiais:</p>
                    {section.type === 'recovery' && (
                      <ul className="text-sm space-y-1 list-disc list-inside">
                        <li>Envio automático de mensagens de reengajamento</li>
                        <li>Campanhas de recuperação programadas</li>
                        <li>Ofertas especiais para reativar interesse</li>
                      </ul>
                    )}
                    {section.type === 'future' && (
                      <ul className="text-sm space-y-1 list-disc list-inside">
                        <li>Agendamento de follow-ups futuros</li>
                        <li>Lembretes automáticos por data</li>
                        <li>Pipeline de vendas programadas</li>
                      </ul>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Badge de Automação */}
          <div className="mt-3 flex items-center space-x-2 text-white/90 text-xs">
            <Zap className="h-3 w-3" />
            <span>Automações ativas</span>
          </div>
        </div>

        {/* Content */}
        <div
          className={`p-3 space-y-2 overflow-y-auto bg-muted/10 ${
            isOver ? 'bg-primary/5' : ''
          }`}
          style={{ minHeight: '200px', maxHeight: '400px' }}
        >
          {leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <div className="text-4xl mb-2 opacity-20">{section.icon}</div>
              <p className="text-sm text-muted-foreground">
                Arraste leads para cá para ativar
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                automações especiais
              </p>
            </div>
          ) : (
            leads.map((lead, index) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                columnId={section.id}
                index={index}
                onMoveLead={onMoveLead}
                onAddTag={onAddTag}
                onClick={() => onLeadClick(lead)}
              />
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default SpecialSection;
