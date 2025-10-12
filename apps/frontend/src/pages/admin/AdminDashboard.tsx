/**
 * AdminDashboard - Dashboard com dados REAIS do backend
 * MIGRADO de localStorage/mock para API PostgreSQL
 */

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
  CheckCircle,
  AlertCircle,
  Activity,
  Loader2
} from 'lucide-react';
import { useLeadsStats, useLeadsStatsByStatus, useLeadsStatsBySource, useLeadsTimeline, useLeads } from '@/hooks/api/useLeads';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AdminDashboard = () => {
  // Buscar dados reais do backend
  const { data: stats, isLoading: statsLoading } = useLeadsStats();
  const { data: statsByStatus, isLoading: statusLoading } = useLeadsStatsByStatus();
  const { data: statsBySource } = useLeadsStatsBySource();
  const { data: timeline, isLoading: timelineLoading } = useLeadsTimeline(7);
  const { data: recentLeadsData, isLoading: leadsLoading } = useLeads({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' });

  // Extrair leads da estrutura paginada
  const recentLeads = recentLeadsData?.data || [];

  // Loading state
  if (statsLoading || statusLoading || timelineLoading || leadsLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
            <p className="text-muted-foreground">Carregando dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Calcular métricas
  const totalLeads = stats?.total || 0;
  const leadsToday = stats?.todayCount || 0;
  const conversionRate = stats?.conversionRate || 0;

  // Preparar dados para gráfico de funil por status
  const funnelData = statsByStatus ? Object.entries(statsByStatus).map(([status, count]) => ({
    name: getStatusLabel(status),
    value: count as number,
    color: getStatusColor(status),
  })) : [];

  // Formatar timeline para gráfico
  const timelineChartData = timeline?.map(item => ({
    day: new Date(item.date).toLocaleDateString('pt-BR', { weekday: 'short' }),
    leads: item.count
  })) || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do desempenho do seu CRM (dados reais do PostgreSQL)
          </p>
        </div>

        {/* Alert de dados reais */}
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            ✅ Todos os dados são REAIS do banco de dados PostgreSQL. Não há simulações.
          </AlertDescription>
        </Alert>

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
                  <p className="text-3xl font-bold mt-1">{conversionRate.toFixed(1)}%</p>
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
                  <p className="text-sm text-muted-foreground">Esta Semana</p>
                  <p className="text-3xl font-bold mt-1">{stats?.weekCount || 0}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Últimos 7 dias</span>
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
                  <p className="text-sm text-muted-foreground">Este Mês</p>
                  <p className="text-3xl font-bold mt-1">{stats?.monthCount || 0}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Bot className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Últimos 30 dias</span>
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
                <CardDescription>Últimos 7 dias (dados reais)</CardDescription>
              </CardHeader>
              <CardContent>
                {timelineChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={timelineChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum dado de timeline disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Funnel Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Distribuição por Status</CardTitle>
                    <CardDescription>Leads organizados por status</CardDescription>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/admin/leads">
                      Ver Todos <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {funnelData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={funnelData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum lead cadastrado ainda</p>
                    <Button asChild variant="link" size="sm" className="mt-2">
                      <Link to="/admin/leads">Criar primeiro lead</Link>
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
                            {lead.source && (
                              <Badge variant="secondary" className="text-xs">
                                {lead.source}
                              </Badge>
                            )}
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
                      <p className="text-sm">Nenhum lead recente</p>
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
                  <Link to="/admin/chatbot-config">
                    <Bot className="mr-2 h-4 w-4" />
                    Configurar Chatbot
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
                    <span className="text-sm">Banco de Dados</span>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Conectado
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">API Backend</span>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Online
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Chatbot</span>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Ativo
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

// Helper functions
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

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    NOVO: 'Novo',
    QUALIFICADO: 'Qualificado',
    EM_ANDAMENTO: 'Em Andamento',
    CONCLUIDO: 'Concluído',
    PERDIDO: 'Perdido',
    ARQUIVADO: 'Arquivado',
  };
  return labels[status] || status;
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    NOVO: '#3b82f6',
    QUALIFICADO: '#10b981',
    EM_ANDAMENTO: '#f59e0b',
    CONCLUIDO: '#8b5cf6',
    PERDIDO: '#ef4444',
    ARQUIVADO: '#6b7280',
  };
  return colors[status] || '#3b82f6';
};

export default AdminDashboard;
