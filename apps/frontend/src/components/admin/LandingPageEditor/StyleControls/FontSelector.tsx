/**
 * FontSelector - Seletor de fontes com preview
 */

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FontSelectorProps {
  label: string;
  value: string;
  onChange: (font: string) => void;
  description?: string;
  type?: 'family' | 'size' | 'weight';
}

const FONT_FAMILIES = [
  { value: "'Inter', sans-serif", label: 'Inter' },
  { value: "'Poppins', sans-serif", label: 'Poppins' },
  { value: "'Roboto', sans-serif", label: 'Roboto' },
  { value: "'Open Sans', sans-serif", label: 'Open Sans' },
  { value: "'Lato', sans-serif", label: 'Lato' },
  { value: "'Montserrat', sans-serif", label: 'Montserrat' },
  { value: "'Raleway', sans-serif", label: 'Raleway' },
  { value: "'Nunito', sans-serif", label: 'Nunito' },
  { value: "'Playfair Display', serif", label: 'Playfair Display' },
  { value: "'Merriweather', serif", label: 'Merriweather' },
  { value: "'JetBrains Mono', monospace", label: 'JetBrains Mono' },
  { value: "system-ui, sans-serif", label: 'System UI' },
];

const FONT_SIZES = [
  { value: '0.75rem', label: 'XS (12px)' },
  { value: '0.875rem', label: 'SM (14px)' },
  { value: '1rem', label: 'Base (16px)' },
  { value: '1.125rem', label: 'LG (18px)' },
  { value: '1.25rem', label: 'XL (20px)' },
  { value: '1.5rem', label: '2XL (24px)' },
  { value: '1.875rem', label: '3XL (30px)' },
  { value: '2.25rem', label: '4XL (36px)' },
  { value: '3rem', label: '5XL (48px)' },
  { value: '3.75rem', label: '6XL (60px)' },
];

const FONT_WEIGHTS = [
  { value: '300', label: 'Light (300)' },
  { value: '400', label: 'Normal (400)' },
  { value: '500', label: 'Medium (500)' },
  { value: '600', label: 'Semibold (600)' },
  { value: '700', label: 'Bold (700)' },
  { value: '800', label: 'Extrabold (800)' },
  { value: '900', label: 'Black (900)' },
];

export const FontSelector = ({
  label,
  value,
  onChange,
  description,
  type = 'family',
}: FontSelectorProps) => {
  const getOptions = () => {
    switch (type) {
      case 'family':
        return FONT_FAMILIES;
      case 'size':
        return FONT_SIZES;
      case 'weight':
        return FONT_WEIGHTS;
      default:
        return [];
    }
  };

  const options = getOptions();

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              style={
                type === 'family'
                  ? { fontFamily: option.value }
                  : type === 'size'
                  ? { fontSize: '14px' }
                  : { fontWeight: option.value }
              }
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
