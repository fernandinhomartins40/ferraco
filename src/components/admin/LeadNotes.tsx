import { useState, memo, useCallback, useMemo } from 'react';
import { MessageSquare, Plus, Star, StarOff, Edit, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lead, LeadNote } from '@/types/lead';
import { leadStorage } from '@/utils/leadStorage';
import { useToast } from '@/hooks/use-toast';

interface LeadNotesProps {
  lead: Lead;
  onLeadUpdate: () => void;
}

const LeadNotes = ({ lead, onLeadUpdate }: LeadNotesProps) => {
  const { toast } = useToast();
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteImportant, setNewNoteImportant] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editImportant, setEditImportant] = useState(false);

  const handleAddNote = useCallback(async () => {
    if (!newNoteContent.trim()) return;

    const success = leadStorage.addNote(lead.id, newNoteContent, newNoteImportant);

    if (success) {
      setNewNoteContent('');
      setNewNoteImportant(false);
      setIsAddingNote(false);
      onLeadUpdate();
      toast({
        title: 'Nota adicionada',
        description: 'A nota foi adicionada com sucesso.',
      });
    } else {
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar a nota.',
        variant: 'destructive',
      });
    }
  }, [lead.id, newNoteContent, newNoteImportant, onLeadUpdate, toast]);

  const handleEditNote = useCallback((note: LeadNote) => {
    setEditingNoteId(note.id);
    setEditContent(note.content);
    setEditImportant(note.important || false);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingNoteId || !editContent.trim()) return;

    const success = leadStorage.updateNote(lead.id, editingNoteId, editContent, editImportant);

    if (success) {
      setEditingNoteId(null);
      setEditContent('');
      setEditImportant(false);
      onLeadUpdate();
      toast({
        title: 'Nota atualizada',
        description: 'A nota foi atualizada com sucesso.',
      });
    } else {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a nota.',
        variant: 'destructive',
      });
    }
  }, [lead.id, editingNoteId, editContent, editImportant, onLeadUpdate, toast]);

  const handleDeleteNote = useCallback(async (noteId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta nota?')) return;

    const success = leadStorage.deleteNote(lead.id, noteId);

    if (success) {
      onLeadUpdate();
      toast({
        title: 'Nota excluída',
        description: 'A nota foi excluída com sucesso.',
      });
    } else {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a nota.',
        variant: 'destructive',
      });
    }
  }, [lead.id, onLeadUpdate, toast]);

  const cancelEdit = useCallback(() => {
    setEditingNoteId(null);
    setEditContent('');
    setEditImportant(false);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const sortedNotes = useMemo(() => {
    const notes = lead.notes || [];
    return [...notes].sort((a, b) => {
      // Important notes first, then by date
      if (a.important && !b.important) return -1;
      if (!a.important && b.important) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [lead.notes]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span>Notas</span>
            {lead.notes && lead.notes.length > 0 && (
              <Badge variant="secondary">{lead.notes.length}</Badge>
            )}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddingNote(true)}
            disabled={isAddingNote}
            className="flex items-center space-x-1"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Nota</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Add Note Form */}
        {isAddingNote && (
          <div className="mb-4 p-4 border border-border rounded-lg bg-muted/20">
            <div className="space-y-3">
              <Textarea
                placeholder="Digite sua nota..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setNewNoteImportant(!newNoteImportant)}
                    className={`flex items-center space-x-1 ${
                      newNoteImportant ? 'text-yellow-600' : 'text-muted-foreground'
                    }`}
                  >
                    {newNoteImportant ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
                    <span>Importante</span>
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsAddingNote(false);
                      setNewNoteContent('');
                      setNewNoteImportant(false);
                    }}
                  >
                    <X className="h-4 w-4" />
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddNote}
                    disabled={!newNoteContent.trim()}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Salvar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notes List */}
        {sortedNotes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <div className="text-sm">Nenhuma nota ainda</div>
            <p className="text-xs mt-1">Adicione notas para acompanhar este lead</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedNotes.map((note) => (
              <div
                key={note.id}
                className={`p-3 rounded-lg border transition-colors ${
                  note.important
                    ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950'
                    : 'border-border bg-card'
                }`}
              >
                {editingNoteId === note.id ? (
                  // Edit Mode
                  <div className="space-y-3">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[60px]"
                    />
                    <div className="flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditImportant(!editImportant)}
                        className={`flex items-center space-x-1 ${
                          editImportant ? 'text-yellow-600' : 'text-muted-foreground'
                        }`}
                      >
                        {editImportant ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
                        <span>Importante</span>
                      </Button>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={cancelEdit}>
                          <X className="h-4 w-4" />
                        </Button>
                        <Button size="sm" onClick={handleSaveEdit} disabled={!editContent.trim()}>
                          <Save className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm text-foreground whitespace-pre-wrap">
                          {note.content}
                        </div>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(note.createdAt)}
                          </span>
                          {note.important && (
                            <Badge variant="secondary" className="text-xs">
                              <Star className="h-3 w-3 mr-1 fill-current text-yellow-600" />
                              Importante
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditNote(note)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNote(note.id)}
                          className="h-8 w-8 p-0 text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default memo(LeadNotes);