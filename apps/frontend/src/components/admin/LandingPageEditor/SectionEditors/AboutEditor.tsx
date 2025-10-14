/**
 * AboutEditor - Editor simplificado da seção Sobre
 * Apenas textos editáveis
 */

import { AboutConfig } from '@/types/landingPage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { IconSelector } from '../StyleControls';

interface AboutEditorProps {
  config: AboutConfig;
  onChange: (config: Partial<AboutConfig>) => void;
}

export const AboutEditor = ({ config, onChange }: AboutEditorProps) => {
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

  const updateFeature = (index: number, field: 'title' | 'description' | 'icon', value: string) => {
    const newFeatures = [...config.features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    onChange({ features: newFeatures });
  };

  const addFeature = () => {
    const newFeature = {
      id: `feature-${Date.now()}`,
      icon: 'CheckCircle',
      title: 'Nova Característica',
      description: 'Descrição da característica',
    };
    onChange({ features: [...config.features, newFeature] });
  };

  const removeFeature = (index: number) => {
    const newFeatures = config.features.filter((_, i) => i !== index);
    onChange({ features: newFeatures });
  };

  return (
    <div className="space-y-6">
      {/* Textos Principais */}
      <Card>
        <CardHeader>
          <CardTitle>Textos da Seção Sobre</CardTitle>
          <CardDescription>Edite os textos principais da seção</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Título da Seção</Label>
            <Input
              value={config.title.text}
              onChange={(e) => updateTitle(e.target.value)}
              placeholder="Sobre a Ferraco"
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
                  placeholder="Tradição e Inovação"
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
              placeholder="Descrição da empresa..."
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              Texto descritivo sobre a empresa (pode ter várias linhas)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Features/Características */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Características</CardTitle>
              <CardDescription>Edite os textos dos cards de características</CardDescription>
            </div>
            <Button onClick={addFeature} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {config.features.map((feature, index) => (
              <Card key={feature.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-3">
                      <div className="space-y-2">
                        <Label className="text-sm">Ícone</Label>
                        <IconSelector
                          label=""
                          value={feature.icon}
                          onChange={(icon) => updateFeature(index, 'icon', icon)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Título da Característica {index + 1}</Label>
                        <Input
                          value={feature.title}
                          onChange={(e) => updateFeature(index, 'title', e.target.value)}
                          placeholder="Ex: Qualidade Garantida"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Descrição</Label>
                        <Textarea
                          value={feature.description}
                          onChange={(e) => updateFeature(index, 'description', e.target.value)}
                          placeholder="Descrição da característica..."
                          rows={2}
                        />
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFeature(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {config.features.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-4">Nenhuma característica adicionada</p>
                <Button onClick={addFeature} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeira Característica
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
