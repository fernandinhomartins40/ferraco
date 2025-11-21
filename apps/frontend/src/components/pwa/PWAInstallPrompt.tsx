/**
 * PWAInstallPrompt - Componente moderno para instalação PWA
 * Usa @khmyznikov/pwa-install para experiência profissional
 * - Android: Instalação com 1 click via prompt nativo
 * - iOS: Instruções visuais ilustradas
 * - Suporta 28 idiomas (auto-detecção)
 */

import { useEffect, useRef } from 'react';
import '@khmyznikov/pwa-install';

// Declaração do tipo para TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'pwa-install': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          'manual-apple'?: string;
          'manual-chrome'?: string;
          'disable-chrome'?: string;
          'install-description'?: string;
          'disable-install-description'?: string;
          'manifest-url'?: string;
          name?: string;
          description?: string;
          icon?: string;
        },
        HTMLElement
      >;
    }
  }
}

export function PWAInstallPrompt() {
  const pwaInstallRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const pwaInstall = pwaInstallRef.current;
    if (!pwaInstall) return;

    // Listener para instalação bem-sucedida
    const handleSuccess = (e: Event) => {
      console.log('[PWA] Instalação bem-sucedida:', (e as CustomEvent).detail);
    };

    // Listener para falha na instalação
    const handleFail = (e: Event) => {
      console.log('[PWA] Falha na instalação:', (e as CustomEvent).detail);
    };

    // Listener para disponibilidade de instalação
    const handleAvailable = (e: Event) => {
      console.log('[PWA] Instalação disponível:', (e as CustomEvent).detail);
    };

    pwaInstall.addEventListener('pwa-install-success-event', handleSuccess);
    pwaInstall.addEventListener('pwa-install-fail-event', handleFail);
    pwaInstall.addEventListener('pwa-install-available-event', handleAvailable);

    return () => {
      pwaInstall.removeEventListener('pwa-install-success-event', handleSuccess);
      pwaInstall.removeEventListener('pwa-install-fail-event', handleFail);
      pwaInstall.removeEventListener('pwa-install-available-event', handleAvailable);
    };
  }, []);

  return (
    <pwa-install
      ref={pwaInstallRef as any}
      manual-apple="true"
      install-description="Instale o Painel Administrativo do Ferraco CRM para acesso rápido!"
      manifest-url="/manifest.webmanifest"
      name="Ferraco CRM - Painel Administrativo"
      description="Painel administrativo com gestão de leads e WhatsApp"
      icon="/pwa-512x512.png"
    />
  );
}
