import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MessageCircle,
  Smartphone,
  QrCode,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';

const AdminWhatsApp = () => {
  const [apiKey, setApiKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleConnect = () => {
    if (!apiKey.trim()) {
      toast.error('Digite a API Key para conectar');
      return;
    }

    // TODO: Implementar validação real da API
    setIsConnected(true);
    localStorage.setItem('whatsapp_api_key', apiKey);
    toast.success('WhatsApp conectado com sucesso!');
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setApiKey('');
    localStorage.removeItem('whatsapp_api_key');
    toast.success('WhatsApp desconectado');
  };

  const copyCommand = (command: string) => {
    navigator.clipboard.writeText(command);
    toast.success('Comando copiado!');
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <MessageCircle className="h-8 w-8 text-green-600" />
            Conectar WhatsApp
          </h2>
          <p className="text-muted-foreground mt-2">
            Configure o WhatsApp em 3 passos simples (15 minutos)
          </p>
        </div>

        {/* Status Card */}
        <Alert className={isConnected ? 'border-green-500 bg-green-50' : ''}>
          {isConnected ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            {isConnected ? (
              <div className="flex items-center justify-between">
                <span className="text-green-700 font-medium">✅ WhatsApp conectado e pronto para uso!</span>
                <Button variant="outline" size="sm" onClick={handleDisconnect}>
                  Desconectar
                </Button>
              </div>
            ) : (
              <span>WhatsApp não conectado. Siga os 3 passos abaixo para conectar.</span>
            )}
          </AlertDescription>
        </Alert>

        {!isConnected && (
          <>
            {/* Step 1 */}
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <CardTitle>Instalar Evolution API (Grátis)</CardTitle>
                    <CardDescription>1 comando no terminal - leva 2 minutos</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Você precisa ter:</strong> Docker instalado no computador.
                    {' '}
                    <a
                      href="https://www.docker.com/products/docker-desktop/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Baixar Docker aqui
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </AlertDescription>
                </Alert>

                <div>
                  <p className="text-sm font-medium mb-2">Cole este comando no terminal:</p>
                  <div className="relative">
                    <pre className="bg-slate-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
                      <code>{`docker run -d \\
  --name evolution-api \\
  -p 8080:8080 \\
  atendai/evolution-api:latest`}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute top-2 right-2"
                      onClick={() => copyCommand('docker run -d --name evolution-api -p 8080:8080 atendai/evolution-api:latest')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✅ Após rodar o comando, aguarde 30 segundos e acesse:
                    <a
                      href="http://localhost:8080"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:underline ml-1"
                    >
                      http://localhost:8080
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <CardTitle>Conectar seu WhatsApp</CardTitle>
                    <CardDescription>Escanear QR Code como WhatsApp Web</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col items-center text-center p-4 bg-slate-50 rounded-lg">
                    <div className="h-12 w-12 rounded-full bg-green-500 text-white flex items-center justify-center mb-3">
                      <QrCode className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium">1. Abra o painel</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      localhost:8080
                    </p>
                  </div>

                  <div className="flex flex-col items-center text-center p-4 bg-slate-50 rounded-lg">
                    <div className="h-12 w-12 rounded-full bg-green-500 text-white flex items-center justify-center mb-3">
                      <Smartphone className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium">2. Criar instância</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Clique em "Nova Instância"
                    </p>
                  </div>

                  <div className="flex flex-col items-center text-center p-4 bg-slate-50 rounded-lg">
                    <div className="h-12 w-12 rounded-full bg-green-500 text-white flex items-center justify-center mb-3">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium">3. Escanear QR</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Com WhatsApp do celular
                    </p>
                  </div>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Como escanear:</strong> WhatsApp → Configurações → Aparelhos conectados → Conectar aparelho
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <CardTitle>Conectar ao Ferraco CRM</CardTitle>
                    <CardDescription>Cole a API Key do painel aqui</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    API Key da Evolution API
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Cole aqui a API Key que aparece no painel Evolution"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="font-mono"
                    />
                    <Button onClick={handleConnect} className="bg-green-600 hover:bg-green-700">
                      Conectar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    📍 Encontre a API Key em: Painel Evolution → Configurações → API Key
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Connected State - Show Features */}
        {isConnected && (
          <Card>
            <CardHeader>
              <CardTitle>Funcionalidades Disponíveis</CardTitle>
              <CardDescription>O que você pode fazer agora</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Enviar mensagens para leads</p>
                    <p className="text-xs text-muted-foreground">Direto do card do lead no Kanban</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Criar templates de mensagem</p>
                    <p className="text-xs text-muted-foreground">Em breve: gerenciar na próxima aba</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Envio em massa</p>
                    <p className="text-xs text-muted-foreground">Selecionar múltiplos leads</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Histórico de conversas</p>
                    <p className="text-xs text-muted-foreground">Ver todas as mensagens enviadas</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Advanced Options Collapsible */}
        <div className="border-t pt-6">
          <Button
            variant="ghost"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full justify-between"
          >
            <span className="text-muted-foreground">Opções Avançadas (WhatsApp Cloud API oficial, etc)</span>
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          {showAdvanced && (
            <div className="mt-4 space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Opções avançadas:</strong> Se você precisa da API oficial da Meta ou outras alternativas,
                  consulte nossa documentação completa ou entre em contato com o suporte.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">WhatsApp Cloud API (Oficial Meta)</CardTitle>
                  <CardDescription>Para empresas que precisam da solução oficial</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Requer empresa registrada</Badge>
                    <Badge variant="outline">Setup: 1-2h</Badge>
                    <Badge variant="outline">Grátis até 1000 conversas/mês</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Requer conta Meta Business, aprovação e configuração de webhooks.
                    Mais confiável mas mais complexo.
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://developers.facebook.com/docs/whatsapp/cloud-api" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver Documentação Meta
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Help Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-900">Precisa de ajuda?</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Problemas com Docker? Baixe em: docker.com/products/docker-desktop</li>
                  <li>• Evolution API não abre? Verifique se a porta 8080 está livre</li>
                  <li>• QR Code não aparece? Aguarde 1 minuto após iniciar o container</li>
                </ul>
                <Button variant="link" size="sm" className="text-blue-700 p-0 h-auto" asChild>
                  <a href="https://doc.evolution-api.com" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Documentação completa Evolution API
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminWhatsApp;
