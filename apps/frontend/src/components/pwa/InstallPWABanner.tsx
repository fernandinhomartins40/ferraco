/**
 * InstallPWABanner - Banner inteligente para instalação PWA
 *
 * - Android/Chrome: Usa beforeinstallprompt com botão customizado
 * - iOS/Safari: Exibe instruções visuais para instalação manual
 * - Desktop: Detecta e sugere instalação quando disponível
 *
 * Features:
 * - Detecta plataforma automaticamente
 * - Dismissível com localStorage
 * - Aparece após 30s ou 2ª visita
 * - Responsivo mobile/desktop
 */

import { useState, useEffect } from 'react';
import { X, Download, Share, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const STORAGE_KEY = 'pwa-install-banner-dismissed';
const SHOW_DELAY = 30000; // 30 seconds

export function InstallPWABanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [platform, setPlatform] = useState<'android' | 'ios' | 'desktop' | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isInStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');

    setIsStandalone(isInStandalone);

    if (isInStandalone) return;

    // Check if user dismissed banner
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed === 'true') return;

    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isDesktop = !isIOS && !isAndroid;

    if (isIOS) {
      setPlatform('ios');
      // Show after delay (iOS doesn't have beforeinstallprompt)
      setTimeout(() => setShowBanner(true), SHOW_DELAY);
    } else if (isAndroid) {
      setPlatform('android');
    } else if (isDesktop) {
      setPlatform('desktop');
    }

    // Android/Desktop: Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), SHOW_DELAY);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('PWA installed');
    }

    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShowBanner(false);
  };

  if (!showBanner || isStandalone) return null;

  // Android/Desktop Banner (with install button)
  if ((platform === 'android' || platform === 'desktop') && deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in slide-in-from-bottom duration-300">
        <Alert className="border-primary bg-card shadow-lg backdrop-blur-sm">
          <Download className="h-5 w-5 text-primary" />
          <AlertDescription className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-foreground">Instalar Ferraco CRM</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Acesse mais rápido e receba notificações instalando o app
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleInstallClick}
                className="flex-1"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Instalar Agora
              </Button>
              <Button
                variant="outline"
                onClick={handleDismiss}
                size="sm"
              >
                Agora Não
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // iOS Banner (with manual instructions)
  if (platform === 'ios') {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in slide-in-from-bottom duration-300">
        <Alert className="border-primary bg-card shadow-lg backdrop-blur-sm">
          <Share className="h-5 w-5 text-primary" />
          <AlertDescription className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-foreground">Instalar Ferraco CRM no iOS</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Adicione à tela inicial para acesso rápido
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* iOS Instructions */}
            <div className="bg-background rounded-lg p-3 text-sm space-y-2 border border-border">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <p className="text-muted-foreground">
                  Toque no botão <Share className="inline h-4 w-4 mx-1" /> <strong>Compartilhar</strong> abaixo
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">2</span>
                </div>
                <p className="text-muted-foreground">
                  Selecione <Plus className="inline h-4 w-4 mx-1" /> <strong>"Adicionar à Tela Inicial"</strong>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">3</span>
                </div>
                <p className="text-muted-foreground">
                  Toque em <strong>"Adicionar"</strong> para confirmar
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleDismiss}
              size="sm"
              className="w-full"
            >
              Entendi
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return null;
}
