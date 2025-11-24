import { TrendingUp, Users, Globe, Clock, Award, Target, Zap, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ExperienceConfig } from "@/types/landingPage";
import * as LucideIcons from 'lucide-react';

interface ExperienceSectionProps {
  onLeadModalOpen: () => void;
  config?: ExperienceConfig;
}

const ExperienceSection = ({ onLeadModalOpen, config }: ExperienceSectionProps) => {
  const stats = [
    {
      icon: <TrendingUp className="w-12 h-12 text-secondary" />,
      number: "98%",
      label: "Satisfação dos Clientes",
      description: "Taxa de satisfação baseada em pesquisas de qualidade"
    },
    {
      icon: <Users className="w-12 h-12 text-secondary" />,
      number: "150+",
      label: "Colaboradores",
      description: "Equipe especializada e certificada"
    },
    {
      icon: <Globe className="w-12 h-12 text-secondary" />,
      number: "27",
      label: "Estados Atendidos",
      description: "Cobertura nacional completa"
    },
    {
      icon: <Clock className="w-12 h-12 text-secondary" />,
      number: "24/7",
      label: "Suporte Técnico",
      description: "Atendimento especializado sempre disponível"
    }
  ];

  const testimonials = [
    {
      quote: "A FerrAço é nossa parceira há mais de 10 anos. A qualidade dos produtos e o atendimento técnico são excepcionais.",
      author: "João Silva",
      company: "Industria Metalúrgica XYZ",
      role: "Diretor de Produção"
    },
    {
      quote: "Produtos de alta qualidade, entrega no prazo e preços competitivos. Recomendamos a FerrAço para toda a indústria.",
      author: "Maria Santos",
      company: "Construções ABC",
      role: "Gerente de Suprimentos"
    },
    {
      quote: "O suporte técnico da FerrAço fez toda a diferença no desenvolvimento do nosso projeto. Profissionais muito competentes.",
      author: "Carlos Oliveira",
      company: "Engenharia DEF",
      role: "Engenheiro Chefe"
    }
  ];

  // Usar config ou fallback para stats
  const displayStats = config?.highlights && config.highlights.length > 0 ? config.highlights : stats;

  // Renderizar ícone dinâmico
  const renderIcon = (iconName: string, index: number) => {
    // Usar wildcard import do lucide-react
    const IconComponent = (LucideIcons as any)[iconName];
    if (IconComponent) {
      return <IconComponent className="w-12 h-12 text-secondary" />;
    }
    // Fallback para ícone padrão
    return stats[index]?.icon || <TrendingUp className="w-12 h-12 text-secondary" />;
  };

  // Usar testimonials do config ou fallback
  const displayTestimonials = config?.testimonials?.items && config.testimonials.items.length > 0
    ? config.testimonials.items
    : testimonials;

  const handleButtonClick = (href?: string) => {
    if (!href) {
      onLeadModalOpen();
      return;
    }

    if (href.startsWith('#')) {
      const sectionId = href.replace('#', '');
      const element = document.getElementById(sectionId);
      if (element) {
        const headerOffset = 96;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      }
    } else if (href.startsWith('http')) {
      window.open(href, '_blank');
    } else {
      onLeadModalOpen();
    }
  };

  return (
    <section id="experience" className="py-20 bg-accent text-white scroll-mt-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {config?.title?.text || "Experiência Comprovada"}
          </h2>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            {config?.subtitle?.text || "Números que refletem nossa dedicação à excelência e o compromisso com nossos clientes"}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {displayStats.map((stat, index) => {
            return (
              <div key={'id' in stat ? stat.id : index} className="text-center group">
                <div className="bg-white/10 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center backdrop-blur-sm group-hover:bg-white/20 transition-smooth group-hover:scale-110">
                  {stat.icon ? renderIcon(stat.icon, index) : stats[index]?.icon}
                </div>
                <div className="text-5xl font-bold mb-2 text-secondary">
                  {stat.value || (stat as any).number}
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {stat.label}
                </h3>
                <p className="text-white/80 text-sm">
                  {stat.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Testimonials */}
        {config?.testimonials?.enabled !== false && (
          <div className="mb-16">
            <h3 className="text-3xl font-bold text-center mb-12">
              {config?.testimonials?.title || "O que nossos clientes dizem"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {displayTestimonials.map((testimonial, index) => (
                <div key={'id' in testimonial ? testimonial.id : index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-smooth">
                  <div className="text-lg mb-4 italic">
                    "{testimonial.quote}"
                  </div>
                  <div className="border-t border-white/20 pt-4">
                    <div className="font-semibold text-secondary">
                      {testimonial.author}
                    </div>
                    <div className="text-sm text-white/80">
                      {testimonial.role}
                    </div>
                    <div className="text-sm text-white/60">
                      {testimonial.company}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        {config?.cta?.enabled !== false && (
          <div className="text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-4xl mx-auto">
              <h3 className="text-3xl font-bold mb-4">
                {config?.cta?.title || "Faça parte da nossa história de sucesso"}
              </h3>
              <p className="text-xl opacity-90 mb-8">
                {config?.cta?.description || "Junte-se aos milhares de clientes que confiam na qualidade e experiência da FerrAço"}
              </p>
              <Button
                onClick={() => handleButtonClick(config?.cta?.button?.href)}
                size="lg"
                variant="secondary"
                className="font-semibold px-8 py-4 transition-all duration-300 hover:scale-105"
                style={{
                  backgroundColor: config?.cta?.button?.style?.backgroundColor || '#10b981',
                  color: config?.cta?.button?.style?.textColor || '#ffffff',
                  ...(config?.cta?.button?.style || {}),
                }}
                onMouseEnter={(e) => {
                  if (config?.cta?.button?.style?.hover) {
                    const target = e.currentTarget;
                    const hover = config.cta.button.style.hover;
                    if (hover.backgroundColor) target.style.backgroundColor = hover.backgroundColor;
                    if (hover.textColor) target.style.color = hover.textColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (config?.cta?.button?.style) {
                    const target = e.currentTarget;
                    const style = config.cta.button.style;
                    target.style.backgroundColor = style.backgroundColor || '#10b981';
                    target.style.color = style.textColor || '#ffffff';
                  }
                }}
              >
                {config?.cta?.button?.text || "Quero Ser Cliente FerrAço"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ExperienceSection;