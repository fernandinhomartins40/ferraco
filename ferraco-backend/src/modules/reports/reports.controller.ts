import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { ReportsService } from './reports.service';
import { successResponse } from '../../utils/response';

const reportsService = new ReportsService();

export class ReportsController {
  /**
   * GET /api/reports
   */
  async getReports(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { type, generatedById, search, page, limit } = req.query;

      const result = await reportsService.getReports({
        type: type as string,
        generatedById: generatedById as string,
        search: search as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json(successResponse(result, 'Relatórios listados com sucesso'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/reports/:id
   */
  async getReportById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const report = await reportsService.getReportById(id);
      res.json(successResponse(report, 'Relatório encontrado'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/reports
   */
  async createReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const generatedById = req.user?.id || '';
      const report = await reportsService.createReport({
        ...req.body,
        generatedById,
      });
      res.status(201).json(successResponse(report, 'Relatório criado com sucesso'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/reports/:id
   */
  async updateReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const report = await reportsService.updateReport(id, req.body);
      res.json(successResponse(report, 'Relatório atualizado com sucesso'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/reports/:id
   */
  async deleteReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await reportsService.deleteReport(id);
      res.json(successResponse(result, 'Relatório deletado com sucesso'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/reports/generate/leads
   */
  async generateLeadsReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, status, source, assignedToId } = req.body;

      const report = await reportsService.generateLeadsReport({
        startDate,
        endDate,
        status,
        source,
        assignedToId,
      });

      res.json(successResponse(report, 'Relatório de leads gerado com sucesso'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/reports/generate/communications
   */
  async generateCommunicationsReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, type, direction, leadId } = req.body;

      const report = await reportsService.generateCommunicationsReport({
        startDate,
        endDate,
        type,
        direction,
        leadId,
      });

      res.json(successResponse(report, 'Relatório de comunicações gerado com sucesso'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/reports/generate/sales-funnel
   */
  async generateSalesFunnelReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, pipelineId } = req.body;

      const report = await reportsService.generateSalesFunnelReport({
        startDate,
        endDate,
        pipelineId,
      });

      res.json(successResponse(report, 'Relatório de funil de vendas gerado com sucesso'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/reports/generate/user-performance
   */
  async generateUserPerformanceReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, userId } = req.body;

      const report = await reportsService.generateUserPerformanceReport({
        startDate,
        endDate,
        userId,
      });

      res.json(successResponse(report, 'Relatório de performance gerado com sucesso'));
    } catch (error) {
      next(error);
    }
  }
}
