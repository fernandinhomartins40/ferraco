/**
 * TemplateEditor - Modal para criar/editar templates
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Eye, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { VariablePicker } from './VariablePicker';
import {
  templateLibraryService,
  TemplateLibraryCategory,
  MessageTemplateLibrary,
  CreateTemplateDto,
  UpdateTemplateDto,
} from '@/services/templateLibrary.service';

interface TemplateEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: MessageTemplateLibrary;
  onSave: () => void;
}

export function TemplateEditor({ open, onOpenChange, template, onSave }: TemplateEditorProps) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string>('');
  const [validation, setValidation] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: TemplateLibraryCategory.CUSTOM,
    content: '',
    priority: 0,
  });

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || '',
        category: template.category,
        content: template.content,
        priority: template.priority,
      });
    } else {
      resetForm();
    }
  }, [template, open]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: TemplateLibraryCategory.CUSTOM,
      content: '',
      priority: 0,
    });
    setPreview('');
    setValidation(null);
  };

  const handleInsertVariable = (variable: string) => {
    // Inserir variável no cursor do textarea
    const textarea = document.querySelector('textarea[name="content"]') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent =
        formData.content.substring(0, start) + variable + formData.content.substring(end);

      setFormData((prev) => ({ ...prev, content: newContent }));

      // Reposicionar cursor após a variável inserida
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    } else {
      // Fallback: adicionar no final
      setFormData((prev) => ({ ...prev, content: prev.content + variable }));
    }
  };

  const handleGeneratePreview = async () => {
    if (!formData.content.trim()) return;

    try {
      setLoading(true);
      const result = await templateLibraryService.preview(undefined, formData.content);
      setPreview(result.processed);
      setValidation(result.validation);
    } catch (error) {
      console.error('Erro ao gerar preview:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      if (template) {
        // Atualizar template existente
        const updateData: UpdateTemplateDto = {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          content: formData.content,
          priority: formData.priority,
        };
        await templateLibraryService.update(template.id, updateData);
      } else {
        // Criar novo template
        const createData: CreateTemplateDto = {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          content: formData.content,
          priority: formData.priority,
        };
        await templateLibraryService.create(createData);
      }

      onSave();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error('Erro ao salvar template:', error);
      alert(error.response?.data?.error || 'Erro ao salvar template');
    } finally {
      setLoading(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Editar Template' : 'Criar Novo Template'}
          </DialogTitle>
          <DialogDescription>
            {template
              ? 'Atualize as informações do template de mensagem.'
              : 'Crie um novo template de mensagem reutilizável.'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="editor" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-4 mt-4">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Template *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Bem-vindo ao Ferraco"
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Breve descrição do template (opcional)"
              />
            </div>

            {/* Categoria e Prioridade */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, category: value as TemplateLibraryCategory }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(TemplateLibraryCategory)
                      .filter((cat) => cat !== TemplateLibraryCategory.SYSTEM)
                      .map((category) => (
                        <SelectItem key={category} value={category}>
                          {getCategoryLabel(category)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Input
                  id="priority"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, priority: parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>

            {/* Conteúdo com VariablePicker */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="content">Conteúdo do Template *</Label>
                <VariablePicker onSelectVariable={handleInsertVariable} size="sm" />
              </div>
              <Textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Digite o conteúdo do template. Use {{variavel}} para inserir variáveis dinâmicas."
                className="min-h-[200px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Use variáveis como {`{{lead.name}}`}, {`{{company.name}}`}, etc.
              </p>
            </div>

            {/* Validação */}
            {validation && (
              <div className="space-y-2">
                {validation.isValid ? (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    Template válido
                  </div>
                ) : (
                  <div className="space-y-1">
                    {validation.errors.map((error, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                      </div>
                    ))}
                  </div>
                )}
                {validation.warnings.length > 0 && (
                  <div className="space-y-1">
                    {validation.warnings.map((warning, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-yellow-600 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {warning}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Preview com dados de exemplo
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGeneratePreview}
                  disabled={loading || !formData.content}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Atualizar Preview
                </Button>
              </div>

              {preview ? (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm">{preview}</pre>
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg p-8 text-center text-muted-foreground">
                  <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Clique em "Atualizar Preview" para visualizar o template</p>
                </div>
              )}

              {validation && validation.variables.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Variáveis detectadas:</p>
                  <div className="flex flex-wrap gap-2">
                    {validation.variables.map((v) => (
                      <Badge key={v} variant="secondary">
                        {v}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading || !formData.name || !formData.content}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Salvando...' : template ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
