/**
 * FloatingActionButton (FAB) - Botão flutuante para ações primárias em mobile
 */

import { Button } from '@/components/ui/button';
import { Plus, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  onClick: () => void;
  icon?: LucideIcon;
  label?: string;
  className?: string;
}

export const FloatingActionButton = ({
  onClick,
  icon: Icon = Plus,
  label,
  className,
}: FloatingActionButtonProps) => {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className={cn(
        'fixed bottom-20 md:bottom-8 right-4 md:right-8',
        'h-14 w-14 md:h-16 md:w-16',
        'rounded-full shadow-2xl',
        'z-40',
        'transition-all duration-300',
        'active:scale-95',
        'hover:shadow-xl hover:scale-105',
        className
      )}
      aria-label={label || 'Ação principal'}
    >
      <Icon className="h-6 w-6 md:h-7 md:w-7" />
      {label && <span className="sr-only">{label}</span>}
    </Button>
  );
};
