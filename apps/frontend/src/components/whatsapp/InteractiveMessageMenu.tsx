/**
 * InteractiveMessageMenu - Menu para enviar mensagens interativas
 */

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Plus,
  List,
  BarChart3,
  MapPin,
  User,
  Users,
  FileText,
} from 'lucide-react';
import SendListDialog from './SendListDialog';
import SendPollDialog from './SendPollDialog';
import SendLocationDialog from './SendLocationDialog';
import SendContactDialog from './SendContactDialog';
import CreateGroupDialog from './CreateGroupDialog';

interface InteractiveMessageMenuProps {
  contactPhone: string;
  onSent?: () => void;
}

const InteractiveMessageMenu = ({
  contactPhone,
  onSent,
}: InteractiveMessageMenuProps) => {
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [pollDialogOpen, setPollDialogOpen] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="flex-shrink-0">
            <Plus className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Mensagens Interativas</DropdownMenuLabel>

          <DropdownMenuItem onClick={() => setListDialogOpen(true)}>
            <List className="mr-2 h-4 w-4" />
            <div>
              <p className="font-medium">Lista Interativa</p>
              <p className="text-xs text-gray-500">
                Menu com múltiplas opções
              </p>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setPollDialogOpen(true)}>
            <BarChart3 className="mr-2 h-4 w-4" />
            <div>
              <p className="font-medium">Enquete</p>
              <p className="text-xs text-gray-500">
                Crie uma votação
              </p>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Compartilhar</DropdownMenuLabel>

          <DropdownMenuItem onClick={() => setLocationDialogOpen(true)}>
            <MapPin className="mr-2 h-4 w-4" />
            <div>
              <p className="font-medium">Localização</p>
              <p className="text-xs text-gray-500">
                Enviar GPS ou endereço
              </p>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setContactDialogOpen(true)}>
            <User className="mr-2 h-4 w-4" />
            <div>
              <p className="font-medium">Contato</p>
              <p className="text-xs text-gray-500">
                Compartilhar vCard
              </p>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Outros</DropdownMenuLabel>

          <DropdownMenuItem onClick={() => setGroupDialogOpen(true)}>
            <Users className="mr-2 h-4 w-4" />
            <div>
              <p className="font-medium">Criar Grupo</p>
              <p className="text-xs text-gray-500">
                Novo grupo WhatsApp
              </p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogs */}
      <SendListDialog
        open={listDialogOpen}
        onOpenChange={setListDialogOpen}
        contactPhone={contactPhone}
        onSent={onSent}
      />

      <SendPollDialog
        open={pollDialogOpen}
        onOpenChange={setPollDialogOpen}
        contactPhone={contactPhone}
        onSent={onSent}
      />

      <SendLocationDialog
        open={locationDialogOpen}
        onOpenChange={setLocationDialogOpen}
        contactPhone={contactPhone}
        onSent={onSent}
      />

      <SendContactDialog
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
        contactPhone={contactPhone}
        onSent={onSent}
      />

      <CreateGroupDialog
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        onCreated={() => {
          // Redirecionar para o grupo criado, se necessário
          onSent?.();
        }}
      />
    </>
  );
};

export default InteractiveMessageMenu;
