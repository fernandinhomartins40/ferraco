import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { CommunicationsService } from './communications.service';
import { successResponse } from '../../utils/response';

const communicationsService = new CommunicationsService();

export class CommunicationsController {
  /**
   * GET /api/communications
   */
  async getCommunications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const {
        leadId,
        type,
        direction,
        status,
        search,
        startDate,
        endDate,
        page,
        limit,
      } = req.query;

      const result = await communicationsService.getCommunications({
        leadId: leadId as string,
        type: type as string,
        direction: direction as string,
        status: status as string,
        search: search as string,
        startDate: startDate as string,
        endDate: endDate as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json(successResponse(result, 'Comunicações listadas com sucesso'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/communications/:id
   */
  async getCommunicationById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const communication = await communicationsService.getCommunicationById(id);
      res.json(successResponse(communication, 'Comunicação encontrada'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/communications
   */
  async createCommunication(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const sentById = req.user?.id || '';
      const communication = await communicationsService.createCommunication({
        ...req.body,
        sentById,
      });
      res.status(201).json(successResponse(communication, 'Comunicação criada com sucesso'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/communications/:id
   */
  async updateCommunication(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const communication = await communicationsService.updateCommunication(id, req.body);
      res.json(successResponse(communication, 'Comunicação atualizada com sucesso'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/communications/:id
   */
  async deleteCommunication(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await communicationsService.deleteCommunication(id);
      res.json(successResponse(result, 'Comunicação deletada com sucesso'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/communications/:id/read
   */
  async markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const communication = await communicationsService.markAsRead(id);
      res.json(successResponse(communication, 'Comunicação marcada como lida'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/communications/stats
   */
  async getCommunicationStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, leadId } = req.query;

      const stats = await communicationsService.getCommunicationStats({
        startDate: startDate as string,
        endDate: endDate as string,
        leadId: leadId as string,
      });

      res.json(successResponse(stats, 'Estatísticas obtidas com sucesso'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/communications/email
   */
  async sendEmail(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const sentById = req.user?.id || '';
      const communication = await communicationsService.sendEmail({
        ...req.body,
        sentById,
      });
      res.status(201).json(successResponse(communication, 'Email enviado com sucesso'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/communications/whatsapp
   */
  async sendWhatsApp(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const sentById = req.user?.id || '';
      const communication = await communicationsService.sendWhatsApp({
        ...req.body,
        sentById,
      });
      res.status(201).json(successResponse(communication, 'WhatsApp enviado com sucesso'));
    } catch (error) {
      next(error);
    }
  }
}
