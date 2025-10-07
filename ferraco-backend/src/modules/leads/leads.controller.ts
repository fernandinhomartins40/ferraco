import { Response, NextFunction } from 'express';
import { LeadsService } from './leads.service';
import { AuthenticatedRequest } from '../../middleware/auth';

const leadsService = new LeadsService();

export class LeadsController {
  /**
   * GET /leads
   */
  async getLeads(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const {
        status,
        search,
        tags,
        assignedToId,
        source,
        priority,
        page,
        limit,
        sortBy,
        sortOrder,
      } = req.query;

      const result = await leadsService.getLeads({
        status: status as any,
        search: search as string,
        tags: tags ? (Array.isArray(tags) ? tags as string[] : [tags as string]) : undefined,
        assignedToId: assignedToId as string,
        source: source as string,
        priority: priority as any,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });

      res.json({
        success: true,
        message: 'Leads obtidos com sucesso',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /leads/:id
   */
  async getLeadById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const lead = await leadsService.getLeadById(id);

      res.json({
        success: true,
        message: 'Lead obtido com sucesso',
        data: { lead },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /leads
   */
  async createLead(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { name, phone, email, status, source, priority, assignedToId } =
        req.body;

      const lead = await leadsService.createLead({
        name,
        phone,
        email,
        status,
        source,
        priority,
        assignedToId,
        createdById: req.user!.id,
      });

      res.status(201).json({
        success: true,
        message: 'Lead criado com sucesso',
        data: { lead },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /leads/:id
   */
  async updateLead(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const {
        name,
        phone,
        email,
        status,
        priority,
        source,
        assignedToId,
        nextFollowUp,
        leadScore,
        pipelineStage,
      } = req.body;

      const lead = await leadsService.updateLead(id, {
        name,
        phone,
        email,
        status,
        priority,
        source,
        assignedToId,
        nextFollowUp: nextFollowUp ? new Date(nextFollowUp) : undefined,
        leadScore,
        pipelineStage,
      });

      res.json({
        success: true,
        message: 'Lead atualizado com sucesso',
        data: { lead },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /leads/:id/status
   */
  async updateLeadStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const lead = await leadsService.updateLeadStatus(id, status);

      res.json({
        success: true,
        message: 'Status do lead atualizado com sucesso',
        data: { lead },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /leads/:id
   */
  async deleteLead(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const result = await leadsService.deleteLead(id);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /leads/stats
   */
  async getLeadStats(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const stats = await leadsService.getLeadStats();

      res.json({
        success: true,
        message: 'Estatísticas obtidas com sucesso',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}
