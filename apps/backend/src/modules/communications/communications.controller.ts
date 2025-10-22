import { Request, Response } from 'express';
import { CommunicationsService } from './communications.service';
import { prisma } from '../../config/database';
import { successResponse, errorResponse, notFoundResponse } from '../../utils/response';
import {
  SendWhatsAppSchema,
  SendEmailSchema,
  SendSMSSchema,
  RegisterCallSchema,
  CreateTemplateSchema,
  UpdateTemplateSchema,
  WebhookWhatsAppSchema,
  WebhookSendGridSchema,
  CommunicationHistoryFilterSchema,
} from './communications.validators';
import { z } from 'zod';
import { CommunicationType } from '@prisma/client';
import { formatZodErrors } from '../../utils/zodHelpers';

// ============================================================================
// Communications Controller
// ============================================================================

export class CommunicationsController {
  private service: CommunicationsService;

  constructor() {
    this.service = new CommunicationsService(prisma);
  }

  // ========================================================================
  // Message Sending Endpoints
  // ========================================================================

  sendWhatsApp = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = SendWhatsAppSchema.parse(req.body);
      const userId = req.user!.userId;

      const communication = await this.service.sendWhatsApp(data, userId);
      successResponse(res, communication, 'WhatsApp message sent successfully', 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errorResponse(res, 'Validation error', 400, formatZodErrors(error.errors));
      } else {
        errorResponse(res, error instanceof Error ? error.message : 'Failed to send WhatsApp');
      }
    }
  };

  sendEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = SendEmailSchema.parse(req.body);
      const userId = req.user!.userId;

      const communication = await this.service.sendEmail(data, userId);
      successResponse(res, communication, 'Email sent successfully', 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errorResponse(res, 'Validation error', 400, formatZodErrors(error.errors));
      } else {
        errorResponse(res, error instanceof Error ? error.message : 'Failed to send email');
      }
    }
  };

  sendSMS = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = SendSMSSchema.parse(req.body);
      const userId = req.user!.userId;

      const communication = await this.service.sendSMS(data, userId);
      successResponse(res, communication, 'SMS sent successfully', 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errorResponse(res, 'Validation error', 400, formatZodErrors(error.errors));
      } else {
        errorResponse(res, error instanceof Error ? error.message : 'Failed to send SMS');
      }
    }
  };

  registerCall = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = RegisterCallSchema.parse(req.body);
      const userId = req.user!.userId;

      const communication = await this.service.registerCall(data, userId);
      successResponse(res, communication, 'Call registered successfully', 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errorResponse(res, 'Validation error', 400, formatZodErrors(error.errors));
      } else {
        errorResponse(res, error instanceof Error ? error.message : 'Failed to register call');
      }
    }
  };

  // ========================================================================
  // Template Endpoints
  // ========================================================================

  listTemplates = async (req: Request, res: Response): Promise<void> => {
    try {
      const type = req.query.type as CommunicationType | undefined;
      const templates = await this.service.listTemplates(type);
      successResponse(res, templates, 'Templates retrieved successfully');
    } catch (error) {
      errorResponse(res, error instanceof Error ? error.message : 'Failed to retrieve templates');
    }
  };

  createTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = CreateTemplateSchema.parse(req.body);

      const template = await this.service.createTemplate(data);
      successResponse(res, template, 'Template created successfully', 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errorResponse(res, 'Validation error', 400, formatZodErrors(error.errors));
      } else {
        errorResponse(res, error instanceof Error ? error.message : 'Failed to create template');
      }
    }
  };

  updateTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data = UpdateTemplateSchema.partial().parse(req.body);

      const template = await this.service.updateTemplate(id, data);
      successResponse(res, template, 'Template updated successfully');
    } catch (error) {
      if (error instanceof z.ZodError) {
        errorResponse(res, 'Validation error', 400, formatZodErrors(error.errors));
      } else {
        errorResponse(res, error instanceof Error ? error.message : 'Failed to update template');
      }
    }
  };

  deleteTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.service.deleteTemplate(id);
      successResponse(res, null, 'Template deleted successfully');
    } catch (error) {
      errorResponse(res, error instanceof Error ? error.message : 'Failed to delete template');
    }
  };

  // ========================================================================
  // History Endpoints
  // ========================================================================

  getHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { leadId } = req.params;
      const filter = CommunicationHistoryFilterSchema.parse({
        leadId,
        ...req.query,
      });

      const history = await this.service.getHistory({
        ...filter,
        dateFrom: filter.dateFrom ? new Date(filter.dateFrom) : undefined,
        dateTo: filter.dateTo ? new Date(filter.dateTo) : undefined,
      });

      successResponse(res, history, 'Communication history retrieved successfully');
    } catch (error) {
      if (error instanceof z.ZodError) {
        errorResponse(res, 'Validation error', 400, formatZodErrors(error.errors));
      } else {
        errorResponse(res, error instanceof Error ? error.message : 'Failed to retrieve history');
      }
    }
  };

  getCommunication = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const communication = await this.service.getCommunicationById(id);

      if (!communication) {
        notFoundResponse(res, 'Communication not found');
        return;
      }

      successResponse(res, communication, 'Communication retrieved successfully');
    } catch (error) {
      errorResponse(res, error instanceof Error ? error.message : 'Failed to retrieve communication');
    }
  };

  // ========================================================================
  // Webhook Endpoints
  // ========================================================================

  handleWhatsAppWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = WebhookWhatsAppSchema.parse(req.body);

      await this.service.handleWhatsAppWebhook(data);
      successResponse(res, null, 'Webhook processed successfully');
    } catch (error) {
      if (error instanceof z.ZodError) {
        errorResponse(res, 'Validation error', 400, formatZodErrors(error.errors));
      } else {
        errorResponse(res, error instanceof Error ? error.message : 'Failed to process webhook');
      }
    }
  };

  handleSendGridWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = WebhookSendGridSchema.parse(req.body);

      await this.service.handleSendGridWebhook(data);
      successResponse(res, null, 'Webhook processed successfully');
    } catch (error) {
      if (error instanceof z.ZodError) {
        errorResponse(res, 'Validation error', 400, formatZodErrors(error.errors));
      } else {
        errorResponse(res, error instanceof Error ? error.message : 'Failed to process webhook');
      }
    }
  };
}
