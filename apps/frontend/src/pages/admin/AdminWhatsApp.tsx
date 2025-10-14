/**
 * AdminWhatsApp - Conectar WhatsApp usando WPPConnect
 *
 * Nossa própria implementação - SEM dependências externas
 * WPPConnect roda dentro do backend Node.js
 */

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MessageCircle,
  QrCode,
  CheckCircle,
  AlertCircle,
  Info,
  Loader2,
  Send,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/apiClient';

interface WhatsAppStatus {
  connected: boolean;
  hasQR: boolean;
  message: string;
}

interface WhatsAppAccount {
  phone: string;
  name: string;
  platform: string;
}

const AdminWhatsApp = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [account, setAccount] = useState<WhatsAppAccount | null>(null);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Verificar status ao carregar
  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 5000); // Verificar a cada 5 segundos
    return () => clearInterval(interval);
  }, []);

  // Buscar QR Code quando disponível (polling a cada 3 segundos)
  useEffect(() => {
    let qrInterval: NodeJS.Timeout | null = null;

    if (status?.hasQR && !status?.connected) {
      // Buscar imediatamente
      fetchQRCode();

      // Polling para manter QR code atualizado
      qrInterval = setInterval(() => {
        fetchQRCode();
      }, 3000);
    }

    return () => {
      if (qrInterval) clearInterval(qrInterval);
    };
  }, [status]);

  // Buscar info da conta quando conectado
  useEffect(() => {
    if (status?.connected && !account) {
      fetchAccountInfo();
    }
  }, [status?.connected]);

  const checkStatus = async () => {
    try {
      const response = await api.get('/whatsapp/status');
      setStatus(response.data.status);
      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      setIsLoading(false);
    }
  };

  const fetchQRCode = async () => {
    try {
      const response = await api.get('/whatsapp/qr');
      setQrCode(response.data.qrCode);
    } catch (error) {
      console.error('Erro ao obter QR Code:', error);
    }
  };

  const fetchAccountInfo = async () => {
    try {
      const response = await api.get('/whatsapp/account');
      setAccount(response.data.account);
    } catch (error) {
      console.error('Erro ao obter informações da conta:', error);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Tem certeza que deseja desconectar o WhatsApp?')) return;

    try {
      await api.post('/whatsapp/disconnect');
      setStatus({ connected: false, hasQR: false, message: 'Desconectado' });
      setQrCode(null);
      setAccount(null);
      toast.success('WhatsApp desconectado');
    } catch (error) {
      toast.error('Erro ao desconectar WhatsApp');
      console.error(error);
    }
  };

  const handleReinitialize = async () => {
    try {
      toast.info('Gerando novo QR Code...');
      await api.post('/whatsapp/reinitialize');
      setQrCode(null);
      setStatus({ connected: false, hasQR: false, message: 'Reinicializando...' });
      toast.success('WhatsApp reinicializado! Aguarde o novo QR Code...');
    } catch (error) {
      toast.error('Erro ao reinicializar WhatsApp');
      console.error(error);
    }
  };

  const handleSendTestMessage = async () => {
    if (!testPhone || !testMessage) {
      toast.error('Preencha o número e a mensagem');
      return;
    }

    setIsSending(true);
    try {
      await api.post('/whatsapp/send', {
        to: testPhone,
        message: testMessage,
      });
      toast.success('Mensagem enviada com sucesso!');
      setTestMessage('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao enviar mensagem');
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
            <p className="text-muted-foreground">Carregando WhatsApp...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <MessageCircle className="h-8 w-8 text-green-600" />
            WhatsApp Business
          </h2>
          <p className="text-muted-foreground mt-2">
            Integração WhatsApp usando WPPConnect (nativo do CRM)
          </p>
        </div>

        {/* Info sobre implementação */}
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Implementação própria:</strong> O WhatsApp roda dentro do servidor do CRM.
            Sem APIs externas, sem custos extras, 100% integrado.
          </AlertDescription>
        </Alert>

        {/* Status Card */}
        <Alert className={status?.connected ? 'border-green-500 bg-green-50' : ''}>
          {status?.connected ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  Status: <Badge className={status?.connected ? 'bg-green-600' : 'bg-gray-500'}>
                    {status?.message}
                  </Badge>
                </p>
                {account && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Conta conectada: {account.name} ({account.phone})
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkStatus}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                {status?.connected && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDisconnect}
                  >
                    Desconectar
                  </Button>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* QR Code Card */}
        {status?.hasQR && !status?.connected && qrCode && (
          <Card className="border-2 border-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-6 w-6 text-green-600" />
                Escanear QR Code
              </CardTitle>
              <CardDescription>
                Abra o WhatsApp no celular e escaneie o código abaixo
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="bg-white p-4 rounded-lg border-2 border-green-500">
                <img
                  src={qrCode}
                  alt="QR Code WhatsApp"
                  className="w-64 h-64"
                />
              </div>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Como escanear:</strong><br />
                  WhatsApp → Mais opções (⋮) → Aparelhos conectados → Conectar aparelho
                </AlertDescription>
              </Alert>
              <Button
                variant="outline"
                onClick={handleReinitialize}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Gerar Novo QR Code
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Test Message Card (quando conectado) */}
        {status?.connected && (
          <Card>
            <CardHeader>
              <CardTitle>Enviar Mensagem de Teste</CardTitle>
              <CardDescription>
                Teste o envio de mensagens WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Número do destinatário (com código do país)
                </label>
                <Input
                  placeholder="Ex: 5511999999999"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Formato: Código do país + DDD + Número (sem espaços ou caracteres especiais)
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Mensagem
                </label>
                <Input
                  placeholder="Digite sua mensagem de teste"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                />
              </div>

              <Button
                onClick={handleSendTestMessage}
                disabled={isSending || !testPhone || !testMessage}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Mensagem de Teste
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Features Card (quando conectado) */}
        {status?.connected && (
          <Card>
            <CardHeader>
              <CardTitle>Funcionalidades Disponíveis</CardTitle>
              <CardDescription>O que você pode fazer agora</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Enviar mensagens</p>
                    <p className="text-xs text-muted-foreground">
                      Via API para qualquer número
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Receber mensagens</p>
                    <p className="text-xs text-muted-foreground">
                      Automaticamente via webhook
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Sessão persistente</p>
                    <p className="text-xs text-muted-foreground">
                      Não precisa escanear QR sempre
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">100% integrado</p>
                    <p className="text-xs text-muted-foreground">
                      Roda no mesmo servidor do CRM
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Technical Info Card */}
        <Card className="bg-slate-50">
          <CardHeader>
            <CardTitle className="text-base">Informações Técnicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tecnologia:</span>
              <span className="font-medium">WPPConnect</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Multidevice:</span>
              <Badge variant="outline">Habilitado</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Persistência:</span>
              <Badge variant="outline">Volume Docker</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">API Endpoints:</span>
              <span className="font-mono text-xs">/api/whatsapp/*</span>
            </div>
          </CardContent>
        </Card>

        {/* Help Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-900">Como funciona?</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• O WhatsApp inicia automaticamente quando o servidor liga</li>
                  <li>• Se for a primeira vez, você precisará escanear o QR Code</li>
                  <li>• A sessão fica salva e não precisa escanear novamente</li>
                  <li>• Todas as mensagens são processadas em tempo real</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminWhatsApp;
