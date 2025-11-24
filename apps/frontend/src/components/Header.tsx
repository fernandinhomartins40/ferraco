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

  // Fallback para valores padrão
  const menuItems = config?.menu?.items || [
    { label: "Início", href: "#hero" },
    { label: "Sobre", href: "#about" },
    { label: "Produtos", href: "#products" },
    { label: "Experiência", href: "#experience" },
    { label: "Contato", href: "#contact" },
  ];

  const logoSrc = config?.logo?.image?.url || logoFerraco;
  const logoAlt = config?.logo?.image?.alt || config?.logo?.alt || "Ferraco Equipamentos";
  const ctaText = config?.cta?.text || "Solicitar Orçamento";

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-primary shadow-elegant">
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
                type="button"
                onClick={() => scrollToSection(item.href)}
                className="text-primary-foreground hover:text-secondary font-medium transition-smooth relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-secondary after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left after:pointer-events-none"
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
                  type="button"
                  onClick={() => {
                    scrollToSection(item.href);
                    setIsMenuOpen(false);
                  }}
                  className="text-primary-foreground hover:text-secondary font-medium text-left transition-smooth"
                >
                  {item.label}
                </button>
              ))}
              <Button
                onClick={() => {
                  setIsMenuOpen(false);
                  onLeadModalOpen();
                }}
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