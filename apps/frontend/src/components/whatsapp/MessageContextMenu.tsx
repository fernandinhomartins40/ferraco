/**
 * MessageContextMenu - Menu de contexto para ações em mensagens
 */

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  MoreVertical,
  Reply,
  Forward,
  Copy,
  Smile,
  Trash2,
  Edit,
  Download,
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  fromMe: boolean;
  mediaUrl: string | null;
  timestamp: string;
}

interface MessageContextMenuProps {
  message: Message;
  onReply: (message: Message) => void;
  onForward: (message: Message) => void;
  onReact: (message: Message) => void;
  onCopy: (content: string) => void;
  onDelete?: (messageId: string) => void;
  onEdit?: (message: Message) => void;
  onDownload?: (mediaUrl: string) => void;
}

const MessageContextMenu = ({
  message,
  onReply,
  onForward,
  onReact,
  onCopy,
  onDelete,
  onEdit,
  onDownload,
}: MessageContextMenuProps) => {
  const isRecent = () => {
    const messageTime = new Date(message.timestamp).getTime();
    const now = Date.now();
    const fifteenMinutes = 15 * 60 * 1000;
    return now - messageTime < fifteenMinutes;
  };

  const canEdit = message.fromMe && isRecent();
  const canDelete = message.fromMe;
  const hasMedia = message.mediaUrl !== null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onReply(message)}>
          <Reply className="mr-2 h-4 w-4" />
          Responder
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onForward(message)}>
          <Forward className="mr-2 h-4 w-4" />
          Encaminhar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onReact(message)}>
          <Smile className="mr-2 h-4 w-4" />
          Reagir
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onCopy(message.content)}>
          <Copy className="mr-2 h-4 w-4" />
          Copiar texto
        </DropdownMenuItem>

        {hasMedia && onDownload && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDownload(message.mediaUrl!)}>
              <Download className="mr-2 h-4 w-4" />
              Baixar mídia
            </DropdownMenuItem>
          </>
        )}

        {(canEdit || canDelete) && <DropdownMenuSeparator />}

        {canEdit && onEdit && (
          <DropdownMenuItem onClick={() => onEdit(message)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
        )}

        {canDelete && onDelete && (
          <DropdownMenuItem
            onClick={() => onDelete(message.id)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Deletar
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MessageContextMenu;
