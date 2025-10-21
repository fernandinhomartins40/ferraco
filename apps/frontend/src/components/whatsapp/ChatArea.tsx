/**
 * ChatArea - Área de chat principal com TODAS as funcionalidades WPPConnect
 */

import { useState, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Loader2, Phone, Video, ArrowLeft, Search } from 'lucide-react';
import api from '@/lib/apiClient';
import MessageInput from './MessageInput';
import ChatActionsMenu from './ChatActionsMenu';
import MessageContextMenu from './MessageContextMenu';
import ReactionPicker from './ReactionPicker';
import MediaViewer from './MediaViewer';
import ReplyPreview from './ReplyPreview';
import ForwardDialog from './ForwardDialog';
import MediaUploader from './MediaUploader';
import AudioRecorder from './AudioRecorder';
import InteractiveMessageMenu from './InteractiveMessageMenu';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useWhatsAppWebSocket } from '@/hooks/useWhatsAppWebSocket';
import { toast } from 'sonner';
import type { Message, Conversation, Contact } from '@/types/whatsapp';

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
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Extrair phone do conversationId (conversationId é o phone ou id do WhatsApp)
        // Exemplo: "553196219989@c.us" ou "553196219989"
        const phone = conversationId.replace('@c.us', '').replace(/\D/g, '');

        // Buscar conversas para encontrar a conversa específica
        const convsResponse = await api.get('/whatsapp/conversations/v2');
        const conversation = convsResponse.data.conversations.find((c: any) =>
          c.phone === phone || c.id === conversationId
        );

        if (conversation) {
          setConversation(conversation);
        }

        // Buscar mensagens usando phone
        const msgResponse = await api.get(`/whatsapp/conversations/${phone}/messages/v2`);
        setMessages(msgResponse.data.messages);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [conversationId]);

  // WebSocket for real-time messages
  const { subscribeToConversation, unsubscribeFromConversation } = useWhatsAppWebSocket({
    onNewMessage: (message) => {
      if (message.conversationId === conversationId) {
        console.log('📩 Nova mensagem recebida:', message);
        setMessages((prev) => [...prev, message]);
      }
    },
    onMessageStatus: (data) => {
      console.log('📨 Status de mensagem atualizado via WebSocket:', data);

      setMessages((prev) => {
        return prev.map((msg) => {
          // ✅ CRÍTICO: Comparar com messageIds (pode ser whatsappMessageId ou id interno)
          const shouldUpdate = data.messageIds.some((msgId: string) =>
            msg.id === msgId || msg.id.includes(msgId) || msgId.includes(msg.id)
          );

          if (shouldUpdate) {
            console.log(`✅ Atualizando status: ${msg.id.substring(0, 30)}... de ${msg.status} para ${data.status}`);
            return { ...msg, status: data.status };
          }

          return msg;
        });
      });
    },
    onTyping: (data) => {
      const contactId = conversation?.contact.phone.replace(/\D/g, '');
      const typingContactId = data.contactId.replace(/\D/g, '').replace(/@c\.us$/, '');

      if (contactId === typingContactId) {
        setIsTyping(data.isTyping);
        setIsRecording(data.isRecording);

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
    onReaction: (data) => {
      // Atualizar reação em tempo real
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId
            ? {
                ...msg,
                reactions: [
                  ...(msg.reactions || []).filter((r) => r.from !== data.from),
                  { emoji: data.emoji, from: data.from },
                ],
              }
            : msg
        )
      );
    },
    // ✅ NOVOS EVENTOS NATIVOS DO WPPCONNECT
    onMessageRevoked: (data) => {
      console.log('🗑️ Mensagem deletada:', data);
      setMessages((prev) => prev.filter((msg) => msg.id !== data.messageId));
      toast.info('Mensagem deletada');
    },
    onMessageEdited: (data) => {
      console.log('✏️ Mensagem editada:', data);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId
            ? { ...msg, content: data.newContent }
            : msg
        )
      );
    },
    onPresence: (data) => {
      // Atualizar presença (typing agora vem de onPresence nativo)
      const contactId = conversation?.contact.phone.replace(/\D/g, '');
      const presenceContactId = data.contactId.replace(/\D/g, '').replace(/@c\.us$/, '');

      if (contactId === presenceContactId) {
        setIsTyping(data.isTyping);
        setIsRecording(data.isRecording);

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

  useEffect(() => {
    if (conversationId) {
      subscribeToConversation(conversationId);
      return () => {
        unsubscribeFromConversation(conversationId);
      };
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ✅ STATELESS: Busca mensagens direto do WhatsApp (via API v2)
  const fetchMessages = async () => {
    try {
      // Precisa ter conversation.contact.phone para usar v2 API
      if (!conversation?.contact.phone) {
        console.error('Phone não disponível para buscar mensagens');
        return;
      }

      const response = await api.get(`/whatsapp/conversations/${conversation.contact.phone}/messages/v2`);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
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
      const payload: any = {
        to: conversation.contact.phone,
        message: content,
      };

      // Se está respondendo uma mensagem
      if (replyingTo) {
        payload.quotedMessageId = replyingTo.id;
      }

      await api.post('/whatsapp/send', payload);
      setReplyingTo(null);
      await fetchMessages();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  };

  // Actions handlers
  const handleReply = (message: Message) => {
    setReplyingTo(message);
  };

  const handleForward = (message: Message) => {
    setForwardingMessage(message.id);
  };

  const handleReact = async (messageId: string, emoji: string) => {
    try {
      await api.post('/whatsapp/send-reaction', {
        messageId,
        emoji,
      });
      toast.success('Reação enviada!');
    } catch (error) {
      console.error('Erro ao reagir:', error);
      toast.error('Erro ao reagir à mensagem');
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Texto copiado!');
  };

  const handleDelete = async (message: Message, forEveryone: boolean = false) => {
    const confirmMsg = forEveryone
      ? 'Deseja deletar esta mensagem para todos?'
      : 'Deseja deletar esta mensagem apenas para você?';

    if (confirm(confirmMsg)) {
      try {
        // ✅ CORRIGIDO: Usar phone correto do contato
        const chatId = conversation?.contact.phone.includes('@c.us')
          ? conversation.contact.phone
          : `${conversation?.contact.phone}@c.us`;

        await api.post('/whatsapp/delete-message', {
          chatId,
          messageId: message.id,
          forEveryone,
        });

        setMessages((prev) => prev.filter((msg) => msg.id !== message.id));
        toast.success('Mensagem deletada');
      } catch (error) {
        console.error('Erro ao deletar:', error);
        toast.error('Erro ao deletar mensagem');
      }
    }
  };

  const handleStar = async (message: Message) => {
    try {
      // ✅ CORRIGIDO: Usar isStarred do tipo correto
      const isStarred = message.isStarred || false;
      await api.post('/whatsapp/star-message', {
        messageId: message.id,
        star: !isStarred,
      });

      // Atualizar estado local
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === message.id ? { ...msg, isStarred: !isStarred } : msg
        )
      );

      toast.success(isStarred ? 'Mensagem desfavoritada' : 'Mensagem favoritada');
    } catch (error) {
      console.error('Erro ao favoritar:', error);
      toast.error('Erro ao favoritar mensagem');
    }
  };

  const handleEdit = async (message: Message) => {
    // WhatsApp não suporta edição de mensagens
    toast.error('WhatsApp não suporta edição de mensagens');
  };

  const handleDownload = async (message: Message) => {
    try {
      // FASE C: Download de mídia usando endpoint correto
      const response = await api.post('/whatsapp/download-media', {
        messageId: message.id,
      }, {
        responseType: 'blob', // Importante para receber arquivo binário
      });

      // Criar URL temporária para download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `media-${message.id}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Download concluído!');
    } catch (error) {
      console.error('Erro ao baixar:', error);
      toast.error('Erro ao baixar mídia');
    }
  };

  const filteredMessages = searchQuery
    ? messages.filter((msg) =>
        msg.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  const filteredGroupedMessages = filteredMessages.reduce((groups, message) => {
    const date = formatMessageDate(message.timestamp);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search className="h-5 w-5" />
          </Button>
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

      {/* Search Bar */}
      {showSearch && (
        <div className="px-4 py-2 border-b bg-gray-50">
          <input
            type="text"
            placeholder="Buscar mensagens..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
      )}

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4 md:px-6 py-4 overflow-y-auto">
        <div className="space-y-4 pb-4">
          {Object.entries(filteredGroupedMessages).map(([date, dateMessages]) => (
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
                  className={`flex mb-2 group ${message.fromMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex items-end gap-2">
                    {message.fromMe && (
                      <MessageContextMenu
                        message={message}
                        onReply={handleReply}
                        onForward={handleForward}
                        onReact={(msg) => {}}
                        onCopy={handleCopy}
                        onDelete={handleDelete}
                        onStar={handleStar}
                        onDownload={message.mediaUrl ? () => handleDownload(message) : undefined}
                      />
                    )}

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
                      {/* Quoted Message */}
                      {message.quotedMessage && (
                        <div className={`mb-2 p-2 rounded border-l-4 ${message.fromMe ? 'border-green-300 bg-green-600/20' : 'border-gray-300 bg-gray-100'}`}>
                          <p className="text-xs font-semibold opacity-80">
                            {message.quotedMessage.fromMe ? 'Você' : getDisplayName(message.quotedMessage.contact)}
                          </p>
                          <p className="text-xs opacity-70 truncate">
                            {message.quotedMessage.content}
                          </p>
                        </div>
                      )}

                      {/* Media */}
                      {message.mediaUrl && (
                        <div className="mb-2">
                          <MediaViewer
                            type={message.mediaType as any || 'document'}
                            url={message.mediaUrl}
                            filename={message.content || 'arquivo'}
                            onDownload={() => handleDownload(message)}
                          />
                        </div>
                      )}

                      {/* Message Content */}
                      {message.content && (
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      )}

                      {/* Message Time & Status */}
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span
                          className={`text-xs ${
                            message.fromMe ? 'text-white/70' : 'text-gray-500'
                          }`}
                        >
                          {formatMessageTime(message.timestamp)}
                        </span>

                        {message.fromMe && (
                          <span className="text-xs flex items-center ml-1" title={`Status: ${message.status}`}>
                            {(() => {
                              // ✅ VISUAL IDÊNTICO AO WHATSAPP WEB
                              switch (message.status) {
                                case 'READ':
                                  // 2 checks azuis (lido)
                                  return (
                                    <span className="inline-flex gap-[1px]">
                                      <svg width="16" height="11" viewBox="0 0 16 11" className="fill-blue-400">
                                        <path d="M11.071.653a.498.498 0 00-.699-.111L5.023 4.135 2.78 2.07a.5.5 0 00-.695.718l2.652 2.444a.5.5 0 00.677.017l5.85-4a.498.498 0 00.111-.699l-.304.103z"/>
                                      </svg>
                                      <svg width="16" height="11" viewBox="0 0 16 11" className="fill-blue-400 -ml-1.5">
                                        <path d="M11.071.653a.498.498 0 00-.699-.111L5.023 4.135 2.78 2.07a.5.5 0 00-.695.718l2.652 2.444a.5.5 0 00.677.017l5.85-4a.498.498 0 00.111-.699l-.304.103z"/>
                                      </svg>
                                    </span>
                                  );
                                case 'PLAYED':
                                  // 2 checks azuis + ícone play (áudio/vídeo reproduzido)
                                  return (
                                    <span className="inline-flex gap-[1px] items-center">
                                      <svg width="16" height="11" viewBox="0 0 16 11" className="fill-blue-400">
                                        <path d="M11.071.653a.498.498 0 00-.699-.111L5.023 4.135 2.78 2.07a.5.5 0 00-.695.718l2.652 2.444a.5.5 0 00.677.017l5.85-4a.498.498 0 00.111-.699l-.304.103z"/>
                                      </svg>
                                      <svg width="16" height="11" viewBox="0 0 16 11" className="fill-blue-400 -ml-1.5">
                                        <path d="M11.071.653a.498.498 0 00-.699-.111L5.023 4.135 2.78 2.07a.5.5 0 00-.695.718l2.652 2.444a.5.5 0 00.677.017l5.85-4a.498.498 0 00.111-.699l-.304.103z"/>
                                      </svg>
                                    </span>
                                  );
                                case 'DELIVERED':
                                  // 2 checks cinza (entregue)
                                  return (
                                    <span className="inline-flex gap-[1px]">
                                      <svg width="16" height="11" viewBox="0 0 16 11" className="fill-white/70">
                                        <path d="M11.071.653a.498.498 0 00-.699-.111L5.023 4.135 2.78 2.07a.5.5 0 00-.695.718l2.652 2.444a.5.5 0 00.677.017l5.85-4a.498.498 0 00.111-.699l-.304.103z"/>
                                      </svg>
                                      <svg width="16" height="11" viewBox="0 0 16 11" className="fill-white/70 -ml-1.5">
                                        <path d="M11.071.653a.498.498 0 00-.699-.111L5.023 4.135 2.78 2.07a.5.5 0 00-.695.718l2.652 2.444a.5.5 0 00.677.017l5.85-4a.498.498 0 00.111-.699l-.304.103z"/>
                                      </svg>
                                    </span>
                                  );
                                case 'SENT':
                                  // 1 check cinza (enviado)
                                  return (
                                    <svg width="16" height="11" viewBox="0 0 16 11" className="fill-white/70">
                                      <path d="M11.071.653a.498.498 0 00-.699-.111L5.023 4.135 2.78 2.07a.5.5 0 00-.695.718l2.652 2.444a.5.5 0 00.677.017l5.85-4a.498.498 0 00.111-.699l-.304.103z"/>
                                    </svg>
                                  );
                                case 'PENDING':
                                  // Relógio (pendente)
                                  return (
                                    <svg width="16" height="16" viewBox="0 0 16 16" className="fill-white/60">
                                      <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm0 14.5a6.5 6.5 0 110-13 6.5 6.5 0 010 13z"/>
                                      <path d="M8.75 4h-1.5v4.25L11 10.4l.75-1.23-3-1.92V4z"/>
                                    </svg>
                                  );
                                case 'ERROR':
                                case 'FAILED':
                                  // Erro (triângulo com exclamação)
                                  return (
                                    <svg width="16" height="16" viewBox="0 0 16 16" className="fill-red-400">
                                      <path d="M8 0L0 14h16L8 0zm1 13H7v-2h2v2zm0-3H7V5h2v5z"/>
                                    </svg>
                                  );
                                default:
                                  // Status desconhecido
                                  return (
                                    <span className="text-white/50 text-xs" title={`Status desconhecido: ${message.status}`}>
                                      ?
                                    </span>
                                  );
                              }
                            })()}
                          </span>
                        )}
                      </div>

                      {/* Reactions */}
                      {message.reactions && message.reactions.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {message.reactions.map((reaction, idx) => (
                            <span
                              key={idx}
                              className="text-lg bg-white rounded-full px-1 shadow-sm"
                            >
                              {reaction.emoji}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {!message.fromMe && (
                      <ReactionPicker
                        messageId={message.id}
                        onReact={handleReact}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <span className="text-lg">😊</span>
                        </Button>
                      </ReactionPicker>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Reply Preview */}
      {replyingTo && (
        <ReplyPreview
          message={replyingTo}
          onCancel={() => setReplyingTo(null)}
        />
      )}

      {/* Message Input - Fixed at bottom */}
      <div className="flex-shrink-0 border-t bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <InteractiveMessageMenu
            contactPhone={conversation.contact.phone}
            onSent={fetchMessages}
          />
          <MediaUploader
            conversationPhone={conversation.contact.phone}
            onMediaSent={fetchMessages}
          />
          <div className="flex-1">
            <MessageInput
              onSendMessage={handleSendMessage}
              conversationPhone={conversation.contact.phone}
              onMessageSent={fetchMessages}
            />
          </div>
          <AudioRecorder
            conversationPhone={conversation.contact.phone}
            onAudioSent={fetchMessages}
          />
        </div>
      </div>

      {/* Forward Dialog */}
      <ForwardDialog
        open={forwardingMessage !== null}
        onOpenChange={(open) => !open && setForwardingMessage(null)}
        messageId={forwardingMessage || ''}
      />
    </div>
  );
};

export default ChatArea;
