/**
 * Hook para Chatbot Inteligente Baseado em Regras
 * Substitui a dependência de IA externa por sistema local
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { aiChatStorage } from '@/utils/aiChatStorage';
import { generateUUID } from '@/utils/uuid';
import {
  createConversationManager,
  ConversationManager,
  LeadData,
  KnowledgeBaseContext
} from '@/utils/chatbot';

interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
  status?: 'sent' | 'delivered' | 'read';
}

/**
 * Hook para chat com chatbot inteligente e captação natural de leads
 */
export function useChatbotAI(linkSource: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [leadData, setLeadData] = useState<LeadData>({ source: linkSource });
  const [isTyping, setIsTyping] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Referência para o conversation manager
  const conversationManagerRef = useRef<ConversationManager | null>(null);

  // Carregar dados da knowledge base
  const companyData = aiChatStorage.getCompanyData();
  const products = aiChatStorage.getProducts();
  const faqs = aiChatStorage.getFAQItems();
  const aiConfig = aiChatStorage.getAIConfig();

  // Inicializar conversation manager
  useEffect(() => {
    const knowledgeBase: KnowledgeBaseContext = {
      companyData,
      products,
      faqs,
      aiConfig
    };

    conversationManagerRef.current = createConversationManager(knowledgeBase);
  }, []);

  // Atualizar knowledge base quando mudar
  useEffect(() => {
    if (conversationManagerRef.current) {
      const knowledgeBase: KnowledgeBaseContext = {
        companyData,
        products,
        faqs,
        aiConfig
      };

      conversationManagerRef.current.updateKnowledgeBase(knowledgeBase);
    }
  }, [companyData, products, faqs, aiConfig]);

  /**
   * Calcula score de qualificação do lead
   */
  const calculateLeadScore = useCallback((): number => {
    let score = 0;

    // Dados coletados
    if (leadData.nome) score += 20;
    if (leadData.telefone) score += 40; // Telefone é crítico!
    if (leadData.email) score += 10;
    if (leadData.interesse && leadData.interesse.length > 0) score += 15;

    // Intenção de compra (analisa todas as mensagens)
    const allText = messages.map(m => m.text.toLowerCase()).join(' ');

    if (allText.includes('preço') || allText.includes('quanto custa') || allText.includes('valor')) score += 10;
    if (allText.includes('prazo') || allText.includes('quando') || allText.includes('entrega')) score += 8;
    if (allText.includes('orçamento') || allText.includes('proposta')) score += 12;
    if (allText.includes('urgente') || allText.includes('preciso')) score += 5;

    // Número de mensagens = engajamento
    if (messages.length >= 10) score += 5;

    return score;
  }, [leadData, messages]);

  /**
   * Verificar se lead está qualificado para salvar
   */
  const isLeadQualified = useCallback((): boolean => {
    const score = calculateLeadScore();

    // Precisa ter pelo menos nome OU telefone + score >= 50
    const hasMinimumData = leadData.nome || leadData.telefone;
    const hasGoodScore = score >= 50;

    return hasMinimumData && hasGoodScore;
  }, [leadData, calculateLeadScore]);

  /**
   * Adicionar mensagem do usuário
   */
  const addUserMessage = useCallback((text: string) => {
    const newMessage: Message = {
      id: generateUUID(),
      text,
      sender: 'user',
      timestamp: new Date(),
      status: 'sent'
    };

    setMessages(prev => [...prev, newMessage]);

    // Simular "entregue" e "lido"
    setTimeout(() => {
      setMessages(prev => prev.map(msg =>
        msg.id === newMessage.id ? { ...msg, status: 'delivered' } : msg
      ));

      setTimeout(() => {
        setMessages(prev => prev.map(msg =>
          msg.id === newMessage.id ? { ...msg, status: 'read' } : msg
        ));
      }, 300);
    }, 500);
  }, []);

  /**
   * Adicionar mensagem do bot
   */
  const addBotMessage = useCallback((text: string) => {
    const newMessage: Message = {
      id: generateUUID(),
      text,
      sender: 'bot',
      timestamp: new Date(),
      status: 'read'
    };

    setMessages(prev => [...prev, newMessage]);
  }, []);

  /**
   * Enviar mensagem do usuário e obter resposta do bot
   */
  const sendMessage = useCallback(async (userMessage: string): Promise<void> => {
    if (!userMessage.trim() || isTyping || isCompleted) return;

    if (!conversationManagerRef.current) {
      console.error('ConversationManager not initialized');
      return;
    }

    // 1. Adicionar mensagem do usuário
    addUserMessage(userMessage);

    // 2. Mostrar indicador de digitação
    setIsTyping(true);

    try {
      // 3. Processar mensagem com o conversation manager
      const result = await conversationManagerRef.current.processMessage(
        userMessage,
        leadData
      );

      // 4. Atualizar dados do lead
      if (result.capturedData && Object.keys(result.capturedData).length > 0) {
        setLeadData(result.updatedLeadData);
      }

      // 5. Adicionar resposta do bot com delay natural
      const delay = 800 + Math.random() * 800; // 800ms - 1600ms

      setTimeout(() => {
        setIsTyping(false);
        addBotMessage(result.response);

        // 6. Verificar se deve fazer follow-up
        setTimeout(() => {
          if (conversationManagerRef.current) {
            const followUp = conversationManagerRef.current.shouldFollowUp(
              result.updatedLeadData
            );

            if (followUp.should && followUp.message) {
              setTimeout(() => {
                addBotMessage(followUp.message!);
              }, 1500);
            }
          }

          // 7. Verificar se lead está qualificado
          if (isLeadQualified()) {
            console.log('✅ Lead qualificado! Score:', calculateLeadScore());
            // Será salvo pelo componente PublicChat
          }
        }, 500);
      }, delay);

    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      setIsTyping(false);

      // Fallback para erro
      addBotMessage('Desculpe, tive um problema técnico. Pode tentar novamente?');
    }
  }, [
    isTyping,
    isCompleted,
    leadData,
    addUserMessage,
    addBotMessage,
    isLeadQualified,
    calculateLeadScore
  ]);

  /**
   * Iniciar conversa com mensagem de boas-vindas
   */
  const startConversation = useCallback(() => {
    if (!conversationManagerRef.current) return;

    const greeting = conversationManagerRef.current.generateGreeting();

    setTimeout(() => {
      addBotMessage(greeting);

      // Segunda mensagem após o greeting
      setTimeout(() => {
        addBotMessage('Como posso te ajudar hoje?');
      }, 1200);
    }, 800);
  }, [addBotMessage]);

  return {
    messages,
    leadData,
    isTyping,
    isCompleted,
    leadScore: calculateLeadScore(),
    isQualified: isLeadQualified(),
    sendMessage,
    startConversation,
    setIsCompleted
  };
}
