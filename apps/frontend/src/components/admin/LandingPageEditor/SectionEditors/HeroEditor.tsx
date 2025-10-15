/**
 * HeroEditor - Editor da seção Hero com suporte a slides
 */

import React from 'react';
import { HeroConfig, HeroSlide } from '@/types/landingPage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ColorPicker, FontSelector, ImageUploader, IconSelector } from '../StyleControls';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { generateUUID } from '@/utils/uuid';

interface HeroEditorProps {
  config: HeroConfig;
  onChange: (config: Partial<HeroConfig>) => void;
}

export const HeroEditor = ({ config, onChange }: HeroEditorProps) => {
  const [activeSlideIndex, setActiveSlideIndex] = React.useState(0);

  // Inicializar slides se não existir
  React.useEffect(() => {
    if (!config.slides || config.slides.length === 0) {
      const defaultSlide: HeroSlide = {
        id: generateUUID(),
        title: {
          text: 'Equipamentos para Pecuária Leiteira',
          style: {
            fontSize: '3rem',
            fontWeight: '700',
            textColor: '#ffffff',
          },
        },
        subtitle: {
          text: 'Há mais de 25 anos fornecendo soluções de alta qualidade',
          style: {
            fontSize: '1.5rem',
            fontWeight: '500',
            textColor: '#ffffff',
          },
        },
        description: {
          text: 'Especialistas em equipamentos para pecuária leiteira',
          style: {
            fontSize: '1.125rem',
            textColor: '#ffffff',
          },
        },
        buttons: {
          primary: {
            text: 'Conhecer Produtos',
            href: '#produtos',
            variant: 'primary',
          },
          secondary: {
            text: 'Solicitar Orçamento',
            href: '#contato',
            variant: 'outline',
          },
          alignment: 'center',
        },
        background: {
          type: 'gradient',
          gradient: {
            from: '#667eea',
            to: '#764ba2',
            direction: 'to right',
          },
          overlay: {
            enabled: true,
            color: '#000000',
            opacity: 40,
          },
        },
      };

      onChange({
        slides: [defaultSlide],
        autoPlay: config.autoPlay !== false,
        autoPlayInterval: config.autoPlayInterval || 5,
        showNavigation: config.showNavigation !== false,
        showIndicators: config.showIndicators !== false,
      });
    }
  }, []);

  const activeSlide = config.slides?.[activeSlideIndex];

  // Guard: prevent render if no active slide
  if (!activeSlide) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Inicializando slides...</p>
      </div>
    );
  }

  const updateSlide = (index: number, updates: Partial<HeroSlide>) => {
    const newSlides = [...config.slides];
    newSlides[index] = { ...newSlides[index], ...updates };
    onChange({ slides: newSlides });
  };

  const addSlide = () => {
    const newSlide: HeroSlide = {
      id: generateUUID(),
      title: {
        text: 'Novo Slide',
        style: {
          fontSize: '3rem',
          fontWeight: '700',
          textColor: '#ffffff',
        },
      },
      subtitle: {
        text: 'Subtítulo do slide',
        style: {
          fontSize: '1.5rem',
          fontWeight: '500',
          textColor: '#ffffff',
        },
      },
      description: {
        text: 'Descrição do slide',
        style: {
          fontSize: '1.125rem',
          textColor: '#ffffff',
        },
      },
      buttons: {
        primary: {
          text: 'Saiba Mais',
          href: '#',
          variant: 'primary',
        },
        alignment: 'center',
      },
      background: {
        type: 'gradient',
        gradient: {
          from: '#667eea',
          to: '#764ba2',
          direction: 'to right',
        },
        overlay: {
          enabled: true,
          color: '#000000',
          opacity: 40,
        },
      },
    };
    onChange({ slides: [...config.slides, newSlide] });
    setActiveSlideIndex(config.slides.length);
  };

  const removeSlide = (index: number) => {
    if (config.slides.length <= 1) {
      alert('É necessário ter pelo menos 1 slide');
      return;
    }
    const newSlides = config.slides.filter((_, i) => i !== index);
    onChange({ slides: newSlides });
    if (activeSlideIndex >= newSlides.length) {
      setActiveSlideIndex(newSlides.length - 1);
    }
  };

  const moveSlide = (index: number, direction: 'up' | 'down') => {
    const newSlides = [...config.slides];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newSlides.length) return;

    [newSlides[index], newSlides[newIndex]] = [newSlides[newIndex], newSlides[index]];
    onChange({ slides: newSlides });
    setActiveSlideIndex(newIndex);
  };

  const updateTitle = (updates: Partial<HeroSlide['title']>) => {
    updateSlide(activeSlideIndex, {
      title: { ...activeSlide.title, ...updates },
    });
  };

  const updateSubtitle = (updates: Partial<HeroSlide['subtitle']>) => {
    updateSlide(activeSlideIndex, {
      subtitle: { ...activeSlide.subtitle, ...updates },
    });
  };

  const updateDescription = (updates: Partial<HeroSlide['description']>) => {
    updateSlide(activeSlideIndex, {
      description: { ...activeSlide.description, ...updates },
    });
  };

  const updatePrimaryButton = (updates: Partial<HeroSlide['buttons']['primary']>) => {
    updateSlide(activeSlideIndex, {
      buttons: {
        ...activeSlide.buttons,
        primary: activeSlide.buttons.primary
          ? { ...activeSlide.buttons.primary, ...updates }
          : undefined,
      },
    });
  };

  const updateSecondaryButton = (updates: Partial<HeroSlide['buttons']['secondary']>) => {
    updateSlide(activeSlideIndex, {
      buttons: {
        ...activeSlide.buttons,
        secondary: activeSlide.buttons.secondary
          ? { ...activeSlide.buttons.secondary, ...updates }
          : undefined,
      },
    });
  };

  const updateBackground = (updates: Partial<HeroSlide['background']>) => {
    updateSlide(activeSlideIndex, {
      background: { ...activeSlide.background, ...updates },
    });
  };

  if (!activeSlide) return null;

  return (
    <div className="space-y-6">
      {/* Configurações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações Gerais do Hero</CardTitle>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Auto-play</Label>
              <Switch
                checked={config.autoPlay}
                onCheckedChange={(autoPlay) => onChange({ autoPlay })}
              />
            </div>

            <div className="space-y-2">
              <Label>Intervalo (segundos)</Label>
              <Input
                type="number"
                value={config.autoPlayInterval}
                onChange={(e) => onChange({ autoPlayInterval: Number(e.target.value) })}
                disabled={!config.autoPlay}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label>Mostrar Setas</Label>
              <Switch
                checked={config.showNavigation}
                onCheckedChange={(showNavigation) => onChange({ showNavigation })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Mostrar Indicadores</Label>
              <Switch
                checked={config.showIndicators}
                onCheckedChange={(showIndicators) => onChange({ showIndicators })}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Layout</Label>
            <Select value={config.layout} onValueChange={(layout: any) => onChange({ layout })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="centered">Centralizado</SelectItem>
                <SelectItem value="split">Dividido</SelectItem>
                <SelectItem value="fullscreen">Tela Cheia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Altura</Label>
            <Select value={config.height} onValueChange={(height) => onChange({ height })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Automático</SelectItem>
                <SelectItem value="screen">Altura da Tela</SelectItem>
                <SelectItem value="600px">600px</SelectItem>
                <SelectItem value="800px">800px</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Gerenciamento de Slides */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Slides ({config.slides.length})</CardTitle>
              <CardDescription>Gerencie os slides do Hero</CardDescription>
            </div>
            <Button onClick={addSlide} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Novo Slide
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {config.slides.map((slide, index) => (
              <div
                key={slide.id}
                className={`flex items-center gap-2 p-3 rounded-lg border ${
                  index === activeSlideIndex ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setActiveSlideIndex(index)}
                  className="flex-1 justify-start"
                >
                  <span className="font-medium">
                    Slide {index + 1}: {slide.title.text}
                  </span>
                </Button>

                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveSlide(index, 'up')}
                    disabled={index === 0}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveSlide(index, 'down')}
                    disabled={index === config.slides.length - 1}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSlide(index)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Editor do Slide Ativo */}
      <Card>
        <CardHeader>
          <CardTitle>Editando: Slide {activeSlideIndex + 1}</CardTitle>
          <CardDescription>Configure o conteúdo deste slide</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="content">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content">Conteúdo</TabsTrigger>
              <TabsTrigger value="buttons">Botões</TabsTrigger>
              <TabsTrigger value="background">Fundo</TabsTrigger>
            </TabsList>

            {/* Conteúdo */}
            <TabsContent value="content" className="space-y-4 mt-4">
              {/* Título */}
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={activeSlide.title.text}
                  onChange={(e) => updateTitle({ text: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Texto Destacado (opcional)</Label>
                <Input
                  value={activeSlide.title.highlight || ''}
                  onChange={(e) => updateTitle({ highlight: e.target.value })}
                  placeholder="Palavra para destacar"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FontSelector
                  label="Tamanho"
                  value={activeSlide.title.style.fontSize || '3rem'}
                  onChange={(fontSize) =>
                    updateTitle({ style: { ...activeSlide.title.style, fontSize } })
                  }
                  type="size"
                />
                <ColorPicker
                  label="Cor"
                  value={activeSlide.title.style.textColor || '#ffffff'}
                  onChange={(textColor) =>
                    updateTitle({ style: { ...activeSlide.title.style, textColor } })
                  }
                />
              </div>

              <Separator />

              {/* Subtítulo */}
              <div className="space-y-2">
                <Label>Subtítulo</Label>
                <Input
                  value={activeSlide.subtitle.text}
                  onChange={(e) => updateSubtitle({ text: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FontSelector
                  label="Tamanho"
                  value={activeSlide.subtitle.style.fontSize || '1.5rem'}
                  onChange={(fontSize) =>
                    updateSubtitle({ style: { ...activeSlide.subtitle.style, fontSize } })
                  }
                  type="size"
                />
                <ColorPicker
                  label="Cor"
                  value={activeSlide.subtitle.style.textColor || '#ffffff'}
                  onChange={(textColor) =>
                    updateSubtitle({ style: { ...activeSlide.subtitle.style, textColor } })
                  }
                />
              </div>

              <Separator />

              {/* Descrição */}
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={activeSlide.description.text}
                  onChange={(e) => updateDescription({ text: e.target.value })}
                  rows={3}
                />
              </div>

              <ColorPicker
                label="Cor da Descrição"
                value={activeSlide.description.style.textColor || '#ffffff'}
                onChange={(textColor) =>
                  updateDescription({ style: { ...activeSlide.description.style, textColor } })
                }
              />
            </TabsContent>

            {/* Botões */}
            <TabsContent value="buttons" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Alinhamento dos Botões</Label>
                <Select
                  value={activeSlide.buttons.alignment}
                  onValueChange={(alignment: any) =>
                    updateSlide(activeSlideIndex, {
                      buttons: { ...activeSlide.buttons, alignment },
                    })
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Esquerda</SelectItem>
                    <SelectItem value="center">Centro</SelectItem>
                    <SelectItem value="right">Direita</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Botão Primário */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold">Botão Primário</Label>
                {activeSlide.buttons.primary && (
                  <>
                    <div className="space-y-2">
                      <Label>Texto</Label>
                      <Input
                        placeholder="Texto do botão"
                        value={activeSlide.buttons.primary.text}
                        onChange={(e) => updatePrimaryButton({ text: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Link (href)</Label>
                      <Input
                        placeholder="#produtos, #contato, etc"
                        value={activeSlide.buttons.primary.href}
                        onChange={(e) => updatePrimaryButton({ href: e.target.value })}
                      />
                    </div>

                    <IconSelector
                      label="Ícone"
                      value={activeSlide.buttons.primary.icon || ''}
                      onChange={(icon) => updatePrimaryButton({ icon })}
                    />

                    <Separator />

                    {/* Estilos do Botão Primário */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">Cores do Botão</Label>

                      <div className="grid grid-cols-2 gap-4">
                        <ColorPicker
                          label="Cor de Fundo"
                          value={activeSlide.buttons.primary.style?.backgroundColor || '#10b981'}
                          onChange={(backgroundColor) =>
                            updatePrimaryButton({
                              style: {
                                ...activeSlide.buttons.primary?.style,
                                backgroundColor,
                              },
                            })
                          }
                        />
                        <ColorPicker
                          label="Cor do Texto"
                          value={activeSlide.buttons.primary.style?.textColor || '#ffffff'}
                          onChange={(textColor) =>
                            updatePrimaryButton({
                              style: {
                                ...activeSlide.buttons.primary?.style,
                                textColor,
                              },
                            })
                          }
                        />
                      </div>

                      <Label className="text-base font-medium mt-4">Cores no Hover</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <ColorPicker
                          label="Fundo (hover)"
                          value={activeSlide.buttons.primary.style?.hover?.backgroundColor || '#059669'}
                          onChange={(backgroundColor) =>
                            updatePrimaryButton({
                              style: {
                                ...activeSlide.buttons.primary?.style,
                                hover: {
                                  ...activeSlide.buttons.primary?.style?.hover,
                                  backgroundColor,
                                },
                              },
                            })
                          }
                        />
                        <ColorPicker
                          label="Texto (hover)"
                          value={activeSlide.buttons.primary.style?.hover?.textColor || '#ffffff'}
                          onChange={(textColor) =>
                            updatePrimaryButton({
                              style: {
                                ...activeSlide.buttons.primary?.style,
                                hover: {
                                  ...activeSlide.buttons.primary?.style?.hover,
                                  textColor,
                                },
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <Separator />

              {/* Botão Secundário */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold">Botão Secundário</Label>
                {activeSlide.buttons.secondary ? (
                  <>
                    <div className="space-y-2">
                      <Label>Texto</Label>
                      <Input
                        placeholder="Texto do botão"
                        value={activeSlide.buttons.secondary.text}
                        onChange={(e) => updateSecondaryButton({ text: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Link (href)</Label>
                      <Input
                        placeholder="#produtos, #contato, etc"
                        value={activeSlide.buttons.secondary.href}
                        onChange={(e) => updateSecondaryButton({ href: e.target.value })}
                      />
                    </div>

                    <IconSelector
                      label="Ícone"
                      value={activeSlide.buttons.secondary.icon || ''}
                      onChange={(icon) => updateSecondaryButton({ icon })}
                    />

                    <Separator />

                    {/* Estilos do Botão Secundário */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">Cores do Botão</Label>

                      <div className="grid grid-cols-2 gap-4">
                        <ColorPicker
                          label="Cor de Fundo"
                          value={activeSlide.buttons.secondary.style?.backgroundColor || 'transparent'}
                          onChange={(backgroundColor) =>
                            updateSecondaryButton({
                              style: {
                                ...activeSlide.buttons.secondary?.style,
                                backgroundColor,
                              },
                            })
                          }
                        />
                        <ColorPicker
                          label="Cor do Texto"
                          value={activeSlide.buttons.secondary.style?.textColor || '#ffffff'}
                          onChange={(textColor) =>
                            updateSecondaryButton({
                              style: {
                                ...activeSlide.buttons.secondary?.style,
                                textColor,
                              },
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Cor da Borda</Label>
                        <ColorPicker
                          label=""
                          value={activeSlide.buttons.secondary.style?.border?.replace('1px solid ', '') || '#ffffff'}
                          onChange={(borderColor) =>
                            updateSecondaryButton({
                              style: {
                                ...activeSlide.buttons.secondary?.style,
                                border: `1px solid ${borderColor}`,
                              },
                            })
                          }
                        />
                      </div>

                      <Label className="text-base font-medium mt-4">Cores no Hover</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <ColorPicker
                          label="Fundo (hover)"
                          value={activeSlide.buttons.secondary.style?.hover?.backgroundColor || '#ffffff'}
                          onChange={(backgroundColor) =>
                            updateSecondaryButton({
                              style: {
                                ...activeSlide.buttons.secondary?.style,
                                hover: {
                                  ...activeSlide.buttons.secondary?.style?.hover,
                                  backgroundColor,
                                },
                              },
                            })
                          }
                        />
                        <ColorPicker
                          label="Texto (hover)"
                          value={activeSlide.buttons.secondary.style?.hover?.textColor || '#667eea'}
                          onChange={(textColor) =>
                            updateSecondaryButton({
                              style: {
                                ...activeSlide.buttons.secondary?.style,
                                hover: {
                                  ...activeSlide.buttons.secondary?.style?.hover,
                                  textColor,
                                },
                              },
                            })
                          }
                        />
                      </div>
                    </div>

                    <Separator />

                    <Button
                      variant="outline"
                      onClick={() =>
                        updateSlide(activeSlideIndex, {
                          buttons: { ...activeSlide.buttons, secondary: undefined },
                        })
                      }
                    >
                      Remover Botão Secundário
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() =>
                      updateSlide(activeSlideIndex, {
                        buttons: {
                          ...activeSlide.buttons,
                          secondary: {
                            text: 'Botão Secundário',
                            href: '#',
                            variant: 'outline',
                            style: {
                              backgroundColor: 'transparent',
                              textColor: '#ffffff',
                              border: '1px solid #ffffff',
                              hover: {
                                backgroundColor: '#ffffff',
                                textColor: '#667eea',
                              },
                            },
                          },
                        },
                      })
                    }
                  >
                    Adicionar Botão Secundário
                  </Button>
                )}
              </div>
            </TabsContent>

            {/* Background */}
            <TabsContent value="background" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Tipo de Fundo</Label>
                <Select
                  value={activeSlide.background.type}
                  onValueChange={(type: any) => updateBackground({ type })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="color">Cor Sólida</SelectItem>
                    <SelectItem value="gradient">Gradiente</SelectItem>
                    <SelectItem value="image">Imagem</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {activeSlide.background.type === 'color' && (
                <ColorPicker
                  label="Cor do Fundo"
                  value={activeSlide.background.color || '#ffffff'}
                  onChange={(color) => updateBackground({ color })}
                />
              )}

              {activeSlide.background.type === 'gradient' && activeSlide.background.gradient && (
                <>
                  <ColorPicker
                    label="Cor Inicial"
                    value={activeSlide.background.gradient.from}
                    onChange={(from) =>
                      updateBackground({
                        gradient: { ...activeSlide.background.gradient!, from },
                      })
                    }
                  />
                  <ColorPicker
                    label="Cor Final"
                    value={activeSlide.background.gradient.to}
                    onChange={(to) =>
                      updateBackground({
                        gradient: { ...activeSlide.background.gradient!, to },
                      })
                    }
                  />
                  <div className="space-y-2">
                    <Label>Direção</Label>
                    <Select
                      value={activeSlide.background.gradient.direction}
                      onValueChange={(direction) =>
                        updateBackground({
                          gradient: { ...activeSlide.background.gradient!, direction },
                        })
                      }
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="to right">Horizontal →</SelectItem>
                        <SelectItem value="to left">Horizontal ←</SelectItem>
                        <SelectItem value="to bottom">Vertical ↓</SelectItem>
                        <SelectItem value="to top">Vertical ↑</SelectItem>
                        <SelectItem value="to bottom right">Diagonal ↘</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {activeSlide.background.type === 'image' && (
                <ImageUploader
                  label="Imagem de Fundo"
                  value={activeSlide.background.image || { url: '', alt: '' }}
                  onChange={(image) => updateBackground({ image })}
                  enableCrop={true}
                  cropAspectRatio={16 / 9}
                  cropTargetWidth={1920}
                  cropTargetHeight={1080}
                  cropTitle="Recortar Imagem de Fundo"
                  description="Imagens serão recortadas em 1920x1080px (16:9)"
                />
              )}

              <Separator />

              {/* Overlay */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Overlay Escuro</Label>
                  <Switch
                    checked={activeSlide.background.overlay?.enabled}
                    onCheckedChange={(enabled) =>
                      updateBackground({
                        overlay: {
                          ...activeSlide.background.overlay!,
                          enabled,
                        },
                      })
                    }
                  />
                </div>

                {activeSlide.background.overlay?.enabled && (
                  <>
                    <div className="space-y-2">
                      <Label>Opacidade: {activeSlide.background.overlay.opacity}%</Label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={activeSlide.background.overlay.opacity}
                        onChange={(e) =>
                          updateBackground({
                            overlay: {
                              ...activeSlide.background.overlay!,
                              opacity: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full"
                      />
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
