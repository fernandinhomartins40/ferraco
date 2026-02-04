/**
 * WhatsApp Only Leads Controller
 *
 * Controlador para gerenciar leads capturados no modo "whatsapp_only"
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { logger } from '../../utils/logger';
import { successResponse, badRequestResponse, paginatedResponse } from '../../utils/response';
import { prisma } from '../../config/database';
import ExcelJS from 'exceljs';

// ============================================================================
// Validation Schemas
// ============================================================================

const WhatsAppOnlyLeadsFiltersSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  source: z.string().optional(),
});

export type WhatsAppOnlyLeadsFiltersInput = z.infer<typeof WhatsAppOnlyLeadsFiltersSchema>;

// ============================================================================
// WhatsAppOnlyLeadsController
// ============================================================================

export class WhatsAppOnlyLeadsController {
  /**
   * GET /api/admin/whatsapp-only-leads
   * Listar leads capturados no modo whatsapp_only
   */
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      logger.info('📋 Listando leads WhatsApp Only');

      // Validar filtros
      const filters = WhatsAppOnlyLeadsFiltersSchema.parse(req.query);

      // Construir where clause
      const where: any = {
        // Filtrar apenas leads com metadata contendo mode: whatsapp_only
        metadata: {
          contains: 'whatsapp_only',
        },
      };

      // Filtro de busca (nome, telefone, email)
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { phone: { contains: filters.search } },
          { email: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      // Filtro de data
      if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) {
          where.createdAt.gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
          where.createdAt.lte = new Date(filters.dateTo);
        }
      }

      // Filtro de source
      if (filters.source) {
        where.source = { contains: filters.source };
      }

      // Calcular skip/take para paginação
      const skip = (filters.page - 1) * filters.limit;
      const take = filters.limit;

      // Buscar leads e total
      const [leads, total] = await Promise.all([
        prisma.lead.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            source: true,
            metadata: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.lead.count({ where }),
      ]);

      // Parsear metadata e extrair dados relevantes
      const leadsWithParsedMetadata = leads.map((lead) => {
        let parsedMetadata: any = {};
        try {
          parsedMetadata = JSON.parse(lead.metadata || '{}');
        } catch (error) {
          logger.error('Erro ao parsear metadata do lead', { leadId: lead.id, error });
        }

        return {
          id: lead.id,
          name: lead.name,
          email: lead.email || 'Não informado',
          phone: lead.phone,
          source: lead.source || 'Desconhecido',
          interest: parsedMetadata.interest || 'Não especificado',
          userAgent: parsedMetadata.userAgent || '',
          referer: parsedMetadata.referer || '',
          mode: parsedMetadata.mode || 'whatsapp_only',
          createdAt: lead.createdAt,
          updatedAt: lead.updatedAt,
        };
      });

      logger.info(`✅ ${total} leads WhatsApp Only encontrados`, {
        page: filters.page,
        limit: filters.limit,
        total,
      });

      paginatedResponse(res, leadsWithParsedMetadata, filters.page, filters.limit, total);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        logger.warn('❌ Validação falhou', { errors: error.errors });
        badRequestResponse(res, 'Filtros inválidos', error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        })));
        return;
      }

      logger.error('❌ Erro ao listar leads WhatsApp Only', { error: error.message });
      next(error);
    }
  };

  /**
   * GET /api/admin/whatsapp-only-leads/export
   * Exportar leads WhatsApp Only para Excel
   */
  exportToExcel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      logger.info('📊 Exportando leads WhatsApp Only para Excel', {
        query: req.query,
      });

      // Validar filtros (sem paginação) - usar safeParse para melhor tratamento de erro
      const parseResult = WhatsAppOnlyLeadsFiltersSchema.safeParse({
        ...req.query,
        page: 1,
        limit: 10000, // Exportar até 10k leads
      });

      if (!parseResult.success) {
        logger.error('❌ Erro de validação nos filtros', {
          errors: parseResult.error.errors,
        });
        res.status(400).json({
          success: false,
          message: 'Parâmetros de filtro inválidos',
          errors: parseResult.error.errors,
        });
        return;
      }

      const filters = parseResult.data;

      // Construir where clause (mesma lógica do list)
      const where: any = {
        metadata: {
          contains: 'whatsapp_only',
        },
      };

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { phone: { contains: filters.search } },
          { email: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
        if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
      }

      if (filters.source) {
        where.source = { contains: filters.source };
      }

      // Buscar todos os leads (sem paginação)
      const leads = await prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          source: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logger.info(`📊 Encontrados ${leads.length} leads para exportar`);

      // Se não houver leads, retornar erro amigável
      if (leads.length === 0) {
        logger.warn('⚠️  Nenhum lead WhatsApp Only encontrado para exportar');
        res.status(400).json({
          success: false,
          message: 'Nenhum lead encontrado para exportar. Certifique-se de que há leads capturados no modo WhatsApp Only.',
        });
        return;
      }

      // Criar workbook Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Leads WhatsApp Only');

      // Definir colunas
      worksheet.columns = [
        { header: 'ID', key: 'id', width: 30 },
        { header: 'Nome', key: 'name', width: 25 },
        { header: 'Telefone', key: 'phone', width: 20 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Produto de Interesse', key: 'interest', width: 30 },
        { header: 'Origem', key: 'source', width: 25 },
        { header: 'Data de Captura', key: 'createdAt', width: 20 },
        { header: 'User Agent', key: 'userAgent', width: 40 },
        { header: 'Referer', key: 'referer', width: 40 },
      ];

      // Estilizar header
      worksheet.getRow(1).font = { bold: true, size: 12 };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' }, // Cor primária (indigo)
      };
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

      // Adicionar dados
      leads.forEach((lead) => {
        let parsedMetadata: any = {};
        try {
          parsedMetadata = JSON.parse(lead.metadata || '{}');
        } catch (error) {
          logger.error('Erro ao parsear metadata do lead', { leadId: lead.id, error });
        }

        worksheet.addRow({
          id: lead.id,
          name: lead.name,
          phone: lead.phone,
          email: lead.email || 'Não informado',
          interest: parsedMetadata.interest || 'Não especificado',
          source: lead.source || 'Desconhecido',
          createdAt: lead.createdAt.toLocaleString('pt-BR'),
          userAgent: parsedMetadata.userAgent || '',
          referer: parsedMetadata.referer || '',
        });
      });

      // Aplicar bordas e formatação
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };

          // Zebrar linhas
          if (rowNumber > 1 && rowNumber % 2 === 0) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF3F4F6' },
            };
          }
        });
      });

      // Gerar buffer
      const buffer = await workbook.xlsx.writeBuffer();

      // Configurar headers da resposta
      const filename = `leads_whatsapp_only_${new Date().toISOString().split('T')[0]}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', Buffer.byteLength(buffer));

      logger.info(`✅ Excel gerado com sucesso`, {
        filename,
        totalLeads: leads.length,
        sizeBytes: Buffer.byteLength(buffer),
      });

      res.send(buffer);
    } catch (error: any) {
      logger.error('❌ Erro ao exportar leads para Excel', { error: error.message });
      next(error);
    }
  };

  /**
   * GET /api/admin/whatsapp-only-leads/stats
   * Estatísticas dos leads WhatsApp Only
   */
  getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      logger.info('📊 Buscando estatísticas de leads WhatsApp Only');

      const where = {
        metadata: {
          contains: 'whatsapp_only',
        },
      };

      // Calcular estatísticas
      const [total, today, thisWeek, thisMonth, bySource] = await Promise.all([
        // Total de leads
        prisma.lead.count({ where }),

        // Leads de hoje
        prisma.lead.count({
          where: {
            ...where,
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),

        // Leads desta semana
        prisma.lead.count({
          where: {
            ...where,
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),

        // Leads deste mês
        prisma.lead.count({
          where: {
            ...where,
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),

        // Por source
        prisma.lead.groupBy({
          by: ['source'],
          where,
          _count: true,
        }),
      ]);

      const stats = {
        total,
        today,
        thisWeek,
        thisMonth,
        bySource: Object.fromEntries(
          bySource.map((s) => [s.source || 'Desconhecido', s._count])
        ),
      };

      logger.info('✅ Estatísticas calculadas', stats);

      successResponse(res, stats);
    } catch (error: any) {
      logger.error('❌ Erro ao buscar estatísticas', { error: error.message });
      next(error);
    }
  };
}
