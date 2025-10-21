/**
 * WhatsAppContacts - Página completa de contatos do WhatsApp
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  User,
  Phone,
  MessageSquare,
  Loader2,
  CheckCircle2,
  XCircle,
  Building2,
  Users,
} from 'lucide-react';
import api from '@/lib/apiClient';
import { toast } from 'sonner';
import type { Contact } from '@/types/whatsapp';

const WhatsAppContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [checkingNumbers, setCheckingNumbers] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<'all' | 'individual' | 'group' | 'business'>('all');

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    filterContacts();
  }, [searchQuery, contacts, filterType]);

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/whatsapp/contacts');
      const contactsList = response.data.data || [];

      setContacts(contactsList);
      setFilteredContacts(contactsList);
    } catch (error) {
      console.error('Erro ao buscar contatos:', error);
      toast.error('Erro ao carregar contatos');
    } finally {
      setIsLoading(false);
    }
  };

  const filterContacts = () => {
    let filtered = contacts;

    // Filtrar por tipo
    if (filterType === 'individual') {
      filtered = filtered.filter((c) => !c.isGroup);
    } else if (filterType === 'group') {
      filtered = filtered.filter((c) => c.isGroup);
    } else if (filterType === 'business') {
      filtered = filtered.filter((c) => c.isBusiness);
    }

    // Filtrar por busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((contact) => {
        const name = contact.name?.toLowerCase() || '';
        const phone = contact.phone.toLowerCase();
        return name.includes(query) || phone.includes(query);
      });
    }

    setFilteredContacts(filtered);
  };

  const handleCheckNumber = async (phone: string) => {
    setCheckingNumbers(new Set(checkingNumbers).add(phone));

    try {
      const response = await api.post('/whatsapp/contacts/check', {
        phoneNumbers: phone,
      });

      const result = response.data.data[0];

      if (result.exists) {
        toast.success(`${phone} está no WhatsApp!`);
      } else {
        toast.error(`${phone} não está no WhatsApp`);
      }
    } catch (error) {
      console.error('Erro ao verificar número:', error);
      toast.error('Erro ao verificar número');
    } finally {
      const newSet = new Set(checkingNumbers);
      newSet.delete(phone);
      setCheckingNumbers(newSet);
    }
  };

  const handleStartConversation = (contact: Contact) => {
    // Redirecionar para chat com esse contato
    window.location.href = `/whatsapp?chat=${contact.phone}`;
  };

  const getContactStats = () => {
    const total = contacts.length;
    const individuals = contacts.filter((c) => !c.isGroup).length;
    const groups = contacts.filter((c) => c.isGroup).length;
    const business = contacts.filter((c) => c.isBusiness).length;

    return { total, individuals, groups, business };
  };

  const stats = getContactStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Contatos WhatsApp</h1>
            <p className="text-sm text-gray-500">
              {stats.total} contatos no total
            </p>
          </div>
          <Button onClick={fetchContacts} variant="outline">
            Atualizar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <button
            onClick={() => setFilterType('all')}
            className={`p-3 rounded-lg border-2 transition-all ${
              filterType === 'all'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <User className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-gray-600">Total</span>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </button>

          <button
            onClick={() => setFilterType('individual')}
            className={`p-3 rounded-lg border-2 transition-all ${
              filterType === 'individual'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <User className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-gray-600">Individuais</span>
            </div>
            <p className="text-2xl font-bold">{stats.individuals}</p>
          </button>

          <button
            onClick={() => setFilterType('group')}
            className={`p-3 rounded-lg border-2 transition-all ${
              filterType === 'group'
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-medium text-gray-600">Grupos</span>
            </div>
            <p className="text-2xl font-bold">{stats.groups}</p>
          </button>

          <button
            onClick={() => setFilterType('business')}
            className={`p-3 rounded-lg border-2 transition-all ${
              filterType === 'business'
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-orange-600" />
              <span className="text-xs font-medium text-gray-600">Business</span>
            </div>
            <p className="text-2xl font-bold">{stats.business}</p>
          </button>
        </div>

        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Contacts List */}
      <ScrollArea className="flex-1">
        {filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <User className="h-16 w-16 mb-4" />
            <p>Nenhum contato encontrado</p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                {/* Avatar */}
                {contact.profilePicUrl ? (
                  <img
                    src={contact.profilePicUrl}
                    alt={contact.name || contact.phone}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-lg">
                      {contact.name?.[0]?.toUpperCase() ||
                        contact.phone[0]}
                    </span>
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">
                      {contact.name || contact.phone}
                    </p>

                    {contact.isGroup && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Grupo
                      </Badge>
                    )}

                    {contact.isBusiness && (
                      <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-700">
                        <Building2 className="h-3 w-3" />
                        Business
                      </Badge>
                    )}

                    {contact.isMyContact && (
                      <Badge variant="secondary" className="flex items-center gap-1 bg-blue-100 text-blue-700">
                        <CheckCircle2 className="h-3 w-3" />
                        Salvo
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Phone className="h-3 w-3" />
                    <span className="truncate">{contact.phone}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStartConversation(contact)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Chat
                  </Button>

                  {!contact.isGroup && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCheckNumber(contact.phone)}
                      disabled={checkingNumbers.has(contact.phone)}
                    >
                      {checkingNumbers.has(contact.phone) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Verificar
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default WhatsAppContacts;
