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
import WhatsAppFloatingButton from "@/components/WhatsAppFloatingButton";
import api from "@/lib/apiClient";
import type { LandingPageConfig } from "@/types/landingPage";

const Index = () => {
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ name?: string; id?: string }>({});
  const [customWhatsAppMessage, setCustomWhatsAppMessage] = useState<string | undefined>(undefined);
  const [config, setConfig] = useState<LandingPageConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar configuração do backend ao montar o componente
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setIsLoading(true);
        const response = await api.get("/landing-page/config");
        const loadedConfig = response.data.data;
        setConfig(loadedConfig);
      } catch (error: any) {
        console.error("Erro ao carregar configuração da landing page:", error);
        setError(error.response?.data?.message || "Erro ao carregar configuração");
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const openLeadModal = (productName?: string, productId?: string) => {
    setSelectedProduct({ name: productName, id: productId });
    setCustomWhatsAppMessage(undefined);
    setIsLeadModalOpen(true);
  };

  const openWhatsAppModal = () => {
    setSelectedProduct({});
    setCustomWhatsAppMessage("Olá! Me chamo [nome] e vim pelo site. Gostaria de mais informações");
    setIsLeadModalOpen(true);
  };

  const openQuoteModal = () => {
    setSelectedProduct({});
    setCustomWhatsAppMessage("Olá! Me chamo [nome] e gostaria de solicitar um orçamento");
    setIsLeadModalOpen(true);
  };

  const closeLeadModal = () => {
    setIsLeadModalOpen(false);
    setSelectedProduct({});
    setCustomWhatsAppMessage(undefined);
  };

  // Se config ainda está carregando, mostra loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se houve erro, mostrar mensagem
  if (error || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-destructive mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-2">Erro ao carregar página</h2>
          <p className="text-muted-foreground mb-4">{error || "Configuração não encontrada"}</p>
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

  return (
    <div className="min-h-screen">
      <Header onLeadModalOpen={() => openLeadModal()} config={config.header} />
      <HeroSection onLeadModalOpen={openLeadModal} config={config.hero} />
      <MarqueeSection config={config.marquee} />
      <ProductsSection onLeadModalOpen={openLeadModal} config={config.products} />
      <AboutSection onLeadModalOpen={openLeadModal} config={config.about} />
      <ExperienceSection onLeadModalOpen={openLeadModal} config={config.experience} />
      <ContactSection onLeadModalOpen={openLeadModal} config={config.contact} />
      <Footer config={config.footer} />

      {/* Botão flutuante do WhatsApp */}
      <WhatsAppFloatingButton onClick={openWhatsAppModal} />

      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={closeLeadModal}
        productName={selectedProduct.name}
        productId={selectedProduct.id}
        customWhatsAppMessage={customWhatsAppMessage}
      />
    </div>
  );
};

export default Index;
