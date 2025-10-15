import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class KanbanColumnController {
  // GET /api/kanban-columns - Listar todas as colunas ativas
  async getAll(req: Request, res: Response) {
    try {
      const columns = await prisma.kanbanColumn.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      });

      res.json(columns);
    } catch (error) {
      console.error('Erro ao buscar colunas:', error);
      res.status(500).json({ error: 'Erro ao buscar colunas do kanban' });
    }
  }

  // POST /api/kanban-columns - Criar nova coluna
  async create(req: Request, res: Response) {
    try {
      const { name, color, status } = req.body;

      // Validações
      if (!name || !color || !status) {
        return res.status(400).json({ error: 'Nome, cor e status são obrigatórios' });
      }

      // Buscar a maior ordem atual para adicionar no final
      const lastColumn = await prisma.kanbanColumn.findFirst({
        orderBy: { order: 'desc' },
      });

      const newOrder = (lastColumn?.order || 0) + 1;

      const column = await prisma.kanbanColumn.create({
        data: {
          name,
          color,
          status,
          order: newOrder,
          isSystem: false,
        },
      });

      res.status(201).json(column);
    } catch (error) {
      console.error('Erro ao criar coluna:', error);
      res.status(500).json({ error: 'Erro ao criar coluna do kanban' });
    }
  }

  // PUT /api/kanban-columns/:id - Atualizar coluna
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, color, status } = req.body;

      // Verificar se a coluna existe
      const existingColumn = await prisma.kanbanColumn.findUnique({
        where: { id },
      });

      if (!existingColumn) {
        return res.status(404).json({ error: 'Coluna não encontrada' });
      }

      // Não permitir editar coluna do sistema (Lead Novo)
      if (existingColumn.isSystem) {
        return res.status(403).json({ error: 'Não é permitido editar a coluna do sistema' });
      }

      const column = await prisma.kanbanColumn.update({
        where: { id },
        data: {
          name,
          color,
          status,
        },
      });

      res.json(column);
    } catch (error) {
      console.error('Erro ao atualizar coluna:', error);
      res.status(500).json({ error: 'Erro ao atualizar coluna do kanban' });
    }
  }

  // DELETE /api/kanban-columns/:id - Deletar coluna (soft delete)
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Verificar se a coluna existe
      const existingColumn = await prisma.kanbanColumn.findUnique({
        where: { id },
      });

      if (!existingColumn) {
        return res.status(404).json({ error: 'Coluna não encontrada' });
      }

      // Não permitir deletar coluna do sistema (Lead Novo)
      if (existingColumn.isSystem) {
        return res.status(403).json({ error: 'Não é permitido deletar a coluna do sistema' });
      }

      // Soft delete (marcar como inativa)
      await prisma.kanbanColumn.update({
        where: { id },
        data: { isActive: false },
      });

      res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar coluna:', error);
      res.status(500).json({ error: 'Erro ao deletar coluna do kanban' });
    }
  }

  // PUT /api/kanban-columns/reorder - Reordenar colunas
  async reorder(req: Request, res: Response) {
    try {
      const { columnIds } = req.body; // Array de IDs na nova ordem

      if (!Array.isArray(columnIds)) {
        return res.status(400).json({ error: 'columnIds deve ser um array' });
      }

      // Atualizar ordem de cada coluna em uma transação
      await prisma.$transaction(
        columnIds.map((id, index) =>
          prisma.kanbanColumn.update({
            where: { id },
            data: { order: index },
          })
        )
      );

      const updatedColumns = await prisma.kanbanColumn.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      });

      res.json(updatedColumns);
    } catch (error) {
      console.error('Erro ao reordenar colunas:', error);
      res.status(500).json({ error: 'Erro ao reordenar colunas do kanban' });
    }
  }

  // GET /api/kanban-columns/stats - Obter estatísticas por coluna
  async getStats(req: Request, res: Response) {
    try {
      // Buscar todas as colunas ativas
      const columns = await prisma.kanbanColumn.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      });

      // Para cada coluna, contar quantos leads têm aquele status
      const statsPromises = columns.map(async (column) => {
        const count = await prisma.lead.count({
          where: {
            status: column.status,
          },
        });

        return {
          columnId: column.id,
          name: column.name,
          color: column.color,
          status: column.status,
          count,
        };
      });

      const stats = await Promise.all(statsPromises);

      res.json(stats);
    } catch (error) {
      console.error('Erro ao buscar estatísticas das colunas:', error);
      res.status(500).json({ error: 'Erro ao buscar estatísticas das colunas do kanban' });
    }
  }
}
