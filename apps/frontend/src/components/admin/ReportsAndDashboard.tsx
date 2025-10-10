import { useState, useEffect } from 'react';
import { BarChart3, Download, Plus, Settings, Calendar, Filter, FileText, PieChart, TrendingUp, Users, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { DatePickerWithRange } from '@/components/ui/date-range-picker'; // TODO: Criar componente
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { Report, DashboardConfig, TagStats } from '@/types/lead';
import { reportStorage } from '@/utils/reportStorage';
import { leadStorage } from '@/utils/leadStorage';
import { tagStorage } from '@/utils/tagStorage';
import { useToast } from '@/hooks/use-toast';

const ReportsAndDashboard = () => {
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [dashboardConfigs, setDashboardConfigs] = useState<DashboardConfig[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [isCreateReportOpen, setIsCreateReportOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setReports(reportStorage.getReports());
    setDashboardConfigs(reportStorage.getDashboardConfigs());
  };

  const handleGenerateReport = async (report: Report) => {
    try {
      const data = reportStorage.generateReportData(report.id);
      setReportData(data);
      setSelectedReport(report);

      toast({
        title: 'Relatório gerado',
        description: `Relatório "${report.name}" gerado com sucesso!`,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao gerar relatório',
        variant: 'destructive',
      });
    }
  };

  const handleExportReport = async (report: Report, format: 'pdf' | 'excel' | 'csv' | 'json') => {
    try {
      const result = await reportStorage.exportReport(report.id, format);

      if (result.success && result.data) {
        const data = result.data as { filename: string; content: string; mimeType: string };
        reportStorage.downloadReport(data.filename, data.content, data.mimeType);

        toast({
          title: 'Relatório exportado',
          description: `Relatório exportado em formato ${format.toUpperCase()}`,
        });
      } else {
        toast({
          title: 'Erro na exportação',
          description: result.error || 'Erro desconhecido',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao exportar relatório',
        variant: 'destructive',
      });
    }
  };

  // Quick stats for dashboard
  const quickStats = leadStorage.getExtendedStats();
  const tagStats = tagStorage.getTagStats();

  // Chart colors
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f'];

  // Generate performance dashboard data
  const performanceData = [
    {
      name: 'Jan',
      leads: 12,
      conversions: 8,
      conversionRate: 66.7,
    },
    {
      name: 'Fev',
      leads: 19,
      conversions: 11,
      conversionRate: 57.9,
    },
    {
      name: 'Mar',
      leads: 25,
      conversions: 18,
      conversionRate: 72.0,
    },
    {
      name: 'Abr',
      leads: 31,
      conversions: 22,
      conversionRate: 71.0,
    },
    {
      name: 'Mai',
      leads: 28,
      conversions: 19,
      conversionRate: 67.9,
    },
    {
      name: 'Jun',
      leads: 35,
      conversions: 28,
      conversionRate: 80.0,
    },
  ];

  const statusDistribution = [
    { name: 'Novos', value: quickStats.novo, color: '#8884d8' },
    { name: 'Em Andamento', value: quickStats.em_andamento, color: '#82ca9d' },
    { name: 'Concluídos', value: quickStats.concluido, color: '#ffc658' },
  ];

  const sourceDistribution = Object.entries(quickStats.bySource).map(([source, count]) => ({
    name: source === 'unknown' ? 'Desconhecido' : source,
    value: count,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Relatórios e Dashboard</h2>
          <p className="text-muted-foreground">
            Análises detalhadas e relatórios personalizáveis
          </p>
        </div>
        <Button onClick={() => setIsCreateReportOpen(true)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Novo Relatório</span>
        </Button>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard Executivo</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="analytics">Analytics Avançado</TabsTrigger>
        </TabsList>

        {/* Executive Dashboard */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{quickStats.total}</div>
                    <div className="text-blue-100">Total de Leads</div>
                  </div>
                  <Users className="h-8 w-8 text-blue-200" />
                </div>
                <div className="mt-2 text-sm text-blue-100">
                  +{quickStats.todayLeads} hoje
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{quickStats.conversionRate}%</div>
                    <div className="text-green-100">Taxa de Conversão</div>
                  </div>
                  <Target className="h-8 w-8 text-green-200" />
                </div>
                <div className="mt-2 text-sm text-green-100">
                  {quickStats.weeklyGrowth > 0 ? '+' : ''}{quickStats.weeklyGrowth}% esta semana
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{quickStats.averageConversionTime}d</div>
                    <div className="text-purple-100">Tempo Médio</div>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-200" />
                </div>
                <div className="mt-2 text-sm text-purple-100">
                  Conversão média
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{quickStats.oldLeadsCount}</div>
                    <div className="text-orange-100">Leads Antigos</div>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-200" />
                </div>
                <div className="mt-2 text-sm text-orange-100">
                  Precisam atenção
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Tendência de Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="leads"
                      stroke="#8884d8"
                      fillOpacity={1}
                      fill="url(#colorLeads)"
                      name="Leads"
                    />
                    <Area
                      type="monotone"
                      dataKey="conversions"
                      stroke="#82ca9d"
                      fillOpacity={1}
                      fill="url(#colorConversions)"
                      name="Conversões"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Source Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Origem dos Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={sourceDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Tag Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Performance das Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tagStats.slice(0, 5).map((tag, index) => (
                    <div key={tag.tagId} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm font-medium capitalize">{tag.tagName}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">{tag.conversionRate}%</div>
                        <div className="text-xs text-muted-foreground">{tag.count} leads</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleGenerateReport(reports[0])}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Relatório de Leads
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleGenerateReport(reports[1])}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Funil de Conversão
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleGenerateReport(reports[2])}
                >
                  <PieChart className="h-4 w-4 mr-2" />
                  Performance Tags
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleExportReport(reports[0], 'csv')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reports */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report) => (
              <Card key={report.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{report.name}</CardTitle>
                    <Badge variant="outline">{report.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {report.widgets.length} widgets configurados
                  </p>
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateReport(report)}
                    >
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Gerar
                    </Button>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExportReport(report, 'csv')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {report.isScheduled && (
                    <Badge variant="secondary" className="text-xs">
                      Agendado
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Report Display */}
          {selectedReport && reportData && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{selectedReport.name}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportReport(selectedReport, 'csv')}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportReport(selectedReport, 'json')}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      JSON
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {selectedReport.type === 'leads_overview' && reportData.metrics && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold">{reportData.metrics.total_leads}</div>
                      <div className="text-sm text-muted-foreground">Total Leads</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold">{reportData.metrics.conversion_rate}</div>
                      <div className="text-sm text-muted-foreground">Taxa Conversão</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold">{reportData.metrics.converted_leads}</div>
                      <div className="text-sm text-muted-foreground">Convertidos</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold">{reportData.metrics.pending_leads}</div>
                      <div className="text-sm text-muted-foreground">Pendentes</div>
                    </div>
                  </div>
                )}

                {reportData.timeline && (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={reportData.timeline}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Advanced Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversion Funnel */}
            <Card>
              <CardHeader>
                <CardTitle>Funil de Conversão Detalhado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <span className="font-medium">Leads Capturados</span>
                    <div className="text-right">
                      <div className="text-xl font-bold">{quickStats.total}</div>
                      <div className="text-sm text-muted-foreground">100%</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                    <span className="font-medium">Em Contato</span>
                    <div className="text-right">
                      <div className="text-xl font-bold">
                        {quickStats.total - quickStats.novo}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {quickStats.total > 0 ? Math.round(((quickStats.total - quickStats.novo) / quickStats.total) * 100) : 0}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <span className="font-medium">Em Negociação</span>
                    <div className="text-right">
                      <div className="text-xl font-bold">{quickStats.em_andamento}</div>
                      <div className="text-sm text-muted-foreground">
                        {quickStats.total > 0 ? Math.round((quickStats.em_andamento / quickStats.total) * 100) : 0}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <span className="font-medium">Convertidos</span>
                    <div className="text-right">
                      <div className="text-xl font-bold">{quickStats.concluido}</div>
                      <div className="text-sm text-muted-foreground">
                        {quickStats.conversionRate}%
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tag Performance Detail */}
            <Card>
              <CardHeader>
                <CardTitle>Análise Detalhada de Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tagStats.map((tag, index) => (
                    <div key={tag.tagId} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">{tag.tagName}</span>
                        <Badge variant={tag.trend === 'up' ? 'default' : tag.trend === 'down' ? 'destructive' : 'secondary'}>
                          {tag.trend === 'up' ? '↗' : tag.trend === 'down' ? '↘' : '→'} {tag.trend}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <div className="text-muted-foreground">Leads</div>
                          <div className="font-medium">{tag.count}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Conversão</div>
                          <div className="font-medium">{tag.conversionRate}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Tempo Médio</div>
                          <div className="font-medium">{tag.averageTime}d</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsAndDashboard;