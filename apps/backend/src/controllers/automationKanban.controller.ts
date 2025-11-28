import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { automationSchedulerService } from '../services/automationScheduler.service';

const prisma = new PrismaClient();

export class AutomationKanbanController {
  // GET /api/automation-kanban/columns - Listar todas as colunas de automação
  async getAllColumns(req: Request, res: Response) {
    try {
      const columns = await prisma.automationKanbanColumn.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
        include: {
          messageTemplate: true, // DEPRECATED - manter compatibilidade
          templateLibrary: true, // ✅ ADICIONAR - Sistema novo
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
        messageTemplateId, // DEPRECATED - manter para compatibilidade
        templateLibraryId, // ✅ ADICIONAR - Sistema novo
        productIds,
        // ✅ Sistema de Recorrência Avançado
        recurrenceType,
        weekDays,
        monthDay,
        customDates,
        daysFromNow,
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
          // Sistema de Recorrência
          recurrenceType: recurrenceType || 'NONE', // ✅ ADICIONAR
          weekDays, // ✅ ADICIONAR
          monthDay, // ✅ ADICIONAR
          customDates, // ✅ ADICIONAR
          daysFromNow, // ✅ ADICIONAR
          // Campos antigos (backward compatibility)
          isRecurring: isRecurring || false,
          recurringDay,
          messageTemplateId, // DEPRECATED
          templateLibraryId, // ✅ ADICIONAR - Sistema novo
          productIds: productIds ? JSON.stringify(productIds) : null,
        },
        include: {
          messageTemplate: true, // DEPRECATED - manter compatibilidade
          templateLibrary: true, // ✅ ADICIONAR - Sistema novo
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
        messageTemplateId, // DEPRECATED - manter para compatibilidade
        templateLibraryId, // ✅ ADICIONAR - Sistema novo
        productIds,
        // ✅ Sistema de Recorrência Avançado
        recurrenceType,
        weekDays,
        monthDay,
        customDates,
        daysFromNow,
      } = req.body;

      const column = await prisma.automationKanbanColumn.update({
        where: { id },
        data: {
          name,
          color,
          description,
          sendIntervalSeconds,
          scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
          // Sistema de Recorrência
          recurrenceType, // ✅ ADICIONAR
          weekDays, // ✅ ADICIONAR
          monthDay, // ✅ ADICIONAR
          customDates, // ✅ ADICIONAR
          daysFromNow, // ✅ ADICIONAR
          // Campos antigos (backward compatibility)
          isRecurring,
          recurringDay,
          messageTemplateId, // DEPRECATED
          templateLibraryId, // ✅ ADICIONAR - Sistema novo
          productIds: productIds ? JSON.stringify(productIds) : null,
        },
        include: {
          messageTemplate: true, // DEPRECATED - manter compatibilidade
          templateLibrary: true, // ✅ ADICIONAR - Sistema novo
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
          messageTemplate: true, // DEPRECATED
          templateLibrary: true, // ✅ ADICIONAR
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
                messageTemplate: true, // DEPRECATED
                templateLibrary: true, // ✅ ADICIONAR
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
                messageTemplate: true, // DEPRECATED
                templateLibrary: true, // ✅ ADICIONAR
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
              messageTemplate: true, // DEPRECATED
              templateLibrary: true, // ✅ ADICIONAR
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
        blockWeekends,
        timezone,
      } = req.body;

      let settings = await prisma.automationSettings.findFirst();

      // Preparar dados, removendo undefined
      const dataToUpdate: any = {};
      if (columnIntervalSeconds !== undefined) dataToUpdate.columnIntervalSeconds = columnIntervalSeconds;
      if (maxMessagesPerHour !== undefined) dataToUpdate.maxMessagesPerHour = maxMessagesPerHour;
      if (maxMessagesPerDay !== undefined) dataToUpdate.maxMessagesPerDay = maxMessagesPerDay;
      if (sendOnlyBusinessHours !== undefined) dataToUpdate.sendOnlyBusinessHours = sendOnlyBusinessHours;
      if (businessHourStart !== undefined) dataToUpdate.businessHourStart = businessHourStart;
      if (businessHourEnd !== undefined) dataToUpdate.businessHourEnd = businessHourEnd;
      if (blockWeekends !== undefined) dataToUpdate.blockWeekends = blockWeekends;
      if (timezone !== undefined) dataToUpdate.timezone = timezone;

      if (!settings) {
        settings = await prisma.automationSettings.create({
          data: dataToUpdate,
        });
      } else {
        settings = await prisma.automationSettings.update({
          where: { id: settings.id },
          data: dataToUpdate,
        });
      }

      console.log(`[AutomationKanban] Configurações atualizadas:`, settings);
      res.json(settings);
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      res.status(500).json({ error: 'Erro ao atualizar configurações de automação' });
    }
  }

  // POST /api/automation-kanban/leads/:leadId/retry - Reiniciar envio para um lead específico
  async retryLead(req: Request, res: Response) {
    try {
      const { leadId } = req.params;
      const { bypassBusinessHours, isManualRetry } = req.body;

      console.log(
        `[AutomationKanban] Retry solicitado para lead: ${leadId} ` +
        `(bypass horário: ${bypassBusinessHours}, manual: ${isManualRetry})`
      );

      // Verificar se lead existe na automação
      const position = await prisma.automationLeadPosition.findUnique({
        where: { leadId },
        include: { lead: true },
      });

      if (!position) {
        console.error(`[AutomationKanban] Lead ${leadId} não encontrado na automação`);
        return res.status(404).json({
          success: false,
          error: 'Lead não encontrado na automação'
        });
      }

      // Verificar se o status permite retry (incluindo RATE_LIMITED)
      if (!['FAILED', 'WHATSAPP_DISCONNECTED', 'SCHEDULED', 'RATE_LIMITED'].includes(position.status)) {
        console.warn(`[AutomationKanban] Lead ${leadId} tem status ${position.status}, não é elegível para retry`);
        return res.status(400).json({
          success: false,
          error: `Lead com status "${position.status}" não pode ser reenviado. Apenas leads com falha podem ser reenviados.`
        });
      }

      await automationSchedulerService.retryLead(leadId, {
        bypassBusinessHours: bypassBusinessHours === true,
        isManualRetry: isManualRetry !== false, // Default true
      });

      console.log(`[AutomationKanban] Retry agendado com sucesso para lead ${position.lead.name}`);
      res.json({ success: true, message: 'Envio reagendado com sucesso' });
    } catch (error) {
      console.error('Erro ao reiniciar envio do lead:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao reiniciar envio do lead'
      });
    }
  }

  // POST /api/automation-kanban/columns/:columnId/retry - Reiniciar envio para todos os leads com falha de uma coluna
  async retryColumn(req: Request, res: Response) {
    try {
      const { columnId } = req.params;

      await automationSchedulerService.retryColumn(columnId);

      res.json({ success: true, message: 'Retry solicitado para a coluna com sucesso' });
    } catch (error) {
      console.error('Erro ao reiniciar envio da coluna:', error);
      res.status(500).json({ error: 'Erro ao reiniciar envio da coluna' });
    }
  }

  // POST /api/automation-kanban/retry-all-failed - Reiniciar envio para todos os leads com falha (todas as colunas)
  async retryAllFailed(req: Request, res: Response) {
    try {
      await automationSchedulerService.retryAllFailed();

      res.json({ success: true, message: 'Retry solicitado para todos os leads com falha' });
    } catch (error) {
      console.error('Erro ao reiniciar envio de todos os leads:', error);
      res.status(500).json({ error: 'Erro ao reiniciar envio de todos os leads' });
    }
  }
}
