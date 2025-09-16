import { MapPin, Phone, Mail, Facebook, Instagram, Linkedin, Youtube } from "lucide-react";
import logoFerraco from "@/assets/logo-ferraco.webp";

const Footer = () => {
  const quickLinks = [
    { label: "Início", href: "#inicio" },
    { label: "Sobre", href: "#sobre" },
    { label: "Produtos", href: "#produtos" },
    { label: "Experiência", href: "#experiencia" },
    { label: "Contato", href: "#contato" }
  ];

  const productLinks = [
    { label: "Ferramentas Industriais", href: "#produtos" },
    { label: "Peças Sob Medida", href: "#produtos" },
    { label: "Estruturas Metálicas", href: "#produtos" },
    { label: "Equipamentos Industriais", href: "#produtos" }
  ];

  const socialLinks = [
    { icon: <Facebook className="w-5 h-5" />, href: "#", label: "Facebook" },
    { icon: <Instagram className="w-5 h-5" />, href: "#", label: "Instagram" },
    { icon: <Linkedin className="w-5 h-5" />, href: "#", label: "LinkedIn" },
    { icon: <Youtube className="w-5 h-5" />, href: "#", label: "YouTube" }
  ];

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-accent text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <img 
              src={logoFerraco} 
              alt="Metalúrgica FerrAço" 
              className="h-16 w-auto mb-6"
            />
            <p className="text-primary-foreground/90 mb-6 max-w-md">
              Há mais de 25 anos oferecendo soluções metalúrgicas de qualidade superior 
              para indústrias de todo o Brasil. Tradição, inovação e excelência em cada produto.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center">
                <MapPin className="w-5 h-5 mr-3 text-secondary" />
                <span className="text-sm">Rua Industrial, 1234 - São Paulo - SP, 01234-567</span>
              </div>
              <div className="flex items-center">
                <Phone className="w-5 h-5 mr-3 text-secondary" />
                <span className="text-sm">(11) 3456-7890 | (11) 98765-4321</span>
              </div>
              <div className="flex items-center">
                <Mail className="w-5 h-5 mr-3 text-secondary" />
                <span className="text-sm">contato@ferraco.com.br</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-secondary">
              Links Rápidos
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => scrollToSection(link.href)}
                    className="text-primary-foreground/80 hover:text-secondary transition-smooth text-sm"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t border-white/20">
              <a
                href="/admin"
                className="inline-flex items-center text-sm text-primary-foreground/80 hover:text-secondary transition-smooth font-medium"
              >
                🔧 Painel Administrativo
              </a>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-secondary">
              Produtos
            </h3>
            <ul className="space-y-2">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => scrollToSection(link.href)}
                    className="text-primary-foreground/80 hover:text-secondary transition-smooth text-sm"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Social Links */}
        <div className="border-t border-primary-foreground/20 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h4 className="text-lg font-semibold mb-3 text-secondary">Siga-nos</h4>
              <div className="flex space-x-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-primary-foreground/10 hover:bg-secondary hover:text-primary p-3 rounded-full transition-smooth hover:scale-110"
                    aria-label={social.label}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-sm text-primary-foreground/70 mb-2">
                Horário de Atendimento:
              </p>
              <p className="text-sm text-primary-foreground/90">
                Segunda a Sexta: 7h às 18h | Sábado: 8h às 12h
              </p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center">
          <p className="text-sm text-primary-foreground/70">
            © {new Date().getFullYear()} Metalúrgica FerrAço. Todos os direitos reservados.
          </p>
          <p className="text-xs text-primary-foreground/60 mt-2">
            CNPJ: 12.345.678/0001-90 | Desenvolvido com tecnologia Lovable
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;