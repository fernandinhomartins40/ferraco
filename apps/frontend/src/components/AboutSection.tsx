import { Shield, Users, Award, Truck, CheckCircle, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AboutConfig } from "@/types/landingPage";
import * as LucideIcons from 'lucide-react';

interface AboutSectionProps {
  onLeadModalOpen: () => void;
  config?: AboutConfig;
}

const AboutSection = ({ onLeadModalOpen, config }: AboutSectionProps) => {
  // Função para renderizar ícone dinamicamente
  const renderIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName] || Shield;
    return <IconComponent className="w-8 h-8 text-primary" />;
  };

  const values = [
    {
      icon: <Shield className="w-8 h-8 text-primary" />,
      iconName: "Shield",
      title: "Qualidade Garantida",
      description: "Todos nossos produtos passam por rigoroso controle de qualidade e possuem certificação ISO."
    },
    {
      icon: <Users className="w-8 h-8 text-primary" />,
      iconName: "Users",
      title: "Equipe Especializada",
      description: "Profissionais altamente qualificados com décadas de experiência no setor metalúrgico."
    },
    {
      icon: <Award className="w-8 h-8 text-primary" />,
      iconName: "Award",
      title: "Tradição e Inovação",
      description: "25+ anos de tradição combinados com as mais modernas tecnologias de fabricação."
    },
    {
      icon: <Truck className="w-8 h-8 text-primary" />,
      iconName: "Truck",
      title: "Logística Nacional",
      description: "Entregamos em todo o território nacional com prazos otimizados e segurança total."
    }
  ];

  const differentials = [
    "Certificação ISO 9001:2015",
    "Laboratório próprio de testes",
    "Engenharia e desenvolvimento interno",
    "Mais de 5.000 clientes atendidos",
    "Frota própria de entrega",
    "Suporte técnico especializado",
    "Garantia estendida em todos os produtos",
    "Programa de manutenção preventiva"
  ];

  return (
    <section id="sobre" className="py-20 bg-muted/30 scroll-mt-24">
      <div className="container mx-auto px-4">
        {/* About Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            {config?.title?.text || "Sobre a FerrAço"}
          </h2>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            {config?.description?.text || "Fundada em 1998, a Metalúrgica FerrAço é referência nacional em soluções metalúrgicas, oferecendo produtos de alta qualidade e atendimento especializado para indústrias de todos os segmentos."}
          </p>
        </div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {(config?.features && config.features.length > 0 ? config.features : values).map((feature, index) => {
            // Renderizar ícone: se tem icon (string), usar renderIcon, senão usar o default
            const iconElement = 'icon' in feature && typeof feature.icon !== 'string'
              ? feature.icon
              : renderIcon((feature as any).icon || values[index]?.iconName || 'Shield');

            return (
              <div key={'id' in feature ? feature.id : index} className="text-center group">
                <div className="bg-white rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-elegant group-hover:shadow-glow transition-smooth group-hover:scale-110">
                  {iconElement}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Experience Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Experience Column */}
          {config?.experience?.enabled !== false && (
            <div>
              <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                {config?.experience?.title || "25+ Anos de Experiência"}
              </h3>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                {config?.experience?.description || "Nossa trajetória é marcada pela constante busca por excelência e inovação. Ao longo de mais de duas décadas, construímos relacionamentos sólidos com nossos clientes, baseados na confiança, qualidade e resultados excepcionais."}
              </p>

              {/* Stats */}
              {config?.stats && config.stats.length > 0 && (
                <div className={`grid gap-6 mb-8 ${config.stats.length === 2 ? 'grid-cols-2' : `grid-cols-${Math.min(config.stats.length, 3)}`}`}>
                  {config.stats.map((stat) => (
                    <div key={stat.id} className="text-center">
                      <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                      <div className="text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Button */}
              {config?.experience?.button && (
                <Button
                  onClick={onLeadModalOpen}
                  size="lg"
                  className="font-semibold px-8 py-4 transition-all duration-300 hover:scale-105"
                  style={{
                    backgroundColor: config.experience.button.style?.backgroundColor || '#10b981',
                    color: config.experience.button.style?.textColor || '#ffffff',
                    ...(config.experience.button.style || {}),
                  }}
                  onMouseEnter={(e) => {
                    if (config.experience?.button?.style?.hover) {
                      const target = e.currentTarget;
                      const hover = config.experience.button.style.hover;
                      if (hover.backgroundColor) target.style.backgroundColor = hover.backgroundColor;
                      if (hover.textColor) target.style.color = hover.textColor;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (config.experience?.button?.style) {
                      const target = e.currentTarget;
                      const style = config.experience.button.style;
                      target.style.backgroundColor = style.backgroundColor || '#10b981';
                      target.style.color = style.textColor || '#ffffff';
                    }
                  }}
                >
                  {config.experience.button.text || "Conheça Nossa História"}
                </Button>
              )}
            </div>
          )}

          {/* Differentials Card */}
          {config?.differentialsCard?.enabled !== false && (
            <div className="bg-white rounded-2xl p-8 shadow-elegant">
              <h4 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                {config?.differentialsCard?.icon && <span className="[&>svg]:w-6 [&>svg]:h-6">{renderIcon(config.differentialsCard.icon)}</span>}
                {!config?.differentialsCard?.icon && <Target className="w-6 h-6 text-primary" />}
                {config?.differentialsCard?.title || "Nossos Diferenciais"}
              </h4>
              <div className="grid grid-cols-1 gap-4">
                {(config?.differentialsCard?.differentials && config.differentialsCard.differentials.length > 0
                  ? config.differentialsCard.differentials
                  : differentials.map((text, i) => ({ id: `default-${i}`, text, icon: 'CheckCircle' }))
                ).map((differential) => (
                  <div key={differential.id} className="flex items-start gap-3">
                    <span className="[&>svg]:w-5 [&>svg]:h-5 [&>svg]:text-primary [&>svg]:flex-shrink-0 mt-0.5">
                      {differential.icon ? renderIcon(differential.icon) : <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />}
                    </span>
                    <span className="text-muted-foreground leading-relaxed">{differential.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;