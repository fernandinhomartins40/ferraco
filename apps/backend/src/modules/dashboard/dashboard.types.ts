// ============================================================================
// Dashboard Module - Types
// ============================================================================

import { DashboardConfig } from '@prisma/client';

export interface DashboardMetrics {
  totalLeads: number;
  newLeadsToday: number;
  newLeadsThisWeek: number;
  newLeadsThisMonth: number;
  openOpportunities: number;
  totalOpportunityValue: number;
  wonOpportunities: number;
  lostOpportunities: number;
  communicationsToday: number;
  communicationsThisWeek: number;
  activeAutomations: number;
  averageLeadScore: number;
  conversionRate: number;
  averageTimeToConvert: number;
}

export interface LeadsByStatus {
  [status: string]: number;
}

export interface LeadsBySource {
  [source: string]: number;
}

export interface RecentActivity {
  id: string;
  type: 'lead_created' | 'lead_updated' | 'communication_sent' | 'opportunity_created' | 'note_added';
  title: string;
  description: string;
  timestamp: Date;
  userId?: string;
  userName?: string;
  leadId?: string;
  leadName?: string;
}

export interface WidgetConfig {
  id: string;
  type: string;
  title: string;
  position: { x: number; y: number; w: number; h: number };
  config: Record<string, unknown>;
}

export interface CreateWidgetDTO {
  type: string;
  title: string;
  position: { x: number; y: number; w: number; h: number };
  config?: Record<string, unknown>;
}

export interface UpdateWidgetDTO extends Partial<CreateWidgetDTO> {
  id: string;
}

export interface SaveLayoutDTO {
  widgets: WidgetConfig[];
}

export interface DashboardConfigWithWidgets extends DashboardConfig {
  parsedWidgets?: WidgetConfig[];
}

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

export interface LeadsOverTime {
  daily: TimeSeriesData[];
  weekly: TimeSeriesData[];
  monthly: TimeSeriesData[];
}

export interface IDashboardService {
  getMetrics(userId?: string): Promise<DashboardMetrics>;
  getLeadsByStatus(userId?: string): Promise<LeadsByStatus>;
  getLeadsBySource(userId?: string): Promise<LeadsBySource>;
  getRecentActivity(userId?: string, limit?: number): Promise<RecentActivity[]>;
  getLeadsOverTime(userId?: string, period?: 'daily' | 'weekly' | 'monthly'): Promise<TimeSeriesData[]>;
  createWidget(userId: string, data: CreateWidgetDTO): Promise<DashboardConfig>;
  updateWidget(userId: string, data: UpdateWidgetDTO): Promise<DashboardConfig>;
  deleteWidget(userId: string, widgetId: string): Promise<DashboardConfig>;
  saveLayout(userId: string, data: SaveLayoutDTO): Promise<DashboardConfig>;
}
