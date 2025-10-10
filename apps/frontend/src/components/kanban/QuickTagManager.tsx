import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Palette } from 'lucide-react';
import { toast } from 'sonner';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface QuickTagManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onTagsChange?: () => void;
}

const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
];

const QuickTagManager = ({ isOpen, onClose, onTagsChange }: QuickTagManagerProps) => {
  const [tags, setTags] = useState<Tag[]>(() => {
    // Carregar tags do localStorage
    const stored = localStorage.getItem('ferraco_tags');
    if (stored) {
      return JSON.parse(stored);
    }
    // Tags padrão
    return [
      { id: '1', name: 'Importante', color: '#ef4444' },
      { id: '2', name: 'Urgente', color: '#f97316' },
      { id: '3', name: 'VIP', color: '#8b5cf6' },
    ];
  });

  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  const saveTags = (updatedTags: Tag[]) => {
    localStorage.setItem('ferraco_tags', JSON.stringify(updatedTags));
    setTags(updatedTags);
    onTagsChange?.();
  };

  const handleAddTag = () => {
    if (!newTagName.trim()) {
      toast.error('Digite um nome para a tag');
      return;
    }

    // Verificar se já existe
    if (tags.some(t => t.name.toLowerCase() === newTagName.toLowerCase())) {
      toast.error('Já existe uma tag com este nome');
      return;
    }

    const newTag: Tag = {
      id: `tag-${Date.now()}`,
      name: newTagName.trim(),
      color: selectedColor,
    };

    saveTags([...tags, newTag]);
    setNewTagName('');
    setSelectedColor(PRESET_COLORS[0]);
    toast.success(`Tag "${newTag.name}" criada!`);
  };

  const handleDeleteTag = (tagId: string) => {
    const tag = tags.find(t => t.id === tagId);
    if (!tag) return;

    if (!confirm(`Excluir tag "${tag.name}"?`)) return;

    saveTags(tags.filter(t => t.id !== tagId));
    toast.success('Tag excluída');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Tags</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-1">
          {/* Create New Tag */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Criar Nova Tag</h3>

            <Input
              placeholder="Nome da tag..."
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
            />

            {/* Color Picker */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Cor da tag</label>
              <div className="grid grid-cols-8 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-md transition-all hover:scale-110 ${
                      selectedColor === color
                        ? 'ring-2 ring-primary ring-offset-2'
                        : ''
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                    title={color}
                  />
                ))}
              </div>
            </div>

            <Button onClick={handleAddTag} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Criar Tag
            </Button>
          </div>

          {/* Existing Tags */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Tags Existentes ({tags.length})</h3>

            <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-3">
              {tags.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma tag criada ainda
                </p>
              ) : (
                tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTag(tag.id)}
                      className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickTagManager;
