/**
 * Conversation Manager - Gerenciador de Conversação
 * Orquestra o fluxo da conversa, mantém estado e gerencia contexto
 */

import {
  Intent,
  ConversationState,
  LeadData,
  KnowledgeBaseContext,
  ChatResponse
} from './types';
import { intentClassifier } from './intentClassifier';
import { responseGenerator } from './responseGenerator';
import { leadCaptureSystem } from './leadCaptureSystem';
import { knowledgeBaseMatcher } from './knowledgeBaseMatcher';

export class ConversationManager {
  private state: ConversationState;
  private knowledgeBase: KnowledgeBaseContext;

  constructor(knowledgeBase: KnowledgeBaseContext) {
    this.knowledgeBase = knowledgeBase;
    this.state = this.initializeState();
  }

  /**
   * Processa uma mensagem do usuário
   */
  async processMessage(
    userMessage: string,
    currentLeadData: LeadData
  ): Promise<ChatResponse> {

    // 1. Extrair dados da mensagem
    const extractedData = leadCaptureSystem.extract(userMessage);
    const updatedLeadData: LeadData = {
      ...currentLeadData,
      ...extractedData
    };

    // 2. Detectar produtos mencionados
    const mentionedProducts = knowledgeBaseMatcher.detectMultipleProducts(
      userMessage,
      this.knowledgeBase.products
    );

    if (mentionedProducts.length > 0) {
      mentionedProducts.forEach(p => {
        if (!this.state.mentionedProducts.includes(p.name)) {
          this.state.mentionedProducts.push(p.name);
        }
      });

      // Adicionar ao interesse do lead
      if (!updatedLeadData.interesse) {
        updatedLeadData.interesse = [];
      }

      mentionedProducts.forEach(p => {
        if (!updatedLeadData.interesse!.includes(p.name)) {
          updatedLeadData.interesse!.push(p.name);
        }
      });
    }

    // 3. Classificar intenção
    let intent = intentClassifier.classify(userMessage, this.state);

    // 3.1. Detectar se é produto específico
    if (intent.id === 'product_inquiry') {
      const relevantProducts = knowledgeBaseMatcher.findRelevantProducts(
        userMessage,
        this.knowledgeBase.products,
        1
      );

      if (relevantProducts.length > 0) {
        // É pergunta sobre produto específico
        const specificIntent = intentClassifier.classify(
          'specific_product_inquiry',
          this.state
        );
        if (specificIntent.id === 'specific_product_inquiry') {
          intent = specificIntent;
        }
      }
    }

    // 3.2. Detectar FAQ
    if (intent.id === 'fallback') {
      const faq = knowledgeBaseMatcher.findRelevantFAQ(
        userMessage,
        this.knowledgeBase.faqs
      );

      if (faq) {
        const faqIntent = intentClassifier.classify('faq_question', this.state);
        if (faqIntent.id === 'faq_question') {
          intent = faqIntent;
        }
      }
    }

    // 4. Atualizar estado da conversa
    this.updateState(intent, userMessage, updatedLeadData);

    // 5. Gerar resposta
    const response = responseGenerator.generate(
      intent,
      this.state,
      updatedLeadData,
      this.knowledgeBase,
      userMessage
    );

    // 6. Calcular confiança
    const confidence = this.calculateConfidence(intent, response);

    return {
      response,
      intent,
      updatedLeadData,
      capturedData: extractedData,
      confidence
    };
  }

  /**
   * Atualiza estado da conversa
   */
  private updateState(
    intent: Intent,
    message: string,
    leadData: LeadData
  ): void {
    // Atualizar histórico de intents
    this.state.lastIntent = this.state.currentIntent;
    this.state.currentIntent = intent.id;

    // Incrementar contador de mensagens
    this.state.messageCount++;

    // Adicionar à lista de perguntas feitas
    if (!this.state.askedQuestions.includes(intent.id)) {
      this.state.askedQuestions.push(intent.id);
    }

    // Atualizar awaiting data
    if (intent.id === 'give_name' && !leadData.telefone) {
      this.state.awaitingData = 'phone';
    } else if (intent.id === 'give_phone' && !leadData.email) {
      this.state.awaitingData = 'email';
    } else {
      this.state.awaitingData = undefined;
    }

    // Calcular nível de engajamento
    this.updateEngagementLevel();
  }

