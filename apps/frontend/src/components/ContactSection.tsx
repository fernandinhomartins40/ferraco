import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ContactConfig } from "@/types/landingPage";

interface ContactSectionProps {
  onLeadModalOpen: () => void;
  config?: ContactConfig;
}

const ContactSection = ({ onLeadModalOpen, config }: ContactSectionProps) => {
  const contactInfo = [
    {
      icon: <Phone className="w-6 h-6 text-primary" />,
      title: "Telefone",
      info: "(11) 3456-7890",
      subInfo: "(11) 98765-4321"
    },
    {
      icon: <Mail className="w-6 h-6 text-primary" />,
      title: "E-mail",
      info: "contato@ferraco.com.br",
      subInfo: "vendas@ferraco.com.br"
    },
    {
      icon: <MapPin className="w-6 h-6 text-primary" />,
      title: "Endereço",
      info: "Rua Industrial, 1234",
      subInfo: "São Paulo - SP, 01234-567"
    },
    {
      icon: <Clock className="w-6 h-6 text-primary" />,
      title: "Horário",
      info: "Segunda a Sexta: 7h às 18h",
      subInfo: "Sábado: 8h às 12h"
    }
  ];

  // Usar config ou fallback
  const displayContactInfo = config?.contactMethods && config.contactMethods.length > 0 ? config.contactMethods : contactInfo;

  return (
    <section id="contato" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            {config?.title?.text || "Entre em Contato"}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {config?.subtitle?.text || "Nossa equipe está pronta para atender suas necessidades e fornecer as melhores soluções"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Info */}
          <div>
            <h3 className="text-3xl font-bold text-foreground mb-8">
              Informações de Contato
            </h3>
            <div className="space-y-6 mb-8">
              {displayContactInfo.map((contact, index) => {
                const defaultContact = contactInfo[index];
                return (
                  <Card key={index} className="shadow-elegant hover:shadow-glow transition-smooth">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="bg-primary/10 rounded-full p-3">
                          {defaultContact?.icon}
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-foreground mb-1">
                            {contact.label || contact.title}
                          </h4>
                          <p className="text-muted-foreground font-medium">
                            {contact.value || contact.info}
                          </p>
                          {contact.subInfo && (
                            <p className="text-muted-foreground text-sm">
                              {contact.subInfo}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* WhatsApp CTA */}
            <Card className="shadow-elegant hover:shadow-glow transition-smooth bg-primary/5">
              <CardContent className="p-6 text-center">
                <MessageCircle className="w-12 h-12 text-primary mx-auto mb-4" />
                <h4 className="text-xl font-bold text-foreground mb-2">
                  Atendimento via WhatsApp
                </h4>
                <p className="text-muted-foreground mb-4">
                  Fale conosco diretamente pelo WhatsApp para atendimento rápido e personalizado
                </p>
                <Button 
                  onClick={() => window.open('https://wa.me/5511987654321', '_blank')}
                  variant="default"
                  className="font-semibold transition-smooth hover:scale-105"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chamar no WhatsApp
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="space-y-8">
            <Card className="shadow-elegant hover:shadow-glow transition-smooth bg-gradient-to-br from-primary/5 to-accent/5">
              <CardContent className="p-8 text-center">
                <h3 className="text-3xl font-bold text-foreground mb-4">
                  Solicite um Orçamento
                </h3>
                <p className="text-muted-foreground text-lg mb-6">
                  Deixe seus dados e nossa equipe técnica entrará em contato em até 2 horas úteis
                </p>
                <Button 
                  onClick={onLeadModalOpen}
                  size="lg"
                  className="w-full font-semibold py-4 transition-smooth hover:scale-105"
                >
                  Solicitar Orçamento Grátis
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-elegant hover:shadow-glow transition-smooth">
              <CardContent className="p-8">
                <h4 className="text-2xl font-bold text-foreground mb-4 text-center">
                  Por que escolher a FerrAço?
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    <span className="text-muted-foreground">Orçamento grátis e sem compromisso</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    <span className="text-muted-foreground">Atendimento técnico especializado</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    <span className="text-muted-foreground">Entrega em todo o Brasil</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    <span className="text-muted-foreground">Garantia estendida inclusa</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    <span className="text-muted-foreground">Suporte pós-venda completo</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-elegant hover:shadow-glow transition-smooth bg-secondary/10">
              <CardContent className="p-8 text-center">
                <h4 className="text-xl font-bold text-foreground mb-4">
                  Precisa de uma solução personalizada?
                </h4>
                <p className="text-muted-foreground mb-6">
                  Nossa engenharia desenvolve projetos sob medida para suas necessidades específicas
                </p>
                <Button 
                  onClick={onLeadModalOpen}
                  variant="outline"
                  className="w-full font-semibold transition-smooth hover:scale-105"
                >
                  Falar com Engenharia
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;