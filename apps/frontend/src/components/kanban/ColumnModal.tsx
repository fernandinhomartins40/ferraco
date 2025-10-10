import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KanbanColumn } from '@/utils/kanbanStorage';

interface ColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; color: string }) => void;
  column?: KanbanColumn | null;
}

const PRESET_COLORS = [
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Verde', value: '#22c55e' },
  { name: 'Amarelo', value: '#eab308' },
  { name: 'Laranja', value: '#f97316' },
  { name: 'Vermelho', value: '#ef4444' },
  { name: 'Rosa', value: '#ec4899' },
  { name: 'Roxo', value: '#a855f7' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Cinza', value: '#6b7280' },
  { name: 'Marrom', value: '#92400e' },
];

const ColumnModal = ({ isOpen, onClose, onSave, column }: ColumnModalProps) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [customColor, setCustomColor] = useState('');

  useEffect(() => {
    if (column) {
      setName(column.name);
      setColor(column.color);
      setCustomColor(column.color);
    } else {
      setName('');
      setColor('#3b82f6');
      setCustomColor('');
    }
  }, [column, isOpen]);

  const handleSave = () => {
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      color: customColor || color
    });

    onClose();
  };

  const handleColorSelect = (selectedColor: string) => {
    setColor(selectedColor);
    setCustomColor('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {column ? 'Editar Coluna' : 'Nova Coluna'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Nome da Coluna */}
          <div className="space-y-2">
            <Label htmlFor="column-name">Nome da Coluna</Label>
            <Input
              id="column-name"
              placeholder="Ex: Em contato, Negociação..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>

          {/* Cores Predefinidas */}
          <div className="space-y-2">
            <Label>Cor da Coluna</Label>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor.value}
                  type="button"
                  className={`w-full h-10 rounded-lg border-2 transition-all hover:scale-110 ${
                    color === presetColor.value && !customColor
                      ? 'border-primary ring-2 ring-primary ring-offset-2'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: presetColor.value }}
                  onClick={() => handleColorSelect(presetColor.value)}
                  title={presetColor.name}
                />
              ))}
            </div>
          </div>

          {/* Cor Personalizada */}
          <div className="space-y-2">
            <Label htmlFor="custom-color">Ou escolha uma cor personalizada</Label>
            <div className="flex space-x-2">
              <Input
                id="custom-color"
                type="color"
                value={customColor || color}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-20 h-10 p-1 cursor-pointer"
              />
              <Input
                type="text"
                placeholder="#3b82f6"
                value={customColor || color}
                onChange={(e) => setCustomColor(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div
              className="w-full h-12 rounded-lg flex items-center justify-center text-white font-semibold"
              style={{ backgroundColor: customColor || color }}
            >
              {name || 'Nome da Coluna'}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {column ? 'Salvar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ColumnModal;
