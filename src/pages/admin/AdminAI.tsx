/**
 * Admin AI - Configuração do Chatbot Inteligente
 * Versão 2.0 - Reescrita profissional do zero
 */

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Building2, Package, MessageSquare, Settings, Trash2, Plus } from 'lucide-react';
import { configApi, type CompanyData, type Product, type FAQItem, type ChatbotConfig } from '@/utils/configApiClient';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminAI() {
  // ==========================================
  // STATE
  // ==========================================
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dados
  const [company, setCompany] = useState<CompanyData>({
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
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [config, setConfig] = useState<ChatbotConfig>({
    isEnabled: false,
    welcomeMessage: '',
    fallbackMessage: '',
    handoffTriggers: []
  });

  // Forms de novo item
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    keywords: '',
    benefits: ''
  });

  const [newFaq, setNewFaq] = useState({
    question: '',
    answer: '',
    category: 'Geral',
    keywords: ''
  });

  // Progresso
  const [progress, setProgress] = useState({ percentage: 0, steps: [] as any[] });

  // ==========================================
  // LOAD DATA
  // ==========================================
  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    try {
      setLoading(true);

      const [companyData, productsData, faqsData, configData] = await Promise.all([
        configApi.getCompanyData(),
        configApi.getProducts(),
        configApi.getFAQs(),
        configApi.getChatbotConfig()
      ]);

      if (companyData) setCompany(companyData);
      if (productsData) setProducts(productsData);
      if (faqsData) setFaqs(faqsData);
      if (configData) {
        setConfig({
          ...configData,
          handoffTriggers: Array.isArray(configData.handoffTriggers)
            ? configData.handoffTriggers
            : []
        });
      }

      calculateProgress(companyData, productsData, faqsData, configData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // CALCULATE PROGRESS
  // ==========================================
  function calculateProgress(
    companyData: CompanyData | null,
    productsData: Product[],
    faqsData: FAQItem[],
    configData: ChatbotConfig | null
  ) {
    const steps = [];
    let completed = 0;

    if (companyData?.name) {
      completed++;
      steps.push({ name: 'Empresa', done: true });
    } else {
      steps.push({ name: 'Empresa', done: false });
    }

    if (productsData && productsData.length > 0) {
      completed++;
      steps.push({ name: 'Produtos', done: true });
    } else {
      steps.push({ name: 'Produtos', done: false });
    }

    if (faqsData && faqsData.length > 0) {
      completed++;
      steps.push({ name: 'FAQs', done: true });
    } else {
      steps.push({ name: 'FAQs', done: false });
    }

    if (configData?.welcomeMessage) {
      completed++;
      steps.push({ name: 'Comportamento', done: true });
    } else {
      steps.push({ name: 'Comportamento', done: false });
    }

    setProgress({ percentage: (completed / 4) * 100, steps });
  }

  // ==========================================
  // COMPANY ACTIONS
  // ==========================================
  async function saveCompany() {
    if (!company.name || !company.industry || !company.description) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    try {
      setSaving(true);
      await configApi.saveCompanyData(company);
      toast.success('Dados salvos com sucesso!');
      await loadAllData();
    } catch (error) {
      toast.error('Erro ao salvar dados');
    } finally {
      setSaving(false);
    }
  }

  // ==========================================
  // PRODUCT ACTIONS
  // ==========================================
  async function addProduct() {
    if (!newProduct.name || !newProduct.description) {
      toast.error('Preencha nome e descrição');
      return;
    }

    try {
      await configApi.createProduct({
        name: newProduct.name,
        description: newProduct.description,
        category: newProduct.category || 'Geral',
        price: newProduct.price,
        keywords: newProduct.keywords.split(',').map(k => k.trim()).filter(Boolean),
        benefits: newProduct.benefits.split(',').map(b => b.trim()).filter(Boolean),
        isActive: true
      });

      setNewProduct({ name: '', description: '', category: '', price: '', keywords: '', benefits: '' });
      toast.success('Produto adicionado!');
      await loadAllData();
    } catch (error) {
      toast.error('Erro ao adicionar produto');
    }
  }

  async function deleteProduct(id: string) {
    try {
      await configApi.deleteProduct(id);
      toast.success('Produto removido!');
      await loadAllData();
    } catch (error) {
      toast.error('Erro ao remover produto');
    }
  }

  // ==========================================
  // FAQ ACTIONS
  // ==========================================
  async function addFaq() {
    if (!newFaq.question || !newFaq.answer) {
      toast.error('Preencha pergunta e resposta');
      return;
    }

    try {
      await configApi.createFAQ({
        question: newFaq.question,
        answer: newFaq.answer,
        category: newFaq.category,
        keywords: newFaq.keywords.split(',').map(k => k.trim()).filter(Boolean)
      });

      setNewFaq({ question: '', answer: '', category: 'Geral', keywords: '' });
      toast.success('FAQ adicionado!');
      await loadAllData();
    } catch (error) {
      toast.error('Erro ao adicionar FAQ');
    }
  }

  async function deleteFaq(id: string) {
    try {
      await configApi.deleteFAQ(id);
      toast.success('FAQ removido!');
      await loadAllData();
    } catch (error) {
      toast.error('Erro ao remover FAQ');
    }
  }

  // ==========================================
  // CONFIG ACTIONS
  // ==========================================
  async function saveConfig() {
    if (!config.welcomeMessage || !config.fallbackMessage) {
      toast.error('Preencha as mensagens obrigatórias');
      return;
    }

    try {
      setSaving(true);
      await configApi.saveChatbotConfig(config);
      toast.success('Configuração salva com sucesso!');
      await loadAllData();
    } catch (error) {
      toast.error('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  }

  // ==========================================
  // RENDER
  // ==========================================
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Configuração do Chatbot IA</h1>
        <p className="text-muted-foreground">Configure o comportamento e conhecimento da IA</p>
      </div>

      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Progresso da Configuração</CardTitle>
          <CardDescription>{progress.percentage.toFixed(0)}% completo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-secondary rounded-full h-2 mb-4">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <div className="flex gap-4">
            {progress.steps.map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${step.done ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-sm">{step.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="empresa" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="empresa">
            <Building2 className="h-4 w-4 mr-2" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="produtos">
            <Package className="h-4 w-4 mr-2" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="faqs">
            <MessageSquare className="h-4 w-4 mr-2" />
            FAQs
          </TabsTrigger>
          <TabsTrigger value="comportamento">
            <Settings className="h-4 w-4 mr-2" />
            Comportamento
          </TabsTrigger>
        </TabsList>

        {/* ABA EMPRESA */}
        <TabsContent value="empresa">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Empresa</CardTitle>
              <CardDescription>Informações básicas sobre sua empresa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome da Empresa *</Label>
                  <Input
                    value={company.name}
                    onChange={e => setCompany({ ...company, name: e.target.value })}
                    placeholder="Ex: Ferraco Indústria"
                  />
                </div>
                <div>
                  <Label>Ramo de Atividade *</Label>
                  <Input
                    value={company.industry}
                    onChange={e => setCompany({ ...company, industry: e.target.value })}
                    placeholder="Ex: Metalurgia"
                  />
                </div>
              </div>

              <div>
                <Label>Descrição *</Label>
                <Textarea
                  value={company.description}
                  onChange={e => setCompany({ ...company, description: e.target.value })}
                  placeholder="Descreva o que sua empresa faz..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Localização</Label>
                  <Input
                    value={company.location}
                    onChange={e => setCompany({ ...company, location: e.target.value })}
                    placeholder="Ex: São Paulo, SP"
                  />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={company.phone || ''}
                    onChange={e => setCompany({ ...company, phone: e.target.value })}
                    placeholder="Ex: (11) 99999-9999"
                  />
                </div>
              </div>

              <Button onClick={saveCompany} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Salvar Dados da Empresa
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA PRODUTOS */}
        <TabsContent value="produtos">
          <Card>
            <CardHeader>
              <CardTitle>Cadastro de Produtos</CardTitle>
              <CardDescription>Produtos e serviços oferecidos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Form novo produto */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold">Adicionar Novo Produto</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Nome do produto *"
                    value={newProduct.name}
                    onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                  />
                  <Input
                    placeholder="Categoria"
                    value={newProduct.category}
                    onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                  />
                </div>
                <Textarea
                  placeholder="Descrição *"
                  value={newProduct.description}
                  onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                  rows={3}
                />
                <Button onClick={addProduct} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Produto
                </Button>
              </div>

              {/* Lista de produtos */}
              <div className="space-y-2">
                <h3 className="font-semibold">Produtos Cadastrados ({products.length})</h3>
                {products.map(product => (
                  <div key={product.id} className="border rounded-lg p-4 flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold">{product.name}</h4>
                      <p className="text-sm text-muted-foreground">{product.category}</p>
                      <p className="text-sm mt-2">{product.description}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => product.id && deleteProduct(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA FAQs */}
        <TabsContent value="faqs">
          <Card>
            <CardHeader>
              <CardTitle>Perguntas Frequentes</CardTitle>
              <CardDescription>Respostas automáticas para dúvidas comuns</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Form novo FAQ */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold">Adicionar Nova FAQ</h3>
                <Input
                  placeholder="Pergunta *"
                  value={newFaq.question}
                  onChange={e => setNewFaq({ ...newFaq, question: e.target.value })}
                />
                <Textarea
                  placeholder="Resposta *"
                  value={newFaq.answer}
                  onChange={e => setNewFaq({ ...newFaq, answer: e.target.value })}
                  rows={3}
                />
                <Button onClick={addFaq} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar FAQ
                </Button>
              </div>

              {/* Lista de FAQs */}
              <div className="space-y-2">
                <h3 className="font-semibold">FAQs Cadastradas ({faqs.length})</h3>
                {faqs.map(faq => (
                  <div key={faq.id} className="border rounded-lg p-4 flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold">{faq.question}</h4>
                      <p className="text-sm text-muted-foreground mt-2">{faq.answer}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => faq.id && deleteFaq(faq.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA COMPORTAMENTO */}
        <TabsContent value="comportamento">
          <Card>
            <CardHeader>
              <CardTitle>Comportamento da IA</CardTitle>
              <CardDescription>Configure as mensagens e personalidade do chatbot</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Mensagem de Boas-vindas *</Label>
                <Textarea
                  value={config.welcomeMessage}
                  onChange={e => setConfig({ ...config, welcomeMessage: e.target.value })}
                  placeholder="Olá! Como posso ajudar você hoje?"
                  rows={3}
                />
              </div>

              <div>
                <Label>Mensagem de Fallback *</Label>
                <Textarea
                  value={config.fallbackMessage}
                  onChange={e => setConfig({ ...config, fallbackMessage: e.target.value })}
                  placeholder="Desculpe, não entendi. Pode reformular?"
                  rows={3}
                />
              </div>

              <Button onClick={saveConfig} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Salvar Configuração
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </AdminLayout>
  );
}
