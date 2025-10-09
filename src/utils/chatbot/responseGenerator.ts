/**
 * Response Generator - Gerador de Respostas
 * Gera respostas naturais e personalizadas baseadas em templates
 */

import {
  Intent,
  ResponseTemplate,
  ConversationState,
  LeadData,
  KnowledgeBaseContext,
  Product
} from './types';
import { knowledgeBaseMatcher } from './knowledgeBaseMatcher';

export class ResponseGenerator {

  /**
   * Gera resposta para uma intenção
   */
  generate(
    intent: Intent,
    context: ConversationState,
    leadData: LeadData,
    knowledgeBase: KnowledgeBaseContext,
    userMessage: string
  ): string {
    // 1. Selecionar template apropriado
    const template = this.selectTemplate(intent, context, leadData);

    if (!template) {
      return this.getFallbackResponse();
    }

    // 2. Preencher variáveis do template
    let response = this.fillTemplate(
      template.template,
      intent,
      context,
      leadData,
      knowledgeBase,
      userMessage
    );

    // 3. Aplicar personalidade (tom de voz)
    response = this.applyPersonality(response, context.toneOfVoice);

    // 4. Adicionar follow-up se necessário
    if (template.followUp) {
      response += `\n\n${template.followUp}`;
    }

    return response;
  }

  /**
   * Seleciona template apropriado baseado em condições
   */
  private selectTemplate(
    intent: Intent,
    context: ConversationState,
    leadData: LeadData
  ): ResponseTemplate | null {
    const templates = intent.responses;

    if (templates.length === 0) return null;

    // Filtrar templates que atendem as condições
    const validTemplates = templates.filter(template => {
      if (!template.conditions) return true;

      const conditions = template.conditions;

      // Verificar hasLeadData
      if (conditions.hasLeadData !== undefined) {
        if (conditions.hasLeadData.length === 0) {
          // Requer que NÃO tenha dados
          if (leadData.nome || leadData.telefone || leadData.email) {
            return false;
          }
        } else {
          // Requer dados específicos
          for (const field of conditions.hasLeadData) {
            if (field === 'name' && !leadData.nome) return false;
            if (field === 'phone' && !leadData.telefone) return false;
            if (field === 'email' && !leadData.email) return false;
          }
        }
      }

      // Verificar messageCount
      if (conditions.messageCount) {
        const count = context.messageCount;
        if (conditions.messageCount.min && count < conditions.messageCount.min) {
          return false;
        }
        if (conditions.messageCount.max && count > conditions.messageCount.max) {
          return false;
        }
      }

      // Verificar productMentioned
      if (conditions.productMentioned && context.mentionedProducts.length === 0) {
        return false;
      }

      return true;
    });

    // Retornar primeiro template válido ou primeiro da lista
    return validTemplates[0] || templates[0];
  }

  /**
   * Preenche template com variáveis
   */
  private fillTemplate(
    template: string,
    intent: Intent,
    context: ConversationState,
    leadData: LeadData,
    knowledgeBase: KnowledgeBaseContext,
    userMessage: string
  ): string {
    let result = template;

    // Variáveis básicas
    const variables: Record<string, string> = {
      companyName: knowledgeBase.companyData?.name || 'nossa empresa',
      userName: leadData.nome || 'você',
      phone: leadData.telefone || '[telefone]',
      email: leadData.email || '[email]'
    };

    // Variáveis específicas por intent
    switch (intent.id) {
      case 'product_inquiry':
        variables.productCategories = this.getProductCategoriesText(knowledgeBase.products);
        variables.productCount = knowledgeBase.products.filter(p => p.isActive).length.toString();
        variables.topProducts = this.getTopProductsText(knowledgeBase.products);
        break;

      case 'specific_product_inquiry':
        const products = knowledgeBaseMatcher.findRelevantProducts(userMessage, knowledgeBase.products, 1);
        if (products.length > 0) {
          variables.productName = products[0].name;
          variables.description = products[0].description;
          variables.category = products[0].category || 'produto';
          variables.price = products[0].price || 'sob consulta';
        }
        break;

      case 'price_question':
        const pricedProducts = knowledgeBaseMatcher.findRelevantProducts(userMessage, knowledgeBase.products, 1);
        if (pricedProducts.length > 0) {
          variables.productName = pricedProducts[0].name;
          variables.priceInfo = pricedProducts[0].price
            ? `custa ${pricedProducts[0].price}`
            : 'tem preço sob consulta';
        } else if (context.mentionedProducts.length > 0) {
          // Usar último produto mencionado
          const lastProduct = context.mentionedProducts[context.mentionedProducts.length - 1];
          const found = knowledgeBase.products.find(p => p.name === lastProduct);
          if (found) {
            variables.productName = found.name;
            variables.priceInfo = found.price || 'sob consulta';
          }
        }
        break;

      case 'company_info':
        variables.companyInfo = this.getCompanyInfoText(knowledgeBase);
        break;

      case 'faq_question':
        const faq = knowledgeBaseMatcher.findRelevantFAQ(userMessage, knowledgeBase.faqs);
        if (faq) {
          variables.faqAnswer = faq.answer;
        } else {
          return "Não encontrei informação específica sobre isso. Pode me dar mais detalhes?";
        }
        break;
    }

    // Substituir variáveis ${...}
    result = result.replace(/\$\{(\w+)\}/g, (match, key) => {
      return variables[key] || match;
    });

    return result;
  }

