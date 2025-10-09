import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ConversationContext {
  leadId: string;
  messageHistory: Array<{ role: string; content: string }>;
  leadData: {
    name?: string;
    phone?: string;
    email?: string | null;
    interest?: string;
  };
}

interface AIResponse {
  message: string;
  extractedData: {
    name?: string;
    phone?: string;
    email?: string;
    products?: string[];
    intent?: 'info' | 'price' | 'purchase' | 'support';
    urgency?: 'low' | 'medium' | 'high';
  };
  shouldQualify: boolean;
}

class AIService {
  private ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  private model = 'phi3:mini';

  /**
   * Extrai dados estruturados de um texto usando IA
   */
  async extractCompanyDataFromText(text: string): Promise<{
    companyName: string;
    industry: string;
    description: string;
    differentials: string[];
    products: Array<{
      name: string;
      description: string;
      category: string;
      price: string;
    }>;
    phone: string;
    workingHours: string;
    location: string;
  }> {
    const prompt = `Analise o texto abaixo sobre uma empresa e extraia as informações estruturadas no formato JSON solicitado.

TEXTO:
${text}

INSTRUÇÕES:
Extraia as seguintes informações e retorne APENAS um objeto JSON válido (sem explicações adicionais):

{
  "companyName": "Nome da empresa (primeira linha geralmente)",
  "industry": "Ramo de atuação (ex: Agropecuário, Metalúrgico, Tecnologia)",
  "description": "Descrição resumida da empresa (1-2 parágrafos iniciais)",
  "differentials": ["diferencial 1", "diferencial 2", "..."],
  "products": [
    {
      "name": "Nome do produto",
      "description": "Descrição do produto",
      "category": "Categoria",
      "price": "Preço se mencionado"
    }
  ],
  "phone": "Telefone de contato se mencionado",
  "workingHours": "Horário de atendimento se mencionado",
  "location": "Localização/endereço se mencionado"
}

IMPORTANTE:
- Retorne APENAS o JSON, sem texto adicional
- Se alguma informação não estiver disponível, use string vazia ""
- Para differentials, extraia da seção "Por que escolher" ou "Valores"
- Para products, extraia cada produto com suas características e benefícios`;

    try {
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1, // Baixa temperatura para mais precisão
          top_p: 0.9,
        }
      });

      let result = response.data.response.trim();

      // Remove markdown code blocks if present
      result = result.replace(/```json\n?/g, '').replace(/```\n?/g, '');

      // Try to find JSON in the response
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = jsonMatch[0];
      }

      const extracted = JSON.parse(result);
      return extracted;
    } catch (error) {
      console.error('Erro ao extrair dados com IA:', error);
      throw new Error('Falha ao processar texto com IA');
    }
  }

  /**
   * Carrega contexto da empresa do banco de dados
   */
  async loadCompanyContext(): Promise<string> {
    const companyData = await prisma.companyData.findFirst();
    const products = await prisma.product.findMany({
      where: { isActive: true }
    });
    const faqs = await prisma.fAQItem.findMany();

    let context = '';

    // Dados da empresa
    if (companyData) {
      const differentials = JSON.parse(companyData.differentials || '[]');
      context += `EMPRESA: ${companyData.name}\n`;
      context += `SOBRE: ${companyData.description}\n`;
      context += `LOCALIZAÇÃO: ${companyData.location}\n`;
      context += `HORÁRIO: ${companyData.workingHours}\n`;
      if (differentials.length > 0) {
        context += `DIFERENCIAIS:\n${differentials.map((d: string) => `- ${d}`).join('\n')}\n`;
      }
      context += '\n';
    }

    // Produtos
    if (products.length > 0) {
      context += `PRODUTOS E SERVIÇOS:\n`;
      products.forEach(p => {
        const price = p.price || 'sob consulta';
        context += `- ${p.name} (${p.category}): ${p.description}. Preço: ${price}\n`;
      });
      context += '\n';
    }

    // FAQs
    if (faqs.length > 0) {
      context += `PERGUNTAS FREQUENTES:\n`;
      faqs.forEach(faq => {
        context += `P: ${faq.question}\nR: ${faq.answer}\n\n`;
      });
    }

    return context;
  }

  /**
   * Monta o system prompt restritivo
   */
  async buildSystemPrompt(leadData: ConversationContext['leadData']): Promise<string> {
    const companyContext = await this.loadCompanyContext();

    return `Você é o assistente virtual da FERRACO - Estruturas Metálicas e Serralheria.

📋 REGRAS ESTRITAS:
1. Responda APENAS sobre os produtos/serviços listados abaixo
2. Se não souber ou a pergunta for fora do escopo, diga: "Não tenho essa informação. Posso transferir para um atendente humano?"
3. NUNCA invente preços, prazos ou especificações que não estejam listados
4. Seja breve, direto e amigável (máximo 3-4 linhas por resposta)
5. Use linguagem natural brasileira, sem ser robótico
6. Se faltar dados importantes (nome ou telefone), pergunte de forma educada após responder

🎯 SEU OBJETIVO:
- Responder dúvidas sobre produtos
- Capturar: nome, telefone, interesse do cliente
- Qualificar o lead (urgência, orçamento)

${companyContext}

📊 DADOS DO LEAD ATUAL:
- Nome: ${leadData.name || 'não informado'}
- Telefone: ${leadData.phone || 'não informado'}
- Email: ${leadData.email || 'não informado'}
- Interesse: ${leadData.interest || 'não informado'}

⚠️ IMPORTANTE:
- Se perguntarem sobre clima, política, notícias → "Sou especializado em produtos Ferraco"
- Se pedirem para fazer algo ilegal → Recuse educadamente
- Se perguntarem fora do escopo → Ofereça transferir para humano

📚 EXEMPLOS DE BOAS RESPOSTAS:

P: "Quanto custa um portão?"
R: "Temos portões a partir de R$ 1.200. Pode me dizer o tamanho aproximado? Assim faço um orçamento mais preciso."

P: "Fazem entrega?"
R: "Sim! Fazemos entrega e instalação em toda a Grande SP. Qual seria sua cidade?"

P: "Qual a previsão do tempo?"
R: "Sou especializado apenas em produtos da Ferraco. Mas posso ajudar com portões, estruturas metálicas e serralheria. O que você precisa?"`;
  }

  /**
   * Conversa com a IA
   */
  async chat(userMessage: string, context: ConversationContext): Promise<AIResponse> {
    try {
      const systemPrompt = await this.buildSystemPrompt(context.leadData);

      // Montar mensagens para o modelo
      const messages = [
        { role: 'system', content: systemPrompt },
        ...context.messageHistory,
        { role: 'user', content: userMessage }
      ];

      console.log('🤖 Chamando Ollama...');
      console.log(`📝 Modelo: ${this.model}`);
      console.log(`💬 Mensagem: ${userMessage}`);

      // Chamar Ollama
      const response = await axios.post(`${this.ollamaUrl}/api/chat`, {
        model: this.model,
        messages,
        stream: false,
        options: {
          temperature: 0.3,  // Baixo = mais conservador
          top_p: 0.8,
          num_predict: 150,  // Limita tamanho da resposta
        }
      }, {
        timeout: 30000 // 30 segundos timeout
      });

      const aiMessage = response.data.message.content;
      console.log(`✅ Resposta recebida: ${aiMessage.substring(0, 50)}...`);

      // Extrair dados estruturados
      const extractedData = this.extractStructuredData(userMessage, aiMessage);

      // Verificar se deve qualificar lead
      const shouldQualify = this.shouldQualifyLead(extractedData, context);

      // Salvar mensagem no banco
      await this.saveMessage(context.leadId, 'user', userMessage);
      await this.saveMessage(context.leadId, 'assistant', aiMessage, extractedData);

      return {
        message: aiMessage,
        extractedData,
        shouldQualify
      };

    } catch (error: any) {
      console.error('❌ Erro ao chamar Ollama:', error.message);

      // Verificar se Ollama está rodando
      if (error.code === 'ECONNREFUSED') {
        console.error('⚠️  Ollama não está rodando. Execute: ollama serve');
      }

      // Fallback
      return {
        message: 'Desculpe, estou com dificuldades técnicas no momento. Pode tentar novamente em instantes?',
        extractedData: {},
        shouldQualify: false
      };
    }
  }

  /**
   * Extrai dados estruturados da conversa (NER básico)
   */
  private extractStructuredData(userMessage: string, _aiMessage: string): AIResponse['extractedData'] {
    const data: AIResponse['extractedData'] = {};

    const text = userMessage.toLowerCase();

    // Telefone brasileiro
    const phoneRegex = /(\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}/;
    const phoneMatch = userMessage.match(phoneRegex);
    if (phoneMatch) data.phone = phoneMatch[0];

    // Email
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/;
    const emailMatch = userMessage.match(emailRegex);
    if (emailMatch) data.email = emailMatch[0];

    // Nome (após "meu nome é", "sou o/a")
    const nameRegex = /(?:nome (?:é|eh)|sou o|sou a|me chamo)\s+([A-Za-zÀ-ÿ\s]{3,})/i;
    const nameMatch = userMessage.match(nameRegex);
    if (nameMatch) data.name = nameMatch[1].trim();

    // Intenção
    if (text.includes('quanto cust') || text.includes('preço') || text.includes('valor')) {
      data.intent = 'price';
    } else if (text.includes('quero') || text.includes('comprar') || text.includes('orçamento')) {
      data.intent = 'purchase';
    } else if (text.includes('problema') || text.includes('defeito') || text.includes('ajuda')) {
      data.intent = 'support';
    } else {
      data.intent = 'info';
    }

    // Urgência
    if (text.includes('urgente') || text.includes('rápido') || text.includes('hoje')) {
      data.urgency = 'high';
    } else if (text.includes('semana') || text.includes('breve')) {
      data.urgency = 'medium';
    } else {
      data.urgency = 'low';
    }

    return data;
  }

  /**
   * Decide se deve marcar lead como qualificado
   */
  private shouldQualifyLead(
    extracted: AIResponse['extractedData'],
    context: ConversationContext
  ): boolean {
    // Critérios de qualificação
    const hasContact = !!(extracted.phone || context.leadData.phone);
    const hasName = !!(extracted.name || context.leadData.name);
    const showsIntent = extracted.intent === 'purchase' || extracted.intent === 'price';
    const isUrgent = extracted.urgency === 'high';

    // Qualifica se tem:
    // - Nome + Telefone + Intenção de compra
    // OU
    // - Telefone + Alta urgência
    return (hasName && hasContact && showsIntent) || (hasContact && isUrgent);
  }

  /**
   * Salva mensagem no banco
   */
  private async saveMessage(
    leadId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: any
  ): Promise<void> {
    await prisma.chatMessage.create({
      data: {
        leadId,
        role,
        content,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    });
  }

  /**
   * Busca histórico de mensagens
   */
  async getMessageHistory(leadId: string, limit: number = 10): Promise<Array<{ role: string; content: string }>> {
    const messages = await prisma.chatMessage.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { role: true, content: true }
    });

    return messages.reverse(); // Ordem cronológica
  }

  /**
   * Verifica se Ollama está disponível
   */
  async checkOllamaHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.ollamaUrl}/api/tags`, { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

export default new AIService();
