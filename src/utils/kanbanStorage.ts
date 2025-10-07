import { logger } from '@/lib/logger';

export interface KanbanColumn {
  id: string;
  name: string;
  color: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface SpecialSection {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
  type: 'recovery' | 'future';
}

export interface LeadPosition {
  leadId: string;
  columnId: string;
  order: number;
}

const STORAGE_KEY = 'ferraco_kanban_columns';
const POSITIONS_KEY = 'ferraco_lead_positions';

class KanbanStorage {
  private columns: KanbanColumn[] = [];
  private positions: LeadPosition[] = [];

  // Seções especiais fixas (não podem ser editadas/deletadas)
  private specialSections: SpecialSection[] = [
    {
      id: 'special-recovery',
      name: 'Recuperação de Leads',
      description: 'Leads inativos que precisam ser reativados com automações',
      icon: '🔄',
      color: '#f97316',
      gradient: 'from-orange-500 to-red-500',
      type: 'recovery'
    },
    {
      id: 'special-future',
      name: 'Vendas Futuras',
      description: 'Leads com potencial para vendas programadas',
      icon: '📅',
      color: '#8b5cf6',
      gradient: 'from-purple-500 to-pink-500',
      type: 'future'
    }
  ];

  constructor() {
    this.loadFromStorage();
  }

  // ===== COLUMNS =====

