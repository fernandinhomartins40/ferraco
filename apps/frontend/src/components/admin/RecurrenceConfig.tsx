/**
 * RecurrenceConfig - Configuração Avançada de Recorrência para Automações
 * Suporta: Diário, Semanal, Mensal, Datas Customizadas, X Dias a partir de agora
 */

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Clock, Plus, X } from 'lucide-react';
import type { RecurrenceType } from '@/services/automationKanban.service';

interface RecurrenceConfigProps {
  recurrenceType: RecurrenceType;
  weekDays?: string;
  monthDay?: number;
  customDates?: string;
  daysFromNow?: number;
  onChange: (config: {
    recurrenceType: RecurrenceType;
    weekDays?: string;
    monthDay?: number;
    customDates?: string;
    daysFromNow?: number;
  }) => void;
}

const WEEKDAY_LABELS = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
];

export function RecurrenceConfig({
  recurrenceType,
  weekDays,
  monthDay,
  customDates,
  daysFromNow,
  onChange,
}: RecurrenceConfigProps) {
  // Parse dos valores atuais
  const selectedWeekDays = weekDays ? JSON.parse(weekDays) : [];
  const parsedCustomDates = customDates ? JSON.parse(customDates) : [];

  const [newCustomDate, setNewCustomDate] = useState('');

  const handleRecurrenceTypeChange = (type: RecurrenceType) => {
    onChange({
      recurrenceType: type,
      weekDays: type === 'WEEKLY' ? '[]' : undefined,
      monthDay: type === 'MONTHLY' ? 1 : undefined,
      customDates: type === 'CUSTOM_DATES' ? '[]' : undefined,
      daysFromNow: type === 'DAYS_FROM_NOW' ? 30 : undefined,
    });
  };

  const handleWeekDayToggle = (day: number) => {
    const current = [...selectedWeekDays];
    const index = current.indexOf(day);

    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(day);
    }

    onChange({
      recurrenceType,
      weekDays: JSON.stringify(current.sort()),
    });
  };

  const handleMonthDayChange = (value: string) => {
    onChange({
      recurrenceType,
      monthDay: parseInt(value) || 1,
    });
  };

  const handleDaysFromNowChange = (value: string) => {
    onChange({
      recurrenceType,
      daysFromNow: parseInt(value) || 30,
    });
  };

  const handleAddCustomDate = () => {
    if (!newCustomDate) return;

    const dates = [...parsedCustomDates, newCustomDate];
    onChange({
      recurrenceType,
      customDates: JSON.stringify(dates),
    });
    setNewCustomDate('');
  };

  const handleRemoveCustomDate = (index: number) => {
    const dates = parsedCustomDates.filter((_: any, i: number) => i !== index);
    onChange({
      recurrenceType,
      customDates: JSON.stringify(dates),
    });
  };

  return (
    <div className="space-y-4">
      {/* Tipo de Recorrência */}
      <div className="space-y-2">
        <Label>Tipo de Envio</Label>
        <Select value={recurrenceType} onValueChange={handleRecurrenceTypeChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NONE">🔹 Envio Único (Sem Recorrência)</SelectItem>
            <SelectItem value="DAILY">📅 Diário</SelectItem>
            <SelectItem value="WEEKLY">📆 Semanal (Dias da Semana)</SelectItem>
            <SelectItem value="MONTHLY">🗓️ Mensal (Dia Específico)</SelectItem>
            <SelectItem value="CUSTOM_DATES">📌 Datas Customizadas</SelectItem>
            <SelectItem value="DAYS_FROM_NOW">⏳ X Dias a Partir de Agora</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Configuração Semanal */}
      {recurrenceType === 'WEEKLY' && (
        <div className="space-y-2">
          <Label>Dias da Semana</Label>
          <div className="flex gap-2 flex-wrap">
            {WEEKDAY_LABELS.map(({ value, label }) => (
              <div key={value} className="flex items-center space-x-2">
                <Checkbox
                  id={`day-${value}`}
                  checked={selectedWeekDays.includes(value)}
                  onCheckedChange={() => handleWeekDayToggle(value)}
                />
                <label
                  htmlFor={`day-${value}`}
                  className="text-sm font-medium cursor-pointer"
                >
                  {label}
                </label>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Envio será feito nos dias selecionados de cada semana
          </p>
        </div>
      )}

      {/* Configuração Mensal */}
      {recurrenceType === 'MONTHLY' && (
        <div className="space-y-2">
          <Label>Dia do Mês (1-31)</Label>
          <Input
            type="number"
            min="1"
            max="31"
            value={monthDay || 1}
            onChange={(e) => handleMonthDayChange(e.target.value)}
            placeholder="Ex: 15 (dia 15 de cada mês)"
          />
          <p className="text-xs text-muted-foreground">
            Envio será feito no dia {monthDay || 1} de cada mês
          </p>
        </div>
      )}

      {/* Configuração de Datas Customizadas */}
      {recurrenceType === 'CUSTOM_DATES' && (
        <div className="space-y-2">
          <Label>Datas Programadas</Label>
          <div className="flex gap-2">
            <Input
              type="datetime-local"
              value={newCustomDate}
              onChange={(e) => setNewCustomDate(e.target.value)}
            />
            <Button type="button" onClick={handleAddCustomDate} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Lista de Datas */}
          {parsedCustomDates.length > 0 && (
            <div className="space-y-2 mt-2">
              {parsedCustomDates.map((date: string, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 p-2 rounded"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      {new Date(date).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCustomDate(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Envio será feito nas datas programadas acima
          </p>
        </div>
      )}

      {/* Configuração de X Dias */}
      {recurrenceType === 'DAYS_FROM_NOW' && (
        <div className="space-y-2">
          <Label>Número de Dias</Label>
          <Input
            type="number"
            min="1"
            value={daysFromNow || 30}
            onChange={(e) => handleDaysFromNowChange(e.target.value)}
            placeholder="Ex: 180 (daqui 180 dias)"
          />
          <p className="text-xs text-muted-foreground">
            Envio será feito daqui {daysFromNow || 30} dias (
            {new Date(Date.now() + (daysFromNow || 30) * 24 * 60 * 60 * 1000).toLocaleDateString(
              'pt-BR'
            )}
            )
          </p>
        </div>
      )}

      {/* Info sobre envio diário */}
      {recurrenceType === 'DAILY' && (
        <p className="text-xs text-muted-foreground">
          <Clock className="h-3 w-3 inline mr-1" />
          Envio será feito todos os dias
        </p>
      )}

      {/* Info sobre envio único */}
      {recurrenceType === 'NONE' && (
        <p className="text-xs text-muted-foreground">
          Envio único, sem recorrência
        </p>
      )}
    </div>
  );
}
