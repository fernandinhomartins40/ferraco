import { useState, useMemo, memo, useCallback } from 'react';
import { Tag, Plus, Edit, Trash2, Palette, BarChart3, TrendingUp, TrendingDown, Target, RefreshCw, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TagDefinition, TagStats } from '@/types/lead';
import { ApiTag } from '@/types/api';
import { useTags, useCreateTag, useUpdateTag, useDeleteTag, useTagStats, usePredefinedColors } from '@/hooks/api/useTags';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

// Função para converter ApiTag para TagDefinition (frontend)
const convertApiTagToTagDefinition = (apiTag: ApiTag): TagDefinition => ({
  id: apiTag.id,
  name: apiTag.name,
  color: apiTag.color,
  description: apiTag.description,
  isSystem: apiTag.isSystem,
  createdAt: apiTag.createdAt,
});

const TagManagement = () => {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<TagDefinition | null>(null);
  const [newTag, setNewTag] = useState({
    name: '',
    color: '#3b82f6',
    description: '',
  });

  // Hooks da API
  const {
    data: tagsResponse,
    isLoading: tagsLoading,
    error: tagsError,
    refetch: refetchTags
  } = useTags({ limit: 100 });

  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useTagStats();

  const {
    data: predefinedColors,
    isLoading: colorsLoading
  } = usePredefinedColors();

  const createTagMutation = useCreateTag();
  const updateTagMutation = useUpdateTag();
  const deleteTagMutation = useDeleteTag();

  // Converter dados da API para formato do frontend
  const tags = useMemo(() => {
    if (!tagsResponse?.data) return [];
    return tagsResponse.data.map(convertApiTagToTagDefinition);
  }, [tagsResponse]);

  const tagStats: TagStats[] = useMemo(() => {
    if (!statsData || !Array.isArray(statsData)) return [];
    return statsData.map((stat: { id?: string; name?: string; count?: number; conversionRate?: number; averageTime?: number; trend?: 'up' | 'down' | 'stable' }) => ({
      tagId: stat.id || '',
      tagName: stat.name || '',
      count: stat.count || 0,
      conversionRate: stat.conversionRate || 0,
      averageTime: stat.averageTime || 0,
      trend: stat.trend || 'stable',
    }));
  }, [statsData]);

  const handleRefresh = useCallback(() => {
    refetchTags();
    refetchStats();
  }, [refetchTags, refetchStats]);

  const handleCreateTag = useCallback(async () => {
    if (!newTag.name.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome da tag é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createTagMutation.mutateAsync({
        name: newTag.name,
        color: newTag.color,
        description: newTag.description,
      });

      setIsCreateDialogOpen(false);
      setNewTag({ name: '', color: '#3b82f6', description: '' });
      refetchStats(); // Atualizar estatísticas também
    } catch (error) {
      // O toast de erro já é mostrado pelo hook
      logger.error('Erro ao criar tag:', error);
    }
  }, [newTag, createTagMutation, refetchStats, toast]);

  const handleEditTag = useCallback((tag: TagDefinition) => {
    setSelectedTag(tag);
    setNewTag({
      name: tag.name,
      color: tag.color,
      description: tag.description || '',
    });
    setIsEditDialogOpen(true);
  }, []);

  const handleUpdateTag = useCallback(async () => {
    if (!selectedTag || !newTag.name.trim()) return;

    try {
      await updateTagMutation.mutateAsync({
        id: selectedTag.id,
        name: newTag.name,
        color: newTag.color,
        description: newTag.description,
      });

      setIsEditDialogOpen(false);
      setSelectedTag(null);
      setNewTag({ name: '', color: '#3b82f6', description: '' });
      refetchStats(); // Atualizar estatísticas também
    } catch (error) {
      // O toast de erro já é mostrado pelo hook
      logger.error('Erro ao atualizar tag:', error);
    }
  }, [selectedTag, newTag, updateTagMutation, refetchStats]);

  const handleDeleteTag = useCallback(async (tag: TagDefinition) => {
    if (tag.isSystem) {
      toast({
        title: 'Não permitido',
        description: 'Tags do sistema não podem ser excluídas',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir a tag "${tag.name}"?`)) return;

    try {
      await deleteTagMutation.mutateAsync(tag.id);
      refetchStats(); // Atualizar estatísticas também
    } catch (error) {
      // O toast de erro já é mostrado pelo hook
      logger.error('Erro ao excluir tag:', error);
    }
  }, [deleteTagMutation, refetchStats, toast]);

  const getTagStats = useCallback((tagName: string): TagStats | undefined => {
    return tagStats.find(stat => stat.tagName === tagName);
  }, [tagStats]);

  const renderTrendIcon = useCallback((trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Target className="h-4 w-4 text-gray-500" />;
    }
  }, []);

  // Loading states
  if (tagsLoading || statsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Gestão de Tags</h2>
            <p className="text-muted-foreground">
              Gerencie tags coloridas e analise performance
            </p>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Loading Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 border rounded-lg">
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>

        {/* Loading Table */}
        <div className="border rounded-lg p-4">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex space-x-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error states
  if (tagsError || statsError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Gestão de Tags</h2>
            <p className="text-muted-foreground">
              Gerencie tags coloridas e analise performance
            </p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Erro ao carregar dados: {tagsError?.message || statsError?.message || 'Erro desconhecido'}
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
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Tags</h2>
          <p className="text-muted-foreground">
            Gerencie tags coloridas e analise performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Atualizar</span>
          </Button>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex items-center space-x-2"
            disabled={createTagMutation.isPending}
          >
            <Plus className="h-4 w-4" />
            <span>Nova Tag</span>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Tag className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold">{tags.length}</div>
                <div className="text-xs text-muted-foreground">Total de Tags</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-2xl font-bold">
                  {tagStats.reduce((sum, stat) => sum + stat.count, 0)}
                </div>
                <div className="text-xs text-muted-foreground">Leads com Tags</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">
                  {tagStats.length > 0
                    ? Math.round(
                        tagStats.reduce((sum, stat) => sum + stat.conversionRate, 0) / tagStats.length
                      )
                    : 0}%
                </div>
                <div className="text-xs text-muted-foreground">Taxa Média</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">
                  {tags.filter(tag => !tag.isSystem).length}
                </div>
                <div className="text-xs text-muted-foreground">Tags Customizadas</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tags Table */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tag</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Uso</TableHead>
                <TableHead>Taxa de Conversão</TableHead>
                <TableHead>Tendência</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tags.map((tag) => {
                const stats = getTagStats(tag.name);
                return (
                  <TableRow key={tag.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: tag.color,
                            color: tag.color,
                          }}
                        >
                          {tag.name}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="text-sm text-muted-foreground truncate">
                        {tag.description || 'Sem descrição'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="text-sm font-medium">{stats?.count || 0}</div>
                        <div className="w-16">
                          <Progress
                            value={
                              stats?.count && tagStats.length > 0
                                ? (stats.count / Math.max(...tagStats.map(s => s.count))) * 100
                                : 0
                            }
                            className="h-2"
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">
                          {stats?.conversionRate?.toFixed(1) || '0.0'}%
                        </span>
                        <Progress
                          value={stats?.conversionRate || 0}
                          className="h-2 w-16"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {renderTrendIcon(stats?.trend || 'stable')}
                        <span className="text-xs text-muted-foreground capitalize">
                          {stats?.trend || 'stable'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={tag.isSystem ? 'secondary' : 'outline'}>
                        {tag.isSystem ? 'Sistema' : 'Personalizada'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTag(tag)}
                          disabled={tag.isSystem || updateTagMutation.isPending}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTag(tag)}
                          disabled={tag.isSystem || deleteTagMutation.isPending}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Tag Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome da Tag</label>
              <Input
                value={newTag.name}
                onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                placeholder="Ex: Cliente VIP"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Cor</label>
              <Select
                value={newTag.color}
                onValueChange={(value) => setNewTag({ ...newTag, color: value })}
              >
                <SelectTrigger>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: newTag.color }}
                    />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {(Array.isArray(predefinedColors) ? predefinedColors : []).map((color: { name: string; value: string }) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: color.value }}
                        />
                        <span>{color.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Descrição (Opcional)</label>
              <Textarea
                value={newTag.description}
                onChange={(e) => setNewTag({ ...newTag, description: e.target.value })}
                placeholder="Descreva quando usar esta tag..."
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={createTagMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateTag}
                disabled={createTagMutation.isPending}
              >
                {createTagMutation.isPending ? 'Criando...' : 'Criar Tag'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Tag Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome da Tag</label>
              <Input
                value={newTag.name}
                onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                placeholder="Ex: Cliente VIP"
                disabled={selectedTag?.isSystem}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Cor</label>
              <Select
                value={newTag.color}
                onValueChange={(value) => setNewTag({ ...newTag, color: value })}
              >
                <SelectTrigger>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: newTag.color }}
                    />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {(Array.isArray(predefinedColors) ? predefinedColors : []).map((color: { name: string; value: string }) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: color.value }}
                        />
                        <span>{color.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Descrição (Opcional)</label>
              <Textarea
                value={newTag.description}
                onChange={(e) => setNewTag({ ...newTag, description: e.target.value })}
                placeholder="Descreva quando usar esta tag..."
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={updateTagMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateTag}
                disabled={updateTagMutation.isPending}
              >
                {updateTagMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default memo(TagManagement);