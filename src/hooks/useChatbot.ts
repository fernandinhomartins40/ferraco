import { useState, useCallback } from 'react';
import axios from 'axios';
import { aiChatStorage } from '@/utils/aiChatStorage';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ExtractedData {
  name?: string;
  phone?: string;
  email?: string;
  products?: string[];
  intent?: 'info' | 'price' | 'purchase' | 'support';
  urgency?: 'low' | 'medium' | 'high';
}

interface SendMessageResponse {
  message: string;
  extractedData: ExtractedData;
  qualified: boolean;
}

interface FuseChatResponse {
  response: string;
  session_id: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const FUSECHAT_API_URL = 'https://digiurbis.com.br/api/chat';

export function useChatbot(leadId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isQualified, setIsQualified] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  /**
   * Carrega histórico de mensagens do backend
   */
  const loadHistory = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/chatbot/history/${leadId}`);
      const historyMessages = response.data.messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.createdAt)
      }));

      setMessages(historyMessages);

      // Se não houver histórico, adicionar mensagem de boas-vindas
      if (historyMessages.length === 0) {
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: 'Olá! 👋 Bem-vindo à Ferraco! Sou seu assistente virtual. Como posso ajudar você hoje?',
          timestamp: new Date()
        }]);
      }
    } catch (err: any) {
      console.error('Erro ao carregar histórico:', err);
      setError('Erro ao carregar histórico do chat');

      // Mensagem de boas-vindas mesmo com erro
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: 'Olá! 👋 Bem-vindo à Ferraco! Sou seu assistente virtual. Como posso ajudar você hoje?',
        timestamp: new Date()
      }]);
    }
  }, [leadId]);

  /**
   * Envia mensagem para o FuseChat API
   */
  const sendMessageToFuseChat = useCallback(async (content: string): Promise<FuseChatResponse> => {
    const aiConfig = aiChatStorage.getAIConfig();
    const apiKey = aiConfig.fuseChatApiKey;

    if (!apiKey) {
      throw new Error('API Key do FuseChat não configurada');
    }

    // Usar proxy do backend para evitar CORS
    const response = await axios.post<FuseChatResponse>(
      `${API_URL}/chatbot/fusechat-proxy`,
      {
        message: content.trim(),
        apiKey: apiKey,
        session_id: sessionId, // Pode ser undefined
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );

    return response.data;
  }, [sessionId]);

  /**
   * Envia mensagem para o chatbot
   */
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Adiciona mensagem do usuário imediatamente
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Verifica se FuseChat está configurado
      const aiConfig = aiChatStorage.getAIConfig();

      if (aiConfig.fuseChatApiKey) {
        // Usa FuseChat API externa
        const fuseChatResponse = await sendMessageToFuseChat(content.trim());

        // Atualiza session_id para manter contexto
        if (fuseChatResponse.session_id) {
          setSessionId(fuseChatResponse.session_id);
        }

        // Adiciona resposta do assistente
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: fuseChatResponse.response,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);

        // TODO: Implementar análise de qualificação baseada no conteúdo
        // Por enquanto, simples detecção de palavras-chave
        const responseText = fuseChatResponse.response.toLowerCase();
        const qualificationKeywords = ['orçamento', 'preço', 'comprar', 'contratar', 'urgente'];
        if (qualificationKeywords.some(keyword => responseText.includes(keyword))) {
          setIsQualified(true);
        }

        return {
          message: fuseChatResponse.response,
          extractedData: {},
          qualified: isQualified,
        };

      } else {
        // Fallback para backend local (Ollama)
        const response = await axios.post<SendMessageResponse>(`${API_URL}/chatbot/message`, {
          message: content.trim(),
          leadId
        });

        // Adiciona resposta do assistente
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.data.message,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Atualiza status de qualificação
        if (response.data.qualified) {
          setIsQualified(true);
        }

        return response.data;
      }

    } catch (err: any) {
      console.error('Erro ao enviar mensagem:', err);

      let errorMsg = 'Desculpe, tive um problema técnico. Pode tentar novamente?';

      if (err.message?.includes('API Key')) {
        errorMsg = 'Erro: API Key não configurada. Configure na aba IA Config.';
      } else if (err.code === 'ECONNABORTED') {
        errorMsg = 'Tempo limite excedido. A IA está demorando para responder.';
      } else if (err.response?.status === 401) {
        errorMsg = 'Erro: API Key inválida ou revogada. Verifique nas configurações.';
      } else if (err.response?.status === 429) {
        errorMsg = 'Limite de requisições excedido. Aguarde 1 minuto.';
      }

      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: errorMsg,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      setError(errorMsg);

      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [leadId, sessionId, sendMessageToFuseChat, isQualified]);

  /**
   * Verifica saúde da API (FuseChat ou Ollama)
   */
  const checkHealth = useCallback(async () => {
    const aiConfig = aiChatStorage.getAIConfig();

    // Se FuseChat estiver configurado, considera sempre saudável
    // (verificação ocorre no envio da mensagem)
    if (aiConfig.fuseChatApiKey) {
      return true;
    }

    // Caso contrário, verifica Ollama local
    try {
      const response = await axios.get(`${API_URL}/chatbot/health`);
      return response.data.status === 'ok';
    } catch (err) {
      console.error('Ollama não está acessível:', err);
      return false;
    }
  }, []);

  /**
   * Limpa mensagens locais (não apaga do banco)
   */
  const clearMessages = useCallback(() => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: 'Olá! 👋 Bem-vindo à Ferraco! Sou seu assistente virtual. Como posso ajudar você hoje?',
      timestamp: new Date()
    }]);
    setIsQualified(false);
    setSessionId(null); // Limpa session_id para nova conversa
  }, []);

  return {
    messages,
    isLoading,
    error,
    isQualified,
    sendMessage,
    loadHistory,
    checkHealth,
    clearMessages
  };
}
