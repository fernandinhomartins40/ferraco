/**
 * ChatInterface - Interface de chat com fluxo conversacional profissional
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
import api from '@/lib/apiClient';

interface ChatOption {
  id: string;
  label: string;
}

interface ChatInterfaceProps {
  onSendMessage?: (message: string) => void;
  source?: string;
  campaign?: string;
}

export const ChatInterface = ({ onSendMessage, source = 'website', campaign }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentOptions, setCurrentOptions] = useState<ChatOption[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Inicializar sessão do chatbot
  useEffect(() => {
    const initSession = async () => {
      try {
        const response = await api.post('/chatbot/session/start', {
          userAgent: navigator.userAgent,
          source,
          campaign,
        });

        const { session, message, options } = response.data.data;

        setSessionId(session.sessionId);
        setCurrentOptions(options || []);

        // Adicionar mensagem de boas-vindas
        const welcomeMsg: Message = {
          id: '1',
          content: message,
          sender: 'bot',
          timestamp: new Date(),
          status: 'read',
        };

        setMessages([welcomeMsg]);
        setIsInitialized(true);
      } catch (error) {
        console.error('Erro ao iniciar sessão do chatbot:', error);

        // Fallback message
        const fallbackMsg: Message = {
          id: '1',
          content: 'Desculpe, houve um erro ao iniciar o chat. Por favor, recarregue a página.',
          sender: 'bot',
          timestamp: new Date(),
          status: 'read',
        };
        setMessages([fallbackMsg]);
      }
    };

    if (!isInitialized) {
      initSession();
    }
  }, [isInitialized]);

  // Enviar mensagem para o backend
  const sendMessageToBot = async (content: string, optionId?: string) => {
    if (!sessionId) {
      console.error('Sem sessionId');
      return;
    }

    try {
      setIsTyping(true);

      const response = await api.post(
        `/chatbot/session/${sessionId}/message`,
        {
          message: content,
          optionId,
        }
      );

      const { message: botMessage, options } = response.data.data;

      setIsTyping(false);

      // Adicionar resposta do bot
      const botMsg: Message = {
        id: Date.now().toString(),
        content: botMessage,
        sender: 'bot',
        timestamp: new Date(),
        status: 'read',
      };

      setMessages((prev) => [...prev, botMsg]);
      setCurrentOptions(options || []);
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      setIsTyping(false);

      const errorMsg: Message = {
        id: Date.now().toString(),
        content:
          error.response?.data?.message ||
          'Desculpe, houve um erro ao processar sua mensagem.',
        sender: 'bot',
        timestamp: new Date(),
        status: 'read',
      };

      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  // Manipular envio de mensagem de texto
  const handleSendMessage = (content: string) => {
    // Adicionar mensagem do usuário
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

    // Limpar opções
    setCurrentOptions([]);

    // Enviar para o backend
    sendMessageToBot(content);
  };

  // Manipular clique em botão de opção
  const handleOptionClick = (option: ChatOption) => {
    // Adicionar como mensagem do usuário
    const userMessage: Message = {
      id: Date.now().toString(),
      content: option.label,
      sender: 'user',
      timestamp: new Date(),
      status: 'sending',
    };

    setMessages((prev) => [...prev, userMessage]);

    // Limpar opções
    setCurrentOptions([]);

    // Enviar para o backend com optionId
    sendMessageToBot(option.label, option.id);
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

          {/* Botões de Opções */}
          {currentOptions.length > 0 && !isTyping && (
            <div className="flex flex-col gap-2 mb-4 max-w-md">
              {currentOptions.map((option) => (
                <Button
                  key={option.id}
                  onClick={() => handleOptionClick(option)}
                  variant="outline"
                  className="w-full text-left justify-start bg-white hover:bg-gray-50 border-2 border-primary/20 hover:border-primary/40 transition-all"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </ScrollArea>
      </div>

      {/* Input de Mensagem */}
      <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
    </Card>
  );
};
