/**
 * PWAInstallBanner - Banner para promover instalação do PWA
 * FASE 3 - PWA
 */

import { useState } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export function PWAInstallBanner() {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);

  // Não mostrar se já está instalado, não é instalável ou foi dispensado
  if (isInstalled || !isInstallable || isDismissed) {
    return null;
  }

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      setIsDismissed(true);
    }
  };

  return (
    <Alert className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 bg-primary text-primary-foreground border-primary shadow-2xl">
      <Smartphone className="h-5 w-5" />
      <AlertDescription className="flex items-center justify-between gap-3 ml-2">
        <div className="flex-1">
          <p className="font-semibold mb-1">Instalar Ferraco CRM</p>
          <p className="text-sm opacity-90">
            Use como app no seu dispositivo para acesso rápido
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleInstall}
            className="whitespace-nowrap"
          >
            <Download className="h-4 w-4 mr-2" />
            Instalar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsDismissed(true)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
