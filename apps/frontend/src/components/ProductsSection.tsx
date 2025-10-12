import { Fence, Home, Grid3x3, Settings, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProductsConfig } from "@/types/landingPage";
import canzilImage from "@/assets/canzil-product.jpg";
import bezerreiroImage from "@/assets/bezerreiro-product.jpg";
import freestallImage from "@/assets/freestall-product.jpg";
import contencaoImage from "@/assets/contencao-product.jpg";
import bebedouroImage from "@/assets/bebedouro-product.jpg";

interface ProductsSectionProps {
  onLeadModalOpen: () => void;
  config?: ProductsConfig;
}

const ProductsSection = ({ onLeadModalOpen, config }: ProductsSectionProps) => {
  // Fallback para valores padrão do conteúdo atual
  const defaultProducts = [
    {
      id: "1",
      icon: <Fence className="w-6 h-6 text-white" />,
      image: canzilImage,
      name: "Canzil",
      description: "Sistema de fechamento para vacas leiteiras, fabricado com tubo galvanizado. Projetado para facilitar o acesso ao alimento e focar no conforto animal.",
      features: ["Tubo 42,4mm x 2,65mm", "Vaca Holandesa: 750/800mm", "Vaca Jersey: 650/700mm", "Tubo galvanizado"],
      price: ""
    },
    {
      id: "2",
      icon: <Home className="w-6 h-6 text-white" />,
      image: bezerreiroImage,
      name: "Bezerreiro",
      description: "Estrutura projetada para alojar os bezerros, priorizando o bem-estar dos animais. Garante conforto térmico e físico para crescimento saudável.",
      features: ["Bem-estar animal", "Conforto térmico", "Crescimento saudável", "Estrutura robusta"],
      price: ""
    },
    {
      id: "3",
      icon: <Grid3x3 className="w-6 h-6 text-white" />,
      image: freestallImage,
      name: "Free Stall",
      description: "Sistema de confinamento para gado com divisórias de aço galvanizado. Maximiza o aproveitamento do espaço e minimiza riscos de contaminação.",
      features: ["Aço galvanizado", "Free Stall formato R", "Free Stall Suspenso", "Otimização do espaço"],
      price: ""
    },
    {
      id: "4",
      icon: <Settings className="w-6 h-6 text-white" />,
      image: contencaoImage,
      name: "Sistema de Contenção",
      description: "Sala de ordenha fabricada em aço galvanizado para facilitar o manejo e conforto dos animais durante a ordenha.",
      features: ["Contenção Europeia", "Contenção Espinha de Peixe", "Aço galvanizado", "Segurança operacional"],
      price: ""
    },
    {
      id: "5",
      icon: <Droplets className="w-6 h-6 text-white" />,
      image: bebedouroImage,
      name: "Bebedouros",
      description: "Bebedouros basculantes limpa fácil em aço inox com alta capacidade e vazão para atender o rebanho com eficiência.",
      features: ["Inox 304/430", "Volume: 180 litros", "Boia alta vazão", "Sistema limpa fácil"],
      price: ""
    }
  ];

  const products = config?.items && config.items.length > 0 ? config.items : defaultProducts;

  return (
    <section id="produtos" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            {config?.title?.text || "Nossos Produtos"}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {config?.subtitle?.text || "Equipamentos especializados para pecuária leiteira com a qualidade e confiabilidade que sua fazenda precisa"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {products.map((product, index) => {
            const defaultProduct = defaultProducts[index];
            return (
              <Card key={product.id || index} className="shadow-elegant hover:shadow-glow transition-smooth group hover:scale-105 overflow-hidden">
                {/* Image with Icon Tag */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={product.image || defaultProduct?.image}
                    alt={product.name || defaultProduct?.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-smooth"
                  />
                  <div className="absolute top-4 right-4 w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg">
                    {defaultProduct?.icon}
                  </div>
                </div>

                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-bold text-foreground mb-2">
                    {product.name}
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
            );
          })}
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