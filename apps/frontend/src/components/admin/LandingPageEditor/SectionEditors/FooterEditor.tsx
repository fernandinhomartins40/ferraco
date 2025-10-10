/**
 * FooterEditor - Editor do rodapé
 */

import { FooterConfig } from '@/types/landingPage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ColorPicker } from '../StyleControls';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface FooterEditorProps {
  config: FooterConfig;
  onChange: (config: Partial<FooterConfig>) => void;
}

export const FooterEditor = ({ config, onChange }: FooterEditorProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações Gerais</CardTitle>
          <CardDescription>Configure o rodapé do site</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Rodapé Ativo</Label>
            <Switch
              checked={config.enabled}
              onCheckedChange={(enabled) => onChange({ enabled })}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Tagline</Label>
            <Input
              value={config.tagline || ''}
              onChange={(e) => onChange({ tagline: e.target.value })}
              placeholder="Equipamentos de qualidade"
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
                <SelectItem value="columns">Colunas</SelectItem>
                <SelectItem value="mega">Mega Menu</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Social */}
      {config.social && (
        <Card>
          <CardHeader>
            <CardTitle>Redes Sociais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Exibir Redes Sociais</Label>
              <Switch
                checked={config.social.enabled}
                onCheckedChange={(enabled) =>
                  onChange({
                    social: { ...config.social, enabled },
                  })
                }
              />
            </div>

            {config.social.enabled && config.social.title !== undefined && (
              <div className="space-y-2">
                <Label>Título da Seção</Label>
                <Input
                  value={config.social.title}
                  onChange={(e) =>
                    onChange({
                      social: { ...config.social, title: e.target.value },
                    })
                  }
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Newsletter */}
      {config.newsletter && (
        <Card>
          <CardHeader>
            <CardTitle>Newsletter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Exibir Newsletter</Label>
              <Switch
                checked={config.newsletter.enabled}
                onCheckedChange={(enabled) =>
                  onChange({
                    newsletter: { ...config.newsletter, enabled },
                  })
                }
              />
            </div>

            {config.newsletter.enabled && (
              <>
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={config.newsletter.title}
                    onChange={(e) =>
                      onChange({
                        newsletter: { ...config.newsletter, title: e.target.value },
                      })
                    }
                  />
                </div>

                {config.newsletter.description !== undefined && (
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      value={config.newsletter.description}
                      onChange={(e) =>
                        onChange({
                          newsletter: { ...config.newsletter, description: e.target.value },
                        })
                      }
                      rows={2}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Placeholder</Label>
                  <Input
                    value={config.newsletter.placeholder}
                    onChange={(e) =>
                      onChange({
                        newsletter: { ...config.newsletter, placeholder: e.target.value },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Texto do Botão</Label>
                  <Input
                    value={config.newsletter.buttonText}
                    onChange={(e) =>
                      onChange({
                        newsletter: { ...config.newsletter, buttonText: e.target.value },
                      })
                    }
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Copyright */}
      <Card>
        <CardHeader>
          <CardTitle>Copyright</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Texto de Copyright</Label>
            <Input
              value={config.bottom.copyright}
              onChange={(e) =>
                onChange({
                  bottom: { ...config.bottom, copyright: e.target.value },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Estilos */}
      <Card>
        <CardHeader>
          <CardTitle>Estilos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ColorPicker
            label="Cor de Fundo"
            value={config.style.backgroundColor || '#1e293b'}
            onChange={(backgroundColor) =>
              onChange({ style: { ...config.style, backgroundColor } })
            }
          />

          <ColorPicker
            label="Cor do Texto"
            value={config.style.textColor || '#ffffff'}
            onChange={(textColor) =>
              onChange({ style: { ...config.style, textColor } })
            }
          />
        </CardContent>
      </Card>
    </div>
  );
};
