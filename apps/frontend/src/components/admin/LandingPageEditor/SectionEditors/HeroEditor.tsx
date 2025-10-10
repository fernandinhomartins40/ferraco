/**
 * HeroEditor - Editor da seção Hero
 */

import { HeroConfig } from '@/types/landingPage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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

interface HeroEditorProps {
  config: HeroConfig;
  onChange: (config: Partial<HeroConfig>) => void;
}

export const HeroEditor = ({ config, onChange }: HeroEditorProps) => {
  const updateTitle = (updates: Partial<HeroConfig['title']>) => {
    onChange({ title: { ...config.title, ...updates } });
  };

  const updateSubtitle = (updates: Partial<HeroConfig['subtitle']>) => {
    onChange({ subtitle: { ...config.subtitle, ...updates } });
  };

  const updateDescription = (updates: Partial<HeroConfig['description']>) => {
    onChange({ description: { ...config.description, ...updates } });
  };

  const updatePrimaryButton = (updates: Partial<HeroConfig['buttons']['primary']>) => {
    onChange({
      buttons: {
        ...config.buttons,
        primary: config.buttons.primary
          ? { ...config.buttons.primary, ...updates }
          : undefined,
      },
    });
  };

  const updateSecondaryButton = (updates: Partial<HeroConfig['buttons']['secondary']>) => {
    onChange({
      buttons: {
        ...config.buttons,
        secondary: config.buttons.secondary
          ? { ...config.buttons.secondary, ...updates }
          : undefined,
      },
    });
  };

  const updateBackground = (updates: Partial<HeroConfig['background']>) => {
    onChange({ background: { ...config.background, ...updates } });
  };

  return (
    <div className="space-y-6">
      {/* Configurações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações Gerais</CardTitle>
          <CardDescription>Configure a visibilidade e layout da seção Hero</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="hero-enabled">Seção Ativa</Label>
            <Switch
              id="hero-enabled"
              checked={config.enabled}
              onCheckedChange={(enabled) => onChange({ enabled })}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Layout</Label>
            <Select value={config.layout} onValueChange={(layout: any) => onChange({ layout })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
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
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
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

      {/* Conteúdo */}
      <Card>
        <CardHeader>
          <CardTitle>Conteúdo</CardTitle>
          <CardDescription>Textos e mensagens da seção Hero</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="title">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="title">Título</TabsTrigger>
              <TabsTrigger value="subtitle">Subtítulo</TabsTrigger>
              <TabsTrigger value="description">Descrição</TabsTrigger>
            </TabsList>

            {/* Título */}
            <TabsContent value="title" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Texto Principal</Label>
                <Input
                  value={config.title.text}
                  onChange={(e) => updateTitle({ text: e.target.value })}
                  placeholder="Título principal"
                />
              </div>

              <div className="space-y-2">
                <Label>Texto Destacado</Label>
                <Input
                  value={config.title.highlight || ''}
                  onChange={(e) => updateTitle({ highlight: e.target.value })}
                  placeholder="Parte do título para destacar"
                />
              </div>

              <FontSelector
                label="Tamanho da Fonte"
                value={config.title.style.fontSize || '3rem'}
                onChange={(fontSize) => updateTitle({ style: { ...config.title.style, fontSize } })}
                type="size"
              />

              <FontSelector
                label="Peso da Fonte"
                value={config.title.style.fontWeight || '700'}
                onChange={(fontWeight) =>
                  updateTitle({ style: { ...config.title.style, fontWeight } })
                }
                type="weight"
              />

              <ColorPicker
                label="Cor do Texto"
                value={config.title.style.textColor || '#000000'}
                onChange={(textColor) => updateTitle({ style: { ...config.title.style, textColor } })}
              />
            </TabsContent>

            {/* Subtítulo */}
            <TabsContent value="subtitle" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Texto do Subtítulo</Label>
                <Input
                  value={config.subtitle.text}
                  onChange={(e) => updateSubtitle({ text: e.target.value })}
                  placeholder="Subtítulo"
                />
              </div>

              <FontSelector
                label="Tamanho da Fonte"
                value={config.subtitle.style.fontSize || '1.5rem'}
                onChange={(fontSize) =>
                  updateSubtitle({ style: { ...config.subtitle.style, fontSize } })
                }
                type="size"
              />

              <FontSelector
                label="Peso da Fonte"
                value={config.subtitle.style.fontWeight || '500'}
                onChange={(fontWeight) =>
                  updateSubtitle({ style: { ...config.subtitle.style, fontWeight } })
                }
                type="weight"
              />

              <ColorPicker
                label="Cor do Texto"
                value={config.subtitle.style.textColor || '#000000'}
                onChange={(textColor) =>
                  updateSubtitle({ style: { ...config.subtitle.style, textColor } })
                }
              />
            </TabsContent>

            {/* Descrição */}
            <TabsContent value="description" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Texto da Descrição</Label>
                <Textarea
                  value={config.description.text}
                  onChange={(e) => updateDescription({ text: e.target.value })}
                  placeholder="Descrição detalhada"
                  rows={4}
                />
              </div>

              <FontSelector
                label="Tamanho da Fonte"
                value={config.description.style.fontSize || '1.125rem'}
                onChange={(fontSize) =>
                  updateDescription({ style: { ...config.description.style, fontSize } })
                }
                type="size"
              />

              <ColorPicker
                label="Cor do Texto"
                value={config.description.style.textColor || '#000000'}
                onChange={(textColor) =>
                  updateDescription({ style: { ...config.description.style, textColor } })
                }
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Botões */}
      <Card>
        <CardHeader>
          <CardTitle>Botões de Ação</CardTitle>
          <CardDescription>Configure os botões CTA da seção Hero</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="primary">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="primary">Botão Primário</TabsTrigger>
              <TabsTrigger value="secondary">Botão Secundário</TabsTrigger>
            </TabsList>

            {/* Botão Primário */}
            <TabsContent value="primary" className="space-y-4 mt-4">
              {config.buttons.primary && (
                <>
                  <div className="space-y-2">
                    <Label>Texto do Botão</Label>
                    <Input
                      value={config.buttons.primary.text}
                      onChange={(e) => updatePrimaryButton({ text: e.target.value })}
                      placeholder="Ver Produtos"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Link (href)</Label>
                    <Input
                      value={config.buttons.primary.href}
                      onChange={(e) => updatePrimaryButton({ href: e.target.value })}
                      placeholder="#products"
                    />
                  </div>

                  <IconSelector
                    label="Ícone"
                    value={config.buttons.primary.icon || ''}
                    onChange={(icon) => updatePrimaryButton({ icon })}
                  />

                  <div className="space-y-2">
                    <Label>Posição do Ícone</Label>
                    <Select
                      value={config.buttons.primary.iconPosition || 'right'}
                      onValueChange={(iconPosition: any) =>
                        updatePrimaryButton({ iconPosition })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Esquerda</SelectItem>
                        <SelectItem value="right">Direita</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Botão Secundário */}
            <TabsContent value="secondary" className="space-y-4 mt-4">
              {config.buttons.secondary && (
                <>
                  <div className="space-y-2">
                    <Label>Texto do Botão</Label>
                    <Input
                      value={config.buttons.secondary.text}
                      onChange={(e) => updateSecondaryButton({ text: e.target.value })}
                      placeholder="Fale Conosco"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Link (href)</Label>
                    <Input
                      value={config.buttons.secondary.href}
                      onChange={(e) => updateSecondaryButton({ href: e.target.value })}
                      placeholder="#contact"
                    />
                  </div>

                  <IconSelector
                    label="Ícone"
                    value={config.buttons.secondary.icon || ''}
                    onChange={(icon) => updateSecondaryButton({ icon })}
                  />
                </>
              )}
            </TabsContent>
          </Tabs>

          <Separator className="my-4" />

          <div className="space-y-2">
            <Label>Alinhamento dos Botões</Label>
            <Select
              value={config.buttons.alignment}
              onValueChange={(alignment: any) =>
                onChange({ buttons: { ...config.buttons, alignment } })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Esquerda</SelectItem>
                <SelectItem value="center">Centro</SelectItem>
                <SelectItem value="right">Direita</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Background */}
      <Card>
        <CardHeader>
          <CardTitle>Plano de Fundo</CardTitle>
          <CardDescription>Configure o background da seção Hero</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de Background</Label>
            <Select
              value={config.background.type}
              onValueChange={(type: any) => updateBackground({ type })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="color">Cor Sólida</SelectItem>
                <SelectItem value="gradient">Gradiente</SelectItem>
                <SelectItem value="image">Imagem</SelectItem>
                <SelectItem value="video">Vídeo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {config.background.type === 'color' && (
            <ColorPicker
              label="Cor do Fundo"
              value={config.background.color || '#ffffff'}
              onChange={(color) => updateBackground({ color })}
            />
          )}

          {config.background.type === 'gradient' && config.background.gradient && (
            <>
              <ColorPicker
                label="Cor Inicial"
                value={config.background.gradient.from}
                onChange={(from) =>
                  updateBackground({
                    gradient: { ...config.background.gradient!, from },
                  })
                }
              />

              <ColorPicker
                label="Cor Final"
                value={config.background.gradient.to}
                onChange={(to) =>
                  updateBackground({
                    gradient: { ...config.background.gradient!, to },
                  })
                }
              />

              <div className="space-y-2">
                <Label>Direção do Gradiente</Label>
                <Select
                  value={config.background.gradient.direction}
                  onValueChange={(direction) =>
                    updateBackground({
                      gradient: { ...config.background.gradient!, direction },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="to bottom">Para Baixo</SelectItem>
                    <SelectItem value="to top">Para Cima</SelectItem>
                    <SelectItem value="to right">Para Direita</SelectItem>
                    <SelectItem value="to left">Para Esquerda</SelectItem>
                    <SelectItem value="to bottom right">Diagonal ↘</SelectItem>
                    <SelectItem value="to bottom left">Diagonal ↙</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {config.background.type === 'image' && config.background.image && (
            <ImageUploader
              label="Imagem de Fundo"
              value={config.background.image}
              onChange={(image) => updateBackground({ image })}
            />
          )}
        </CardContent>
      </Card>

      {/* Animação */}
      <Card>
        <CardHeader>
          <CardTitle>Animação</CardTitle>
          <CardDescription>Configure a animação de entrada da seção</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Animação Ativa</Label>
            <Switch
              checked={config.animation.enabled}
              onCheckedChange={(enabled) =>
                onChange({ animation: { ...config.animation, enabled } })
              }
            />
          </div>

          {config.animation.enabled && (
            <>
              <div className="space-y-2">
                <Label>Tipo de Animação</Label>
                <Select
                  value={config.animation.type || 'fade'}
                  onValueChange={(type: any) =>
                    onChange({ animation: { ...config.animation, type } })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fade">Fade</SelectItem>
                    <SelectItem value="slide">Slide</SelectItem>
                    <SelectItem value="bounce">Bounce</SelectItem>
                    <SelectItem value="zoom">Zoom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
