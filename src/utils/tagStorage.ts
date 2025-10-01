import { TagDefinition, TagRule, TagStats } from '@/types/lead';
import { BaseStorage, StorageItem } from '@/lib/BaseStorage';
import { logger } from '@/lib/logger';

interface TagStorageItem extends StorageItem {
  name: string;
  color: string;
  description?: string;
  isSystem?: boolean;
  rules?: TagRule[];
}

class TagStorage extends BaseStorage<TagStorageItem> {
  constructor() {
    super({ key: 'ferraco_tags', enableDebug: false });
    this.initializeDefaultTags();
  }

  // Get default system tags
  getDefaultTags(): TagDefinition[] {
    return [
      {
        id: 'tag-hot-lead',
        name: 'Lead Quente',
        color: '#ef4444',
        description: 'Lead com alto potencial de conversão',
        createdAt: new Date().toISOString(),
        isSystem: true,
      },
      {
        id: 'tag-cold-lead',
        name: 'Lead Frio',
        color: '#3b82f6',
        description: 'Lead com baixo potencial no momento',
        createdAt: new Date().toISOString(),
        isSystem: true,
      },
      {
        id: 'tag-vip',
        name: 'VIP',
        color: '#8b5cf6',
        description: 'Cliente VIP ou de alto valor',
        createdAt: new Date().toISOString(),
        isSystem: true,
      },
      {
        id: 'tag-urgente',
        name: 'Urgente',
        color: '#f59e0b',
        description: 'Necessita atenção imediata',
        createdAt: new Date().toISOString(),
        isSystem: true,
      },
      {
        id: 'tag-retorno',
        name: 'Retorno',
        color: '#10b981',
        description: 'Cliente retornando ou recorrente',
        createdAt: new Date().toISOString(),
        isSystem: true,
      },
    ];
  }

  // Create a new tag
  createTag(name: string, color: string, description?: string, rules?: TagRule[]): TagDefinition {
    return this.add({
      name: name.trim(),
      color,
      description: description?.trim(),
      isSystem: false,
      rules: rules || [],
    });
  }

  // Update a tag
  updateTag(tagId: string, updates: Partial<TagDefinition>): boolean {
    const tag = this.getById(tagId);
    if (!tag) return false;

    // Don't allow updating system tags' core properties
    if (tag.isSystem) {
      delete updates.name;
      delete (updates as any).isSystem;
    }

    return this.update(tagId, updates) !== null;
  }

  // Delete a tag
  deleteTag(tagId: string): boolean {
    const tag = this.getById(tagId);
    if (!tag || tag.isSystem) return false;
    return this.delete(tagId);
  }

  // Get tags by color
  getTagsByColor(color: string): TagDefinition[] {
    return this.filter(tag => tag.color === color);
  }

  // Get predefined colors
  getPredefinedColors(): { name: string; value: string }[] {
    return [
      { name: 'Vermelho', value: '#ef4444' },
      { name: 'Azul', value: '#3b82f6' },
      { name: 'Verde', value: '#10b981' },
      { name: 'Amarelo', value: '#f59e0b' },
      { name: 'Roxo', value: '#8b5cf6' },
      { name: 'Rosa', value: '#ec4899' },
      { name: 'Índigo', value: '#6366f1' },
      { name: 'Ciano', value: '#06b6d4' },
      { name: 'Cinza', value: '#6b7280' },
      { name: 'Preto', value: '#374151' },
    ];
  }

  // Get tag statistics
  getTagStats(): TagStats[] {
    const tags = this.getAll();

    // Import dynamically to avoid circular dependency
    let leads: any[] = [];
    try {
      const storedLeads = localStorage.getItem('ferraco_leads');
      leads = storedLeads ? JSON.parse(storedLeads) : [];
    } catch (error) {
      logger.error('Error loading leads for tag stats:', error);
      return [];
    }

    return tags.map(tag => {
      const leadsWithTag = leads.filter((lead: any) =>
        lead.tags && lead.tags.includes(tag.name.toLowerCase())
      );

      const convertedLeads = leadsWithTag.filter((lead: any) =>
        lead.status === 'concluido'
      );

      const conversionRate = leadsWithTag.length > 0
        ? (convertedLeads.length / leadsWithTag.length) * 100
        : 0;

      const averageTime = convertedLeads.length > 0
        ? convertedLeads.reduce((sum: number, lead: any) => {
            const created = new Date(lead.createdAt);
            const updated = new Date(lead.updatedAt);
            return sum + (updated.getTime() - created.getTime());
          }, 0) / convertedLeads.length / (1000 * 60 * 60 * 24)
        : 0;

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      const recentLeads = leadsWithTag.filter((lead: any) =>
        new Date(lead.createdAt) >= sevenDaysAgo
      ).length;

      const previousLeads = leadsWithTag.filter((lead: any) => {
        const leadDate = new Date(lead.createdAt);
        return leadDate >= fourteenDaysAgo && leadDate < sevenDaysAgo;
      }).length;

      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (recentLeads > previousLeads) trend = 'up';
      else if (recentLeads < previousLeads) trend = 'down';

      return {
        tagId: tag.id,
        tagName: tag.name,
        count: leadsWithTag.length,
        conversionRate: Math.round(conversionRate * 100) / 100,
        averageTime: Math.round(averageTime * 10) / 10,
        trend,
      };
    });
  }

  // Apply automatic tag rules
  applyAutomaticTags(leadId: string, context: {
    status?: string;
    source?: string;
    content?: string;
    timeInStatus?: number;
  }): string[] {
    const tags = this.getAll();
    const appliedTags: string[] = [];

    tags.forEach(tag => {
      if (!tag.rules || tag.rules.length === 0) return;

      tag.rules.forEach(rule => {
        let shouldApply = false;

        switch (rule.condition) {
          case 'status_change':
            shouldApply = context.status === rule.value;
            break;
          case 'source':
            shouldApply = context.source === rule.value;
            break;
          case 'keyword':
            shouldApply = context.content?.toLowerCase().includes(rule.value.toLowerCase()) || false;
            break;
          case 'time_based':
            shouldApply = (context.timeInStatus || 0) >= parseInt(rule.value);
            break;
        }

        if (shouldApply && rule.action === 'add_tag') {
          appliedTags.push(tag.name.toLowerCase());
        }
      });
    });

    return appliedTags;
  }

  // Initialize default tags if none exist
  initializeDefaultTags(): void {
    if (this.count() === 0) {
      const defaultTags = this.getDefaultTags();
      defaultTags.forEach(tag => {
        this.data.push(tag as TagStorageItem);
      });
      this.save();
    }
  }

  // Legacy API compatibility
  getTags = () => this.getAll();
  saveTags = (tags: TagDefinition[]) => {
    this.data = tags as TagStorageItem[];
    this.save();
  };
  getTagById = (tagId: string) => this.getById(tagId);
  initializeSystemTags = () => {
    logger.info('Inicializando tags do sistema...');
    this.initializeDefaultTags();
    logger.info('Tags do sistema inicializadas');
  };
}

export const tagStorage = new TagStorage();
