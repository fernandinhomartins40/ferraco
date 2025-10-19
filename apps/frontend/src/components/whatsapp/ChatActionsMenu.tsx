/**
 * ChatActionsMenu - Menu de ações do chat (arquivar, fixar, deletar, etc.)
 */

import {
  Archive,
  Pin,
  Trash2,
  UserX,
  UserCheck,
  Search,
  Settings,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import api from '@/lib/apiClient';
import { toast } from 'sonner';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ChatActionsMenuProps {
  chatId: string;
  contactPhone: string;
  contactName?: string;
  isArchived?: boolean;
  isPinned?: boolean;
  isBlocked?: boolean;
  onAction?: () => void;
}

const ChatActionsMenu = ({
  chatId,
  contactPhone,
  contactName,
  isArchived = false,
  isPinned = false,
  isBlocked = false,
  onAction,
}: ChatActionsMenuProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleArchive = async () => {
    try {
      setIsLoading(true);
      await api.post('/whatsapp/archive-chat', {
        chatId,
        archive: !isArchived,
      });

      toast.success(isArchived ? 'Chat desarquivado!' : 'Chat arquivado!');
      onAction?.();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao arquivar chat');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePin = async () => {
    try {
      setIsLoading(true);
      // FASE C: Endpoint correto para fixar chat
      await api.post('/whatsapp/pin-chat', {
        chatId,
        pin: !isPinned,
      });

      toast.success(isPinned ? 'Chat desfixado!' : 'Chat fixado!');
      onAction?.();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao fixar chat');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    try {
      setIsLoading(true);
      await api.delete(`/whatsapp/extended/chat/${chatId}/clear`);

      toast.success('Histórico limpo!');
      onAction?.();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao limpar histórico');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlockContact = async () => {
    try {
      setIsLoading(true);

      if (isBlocked) {
        await api.post(`/whatsapp/extended/contacts/${contactPhone}@c.us/unblock`);
        toast.success('Contato desbloqueado!');
      } else {
        await api.post(`/whatsapp/extended/contacts/${contactPhone}@c.us/block`);
        toast.success('Contato bloqueado!');
      }

      onAction?.();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao bloquear/desbloquear contato');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async () => {
    try {
      setIsLoading(true);
      await api.post('/whatsapp/mark-read', {
        chatId,
      });

      toast.success('Marcado como lido!');
      onAction?.();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao marcar como lido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isLoading}>
            <MoreVertical className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Ações do Chat</DropdownMenuLabel>

          <DropdownMenuItem onClick={handleMarkAsRead}>
            <Search className="mr-2 h-4 w-4" />
            <span>Marcar como lido</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={async () => {
            try {
              setIsLoading(true);
              await api.post('/whatsapp/mark-unread', { chatId });
              toast.success('Marcado como não lido!');
              onAction?.();
            } catch (error) {
              console.error('Erro:', error);
              toast.error('Erro ao marcar como não lido');
            } finally {
              setIsLoading(false);
            }
          }}>
            <Search className="mr-2 h-4 w-4" />
            <span>Marcar como não lido</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handlePin}>
            <Pin className="mr-2 h-4 w-4" />
            <span>{isPinned ? 'Desfixar' : 'Fixar'} conversa</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleArchive}>
            <Archive className="mr-2 h-4 w-4" />
            <span>{isArchived ? 'Desarquivar' : 'Arquivar'} conversa</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuLabel>Contato</DropdownMenuLabel>

          <DropdownMenuItem onClick={handleBlockContact}>
            {isBlocked ? (
              <UserCheck className="mr-2 h-4 w-4" />
            ) : (
              <UserX className="mr-2 h-4 w-4" />
            )}
            <span>{isBlocked ? 'Desbloquear' : 'Bloquear'} contato</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuLabel className="text-red-600">Zona de Perigo</DropdownMenuLabel>

          <DropdownMenuItem onClick={handleClearChat} className="text-orange-600">
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Limpar histórico</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Deletar conversa</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar a conversa com{' '}
              <strong>{contactName || contactPhone}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  setIsLoading(true);
                  // await api.delete(`/whatsapp/conversations/${chatId}`);
                  toast.success('Conversa deletada!');
                  onAction?.();
                } catch (error) {
                  toast.error('Erro ao deletar conversa');
                } finally {
                  setIsLoading(false);
                  setShowDeleteDialog(false);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ChatActionsMenu;
