import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tag as TagIcon } from 'lucide-react';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  currentTags: string[];
  onTagsUpdate: (leadId: string, tagNames: string[]) => void;
}

const TagSelector = ({
  isOpen,
  onClose,
  leadId,
  currentTags,
  onTagsUpdate,
}: TagSelectorProps) => {
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(currentTags);

  useEffect(() => {
    // Carregar tags disponíveis do localStorage
    const stored = localStorage.getItem('ferraco_tags');
    if (stored) {
      setAvailableTags(JSON.parse(stored));
    } else {
      // Tags padrão
      setAvailableTags([
        { id: '1', name: 'Importante', color: '#ef4444' },
        { id: '2', name: 'Urgente', color: '#f97316' },
        { id: '3', name: 'VIP', color: '#8b5cf6' },
      ]);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedTags(currentTags);
  }, [currentTags, isOpen]);

  const handleToggleTag = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName]
    );
  };

  const handleSave = () => {
    onTagsUpdate(leadId, selectedTags);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Tags ao Lead</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {availableTags.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TagIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma tag disponível</p>
              <p className="text-xs mt-1">
                Crie tags usando o botão "Gerenciar Tags"
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {availableTags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleToggleTag(tag.name)}
                >
                  <Checkbox
                    checked={selectedTags.includes(tag.name)}
                    onCheckedChange={() => handleToggleTag(tag.name)}
                  />
                  <div className="flex items-center space-x-2 flex-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: tag.color,
                        color: tag.color,
                      }}
                    >
                      {tag.name}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar Tags</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TagSelector;
