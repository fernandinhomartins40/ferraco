/**
 * Intent Classifier - Classificador de Intenções
 * Identifica a intenção do usuário baseado em keywords e patterns
 */

import { Intent, ConversationState } from './types';
import { intentsConfig } from './intents.config';

export class IntentClassifier {
  private intents: Intent[];

  constructor(customIntents?: Intent[]) {
    this.intents = customIntents || intentsConfig;
  }

  /**
   * Classifica a intenção de uma mensagem
   */
  classify(message: string, context: ConversationState): Intent {
    const normalized = this.normalize(message);

    // 1. Buscar intents que fazem match
    const matchedIntents = this.intents
      .map(intent => ({
        intent,
        score: this.calculateMatchScore(normalized, message, intent, context)
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => {
        // Ordenar por score, depois por prioridade
        if (b.score !== a.score) return b.score - a.score;
        return b.intent.priority - a.intent.priority;
      });

    // 2. Retornar melhor match ou fallback
    if (matchedIntents.length > 0) {
      return matchedIntents[0].intent;
    }

    // 3. Fallback
    return this.getFallbackIntent();
  }

  /**
   * Calcula score de match para um intent
   */
  private calculateMatchScore(
    normalized: string,
    original: string,
    intent: Intent,
    context: ConversationState
  ): number {
    let score = 0;

    // 1. Match de keywords (peso: 1.0)
    if (intent.keywords.length > 0) {
      const keywordMatches = this.matchKeywords(normalized, intent.keywords);
      if (keywordMatches > 0) {
        score += keywordMatches * 0.3; // 0.3 por keyword
      }
    }

    // 2. Match de patterns regex (peso: 1.5)
    if (intent.patterns && intent.patterns.length > 0) {
      for (const pattern of intent.patterns) {
        if (pattern.test(original)) {
          score += 1.5;
          break;
        }
      }
    }

    // 3. Boost de contexto
    if (intent.requiresContext) {
      const hasContext = intent.requiresContext.every(ctx => {
        switch (ctx) {
          case 'product_mentioned':
            return context.mentionedProducts.length > 0;
          case 'has_name':
            return context.awaitingData === 'name';
          default:
            return false;
        }
      });

      if (hasContext) {
        score *= 1.2;
      } else if (intent.requiresContext.length > 0) {
        score *= 0.5; // Penaliza se requer contexto mas não tem
      }
    }

    // 4. Boost de prioridade
    score *= (intent.priority / 10);

    return score;
  }

  /**
   * Match de keywords
   */
  private matchKeywords(message: string, keywords: string[]): number {
    let matches = 0;

    for (const keyword of keywords) {
      const normalizedKeyword = this.normalize(keyword);

      // Match exato
      if (message === normalizedKeyword) {
        matches += 2; // Bonus para match exato
      }
      // Match parcial
      else if (message.includes(normalizedKeyword)) {
        matches += 1;
      }
      // Match com palavras separadas
      else {
        const words = message.split(/\s+/);
        if (words.some(word => word === normalizedKeyword)) {
          matches += 1.5;
        }
      }
    }

    return matches;
  }

  /**
   * Normaliza texto para comparação
   */
  private normalize(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w\s]/g, ' ') // Remove pontuação
      .replace(/\s+/g, ' ') // Normaliza espaços
      .trim();
  }

  /**
   * Retorna intent de fallback
   */
  private getFallbackIntent(): Intent {
    return this.intents.find(i => i.id === 'fallback') || {
      id: 'fallback',
      name: 'Fallback',
      keywords: [],
      patterns: [],
      priority: 0,
      responses: [{
        template: 'Desculpa, não entendi. Pode reformular?'
      }]
    };
  }

  /**
   * Verifica se uma mensagem contém dados pessoais
   */
  hasPersonalData(message: string): {
    hasName: boolean;
    hasPhone: boolean;
    hasEmail: boolean;
  } {
    const phonePattern = /\(?\d{2}\)?\s*9?\d{4,5}-?\d{4}/;
    const emailPattern = /[\w.-]+@[\w.-]+\.\w{2,}/;
    const namePattern = /(?:meu nome é|me chamo|sou o|sou a)\s+([A-ZÀ-Ú][a-zà-ú]+)/i;

    return {
      hasPhone: phonePattern.test(message),
      hasEmail: emailPattern.test(message),
      hasName: namePattern.test(message)
    };
  }
}

// Exportar instância singleton
export const intentClassifier = new IntentClassifier();
