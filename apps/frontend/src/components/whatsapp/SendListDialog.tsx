/**
 * SendListDialog - Dialog para enviar lista interativa (WhatsApp Business)
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import api from '@/lib/apiClient';
import { toast } from 'sonner';
import type { ListSendOptions } from '@/types/whatsapp';

interface SendListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactPhone: string;
  onSent?: () => void;
}

interface ListRow {
  id: string;
  title: string;
  description: string;
  rowId: string;
}

interface ListSection {
  id: string;
  title: string;
  rows: ListRow[];
}

const SendListDialog = ({
  open,
  onOpenChange,
  contactPhone,
  onSent,
}: SendListDialogProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [buttonText, setButtonText] = useState('Ver opções');
  const [sections, setSections] = useState<ListSection[]>([
    {
      id: '1',
      title: 'Seção 1',
      rows: [{ id: '1', title: '', description: '', rowId: 'row_1' }],
    },
  ]);
  const [isSending, setIsSending] = useState(false);

  const addSection = () => {
    const newId = String(sections.length + 1);
    setSections([
      ...sections,
      {
        id: newId,
        title: `Seção ${newId}`,
        rows: [{ id: '1', title: '', description: '', rowId: `row_${newId}_1` }],
      },
    ]);
  };

  const removeSection = (sectionId: string) => {
    setSections(sections.filter((s) => s.id !== sectionId));
  };

  const updateSection = (sectionId: string, title: string) => {
    setSections(
      sections.map((s) => (s.id === sectionId ? { ...s, title } : s))
    );
  };

  const addRow = (sectionId: string) => {
    setSections(
      sections.map((s) => {
        if (s.id === sectionId) {
          const newRowId = String(s.rows.length + 1);
          return {
            ...s,
            rows: [
              ...s.rows,
              {
                id: newRowId,
                title: '',
                description: '',
                rowId: `row_${sectionId}_${newRowId}`,
              },
            ],
          };
        }
        return s;
      })
    );
  };

  const removeRow = (sectionId: string, rowId: string) => {
    setSections(
      sections.map((s) => {
        if (s.id === sectionId) {
          return {
            ...s,
            rows: s.rows.filter((r) => r.id !== rowId),
          };
        }
        return s;
      })
    );
  };

  const updateRow = (
    sectionId: string,
    rowId: string,
    field: keyof ListRow,
    value: string
  ) => {
    setSections(
      sections.map((s) => {
        if (s.id === sectionId) {
          return {
            ...s,
            rows: s.rows.map((r) =>
              r.id === rowId ? { ...r, [field]: value } : r
            ),
          };
        }
        return s;
      })
    );
  };

  const handleSend = async () => {
    // Validações
    if (!title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    if (!buttonText.trim()) {
      toast.error('Texto do botão é obrigatório');
      return;
    }

    const hasEmptyRows = sections.some((s) =>
      s.rows.some((r) => !r.title.trim())
    );

    if (hasEmptyRows) {
      toast.error('Todas as opções devem ter um título');
      return;
    }

    setIsSending(true);
    try {
      const payload: ListSendOptions = {
        to: contactPhone,
        title: title.trim(),
        description: description.trim(),
        buttonText: buttonText.trim(),
        sections: sections.map((s) => ({
          title: s.title,
          rows: s.rows.map((r) => ({
            title: r.title.trim(),
            description: r.description.trim() || undefined,
            rowId: r.rowId,
          })),
        })),
      };

      await api.post('/whatsapp/send-list', payload);

      toast.success('Lista enviada com sucesso!');
      resetForm();
      onOpenChange(false);
      onSent?.();
    } catch (error: any) {
      console.error('Erro ao enviar lista:', error);
      toast.error('Erro ao enviar lista');
    } finally {
      setIsSending(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setButtonText('Ver opções');
    setSections([
      {
        id: '1',
        title: 'Seção 1',
        rows: [{ id: '1', title: '', description: '', rowId: 'row_1' }],
      },
    ]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Enviar Lista Interativa</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {/* Header */}
            <div className="space-y-2">
              <Label htmlFor="title">Título da Lista *</Label>
              <Input
                id="title"
                placeholder="Ex: Escolha uma opção"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={60}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Ex: Selecione uma das opções abaixo"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                maxLength={1024}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="buttonText">Texto do Botão *</Label>
              <Input
                id="buttonText"
                placeholder="Ex: Ver opções"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                maxLength={20}
              />
            </div>

            {/* Sections */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label>Seções e Opções</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSection}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Seção
                </Button>
              </div>

              {sections.map((section, sectionIdx) => (
                <div key={section.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Título da seção"
                      value={section.title}
                      onChange={(e) => updateSection(section.id, e.target.value)}
                      maxLength={24}
                    />
                    {sections.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSection(section.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>

                  {/* Rows */}
                  <div className="space-y-2 pl-4">
                    {section.rows.map((row, rowIdx) => (
                      <div key={row.id} className="flex gap-2">
                        <div className="flex-1 space-y-2">
                          <Input
                            placeholder="Título da opção *"
                            value={row.title}
                            onChange={(e) =>
                              updateRow(section.id, row.id, 'title', e.target.value)
                            }
                            maxLength={24}
                          />
                          <Input
                            placeholder="Descrição (opcional)"
                            value={row.description}
                            onChange={(e) =>
                              updateRow(
                                section.id,
                                row.id,
                                'description',
                                e.target.value
                              )
                            }
                            maxLength={72}
                          />
                        </div>
                        {section.rows.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeRow(section.id, row.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => addRow(section.id)}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Opção
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar Lista
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendListDialog;
