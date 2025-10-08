import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { aiChatStorage } from '@/utils/aiChatStorage';
import { Send, Check, CheckCheck, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { generateUUID } from '@/utils/uuid';

interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
  status?: 'sent' | 'delivered' | 'read';
}

interface LeadData {
  name?: string;
  phone?: string;
  email?: string;
  interest?: string;
  source: string;
}

/**
 * Landing Page de Captação estilo WhatsApp
 * Página pública acessível via /chat/:shortCode
 */
export default function PublicChat() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const navigate = useNavigate();

  const [isValidating, setIsValidating] = useState(true);
  const [linkData, setLinkData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [leadData, setLeadData] = useState<LeadData>({ source: '' });
  const [isCompleted, setIsCompleted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const companyData = aiChatStorage.getCompanyData();
  const aiConfig = aiChatStorage.getAIConfig();
  const products = aiChatStorage.getProducts().filter(p => p.isActive);

  // Auto-scroll para última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Validar link na montagem
  useEffect(() => {
    const validateLink = async () => {
      if (!shortCode) {
        setError('Link inválido');
        setIsValidating(false);
        return;
      }

      try {
        const links = aiChatStorage.getChatLinks();
        const link = links.find(l => l.shortCode === shortCode && l.isActive);

        if (!link) {
          setError('Link não encontrado ou inativo');
          setIsValidating(false);
          return;
        }

        // Registrar clique
        aiChatStorage.updateChatLink(link.id, {
          clicks: link.clicks + 1
        });

        setLinkData(link);
        setLeadData({ ...leadData, source: link.name });
        setIsValidating(false);

        // Iniciar conversa automaticamente
        setTimeout(() => {
          addBotMessage(aiConfig?.greetingMessage || `Olá! 👋 Bem-vindo(a) à ${companyData?.name || 'nossa empresa'}!`);

          setTimeout(() => {
            addBotMessage('Meu nome é Ana, assistente virtual. Vou te ajudar a encontrar o que você precisa! 😊');

            setTimeout(() => {
              addBotMessage('Para começar, qual é o seu nome?');
            }, 1500);
          }, 1200);
        }, 800);

      } catch (err) {
        console.error('Erro ao validar link:', err);
        setError('Erro ao carregar chat');
        setIsValidating(false);
      }
    };

    validateLink();
  }, [shortCode]);

  // Adicionar mensagem do bot com animação de digitação
  const addBotMessage = (text: string) => {
    setIsTyping(true);

    setTimeout(() => {
      const newMessage: Message = {
        id: generateUUID(),
        text,
        sender: 'bot',
        timestamp: new Date(),
        status: 'read'
      };

      setMessages(prev => [...prev, newMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000); // Delay aleatório para parecer humano
  };

  // Adicionar mensagem do usuário
  const addUserMessage = (text: string) => {
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
  };

  // Processar resposta do usuário
  const handleUserResponse = async (text: string) => {
    addUserMessage(text);
    setInputValue('');

    // Aguardar um pouco antes de responder
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (currentStep === 0) {
      // Capturou o nome
      setLeadData(prev => ({ ...prev, name: text }));
      addBotMessage(`Prazer em conhecer você, ${text}! 🤝`);

      setTimeout(() => {
        addBotMessage('Qual é o melhor WhatsApp para eu te enviar informações?');
        addBotMessage('Por favor, digite com DDD: (99) 99999-9999');
        setCurrentStep(1);
      }, 1800);

    } else if (currentStep === 1) {
      // Capturou o telefone
      setLeadData(prev => ({ ...prev, phone: text }));
      addBotMessage('Perfeito! Anotado aqui. 📱');

      setTimeout(() => {
        addBotMessage('Você também pode deixar seu e-mail para receber materiais exclusivos (opcional):');
        setCurrentStep(2);
      }, 1500);

    } else if (currentStep === 2) {
      // Capturou email ou pulou
      if (text.toLowerCase() !== 'pular' && text.trim()) {
        setLeadData(prev => ({ ...prev, email: text }));
      }

      addBotMessage('Ótimo! Agora me conta:');

      setTimeout(() => {
        if (products.length > 0) {
          const productsList = products.slice(0, 5).map((p, i) =>
            `${i + 1}. ${p.name}${p.price ? ` - ${p.price}` : ''}`
          ).join('\n');

          addBotMessage(`Qual desses produtos/serviços você tem interesse?\n\n${productsList}\n\nDigite o número ou nome:`);
        } else {
          addBotMessage('O que você está procurando? Em que posso ajudar?');
        }
        setCurrentStep(3);
      }, 1500);

    } else if (currentStep === 3) {
      // Capturou interesse
      setLeadData(prev => ({ ...prev, interest: text }));

      addBotMessage('Excelente escolha! 🎉');

      setTimeout(() => {
        addBotMessage(`${leadData.name}, já passei suas informações para nossa equipe!`);

        setTimeout(() => {
          addBotMessage('Em breve você receberá um contato personalizado com todas as informações. 📞');

          setTimeout(() => {
            if (companyData?.workingHours) {
              addBotMessage(`Nosso horário de atendimento: ${companyData.workingHours}`);
            }

            setTimeout(() => {
              addBotMessage('Obrigada pelo seu interesse! Até logo! 😊');
              setIsCompleted(true);

              // Salvar lead capturado
              saveLead();

            }, 1500);
          }, 1500);
        }, 1500);
      }, 1000);
    }
  };

  // Salvar lead no sistema
  const saveLead = () => {
    try {
      const lead = {
        id: generateUUID(),
        name: leadData.name || 'Sem nome',
        phone: leadData.phone || '',
        email: leadData.email || '',
        source: leadData.source,
        status: 'new' as const,
        notes: `Interesse: ${leadData.interest || 'Não especificado'}\nCapturado via Chat IA`,
        createdAt: new Date().toISOString(),
        lastContact: new Date().toISOString(),
        priority: 'high' as const,
        tags: ['chat-ai', leadData.source.toLowerCase()],
        customFields: {
          chatShortCode: shortCode,
          interest: leadData.interest
        }
      };

      // Salvar no localStorage
      const existingLeads = JSON.parse(localStorage.getItem('ferraco_leads') || '[]');
      existingLeads.push(lead);
      localStorage.setItem('ferraco_leads', JSON.stringify(existingLeads));

      // Atualizar contador de leads no link
      if (linkData) {
        aiChatStorage.updateChatLink(linkData.id, {
          leads: linkData.leads + 1
        });
      }

      console.log('✅ Lead capturado:', lead);
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
    }
  };

  const handleSend = () => {
    if (!inputValue.trim() || isTyping || isCompleted) return;
    handleUserResponse(inputValue.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ECE5DD]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#25D366] flex items-center justify-center">
            <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-gray-600">Conectando...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !linkData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ECE5DD] p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Link inválido ou expirado'}
            </AlertDescription>
          </Alert>
          <button
            onClick={() => navigate('/')}
            className="mt-4 w-full text-sm text-blue-600 hover:underline"
          >
            Voltar para página inicial
          </button>
        </div>
      </div>
    );
  }

  // Chat UI estilo WhatsApp
  return (
    <div className="min-h-screen bg-[#ECE5DD] flex flex-col">
      {/* Header estilo WhatsApp */}
      <div className="bg-[#075E54] text-white p-3 shadow-md flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#075E54] font-bold text-lg">
          {companyData?.name?.charAt(0) || 'A'}
        </div>
        <div className="flex-1">
          <h1 className="font-semibold">{companyData?.name || 'Atendimento'}</h1>
          <p className="text-xs text-green-200">
            {isTyping ? 'digitando...' : 'online'}
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-20">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] sm:max-w-[60%] rounded-lg px-4 py-2 shadow ${
                msg.sender === 'user'
                  ? 'bg-[#DCF8C6] text-gray-800'
                  : 'bg-white text-gray-800'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className="text-[10px] text-gray-500">
                  {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.sender === 'user' && (
                  <span className="text-blue-500">
                    {msg.status === 'sent' && <Check className="w-3 h-3" />}
                    {msg.status === 'delivered' && <CheckCheck className="w-3 h-3" />}
                    {msg.status === 'read' && <CheckCheck className="w-3 h-3 text-blue-400" />}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white rounded-lg px-4 py-3 shadow">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#F0F0F0] p-3 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isTyping || isCompleted}
            placeholder={isCompleted ? 'Conversa finalizada' : currentStep === 2 ? 'Digite seu email ou "pular"' : 'Digite sua mensagem...'}
            className="flex-1 px-4 py-3 rounded-full border-none focus:outline-none focus:ring-2 focus:ring-[#25D366] disabled:bg-gray-200"
            autoFocus
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping || isCompleted}
            className="w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center hover:bg-[#1ea952] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Powered by */}
        <div className="text-center mt-2">
          <p className="text-xs text-gray-500">
            Powered by {companyData?.name || 'IA'} • 🔒 Seus dados estão seguros
          </p>
        </div>
      </div>
    </div>
  );
}
