// Tipos específicos para relatórios

import { Lead, AutomationRule, TagDefinition } from './lead';

export interface ReportData {
  type: string;
  generatedAt: string;
  filters: Record<string, unknown>;
  data: Record<string, unknown>;
}

export interface LeadsOverviewData {
  total: number;
  byStatus: Record<string, number>;
  bySource?: Record<string, number>;
  byPriority?: Record<string, number>;
  timeline: Array<{ date: string; count: number }>;
  conversionRate: number;
  metrics?: Record<string, string | number>;
}

export interface ConversionFunnelData {
  stages: Array<{ name: string; count: number; percentage: number }>;
  conversionRates?: number[];
  averageTimeByStage?: number[];
  avgConversionTime?: number;
  metrics?: Record<string, string | number>;
}

export interface TagPerformanceData {
  tags?: Array<{
    id: string;
    name: string;
    count: number;
    conversionRate: number;
    averageConversionTime: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  tagStats?: Array<{
    tagName: string;
    count: number;
    conversionRate: number;
    trend: 'up' | 'down' | 'stable';
  }>;
}

export interface AutomationStatsData {
  total?: number;
  active?: number;
  totalExecutions?: number;
  recentExecutions?: Array<{
    id: string;
    name: string;
    lastExecuted: string;
    executionCount: number;
  }>;
  stats?: {
    total: number;
    active: number;
    totalExecutions: number;
    recentExecutions: Array<{
      name: string;
      lastExecuted: string;
      count: number;
    }>;
  };
}

export interface CustomReportData {
  leads: Lead[];
  summary: Record<string, number | string | Record<string, number>>;
  charts: Array<{
    type: string;
    data: Record<string, unknown>[];
  }>;
}
