/**
 * Testes do Chatbot Inteligente Baseado em Regras
 * Testes dos cenários descritos no PLANO_CHATBOT_INTELIGENTE_SEM_IA_EXTERNA.md
 */

import { intentClassifier } from '../intentClassifier';
import { knowledgeBaseMatcher } from '../knowledgeBaseMatcher';
import { leadCaptureSystem } from '../leadCaptureSystem';
import { responseGenerator } from '../responseGenerator';
import { createConversationManager } from '../conversationManager';
import type { Product, FAQItem, CompanyData, AIConfig, KnowledgeBaseContext } from '../types';

// Mock data
const mockCompanyData: CompanyData = {
  id: '1',
  name: 'FerrAço',
  industry: 'Metalurgia',
  description: 'Fabricação de estruturas metálicas',
  address: 'Rua Teste, 123',
  phone: '11 3456-7890',
  email: 'contato@ferraco.com.br',
  website: 'https://ferraco.com.br',
  businessHours: 'Seg-Sex: 9h-18h'
};

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Portão Automático',
    description: 'Portão automático de alta qualidade',
    category: 'Portões',
    price: 'R$ 1.200 - R$ 2.500',
    keywords: ['portão', 'portao', 'automático', 'automatico'],
    isActive: true
  },
  {
    id: '2',
    name: 'Portão de Correr',
    description: 'Portão de correr tradicional',
    category: 'Portões',
    price: 'R$ 800 - R$ 1.500',
    keywords: ['portão', 'portao', 'correr', 'deslizante'],
    isActive: true
  },
  {
    id: '3',
    name: 'Grade de Proteção',
    description: 'Grade de proteção para janelas',
    category: 'Grades',
    price: 'R$ 300 - R$ 800',
    keywords: ['grade', 'proteção', 'protecao', 'janela'],
    isActive: true
  }
];

const mockFAQs: FAQItem[] = [
  {
    id: '1',
    question: 'Qual o horário de atendimento?',
    answer: 'Nosso atendimento funciona de segunda a sexta, das 9h às 18h.',
    category: 'Atendimento',
    keywords: ['horário', 'horario', 'atendimento', 'funcionamento'],
    order: 1
  },
  {
    id: '2',
    question: 'Fazem entrega?',
    answer: 'Sim, fazemos entregas para toda a região metropolitana.',
    category: 'Entrega',
    keywords: ['entrega', 'frete', 'envio'],
    order: 2
  }
];

const mockAIConfig: AIConfig = {
  id: '1',
  isActive: true,
  greetingMessage: 'Olá! 👋 Bem-vindo(a) à ${companyName}!',
  toneOfVoice: 'friendly'
};

const mockKnowledgeBase: KnowledgeBaseContext = {
  companyData: mockCompanyData,
  products: mockProducts,
  faqs: mockFAQs,
  aiConfig: mockAIConfig
};

