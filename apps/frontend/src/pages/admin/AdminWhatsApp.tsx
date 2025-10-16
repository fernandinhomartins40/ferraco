/**
 * AdminWhatsApp - Gerenciamento completo do WhatsApp
 *
 * Aba 1: Configurações e Conexão
 * Aba 2: Chat (histórico de conversas + área de mensagens)
 */

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageCircle,
  QrCode,
  CheckCircle,
  AlertCircle,
  Info,
  Loader2,
  Send,
  RefreshCw,
  Settings,
  MessageSquare,
  Users,
  UserCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/apiClient';
import ConversationList from '@/components/whatsapp/ConversationList';
import ChatArea from '@/components/whatsapp/ChatArea';
import GroupManagement from '@/components/whatsapp/GroupManagement';
import ContactManagement from '@/components/whatsapp/ContactManagement';

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
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showGroupManagement, setShowGroupManagement] = useState(false);
  const [showContactManagement, setShowContactManagement] = useState(false);

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

  const handleSyncChats = async () => {
    setIsSyncing(true);
    try {
      toast.info('Sincronizando chats e contatos...');
      await api.post('/whatsapp/sync-chats');
      toast.success('Sincronização iniciada! Aguarde alguns segundos e recarregue a aba Chat.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao sincronizar chats');
      console.error(error);
    } finally {
      setIsSyncing(false);
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">WhatsApp Business</h1>
            <p className="text-muted-foreground">
              Gerencie suas conversas e configure a integração WhatsApp
            </p>
          </div>
          {status?.connected && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowContactManagement(true)}
                className="flex items-center gap-2"
              >
                <UserCircle className="h-4 w-4" />
                Contatos
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGroupManagement(true)}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Criar Grupo
              </Button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          {/* ABA 1: CHAT - Estilo WhatsApp Web */}
          <TabsContent value="chat" className="mt-6">
            {!status?.connected ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <MessageCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">WhatsApp não conectado</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Para acessar suas conversas, conecte o WhatsApp na aba "Configurações"
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const configTab = document.querySelector('[value="config"]') as HTMLElement;
                        configTab?.click();
                      }}
                    >
                      Ir para Configurações
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-[calc(100vh-16rem)] min-h-[500px]">
                <div className="flex h-full overflow-hidden">
                  {/* Sidebar - Lista de Conversas */}
                  <div className={`w-full md:w-96 border-r flex-shrink-0 bg-white ${selectedConversationId ? 'hidden md:block' : 'block'}`}>
                    <ConversationList
                      selectedId={selectedConversationId}
                      onSelectConversation={setSelectedConversationId}
                    />
                  </div>

                  {/* Área Principal - Chat */}
                  <div className={`flex-1 flex flex-col bg-gray-50 ${selectedConversationId ? 'block' : 'hidden md:flex'}`}>
                    {selectedConversationId ? (
                      <ChatArea conversationId={selectedConversationId} onBack={() => setSelectedConversationId(null)} />
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <MessageCircle className="h-24 w-24 mx-auto mb-4" />
                          <h3 className="text-lg font-medium">Selecione uma conversa</h3>
                          <p className="text-sm mt-2">
                            Escolha uma conversa na lista ao lado para começar
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* ABA 2: CONFIGURAÇÕES - Conexão e Testes */}
          <TabsContent value="config" className="mt-6 space-y-6">
            {/* Status Card */}
            <Alert className={status?.connected ? 'border-green-500' : 'border-gray-300'}>
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
                      title="Atualizar status"
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
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Número (com DDD)</label>
                    <Input
                      type="text"
                      placeholder="Ex: 11999999999"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mensagem</label>
                    <Input
                      type="text"
                      placeholder="Digite sua mensagem..."
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isSending) {
                          handleSendTestMessage();
                        }
                      }}
                    />
                  </div>

                  <Button
                    onClick={handleSendTestMessage}
                    disabled={isSending || !testPhone || !testMessage}
                    className="w-full"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Enviar Mensagem
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Info Cards */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Como Funciona</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>1. Escaneie o QR Code com seu WhatsApp</p>
                  <p>2. Aguarde a conexão ser estabelecida</p>
                  <p>3. Acesse suas conversas na aba "Chat"</p>
                  <p>4. Todas as mensagens são salvas no banco de dados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Tecnologia</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>• WPPConnect (WhatsApp Web API)</p>
                  <p>• Socket.io (tempo real)</p>
                  <p>• PostgreSQL (persistência)</p>
                  <p>• React + TypeScript</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modais de Gerenciamento */}
      <GroupManagement
        open={showGroupManagement}
        onOpenChange={setShowGroupManagement}
        mode="create"
      />
      <ContactManagement
        open={showContactManagement}
        onOpenChange={setShowContactManagement}
      />
    </AdminLayout>
  );
};

export default AdminWhatsApp;
