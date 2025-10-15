/**
 * LandingPagePreview - Preview em tempo real da landing page
 * Mostra apenas a seção sendo editada
 */

import { useState } from 'react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import MarqueeSection from '@/components/MarqueeSection';
import AboutSection from '@/components/AboutSection';
import ProductsSection from '@/components/ProductsSection';
import ExperienceSection from '@/components/ExperienceSection';
import ContactSection from '@/components/ContactSection';
import Footer from '@/components/Footer';
import LeadModal from '@/components/LeadModal';
import type { LandingPageConfig, SectionKey } from '@/types/landingPage';

interface LandingPagePreviewProps {
  config: LandingPageConfig;
  currentSection?: SectionKey;
  previewMode?: 'desktop' | 'tablet' | 'mobile';
}

export const LandingPagePreview = ({
  config,
  currentSection,
  previewMode = 'desktop',
}: LandingPagePreviewProps) => {
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

  const openLeadModal = () => setIsLeadModalOpen(true);
  const closeLeadModal = () => setIsLeadModalOpen(false);

  // Renderiza apenas a seção atual
  const renderCurrentSection = () => {
    if (!currentSection) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Selecione uma seção para visualizar
        </div>
      );
    }

    switch (currentSection) {
      case 'header':
        return config.header.enabled ? (
          <Header onLeadModalOpen={openLeadModal} config={config.header} />
        ) : (
          <div className="p-8 text-center text-muted-foreground">Seção Header desabilitada</div>
        );

      case 'hero':
        return config.hero.enabled ? (
          <HeroSection onLeadModalOpen={openLeadModal} config={config.hero} />
        ) : (
          <div className="p-8 text-center text-muted-foreground">Seção Hero desabilitada</div>
        );

      case 'marquee':
        return config.marquee ? (
          <MarqueeSection config={config.marquee} />
        ) : (
          <div className="p-8 text-center text-muted-foreground">Seção Marquee não configurada</div>
        );

      case 'about':
        return config.about.enabled ? (
          <AboutSection onLeadModalOpen={openLeadModal} config={config.about} />
        ) : (
          <div className="p-8 text-center text-muted-foreground">Seção About desabilitada</div>
        );

      case 'products':
        return config.products.enabled ? (
          <ProductsSection onLeadModalOpen={openLeadModal} config={config.products} />
        ) : (
          <div className="p-8 text-center text-muted-foreground">Seção Products desabilitada</div>
        );

      case 'experience':
        return config.experience.enabled ? (
          <ExperienceSection onLeadModalOpen={openLeadModal} config={config.experience} />
        ) : (
          <div className="p-8 text-center text-muted-foreground">Seção Experience desabilitada</div>
        );

      case 'contact':
        return config.contact.enabled ? (
          <ContactSection onLeadModalOpen={openLeadModal} config={config.contact} />
        ) : (
          <div className="p-8 text-center text-muted-foreground">Seção Contact desabilitada</div>
        );

      case 'footer':
        return config.footer.enabled ? (
          <Footer config={config.footer} />
        ) : (
          <div className="p-8 text-center text-muted-foreground">Seção Footer desabilitada</div>
        );

      default:
        return (
          <div className="p-8 text-center text-muted-foreground">
            Preview não disponível para esta seção
          </div>
        );
    }
  };

  // Escala baseada no modo de preview
  const getScale = () => {
    switch (previewMode) {
      case 'mobile':
        return 0.4; // 40% para mobile
      case 'tablet':
        return 0.6; // 60% para tablet
      case 'desktop':
      default:
        return 0.8; // 80% para desktop
    }
  };

  const scale = getScale();

  return (
    <div className="w-full overflow-hidden bg-background">
      {/* Container com escala */}
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          width: `${100 / scale}%`,
        }}
      >
        {renderCurrentSection()}
      </div>

      {/* Lead Modal */}
      <LeadModal isOpen={isLeadModalOpen} onClose={closeLeadModal} />
    </div>
  );
};
