import { Request, Response, NextFunction } from 'express';
import { TagsService } from './tags.service';
import {
  CreateTagSchema,
  UpdateTagSchema,
  CreateTagRuleSchema,
  TagFiltersSchema,
  ApplyRulesSchema,
} from './tags.validators';
import { CreateTagDTO, CreateTagRuleDTO } from './tags.types';

export class TagsController {
  constructor(private service: TagsService) {}

  /**
   * GET /api/tags
   * Listar todas as tags com filtros opcionais
   */
  findAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = TagFiltersSchema.parse(req.query);
      const tags = await this.service.findAll(filters);

      res.json({
        success: true,
        data: tags,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/tags/:id
   * Buscar tag por ID
   */
  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tag = await this.service.findById(req.params.id);

      if (!tag) {
        res.status(404).json({
          success: false,
          message: 'Tag não encontrada',
        });
        return;
      }

      res.json({
        success: true,
        data: tag,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/tags
   * Criar nova tag
   */
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = CreateTagSchema.parse(req.body) as CreateTagDTO;
      const tag = await this.service.create(data);

      res.status(201).json({
        success: true,
        data: tag,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/tags/:id
   * Atualizar tag
   */
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = UpdateTagSchema.parse({
        ...req.body,
        id: req.params.id,
      });

      const tag = await this.service.update(data.id, data);

      res.json({
        success: true,
        data: tag,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/tags/:id
   * Deletar tag (não permite deletar tags do sistema)
   */
  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.delete(req.params.id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/tags/system
   * Buscar apenas tags do sistema
   */
  findSystemTags = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const tags = await this.service.findSystemTags();

      res.json({
        success: true,
        data: tags,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/tags/popular
   * Buscar tags mais usadas
   */
  getPopular = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = _req.query.limit ? parseInt(_req.query.limit as string) : 10;
      const tags = await this.service.getPopular(limit);

      res.json({
        success: true,
        data: tags,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/tags/stats
   * Obter estatísticas de uso de tags
   */
  getStats = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.service.getStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/tags/rules
   * Criar regra automática de tag
   */
  createRule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = CreateTagRuleSchema.parse(req.body) as CreateTagRuleDTO;
      const rule = await this.service.createRule(data);

      res.status(201).json({
        success: true,
        data: rule,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/tags/rules
   * Listar todas as regras
   */
  getRules = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const rules = await this.service.getRules();

      res.json({
        success: true,
        data: rules,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/tags/rules/:id
   * Deletar regra
   */
  deleteRule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteRule(req.params.id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/tags/apply-rules
   * Aplicar regras automáticas manualmente
   */
  applyRules = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { leadId } = ApplyRulesSchema.parse(req.body);
      const appliedCount = await this.service.applyRules(leadId);

      res.json({
        success: true,
        data: {
          appliedCount,
          message: `${appliedCount} tag(s) aplicada(s) com sucesso`,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
