/**
 * ForwardDialog - Dialog para encaminhar mensagens
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Loader2 } from 'lucide-react';
import api from '@/lib/apiClient';
import { toast } from 'sonner';

interface Contact {
  id: string;
  phone: string;
  name: string | null;
}

interface Conversation {
  id: string;
  contact: Contact;
}

interface ForwardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageId: string;
}

const ForwardDialog = ({ open, onOpenChange, messageId }: ForwardDialogProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (open) {
      fetchConversations();
    }
  }, [open]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = conversations.filter((conv) => {
        const name = conv.contact.name?.toLowerCase() || '';
        const phone = conv.contact.phone.toLowerCase();
        const query = searchQuery.toLowerCase();
        return name.includes(query) || phone.includes(query);
      });
      setFilteredConversations(filtered);
    } else {
      setFilteredConversations(conversations);
    }
  }, [searchQuery, conversations]);

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/whatsapp/conversations');
      setConversations(response.data.conversations);
      setFilteredConversations(response.data.conversations);
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
      toast.error('Erro ao carregar conversas');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelection = (convId: string) => {
    setSelectedIds((prev) =>
      prev.includes(convId)
        ? prev.filter((id) => id !== convId)
        : [...prev, convId]
    );
  };

  const handleForward = async () => {
    if (selectedIds.length === 0) {
      toast.error('Selecione pelo menos um contato');
      return;
    }

    setIsSending(true);
    try {
      // FASE C: Coletar números de telefone dos contatos selecionados
      const phoneNumbers: string[] = [];
      for (const convId of selectedIds) {
        const conv = conversations.find((c) => c.id === convId);
        if (conv) {
          phoneNumbers.push(conv.contact.phone);
        }
      }

      // FASE C: Encaminhar para múltiplos contatos de uma vez
      await api.post('/whatsapp/forward-message', {
        messageId,
        to: phoneNumbers, // Enviar array de números
      });

      toast.success(`Mensagem encaminhada para ${selectedIds.length} contato(s)`);
      setSelectedIds([]);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao encaminhar:', error);
      toast.error('Erro ao encaminhar mensagem');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Encaminhar mensagem</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar contato..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Contacts List */}
          <ScrollArea className="h-64 border rounded-md">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                Nenhum contato encontrado
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                    onClick={() => toggleSelection(conv.id)}
                  >
                    <Checkbox
                      checked={selectedIds.includes(conv.id)}
                      onCheckedChange={() => toggleSelection(conv.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {conv.contact.name || conv.contact.phone}
                      </p>
                      {conv.contact.name && (
                        <p className="text-xs text-gray-500 truncate">
                          {conv.contact.phone}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {selectedIds.length > 0 && (
            <p className="text-sm text-gray-600">
              {selectedIds.length} contato(s) selecionado(s)
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
            Cancelar
          </Button>
          <Button onClick={handleForward} disabled={isSending || selectedIds.length === 0}>
            {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Encaminhar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ForwardDialog;
