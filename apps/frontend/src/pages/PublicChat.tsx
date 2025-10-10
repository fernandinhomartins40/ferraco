/**
 * PublicChat - Página pública de chat (acessível sem login)
 */

import { ChatInterface } from '@/components/chat/ChatInterface';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PublicChat = () => {
  const navigate = useNavigate();

  const handleSendMessage = (message: string) => {
    console.log('Mensagem enviada:', message);
    // Aqui será integrado com o backend futuramente
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header Público */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/assets/logo-ferraco.webp"
              alt="Ferraco Logo"
              className="h-10 w-auto"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Chat Ferraco</h1>
              <p className="text-sm text-gray-500">Atendimento Virtual</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Voltar ao Início</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Container do Chat */}
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-5xl mx-auto">
          {/* Informações antes do chat */}
          <div className="mb-6 bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">💬</span>
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-gray-900 mb-1">
                  Converse com nosso assistente virtual
                </h2>
                <p className="text-sm text-gray-600">
                  Estou aqui para ajudá-lo com informações sobre produtos, preços, prazos de
                  entrega e muito mais. Sinta-se à vontade para fazer suas perguntas!
                </p>
              </div>
            </div>
          </div>

          {/* Interface de Chat */}
          <ChatInterface onSendMessage={handleSendMessage} />

          {/* Informações de privacidade */}
          <div className="mt-4 text-center text-xs text-gray-500">
            <p>
              Suas conversas são privadas e seguras. Não compartilhamos suas informações com
              terceiros.
            </p>
            <p className="mt-1">
              © {new Date().getFullYear()} Ferraco Equipamentos. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PublicChat;
