/**
 * GroupManagement - Painel completo de gerenciamento de grupos WhatsApp
 */

import { useState } from 'react';
import {
  Users,
  UserPlus,
  UserMinus,
  Crown,
  Link2,
  Settings,
  Image,
  LogOut,
  Copy,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import api from '@/lib/apiClient';
import { toast } from 'sonner';

interface GroupManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId?: string;
  mode: 'create' | 'edit';
}

interface Contact {
  id: string;
  name: string;
  phone: string;
  selected?: boolean;
}

interface Member {
  id: string;
  name: string;
  phone: string;
  isAdmin: boolean;
}

const GroupManagement = ({ open, onOpenChange, groupId, mode }: GroupManagementProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  // Create group state
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([
    { id: '1', name: 'João Silva', phone: '5511999999999', selected: false },
    { id: '2', name: 'Maria Santos', phone: '5511888888888', selected: false },
    { id: '3', name: 'Pedro Costa', phone: '5511777777777', selected: false },
  ]);

  // Edit group state
  const [members, setMembers] = useState<Member[]>([
    { id: '1', name: 'João Silva', phone: '5511999999999', isAdmin: true },
    { id: '2', name: 'Maria Santos', phone: '5511888888888', isAdmin: false },
  ]);
  const [inviteLink, setInviteLink] = useState('');
  const [groupSettings, setGroupSettings] = useState({
    onlyAdminsCanMessage: false,
    onlyAdminsCanEditInfo: true,
  });

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedContacts.length === 0) {
      toast.error('Nome do grupo e pelo menos 1 contato são obrigatórios');
      return;
    }

    try {
      setIsLoading(true);
      // FASE C: Preparar números de telefone (backend formata automaticamente)
      const participants = selectedContacts.map((c) => c.phone);

      // FASE C: Endpoint correto para criar grupo
      const response = await api.post('/whatsapp/groups', {
        name: groupName,
        participants,
      });

      const newGroupId = response.data?.data?.gid || response.data?.gid;

      // Set description if provided
      if (groupDescription.trim() && newGroupId) {
        try {
          await api.put(`/whatsapp/extended/groups/${newGroupId}/description`, {
            description: groupDescription,
          });
        } catch (descError) {
          console.warn('Erro ao definir descrição do grupo:', descError);
          // Não falhar a criação do grupo por causa da descrição
        }
      }

      toast.success('Grupo criado com sucesso!');
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error('Erro:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Erro ao criar grupo';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMembers = async () => {
    if (!groupId || selectedContacts.length === 0) return;

    try {
      setIsLoading(true);
      const contactIds = selectedContacts.map((c) => `${c.phone}@c.us`);

      await api.post(`/whatsapp/extended/groups/${groupId}/participants`, {
        participants: contactIds,
      });

      toast.success('Membros adicionados!');
      setSelectedContacts([]);
    } catch (error: any) {
      console.error('Erro:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Erro ao adicionar membros';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string, phone: string) => {
    if (!groupId) return;

    try {
      setIsLoading(true);
      await api.delete(`/whatsapp/extended/groups/${groupId}/participants`, {
        data: { participants: [`${phone}@c.us`] },
      });

      setMembers(members.filter((m) => m.id !== memberId));
      toast.success('Membro removido!');
    } catch (error: any) {
      console.error('Erro:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Erro ao remover membro';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromoteAdmin = async (phone: string) => {
    if (!groupId) return;

    try {
      setIsLoading(true);
      await api.post(`/whatsapp/extended/groups/${groupId}/admins/promote`, {
        participants: [`${phone}@c.us`],
      });

      setMembers(
        members.map((m) => (m.phone === phone ? { ...m, isAdmin: true } : m))
      );
      toast.success('Membro promovido a admin!');
    } catch (error: any) {
      console.error('Erro:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Erro ao promover membro';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoteAdmin = async (phone: string) => {
    if (!groupId) return;

    try {
      setIsLoading(true);
      await api.post(`/whatsapp/extended/groups/${groupId}/admins/demote`, {
        participants: [`${phone}@c.us`],
      });

      setMembers(
        members.map((m) => (m.phone === phone ? { ...m, isAdmin: false } : m))
      );
      toast.success('Admin rebaixado!');
    } catch (error: any) {
      console.error('Erro:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Erro ao rebaixar admin';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetInviteLink = async () => {
    if (!groupId) return;

    try {
      setIsLoading(true);
      const response = await api.get(`/whatsapp/extended/groups/${groupId}/invite-link`);
      setInviteLink(response.data.link || response.data.data?.link || '');
      toast.success('Link obtido!');
    } catch (error: any) {
      console.error('Erro:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Erro ao obter link';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success('Link copiado!');
  };

  const handleUpdateGroupInfo = async () => {
    if (!groupId) return;

    try {
      setIsLoading(true);

      if (groupName.trim()) {
        await api.put(`/whatsapp/extended/groups/${groupId}/subject`, {
          subject: groupName,
        });
      }

      if (groupDescription.trim()) {
        await api.put(`/whatsapp/extended/groups/${groupId}/description`, {
          description: groupDescription,
        });
      }

      toast.success('Informações atualizadas!');
    } catch (error: any) {
      console.error('Erro:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Erro ao atualizar informações';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!groupId) return;

    try {
      setIsLoading(true);
      await api.post(`/whatsapp/extended/groups/${groupId}/leave`);
      toast.success('Você saiu do grupo');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Erro ao sair do grupo';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleContactSelection = (contactId: string) => {
    setContacts(
      contacts.map((c) =>
        c.id === contactId ? { ...c, selected: !c.selected } : c
      )
    );

    const contact = contacts.find((c) => c.id === contactId);
    if (contact) {
      if (selectedContacts.find((c) => c.id === contactId)) {
        setSelectedContacts(selectedContacts.filter((c) => c.id !== contactId));
      } else {
        setSelectedContacts([...selectedContacts, contact]);
      }
    }
  };

  const resetForm = () => {
    setGroupName('');
    setGroupDescription('');
    setSelectedContacts([]);
    setContacts(contacts.map((c) => ({ ...c, selected: false })));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Criar Novo Grupo' : 'Gerenciar Grupo'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Crie um novo grupo do WhatsApp e adicione participantes'
              : 'Gerencie membros, permissões e configurações do grupo'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">
              <Settings className="h-4 w-4 mr-2" />
              Info
            </TabsTrigger>
            <TabsTrigger value="members" disabled={mode === 'create'}>
              <Users className="h-4 w-4 mr-2" />
              Membros
            </TabsTrigger>
            <TabsTrigger value="invite" disabled={mode === 'create'}>
              <Link2 className="h-4 w-4 mr-2" />
              Convite
            </TabsTrigger>
            <TabsTrigger value="settings" disabled={mode === 'create'}>
              <Settings className="h-4 w-4 mr-2" />
              Config
            </TabsTrigger>
          </TabsList>

          {/* Tab: Info */}
          <TabsContent value="info" className="space-y-4 mt-4">
            <div>
              <Label htmlFor="groupName">Nome do Grupo *</Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Equipe de Vendas"
                maxLength={25}
              />
              <p className="text-xs text-gray-500 mt-1">
                {groupName.length}/25 caracteres
              </p>
            </div>

            <div>
              <Label htmlFor="groupDescription">Descrição (opcional)</Label>
              <Textarea
                id="groupDescription"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="Descrição do grupo..."
                rows={3}
              />
            </div>

            <div>
              <Label>
                {mode === 'create' ? 'Selecionar Participantes *' : 'Adicionar Participantes'}
              </Label>
              <ScrollArea className="h-48 border rounded-md p-2 mt-2">
                {Array.isArray(contacts) && contacts.map((contact) => {
                  if (!contact || !contact.id) return null;

                  return (
                    <div
                      key={contact.id}
                      className="flex items-center space-x-2 py-2 hover:bg-gray-50 rounded px-2"
                    >
                      <Checkbox
                        checked={contact.selected}
                        onCheckedChange={() => toggleContactSelection(contact.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-sm text-gray-500">{contact.phone}</p>
                      </div>
                    </div>
                  );
                })}
              </ScrollArea>
              <p className="text-sm text-gray-500 mt-2">
                {selectedContacts.length} contato(s) selecionado(s)
              </p>
            </div>

            {mode === 'edit' && (
              <Button
                onClick={handleAddMembers}
                disabled={isLoading || selectedContacts.length === 0}
                className="w-full"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar Membros Selecionados
              </Button>
            )}
          </TabsContent>

          {/* Tab: Members */}
          <TabsContent value="members" className="mt-4">
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {Array.isArray(members) && members.map((member) => {
                  if (!member || !member.id) return null;

                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{member.name}</p>
                          {member.isAdmin && (
                            <Badge variant="secondary" className="text-xs">
                              <Crown className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{member.phone}</p>
                      </div>

                      <div className="flex gap-2">
                        {member.isAdmin ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDemoteAdmin(member.phone)}
                            disabled={isLoading}
                          >
                            Rebaixar
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePromoteAdmin(member.phone)}
                            disabled={isLoading}
                          >
                            <Crown className="h-4 w-4 mr-1" />
                            Promover
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveMember(member.id, member.phone)}
                          disabled={isLoading}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Tab: Invite */}
          <TabsContent value="invite" className="space-y-4 mt-4">
            <div>
              <Label>Link de Convite do Grupo</Label>
              <p className="text-sm text-gray-500 mb-4">
                Compartilhe este link para convidar pessoas para o grupo
              </p>

              {inviteLink ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input value={inviteLink} readOnly className="flex-1" />
                    <Button onClick={handleCopyInviteLink} variant="outline">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Link gerado! Compartilhe com cuidado.
                  </p>
                </div>
              ) : (
                <Button
                  onClick={handleGetInviteLink}
                  disabled={isLoading}
                  className="w-full"
                >
                  <Link2 className="h-4 w-4 mr-2" />
                  Gerar Link de Convite
                </Button>
              )}
            </div>

            <div className="border-t pt-4">
              <Label>Entrar em Grupo via Link</Label>
              <p className="text-sm text-gray-500 mb-2">
                Cole o código do link de convite (após /invite/)
              </p>
              <div className="flex gap-2">
                <Input placeholder="ABC123XYZ" />
                <Button>Entrar</Button>
              </div>
            </div>
          </TabsContent>

          {/* Tab: Settings */}
          <TabsContent value="settings" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Apenas admins podem enviar mensagens</p>
                  <p className="text-sm text-gray-500">
                    Membros normais não poderão enviar mensagens
                  </p>
                </div>
                <Checkbox
                  checked={groupSettings.onlyAdminsCanMessage}
                  onCheckedChange={(checked) =>
                    setGroupSettings({ ...groupSettings, onlyAdminsCanMessage: checked as boolean })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Apenas admins podem editar info</p>
                  <p className="text-sm text-gray-500">
                    Somente admins podem mudar nome, foto e descrição
                  </p>
                </div>
                <Checkbox
                  checked={groupSettings.onlyAdminsCanEditInfo}
                  onCheckedChange={(checked) =>
                    setGroupSettings({ ...groupSettings, onlyAdminsCanEditInfo: checked as boolean })
                  }
                />
              </div>

              <Button
                onClick={handleUpdateGroupInfo}
                disabled={isLoading}
                className="w-full"
              >
                Salvar Configurações
              </Button>
            </div>

            <div className="border-t pt-4">
              <Label className="text-red-600">Zona de Perigo</Label>
              <div className="mt-4 space-y-2">
                <Button
                  onClick={handleLeaveGroup}
                  disabled={isLoading}
                  variant="destructive"
                  className="w-full"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair do Grupo
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {mode === 'create' && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateGroup}
              disabled={isLoading || !groupName.trim() || selectedContacts.length === 0}
            >
              {isLoading ? 'Criando...' : 'Criar Grupo'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GroupManagement;
