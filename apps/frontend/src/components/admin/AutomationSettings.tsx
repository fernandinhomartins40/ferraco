import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Clock, Globe, Calendar } from 'lucide-react';
import api from '@/services/api';

interface AutomationSettingsData {
  id: string;
  columnIntervalSeconds: number;
  maxMessagesPerHour: number;
  maxMessagesPerDay: number;
  sendOnlyBusinessHours: boolean;
  businessHourStart: number;
  businessHourEnd: number;
  blockWeekends: boolean;
  timezone: string;
}

// Lista de timezones comuns
const COMMON_TIMEZONES = [
  { value: 'America/Sao_Paulo', label: 'Brasil - São Paulo (UTC-3)' },
  { value: 'America/Fortaleza', label: 'Brasil - Fortaleza (UTC-3)' },
  { value: 'America/Manaus', label: 'Brasil - Manaus (UTC-4)' },
  { value: 'America/Noronha', label: 'Brasil - Fernando de Noronha (UTC-2)' },
  { value: 'America/New_York', label: 'EUA - New York (UTC-5)' },
  { value: 'America/Chicago', label: 'EUA - Chicago (UTC-6)' },
  { value: 'America/Los_Angeles', label: 'EUA - Los Angeles (UTC-8)' },
  { value: 'Europe/London', label: 'Reino Unido - Londres (UTC+0)' },
  { value: 'Europe/Paris', label: 'França - Paris (UTC+1)' },
  { value: 'Europe/Lisbon', label: 'Portugal - Lisboa (UTC+0)' },
  { value: 'Asia/Tokyo', label: 'Japão - Tóquio (UTC+9)' },
  { value: 'Asia/Dubai', label: 'Emirados - Dubai (UTC+4)' },
];

export function AutomationSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AutomationSettingsData | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/automation-kanban/settings');
      setSettings(response.data);
    } catch (error) {
      toast({
        title: 'Erro ao carregar configurações',
        description: 'Não foi possível carregar as configurações de automação.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      await api.put('/automation-kanban/settings', settings);
      toast({
        title: 'Configurações salvas',
        description: 'As configurações de automação foram atualizadas com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          Erro ao carregar configurações
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Horário Comercial */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <CardTitle>Horário Comercial</CardTitle>
          </div>
          <CardDescription>
            Configure quando as automações podem enviar mensagens
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Respeitar horário comercial</Label>
              <p className="text-sm text-gray-500">
                Enviar mensagens apenas dentro do horário configurado
              </p>
            </div>
            <Switch
              checked={settings.sendOnlyBusinessHours}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, sendOnlyBusinessHours: checked })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Horário de início</Label>
              <Select
                value={settings.businessHourStart.toString()}
                onValueChange={(value) =>
                  setSettings({ ...settings, businessHourStart: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {i.toString().padStart(2, '0')}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Horário de término</Label>
              <Select
                value={settings.businessHourEnd.toString()}
                onValueChange={(value) =>
                  setSettings({ ...settings, businessHourEnd: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {i.toString().padStart(2, '0')}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Bloquear finais de semana
              </Label>
              <p className="text-sm text-gray-500">
                Não enviar mensagens aos sábados e domingos
              </p>
            </div>
            <Switch
              checked={settings.blockWeekends}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, blockWeekends: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Fuso Horário */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-green-600" />
            <CardTitle>Fuso Horário</CardTitle>
          </div>
          <CardDescription>
            Defina o fuso horário para as automações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select
              value={settings.timezone}
              onValueChange={(value) => setSettings({ ...settings, timezone: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMMON_TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              Horário atual no timezone selecionado:{' '}
              <strong>
                {new Date().toLocaleString('pt-BR', {
                  timeZone: settings.timezone,
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </strong>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Limites de Segurança */}
      <Card>
        <CardHeader>
          <CardTitle>Limites de Segurança</CardTitle>
          <CardDescription>
            Configure limites para evitar bloqueios do WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Mensagens por hora</Label>
            <Input
              type="number"
              value={settings.maxMessagesPerHour}
              onChange={(e) =>
                setSettings({ ...settings, maxMessagesPerHour: parseInt(e.target.value) })
              }
              min={1}
              max={1000}
            />
            <p className="text-sm text-gray-500">
              Máximo de mensagens que podem ser enviadas por hora
            </p>
          </div>

          <div className="space-y-2">
            <Label>Mensagens por dia</Label>
            <Input
              type="number"
              value={settings.maxMessagesPerDay}
              onChange={(e) =>
                setSettings({ ...settings, maxMessagesPerDay: parseInt(e.target.value) })
              }
              min={1}
              max={5000}
            />
            <p className="text-sm text-gray-500">
              Máximo de mensagens que podem ser enviadas por dia
            </p>
          </div>

          <div className="space-y-2">
            <Label>Intervalo entre colunas (segundos)</Label>
            <Input
              type="number"
              value={settings.columnIntervalSeconds}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  columnIntervalSeconds: parseInt(e.target.value),
                })
              }
              min={1}
              max={3600}
            />
            <p className="text-sm text-gray-500">
              Tempo de espera antes de mover um lead para a próxima coluna
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
