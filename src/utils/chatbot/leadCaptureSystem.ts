/**
 * Lead Capture System - Sistema de Captação de Leads
 * Extrai dados do usuário (nome, telefone, email, etc) das mensagens
 */

import { LeadData } from './types';

export class LeadCaptureSystem {

  /**
   * Extrai dados de uma mensagem
   */
  extract(message: string): Partial<LeadData> {
    const data: Partial<LeadData> = {};

    // 1. Nome
    const nameData = this.extractName(message);
    if (nameData) data.nome = nameData;

    // 2. Telefone
    const phoneData = this.extractPhone(message);
    if (phoneData) data.telefone = phoneData;

    // 3. Email
    const emailData = this.extractEmail(message);
    if (emailData) data.email = emailData;

    // 4. Orçamento
    const budgetData = this.extractBudget(message);
    if (budgetData) data.orcamento = budgetData;

    // 5. Cidade
    const cityData = this.extractCity(message);
    if (cityData) data.cidade = cityData;

    // 6. Prazo
    const timelineData = this.extractTimeline(message);
    if (timelineData) data.prazo = timelineData;

    return data;
  }

  /**
   * Extrai nome da mensagem
   */
  private extractName(message: string): string | null {
    const patterns = [
      // "Meu nome é João Silva"
      /(?:meu nome [eé]|me chamo|sou (?:o|a))\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)?)/i,
      // "João Silva aqui"
      /^([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)?)\s+aqui/i,
      // "João" (apenas se for nome próprio isolado)
      /^([A-ZÀ-Ú][a-zà-ú]{2,})$/
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        const name = match[1].trim();

        // Validar: não é uma palavra comum
        const commonWords = ['oi', 'ola', 'olá', 'bom', 'boa', 'dia', 'tarde', 'noite', 'sim', 'não', 'nao'];
        if (!commonWords.includes(name.toLowerCase())) {
          return this.capitalizeWords(name);
        }
      }
    }

    return null;
  }

  /**
   * Extrai telefone da mensagem
   */
  private extractPhone(message: string): string | null {
    // Padrões aceitos:
    // (11) 98765-4321
    // 11 98765-4321
    // 11987654321
    // 11 9 8765-4321
    const pattern = /\(?\d{2}\)?\s*9?\d{4,5}-?\d{4}/;
    const match = message.match(pattern);

    if (match) {
      let phone = match[0];

      // Normalizar formato
      phone = phone.replace(/\D/g, ''); // Remove não-dígitos

      // Formatar: (XX) 9XXXX-XXXX ou (XX) XXXX-XXXX
      if (phone.length === 11) {
        // Com 9
        return `(${phone.substring(0, 2)}) ${phone.substring(2, 7)}-${phone.substring(7)}`;
      } else if (phone.length === 10) {
        // Sem 9
        return `(${phone.substring(0, 2)}) ${phone.substring(2, 6)}-${phone.substring(6)}`;
      }

      return match[0]; // Retorna original se não conseguir formatar
    }

    return null;
  }

  /**
   * Extrai email da mensagem
   */
  private extractEmail(message: string): string | null {
    const pattern = /[\w.-]+@[\w.-]+\.\w{2,}/;
    const match = message.match(pattern);

    if (match) {
      return match[0].toLowerCase();
    }

    return null;
  }

  /**
   * Extrai orçamento/budget da mensagem
   */
  private extractBudget(message: string): string | null {
    const patterns = [
      // "R$ 100 mil", "100 mil reais"
      /R?\$?\s*(\d+(?:[.,]\d+)?)\s*(?:mil|k)/i,
      // "até 50k", "uns 200 mil"
      /(?:até|uns?|cerca de|aproximadamente)\s+R?\$?\s*(\d+(?:[.,]\d+)?)\s*(?:mil|k|reais)?/i,
      // "tenho R$ 1500"
      /(?:tenho|possuo|disponho de)\s+R?\$?\s*(\d+(?:[.,]\d+)?)/i
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        return match[0].trim();
      }
    }

    return null;
  }

  /**
   * Extrai cidade da mensagem
   */
  private extractCity(message: string): string | null {
    const normalized = message.toLowerCase();

    // Cidades comuns (expandir conforme necessário)
    const cities = [
      { pattern: /s[aã]o paulo|sp\b/i, name: 'São Paulo, SP' },
      { pattern: /rio de janeiro|rj\b/i, name: 'Rio de Janeiro, RJ' },
      { pattern: /belo horizonte|bh\b/i, name: 'Belo Horizonte, MG' },
      { pattern: /bras[ií]lia|df\b/i, name: 'Brasília, DF' },
      { pattern: /curitiba|cwb/i, name: 'Curitiba, PR' },
      { pattern: /porto alegre|poa/i, name: 'Porto Alegre, RS' },
      { pattern: /salvador|ssa/i, name: 'Salvador, BA' },
      { pattern: /fortaleza|for/i, name: 'Fortaleza, CE' },
      { pattern: /recife|rec/i, name: 'Recife, PE' },
      { pattern: /manaus|mao/i, name: 'Manaus, AM' }
    ];

    for (const city of cities) {
      if (city.pattern.test(normalized)) {
        return city.name;
      }
    }

    // Padrão genérico: "Cidade, UF"
    const genericPattern = /\b([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)?),?\s*([A-Z]{2})\b/;
    const match = message.match(genericPattern);
    if (match) {
      return `${match[1]}, ${match[2]}`;
    }

    return null;
  }

  /**
   * Extrai prazo/timeline da mensagem
   */
  private extractTimeline(message: string): string | null {
    const patterns = [
      // "para março", "até dezembro"
      /(?:para|até|em)\s+(janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/i,
      // "em 3 meses", "daqui 2 semanas"
      /(?:em|daqui)\s+(\d+)\s+(m[eê]s|meses|semanas?|dias?)/i,
      // "urgente", "o mais rápido possível"
      /(urgente|r[aá]pido|o mais r[aá]pido)/i,
      // "para o final do ano"
      /(final do ano|fim do ano|come[cç]o do ano)/i
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        return match[0].trim();
      }
    }

    return null;
  }

  /**
   * Capitaliza palavras
   */
  private capitalizeWords(text: string): string {
    return text
      .split(' ')
      .map(word => {
        if (word.length === 0) return word;

        // Preposições e artigos em minúsculo
        const lowercase = ['de', 'da', 'do', 'dos', 'das', 'e'];
        if (lowercase.includes(word.toLowerCase())) {
          return word.toLowerCase();
        }

        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }

  /**
   * Valida se dados extraídos são consistentes
   */
  validate(data: Partial<LeadData>): boolean {
    // Nome: pelo menos 2 caracteres
    if (data.nome && data.nome.length < 2) return false;

    // Telefone: formato válido
    if (data.telefone && !/\d{10,11}/.test(data.telefone.replace(/\D/g, ''))) {
      return false;
    }

    // Email: formato válido
    if (data.email && !/@[\w.-]+\.\w{2,}/.test(data.email)) {
      return false;
    }

    return true;
  }
}

// Exportar instância singleton
export const leadCaptureSystem = new LeadCaptureSystem();
