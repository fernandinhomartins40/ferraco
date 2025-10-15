/**
 * AboutEditor - Editor da seção Sobre
 */

import { AboutConfig } from '@/types/landingPage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IconSelector, ColorPicker } from '../StyleControls';

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

  const updateStats = (index: number, field: 'value' | 'label', value: string) => {
    if (!config.stats) return;
    const newStats = [...config.stats];
    newStats[index] = { ...newStats[index], [field]: value };
    onChange({ stats: newStats });
  };

  const addStat = () => {
    const newStat = {
      id: `stat-${Date.now()}`,
      value: '0',
      label: 'Nova Estatística',
    };
    onChange({ stats: [...(config.stats || []), newStat] });
  };

  const removeStat = (index: number) => {
    if (!config.stats) return;
    const newStats = config.stats.filter((_, i) => i !== index);
    onChange({ stats: newStats });
  };

  const updateExperience = (field: keyof typeof config.experience, value: any) => {
    onChange({
      experience: {
        ...(config.experience || { enabled: true, title: '', description: '' }),
        [field]: value,
      },
    });
  };

  const updateExperienceButton = (updates: any) => {
    onChange({
      experience: {
        ...(config.experience || { enabled: true, title: '', description: '' }),
        button: {
          ...(config.experience?.button || { text: '', href: '' }),
          ...updates,
        },
      },
    });
  };

  const updateDifferentialsCard = (field: keyof typeof config.differentialsCard, value: any) => {
    onChange({
      differentialsCard: {
        ...(config.differentialsCard || { enabled: true, title: '', differentials: [] }),
        [field]: value,
      },
    });
  };

  const updateDifferential = (index: number, field: 'text' | 'icon', value: string) => {
    if (!config.differentialsCard) return;
    const newDifferentials = [...config.differentialsCard.differentials];
    newDifferentials[index] = { ...newDifferentials[index], [field]: value };
    updateDifferentialsCard('differentials', newDifferentials);
  };

  const addDifferential = () => {
    const newDifferential = {
      id: `differential-${Date.now()}`,
      text: 'Novo Diferencial',
      icon: 'CheckCircle',
    };
    updateDifferentialsCard('differentials', [
      ...(config.differentialsCard?.differentials || []),
      newDifferential,
    ]);
  };

  const removeDifferential = (index: number) => {
    if (!config.differentialsCard) return;
    const newDifferentials = config.differentialsCard.differentials.filter((_, i) => i !== index);
    updateDifferentialsCard('differentials', newDifferentials);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="main">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="main">Principal</TabsTrigger>
          <TabsTrigger value="features">Características</TabsTrigger>
          <TabsTrigger value="experience">Experiência</TabsTrigger>
          <TabsTrigger value="differentials">Diferenciais</TabsTrigger>
        </TabsList>

        {/* Aba Principal */}
        <TabsContent value="main" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Textos Principais</CardTitle>
              <CardDescription>Edite os textos do topo da seção</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Título da Seção</Label>
                <Input
                  value={config.title.text}
                  onChange={(e) => updateTitle(e.target.value)}
                  placeholder="Sobre a Ferraco"
                />
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Características */}
        <TabsContent value="features" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Características</CardTitle>
                  <CardDescription>Cards com ícones no topo da seção</CardDescription>
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
                            <Label className="text-sm">Título</Label>
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
        </TabsContent>

        {/* Aba Experiência */}
        <TabsContent value="experience" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Seção "Anos de Experiência"</CardTitle>
              <CardDescription>Lado esquerdo da parte inferior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Seção Ativa</Label>
                <Switch
                  checked={config.experience?.enabled !== false}
                  onCheckedChange={(enabled) => updateExperience('enabled', enabled)}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={config.experience?.title || ''}
                  onChange={(e) => updateExperience('title', e.target.value)}
                  placeholder="25+ Anos de Experiência"
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={config.experience?.description || ''}
                  onChange={(e) => updateExperience('description', e.target.value)}
                  placeholder="Nossa trajetória é marcada..."
                  rows={4}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="text-base font-medium">Estatísticas</Label>
                <div className="space-y-3">
                  {(config.stats || []).map((stat, index) => (
                    <div key={stat.id} className="flex gap-3">
                      <Input
                        placeholder="5.000+"
                        value={stat.value}
                        onChange={(e) => updateStats(index, 'value', e.target.value)}
                        className="w-32"
                      />
                      <Input
                        placeholder="Clientes Atendidos"
                        value={stat.label}
                        onChange={(e) => updateStats(index, 'label', e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeStat(index)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button onClick={addStat} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Estatística
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="text-base font-medium">Botão</Label>

                <div className="space-y-2">
                  <Label>Texto do Botão</Label>
                  <Input
                    value={config.experience?.button?.text || ''}
                    onChange={(e) => updateExperienceButton({ text: e.target.value })}
                    placeholder="Conheça Nossa História"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Link (href)</Label>
                  <Input
                    value={config.experience?.button?.href || ''}
                    onChange={(e) => updateExperienceButton({ href: e.target.value })}
                    placeholder="#contato"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <ColorPicker
                    label="Cor de Fundo"
                    value={config.experience?.button?.style?.backgroundColor || '#10b981'}
                    onChange={(backgroundColor) =>
                      updateExperienceButton({
                        style: {
                          ...config.experience?.button?.style,
                          backgroundColor,
                        },
                      })
                    }
                  />
                  <ColorPicker
                    label="Cor do Texto"
                    value={config.experience?.button?.style?.textColor || '#ffffff'}
                    onChange={(textColor) =>
                      updateExperienceButton({
                        style: {
                          ...config.experience?.button?.style,
                          textColor,
                        },
                      })
                    }
                  />
                </div>

                <Label className="text-sm font-medium">Cores no Hover</Label>
                <div className="grid grid-cols-2 gap-4">
                  <ColorPicker
                    label="Fundo (hover)"
                    value={config.experience?.button?.style?.hover?.backgroundColor || '#059669'}
                    onChange={(backgroundColor) =>
                      updateExperienceButton({
                        style: {
                          ...config.experience?.button?.style,
                          hover: {
                            ...config.experience?.button?.style?.hover,
                            backgroundColor,
                          },
                        },
                      })
                    }
                  />
                  <ColorPicker
                    label="Texto (hover)"
                    value={config.experience?.button?.style?.hover?.textColor || '#ffffff'}
                    onChange={(textColor) =>
                      updateExperienceButton({
                        style: {
                          ...config.experience?.button?.style,
                          hover: {
                            ...config.experience?.button?.style?.hover,
                            textColor,
                          },
                        },
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Diferenciais */}
        <TabsContent value="differentials" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Card "Nossos Diferenciais"</CardTitle>
              <CardDescription>Lado direito da parte inferior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Card Ativo</Label>
                <Switch
                  checked={config.differentialsCard?.enabled !== false}
                  onCheckedChange={(enabled) => updateDifferentialsCard('enabled', enabled)}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Título do Card</Label>
                <Input
                  value={config.differentialsCard?.title || ''}
                  onChange={(e) => updateDifferentialsCard('title', e.target.value)}
                  placeholder="Nossos Diferenciais"
                />
              </div>

              <div className="space-y-2">
                <Label>Ícone do Título</Label>
                <IconSelector
                  label=""
                  value={config.differentialsCard?.icon || 'Target'}
                  onChange={(icon) => updateDifferentialsCard('icon', icon)}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Lista de Diferenciais</Label>
                  <Button onClick={addDifferential} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>

                <div className="space-y-3">
                  {(config.differentialsCard?.differentials || []).map((differential, index) => (
                    <div key={differential.id} className="flex gap-3 items-start">
                      <IconSelector
                        label=""
                        value={differential.icon || 'CheckCircle'}
                        onChange={(icon) => updateDifferential(index, 'icon', icon)}
                      />
                      <Input
                        value={differential.text}
                        onChange={(e) => updateDifferential(index, 'text', e.target.value)}
                        placeholder="Certificação ISO 9001:2015"
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeDifferential(index)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {(!config.differentialsCard?.differentials || config.differentialsCard.differentials.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="mb-4">Nenhum diferencial adicionado</p>
                    <Button onClick={addDifferential} variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Primeiro Diferencial
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
