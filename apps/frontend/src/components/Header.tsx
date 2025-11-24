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
    console.log('🔍 [Header] scrollToSection called with href:', href);
    console.log('🔍 [Header] Current window.scrollY:', window.scrollY);
    console.log('🔍 [Header] Document ready state:', document.readyState);

    const element = document.querySelector(href);
    console.log('🔍 [Header] Element found:', element);

    if (element) {
      const elementRect = element.getBoundingClientRect();
      const elementTop = element.offsetTop;

      console.log('✅ [Header] Scrolling to element:', {
        id: element.id,
        tagName: element.tagName,
        offsetTop: elementTop,
        scrollTop: window.scrollY,
        boundingClientRect: {
          top: elementRect.top,
          left: elementRect.left,
          bottom: elementRect.bottom,
          right: elementRect.right
        }
      });

      // Tentativa 1: scrollIntoView (idêntico ao Footer)
      console.log('🔄 [Header] Attempting scrollIntoView...');
      element.scrollIntoView({ behavior: "smooth" });

      // Debug: verificar se o scroll mudou após um tempo
      setTimeout(() => {
        console.log('🔍 [Header] After scrollIntoView - window.scrollY:', window.scrollY);
      }, 100);

      console.log('✅ [Header] scrollIntoView executed');
    } else {
      console.error('❌ [Header] Element not found for href:', href);
      console.log('🔍 [Header] Available sections with IDs:',
        Array.from(document.querySelectorAll('[id]')).map(el => `#${el.id}`)
      );
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
                onClick={() => {
                  console.log('🖱️ [Header] Desktop button clicked:', item.label, item.href);
                  scrollToSection(item.href);
                }}
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
                  onClick={() => {
                    console.log('📱 [Header] Mobile button clicked:', item.label, item.href);
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