/**
 * VariablePicker - Componente para selecionar e inserir variáveis em templates
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Variable, Search, Copy, Check } from 'lucide-react';
import { templateLibraryService, TemplateVariable } from '@/services/templateLibrary.service';

interface VariablePickerProps {
  onSelectVariable: (variable: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function VariablePicker({ onSelectVariable, size = 'md' }: VariablePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [variables, setVariables] = useState<Record<string, TemplateVariable[]>>({});
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadVariables();
  }, []);

  const loadVariables = async () => {
    try {
      setLoading(true);
      const data = await templateLibraryService.getAvailableVariables();
      setVariables(data);
    } catch (error) {
      console.error('Erro ao carregar variáveis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVariable = (variable: string) => {
    onSelectVariable(`{{${variable}}}`);
    setCopiedVariable(variable);
    setTimeout(() => setCopiedVariable(null), 2000);
  };

  const filteredVariables = () => {
    if (!search) return variables;

    const filtered: Record<string, TemplateVariable[]> = {};

    Object.entries(variables).forEach(([category, vars]) => {
      const matchingVars = vars.filter(
        (v) =>
          v.key.toLowerCase().includes(search.toLowerCase()) ||
          v.description.toLowerCase().includes(search.toLowerCase())
      );

      if (matchingVars.length > 0) {
        filtered[category] = matchingVars;
      }
    });

    return filtered;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      lead: 'bg-blue-100 text-blue-800',
      company: 'bg-green-100 text-green-800',
      system: 'bg-purple-100 text-purple-800',
      capture: 'bg-orange-100 text-orange-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      lead: 'Lead',
      company: 'Empresa',
      system: 'Sistema',
      capture: 'Captura/Recorrência',
    };
    return labels[category] || category;
  };

  const buttonSizes = {
    sm: 'h-8 px-2 text-xs',
    md: 'h-9 px-3 text-sm',
    lg: 'h-10 px-4 text-base',
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size={size} className={buttonSizes[size]}>
          <Variable className="mr-2 h-4 w-4" />
          Inserir Variável
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="start">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar variável..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {loading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Carregando variáveis...
            </div>
          ) : Object.keys(filteredVariables()).length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Nenhuma variável encontrada
            </div>
          ) : (
            Object.entries(filteredVariables()).map(([category, vars]) => (
              <div key={category} className="mb-4 last:mb-0">
                <div className="px-2 py-1 mb-2">
                  <Badge className={getCategoryColor(category)} variant="secondary">
                    {getCategoryLabel(category)}
                  </Badge>
                </div>
                <div className="space-y-1">
                  {vars.map((variable) => (
                    <button
                      key={variable.key}
                      onClick={() => handleSelectVariable(variable.key)}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                              {`{{${variable.key}}}`}
                            </code>
                            {copiedVariable === variable.key && (
                              <Check className="h-3 w-3 text-green-600" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {variable.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Exemplo: <span className="italic">{variable.example}</span>
                          </p>
                        </div>
                        <Copy className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t bg-muted/50">
          <p className="text-xs text-muted-foreground">
            Clique em uma variável para inserir no template
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
