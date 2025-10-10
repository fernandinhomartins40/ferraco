import { Loader2, Shield, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { securityLogger, SecurityEventType, SecurityLevel } from '@/utils/securityLogger';

interface LazyLoadingSpinnerProps {
  message?: string;
  showProgress?: boolean;
  route?: string;
}

const LazyLoadingSpinner: React.FC<LazyLoadingSpinnerProps> = ({
  message = "Carregando página...",
  showProgress = true,
  route
}) => {
  const { user } = useAuth();
  const [progress, setProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState("Inicializando...");

  useEffect(() => {
    if (route && user) {
      // Log do carregamento lazy da rota
      securityLogger.logEvent(
        SecurityEventType.USER_ACTION,
        SecurityLevel.LOW,
        'Carregamento lazy de rota iniciado',
        {
          route,
          userId: user.id,
          timestamp: new Date().toISOString()
        },
        user.id,
        user.username,
        user.role
      );
    }

    if (!showProgress) return;

    // Simular estágios de carregamento
    const stages = [
      { progress: 20, message: "Verificando permissões..." },
      { progress: 40, message: "Carregando componentes..." },
      { progress: 60, message: "Inicializando recursos..." },
      { progress: 80, message: "Preparando interface..." },
      { progress: 100, message: "Finalizando..." }
    ];

    let currentStage = 0;
    const interval = setInterval(() => {
      if (currentStage < stages.length) {
        const stage = stages[currentStage];
        setProgress(stage.progress);
        setLoadingStage(stage.message);
        currentStage++;
      } else {
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [showProgress, route, user]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Main Loading Card */}
        <Card className="shadow-lg border-border/50">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              {/* Loading Icon */}
              <div className="relative">
                <div className="w-16 h-16 mx-auto mb-4 relative">
                  <Loader2 className="w-16 h-16 animate-spin text-primary" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-primary/60" />
                  </div>
                </div>
              </div>

              {/* Main Message */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  {message}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {loadingStage}
                </p>
              </div>

              {/* Progress Bar */}
              {showProgress && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Carregando...</span>
                    <span>{progress}%</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Info */}
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  Carregamento Otimizado
                </p>
                <p className="text-blue-700 dark:text-blue-300 mt-1">
                  {route
                    ? `Carregando apenas os recursos necessários para ${route.replace('/admin/', '')}`
                    : "Otimizando o carregamento baseado em suas permissões"
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LazyLoadingSpinner;