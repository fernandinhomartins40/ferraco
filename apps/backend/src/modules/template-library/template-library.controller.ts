/**
 * Template Library Controller
 */

import { Request, Response } from 'express';
import { templateLibraryService } from './template-library.service';
import {
  createTemplateSchema,
  updateTemplateSchema,
  templateFiltersSchema,
  templatePreviewSchema,
} from './template-library.validators';
import { ZodError } from 'zod';
import { logger } from '../../utils/logger';

export class TemplateLibraryController {
  /**
   * GET /api/template-library - Listar todos os templates
   */
  async list(req: Request, res: Response) {
    try {
      const filters = templateFiltersSchema.parse(req.query);
      const templates = await templateLibraryService.list(filters);
      res.json(templates);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Parâmetros inválidos', details: error.errors });
      }
      logger.error('Erro ao listar templates:', error);
      res.status(500).json({ error: 'Erro ao listar templates' });
    }
  }

  /**
   * GET /api/template-library/:id - Buscar template por ID
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const template = await templateLibraryService.getById(id);
      res.json(template);
    } catch (error) {
      if (error instanceof Error && error.message === 'Template não encontrado') {
        return res.status(404).json({ error: error.message });
      }
      logger.error('Erro ao buscar template:', error);
      res.status(500).json({ error: 'Erro ao buscar template' });
    }
  }

  /**
   * POST /api/template-library - Criar novo template
   */
  async create(req: Request, res: Response) {
    try {
      const validatedData = createTemplateSchema.parse(req.body);
      const template = await templateLibraryService.create(validatedData as any);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      logger.error('Erro ao criar template:', error);
      res.status(500).json({ error: 'Erro ao criar template' });
    }
  }

  /**
   * PUT /api/template-library/:id - Atualizar template
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = updateTemplateSchema.parse(req.body);
      const template = await templateLibraryService.update(id, data);
      res.json(template);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      if (error instanceof Error) {
        if (error.message === 'Template não encontrado') {
          return res.status(404).json({ error: error.message });
        }
        return res.status(400).json({ error: error.message });
      }
      logger.error('Erro ao atualizar template:', error);
      res.status(500).json({ error: 'Erro ao atualizar template' });
    }
  }

  /**
   * DELETE /api/template-library/:id - Deletar template
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await templateLibraryService.delete(id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Template não encontrado') {
          return res.status(404).json({ error: error.message });
        }
        return res.status(400).json({ error: error.message });
      }
      logger.error('Erro ao deletar template:', error);
      res.status(500).json({ error: 'Erro ao deletar template' });
    }
  }

  /**
   * POST /api/template-library/:id/duplicate - Duplicar template
   */
  async duplicate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const template = await templateLibraryService.duplicate(id);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof Error && error.message === 'Template não encontrado') {
        return res.status(404).json({ error: error.message });
      }
      logger.error('Erro ao duplicar template:', error);
      res.status(500).json({ error: 'Erro ao duplicar template' });
    }
  }

  /**
   * POST /api/template-library/preview - Gerar preview do template
   */
  async preview(req: Request, res: Response) {
    try {
      const { templateId, content } = templatePreviewSchema.parse(req.body);
      const preview = await templateLibraryService.generatePreview(templateId, content);
      res.json(preview);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      logger.error('Erro ao gerar preview:', error);
      res.status(500).json({ error: 'Erro ao gerar preview' });
    }
  }

  /**
   * GET /api/template-library/stats - Obter estatísticas
   */
  async getStats(req: Request, res: Response) {
    try {
      const stats = await templateLibraryService.getStats();
      res.json(stats);
    } catch (error) {
      logger.error('Erro ao obter estatísticas:', error);
      res.status(500).json({ error: 'Erro ao obter estatísticas' });
    }
  }

  /**
   * GET /api/template-library/variables - Obter variáveis disponíveis
   */
  async getAvailableVariables(req: Request, res: Response) {
    try {
      const variables = templateLibraryService.getAvailableVariables();
      res.json(variables);
    } catch (error) {
      logger.error('Erro ao obter variáveis:', error);
      res.status(500).json({ error: 'Erro ao obter variáveis' });
    }
  }
}
