/**
 * LandingPagePreview - Preview em tempo real da landing page
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
  highlightSection?: boolean;
}

export const LandingPagePreview = ({
  config,
  currentSection,
  highlightSection = true,
}: LandingPagePreviewProps) => {
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

  const openLeadModal = () => setIsLeadModalOpen(true);
  const closeLeadModal = () => setIsLeadModalOpen(false);

  // Função para adicionar destaque visual na seção atual
  const getSectionClassName = (section: SectionKey) => {
    if (!highlightSection || !currentSection) return '';
    return currentSection === section ? 'ring-4 ring-primary ring-opacity-50 relative' : 'opacity-60';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      {config.header.enabled && (
        <div className={getSectionClassName('header')}>
          <Header onLeadModalOpen={openLeadModal} config={config.header} />
        </div>
      )}

      {/* Hero */}
      {config.hero.enabled && (
        <div className={getSectionClassName('hero')}>
          <HeroSection onLeadModalOpen={openLeadModal} config={config.hero} />
        </div>
      )}

      {/* Marquee */}
      {config.marquee && (
        <div className={getSectionClassName('marquee')}>
          <MarqueeSection config={config.marquee} />
        </div>
      )}

      {/* About */}
      {config.about.enabled && (
        <div className={getSectionClassName('about')}>
          <AboutSection onLeadModalOpen={openLeadModal} config={config.about} />
        </div>
      )}

      {/* Products */}
      {config.products.enabled && (
        <div className={getSectionClassName('products')}>
          <ProductsSection onLeadModalOpen={openLeadModal} config={config.products} />
        </div>
      )}

      {/* Experience */}
      {config.experience.enabled && (
        <div className={getSectionClassName('experience')}>
          <ExperienceSection onLeadModalOpen={openLeadModal} config={config.experience} />
        </div>
      )}

      {/* Contact */}
      {config.contact.enabled && (
        <div className={getSectionClassName('contact')}>
          <ContactSection onLeadModalOpen={openLeadModal} config={config.contact} />
        </div>
      )}

      {/* Footer */}
      {config.footer.enabled && (
        <div className={getSectionClassName('footer')}>
          <Footer config={config.footer} />
        </div>
      )}

      {/* Lead Modal */}
      <LeadModal isOpen={isLeadModalOpen} onClose={closeLeadModal} />
    </div>
  );
};
