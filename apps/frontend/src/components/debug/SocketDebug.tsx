/**
 * SocketDebug - Componente temporário para debug do Socket.IO
 * Mostra status da conexão e eventos recebidos
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWhatsAppSocket } from '@/hooks/useWhatsAppSocket';

export const SocketDebug = () => {
  const [events, setEvents] = useState<string[]>([]);

  const socketState = useWhatsAppSocket({
    onQRCode: (qr) => {
      console.log('🔍 [DEBUG] QR Code recebido:', qr.substring(0, 50) + '...');
      setEvents(prev => [...prev, `✅ QR Code recebido: ${new Date().toLocaleTimeString()}`]);
    },
    onStatusChange: (status) => {
      console.log('🔍 [DEBUG] Status mudou:', status);
      setEvents(prev => [...prev, `📊 Status: ${status} - ${new Date().toLocaleTimeString()}`]);
    },
    onReady: () => {
      console.log('🔍 [DEBUG] WhatsApp pronto');
      setEvents(prev => [...prev, `✅ WhatsApp pronto - ${new Date().toLocaleTimeString()}`]);
    },
    onDisconnected: (reason) => {
      console.log('🔍 [DEBUG] Desconectado:', reason);
      setEvents(prev => [...prev, `❌ Desconectado: ${reason} - ${new Date().toLocaleTimeString()}`]);
    },
    onError: (error) => {
      console.log('🔍 [DEBUG] Erro:', error);
      setEvents(prev => [...prev, `⚠️ Erro: ${error} - ${new Date().toLocaleTimeString()}`]);
    },
  });

  useEffect(() => {
    console.log('🔍 [DEBUG] Estado do Socket:', socketState);
  }, [socketState]);

  return (
    <Card className="mb-4 border-2 border-yellow-500">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          🔍 Socket.IO Debug
          <Badge variant={socketState.socket?.connected ? 'default' : 'destructive'}>
            {socketState.socket?.connected ? 'Conectado' : 'Desconectado'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <strong>Socket ID:</strong> {socketState.socket?.id || 'N/A'}
          </div>
          <div>
            <strong>Connection Status:</strong> {socketState.connectionStatus}
          </div>
          <div>
            <strong>State Type:</strong> {socketState.connectionState.type}
          </div>
          <div>
            <strong>Has QR Code:</strong> {socketState.qrCode ? '✅ Sim' : '❌ Não'}
          </div>
          <div>
            <strong>QR Length:</strong> {socketState.qrCode?.length || 0}
          </div>
          <div>
            <strong>Is Connected:</strong> {socketState.isConnected ? '✅' : '❌'}
          </div>
        </div>

        {socketState.qrCode && (
          <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
            <strong>QR Code Preview:</strong>
            <div className="truncate">{socketState.qrCode.substring(0, 100)}...</div>
          </div>
        )}

        <div className="mt-4">
          <strong className="text-xs">Eventos Recebidos:</strong>
          <div className="mt-2 max-h-40 overflow-y-auto bg-gray-50 p-2 rounded text-xs space-y-1">
            {events.length === 0 ? (
              <div className="text-gray-400">Nenhum evento ainda...</div>
            ) : (
              events.slice(-10).reverse().map((event, i) => (
                <div key={i} className="font-mono">{event}</div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
