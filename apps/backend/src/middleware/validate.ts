import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationObject = {
        body: req.body,
        query: req.query,
        params: req.params,
      };

      const validated = await schema.parseAsync(validationObject);

      // Atualiza req com dados validados
      req.body = validated.body || req.body;
      req.query = validated.query || req.query;
      req.params = validated.params || req.params;

      next();
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.errors || error.message,
      });
    }
  };
};
