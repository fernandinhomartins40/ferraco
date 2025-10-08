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
  Copy,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Sparkles,
  Database,
  Shield,
  Loader2,
  Eye,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import {
  aiChatStorage,
  CompanyData,
  Product,
  AIConfig,
  ChatLink
} from '@/utils/aiChatStorage';

// ============================================
// HELPER FUNCTIONS
// ============================================

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.PROD) return '/api';
  return 'http://localhost:3002/api';
};

const generateShortCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// ============================================
// MAIN COMPONENT
// ============================================

const AdminAI = () => {
  // State management
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [aiConfig, setAIConfig] = useState<AIConfig | null>(null);
  const [chatLinks, setChatLinks] = useState<ChatLink[]>([]);
  const [progress, setProgress] = useState({ percentage: 0, steps: [] });

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Forms state
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    keywords: '',
  });

  const [newLink, setNewLink] = useState({
    name: '',
    source: 'website' as ChatLink['source'],
  });

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setCompanyData(aiChatStorage.getCompanyData());
    setProducts(aiChatStorage.getProducts());
    setAIConfig(aiChatStorage.getAIConfig());
    setChatLinks(aiChatStorage.getChatLinks());
    setProgress(aiChatStorage.getConfigurationProgress());
  };

  // ============================================
  // FUSECHAT SYNC FUNCTIONS
  // ============================================

  const handleSyncKnowledge = async () => {
    if (!aiConfig?.fuseChatApiKey) {
      toast.error('Configure a API Key primeiro');
      return;
    }

    setIsSyncing(true);
    setSyncStatus(null);

    try {
      const localCompanyData = aiChatStorage.getCompanyData();
      const localProducts = aiChatStorage.getProducts();
      const localFaqs = aiChatStorage.getFAQItems();

      if (!localCompanyData && localProducts.length === 0) {
        toast.error('Adicione dados da empresa e produtos primeiro');
        setIsSyncing(false);
        return;
      }

      const response = await fetch(`${getApiUrl()}/chatbot/fusechat/sync-knowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: aiConfig.fuseChatApiKey,
          companyData: localCompanyData,
          products: localProducts,
          faqs: localFaqs
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setSyncStatus({
          type: 'success',
          message: `✅ ${data.message}`
        });
        toast.success('Knowledge Base sincronizada!');
      } else {
        throw new Error(data.error || 'Erro ao sincronizar');
      }
    } catch (error: any) {
      setSyncStatus({
        type: 'error',
        message: error.message
      });
      toast.error(error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncGuardrails = async () => {
    if (!aiConfig?.fuseChatApiKey) {
      toast.error('Configure a API Key primeiro');
      return;
    }

    setIsSyncing(true);
    setSyncStatus(null);

    try {
      const response = await fetch(`${getApiUrl()}/chatbot/fusechat/sync-guardrails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: aiConfig.fuseChatApiKey })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setSyncStatus({
          type: 'success',
          message: '✅ ' + data.message
        });
        toast.success('Guardrails configurados!');
      } else {
        throw new Error(data.error || 'Erro ao configurar guardrails');
      }
    } catch (error: any) {
      setSyncStatus({
        type: 'error',
        message: error.message
      });
      toast.error(error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncAll = async () => {
    await handleSyncKnowledge();
    setTimeout(() => handleSyncGuardrails(), 2000);
  };

  // ============================================
  // CRUD FUNCTIONS
  // ============================================

  const handleSaveCompany = () => {
    if (!companyData?.name || !companyData?.industry || !companyData?.description) {
      toast.error('Preencha os campos obrigatórios: Nome, Ramo e Descrição');
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

    const shortCode = generateShortCode();
    const fullUrl = `${window.location.origin}/chat/${shortCode}`;

    const link = aiChatStorage.createChatLink({
      name: newLink.name,
      source: newLink.source,
      url: fullUrl,
      shortCode,
      isActive: true,
      clicks: 0,
      leads: 0,
      createdAt: new Date().toISOString()
    });

    setNewLink({ name: '', source: 'website' });
    toast.success('Link criado!');
    loadData();
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  };

  // ============================================
  // RENDER
  // ============================================

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
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="api-config" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="api-config">
              <Sparkles className="h-4 w-4 mr-2" />
              1. API & RAG
            </TabsTrigger>
            <TabsTrigger value="company" disabled={!aiConfig?.fuseChatApiKey}>
              <Building2 className="h-4 w-4 mr-2" />
              2. Empresa
            </TabsTrigger>
            <TabsTrigger value="products" disabled={!aiConfig?.fuseChatApiKey}>
              <Package className="h-4 w-4 mr-2" />
              3. Produtos
            </TabsTrigger>
            <TabsTrigger value="links" disabled={!aiConfig?.fuseChatApiKey}>
              <LinkIcon className="h-4 w-4 mr-2" />
              4. Links
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: API Config & RAG Sync */}
          <TabsContent value="api-config">
            <div className="space-y-4">
              {/* API Key Card */}
              <Card className="border-2 border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    Configuração da API FuseChat
                  </CardTitle>
                  <CardDescription>
                    Configure sua API Key para habilitar a IA conversacional com RAG
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">API Key FuseChat *</label>
                    <Input
                      type="password"
                      placeholder="pk_sua_chave_aqui"
                      value={aiConfig?.fuseChatApiKey || ''}
                      onChange={(e) => setAIConfig({
                        ...aiConfig!,
                        fuseChatApiKey: e.target.value
                      })}
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Obtenha em: <a href="https://digiurbis.com.br" target="_blank" className="text-blue-600 hover:underline">digiurbis.com.br</a>
                    </p>
                  </div>

                  <Button onClick={handleSaveAIConfig} className="w-full" size="lg">
                    <Check className="h-4 w-4 mr-2" />
                    Salvar API Key
                  </Button>

                  {aiConfig?.fuseChatApiKey && (
                    <Alert className="border-green-200 bg-green-50">
                      <Check className="h-4 w-4 text-green-600" />
                      <AlertDescription>
                        ✅ API Key configurada! Agora configure os dados da empresa e sincronize abaixo.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* RAG Sync Card */}
              {aiConfig?.fuseChatApiKey && (
                <Card className="border-2 border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-blue-600" />
                      Sincronizar RAG (Knowledge Base)
                    </CardTitle>
                    <CardDescription>
                      Envie seus dados para a Knowledge Base do FuseChat
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert className="border-blue-200 bg-blue-50">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-sm">
                        <strong>Importante:</strong> Após adicionar/editar empresa e produtos,
                        clique em "Sincronizar Tudo" para atualizar a IA.
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
                        <li>• <strong>Knowledge Base:</strong> Empresa, produtos e FAQs</li>
                        <li>• <strong>Guardrails:</strong> Regras de comportamento da IA</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* TAB 2: Company */}
          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle>Dados da Empresa</CardTitle>
                <CardDescription>
                  Configure as informações da sua empresa para a IA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                      placeholder="Ex: Metalurgia, Tecnologia"
                      value={companyData?.industry || ''}
                      onChange={(e) => setCompanyData({ ...companyData!, industry: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Descrição do Negócio *</label>
                  <Textarea
                    placeholder="Descreva o que sua empresa faz..."
                    rows={4}
                    value={companyData?.description || ''}
                    onChange={(e) => setCompanyData({ ...companyData!, description: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Diferenciais (um por linha)</label>
                  <Textarea
                    placeholder="Ex: Atendimento 24/7&#10;Garantia de 1 ano"
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
                    <label className="text-sm font-medium">Localização</label>
                    <Input
                      placeholder="Ex: São Paulo, SP"
                      value={companyData?.location || ''}
                      onChange={(e) => setCompanyData({ ...companyData!, location: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Horário de Atendimento</label>
                    <Input
                      placeholder="Ex: Seg-Sex 9h-18h"
                      value={companyData?.workingHours || ''}
                      onChange={(e) => setCompanyData({ ...companyData!, workingHours: e.target.value })}
                    />
                  </div>
                </div>

                <Button onClick={handleSaveCompany} className="w-full" size="lg">
                  <Check className="h-4 w-4 mr-2" />
                  Salvar Dados da Empresa
                </Button>

                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription>
                    Após salvar, volte para a aba "1. API & RAG" e clique em "Sincronizar Tudo"
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: Products */}
          <TabsContent value="products">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Adicionar Produto/Serviço</CardTitle>
                  <CardDescription>
                    Cadastre produtos para a IA oferecer aos clientes
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
                        placeholder="Ex: Serviços"
                        value={newProduct.category}
                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Descrição *</label>
                    <Textarea
                      placeholder="Descreva o produto..."
                      rows={3}
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Preço</label>
                      <Input
                        placeholder="Ex: R$ 1.500,00"
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
                    Nenhum produto cadastrado. Adicione produtos para a IA poder oferecê-los.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          {/* TAB 4: Links */}
          <TabsContent value="links">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Criar Link de Captura</CardTitle>
                  <CardDescription>
                    Gere links rastreáveis para cada campanha
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Nome da Campanha</label>
                      <Input
                        placeholder="Ex: Campanha Instagram"
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
                          <SelectItem value="website">Website</SelectItem>
                          <SelectItem value="facebook">Facebook</SelectItem>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="google-ads">Google Ads</SelectItem>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
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
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{link.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Código: {link.shortCode}
                            </p>
                          </div>
                          <Badge>{link.source}</Badge>
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
                    </CardContent>
                  </Card>
                ))}
              </div>

              {chatLinks.length === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Nenhum link criado. Crie links para rastrear de onde vêm seus leads.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminAI;
