/**
 * ExperienceEditor - Editor da seção de Experiência
 */

import { ExperienceConfig } from '@/types/landingPage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ColorPicker, FontSelector } from '../StyleControls';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface ExperienceEditorProps {
  config: ExperienceConfig;
  onChange: (config: Partial<ExperienceConfig>) => void;
}

export const ExperienceEditor = ({ config, onChange }: ExperienceEditorProps) => {
  const updateTitle = (updates: Partial<ExperienceConfig['title']>) => {
    onChange({ title: { ...config.title, ...updates } });
  };

  const updateSubtitle = (updates: Partial<ExperienceConfig['subtitle']>) => {
    onChange({ subtitle: config.subtitle ? { ...config.subtitle, ...updates } : undefined });
  };

  const updateDescription = (updates: Partial<ExperienceConfig['description']>) => {
    onChange({ description: { ...config.description, ...updates } });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações Gerais</CardTitle>
          <CardDescription>Configure a seção de Experiência</CardDescription>
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
            <Label>Título</Label>
            <Input
              value={config.title.text}
              onChange={(e) => updateTitle({ text: e.target.value })}
              placeholder="Nossa Experiência"
            />
          </div>

          {config.subtitle && (
            <div className="space-y-2">
              <Label>Subtítulo</Label>
              <Input
                value={config.subtitle.text}
                onChange={(e) => updateSubtitle({ text: e.target.value })}
                placeholder="Décadas de Excelência"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={config.description.text}
              onChange={(e) => updateDescription({ text: e.target.value })}
              rows={3}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Layout</Label>
            <Select
              value={config.layout}
              onValueChange={(layout: any) => onChange({ layout })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="simple">Simples</SelectItem>
                <SelectItem value="highlights">Com Destaques</SelectItem>
                <SelectItem value="timeline">Linha do Tempo</SelectItem>
                <SelectItem value="full">Completo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Estilos */}
      <Card>
        <CardHeader>
          <CardTitle>Estilos</CardTitle>
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
            value={config.title.style.textColor || '#ffffff'}
            onChange={(textColor) => updateTitle({ style: { ...config.title.style, textColor } })}
          />

          <Separator />

          <div className="space-y-2">
            <Label>Tipo de Background</Label>
            <Select
              value={config.background.type}
              onValueChange={(type: any) =>
                onChange({ background: { ...config.background, type } })
              }
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="color">Cor Sólida</SelectItem>
                <SelectItem value="gradient">Gradiente</SelectItem>
                <SelectItem value="image">Imagem</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {config.background.type === 'gradient' && config.background.gradient && (
            <>
              <ColorPicker
                label="Cor Inicial do Gradiente"
                value={config.background.gradient.from}
                onChange={(from) =>
                  onChange({
                    background: {
                      ...config.background,
                      gradient: { ...config.background.gradient!, from },
                    },
                  })
                }
              />

              <ColorPicker
                label="Cor Final do Gradiente"
                value={config.background.gradient.to}
                onChange={(to) =>
                  onChange({
                    background: {
                      ...config.background,
                      gradient: { ...config.background.gradient!, to },
                    },
                  })
                }
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
