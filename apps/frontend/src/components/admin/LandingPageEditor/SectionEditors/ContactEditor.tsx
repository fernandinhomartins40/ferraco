/**
 * ContactEditor - Editor simplificado da seção de Contato
 * Apenas textos editáveis
 */

import { ContactConfig } from '@/types/landingPage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface ContactEditorProps {
  config: ContactConfig;
  onChange: (config: Partial<ContactConfig>) => void;
}

export const ContactEditor = ({ config, onChange }: ContactEditorProps) => {
  const updateTitle = (text: string) => {
    onChange({ title: { ...config.title, text } });
  };

  const updateSubtitle = (text: string) => {
    if (config.subtitle) {
      onChange({ subtitle: { ...config.subtitle, text } });
    }
  };

  const updateMethod = (index: number, field: 'label' | 'value', value: string) => {
    const newMethods = [...config.methods];
    newMethods[index] = { ...newMethods[index], [field]: value };
    onChange({ methods: newMethods });
  };

  const addMethod = () => {
    const newMethod = {
      id: `method-${Date.now()}`,
      type: 'phone' as const,
      icon: 'Phone',
      label: 'Novo Contato',
      value: '(00) 0000-0000',
      href: 'tel:+5500000000000',
    };
    onChange({ methods: [...config.methods, newMethod] });
  };

  const removeMethod = (index: number) => {
    const newMethods = config.methods.filter((_, i) => i !== index);
    onChange({ methods: newMethods });
  };

  const updateFormButton = (text: string) => {
    onChange({
      form: {
        ...config.form,
        submitButton: {
          ...config.form.submitButton,
          text,
        },
      },
    });
  };

  const updateFormMessages = (field: 'successMessage' | 'errorMessage', value: string) => {
    onChange({
      form: {
        ...config.form,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Textos Principais */}
      <Card>
        <CardHeader>
          <CardTitle>Textos da Seção Contato</CardTitle>
          <CardDescription>Edite os textos principais da seção</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Título da Seção</Label>
            <Input
              value={config.title.text}
              onChange={(e) => updateTitle(e.target.value)}
              placeholder="Entre em Contato"
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
                  placeholder="Estamos aqui para ajudar"
                />
                <p className="text-xs text-muted-foreground">
                  Subtítulo que aparece abaixo do título principal
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Métodos de Contato */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Métodos de Contato</CardTitle>
              <CardDescription>Edite telefones, emails e endereços</CardDescription>
            </div>
            <Button onClick={addMethod} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {config.methods.map((method, index) => (
              <Card key={method.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-sm">Label {index + 1}</Label>
                        <Input
                          value={method.label}
                          onChange={(e) => updateMethod(index, 'label', e.target.value)}
                          placeholder="Ex: Telefone Principal"
                        />
                        <p className="text-xs text-muted-foreground">
                          Nome do método de contato
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Valor</Label>
                        <Input
                          value={method.value}
                          onChange={(e) => updateMethod(index, 'value', e.target.value)}
                          placeholder="Ex: (11) 98765-4321"
                        />
                        <p className="text-xs text-muted-foreground">
                          Telefone, email ou endereço
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMethod(index)}
                      className="text-destructive hover:text-destructive mt-6"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mt-2 px-2 py-1 bg-muted/50 rounded text-xs text-muted-foreground">
                    Tipo: {method.type === 'phone' ? '📞 Telefone' : method.type === 'email' ? '📧 Email' : method.type === 'whatsapp' ? '💬 WhatsApp' : method.type === 'address' ? '📍 Endereço' : 'Customizado'}
                  </div>
                </CardContent>
              </Card>
            ))}

            {config.methods.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-4">Nenhum método de contato adicionado</p>
                <Button onClick={addMethod} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Método
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configurações do Formulário */}
      <Card>
        <CardHeader>
          <CardTitle>Textos do Formulário</CardTitle>
          <CardDescription>Configure mensagens e botão do formulário</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Texto do Botão Enviar</Label>
            <Input
              value={config.form.submitButton.text}
              onChange={(e) => updateFormButton(e.target.value)}
              placeholder="Enviar Mensagem"
            />
            <p className="text-xs text-muted-foreground">
              Texto que aparece no botão de envio
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Mensagem de Sucesso</Label>
            <Input
              value={config.form.successMessage}
              onChange={(e) => updateFormMessages('successMessage', e.target.value)}
              placeholder="Mensagem enviada com sucesso!"
            />
            <p className="text-xs text-muted-foreground">
              Mensagem exibida quando o formulário é enviado com sucesso
            </p>
          </div>

          <div className="space-y-2">
            <Label>Mensagem de Erro</Label>
            <Input
              value={config.form.errorMessage}
              onChange={(e) => updateFormMessages('errorMessage', e.target.value)}
              placeholder="Erro ao enviar mensagem. Tente novamente."
            />
            <p className="text-xs text-muted-foreground">
              Mensagem exibida quando ocorre um erro
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
