import { useState, useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart3,
  Download,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Calendar,
  Clock,
  Tag,
  MessageSquare,
  DollarSign,
  Percent,
  Filter
} from 'lucide-react';
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
  Line,
  AreaChart,
  Area
} from 'recharts';
import { kanbanStorage } from '@/utils/kanbanStorage';
import { aiChatStorage } from '@/utils/aiChatStorage';

const AdminReports = () => {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'leads' | 'conversion' | 'sources'>('leads');

  // Get data from storages
  const columns = kanbanStorage.getAllColumns();
  const specialSections = kanbanStorage.getSpecialSections();
  const chatLinks = aiChatStorage.getChatLinks();
  const products = aiChatStorage.getProducts();

  // Mock leads data (in real app, would come from API)
  const mockLeads = [
    { id: '1', name: 'João Silva', phone: '11999999999', source: 'facebook', columnId: columns[0]?.id, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), tags: ['VIP'] },
    { id: '2', name: 'Maria Santos', phone: '11988888888', source: 'instagram', columnId: columns[0]?.id, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), tags: ['Urgente'] },
    { id: '3', name: 'Pedro Costa', phone: '11977777777', source: 'website', columnId: columns[1]?.id, createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), tags: [] },
    { id: '4', name: 'Ana Paula', phone: '11966666666', source: 'facebook', columnId: columns[2]?.id, createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), tags: ['VIP'] },
    { id: '5', name: 'Carlos Souza', phone: '11955555555', source: 'instagram', columnId: 'special-recovery', createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), tags: [] },
  ];

  // Calculate metrics
  const totalLeads = mockLeads.length;
  const leadsThisMonth = mockLeads.filter(l => {
    const date = new Date(l.createdAt);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  const conversionRate = columns.length > 0 ? Math.round((mockLeads.filter(l => l.columnId === columns[columns.length - 1]?.id).length / totalLeads) * 100) : 0;

  const avgResponseTime = '2h 15min';

  // Leads by source
  const leadsBySource = useMemo(() => {
    const sources = mockLeads.reduce((acc, lead) => {
      acc[lead.source] = (acc[lead.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(sources).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [mockLeads]);

  // Leads by column
  const leadsByColumn = useMemo(() => {
    const allColumns = [...columns, ...specialSections];
    return allColumns.map(col => ({
      name: col.name.length > 15 ? col.name.substring(0, 15) + '...' : col.name,
      value: mockLeads.filter(l => l.columnId === col.id).length,
      fill: 'color' in col ? col.color : '#8b5cf6',
    }));
  }, [columns, specialSections, mockLeads]);

  // Leads timeline (last 30 days)
  const leadsTimeline = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

      const count = mockLeads.filter(l => {
        const leadDate = new Date(l.createdAt);
        return leadDate.toDateString() === date.toDateString();
      }).length;

      days.push({ date: dateStr, leads: count });
    }
    return days;
  }, [mockLeads]);

  // Chat links performance
  const linkPerformance = useMemo(() => {
    return chatLinks.map(link => ({
      name: link.name,
      clicks: link.clicks,
      leads: link.leads,
      conversion: link.clicks > 0 ? Math.round((link.leads / link.clicks) * 100) : 0,
    }));
  }, [chatLinks]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const handleExport = (format: 'pdf' | 'csv' | 'excel') => {
    // TODO: Implement real export
    alert(`Exportando relatório em formato ${format.toUpperCase()}...`);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-8 w-8" />
              Relatórios e Análises
            </h2>
            <p className="text-muted-foreground mt-2">
              Acompanhe o desempenho e métricas do seu CRM
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
                <SelectItem value="all">Todo período</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Leads</p>
                  <p className="text-3xl font-bold mt-1">{totalLeads}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">+{leadsThisMonth} este mês</span>
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
                    <Percent className="h-4 w-4 text-muted-foreground" />
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
                  <p className="text-sm text-muted-foreground">Tempo Médio</p>
                  <p className="text-3xl font-bold mt-1">{avgResponseTime}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Resposta</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Links Ativos</p>
                  <p className="text-3xl font-bold mt-1">{chatLinks.filter(l => l.isActive).length}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Campanhas</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="funnel">Funil de Vendas</TabsTrigger>
            <TabsTrigger value="sources">Fontes de Leads</TabsTrigger>
            <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Timeline Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Evolução de Leads</CardTitle>
                  <CardDescription>Últimos 30 dias</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={leadsTimeline}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="leads" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Sources Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Leads por Origem</CardTitle>
                  <CardDescription>Distribuição por canal</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={leadsBySource}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {leadsBySource.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Funnel Tab */}
          <TabsContent value="funnel">
            <Card>
              <CardHeader>
                <CardTitle>Funil de Vendas</CardTitle>
                <CardDescription>Distribuição de leads pelas etapas do Kanban</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={leadsByColumn}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]}>
                      {leadsByColumn.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sources Tab */}
          <TabsContent value="sources">
            <Card>
              <CardHeader>
                <CardTitle>Análise de Fontes</CardTitle>
                <CardDescription>Desempenho detalhado por canal de aquisição</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leadsBySource.map((source, index) => (
                    <div key={source.name} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        >
                          {source.value}
                        </div>
                        <div>
                          <p className="font-medium">{source.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {Math.round((source.value / totalLeads) * 100)}% do total
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{source.value} leads</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns">
            <Card>
              <CardHeader>
                <CardTitle>Performance de Campanhas</CardTitle>
                <CardDescription>Links de captura da IA e conversões</CardDescription>
              </CardHeader>
              <CardContent>
                {linkPerformance.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma campanha criada ainda</p>
                    <p className="text-sm mt-1">Crie links de captura na página IA Chat</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {linkPerformance.map((link, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{link.name}</p>
                          <Badge variant={link.conversion >= 10 ? 'default' : 'secondary'}>
                            {link.conversion}% conversão
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{link.clicks} cliques</span>
                          <span>•</span>
                          <span>{link.leads} leads</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${link.conversion}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle>Exportar Relatórios</CardTitle>
            <CardDescription>Baixe os dados em diferentes formatos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleExport('pdf')}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" onClick={() => handleExport('csv')}>
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" onClick={() => handleExport('excel')}>
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminReports;
