/**
 * ThemeEditor - Editor de Tema Global
 */

import { ThemeConfig } from '@/types/landingPage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ColorPicker, FontSelector, SliderControl } from '../StyleControls';
import { Separator } from '@/components/ui/separator';

interface ThemeEditorProps {
  config: ThemeConfig;
  onChange: (config: Partial<ThemeConfig>) => void;
}

export const ThemeEditor = ({ config, onChange }: ThemeEditorProps) => {
  const updateColors = (key: keyof ThemeConfig['colors'], value: string) => {
    onChange({
      colors: {
        ...config.colors,
        [key]: value,
      },
    });
  };

  const updateTextColors = (key: keyof ThemeConfig['colors']['text'], value: string) => {
    onChange({
      colors: {
        ...config.colors,
        text: {
          ...config.colors.text,
          [key]: value,
        },
      },
    });
  };

  const updateFontFamily = (key: keyof ThemeConfig['typography']['fontFamily'], value: string) => {
    onChange({
      typography: {
        ...config.typography,
        fontFamily: {
          ...config.typography.fontFamily,
          [key]: value,
        },
      },
    });
  };

  const updateFontSize = (key: keyof ThemeConfig['typography']['fontSize'], value: string) => {
    onChange({
      typography: {
        ...config.typography,
        fontSize: {
          ...config.typography.fontSize,
          [key]: value,
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tema Global</CardTitle>
          <CardDescription>Configure cores, tipografia e espaçamentos</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="colors">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
              <TabsTrigger value="colors">Cores</TabsTrigger>
              <TabsTrigger value="typography">Tipografia</TabsTrigger>
              <TabsTrigger value="spacing">Espaçamento</TabsTrigger>
            </TabsList>

            {/* Cores */}
            <TabsContent value="colors" className="space-y-4 mt-4">
              <ColorPicker
                label="Cor Primária"
                value={config.colors.primary}
                onChange={(color) => updateColors('primary', color)}
                description="Cor principal do site"
              />

              <ColorPicker
                label="Cor Primária Escura"
                value={config.colors.primaryDark}
                onChange={(color) => updateColors('primaryDark', color)}
              />

              <ColorPicker
                label="Cor Primária Clara"
                value={config.colors.primaryLight}
                onChange={(color) => updateColors('primaryLight', color)}
              />

              <Separator />

              <ColorPicker
                label="Cor Secundária"
                value={config.colors.secondary}
                onChange={(color) => updateColors('secondary', color)}
                description="Cor para destaques"
              />

              <ColorPicker
                label="Cor de Acento"
                value={config.colors.accent}
                onChange={(color) => updateColors('accent', color)}
              />

              <Separator />

              <ColorPicker
                label="Cor de Fundo"
                value={config.colors.background}
                onChange={(color) => updateColors('background', color)}
              />

              <ColorPicker
                label="Cor de Superfície"
                value={config.colors.surface}
                onChange={(color) => updateColors('surface', color)}
              />

              <Separator />

              <div className="space-y-4">
                <Label>Cores de Texto</Label>

                <ColorPicker
                  label="Texto Primário"
                  value={config.colors.text.primary}
                  onChange={(color) => updateTextColors('primary', color)}
                />

                <ColorPicker
                  label="Texto Secundário"
                  value={config.colors.text.secondary}
                  onChange={(color) => updateTextColors('secondary', color)}
                />

                <ColorPicker
                  label="Texto Desabilitado"
                  value={config.colors.text.disabled}
                  onChange={(color) => updateTextColors('disabled', color)}
                />

                <ColorPicker
                  label="Texto Inverso"
                  value={config.colors.text.inverse}
                  onChange={(color) => updateTextColors('inverse', color)}
                />
              </div>

              <Separator />

              <ColorPicker
                label="Cor de Sucesso"
                value={config.colors.success}
                onChange={(color) => updateColors('success', color)}
              />

              <ColorPicker
                label="Cor de Aviso"
                value={config.colors.warning}
                onChange={(color) => updateColors('warning', color)}
              />

              <ColorPicker
                label="Cor de Erro"
                value={config.colors.error}
                onChange={(color) => updateColors('error', color)}
              />

              <ColorPicker
                label="Cor de Informação"
                value={config.colors.info}
                onChange={(color) => updateColors('info', color)}
              />
            </TabsContent>

            {/* Tipografia */}
            <TabsContent value="typography" className="space-y-4 mt-4">
              <div className="space-y-4">
                <Label>Famílias de Fonte</Label>

                <FontSelector
                  label="Fonte Primária"
                  value={config.typography.fontFamily.primary}
                  onChange={(font) => updateFontFamily('primary', font)}
                  type="family"
                />

                <FontSelector
                  label="Fonte Secundária"
                  value={config.typography.fontFamily.secondary}
                  onChange={(font) => updateFontFamily('secondary', font)}
                  type="family"
                />

                <FontSelector
                  label="Fonte Monoespaçada"
                  value={config.typography.fontFamily.monospace}
                  onChange={(font) => updateFontFamily('monospace', font)}
                  type="family"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>Tamanhos de Fonte</Label>

                <FontSelector
                  label="XS (Extra Pequeno)"
                  value={config.typography.fontSize.xs}
                  onChange={(size) => updateFontSize('xs', size)}
                  type="size"
                />

                <FontSelector
                  label="SM (Pequeno)"
                  value={config.typography.fontSize.sm}
                  onChange={(size) => updateFontSize('sm', size)}
                  type="size"
                />

                <FontSelector
                  label="Base (Normal)"
                  value={config.typography.fontSize.base}
                  onChange={(size) => updateFontSize('base', size)}
                  type="size"
                />

                <FontSelector
                  label="LG (Grande)"
                  value={config.typography.fontSize.lg}
                  onChange={(size) => updateFontSize('lg', size)}
                  type="size"
                />

                <FontSelector
                  label="XL (Extra Grande)"
                  value={config.typography.fontSize.xl}
                  onChange={(size) => updateFontSize('xl', size)}
                  type="size"
                />

                <FontSelector
                  label="2XL"
                  value={config.typography.fontSize['2xl']}
                  onChange={(size) => updateFontSize('2xl', size)}
                  type="size"
                />

                <FontSelector
                  label="3XL"
                  value={config.typography.fontSize['3xl']}
                  onChange={(size) => updateFontSize('3xl', size)}
                  type="size"
                />

                <FontSelector
                  label="4XL"
                  value={config.typography.fontSize['4xl']}
                  onChange={(size) => updateFontSize('4xl', size)}
                  type="size"
                />

                <FontSelector
                  label="5XL"
                  value={config.typography.fontSize['5xl']}
                  onChange={(size) => updateFontSize('5xl', size)}
                  type="size"
                />
              </div>
            </TabsContent>

            {/* Espaçamento */}
            <TabsContent value="spacing" className="space-y-4 mt-4">
              <div className="space-y-4">
                <Label>Espaçamentos</Label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">XS</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      {config.spacing.xs}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm">SM</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      {config.spacing.sm}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm">MD</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      {config.spacing.md}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm">LG</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      {config.spacing.lg}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm">XL</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      {config.spacing.xl}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm">2XL</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      {config.spacing['2xl']}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm">3XL</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      {config.spacing['3xl']}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>Modo Escuro</Label>
                <div className="flex items-center justify-between">
                  <Label htmlFor="dark-mode">Ativar Modo Escuro</Label>
                  <Switch
                    id="dark-mode"
                    checked={config.darkMode.enabled}
                    onCheckedChange={(enabled) =>
                      onChange({
                        darkMode: {
                          ...config.darkMode,
                          enabled,
                        },
                      })
                    }
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Implementação futura: cores customizadas para modo escuro
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
