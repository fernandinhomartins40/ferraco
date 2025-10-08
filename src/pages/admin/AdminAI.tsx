import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Bot,
  Building2,
  Package,
  Link as LinkIcon,
  MessageSquare,
  Copy,
  Plus,
  Edit,
  Trash2,
  Check,
  AlertCircle,
  Sparkles,
  Facebook,
  Instagram,
  Globe,
  Linkedin,
  TrendingUp,
  Eye,
  Zap,
  FileText,
  Upload,
  Loader2,
  Database,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import {
  aiChatStorage,
  CompanyData,
  Product,
  AIConfig,
  ChatLink,
  FAQItem
} from '@/utils/aiChatStorage';

// Função para obter URL base da API (mesma lógica do apiClient)
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (import.meta.env.PROD) {
    return '/api'; // Produção: usa caminho relativo (proxy Nginx)
  }
  return 'http://localhost:3002/api'; // Desenvolvimento
};

// Helper function to calculate string similarity (Levenshtein distance based)
const calculateSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};

const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
};

const AdminAI = () => {
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [aiConfig, setAIConfig] = useState<AIConfig | null>(null);
  const [chatLinks, setChatLinks] = useState<ChatLink[]>([]);
  const [faqItems, setFAQItems] = useState<FAQItem[]>([]);
  const [progress, setProgress] = useState({ percentage: 0, steps: [] });

  // New Product Form
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    keywords: '',
  });

  // New Link Form
  const [newLink, setNewLink] = useState({
    name: '',
    source: 'facebook' as ChatLink['source'],
  });

  // Quick Setup
  const [quickSetupText, setQuickSetupText] = useState('');
  const [quickSetupFile, setQuickSetupFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setCompanyData(aiChatStorage.getCompanyData());
    setProducts(aiChatStorage.getProducts());
    setAIConfig(aiChatStorage.getAIConfig());
    setChatLinks(aiChatStorage.getChatLinks());
    setFAQItems(aiChatStorage.getFAQItems());
    setProgress(aiChatStorage.getConfigurationProgress());
  };

  const handleSaveCompany = () => {
    if (!companyData) return;

    if (!companyData.name || !companyData.industry || !companyData.description) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    aiChatStorage.saveCompanyData(companyData);
    toast.success('Dados da empresa salvos!');
    loadData();
  };

  const handleSaveAIConfig = () => {
    if (!aiConfig) return;
    aiChatStorage.saveAIConfig(aiConfig);
    toast.success('Configuração da IA salva!');
    loadData();
  };

  /**
   * Sincronizar Knowledge Base com FuseChat RAG
   */
  const handleSyncKnowledge = async () => {
    if (!aiConfig?.fuseChatApiKey) {
      toast.error('Configure a API Key primeiro');
      return;
    }

    setIsSyncing(true);
    setSyncStatus(null);

    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/chatbot/fusechat/sync-knowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: aiConfig.fuseChatApiKey })
      });

      const data = await response.json();

      if (data.success) {
        setSyncStatus({
          type: 'success',
          message: `${data.message}. Produtos: ${data.stats?.products || 0}, FAQs: ${data.stats?.faqs || 0}`
        });
        toast.success('Knowledge Base sincronizada com sucesso!');
      } else {
        setSyncStatus({
          type: 'error',
          message: data.error || 'Erro ao sincronizar'
        });
        toast.error(data.error || 'Erro ao sincronizar');
      }
    } catch (error: any) {
      setSyncStatus({
        type: 'error',
        message: `Erro: ${error.message}`
      });
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Sincronizar Guardrails com FuseChat
   */
  const handleSyncGuardrails = async () => {
    if (!aiConfig?.fuseChatApiKey) {
      toast.error('Configure a API Key primeiro');
      return;
    }

    setIsSyncing(true);
    setSyncStatus(null);

    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/chatbot/fusechat/sync-guardrails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: aiConfig.fuseChatApiKey })
      });

      const data = await response.json();

      if (data.success) {
        setSyncStatus({
          type: 'success',
          message: data.message
        });
        toast.success('Guardrails configurados com sucesso!');
      } else {
        setSyncStatus({
          type: 'error',
          message: data.error || 'Erro ao configurar guardrails'
        });
        toast.error(data.error || 'Erro ao configurar guardrails');
      }
    } catch (error: any) {
      setSyncStatus({
        type: 'error',
        message: `Erro: ${error.message}`
      });
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Sincronizar tudo de uma vez
   */
  const handleSyncAll = async () => {
    await handleSyncKnowledge();
    setTimeout(async () => {
      await handleSyncGuardrails();
    }, 2000);
  };

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.description) {
      toast.error('Nome e descrição são obrigatórios');
      return;
    }

    aiChatStorage.addProduct({
      ...newProduct,
      keywords: newProduct.keywords.split(',').map(k => k.trim()).filter(Boolean),
      isActive: true,
    });

    setNewProduct({ name: '', description: '', category: '', price: '', keywords: '' });
    toast.success('Produto adicionado!');
    loadData();
  };

  const handleDeleteProduct = (id: string) => {
    if (!confirm('Excluir este produto?')) return;
    aiChatStorage.deleteProduct(id);
    toast.success('Produto excluído');
    loadData();
  };

  const handleCreateLink = () => {
    if (!newLink.name) {
      toast.error('Digite um nome para o link');
      return;
    }

    const link = aiChatStorage.createChatLink({
      name: newLink.name,
      source: newLink.source,
      url: '', // Will be generated
      isActive: true,
    });

    const fullUrl = `${window.location.origin}/chat/${link.shortCode}`;
    aiChatStorage.updateChatLink(link.id, { url: fullUrl });

    setNewLink({ name: '', source: 'facebook' });
    toast.success('Link criado!');
    loadData();
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  };

  const getSourceIcon = (source: ChatLink['source']) => {
    const icons = {
      facebook: Facebook,
      instagram: Instagram,
      'google-ads': Globe,
      tiktok: Globe,
      linkedin: Linkedin,
      website: Globe,
      other: LinkIcon,
    };
    const Icon = icons[source] || LinkIcon;
    return <Icon className="h-4 w-4" />;
  };

  const getSourceColor = (source: ChatLink['source']) => {
    const colors = {
      facebook: 'bg-blue-500',
      instagram: 'bg-pink-500',
      'google-ads': 'bg-red-500',
      tiktok: 'bg-black',
      linkedin: 'bg-blue-700',
      website: 'bg-green-500',
      other: 'bg-gray-500',
    };
    return colors[source] || 'bg-gray-500';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.type.includes('text')) {
      toast.error('Por favor, envie um arquivo PDF ou TXT');
      return;
    }

    setQuickSetupFile(file);

    // Read file content
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setQuickSetupText(text);
    };

    if (file.type.includes('text')) {
      reader.readAsText(file);
    } else {
      // For PDF, we'll need a library - for now just show a message
      toast.info('Upload de PDF detectado. Cole o texto extraído do PDF no campo abaixo.');
    }
  };

  const handleQuickSetup = async () => {
    if (!quickSetupText.trim()) {
      toast.error('Por favor, cole o texto ou faça upload de um arquivo');
      return;
    }

    if (!aiConfig?.fuseChatApiKey) {
      toast.error('Configure a API Key primeiro na aba "1. API Config"');
      return;
    }

    setIsProcessing(true);

    try {
      // Prompt otimizado com instruções específicas
      const prompt = `Você é um assistente especializado em extrair informações estruturadas de negócios.

INSTRUÇÕES IMPORTANTES:
1. Extraia APENAS produtos/serviços ÚNICOS (sem repetições)
2. Se houver variações do mesmo produto, crie apenas 1 entrada genérica
3. Seja preciso no ramo de atividade (ex: "Metalurgia", "Construção Civil", "Tecnologia")
4. Limite a 8 produtos principais (os mais relevantes)
5. Preços devem ser números ou faixas (ex: "R$ 1.500" ou "R$ 100-200")

Analise o texto abaixo e extraia as informações em formato JSON válido:

{
  "companyName": "Nome exato da empresa",
  "industry": "Setor/ramo ESPECÍFICO (ex: Metalurgia, Agropecuária, Tecnologia)",
  "description": "Descrição clara do negócio em até 200 caracteres",
  "differentials": ["Diferencial competitivo 1", "Diferencial 2", "máximo 5"],
  "location": "Cidade, Estado",
  "workingHours": "Seg-Sex 8h-18h (formato claro)",
  "phone": "(DD) 9XXXX-XXXX ou (DD) XXXX-XXXX",
  "products": [
    {
      "name": "Nome do Produto/Serviço (sem variações repetidas)",
      "description": "Descrição objetiva em até 150 caracteres",
      "category": "Categoria específica",
      "price": "Valor ou faixa de preço (se mencionado)"
    }
  ]
}

TEXTO PARA ANÁLISE:
${quickSetupText}

REGRAS OBRIGATÓRIAS DE FORMATAÇÃO:
1. Retorne APENAS o objeto JSON puro
2. NÃO use markdown (\`\`\`json ou \`\`\`)
3. NÃO inclua comentários (// texto)
4. NÃO adicione explicações antes ou depois
5. Todos os campos de "products" devem ter valores reais (sem placeholder "Descrição objetiva...")
6. Se não souber um valor, use string vazia ""

Inicie sua resposta com { e termine com }`;

      // Usar proxy do backend para evitar CORS
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/chatbot/fusechat-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: prompt,
          apiKey: aiConfig.fuseChatApiKey,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('API Key inválida. Verifique nas configurações.');
        } else if (response.status === 429) {
          throw new Error('Limite de requisições excedido. Aguarde 1 minuto.');
        }
        throw new Error('Erro ao processar com IA');
      }

      const data = await response.json();

      // Extrair JSON da resposta da IA
      let extractedData;
      try {
        let jsonText = data.response;

        // Remover markdown code blocks (```json ... ``` ou ``` ... ```)
        jsonText = jsonText.replace(/```json\s*/gi, '').replace(/```\s*/g, '');

        // Extrair apenas o objeto JSON principal
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('JSON não encontrado na resposta');
        }

        let cleanedJson = jsonMatch[0];

        // Remover comentários de linha (//) antes de fazer parse
        cleanedJson = cleanedJson.replace(/\/\/.*$/gm, '');

        // Remover vírgulas antes de } ou ]
        cleanedJson = cleanedJson.replace(/,(\s*[}\]])/g, '$1');

        extractedData = JSON.parse(cleanedJson);
      } catch (parseError) {
        console.error('Erro ao parsear JSON:', data.response);
        console.error('Parse error:', parseError);
        throw new Error('Não foi possível extrair os dados. Tente novamente com um texto mais claro.');
      }

      console.log('✅ Dados extraídos pela IA:', extractedData);

      // Save company data
      const newCompanyData: CompanyData = {
        name: extractedData.companyName || 'Minha Empresa',
        industry: extractedData.industry || 'Serviços',
        description: extractedData.description || '',
        differentials: extractedData.differentials || [],
        targetAudience: '',
        location: extractedData.location || '',
        workingHours: extractedData.workingHours || '',
        phone: extractedData.phone || '',
      };

      aiChatStorage.saveCompanyData(newCompanyData);

      // Deduplicate and validate products
      const uniqueProducts = new Map<string, any>();
      if (extractedData.products && Array.isArray(extractedData.products)) {
        extractedData.products.forEach((product: any) => {
          if (!product.name || !product.name.trim()) return;

          // Normalizar nome para comparação
          const normalizedName = product.name.trim().toLowerCase();

          // Evitar duplicatas e produtos muito similares
          const isDuplicate = Array.from(uniqueProducts.keys()).some(existingName => {
            const similarity = calculateSimilarity(normalizedName, existingName);
            return similarity > 0.8; // 80% similar = duplicata
          });

          if (!isDuplicate) {
            uniqueProducts.set(normalizedName, product);
          }
        });
      }

      // Save unique products (max 10)
      let productsAdded = 0;
      const maxProducts = 10;

      for (const [, product] of uniqueProducts) {
        if (productsAdded >= maxProducts) break;

        const keywords = product.name
          .toLowerCase()
          .split(/\s+/)
          .filter((word: string) => word.length > 3)
          .slice(0, 5);

        aiChatStorage.addProduct({
          name: product.name.trim(),
          description: (product.description || '').trim().slice(0, 200),
          category: (product.category || 'Geral').trim(),
          price: (product.price || '').trim(),
          keywords: keywords,
          isActive: true,
        });

        productsAdded++;
      }

      // Update AI config with greeting
      const currentConfig = aiChatStorage.getAIConfig();
      aiChatStorage.saveAIConfig({
        ...currentConfig,
        greetingMessage: `Olá! 👋 Bem-vindo à ${newCompanyData.name}. Como posso ajudar você hoje?`,
      });

      const diffCount = newCompanyData.differentials.length;
      toast.success(`✨ Configuração automática concluída! ${productsAdded} produtos e ${diffCount} diferenciais extraídos. Revise nas abas.`);
      loadData();
      setQuickSetupText('');
      setQuickSetupFile(null);
    } catch (error: any) {
      toast.error(`Erro: ${error.message || 'Falha ao processar com IA'}`);
      console.error('Erro ao processar:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8 text-purple-600" />
            IA de Captação de Leads
          </h2>
          <p className="text-muted-foreground mt-2">
            Configure a inteligência artificial para conversar e qualificar leads automaticamente
          </p>
        </div>

        {/* Progress Card */}
        <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <span className="font-semibold">Progresso da Configuração</span>
              </div>
              <Badge variant={progress.percentage === 100 ? 'default' : 'secondary'}>
                {progress.percentage}%
              </Badge>
            </div>
            <Progress value={progress.percentage} className="mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {progress.steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {step.completed ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  )}
                  <span className={step.completed ? 'text-green-700' : 'text-muted-foreground'}>
                    {step.name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="api-config" className="space-y-6">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="api-config">
              <Sparkles className="h-4 w-4 mr-2" />
              1. API Config
            </TabsTrigger>
            <TabsTrigger value="ai-fill" disabled={!aiConfig?.fuseChatApiKey}>
              <Zap className="h-4 w-4 mr-2" />
              2. IA Automática
            </TabsTrigger>
            <TabsTrigger value="company" disabled={!aiConfig?.fuseChatApiKey}>
              <Building2 className="h-4 w-4 mr-2" />
              3. Empresa
            </TabsTrigger>
            <TabsTrigger value="products" disabled={!aiConfig?.fuseChatApiKey}>
              <Package className="h-4 w-4 mr-2" />
              4. Produtos
            </TabsTrigger>
            <TabsTrigger value="behavior" disabled={!aiConfig?.fuseChatApiKey}>
              <Bot className="h-4 w-4 mr-2" />
              5. Comportamento
            </TabsTrigger>
            <TabsTrigger value="links" disabled={!aiConfig?.fuseChatApiKey}>
              <LinkIcon className="h-4 w-4 mr-2" />
              6. Links
            </TabsTrigger>
          </TabsList>

          {/* API Config Tab - PRIMEIRA ABA */}
          <TabsContent value="api-config">
            <div className="space-y-4">
              {/* FuseChat API Integration Card */}
              <Card className="border-2 border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    Passo 1: Configure a API da IA
                  </CardTitle>
                  <CardDescription>
                    Antes de tudo, configure sua API Key do FuseChat para habilitar a inteligência artificial
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="border-purple-200 bg-purple-50">
                    <AlertCircle className="h-4 w-4 text-purple-600" />
                    <AlertDescription className="text-sm">
                      <strong>🎯 Comece por aqui:</strong> Sem a API Key configurada, o chatbot não funcionará.
                      Após configurar, as demais abas serão liberadas para você personalizar como a IA irá se comportar.
                    </AlertDescription>
                  </Alert>

                  <div>
                    <label className="text-sm font-medium">API Key FuseChat *</label>
                    <Input
                      type="password"
                      placeholder="pk_sua_chave_aqui"
                      value={aiConfig?.fuseChatApiKey || ''}
                      onChange={(e) =>
                        setAIConfig({ ...aiConfig!, fuseChatApiKey: e.target.value })
                      }
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      🔑 Cole sua API Key gerada no painel FuseChat (https://digiurbis.com.br)
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Modelo de IA</label>
                    <Select
                      value={aiConfig?.fuseChatModel || 'gemma-2b'}
                      onValueChange={(value) =>
                        setAIConfig({ ...aiConfig!, fuseChatModel: value as any })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="qwen2.5-1.5b">
                          Qwen2.5 1.5B - Mais rápido, ideal para respostas simples
                        </SelectItem>
                        <SelectItem value="gemma-2b">
                          Gemma 2B - Balanceado (recomendado)
                        </SelectItem>
                        <SelectItem value="llama-3.2-3b">
                          Llama 3.2 3B - Mais preciso, para tarefas complexas
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      ⚠️ O modelo deve corresponder ao configurado na API Key
                    </p>
                  </div>

                  <Button onClick={handleSaveAIConfig} className="w-full" size="lg">
                    <Check className="h-4 w-4 mr-2" />
                    Salvar e Continuar
                  </Button>

                  {aiConfig?.fuseChatApiKey && (
                    <Alert className="border-green-200 bg-green-50">
                      <Check className="h-4 w-4 text-green-600" />
                      <AlertDescription>
                        <strong>✅ API Configurada!</strong> Agora você pode prosseguir para as próximas etapas
                        e configurar como a IA irá se comportar nas conversas.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* FuseChat RAG Sync Card */}
              {aiConfig?.fuseChatApiKey && (
                <Card className="border-2 border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-blue-600" />
                      Sincronizar RAG (Knowledge Base)
                    </CardTitle>
                    <CardDescription>
                      Envie seus dados (empresa, produtos, FAQs) para a Knowledge Base do FuseChat
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert className="border-blue-200 bg-blue-50">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-sm">
                        <strong>🔄 Importante:</strong> Após adicionar ou editar produtos, FAQs ou dados da empresa,
                        você DEVE sincronizar para que a IA tenha acesso às informações atualizadas.
                      </AlertDescription>
                    </Alert>

                    {syncStatus && (
                      <Alert variant={syncStatus.type === 'success' ? 'default' : 'destructive'}>
                        {syncStatus.type === 'success' ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                        <AlertDescription>{syncStatus.message}</AlertDescription>
                      </Alert>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Button
                        onClick={handleSyncKnowledge}
                        disabled={isSyncing}
                        variant="outline"
                        className="w-full"
                      >
                        {isSyncing ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Database className="h-4 w-4 mr-2" />
                        )}
                        Knowledge Base
                      </Button>

                      <Button
                        onClick={handleSyncGuardrails}
                        disabled={isSyncing}
                        variant="outline"
                        className="w-full"
                      >
                        {isSyncing ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Shield className="h-4 w-4 mr-2" />
                        )}
                        Guardrails
                      </Button>

                      <Button
                        onClick={handleSyncAll}
                        disabled={isSyncing}
                        className="w-full"
                      >
                        {isSyncing ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4 mr-2" />
                        )}
                        Sincronizar Tudo
                      </Button>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                      <p className="font-semibold mb-2">📚 O que será sincronizado?</p>
                      <ul className="space-y-1 text-muted-foreground text-xs">
                        <li>• <strong>Knowledge Base:</strong> Dados da empresa, produtos e FAQs</li>
                        <li>• <strong>Guardrails:</strong> Regras de comportamento da IA</li>
                        <li>• <strong>Scripts:</strong> Instruções de captação de leads</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Reset Configuration Card */}
              <Card className="border-2 border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-5 w-5" />
                    Zona de Perigo
                  </CardTitle>
                  <CardDescription>
                    Ações irreversíveis - use com cuidado
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Limpar todas as configurações da IA e começar do zero. Esta ação não pode ser desfeita.
                    </p>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (confirm('⚠️ TEM CERTEZA? Isso irá apagar:\n\n• API Key configurada\n• Dados da empresa\n• Produtos cadastrados\n• Configurações de comportamento\n• Links de campanha\n\nEsta ação NÃO PODE ser desfeita!')) {
                          aiChatStorage.saveCompanyData({
                            name: '',
                            industry: '',
                            description: '',
                            differentials: [],
                            targetAudience: '',
                            location: '',
                            workingHours: '',
                            phone: '',
                          });
                          aiChatStorage.saveProducts([]);
                          aiChatStorage.saveAIConfig({
                            toneOfVoice: 'friendly',
                            greetingMessage: 'Olá! 👋 Como posso ajudar você hoje?',
                            qualificationQuestions: [],
                            hotLeadCriteria: [],
                            enableSmallTalk: true,
                            fuseChatApiKey: '',
                            fuseChatModel: 'gemma-2b',
                          });
                          aiChatStorage.saveChatLinks([]);
                          aiChatStorage.saveFAQItems([]);
                          toast.success('Todas as configurações foram resetadas');
                          loadData();
                        }
                      }}
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Limpar Todas as Configurações
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI Fill Tab - SEGUNDA ABA */}
          <TabsContent value="ai-fill">
            <Card className="border-2 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-600" />
                  Passo 2: Preenchimento Automático com IA
                </CardTitle>
                <CardDescription>
                  Cole informações sobre sua empresa ou faça upload de um arquivo. A IA preencherá automaticamente os dados da empresa e criará os produtos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="border-purple-200 bg-purple-50">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  <AlertDescription>
                    <strong>🤖 Magia da IA:</strong> A IA irá analisar seu texto e automaticamente:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Preencher os dados da empresa (nome, ramo, descrição, diferenciais)</li>
                      <li>Criar produtos/serviços com descrições e palavras-chave</li>
                      <li>Extrair informações de contato e localização</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                {/* Upload Section */}
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
                    <input
                      type="file"
                      id="ai-file-upload"
                      className="hidden"
                      accept=".pdf,.txt"
                      onChange={handleFileUpload}
                    />
                    <label htmlFor="ai-file-upload" className="cursor-pointer">
                      <Upload className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-sm font-medium mb-1">
                        Clique para fazer upload ou arraste um arquivo
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF ou TXT com informações da sua empresa
                      </p>
                    </label>
                    {quickSetupFile && (
                      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-green-600">
                        <FileText className="h-4 w-4" />
                        <span>{quickSetupFile.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1 border-t border-gray-300" />
                    <span className="text-sm text-muted-foreground">OU</span>
                    <div className="flex-1 border-t border-gray-300" />
                  </div>

                  {/* Instructions Card */}
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-sm text-blue-900">
                      <strong>📋 Template Recomendado:</strong>
                      <div className="mt-2 space-y-1 text-xs">
                        <div>✅ <strong>Nome da Empresa:</strong> Nome completo</div>
                        <div>✅ <strong>Ramo de Atividade:</strong> Seja ESPECÍFICO (ex: Metalurgia, Agropecuária, não apenas "Indústria")</div>
                        <div>✅ <strong>Descrição:</strong> O que a empresa faz em 2-3 linhas</div>
                        <div>✅ <strong>Produtos/Serviços:</strong> Liste os PRINCIPAIS (máx 8), sem repetições</div>
                        <div>✅ <strong>Preços:</strong> Se disponível (ex: "R$ 1.500" ou "R$ 100-200/m²")</div>
                        <div>✅ <strong>Diferenciais:</strong> O que te diferencia da concorrência (máx 5)</div>
                        <div>✅ <strong>Contato:</strong> Telefone, localização, horário</div>
                      </div>
                    </AlertDescription>
                  </Alert>

                  {/* Text Input */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Cole as informações da sua empresa aqui
                    </label>
                    <Textarea
                      placeholder="EMPRESA: Ferraco Metalúrgica Ltda&#10;RAMO: Metalurgia - Estruturas Metálicas&#10;&#10;DESCRIÇÃO: Fabricamos estruturas metálicas para construção civil, com 15 anos de experiência no mercado.&#10;&#10;PRODUTOS/SERVIÇOS:&#10;• Galpões Industriais - Estruturas completas de 200m² a 5000m² - R$ 350/m²&#10;• Coberturas Metálicas - Para residências e comércio - R$ 280/m²&#10;• Mezaninos - Aproveitamento de espaço vertical - R$ 450/m²&#10;• Portões e Grades - Sob medida - R$ 800 a R$ 3.500&#10;&#10;DIFERENCIAIS:&#10;• Projeto 3D gratuito&#10;• Garantia de 5 anos&#10;• Instalação em até 30 dias&#10;• Equipe técnica certificada&#10;&#10;CONTATO:&#10;Telefone: (11) 98765-4321&#10;Localização: São Paulo, SP&#10;Horário: Seg-Sex 8h-18h, Sáb 8h-12h"
                      rows={18}
                      value={quickSetupText}
                      onChange={(e) => setQuickSetupText(e.target.value)}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      💡 <strong>Importante:</strong> Liste apenas produtos ÚNICOS (sem variações). A IA vai eliminar duplicatas automaticamente.
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  onClick={handleQuickSetup}
                  disabled={isProcessing || !quickSetupText.trim()}
                  className="w-full h-12 text-base bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Processando com IA...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Preencher Automaticamente com IA
                    </>
                  )}
                </Button>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Nota:</strong> Após o preenchimento automático, você poderá revisar e ajustar os dados nas abas "3. Empresa" e "4. Produtos".
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quick Setup Tab */}
          <TabsContent value="quick-setup">
            <Card className="border-2 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-600" />
                  Configuração Rápida com IA
                </CardTitle>
                <CardDescription>
                  Cole informações sobre sua empresa ou faça upload de um arquivo e a IA configurará automaticamente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="border-purple-200 bg-purple-50">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  <AlertDescription>
                    <strong>Como funciona:</strong> Cole um texto descritivo sobre sua empresa, produtos e serviços.
                    A IA extrairá automaticamente as informações e preencherá os dados nas outras abas.
                    Você poderá revisar e ajustar depois.
                  </AlertDescription>
                </Alert>

                {/* Upload Section */}
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      accept=".pdf,.txt"
                      onChange={handleFileUpload}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-sm font-medium mb-1">
                        Clique para fazer upload ou arraste um arquivo
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF ou TXT (máx. 10MB)
                      </p>
                    </label>
                    {quickSetupFile && (
                      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-green-600">
                        <FileText className="h-4 w-4" />
                        <span>{quickSetupFile.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1 border-t border-gray-300" />
                    <span className="text-sm text-muted-foreground">OU</span>
                    <div className="flex-1 border-t border-gray-300" />
                  </div>

                  {/* Text Input */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Cole as informações da sua empresa aqui
                    </label>
                    <Textarea
                      placeholder="Cole aqui o texto sobre sua empresa. A IA irá extrair automaticamente:&#10;- Nome e ramo da empresa&#10;- Descrição do negócio&#10;- Produtos e serviços&#10;- Diferenciais e valores&#10;- Informações de contato&#10;&#10;Quanto mais detalhado, melhor será o resultado!"
                      rows={12}
                      value={quickSetupText}
                      onChange={(e) => setQuickSetupText(e.target.value)}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      💡 Dica: Inclua nome da empresa, ramo de atuação, produtos/serviços, preços e diferenciais
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  onClick={handleQuickSetup}
                  disabled={isProcessing || !quickSetupText.trim()}
                  className="w-full h-12 text-base bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Processando com IA...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Configurar Automaticamente com IA
                    </>
                  )}
                </Button>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Nota:</strong> A configuração automática é um ponto de partida.
                    Sempre revise os dados gerados e ajuste nas outras abas para garantir precisão.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Tab */}
          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle>Passo 2: Dados da Empresa</CardTitle>
                <CardDescription>
                  Ensine a IA sobre seu negócio para ela conversar de forma natural
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!aiConfig?.fuseChatApiKey && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription>
                      Configure a API Key primeiro na aba "1. API Config" para habilitar esta seção.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Nome da Empresa *</label>
                    <Input
                      placeholder="Ex: Ferraco Soluções"
                      value={companyData?.name || ''}
                      onChange={(e) => setCompanyData({ ...companyData!, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Ramo de Atuação *</label>
                    <Input
                      placeholder="Ex: Tecnologia, Consultoria, Varejo"
                      value={companyData?.industry || ''}
                      onChange={(e) => setCompanyData({ ...companyData!, industry: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Descrição do Negócio *</label>
                  <Textarea
                    placeholder="Descreva o que sua empresa faz, como atua, principais serviços..."
                    rows={4}
                    value={companyData?.description || ''}
                    onChange={(e) => setCompanyData({ ...companyData!, description: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    A IA usará isso para explicar seu negócio aos clientes
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">Diferenciais (um por linha)</label>
                  <Textarea
                    placeholder="Ex: Atendimento 24/7&#10;Garantia de 1 ano&#10;Entrega em 24h"
                    rows={4}
                    value={companyData?.differentials?.join('\n') || ''}
                    onChange={(e) =>
                      setCompanyData({
                        ...companyData!,
                        differentials: e.target.value.split('\n').filter(Boolean),
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Público-Alvo</label>
                    <Input
                      placeholder="Ex: Empresas B2B, Consumidores finais"
                      value={companyData?.targetAudience || ''}
                      onChange={(e) =>
                        setCompanyData({ ...companyData!, targetAudience: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Localização</label>
                    <Input
                      placeholder="Ex: São Paulo, SP - Brasil"
                      value={companyData?.location || ''}
                      onChange={(e) => setCompanyData({ ...companyData!, location: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Horário de Atendimento</label>
                    <Input
                      placeholder="Ex: Seg-Sex 9h-18h"
                      value={companyData?.workingHours || ''}
                      onChange={(e) =>
                        setCompanyData({ ...companyData!, workingHours: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Telefone</label>
                    <Input
                      placeholder="Ex: (11) 98765-4321"
                      value={companyData?.phone || ''}
                      onChange={(e) => setCompanyData({ ...companyData!, phone: e.target.value })}
                    />
                  </div>
                </div>

                <Button onClick={handleSaveCompany} className="w-full">
                  <Check className="h-4 w-4 mr-2" />
                  Salvar Dados da Empresa
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <div className="space-y-4">
              {!aiConfig?.fuseChatApiKey && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription>
                    Configure a API Key primeiro na aba "1. API Config" para habilitar esta seção.
                  </AlertDescription>
                </Alert>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Passo 3: Adicionar Produto/Serviço</CardTitle>
                  <CardDescription>
                    Cadastre produtos para a IA saber o que oferecer aos clientes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Nome do Produto *</label>
                      <Input
                        placeholder="Ex: Consultoria em TI"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Categoria</label>
                      <Input
                        placeholder="Ex: Serviços, Produtos"
                        value={newProduct.category}
                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Descrição *</label>
                    <Textarea
                      placeholder="Descreva o produto, benefícios, para quem é indicado..."
                      rows={3}
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Preço (opcional)</label>
                      <Input
                        placeholder="Ex: R$ 1.500,00 ou A partir de R$ 500"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Palavras-chave (separadas por vírgula)</label>
                      <Input
                        placeholder="Ex: consultoria, ti, tecnologia"
                        value={newProduct.keywords}
                        onChange={(e) => setNewProduct({ ...newProduct, keywords: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        IA usará para identificar interesse
                      </p>
                    </div>
                  </div>

                  <Button onClick={handleAddProduct} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Produto
                  </Button>
                </CardContent>
              </Card>

              {/* Products List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map((product) => (
                  <Card key={product.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{product.name}</CardTitle>
                          {product.category && (
                            <Badge variant="outline" className="mt-1">
                              {product.category}
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-muted-foreground">{product.description}</p>
                      {product.price && (
                        <p className="text-sm font-medium text-green-700">{product.price}</p>
                      )}
                      {product.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {product.keywords.map((kw, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {products.length === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Nenhum produto cadastrado ainda. Adicione produtos para a IA poder oferecê-los aos clientes.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          {/* Behavior Config Tab */}
          <TabsContent value="behavior">
            <Card>
              <CardHeader>
                <CardTitle>Passo 4: Comportamento da IA</CardTitle>
                <CardDescription>
                  Configure a personalidade e como a IA conversa com os leads
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!aiConfig?.fuseChatApiKey && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription>
                      Configure a API Key primeiro na aba "1. API Config" para habilitar esta seção.
                    </AlertDescription>
                  </Alert>
                )}
                  <div>
                    <label className="text-sm font-medium">Tom de Voz</label>
                    <Select
                      value={aiConfig?.toneOfVoice || 'friendly'}
                      onValueChange={(value) =>
                        setAIConfig({ ...aiConfig!, toneOfVoice: value as any })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="formal">Formal (corporativo, sério)</SelectItem>
                        <SelectItem value="professional">Profissional (equilibrado)</SelectItem>
                        <SelectItem value="friendly">Amigável (caloroso, próximo)</SelectItem>
                        <SelectItem value="casual">Casual (descontraído)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Mensagem de Boas-vindas</label>
                    <Textarea
                      placeholder="Olá! 👋 Como posso ajudar você hoje?"
                      rows={2}
                      value={aiConfig?.greetingMessage || ''}
                      onChange={(e) =>
                        setAIConfig({ ...aiConfig!, greetingMessage: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      Critérios de Lead Quente (um por linha)
                    </label>
                    <Textarea
                      placeholder="Ex: Mencionou orçamento&#10;Perguntou sobre disponibilidade&#10;Demonstrou urgência"
                      rows={4}
                      value={aiConfig?.hotLeadCriteria?.join('\n') || ''}
                      onChange={(e) =>
                        setAIConfig({
                          ...aiConfig!,
                          hotLeadCriteria: e.target.value.split('\n').filter(Boolean),
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      IA marcará o lead como "quente" se detectar esses sinais
                    </p>
                  </div>

                  <Button onClick={handleSaveAIConfig} className="w-full">
                    <Check className="h-4 w-4 mr-2" />
                    Salvar Configuração
                  </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Links Tab */}
          <TabsContent value="links">
            <div className="space-y-4">
              {!aiConfig?.fuseChatApiKey && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription>
                    Configure a API Key primeiro na aba "1. API Config" para habilitar esta seção.
                  </AlertDescription>
                </Alert>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Passo 5: Criar Link de Captura</CardTitle>
                  <CardDescription>
                    Gere links rastreáveis para cada campanha ou rede social
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Nome da Campanha</label>
                      <Input
                        placeholder="Ex: Campanha Instagram Janeiro"
                        value={newLink.name}
                        onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Origem</label>
                      <Select
                        value={newLink.source}
                        onValueChange={(value) =>
                          setNewLink({ ...newLink, source: value as ChatLink['source'] })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="facebook">Facebook</SelectItem>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="google-ads">Google Ads</SelectItem>
                          <SelectItem value="tiktok">TikTok</SelectItem>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                          <SelectItem value="website">Website</SelectItem>
                          <SelectItem value="other">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button onClick={handleCreateLink} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Gerar Link
                  </Button>
                </CardContent>
              </Card>

              {/* Links List */}
              <div className="space-y-3">
                {chatLinks.map((link) => (
                  <Card key={link.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <div className={`h-8 w-8 rounded-full ${getSourceColor(link.source)} flex items-center justify-center text-white`}>
                              {getSourceIcon(link.source)}
                            </div>
                            <div>
                              <p className="font-medium">{link.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Código: {link.shortCode}
                              </p>
                            </div>
                          </div>

                          <div className="bg-muted p-2 rounded flex items-center justify-between">
                            <code className="text-xs flex-1 truncate">{link.url}</code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyLink(link.url)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4 text-blue-500" />
                              <span>{link.clicks} cliques</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4 text-green-500" />
                              <span>{link.leads} leads</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {chatLinks.length === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Nenhum link criado ainda. Crie links para rastrear de onde vêm seus leads.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Status Section */}
        <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Status da Integração IA
            </CardTitle>
            <CardDescription>
              {aiConfig?.fuseChatApiKey
                ? 'Usando FuseChat API (externa)'
                : 'Usando IA Local (Ollama) - Configure FuseChat API para melhor performance'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiConfig?.fuseChatApiKey ? (
              <Alert className="border-green-200 bg-green-50">
                <Check className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <strong>✅ FuseChat Conectado:</strong> API Key configurada.
                  Modelo: {aiConfig.fuseChatModel === 'qwen2.5-1.5b' ? 'Qwen2.5 1.5B' :
                           aiConfig.fuseChatModel === 'gemma-2b' ? 'Gemma 2B' :
                           'Llama 3.2 3B'}.
                  Rate limit: 60 req/min.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription>
                  <strong>⚠️ FuseChat não configurado:</strong> Configure a API Key na aba "IA Config"
                  para usar a IA externa. Atualmente usando Ollama local (se disponível).
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`bg-white p-4 rounded-lg border ${
                aiConfig?.fuseChatApiKey ? 'border-purple-200' : 'border-gray-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Bot className={`h-5 w-5 ${
                    aiConfig?.fuseChatApiKey ? 'text-purple-600' : 'text-gray-400'
                  }`} />
                  <span className="font-semibold text-sm">
                    {aiConfig?.fuseChatApiKey ? 'FuseChat API' : 'IA Local (Ollama)'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {aiConfig?.fuseChatApiKey
                    ? 'API externa em nuvem'
                    : 'Processamento local'}
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-sm">Chat Widget</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Integrado e funcional
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-sm">Qualificação Auto</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Análise inteligente de leads
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminAI;
