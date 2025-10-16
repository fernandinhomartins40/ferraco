/**
 * ChatArea - Área de chat principal com mensagens e input
 */

import { useState, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Loader2, Phone, Video, ArrowLeft } from 'lucide-react';
import api from '@/lib/apiClient';
import MessageInput from './MessageInput';
import ChatActionsMenu from './ChatActionsMenu';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useWhatsAppWebSocket } from '@/hooks/useWhatsAppWebSocket';

interface Contact {
  id: string;
  phone: string;
  name: string | null;
  profilePicUrl: string | null;
}

interface Conversation {
  id: string;
  contact: Contact;
}

interface Message {
  id: string;
  conversationId: string;
  type: string;
  content: string;
  mediaUrl: string | null;
  fromMe: boolean;
  status: string;
  timestamp: string;
  contact: Contact;
}

interface ChatAreaProps {
  conversationId: string;
  onBack?: () => void;
}

const ChatArea = ({ conversationId, onBack }: ChatAreaProps) => {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchConversation();
    fetchMessages();
  }, [conversationId]);

  // WebSocket for real-time messages
  const { subscribeToConversation, unsubscribeFromConversation } = useWhatsAppWebSocket({
    onNewMessage: (message) => {
      // Add new message if it belongs to this conversation
      if (message.conversationId === conversationId) {
        console.log('📩 Nova mensagem recebida:', message);
        setMessages((prev) => [...prev, message]);
      }
    },
    onTyping: (data) => {
      // Show typing indicator if it's from this contact
      const contactId = conversation?.contact.phone.replace(/\D/g, '');
      const typingContactId = data.contactId.replace(/\D/g, '').replace(/@c\.us$/, '');

      if (contactId === typingContactId) {
        setIsTyping(data.isTyping);
        setIsRecording(data.isRecording);

        // Auto-hide typing indicator after 5 seconds
        if (data.isTyping || data.isRecording) {
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            setIsRecording(false);
          }, 5000);
        }
      }
    },
  });

  // Subscribe/unsubscribe to conversation
  useEffect(() => {
    if (conversationId) {
      subscribeToConversation(conversationId);
      return () => {
        unsubscribeFromConversation(conversationId);
      };
    }
  }, [conversationId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);

  const fetchConversation = async () => {
    try {
      const response = await api.get(`/whatsapp/conversations/${conversationId}`);
      setConversation(response.data.conversation);
    } catch (error) {
      console.error('Erro ao buscar conversa:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/whatsapp/conversations/${conversationId}/messages`);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getDisplayName = (contact: Contact) => {
    return contact.name || contact.phone;
  };

  const formatMessageTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'HH:mm', { locale: ptBR });
    } catch {
      return '';
    }
  };

  const formatMessageDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return '';
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatMessageDate(message.timestamp);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  const handleSendMessage = async (content: string) => {
    if (!conversation) return;

    try {
      // Send via WhatsApp API
      await api.post('/whatsapp/send', {
        to: conversation.contact.phone,
        message: content,
      });

      // Refresh messages
      await fetchMessages();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>Conversa não encontrada</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b bg-white flex-shrink-0">
        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
          {/* Back Button (Mobile only) */}
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="md:hidden flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}

          {/* Avatar */}
          {conversation.contact.profilePicUrl ? (
            <img
              src={conversation.contact.profilePicUrl}
              alt={getDisplayName(conversation.contact)}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              <span className="text-gray-600 font-medium">
                {getDisplayName(conversation.contact).charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h2 className="font-semibold truncate">{getDisplayName(conversation.contact)}</h2>
            {isTyping || isRecording ? (
              <p className="text-sm text-green-600 italic animate-pulse">
                {isRecording ? '🎤 Gravando áudio...' : '⌨️ Digitando...'}
              </p>
            ) : (
              <p className="text-sm text-gray-500 truncate">{conversation.contact.phone}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Video className="h-5 w-5" />
          </Button>
          <ChatActionsMenu
            chatId={conversationId}
            contactPhone={conversation.contact.phone}
            contactName={conversation.contact.name || undefined}
            onAction={fetchMessages}
          />
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4 md:px-6 py-4 overflow-y-auto">
        <div className="space-y-4 pb-4">
          {Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              {/* Date Separator */}
              <div className="flex justify-center my-4">
                <span className="bg-white px-3 py-1 rounded-full text-xs text-gray-500 shadow-sm">
                  {date}
                </span>
              </div>

              {/* Messages */}
              {dateMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex mb-2 ${message.fromMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`
                      max-w-[85%] sm:max-w-[70%] rounded-lg px-3 md:px-4 py-2 shadow-sm
                      ${
                        message.fromMe
                          ? 'bg-green-500 text-white'
                          : 'bg-white text-gray-800 border'
                      }
                    `}
                  >
                    {/* Message Content */}
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

                    {/* Message Time & Status */}
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span
                        className={`text-xs ${
                          message.fromMe ? 'text-green-100' : 'text-gray-500'
                        }`}
                      >
                        {formatMessageTime(message.timestamp)}
                      </span>

                      {message.fromMe && (
                        <span className="text-xs">
                          {message.status === 'READ' && (
                            <span className="text-blue-200">✓✓</span>
                          )}
                          {message.status === 'DELIVERED' && (
                            <span className="text-green-100">✓✓</span>
                          )}
                          {message.status === 'SENT' && (
                            <span className="text-green-100">✓</span>
                          )}
                          {message.status === 'PENDING' && (
                            <span className="text-green-100">🕐</span>
                          )}
                          {message.status === 'FAILED' && (
                            <span className="text-red-300">⚠️</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Message Input - Fixed at bottom */}
      <div className="flex-shrink-0">
        <MessageInput
          onSendMessage={handleSendMessage}
          conversationPhone={conversation?.contact.phone}
          onMessageSent={fetchMessages}
        />
      </div>
    </div>
  );
};

export default ChatArea;
