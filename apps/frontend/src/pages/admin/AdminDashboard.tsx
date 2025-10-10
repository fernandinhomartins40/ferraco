import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import {
  Users,
  TrendingUp,
  Target,
  MessageSquare,
  Bot,
  Clock,
  ArrowRight,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Activity,
  Calendar
} from 'lucide-react';
import { kanbanStorage } from '@/utils/kanbanStorage';
import { aiChatStorage } from '@/utils/aiChatStorage';
import { ChatWidget } from '@/components/ChatWidget';
import { leadStorage } from '@/utils/leadStorage';

const AdminDashboard = () => {
  // Get data from storages
  const columns = kanbanStorage.getAllColumns();
  const specialSections = kanbanStorage.getSpecialSections();
  const chatLinks = aiChatStorage.getChatLinks();
  const products = aiChatStorage.getProducts();
  const companyData = aiChatStorage.getCompanyData();
  const aiProgress = aiChatStorage.getConfigurationProgress();

  // Get or create a test lead for chat widget
  const leads = leadStorage.getLeads();
  const testLead = useMemo(() => {
    // Procura por um lead de teste ou usa o primeiro disponível
    let lead = leads.find(l => l.name === 'Chat Demo' || l.phone === '11999999999');

    if (!lead && leads.length > 0) {
      lead = leads[0]; // Usa o primeiro lead existente
    }

    if (!lead) {
      // Cria um lead de teste se não existir nenhum
      lead = leadStorage.addLead('Chat Demo', '11999999999', 'website', 'medium');
    }

    return lead;
  }, [leads]);

  // Mock leads data (replace with real API data)
  const mockLeads = [
    { id: '1', name: 'João Silva', phone: '11999999999', source: 'facebook', columnId: columns[0]?.id, createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), tags: ['VIP'] },
    { id: '2', name: 'Maria Santos', phone: '11988888888', source: 'instagram', columnId: columns[0]?.id, createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), tags: ['Urgente'] },
    { id: '3', name: 'Pedro Costa', phone: '11977777777', source: 'website', columnId: columns[1]?.id, createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), tags: [] },
    { id: '4', name: 'Ana Paula', phone: '11966666666', source: 'facebook', columnId: columns[2]?.id, createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), tags: ['VIP'] },
    { id: '5', name: 'Carlos Souza', phone: '11955555555', source: 'instagram', columnId: columns[0]?.id, createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), tags: [] },
    { id: '6', name: 'Juliana Lima', phone: '11944444444', source: 'website', columnId: 'special-recovery', createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), tags: [] },
  ];

  // Calculate metrics
  const totalLeads = mockLeads.length;
  const leadsToday = mockLeads.filter(l => {
    const date = new Date(l.createdAt);
    return date.toDateString() === new Date().toDateString();
  }).length;

  const conversionRate = columns.length > 0
    ? Math.round((mockLeads.filter(l => l.columnId === columns[columns.length - 1]?.id).length / totalLeads) * 100)
    : 0;

  const activeLinks = chatLinks.filter(l => l.isActive).length;
  const totalClicks = chatLinks.reduce((sum, link) => sum + link.clicks, 0);

  // Leads by column for quick view
  const leadsByColumn = useMemo(() => {
    if (columns.length === 0) return [];
    return columns.slice(0, 4).map(col => ({
      name: col.name,
      value: mockLeads.filter(l => l.columnId === col.id).length,
      color: col.color,
    }));
  }, [columns, mockLeads]);

  // Recent activity (last 5 leads)
  const recentLeads = useMemo(() => {
    return [...mockLeads]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [mockLeads]);

  // Time series data (last 7 days)
  const timeSeriesData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('pt-BR', { weekday: 'short' });

      const count = i === 0 ? 2 : Math.floor(Math.random() * 4);
      days.push({ day: dateStr, leads: count });
    }
    return days;
  }, []);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins} min atrás`;
    }
    if (diffHours < 24) {
      return `${diffHours}h atrás`;
    }
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d atrás`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do desempenho do seu CRM
          </p>
        </div>

        {/* AI Configuration Progress (if not complete) */}
        {aiProgress.percentage < 100 && (
          <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Configure sua IA de Captação</h3>
                    <Badge variant="secondary">{aiProgress.percentage}% completo</Badge>
                  </div>
                  <Progress value={aiProgress.percentage} className="mb-3" />
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Complete a configuração para começar a captar leads automaticamente
                    </p>
                    <Button asChild size="sm">
                      <Link to="/admin/ai">
                        Configurar <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Leads</p>
                  <p className="text-3xl font-bold mt-1">{totalLeads}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">+{leadsToday} hoje</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                  <p className="text-3xl font-bold mt-1">{conversionRate}%</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Meta: 25%</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Links Ativos</p>
                  <p className="text-3xl font-bold mt-1">{activeLinks}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{totalClicks} cliques</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Produtos Cadastrados</p>
                  <p className="text-3xl font-bold mt-1">{products.length}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Para IA</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <Bot className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Charts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timeline Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Evolução de Leads</CardTitle>
                <CardDescription>Últimos 7 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Funnel Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Funil de Vendas</CardTitle>
                    <CardDescription>Distribuição por etapa do Kanban</CardDescription>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/admin/leads">
                      Ver Kanban <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {leadsByColumn.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={leadsByColumn}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {leadsByColumn.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma coluna criada ainda</p>
                    <Button asChild variant="link" size="sm" className="mt-2">
                      <Link to="/admin/leads">Criar primeira coluna</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Activity & Quick Actions */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Atividade Recente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentLeads.length > 0 ? (
                    recentLeads.map((lead) => (
                      <div key={lead.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{lead.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{lead.phone}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {lead.source}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {getTimeAgo(lead.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum lead ainda</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild className="w-full justify-start" variant="outline">
                  <Link to="/admin/leads">
                    <Users className="mr-2 h-4 w-4" />
                    Ver todos os leads
                  </Link>
                </Button>
                <Button asChild className="w-full justify-start" variant="outline">
                  <Link to="/admin/ai">
                    <Bot className="mr-2 h-4 w-4" />
                    Configurar IA
                  </Link>
                </Button>
                <Button asChild className="w-full justify-start" variant="outline">
                  <Link to="/admin/whatsapp">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Conectar WhatsApp
                  </Link>
                </Button>
                <Button asChild className="w-full justify-start" variant="outline">
                  <Link to="/admin/reports">
                    <Target className="mr-2 h-4 w-4" />
                    Ver relatórios
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status do Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Kanban</span>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    {columns.length} colunas
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {aiProgress.percentage === 100 ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                    )}
                    <span className="text-sm">IA Chat</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={aiProgress.percentage === 100 ? 'text-green-600 border-green-600' : 'text-amber-600 border-amber-600'}
                  >
                    {aiProgress.percentage}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {activeLinks > 0 ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                    )}
                    <span className="text-sm">Campanhas</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={activeLinks > 0 ? 'text-green-600 border-green-600' : 'text-amber-600 border-amber-600'}
                  >
                    {activeLinks} ativas
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Chat Widget - IA Local */}
      {testLead && <ChatWidget leadId={testLead.id} />}
    </AdminLayout>
  );
};

export default AdminDashboard;
