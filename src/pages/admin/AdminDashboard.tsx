import { useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AdminLayout from '@/components/admin/AdminLayout';
import StatsCards from '@/components/admin/StatsCards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDashboardMetrics } from '@/hooks/api/useDashboard';
import { useLeads } from '@/hooks/api/useLeads';
import { DashboardMetrics, ApiLead } from '@/types/api';
import { Clock, RefreshCw, AlertCircle } from 'lucide-react';

const AdminDashboard = () => {
  // Hooks da API
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard
  } = useDashboardMetrics();

  const {
    data: recentLeadsData,
    isLoading: leadsLoading,
    error: leadsError,
    refetch: refetchLeads
  } = useLeads({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' });

  // Dados simplificados - sem conversões complexas
  const stats = useMemo(() => {
    if (!dashboardData) {
      return {
        total: 0,
        novo: 0,
        em_andamento: 0,
        concluido: 0,
        conversionRate: 0,
        todayLeads: 0,
        weeklyGrowth: 0,
      };
    }

    const weeklyGrowth = dashboardData.trends.leadsThisWeek > 0
      ? ((dashboardData.trends.leadsThisWeek - dashboardData.trends.leadsLastWeek) / dashboardData.trends.leadsLastWeek) * 100
      : 0;

    return {
      total: dashboardData.leadsCount.total,
      novo: dashboardData.leadsCount.novo,
      em_andamento: dashboardData.leadsCount.emAndamento,
      concluido: dashboardData.leadsCount.concluido,
      conversionRate: dashboardData.conversionRate,
      todayLeads: dashboardData.recentActivity.filter(activity =>
        new Date(activity.timestamp).toDateString() === new Date().toDateString()
      ).length,
      weeklyGrowth,
    };
  }, [dashboardData]);

  const recentLeads = useMemo(() => {
    if (!recentLeadsData?.data) return [];
    return recentLeadsData.data.slice(0, 5);
  }, [recentLeadsData]);

  const handleRefresh = useCallback(() => {
    refetchDashboard();
    refetchLeads();
  }, [refetchDashboard, refetchLeads]);

  // Loading states
  if (dashboardLoading || leadsLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">
                Visão geral dos leads capturados
              </p>
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Loading Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-6 border rounded-lg">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>

          {/* Loading Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 border rounded-lg">
              <Skeleton className="h-6 w-48 mb-4" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="p-6 border rounded-lg">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Error states
  if (dashboardError || leadsError) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Visão geral dos leads capturados
            </p>
          </div>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                Erro ao carregar dados: {dashboardError?.message || leadsError?.message || 'Erro desconhecido'}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="ml-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Visão geral dos leads capturados
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Atualizar</span>
          </Button>
        </div>

        {/* Stats Cards Simplificados */}
        <StatsCards stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico Básico de Status */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Distribuição por Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: 'Novo', value: stats.novo },
                  { name: 'Em Andamento', value: stats.em_andamento },
                  { name: 'Concluído', value: stats.concluido },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Métricas Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Resumo</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Taxa de Conversão</span>
                  <Badge variant="default">
                    {stats.conversionRate.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Leads Hoje</span>
                  <Badge>{stats.todayLeads}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Crescimento Semanal</span>
                  <Badge variant={stats.weeklyGrowth >= 0 ? 'default' : 'secondary'}>
                    {stats.weeklyGrowth >= 0 ? '+' : ''}{stats.weeklyGrowth.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leads Recentes */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Leads Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {recentLeads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="text-lg">Nenhum lead ainda</div>
                  <p className="text-sm mt-2">Os leads capturados aparecerão aqui</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="p-4 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-medium text-sm">{lead.name}</div>
                        <Badge
                          variant={
                            lead.status === 'NOVO' ? 'default' :
                            lead.status === 'EM_ANDAMENTO' ? 'secondary' : 'outline'
                          }
                          className="text-xs"
                        >
                          {lead.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mb-3">{lead.phone}</div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {new Date(lead.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                          })}
                        </span>
                        <span>
                          {new Date(lead.createdAt).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;