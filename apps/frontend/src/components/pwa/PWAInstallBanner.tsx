/**
 * PWAInstallBanner - Banner para promover instalação do PWA
 * FASE 3 - PWA - Versão melhorada com detecção de plataforma e instruções iOS
 */

import { useState, useEffect } from 'react';
import { X, Download, Smartphone, Share, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePWAInstall } from '@/hooks/usePWAInstall';

// Detectar plataforma
const isIOS = () => {
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua);
};

const isAndroid = () => {
  const ua = window.navigator.userAgent.toLowerCase();
  return /android/.test(ua);
};

const isSafari = () => {
  const ua = window.navigator.userAgent.toLowerCase();
  return /safari/.test(ua) && !/chrome/.test(ua);
};

export function PWAInstallBanner() {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    if (isIOS()) {
      setPlatform('ios');
      console.log('[PWA Banner] Plataforma detectada: iOS');
    } else if (isAndroid()) {
      setPlatform('android');
      console.log('[PWA Banner] Plataforma detectada: Android');
    } else {
      setPlatform('desktop');
      console.log('[PWA Banner] Plataforma detectada: Desktop');
    }
  }, []);

  // Debug log
  useEffect(() => {
    console.log('[PWA Banner] Estado:', {
      platform,
      isInstalled,
      isInstallable,
      isDismissed,
      isSafari: isSafari(),
      isMobile: /iPhone|iPad|iPod|Android/i.test(window.navigator.userAgent),
      shouldShow: !isInstalled && !isDismissed && (
        (platform === 'ios' && isSafari()) ||
        (platform === 'android' && /iPhone|iPad|iPod|Android/i.test(window.navigator.userAgent)) ||
        (platform === 'desktop' && isInstallable)
      ),
    });
  }, [platform, isInstalled, isInstallable, isDismissed]);

  // Lógica de exibição:
  // - iOS Safari: Sempre mostrar (não precisa de beforeinstallprompt)
  // - Android/Desktop: Mostrar sempre no mobile, mesmo sem beforeinstallprompt
  const isMobile = /iPhone|iPad|iPod|Android/i.test(window.navigator.userAgent);

  const shouldShow = !isInstalled && !isDismissed && (
    // iOS Safari: sempre mostrar
    (platform === 'ios' && isSafari()) ||
    // Android: sempre mostrar no mobile (não depende de isInstallable)
    (platform === 'android' && isMobile) ||
    // Desktop: só mostrar se tiver o evento beforeinstallprompt
    (platform === 'desktop' && isInstallable)
  );

  if (!shouldShow) {
    return null;
  }

  const handleInstall = async () => {
    if (platform === 'ios') {
      // iOS: mostrar instruções
      setShowIOSInstructions(true);
    } else if (platform === 'android' && !isInstallable) {
      // Android sem beforeinstallprompt: mostrar instruções manuais
      setShowIOSInstructions(true); // Reutilizar o dialog com instruções
    } else {
      // Android/Desktop com beforeinstallprompt: usar prompt nativo
      const installed = await promptInstall();
      if (installed) {
        setIsDismissed(true);
      } else if (platform === 'android') {
        // Se falhar, mostrar instruções manuais
        setShowIOSInstructions(true);
      }
    }
  };

  return (
    <>
      <Alert className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 bg-primary text-primary-foreground border-primary shadow-2xl animate-in slide-in-from-bottom-4">
        <Smartphone className="h-5 w-5" />
        <AlertDescription className="flex items-center justify-between gap-3 ml-2">
          <div className="flex-1">
            <p className="font-semibold mb-1">
              {platform === 'ios' ? 'Adicionar à Tela Inicial' : 'Instalar Ferraco CRM'}
            </p>
            <p className="text-sm opacity-90">
              {platform === 'ios'
                ? 'Use como app para acesso rápido'
                : 'Instale o app para melhor experiência'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleInstall}
              className="whitespace-nowrap"
            >
              {platform === 'ios' ? (
                <>
                  <Share className="h-4 w-4 mr-2" />
                  Como instalar
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Instalar
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsDismissed(true)}
              className="h-8 w-8 p-0 hover:bg-primary-foreground/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      {/* Dialog com instruções de instalação */}
      <Dialog open={showIOSInstructions} onOpenChange={setShowIOSInstructions}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Instalar Ferraco CRM {platform === 'ios' ? 'no iOS' : 'no Android'}
            </DialogTitle>
            <DialogDescription>
              Siga os passos abaixo para adicionar o app à sua tela inicial
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {platform === 'ios' ? (
              // Instruções iOS
              <>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    1
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="font-medium mb-1">Abra o menu de compartilhamento</p>
                    <p className="text-sm text-muted-foreground">
                      Toque no ícone <Share className="inline h-4 w-4 mx-1" />
                      <span className="font-semibold">(Compartilhar)</span> na barra inferior do Safari
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    2
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="font-medium mb-1">Adicionar à Tela de Início</p>
                    <p className="text-sm text-muted-foreground">
                      Role para baixo e toque em
                      <span className="font-semibold"> "Adicionar à Tela de Início"</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    3
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="font-medium mb-1">Confirmar</p>
                    <p className="text-sm text-muted-foreground">
                      Toque em <span className="font-semibold">"Adicionar"</span> no canto superior direito
                    </p>
                  </div>
                </div>
              </>
            ) : (
              // Instruções Android
              <>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    1
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="font-medium mb-1">Abra o menu do Chrome</p>
                    <p className="text-sm text-muted-foreground">
                      Toque nos <MoreVertical className="inline h-4 w-4 mx-1" />
                      <span className="font-semibold">três pontos</span> no canto superior direito
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    2
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="font-medium mb-1">Instalar app</p>
                    <p className="text-sm text-muted-foreground">
                      Toque em
                      <span className="font-semibold"> "Instalar app"</span> ou
                      <span className="font-semibold"> "Adicionar à tela inicial"</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    3
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="font-medium mb-1">Confirmar</p>
                    <p className="text-sm text-muted-foreground">
                      Toque em <span className="font-semibold">"Instalar"</span> na janela que aparecer
                    </p>
                  </div>
                </div>
              </>
            )}

            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-sm text-blue-900">
                Após instalar, o app aparecerá na sua tela inicial e funcionará como um aplicativo nativo!
              </AlertDescription>
            </Alert>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowIOSInstructions(false)}>
              Fechar
            </Button>
            <Button onClick={() => {
              setShowIOSInstructions(false);
              setIsDismissed(true);
            }}>
              Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
