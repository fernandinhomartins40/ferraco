import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Repeat } from 'lucide-react';

interface RecurrenceNotificationProps {
  enabled?: boolean;
}

/**
 * Componente que monitora e notifica sobre leads recorrentes
 * Pode ser expandido para usar WebSockets/Server-Sent Events no futuro
 */
export function RecurrenceNotification({ enabled = true }: RecurrenceNotificationProps) {
  const { toast } = useToast();

  useEffect(() => {
    if (!enabled) return;

    // Simular notificação de lead recorrente (exemplo)
    // Em produção, isso viria de WebSocket ou polling
    const simulateRecurrenceDetection = () => {
      const mockRecurrentLeads = [
        { name: 'João Silva', captureNumber: 3, phone: '+5511999999999' },
        { name: 'Maria Santos', captureNumber: 2, phone: '+5511888888888' },
      ];

      // Notificar aleatoriamente (para demo)
      const randomLead = mockRecurrentLeads[Math.floor(Math.random() * mockRecurrentLeads.length)];

      toast({
        title: (
          <div className="flex items-center gap-2">
            <Repeat className="h-4 w-4" />
            Lead Recorrente Detectado!
          </div>
        ) as any,
        description: (
          <div className="space-y-1">
            <p className="font-semibold">{randomLead.name}</p>
            <p className="text-sm text-muted-foreground">
              {randomLead.captureNumber}ª captura • {randomLead.phone}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Mensagem personalizada será enviada automaticamente
            </p>
          </div>
        ) as any,
        duration: 5000,
      });
    };

    // Simular detecção a cada 2 minutos (apenas para demonstração)
    // Em produção, remover isso e usar eventos reais do backend
    const interval = setInterval(simulateRecurrenceDetection, 120000);

    return () => clearInterval(interval);
  }, [enabled, toast]);

  return null; // Componente invisível
}
