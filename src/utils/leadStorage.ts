import { Lead, LeadStatus, LeadStats, LeadNote, DashboardMetrics, TrendData, LeadFilters } from '@/types/lead';
import { logger } from '@/lib/logger';

// Import all Phase 2 storage systems
import { tagStorage } from './tagStorage';
import { communicationStorage } from './communicationStorage';
import { automationStorage } from './automationStorage';
import { reportStorage } from './reportStorage';

const LEADS_STORAGE_KEY = 'ferraco_leads';

export const leadStorage = {
  // Get all leads from localStorage
  getLeads(): Lead[] {
    try {
      const leads = localStorage.getItem(LEADS_STORAGE_KEY);
      return leads ? JSON.parse(leads) : [];
    } catch (error) {
      logger.error('Error reading leads from localStorage:', error);
      return [];
    }
  },

  // Save leads to localStorage
  saveLeads(leads: Lead[]): void {
    try {
      localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leads));
    } catch (error) {
      logger.error('Error saving leads to localStorage:', error);
    }
  },

  // Add a new lead with Phase 2 enhancements
  addLead(name: string, phone: string, source?: string, priority?: 'low' | 'medium' | 'high'): Lead {
    const newLead: Lead = {
      id: crypto.randomUUID(),
      name: name.trim(),
      phone: phone.trim(),
      status: 'novo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: [],
      tags: [],
      communications: [],
      automationRules: [],
      source: source || 'website',
      priority: priority || 'medium',
    };

    const leads = this.getLeads();
    leads.unshift(newLead); // Add to beginning for newest first
    this.saveLeads(leads);

    // Execute automation rules for new lead
    this.executeAutomationsForLead(newLead, 'lead_created');

    // Apply automatic tags based on context
    const automaticTags = tagStorage.applyAutomaticTags(newLead.id, {
      status: newLead.status,
      source: newLead.source,
    });

    if (automaticTags.length > 0) {
      automaticTags.forEach(tag => this.addTag(newLead.id, tag));
    }

    return newLead;
  },

  // Update lead status with automation support
  updateLeadStatus(id: string, status: LeadStatus): boolean {
    const leads = this.getLeads();
    const leadIndex = leads.findIndex(lead => lead.id === id);

    if (leadIndex === -1) return false;

    const oldStatus = leads[leadIndex].status;

    leads[leadIndex] = {
      ...leads[leadIndex],
      status,
      updatedAt: new Date().toISOString(),
    };

    this.saveLeads(leads);

    // Execute automation rules for status change
    if (oldStatus !== status) {
      this.executeAutomationsForLead(leads[leadIndex], 'status_changed', { oldStatus, newStatus: status });

      // Apply automatic tags based on status change
      const automaticTags = tagStorage.applyAutomaticTags(id, { status });
      automaticTags.forEach(tag => this.addTag(id, tag));
    }

    return true;
  },

  // Delete a lead
  deleteLead(id: string): boolean {
    const leads = this.getLeads();
    const filteredLeads = leads.filter(lead => lead.id !== id);
    
    if (filteredLeads.length === leads.length) return false;
    
    this.saveLeads(filteredLeads);
    return true;
  },

  // Get lead statistics
  getStats(): LeadStats {
    const leads = this.getLeads();
    const concluidos = leads.filter(lead => lead.status === 'concluido');
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const hojeMilissegundos = hoje.getTime();
    const seteDiasAtras = hojeMilissegundos - (7 * 24 * 60 * 60 * 1000);
    const trintaDiasAtras = hojeMilissegundos - (30 * 24 * 60 * 60 * 1000);

    const todayLeads = leads.filter(lead => new Date(lead.createdAt).getTime() >= hojeMilissegundos).length;
    const leadsUltimaSemana = leads.filter(lead => new Date(lead.createdAt).getTime() >= seteDiasAtras).length;
    const leadsSemanAnterior = leads.filter(lead => {
      const created = new Date(lead.createdAt).getTime();
      return created >= (seteDiasAtras - (7 * 24 * 60 * 60 * 1000)) && created < seteDiasAtras;
    }).length;

    const oldLeadsCount = leads.filter(lead => {
      const updated = new Date(lead.updatedAt || lead.createdAt).getTime();
      return updated < trintaDiasAtras && lead.status !== 'concluido';
    }).length;

    const conversionRate = leads.length > 0 ? (concluidos.length / leads.length) * 100 : 0;

    let totalConversionTime = 0;
    let conversionCount = 0;
    concluidos.forEach(lead => {
      const created = new Date(lead.createdAt).getTime();
      const updated = new Date(lead.updatedAt || lead.createdAt).getTime();
      totalConversionTime += updated - created;
      conversionCount++;
    });
    const averageConversionTime = conversionCount > 0 ? totalConversionTime / conversionCount : 0;

    const weeklyGrowth = leadsSemanAnterior > 0 ? ((leadsUltimaSemana - leadsSemanAnterior) / leadsSemanAnterior) * 100 : 0;

    return {
      total: leads.length,
      novo: leads.filter(lead => lead.status === 'novo').length,
      em_andamento: leads.filter(lead => lead.status === 'em_andamento').length,
      concluido: concluidos.length,
      conversionRate,
      averageConversionTime,
      todayLeads,
      weeklyGrowth,
      oldLeadsCount,
    };
  },

  // Export leads to CSV
  exportToCSV(): string {
    const leads = this.getLeads();
    
    if (leads.length === 0) return '';
    
    const headers = ['ID', 'Nome', 'Telefone', 'Status', 'Criado em', 'Atualizado em'];
    const csvContent = [
      headers.join(','),
      ...leads.map(lead => [
        lead.id,
        `"${lead.name}"`,
        `"${lead.phone}"`,
        lead.status,
        new Date(lead.createdAt).toLocaleString('pt-BR'),
        new Date(lead.updatedAt).toLocaleString('pt-BR')
      ].join(','))
    ].join('\n');
    
    return csvContent;
  },

  // Filter leads by criteria
  filterLeads(
    search: string = '',
    status: LeadStatus | 'todos' = 'todos',
    dateRange: 'hoje' | 'semana' | 'mes' | 'todos' = 'todos'
  ): Lead[] {
    let leads = this.getLeads();
    
    // Filter by search term (name or phone)
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      leads = leads.filter(lead => 
        lead.name.toLowerCase().includes(searchLower) ||
        lead.phone.includes(searchLower)
      );
    }
    
    // Filter by status
    if (status !== 'todos') {
      leads = leads.filter(lead => lead.status === status);
    }
    
    // Filter by date range
    if (dateRange !== 'todos') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateRange) {
        case 'hoje':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'semana':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'mes':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      leads = leads.filter(lead => new Date(lead.createdAt) >= filterDate);
    }
    
    return leads;
  },

  // Advanced Metrics and Analytics
  getAdvancedStats(): LeadStats {
    const leads = this.getLeads();
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Basic stats
    const total = leads.length;
    const novo = leads.filter(lead => lead.status === 'novo').length;
    const em_andamento = leads.filter(lead => lead.status === 'em_andamento').length;
    const concluido = leads.filter(lead => lead.status === 'concluido').length;

    // Conversion rate
    const conversionRate = total > 0 ? (concluido / total) * 100 : 0;

    // Average conversion time (for completed leads)
    const completedLeads = leads.filter(lead => lead.status === 'concluido');
    const totalConversionTime = completedLeads.reduce((sum, lead) => {
      const created = new Date(lead.createdAt);
      const updated = new Date(lead.updatedAt);
      return sum + (updated.getTime() - created.getTime());
    }, 0);
    const averageConversionTime = completedLeads.length > 0
      ? Math.round(totalConversionTime / completedLeads.length / (1000 * 60 * 60 * 24)) // days
      : 0;

    // Today's leads
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayLeads = leads.filter(lead => new Date(lead.createdAt) >= todayStart).length;

    // Weekly growth
    const lastWeekLeads = leads.filter(lead => {
      const leadDate = new Date(lead.createdAt);
      return leadDate >= sevenDaysAgo && leadDate < now;
    }).length;
    const previousWeekLeads = leads.filter(lead => {
      const leadDate = new Date(lead.createdAt);
      return leadDate >= fourteenDaysAgo && leadDate < sevenDaysAgo;
    }).length;
    const weeklyGrowth = previousWeekLeads > 0
      ? ((lastWeekLeads - previousWeekLeads) / previousWeekLeads) * 100
      : lastWeekLeads > 0 ? 100 : 0;

    // Old leads without follow-up (more than 7 days old and still new)
    const oldLeadsCount = leads.filter(lead => {
      const leadDate = new Date(lead.createdAt);
      return lead.status === 'novo' && leadDate < sevenDaysAgo;
    }).length;

    return {
      total,
      novo,
      em_andamento,
      concluido,
      conversionRate: Math.round(conversionRate * 100) / 100,
      averageConversionTime,
      todayLeads,
      weeklyGrowth: Math.round(weeklyGrowth * 100) / 100,
      oldLeadsCount,
    };
  },

  // Get dashboard metrics
  getDashboardMetrics(): DashboardMetrics {
    const leads = this.getLeads();
    const stats = this.getAdvancedStats();
    const now = new Date();

    // Generate trend data for last 30 days
    const trendsData: TrendData[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];

      const dayLeads = leads.filter(lead => {
        const leadDate = new Date(lead.createdAt);
        return leadDate.toDateString() === date.toDateString();
      });

      const dayConversions = dayLeads.filter(lead => {
        const updatedDate = new Date(lead.updatedAt);
        return lead.status === 'concluido' && updatedDate.toDateString() === date.toDateString();
      });

      const dayConversionRate = dayLeads.length > 0 ? (dayConversions.length / dayLeads.length) * 100 : 0;

      trendsData.push({
        date: dateStr,
        leads: dayLeads.length,
        conversions: dayConversions.length,
        conversionRate: Math.round(dayConversionRate * 100) / 100,
      });
    }

    // Monthly growth
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const lastMonthLeads = leads.filter(lead => {
      const leadDate = new Date(lead.createdAt);
      return leadDate >= thirtyDaysAgo;
    }).length;

    const previousMonthLeads = leads.filter(lead => {
      const leadDate = new Date(lead.createdAt);
      return leadDate >= sixtyDaysAgo && leadDate < thirtyDaysAgo;
    }).length;

    const monthlyGrowth = previousMonthLeads > 0
      ? ((lastMonthLeads - previousMonthLeads) / previousMonthLeads) * 100
      : lastMonthLeads > 0 ? 100 : 0;

    return {
      totalLeads: stats.total,
      conversionRate: stats.conversionRate,
      averageConversionTime: stats.averageConversionTime,
      todayLeads: stats.todayLeads,
      weeklyGrowth: stats.weeklyGrowth,
      monthlyGrowth: Math.round(monthlyGrowth * 100) / 100,
      oldLeadsAlert: stats.oldLeadsCount,
      trendsData,
    };
  },

  // Notes management with automation support
  addNote(leadId: string, content: string, important: boolean = false): boolean {
    const leads = this.getLeads();
    const leadIndex = leads.findIndex(lead => lead.id === leadId);

    if (leadIndex === -1) return false;

    const newNote: LeadNote = {
      id: crypto.randomUUID(),
      content: content.trim(),
      createdAt: new Date().toISOString(),
      important,
    };

    if (!leads[leadIndex].notes) {
      leads[leadIndex].notes = [];
    }

    leads[leadIndex].notes!.unshift(newNote);
    leads[leadIndex].updatedAt = new Date().toISOString();

    this.saveLeads(leads);

    // Execute automation rules for note added
    this.executeAutomationsForLead(leads[leadIndex], 'note_added', { noteContent: content });

    // Apply automatic tags based on note content
    const automaticTags = tagStorage.applyAutomaticTags(leadId, { content });
    automaticTags.forEach(tag => this.addTag(leadId, tag));

    return true;
  },

  updateNote(leadId: string, noteId: string, content: string, important?: boolean): boolean {
    const leads = this.getLeads();
    const leadIndex = leads.findIndex(lead => lead.id === leadId);

    if (leadIndex === -1 || !leads[leadIndex].notes) return false;

    const noteIndex = leads[leadIndex].notes!.findIndex(note => note.id === noteId);
    if (noteIndex === -1) return false;

    leads[leadIndex].notes![noteIndex] = {
      ...leads[leadIndex].notes![noteIndex],
      content: content.trim(),
      important: important !== undefined ? important : leads[leadIndex].notes![noteIndex].important,
    };

    leads[leadIndex].updatedAt = new Date().toISOString();
    this.saveLeads(leads);
    return true;
  },

  deleteNote(leadId: string, noteId: string): boolean {
    const leads = this.getLeads();
    const leadIndex = leads.findIndex(lead => lead.id === leadId);

    if (leadIndex === -1 || !leads[leadIndex].notes) return false;

    leads[leadIndex].notes = leads[leadIndex].notes!.filter(note => note.id !== noteId);
    leads[leadIndex].updatedAt = new Date().toISOString();

    this.saveLeads(leads);
    return true;
  },

  // Tags management
  addTag(leadId: string, tag: string): boolean {
    const leads = this.getLeads();
    const leadIndex = leads.findIndex(lead => lead.id === leadId);

    if (leadIndex === -1) return false;

    if (!leads[leadIndex].tags) {
      leads[leadIndex].tags = [];
    }

    const trimmedTag = tag.trim().toLowerCase();
    if (!leads[leadIndex].tags!.includes(trimmedTag)) {
      leads[leadIndex].tags!.push(trimmedTag);
      leads[leadIndex].updatedAt = new Date().toISOString();
      this.saveLeads(leads);
    }

    return true;
  },

  removeTag(leadId: string, tag: string): boolean {
    const leads = this.getLeads();
    const leadIndex = leads.findIndex(lead => lead.id === leadId);

    if (leadIndex === -1 || !leads[leadIndex].tags) return false;

    leads[leadIndex].tags = leads[leadIndex].tags!.filter(t => t !== tag.trim().toLowerCase());
    leads[leadIndex].updatedAt = new Date().toISOString();

    this.saveLeads(leads);
    return true;
  },

  // Advanced filtering with sorting
  filterLeadsAdvanced(filters: LeadFilters): Lead[] {
    let leads = this.getLeads();

    // Apply existing filters
    leads = this.filterLeads(filters.search, filters.status, filters.dateRange);

    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
      leads = leads.filter(lead =>
        lead.tags && filters.tags.some(tag => lead.tags!.includes(tag))
      );
    }

    // Apply sorting
    leads.sort((a, b) => {
      let aValue: string | Date;
      let bValue: string | Date;

      switch (filters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
      }

      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return leads;
  },

  // Get all unique tags
  getAllTags(): string[] {
    const leads = this.getLeads();
    const allTags = new Set<string>();

    leads.forEach(lead => {
      if (lead.tags) {
        lead.tags.forEach(tag => allTags.add(tag));
      }
    });

    return Array.from(allTags).sort();
  },

  // Phase 2 - New methods for automation and communication integration

  // Execute automation rules for a lead
  async executeAutomationsForLead(lead: Lead, triggerType: string, context?: Record<string, unknown>): Promise<void> {
    try {
      await automationStorage.executeAutomations(
        { type: triggerType as 'lead_created' | 'status_changed' | 'time_based' | 'tag_added' | 'note_added' },
        lead,
        context
      );
    } catch (error) {
      logger.error('Error executing automations for lead:', error);
    }
  },

  // Add communication record to lead
  addCommunication(leadId: string, type: 'whatsapp' | 'email' | 'call' | 'sms', content: string, direction: 'inbound' | 'outbound'): boolean {
    const communication = communicationStorage.addCommunication(leadId, {
      type,
      content,
      direction,
      status: 'sent',
    });

    return !!communication;
  },

  // Send WhatsApp message to lead
  async sendWhatsAppToLead(leadId: string, templateId?: string, customMessage?: string): Promise<{ success: boolean; error?: string }> {
    const lead = this.getLeads().find(l => l.id === leadId);
    if (!lead) return { success: false, error: 'Lead não encontrado' };

    try {
      if (templateId) {
        // Use template
        const templates = communicationStorage.getTemplates('whatsapp');
        const template = templates.find(t => t.id === templateId);

        if (!template) {
          return { success: false, error: 'Template não encontrado' };
        }

        const processedMessage = communicationStorage.processTemplate(template.content, {
          nome: lead.name,
        });

        const result = await communicationStorage.sendWhatsAppMessage(lead.phone, processedMessage, templateId);

        // Record communication
        this.addCommunication(leadId, 'whatsapp', processedMessage, 'outbound');

        return result;
      } else if (customMessage) {
        // Send custom message
        const result = await communicationStorage.sendWhatsAppMessage(lead.phone, customMessage);

        // Record communication
        this.addCommunication(leadId, 'whatsapp', customMessage, 'outbound');

        return result;
      } else {
        return { success: false, error: 'Template ou mensagem personalizada é obrigatória' };
      }
    } catch (error) {
      return { success: false, error: `Erro ao enviar mensagem: ${error}` };
    }
  },

  // Get lead with all related data
  getLeadDetails(leadId: string): (Lead & {
    communications: Array<Record<string, unknown>>;
    tagDefinitions: Array<Record<string, unknown>>;
  }) | null {
    const lead = this.getLeads().find(l => l.id === leadId);
    if (!lead) return null;

    // Get communications for this lead
    const communications = communicationStorage.getCommunications(leadId);

    // Get tag definitions for lead's tags
    const allTagDefinitions = tagStorage.getTags();
    const tagDefinitions = allTagDefinitions.filter(tagDef =>
      lead.tags?.some(tag => tag === tagDef.name.toLowerCase())
    );

    return {
      ...lead,
      communications,
      tagDefinitions,
    };
  },

  // Update lead with extended properties
  updateLead(leadId: string, updates: Partial<Lead>): boolean {
    const leads = this.getLeads();
    const leadIndex = leads.findIndex(lead => lead.id === leadId);

    if (leadIndex === -1) return false;

    leads[leadIndex] = {
      ...leads[leadIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.saveLeads(leads);
    return true;
  },

  // Get leads statistics with Phase 2 enhancements
  getExtendedStats(): LeadStats & {
    bySource: Record<string, number>;
    byPriority: Record<string, number>;
    communicationStats: Record<string, unknown>;
  } {
    const basicStats = this.getAdvancedStats();
    const leads = this.getLeads();

    const bySource = leads.reduce((acc, lead) => {
      const source = lead.source || 'unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byPriority = leads.reduce((acc, lead) => {
      const priority = lead.priority || 'medium';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const communicationStats = communicationStorage.getCommunicationStats();

    return {
      ...basicStats,
      bySource,
      byPriority,
      communicationStats,
    };
  },

  // Initialize all Phase 2 systems
  initializePhase2Systems(): void {
    tagStorage.initializeDefaultTags();
    communicationStorage.initializeDefaultTemplates();
    automationStorage.initializeDefaultAutomations();
    reportStorage.initializeDefaultReports();
    reportStorage.initializeDefaultDashboardConfigs();
  },

  // Run scheduled tasks (should be called periodically)
  async runScheduledTasks(): Promise<void> {
    try {
      // Run scheduled automations
      await automationStorage.runScheduledAutomations();

      // Add any other scheduled tasks here
    } catch (error) {
      logger.error('Error running scheduled tasks:', error);
    }
  },
};