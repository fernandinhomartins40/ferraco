import { Request, Response, NextFunction } from 'express';
import { whatsappAutomationService } from '../../services/whatsappAutomation.service';
import {
  CreateWhatsAppAutomationSchema,
  RetryAutomationSchema,
  WhatsAppAutomationFiltersSchema,
  AutomationIdParamSchema,
  LeadIdParamSchema
} from './whatsapp-automation.validators';
import { z } from 'zod';
import { logger } from '../../utils/logger';
import {
  successResponse,
  createdResponse,
  notFoundResponse,
  badRequestResponse,
  paginatedResponse
} from '../../utils/response';

// ============================================================================
// WhatsAppAutomationController
// ============================================================================

export class WhatsAppAutomationController {
  /**
   * POST /api/whatsapp-automations
   * Cria nova automação
   */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = CreateWhatsAppAutomationSchema.parse(req.body);

      const automationId = await whatsappAutomationService.createAutomationFromLead(
        validatedData.leadId
      );

      if (!automationId) {
        badRequestResponse(res, 'Não foi possível criar automação. Verifique os logs para detalhes.');
        return;
      }

      const automation = await whatsappAutomationService.getById(automationId);

      createdResponse(res, automation, 'Automação criada com sucesso');
    } catch (error) {
      if (error instanceof z.ZodError) {
        badRequestResponse(res, 'Erro de validação', error.errors);
        return;
      }
      next(error);
    }
  };

  /**
   * GET /api/whatsapp-automations
   * Lista todas as automações com filtros
   */
  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = WhatsAppAutomationFiltersSchema.parse(req.query);

      const automations = await whatsappAutomationService.list({
        status: filters.status,
        leadId: filters.leadId,
        dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
        dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
        limit: filters.limit,
        offset: filters.offset
      });

      const total = automations.length; // TODO: implementar count separado

      paginatedResponse(
        res,
        automations,
        Math.floor(filters.offset / filters.limit) + 1,
        filters.limit,
        total
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        badRequestResponse(res, 'Erro de validação', error.errors);
        return;
      }
      next(error);
    }
  };

  /**
   * GET /api/whatsapp-automations/stats
   * Obtém estatísticas gerais
   */
  getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await whatsappAutomationService.getStats();
      successResponse(res, stats);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/whatsapp-automations/anti-spam-stats
   * Obtém estatísticas do sistema anti-spam
   */
  getAntiSpamStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const antiSpamStats = whatsappAutomationService.getAntiSpamStats();
      successResponse(res, antiSpamStats);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/whatsapp-automations/reset-anti-spam
   * Reset do sistema anti-spam (emergência - requer admin)
   */
  resetAntiSpam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      whatsappAutomationService.resetAntiSpam();
      successResponse(res, { message: 'Sistema anti-spam resetado com sucesso' });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/whatsapp-automations/:id
   * Obtém detalhes de uma automação
   */
  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = AutomationIdParamSchema.parse(req.params);

      const automation = await whatsappAutomationService.getById(id);

      successResponse(res, automation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        badRequestResponse(res, 'ID inválido', error.errors);
        return;
      }

      if (error instanceof Error && error.message.includes('não encontrada')) {
        notFoundResponse(res, error.message);
        return;
      }

      next(error);
    }
  };

  /**
   * GET /api/whatsapp-automations/lead/:leadId
   * Obtém automações de um lead específico
   */
  findByLeadId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { leadId } = LeadIdParamSchema.parse(req.params);

      const automations = await whatsappAutomationService.list({
        leadId,
        limit: 100,
        offset: 0
      });

      successResponse(res, automations);
    } catch (error) {
      if (error instanceof z.ZodError) {
        badRequestResponse(res, 'Lead ID inválido', error.errors);
        return;
      }
      next(error);
    }
  };

  /**
   * POST /api/whatsapp-automations/:id/retry
   * Tenta reenviar automação falhada
   */
  retry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = AutomationIdParamSchema.parse(req.params);
      const { resetMessages } = RetryAutomationSchema.parse(req.body || {});

      await whatsappAutomationService.retryAutomation(id, resetMessages);

      successResponse(res, { id }, 'Automação reenviada para a fila');
    } catch (error) {
      if (error instanceof z.ZodError) {
        badRequestResponse(res, 'Erro de validação', error.errors);
        return;
      }

      if (error instanceof Error && error.message.includes('não encontrada')) {
        notFoundResponse(res, error.message);
        return;
      }

      next(error);
    }
  };

  /**
   * POST /api/whatsapp-automations/retry-all-failed
   * Retry em lote de automações falhadas
   */
  retryAllFailed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { leadId } = req.body;

      const count = await whatsappAutomationService.retryAllFailed(leadId);

      successResponse(res, { count }, `${count} automações reenviadas para a fila`);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/whatsapp-automations/failed
   * Lista apenas automações falhadas
   */
  findAllFailed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const automations = await whatsappAutomationService.list({
        status: 'FAILED',
        limit: 100,
        offset: 0
      });

      successResponse(res, automations);
    } catch (error) {
      next(error);
    }
  };
}

export const whatsappAutomationController = new WhatsAppAutomationController();
