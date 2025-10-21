/**
 * SendContactDialog - Dialog para enviar contato (vCard)
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
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Loader2, User } from 'lucide-react';
import api from '@/lib/apiClient';
import { toast } from 'sonner';
import type { Contact, ContactSendOptions } from '@/types/whatsapp';

interface SendContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactPhone: string;
  onSent?: () => void;
}

const SendContactDialog = ({
  open,
  onOpenChange,
  contactPhone,
  onSent,
}: SendContactDialogProps) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (open) {
      fetchContacts();
    }
  }, [open]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = contacts.filter((contact) => {
        const name = contact.name?.toLowerCase() || '';
        const phone = contact.phone.toLowerCase();
        const query = searchQuery.toLowerCase();
        return name.includes(query) || phone.includes(query);
      });
      setFilteredContacts(filtered);
    } else {
      setFilteredContacts(contacts);
    }
  }, [searchQuery, contacts]);

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/whatsapp/contacts');
      setContacts(response.data.data || []);
      setFilteredContacts(response.data.data || []);
    } catch (error) {
      console.error('Erro ao buscar contatos:', error);
      toast.error('Erro ao carregar contatos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!selectedContact) {
      toast.error('Selecione um contato');
      return;
    }

    setIsSending(true);
    try {
      const payload: ContactSendOptions = {
        to: contactPhone,
        contactId: selectedContact.id,
        name: selectedContact.name || selectedContact.phone,
      };

      await api.post('/whatsapp/send-contact', payload);

      toast.success('Contato enviado com sucesso!');
      setSelectedContact(null);
      onOpenChange(false);
      onSent?.();
    } catch (error: any) {
      console.error('Erro ao enviar contato:', error);
      toast.error('Erro ao enviar contato');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar Contato</DialogTitle>
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
            ) : filteredContacts.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                Nenhum contato encontrado
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${
                      selectedContact?.id === contact.id
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                    onClick={() => setSelectedContact(contact)}
                  >
                    {contact.profilePicUrl ? (
                      <img
                        src={contact.profilePicUrl}
                        alt={contact.name || contact.phone}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-500" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {contact.name || contact.phone}
                      </p>
                      {contact.name && (
                        <p className="text-xs text-gray-500 truncate">
                          {contact.phone}
                        </p>
                      )}
                      {contact.isBusiness && (
                        <span className="inline-block text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded mt-1">
                          Business
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {selectedContact && (
            <div className="p-3 bg-blue-50 rounded-md">
              <p className="text-sm font-medium text-blue-900">
                Contato selecionado:
              </p>
              <p className="text-sm text-blue-700">
                {selectedContact.name || selectedContact.phone}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={isSending || !selectedContact}>
            {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar Contato
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendContactDialog;
