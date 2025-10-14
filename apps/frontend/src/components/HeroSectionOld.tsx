import { Button } from "@/components/ui/button";
import type { HeroConfig } from "@/types/landingPage";
import * as LucideIcons from 'lucide-react';

interface HeroSectionProps {
  onLeadModalOpen: () => void;
  config?: HeroConfig;
}

const HeroSection = ({ onLeadModalOpen, config }: HeroSectionProps) => {
  // Renderizar ícone dinamicamente
  const renderIcon = (iconName?: string) => {
    if (!iconName) return null;
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent ? <IconComponent className="w-5 h-5" /> : null;
  };

  // Dados do config ou fallback
  const title = config?.title?.text || "Equipamentos para Pecuária Leiteira";
  const titleHighlight = config?.title?.highlight;
  const subtitle = config?.subtitle?.text || "Há mais de 25 anos fornecendo soluções de alta qualidade";
  const description = config?.description?.text || "Especialistas em equipamentos para pecuária leiteira, oferecendo tecnologia de ponta e atendimento personalizado para fazendas em todo o Brasil";

  const primaryButton = config?.buttons?.primary || { text: "Conhecer Produtos", href: "#produtos" };
  const secondaryButton = config?.buttons?.secondary || { text: "Solicitar Orçamento", href: "#contato" };
  const buttonsAlignment = config?.buttons?.alignment || 'center';

  // Background
  const backgroundImage = config?.background?.type === 'image' && config?.background?.image?.url
    ? config.background.image.url
    : null;

  const backgroundColor = config?.background?.type === 'color' && config?.background?.color
    ? config.background.color
    : null;

  const backgroundGradient = config?.background?.type === 'gradient' && config?.background?.gradient
    ? `linear-gradient(${config.background.gradient.direction}, ${config.background.gradient.from}, ${config.background.gradient.to})`
    : null;

  const backgroundStyle: React.CSSProperties = backgroundImage
    ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : backgroundColor
    ? { backgroundColor }
    : backgroundGradient
    ? { background: backgroundGradient }
    : {};

  const overlayStyle = config?.background?.overlay?.enabled
    ? {
        backgroundColor: config.background.overlay.color,
        opacity: config.background.overlay.opacity / 100,
      }
    : undefined;

  const height = config?.height || '70vh';
  const heightClass = height === 'screen' ? 'h-screen' : height === 'auto' ? 'min-h-[60vh]' : '';
  const heightStyle = !heightClass && height !== 'auto' && height !== 'screen' ? { height } : {};

  // Função para lidar com cliques nos botões
  const handleButtonClick = (href?: string) => {
    if (href?.startsWith('#')) {
      const element = document.querySelector(href);
      element?.scrollIntoView({ behavior: 'smooth' });
    } else {
      onLeadModalOpen();
    }
  };

  // Alinhamento dos botões
  const alignmentClass = buttonsAlignment === 'left' ? 'justify-start' : buttonsAlignment === 'right' ? 'justify-end' : 'justify-center';

  return (
    <section
      id="inicio"
      className={`relative pt-20 lg:pt-24 flex items-center overflow-hidden ${heightClass} ${!backgroundImage && !backgroundColor && !backgroundGradient ? 'hero-gradient' : ''}`}
      style={{ ...backgroundStyle, ...heightStyle }}
    >
      {/* Overlay */}
      {config?.background?.overlay?.enabled && (
        <div className="absolute inset-0" style={overlayStyle}></div>
      )}

      <div className="container mx-auto px-4 relative z-10">
        <div className={`max-w-4xl ${config?.layout === 'centered' ? 'mx-auto text-center' : ''} text-white`}>
          <div className="animate-fade-in-up">
            {/* Título */}
            <h1
              className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight"
              style={{
                fontSize: config?.title?.style?.fontSize,
                fontWeight: config?.title?.style?.fontWeight,
                color: config?.title?.style?.textColor || '#ffffff',
              }}
            >
              {titleHighlight ? (
                <>
                  {title.replace(titleHighlight, '')}
                  <span className="text-secondary">{titleHighlight}</span>
                </>
              ) : title}
            </h1>

            {/* Subtítulo */}
            <p
              className="text-lg md:text-xl lg:text-2xl mb-4 opacity-90 max-w-3xl"
              style={{
                fontSize: config?.subtitle?.style?.fontSize,
                fontWeight: config?.subtitle?.style?.fontWeight,
                color: config?.subtitle?.style?.textColor || '#ffffff',
              }}
            >
              {subtitle}
            </p>

            {/* Descrição */}
            {description && (
              <p
                className="text-base md:text-lg mb-6 md:mb-8 opacity-80 max-w-2xl"
                style={{
                  fontSize: config?.description?.style?.fontSize,
                  color: config?.description?.style?.textColor || '#ffffff',
                }}
              >
                {description}
              </p>
            )}

            {/* Botões */}
            <div className={`flex flex-col sm:flex-row gap-3 md:gap-4 ${alignmentClass}`}>
              {primaryButton && (
                <Button
                  onClick={() => handleButtonClick(primaryButton.href)}
                  size="lg"
                  variant="secondary"
                  className="text-base md:text-lg font-semibold px-6 md:px-8 py-3 md:py-4 transition-smooth hover:scale-105 shadow-glow"
                >
                  {primaryButton.iconPosition === 'left' && renderIcon(primaryButton.icon)}
                  {primaryButton.text}
                  {primaryButton.iconPosition === 'right' && renderIcon(primaryButton.icon)}
                </Button>
              )}
              {secondaryButton && (
                <Button
                  onClick={() => handleButtonClick(secondaryButton.href)}
                  size="lg"
                  variant="outline"
                  className="text-base md:text-lg font-semibold px-6 md:px-8 py-3 md:py-4 border-white text-white hover:bg-white hover:text-primary transition-smooth hover:scale-105"
                >
                  {renderIcon(secondaryButton.icon)}
                  {secondaryButton.text}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;