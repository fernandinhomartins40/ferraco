/**
 * Storage para configuração da IA de captação de leads
 */

export interface CompanyData {
  name: string;
  industry: string;
  description: string;
  differentials: string[];
  targetAudience: string;
  location: string;
  workingHours: string;
  website?: string;
  phone?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price?: string;
  keywords: string[];
  isActive: boolean;
  createdAt: string;
}

export interface AIConfig {
  toneOfVoice: 'formal' | 'casual' | 'friendly' | 'professional';
  greetingMessage: string;
  qualificationQuestions: QualificationQuestion[];
  hotLeadCriteria: string[];
  enableSmallTalk: boolean;
  // FuseChat API Integration
  fuseChatApiKey?: string;
  fuseChatModel?: 'qwen2.5-1.5b' | 'gemma-2b' | 'llama-3.2-3b';
}

export interface QualificationQuestion {
  id: string;
  question: string;
  field: 'name' | 'phone' | 'email' | 'budget' | 'timeline' | 'custom';
  isRequired: boolean;
  order: number;
}

export interface ChatLink {
  id: string;
  name: string;
  source: 'facebook' | 'instagram' | 'google-ads' | 'tiktok' | 'linkedin' | 'website' | 'other';
  url: string;
  shortCode: string;
  clicks: number;
  leads: number;
  createdAt: string;
  isActive: boolean;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
}

class AIChatStorage {
  private readonly STORAGE_KEY_COMPANY = 'ferraco_ai_company';
  private readonly STORAGE_KEY_PRODUCTS = 'ferraco_ai_products';
  private readonly STORAGE_KEY_CONFIG = 'ferraco_ai_config';
  private readonly STORAGE_KEY_LINKS = 'ferraco_ai_links';
  private readonly STORAGE_KEY_FAQ = 'ferraco_ai_faq';

  // Company Data
  getCompanyData(): CompanyData | null {
    const data = localStorage.getItem(this.STORAGE_KEY_COMPANY);
    return data ? JSON.parse(data) : null;
  }

  saveCompanyData(data: CompanyData): void {
    localStorage.setItem(this.STORAGE_KEY_COMPANY, JSON.stringify(data));
  }

  // Products
  getProducts(): Product[] {
    const data = localStorage.getItem(this.STORAGE_KEY_PRODUCTS);
    return data ? JSON.parse(data) : [];
  }

  saveProducts(products: Product[]): void {
    localStorage.setItem(this.STORAGE_KEY_PRODUCTS, JSON.stringify(products));
  }

