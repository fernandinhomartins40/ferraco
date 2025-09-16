import { Lead, LeadStatus, LeadStats } from '@/types/lead';

const LEADS_STORAGE_KEY = 'ferraco_leads';

export const leadStorage = {
  // Get all leads from localStorage
  getLeads(): Lead[] {
    try {
      const leads = localStorage.getItem(LEADS_STORAGE_KEY);
      return leads ? JSON.parse(leads) : [];
    } catch (error) {
      console.error('Error reading leads from localStorage:', error);
      return [];
    }
  },

  // Save leads to localStorage
  saveLeads(leads: Lead[]): void {
    try {
      localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leads));
    } catch (error) {
      console.error('Error saving leads to localStorage:', error);
    }
  },

  // Add a new lead
  addLead(name: string, phone: string): Lead {
    const newLead: Lead = {
      id: crypto.randomUUID(),
      name: name.trim(),
      phone: phone.trim(),
      status: 'novo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const leads = this.getLeads();
    leads.unshift(newLead); // Add to beginning for newest first
    this.saveLeads(leads);
    return newLead;
  },

  // Update lead status
  updateLeadStatus(id: string, status: LeadStatus): boolean {
    const leads = this.getLeads();
    const leadIndex = leads.findIndex(lead => lead.id === id);
    
    if (leadIndex === -1) return false;
    
    leads[leadIndex] = {
      ...leads[leadIndex],
      status,
      updatedAt: new Date().toISOString(),
    };
    
    this.saveLeads(leads);
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
    
    return {
      total: leads.length,
      novo: leads.filter(lead => lead.status === 'novo').length,
      em_andamento: leads.filter(lead => lead.status === 'em_andamento').length,
      concluido: leads.filter(lead => lead.status === 'concluido').length,
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
  }
};