  /**
   * Aplica personalidade ao texto com validações positivas
   */
  private applyPersonality(text: string, tone: string): string {
    // Adicionar frases de validação aleatoriamente
    text = this.addValidationPhrases(text);

    switch (tone) {
      case 'friendly':
        // Mantém emojis e tom amigável
        return text;

      case 'professional':
        // Remove emojis e excessos de pontuação
        return text
          .replace(/[😊👋✨🎯😄👍👏]/g, '')
          .replace(/!+/g, '.')
          .trim();

      case 'casual':
        // Usa contrações e linguagem informal
        return text
          .replace(/você/gi, 'vc')
          .replace(/para/gi, 'pra');

      case 'formal':
        // Remove emojis e mantém tom formal
        return text
          .replace(/[😊👋✨🎯😄👍👏]/g, '')
          .replace(/vc/gi, 'você')
          .replace(/pra/gi, 'para')
          .trim();

      default:
        return text;
    }
  }

  /**
   * Adiciona frases de validação para tornar conversa mais humana
   */
  private addValidationPhrases(text: string): string {
    // Não adicionar se já tiver validação
    const hasValidation = /^(ótim|legal|perfeito|show|que bom|bacana|entendi)/i.test(text);
    if (hasValidation) return text;

    // Lista de validações positivas
    const validations = [
      'Ótima escolha!',
      'Legal saber disso!',
      'Entendi!',
      'Show!',
      'Perfeito!',
      'Que bom!',
      'Bacana!',
      'Certo!'
    ];

    // 40% de chance de adicionar validação
    if (Math.random() < 0.4) {
      const validation = validations[Math.floor(Math.random() * validations.length)];
      return `${validation} ${text}`;
    }

    return text;
  }

  /**
   * Gera texto com categorias de produtos
   */
  private getProductCategoriesText(products: Product[]): string {
    const categories = knowledgeBaseMatcher.getProductCategories(products);

    if (categories.length === 0) {
      return 'diversos produtos';
    }

    if (categories.length === 1) {
      return categories[0];
    }

    if (categories.length === 2) {
      return categories.join(' e ');
    }

    // 3 ou mais categorias
    const last = categories[categories.length - 1];
    const others = categories.slice(0, -1);
    return `${others.join(', ')} e ${last}`;
  }

  /**
   * Gera texto com top produtos
   */
  private getTopProductsText(products: Product[], maxProducts: number = 5): string {
    const active = products.filter(p => p.isActive).slice(0, maxProducts);

    if (active.length === 0) {
      return 'diversos produtos';
    }

    const names = active.map(p => p.name);

    if (names.length <= 2) {
      return names.join(' e ');
    }

    const last = names[names.length - 1];
    const others = names.slice(0, -1);
    return `${others.join(', ')} e ${last}`;
  }

  /**
   * Gera texto com informações da empresa
   */
  private getCompanyInfoText(knowledgeBase: KnowledgeBaseContext): string {
    const company = knowledgeBase.companyData;

    if (!company) {
      return 'Entre em contato para mais informações.';
    }

    const parts: string[] = [];

    if (company.location) {
      parts.push(`📍 Localização: ${company.location}`);
    }

    if (company.workingHours) {
      parts.push(`🕐 Horário: ${company.workingHours}`);
    }

    if (company.phone) {
      parts.push(`📞 Telefone: ${company.phone}`);
    }

    if (company.website) {
      parts.push(`🌐 Site: ${company.website}`);
    }

    return parts.join('\n') || 'Entre em contato para mais informações.';
  }

  /**
   * Resposta de fallback
   */
  private getFallbackResponse(): string {
    return 'Desculpa, não consegui processar sua mensagem. Pode tentar de novo?';
  }

  /**
   * Adiciona variação às respostas
   */
  addVariation(response: string, context: ConversationState): string {
    // Variar emojis
    const emojis = ['😊', '👍', '✨', '🎯'];
    const randomEmoji = emojis[context.messageCount % emojis.length];

    // Adicionar emoji ocasionalmente
    if (context.messageCount % 3 === 0 && !response.match(/[😊👋✨🎯👍]/)) {
      response += ` ${randomEmoji}`;
    }

    return response;
  }
}

// Exportar instância singleton
export const responseGenerator = new ResponseGenerator();