  addProduct(product: Omit<Product, 'id' | 'createdAt'>): Product {
    const products = this.getProducts();
    const newProduct: Product = {
      ...product,
      id: `product-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    products.push(newProduct);
    this.saveProducts(products);
    return newProduct;
  }

  updateProduct(id: string, updates: Partial<Product>): void {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...updates };
      this.saveProducts(products);
    }
  }

  deleteProduct(id: string): void {
    const products = this.getProducts().filter(p => p.id !== id);
    this.saveProducts(products);
  }

  // AI Configuration
  getAIConfig(): AIConfig {
    const data = localStorage.getItem(this.STORAGE_KEY_CONFIG);
    return data ? JSON.parse(data) : this.getDefaultConfig();
  }

  saveAIConfig(config: AIConfig): void {
    localStorage.setItem(this.STORAGE_KEY_CONFIG, JSON.stringify(config));
  }

  private getDefaultConfig(): AIConfig {
    return {
      toneOfVoice: 'friendly',
      greetingMessage: 'Olá! 👋 Como posso ajudar você hoje?',
      qualificationQuestions: [
        {
          id: 'q1',
          question: 'Qual é o seu nome?',
          field: 'name',
          isRequired: true,
          order: 1,
        },
        {
          id: 'q2',
          question: 'Qual é o melhor WhatsApp para contato?',
          field: 'phone',
          isRequired: true,
          order: 2,
        },
        {
          id: 'q3',
          question: 'E o seu e-mail?',
          field: 'email',
          isRequired: false,
          order: 3,
        },
      ],
      hotLeadCriteria: [
        'Mencionou orçamento ou preço',
        'Perguntou sobre disponibilidade',
        'Demonstrou urgência',
      ],
      enableSmallTalk: true,
      fuseChatApiKey: '',
      fuseChatModel: 'gemma-2b',
    };
  }

  // Chat Links
  getChatLinks(): ChatLink[] {
    const data = localStorage.getItem(this.STORAGE_KEY_LINKS);
    return data ? JSON.parse(data) : [];
  }

  saveChatLinks(links: ChatLink[]): void {
    localStorage.setItem(this.STORAGE_KEY_LINKS, JSON.stringify(links));
  }

  createChatLink(link: Omit<ChatLink, 'id' | 'shortCode' | 'clicks' | 'leads' | 'createdAt'>): ChatLink {
    const links = this.getChatLinks();
    const shortCode = this.generateShortCode();
    const newLink: ChatLink = {
      ...link,
      id: `link-${Date.now()}`,
      shortCode,
      clicks: 0,
      leads: 0,
      createdAt: new Date().toISOString(),
    };
    links.push(newLink);
    this.saveChatLinks(links);
    return newLink;
  }

  updateChatLink(id: string, updates: Partial<ChatLink>): void {
    const links = this.getChatLinks();
    const index = links.findIndex(l => l.id === id);
    if (index !== -1) {
      links[index] = { ...links[index], ...updates };
      this.saveChatLinks(links);
    }
  }

  deleteChatLink(id: string): void {
    const links = this.getChatLinks().filter(l => l.id !== id);
    this.saveChatLinks(links);
  }

  private generateShortCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // FAQ
  getFAQItems(): FAQItem[] {
    const data = localStorage.getItem(this.STORAGE_KEY_FAQ);
    return data ? JSON.parse(data) : this.getDefaultFAQ();
  }

  saveFAQItems(items: FAQItem[]): void {
    localStorage.setItem(this.STORAGE_KEY_FAQ, JSON.stringify(items));
  }

  addFAQItem(item: Omit<FAQItem, 'id'>): FAQItem {
    const items = this.getFAQItems();
    const newItem: FAQItem = {
      ...item,
      id: `faq-${Date.now()}`,
    };
    items.push(newItem);
    this.saveFAQItems(items);
    return newItem;
  }

  updateFAQItem(id: string, updates: Partial<FAQItem>): void {
    const items = this.getFAQItems();
    const index = items.findIndex(i => i.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...updates };
      this.saveFAQItems(items);
    }
  }

  deleteFAQItem(id: string): void {
    const items = this.getFAQItems().filter(i => i.id !== id);
    this.saveFAQItems(items);
  }

  private getDefaultFAQ(): FAQItem[] {
    return [
      {
        id: 'faq1',
        question: 'Qual é o horário de atendimento?',
        answer: 'Nosso atendimento funciona de segunda a sexta, das 9h às 18h.',
        category: 'Atendimento',
        keywords: ['horário', 'atendimento', 'funciona', 'aberto'],
      },
      {
        id: 'faq2',
        question: 'Fazem entrega?',
        answer: 'Sim, fazemos entregas para toda a região. O prazo varia conforme a localização.',
        category: 'Entrega',
        keywords: ['entrega', 'envio', 'frete', 'transporta'],
      },
    ];
  }

  // Utility
  isConfigured(): boolean {
    const company = this.getCompanyData();
    const products = this.getProducts();
    return company !== null && products.length > 0;
  }

  getConfigurationProgress(): {
    percentage: number;
    steps: { name: string; completed: boolean }[];
  } {
    const company = this.getCompanyData();
    const products = this.getProducts();
    const config = this.getAIConfig();
    const faqs = this.getFAQItems();

    // Ordem correta: 1. Empresa, 2. Produtos, 3. FAQs, 4. Comportamento
    const steps = [
      {
        name: '1. Dados da Empresa',
        completed: Boolean(company?.name && company?.industry && company?.description)
      },
      {
        name: '2. Produtos Cadastrados',
        completed: products.length > 0
      },
      {
        name: '3. FAQs Configurados',
        completed: faqs.length > 0
      },
      {
        name: '4. Comportamento da IA',
        completed: Boolean(config?.toneOfVoice && config?.greetingMessage)
      },
    ];

    const completed = steps.filter(s => s.completed).length;
    const percentage = Math.round((completed / steps.length) * 100);

    return { percentage, steps };
  }
}

export const aiChatStorage = new AIChatStorage();
