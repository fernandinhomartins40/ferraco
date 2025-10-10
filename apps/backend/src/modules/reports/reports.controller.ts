// ============================================================================
// Reports Module - Controller
// ============================================================================

import { Request, Response } from 'express';
import { reportsService } from './reports.service';
import { AuthRequest } from '../../middleware/auth';

export class ReportsController {
  // ============================================================================
  // CRUD Operations
  // ============================================================================

  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const report = await reportsService.create(req.body, userId);

      res.status(201).json({
        success: true,
        data: report,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar relatório',
      });
    }
  }

  async findAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.query.onlyMine === 'true' ? req.user!.id : undefined;
      const reports = await reportsService.findAll(userId);

      res.status(200).json({
        success: true,
        data: reports,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar relatórios',
      });
    }
  }

  async findById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const report = await reportsService.findById(id);

      if (!report) {
        res.status(404).json({
          success: false,
          error: 'Relatório não encontrado',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar relatório',
      });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const report = await reportsService.update(id, { ...req.body, id });

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar relatório',
      });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await reportsService.delete(id);

      res.status(200).json({
        success: true,
        message: 'Relatório deletado com sucesso',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao deletar relatório',
      });
    }
  }

  // ============================================================================
  // Generation & Download
  // ============================================================================

  async generate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const format = req.body.format || req.query.format;

      const buffer = await reportsService.generate(id, format);

      // Set appropriate headers based on format
      const contentTypes: Record<string, string> = {
        JSON: 'application/json',
        CSV: 'text/csv',
        EXCEL: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        PDF: 'application/pdf',
      };

      const extensions: Record<string, string> = {
        JSON: 'json',
        CSV: 'csv',
        EXCEL: 'xlsx',
        PDF: 'pdf',
      };

      const actualFormat = format || 'JSON';
      const contentType = contentTypes[actualFormat] || 'application/octet-stream';
      const extension = extensions[actualFormat] || 'bin';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="report-${id}.${extension}"`);
      res.send(buffer);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao gerar relatório',
      });
    }
  }

  async download(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const format = req.query.format as string | undefined;

      const buffer = await reportsService.generate(id, format as 'JSON' | 'CSV' | 'EXCEL' | 'PDF');

      const contentTypes: Record<string, string> = {
        JSON: 'application/json',
        CSV: 'text/csv',
        EXCEL: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        PDF: 'application/pdf',
      };

      const extensions: Record<string, string> = {
        JSON: 'json',
        CSV: 'csv',
        EXCEL: 'xlsx',
        PDF: 'pdf',
      };

      const actualFormat = format || 'JSON';
      const contentType = contentTypes[actualFormat] || 'application/octet-stream';
      const extension = extensions[actualFormat] || 'bin';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="report-${id}.${extension}"`);
      res.send(buffer);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao fazer download do relatório',
      });
    }
  }

  // ============================================================================
  // Scheduling
  // ============================================================================

  async schedule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const scheduleData = {
        reportId: id,
        ...req.body,
      };

      const report = await reportsService.schedule(scheduleData);

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao agendar relatório',
      });
    }
  }

  async getScheduled(req: Request, res: Response): Promise<void> {
    try {
      const reports = await reportsService.getScheduled();

      res.status(200).json({
        success: true,
        data: reports,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar relatórios agendados',
      });
    }
  }

  // ============================================================================
  // Analytics
  // ============================================================================

  async getFunnelAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const params = {
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        pipelineId: req.query.pipelineId as string | undefined,
      };

      const analytics = await reportsService.getFunnelAnalytics(params);

      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar analytics de funil',
      });
    }
  }

  async getCohortAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const params = {
        metric: req.query.metric as 'retention' | 'conversion',
        period: req.query.period as 'month' | 'quarter' | 'year' | undefined,
      };

      const analysis = await reportsService.getCohortAnalysis(params);

      res.status(200).json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar análise de cohort',
      });
    }
  }

  async getPerformanceMetrics(req: Request, res: Response): Promise<void> {
    try {
      const params = {
        userId: req.query.userId as string | undefined,
        teamId: req.query.teamId as string | undefined,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
      };

      const metrics = await reportsService.getPerformanceMetrics(params);

      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar métricas de performance',
      });
    }
  }
}

export const reportsController = new ReportsController();
