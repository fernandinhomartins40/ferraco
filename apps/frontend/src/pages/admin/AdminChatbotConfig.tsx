/**
 * AdminChatbotConfig - Página de configuração do chatbot COM PERSISTÊNCIA NO BACKEND
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { VariableInserter, DEFAULT_LEAD_VARIABLES, PRODUCT_VARIABLES, type Variable } from '@/components/ui/variable-inserter';
import { useVariableInsertion } from '@/hooks/useVariableInsertion';
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
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { chatbotService, type Product, type FAQItem, type ShareLink } from '@/services/chatbot.service';
import { uploadService } from '@/services/upload.service';
import { ImageCropModal } from '@/components/ImageCropModal';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export const AdminChatbotConfig = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Estados temporários para edição (sincronizados com o backend)
  const [behavior, setBehavior] = useState({
    name: '',
    greeting: '',
    tone: 'friendly',
    captureLeads: true,
    requireEmail: true,
    requirePhone: true,
    autoResponse: true,
  });

  const [companyData, setCompanyData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    workingHours: '',
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [whatsappTemplates, setWhatsappTemplates] = useState({
    initial: '',
    product: '',
    final: ''
  });
  const [activeTab, setActiveTab] = useState('behavior');
  const [copied, setCopied] = useState('');
  const [uploadingImages, setUploadingImages] = useState<{ [key: string]: boolean }>({});
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState('');
  const [currentProductId, setCurrentProductId] = useState<string>('');

  // Estados para controlar expansão de cards
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});
  const [expandedFaqs, setExpandedFaqs] = useState<Record<string, boolean>>({});

  // Variable Insertion Hooks - um para cada template WhatsApp
  const initialTemplateInsertion = useVariableInsertion();
  const productTemplateInsertion = useVariableInsertion();
  const finalTemplateInsertion = useVariableInsertion();

  // Variáveis customizadas para templates WhatsApp
  const WHATSAPP_LEAD_VARIABLES: Variable[] = [
    { key: 'lead.name', label: 'Nome do Lead', description: 'Nome do lead/cliente' },
  ];

  const WHATSAPP_PRODUCT_VARIABLES: Variable[] = [
    { key: 'product.name', label: 'Nome do Produto', description: 'Nome do produto' },
    { key: 'product.description', label: 'Descrição', description: 'Descrição do produto' },
    { key: 'product.price', label: 'Preço', description: 'Preço do produto' },
  ];

  const WHATSAPP_COMPANY_VARIABLES: Variable[] = [
    { key: 'company.name', label: 'Nome da Empresa', description: 'Nome da empresa' },
    { key: 'company.phone', label: 'Telefone', description: 'Telefone da empresa' },
    { key: 'products.count', label: 'Qtd Produtos', description: 'Quantidade de produtos' },
  ];

  // Buscar configuração do backend
  const { data: config, isLoading } = useQuery({
    queryKey: ['chatbot-config'],
    queryFn: chatbotService.getConfig,
  });

  // Sincronizar estado local com dados do backend quando carregarem
  useEffect(() => {
    if (config) {
      setBehavior(config.behavior);
      setCompanyData(config.companyData);
      setProducts(config.products);
      setFaqs(config.faqs);
      setShareLinks(config.shareLinks);

      // Templates WhatsApp com valores padrão
      const defaultTemplates = {
        initial: 'Olá {{lead.name}}! 👋\n\nConforme nossa conversa no site, seguem mais informações sobre o(s) produto(s) de seu interesse.',
        product: '📦 *{{product.name}}*\n\n{{product.description}}',
        final: '✅ Essas são as informações sobre {{products.count}} produto(s) de seu interesse!\n\n👨‍💼 Um vendedor da {{company.name}} entrará em contato em breve para esclarecer dúvidas e auxiliar na sua compra.\n\n{{company.phone}}'
      };

      // Merge templates com fallback para cada propriedade
      setWhatsappTemplates({
        initial: config.whatsappTemplates?.initial || defaultTemplates.initial,
        product: config.whatsappTemplates?.product || defaultTemplates.product,
        final: config.whatsappTemplates?.final || defaultTemplates.final,
      });
    }
  }, [config]);

  // Mutation para salvar configuração
  const updateMutation = useMutation({
    mutationFn: chatbotService.updateConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-config'] });
      toast({
        title: 'Sucesso!',
        description: 'Configuração salva no banco de dados.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Não foi possível salvar a configuração.',
        variant: 'destructive',
      });
    },
  });

  // Calcular progresso
  const calculateProgress = () => {
    let completed = 0;
    const total = 5;
    if (behavior.name && behavior.greeting) completed++;
    if (companyData.name && companyData.description) completed++;
    if (products.length > 0) completed++;
    if (faqs.length > 0) completed++;
    completed++; // Links sempre completo
    return (completed / total) * 100;
  };

  const progress = calculateProgress();

  // Funções para produtos
  const addProduct = () => {
    const newId = Date.now().toString();
    setProducts([...products, { id: newId, name: '', description: '', price: '', features: [] }]);
    // Auto-expandir novo produto
    setExpandedProducts({ ...expandedProducts, [newId]: true });
  };

  const removeProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
    // Remover do estado de expansão
    const newExpanded = { ...expandedProducts };
    delete newExpanded[id];
    setExpandedProducts(newExpanded);
  };

  const updateProduct = (id: string, field: string, value: any) => {
    setProducts(products.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const toggleProduct = (id: string) => {
    setExpandedProducts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // ===== NOVAS FUNÇÕES PARA AUTOMAÇÃO WHATSAPP =====

  const addSpecification = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const specs = product.specifications || {};
    const newKey = `Especificação ${Object.keys(specs).length + 1}`;

    updateProduct(productId, 'specifications', {
      ...specs,
      [newKey]: ''
    });
  };

  const updateSpecificationKey = (productId: string, oldKey: string, newKey: string, value: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const specs = { ...product.specifications };
    delete specs[oldKey];
    specs[newKey] = value;

    updateProduct(productId, 'specifications', specs);
  };

  const updateSpecificationValue = (productId: string, key: string, value: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    updateProduct(productId, 'specifications', {
      ...product.specifications,
      [key]: value
    });
  };

  const removeSpecification = (productId: string, key: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const specs = { ...product.specifications };
    delete specs[key];

    updateProduct(productId, 'specifications', specs);
  };

  const removeProductImage = (productId: string, index: number) => {
    const product = products.find(p => p.id === productId);
    if (!product || !product.images) return;

    const newImages = product.images.filter((_, idx) => idx !== index);
    updateProduct(productId, 'images', newImages);
  };

  const removeProductVideo = (productId: string, index: number) => {
    const product = products.find(p => p.id === productId);
    if (!product || !product.videos) return;

    const newVideos = product.videos.filter((_, idx) => idx !== index);
    updateProduct(productId, 'videos', newVideos);
  };

  // ===== FUNÇÕES DE UPLOAD COM CROP =====

  const handleImageUpload = async (productId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0]; // Pegar primeira imagem para crop
    setCurrentProductId(productId);

    // Ler arquivo e abrir modal de crop
    const reader = new FileReader();
    reader.onload = (e) => {
      setTempImageSrc(e.target?.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedBlob: Blob, croppedUrl: string) => {
    const productId = currentProductId;
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setUploadingImages({ ...uploadingImages, [productId]: true });

    try {
      // Converter blob para base64
      const reader = new FileReader();
      reader.readAsDataURL(croppedBlob);

      reader.onload = async () => {
        const base64Image = reader.result as string;

        // Upload com crop e compressão (800x600 para WhatsApp)
        const imageUrl = await uploadService.uploadImageWithCrop(
          base64Image,
          800,  // Largura otimizada para WhatsApp
          600,  // Altura otimizada
          85    // Qualidade 85%
        );

        const currentImages = product.images || [];
        const newImages = [...currentImages, imageUrl];

        updateProduct(productId, 'images', newImages);

        toast({
          title: 'Sucesso!',
          description: 'Imagem cropada e otimizada com sucesso.',
        });

        setUploadingImages({ ...uploadingImages, [productId]: false });
      };

    } catch (error: any) {
      toast({
        title: 'Erro no upload',
        description: error.message || 'Não foi possível fazer upload da imagem.',
        variant: 'destructive',
      });
      setUploadingImages({ ...uploadingImages, [productId]: false });
    }
  };

  // Funções para FAQ
  const addFAQ = () => {
    const newId = Date.now().toString();
    setFaqs([...faqs, { id: newId, question: '', answer: '' }]);
    // Auto-expandir nova FAQ
    setExpandedFaqs({ ...expandedFaqs, [newId]: true });
  };

  const removeFAQ = (id: string) => {
    setFaqs(faqs.filter((f) => f.id !== id));
    // Remover do estado de expansão
    const newExpanded = { ...expandedFaqs };
    delete newExpanded[id];
    setExpandedFaqs(newExpanded);
  };

  const updateFAQ = (id: string, field: string, value: string) => {
    setFaqs(faqs.map((f) => (f.id === id ? { ...f, [field]: value } : f)));
  };

  const toggleFAQ = (id: string) => {
    setExpandedFaqs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Funções para links
  const addShareLink = () => {
    setShareLinks([...shareLinks, { id: Date.now().toString(), name: '', platform: 'whatsapp', url: '' }]);
  };

  const removeShareLink = (id: string) => {
    setShareLinks(shareLinks.filter((l) => l.id !== id));
  };

  const updateShareLink = (id: string, field: string, value: string) => {
    setShareLinks(shareLinks.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  };

  const generateShareLink = (link: ShareLink) => {
    // Usar domínio real do site em produção
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const baseUrl = isLocalhost ? 'http://metalurgicaferraco.com' : window.location.origin;
    return `${baseUrl}/chat?source=${link.platform}&campaign=${encodeURIComponent(link.name)}`;
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'whatsapp': return <MessageCircle className="h-4 w-4" />;
      case 'facebook': return <Facebook className="h-4 w-4" />;
      case 'instagram': return <Instagram className="h-4 w-4" />;
      case 'linkedin': return <Linkedin className="h-4 w-4" />;
      case 'twitter': return <Twitter className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      default: return <Share2 className="h-4 w-4" />;
    }
  };

  // Função para salvar no backend
  const handleSave = () => {
    updateMutation.mutate({
      botName: behavior.name,
      welcomeMessage: behavior.greeting,
      tone: behavior.tone,
      captureLeads: behavior.captureLeads,
      requireEmail: behavior.requireEmail,
      requirePhone: behavior.requirePhone,
      autoResponse: behavior.autoResponse,
      companyName: companyData.name,
      companyDescription: companyData.description,
      companyAddress: companyData.address,
      companyPhone: companyData.phone,
      companyEmail: companyData.email,
      companyWebsite: companyData.website,
      workingHours: companyData.workingHours,
      products,
      faqs,
      shareLinks,
      whatsappTemplates,
    });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

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

          <Button onClick={handleSave} size="lg" className="gap-2" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Salvar Configurações
              </>
            )}
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

        {/* Aviso de persistência */}
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Persistência ativa:</strong> Todos os dados são salvos automaticamente no banco de dados PostgreSQL.
            As configurações persistem entre sessões e recarregamentos.
          </AlertDescription>
        </Alert>

        {/* Tabs de Configuração */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Mobile: Scroll horizontal | Desktop: Grid */}
          <div className="relative">
            <TabsList className="w-full md:grid md:grid-cols-6 flex overflow-x-auto scrollbar-hide">
              <TabsTrigger value="behavior" className="gap-1 md:gap-2 shrink-0 min-h-[48px]">
                <Bot className="h-4 w-4" />
                <span className="hidden sm:inline">Comportamento</span>
                <span className="sm:hidden">Comp.</span>
              </TabsTrigger>
              <TabsTrigger value="company" className="gap-1 md:gap-2 shrink-0 min-h-[48px]">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Empresa</span>
                <span className="sm:hidden">Emp.</span>
              </TabsTrigger>
              <TabsTrigger value="products" className="gap-1 md:gap-2 shrink-0 min-h-[48px]">
                <Package className="h-4 w-4" />
                Produtos
              </TabsTrigger>
              <TabsTrigger value="faq" className="gap-1 md:gap-2 shrink-0 min-h-[48px]">
                <HelpCircle className="h-4 w-4" />
                FAQ
              </TabsTrigger>
              <TabsTrigger value="whatsapp-templates" className="gap-1 md:gap-2 shrink-0 min-h-[48px]">
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Templates</span>
                <span className="sm:hidden">WA</span>
              </TabsTrigger>
              <TabsTrigger value="links" className="gap-1 md:gap-2 shrink-0 min-h-[48px]">
                <Share2 className="h-4 w-4" />
                Links
              </TabsTrigger>
            </TabsList>
          </div>

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
                    <Collapsible
                      key={product.id}
                      open={expandedProducts[product.id] ?? false}
                      onOpenChange={() => toggleProduct(product.id)}
                    >
                      <Card className="border-2">
                        <CollapsibleTrigger asChild>
                          <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors min-h-[64px] flex items-center">
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <ChevronDown
                                  className={`h-5 w-5 transition-transform duration-200 shrink-0 ${
                                    expandedProducts[product.id] ? '' : '-rotate-90'
                                  }`}
                                />
                                <CardTitle className="text-base md:text-lg truncate">
                                  {product.name || `Produto ${index + 1}`}
                                </CardTitle>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeProduct(product.id);
                                }}
                                className="text-destructive hover:text-destructive shrink-0 h-10 w-10"
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent className="space-y-4 pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                        {/* ===== NOVA SEÇÃO: AUTOMAÇÃO WHATSAPP ===== */}
                        <Separator className="my-6" />

                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg space-y-4 border-2 border-green-200">
                          <div className="flex items-center gap-2 mb-4">
                            <MessageCircle className="h-5 w-5 text-green-600" />
                            <h4 className="font-semibold text-green-900">
                              Automação WhatsApp (Opcional)
                            </h4>
                            <Badge variant="secondary" className="ml-auto">Novo</Badge>
                          </div>

                          <Alert className="border-green-300 bg-white">
                            <AlertDescription className="text-sm text-gray-700">
                              💡 Preencha os campos abaixo para enviar automaticamente informações
                              detalhadas via WhatsApp quando um lead manifestar interesse neste produto.
                            </AlertDescription>
                          </Alert>

                          {/* Descrição Detalhada */}
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <span>Descrição Detalhada para WhatsApp</span>
                              <Badge variant="outline" className="text-xs">Opcional</Badge>
                            </Label>
                            <Textarea
                              value={product.detailedDescription || ''}
                              onChange={(e) => updateProduct(product.id, 'detailedDescription', e.target.value)}
                              placeholder="Descrição técnica completa que será enviada via WhatsApp..."
                              rows={4}
                              className="bg-white"
                            />
                            <p className="text-xs text-muted-foreground">
                              Se não preenchido, usará a descrição padrão acima.
                            </p>
                          </div>

                          {/* Imagens */}
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <span>Imagens para WhatsApp (Upload de Arquivos)</span>
                              <Badge variant="outline" className="text-xs">Opcional</Badge>
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(product.id, e.target.files)}
                                className="bg-white flex-1"
                                disabled={uploadingImages[product.id]}
                              />
                              {uploadingImages[product.id] && (
                                <Button disabled size="sm">
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Enviando...
                                </Button>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              📸 Selecione uma imagem (JPG, PNG, WebP). Será cropada e otimizada (800x600) para WhatsApp.
                            </p>
                            {product.images && product.images.length > 0 && (
                              <div className="flex gap-2 flex-wrap mt-2">
                                {product.images.map((img, idx) => (
                                  <div key={idx} className="relative group">
                                    <img src={img} className="h-20 w-20 object-cover rounded border-2 border-white shadow" alt="" />
                                    <Button
                                      size="icon"
                                      variant="destructive"
                                      className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition"
                                      onClick={() => removeProductImage(product.id, idx)}
                                      type="button"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Vídeos */}
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <span>Vídeos (WhatsApp)</span>
                              <Badge variant="outline" className="text-xs">Opcional</Badge>
                            </Label>
                            <Textarea
                              placeholder="Cole URLs de vídeos (YouTube, Vimeo ou arquivos MP4), uma por linha"
                              value={(product.videos || []).join('\n')}
                              onChange={(e) => updateProduct(product.id, 'videos',
                                e.target.value.split('\n').filter(s => s.trim())
                              )}
                              className="bg-white font-mono text-sm"
                              rows={2}
                            />
                            {product.videos && product.videos.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {product.videos.map((video, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <Input value={video} readOnly className="text-xs font-mono" />
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => removeProductVideo(product.id, idx)}
                                      type="button"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Especificações Técnicas */}
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <span>Especificações Técnicas</span>
                              <Badge variant="outline" className="text-xs">Opcional</Badge>
                            </Label>
                            {product.specifications && Object.entries(product.specifications).map(([key, value], idx) => (
                              <div key={idx} className="flex gap-2">
                                <Input
                                  placeholder="Nome (ex: Material)"
                                  value={key}
                                  onChange={(e) => updateSpecificationKey(product.id, key, e.target.value, value as string)}
                                  className="bg-white"
                                />
                                <Input
                                  placeholder="Valor (ex: Aço Inox 304)"
                                  value={value as string}
                                  onChange={(e) => updateSpecificationValue(product.id, key, e.target.value)}
                                  className="bg-white"
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => removeSpecification(product.id, key)}
                                  type="button"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addSpecification(product.id)}
                              className="w-full"
                              type="button"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Adicionar Especificação
                            </Button>
                          </div>
                        </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
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
                    <Collapsible
                      key={faq.id}
                      open={expandedFaqs[faq.id] ?? false}
                      onOpenChange={() => toggleFAQ(faq.id)}
                    >
                      <Card className="border-2">
                        <CollapsibleTrigger asChild>
                          <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors min-h-[64px] flex items-center">
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <ChevronDown
                                  className={`h-5 w-5 transition-transform duration-200 shrink-0 ${
                                    expandedFaqs[faq.id] ? '' : '-rotate-90'
                                  }`}
                                />
                                <CardTitle className="text-base md:text-lg truncate">
                                  {faq.question || `Pergunta ${index + 1}`}
                                </CardTitle>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFAQ(faq.id);
                                }}
                                className="text-destructive hover:text-destructive shrink-0 h-10 w-10"
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent className="space-y-4 pt-0">
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
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA 5: Templates WhatsApp */}
          <TabsContent value="whatsapp-templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Templates de Mensagens WhatsApp</CardTitle>
                <CardDescription>
                  Personalize as mensagens enviadas automaticamente quando um lead manifesta interesse em produtos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Template: Mensagem Inicial */}
                <Card className="border-2 border-green-200 bg-green-50/50">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-green-600" />
                      <CardTitle className="text-lg">Mensagem Inicial</CardTitle>
                    </div>
                    <CardDescription>
                      Primeira mensagem enviada ao lead após manifestar interesse
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="template-initial">Conteúdo da Mensagem</Label>
                      <Textarea
                        ref={initialTemplateInsertion.textareaRef}
                        id="template-initial"
                        value={whatsappTemplates.initial}
                        onChange={(e) => setWhatsappTemplates({ ...whatsappTemplates, initial: e.target.value })}
                        onBlur={initialTemplateInsertion.handleBlur}
                        placeholder="Digite a mensagem ou use os botões abaixo..."
                        rows={5}
                        className="bg-white font-mono text-sm"
                      />

                      <VariableInserter
                        variables={[...WHATSAPP_LEAD_VARIABLES, ...WHATSAPP_COMPANY_VARIABLES]}
                        onInsert={(variable) =>
                          initialTemplateInsertion.insertVariable(
                            variable,
                            whatsappTemplates.initial,
                            (newValue) => setWhatsappTemplates({ ...whatsappTemplates, initial: newValue })
                          )
                        }
                        variant="badges"
                        className="mt-1"
                      />
                    </div>

                    {/* Preview */}
                    <div className="space-y-2">
                      <Label>Preview</Label>
                      <div className="bg-white border-2 border-green-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
                            {companyData.name?.[0] || 'F'}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-green-900">{companyData.name || 'Sua Empresa'}</p>
                            <div className="mt-2 bg-green-100 rounded-lg p-3 text-sm whitespace-pre-wrap">
                              {(whatsappTemplates.initial || '')
                                .replace(/\{\{lead\.name\}\}/g, 'Fernando Martins')
                                .replace(/\{\{company\.name\}\}/g, companyData.name || 'Sua Empresa')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Template: Descrição do Produto */}
                <Card className="border-2 border-blue-200 bg-blue-50/50">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">Descrição do Produto</CardTitle>
                    </div>
                    <CardDescription>
                      Template usado para cada produto de interesse do lead
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="template-product">Conteúdo da Mensagem</Label>
                      <Textarea
                        ref={productTemplateInsertion.textareaRef}
                        id="template-product"
                        value={whatsappTemplates.product}
                        onChange={(e) => setWhatsappTemplates({ ...whatsappTemplates, product: e.target.value })}
                        onBlur={productTemplateInsertion.handleBlur}
                        placeholder="Digite o template do produto ou use os botões abaixo..."
                        rows={4}
                        className="bg-white font-mono text-sm"
                      />

                      <VariableInserter
                        variables={WHATSAPP_PRODUCT_VARIABLES}
                        onInsert={(variable) =>
                          productTemplateInsertion.insertVariable(
                            variable,
                            whatsappTemplates.product,
                            (newValue) => setWhatsappTemplates({ ...whatsappTemplates, product: newValue })
                          )
                        }
                        variant="badges"
                        className="mt-1"
                      />
                    </div>

                    {/* Preview */}
                    <div className="space-y-2">
                      <Label>Preview</Label>
                      <div className="bg-white border-2 border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                            {companyData.name?.[0] || 'F'}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-900">{companyData.name || 'Sua Empresa'}</p>
                            <div className="mt-2 bg-blue-100 rounded-lg p-3 text-sm whitespace-pre-wrap">
                              {(whatsappTemplates.product || '')
                                .replace(/\{\{product\.name\}\}/g, 'Bebedouro Automático')
                                .replace(/\{\{product\.description\}\}/g, 'Bebedouro automático para bovinos, capacidade de 500 litros.')
                                .replace(/\{\{product\.price\}\}/g, 'R$ 1.200,00')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Template: Mensagem Final */}
                <Card className="border-2 border-purple-200 bg-purple-50/50">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-purple-600" />
                      <CardTitle className="text-lg">Mensagem Final</CardTitle>
                    </div>
                    <CardDescription>
                      Mensagem de encerramento após enviar todos os produtos
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="template-final">Conteúdo da Mensagem</Label>
                      <Textarea
                        ref={finalTemplateInsertion.textareaRef}
                        id="template-final"
                        value={whatsappTemplates.final}
                        onChange={(e) => setWhatsappTemplates({ ...whatsappTemplates, final: e.target.value })}
                        onBlur={finalTemplateInsertion.handleBlur}
                        placeholder="Digite a mensagem final ou use os botões abaixo..."
                        rows={5}
                        className="bg-white font-mono text-sm"
                      />

                      <VariableInserter
                        variables={WHATSAPP_COMPANY_VARIABLES}
                        onInsert={(variable) =>
                          finalTemplateInsertion.insertVariable(
                            variable,
                            whatsappTemplates.final,
                            (newValue) => setWhatsappTemplates({ ...whatsappTemplates, final: newValue })
                          )
                        }
                        variant="badges"
                        className="mt-1"
                      />
                    </div>

                    {/* Preview */}
                    <div className="space-y-2">
                      <Label>Preview</Label>
                      <div className="bg-white border-2 border-purple-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                            {companyData.name?.[0] || 'F'}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-purple-900">{companyData.name || 'Sua Empresa'}</p>
                            <div className="mt-2 bg-purple-100 rounded-lg p-3 text-sm whitespace-pre-wrap">
                              {(whatsappTemplates.final || '')
                                .replace(/\{\{products\.count\}\}/g, '2')
                                .replace(/\{\{company\.name\}\}/g, companyData.name || 'Sua Empresa')
                                .replace(/\{\{company\.phone\}\}/g, companyData.phone || '(11) 99999-9999')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Info Box */}
                <Alert className="border-blue-200 bg-blue-50">
                  <MessageCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Como funciona:</strong> Quando um lead manifesta interesse em produtos via chatbot,
                    o sistema usa estes templates para enviar automaticamente as informações via WhatsApp.
                    Use variáveis <code className="bg-blue-100 px-1 py-0.5 rounded text-xs">{'{{exemplo}}'}</code> para
                    personalizar as mensagens com dados do lead, produto e empresa.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA 6: Links de Compartilhamento */}
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
              <Button onClick={handleSave} size="lg" className="gap-2" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    Salvar Todas as Configurações
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Crop de Imagem */}
      <ImageCropModal
        open={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        imageSrc={tempImageSrc}
        onCropComplete={handleCropComplete}
        aspectRatio={4 / 3}
        cropShape="rect"
        title="Recortar Imagem para WhatsApp"
        targetWidth={800}
        targetHeight={600}
      />
    </AdminLayout>
  );
};

export default AdminChatbotConfig;
