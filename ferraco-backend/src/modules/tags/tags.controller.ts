import { Response, NextFunction } from 'express';
import { TagsService } from './tags.service';
import { AuthenticatedRequest } from '../../middleware/auth';

const tagsService = new TagsService();

export class TagsController {
  async getTags(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { isActive, isSystem, search, page, limit } = req.query;
      const result = await tagsService.getTags({
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        isSystem: isSystem === 'true' ? true : isSystem === 'false' ? false : undefined,
        search: search as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json({ success: true, message: 'Tags obtidas com sucesso', data: result.data, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  async getTagById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tag = await tagsService.getTagById(id);
      res.json({ success: true, message: 'Tag obtida com sucesso', data: { tag } });
    } catch (error) {
      next(error);
    }
  }

  async createTag(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, color, description } = req.body;
      const tag = await tagsService.createTag({ name, color, description });
      res.status(201).json({ success: true, message: 'Tag criada com sucesso', data: { tag } });
    } catch (error) {
      next(error);
    }
  }

  async updateTag(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { name, color, description, isActive } = req.body;
      const tag = await tagsService.updateTag(id, { name, color, description, isActive });
      res.json({ success: true, message: 'Tag atualizada com sucesso', data: { tag } });
    } catch (error) {
      next(error);
    }
  }

  async deleteTag(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await tagsService.deleteTag(id);
      res.json({ success: true, message: result.message });
    } catch (error) {
      next(error);
    }
  }

  async toggleTagStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tag = await tagsService.toggleTagStatus(id);
      res.json({ success: true, message: 'Status da tag atualizado com sucesso', data: { tag } });
    } catch (error) {
      next(error);
    }
  }

  async getTagStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await tagsService.getTagStats();
      res.json({ success: true, message: 'Estatísticas obtidas com sucesso', data: stats });
    } catch (error) {
      next(error);
    }
  }

  async getPopularTags(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit } = req.query;
      const tags = await tagsService.getPopularTags(limit ? parseInt(limit as string) : undefined);
      res.json({ success: true, message: 'Tags populares obtidas com sucesso', data: { tags } });
    } catch (error) {
      next(error);
    }
  }

  getPredefinedColors(req: AuthenticatedRequest, res: Response): void {
    const colors = tagsService.getPredefinedColors();
    res.json({ success: true, message: 'Cores predefinidas obtidas com sucesso', data: { colors } });
  }

  async getTagRules(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const rules = await tagsService.getTagRules();
      res.json({ success: true, message: 'Regras obtidas com sucesso', data: { rules } });
    } catch (error) {
      next(error);
    }
  }

  async createTagRule(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { condition, value, action } = req.body;
      const rule = await tagsService.createTagRule(id, { condition, value, action });
      res.status(201).json({ success: true, message: 'Regra criada com sucesso', data: { rule } });
    } catch (error) {
      next(error);
    }
  }

  async applyAutomaticTags(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { leadId } = req.params;
      const result = await tagsService.applyAutomaticTags(leadId);
      res.json({ success: true, message: `${result.appliedTags} tags aplicadas automaticamente`, data: result });
    } catch (error) {
      next(error);
    }
  }
}
