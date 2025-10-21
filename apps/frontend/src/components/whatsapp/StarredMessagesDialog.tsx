/**
 * StarredMessagesDialog - Dialog para visualizar mensagens estreladas
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Star, Loader2, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '@/lib/apiClient';
import { toast } from 'sonner';
import type { Message } from '@/types/whatsapp';
import MediaViewer from './MediaViewer';

interface StarredMessagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const StarredMessagesDialog = ({
  open,
  onOpenChange,
}: StarredMessagesDialogProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchStarredMessages();
    }
  }, [open]);

  const fetchStarredMessages = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/whatsapp/starred-messages');
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Erro ao buscar mensagens estreladas:', error);
      toast.error('Erro ao carregar mensagens estreladas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnstar = async (messageId: string) => {
    try {
      await api.post('/whatsapp/star-message', {
        messageId,
        star: false,
      });

      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      toast.success('Mensagem desfavoritada');
    } catch (error) {
      console.error('Erro ao desfavoritar:', error);
      toast.error('Erro ao desfavoritar mensagem');
    }
  };

  const formatMessageDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "d 'de' MMM 'às' HH:mm", { locale: ptBR });
    } catch {
      return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            Mensagens Estreladas
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Star className="h-16 w-16 mb-4" />
            <p>Nenhuma mensagem estrelada</p>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="space-y-3 p-2">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {message.fromMe ? 'Você' : message.contact.name || message.contact.phone}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatMessageDate(message.timestamp)}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleUnstar(message.id)}
                      title="Remover estrela"
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>

                  {/* Quoted Message */}
                  {message.quotedMessage && (
                    <div className="mb-2 p-2 rounded border-l-4 border-gray-300 bg-gray-100">
                      <p className="text-xs font-semibold opacity-80">
                        {message.quotedMessage.fromMe ? 'Você' : message.quotedMessage.contact.name}
                      </p>
                      <p className="text-xs opacity-70 truncate">
                        {message.quotedMessage.content}
                      </p>
                    </div>
                  )}

                  {/* Media */}
                  {message.mediaUrl && (
                    <div className="mb-2">
                      <MediaViewer
                        type={message.mediaType as any || 'document'}
                        url={message.mediaUrl}
                        filename={message.content || 'arquivo'}
                        onDownload={() => {
                          // Download handler
                          window.open(message.mediaUrl!, '_blank');
                        }}
                      />
                    </div>
                  )}

                  {/* Content */}
                  {message.content && (
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StarredMessagesDialog;
