import { apiClient as api } from '@/lib/apiClient';

// ============================================================================
// TYPES
// ============================================================================

export interface RecurrenceTemplate {
  id: string;
  name: string;
  description?: string;
  trigger: string;
  minCaptures: number;
  maxCaptures?: number;
  daysSinceLastCapture?: number;
  conditions: string;
  content: string;
  mediaUrls?: string;
  mediaType?: string;
  priority: number;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  trigger: string;
  minCaptures: number;
  maxCaptures?: number;
  daysSinceLastCapture?: number;
  conditions?: Record<string, any>;
  content: string;
  mediaUrls?: string[];
  mediaType?: string;
  priority?: number;
}

export interface UpdateTemplateData extends Partial<CreateTemplateData> {
  isActive?: boolean;
}

export interface LeadCapture {
  id: string;
  leadId: string;
  source: string;
  interest?: string;
  metadata?: string;
  captureNumber: number;
  userAgent?: string;
  ipAddress?: string;
  campaign?: string;
  createdAt: string;
}

export interface RecurrenceStats {
  totalLeads: number;
  recurrentLeads: number;
  avgCapturesPerLead: number;
  topRecurrentLeads: {
    id: string;
    name: string;
    phone: string;
    captureCount: number;
    lastCapturedAt: string;
    leadScore: number;
    source?: string;
  }[];
}

export interface CaptureTrend {
  period: string;
  newLeads: number;
  recurrentLeads: number;
  totalCaptures: number;
}

export interface TemplateUsageStats {
  templates: {
    id: string;
    name: string;
    trigger: string;
    usageCount: number;
    isActive: boolean;
    usagePercentage: number;
  }[];
  totalUsage: number;
  activeCount: number;
  inactiveCount: number;
}

// ============================================================================
// SERVICE
// ============================================================================

class RecurrenceService {
  // ============================================================================
  // TEMPLATES
  // ============================================================================

  async listTemplates(filters?: { isActive?: boolean; trigger?: string }) {
    const params = new URLSearchParams();
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
    if (filters?.trigger) params.append('trigger', filters.trigger);

    const response = await api.get<RecurrenceTemplate[]>(
      `/recurrence/templates?${params.toString()}`
    );
    return response.data;
  }

  async getTemplate(id: string) {
    const response = await api.get<RecurrenceTemplate>(`/recurrence/templates/${id}`);
    return response.data;
  }

  async createTemplate(data: CreateTemplateData) {
    const response = await api.post<RecurrenceTemplate>('/recurrence/templates', data);
    return response.data;
  }

  async updateTemplate(id: string, data: UpdateTemplateData) {
    const response = await api.put<RecurrenceTemplate>(`/recurrence/templates/${id}`, data);
    return response.data;
  }

  async deleteTemplate(id: string) {
    const response = await api.delete(`/recurrence/templates/${id}`);
    return response.data;
  }

  // ============================================================================
  // ESTATÍSTICAS
  // ============================================================================

  async getLeadStats(filters?: {
    period?: '7d' | '30d' | '90d' | 'all';
    source?: string;
    interest?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.period) params.append('period', filters.period);
    if (filters?.source) params.append('source', filters.source);
    if (filters?.interest) params.append('interest', filters.interest);

    const response = await api.get<RecurrenceStats>(
      `/recurrence/stats/leads?${params.toString()}`
    );
    return response.data;
  }

  async getTemplateStats() {
    const response = await api.get<TemplateUsageStats>('/recurrence/stats/templates');
    return response.data;
  }

  async getCaptureTrends(filters?: {
    period?: '7d' | '30d' | '90d' | 'all';
    groupBy?: 'day' | 'week' | 'month';
  }) {
    const params = new URLSearchParams();
    if (filters?.period) params.append('period', filters.period);
    if (filters?.groupBy) params.append('groupBy', filters.groupBy);

    const response = await api.get<CaptureTrend[]>(
      `/recurrence/stats/trends?${params.toString()}`
    );
    return response.data;
  }

  // ============================================================================
  // HISTÓRICO
  // ============================================================================

  async getLeadCaptureHistory(leadId: string) {
    const response = await api.get<LeadCapture[]>(`/recurrence/leads/${leadId}/captures`);
    return response.data;
  }
}

export const recurrenceService = new RecurrenceService();
