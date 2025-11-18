import { Response } from 'express';
import { batchService } from './batch.service';
import { AuthRequest } from '../../middleware/auth';
import { ApiKeyAuthRequest } from '../../middleware/apiKeyAuth';

export class BatchController {
  /**
   * Executa operações em lote
   */
  async executeBatch(req: AuthRequest | ApiKeyAuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const apiKeyId = (req as ApiKeyAuthRequest).apiKey?.id;

      if (!userId && !apiKeyId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
        });
        return;
      }

      const result = await batchService.executeBatch(
        req.body,
        userId || (req as ApiKeyAuthRequest).apiKey!.userId,
        apiKeyId
      );

      // Status code baseado no resultado
      const statusCode = result.success ? 200 : 207; // 207 = Multi-Status

      res.status(statusCode).json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to execute batch operations',
        code: 'BATCH_ERROR',
      });
    }
  }
}

export const batchController = new BatchController();
