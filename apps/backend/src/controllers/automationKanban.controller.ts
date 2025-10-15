import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AutomationKanbanController {
  // GET /api/automation-kanban/columns - Listar todas as colunas de automação
  async getAllColumns(req: Request, res: Response) {
    try {
      const columns = await prisma.automationKanbanColumn.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
        include: {
          messageTemplate: true,
          _count: {
            select: { leads: true },
          },
        },
      });

      res.json(columns);
    } catch (error) {
      console.error('Erro ao buscar colunas de automação:', error);
      res.status(500).json({ error: 'Erro ao buscar colunas de automação' });
    }
  }

  // POST /api/automation-kanban/columns - Criar nova coluna
  async createColumn(req: Request, res: Response) {
    try {
      const {
        name,
        color,
        description,
        sendIntervalSeconds,
        scheduledDate,
        isRecurring,
        recurringDay,
        messageTemplateId,
        productIds,
      } = req.body;

      if (!name || !color) {
        return res.status(400).json({ error: 'Nome e cor são obrigatórios' });
      }

      // Buscar a maior ordem atual
      const lastColumn = await prisma.automationKanbanColumn.findFirst({
        orderBy: { order: 'desc' },
      });

      const newOrder = (lastColumn?.order || 0) + 1;

      const column = await prisma.automationKanbanColumn.create({
        data: {
          name,
          color,
          description,
          order: newOrder,
          sendIntervalSeconds: sendIntervalSeconds || 60,
          scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
          isRecurring: isRecurring || false,
          recurringDay,
          messageTemplateId,
          productIds: productIds ? JSON.stringify(productIds) : null,
        },
        include: {
          messageTemplate: true,
        },
      });

      res.status(201).json(column);
    } catch (error) {
      console.error('Erro ao criar coluna de automação:', error);
      res.status(500).json({ error: 'Erro ao criar coluna de automação' });
    }
  }

  // PUT /api/automation-kanban/columns/:id - Atualizar coluna
  async updateColumn(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        name,
        color,
        description,
        sendIntervalSeconds,
        scheduledDate,
        isRecurring,
        recurringDay,
        messageTemplateId,
        productIds,
      } = req.body;

      const column = await prisma.automationKanbanColumn.update({
        where: { id },
        data: {
          name,
          color,
          description,
          sendIntervalSeconds,
          scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
          isRecurring,
          recurringDay,
          messageTemplateId,
          productIds: productIds ? JSON.stringify(productIds) : null,
        },
        include: {
          messageTemplate: true,
        },
      });

      res.json(column);
    } catch (error) {
      console.error('Erro ao atualizar coluna de automação:', error);
      res.status(500).json({ error: 'Erro ao atualizar coluna de automação' });
    }
  }

  // DELETE /api/automation-kanban/columns/:id - Deletar coluna
  async deleteColumn(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Soft delete
      await prisma.automationKanbanColumn.update({
        where: { id },
        data: { isActive: false },
      });

      res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar coluna de automação:', error);
      res.status(500).json({ error: 'Erro ao deletar coluna de automação' });
    }
  }

  // PUT /api/automation-kanban/columns/reorder - Reordenar colunas
  async reorderColumns(req: Request, res: Response) {
    try {
      const { columnIds } = req.body;

      if (!Array.isArray(columnIds)) {
        return res.status(400).json({ error: 'columnIds deve ser um array' });
      }

      await prisma.$transaction(
        columnIds.map((id, index) =>
          prisma.automationKanbanColumn.update({
            where: { id },
            data: { order: index },
          })
        )
      );

      const updatedColumns = await prisma.automationKanbanColumn.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
        include: {
          messageTemplate: true,
        },
      });

      res.json(updatedColumns);
    } catch (error) {
      console.error('Erro ao reordenar colunas:', error);
      res.status(500).json({ error: 'Erro ao reordenar colunas' });
    }
  }

  // POST /api/automation-kanban/leads/:leadId/move - Mover lead para coluna
  async moveLeadToColumn(req: Request, res: Response) {
    try {
      const { leadId } = req.params;
      const { columnId } = req.body;

      if (!columnId) {
        return res.status(400).json({ error: 'columnId é obrigatório' });
      }

      // Verificar se lead já está em alguma coluna
      const existingPosition = await prisma.automationLeadPosition.findUnique({
        where: { leadId },
      });

      if (existingPosition) {
        // Atualizar posição
        const position = await prisma.automationLeadPosition.update({
          where: { leadId },
          data: {
            columnId,
            nextScheduledAt: null, // Reset schedule
          },
          include: {
            lead: true,
            column: {
              include: {
                messageTemplate: true,
              },
            },
          },
        });

        res.json(position);
      } else {
        // Criar nova posição
        const position = await prisma.automationLeadPosition.create({
          data: {
            leadId,
            columnId,
          },
          include: {
            lead: true,
            column: {
              include: {
                messageTemplate: true,
              },
            },
          },
        });

        res.status(201).json(position);
      }
    } catch (error) {
      console.error('Erro ao mover lead:', error);
      res.status(500).json({ error: 'Erro ao mover lead para coluna de automação' });
    }
  }

  // GET /api/automation-kanban/leads - Buscar todos os leads no kanban de automação
  async getLeadsInAutomation(req: Request, res: Response) {
    try {
      const positions = await prisma.automationLeadPosition.findMany({
        include: {
          lead: true,
          column: {
            include: {
              messageTemplate: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      res.json(positions);
    } catch (error) {
      console.error('Erro ao buscar leads em automação:', error);
      res.status(500).json({ error: 'Erro ao buscar leads em automação' });
    }
  }

  // DELETE /api/automation-kanban/leads/:leadId - Remover lead do kanban
  async removeLeadFromAutomation(req: Request, res: Response) {
    try {
      const { leadId } = req.params;

      await prisma.automationLeadPosition.delete({
        where: { leadId },
      });

      res.status(204).send();
    } catch (error) {
      console.error('Erro ao remover lead:', error);
      res.status(500).json({ error: 'Erro ao remover lead da automação' });
    }
  }

  // GET /api/automation-kanban/settings - Buscar configurações globais
  async getSettings(req: Request, res: Response) {
    try {
      let settings = await prisma.automationSettings.findFirst();

      if (!settings) {
        // Criar configurações padrão
        settings = await prisma.automationSettings.create({
          data: {},
        });
      }

      res.json(settings);
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      res.status(500).json({ error: 'Erro ao buscar configurações de automação' });
    }
  }

  // PUT /api/automation-kanban/settings - Atualizar configurações globais
  async updateSettings(req: Request, res: Response) {
    try {
      const {
        columnIntervalSeconds,
        maxMessagesPerHour,
        maxMessagesPerDay,
        sendOnlyBusinessHours,
        businessHourStart,
        businessHourEnd,
      } = req.body;

      let settings = await prisma.automationSettings.findFirst();

      if (!settings) {
        settings = await prisma.automationSettings.create({
          data: {
            columnIntervalSeconds,
            maxMessagesPerHour,
            maxMessagesPerDay,
            sendOnlyBusinessHours,
            businessHourStart,
            businessHourEnd,
          },
        });
      } else {
        settings = await prisma.automationSettings.update({
          where: { id: settings.id },
          data: {
            columnIntervalSeconds,
            maxMessagesPerHour,
            maxMessagesPerDay,
            sendOnlyBusinessHours,
            businessHourStart,
            businessHourEnd,
          },
        });
      }

      res.json(settings);
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      res.status(500).json({ error: 'Erro ao atualizar configurações de automação' });
    }
  }
}