describe('Chatbot Inteligente - Testes Completos', () => {

  describe('CENÁRIO 1: Cliente pergunta sobre produto', () => {

    test('Deve identificar intent de produto', () => {
      const state = {
        currentIntent: undefined,
        lastIntent: undefined,
        mentionedProducts: [],
        askedQuestions: [],
        messageCount: 1,
        engagementLevel: 'low' as const,
        toneOfVoice: 'friendly' as const
      };

      const intent = intentClassifier.classify('Vocês fabricam portões?', state);
      expect(intent.id).toBe('product_inquiry');
    });

    test('Deve encontrar produtos relevantes', () => {
      const products = knowledgeBaseMatcher.findRelevantProducts(
        'portões',
        mockProducts,
        5
      );

      expect(products.length).toBeGreaterThan(0);
      expect(products[0].name).toContain('Portão');
    });

    test('Deve responder sobre produto', () => {
      const conversationManager = createConversationManager(mockKnowledgeBase);
      const result = conversationManager.processMessage(
        'Vocês fabricam portões?',
        { source: 'test' }
      );

      expect(result).toBeDefined();
      expect(result.response).toBeTruthy();
      expect(result.response.toLowerCase()).toContain('portão');
    });
  });

  describe('CENÁRIO 2: Cliente pergunta sobre preço', () => {

    test('Deve identificar intent de preço', () => {
      const state = {
        currentIntent: undefined,
        lastIntent: undefined,
        mentionedProducts: ['Portão Automático'],
        askedQuestions: [],
        messageCount: 2,
        engagementLevel: 'low' as const,
        toneOfVoice: 'friendly' as const
      };

      const intent = intentClassifier.classify('Quanto custa o automático?', state);
      expect(intent.id).toBe('price_question');
    });

    test('Deve solicitar telefone após pergunta de preço', () => {
      const conversationManager = createConversationManager(mockKnowledgeBase);

      // Primeira mensagem
      conversationManager.processMessage('Vocês fabricam portões?', { source: 'test' });

      // Segunda mensagem sobre preço
      const result = conversationManager.processMessage(
        'Quanto custa o portão automático?',
        { source: 'test' }
      );

      expect(result.response.toLowerCase()).toMatch(/whatsapp|telefone|número|numero|contato/);
    });
  });

  describe('CENÁRIO 3: Captura de dados do lead', () => {

    test('Deve extrair nome da mensagem', () => {
      const data = leadCaptureSystem.extract('Meu nome é João Silva');
      expect(data.nome).toBe('João Silva');
    });

    test('Deve extrair telefone da mensagem', () => {
      const data = leadCaptureSystem.extract('Meu telefone é (11) 98765-4321');
      expect(data.telefone).toBe('(11) 98765-4321');
    });

    test('Deve extrair email da mensagem', () => {
      const data = leadCaptureSystem.extract('Meu email é joao@email.com');
      expect(data.email).toBe('joao@email.com');
    });

    test('Deve extrair múltiplos dados de uma vez', () => {
      const data = leadCaptureSystem.extract(
        'João Silva, (11) 98765-4321, joao@email.com'
      );

      expect(data.nome).toBe('João Silva');
      expect(data.telefone).toBe('(11) 98765-4321');
      expect(data.email).toBe('joao@email.com');
    });
  });

  describe('CENÁRIO 4: FAQ', () => {

    test('Deve identificar pergunta de FAQ', () => {
      const faq = knowledgeBaseMatcher.findRelevantFAQ(
        'Qual o horário de atendimento?',
        mockFAQs
      );

      expect(faq).toBeDefined();
      expect(faq?.answer).toContain('segunda a sexta');
    });

    test('Deve responder pergunta de FAQ', () => {
      const conversationManager = createConversationManager(mockKnowledgeBase);
      const result = conversationManager.processMessage(
        'Qual o horário?',
        { source: 'test' }
      );

      expect(result.response).toContain('segunda a sexta');
      expect(result.response).toContain('9h');
    });
  });

  describe('CENÁRIO 5: Fluxo completo de conversação', () => {

    test('Deve completar fluxo: saudação → produto → preço → captura', async () => {
      const conversationManager = createConversationManager(mockKnowledgeBase);
      let leadData = { source: 'test' };

      // 1. Saudação
      let result = await conversationManager.processMessage('Oi', leadData);
      expect(result.intent.id).toBe('greeting');
      expect(result.response).toBeTruthy();
      leadData = result.updatedLeadData;

      // 2. Pergunta sobre produto
      result = await conversationManager.processMessage('Vocês vendem portões?', leadData);
      expect(result.intent.id).toBe('product_inquiry');
      expect(result.updatedLeadData.interesse).toContain('Portão Automático');
      leadData = result.updatedLeadData;

      // 3. Pergunta sobre preço
      result = await conversationManager.processMessage('Quanto custa o de correr?', leadData);
      expect(result.intent.id).toBe('price_question');
      leadData = result.updatedLeadData;

      // 4. Fornecer dados
      result = await conversationManager.processMessage('João, (11) 98765-4321', leadData);
      expect(result.updatedLeadData.nome).toBe('João');
      expect(result.updatedLeadData.telefone).toBe('(11) 98765-4321');
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('CENÁRIO 6: Fallback para mensagens não entendidas', () => {

    test('Deve usar fallback para mensagem sem sentido', () => {
      const state = {
        currentIntent: undefined,
        lastIntent: undefined,
        mentionedProducts: [],
        askedQuestions: [],
        messageCount: 1,
        engagementLevel: 'low' as const,
        toneOfVoice: 'friendly' as const
      };

      const intent = intentClassifier.classify('asdfasdf', state);
      expect(intent.id).toBe('fallback');
    });

    test('Deve responder com mensagem de ajuda no fallback', () => {
      const conversationManager = createConversationManager(mockKnowledgeBase);
      const result = conversationManager.processMessage(
        'asdfasdf',
        { source: 'test' }
      );

      expect(result.response.toLowerCase()).toMatch(/não entendi|reformular|produto|preço/i);
    });
  });

  describe('CENÁRIO 7: Normalização e matching', () => {

    test('Deve funcionar com acentos', () => {
      const products = knowledgeBaseMatcher.findRelevantProducts(
        'portão automático',
        mockProducts,
        5
      );

      expect(products.length).toBeGreaterThan(0);
    });

    test('Deve funcionar sem acentos', () => {
      const products = knowledgeBaseMatcher.findRelevantProducts(
        'portao automatico',
        mockProducts,
        5
      );

      expect(products.length).toBeGreaterThan(0);
    });

    test('Deve funcionar com maiúsculas', () => {
      const products = knowledgeBaseMatcher.findRelevantProducts(
        'PORTÃO',
        mockProducts,
        5
      );

      expect(products.length).toBeGreaterThan(0);
    });
  });

  describe('CENÁRIO 8: Despedida', () => {

    test('Deve identificar despedida', () => {
      const state = {
        currentIntent: 'give_phone',
        lastIntent: 'price_question',
        mentionedProducts: [],
        askedQuestions: [],
        messageCount: 5,
        engagementLevel: 'medium' as const,
        toneOfVoice: 'friendly' as const
      };

      const intent = intentClassifier.classify('Obrigado, tchau!', state);
      expect(intent.id).toBe('goodbye');
    });

    test('Deve responder despedida com dados capturados', () => {
      const conversationManager = createConversationManager(mockKnowledgeBase);
      const leadData = {
        source: 'test',
        nome: 'João',
        telefone: '(11) 98765-4321'
      };

      const result = conversationManager.processMessage('Valeu, tchau!', leadData);
      expect(result.response.toLowerCase()).toMatch(/joão|valeu|até/i);
    });
  });
});

console.log('✅ Testes do Chatbot Inteligente carregados!');
