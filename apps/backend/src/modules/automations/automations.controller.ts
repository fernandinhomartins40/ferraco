import { Request, Response } from 'express';
import { AutomationsService } from './automations.service';
import { prisma } from '../../config/database';
import { successResponse, errorResponse, notFoundResponse } from '../../utils/response';
import {
  CreateAutomationSchema,
  UpdateAutomationSchema,
  ExecuteAutomationSchema,
  TestAutomationSchema,
  AutomationExecutionFilterSchema,
} from './automations.validators';
import {
  CreateAutomationDTO,
  UpdateAutomationDTO,
  ExecuteAutomationDTO,
  TestAutomationDTO,
} from './automations.types';
import { z } from 'zod';

// ============================================================================
// Automations Controller
// ============================================================================

export class AutomationsController {
  private service: AutomationsService;

  constructor() {
    this.service = new AutomationsService(prisma);
  }

  // ========================================================================
  // CRUD Endpoints
  // ========================================================================

  listAutomations = async (_req: Request, res: Response): Promise<void> => {
    try {
      const automations = await this.service.findAll();
      successResponse(res, automations, 'Automations retrieved successfully');
    } catch (error) {
      errorResponse(res, error instanceof Error ? error.message : 'Failed to retrieve automations');
    }
  };

  getAutomation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const automation = await this.service.findById(id);

      if (!automation) {
        notFoundResponse(res, 'Automation not found');
        return;
      }

      successResponse(res, automation, 'Automation retrieved successfully');
    } catch (error) {
      errorResponse(res, error instanceof Error ? error.message : 'Failed to retrieve automation');
    }
  };

  createAutomation = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = CreateAutomationSchema.parse(req.body) as CreateAutomationDTO;
      const userId = req.user!.userId;

      const automation = await this.service.create(data, userId);
      successResponse(res, automation, 'Automation created successfully', 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errorResponse(res, 'Validation error', 400, error.errors.map(err => ({ field: err.path.join('.'), message: err.message, code: err.code })));
      } else {
        errorResponse(res, error instanceof Error ? error.message : 'Failed to create automation');
      }
    }
  };

  updateAutomation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data = UpdateAutomationSchema.partial().parse(req.body) as Partial<UpdateAutomationDTO>;

      const automation = await this.service.update(id, data);
      successResponse(res, automation, 'Automation updated successfully');
    } catch (error) {
      if (error instanceof z.ZodError) {
        errorResponse(res, 'Validation error', 400, error.errors.map(err => ({ field: err.path.join('.'), message: err.message, code: err.code })));
      } else {
        errorResponse(res, error instanceof Error ? error.message : 'Failed to update automation');
      }
    }
  };

  deleteAutomation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.service.delete(id);
      successResponse(res, null, 'Automation deleted successfully');
    } catch (error) {
      errorResponse(res, error instanceof Error ? error.message : 'Failed to delete automation');
    }
  };

  // ========================================================================
  // Action Endpoints
  // ========================================================================

  toggleAutomation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const automation = await this.service.toggle(id);
      successResponse(res, automation, 'Automation toggled successfully');
    } catch (error) {
      errorResponse(res, error instanceof Error ? error.message : 'Failed to toggle automation');
    }
  };

  testAutomation = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = TestAutomationSchema.parse(req.body) as TestAutomationDTO;

      const result = await this.service.test(data);
      successResponse(res, result, 'Automation test completed');
    } catch (error) {
      if (error instanceof z.ZodError) {
        errorResponse(res, 'Validation error', 400, error.errors.map(err => ({ field: err.path.join('.'), message: err.message, code: err.code })));
      } else {
        errorResponse(res, error instanceof Error ? error.message : 'Failed to test automation');
      }
    }
  };

  executeAutomation = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = ExecuteAutomationSchema.parse(req.body) as ExecuteAutomationDTO;

      const execution = await this.service.execute(data);
      successResponse(res, execution, 'Automation executed successfully', 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errorResponse(res, 'Validation error', 400, error.errors.map(err => ({ field: err.path.join('.'), message: err.message, code: err.code })));
      } else {
        errorResponse(res, error instanceof Error ? error.message : 'Failed to execute automation');
      }
    }
  };

  // ========================================================================
  // Statistics & History Endpoints
  // ========================================================================

  getExecutions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const filter = AutomationExecutionFilterSchema.partial().parse({
        automationId: id,
        ...req.query,
      });

      const executions = await this.service.getExecutions(id, {
        success: filter.success,
        dateFrom: filter.dateFrom ? new Date(filter.dateFrom) : undefined,
        dateTo: filter.dateTo ? new Date(filter.dateTo) : undefined,
        limit: filter.limit,
        offset: filter.offset,
      });

      successResponse(res, executions, 'Executions retrieved successfully');
    } catch (error) {
      if (error instanceof z.ZodError) {
        errorResponse(res, 'Validation error', 400, error.errors.map(err => ({ field: err.path.join('.'), message: err.message, code: err.code })));
      } else {
        errorResponse(res, error instanceof Error ? error.message : 'Failed to retrieve executions');
      }
    }
  };

  getStats = async (_req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.service.getStats();
      successResponse(res, stats, 'Statistics retrieved successfully');
    } catch (error) {
      errorResponse(res, error instanceof Error ? error.message : 'Failed to retrieve statistics');
    }
  };
}
