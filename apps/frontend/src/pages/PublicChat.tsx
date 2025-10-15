/**
 * PublicChat - Página pública de chat (acessível sem login)
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChatInterface } from '@/components/chat/ChatInterface';

export const PublicChat = () => {
  const [searchParams] = useSearchParams();
  const [source, setSource] = useState<string>('website');
  const [campaign, setCampaign] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Capturar parâmetros da URL
    const sourceParam = searchParams.get('source');
    const campaignParam = searchParams.get('campaign');

    if (sourceParam) {
      setSource(sourceParam);
      console.log('📍 Origem capturada:', sourceParam);
    }

    if (campaignParam) {
      setCampaign(campaignParam);
      console.log('📍 Campanha capturada:', campaignParam);
    }
  }, [searchParams]);

  const handleSendMessage = (message: string) => {
    console.log('Mensagem enviada:', message);
    // Aqui será integrado com o backend futuramente
  };

  return (
    <div className="h-screen w-screen overflow-hidden">
      <ChatInterface
        onSendMessage={handleSendMessage}
        source={source}
        campaign={campaign}
      />
    </div>
  );
};

export default PublicChat;
