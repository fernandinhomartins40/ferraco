/**
 * OfflineIndicator - Indicador de status offline
 * FASE 3 - PWA
 */

import { WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <Alert className="fixed top-4 left-1/2 -translate-x-1/2 max-w-md z-50 bg-destructive text-destructive-foreground border-destructive shadow-lg">
      <WifiOff className="h-4 w-4" />
      <AlertDescription className="ml-2">
        <span className="font-semibold">Sem conexão</span>
        <span className="text-sm block mt-1">
          Alguns recursos podem estar limitados
        </span>
      </AlertDescription>
    </Alert>
  );
}
