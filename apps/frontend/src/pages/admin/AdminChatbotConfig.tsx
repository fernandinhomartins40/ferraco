/**
 * AdminChatbotConfig - Página de configuração do chatbot
 */

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bot,
  Building2,
  Package,
  HelpCircle,
  Share2,
  Save,
  Plus,
  Trash2,
  Copy,
  CheckCircle,
  AlertCircle,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  MessageCircle,
  Mail,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  features: string[];
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface ShareLink {
  id: string;
  name: string;
  platform: string;
  url: string;
}

export const AdminChatbotConfig = () => {
  // Estados para cada seção
  const [behavior, setBehavior] = useState({
    name: 'Ferraco Bot',
    greeting: 'Olá! 👋 Bem-vindo ao chat da Ferraco!\n\nSou o assistente virtual e estou aqui para ajudá-lo.',
    tone: 'friendly',
    captureLeads: true,
    requireEmail: true,
    requirePhone: true,
    autoResponse: true,
  });

  const [companyData, setCompanyData] = useState({
    name: 'Ferraco Equipamentos',
    description: 'Empresa especializada em equipamentos para pecuária leiteira',
    address: '',
    phone: '',
    email: '',
    website: '',
    workingHours: '',
  });

  const [products, setProducts] = useState<Product[]>([
    {
      id: '1',
      name: 'Bebedouro',
      description: 'Bebedouros automáticos de alta durabilidade',
      price: 'Sob consulta',
      features: ['Anti-corrosivo', 'Fácil instalação', 'Baixa manutenção'],
    },
  ]);

  const [faqs, setFaqs] = useState<FAQItem[]>([
    {
      id: '1',
      question: 'Qual o prazo de entrega?',
      answer: 'O prazo de entrega varia de acordo com a região e o produto.',
    },
  ]);

  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);

  const [activeTab, setActiveTab] = useState('behavior');
  const [copied, setCopied] = useState('');

  // Calcular progresso da configuração
  const calculateProgress = () => {
    let completed = 0;
    const total = 5;

    // Comportamento
    if (behavior.name && behavior.greeting) completed++;
    // Dados da empresa
    if (companyData.name && companyData.description) completed++;
    // Produtos
    if (products.length > 0) completed++;
    // FAQ
    if (faqs.length > 0) completed++;
    // Links (opcional)
    completed++; // Sempre conta como completo pois é opcional

    return (completed / total) * 100;
  };

  const progress = calculateProgress();

  // Funções para produtos
  const addProduct = () => {
    const newProduct: Product = {
      id: Date.now().toString(),
      name: '',
      description: '',
      price: '',
      features: [],
    };
    setProducts([...products, newProduct]);
  };

  const removeProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  const updateProduct = (id: string, field: string, value: any) => {
    setProducts(
      products.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  // Funções para FAQ
  const addFAQ = () => {
    const newFAQ: FAQItem = {
      id: Date.now().toString(),
      question: '',
      answer: '',
    };
    setFaqs([...faqs, newFAQ]);
  };

  const removeFAQ = (id: string) => {
    setFaqs(faqs.filter((f) => f.id !== id));
  };

  const updateFAQ = (id: string, field: string, value: string) => {
    setFaqs(faqs.map((f) => (f.id === id ? { ...f, [field]: value } : f)));
  };

  // Funções para links
  const addShareLink = () => {
    const newLink: ShareLink = {
      id: Date.now().toString(),
      name: '',
      platform: 'whatsapp',
      url: '',
    };
    setShareLinks([...shareLinks, newLink]);
  };

  const removeShareLink = (id: string) => {
    setShareLinks(shareLinks.filter((l) => l.id !== id));
  };

  const updateShareLink = (id: string, field: string, value: string) => {
    setShareLinks(
      shareLinks.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  };

  const generateShareLink = (link: ShareLink) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/chat?source=${link.platform}&campaign=${encodeURIComponent(link.name)}`;
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'whatsapp':
        return <MessageCircle className="h-4 w-4" />;
      case 'facebook':
        return <Facebook className="h-4 w-4" />;
      case 'instagram':
        return <Instagram className="h-4 w-4" />;
      case 'linkedin':
        return <Linkedin className="h-4 w-4" />;
      case 'twitter':
        return <Twitter className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      default:
        return <Share2 className="h-4 w-4" />;
    }
  };

  const handleSave = () => {
    // Aqui será implementada a lógica de salvamento no backend
    console.log('Salvando configurações...', {
      behavior,
      companyData,
      products,
      faqs,
      shareLinks,
    });
    alert('Configurações salvas com sucesso!\n\n(Dados serão persistidos após implementação do backend)');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bot className="h-8 w-8 text-primary" />
              Configuração do Chatbot
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure o comportamento e informações do assistente virtual
            </p>
          </div>

          <Button onClick={handleSave} size="lg" className="gap-2">
            <Save className="h-5 w-5" />
            Salvar Configurações
          </Button>
        </div>

        {/* Barra de Progresso */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Progresso da Configuração</CardTitle>
                <CardDescription>
                  {progress === 100 ? 'Configuração completa!' : 'Complete todas as seções para ativar o chatbot'}
                </CardDescription>
              </div>
              <Badge variant={progress === 100 ? 'default' : 'secondary'} className="text-lg px-4 py-2">
                {Math.round(progress)}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="h-3" />
            <div className="grid grid-cols-5 gap-2 mt-4">
              <div className="text-center">
                <div className={`text-xs ${behavior.name && behavior.greeting ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                  {behavior.name && behavior.greeting ? <CheckCircle className="h-4 w-4 mx-auto mb-1" /> : <AlertCircle className="h-4 w-4 mx-auto mb-1" />}
                  Comportamento
                </div>
              </div>
              <div className="text-center">
                <div className={`text-xs ${companyData.name && companyData.description ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                  {companyData.name && companyData.description ? <CheckCircle className="h-4 w-4 mx-auto mb-1" /> : <AlertCircle className="h-4 w-4 mx-auto mb-1" />}
                  Empresa
                </div>
              </div>
              <div className="text-center">
                <div className={`text-xs ${products.length > 0 ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                  {products.length > 0 ? <CheckCircle className="h-4 w-4 mx-auto mb-1" /> : <AlertCircle className="h-4 w-4 mx-auto mb-1" />}
                  Produtos
                </div>
              </div>
              <div className="text-center">
                <div className={`text-xs ${faqs.length > 0 ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                  {faqs.length > 0 ? <CheckCircle className="h-4 w-4 mx-auto mb-1" /> : <AlertCircle className="h-4 w-4 mx-auto mb-1" />}
                  FAQ
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-green-600 font-medium">
                  <CheckCircle className="h-4 w-4 mx-auto mb-1" />
                  Links
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Aviso sobre backend */}
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Interface de configuração:</strong> Os dados serão salvos localmente até a implementação do backend.
            A lógica do chatbot será implementada posteriormente utilizando estas configurações.
          </AlertDescription>
        </Alert>

        {/* Tabs de Configuração */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="behavior" className="gap-2">
              <Bot className="h-4 w-4" />
              Comportamento
            </TabsTrigger>
            <TabsTrigger value="company" className="gap-2">
              <Building2 className="h-4 w-4" />
              Empresa
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" />
              Produtos
            </TabsTrigger>
            <TabsTrigger value="faq" className="gap-2">
              <HelpCircle className="h-4 w-4" />
              FAQ
            </TabsTrigger>
            <TabsTrigger value="links" className="gap-2">
              <Share2 className="h-4 w-4" />
              Links
            </TabsTrigger>
          </TabsList>

          {/* ABA 1: Comportamento */}
          <TabsContent value="behavior" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Comportamento do Chatbot</CardTitle>
                <CardDescription>
                  Configure como o chatbot deve se comportar nas conversas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="bot-name">Nome do Chatbot</Label>
                  <Input
                    id="bot-name"
                    value={behavior.name}
                    onChange={(e) => setBehavior({ ...behavior, name: e.target.value })}
                    placeholder="Ex: Ferraco Bot"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="greeting">Mensagem de Boas-vindas</Label>
                  <Textarea
                    id="greeting"
                    value={behavior.greeting}
                    onChange={(e) => setBehavior({ ...behavior, greeting: e.target.value })}
                    placeholder="Digite a mensagem que o bot enviará ao iniciar a conversa..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Esta será a primeira mensagem que o usuário receberá ao abrir o chat
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tone">Tom de Voz</Label>
                  <Select value={behavior.tone} onValueChange={(value) => setBehavior({ ...behavior, tone: value })}>
                    <SelectTrigger id="tone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Profissional</SelectItem>
                      <SelectItem value="friendly">Amigável</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold">Captação de Leads</h3>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="capture-leads">Capturar informações de contato</Label>
                      <p className="text-sm text-muted-foreground">
                        Solicitar dados do usuário durante a conversa
                      </p>
                    </div>
                    <Switch
                      id="capture-leads"
                      checked={behavior.captureLeads}
                      onCheckedChange={(checked) => setBehavior({ ...behavior, captureLeads: checked })}
                    />
                  </div>

                  {behavior.captureLeads && (
                    <>
                      <div className="flex items-center justify-between pl-6">
                        <Label htmlFor="require-email">Solicitar e-mail</Label>
                        <Switch
                          id="require-email"
                          checked={behavior.requireEmail}
                          onCheckedChange={(checked) => setBehavior({ ...behavior, requireEmail: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between pl-6">
                        <Label htmlFor="require-phone">Solicitar telefone</Label>
                        <Switch
                          id="require-phone"
                          checked={behavior.requirePhone}
                          onCheckedChange={(checked) => setBehavior({ ...behavior, requirePhone: checked })}
                        />
                      </div>
                    </>
                  )}
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-response">Respostas Automáticas</Label>
                    <p className="text-sm text-muted-foreground">
                      Usar IA para responder perguntas automaticamente
                    </p>
                  </div>
                  <Switch
                    id="auto-response"
                    checked={behavior.autoResponse}
                    onCheckedChange={(checked) => setBehavior({ ...behavior, autoResponse: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA 2: Dados da Empresa */}
          <TabsContent value="company" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Empresa</CardTitle>
                <CardDescription>
                  Dados que o chatbot utilizará para responder sobre a empresa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Nome da Empresa *</Label>
                    <Input
                      id="company-name"
                      value={companyData.name}
                      onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                      placeholder="Ex: Ferraco Equipamentos"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company-website">Website</Label>
                    <Input
                      id="company-website"
                      value={companyData.website}
                      onChange={(e) => setCompanyData({ ...companyData, website: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-description">Descrição da Empresa *</Label>
                  <Textarea
                    id="company-description"
                    value={companyData.description}
                    onChange={(e) => setCompanyData({ ...companyData, description: e.target.value })}
                    placeholder="Descreva a empresa, seus produtos e diferenciais..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-phone">Telefone</Label>
                    <Input
                      id="company-phone"
                      value={companyData.phone}
                      onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company-email">E-mail</Label>
                    <Input
                      id="company-email"
                      type="email"
                      value={companyData.email}
                      onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                      placeholder="contato@empresa.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-address">Endereço</Label>
                  <Input
                    id="company-address"
                    value={companyData.address}
                    onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                    placeholder="Rua, número, bairro, cidade - UF"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="working-hours">Horário de Atendimento</Label>
                  <Input
                    id="working-hours"
                    value={companyData.workingHours}
                    onChange={(e) => setCompanyData({ ...companyData, workingHours: e.target.value })}
                    placeholder="Ex: Segunda a Sexta, 8h às 18h"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA 3: Produtos */}
          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Produtos e Serviços</CardTitle>
                    <CardDescription>
                      Cadastre os produtos que o chatbot pode apresentar aos clientes
                    </CardDescription>
                  </div>
                  <Button onClick={addProduct} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar Produto
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {products.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum produto cadastrado</p>
                    <p className="text-sm">Clique em "Adicionar Produto" para começar</p>
                  </div>
                ) : (
                  products.map((product, index) => (
                    <Card key={product.id} className="border-2">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Produto {index + 1}</CardTitle>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeProduct(product.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Nome do Produto *</Label>
                            <Input
                              value={product.name}
                              onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                              placeholder="Ex: Bebedouro Automático"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Preço</Label>
                            <Input
                              value={product.price}
                              onChange={(e) => updateProduct(product.id, 'price', e.target.value)}
                              placeholder="Ex: R$ 1.200,00 ou Sob consulta"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Descrição *</Label>
                          <Textarea
                            value={product.description}
                            onChange={(e) => updateProduct(product.id, 'description', e.target.value)}
                            placeholder="Descreva o produto..."
                            rows={3}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Características (uma por linha)</Label>
                          <Textarea
                            value={product.features.join('\n')}
                            onChange={(e) =>
                              updateProduct(product.id, 'features', e.target.value.split('\n').filter(f => f.trim()))
                            }
                            placeholder="Material resistente&#10;Fácil instalação&#10;Garantia de 2 anos"
                            rows={3}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA 4: FAQ */}
          <TabsContent value="faq" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Perguntas Frequentes (FAQ)</CardTitle>
                    <CardDescription>
                      Cadastre perguntas e respostas para o chatbot usar
                    </CardDescription>
                  </div>
                  <Button onClick={addFAQ} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar Pergunta
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {faqs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <HelpCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma pergunta cadastrada</p>
                    <p className="text-sm">Clique em "Adicionar Pergunta" para começar</p>
                  </div>
                ) : (
                  faqs.map((faq, index) => (
                    <Card key={faq.id} className="border-2">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Pergunta {index + 1}</CardTitle>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFAQ(faq.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>Pergunta *</Label>
                          <Input
                            value={faq.question}
                            onChange={(e) => updateFAQ(faq.id, 'question', e.target.value)}
                            placeholder="Ex: Qual o prazo de entrega?"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Resposta *</Label>
                          <Textarea
                            value={faq.answer}
                            onChange={(e) => updateFAQ(faq.id, 'answer', e.target.value)}
                            placeholder="Digite a resposta completa..."
                            rows={4}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA 5: Links de Compartilhamento */}
          <TabsContent value="links" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Links de Compartilhamento</CardTitle>
                    <CardDescription>
                      Gere links personalizados para rastrear a origem dos leads
                    </CardDescription>
                  </div>
                  <Button onClick={addShareLink} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Criar Link
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {shareLinks.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Share2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum link criado</p>
                    <p className="text-sm">Clique em "Criar Link" para começar</p>
                  </div>
                ) : (
                  shareLinks.map((link) => (
                    <Card key={link.id} className="border-2">
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex items-start gap-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeShareLink(link.id)}
                            className="text-destructive hover:text-destructive flex-shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>

                          <div className="flex-1 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Nome da Campanha *</Label>
                                <Input
                                  value={link.name}
                                  onChange={(e) => updateShareLink(link.id, 'name', e.target.value)}
                                  placeholder="Ex: Promoção Black Friday"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Rede Social / Origem *</Label>
                                <Select
                                  value={link.platform}
                                  onValueChange={(value) => updateShareLink(link.id, 'platform', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="whatsapp">
                                      <div className="flex items-center gap-2">
                                        <MessageCircle className="h-4 w-4" />
                                        WhatsApp
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="facebook">
                                      <div className="flex items-center gap-2">
                                        <Facebook className="h-4 w-4" />
                                        Facebook
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="instagram">
                                      <div className="flex items-center gap-2">
                                        <Instagram className="h-4 w-4" />
                                        Instagram
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="linkedin">
                                      <div className="flex items-center gap-2">
                                        <Linkedin className="h-4 w-4" />
                                        LinkedIn
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="twitter">
                                      <div className="flex items-center gap-2">
                                        <Twitter className="h-4 w-4" />
                                        Twitter
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="email">
                                      <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        E-mail
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {link.name && (
                              <div className="space-y-2">
                                <Label>Link Gerado</Label>
                                <div className="flex gap-2">
                                  <Input
                                    value={generateShareLink(link)}
                                    readOnly
                                    className="font-mono text-sm"
                                  />
                                  <Button
                                    variant="outline"
                                    onClick={() => copyToClipboard(generateShareLink(link), link.id)}
                                    className="gap-2"
                                  >
                                    {copied === link.id ? (
                                      <>
                                        <CheckCircle className="h-4 w-4" />
                                        Copiado!
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="h-4 w-4" />
                                        Copiar
                                      </>
                                    )}
                                  </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Compartilhe este link em {link.platform} para rastrear leads desta origem
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer com botão de salvar */}
        <Card className="sticky bottom-4 shadow-lg border-2">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {progress === 100 ? (
                  <span className="text-green-600 font-medium flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Configuração completa! Pronto para salvar.
                  </span>
                ) : (
                  <span>
                    Complete todas as seções obrigatórias para ativar o chatbot
                  </span>
                )}
              </div>
              <Button onClick={handleSave} size="lg" className="gap-2">
                <Save className="h-5 w-5" />
                Salvar Todas as Configurações
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminChatbotConfig;
