import { useState, useEffect } from 'react';
import { Tag, Plus, Edit, Trash2, Palette, BarChart3, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { TagDefinition, TagStats } from '@/types/lead';
import { tagStorage } from '@/utils/tagStorage';
import { useToast } from '@/hooks/use-toast';

const TagManagement = () => {
  const { toast } = useToast();
  const [tags, setTags] = useState<TagDefinition[]>([]);
  const [tagStats, setTagStats] = useState<TagStats[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<TagDefinition | null>(null);
  const [newTag, setNewTag] = useState({
    name: '',
    color: '#3b82f6',
    description: '',
  });

  useEffect(() => {
    loadTags();
    loadTagStats();
  }, []);

  const loadTags = () => {
    const allTags = tagStorage.getTags();
    setTags(allTags);
  };

  const loadTagStats = () => {
    const stats = tagStorage.getTagStats();
    setTagStats(stats);
  };

  const handleCreateTag = () => {
    if (!newTag.name.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome da tag é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    try {
      tagStorage.createTag(newTag.name, newTag.color, newTag.description);
      loadTags();
      loadTagStats();
      setIsCreateDialogOpen(false);
      setNewTag({ name: '', color: '#3b82f6', description: '' });
      toast({
        title: 'Tag criada',
        description: 'Tag criada com sucesso!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao criar tag',
        variant: 'destructive',
      });
    }
  };

  const handleEditTag = (tag: TagDefinition) => {
    setSelectedTag(tag);
    setNewTag({
      name: tag.name,
      color: tag.color,
      description: tag.description || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateTag = () => {
    if (!selectedTag || !newTag.name.trim()) return;

    try {
      tagStorage.updateTag(selectedTag.id, {
        name: newTag.name,
        color: newTag.color,
        description: newTag.description,
      });
      loadTags();
      loadTagStats();
      setIsEditDialogOpen(false);
      setSelectedTag(null);
      setNewTag({ name: '', color: '#3b82f6', description: '' });
      toast({
        title: 'Tag atualizada',
        description: 'Tag atualizada com sucesso!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar tag',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTag = (tag: TagDefinition) => {
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
      tagStorage.deleteTag(tag.id);
      loadTags();
      loadTagStats();
      toast({
        title: 'Tag excluída',
        description: 'Tag excluída com sucesso!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir tag',
        variant: 'destructive',
      });
    }
  };

  const predefinedColors = tagStorage.getPredefinedColors();

  const getTagStats = (tagName: string): TagStats | undefined => {
    return tagStats.find(stat => stat.tagName === tagName);
  };

  const renderTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Target className="h-4 w-4 text-gray-500" />;
    }
  };

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
        <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Nova Tag</span>
        </Button>
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
                          disabled={tag.isSystem}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTag(tag)}
                          disabled={tag.isSystem}
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
                  {predefinedColors.map((color) => (
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
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateTag}>Criar Tag</Button>
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
                  {predefinedColors.map((color) => (
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
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateTag}>Salvar Alterações</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TagManagement;