import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import AdminLayout from '@/components/admin/AdminLayout';
import StatsCards from '@/components/admin/StatsCards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { leadStorage } from '@/utils/leadStorage';
import { LeadStats, DashboardMetrics } from '@/types/lead';
import { Clock, AlertTriangle } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState<LeadStats>({
    total: 0,
    novo: 0,
    em_andamento: 0,
    concluido: 0,
    conversionRate: 0,
    averageConversionTime: 0,
    todayLeads: 0,
    weeklyGrowth: 0,
    oldLeadsCount: 0,
  });
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    // Load advanced stats
    const currentStats = leadStorage.getAdvancedStats();
    setStats(currentStats);

    // Load dashboard metrics
    const dashboardMetrics = leadStorage.getDashboardMetrics();
    setMetrics(dashboardMetrics);
  };

  const recentLeads = leadStorage.getLeads().slice(0, 5);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral dos leads capturados
          </p>
        </div>

        {/* Stats Cards */}
        <StatsCards stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trends Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Tendências dos Últimos 30 Dias</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics && (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metrics.trendsData}>
                    <defs>
                      <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis
                      dataKey="date"
                      fontSize={12}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    />
                    <YAxis fontSize={12} />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                      formatter={(value: any, name: any) => [
                        value,
                        name === 'leads' ? 'Leads' : name === 'conversions' ? 'Conversões' : 'Taxa de Conversão'
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="leads"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorLeads)"
                    />
                    <Area
                      type="monotone"
                      dataKey="conversions"
                      stroke="hsl(var(--chart-2))"
                      fillOpacity={1}
                      fill="url(#colorConversions)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {metrics && (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Crescimento Semanal</span>
                      <Badge variant={metrics.weeklyGrowth >= 0 ? 'default' : 'secondary'}>
                        {metrics.weeklyGrowth >= 0 ? '+' : ''}{metrics.weeklyGrowth}%
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Crescimento Mensal</span>
                      <Badge variant={metrics.monthlyGrowth >= 0 ? 'default' : 'secondary'}>
                        {metrics.monthlyGrowth >= 0 ? '+' : ''}{metrics.monthlyGrowth}%
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Leads Hoje</span>
                      <Badge>{metrics.todayLeads}</Badge>
                    </div>
                  </div>

                  {metrics.oldLeadsAlert > 0 && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <div className="flex items-center space-x-2 text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">Atenção Necessária</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {metrics.oldLeadsAlert} leads há mais de 7 dias sem contato
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Recent Leads */}
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
                            lead.status === 'novo' ? 'default' :
                            lead.status === 'em_andamento' ? 'secondary' : 'outline'
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