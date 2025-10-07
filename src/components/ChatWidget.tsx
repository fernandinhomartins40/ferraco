import React, { useState, useEffect, useRef } from 'react';
import { Send, Minimize2, Maximize2, X, MessageCircle, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatbot } from '@/hooks/useChatbot';
import { cn } from '@/lib/utils';

interface ChatWidgetProps {
  leadId: string;
  initialOpen?: boolean;
  className?: string;
}

export function ChatWidget({ leadId, initialOpen = false, className }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [ollamaHealthy, setOllamaHealthy] = useState<boolean | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    isLoading,
    error,
    isQualified,
    sendMessage,
    loadHistory,
    checkHealth
  } = useChatbot(leadId);

  // Carregar histórico ao abrir
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadHistory();
    }
  }, [isOpen, loadHistory, messages.length]);

  // Verificar saúde do Ollama ao montar
  useEffect(() => {
    const verifyHealth = async () => {
      const healthy = await checkHealth();
      setOllamaHealthy(healthy);
    };
    verifyHealth();
  }, [checkHealth]);

  // Auto-scroll ao receber nova mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focar input ao abrir
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue;
    setInputValue('');

    try {
      await sendMessage(message);
    } catch (err) {
      console.error('Erro ao enviar:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Botão flutuante quando fechado
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 z-50",
          className
        )}
        aria-label="Abrir chat"
      >
        <MessageCircle className="w-6 h-6" />
        {ollamaHealthy === false && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 bg-white rounded-lg shadow-2xl border border-gray-200 transition-all z-50",
        isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          <h3 className="font-semibold">Assistente Ferraco</h3>
          {isQualified && (
            <CheckCircle className="w-4 h-4 text-green-300" title="Lead qualificado!" />
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="hover:bg-blue-700 p-1 rounded transition-colors"
            aria-label={isMinimized ? "Maximizar" : "Minimizar"}
          >
            {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="hover:bg-blue-700 p-1 rounded transition-colors"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Status do Ollama */}
          {ollamaHealthy === false && (
            <div className="bg-yellow-50 border-b border-yellow-200 p-2 flex items-center gap-2 text-yellow-800 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>IA temporariamente indisponível. Verifique se o Ollama está rodando.</span>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border-b border-red-200 p-2 flex items-center gap-2 text-red-800 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Messages */}
          <ScrollArea
            ref={scrollRef}
            className={cn(
              "p-4",
              ollamaHealthy === false || error ? "h-[calc(100%-200px)]" : "h-[calc(100%-140px)]"
            )}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "mb-4 flex",
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] p-3 rounded-lg",
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  <span className={cn(
                    "text-xs mt-1 block",
                    msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                  )}>
                    {msg.timestamp.toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-100 p-3 rounded-lg rounded-bl-none">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t bg-gray-50 rounded-b-lg">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua mensagem..."
                disabled={isLoading || ollamaHealthy === false}
                className="flex-1 bg-white"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim() || ollamaHealthy === false}
                size="icon"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send size={18} />
              </Button>
            </div>
            {isQualified && (
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Lead qualificado! Nosso time entrará em contato em breve.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
