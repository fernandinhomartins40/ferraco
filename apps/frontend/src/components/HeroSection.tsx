import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HeroConfig } from "@/types/landingPage";

interface HeroSectionProps {
  onLeadModalOpen: () => void;
  config?: HeroConfig;
}

const HeroSection = ({ onLeadModalOpen, config }: HeroSectionProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Background image do config
  const backgroundImage = config?.background?.type === 'image' && config?.background?.image?.url
    ? config.background.image.url
    : null;

  const backgroundStyle = backgroundImage
    ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};

  // Fallback para valores padrão do conteúdo atual
  const slides = config?.slides || [
    {
      title: "Equipamentos para Pecuária Leiteira",
      subtitle: "Há mais de 25 anos fornecendo soluções de alta qualidade para fazendas em todo o Brasil",
      cta: "Conhecer Produtos"
    },
    {
      title: "Tecnologia de Ponta",
      subtitle: "Equipamentos modernos e processos inovadores para garantir a melhor qualidade",
      cta: "Ver Diferenciais"
    },
    {
      title: "Atendimento Especializado",
      subtitle: "Equipe técnica qualificada para atender suas necessidades específicas",
      cta: "Falar com Especialista"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <section
      id="inicio"
      className={`relative pt-20 lg:pt-24 h-[60vh] md:h-[65vh] lg:h-[70vh] flex items-center overflow-hidden ${!backgroundImage ? 'hero-gradient' : ''}`}
      style={backgroundStyle}
    >
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center text-white">
          <div className="animate-fade-in-up">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight">
              {slides[currentSlide].title}
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl mb-6 md:mb-8 opacity-90 max-w-3xl mx-auto">
              {slides[currentSlide].subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
              <Button
                onClick={onLeadModalOpen}
                size="lg"
                variant="secondary"
                className="text-base md:text-lg font-semibold px-6 md:px-8 py-3 md:py-4 transition-smooth hover:scale-105 shadow-glow"
              >
                {slides[currentSlide].cta}
              </Button>
              <Button
                onClick={onLeadModalOpen}
                size="lg"
                variant="outline"
                className="text-base md:text-lg font-semibold px-6 md:px-8 py-3 md:py-4 border-white text-white hover:bg-white hover:text-primary transition-smooth hover:scale-105"
              >
                Solicitar Orçamento
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 z-20"
        onClick={prevSlide}
      >
        <ChevronLeft size={32} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 z-20"
        onClick={nextSlide}
      >
        <ChevronRight size={32} />
      </Button>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-smooth ${
              index === currentSlide ? 'bg-secondary' : 'bg-white/50'
            }`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;