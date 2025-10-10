/**
 * HeaderEditor - Editor do cabeçalho com personalização completa
 */

import { HeaderConfig } from '@/types/landingPage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ColorPicker, ImageUploader, FontSelector } from '../StyleControls';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface HeaderEditorProps {
  config: HeaderConfig;
  onChange: (config: Partial<HeaderConfig>) => void;
}

export const HeaderEditor = ({ config, onChange }: HeaderEditorProps) => {
  const updateLogo = (updates: Partial<HeaderConfig['logo']>) => {
    onChange({ logo: { ...config.logo, ...updates } });
  };

  const updateMenu = (updates: Partial<HeaderConfig['menu']>) => {
    onChange({ menu: { ...config.menu, ...updates } });
  };

  const updateMenuStyle = (updates: Partial<HeaderConfig['menu']['style']>) => {
    onChange({
      menu: {
        ...config.menu,
        style: { ...config.menu.style, ...updates },
      },
    });
  };

  const updateMenuHoverStyle = (updates: Partial<NonNullable<HeaderConfig['menu']['style']['hover']>>) => {
    onChange({
      menu: {
        ...config.menu,
        style: {
          ...config.menu.style,
          hover: { ...config.menu.style.hover, ...updates },
        },
      },
    });
  };

  const updateCTA = (updates: Partial<HeaderConfig['cta']>) => {
    onChange({ cta: { ...config.cta, ...updates } });
  };

  const updateCTAStyle = (updates: Partial<HeaderConfig['cta']['style']>) => {
    onChange({
      cta: {
        ...config.cta,
        style: { ...config.cta.style, ...updates },
      },
    });
  };

  const updateCTAHoverStyle = (updates: Partial<NonNullable<HeaderConfig['cta']['style']['hover']>>) => {
    onChange({
      cta: {
        ...config.cta,
        style: {
          ...config.cta.style,
          hover: { ...config.cta.style.hover, ...updates },
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Configurações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações Gerais</CardTitle>
          <CardDescription>Configure o cabeçalho do site</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Header Ativo</Label>
            <Switch
              checked={config.enabled}
              onCheckedChange={(enabled) => onChange({ enabled })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Header Fixo (Sticky)</Label>
            <Switch
              checked={config.sticky}
              onCheckedChange={(sticky) => onChange({ sticky })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Header Transparente</Label>
            <Switch
              checked={config.transparent}
              onCheckedChange={(transparent) => onChange({ transparent })}
            />
          </div>

          <Separator />

          <ColorPicker
            label="Cor de Fundo do Header"
            value={config.style.backgroundColor || '#ffffff'}
            onChange={(backgroundColor) =>
              onChange({ style: { ...config.style, backgroundColor } })
            }
            description="Cor de fundo do cabeçalho"
          />
        </CardContent>
      </Card>

      {/* Logo */}
      <Card>
        <CardHeader>
          <CardTitle>Logotipo</CardTitle>
          <CardDescription>Configure o logo da empresa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.logo.type === 'image' && config.logo.image && (
            <ImageUploader
              label="Imagem do Logo"
              value={config.logo.image}
              onChange={(image) => updateLogo({ image })}
              description="Faça upload do logo da empresa ou insira a URL"
            />
          )}

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Largura do Logo (px)</Label>
              <Input
                type="number"
                value={config.logo.width || 120}
                onChange={(e) => updateLogo({ width: Number(e.target.value) })}
                min="50"
                max="500"
              />
            </div>

            <div className="space-y-2">
              <Label>Altura do Logo (px)</Label>
              <Input
                type="number"
                value={config.logo.height || 60}
                onChange={(e) => updateLogo({ height: Number(e.target.value) })}
                min="30"
                max="300"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menu de Navegação */}
      <Card>
        <CardHeader>
          <CardTitle>Menu de Navegação</CardTitle>
          <CardDescription>Personalize o estilo dos links do menu</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="normal">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="normal">Estado Normal</TabsTrigger>
              <TabsTrigger value="hover">Estado Hover</TabsTrigger>
            </TabsList>

            {/* Estado Normal */}
            <TabsContent value="normal" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Alinhamento do Menu</Label>
                <Select
                  value={config.menu.alignment}
                  onValueChange={(alignment: any) => updateMenu({ alignment })}
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

              <ColorPicker
                label="Cor do Texto"
                value={config.menu.style.textColor || '#1e293b'}
                onChange={(textColor) => updateMenuStyle({ textColor })}
                description="Cor dos links do menu"
              />

              <FontSelector
                label="Tamanho da Fonte"
                value={config.menu.style.fontSize || '1rem'}
                onChange={(fontSize) => updateMenuStyle({ fontSize })}
                type="size"
              />

              <FontSelector
                label="Peso da Fonte"
                value={config.menu.style.fontWeight || '500'}
                onChange={(fontWeight) => updateMenuStyle({ fontWeight })}
                type="weight"
              />
            </TabsContent>

            {/* Estado Hover */}
            <TabsContent value="hover" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Configure o estilo quando o usuário passa o mouse sobre os links
              </p>

              <ColorPicker
                label="Cor do Texto (Hover)"
                value={config.menu.style.hover?.textColor || '#0ea5e9'}
                onChange={(textColor) => updateMenuHoverStyle({ textColor })}
                description="Cor do texto ao passar o mouse"
              />

              <ColorPicker
                label="Cor de Fundo (Hover)"
                value={config.menu.style.hover?.backgroundColor || 'transparent'}
                onChange={(backgroundColor) => updateMenuHoverStyle({ backgroundColor })}
                description="Cor de fundo ao passar o mouse (opcional)"
              />

              <div className="space-y-2">
                <Label>Transformação (Hover)</Label>
                <Select
                  value={config.menu.style.hover?.transform || 'none'}
                  onValueChange={(transform) => updateMenuHoverStyle({ transform })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    <SelectItem value="scale(1.05)">Aumentar (5%)</SelectItem>
                    <SelectItem value="scale(1.1)">Aumentar (10%)</SelectItem>
                    <SelectItem value="translateY(-2px)">Elevar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Botão CTA */}
      <Card>
        <CardHeader>
          <CardTitle>Botão de Ação (CTA)</CardTitle>
          <CardDescription>Configure o botão de call-to-action</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Botão Ativo</Label>
              <Switch
                checked={config.cta.enabled}
                onCheckedChange={(enabled) => updateCTA({ enabled })}
              />
            </div>

            {config.cta.enabled && (
              <>
                <Separator />

                <div className="space-y-2">
                  <Label>Texto do Botão</Label>
                  <Input
                    value={config.cta.text}
                    onChange={(e) => updateCTA({ text: e.target.value })}
                    placeholder="Solicitar Orçamento"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Link (href)</Label>
                  <Input
                    value={config.cta.href}
                    onChange={(e) => updateCTA({ href: e.target.value })}
                    placeholder="#contact"
                  />
                </div>

                <Separator />

                <Tabs defaultValue="normal">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="normal">Estado Normal</TabsTrigger>
                    <TabsTrigger value="hover">Estado Hover</TabsTrigger>
                  </TabsList>

                  {/* CTA - Estado Normal */}
                  <TabsContent value="normal" className="space-y-4 mt-4">
                    <ColorPicker
                      label="Cor de Fundo"
                      value={config.cta.style.backgroundColor || '#0ea5e9'}
                      onChange={(backgroundColor) => updateCTAStyle({ backgroundColor })}
                    />

                    <ColorPicker
                      label="Cor do Texto"
                      value={config.cta.style.textColor || '#ffffff'}
                      onChange={(textColor) => updateCTAStyle({ textColor })}
                    />

                    <div className="space-y-2">
                      <Label>Borda Arredondada</Label>
                      <Select
                        value={config.cta.style.borderRadius || '0.5rem'}
                        onValueChange={(borderRadius) => updateCTAStyle({ borderRadius })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Nenhuma</SelectItem>
                          <SelectItem value="0.25rem">Pequena</SelectItem>
                          <SelectItem value="0.5rem">Média</SelectItem>
                          <SelectItem value="0.75rem">Grande</SelectItem>
                          <SelectItem value="9999px">Pill</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Padding</Label>
                      <Select
                        value={config.cta.style.padding || '0.75rem 1.5rem'}
                        onValueChange={(padding) => updateCTAStyle({ padding })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0.5rem 1rem">Pequeno</SelectItem>
                          <SelectItem value="0.75rem 1.5rem">Médio</SelectItem>
                          <SelectItem value="1rem 2rem">Grande</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>

                  {/* CTA - Estado Hover */}
                  <TabsContent value="hover" className="space-y-4 mt-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Configure o estilo quando o usuário passa o mouse sobre o botão
                    </p>

                    <ColorPicker
                      label="Cor de Fundo (Hover)"
                      value={config.cta.style.hover?.backgroundColor || '#0284c7'}
                      onChange={(backgroundColor) => updateCTAHoverStyle({ backgroundColor })}
                    />

                    <ColorPicker
                      label="Cor do Texto (Hover)"
                      value={config.cta.style.hover?.textColor || '#ffffff'}
                      onChange={(textColor) => updateCTAHoverStyle({ textColor })}
                    />

                    <div className="space-y-2">
                      <Label>Sombra (Hover)</Label>
                      <Select
                        value={config.cta.style.hover?.boxShadow || 'none'}
                        onValueChange={(boxShadow) => updateCTAHoverStyle({ boxShadow })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhuma</SelectItem>
                          <SelectItem value="0 4px 6px -1px rgb(0 0 0 / 0.1)">Pequena</SelectItem>
                          <SelectItem value="0 10px 15px -3px rgb(0 0 0 / 0.1)">Média</SelectItem>
                          <SelectItem value="0 20px 25px -5px rgb(0 0 0 / 0.1)">Grande</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Transformação (Hover)</Label>
                      <Select
                        value={config.cta.style.hover?.transform || 'none'}
                        onValueChange={(transform) => updateCTAHoverStyle({ transform })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhuma</SelectItem>
                          <SelectItem value="scale(1.05)">Aumentar (5%)</SelectItem>
                          <SelectItem value="scale(1.1)">Aumentar (10%)</SelectItem>
                          <SelectItem value="translateY(-2px)">Elevar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
