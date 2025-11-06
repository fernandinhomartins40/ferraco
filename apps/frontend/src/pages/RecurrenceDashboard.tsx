import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRecurrenceLeadStats, useRecurrenceTemplateStats } from '@/hooks/api/useRecurrence';
import { Repeat, Users, TrendingUp, MessageSquare, AlertCircle, Download, Filter, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function RecurrenceDashboard() {
  const { data: leadStats, isLoading: loadingLeads } = useRecurrenceLeadStats();
  const { data: templateStats, isLoading: loadingTemplates } = useRecurrenceTemplateStats();

  const [timeRange, setTimeRange] = useState('7d');
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);

  if (loadingLeads || loadingTemplates) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const recurrenceRate =
    leadStats && leadStats.totalLeads > 0
      ? ((leadStats.recurrentLeads / leadStats.totalLeads) * 100).toFixed(1)
      : '0.0';

  const avgCapturesDisplay =
    leadStats && typeof leadStats.avgCapturesPerLead === 'number'
      ? leadStats.avgCapturesPerLead.toFixed(1)
      : '0.0';

  // Dados simulados para gráfico de tendências (idealmente viriam da API)
  const trendData = [
    { month: 'Jan', recorrentes: 12, novos: 45 },
    { month: 'Fev', recorrentes: 18, novos: 52 },
    { month: 'Mar', recorrentes: 25, novos: 48 },
    { month: 'Abr', recorrentes: 32, novos: 55 },
    { month: 'Mai', recorrentes: 28, novos: 50 },
    { month: 'Jun', recorrentes: 35, novos: 60 },
  ];

  // Função para exportar CSV
  const exportToCsv = () => {
    if (!leadStats?.topRecurrentLeads) return;

    const headers = ['Nome', 'Telefone', 'Capturas', 'Última Captura', 'Score'];
    const rows = leadStats.topRecurrentLeads.map(lead => [
      lead.name,
      lead.phone,
      lead.captureCount,
      format(new Date(lead.lastCapturedAt), 'dd/MM/yyyy HH:mm'),
      lead.leadScore,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leads-recorrentes-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  // Preview de template com dados de exemplo
  const previewTemplateContent = (template: any) => {
    const exampleData = {
      'lead.name': 'João Silva',
      'captureNumber': '3',
      'daysSinceLastCapture': '7',
      'previousInterests': 'Bebedouro, Resfriador',
      'currentInterest': 'Ordenhadeira',
    };

    let preview = template.content;
    Object.entries(exampleData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });

    return preview;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header com filtros */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Recorrência</h1>
          <p className="text-muted-foreground">
            Análise de leads recorrentes e performance de mensagens
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
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
          <Button variant="outline" onClick={exportToCsv}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leadStats?.totalLeads || 0}</div>
            <p className="text-xs text-muted-foreground">Todos os leads cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Recorrentes</CardTitle>
            <Repeat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leadStats?.recurrentLeads || 0}</div>
            <p className="text-xs text-muted-foreground">{recurrenceRate}% do total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média de Capturas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgCapturesDisplay}x
            </div>
            <p className="text-xs text-muted-foreground">Por lead</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates Ativos</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templateStats?.activeCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              {templateStats?.totalUsage || 0} envios totais
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Tendências */}
      <Card>
        <CardHeader>
          <CardTitle>Tendência de Recorrência</CardTitle>
          <CardDescription>Comparação entre leads novos e recorrentes ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="novos" stroke="#8884d8" name="Leads Novos" />
              <Line type="monotone" dataKey="recorrentes" stroke="#82ca9d" name="Leads Recorrentes" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Leads Recorrentes */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Leads Recorrentes</CardTitle>
          <CardDescription>Leads que mais demonstraram interesse</CardDescription>
        </CardHeader>
        <CardContent>
          {leadStats?.topRecurrentLeads && leadStats.topRecurrentLeads.length > 0 ? (
            <div className="space-y-4">
              {leadStats.topRecurrentLeads.map((lead, index) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{lead.name}</p>
                      <p className="text-sm text-muted-foreground">{lead.phone}</p>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex gap-2">
                      <Badge variant="secondary">{lead.captureCount}x capturas</Badge>
                      <Badge variant="outline">Score: {lead.leadScore}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(lead.lastCapturedAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum lead recorrente encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance de Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Performance de Templates</CardTitle>
          <CardDescription>Estatísticas de uso dos templates de mensagens</CardDescription>
        </CardHeader>
        <CardContent>
          {templateStats?.templates && templateStats.templates.length > 0 ? (
            <div className="space-y-6">
              {/* Gráfico de barras */}
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={templateStats.templates.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="usageCount" fill="#8884d8" name="Usos" />
                </BarChart>
              </ResponsiveContainer>

              {/* Lista detalhada */}
              <div className="space-y-4">
                {templateStats.templates.map((template) => {
                  const usagePercentage =
                    typeof template.usagePercentage === 'number'
                      ? template.usagePercentage
                      : 0;
                  const usagePercentageDisplay = usagePercentage.toFixed(1);

                  return (
                    <div key={template.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{template.name}</span>
                          {template.isActive ? (
                            <Badge variant="default">Ativo</Badge>
                          ) : (
                            <Badge variant="secondary">Inativo</Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewTemplate(template)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {template.usageCount} usos ({usagePercentageDisplay}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${usagePercentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum template encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Preview de Template */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preview do Template</DialogTitle>
            <DialogDescription>
              Exemplo de como a mensagem será enviada para o lead
            </DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Dados de Exemplo:</p>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• Nome: João Silva</li>
                  <li>• Captura: 3ª vez</li>
                  <li>• Dias desde última: 7</li>
                  <li>• Interesse anterior: Bebedouro, Resfriador</li>
                  <li>• Interesse atual: Ordenhadeira</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg bg-background">
                <p className="text-sm whitespace-pre-wrap">{previewTemplateContent(previewTemplate)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