  /**
   * Atualiza nível de engajamento
   */
  private updateEngagementLevel(): void {
    const count = this.state.messageCount;
    const questionsAsked = this.state.askedQuestions.length;

    if (count > 10 || questionsAsked > 5) {
      this.state.engagementLevel = 'high';
    } else if (count > 5 || questionsAsked > 3) {
      this.state.engagementLevel = 'medium';
    } else {
      this.state.engagementLevel = 'low';
    }
  }

  /**
   * Calcula confiança na resposta
   */
  private calculateConfidence(intent: Intent, response: string): number {
    let confidence = 0.5; // Base

    // Aumentar confiança baseado em prioridade do intent
    confidence += (intent.priority / 10) * 0.3;

    // Aumentar se não é fallback
    if (intent.id !== 'fallback') {
      confidence += 0.2;
    }

    // Aumentar se resposta tem conteúdo significativo
    if (response.length > 50) {
      confidence += 0.1;
    }

    // Diminuir se é resposta genérica
    if (response.includes('[') || response.includes('${')) {
      confidence -= 0.3;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Inicializa estado da conversa
   */
  private initializeState(): ConversationState {
    return {
      currentIntent: undefined,
      lastIntent: undefined,
      awaitingData: undefined,
      mentionedProducts: [],
      askedQuestions: [],
      messageCount: 0,
      engagementLevel: 'low',
      toneOfVoice: this.knowledgeBase.aiConfig.toneOfVoice || 'friendly'
    };
  }

  /**
   * Reinicia estado (nova conversa)
   */
  resetState(): void {
    this.state = this.initializeState();
  }

  /**
   * Retorna estado atual
   */
  getState(): ConversationState {
    return { ...this.state };
  }

  /**
   * Atualiza knowledge base
   */
  updateKnowledgeBase(knowledgeBase: KnowledgeBaseContext): void {
    this.knowledgeBase = knowledgeBase;
    this.state.toneOfVoice = knowledgeBase.aiConfig.toneOfVoice || 'friendly';
  }

  /**
   * Gera mensagem de boas-vindas
   */
  generateGreeting(): string {
    const companyName = this.knowledgeBase.companyData?.name || 'nossa empresa';
    const greetingMessage = this.knowledgeBase.aiConfig.greetingMessage;

    if (greetingMessage) {
      return greetingMessage.replace('${companyName}', companyName);
    }

    return `Olá! 👋 Bem-vindo(a) à ${companyName}! Como posso te ajudar hoje?`;
  }

  /**
   * Verifica se deve fazer follow-up
   */
  shouldFollowUp(leadData: LeadData): { should: boolean; message?: string } {
    // Follow-up para capturar telefone
    if (leadData.nome && !leadData.telefone && this.state.messageCount > 3) {
      return {
        should: true,
        message: `Ah, ${leadData.nome}, para eu te mandar mais informações, qual seu WhatsApp?`
      };
    }

    // Follow-up para confirmar interesse
    if (leadData.interesse && leadData.interesse.length > 0 && !leadData.telefone) {
      return {
        should: true,
        message: `Vi que você se interessou por ${leadData.interesse[0]}. Posso te mandar mais detalhes no WhatsApp?`
      };
    }

    return { should: false };
  }
}

/**
 * Factory function para criar nova instância
 */
export function createConversationManager(
  knowledgeBase: KnowledgeBaseContext
): ConversationManager {
  return new ConversationManager(knowledgeBase);
}
