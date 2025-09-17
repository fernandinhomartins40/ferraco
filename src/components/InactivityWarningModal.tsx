import { useEffect, useState } from 'react';
import { AlertTriangle, Clock, Shield, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface InactivityWarningModalProps {
  isOpen: boolean;
  timeRemaining: number; // in milliseconds
  totalWarningTime: number; // in milliseconds
  onExtendSession: () => void;
  onLogout: () => void;
  userName?: string;
}

const InactivityWarningModal: React.FC<InactivityWarningModalProps> = ({
  isOpen,
  timeRemaining,
  totalWarningTime,
  onExtendSession,
  onLogout,
  userName
}) => {
  const [progress, setProgress] = useState(100);

  // Update progress based on time remaining
  useEffect(() => {
    if (isOpen && totalWarningTime > 0) {
      const progressValue = (timeRemaining / totalWarningTime) * 100;
      setProgress(Math.max(0, progressValue));
    }
  }, [timeRemaining, totalWarningTime, isOpen]);

  // Format time remaining
  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleExtendSession = () => {
    onExtendSession();
  };

  const handleLogout = () => {
    onLogout();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <DialogHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <DialogTitle className="text-lg font-semibold">
            Sessão Expirando
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {userName ? `Olá ${userName}, ` : ''}sua sessão está prestes a expirar por inatividade.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Time Remaining Display */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center space-x-2">
              <Clock className="h-5 w-5 text-amber-600" />
              <span className="text-2xl font-mono font-bold text-amber-600">
                {formatTime(timeRemaining)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Tempo restante antes do logout automático
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Tempo restante</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress
              value={progress}
              className="h-2"
              indicatorClassName={
                progress > 50
                  ? 'bg-amber-500'
                  : progress > 25
                    ? 'bg-orange-500'
                    : 'bg-red-500'
              }
            />
          </div>

          {/* Warning Message */}
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
            <Shield className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <strong>Ação necessária:</strong> Clique em "Continuar Trabalhando" para manter sua sessão ativa ou salve seu trabalho antes do logout automático.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleExtendSession}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Continuar Trabalhando
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
            >
              Fazer Logout Agora
            </Button>
          </div>

          {/* Additional Info */}
          <div className="text-xs text-center text-muted-foreground space-y-1">
            <p>Por segurança, você será desconectado automaticamente.</p>
            <p>Certifique-se de salvar seu trabalho antes do logout.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InactivityWarningModal;