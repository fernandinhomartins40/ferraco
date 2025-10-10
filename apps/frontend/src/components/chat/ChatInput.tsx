/**
 * ChatInput - Componente de entrada de mensagens estilo WhatsApp
 */

import { useState, useRef, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput = ({
  onSendMessage,
  disabled = false,
  placeholder = 'Digite uma mensagem...',
}: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage);
      setMessage('');

      // Reseta a altura do textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Envia com Enter (sem Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Auto-resize do textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="flex items-end gap-2">
        {/* Botão de anexo (futuro) */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="flex-shrink-0 text-gray-500 hover:text-gray-700"
          disabled={disabled}
          title="Anexar arquivo (em breve)"
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        {/* Input de mensagem */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              'min-h-[44px] max-h-[120px] resize-none pr-10',
              'rounded-lg border-gray-300 focus:border-primary',
              'text-sm leading-relaxed'
            )}
            rows={1}
          />

          {/* Botão de emoji (futuro) */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 bottom-2 h-6 w-6 text-gray-500 hover:text-gray-700"
            disabled={disabled}
            title="Emoji (em breve)"
          >
            <Smile className="h-4 w-4" />
          </Button>
        </div>

        {/* Botão de enviar */}
        <Button
          type="button"
          size="icon"
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className={cn(
            'flex-shrink-0 rounded-full h-11 w-11',
            'bg-primary hover:bg-primary/90',
            'transition-all duration-200',
            message.trim() && !disabled && 'scale-100',
            (!message.trim() || disabled) && 'scale-95 opacity-50'
          )}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>

      <p className="text-xs text-gray-500 mt-2 text-center">
        Pressione <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Enter</kbd> para
        enviar • <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Shift + Enter</kbd>{' '}
        para nova linha
      </p>
    </div>
  );
};
