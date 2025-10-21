/**
 * SendLocationDialog - Dialog para enviar localização
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
import { MapPin, Loader2, Crosshair } from 'lucide-react';
import api from '@/lib/apiClient';
import { toast } from 'sonner';
import type { LocationSendOptions } from '@/types/whatsapp';

interface SendLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactPhone: string;
  onSent?: () => void;
}

const SendLocationDialog = ({
  open,
  onOpenChange,
  contactPhone,
  onSent,
}: SendLocationDialogProps) => {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [name, setName] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalização não é suportada pelo navegador');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toString());
        setLongitude(position.coords.longitude.toString());
        setName('Minha Localização Atual');
        setIsGettingLocation(false);
        toast.success('Localização obtida!');
      },
      (error) => {
        console.error('Erro ao obter localização:', error);
        toast.error('Erro ao obter localização. Verifique as permissões.');
        setIsGettingLocation(false);
      }
    );
  };

  const handleSend = async () => {
    // Validações
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      toast.error('Latitude inválida (-90 a 90)');
      return;
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      toast.error('Longitude inválida (-180 a 180)');
      return;
    }

    setIsSending(true);
    try {
      const payload: LocationSendOptions = {
        to: contactPhone,
        latitude: lat,
        longitude: lng,
        name: name.trim() || undefined,
      };

      await api.post('/whatsapp/send-location', payload);

      toast.success('Localização enviada com sucesso!');
      resetForm();
      onOpenChange(false);
      onSent?.();
    } catch (error: any) {
      console.error('Erro ao enviar localização:', error);
      toast.error('Erro ao enviar localização');
    } finally {
      setIsSending(false);
    }
  };

  const resetForm = () => {
    setLatitude('');
    setLongitude('');
    setName('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar Localização</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Get Current Location Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
          >
            {isGettingLocation ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Obtendo localização...
              </>
            ) : (
              <>
                <Crosshair className="mr-2 h-4 w-4" />
                Usar Minha Localização Atual
              </>
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">
                Ou inserir manualmente
              </span>
            </div>
          </div>

          {/* Manual Input */}
          <div className="space-y-2">
            <Label htmlFor="latitude">Latitude *</Label>
            <Input
              id="latitude"
              type="number"
              placeholder="Ex: -23.5505"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              step="any"
            />
            <p className="text-xs text-gray-500">Valor entre -90 e 90</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="longitude">Longitude *</Label>
            <Input
              id="longitude"
              type="number"
              placeholder="Ex: -46.6333"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              step="any"
            />
            <p className="text-xs text-gray-500">Valor entre -180 e 180</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome do Local (opcional)</Label>
            <Input
              id="name"
              placeholder="Ex: São Paulo, SP"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
          </div>

          {latitude && longitude && (
            <div className="p-3 bg-blue-50 rounded-md flex items-start gap-2">
              <MapPin className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">
                  {name || 'Localização selecionada'}
                </p>
                <p className="text-blue-700 text-xs">
                  {latitude}, {longitude}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={isSending || !latitude || !longitude}>
            {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar Localização
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendLocationDialog;
