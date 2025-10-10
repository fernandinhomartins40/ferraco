/**
 * ContactEditor - Editor da seção de Contato
 */

import { ContactConfig } from '@/types/landingPage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ColorPicker, FontSelector } from '../StyleControls';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface ContactEditorProps {
  config: ContactConfig;
  onChange: (config: Partial<ContactConfig>) => void;
}

export const ContactEditor = ({ config, onChange }: ContactEditorProps) => {
  const updateTitle = (updates: Partial<ContactConfig['title']>) => {
    onChange({ title: { ...config.title, ...updates } });
  };

  const updateSubtitle = (updates: Partial<ContactConfig['subtitle']>) => {
    onChange({ subtitle: config.subtitle ? { ...config.subtitle, ...updates } : undefined });
  };

  const updateForm = (updates: Partial<ContactConfig['form']>) => {
    onChange({ form: { ...config.form, ...updates } });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações Gerais</CardTitle>
          <CardDescription>Configure a seção de Contato</CardDescription>
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

          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              value={config.title.text}
              onChange={(e) => updateTitle({ text: e.target.value })}
              placeholder="Entre em Contato"
            />
          </div>

          {config.subtitle && (
            <div className="space-y-2">
              <Label>Subtítulo</Label>
              <Input
                value={config.subtitle.text}
                onChange={(e) => updateSubtitle({ text: e.target.value })}
              />
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <Label>Layout</Label>
            <Select
              value={config.layout}
              onValueChange={(layout: any) => onChange({ layout })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="methods-only">Apenas Métodos</SelectItem>
                <SelectItem value="form-only">Apenas Formulário</SelectItem>
                <SelectItem value="split">Dividido</SelectItem>
                <SelectItem value="tabbed">Com Abas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Formulário */}
      <Card>
        <CardHeader>
          <CardTitle>Formulário de Contato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Formulário Ativo</Label>
            <Switch
              checked={config.form.enabled}
              onCheckedChange={(enabled) => updateForm({ enabled })}
            />
          </div>

          {config.form.enabled && (
            <>
              <div className="space-y-2">
                <Label>Texto do Botão</Label>
                <Input
                  value={config.form.submitButton.text}
                  onChange={(e) =>
                    updateForm({
                      submitButton: {
                        ...config.form.submitButton,
                        text: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Mensagem de Sucesso</Label>
                <Textarea
                  value={config.form.successMessage}
                  onChange={(e) => updateForm({ successMessage: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Mensagem de Erro</Label>
                <Textarea
                  value={config.form.errorMessage}
                  onChange={(e) => updateForm({ errorMessage: e.target.value })}
                  rows={2}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Estilos */}
      <Card>
        <CardHeader>
          <CardTitle>Estilos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FontSelector
            label="Tamanho do Título"
            value={config.title.style.fontSize || '2.25rem'}
            onChange={(fontSize) => updateTitle({ style: { ...config.title.style, fontSize } })}
            type="size"
          />

          <ColorPicker
            label="Cor do Título"
            value={config.title.style.textColor || '#000000'}
            onChange={(textColor) => updateTitle({ style: { ...config.title.style, textColor } })}
          />

          <ColorPicker
            label="Cor de Fundo"
            value={config.style.backgroundColor || '#ffffff'}
            onChange={(backgroundColor) =>
              onChange({ style: { ...config.style, backgroundColor } })
            }
          />
        </CardContent>
      </Card>
    </div>
  );
};
