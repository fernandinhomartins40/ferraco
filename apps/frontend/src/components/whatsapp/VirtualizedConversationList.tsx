/**
 * VirtualizedConversationList - Lista virtualizada de conversas (FASE 4)
 *
 * Implementação de virtualização nativa usando Intersection Observer API
 * Renderiza apenas itens visíveis + buffer, melhorando performance com listas longas
 */

import { useState, useEffect, useMemo, memo, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2 } from 'lucide-react';
import api from '@/lib/apiClient';
import { formatDistanceToNow } from 'date-fns';
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
  contactId: string;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  unreadCount: number;
  isPinned: boolean;
  contact: Contact;
}

interface VirtualizedConversationListProps {
  selectedId: string | null;
  onSelectConversation: (id: string) => void;
}

const ITEM_HEIGHT = 72; // Altura fixa de cada item (em pixels)
const BUFFER_SIZE = 5; // Quantos itens extras renderizar acima/abaixo

const VirtualizedConversationList = ({ selectedId, onSelectConversation }: VirtualizedConversationListProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  // ✅ STATELESS: Busca conversas direto do WhatsApp (via API v2)
  const fetchConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/whatsapp/conversations/v2');
      setConversations(response.data.conversations);
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Atualizar altura do container
  useEffect(() => {
    if (containerRef.current) {
      setContainerHeight(containerRef.current.clientHeight);
    }

    const handleResize = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // WebSocket for real-time updates
  useWhatsAppWebSocket({
    onConversationUpdate: useCallback((conversationId: string) => {
      console.log('📡 Conversa atualizada:', conversationId);
      fetchConversations();
    }, [fetchConversations]),
  });

  // ✅ FASE 4: useCallback para handleSearch
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);

    if (query.trim().length < 2) {
      fetchConversations();
      return;
    }

    try {
      const response = await api.get('/whatsapp/search', {
        params: { q: query },
      });
      setConversations(response.data.conversations);
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
    }
  }, [fetchConversations]);

  // ✅ FASE 4: useMemo para funções utilitárias
  const getDisplayName = useMemo(() => (contact: Contact) => {
    return contact.name || contact.phone;
  }, []);

  const formatTime = useMemo(() => (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ptBR,
      });
    } catch {
      return '';
    }
  }, []);

  // ✅ FASE 4: useMemo para filtrar/ordenar conversas
  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });
  }, [conversations]);

  // ✅ FASE 4: Virtualização - calcular itens visíveis
  const { visibleStart, visibleEnd, totalHeight } = useMemo(() => {
    const total = sortedConversations.length;
    const itemsVisible = Math.ceil(containerHeight / ITEM_HEIGHT);

    const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE);
    const end = Math.min(total, start + itemsVisible + BUFFER_SIZE * 2);

    return {
      visibleStart: start,
      visibleEnd: end,
      totalHeight: total * ITEM_HEIGHT,
    };
  }, [sortedConversations.length, containerHeight, scrollTop]);

  // Apenas conversas visíveis
  const visibleConversations = useMemo(() => {
    return sortedConversations.slice(visibleStart, visibleEnd);
  }, [sortedConversations, visibleStart, visibleEnd]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-4 border-b bg-gray-50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar conversas..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Virtualized Conversations List */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto"
        onScroll={handleScroll}
      >
        {sortedConversations.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p>Nenhuma conversa encontrada</p>
          </div>
        ) : (
          <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
            <div
              style={{
                transform: `translateY(${visibleStart * ITEM_HEIGHT}px)`,
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
              }}
            >
              {visibleConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  style={{ height: `${ITEM_HEIGHT}px` }}
                  className={`
                    p-4 cursor-pointer hover:bg-gray-50 transition-colors border-b
                    ${selectedId === conversation.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}
                  `}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {conversation.contact.profilePicUrl ? (
                        <img
                          src={conversation.contact.profilePicUrl}
                          alt={getDisplayName(conversation.contact)}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-600 font-medium text-lg">
                            {getDisplayName(conversation.contact).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-sm truncate">
                          {getDisplayName(conversation.contact)}
                        </h3>
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {formatTime(conversation.lastMessageAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.lastMessagePreview || 'Sem mensagens'}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <Badge variant="default" className="ml-2 bg-green-600 text-white">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ✅ FASE 4: React.memo para evitar re-renders desnecessários
export default memo(VirtualizedConversationList);
