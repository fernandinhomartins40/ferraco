/**
 * CreateGroupDialog - Dialog para criar novo grupo WhatsApp
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
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Loader2, Users } from 'lucide-react';
import api from '@/lib/apiClient';
import { toast } from 'sonner';
import type { Contact } from '@/types/whatsapp';

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (groupId: string) => void;
}

const CreateGroupDialog = ({
  open,
  onOpenChange,
  onCreated,
}: CreateGroupDialogProps) => {
  const [groupName, setGroupName] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

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
      const contactsList = response.data.data || [];

      // Filtrar apenas contatos individuais (não grupos)
      const individualContacts = contactsList.filter(
        (c: Contact) => !c.isGroup
      );

      setContacts(individualContacts);
      setFilteredContacts(individualContacts);
    } catch (error) {
      console.error('Erro ao buscar contatos:', error);
      toast.error('Erro ao carregar contatos');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleContact = (contactId: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleCreate = async () => {
    // Validações
    if (!groupName.trim()) {
      toast.error('Nome do grupo é obrigatório');
      return;
    }

    if (selectedContacts.length === 0) {
      toast.error('Selecione pelo menos 1 participante');
      return;
    }

    setIsCreating(true);
    try {
      // Obter números de telefone dos contatos selecionados
      const participantNumbers = selectedContacts
        .map((contactId) => {
          const contact = contacts.find((c) => c.id === contactId);
          return contact?.phone;
        })
        .filter(Boolean) as string[];

      const response = await api.post('/whatsapp/groups', {
        name: groupName.trim(),
        participants: participantNumbers,
      });

      toast.success(`Grupo "${groupName}" criado com sucesso!`);

      const groupId = response.data.data?.gid?.id || response.data.data?.id;

      resetForm();
      onOpenChange(false);

      if (groupId && onCreated) {
        onCreated(groupId);
      }
    } catch (error: any) {
      console.error('Erro ao criar grupo:', error);
      toast.error('Erro ao criar grupo');
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setGroupName('');
    setSelectedContacts([]);
    setSearchQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Criar Novo Grupo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Group Name */}
          <div className="space-y-2">
            <Label htmlFor="groupName">Nome do Grupo *</Label>
            <Input
              id="groupName"
              placeholder="Ex: Equipe de Vendas"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Participants */}
          <div className="space-y-2">
            <Label>Participantes (mínimo 1)</Label>

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
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                      onClick={() => toggleContact(contact.id)}
                    >
                      <Checkbox
                        checked={selectedContacts.includes(contact.id)}
                        onCheckedChange={() => toggleContact(contact.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {contact.name || contact.phone}
                        </p>
                        {contact.name && (
                          <p className="text-xs text-gray-500 truncate">
                            {contact.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {selectedContacts.length > 0 && (
              <p className="text-sm text-gray-600">
                {selectedContacts.length} participante(s) selecionado(s)
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating || !groupName.trim() || selectedContacts.length === 0}
          >
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Grupo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupDialog;
