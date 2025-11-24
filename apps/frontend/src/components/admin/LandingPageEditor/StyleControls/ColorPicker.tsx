/**
 * ColorPicker - Seletor de cores com preview
 */

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  presets?: string[];
  description?: string;
}

const DEFAULT_PRESETS = [
  '#0ea5e9', // sky-500
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#ef4444', // red-500
  '#f59e0b', // amber-500
  '#10b981', // emerald-500
  '#06b6d4', // cyan-500
  '#6366f1', // indigo-500
  '#14b8a6', // teal-500
  '#84cc16', // lime-500
  '#f97316', // orange-500
];

export const ColorPicker = ({
  label,
  value,
  onChange,
  presets = DEFAULT_PRESETS,
  description,
}: ColorPickerProps) => {
  const [localValue, setLocalValue] = useState(value);

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={label}>{label}</Label>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}

      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-12 h-10 p-1 rounded-md border-2"
              style={{ backgroundColor: localValue }}
            >
              <span className="sr-only">Escolher cor</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 max-w-[calc(100vw-2rem)]">
            <div className="space-y-4">
              <div>
                <Label>Cor Personalizada</Label>
                <Input
                  type="color"
                  value={localValue}
                  onChange={(e) => handleChange(e.target.value)}
                  className="h-10 w-full"
                />
              </div>

              <div>
                <Label>Código HEX</Label>
                <Input
                  type="text"
                  value={localValue}
                  onChange={(e) => handleChange(e.target.value)}
                  placeholder="#000000"
                  className="font-mono"
                />
              </div>

              {presets.length > 0 && (
                <div>
                  <Label>Cores Predefinidas</Label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-2">
                    {presets.map((preset) => (
                      <button
                        key={preset}
                        onClick={() => handleChange(preset)}
                        className="w-8 h-8 rounded border-2 hover:scale-110 transition-transform"
                        style={{
                          backgroundColor: preset,
                          borderColor: preset === localValue ? '#000' : 'transparent',
                        }}
                        title={preset}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <Input
          type="text"
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 font-mono"
        />
      </div>
    </div>
  );
};
