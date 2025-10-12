/**
 * MarqueeSection - Faixa animada com destaques
 * Usa configuração dinâmica do landingPageStorage
 */

import { Star, Award, Truck, Users, CheckCircle, Shield, Zap, Heart, ThumbsUp, Package } from "lucide-react";
import type { MarqueeConfig } from "@/types/landingPage";

interface MarqueeSectionProps {
  config: MarqueeConfig;
}

const iconMap = {
  Star: Star,
  Award: Award,
  Truck: Truck,
  Users: Users,
  CheckCircle: CheckCircle,
  Shield: Shield,
  Zap: Zap,
  Heart: Heart,
  ThumbsUp: ThumbsUp,
  Package: Package,
};

const MarqueeSection = ({ config }: MarqueeSectionProps) => {
  // Se desabilitado, não renderiza
  if (!config.enabled) {
    return null;
  }

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || Star;
    return IconComponent;
  };

  return (
    <div
      className="overflow-hidden py-4"
      style={{
        backgroundColor: config.backgroundColor || '#f3f4f6',
        ...config.style
      }}
    >
      <div
        className="flex gap-12 animate-marquee whitespace-nowrap"
        style={{
          animationDuration: `${config.speed || 30}s`,
        }}
      >
        {/* Renderiza items 2 vezes para efeito infinito */}
        {[...config.items, ...config.items].map((item, index) => {
          const Icon = getIcon(item.icon);
          return (
            <div
              key={`${item.id}-${index}`}
              className="inline-flex items-center gap-3"
            >
              <Icon
                className="w-5 h-5 flex-shrink-0"
                style={{ color: config.iconColor || '#0ea5e9' }}
              />
              <span
                className="font-medium text-base"
                style={{ color: config.textColor || '#1f2937' }}
              >
                {item.text}
              </span>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-marquee {
          animation: marquee linear infinite;
        }
      `}</style>
    </div>
  );
};

export default MarqueeSection;
