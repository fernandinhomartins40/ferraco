/**
 * IconSelector - Seletor de ícones do Lucide
 */

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import * as Icons from 'lucide-react';
import { Search } from 'lucide-react';

interface IconSelectorProps {
  label: string;
  value: string;
  onChange: (icon: string) => void;
  description?: string;
}

// Lista de ícones mais comuns
const COMMON_ICONS = [
  'Check',
  'X',
  'ChevronDown',
  'ChevronUp',
  'ChevronLeft',
  'ChevronRight',
  'ArrowRight',
  'ArrowLeft',
  'Plus',
  'Minus',
  'Star',
  'Heart',
  'ThumbsUp',
  'User',
  'Users',
  'Mail',
  'Phone',
  'MessageCircle',
  'Calendar',
  'Clock',
  'MapPin',
  'Home',
  'Settings',
  'Search',
  'Menu',
  'Package',
  'Truck',
  'Award',
  'Shield',
  'Zap',
  'TrendingUp',
  'BarChart',
  'PieChart',
  'Facebook',
  'Instagram',
  'Linkedin',
  'Twitter',
  'Youtube',
];

export const IconSelector = ({ label, value, onChange, description }: IconSelectorProps) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Filtra ícones baseado na busca
  const filteredIcons = COMMON_ICONS.filter((iconName) =>
    iconName.toLowerCase().includes(search.toLowerCase())
  );

  // Renderiza o ícone selecionado
  const renderIcon = (iconName: string) => {
    const IconComponent = Icons[iconName as keyof typeof Icons] as React.ComponentType<{
      className?: string;
    }>;
    return IconComponent ? <IconComponent className="h-5 w-5" /> : null;
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}

      <div className="flex gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-12 h-10 p-2">
              {value ? renderIcon(value) : <Search className="h-5 w-5" />}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar ícone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>

              <ScrollArea className="h-64">
                <div className="grid grid-cols-6 gap-2">
                  {filteredIcons.map((iconName) => (
                    <button
                      key={iconName}
                      onClick={() => {
                        onChange(iconName);
                        setIsOpen(false);
                        setSearch('');
                      }}
                      className={`
                        p-2 rounded hover:bg-accent transition-colors
                        ${value === iconName ? 'bg-primary text-primary-foreground' : ''}
                      `}
                      title={iconName}
                    >
                      {renderIcon(iconName)}
                    </button>
                  ))}
                </div>

                {filteredIcons.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    Nenhum ícone encontrado
                  </p>
                )}
              </ScrollArea>

              <p className="text-xs text-muted-foreground text-center">
                {filteredIcons.length} ícones disponíveis
              </p>
            </div>
          </PopoverContent>
        </Popover>

        <Input type="text" value={value} onChange={(e) => onChange(e.target.value)} readOnly />
      </div>
    </div>
  );
};
