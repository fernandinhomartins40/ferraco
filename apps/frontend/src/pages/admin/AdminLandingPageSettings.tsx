/**
 * Admin Landing Page Settings
 *
 * Página de configuração do modo de captação de leads da landing page
 */

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Settings2,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Database,
  MessageSquare,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import {
  landingPageSettingsService,
  type LandingPageSettings,
} from '@/services/landingPageSettings.service';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const AdminLandingPageSettings = () => {
  const { toast } = useToast();

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<LandingPageSettings>({
    mode: 'create_lead',
    whatsappNumber: '',
    messageTemplate: landingPageSettingsService.getDefaultTemplate(),
    createLeadAnyway: true,
  });

  // Carregar configurações
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const data = await landingPageSettingsService.get();
      setSettings(data);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar configurações',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Validar
      const errors = landingPageSettingsService.validate(settings);
      if (errors.length > 0) {
        toast({
          title: 'Validação falhou',
          description: errors.join('\n'),
          variant: 'destructive',
        });
        return;
      }

      setIsSaving(true);

      await landingPageSettingsService.update(settings);

      toast({
        title: 'Configurações salvas',
        description: 'As configurações foram atualizadas com sucesso.',
        variant: 'default',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const insertVariable = (variable: string) => {
    const template = settings.messageTemplate || '';
    const newTemplate = `${template}\n${variable}`;
    setSettings({ ...settings, messageTemplate: newTemplate });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Settings2 className="w-8 h-8" />
              Configurações da Landing Page
            </h1>
            <p className="text-muted-foreground mt-2">
              Configure como os leads da landing page serão capturados e processados
            </p>
          </div>
        </div>

        <Separator />

        {/* Main Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Modo de Captação de Leads
            </CardTitle>
            <CardDescription>
              Escolha como os leads capturados pela landing page serão processados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Radio Group */}
            <RadioGroup
              value={settings.mode}
              onValueChange={(value: 'create_lead' | 'whatsapp_only') =>
                setSettings({ ...settings, mode: value })
              }
            >
              {/* Opção 1: Create Lead */}
              <div
                className={`border-2 rounded-lg p-4 transition-all cursor-pointer ${
                  settings.mode === 'create_lead'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSettings({ ...settings, mode: 'create_lead' })}
              >
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="create_lead" id="create_lead" className="mt-1" />
                  <div className="flex-1">
                    <Label
                      htmlFor="create_lead"
                      className="text-base font-semibold cursor-pointer flex items-center gap-2"
                    >
                      <Database className="w-4 h-4" />
                      Criar Lead no CRM + Automação WhatsApp (Padrão)
                    </Label>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      ✓ Lead é salvo no PostgreSQL
                      <br />
                      ✓ Automação WhatsApp é criada automaticamente
                      <br />
                      ✓ Aparece no Kanban de vendas
                      <br />✓ Sistema completo de CRM e follow-up
                    </p>
                  </div>
                </div>
              </div>

              {/* Opção 2: WhatsApp Only */}
              <div
                className={`border-2 rounded-lg p-4 transition-all cursor-pointer ${
                  settings.mode === 'whatsapp_only'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSettings({ ...settings, mode: 'whatsapp_only' })}
              >
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="whatsapp_only" id="whatsapp_only" className="mt-1" />
                  <div className="flex-1">
                    <Label
                      htmlFor="whatsapp_only"
                      className="text-base font-semibold cursor-pointer flex items-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Redirecionar Cliente para WhatsApp
                    </Label>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      ✓ Cliente preenche o formulário na landing page
                      <br />
                      ✓ Cliente é redirecionado para enviar mensagem via wa.me
                      <br />
                      ✓ Mensagem pré-preenchida com os dados capturados
                      <br />✓ Não cria lead no CRM (ou cria silenciosamente para histórico)
                    </p>
                  </div>
                </div>
              </div>
            </RadioGroup>

            {/* WhatsApp Only Settings */}
            {settings.mode === 'whatsapp_only' && (
              <div className="space-y-4 bg-muted/30 p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Configurações do WhatsApp
                  </h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>
                          Configure o número da sua empresa e a mensagem que o cliente enviará.
                          O sistema irá redirecionar o cliente para o WhatsApp (wa.me) com a mensagem pré-preenchida.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* WhatsApp Number */}
                <div className="space-y-2">
                  <Label htmlFor="whatsappNumber">
                    Número do WhatsApp da Empresa *
                  </Label>
                  <Input
                    id="whatsappNumber"
                    placeholder="5511999999999"
                    value={settings.whatsappNumber || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, whatsappNumber: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Número da sua empresa (com código do país) para onde o CLIENTE será redirecionado via wa.me
                  </p>
                </div>

                {/* Message Template */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="messageTemplate">Template da Mensagem que o Cliente Enviará *</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setSettings({
                          ...settings,
                          messageTemplate: landingPageSettingsService.getDefaultTemplate(),
                        })
                      }
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      Restaurar Padrão
                    </Button>
                  </div>
                  <Textarea
                    id="messageTemplate"
                    rows={10}
                    value={settings.messageTemplate || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, messageTemplate: e.target.value })
                    }
                    className="font-mono text-sm"
                    placeholder="Olá! Me chamo {{name}} e tenho interesse em {{interest}}..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Esta mensagem será pré-preenchida no WhatsApp do cliente quando ele for redirecionado
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <p className="text-xs text-muted-foreground w-full mb-1">
                      Variáveis disponíveis (clique para inserir):
                    </p>
                    {[
                      '{{name}}',
                      '{{phone}}',
                      '{{email}}',
                      '{{interest}}',
                      '{{source}}',
                      '{{timestamp}}',
                    ].map((variable) => (
                      <Button
                        key={variable}
                        variant="outline"
                        size="sm"
                        onClick={() => insertVariable(variable)}
                        className="text-xs"
                      >
                        {variable}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Create Lead Anyway */}
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="createLeadAnyway"
                    checked={settings.createLeadAnyway || false}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, createLeadAnyway: checked as boolean })
                    }
                  />
                  <Label
                    htmlFor="createLeadAnyway"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Criar lead silenciosamente para histórico (recomendado)
                  </Label>
                </div>

                {/* Info sobre funcionamento */}
                <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                  <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>Como funciona:</strong> Quando um cliente preencher o formulário na landing page,
                    ele será automaticamente redirecionado para enviar uma mensagem via WhatsApp Web/App
                    (wa.me) com o texto pré-preenchido. Não é necessário ter WhatsApp conectado no sistema.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Info Alert */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {settings.mode === 'create_lead' ? (
                  <>
                    <strong>Modo Padrão Selecionado:</strong> Os leads serão criados no CRM e
                    processados pelo sistema de automação WhatsApp existente.
                  </>
                ) : (
                  <>
                    <strong>Modo Redirecionamento WhatsApp Selecionado:</strong> O cliente será
                    redirecionado para enviar uma mensagem via wa.me com os dados pré-preenchidos.
                    Não usa o WhatsApp conectado do sistema. O lead pode ser criado silenciosamente
                    para histórico se a opção estiver marcada.
                  </>
                )}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={loadSettings} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminLandingPageSettings;
