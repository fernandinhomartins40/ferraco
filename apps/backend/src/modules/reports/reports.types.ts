// ============================================================================
// Reports Module - Types
// ============================================================================

import { Report, ReportGeneration } from '@prisma/client';

export interface CreateReportDTO {
  name: string;
  type: 'LEADS' | 'OPPORTUNITIES' | 'COMMUNICATIONS' | 'CUSTOM';
  filters: Record<string, unknown>;
  columns: string[];
  groupBy?: string;
  sortBy?: string;
  format: ReportFormat;
}

export interface UpdateReportDTO extends Partial<CreateReportDTO> {
  id: string;
}

export interface GenerateReportDTO {
  reportId: string;
  format?: ReportFormat;
}

export interface ScheduleReportDTO {
  reportId: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  time: string; // HH:mm
  recipients: string[];
  format: ReportFormat;
}

export interface FunnelAnalyticsParams {
  dateFrom?: Date;
  dateTo?: Date;
  pipelineId?: string;
}

export interface CohortAnalysisParams {
  metric: 'retention' | 'conversion';
  period?: 'month' | 'quarter' | 'year';
}

export interface PerformanceMetricsParams {
  userId?: string;
  teamId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export type ReportFormat = 'JSON' | 'CSV' | 'EXCEL' | 'PDF';

export interface ReportWithGenerations extends Report {
  generations?: ReportGeneration[];
}

export interface FunnelAnalytics {
  stage: string;
  count: number;
  value: number;
  conversionRate: number;
  dropoffRate: number;
}

export interface CohortData {
  cohort: string;
  total: number;
  converted: number;
  conversionRate: number;
  retentionRate?: number;
}

export interface PerformanceMetrics {
  userId: string;
  userName: string;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  averageResponseTime: number;
  totalCommunications: number;
  activeOpportunities: number;
  totalRevenue: number;
}

export interface IReportsService {
  create(data: CreateReportDTO, userId: string): Promise<Report>;
  findAll(userId?: string): Promise<Report[]>;
  findById(id: string): Promise<ReportWithGenerations | null>;
  update(id: string, data: UpdateReportDTO): Promise<Report>;
  delete(id: string): Promise<void>;
  generate(reportId: string, format?: ReportFormat): Promise<Buffer>;
  schedule(data: ScheduleReportDTO): Promise<Report>;
  getScheduled(): Promise<Report[]>;
  getFunnelAnalytics(params: FunnelAnalyticsParams): Promise<FunnelAnalytics[]>;
  getCohortAnalysis(params: CohortAnalysisParams): Promise<CohortData[]>;
  getPerformanceMetrics(params: PerformanceMetricsParams): Promise<PerformanceMetrics[]>;
}
