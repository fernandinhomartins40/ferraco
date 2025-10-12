/**
 * MarqueeEditor - Editor do marquee animado
 * Configurar itens que aparecem no marquee
 */

import { MarqueeConfig } from '@/types/landingPage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { ColorPicker } from '../StyleControls';

interface MarqueeEditorProps {
  config: MarqueeConfig;
  onChange: (config: Partial<MarqueeConfig>) => void;
}

export const MarqueeEditor = ({ config, onChange }: MarqueeEditorProps) => {
  const addItem = () => {
    const newItem = {
      id: `item-${Date.now()}`,
      icon: 'Star',
      text: 'Novo Item',
    };
    onChange({ items: [...config.items, newItem] });
  };

  const updateItem = (index: number, updates: Partial<typeof config.items[0]>) => {
    const newItems = [...config.items];
    newItems[index] = { ...newItems[index], ...updates };
    onChange({ items: newItems });
  };

  const removeItem = (index: number) => {
    const newItems = config.items.filter((_, i) => i !== index);
    onChange({ items: newItems });
  };

  // Ícones disponíveis (simplificado)
  const availableIcons = [
    'Star',
    'Award',
    'Truck',
    'Users',
    'CheckCircle',
    'Shield',
    'Zap',
    'Heart',
    'ThumbsUp',
    'Package',
  ];

  return (
    <div className="space-y-6">
      {/* Configurações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações Gerais</CardTitle>
          <CardDescription>Configure o marquee animado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Marquee Ativo</Label>
            <Switch
              checked={config.enabled}
              onCheckedChange={(enabled) => onChange({ enabled })}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Velocidade da Animação (segundos)</Label>
            <Input
              type="number"
              value={config.speed}
              onChange={(e) => onChange({ speed: Number(e.target.value) })}
              min="10"
              max="60"
            />
            <p className="text-xs text-muted-foreground">
              Tempo que o marquee leva para completar uma volta (recomendado: 30s)
            </p>
          </div>

          <Separator />

          <ColorPicker
            label="Cor de Fundo"
            value={config.backgroundColor || '#f3f4f6'}
            onChange={(backgroundColor) => onChange({ backgroundColor })}
            description="Cor de fundo do marquee"
          />

          <ColorPicker
            label="Cor do Texto"
            value={config.textColor || '#1f2937'}
            onChange={(textColor) => onChange({ textColor })}
            description="Cor do texto dos itens"
          />

          <ColorPicker
            label="Cor dos Ícones"
            value={config.iconColor || '#0ea5e9'}
            onChange={(iconColor) => onChange({ iconColor })}
            description="Cor dos ícones"
          />
        </CardContent>
      </Card>

      {/* Lista de Itens */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Itens do Marquee</CardTitle>
              <CardDescription>Adicione e edite os itens que aparecem no marquee</CardDescription>
            </div>
            <Button onClick={addItem} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {config.items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="mb-4">Nenhum item adicionado ainda</p>
              <Button onClick={addItem} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Item
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {config.items.map((item, index) => (
                <Card key={item.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Drag Handle */}
                      <div className="pt-2 cursor-move text-muted-foreground">
                        <GripVertical className="h-5 w-5" />
                      </div>

                      {/* Form Fields */}
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-sm">Ícone</Label>
                            <select
                              className="w-full px-3 py-2 border rounded-md text-sm"
                              value={item.icon}
                              onChange={(e) => updateItem(index, { icon: e.target.value })}
                            >
                              {availableIcons.map((icon) => (
                                <option key={icon} value={icon}>
                                  {icon}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm">Texto</Label>
                            <Input
                              value={item.text}
                              onChange={(e) => updateItem(index, { text: e.target.value })}
                              placeholder="Ex: Qualidade Garantida"
                            />
                          </div>
                        </div>

                        {/* Preview */}
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                          <span className="text-xs text-muted-foreground">Preview:</span>
                          <div
                            className="flex items-center gap-2"
                            style={{ color: config.iconColor }}
                          >
                            <span className="font-medium">{item.icon}</span>
                            <span
                              className="font-bold text-sm"
                              style={{ color: config.textColor }}
                            >
                              {item.text}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Delete Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Geral */}
      <Card>
        <CardHeader>
          <CardTitle>Preview do Marquee</CardTitle>
          <CardDescription>Visualização de como o marquee aparecerá</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="p-4 rounded-md overflow-hidden"
            style={{
              backgroundColor: config.backgroundColor || '#f3f4f6',
            }}
          >
            <div className="flex items-center gap-8 animate-marquee">
              {config.items.map((item, index) => (
                <div key={`${item.id}-${index}`} className="flex items-center gap-2 whitespace-nowrap">
                  <span style={{ color: config.iconColor }}>{item.icon}</span>
                  <span
                    className="font-bold"
                    style={{ color: config.textColor }}
                  >
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            * A animação real será mais suave na landing page
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
