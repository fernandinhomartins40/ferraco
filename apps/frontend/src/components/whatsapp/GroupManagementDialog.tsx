/**
 * GroupManagementDialog - Dialog completo para gerenciamento de grupos WhatsApp
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users,
  Crown,
  UserMinus,
  UserPlus,
  Loader2,
  Shield,
  ShieldOff,
} from 'lucide-react';
import api from '@/lib/apiClient';
import { toast } from 'sonner';
import type { GroupMetadata, GroupParticipant } from '@/types/whatsapp';

interface GroupManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
}

const GroupManagementDialog = ({
  open,
  onOpenChange,
  groupId,
}: GroupManagementDialogProps) => {
  const [groupMetadata, setGroupMetadata] = useState<GroupMetadata | null>(null);
  const [participants, setParticipants] = useState<GroupParticipant[]>([]);
  const [newSubject, setNewSubject] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newParticipantNumber, setNewParticipantNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (open && groupId) {
      fetchGroupData();
    }
  }, [open, groupId]);

  const fetchGroupData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/whatsapp/groups/${groupId}/participants`);
      setParticipants(response.data.data || []);

      // Buscar metadata do grupo (simulado - ajustar conforme API real)
      // TODO: Criar endpoint GET /whatsapp/groups/:id no backend
      setGroupMetadata({
        id: groupId,
        subject: 'Grupo WhatsApp',
        description: '',
        owner: '',
        creation: Date.now(),
        participants: response.data.data || [],
        admins: (response.data.data || [])
          .filter((p: GroupParticipant) => p.isAdmin)
          .map((p: GroupParticipant) => p.id),
      });

      setNewSubject('');
      setNewDescription('');
    } catch (error) {
      console.error('Erro ao buscar dados do grupo:', error);
      toast.error('Erro ao carregar dados do grupo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSubject = async () => {
    if (!newSubject.trim()) {
      toast.error('Nome do grupo não pode estar vazio');
      return;
    }

    setIsUpdating(true);
    try {
      await api.put(`/whatsapp/groups/${groupId}/subject`, {
        subject: newSubject.trim(),
      });

      toast.success('Nome do grupo atualizado!');
      fetchGroupData();
    } catch (error) {
      console.error('Erro ao atualizar nome:', error);
      toast.error('Erro ao atualizar nome do grupo');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateDescription = async () => {
    setIsUpdating(true);
    try {
      await api.put(`/whatsapp/groups/${groupId}/description`, {
        description: newDescription.trim(),
      });

      toast.success('Descrição do grupo atualizada!');
      fetchGroupData();
    } catch (error) {
      console.error('Erro ao atualizar descrição:', error);
      toast.error('Erro ao atualizar descrição do grupo');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddParticipant = async () => {
    if (!newParticipantNumber.trim()) {
      toast.error('Número do participante é obrigatório');
      return;
    }

    setIsUpdating(true);
    try {
      await api.post(`/whatsapp/groups/${groupId}/participants`, {
        participantNumber: newParticipantNumber.trim(),
      });

      toast.success('Participante adicionado!');
      setNewParticipantNumber('');
      fetchGroupData();
    } catch (error) {
      console.error('Erro ao adicionar participante:', error);
      toast.error('Erro ao adicionar participante');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveParticipant = async (participantNumber: string) => {
    if (!confirm(`Remover ${participantNumber} do grupo?`)) {
      return;
    }

    setIsUpdating(true);
    try {
      await api.delete(`/whatsapp/groups/${groupId}/participants/${participantNumber}`);

      toast.success('Participante removido!');
      fetchGroupData();
    } catch (error) {
      console.error('Erro ao remover participante:', error);
      toast.error('Erro ao remover participante');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePromoteToAdmin = async (participantNumber: string) => {
    setIsUpdating(true);
    try {
      await api.post(`/whatsapp/groups/${groupId}/promote`, {
        participantNumber,
      });

      toast.success('Participante promovido a admin!');
      fetchGroupData();
    } catch (error) {
      console.error('Erro ao promover participante:', error);
      toast.error('Erro ao promover participante');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDemoteFromAdmin = async (participantNumber: string) => {
    setIsUpdating(true);
    try {
      await api.post(`/whatsapp/groups/${groupId}/demote`, {
        participantNumber,
      });

      toast.success('Admin removido!');
      fetchGroupData();
    } catch (error) {
      console.error('Erro ao remover admin:', error);
      toast.error('Erro ao remover admin');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gerenciar Grupo
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <Tabs defaultValue="participants" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="participants">Participantes</TabsTrigger>
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
            </TabsList>

            {/* Participants Tab */}
            <TabsContent value="participants" className="flex-1 overflow-hidden">
              <div className="space-y-4 h-full flex flex-col">
                {/* Add Participant */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Número do participante (ex: 5511999999999)"
                    value={newParticipantNumber}
                    onChange={(e) => setNewParticipantNumber(e.target.value)}
                  />
                  <Button onClick={handleAddParticipant} disabled={isUpdating}>
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Participants List */}
                <ScrollArea className="flex-1 border rounded-md">
                  <div className="p-4 space-y-2">
                    {participants.length === 0 ? (
                      <div className="text-center text-gray-400 py-8">
                        Nenhum participante
                      </div>
                    ) : (
                      participants.map((participant) => (
                        <div
                          key={participant.id}
                          className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-medium text-sm">
                                {participant.name || participant.phone}
                              </p>
                              {participant.name && (
                                <p className="text-xs text-gray-500">
                                  {participant.phone}
                                </p>
                              )}
                            </div>
                            {participant.isAdmin && (
                              <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                                <Crown className="h-3 w-3" />
                                Admin
                              </span>
                            )}
                            {participant.isSuperAdmin && (
                              <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                                <Shield className="h-3 w-3" />
                                Criador
                              </span>
                            )}
                          </div>

                          <div className="flex gap-1">
                            {!participant.isSuperAdmin && (
                              <>
                                {participant.isAdmin ? (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      handleDemoteFromAdmin(participant.phone)
                                    }
                                    title="Remover admin"
                                    disabled={isUpdating}
                                  >
                                    <ShieldOff className="h-4 w-4 text-orange-500" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      handlePromoteToAdmin(participant.phone)
                                    }
                                    title="Promover a admin"
                                    disabled={isUpdating}
                                  >
                                    <Shield className="h-4 w-4 text-green-500" />
                                  </Button>
                                )}

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handleRemoveParticipant(participant.phone)
                                  }
                                  title="Remover do grupo"
                                  disabled={isUpdating}
                                >
                                  <UserMinus className="h-4 w-4 text-red-500" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>

                <p className="text-sm text-gray-500">
                  Total: {participants.length} participante(s)
                </p>
              </div>
            </TabsContent>

            {/* Info Tab */}
            <TabsContent value="info" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Nome do Grupo</Label>
                <div className="flex gap-2">
                  <Input
                    id="subject"
                    placeholder="Digite o novo nome do grupo"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    maxLength={100}
                  />
                  <Button onClick={handleUpdateSubject} disabled={isUpdating}>
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Atualizar'
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição do Grupo</Label>
                <div className="space-y-2">
                  <Textarea
                    id="description"
                    placeholder="Digite a nova descrição do grupo"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={4}
                    maxLength={512}
                  />
                  <Button
                    onClick={handleUpdateDescription}
                    disabled={isUpdating}
                    className="w-full"
                  >
                    {isUpdating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Atualizar Descrição
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              <div className="p-4 border rounded-md">
                <h3 className="font-medium mb-2">ID do Grupo</h3>
                <code className="text-sm bg-gray-100 p-2 rounded block">
                  {groupId}
                </code>
              </div>

              {groupMetadata && (
                <>
                  <div className="p-4 border rounded-md">
                    <h3 className="font-medium mb-2">Criado em</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(groupMetadata.creation).toLocaleString('pt-BR')}
                    </p>
                  </div>

                  {groupMetadata.groupInviteLink && (
                    <div className="p-4 border rounded-md">
                      <h3 className="font-medium mb-2">Link de Convite</h3>
                      <code className="text-sm bg-gray-100 p-2 rounded block break-all">
                        {groupMetadata.groupInviteLink}
                      </code>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GroupManagementDialog;
