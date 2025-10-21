/**
 * SendPollDialog - Dialog para enviar enquete (Poll)
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
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import api from '@/lib/apiClient';
import { toast } from 'sonner';
import type { PollSendOptions } from '@/types/whatsapp';

interface SendPollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactPhone: string;
  onSent?: () => void;
}

const SendPollDialog = ({
  open,
  onOpenChange,
  contactPhone,
  onSent,
}: SendPollDialogProps) => {
  const [pollName, setPollName] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [isSending, setIsSending] = useState(false);

  const addOption = () => {
    if (options.length < 12) {
      setOptions([...options, '']);
    } else {
      toast.error('Máximo de 12 opções permitido');
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    } else {
      toast.error('Mínimo de 2 opções necessário');
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSend = async () => {
    // Validações
    if (!pollName.trim()) {
      toast.error('Pergunta da enquete é obrigatória');
      return;
    }

    const filledOptions = options.filter((opt) => opt.trim());

    if (filledOptions.length < 2) {
      toast.error('Pelo menos 2 opções são necessárias');
      return;
    }

    if (filledOptions.length > 12) {
      toast.error('Máximo de 12 opções permitido');
      return;
    }

    setIsSending(true);
    try {
      const payload: PollSendOptions = {
        to: contactPhone,
        name: pollName.trim(),
        options: filledOptions,
      };

      await api.post('/whatsapp/send-poll', payload);

      toast.success('Enquete enviada com sucesso!');
      resetForm();
      onOpenChange(false);
      onSent?.();
    } catch (error: any) {
      console.error('Erro ao enviar enquete:', error);
      toast.error('Erro ao enviar enquete');
    } finally {
      setIsSending(false);
    }
  };

  const resetForm = () => {
    setPollName('');
    setOptions(['', '']);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Enquete</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Poll Question */}
          <div className="space-y-2">
            <Label htmlFor="pollName">Pergunta da Enquete *</Label>
            <Input
              id="pollName"
              placeholder="Ex: Qual sua opinião sobre nosso serviço?"
              value={pollName}
              onChange={(e) => setPollName(e.target.value)}
              maxLength={255}
            />
          </div>

          {/* Options */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Opções (2-12)</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addOption}
                disabled={options.length >= 12}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>

            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Opção ${index + 1} *`}
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    maxLength={100}
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-gray-500">
            Os usuários poderão selecionar uma das opções acima.
          </p>
        </div>

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
            Enviar Enquete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendPollDialog;
