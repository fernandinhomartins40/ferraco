/**
 * ChatMessage - Componente de mensagem individual estilo WhatsApp
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.sender === 'user';
  const isBot = message.sender === 'bot';

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusIcon = () => {
    if (!isUser) return null;

    switch (message.status) {
      case 'sending':
        return <Check className="h-3 w-3 text-muted-foreground" />;
      case 'sent':
        return <Check className="h-3 w-3 text-muted-foreground" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        'flex gap-2 mb-4 animate-in fade-in slide-in-from-bottom-2',
        isUser && 'flex-row-reverse'
      )}
    >
      {/* Avatar */}
      {isBot && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src="/assets/logo-ferraco.webp" alt="Ferraco Bot" />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            FB
          </AvatarFallback>
        </Avatar>
      )}

      {/* Mensagem */}
      <div
        className={cn(
          'flex flex-col max-w-[75%] sm:max-w-[65%]',
          isUser && 'items-end'
        )}
      >
        <div
          className={cn(
            'rounded-lg px-4 py-2 shadow-sm',
            isUser
              ? 'bg-[#DCF8C6] text-gray-900'
              : 'bg-white text-gray-900 border border-gray-200'
          )}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>

          <div
            className={cn(
              'flex items-center gap-1 mt-1',
              isUser ? 'justify-end' : 'justify-start'
            )}
          >
            <span className="text-[10px] text-gray-500">
              {formatTime(message.timestamp)}
            </span>
            {getStatusIcon()}
          </div>
        </div>
      </div>
    </div>
  );
};
