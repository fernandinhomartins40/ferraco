/**
 * ExperienceEditor - Editor completo da seção de Experiência
 */

import { ExperienceConfig } from '@/types/landingPage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { IconSelector, ColorPicker } from '../StyleControls';

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

  const updateHighlight = (index: number, field: 'value' | 'label' | 'description' | 'icon', value: string) => {
    const newHighlights = [...config.highlights];
    newHighlights[index] = { ...newHighlights[index], [field]: value };
    onChange({ highlights: newHighlights });
  };

  const addHighlight = () => {
    const newHighlight = {
      id: `highlight-${Date.now()}`,
      value: '0',
      label: 'Novo Destaque',
      description: '',
      icon: 'Award',
    };
    onChange({ highlights: [...config.highlights, newHighlight] });
  };

  const removeHighlight = (index: number) => {
    const newHighlights = config.highlights.filter((_, i) => i !== index);
    onChange({ highlights: newHighlights });
  };

  // Testimonials
  const updateTestimonials = (field: keyof typeof config.testimonials, value: any) => {
    onChange({
      testimonials: {
        ...(config.testimonials || { enabled: true, title: '', items: [] }),
        [field]: value,
      },
    });
  };

  const updateTestimonial = (index: number, field: string, value: string) => {
    if (!config.testimonials) return;
    const newItems = [...config.testimonials.items];
    newItems[index] = { ...newItems[index], [field]: value };
    updateTestimonials('items', newItems);
  };

  const addTestimonial = () => {
    const newTestimonial = {
      id: `testimonial-${Date.now()}`,
      quote: '',
      author: '',
      role: '',
      company: '',
    };
    updateTestimonials('items', [
      ...(config.testimonials?.items || []),
      newTestimonial,
    ]);
  };

  const removeTestimonial = (index: number) => {
    if (!config.testimonials) return;
    const newItems = config.testimonials.items.filter((_, i) => i !== index);
    updateTestimonials('items', newItems);
  };

  // CTA
  const updateCTA = (field: keyof typeof config.cta, value: any) => {
    onChange({
      cta: {
        ...(config.cta || { enabled: true, title: '', description: '', button: { text: '', href: '' } }),
        [field]: value,
      },
    });
  };

  const updateCTAButton = (updates: any) => {
    onChange({
      cta: {
        ...(config.cta || { enabled: true, title: '', description: '', button: { text: '', href: '' } }),
        button: {
          ...(config.cta?.button || { text: '', href: '' }),
          ...updates,
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="main">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="main">Principal</TabsTrigger>
          <TabsTrigger value="highlights">Destaques</TabsTrigger>
          <TabsTrigger value="testimonials">Testemunhos</TabsTrigger>
          <TabsTrigger value="cta">CTA Final</TabsTrigger>
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
                  placeholder="Experiência Comprovada"
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
                      placeholder="Anos de Dedicação"
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
                  placeholder="Números que refletem nossa dedicação..."
                  rows={5}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Destaques */}
        <TabsContent value="highlights" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Destaques Numéricos</CardTitle>
                  <CardDescription>Cards com números e ícones</CardDescription>
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
                        <div className="flex-1 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label className="text-sm">Valor/Número</Label>
                              <Input
                                value={highlight.value}
                                onChange={(e) => updateHighlight(index, 'value', e.target.value)}
                                placeholder="98%"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm">Label</Label>
                              <Input
                                value={highlight.label}
                                onChange={(e) => updateHighlight(index, 'label', e.target.value)}
                                placeholder="Satisfação dos Clientes"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm">Descrição</Label>
                            <Input
                              value={highlight.description || ''}
                              onChange={(e) => updateHighlight(index, 'description', e.target.value)}
                              placeholder="Taxa de satisfação baseada em pesquisas..."
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm">Ícone</Label>
                            <IconSelector
                              label=""
                              value={highlight.icon || 'Award'}
                              onChange={(icon) => updateHighlight(index, 'icon', icon)}
                            />
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeHighlight(index)}
                          className="text-destructive hover:text-destructive"
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
        </TabsContent>

        {/* Aba Testemunhos */}
        <TabsContent value="testimonials" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Testemunhos de Clientes</CardTitle>
              <CardDescription>Depoimentos e avaliações</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Seção Ativa</Label>
                <Switch
                  checked={config.testimonials?.enabled !== false}
                  onCheckedChange={(enabled) => updateTestimonials('enabled', enabled)}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Título da Seção de Testemunhos</Label>
                <Input
                  value={config.testimonials?.title || ''}
                  onChange={(e) => updateTestimonials('title', e.target.value)}
                  placeholder="O que nossos clientes dizem"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Lista de Testemunhos</Label>
                  <Button onClick={addTestimonial} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>

                {(config.testimonials?.items || []).map((testimonial, index) => (
                  <Card key={testimonial.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 space-y-3">
                          <div className="space-y-2">
                            <Label className="text-sm">Depoimento</Label>
                            <Textarea
                              value={testimonial.quote}
                              onChange={(e) => updateTestimonial(index, 'quote', e.target.value)}
                              placeholder="A FerrAço é nossa parceira há anos..."
                              rows={3}
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-2">
                              <Label className="text-sm">Nome</Label>
                              <Input
                                value={testimonial.author}
                                onChange={(e) => updateTestimonial(index, 'author', e.target.value)}
                                placeholder="João Silva"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm">Cargo</Label>
                              <Input
                                value={testimonial.role}
                                onChange={(e) => updateTestimonial(index, 'role', e.target.value)}
                                placeholder="Diretor de Produção"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm">Empresa</Label>
                              <Input
                                value={testimonial.company}
                                onChange={(e) => updateTestimonial(index, 'company', e.target.value)}
                                placeholder="Empresa XYZ"
                              />
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTestimonial(index)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {(!config.testimonials?.items || config.testimonials.items.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="mb-4">Nenhum testemunho adicionado</p>
                    <Button onClick={addTestimonial} variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Primeiro Testemunho
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba CTA */}
        <TabsContent value="cta" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Call-to-Action Final</CardTitle>
              <CardDescription>Card com botão no final da seção</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>CTA Ativo</Label>
                <Switch
                  checked={config.cta?.enabled !== false}
                  onCheckedChange={(enabled) => updateCTA('enabled', enabled)}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Título do CTA</Label>
                <Input
                  value={config.cta?.title || ''}
                  onChange={(e) => updateCTA('title', e.target.value)}
                  placeholder="Faça parte da nossa história de sucesso"
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={config.cta?.description || ''}
                  onChange={(e) => updateCTA('description', e.target.value)}
                  placeholder="Junte-se aos milhares de clientes..."
                  rows={3}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="text-base font-medium">Botão</Label>

                <div className="space-y-2">
                  <Label>Texto do Botão</Label>
                  <Input
                    value={config.cta?.button?.text || ''}
                    onChange={(e) => updateCTAButton({ text: e.target.value })}
                    placeholder="Quero Ser Cliente"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Link (href)</Label>
                  <Input
                    value={config.cta?.button?.href || ''}
                    onChange={(e) => updateCTAButton({ href: e.target.value })}
                    placeholder="#contato"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <ColorPicker
                    label="Cor de Fundo"
                    value={config.cta?.button?.style?.backgroundColor || '#10b981'}
                    onChange={(backgroundColor) =>
                      updateCTAButton({
                        style: {
                          ...config.cta?.button?.style,
                          backgroundColor,
                        },
                      })
                    }
                  />
                  <ColorPicker
                    label="Cor do Texto"
                    value={config.cta?.button?.style?.textColor || '#ffffff'}
                    onChange={(textColor) =>
                      updateCTAButton({
                        style: {
                          ...config.cta?.button?.style,
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
                    value={config.cta?.button?.style?.hover?.backgroundColor || '#059669'}
                    onChange={(backgroundColor) =>
                      updateCTAButton({
                        style: {
                          ...config.cta?.button?.style,
                          hover: {
                            ...config.cta?.button?.style?.hover,
                            backgroundColor,
                          },
                        },
                      })
                    }
                  />
                  <ColorPicker
                    label="Texto (hover)"
                    value={config.cta?.button?.style?.hover?.textColor || '#ffffff'}
                    onChange={(textColor) =>
                      updateCTAButton({
                        style: {
                          ...config.cta?.button?.style,
                          hover: {
                            ...config.cta?.button?.style?.hover,
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
      </Tabs>
    </div>
  );
};
