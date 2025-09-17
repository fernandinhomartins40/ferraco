import { useState } from 'react';
import { Search, Filter, Download, SortAsc, SortDesc, X, RotateCcw, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
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
  const [availableTags] = useState(() => leadStorage.getAllTags());

  const defaultFilters: LeadFiltersType = {
    status: 'todos',
    search: '',
    dateRange: 'todos',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    tags: [],
  };

  const hasActiveFilters =
    filters.search !== '' ||
    filters.status !== 'todos' ||
    filters.dateRange !== 'todos' ||
    filters.tags.length > 0 ||
    filters.sortBy !== 'createdAt' ||
    filters.sortOrder !== 'desc';

  const resetFilters = () => {
    onFiltersChange(defaultFilters);
  };

  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    onFiltersChange({ ...filters, tags: newTags });
  };

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
    <div className="space-y-4">
      {/* Main Filters Row */}
      <div className="flex flex-col lg:flex-row gap-4">
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

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Status Filter */}
          <Select
            value={filters.status}
            onValueChange={(value) => onFiltersChange({ ...filters, status: value as any })}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Status</SelectItem>
              <SelectItem value="novo">Novos</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="concluido">Concluídos</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range Filter */}
          <Select
            value={filters.dateRange}
            onValueChange={(value) => onFiltersChange({ ...filters, dateRange: value as any })}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Períodos</SelectItem>
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="semana">Última Semana</SelectItem>
              <SelectItem value="mes">Último Mês</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onValueChange={(value) => {
              const [sortBy, sortOrder] = value.split('-') as [typeof filters.sortBy, typeof filters.sortOrder];
              onFiltersChange({ ...filters, sortBy, sortOrder });
            }}
          >
            <SelectTrigger className="w-48">
              <div className="flex items-center space-x-2">
                {filters.sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                <SelectValue placeholder="Ordenar" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt-desc">Mais Recente</SelectItem>
              <SelectItem value="createdAt-asc">Mais Antigo</SelectItem>
              <SelectItem value="updatedAt-desc">Atualizado Recente</SelectItem>
              <SelectItem value="updatedAt-asc">Atualizado Antigo</SelectItem>
              <SelectItem value="name-asc">Nome A-Z</SelectItem>
              <SelectItem value="name-desc">Nome Z-A</SelectItem>
              <SelectItem value="status-asc">Status A-Z</SelectItem>
              <SelectItem value="status-desc">Status Z-A</SelectItem>
            </SelectContent>
          </Select>

          {/* Tags Filter */}
          {availableTags.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center space-x-2">
                  <Tag className="w-4 h-4" />
                  <span>Tags</span>
                  {filters.tags.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {filters.tags.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="space-y-2">
                  <div className="font-medium text-sm">Filtrar por tags:</div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {availableTags.map((tag) => (
                      <div key={tag} className="flex items-center space-x-2">
                        <Checkbox
                          id={`tag-${tag}`}
                          checked={filters.tags.includes(tag)}
                          onCheckedChange={() => toggleTag(tag)}
                        />
                        <label
                          htmlFor={`tag-${tag}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                        >
                          {tag}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="flex items-center space-x-1"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Limpar</span>
              </Button>
            )}

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
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Filtros ativos:</span>

          {filters.search && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>"{filters.search}"</span>
              <X
                className="w-3 h-3 cursor-pointer hover:text-destructive"
                onClick={() => onFiltersChange({ ...filters, search: '' })}
              />
            </Badge>
          )}

          {filters.status !== 'todos' && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>Status: {filters.status.replace('_', ' ')}</span>
              <X
                className="w-3 h-3 cursor-pointer hover:text-destructive"
                onClick={() => onFiltersChange({ ...filters, status: 'todos' })}
              />
            </Badge>
          )}

          {filters.dateRange !== 'todos' && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>Período: {filters.dateRange}</span>
              <X
                className="w-3 h-3 cursor-pointer hover:text-destructive"
                onClick={() => onFiltersChange({ ...filters, dateRange: 'todos' })}
              />
            </Badge>
          )}

          {filters.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
              <Tag className="w-3 h-3" />
              <span className="capitalize">{tag}</span>
              <X
                className="w-3 h-3 cursor-pointer hover:text-destructive"
                onClick={() => toggleTag(tag)}
              />
            </Badge>
          ))}

          {(filters.sortBy !== 'createdAt' || filters.sortOrder !== 'desc') && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>
                Ordem: {filters.sortBy === 'createdAt' ? 'Data' :
                        filters.sortBy === 'updatedAt' ? 'Atualização' :
                        filters.sortBy === 'name' ? 'Nome' : 'Status'}
                ({filters.sortOrder === 'asc' ? 'Crescente' : 'Decrescente'})
              </span>
              <X
                className="w-3 h-3 cursor-pointer hover:text-destructive"
                onClick={() => onFiltersChange({ ...filters, sortBy: 'createdAt', sortOrder: 'desc' })}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default LeadFilters;