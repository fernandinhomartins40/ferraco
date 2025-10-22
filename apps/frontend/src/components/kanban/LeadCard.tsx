import { useDrag } from 'react-dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Mail, Calendar, GripVertical, Tag, RotateCcw, Loader2, Package } from 'lucide-react';
import { ApiLead } from '@/types/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  useLeadLastAutomation,
  useRetryAutomation,
  getAutomationStatusColor,
  getAutomationStatusLabel
} from '@/hooks/useWhatsAppAutomation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

interface LeadCardProps {
  lead: ApiLead;
  columnId: string;
  index: number;
  onMoveLead: (leadId: string, targetColumnId: string, targetOrder: number) => void;
  onClick: () => void;
  onAddTag: (leadId: string) => void;
}

const LeadCard = ({ lead, columnId, index, onMoveLead, onClick, onAddTag }: LeadCardProps) => {
  const { toast } = useToast();
  const [{ isDragging }, drag] = useDrag({
    type: 'LEAD_CARD',
    item: { leadId: lead.id, sourceColumnId: columnId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  // 🆕 Hook para buscar automação de produtos do lead
  const { automation, hasAutomation, isPending, isProcessing, isSent, isFailed, isLoading } =
    useLeadLastAutomation(lead.id);

  // 🆕 Mutation para retry
  const retryMutation = useRetryAutomation();

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

  // 🆕 Handler para retry
  const handleRetryAutomation = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!automation) return;

    try {
      await retryMutation.mutateAsync({
        id: automation.id,
        resetMessages: isFailed
      });

      toast({
        title: 'Sucesso',
        description: 'Automação reenviada para a fila de processamento',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível reenviar a automação',
        variant: 'destructive'
      });
    }
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

        {/* 🆕 BADGE DE AUTOMAÇÃO DE PRODUTOS (Independente do Kanban) */}
        {hasAutomation && automation && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-2 py-0.5 flex items-center gap-1 ${getAutomationStatusColor(automation.status)}`}
                    >
                      <Package className="h-3 w-3" />
                      {getAutomationStatusLabel(automation.status)}
                    </Badge>

                    {/* Botão de Retry (apenas para FAILED ou PENDING) */}
                    {(isFailed || isPending) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 flex-shrink-0"
                        onClick={handleRetryAutomation}
                        disabled={retryMutation.isPending}
                        title="Reenviar materiais"
                      >
                        {retryMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3 w-3" />
                        )}
                      </Button>
                    )}

                    {/* Indicador de Progresso (PROCESSING) */}
                    {isProcessing && (
                      <span className="text-[10px] text-blue-600">
                        {automation.messagesSent}/{automation.messagesTotal}
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div className="space-y-1 text-xs">
                    <p className="font-semibold">Envio de Materiais</p>
                    <p>
                      Produtos: {JSON.parse(automation.productsToSend || '[]').join(', ')}
                    </p>
                    <p>
                      Progresso: {automation.messagesSent}/{automation.messagesTotal} mensagens
                    </p>
                    {automation.error && (
                      <p className="text-red-600">Erro: {automation.error}</p>
                    )}
                    {automation.completedAt && (
                      <p className="text-green-600">
                        Concluído em {new Date(automation.completedAt).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LeadCard;
