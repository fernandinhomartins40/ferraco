import { PrismaClient } from '@prisma/client';
import { BatchOperation, BatchOperationResult, BatchRequest, BatchResponse } from './batch.types';
import { LeadsService } from '../leads/leads.service';
import { LeadsExportService } from '../leads/leads.export.service';

const prisma = new PrismaClient();

export class BatchService {
  private leadsService: LeadsService;
  private leadsExportService: LeadsExportService;

  constructor() {
    this.leadsService = new LeadsService(prisma);
    this.leadsExportService = new LeadsExportService(prisma, this.leadsService);
  }

  /**
   * Executa operações em lote
   */
  async executeBatch(
    request: BatchRequest,
    userId: string,
    apiKeyId?: string
  ): Promise<BatchResponse> {
    const startTime = Date.now();
    const results: BatchOperationResult[] = [];
    let successCount = 0;
    let failCount = 0;

    // Validações
    if (!request.operations || request.operations.length === 0) {
      throw new Error('No operations provided');
    }

    if (request.operations.length > 100) {
      throw new Error('Maximum 100 operations per batch');
    }

    // Executa operações
    for (const operation of request.operations) {
      try {
        const result = await this.executeOperation(operation, userId, apiKeyId);
        results.push(result);

        if (result.success) {
          successCount++;
        } else {
          failCount++;

          // Se atomic=true e houve erro, para execução
          if (request.atomic && !result.success) {
            // TODO: Implementar rollback de operações anteriores
            throw new Error('Batch operation failed in atomic mode');
          }

          // Se continueOnError=false, para na primeira falha
          if (!request.continueOnError && !result.success) {
            break;
          }
        }
      } catch (error: any) {
        const errorResult: BatchOperationResult = {
          id: operation.id,
          success: false,
          statusCode: 500,
          error: error.message,
          code: 'BATCH_OPERATION_ERROR',
        };
        results.push(errorResult);
        failCount++;

        if (request.atomic || !request.continueOnError) {
          break;
        }
      }
    }

    const executionTime = Date.now() - startTime;

    return {
      success: failCount === 0,
      results,
      summary: {
        total: request.operations.length,
        successful: successCount,
        failed: failCount,
        executionTime,
      },
      meta: {
        timestamp: new Date().toISOString(),
        atomic: request.atomic || false,
        continueOnError: request.continueOnError !== false,
      },
    };
  }

  /**
   * Executa uma operação individual
   */
  private async executeOperation(
    operation: BatchOperation,
    userId: string,
    apiKeyId?: string
  ): Promise<BatchOperationResult> {
    try {
      // Parse do path para identificar recurso e ID
      const pathParts = operation.path.split('/').filter((p) => p);
      const resource = pathParts[0]; // "leads", "tags", etc.
      const resourceId = pathParts[1]; // ID do recurso (se houver)

      // Roteamento baseado no recurso
      switch (resource) {
        case 'leads':
          return await this.executeLeadOperation(operation, resourceId, userId);

        case 'tags':
          return await this.executeTagOperation(operation, resourceId, userId);

        default:
          return {
            id: operation.id,
            success: false,
            statusCode: 404,
            error: `Resource '${resource}' not supported in batch operations`,
            code: 'UNSUPPORTED_RESOURCE',
          };
      }
    } catch (error: any) {
      return {
        id: operation.id,
        success: false,
        statusCode: 500,
        error: error.message,
        code: 'OPERATION_ERROR',
      };
    }
  }

  /**
   * Executa operação de lead
   */
  private async executeLeadOperation(
    operation: BatchOperation,
    resourceId: string | undefined,
    userId: string
  ): Promise<BatchOperationResult> {
    try {
      switch (operation.method) {
        case 'GET':
          if (resourceId) {
            // GET /leads/:id
            const lead = await this.leadsService.findById(resourceId);
            if (!lead) {
              return {
                id: operation.id,
                success: false,
                statusCode: 404,
                error: 'Lead not found',
                code: 'LEAD_NOT_FOUND',
              };
            }
            return {
              id: operation.id,
              success: true,
              statusCode: 200,
              data: lead,
            };
          } else {
            // GET /leads (lista)
            const leads = await this.leadsService.findAll({});
            return {
              id: operation.id,
              success: true,
              statusCode: 200,
              data: leads,
            };
          }

        case 'POST':
          // POST /leads (criar)
          const created = await this.leadsService.create(operation.body, userId);
          return {
            id: operation.id,
            success: true,
            statusCode: 201,
            data: created,
          };

        case 'PUT':
        case 'PATCH':
          // PUT /leads/:id (atualizar)
          if (!resourceId) {
            return {
              id: operation.id,
              success: false,
              statusCode: 400,
              error: 'Lead ID required for update',
              code: 'MISSING_ID',
            };
          }
          const updated = await this.leadsService.update(resourceId, operation.body);
          return {
            id: operation.id,
            success: true,
            statusCode: 200,
            data: updated,
          };

        case 'DELETE':
          // DELETE /leads/:id (deletar)
          if (!resourceId) {
            return {
              id: operation.id,
              success: false,
              statusCode: 400,
              error: 'Lead ID required for delete',
              code: 'MISSING_ID',
            };
          }
          await this.leadsService.delete(resourceId);
          return {
            id: operation.id,
            success: true,
            statusCode: 204,
          };

        default:
          return {
            id: operation.id,
            success: false,
            statusCode: 405,
            error: `Method ${operation.method} not allowed`,
            code: 'METHOD_NOT_ALLOWED',
          };
      }
    } catch (error: any) {
      return {
        id: operation.id,
        success: false,
        statusCode: 500,
        error: error.message,
        code: 'LEAD_OPERATION_ERROR',
      };
    }
  }

  /**
   * Executa operação de tag
   */
  private async executeTagOperation(
    operation: BatchOperation,
    resourceId: string | undefined,
    userId: string
  ): Promise<BatchOperationResult> {
    try {
      // TODO: Implementar operações de tag
      return {
        id: operation.id,
        success: false,
        statusCode: 501,
        error: 'Tag operations not implemented yet',
        code: 'NOT_IMPLEMENTED',
      };
    } catch (error: any) {
      return {
        id: operation.id,
        success: false,
        statusCode: 500,
        error: error.message,
        code: 'TAG_OPERATION_ERROR',
      };
    }
  }
}

export const batchService = new BatchService();
