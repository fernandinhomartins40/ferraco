/**
 * Tipos para o Chatbot Inteligente Baseado em Regras
 */

import { CompanyData, Product, FAQItem, AIConfig } from '../aiChatStorage';

// ============================================
// INTENT (INTENÇÃO)
// ============================================

export interface Intent {
  id: string;
  name: string;
  keywords: string[];
  patterns: RegExp[];
  priority: number;
  requiresContext?: string[];
  responses: ResponseTemplate[];
  followUp?: string;
}

// ============================================
// RESPONSE TEMPLATE
// ============================================

export interface ResponseTemplate {
  template: string;
  variables?: string[];
  conditions?: ResponseConditions;
  followUp?: string;
}

export interface ResponseConditions {
  hasLeadData?: ('name' | 'phone' | 'email')[];
  productMentioned?: boolean;
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  messageCount?: {
    min?: number;
    max?: number;
  };
}

// ============================================
// CONVERSATION STATE
// ============================================

export interface ConversationState {
  currentIntent?: string;
  lastIntent?: string;
  awaitingData?: 'name' | 'phone' | 'email' | 'interest';
  mentionedProducts: string[];
  askedQuestions: string[];
  messageCount: number;
  engagementLevel: 'low' | 'medium' | 'high';
  toneOfVoice: 'formal' | 'casual' | 'friendly' | 'professional';
}

// ============================================
// LEAD DATA
// ============================================

export interface LeadData {
  nome?: string;
  telefone?: string;
  email?: string;
  interesse?: string[];
  orcamento?: string;
  cidade?: string;
  prazo?: string;
  source: string;
}

// ============================================
// KNOWLEDGE BASE CONTEXT
// ============================================

export interface KnowledgeBaseContext {
  companyData: CompanyData | null;
  products: Product[];
  faqs: FAQItem[];
  aiConfig: AIConfig;
}

// ============================================
// MATCHED PRODUCT/FAQ
// ============================================

export interface MatchedProduct {
  product: Product;
  score: number;
  matchedFields: string[];
}

export interface MatchedFAQ {
  faq: FAQItem;
  score: number;
  matchedKeywords: string[];
}

// ============================================
// CHAT RESPONSE
// ============================================

export interface ChatResponse {
  response: string;
  intent: Intent;
  updatedLeadData: LeadData;
  capturedData?: Partial<LeadData>;
  confidence: number;
}

// ============================================
// EXPORT ALL
// ============================================

export type {
  CompanyData,
  Product,
  FAQItem,
  AIConfig
};
