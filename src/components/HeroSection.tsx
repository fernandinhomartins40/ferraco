import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star, Award, Truck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  onLeadModalOpen: () => void;
}

const HeroSection = ({ onLeadModalOpen }: HeroSectionProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "Qualidade e Tradição em Aço",
      subtitle: "Mais de 25 anos fornecendo soluções metalúrgicas de excelência para todo o Brasil",
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
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <>
      {/* Hero Slider */}
      <section id="inicio" className="relative pt-20 lg:pt-24 min-h-screen flex items-center hero-gradient overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white">
            <div className="animate-fade-in-up">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                {slides[currentSlide].title}
              </h1>
              <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
                {slides[currentSlide].subtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={onLeadModalOpen}
                  size="lg"
                  variant="secondary"
                  className="text-lg font-semibold px-8 py-4 transition-smooth hover:scale-105 shadow-glow"
                >
                  {slides[currentSlide].cta}
                </Button>
                <Button 
                  onClick={onLeadModalOpen}
                  size="lg"
                  variant="outline"
                  className="text-lg font-semibold px-8 py-4 border-white text-white hover:bg-white hover:text-primary transition-smooth hover:scale-105"
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

      {/* Marquee Section */}
      <section className="bg-secondary py-4 overflow-hidden">
        <div className="marquee-container">
          <div className="marquee">
            <div className="flex items-center space-x-8 text-white font-bold text-lg">
              <span className="flex items-center space-x-2">
                <Star className="text-accent" fill="currentColor" />
                <span>Qualidade Garantida</span>
              </span>
              <span className="flex items-center space-x-2">
                <Truck className="text-accent" />
                <span>Entrega Rápida</span>
              </span>
              <span className="flex items-center space-x-2">
                <Award className="text-accent" />
                <span>25+ Anos de Experiência</span>
              </span>
              <span className="flex items-center space-x-2">
                <Users className="text-accent" />
                <span>Atendimento Especializado</span>
              </span>
              <span className="flex items-center space-x-2">
                <Star className="text-accent" fill="currentColor" />
                <span>Melhores Produtos</span>
              </span>
              <span className="flex items-center space-x-2">
                <Truck className="text-accent" />
                <span>Logística Nacional</span>
              </span>
              <span className="flex items-center space-x-2">
                <Award className="text-accent" />
                <span>Certificação ISO</span>
              </span>
              <span className="flex items-center space-x-2">
                <Users className="text-accent" />
                <span>Suporte Técnico</span>
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default HeroSection;