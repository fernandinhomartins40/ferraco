/**
 * ChatInterface - Interface de chat completa estilo WhatsApp
 */

import { useState, useEffect, useRef } from 'react';
import { ChatMessage, Message } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical, Search, Phone, Video } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatInterfaceProps {
  onSendMessage?: (message: string) => void;
  initialMessages?: Message[];
}

export const ChatInterface = ({
  onSendMessage,
  initialMessages = [],
}: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Simula mensagens iniciais
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessages: Message[] = [
        {
          id: '1',
          content:
            'Olá! 👋 Bem-vindo ao chat da Ferraco!\n\nSou o assistente virtual e estou aqui para ajudá-lo.',
          sender: 'bot',
          timestamp: new Date(Date.now() - 5000),
          status: 'read',
        },
        {
          id: '2',
          content:
            'Como posso ajudá-lo hoje? Você pode me perguntar sobre:\n\n• Nossos produtos\n• Preços e orçamentos\n• Formas de pagamento\n• Prazos de entrega\n• Suporte técnico',
          sender: 'bot',
          timestamp: new Date(Date.now() - 3000),
          status: 'read',
        },
      ];
      setMessages(welcomeMessages);
    }
  }, []);

  const handleSendMessage = (content: string) => {
    // Adiciona mensagem do usuário
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
      status: 'sending',
    };

    setMessages((prev) => [...prev, userMessage]);

    // Callback opcional
    if (onSendMessage) {
      onSendMessage(content);
    }

    // Simula envio e resposta (será substituído pelo backend)
    setTimeout(() => {
      // Atualiza status da mensagem
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id ? { ...msg, status: 'delivered' as const } : msg
        )
      );

      // Simula "digitando..."
      setIsTyping(true);

      setTimeout(() => {
        setIsTyping(false);

        // Resposta automática (placeholder)
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          content:
            'Obrigado pela sua mensagem! 😊\n\nEm breve, nosso chatbot inteligente será implementado para responder suas perguntas automaticamente.\n\nPor enquanto, esta é uma mensagem de demonstração.',
          sender: 'bot',
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botResponse]);
      }, 1500);
    }, 500);
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-none border-0 rounded-none">
      {/* Header do Chat */}
      <div className="flex items-center justify-between p-4 bg-[#075E54] text-white border-b">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src="/assets/logo-ferraco.webp" alt="Ferraco Bot" />
            <AvatarFallback className="bg-white text-primary">FB</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-sm">Ferraco Bot</h3>
            <p className="text-xs text-green-200 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              {isTyping ? 'Digitando...' : 'Online'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 h-9 w-9"
            title="Buscar"
          >
            <Search className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 h-9 w-9"
            title="Ligar"
          >
            <Phone className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 h-9 w-9"
            title="Videochamada"
          >
            <Video className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 h-9 w-9"
            title="Mais opções"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 bg-[#E5DDD5] bg-opacity-30 relative overflow-hidden">
        {/* Background pattern (WhatsApp style) */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          {/* Badge de data */}
          <div className="flex justify-center mb-4">
            <Badge variant="secondary" className="bg-white/90 text-xs shadow-sm">
              Hoje
            </Badge>
          </div>

          {/* Mensagens */}
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {/* Indicador de "digitando..." */}
          {isTyping && (
            <div className="flex gap-2 mb-4">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src="/assets/logo-ferraco.webp" alt="Ferraco Bot" />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  FB
                </AvatarFallback>
              </Avatar>
              <div className="bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                  <span
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  ></span>
                  <span
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.4s' }}
                  ></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </ScrollArea>
      </div>

      {/* Input de Mensagem */}
      <ChatInput onSendMessage={handleSendMessage} />
    </Card>
  );
};
