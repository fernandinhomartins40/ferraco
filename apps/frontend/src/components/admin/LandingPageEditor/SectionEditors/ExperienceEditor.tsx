/**
 * ExperienceEditor - Editor simplificado da seção de Experiência
 * Apenas textos editáveis
 */

import { ExperienceConfig } from '@/types/landingPage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface ExperienceEditorProps {
  config: ExperienceConfig;
  onChange: (config: Partial<ExperienceConfig>) => void;
}

export const ExperienceEditor = ({ config, onChange }: ExperienceEditorProps) => {
  const updateTitle = (text: string) => {
    onChange({ title: { ...config.title, text } });
  };

  const updateSubtitle = (text: string) => {
    if (config.subtitle) {
      onChange({ subtitle: { ...config.subtitle, text } });
    }
  };

  const updateDescription = (text: string) => {
    onChange({ description: { ...config.description, text } });
  };

  const updateHighlight = (index: number, field: 'value' | 'label', value: string) => {
    const newHighlights = [...config.highlights];
    newHighlights[index] = { ...newHighlights[index], [field]: value };
    onChange({ highlights: newHighlights });
  };

  const addHighlight = () => {
    const newHighlight = {
      id: `highlight-${Date.now()}`,
      value: '0',
      label: 'Novo Destaque',
      icon: 'Award',
    };
    onChange({ highlights: [...config.highlights, newHighlight] });
  };

  const removeHighlight = (index: number) => {
    const newHighlights = config.highlights.filter((_, i) => i !== index);
    onChange({ highlights: newHighlights });
  };

  return (
    <div className="space-y-6">
      {/* Textos Principais */}
      <Card>
        <CardHeader>
          <CardTitle>Textos da Seção Experiência</CardTitle>
          <CardDescription>Edite os textos principais da seção</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Título da Seção</Label>
            <Input
              value={config.title.text}
              onChange={(e) => updateTitle(e.target.value)}
              placeholder="Nossa Experiência"
            />
            <p className="text-xs text-muted-foreground">
              Título principal que aparece no topo da seção
            </p>
          </div>

          <Separator />

          {config.subtitle && (
            <>
              <div className="space-y-2">
                <Label>Subtítulo</Label>
                <Input
                  value={config.subtitle.text}
                  onChange={(e) => updateSubtitle(e.target.value)}
                  placeholder="Anos de Dedicação"
                />
                <p className="text-xs text-muted-foreground">
                  Subtítulo que aparece abaixo do título principal
                </p>
              </div>
              <Separator />
            </>
          )}

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={config.description.text}
              onChange={(e) => updateDescription(e.target.value)}
              placeholder="Descrição da experiência da empresa..."
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              Texto descritivo sobre a experiência da empresa
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Destaques/Highlights */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Destaques Numéricos</CardTitle>
              <CardDescription>Edite os números e labels dos destaques</CardDescription>
            </div>
            <Button onClick={addHighlight} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {config.highlights.map((highlight, index) => (
              <Card key={highlight.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-sm">Valor/Número {index + 1}</Label>
                        <Input
                          value={highlight.value}
                          onChange={(e) => updateHighlight(index, 'value', e.target.value)}
                          placeholder="Ex: 25+"
                        />
                        <p className="text-xs text-muted-foreground">
                          Número ou valor principal (Ex: 25+, 1000+)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Label/Descrição</Label>
                        <Input
                          value={highlight.label}
                          onChange={(e) => updateHighlight(index, 'label', e.target.value)}
                          placeholder="Ex: Anos de experiência"
                        />
                        <p className="text-xs text-muted-foreground">
                          Texto que explica o número
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeHighlight(index)}
                      className="text-destructive hover:text-destructive mt-6"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {config.highlights.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-4">Nenhum destaque adicionado</p>
                <Button onClick={addHighlight} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Destaque
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
