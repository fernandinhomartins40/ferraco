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
import api from "@/lib/apiClient";
import type { LandingPageConfig } from "@/types/landingPage";

const Index = () => {
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [config, setConfig] = useState<LandingPageConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar configuração do backend ao montar o componente
  useEffect(() => {
    console.log('🚀 [Index] Iniciando carregamento da config...');

    const fetchConfig = async () => {
      try {
        setIsLoading(true);
        console.log('🔄 [Index] Fazendo requisição para /landing-page/config...');

        const response = await api.get("/landing-page/config");
        const loadedConfig = response.data.data;

        console.log("✅ [Index] Landing Page Config loaded from backend:", loadedConfig);
        console.log("✅ [Index] Header config:", loadedConfig.header);
        console.log("✅ [Index] Menu items:", loadedConfig.header?.menu?.items);

        setConfig(loadedConfig);
      } catch (error: any) {
        console.error("❌ [Index] Error loading landing page config:", error);
        console.error("❌ [Index] Error details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        setError(error.response?.data?.message || "Erro ao carregar configuração");
      } finally {
        console.log('🏁 [Index] Carregamento finalizado. isLoading = false');
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const openLeadModal = () => setIsLeadModalOpen(true);
  const closeLeadModal = () => setIsLeadModalOpen(false);

  // Se config ainda está carregando, mostra loading
  if (isLoading) {
    console.log('⏳ [Index] Renderizando tela de loading...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando configuração...</p>
          <p className="text-xs text-muted-foreground mt-2">Se demorar muito, verifique se o backend está rodando</p>
        </div>
      </div>
    );
  }

  // Se houve erro, mostrar mensagem
  if (error || !config) {
    console.log('❌ [Index] Renderizando tela de erro. Error:', error, 'Config:', config);
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-destructive mb-4 text-6xl">❌</div>
          <h2 className="text-2xl font-bold mb-2">Erro ao carregar página</h2>
          <p className="text-muted-foreground mb-4">{error || "Configuração não encontrada"}</p>
          <p className="text-xs text-muted-foreground mb-4">
            Verifique se o backend está rodando em http://localhost:3000 (ou porta configurada)
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  console.log('✅ [Index] Renderizando página completa com Header!');

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
