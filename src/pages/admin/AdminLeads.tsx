import { useState, useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import StatsCards from '@/components/admin/StatsCards';
import LeadFilters from '@/components/admin/LeadFilters';
import LeadTable from '@/components/admin/LeadTable';
import { useLeads, useLeadStats } from '@/hooks/api/useLeads';
import { Lead, LeadStats, LeadFilters as LeadFiltersType } from '@/types/lead';
import { ApiLead, LeadFilters as ApiLeadFilters } from '@/types/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Função para converter ApiLead para Lead (frontend)
const convertApiLeadToLead = (apiLead: ApiLead): Lead => ({
  id: apiLead.id,
  name: apiLead.name,
  phone: apiLead.phone,
  status: apiLead.status === 'NOVO' ? 'novo' :
          apiLead.status === 'EM_ANDAMENTO' ? 'em_andamento' : 'concluido',
  createdAt: apiLead.createdAt,
  updatedAt: apiLead.updatedAt,
  notes: apiLead.notes?.map(note => ({
    id: note.id,
    content: note.content,
    createdAt: note.createdAt,
    important: note.important,
  })),
  tags: apiLead.tags?.map(tag => tag.tag.name),
  source: apiLead.source,
  priority: apiLead.priority?.toLowerCase() as 'low' | 'medium' | 'high',
  assignedTo: apiLead.assignedTo,
  nextFollowUp: apiLead.nextFollowUp,
  leadScore: apiLead.leadScore,
  pipelineStage: apiLead.pipelineStage,
  duplicateOf: apiLead.duplicateOf,
  isDuplicate: apiLead.isDuplicate,
});

// Função para converter filtros do frontend para API
const convertFiltersToApi = (filters: LeadFiltersType): ApiLeadFilters => ({
  status: filters.status === 'todos' ? undefined :
          filters.status === 'novo' ? 'NOVO' :
          filters.status === 'em_andamento' ? 'EM_ANDAMENTO' : 'CONCLUIDO',
  search: filters.search || undefined,
  // dateFrom e dateTo podem ser implementados baseado no dateRange
  tags: filters.tags?.length ? filters.tags : undefined,
});

const AdminLeads = () => {
  const [filters, setFilters] = useState<LeadFiltersType>({
    status: 'todos',
    search: '',
    dateRange: 'todos',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    tags: [],
  });

  // Converter filtros para API
  const apiFilters = useMemo(() => convertFiltersToApi(filters), [filters]);

  // Usar hooks da API
  const {
    data: leadsResponse,
    isLoading: leadsLoading,
    error: leadsError,
    refetch: refetchLeads
  } = useLeads({
    ...apiFilters,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    limit: 100, // Buscar mais leads por página
  });

  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useLeadStats();

  // Converter dados da API para formato do frontend
  const allLeads = useMemo(() => {
    if (!leadsResponse?.data) return [];
    return leadsResponse.data.map(convertApiLeadToLead);
  }, [leadsResponse]);

  const stats: LeadStats = useMemo(() => {
    if (!statsData) {
      return {
        total: 0,
        novo: 0,
        em_andamento: 0,
        concluido: 0,
        conversionRate: 0,
        averageConversionTime: 0,
        todayLeads: 0,
        weeklyGrowth: 0,
        oldLeadsCount: 0,
      };
    }

    // Mapear dados da API para formato esperado
    return {
      total: statsData.total || 0,
      novo: statsData.byStatus?.NOVO || 0,
      em_andamento: statsData.byStatus?.EM_ANDAMENTO || 0,
      concluido: statsData.byStatus?.CONCLUIDO || 0,
      conversionRate: statsData.conversionRate || 0,
      averageConversionTime: statsData.averageConversionTime || 0,
      todayLeads: statsData.todayLeads || 0,
      weeklyGrowth: statsData.weeklyGrowth || 0,
      oldLeadsCount: statsData.oldLeadsCount || 0,
    };
  }, [statsData]);

  // Filtrar leads localmente (para filtros mais complexos)
  const filteredLeads = useMemo(() => {
    let filtered = [...allLeads];

    // Filtros de data local (se necessário)
    if (filters.dateRange !== 'todos') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      switch (filters.dateRange) {
        case 'hoje':
          filtered = filtered.filter(lead => {
            const leadDate = new Date(lead.createdAt);
            return leadDate >= today;
          });
          break;
        case 'semana':
          const weekAgo = new Date(today);
          weekAgo.setDate(today.getDate() - 7);
          filtered = filtered.filter(lead => {
            const leadDate = new Date(lead.createdAt);
            return leadDate >= weekAgo;
          });
          break;
        case 'mes':
          const monthAgo = new Date(today);
          monthAgo.setMonth(today.getMonth() - 1);
          filtered = filtered.filter(lead => {
            const leadDate = new Date(lead.createdAt);
            return leadDate >= monthAgo;
          });
          break;
      }
    }

    return filtered;
  }, [allLeads, filters]);

  const handleRefresh = () => {
    refetchLeads();
    refetchStats();
  };

  // Loading states
  if (leadsLoading || statsLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Gerenciamento de Leads</h1>
            <p className="text-muted-foreground">
              Gerencie todos os leads capturados pelo site
            </p>
          </div>

          {/* Loading Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="p-6 border rounded-lg">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>

          {/* Loading Filters */}
          <div className="flex flex-wrap gap-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Loading Table */}
          <div className="border rounded-lg p-4">
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex space-x-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Error states
  if (leadsError || statsError) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Gerenciamento de Leads</h1>
            <p className="text-muted-foreground">
              Gerencie todos os leads capturados pelo site
            </p>
          </div>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                Erro ao carregar dados: {leadsError?.message || statsError?.message || 'Erro desconhecido'}
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
            <h1 className="text-3xl font-bold">Gerenciamento de Leads</h1>
            <p className="text-muted-foreground">
              Gerencie todos os leads capturados pelo site
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

        {/* Stats Cards */}
        <StatsCards stats={stats} />

        {/* Filters */}
        <LeadFilters
          filters={filters}
          onFiltersChange={setFilters}
        />

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {filteredLeads.length} de {allLeads.length} leads
            {leadsResponse?.pagination && (
              <span className="ml-2">
                ({leadsResponse.pagination.total} total no servidor)
              </span>
            )}
          </div>
        </div>

        {/* Leads Table */}
        <LeadTable
          leads={filteredLeads}
          onLeadsChange={() => {
            refetchLeads();
            refetchStats();
          }}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminLeads;