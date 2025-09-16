import { useState, useEffect, useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import StatsCards from '@/components/admin/StatsCards';
import LeadFilters from '@/components/admin/LeadFilters';
import LeadTable from '@/components/admin/LeadTable';
import { leadStorage } from '@/utils/leadStorage';
import { Lead, LeadStats, LeadFilters as LeadFiltersType } from '@/types/lead';

const AdminLeads = () => {
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats>({ total: 0, novo: 0, em_andamento: 0, concluido: 0 });
  const [filters, setFilters] = useState<LeadFiltersType>({
    status: 'todos',
    search: '',
    dateRange: 'todos',
  });

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = () => {
    const leads = leadStorage.getLeads();
    const currentStats = leadStorage.getStats();
    setAllLeads(leads);
    setStats(currentStats);
  };

  const filteredLeads = useMemo(() => {
    return leadStorage.filterLeads(
      filters.search,
      filters.status,
      filters.dateRange
    );
  }, [filters, allLeads]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Leads</h1>
          <p className="text-muted-foreground">
            Gerencie todos os leads capturados pelo site
          </p>
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
          </div>
        </div>

        {/* Leads Table */}
        <LeadTable
          leads={filteredLeads}
          onLeadsChange={loadLeads}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminLeads;