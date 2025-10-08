import axios, { AxiosInstance } from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface FuseChatDocument {
  doc_type: 'produto' | 'faq' | 'politica' | 'script';
  title: string;
  content: string;
  metadata?: Record<string, any>;
}

interface KnowledgeBaseConfig {
  name: string;
  description: string;
  documents: FuseChatDocument[];
}

interface GuardrailsConfig {
  forbidden_keywords: string[];
  allowed_topics: string[];
  use_llm_classifier: boolean;
  fallback_message: string;
  is_active: boolean;
}

class FuseChatService {
  private baseUrl = 'https://digiurbis.com.br';
  private apiKey: string;
  private client: AxiosInstance;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.FUSECHAT_API_KEY || '';

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      timeout: 60000
    });
  }

  /**
   * Atualiza a API Key dinamicamente
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    this.client.defaults.headers['X-API-Key'] = apiKey;
  }

  /**
   * Sincroniza Knowledge Base completa com FuseChat
   */
  async syncKnowledgeBase(apiKey?: string): Promise<{ success: boolean; message: string; stats?: any }> {
    try {
      if (apiKey) this.setApiKey(apiKey);

      console.log('📚 Iniciando sincronização da Knowledge Base com FuseChat...');

      // Buscar dados do banco
      const companyData = await prisma.companyData.findFirst();
      const products = await prisma.product.findMany({ where: { isActive: true } });
      const faqs = await prisma.fAQItem.findMany();

      const documents: FuseChatDocument[] = [];

      // 1. Documento de política/comportamento da IA
      if (companyData) {
        const differentials = JSON.parse(companyData.differentials || '[]');

        documents.push({
          doc_type: 'politica',
          title: 'Política de Atendimento',
          content: `EMPRESA: ${companyData.name}
RAMO: ${companyData.industry}
DESCRIÇÃO: ${companyData.description}

REGRAS DE ATENDIMENTO:
1. Você é um assistente virtual especializado em ${companyData.industry}
2. Responda APENAS sobre produtos e serviços da ${companyData.name}
3. Seja amigável, direto e profissional
4. Use português brasileiro informal mas educado
5. Respostas curtas (máximo 3-4 linhas)
6. Sempre confirme disponibilidade antes de prometer algo
7. Se não souber, ofereça transferir para atendente humano

INFORMAÇÕES DA EMPRESA:
- Localização: ${companyData.location}
- Horário: ${companyData.workingHours}
- Telefone: ${companyData.phone}

DIFERENCIAIS:
${differentials.map((d: string) => `- ${d}`).join('\n')}

IMPORTANTE:
- Nunca fale sobre política, religião, clima ou temas fora do escopo
- Nunca invente preços ou prazos que não estejam documentados
- Capture dados do cliente de forma natural (nome, telefone, interesse)`,
          metadata: {
            companyId: companyData.id,
            updatedAt: new Date().toISOString()
          }
        });
      }

      // 2. Documentos de produtos
      products.forEach(product => {
        documents.push({
          doc_type: 'produto',
          title: product.name,
          content: `PRODUTO: ${product.name}
CATEGORIA: ${product.category}
DESCRIÇÃO: ${product.description}
PREÇO: ${product.price ? `R$ ${product.price.toFixed(2)}` : 'Sob consulta'}
${product.keywords ? `PALAVRAS-CHAVE: ${product.keywords}` : ''}

COMO RESPONDER SOBRE ESTE PRODUTO:
- Destaque os benefícios práticos
- Mencione o preço se o cliente perguntar
- Pergunte sobre necessidades específicas para oferecer orçamento personalizado
- Se cliente demonstrar interesse, capture nome e telefone`,
          metadata: {
            productId: product.id,
            category: product.category,
            price: product.price,
            keywords: product.keywords
          }
        });
      });

      // 3. Documentos de FAQ
      faqs.forEach(faq => {
        documents.push({
          doc_type: 'faq',
          title: faq.question,
          content: `PERGUNTA: ${faq.question}

RESPOSTA: ${faq.answer}

Use esta resposta quando o cliente perguntar sobre "${faq.question}" ou tópicos relacionados.`,
          metadata: {
            faqId: faq.id
          }
        });
      });

      // 4. Script de captação de leads
      documents.push({
        doc_type: 'script',
        title: 'Script de Captação de Leads',
        content: `OBJETIVO: Capturar dados do cliente de forma natural durante a conversa

DADOS PARA CAPTURAR:
1. Nome - "Como posso te chamar?" ou aguardar cliente se apresentar
2. Telefone/WhatsApp - "Posso te enviar o orçamento no WhatsApp?" (PRIORITÁRIO)
3. Email - Opcional, apenas se cliente mencionar
4. Interesse - Identificar pelos produtos que perguntou
5. Orçamento disponível - Perguntar sutilmente se cliente mencionar preço
6. Prazo desejado - Capturar se cliente mencionar urgência

COMO FAZER (NATURAL):
❌ NÃO: "Preciso do seu nome, telefone e email"
✅ SIM: Conversar naturalmente e perguntar um dado por vez, quando fizer sentido

EXEMPLOS:
Cliente: "Quanto custa um portão?"
Você: "Temos portões a partir de R$ 1.200. Qual tamanho você precisa? Assim faço um orçamento mais exato."

Cliente: "Preciso de 3x4 metros"
Você: "Perfeito! Posso te enviar algumas opções no WhatsApp com fotos e valores. Qual seu número?"

QUALIFICAÇÃO DE LEAD:
- QUENTE 🔥: Tem telefone + perguntou preço/prazo + demonstrou urgência
- MORNO 🌡️: Perguntou sobre produtos mas não deixou contato
- FRIO ❄️: Apenas curiosidade, sem aprofundar`,
        metadata: {
          type: 'lead_capture'
        }
      });

      // Criar Knowledge Base no FuseChat
      const kbConfig: KnowledgeBaseConfig = {
        name: `Base de Conhecimento - ${companyData?.name || 'Empresa'}`,
        description: 'Base de conhecimento completa com produtos, FAQs e políticas de atendimento',
        documents
      };

      console.log(`📤 Enviando ${documents.length} documentos para FuseChat...`);

      const response = await this.client.post('/api/rag/knowledge', kbConfig);

      console.log('✅ Knowledge Base sincronizada com sucesso!');

      return {
        success: true,
        message: `Knowledge Base sincronizada: ${documents.length} documentos`,
        stats: {
          totalDocuments: documents.length,
          products: products.length,
          faqs: faqs.length,
          policies: 1,
          scripts: 1
        }
      };

    } catch (error: any) {
      console.error('❌ Erro ao sincronizar Knowledge Base:', error.response?.data || error.message);

      return {
        success: false,
        message: `Erro: ${error.response?.data?.error || error.message}`,
      };
    }
  }

  /**
   * Configura Guardrails no FuseChat
   */
  async syncGuardrails(apiKey?: string): Promise<{ success: boolean; message: string }> {
    try {
      if (apiKey) this.setApiKey(apiKey);

      console.log('🛡️ Configurando Guardrails no FuseChat...');

      const companyData = await prisma.companyData.findFirst();
      const products = await prisma.product.findMany({ where: { isActive: true } });

      // Extrair categorias de produtos para allowed_topics
      const categories = [...new Set(products.map(p => p.category))];
      const productNames = products.map(p => p.name.toLowerCase());

      const guardrails: GuardrailsConfig = {
        forbidden_keywords: [
          'política', 'eleição', 'político', 'partido',
          'religião', 'igreja', 'deus', 'bíblia',
          'clima', 'tempo', 'previsão do tempo',
          'notícia', 'notícias', 'jornal',
          'futebol', 'jogo', 'time',
          'receita', 'culinária', 'comida'
        ],
        allowed_topics: [
          'produtos',
          'serviços',
          'orçamento',
          'preço',
          'valor',
          'atendimento',
          'contato',
          'telefone',
          'whatsapp',
          'email',
          'endereço',
          'localização',
          'horário',
          'prazo',
          'entrega',
          'instalação',
          'garantia',
          'formas de pagamento',
          ...categories,
          ...productNames
        ],
        use_llm_classifier: true, // Usa IA para classificação mais inteligente
        fallback_message: `Desculpe, sou especializado apenas em produtos e serviços da ${companyData?.name || 'nossa empresa'}. Posso ajudar com informações sobre nossos produtos, orçamentos ou atendimento. Como posso ajudar?`,
        is_active: true
      };

      await this.client.post('/api/rag/guardrails', guardrails);

      console.log('✅ Guardrails configurados com sucesso!');

      return {
        success: true,
        message: 'Guardrails configurados com sucesso'
      };

    } catch (error: any) {
      console.error('❌ Erro ao configurar Guardrails:', error.response?.data || error.message);

      return {
        success: false,
        message: `Erro: ${error.response?.data?.error || error.message}`
      };
    }
  }

  /**
   * Obtém Knowledge Base atual do FuseChat
   */
  async getKnowledgeBase(apiKey?: string): Promise<any> {
    try {
      if (apiKey) this.setApiKey(apiKey);

      const response = await this.client.get('/api/rag/knowledge');
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao buscar Knowledge Base:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Obtém Guardrails atuais do FuseChat
   */
  async getGuardrails(apiKey?: string): Promise<any> {
    try {
      if (apiKey) this.setApiKey(apiKey);

      const response = await this.client.get('/api/rag/guardrails');
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao buscar Guardrails:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Obtém estatísticas da API Key
   */
  async getStats(apiKey?: string): Promise<any> {
    try {
      if (apiKey) this.setApiKey(apiKey);

      const response = await this.client.get('/api/rag/stats');
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao buscar estatísticas:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Envia mensagem para FuseChat (método simplificado)
   */
  async chat(message: string, sessionId?: string, apiKey?: string): Promise<{ response: string; session_id: string }> {
    try {
      if (apiKey) this.setApiKey(apiKey);

      const requestBody: any = { message };
      if (sessionId) {
        requestBody.session_id = sessionId;
      }

      const response = await this.client.post('/api/chat', requestBody);

      return response.data;
    } catch (error: any) {
      console.error('❌ Erro no chat FuseChat:', error.response?.data || error.message);
      throw error;
    }
  }
}

export default new FuseChatService();
