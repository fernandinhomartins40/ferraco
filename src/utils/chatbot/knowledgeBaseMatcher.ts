/**
 * Knowledge Base Matcher - Buscador de Conhecimento
 * Busca produtos e FAQs relevantes baseado em keywords e similaridade
 */

import { Product, FAQItem } from './types';

export class KnowledgeBaseMatcher {

  /**
   * Busca produtos relevantes
   */
  findRelevantProducts(
    query: string,
    products: Product[],
    maxResults: number = 3
  ): Product[] {
    const normalized = this.normalize(query);

    const scored = products
      .filter(p => p.isActive)
      .map(product => ({
        product,
        score: this.calculateProductRelevance(normalized, product)
      }))
      .filter(item => item.score > 0.2) // Threshold mínimo
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);

    return scored.map(item => item.product);
  }

  /**
   * Busca FAQ mais relevante
   */
  findRelevantFAQ(
    query: string,
    faqs: FAQItem[]
  ): FAQItem | null {
    const normalized = this.normalize(query);

    const scored = faqs
      .map(faq => ({
        faq,
        score: this.calculateFAQRelevance(normalized, faq)
      }))
      .filter(item => item.score > 0.4) // Threshold para FAQ
      .sort((a, b) => b.score - a.score);

    return scored[0]?.faq || null;
  }

  /**
   * Busca produto específico por nome
   */
  findProductByName(
    productName: string,
    products: Product[]
  ): Product | null {
    const normalized = this.normalize(productName);

    // Busca exata primeiro
    let found = products.find(p =>
      p.isActive && this.normalize(p.name) === normalized
    );

    if (found) return found;

    // Busca parcial
    found = products.find(p =>
      p.isActive && this.normalize(p.name).includes(normalized)
    );

    return found || null;
  }

  /**
   * Extrai categorias únicas dos produtos
   */
  getProductCategories(products: Product[]): string[] {
    const categories = new Set<string>();

    products
      .filter(p => p.isActive)
      .forEach(p => {
        if (p.category) {
          categories.add(p.category);
        }
      });

    return Array.from(categories);
  }

  /**
   * Calcula relevância de um produto
   */
  private calculateProductRelevance(query: string, product: Product): number {
    let score = 0;
    const queryWords = query.split(/\s+/);

    // 1. Match no nome (peso alto: 0.8)
    const productName = this.normalize(product.name);
    if (productName === query) {
      score += 0.8; // Match exato
    } else if (productName.includes(query) || query.includes(productName)) {
      score += 0.6; // Match parcial
    } else {
      // Match de palavras individuais
      const nameWords = productName.split(/\s+/);
      const commonWords = queryWords.filter(qw => nameWords.includes(qw));
      score += commonWords.length * 0.2;
    }

    // 2. Match na categoria (peso médio: 0.4)
    if (product.category) {
      const category = this.normalize(product.category);
      if (category === query || query.includes(category)) {
        score += 0.4;
      }
    }

    // 3. Match em keywords (peso: 0.15 por keyword)
    if (product.keywords && Array.isArray(product.keywords)) {
      const matchedKeywords = product.keywords.filter(k => {
        const normalized = this.normalize(k);
        return query.includes(normalized) || normalized.includes(query);
      });
      score += matchedKeywords.length * 0.15;
    }

    // 4. Match na descrição (peso baixo: 0.1)
    if (product.description) {
      const description = this.normalize(product.description);
      if (description.includes(query)) {
        score += 0.1;
      }
    }

    return Math.min(score, 1); // Cap em 1.0
  }

  /**
   * Calcula relevância de um FAQ
   */
  private calculateFAQRelevance(query: string, faq: FAQItem): number {
    let score = 0;
    const queryWords = query.split(/\s+/);

    // 1. Match na pergunta (peso alto: 0.7)
    const question = this.normalize(faq.question);
    if (question.includes(query) || query.includes(question)) {
      score += 0.7;
    } else {
      // Match de palavras individuais
      const questionWords = question.split(/\s+/);
      const commonWords = queryWords.filter(qw => questionWords.includes(qw));
      score += commonWords.length * 0.15;
    }

    // 2. Match em keywords (peso: 0.2 por keyword)
    if (faq.keywords && Array.isArray(faq.keywords)) {
      const matchedKeywords = faq.keywords.filter(k => {
        const normalized = this.normalize(k);
        return query.includes(normalized) || normalized.includes(query);
      });
      score += matchedKeywords.length * 0.2;
    }

    // 3. Match na resposta (peso baixo: 0.1)
    const answer = this.normalize(faq.answer);
    if (answer.includes(query)) {
      score += 0.1;
    }

    return Math.min(score, 1); // Cap em 1.0
  }

  /**
   * Normaliza texto para comparação
   */
  private normalize(text: string): string {
    if (!text) return '';

    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w\s]/g, ' ') // Remove pontuação
      .replace(/\s+/g, ' ') // Normaliza espaços
      .trim();
  }

  /**
   * Verifica se query menciona múltiplos produtos
   */
  detectMultipleProducts(query: string, products: Product[]): Product[] {
    const normalized = this.normalize(query);
    const mentioned: Product[] = [];

    for (const product of products.filter(p => p.isActive)) {
      const productName = this.normalize(product.name);

      if (normalized.includes(productName)) {
        mentioned.push(product);
      }
    }

    return mentioned;
  }
}

// Exportar instância singleton
export const knowledgeBaseMatcher = new KnowledgeBaseMatcher();
