import { MapPin, Phone, Mail, Facebook, Instagram, Linkedin, Youtube, Shield, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import logoFerraco from "@/assets/logo-ferraco.webp";
import type { FooterConfig } from "@/types/landingPage";

interface FooterProps {
  config?: FooterConfig;
}

const Footer = ({ config }: FooterProps) => {
  const { isAuthenticated, user } = useAuth();

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

  // Usar config ou fallback
  const logoSrc = config?.logo?.image?.url || config?.logo?.image || logoFerraco;
  const logoAlt = config?.logo?.image?.alt || config?.logo?.alt || "Ferraco Equipamentos";
  const tagline = config?.tagline || "Há mais de 25 anos oferecendo soluções de qualidade superior para fazendas de todo o Brasil. Tradição, inovação e excelência em cada produto.";
  const copyright = config?.bottom?.copyright || `© ${new Date().getFullYear()} Ferraco Equipamentos. Todos os direitos reservados.`;
  const displaySocialLinks = config?.social?.enabled ? config.social.links.filter(link => link.href) : socialLinks;

  // Contact info com fallback
  const contactAddress = config?.contactInfo?.address || "Rua Industrial, 1234 - São Paulo - SP, 01234-567";
  const contactPhone = config?.contactInfo?.phone || "(11) 3456-7890 | (11) 98765-4321";
  const contactEmail = config?.contactInfo?.email || "contato@ferraco.com.br";

  return (
    <footer className="bg-accent text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <img
              src={logoSrc}
              alt={logoAlt}
              className="h-16 w-auto mb-6"
            />
            <p className="text-primary-foreground/90 mb-6 max-w-md">
              {tagline}
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              {contactAddress && (
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 mr-3 text-secondary flex-shrink-0" />
                  <span className="text-sm">{contactAddress}</span>
                </div>
              )}
              {contactPhone && (
                <div className="flex items-center">
                  <Phone className="w-5 h-5 mr-3 text-secondary flex-shrink-0" />
                  <span className="text-sm">{contactPhone}</span>
                </div>
              )}
              {contactEmail && (
                <div className="flex items-center">
                  <Mail className="w-5 h-5 mr-3 text-secondary flex-shrink-0" />
                  <span className="text-sm">{contactEmail}</span>
                </div>
              )}
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
              {isAuthenticated ? (
                <a
                  href="/admin"
                  className="inline-flex items-center text-sm text-primary-foreground/80 hover:text-secondary transition-smooth font-medium"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Painel Administrativo
                  <span className="ml-2 px-2 py-1 bg-secondary text-primary text-xs rounded-full">
                    {user?.role === 'admin' ? 'Admin' : user?.role === 'sales' ? 'Vendedor' : 'Consultor'}
                  </span>
                </a>
              ) : (
                <a
                  href="/login"
                  className="inline-flex items-center text-sm text-primary-foreground/80 hover:text-secondary transition-smooth font-medium"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Login Administrativo
                </a>
              )}
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
        {displaySocialLinks.length > 0 && (
          <div className="border-t border-primary-foreground/20 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <h4 className="text-lg font-semibold mb-3 text-secondary">
                  {config?.social?.title || "Siga-nos"}
                </h4>
                <div className="flex space-x-4">
                  {displaySocialLinks.map((social, index) => {
                    const defaultSocial = socialLinks[index];
                    return (
                      <a
                        key={social.id || social.label}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-primary-foreground/10 hover:bg-secondary hover:text-primary p-3 rounded-full transition-smooth hover:scale-110"
                        aria-label={social.label}
                      >
                        {defaultSocial?.icon || social.icon}
                      </a>
                    );
                  })}
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
        )}

        {/* Copyright */}
        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center">
          <p className="text-sm text-primary-foreground/70">
            {copyright}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;