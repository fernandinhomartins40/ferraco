/**
 * PullToRefresh - Componente visual para pull-to-refresh
 * FASE 4 - Mobile Gestures
 */

import { Loader2, RefreshCw } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  enabled?: boolean;
  threshold?: number;
}

export function PullToRefresh({ onRefresh, enabled = true, threshold = 80 }: PullToRefreshProps) {
  const { isPulling, isRefreshing, pullDistance, progress } = usePullToRefresh({
    onRefresh,
    threshold,
    enabled,
  });

  if (!isPulling && !isRefreshing) {
    return null;
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur transition-all duration-200"
      style={{
        height: `${Math.min(pullDistance, 80)}px`,
        opacity: Math.min(progress / 100, 1),
      }}
    >
      <div className="flex flex-col items-center gap-2">
        {isRefreshing ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Atualizando...</span>
          </>
        ) : (
          <>
            <RefreshCw
              className="h-6 w-6 text-primary transition-transform"
              style={{
                transform: `rotate(${progress * 3.6}deg)`,
              }}
            />
            <span className="text-xs text-muted-foreground">
              {progress >= 100 ? 'Solte para atualizar' : 'Puxe para atualizar'}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
