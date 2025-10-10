import { useState, useMemo, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import AdminLayout from '@/components/admin/AdminLayout';
import KanbanColumn from '@/components/kanban/KanbanColumn';
import SpecialSection from '@/components/kanban/SpecialSection';
import ColumnModal from '@/components/kanban/ColumnModal';
import QuickTagManager from '@/components/kanban/QuickTagManager';
import TagSelector from '@/components/kanban/TagSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Plus, Search, Tag } from 'lucide-react';
import { kanbanStorage, KanbanColumn as KanbanColumnType, SpecialSection as SpecialSectionType } from '@/utils/kanbanStorage';
import { useLeads } from '@/hooks/api/useLeads';
import { ApiLead } from '@/types/api';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const AdminLeads = () => {
  const [columns, setColumns] = useState<KanbanColumnType[]>([]);
  const [specialSections, setSpecialSections] = useState<SpecialSectionType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [isTagSelectorOpen, setIsTagSelectorOpen] = useState(false);
  const [selectedLeadForTags, setSelectedLeadForTags] = useState<string | null>(null);
  const [editingColumn, setEditingColumn] = useState<KanbanColumnType | null>(null);
  const [leadTags, setLeadTags] = useState<Record<string, string[]>>({});

  // Buscar todos os leads (modo demo com dados mockados)
  const { data: leadsData } = useLeads({ limit: 100 });

  // Carregar colunas, seções especiais e tags dos leads
  useEffect(() => {
    loadColumns();
    loadSpecialSections();
    loadLeadTags();
  }, []);

  const loadLeadTags = () => {
    const stored = localStorage.getItem('ferraco_lead_tags');
    if (stored) {
      setLeadTags(JSON.parse(stored));
    }
  };

  const saveLeadTags = (tags: Record<string, string[]>) => {
    localStorage.setItem('ferraco_lead_tags', JSON.stringify(tags));
    setLeadTags(tags);
  };

  const loadColumns = () => {
    const loadedColumns = kanbanStorage.getAllColumns();
    setColumns(loadedColumns);
    logger.info(`Colunas carregadas: ${loadedColumns.length}`);
  };

  const loadSpecialSections = () => {
    const sections = kanbanStorage.getSpecialSections();
    setSpecialSections(sections);
    logger.info(`Seções especiais carregadas: ${sections.length}`);
  };

  // Organizar leads por coluna (incluindo seções especiais) e adicionar tags
  const leadsByColumn = useMemo(() => {
    if (!leadsData?.data) return {};

    const result: Record<string, ApiLead[]> = {};
    const data = leadsData.data as ApiLead[];

    // Adicionar colunas normais
    columns.forEach(column => {
      const leadIdsInColumn = kanbanStorage.getLeadsInColumn(column.id);
      result[column.id] = leadIdsInColumn
        .map(leadId => {
          const lead = data.find(l => l.id === leadId);
          if (lead) {
            return { ...lead, tags: leadTags[leadId] || [] };
          }
          return null;
        })
        .filter(Boolean) as unknown as ApiLead[];
    });

    // Adicionar seções especiais
    specialSections.forEach(section => {
      const leadIdsInSection = kanbanStorage.getLeadsInColumn(section.id);
      result[section.id] = leadIdsInSection
        .map(leadId => {
          const lead = data.find(l => l.id === leadId);
          if (lead) {
            return { ...lead, tags: leadTags[leadId] || [] };
          }
          return null;
        })
        .filter(Boolean) as unknown as ApiLead[];
    });

    // Adicionar leads que não estão em nenhuma coluna na primeira coluna
    const allAssignedLeadIds = new Set(
      Object.values(result).flat().map(lead => lead.id)
    );

    const unassignedLeads = data.filter(
      lead => !allAssignedLeadIds.has(lead.id)
    );

    if (unassignedLeads.length > 0 && columns.length > 0) {
      const firstColumnId = columns[0].id;
      unassignedLeads.forEach(lead => {
        kanbanStorage.addNewLead(lead.id);
      });
      result[firstColumnId] = [
        ...result[firstColumnId],
        ...unassignedLeads
      ];
    }

    return result;
  }, [columns, specialSections, leadsData, leadTags]);

  // Filtrar leads por busca
  const filteredLeadsByColumn = useMemo(() => {
    if (!searchQuery) return leadsByColumn;

    const query = searchQuery.toLowerCase();
    const filtered: Record<string, ApiLead[]> = {};

    Object.entries(leadsByColumn).forEach(([columnId, leads]) => {
      filtered[columnId] = leads.filter(lead =>
        lead.name.toLowerCase().includes(query) ||
        lead.phone.toLowerCase().includes(query) ||
        lead.email?.toLowerCase().includes(query)
      );
    });

    return filtered;
  }, [leadsByColumn, searchQuery]);

  // Handlers
  const handleCreateColumn = () => {
    setEditingColumn(null);
    setIsColumnModalOpen(true);
  };

  const handleEditColumn = (column: KanbanColumnType) => {
    setEditingColumn(column);
    setIsColumnModalOpen(true);
  };

  const handleSaveColumn = (data: { name: string; color: string }) => {
    if (editingColumn) {
      // Editar coluna existente
      kanbanStorage.updateColumn(editingColumn.id, data);
      toast.success('Coluna atualizada com sucesso!');
    } else {
      // Criar nova coluna
      kanbanStorage.createColumn(data);
      toast.success('Coluna criada com sucesso!');
    }

    loadColumns();
    setIsColumnModalOpen(false);
    setEditingColumn(null);
  };

  const handleDeleteColumn = (columnId: string) => {
    if (columns.length === 1) {
      toast.error('Não é possível deletar a única coluna!');
      return;
    }

    const success = kanbanStorage.deleteColumn(columnId);
    if (success) {
      toast.success('Coluna deletada com sucesso!');
      loadColumns();
    }
  };

  const handleAddTag = (leadId: string) => {
    setSelectedLeadForTags(leadId);
    setIsTagSelectorOpen(true);
  };

  const handleUpdateLeadTags = (leadId: string, tagNames: string[]) => {
    const updatedTags = { ...leadTags, [leadId]: tagNames };
    saveLeadTags(updatedTags);
    toast.success('Tags atualizadas!');
  };

  const handleMoveLead = (leadId: string, targetColumnId: string, targetOrder: number) => {
    const currentPosition = kanbanStorage.getLeadPosition(leadId);

    if (currentPosition) {
      // Movendo entre colunas
      kanbanStorage.moveLeadBetweenColumns(
        leadId,
        currentPosition.columnId,
        targetColumnId,
        targetOrder
      );
    } else {
      // Novo lead ou lead sem posição
      kanbanStorage.moveLeadToColumn(leadId, targetColumnId, targetOrder);
    }

    // Recarregar dados
    loadColumns();
  };

  const handleLeadClick = (lead: ApiLead) => {
    // TODO: Abrir modal com detalhes do lead
    logger.info('Lead clicado:', lead);
    toast.info(`Lead: ${lead.name}`);
  };

  return (
    <AdminLayout>
      <DndProvider backend={HTML5Backend}>
        <div className="space-y-4 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Leads</h1>
              <p className="text-muted-foreground">
                Gerencie seus leads em um quadro Kanban
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => setIsTagManagerOpen(true)}>
                <Tag className="mr-2 h-4 w-4" />
                Gerenciar Tags
              </Button>
              <Button onClick={handleCreateColumn}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Coluna
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar leads por nome, telefone ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Kanban Board */}
          <div className="flex-1 overflow-auto">
            {/* Regular Columns */}
            <div className="flex space-x-4 mb-6">
              {columns.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <p className="text-muted-foreground">
                      Nenhuma coluna criada ainda
                    </p>
                    <Button onClick={handleCreateColumn}>
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Primeira Coluna
                    </Button>
                  </div>
                </div>
              ) : (
                columns.map(column => (
                  <KanbanColumn
                    key={column.id}
                    column={column}
                    leads={filteredLeadsByColumn[column.id] || []}
                    onEditColumn={handleEditColumn}
                    onDeleteColumn={handleDeleteColumn}
                    onMoveLead={handleMoveLead}
                    onLeadClick={handleLeadClick}
                    onAddTag={handleAddTag}
                  />
                ))
              )}
            </div>

            {/* Separator with Label */}
            {columns.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center">
                  <Separator className="flex-1" />
                  <span className="px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Seções Especiais
                  </span>
                  <Separator className="flex-1" />
                </div>
                <p className="text-center text-xs text-muted-foreground mt-2">
                  Arraste leads para estas seções para ativar automações especiais
                </p>
              </div>
            )}

            {/* Special Sections */}
            {columns.length > 0 && (
              <div className="flex space-x-4">
                {specialSections.map(section => (
                  <SpecialSection
                    key={section.id}
                    section={section}
                    leads={filteredLeadsByColumn[section.id] || []}
                    onMoveLead={handleMoveLead}
                    onLeadClick={handleLeadClick}
                    onAddTag={handleAddTag}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Column Modal */}
        <ColumnModal
          isOpen={isColumnModalOpen}
          onClose={() => {
            setIsColumnModalOpen(false);
            setEditingColumn(null);
          }}
          onSave={handleSaveColumn}
          column={editingColumn}
        />

        {/* Tag Manager */}
        <QuickTagManager
          isOpen={isTagManagerOpen}
          onClose={() => setIsTagManagerOpen(false)}
          onTagsChange={() => {
            // Refresh leads to show updated tags
            loadColumns();
          }}
        />

        {/* Tag Selector */}
        {selectedLeadForTags && (
          <TagSelector
            isOpen={isTagSelectorOpen}
            onClose={() => {
              setIsTagSelectorOpen(false);
              setSelectedLeadForTags(null);
            }}
            leadId={selectedLeadForTags}
            currentTags={leadTags[selectedLeadForTags] || []}
            onTagsUpdate={handleUpdateLeadTags}
          />
        )}
      </DndProvider>
    </AdminLayout>
  );
};

export default AdminLeads;
