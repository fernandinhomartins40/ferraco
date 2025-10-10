// Stub para useChatbotAI (chatbot foi removido)
export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: string;
}

export interface UseChatbotAIReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  isTyping: boolean;
  isQualified: boolean;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
  startConversation: () => void;
}

export const useChatbotAI = (leadId?: string): UseChatbotAIReturn => {
  console.log('[useChatbotAI Stub] Initialized with leadId:', leadId);

  return {
    messages: [],
    isLoading: false,
    isTyping: false,
    isQualified: false,
    sendMessage: async (message: string) => {
      console.log('[useChatbotAI Stub] Send message:', message);
    },
    clearMessages: () => {
      console.log('[useChatbotAI Stub] Clear messages');
    },
    startConversation: () => {
      console.log('[useChatbotAI Stub] Start conversation');
    },
  };
};
