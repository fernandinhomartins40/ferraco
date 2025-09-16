import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AdminLayout from '@/components/admin/AdminLayout';
import StatsCards from '@/components/admin/StatsCards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { leadStorage } from '@/utils/leadStorage';
import { LeadStats } from '@/types/lead';

const AdminDashboard = () => {
  const [stats, setStats] = useState<LeadStats>({ total: 0, novo: 0, em_andamento: 0, concluido: 0 });
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    // Load stats
    const currentStats = leadStorage.getStats();
    setStats(currentStats);

    // Generate chart data for the last 7 days
    const leads = leadStorage.getLeads();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    const chartData = last7Days.map(date => {
      const dayLeads = leads.filter(lead => {
        const leadDate = new Date(lead.createdAt);
        return leadDate.toDateString() === date.toDateString();
      });

      return {
        date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        leads: dayLeads.length,
        novos: dayLeads.filter(lead => lead.status === 'novo').length,
        andamento: dayLeads.filter(lead => lead.status === 'em_andamento').length,
        concluidos: dayLeads.filter(lead => lead.status === 'concluido').length,
      };
    });

    setChartData(chartData);
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Leads dos Últimos 7 Dias</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="leads" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent Leads */}
          <Card>
            <CardHeader>
              <CardTitle>Leads Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {recentLeads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum lead ainda
                </div>
              ) : (
                <div className="space-y-4">
                  {recentLeads.map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <div className="font-medium">{lead.name}</div>
                        <div className="text-sm text-muted-foreground">{lead.phone}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium capitalize">{lead.status.replace('_', ' ')}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(lead.createdAt).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
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