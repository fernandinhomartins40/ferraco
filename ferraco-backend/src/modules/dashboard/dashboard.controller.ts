import { Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service';
import { AuthenticatedRequest } from '../../middleware/auth';

const dashboardService = new DashboardService();

export class DashboardController {
  /**
   * GET /dashboard/metrics
   */
  async getMetrics(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const metrics = await dashboardService.getMetrics();

      res.json({
        success: true,
        message: 'Métricas obtidas com sucesso',
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /dashboard/detailed-metrics
   */
  async getDetailedMetrics(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { startDate, endDate, assignedToId, source } = req.query;

      const metrics = await dashboardService.getDetailedMetrics({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        assignedToId: assignedToId as string,
        source: source as string,
      });

      res.json({
        success: true,
        message: 'Métricas detalhadas obtidas com sucesso',
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }
}
