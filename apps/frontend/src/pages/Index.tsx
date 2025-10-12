import { useState, useEffect } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import MarqueeSection from "@/components/MarqueeSection";
import ProductsSection from "@/components/ProductsSection";
import AboutSection from "@/components/AboutSection";
import ExperienceSection from "@/components/ExperienceSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import LeadModal from "@/components/LeadModal";
import { loadConfig } from "@/utils/landingPageStorage";
import type { LandingPageConfig } from "@/types/landingPage";

const Index = () => {
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [config, setConfig] = useState<LandingPageConfig | null>(null);

  // Carregar configuração do localStorage ao montar o componente
  useEffect(() => {
    try {
      const loadedConfig = loadConfig();
      setConfig(loadedConfig);
      console.log("✅ Landing Page Config loaded:", loadedConfig);
    } catch (error) {
      console.error("❌ Error loading landing page config:", error);
    }
  }, []);

  const openLeadModal = () => setIsLeadModalOpen(true);
  const closeLeadModal = () => setIsLeadModalOpen(false);

  // Se config ainda está carregando, mostra um loading ou conteúdo default
  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header onLeadModalOpen={openLeadModal} config={config.header} />
      <HeroSection onLeadModalOpen={openLeadModal} config={config.hero} />
      <MarqueeSection config={config.marquee} />
      <AboutSection onLeadModalOpen={openLeadModal} config={config.about} />
      <ProductsSection onLeadModalOpen={openLeadModal} config={config.products} />
      <ExperienceSection onLeadModalOpen={openLeadModal} config={config.experience} />
      <ContactSection onLeadModalOpen={openLeadModal} config={config.contact} />
      <Footer config={config.footer} />
      <LeadModal isOpen={isLeadModalOpen} onClose={closeLeadModal} />
    </div>
  );
};

export default Index;
