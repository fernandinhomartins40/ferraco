/**
 * AdminWhatsApp - Gerenciamento completo do WhatsApp
 *
 * Aba 1: Configurações e Conexão
 * Aba 2: Chat (histórico de conversas + área de mensagens)
 * FASE 4: Otimizado com lazy loading e code splitting
 */

import { useState, useEffect, lazy, Suspense } from 'react';
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
import { useWhatsAppSocket, type WhatsAppStatus as SocketWhatsAppStatus } from '@/hooks/useWhatsAppSocket';
// import { SocketDebug } from '@/components/debug/SocketDebug'; // ✅ Debug removido - problema resolvido

// ✅ FASE 4: Lazy loading de componentes pesados (code splitting)
const ConversationList = lazy(() => import('@/components/whatsapp/ConversationList'));
const ChatArea = lazy(() => import('@/components/whatsapp/ChatArea'));
const GroupManagement = lazy(() => import('@/components/whatsapp/GroupManagement'));
const ContactManagement = lazy(() => import('@/components/whatsapp/ContactManagement'));

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
  const [account, setAccount] = useState<WhatsAppAccount | null>(null);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showGroupManagement, setShowGroupManagement] = useState(false);
  const [showContactManagement, setShowContactManagement] = useState(false);

  // ✅ FASE 3: Socket.IO + State Machine
  const {
    connectionState,
    qrCode,
    status: socketStatus,
    isConnected,
    error: socketError,
    account: whatsappAccount,
    requestStatus,
    reconnect,
    connectionStatus,
    isQRAvailable: hasQR,
    isAuthenticating,
  } = useWhatsAppSocket({
    onQRCode: (qr) => {
      console.log('📱 QR Code recebido via Socket.IO');
      toast.success('QR Code atualizado! Escaneie com seu telefone.');
    },
    onStatusChange: (newStatus) => {
      console.log('🔄 Status alterado via Socket.IO:', newStatus);

      // Mapear status do socket para status antigo (compatibilidade)
      const mappedStatus: WhatsAppStatus = {
        connected: newStatus === 'CONNECTED',
        hasQR: hasQR,
        message: getStatusMessage(newStatus),
      };

      setStatus(mappedStatus);
      setIsLoading(false);
    },
    onReady: () => {
      console.log('✅ WhatsApp pronto para uso');
      toast.success('WhatsApp conectado com sucesso!');
    },
    onDisconnected: (reason) => {
      console.log('❌ WhatsApp desconectado:', reason);
      toast.error(`WhatsApp desconectado: ${reason}`);
      setAccount(null);
    },
    onError: (error) => {
      console.error('❌ Erro no Socket.IO:', error);
      toast.error(`Erro: ${error}`);
    },
  });

  // ✅ FASE 3: Sincronizar account do State Machine com estado local
  useEffect(() => {
    if (whatsappAccount) {
      setAccount(whatsappAccount);
    }
  }, [whatsappAccount]);

  // Helper: Mapear status do socket para mensagem
  const getStatusMessage = (status: SocketWhatsAppStatus): string => {
    const messages: Record<SocketWhatsAppStatus, string> = {
      CONNECTED: 'Conectado ao WhatsApp',
      DISCONNECTED: 'Desconectado',
      INITIALIZING: 'Inicializando conexão...',
      notConnected: 'Não conectado',
      qrReadSuccess: 'QR Code lido com sucesso',
      qrReadFail: 'Falha ao ler QR Code',
      autocloseCalled: 'Sessão encerrada',
      desconnectedMobile: 'Desconectado do celular',
      browserClose: 'Navegador fechado',
    };
    return messages[status] || 'Status desconhecido';
  };

  // ✅ AUTO-REQUEST: Solicitar status E QR Code ao carregar
  useEffect(() => {
    // Pequeno delay para garantir que socket conectou
    const timer = setTimeout(() => {
      requestStatus();
    }, 500);

    return () => clearTimeout(timer);
  }, [requestStatus]);

  // ✅ AUTO-GENERATE QR: Solicitar QR Code automaticamente quando desconectado
  useEffect(() => {
    if (!isConnected && connectionState.type === 'disconnected' && !qrCode && !isAuthenticating) {
      console.log('🔄 Não conectado e sem QR Code - solicitando automaticamente...');
      const timer = setTimeout(() => {
        handleReinitialize();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isConnected, connectionState.type, qrCode, isAuthenticating]);

  // ✅ REMOVIDO: checkStatus() - substituído por Socket.IO
  // ✅ REMOVIDO: fetchQRCode() - substituído por Socket.IO

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
      // QR Code será limpo automaticamente pelo hook useWhatsAppSocket
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
      // QR Code será atualizado automaticamente pelo hook useWhatsAppSocket
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
        <Tabs defaultValue="config" className="w-full">
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
                  <div className={`
                    w-full md:w-96 border-r flex-shrink-0 bg-white
                    ${selectedConversationId ? 'hidden md:block' : 'block'}
                  `}>
                    {/* ✅ FASE 4: Suspense para lazy loading */}
                    <Suspense fallback={
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                      </div>
                    }>
                      <ConversationList
                        selectedId={selectedConversationId}
                        onSelectConversation={setSelectedConversationId}
                      />
                    </Suspense>
                  </div>

                  {/* Área Principal - Chat */}
                  <div className={`
                    flex-1 flex flex-col bg-gray-50
                    ${selectedConversationId ? 'block w-full' : 'hidden md:flex'}
                  `}>
                    {selectedConversationId ? (
                      <Suspense fallback={
                        <div className="flex items-center justify-center h-full">
                          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                      }>
                        <ChatArea conversationId={selectedConversationId} onBack={() => setSelectedConversationId(null)} />
                      </Suspense>
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
                      onClick={requestStatus}
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
            {/* ✅ FIX: Usar qrCode do Socket diretamente, não status?.hasQR */}
            {qrCode && !isConnected && (
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
                    {qrCode.startsWith('data:image') ? (
                      <img
                        src={qrCode}
                        alt="QR Code WhatsApp"
                        className="w-64 h-64"
                        onError={(e) => {
                          console.error('Erro ao carregar QR Code');
                          toast.error('Erro ao exibir QR Code. Tente reinicializar.');
                        }}
                      />
                    ) : (
                      <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded">
                        <p className="text-sm text-gray-500 text-center px-4">
                          Formato de QR Code inválido.<br/>
                          Clique em "Gerar Novo QR Code" abaixo.
                        </p>
                      </div>
                    )}
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
      {/* ✅ FASE 4: Lazy loading condicional (só carrega se modal aberto) */}
      {showGroupManagement && (
        <Suspense fallback={null}>
          <GroupManagement
            open={showGroupManagement}
            onOpenChange={setShowGroupManagement}
            mode="create"
          />
        </Suspense>
      )}
      {showContactManagement && (
        <Suspense fallback={null}>
          <ContactManagement
            open={showContactManagement}
            onOpenChange={setShowContactManagement}
          />
        </Suspense>
      )}
    </AdminLayout>
  );
};

export default AdminWhatsApp;
