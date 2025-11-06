import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useRecurrenceTemplates,
  useDeleteTemplate,
  useUpdateTemplate,
} from '@/hooks/api/useRecurrence';
import {
  Plus,
  Edit,
  Trash2,
  Power,
  PowerOff,
  AlertCircle,
  MessageSquare,
  TrendingUp,
  Eye,
  Copy,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { TemplateForm } from '@/components/recurrence/TemplateForm';
import type { RecurrenceTemplate } from '@/services/recurrence.service';

export default function RecurrenceTemplates() {
  const { data: templates, isLoading } = useRecurrenceTemplates();
  const deleteTemplate = useDeleteTemplate();
  const updateTemplate = useUpdateTemplate();
  const { toast } = useToast();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RecurrenceTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<RecurrenceTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<RecurrenceTemplate | null>(null);

  const handleToggleActive = async (template: RecurrenceTemplate) => {
    await updateTemplate.mutateAsync({
      id: template.id,
      data: { isActive: !template.isActive },
    });
  };

  const handleDelete = async () => {
    if (deletingTemplate) {
      await deleteTemplate.mutateAsync(deletingTemplate.id);
      setDeletingTemplate(null);
    }
  };

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: 'Copiado!',
      description: 'Conteúdo do template copiado para área de transferência',
    });
  };

  const previewTemplateContent = (template: RecurrenceTemplate) => {
    const exampleData = {
      'lead.name': 'João Silva',
      'captureNumber': '3',
      'daysSinceLastCapture': '7',
      'previousInterests': 'Bebedouro, Resfriador',
      'currentInterest': 'Ordenhadeira',
    };

    let preview = template.content;
    Object.entries(exampleData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });

    return preview;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Templates de Recorrência</h1>
          <p className="text-muted-foreground">
            Gerencie mensagens personalizadas para leads recorrentes
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Template
        </Button>
      </div>

      {templates && templates.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className={!template.isActive ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.description && (
                      <CardDescription>{template.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActive(template)}
                      title={template.isActive ? 'Desativar' : 'Ativar'}
                    >
                      {template.isActive ? (
                        <Power className="h-4 w-4 text-green-600" />
                      ) : (
                        <PowerOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{template.trigger}</Badge>
                  <Badge variant="outline">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    {template.minCaptures}+ capturas
                  </Badge>
                  <Badge variant="outline">
                    <MessageSquare className="mr-1 h-3 w-3" />
                    {template.usageCount} usos
                  </Badge>
                </div>

                <div className="text-sm text-muted-foreground line-clamp-3">
                  {template.content}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewTemplate(template)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyContent(template.content)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setEditingTemplate(template)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingTemplate(template)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">Nenhum template encontrado</p>
            <p className="text-muted-foreground mb-4">
              Crie seu primeiro template de mensagem para leads recorrentes
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Template
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog Criar/Editar */}
      <Dialog
        open={isCreateDialogOpen || !!editingTemplate}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingTemplate(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Editar Template' : 'Novo Template'}
            </DialogTitle>
            <DialogDescription>
              Configure a mensagem que será enviada automaticamente para leads recorrentes
            </DialogDescription>
          </DialogHeader>
          <TemplateForm
            template={editingTemplate || undefined}
            onSuccess={() => {
              setIsCreateDialogOpen(false);
              setEditingTemplate(null);
            }}
            onCancel={() => {
              setIsCreateDialogOpen(false);
              setEditingTemplate(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmação Delete */}
      <AlertDialog
        open={!!deletingTemplate}
        onOpenChange={(open) => !open && setDeletingTemplate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Template</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o template "<strong>{deletingTemplate?.name}</strong>"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Preview */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preview do Template</DialogTitle>
            <DialogDescription>
              Exemplo de como a mensagem será enviada para o lead
            </DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Dados de Exemplo:</p>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• Nome: João Silva</li>
                  <li>• Captura: 3ª vez</li>
                  <li>• Dias desde última: 7</li>
                  <li>• Interesse anterior: Bebedouro, Resfriador</li>
                  <li>• Interesse atual: Ordenhadeira</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg bg-background">
                <p className="text-sm whitespace-pre-wrap">{previewTemplateContent(previewTemplate)}</p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleCopyContent(previewTemplateContent(previewTemplate))}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copiar Mensagem Renderizada
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </AdminLayout>
  );
}
