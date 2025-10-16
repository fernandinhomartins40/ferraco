/**
 * ReplyPreview - Preview da mensagem sendo respondida
 */

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Message {
  id: string;
  content: string;
  fromMe: boolean;
  contact?: {
    name: string | null;
    phone: string;
  };
}

interface ReplyPreviewProps {
  message: Message;
  onCancel: () => void;
}

const ReplyPreview = ({ message, onCancel }: ReplyPreviewProps) => {
  const senderName = message.fromMe
    ? 'Você'
    : message.contact?.name || message.contact?.phone || 'Contato';

  return (
    <div className="flex items-start gap-2 px-4 py-2 bg-gray-50 border-l-4 border-green-500">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-green-600">{senderName}</p>
        <p className="text-sm text-gray-600 truncate">{message.content}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 flex-shrink-0"
        onClick={onCancel}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ReplyPreview;
