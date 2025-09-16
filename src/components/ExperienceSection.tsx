import { TrendingUp, Users, Globe, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExperienceSectionProps {
  onLeadModalOpen: () => void;
}

const ExperienceSection = ({ onLeadModalOpen }: ExperienceSectionProps) => {
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

  return (
    <section id="experiencia" className="py-20 bg-accent text-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Experiência Comprovada
          </h2>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            Números que refletem nossa dedicação à excelência e o compromisso com nossos clientes
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {stats.map((stat, index) => (
            <div key={index} className="text-center group">
              <div className="bg-white/10 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center backdrop-blur-sm group-hover:bg-white/20 transition-smooth group-hover:scale-110">
                {stat.icon}
              </div>
              <div className="text-5xl font-bold mb-2 text-secondary">
                {stat.number}
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {stat.label}
              </h3>
              <p className="text-white/80 text-sm">
                {stat.description}
              </p>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center mb-12">
            O que nossos clientes dizem
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-smooth">
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

        {/* CTA */}
        <div className="text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold mb-4">
              Faça parte da nossa história de sucesso
            </h3>
            <p className="text-xl opacity-90 mb-8">
              Junte-se aos milhares de clientes que confiam na qualidade e experiência da FerrAço
            </p>
            <Button 
              onClick={onLeadModalOpen}
              size="lg"
              variant="secondary"
              className="font-semibold px-8 py-4 transition-smooth hover:scale-105"
            >
              Quero Ser Cliente FerrAço
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExperienceSection;