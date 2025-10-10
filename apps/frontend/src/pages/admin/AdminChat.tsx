/**
 * AdminChat - Página de chat do admin com o bot
 */

import AdminLayout from '@/components/admin/AdminLayout';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Sparkles } from 'lucide-react';

export const AdminChat = () => {
  const handleSendMessage = (message: string) => {
    console.log('Mensagem enviada:', message);
    // Aqui será integrado com o backend futuramente
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            Chat com IA
          </h1>
          <p className="text-muted-foreground mt-1">
            Converse com o assistente virtual da Ferraco
          </p>
        </div>

        {/* Aviso sobre implementação */}
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Interface de demonstração:</strong> O chatbot inteligente será implementado
            após a conclusão do backend. Por enquanto, você pode visualizar a interface e testar
            o envio de mensagens.
          </AlertDescription>
        </Alert>

        {/* Grid com Chat e Informações */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <ChatInterface onSendMessage={handleSendMessage} />
          </div>

          {/* Sidebar com Informações */}
          <div className="space-y-6">
            {/* Recursos do Chatbot */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recursos do Chatbot</CardTitle>
                <CardDescription>O que o bot poderá fazer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                  <div>
                    <p className="text-sm font-medium">Respostas Inteligentes</p>
                    <p className="text-xs text-muted-foreground">
                      Utiliza IA para entender e responder perguntas
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                  <div>
                    <p className="text-sm font-medium">Informações de Produtos</p>
                    <p className="text-xs text-muted-foreground">
                      Fornece detalhes sobre equipamentos
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                  <div>
                    <p className="text-sm font-medium">Captação de Leads</p>
                    <p className="text-xs text-muted-foreground">
                      Coleta informações de contato automaticamente
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                  <div>
                    <p className="text-sm font-medium">Integração WhatsApp</p>
                    <p className="text-xs text-muted-foreground">
                      Conecta com WhatsApp Business API
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2" />
                  <div>
                    <p className="text-sm font-medium">Histórico de Conversas</p>
                    <p className="text-xs text-muted-foreground">
                      Armazena e recupera conversas anteriores
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dicas de Uso */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dicas de Uso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <p>Use <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> para enviar</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <p>Use <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Shift+Enter</kbd> para quebrar linha</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <p>Seja específico nas perguntas para melhores respostas</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <p>O histórico de conversas será salvo automaticamente</p>
                </div>
              </CardContent>
            </Card>

            {/* Status da Integração */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status da Integração</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Interface Visual</span>
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                    ✓ Completo
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Backend API</span>
                  <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                    ⏳ Pendente
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">IA Generativa</span>
                  <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                    ⏳ Pendente
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">WhatsApp API</span>
                  <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                    ⏳ Pendente
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminChat;
