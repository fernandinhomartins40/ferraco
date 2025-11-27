/**
 * TemplateLibrary - Página de gerenciamento da biblioteca de templates
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Star,
  FileText,
  BarChart3,
  Filter,
} from 'lucide-react';
import { TemplateEditor } from '@/components/admin/TemplateEditor';
import {
  templateLibraryService,
  MessageTemplateLibrary,
  TemplateLibraryCategory,
} from '@/services/templateLibrary.service';

export function TemplateLibrary() {
  const [templates, setTemplates] = useState<MessageTemplateLibrary[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<MessageTemplateLibrary[]>([]);
  const [loading, setLoading] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplateLibrary | undefined>();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadTemplates();
    loadStats();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, search, categoryFilter]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await templateLibraryService.list();
      setTemplates(data);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await templateLibraryService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((t) => t.category === categoryFilter);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(searchLower) ||
          t.description?.toLowerCase().includes(searchLower) ||
          t.content.toLowerCase().includes(searchLower)
      );
    }

    setFilteredTemplates(filtered);
  };

  const handleCreateNew = () => {
    setSelectedTemplate(undefined);
    setEditorOpen(true);
  };

  const handleEdit = (template: MessageTemplateLibrary) => {
    setSelectedTemplate(template);
    setEditorOpen(true);
  };

  const handleDuplicate = async (template: MessageTemplateLibrary) => {
    try {
      await templateLibraryService.duplicate(template.id);
      loadTemplates();
      loadStats();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao duplicar template');
    }
  };

  const handleDelete = async (template: MessageTemplateLibrary) => {
    if (!confirm(`Tem certeza que deseja deletar o template "${template.name}"?`)) {
      return;
    }

    try {
      await templateLibraryService.delete(template.id);
      loadTemplates();
      loadStats();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao deletar template');
    }
  };

  const handleToggleFavorite = async (template: MessageTemplateLibrary) => {
    try {
      await templateLibraryService.update(template.id, {
        isFavorite: !template.isFavorite,
      });
      loadTemplates();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao atualizar favorito');
    }
  };

  const getCategoryLabel = (category: TemplateLibraryCategory) => {
    const labels: Record<TemplateLibraryCategory, string> = {
      [TemplateLibraryCategory.AUTOMATION]: 'Automação',
      [TemplateLibraryCategory.RECURRENCE]: 'Recorrência',
      [TemplateLibraryCategory.GENERIC]: 'Genérico',
      [TemplateLibraryCategory.CUSTOM]: 'Customizado',
      [TemplateLibraryCategory.SYSTEM]: 'Sistema',
    };
    return labels[category];
  };

  const getCategoryColor = (category: TemplateLibraryCategory) => {
    const colors: Record<TemplateLibraryCategory, string> = {
      [TemplateLibraryCategory.AUTOMATION]: 'bg-blue-100 text-blue-800',
      [TemplateLibraryCategory.RECURRENCE]: 'bg-purple-100 text-purple-800',
      [TemplateLibraryCategory.GENERIC]: 'bg-green-100 text-green-800',
      [TemplateLibraryCategory.CUSTOM]: 'bg-orange-100 text-orange-800',
      [TemplateLibraryCategory.SYSTEM]: 'bg-gray-100 text-gray-800',
    };
    return colors[category];
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Biblioteca de Templates</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie templates de mensagens reutilizáveis
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Template
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Favoritos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.favorites}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.system}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {Object.values(TemplateLibraryCategory).map((category) => (
                  <SelectItem key={category} value={category}>
                    {getCategoryLabel(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">Carregando templates...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
            <p className="text-muted-foreground">
              {search || categoryFilter !== 'all'
                ? 'Nenhum template encontrado'
                : 'Nenhum template criado ainda'}
            </p>
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg truncate">{template.name}</CardTitle>
                      {template.isFavorite && (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                      )}
                    </div>
                    {template.description && (
                      <CardDescription className="line-clamp-2">
                        {template.description}
                      </CardDescription>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(template)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleFavorite(template)}>
                        <Star className="mr-2 h-4 w-4" />
                        {template.isFavorite ? 'Remover favorito' : 'Adicionar favorito'}
                      </DropdownMenuItem>
                      {!template.isSystem && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(template)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Deletar
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className={getCategoryColor(template.category)} variant="secondary">
                      {getCategoryLabel(template.category)}
                    </Badge>
                    {template.isSystem && (
                      <Badge variant="outline" className="text-xs">
                        Sistema
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3 font-mono bg-muted px-2 py-1 rounded">
                    {template.content}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Prioridade: {template.priority}</span>
                    <span className="flex items-center gap-1">
                      <BarChart3 className="h-3 w-3" />
                      {template.usageCount} usos
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Editor Modal */}
      <TemplateEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        template={selectedTemplate}
        onSave={() => {
          loadTemplates();
          loadStats();
        }}
      />
    </div>
  );
}
