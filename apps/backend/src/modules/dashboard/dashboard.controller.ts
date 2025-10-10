// ============================================================================
// Dashboard Module - Controller
// ============================================================================

import { Request, Response } from 'express';
import { dashboardService } from './dashboard.service';
import { AuthRequest } from '../../middleware/auth';

export class DashboardController {
  // ============================================================================
  // Metrics
  // ============================================================================

  async getMetrics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.query.onlyMine === 'true' ? req.user!.id : undefined;
      const metrics = await dashboardService.getMetrics(userId);

      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar métricas',
      });
    }
  }

  async getLeadsByStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.query.onlyMine === 'true' ? req.user!.id : undefined;
      const data = await dashboardService.getLeadsByStatus(userId);

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar leads por status',
      });
    }
  }

  async getLeadsBySource(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.query.onlyMine === 'true' ? req.user!.id : undefined;
      const data = await dashboardService.getLeadsBySource(userId);

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar leads por fonte',
      });
    }
  }

  async getRecentActivity(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.query.onlyMine === 'true' ? req.user!.id : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const activities = await dashboardService.getRecentActivity(userId, limit);

      res.status(200).json({
        success: true,
        data: activities,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar atividades recentes',
      });
    }
  }

  async getLeadsOverTime(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.query.onlyMine === 'true' ? req.user!.id : undefined;
      const period = (req.query.period as 'daily' | 'weekly' | 'monthly') || 'daily';
      const data = await dashboardService.getLeadsOverTime(userId, period);

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar leads ao longo do tempo',
      });
    }
  }

  // ============================================================================
  // Widgets
  // ============================================================================

  async createWidget(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const config = await dashboardService.createWidget(userId, req.body);

      res.status(201).json({
        success: true,
        data: config,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar widget',
      });
    }
  }

  async updateWidget(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const config = await dashboardService.updateWidget(userId, req.body);

      res.status(200).json({
        success: true,
        data: config,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar widget',
      });
    }
  }

  async deleteWidget(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { widgetId } = req.params;
      const config = await dashboardService.deleteWidget(userId, widgetId);

      res.status(200).json({
        success: true,
        data: config,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao deletar widget',
      });
    }
  }

  async saveLayout(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const config = await dashboardService.saveLayout(userId, req.body);

      res.status(200).json({
        success: true,
        data: config,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao salvar layout',
      });
    }
  }
}

export const dashboardController = new DashboardController();
