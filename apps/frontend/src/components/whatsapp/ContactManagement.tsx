/**
 * ContactManagement - Painel de gerenciamento de contatos WhatsApp
 */

import { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Search,
  UserX,
  UserCheck,
  Image as ImageIcon,
  MoreVertical,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import api from '@/lib/apiClient';
import { toast } from 'sonner';

interface ContactManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Contact {
  id: string;
  name: string;
  phone: string;
  profilePicUrl?: string;
  isBlocked?: boolean;
  status?: string;
}

const ContactManagement = ({ open, onOpenChange }: ContactManagementProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [verifyNumber, setVerifyNumber] = useState('');
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  useEffect(() => {
    if (open) {
      loadContacts();
    }
  }, [open]);

  const loadContacts = async () => {
    try {
      setIsLoading(true);
      // FASE C: Endpoint correto para listar contatos
      const response = await api.get('/whatsapp/contacts');
      const contactsData = response.data.data || response.data.contacts || [];
      setContacts(Array.isArray(contactsData) ? contactsData : []);
    } catch (error: any) {
      console.error('Erro ao carregar contatos:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Erro ao carregar contatos';
      toast.error(errorMsg);
      setContacts([]); // Garantir que sempre há um array válido
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyNumber = async () => {
    if (!verifyNumber.trim()) {
      toast.error('Digite um número para verificar');
      return;
    }

    try {
      setIsLoading(true);
      // FASE C: Endpoint correto para verificar número
      const response = await api.post('/whatsapp/contacts/check', {
        phoneNumbers: verifyNumber, // Backend espera phoneNumbers
      });

      // Backend retorna array, pegar primeiro resultado
      const result = response.data.data?.[0] || response.data?.[0];
      setVerifyResult(result || { exists: false });

      if (result?.exists) {
        toast.success('✅ Número existe no WhatsApp!');
      } else {
        toast.error('❌ Número não existe no WhatsApp');
      }
    } catch (error: any) {
      console.error('Erro:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Erro ao verificar número';
      toast.error(errorMsg);
      setVerifyResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlockContact = async (contact: Contact) => {
    try {
      setIsLoading(true);
      await api.post(`/whatsapp/extended/contacts/${contact.phone}@c.us/block`);

      setContacts(
        contacts.map((c) =>
          c.id === contact.id ? { ...c, isBlocked: true } : c
        )
      );

      toast.success(`${contact.name} bloqueado!`);
    } catch (error: any) {
      console.error('Erro:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Erro ao bloquear contato';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnblockContact = async (contact: Contact) => {
    try {
      setIsLoading(true);
      await api.post(`/whatsapp/extended/contacts/${contact.phone}@c.us/unblock`);

      setContacts(
        contacts.map((c) =>
          c.id === contact.id ? { ...c, isBlocked: false } : c
        )
      );

      toast.success(`${contact.name} desbloqueado!`);
    } catch (error: any) {
      console.error('Erro:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Erro ao desbloquear contato';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewContactDetails = async (contact: Contact) => {
    try {
      setIsLoading(true);

      // Get contact details
      const detailsResponse = await api.get(
        `/whatsapp/extended/contacts/${contact.phone}@c.us`
      );

      // Get profile picture
      let profilePicUrl = '';
      try {
        const picResponse = await api.get(
          `/whatsapp/extended/contacts/${contact.phone}@c.us/profile-pic`
        );
        profilePicUrl = picResponse.data.url || '';
      } catch {
        // Ignore if no profile pic
        profilePicUrl = '';
      }

      setSelectedContact({
        ...contact,
        ...(detailsResponse.data.contact || {}),
        profilePicUrl,
      });
    } catch (error: any) {
      console.error('Erro:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Erro ao carregar detalhes';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredContacts = Array.isArray(contacts)
    ? contacts.filter(
        (contact) =>
          contact?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contact?.phone?.includes(searchTerm)
      )
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Gerenciar Contatos WhatsApp</DialogTitle>
          <DialogDescription>
            Verifique números, visualize contatos e gerencie bloqueios
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="contacts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="contacts">
              <User className="h-4 w-4 mr-2" />
              Meus Contatos
            </TabsTrigger>
            <TabsTrigger value="verify">
              <Search className="h-4 w-4 mr-2" />
              Verificar Número
            </TabsTrigger>
          </TabsList>

          {/* Tab: Contacts */}
          <TabsContent value="contacts" className="space-y-4">
            <div>
              <Label htmlFor="search">Buscar Contato</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Nome ou número..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <ScrollArea className="h-96">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-gray-500">Carregando contatos...</p>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                  <User className="h-12 w-12 mb-2 opacity-50" />
                  <p>Nenhum contato encontrado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredContacts.map((contact) =>
                    contact && contact.id ? (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {contact.profilePicUrl ? (
                          <img
                            src={contact.profilePicUrl}
                            alt={contact.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-500" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{contact.name}</p>
                            {contact.isBlocked && (
                              <Badge variant="destructive" className="text-xs">
                                Bloqueado
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{contact.phone}</p>
                          {contact.status && (
                            <p className="text-xs text-gray-400 italic truncate">
                              {contact.status}
                            </p>
                          )}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={isLoading}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleViewContactDetails(contact)}
                          >
                            <User className="mr-2 h-4 w-4" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              window.open(
                                `https://wa.me/${contact.phone}`,
                                '_blank'
                              )
                            }
                          >
                            <Phone className="mr-2 h-4 w-4" />
                            Abrir Conversa
                          </DropdownMenuItem>
                          {contact.isBlocked ? (
                            <DropdownMenuItem
                              onClick={() => handleUnblockContact(contact)}
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Desbloquear
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handleBlockContact(contact)}
                              className="text-red-600"
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Bloquear
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    ) : null
                  )}
                </div>
              )}
            </ScrollArea>

            <div className="flex gap-2 pt-2 border-t">
              <Button
                onClick={loadContacts}
                variant="outline"
                disabled={isLoading}
                className="flex-1"
              >
                🔄 Atualizar Lista
              </Button>
            </div>
          </TabsContent>

          {/* Tab: Verify */}
          <TabsContent value="verify" className="space-y-4">
            <div>
              <Label htmlFor="verifyNumber">Número do WhatsApp</Label>
              <p className="text-sm text-gray-500 mb-2">
                Digite o número com código do país (ex: 5511999999999)
              </p>
              <div className="flex gap-2">
                <Input
                  id="verifyNumber"
                  placeholder="5511999999999"
                  value={verifyNumber}
                  onChange={(e) => setVerifyNumber(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleVerifyNumber();
                    }
                  }}
                />
                <Button
                  onClick={handleVerifyNumber}
                  disabled={isLoading || !verifyNumber.trim()}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Verificar
                </Button>
              </div>
            </div>

            {verifyResult && (
              <div
                className={`p-4 rounded-lg border-2 ${
                  verifyResult.exists
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {verifyResult.exists ? (
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
                  )}

                  <div className="flex-1">
                    <p
                      className={`font-semibold ${
                        verifyResult.exists ? 'text-green-900' : 'text-red-900'
                      }`}
                    >
                      {verifyResult.exists
                        ? '✅ Número existe no WhatsApp!'
                        : '❌ Número não encontrado'}
                    </p>
                    <p
                      className={`text-sm mt-1 ${
                        verifyResult.exists ? 'text-green-700' : 'text-red-700'
                      }`}
                    >
                      {verifyResult.exists
                        ? `Este número está registrado no WhatsApp com o ID: ${verifyResult.jid}`
                        : 'Este número não possui uma conta do WhatsApp ativa'}
                    </p>

                    {verifyResult.exists && (
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            window.open(
                              `https://wa.me/${verifyNumber}`,
                              '_blank'
                            )
                          }
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Iniciar Conversa
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">💡 Dica</h4>
              <p className="text-sm text-blue-700">
                Use esta ferramenta para verificar se um número possui WhatsApp
                antes de enviar mensagens. Isso ajuda a evitar erros e melhora a
                taxa de entrega.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Contact Details Dialog */}
        {selectedContact && (
          <Dialog
            open={!!selectedContact}
            onOpenChange={() => setSelectedContact(null)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Detalhes do Contato</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex flex-col items-center">
                  {selectedContact.profilePicUrl ? (
                    <img
                      src={selectedContact.profilePicUrl}
                      alt={selectedContact.name}
                      className="w-24 h-24 rounded-full object-cover mb-4"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                      <User className="h-12 w-12 text-gray-500" />
                    </div>
                  )}

                  <h3 className="text-xl font-semibold">
                    {selectedContact.name}
                  </h3>
                  <p className="text-gray-500">{selectedContact.phone}</p>
                </div>

                {selectedContact.status && (
                  <div className="border-t pt-4">
                    <Label>Status/Recado</Label>
                    <p className="text-sm text-gray-600 italic mt-1">
                      "{selectedContact.status}"
                    </p>
                  </div>
                )}

                <div className="border-t pt-4 flex gap-2">
                  <Button
                    onClick={() =>
                      window.open(
                        `https://wa.me/${selectedContact.phone}`,
                        '_blank'
                      )
                    }
                    className="flex-1"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Abrir Conversa
                  </Button>

                  {selectedContact.isBlocked ? (
                    <Button
                      onClick={() => handleUnblockContact(selectedContact)}
                      variant="outline"
                      className="flex-1"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Desbloquear
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleBlockContact(selectedContact)}
                      variant="destructive"
                      className="flex-1"
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Bloquear
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ContactManagement;
