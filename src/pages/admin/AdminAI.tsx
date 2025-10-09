/**
 * Admin AI - Painel Simplificado para Configuração do Chatbot
 * SEM dependências de APIs externas
 */

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
  Eye,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { configApi, CompanyData, Product, ChatbotConfig as AIConfig, ChatLink, FAQItem } from '@/utils/configApiClient';

const generateShortCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const AdminAI = () => {
  const [companyData, setCompanyData] = useState<CompanyData>({
    name: '',
    industry: '',
    description: '',
    differentials: [],
    targetAudience: '',
    location: '',
    workingHours: '',
    phone: '',
    website: ''
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [aiConfig, setAIConfig] = useState<AIConfig>({
    isEnabled: false,
    welcomeMessage: '',
    fallbackMessage: '',
    handoffTriggers: []
  });
  const [chatLinks, setChatLinks] = useState<ChatLink[]>([]);
  const [faqs, setFAQs] = useState<FAQItem[]>([]);
  const [progress, setProgress] = useState({ percentage: 0, steps: [] });

  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    keywords: '',
    benefits: '',
  });

  const [newLink, setNewLink] = useState({
    name: '',
    source: 'website' as ChatLink['source'],
  });

  const [newFAQ, setNewFAQ] = useState({
    question: '',
    answer: '',
    category: 'Geral',
    keywords: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [company, prods, config, links, faqItems] = await Promise.all([
        configApi.getCompanyData(),
        configApi.getProducts(),
        configApi.getChatbotConfig(),
        configApi.getChatLinks(),
        configApi.getFAQs()
      ]);

      // CompanyData com fallback
      setCompanyData(company || {
        name: '',
        industry: '',
        description: '',
        differentials: [],
        targetAudience: '',
        location: '',
        workingHours: '',
        phone: '',
        website: ''
      });

      setProducts(prods);

      // ChatbotConfig com parse seguro de handoffTriggers
      if (config) {
        setAIConfig({
          ...config,
          handoffTriggers: Array.isArray(config.handoffTriggers)
            ? config.handoffTriggers
            : JSON.parse(config.handoffTriggers || '[]')
        });
      } else {
        setAIConfig({
          isEnabled: false,
          welcomeMessage: '',
          fallbackMessage: '',
          handoffTriggers: []
        });
      }

      setChatLinks(links);
      setFAQs(faqItems);

      // Calcular progresso manualmente
      calculateProgress(company, prods, faqItems, config);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar configurações');
    }
  };

  const calculateProgress = (company: any, prods: any[], faqs: any[], config: any) => {
    const steps: any[] = [];
    let completed = 0;

    if (company?.name) {
      completed++;
      steps.push({ name: 'Empresa', done: true });
    } else {
      steps.push({ name: 'Empresa', done: false });
    }

    if (prods && prods.length > 0) {
      completed++;
      steps.push({ name: 'Produtos', done: true });
    } else {
      steps.push({ name: 'Produtos', done: false });
    }

    if (faqs && faqs.length > 0) {
      completed++;
      steps.push({ name: 'FAQs', done: true });
    } else {
      steps.push({ name: 'FAQs', done: false });
    }

    if (config?.welcomeMessage) {
      completed++;
      steps.push({ name: 'Comportamento', done: true });
    } else {
      steps.push({ name: 'Comportamento', done: false });
    }

    setProgress({ percentage: (completed / 4) * 100, steps });
  };

  const handleSaveCompany = async () => {
    if (!companyData.name || !companyData.industry || !companyData.description) {
      toast.error('Preencha os campos obrigatórios: Nome, Ramo e Descrição');
      return;
    }

    try {
      await configApi.saveCompanyData(companyData);
      toast.success('Dados da empresa salvos no banco de dados!');
      loadData();
    } catch (error) {
      console.error('Erro ao salvar empresa:', error);
      toast.error('Erro ao salvar dados da empresa');
    }
  };

  const handleSaveAIConfig = async () => {
    if (!aiConfig) return;

    try {
      await configApi.saveChatbotConfig(aiConfig);
      toast.success('Configuração salva no banco de dados!');
      loadData();
    } catch (error) {
      console.error('Erro ao salvar config:', error);
      toast.error('Erro ao salvar configuração');
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.description) {
      toast.error('Preencha nome e descrição do produto');
      return;
    }

    const keywords = newProduct.keywords
      ? newProduct.keywords.split(',').map(k => k.trim()).filter(k => k)
      : [];

    const benefits = newProduct.benefits
      ? newProduct.benefits.split(',').map(b => b.trim()).filter(b => b)
      : [];

    try {
      await configApi.createProduct({
        name: newProduct.name,
        description: newProduct.description,
        category: newProduct.category || 'Geral',
        price: newProduct.price,
        keywords,
        benefits,
        isActive: true,
      });

      setNewProduct({ name: '', description: '', category: '', price: '', keywords: '', benefits: '' });
      toast.success('Produto adicionado no banco de dados!');
      loadData();
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      toast.error('Erro ao adicionar produto');
    }
  };

  const handleAddLink = async () => {
    if (!newLink.name) {
      toast.error('Digite um nome para o link');
      return;
    }

    const shortCode = generateShortCode();
    const fullUrl = `${window.location.origin}/chat/${shortCode}`;

    try {
      await configApi.createChatLink({
        name: newLink.name,
        source: newLink.source,
        url: fullUrl,
        shortCode,
        isActive: true,
      });

      setNewLink({ name: '', source: 'website' });
      toast.success('Link criado no banco de dados!');
      loadData();
    } catch (error) {
      console.error('Erro ao criar link:', error);
      toast.error('Erro ao criar link');
    }
  };

  const handleAddFAQ = async () => {
    if (!newFAQ.question || !newFAQ.answer) {
      toast.error('Preencha pergunta e resposta');
      return;
    }

    const keywords = newFAQ.keywords
      ? newFAQ.keywords.split(',').map(k => k.trim()).filter(k => k)
      : [];

    try {
      await configApi.createFAQ({
        question: newFAQ.question,
        answer: newFAQ.answer,
        category: newFAQ.category,
        keywords
      });

      setNewFAQ({ question: '', answer: '', category: 'Geral', keywords: '' });
      toast.success('FAQ adicionado no banco de dados!');
      loadData();
    } catch (error) {
      console.error('Erro ao adicionar FAQ:', error);
      toast.error('Erro ao adicionar FAQ');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Link copiado!');
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8 text-blue-600" />
            Configuração do Chatbot Inteligente
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure o comportamento e conhecimento do seu assistente virtual
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Progresso da Configuração
              <Badge variant={progress.percentage === 100 ? 'default' : 'secondary'}>
                {progress.percentage}%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={progress.percentage} className="mb-4" />
          </CardContent>
        </Card>

        <Tabs defaultValue="config" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="config">
              <Bot className="h-4 w-4 mr-2" />
              Comportamento
            </TabsTrigger>
            <TabsTrigger value="company">
              <Building2 className="h-4 w-4 mr-2" />
              Empresa
            </TabsTrigger>
            <TabsTrigger value="products">
              <Package className="h-4 w-4 mr-2" />
              Produtos
            </TabsTrigger>
            <TabsTrigger value="faqs">
              <AlertCircle className="h-4 w-4 mr-2" />
              FAQs
            </TabsTrigger>
            <TabsTrigger value="links">
              <LinkIcon className="h-4 w-4 mr-2" />
              Links
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Comportamento */}
          <TabsContent value="config">
            <Card>
              <CardHeader>
                <CardTitle>Personalidade da IA</CardTitle>
                <CardDescription>
                  Configure como o chatbot se comporta nas conversas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Mensagem de Boas-vindas</label>
                  <Textarea
                    value={aiConfig?.welcomeMessage || ''}
                    onChange={(e) =>
                      setAIConfig({ ...aiConfig!, welcomeMessage: e.target.value })
                    }
                    rows={3}
                    placeholder="Olá! 👋 Bem-vindo(a)..."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Mensagem de Fallback</label>
                  <Textarea
                    value={aiConfig?.fallbackMessage || ''}
                    onChange={(e) =>
                      setAIConfig({ ...aiConfig!, fallbackMessage: e.target.value })
                    }
                    rows={2}
                    placeholder="Desculpe, não entendi. Pode reformular?"
                  />
                </div>

                <Button onClick={handleSaveAIConfig} className="w-full">
                  <Check className="h-4 w-4 mr-2" />
                  Salvar Configuração
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: Empresa */}
          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Empresa</CardTitle>
                <CardDescription>
                  Dados que o chatbot usará para responder perguntas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Nome da Empresa *</label>
                    <Input
                      value={companyData?.name || ''}
                      onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                      placeholder="Empresa XYZ"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Ramo de Atividade *</label>
                    <Input
                      value={companyData?.industry || ''}
                      onChange={(e) => setCompanyData({ ...companyData, industry: e.target.value })}
                      placeholder="Ex: Metalurgia, Agropecuária..."
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Descrição *</label>
                  <Textarea
                    value={companyData?.description || ''}
                    onChange={(e) => setCompanyData({ ...companyData, description: e.target.value })}
                    rows={3}
                    placeholder="Breve descrição da empresa..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Localização</label>
                    <Input
                      value={companyData?.location || ''}
                      onChange={(e) => setCompanyData({ ...companyData, location: e.target.value })}
                      placeholder="Cidade, Estado"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Telefone</label>
                    <Input
                      value={companyData?.phone || ''}
                      onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                      placeholder="(00) 0000-0000"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Horário de Atendimento</label>
                  <Input
                    value={companyData?.workingHours || ''}
                    onChange={(e) => setCompanyData({ ...companyData, workingHours: e.target.value })}
                    placeholder="Segunda a Sexta, 8h às 18h"
                  />
                </div>

                <Button onClick={handleSaveCompany} className="w-full">
                  <Check className="h-4 w-4 mr-2" />
                  Salvar Dados da Empresa
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: Produtos */}
          <TabsContent value="products">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Adicionar Produto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Nome *</label>
                      <Input
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        placeholder="Ex: Portão Automático"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Categoria</label>
                      <Input
                        value={newProduct.category}
                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                        placeholder="Ex: Portões"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Descrição *</label>
                    <Textarea
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      rows={2}
                      placeholder="Descrição do produto..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Preço</label>
                      <Input
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                        placeholder="R$ 1.200 ou sob consulta"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Keywords (separadas por vírgula)</label>
                      <Input
                        value={newProduct.keywords}
                        onChange={(e) => setNewProduct({ ...newProduct, keywords: e.target.value })}
                        placeholder="portão, automático, ferro"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Benefícios (separados por vírgula)</label>
                    <Textarea
                      value={newProduct.benefits}
                      onChange={(e) => setNewProduct({ ...newProduct, benefits: e.target.value })}
                      rows={2}
                      placeholder="Durabilidade, Segurança, Garantia de 5 anos"
                    />
                  </div>

                  <Button onClick={handleAddProduct} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Produto
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Produtos Cadastrados ({products.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {products.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhum produto cadastrado
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {products.map(product => (
                        <div key={product.id} className="p-4 border rounded-lg space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">{product.name}</h4>
                              <p className="text-sm text-muted-foreground">{product.category} {product.price && `• ${product.price}`}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await configApi.deleteProduct(product.id!);
                                  loadData();
                                  toast.success('Produto removido do banco de dados');
                                } catch (error) {
                                  toast.error('Erro ao remover produto');
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-sm">{product.description}</p>
                          {product.keywords && product.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {product.keywords.map((keyword, idx) => (
                                <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          )}
                          {product.benefits && product.benefits.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-green-700">Benefícios:</p>
                              <ul className="text-xs space-y-1">
                                {product.benefits.map((benefit, idx) => (
                                  <li key={idx} className="text-muted-foreground">• {benefit}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 4: FAQs */}
          <TabsContent value="faqs">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Adicionar FAQ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Pergunta *</label>
                    <Input
                      value={newFAQ.question}
                      onChange={(e) => setNewFAQ({ ...newFAQ, question: e.target.value })}
                      placeholder="Ex: Qual o horário de atendimento?"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Resposta *</label>
                    <Textarea
                      value={newFAQ.answer}
                      onChange={(e) => setNewFAQ({ ...newFAQ, answer: e.target.value })}
                      rows={3}
                      placeholder="Resposta..."
                    />
                  </div>

                  <Button onClick={handleAddFAQ} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar FAQ
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>FAQs Cadastrados ({faqs.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {faqs.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhum FAQ cadastrado
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {faqs.map(faq => (
                        <div key={faq.id} className="p-4 border rounded-lg space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-base">{faq.question}</h4>
                              <p className="text-xs text-muted-foreground">{faq.category}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await configApi.deleteFAQ(faq.id!);
                                  loadData();
                                  toast.success('FAQ removido do banco de dados');
                                } catch (error) {
                                  toast.error('Erro ao remover FAQ');
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-sm">{faq.answer}</p>
                          {faq.keywords && faq.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {faq.keywords.map((keyword, idx) => (
                                <span key={idx} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 5: Links */}
          <TabsContent value="links">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Criar Link de Campanha</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Nome da Campanha</label>
                    <Input
                      value={newLink.name}
                      onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
                      placeholder="Ex: Facebook Ads Janeiro"
                    />
                  </div>

                  <Button onClick={handleAddLink} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Link
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Links de Campanha ({chatLinks.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {chatLinks.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhum link criado
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {chatLinks.map(link => (
                        <div key={link.id} className="p-4 border rounded space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{link.name}</h4>
                            <div className="flex gap-2">
                              <Badge variant="outline">
                                <Eye className="h-3 w-3 mr-1" />
                                {link.clicks}
                              </Badge>
                              <Badge variant="outline">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                {link.leads}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Input value={link.url} readOnly className="text-sm" />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(link.url)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminAI;