  private loadFromStorage(): void {
    try {
      const columnsData = localStorage.getItem(STORAGE_KEY);
      const positionsData = localStorage.getItem(POSITIONS_KEY);

      if (columnsData) {
        this.columns = JSON.parse(columnsData);
      } else {
        // Inicializar com coluna padrão
        this.columns = [{
          id: 'col-1',
          name: 'Novos Leads',
          color: '#3b82f6', // blue-500
          order: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }];
        this.saveToStorage();
      }

      if (positionsData) {
        this.positions = JSON.parse(positionsData);
      }

      logger.info(`Kanban carregado: ${this.columns.length} colunas, ${this.positions.length} posições`);
    } catch (error) {
      logger.error('Erro ao carregar Kanban do localStorage:', error);
      this.columns = [];
      this.positions = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.columns));
      localStorage.setItem(POSITIONS_KEY, JSON.stringify(this.positions));
    } catch (error) {
      logger.error('Erro ao salvar Kanban no localStorage:', error);
    }
  }

  getAllColumns(): KanbanColumn[] {
    return [...this.columns].sort((a, b) => a.order - b.order);
  }

  getColumn(id: string): KanbanColumn | undefined {
    return this.columns.find(col => col.id === id);
  }

  createColumn(data: { name: string; color: string }): KanbanColumn {
    const newColumn: KanbanColumn = {
      id: `col-${Date.now()}`,
      name: data.name,
      color: data.color,
      order: this.columns.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.columns.push(newColumn);
    this.saveToStorage();

    logger.info(`Coluna criada: ${newColumn.name}`);
    return newColumn;
  }

  updateColumn(id: string, data: Partial<KanbanColumn>): KanbanColumn | null {
    const index = this.columns.findIndex(col => col.id === id);
    if (index === -1) return null;

    this.columns[index] = {
      ...this.columns[index],
      ...data,
      id: this.columns[index].id, // Não permitir alterar ID
      updatedAt: new Date().toISOString()
    };

    this.saveToStorage();

    logger.info(`Coluna atualizada: ${this.columns[index].name}`);
    return this.columns[index];
  }

  deleteColumn(id: string): boolean {
    const index = this.columns.findIndex(col => col.id === id);
    if (index === -1) return false;

    // Não permitir deletar se for a única coluna
    if (this.columns.length === 1) {
      logger.warn('Não é possível deletar a última coluna');
      return false;
    }

    // Remover posições de leads nesta coluna
    this.positions = this.positions.filter(pos => pos.columnId !== id);

    this.columns.splice(index, 1);

    // Reordenar colunas restantes
    this.columns.forEach((col, idx) => {
      col.order = idx;
    });

    this.saveToStorage();

    logger.info(`Coluna deletada: ${id}`);
    return true;
  }

  reorderColumns(columnIds: string[]): void {
    const reordered = columnIds.map((id, index) => {
      const col = this.columns.find(c => c.id === id);
      if (col) {
        return { ...col, order: index };
      }
      return null;
    }).filter(Boolean) as KanbanColumn[];

    this.columns = reordered;
    this.saveToStorage();

    logger.info('Colunas reordenadas');
  }

  // ===== LEAD POSITIONS =====

  getLeadPosition(leadId: string): LeadPosition | undefined {
    return this.positions.find(pos => pos.leadId === leadId);
  }

  getLeadsInColumn(columnId: string): string[] {
    return this.positions
      .filter(pos => pos.columnId === columnId)
      .sort((a, b) => a.order - b.order)
      .map(pos => pos.leadId);
  }

  moveLeadToColumn(leadId: string, targetColumnId: string, order?: number): void {
    // Remover posição existente
    this.positions = this.positions.filter(pos => pos.leadId !== leadId);

    // Se ordem não especificada, colocar no final
    if (order === undefined) {
      const leadsInColumn = this.getLeadsInColumn(targetColumnId);
      order = leadsInColumn.length;
    }

    // Adicionar nova posição
    this.positions.push({
      leadId,
      columnId: targetColumnId,
      order
    });

    // Reordenar leads na coluna de destino
    const leadsInColumn = this.positions.filter(pos => pos.columnId === targetColumnId);
    leadsInColumn.sort((a, b) => a.order - b.order).forEach((pos, idx) => {
      pos.order = idx;
    });

    this.saveToStorage();

    logger.info(`Lead ${leadId} movido para coluna ${targetColumnId}`);
  }

  moveLeadBetweenColumns(
    leadId: string,
    sourceColumnId: string,
    targetColumnId: string,
    targetOrder: number
  ): void {
    // Remover da coluna origem
    this.positions = this.positions.filter(pos => pos.leadId !== leadId);

    // Reordenar leads na coluna origem
    const sourceLeads = this.positions.filter(pos => pos.columnId === sourceColumnId);
    sourceLeads.sort((a, b) => a.order - b.order).forEach((pos, idx) => {
      pos.order = idx;
    });

    // Ajustar ordens na coluna destino
    const targetLeads = this.positions.filter(pos => pos.columnId === targetColumnId);
    targetLeads.forEach(pos => {
      if (pos.order >= targetOrder) {
        pos.order++;
      }
    });

    // Adicionar na nova posição
    this.positions.push({
      leadId,
      columnId: targetColumnId,
      order: targetOrder
    });

    this.saveToStorage();

    logger.info(`Lead ${leadId} movido de ${sourceColumnId} para ${targetColumnId} na posição ${targetOrder}`);
  }

  // Adicionar lead na primeira coluna (quando um novo lead é criado)
  addNewLead(leadId: string): void {
    const firstColumn = this.getAllColumns()[0];
    if (firstColumn) {
      this.moveLeadToColumn(leadId, firstColumn.id);
    }
  }

  // Remover lead de todas as colunas
  removeLead(leadId: string): void {
    this.positions = this.positions.filter(pos => pos.leadId !== leadId);
    this.saveToStorage();

    logger.info(`Lead ${leadId} removido do Kanban`);
  }

  // ===== SPECIAL SECTIONS =====

  getSpecialSections(): SpecialSection[] {
    return [...this.specialSections];
  }

  getSpecialSection(id: string): SpecialSection | undefined {
    return this.specialSections.find(section => section.id === id);
  }

  // Reset completo
  reset(): void {
    this.columns = [{
      id: 'col-1',
      name: 'Novos Leads',
      color: '#3b82f6',
      order: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }];
    this.positions = [];
    this.saveToStorage();

    logger.info('Kanban resetado');
  }
}

export const kanbanStorage = new KanbanStorage();
