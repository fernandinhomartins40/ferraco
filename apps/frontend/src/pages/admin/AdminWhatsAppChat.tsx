/**
 * AdminWhatsAppChat - Interface de chat WhatsApp estilo WhatsApp Web
 *
 * Layout:
 * - Sidebar esquerda: Lista de conversas
 * - Área direita: Chat ativo com mensagens
 */

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ConversationList from '@/components/whatsapp/ConversationList';
import ChatArea from '@/components/whatsapp/ChatArea';
import { Card } from '@/components/ui/card';

const AdminWhatsAppChat = () => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold">WhatsApp Chat</h1>
          <p className="text-gray-600">Gerencie suas conversas do WhatsApp</p>
        </div>

        {/* Chat Container - Estilo WhatsApp Web */}
        <Card className="flex-1 flex overflow-hidden">
          {/* Sidebar - Lista de Conversas */}
          <div className="w-96 border-r flex-shrink-0 bg-white">
            <ConversationList
              selectedId={selectedConversationId}
              onSelectConversation={setSelectedConversationId}
            />
          </div>

          {/* Área Principal - Chat */}
          <div className="flex-1 flex flex-col bg-gray-50">
            {selectedConversationId ? (
              <ChatArea conversationId={selectedConversationId} />
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <svg
                    className="mx-auto h-24 w-24 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <h3 className="text-lg font-medium">Selecione uma conversa</h3>
                  <p className="text-sm mt-2">
                    Escolha uma conversa na lista ao lado para começar
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminWhatsAppChat;
