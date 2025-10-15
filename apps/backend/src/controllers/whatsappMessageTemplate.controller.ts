import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class WhatsAppMessageTemplateController {
  // GET /api/whatsapp-templates - Listar todos os templates
  async getAll(req: Request, res: Response) {
    try {
      const templates = await prisma.whatsAppMessageTemplate.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });

      res.json(templates);
    } catch (error) {
      console.error('Erro ao buscar templates:', error);
      res.status(500).json({ error: 'Erro ao buscar templates de mensagem' });
    }
  }

  // GET /api/whatsapp-templates/:id - Buscar template por ID
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const template = await prisma.whatsAppMessageTemplate.findUnique({
        where: { id },
      });

      if (!template) {
        return res.status(404).json({ error: 'Template não encontrado' });
      }

      res.json(template);
    } catch (error) {
      console.error('Erro ao buscar template:', error);
      res.status(500).json({ error: 'Erro ao buscar template' });
    }
  }

  // POST /api/whatsapp-templates - Criar novo template
  async create(req: Request, res: Response) {
    try {
      const { name, content, mediaUrls, mediaType } = req.body;

      if (!name || !content) {
        return res.status(400).json({ error: 'Nome e conteúdo são obrigatórios' });
      }

      const template = await prisma.whatsAppMessageTemplate.create({
        data: {
          name,
          content,
          mediaUrls: mediaUrls ? JSON.stringify(mediaUrls) : null,
          mediaType,
        },
      });

      res.status(201).json(template);
    } catch (error) {
      console.error('Erro ao criar template:', error);
      res.status(500).json({ error: 'Erro ao criar template' });
    }
  }

  // PUT /api/whatsapp-templates/:id - Atualizar template
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, content, mediaUrls, mediaType, isActive } = req.body;

      const template = await prisma.whatsAppMessageTemplate.update({
        where: { id },
        data: {
          name,
          content,
          mediaUrls: mediaUrls ? JSON.stringify(mediaUrls) : null,
          mediaType,
          isActive,
        },
      });

      res.json(template);
    } catch (error) {
      console.error('Erro ao atualizar template:', error);
      res.status(500).json({ error: 'Erro ao atualizar template' });
    }
  }

  // DELETE /api/whatsapp-templates/:id - Deletar template (soft delete)
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.whatsAppMessageTemplate.update({
        where: { id },
        data: { isActive: false },
      });

      res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar template:', error);
      res.status(500).json({ error: 'Erro ao deletar template' });
    }
  }
}
