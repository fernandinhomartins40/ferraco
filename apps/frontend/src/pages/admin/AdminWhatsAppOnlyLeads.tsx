/**
 * Admin WhatsApp Only Leads
 *
 * Página para listar e gerenciar leads capturados via modo "whatsapp_only"
 */

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  MessageSquare,
  Download,
  Loader2,
  Search,
  Calendar,
  TrendingUp,
  Users,
  Clock,
  Filter,
  RefreshCw,
} from 'lucide-react';
import {
  whatsappOnlyLeadsService,
  type WhatsAppOnlyLead,
  type WhatsAppOnlyLeadsStats,
  type WhatsAppOnlyLeadsFilters,
} from '@/services/whatsappOnlyLeads.service';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AdminWhatsAppOnlyLeads = () => {
  const { toast } = useToast();

  // State
  const [leads, setLeads] = useState<WhatsAppOnlyLead[]>([]);
  const [stats, setStats] = useState<WhatsAppOnlyLeadsStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Filtros
  const [filters, setFilters] = useState<WhatsAppOnlyLeadsFilters>({
    page: 1,
    limit: 20,
    search: '',
    dateFrom: '',
    dateTo: '',
    source: '',
  });

  // Carregar leads
  useEffect(() => {
    loadLeads();
  }, [filters.page, filters.limit]);

  const loadLeads = async () => {
    try {
      setIsLoading(true);
      const response = await whatsappOnlyLeadsService.list(filters);
      setLeads(response.data);
      setPagination(response.pagination);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar leads',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar estatísticas
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const statsData = await whatsappOnlyLeadsService.getStats();
      setStats(statsData);
    } catch (error: any) {
      console.error('Erro ao carregar estatísticas', error);
    }
  };

  // Aplicar filtros
  const handleApplyFilters = () => {
    setFilters({ ...filters, page: 1 });
    loadLeads();
  };

  // Limpar filtros
  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      search: '',
      dateFrom: '',
      dateTo: '',
      source: '',
    });
    setTimeout(() => loadLeads(), 100);
  };

  // Exportar para Excel
  const handleExport = async () => {
    try {
      setIsExporting(true);
      await whatsappOnlyLeadsService.exportToExcel(filters);
      toast({
        title: 'Exportação concluída',
        description: 'O arquivo Excel foi baixado com sucesso.',
        variant: 'default',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao exportar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Paginação
  const handlePreviousPage = () => {
    if (pagination.page > 1) {
      setFilters({ ...filters, page: pagination.page - 1 });
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      setFilters({ ...filters, page: pagination.page + 1 });
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="w-8 h-8" />
              Leads WhatsApp Only
            </h1>
            <p className="text-muted-foreground mt-2">
              Leads capturados com notificação direta via WhatsApp
            </p>
          </div>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Exportar Excel
              </>
            )}
          </Button>
        </div>

        <Separator />

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">Todos os tempos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hoje</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.today}</div>
                <p className="text-xs text-muted-foreground">Últimas 24 horas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.thisWeek}</div>
                <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.thisMonth}</div>
                <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
            <CardDescription>Refine sua busca de leads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-2 block">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Nome, telefone ou email..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Date From */}
              <div>
                <label className="text-sm font-medium mb-2 block">Data Inicial</label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                />
              </div>

              {/* Date To */}
              <div>
                <label className="text-sm font-medium mb-2 block">Data Final</label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={handleApplyFilters}>
                <Search className="w-4 h-4 mr-2" />
                Aplicar Filtros
              </Button>
              <Button variant="outline" onClick={handleClearFilters}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Leads ({pagination.total})
            </CardTitle>
            <CardDescription>
              Página {pagination.page} de {pagination.totalPages}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : leads.length === 0 ? (
              <Alert>
                <AlertDescription>
                  Nenhum lead encontrado com os filtros aplicados.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Interesse</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium">{lead.name}</TableCell>
                          <TableCell>
                            {whatsappOnlyLeadsService.formatPhone(lead.phone)}
                          </TableCell>
                          <TableCell>{lead.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{lead.interest}</Badge>
                          </TableCell>
                          <TableCell>
                            {whatsappOnlyLeadsService.formatSource(lead.source)}
                          </TableCell>
                          <TableCell>
                            {new Date(lead.createdAt).toLocaleString('pt-BR', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {(pagination.page - 1) * pagination.limit + 1} a{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                    {pagination.total} leads
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={pagination.page === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminWhatsAppOnlyLeads;
