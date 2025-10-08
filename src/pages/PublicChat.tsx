import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { aiChatStorage } from '@/utils/aiChatStorage';
import { Send, Check, CheckCheck, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useChatbotAI } from '@/hooks/useChatbotAI';
import { generateUUID } from '@/utils/uuid';

/**
 * Landing Page de Captação estilo WhatsApp com IA Conversacional
 * Página pública acessível via /chat/:shortCode
 */
export default function PublicChat() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const navigate = useNavigate();

  const [isValidating, setIsValidating] = useState(true);
  const [linkData, setLinkData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [hasStarted, setHasStarted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const companyData = aiChatStorage.getCompanyData();

  // Hook de IA conversacional
  const {
    messages,
    leadData,
    isTyping,
    isCompleted,
    leadScore,
    isQualified,
    sendMessage,
    startConversation,
    setIsCompleted
  } = useChatbotAI(linkData?.name || 'Link Direto');

  // Auto-scroll para última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Validar link e iniciar conversa
  useEffect(() => {
    const validateAndStart = async () => {
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
        setIsValidating(false);

        // Iniciar conversa com IA
        if (!hasStarted) {
          setHasStarted(true);
          startConversation();
        }

      } catch (err) {
        console.error('Erro ao validar link:', err);
        setError('Erro ao carregar chat');
        setIsValidating(false);
      }
    };

    validateAndStart();
  }, [shortCode, hasStarted, startConversation]);

  // Salvar lead quando qualificado
  useEffect(() => {
    if (isQualified && leadData.telefone && !isCompleted) {
      saveLead();
    }
  }, [isQualified, leadData, isCompleted]);

  /**
   * Salvar lead no sistema
   */
  const saveLead = () => {
    try {
      const lead = {
        id: generateUUID(),
        name: leadData.nome || 'Lead sem nome',
        phone: leadData.telefone || '',
        email: leadData.email || '',
        source: leadData.source,
        status: 'new' as const,
        notes: `[CHAT IA - Score: ${leadScore}]\n` +
               `Interesses: ${leadData.interesse?.join(', ') || 'Não especificado'}\n` +
               `${leadData.orcamento ? `Orçamento: ${leadData.orcamento}\n` : ''}` +
               `${leadData.cidade ? `Cidade: ${leadData.cidade}\n` : ''}` +
               `${leadData.prazo ? `Prazo: ${leadData.prazo}\n` : ''}` +
               `\nConversa:\n${messages.map(m => `${m.sender === 'user' ? 'Cliente' : 'Ana'}: ${m.text}`).join('\n')}`,
        createdAt: new Date().toISOString(),
        lastContact: new Date().toISOString(),
        priority: leadScore >= 70 ? 'high' as const : 'medium' as const,
        tags: ['chat-ai', leadData.source.toLowerCase().replace(/\s+/g, '-')],
        customFields: {
          chatShortCode: shortCode,
          leadScore: leadScore,
          interesse: leadData.interesse,
          orcamento: leadData.orcamento,
          cidade: leadData.cidade,
          prazo: leadData.prazo
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

      console.log('✅ Lead capturado via IA:', lead);
      console.log('📊 Score de qualificação:', leadScore);

    } catch (error) {
      console.error('Erro ao salvar lead:', error);
    }
  };

  const handleSend = () => {
    if (!inputValue.trim() || isTyping || isCompleted) return;

    sendMessage(inputValue.trim());
    setInputValue('');
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
          <p className="text-xs text-green-200 flex items-center gap-1">
            {isTyping ? (
              <>
                <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
                digitando...
              </>
            ) : (
              <>
                <span className="w-2 h-2 bg-green-300 rounded-full"></span>
                online
              </>
            )}
          </p>
        </div>
        {/* Debug info (apenas dev) */}
        {!import.meta.env.PROD && (
          <div className="text-xs text-green-200">
            Score: {leadScore}
          </div>
        )}
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
            placeholder={isCompleted ? 'Conversa finalizada - Obrigado!' : 'Digite sua mensagem...'}
            className="flex-1 px-4 py-3 rounded-full border-none focus:outline-none focus:ring-2 focus:ring-[#25D366] disabled:bg-gray-200 disabled:cursor-not-allowed"
            autoFocus
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping || isCompleted}
            className="w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center hover:bg-[#1ea952] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-md"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Powered by + indicador de qualificação */}
        <div className="text-center mt-2 flex items-center justify-center gap-3">
          <p className="text-xs text-gray-500">
            🤖 Atendimento com IA • 🔒 Seus dados estão seguros
          </p>
          {!import.meta.env.PROD && isQualified && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              ✓ Lead Qualificado
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
