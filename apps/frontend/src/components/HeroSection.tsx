import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HeroConfig, HeroSlide } from "@/types/landingPage";
import * as LucideIcons from 'lucide-react';

interface HeroSectionProps {
  onLeadModalOpen: () => void;
  config?: HeroConfig;
}

const HeroSection = ({ onLeadModalOpen, config }: HeroSectionProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Renderizar ícone dinamicamente
  const renderIcon = (iconName?: string) => {
    if (!iconName) return null;
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent ? <IconComponent className="w-5 h-5" /> : null;
  };

  // Slides padrão caso não tenha config
  const defaultSlides: HeroSlide[] = [
    {
      id: '1',
      title: {
        text: 'Equipamentos para Pecuária Leiteira',
        style: { fontSize: '3rem', fontWeight: '700', textColor: '#ffffff' },
      },
      subtitle: {
        text: 'Há mais de 25 anos fornecendo soluções de alta qualidade',
        style: { fontSize: '1.5rem', fontWeight: '500', textColor: '#ffffff' },
      },
      description: {
        text: 'Especialistas em equipamentos para pecuária leiteira',
        style: { fontSize: '1.125rem', textColor: '#ffffff' },
      },
      buttons: {
        primary: { text: 'Conhecer Produtos', href: '#produtos', variant: 'primary' },
        secondary: { text: 'Solicitar Orçamento', href: '#contato', variant: 'outline' },
        alignment: 'center',
      },
      background: {
        type: 'gradient',
        gradient: { from: '#667eea', to: '#764ba2', direction: 'to right' },
        overlay: { enabled: true, color: '#000000', opacity: 40 },
      },
    },
  ];

  const slides = config?.slides && config.slides.length > 0 ? config.slides : defaultSlides;
  const autoPlay = config?.autoPlay !== false;
  const autoPlayInterval = (config?.autoPlayInterval || 5) * 1000;
  const showNavigation = config?.showNavigation !== false;
  const showIndicators = config?.showIndicators !== false;

  // Auto-play
  useEffect(() => {
    if (!autoPlay || slides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [autoPlay, autoPlayInterval, slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const activeSlide = slides[currentSlide];

  // Background do slide ativo
  const getBackgroundStyle = (slide: HeroSlide): React.CSSProperties => {
    const bg = slide.background;

    if (bg.type === 'image' && bg.image?.url) {
      return {
        backgroundImage: `url(${bg.image.url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }

    if (bg.type === 'color' && bg.color) {
      return { backgroundColor: bg.color };
    }

    if (bg.type === 'gradient' && bg.gradient) {
      return {
        background: `linear-gradient(${bg.gradient.direction}, ${bg.gradient.from}, ${bg.gradient.to})`,
      };
    }

    return {};
  };

  const backgroundStyle = getBackgroundStyle(activeSlide);

  const overlayStyle: React.CSSProperties = activeSlide.background.overlay?.enabled
    ? {
        backgroundColor: activeSlide.background.overlay.color,
        opacity: activeSlide.background.overlay.opacity / 100,
      }
    : {};

  // Altura
  const height = config?.height || '70vh';
  const heightClass = height === 'screen' ? 'h-screen' : height === 'auto' ? 'min-h-[60vh]' : '';
  const heightStyle = !heightClass && height !== 'auto' && height !== 'screen' ? { height } : {};

  // Alinhamento dos botões
  const alignmentClass =
    activeSlide.buttons.alignment === 'left'
      ? 'justify-start'
      : activeSlide.buttons.alignment === 'right'
      ? 'justify-end'
      : 'justify-center';

  // Função para lidar com cliques nos botões
  const handleButtonClick = (href?: string) => {
    if (href?.startsWith('#')) {
      const element = document.querySelector(href);
      element?.scrollIntoView({ behavior: 'smooth' });
    } else {
      onLeadModalOpen();
    }
  };

  return (
    <section
      id="inicio"
      className={`relative pt-20 lg:pt-24 flex items-center overflow-hidden transition-all duration-500 ${heightClass}`}
      style={{ ...backgroundStyle, ...heightStyle }}
    >
      {/* Overlay */}
      {activeSlide.background.overlay?.enabled && (
        <div className="absolute inset-0 transition-opacity duration-500" style={overlayStyle}></div>
      )}

      <div className="container mx-auto px-4 relative z-10">
        <div
          className={`max-w-4xl ${
            config?.layout === 'centered' ? 'mx-auto text-center' : ''
          } text-white`}
        >
          <div className="animate-fade-in-up">
            {/* Título */}
            <h1
              className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight transition-all duration-500"
              style={{
                fontSize: activeSlide.title.style.fontSize,
                fontWeight: activeSlide.title.style.fontWeight,
                color: activeSlide.title.style.textColor,
              }}
            >
              {activeSlide.title.highlight ? (
                <>
                  {activeSlide.title.text.replace(activeSlide.title.highlight, '')}
                  <span className="text-secondary">{activeSlide.title.highlight}</span>
                </>
              ) : (
                activeSlide.title.text
              )}
            </h1>

            {/* Subtítulo */}
            <p
              className="text-lg md:text-xl lg:text-2xl mb-4 opacity-90 max-w-3xl transition-all duration-500"
              style={{
                fontSize: activeSlide.subtitle.style.fontSize,
                fontWeight: activeSlide.subtitle.style.fontWeight,
                color: activeSlide.subtitle.style.textColor,
              }}
            >
              {activeSlide.subtitle.text}
            </p>

            {/* Descrição */}
            {activeSlide.description.text && (
              <p
                className="text-base md:text-lg mb-6 md:mb-8 opacity-80 max-w-2xl transition-all duration-500"
                style={{
                  fontSize: activeSlide.description.style.fontSize,
                  color: activeSlide.description.style.textColor,
                }}
              >
                {activeSlide.description.text}
              </p>
            )}

            {/* Botões */}
            <div className={`flex flex-col sm:flex-row gap-3 md:gap-4 ${alignmentClass}`}>
              {activeSlide.buttons.primary && (
                <Button
                  onClick={() => handleButtonClick(activeSlide.buttons.primary?.href)}
                  size="lg"
                  variant="secondary"
                  className="text-base md:text-lg font-semibold px-6 md:px-8 py-3 md:py-4 transition-all duration-300 hover:scale-105 shadow-lg"
                  style={{
                    backgroundColor: activeSlide.buttons.primary.style?.backgroundColor || '#10b981',
                    color: activeSlide.buttons.primary.style?.textColor || '#ffffff',
                    border: activeSlide.buttons.primary.style?.border,
                    ...(activeSlide.buttons.primary.style || {}),
                  }}
                  onMouseEnter={(e) => {
                    if (activeSlide.buttons.primary?.style?.hover) {
                      const target = e.currentTarget;
                      const hover = activeSlide.buttons.primary.style.hover;
                      if (hover.backgroundColor) target.style.backgroundColor = hover.backgroundColor;
                      if (hover.textColor) target.style.color = hover.textColor;
                      if (hover.border) target.style.border = hover.border;
                      if (hover.transform) target.style.transform = hover.transform;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeSlide.buttons.primary?.style) {
                      const target = e.currentTarget;
                      const style = activeSlide.buttons.primary.style;
                      target.style.backgroundColor = style.backgroundColor || '#10b981';
                      target.style.color = style.textColor || '#ffffff';
                      target.style.border = style.border || '';
                      target.style.transform = 'scale(1)';
                    }
                  }}
                >
                  {activeSlide.buttons.primary.iconPosition === 'left' &&
                    renderIcon(activeSlide.buttons.primary.icon)}
                  <span className="mx-2">{activeSlide.buttons.primary.text}</span>
                  {activeSlide.buttons.primary.iconPosition === 'right' &&
                    renderIcon(activeSlide.buttons.primary.icon)}
                </Button>
              )}
              {activeSlide.buttons.secondary && (
                <Button
                  onClick={() => handleButtonClick(activeSlide.buttons.secondary?.href)}
                  size="lg"
                  variant="outline"
                  className="text-base md:text-lg font-semibold px-6 md:px-8 py-3 md:py-4 transition-all duration-300 hover:scale-105"
                  style={{
                    backgroundColor: activeSlide.buttons.secondary.style?.backgroundColor || 'transparent',
                    color: activeSlide.buttons.secondary.style?.textColor || '#ffffff',
                    border: activeSlide.buttons.secondary.style?.border || '1px solid #ffffff',
                    ...(activeSlide.buttons.secondary.style || {}),
                  }}
                  onMouseEnter={(e) => {
                    if (activeSlide.buttons.secondary?.style?.hover) {
                      const target = e.currentTarget;
                      const hover = activeSlide.buttons.secondary.style.hover;
                      if (hover.backgroundColor) target.style.backgroundColor = hover.backgroundColor;
                      if (hover.textColor) target.style.color = hover.textColor;
                      if (hover.border) target.style.border = hover.border;
                      if (hover.transform) target.style.transform = hover.transform;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeSlide.buttons.secondary?.style) {
                      const target = e.currentTarget;
                      const style = activeSlide.buttons.secondary.style;
                      target.style.backgroundColor = style.backgroundColor || 'transparent';
                      target.style.color = style.textColor || '#ffffff';
                      target.style.border = style.border || '1px solid #ffffff';
                      target.style.transform = 'scale(1)';
                    }
                  }}
                >
                  {renderIcon(activeSlide.buttons.secondary.icon)}
                  <span className="mx-2">{activeSlide.buttons.secondary.text}</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Setas de Navegação */}
      {showNavigation && slides.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 z-20 transition-smooth"
            onClick={prevSlide}
          >
            <ChevronLeft size={32} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 z-20 transition-smooth"
            onClick={nextSlide}
          >
            <ChevronRight size={32} />
          </Button>
        </>
      )}

      {/* Indicadores */}
      {showIndicators && slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'bg-secondary w-8' : 'bg-white/50'
              }`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default HeroSection;
