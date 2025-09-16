import { useState } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ProductsSection from "@/components/ProductsSection";
import AboutSection from "@/components/AboutSection";
import ExperienceSection from "@/components/ExperienceSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import LeadModal from "@/components/LeadModal";

const Index = () => {
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

  const openLeadModal = () => setIsLeadModalOpen(true);
  const closeLeadModal = () => setIsLeadModalOpen(false);

  return (
    <div className="min-h-screen">
      <Header onLeadModalOpen={openLeadModal} />
      <HeroSection onLeadModalOpen={openLeadModal} />
      <AboutSection onLeadModalOpen={openLeadModal} />
      <ProductsSection onLeadModalOpen={openLeadModal} />
      <ExperienceSection onLeadModalOpen={openLeadModal} />
      <ContactSection onLeadModalOpen={openLeadModal} />
      <Footer />
      <LeadModal isOpen={isLeadModalOpen} onClose={closeLeadModal} />
    </div>
  );
};

export default Index;
