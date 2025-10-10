/**
 * AboutEditor - Editor da seção Sobre
 */

import { AboutConfig } from '@/types/landingPage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ColorPicker, FontSelector } from '../StyleControls';
import { Separator } from '@/components/ui/separator';

interface AboutEditorProps {
  config: AboutConfig;
  onChange: (config: Partial<AboutConfig>) => void;
}

export const AboutEditor = ({ config, onChange }: AboutEditorProps) => {
  const updateTitle = (updates: Partial<AboutConfig['title']>) => {
    onChange({ title: { ...config.title, ...updates } });
  };

  const updateSubtitle = (updates: Partial<AboutConfig['subtitle']>) => {
    onChange({ subtitle: config.subtitle ? { ...config.subtitle, ...updates } : undefined });
  };

  const updateDescription = (updates: Partial<AboutConfig['description']>) => {
    onChange({ description: { ...config.description, ...updates } });
  };

  return (
    <div className="space-y-6">
      {/* Configurações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações Gerais</CardTitle>
          <CardDescription>Configure a visibilidade e conteúdo da seção Sobre</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Seção Ativa</Label>
            <Switch
              checked={config.enabled}
              onCheckedChange={(enabled) => onChange({ enabled })}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Título da Seção</Label>
            <Input
              value={config.title.text}
              onChange={(e) => updateTitle({ text: e.target.value })}
              placeholder="Sobre a Ferraco"
            />
          </div>

          {config.subtitle && (
            <div className="space-y-2">
              <Label>Subtítulo</Label>
              <Input
                value={config.subtitle.text}
                onChange={(e) => updateSubtitle({ text: e.target.value })}
                placeholder="Tradição e Inovação"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={config.description.text}
              onChange={(e) => updateDescription({ text: e.target.value })}
              placeholder="Descrição da empresa"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Estilos */}
      <Card>
        <CardHeader>
          <CardTitle>Estilos</CardTitle>
          <CardDescription>Personalize a aparência da seção</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FontSelector
            label="Tamanho do Título"
            value={config.title.style.fontSize || '2.25rem'}
            onChange={(fontSize) => updateTitle({ style: { ...config.title.style, fontSize } })}
            type="size"
          />

          <ColorPicker
            label="Cor do Título"
            value={config.title.style.textColor || '#000000'}
            onChange={(textColor) => updateTitle({ style: { ...config.title.style, textColor } })}
          />

          <FontSelector
            label="Peso do Título"
            value={config.title.style.fontWeight || '700'}
            onChange={(fontWeight) => updateTitle({ style: { ...config.title.style, fontWeight } })}
            type="weight"
          />

          <Separator />

          <ColorPicker
            label="Cor de Fundo da Seção"
            value={config.style.backgroundColor || '#ffffff'}
            onChange={(backgroundColor) =>
              onChange({ style: { ...config.style, backgroundColor } })
            }
          />

          <p className="text-sm text-muted-foreground mt-4">
            💡 Dica: Use o ArrayEditor em ProductsEditor como referência para adicionar cards de
            valores, estatísticas e diferenciais dinamicamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
