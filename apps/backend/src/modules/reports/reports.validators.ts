// ============================================================================
// Reports Module - Validators
// ============================================================================

import { z } from 'zod';

export const CreateReportSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100).trim(),
  type: z.enum(['LEADS', 'OPPORTUNITIES', 'COMMUNICATIONS', 'CUSTOM'], {
    errorMap: () => ({ message: 'Tipo inválido' }),
  }),
  filters: z.record(z.unknown()).default({}),
  columns: z.array(z.string()).min(1, 'Deve ter ao menos 1 coluna'),
  groupBy: z.string().optional(),
  sortBy: z.string().optional(),
  format: z.enum(['JSON', 'CSV', 'EXCEL', 'PDF'], {
    errorMap: () => ({ message: 'Formato inválido' }),
  }),
});

export const UpdateReportSchema = CreateReportSchema.partial().extend({
  id: z.string().cuid('ID inválido'),
});

export const GenerateReportSchema = z.object({
  reportId: z.string().cuid('ID do relatório inválido'),
  format: z.enum(['JSON', 'CSV', 'EXCEL', 'PDF']).optional(),
});

export const ScheduleReportSchema = z.object({
  reportId: z.string().cuid('ID do relatório inválido'),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY'], {
    errorMap: () => ({ message: 'Frequência inválida' }),
  }),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:mm)'),
  recipients: z.array(z.string().email('Email inválido')).min(1, 'Deve ter ao menos 1 destinatário'),
  format: z.enum(['JSON', 'CSV', 'EXCEL', 'PDF']),
});

export const FunnelAnalyticsSchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  pipelineId: z.string().cuid().optional(),
});

export const CohortAnalysisSchema = z.object({
  metric: z.enum(['retention', 'conversion'], {
    errorMap: () => ({ message: 'Métrica inválida' }),
  }),
  period: z.enum(['month', 'quarter', 'year']).optional().default('month'),
});

export const PerformanceMetricsSchema = z.object({
  userId: z.string().cuid().optional(),
  teamId: z.string().cuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});
