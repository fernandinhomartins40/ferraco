import { useState, useCallback } from 'react';
import { aiChatStorage, CompanyData, Product, AIConfig } from '@/utils/aiChatStorage';
import { generateUUID } from '@/utils/uuid';

interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
  status?: 'sent' | 'delivered' | 'read';
}

interface LeadData {
  nome?: string;
  telefone?: string;
  email?: string;
  interesse?: string[];
  orcamento?: string;
  cidade?: string;
  prazo?: string;
  source: string;
}

interface ChatContext {
  empresa: CompanyData | null;
  produtos: Product[];
  aiConfig: AIConfig | null;
  leadData: LeadData;
  conversationHistory: Message[];
}

/**
 * Hook para chat com IA conversacional e captação natural de leads
 */
export function useChatbotAI(linkSource: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [leadData, setLeadData] = useState<LeadData>({ source: linkSource });
  const [isTyping, setIsTyping] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [sessionId, setSessionId] = useState<string>(generateUUID());

  const companyData = aiChatStorage.getCompanyData();
  const products = aiChatStorage.getProducts().filter(p => p.isActive);
  const aiConfig = aiChatStorage.getAIConfig();

  /**
   * Extração natural de dados da mensagem usando NLP simples
   */
  const extractLeadData = useCallback((message: string): Partial<LeadData> => {
    const data: Partial<LeadData> = {};
    const lowerMsg = message.toLowerCase();

    // Nome: "Meu nome é João", "Sou o Carlos", "Me chamo Ana", "João aqui"
    const namePatterns = [
      /(?:meu nome é|me chamo|sou o|sou a|pode me chamar de)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)?)/i,
      /^([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)?)\s+aqui/i
    ];
    for (const pattern of namePatterns) {
      const match = message.match(pattern);
      if (match) {
        data.nome = match[1].trim();
        break;
      }
    }

    // Telefone: (11) 98765-4321, 11987654321, 11 98765-4321
    const phonePattern = /\(?\d{2}\)?\s*9?\d{4,5}-?\d{4}/;
    const phoneMatch = message.match(phonePattern);
    if (phoneMatch) {
      data.telefone = phoneMatch[0].replace(/\s+/g, ' ').trim();
    }

    // Email: joao@email.com
    const emailPattern = /[\w.-]+@[\w.-]+\.\w{2,}/;
    const emailMatch = message.match(emailPattern);
    if (emailMatch) {
      data.email = emailMatch[0];
    }

    // Orçamento: "R$ 100 mil", "até 50k", "200 mil reais"
    const budgetPattern = /(?:R?\$?\s*)?(\d+(?:\.\d+)?)\s*(?:mil|k|reais)/i;
    const budgetMatch = message.match(budgetPattern);
    if (budgetMatch) {
      data.orcamento = budgetMatch[0];
    }

    // Cidade: padrões comuns
    if (lowerMsg.includes('são paulo') || lowerMsg.includes('sp')) {
      data.cidade = 'São Paulo, SP';
    } else if (lowerMsg.includes('rio de janeiro') || lowerMsg.includes('rj')) {
      data.cidade = 'Rio de Janeiro, RJ';
    }

    // Prazo: "para março", "em 3 meses", "até dezembro"
    const prazoPatterns = [
      /(?:para|até|em)\s+(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/i,
      /em\s+(\d+)\s+(?:mês|meses|mes|meses)/i,
      /(?:urgente|rápido|o mais rápido)/i
    ];
    for (const pattern of prazoPatterns) {
      const match = message.match(pattern);
      if (match) {
        data.prazo = match[0];
        break;
      }
    }

    return data;
  }, []);

  /**
   * Adicionar contexto de dados já coletados à mensagem
   * (FuseChat já tem toda a Knowledge Base configurada via RAG)
   */
  const buildContextMessage = useCallback((userMessage: string): string => {
    // Se já temos dados do lead, incluir como contexto discreto
    const collectedData: string[] = [];

    if (leadData.nome) collectedData.push(`Nome: ${leadData.nome}`);
    if (leadData.telefone) collectedData.push(`Telefone: ${leadData.telefone}`);
    if (leadData.email) collectedData.push(`Email: ${leadData.email}`);
    if (leadData.interesse && leadData.interesse.length > 0) {
      collectedData.push(`Interesse: ${leadData.interesse.join(', ')}`);
    }
    if (leadData.orcamento) collectedData.push(`Orçamento mencionado: ${leadData.orcamento}`);
    if (leadData.cidade) collectedData.push(`Cidade: ${leadData.cidade}`);
    if (leadData.prazo) collectedData.push(`Prazo: ${leadData.prazo}`);

    // Se temos dados coletados, adicionar como contexto
    if (collectedData.length > 0) {
      return `[Dados já coletados: ${collectedData.join(', ')}]\n\n${userMessage}`;
    }

    return userMessage;
  }, [leadData]);

  /**
   * Calcular score de qualificação do lead
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
   * Enviar mensagem do usuário e obter resposta da IA
   */
  const sendMessage = useCallback(async (userMessage: string): Promise<void> => {
    if (!userMessage.trim() || isTyping || isCompleted) return;

    // 1. Adicionar mensagem do usuário
    addUserMessage(userMessage);

    // 2. Extrair dados mencionados
    const extractedData = extractLeadData(userMessage);
    if (Object.keys(extractedData).length > 0) {
      setLeadData(prev => {
        const updated = { ...prev, ...extractedData };

        // Adicionar interesse se mencionou produto
        products.forEach(p => {
          if (userMessage.toLowerCase().includes(p.name.toLowerCase())) {
            const interesses = updated.interesse || [];
            if (!interesses.includes(p.name)) {
              updated.interesse = [...interesses, p.name];
            }
          }
        });

        return updated;
      });
    }

    // 3. Mostrar indicador de digitação
    setIsTyping(true);

    try {
      // 4. Preparar mensagem com contexto de dados coletados
      const contextMessage = buildContextMessage(userMessage);

      // 5. Chamar API FuseChat (simplificado - RAG já configurado)
      const apiUrl = import.meta.env.VITE_API_URL ||
                     (import.meta.env.PROD ? '/api' : 'http://localhost:3002/api');

      const response = await fetch(`${apiUrl}/chatbot/fusechat-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: contextMessage,
          apiKey: aiConfig?.fuseChatApiKey,
          session_id: sessionId
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao conectar com IA');
      }

      const data = await response.json();

      // 6. Adicionar resposta da IA com delay natural
      setTimeout(() => {
        setIsTyping(false);
        addBotMessage(data.response || 'Desculpe, não entendi. Pode reformular?');

        // 7. Verificar se lead está qualificado
        setTimeout(() => {
          if (isLeadQualified()) {
            console.log('✅ Lead qualificado! Score:', calculateLeadScore());
            // Será salvo pelo componente PublicChat
          }
        }, 500);
      }, 1000 + Math.random() * 1000);

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setIsTyping(false);

      // Fallback para erro
      addBotMessage('Desculpe, estou com dificuldade de conexão. Pode tentar novamente?');
    }
  }, [
    isTyping,
    isCompleted,
    addUserMessage,
    extractLeadData,
    products,
    buildContextMessage,
    aiConfig,
    sessionId,
    addBotMessage,
    isLeadQualified,
    calculateLeadScore
  ]);

  /**
   * Iniciar conversa com mensagem de boas-vindas
   */
  const startConversation = useCallback(() => {
    const greeting = aiConfig?.greetingMessage ||
                    `Olá! 👋 Bem-vindo(a) à ${companyData?.name || 'nossa empresa'}!`;

    setTimeout(() => {
      addBotMessage(greeting);

      setTimeout(() => {
        addBotMessage('Como posso te ajudar hoje?');
      }, 1200);
    }, 800);
  }, [aiConfig, companyData, addBotMessage]);

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
