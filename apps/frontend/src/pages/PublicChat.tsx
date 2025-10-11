/**
 * PublicChat - Página pública de chat (acessível sem login)
 */

import { ChatInterface } from '@/components/chat/ChatInterface';

export const PublicChat = () => {
  const handleSendMessage = (message: string) => {
    console.log('Mensagem enviada:', message);
    // Aqui será integrado com o backend futuramente
  };

  return (
    <div className="h-screen w-screen overflow-hidden">
      <ChatInterface onSendMessage={handleSendMessage} />
    </div>
  );
};

export default PublicChat;
