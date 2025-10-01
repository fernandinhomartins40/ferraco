import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Download, Eye, RefreshCw, Users, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { partialLeadService, PartialLead, PartialLeadStats, PartialLeadFilters } from '@/services/partialLeadService';
import { leadStorage } from '@/utils/leadStorage';
import { logger } from '@/lib/logger';

const PartialLeadsManager: React.FC = () => {
  const [partialLeads, setPartialLeads] = useState<PartialLead[]>([]);
  const [stats, setStats] = useState<PartialLeadStats>({
    total: 0,
    abandoned: 0,
    converted: 0,
    active: 0,
    todayCount: 0,
    conversionRate: 0,
  });
  const [filters, setFilters] = useState<PartialLeadFilters>({
    status: 'all',
    dateRange: 'all',
    source: '',
    search: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Carregar dados
  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await partialLeadService.getPartialLeads(filters);

      if (result) {
        setPartialLeads(result.leads);
        setStats(result.stats);
      } else {
        throw new Error('Falha ao carregar dados');
      }
    } catch (error) {
      logger.error('Erro ao carregar leads parciais:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar leads parciais',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Converter lead parcial em lead real
  const convertToRealLead = async (partialLeadId: string) => {
    try {
      const success = await partialLeadService.convertPartialLead(partialLeadId);

      if (success) {
        toast({
          title: 'Sucesso!',
          description: 'Lead parcial convertido para lead real.',
          variant: 'default',
        });

        loadData(); // Recarregar dados
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível converter o lead.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      logger.error('Erro ao converter lead:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao converter lead parcial.',
        variant: 'destructive',
      });
    }
  };

  // Marcar como abandonado
  const markAsAbandoned = async (partialLeadId: string) => {
    try {
      const success = await partialLeadService.markAsAbandoned(partialLeadId);

      if (success) {
        toast({
          title: 'Marcado como abandonado',
          description: 'Lead marcado como abandonado.',
          variant: 'default',
        });

        loadData(); // Recarregar dados
      } else {
        toast({
          title: 'Erro',
          description: 'Erro ao marcar lead como abandonado.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      logger.error('Erro ao marcar como abandonado:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao marcar lead como abandonado.',
        variant: 'destructive',
      });
    }
  };

  // Exportar para CSV
  const exportToCSV = async () => {
    try {
      const success = await partialLeadService.exportToCSV();

      if (success) {
        toast({
          title: 'Exportado!',
          description: 'Leads parciais exportados com sucesso.',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Nenhum dado',
          description: 'Não há leads parciais para exportar.',
          variant: 'default',
        });
      }
    } catch (error) {
      logger.error('Erro ao exportar:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao exportar leads parciais.',
        variant: 'destructive',
      });
    }
  };

  // Limpeza de dados antigos
  const cleanupOldData = async () => {
    try {
      const result = await partialLeadService.cleanupOldLeads(30);

      if (result) {
        toast({
          title: 'Limpeza concluída',
          description: `${result.removedCount} leads antigos foram removidos.`,
          variant: 'default',
        });

        loadData(); // Recarregar dados
      } else {
        toast({
          title: 'Erro',
          description: 'Erro ao limpar dados antigos.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      logger.error('Erro na limpeza:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao limpar dados antigos.',
        variant: 'destructive',
      });
    }
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  // Obter status badge
  const getStatusBadge = (lead: PartialLead) => {
    if (lead.completed) {
      return <Badge variant="default" className="bg-green-500">Convertido</Badge>;
    }
    if (lead.abandoned) {
      return <Badge variant="destructive">Abandonado</Badge>;
    }
    return <Badge variant="secondary">Ativo</Badge>;
  };

  // Aplicar filtros
  const applyFilters = () => {
    loadData();
  };

  // Carregar dados no início
  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Leads parciais</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Em andamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Convertidos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.converted}</div>
            <p className="text-xs text-muted-foreground">Taxa: {stats.conversionRate}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abandonados</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.abandoned}</div>
            <p className="text-xs text-muted-foreground">Perdidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoje</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayCount}</div>
            <p className="text-xs text-muted-foreground">Novos hoje</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Ações */}
      <Card>
        <CardHeader>
          <CardTitle>Leads Parciais Capturados</CardTitle>
          <CardDescription>
            Visualize e gerencie leads que começaram a preencher formulários mas não finalizaram
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Nome ou telefone..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value: any) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="converted">Convertidos</SelectItem>
                  <SelectItem value="abandoned">Abandonados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dateRange">Período</Label>
              <Select
                value={filters.dateRange}
                onValueChange={(value: any) => setFilters({ ...filters, dateRange: value })}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">7 dias</SelectItem>
                  <SelectItem value="month">30 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={applyFilters} disabled={isLoading}>
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                Filtrar
              </Button>
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button variant="outline" onClick={cleanupOldData}>
                Limpar Antigos
              </Button>
            </div>
          </div>

          {/* Lista de Leads Parciais */}
          <div className="border rounded-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-4">Nome</th>
                    <th className="text-left p-4">Telefone</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Interações</th>
                    <th className="text-left p-4">Primeira Captura</th>
                    <th className="text-left p-4">Última Atualização</th>
                    <th className="text-left p-4">Fonte</th>
                    <th className="text-right p-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {partialLeads.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center p-8 text-muted-foreground">
                        Nenhum lead parcial encontrado
                      </td>
                    </tr>
                  ) : (
                    partialLeads.map((lead) => (
                      <tr key={lead.id} className="border-b hover:bg-muted/30">
                        <td className="p-4">
                          <div className="font-medium">{lead.name || 'N/A'}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">{lead.phone || 'N/A'}</div>
                        </td>
                        <td className="p-4">
                          {getStatusBadge(lead)}
                        </td>
                        <td className="p-4">
                          <Badge variant="outline">{lead.interactions}</Badge>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-muted-foreground">
                            {formatDate(lead.firstInteraction)}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-muted-foreground">
                            {formatDate(lead.lastUpdate)}
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="secondary">{lead.source}</Badge>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            {!lead.completed && !lead.abandoned && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => convertToRealLead(lead.id)}
                                  disabled={!lead.name.trim() || !lead.phone.trim()}
                                >
                                  Converter
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => markAsAbandoned(lead.id)}
                                >
                                  Abandonar
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Informações adicionais */}
          <div className="mt-4 text-sm text-muted-foreground">
            <p>
              <strong>Dica:</strong> Leads parciais são capturados automaticamente quando usuários começam a digitar nos formulários.
              Use essa ferramenta para recuperar potenciais clientes que não finalizaram o cadastro.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartialLeadsManager;