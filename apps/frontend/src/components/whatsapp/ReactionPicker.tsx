/**
 * ReactionPicker - Seletor de emojis para reações
 */

import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface ReactionPickerProps {
  messageId: string;
  onReact: (messageId: string, emoji: string) => void;
  children?: React.ReactNode;
}

const QUICK_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🙏', '👏', '🔥'];

const ReactionPicker = ({ messageId, onReact, children }: ReactionPickerProps) => {
  const [open, setOpen] = useState(false);

  const handleReaction = (emoji: string) => {
    onReact(messageId, emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm" className="h-6 px-2">
            <span className="text-lg">😊</span>
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="center">
        <div className="flex gap-1">
          {QUICK_REACTIONS.map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 hover:bg-gray-100"
              onClick={() => handleReaction(emoji)}
            >
              <span className="text-2xl">{emoji}</span>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ReactionPicker;
