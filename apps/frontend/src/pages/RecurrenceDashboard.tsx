import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRecurrenceLeadStats, useRecurrenceTemplateStats } from '@/hooks/api/useRecurrence';
import { Repeat, Users, TrendingUp, MessageSquare, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function RecurrenceDashboard() {
  const { data: leadStats, isLoading: loadingLeads } = useRecurrenceLeadStats();
  const { data: templateStats, isLoading: loadingTemplates } = useRecurrenceTemplateStats();

  if (loadingLeads || loadingTemplates) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const recurrenceRate = leadStats
    ? ((leadStats.recurrentLeads / leadStats.totalLeads) * 100).toFixed(1)
    : '0';

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard de Recorrência</h1>
        <p className="text-muted-foreground">
          Análise de leads recorrentes e performance de mensagens
        </p>
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
              {leadStats?.avgCapturesPerLead.toFixed(1) || '0.0'}x
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
                  className="flex items-center justify-between p-3 rounded-lg border"
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
                    <Badge variant="secondary">{lead.captureCount}x capturas</Badge>
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
            <div className="space-y-4">
              {templateStats.templates.map((template) => (
                <div key={template.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{template.name}</span>
                      {template.isActive ? (
                        <Badge variant="default">Ativo</Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {template.usageCount} usos ({template.usagePercentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${template.usagePercentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum template encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
