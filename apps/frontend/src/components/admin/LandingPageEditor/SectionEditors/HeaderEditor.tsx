/**
 * HeaderEditor - Editor simplificado do cabeçalho
 * Apenas Logo e Texto do Botão
 */

import { HeaderConfig } from '@/types/landingPage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ImageUploader } from '../StyleControls';

interface HeaderEditorProps {
  config: HeaderConfig;
  onChange: (config: Partial<HeaderConfig>) => void;
}

export const HeaderEditor = ({ config, onChange }: HeaderEditorProps) => {
  const updateLogo = (updates: Partial<HeaderConfig['logo']>) => {
    onChange({ logo: { ...config.logo, ...updates } });
  };

  const updateCTA = (updates: Partial<HeaderConfig['cta']>) => {
    onChange({ cta: { ...config.cta, ...updates } });
  };

  return (
    <div className="space-y-6">
      {/* Logo */}
      <Card>
        <CardHeader>
          <CardTitle>Logotipo</CardTitle>
          <CardDescription>Altere a imagem do logo da empresa</CardDescription>
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
        </CardContent>
      </Card>

      {/* Botão CTA - Apenas Texto */}
      <Card>
        <CardHeader>
          <CardTitle>Botão de Ação</CardTitle>
          <CardDescription>Altere o texto do botão no cabeçalho</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Texto do Botão</Label>
            <Input
              value={config.cta.text}
              onChange={(e) => updateCTA({ text: e.target.value })}
              placeholder="Solicitar Orçamento"
            />
            <p className="text-xs text-muted-foreground">
              Este é o texto que aparecerá no botão do cabeçalho
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
