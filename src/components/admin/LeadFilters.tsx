import { useState } from 'react';
import { Search, Filter, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LeadFilters as LeadFiltersType } from '@/types/lead';
import { leadStorage } from '@/utils/leadStorage';
import { useToast } from '@/hooks/use-toast';

interface LeadFiltersProps {
  filters: LeadFiltersType;
  onFiltersChange: (filters: LeadFiltersType) => void;
}

const LeadFilters = ({ filters, onFiltersChange }: LeadFiltersProps) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const csvContent = leadStorage.exportToCSV();
      
      if (!csvContent) {
        toast({
          title: 'Nenhum dado para exportar',
          description: 'Não há leads para exportar.',
          variant: 'destructive'
        });
        return;
      }
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `leads_ferraco_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Exportação realizada',
        description: 'Os leads foram exportados com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro na exportação',
        description: 'Ocorreu um erro ao exportar os leads.',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Buscar por nome ou telefone..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-10"
        />
      </div>

      {/* Status Filter */}
      <div className="flex items-center space-x-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select
          value={filters.status}
          onValueChange={(value) => onFiltersChange({ ...filters, status: value as any })}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="novo">Novos</SelectItem>
            <SelectItem value="em_andamento">Em Andamento</SelectItem>
            <SelectItem value="concluido">Concluídos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date Range Filter */}
      <Select
        value={filters.dateRange}
        onValueChange={(value) => onFiltersChange({ ...filters, dateRange: value as any })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos</SelectItem>
          <SelectItem value="hoje">Hoje</SelectItem>
          <SelectItem value="semana">Última Semana</SelectItem>
          <SelectItem value="mes">Último Mês</SelectItem>
        </SelectContent>
      </Select>

      {/* Export Button */}
      <Button 
        variant="outline" 
        onClick={handleExport}
        disabled={isExporting}
        className="flex items-center space-x-2"
      >
        <Download className="w-4 h-4" />
        <span>{isExporting ? 'Exportando...' : 'Exportar'}</span>
      </Button>
    </div>
  );
};

export default LeadFilters;