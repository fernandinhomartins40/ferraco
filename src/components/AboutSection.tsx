import { Shield, Users, Award, Truck, CheckCircle, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AboutSectionProps {
  onLeadModalOpen: () => void;
}

const AboutSection = ({ onLeadModalOpen }: AboutSectionProps) => {
  const values = [
    {
      icon: <Shield className="w-8 h-8 text-primary" />,
      title: "Qualidade Garantida",
      description: "Todos nossos produtos passam por rigoroso controle de qualidade e possuem certificação ISO."
    },
    {
      icon: <Users className="w-8 h-8 text-primary" />,
      title: "Equipe Especializada",
      description: "Profissionais altamente qualificados com décadas de experiência no setor metalúrgico."
    },
    {
      icon: <Award className="w-8 h-8 text-primary" />,
      title: "Tradição e Inovação",
      description: "25+ anos de tradição combinados com as mais modernas tecnologias de fabricação."
    },
    {
      icon: <Truck className="w-8 h-8 text-primary" />,
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
    <section id="sobre" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* About Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Sobre a FerrAço
          </h2>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Fundada em 1998, a Metalúrgica FerrAço é referência nacional em soluções metalúrgicas, 
            oferecendo produtos de alta qualidade e atendimento especializado para indústrias de todos os segmentos.
          </p>
        </div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {values.map((value, index) => (
            <div key={index} className="text-center group">
              <div className="bg-white rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-elegant group-hover:shadow-glow transition-smooth group-hover:scale-110">
                {value.icon}
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                {value.title}
              </h3>
              <p className="text-muted-foreground">
                {value.description}
              </p>
            </div>
          ))}
        </div>

        {/* Experience Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              25+ Anos de Experiência
            </h3>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              Nossa trajetória é marcada pela constante busca por excelência e inovação. 
              Ao longo de mais de duas décadas, construímos relacionamentos sólidos com 
              nossos clientes, baseados na confiança, qualidade e resultados excepcionais.
            </p>
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">5.000+</div>
                <div className="text-muted-foreground">Clientes Atendidos</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">25+</div>
                <div className="text-muted-foreground">Anos de Mercado</div>
              </div>
            </div>
            <Button 
              onClick={onLeadModalOpen}
              size="lg"
              className="font-semibold px-8 py-4 transition-smooth hover:scale-105"
            >
              Conheça Nossa História
            </Button>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-elegant">
            <h4 className="text-2xl font-bold text-foreground mb-6 flex items-center">
              <Target className="w-6 h-6 text-primary mr-3" />
              Nossos Diferenciais
            </h4>
            <div className="grid grid-cols-1 gap-4">
              {differentials.map((differential, index) => (
                <div key={index} className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
                  <span className="text-muted-foreground">{differential}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;