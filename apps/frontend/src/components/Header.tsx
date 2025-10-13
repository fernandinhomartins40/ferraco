import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoFerraco from "@/assets/logo-ferraco.webp";
import type { HeaderConfig } from "@/types/landingPage";

interface HeaderProps {
  onLeadModalOpen: () => void;
  config?: HeaderConfig;
}

const Header = ({ onLeadModalOpen, config }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Fallback para valores padrão do conteúdo atual
  const menuItems = config?.menu?.items || [
    { label: "Início", href: "#inicio" },
    { label: "Sobre", href: "#sobre" },
    { label: "Produtos", href: "#produtos" },
    { label: "Experiência", href: "#experiencia" },
    { label: "Contato", href: "#contato" },
  ];

  const logoSrc = config?.logo?.image?.url || logoFerraco;
  const logoAlt = config?.logo?.image?.alt || config?.logo?.alt || "Ferraco Equipamentos";
  const ctaText = config?.cta?.text || "Solicitar Orçamento";

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary shadow-elegant">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20 lg:h-24">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img
              src={logoSrc}
              alt={logoAlt}
              className="h-12 lg:h-16 w-auto transition-smooth hover:scale-105"
            />
          </div>

          {/* Desktop Menu */}
          <nav className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => scrollToSection(item.href)}
                className="text-primary-foreground hover:text-secondary font-medium transition-smooth relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-secondary after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* CTA Button Desktop */}
          <div className="hidden md:block">
            <Button
              onClick={onLeadModalOpen}
              variant="secondary"
              className="font-semibold transition-smooth hover:scale-105"
            >
              {ctaText}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-primary-foreground hover:text-secondary"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-primary-foreground/20">
            <nav className="flex flex-col space-y-4">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => scrollToSection(item.href)}
                  className="text-primary-foreground hover:text-secondary font-medium text-left transition-smooth"
                >
                  {item.label}
                </button>
              ))}
              <Button
                onClick={onLeadModalOpen}
                variant="secondary"
                className="w-full mt-4 font-semibold"
              >
                {ctaText}
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;