import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateTemplate, useUpdateTemplate } from '@/hooks/api/useRecurrence';
import type { RecurrenceTemplate, CreateTemplateData } from '@/services/recurrence.service';

interface TemplateFormProps {
  template?: RecurrenceTemplate;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TemplateForm({ template, onSuccess, onCancel }: TemplateFormProps) {
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();

  const { register, handleSubmit, setValue, watch } = useForm<CreateTemplateData>({
    defaultValues: template
      ? {
          name: template.name,
          description: template.description,
          trigger: template.trigger,
          minCaptures: template.minCaptures,
          maxCaptures: template.maxCaptures || undefined,
          content: template.content,
          priority: template.priority,
        }
      : {
          minCaptures: 2,
          priority: 5,
          trigger: 'generic_recurrence',
        },
  });

  const onSubmit = async (data: CreateTemplateData) => {
    if (template) {
      await updateTemplate.mutateAsync({ id: template.id, data });
    } else {
      await createTemplate.mutateAsync(data);
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome do Template *</Label>
        <Input id="name" {...register('name', { required: true })} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Input id="description" {...register('description')} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="trigger">Trigger *</Label>
          <Select
            defaultValue={watch('trigger')}
            onValueChange={(value) => setValue('trigger', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="generic_recurrence">Genérico</SelectItem>
              <SelectItem value="second_capture_same_interest">2ª Captura - Mesmo</SelectItem>
              <SelectItem value="second_capture_new_interest">2ª Captura - Novo</SelectItem>
              <SelectItem value="third_capture_high_value">3ª+ Captura - VIP</SelectItem>
              <SelectItem value="long_time_return">Retorno Longo</SelectItem>
              <SelectItem value="high_score_recurrence">Alto Score</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="minCaptures">Capturas Mínimas *</Label>
          <Input
            id="minCaptures"
            type="number"
            min="1"
            {...register('minCaptures', { required: true, valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="maxCaptures">Capturas Máximas</Label>
          <Input
            id="maxCaptures"
            type="number"
            min="1"
            {...register('maxCaptures', { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Prioridade *</Label>
          <Input
            id="priority"
            type="number"
            min="0"
            max="20"
            {...register('priority', { required: true, valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Mensagem *</Label>
        <Textarea
          id="content"
          rows={8}
          placeholder="Use variáveis: {{lead.name}}, {{captureNumber}}, {{previousInterests}}, {{currentInterest}}"
          {...register('content', { required: true })}
        />
        <p className="text-xs text-muted-foreground">
          Variáveis disponíveis: {{'{'}lead.name}}, {{'{'}captureNumber}}, {{'{'}daysSinceLastCapture}}, {{'{'}previousInterests}}, {{'{'}currentInterest}}
        </p>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={createTemplate.isPending || updateTemplate.isPending}>
          {template ? 'Atualizar' : 'Criar'}
        </Button>
      </div>
    </form>
  );
}
