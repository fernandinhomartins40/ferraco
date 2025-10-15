/**
 * MessageInput - Input de mensagem com botão de envio
 */

import { useState, useRef, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, Smile, Mic } from 'lucide-react';
import { toast } from 'sonner';

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<void>;
}

const MessageInput = ({ onSendMessage }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if (!message.trim() || isSending) return;

    try {
      setIsSending(true);
      await onSendMessage(message.trim());
      setMessage('');

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      toast.success('Mensagem enviada!');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  return (
    <div className="border-t bg-white px-3 md:px-4 py-2 md:py-3">
      <div className="flex items-end gap-1.5 md:gap-2">
        {/* Attachment Button */}
        <Button variant="ghost" size="icon" className="flex-shrink-0 hidden sm:flex">
          <Paperclip className="h-5 w-5 text-gray-500" />
        </Button>

        {/* Message Input */}
        <div className="flex-1 relative min-w-0">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Digite uma mensagem..."
            className="resize-none min-h-[40px] md:min-h-[44px] max-h-[120px] md:max-h-[200px] pr-10 text-sm md:text-base"
            rows={1}
            disabled={isSending}
          />

          {/* Emoji Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 md:right-2 bottom-1 md:bottom-2 h-7 w-7 md:h-8 md:w-8 hidden sm:flex"
          >
            <Smile className="h-4 w-4 md:h-5 md:w-5 text-gray-500" />
          </Button>
        </div>

        {/* Send/Voice Button */}
        {message.trim() ? (
          <Button
            onClick={handleSend}
            disabled={isSending}
            size="icon"
            className="flex-shrink-0 bg-green-500 hover:bg-green-600 h-10 w-10"
          >
            <Send className="h-5 w-5" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className="flex-shrink-0 h-10 w-10 hidden sm:flex">
            <Mic className="h-5 w-5 text-gray-500" />
          </Button>
        )}
      </div>

      {/* Hint Text - Hidden on mobile */}
      <p className="text-xs text-gray-400 mt-2 text-center hidden md:block">
        Pressione Enter para enviar, Shift + Enter para nova linha
      </p>
    </div>
  );
};

export default MessageInput;
