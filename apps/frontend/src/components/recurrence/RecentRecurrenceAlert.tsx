import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Repeat, Bell, X } from 'lucide-react';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RecentRecurrence {
  id: string;
  leadName: string;
  leadPhone: string;
  captureNumber: number;
  detectedAt: Date;
}

interface RecentRecurrenceAlertProps {
  recurrences: RecentRecurrence[];
  onDismiss?: (id: string) => void;
}

export function RecentRecurrenceAlert({ recurrences, onDismiss }: RecentRecurrenceAlertProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visibleRecurrences = recurrences.filter(r => !dismissed.has(r.id));

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set([...prev, id]));
    onDismiss?.(id);
  };

  if (visibleRecurrences.length === 0) return null;

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
            <Bell className="h-4 w-4 text-orange-600" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-orange-900">
                Leads Recorrentes Recentes
              </h4>
              <Badge variant="secondary" className="bg-orange-100">
                {visibleRecurrences.length} {visibleRecurrences.length === 1 ? 'novo' : 'novos'}
              </Badge>
            </div>
            <div className="space-y-2">
              {visibleRecurrences.slice(0, 3).map(recurrence => (
                <div
                  key={recurrence.id}
                  className="flex items-center justify-between p-2 rounded bg-white border border-orange-200"
                >
                  <div className="flex items-center gap-2">
                    <Repeat className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium text-orange-900">
                        {recurrence.leadName}
                      </p>
                      <p className="text-xs text-orange-700">
                        {recurrence.captureNumber}ª captura •{' '}
                        {formatDistanceToNow(recurrence.detectedAt, {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleDismiss(recurrence.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            {visibleRecurrences.length > 3 && (
              <p className="text-xs text-orange-700">
                + {visibleRecurrences.length - 3} leads recorrentes adicionais
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
