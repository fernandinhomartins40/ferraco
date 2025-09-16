import { Wrench, Cog, Building, Factory } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ProductsSectionProps {
  onLeadModalOpen: () => void;
}

const ProductsSection = ({ onLeadModalOpen }: ProductsSectionProps) => {
  const products = [
    {
      icon: <Wrench className="w-12 h-12 text-primary" />,
      title: "Ferramentas Industriais",
      description: "Linha completa de ferramentas de alta precisão para indústria metalúrgica, com garantia de qualidade e durabilidade.",
      features: ["Aço carbono", "Tratamento térmico", "Certificação ISO", "Garantia estendida"]
    },
    {
      icon: <Cog className="w-12 h-12 text-primary" />,
      title: "Peças Sob Medida",
      description: "Desenvolvimento e fabricação de peças personalizadas conforme especificações técnicas do cliente.",
      features: ["Projeto personalizado", "Engenharia especializada", "Controle de qualidade", "Prazos reduzidos"]
    },
    {
      icon: <Building className="w-12 h-12 text-primary" />,
      title: "Estruturas Metálicas",
      description: "Fabricação de estruturas metálicas para construção civil e industrial com alta resistência.",
      features: ["Cálculo estrutural", "Soldas certificadas", "Acabamento premium", "Instalação completa"]
    },
    {
      icon: <Factory className="w-12 h-12 text-primary" />,
      title: "Equipamentos Industriais",
      description: "Linha de equipamentos robustos para diversos segmentos industriais com tecnologia avançada.",
      features: ["Automação disponível", "Manutenção programada", "Treinamento incluído", "Suporte técnico"]
    }
  ];

  return (
    <section id="produtos" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Nossos Produtos
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Soluções metalúrgicas completas com a qualidade e confiabilidade que sua empresa precisa
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {products.map((product, index) => (
            <Card key={index} className="shadow-elegant hover:shadow-glow transition-smooth group hover:scale-105">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4 group-hover:scale-110 transition-smooth">
                  {product.icon}
                </div>
                <CardTitle className="text-2xl font-bold text-foreground mb-2">
                  {product.title}
                </CardTitle>
                <CardDescription className="text-muted-foreground text-lg">
                  {product.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {product.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-muted-foreground">
                      <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button 
                  onClick={onLeadModalOpen}
                  className="w-full font-semibold transition-smooth hover:scale-105"
                  variant="default"
                >
                  Quero Saber Mais
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-primary/5 rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Não encontrou o que procura?
            </h3>
            <p className="text-xl text-muted-foreground mb-6">
              Nossa equipe técnica desenvolve soluções personalizadas para atender suas necessidades específicas
            </p>
            <Button 
              onClick={onLeadModalOpen}
              size="lg"
              className="font-semibold px-8 py-4 transition-smooth hover:scale-105"
            >
              Solicitar Projeto Personalizado
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;