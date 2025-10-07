import { getPrismaClient } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { Prisma } from '@prisma/client';

const prisma = getPrismaClient();

export class CommunicationsService {
  /**
   * Listar comunicações com filtros
   */
  async getCommunications(filters: {
    leadId?: string;
    type?: string;
    direction?: string;
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      leadId,
      type,
      direction,
      status,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = filters;

    const where: Prisma.CommunicationWhereInput = {};

    if (leadId) {
      where.leadId = leadId;
    }

    if (type) {
      where.type = type;
    }

    if (direction) {
      where.direction = direction;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (startDate || endDate) {
      where.sentAt = {};
      if (startDate) {
        where.sentAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.sentAt.lte = new Date(endDate);
      }
    }

    const [communications, total] = await Promise.all([
      prisma.communication.findMany({
        where,
        include: {
          lead: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          sentBy: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
        orderBy: { sentAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.communication.count({ where }),
    ]);

    return {
      data: communications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obter comunicação por ID
   */
  async getCommunicationById(id: string) {
    const communication = await prisma.communication.findUnique({
      where: { id },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        sentBy: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (!communication) {
      throw new AppError(404, 'Comunicação não encontrada');
    }

    return communication;
  }

  /**
   * Criar nova comunicação
   */
  async createCommunication(data: {
    leadId: string;
    type: string;
    direction: string;
    subject?: string;
    content: string;
    sentById: string;
    metadata?: string;
  }) {
    const { leadId, type, direction, subject, content, sentById, metadata } = data;

    // Verificar se o lead existe
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      throw new AppError(404, 'Lead não encontrado');
    }

    const communication = await prisma.communication.create({
      data: {
        leadId,
        type,
        direction,
        subject,
        content,
        sentById,
        sentAt: new Date(),
        status: 'sent',
        metadata,
      },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        sentBy: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return communication;
  }

  /**
   * Atualizar comunicação
   */
  async updateCommunication(id: string, data: {
    subject?: string;
    content?: string;
    status?: string;
    metadata?: string;
  }) {
    const communication = await prisma.communication.findUnique({ where: { id } });

    if (!communication) {
      throw new AppError(404, 'Comunicação não encontrada');
    }

    const updated = await prisma.communication.update({
      where: { id },
      data,
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        sentBy: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Deletar comunicação
   */
  async deleteCommunication(id: string) {
    const communication = await prisma.communication.findUnique({ where: { id } });

    if (!communication) {
      throw new AppError(404, 'Comunicação não encontrada');
    }

    await prisma.communication.delete({ where: { id } });

    return { success: true, message: 'Comunicação deletada com sucesso' };
  }

  /**
   * Marcar comunicação como lida
   */
  async markAsRead(id: string) {
    const communication = await prisma.communication.findUnique({ where: { id } });

    if (!communication) {
      throw new AppError(404, 'Comunicação não encontrada');
    }

    const updated = await prisma.communication.update({
      where: { id },
      data: { status: 'read' },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        sentBy: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Obter estatísticas de comunicações
   */
  async getCommunicationStats(filters?: {
    startDate?: string;
    endDate?: string;
    leadId?: string;
  }) {
    const where: Prisma.CommunicationWhereInput = {};

    if (filters?.startDate || filters?.endDate) {
      where.sentAt = {};
      if (filters.startDate) {
        where.sentAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.sentAt.lte = new Date(filters.endDate);
      }
    }

    if (filters?.leadId) {
      where.leadId = filters.leadId;
    }

    const [
      total,
      byType,
      byDirection,
      byStatus,
      recentCommunications,
    ] = await Promise.all([
      prisma.communication.count({ where }),

      prisma.communication.groupBy({
        by: ['type'],
        where,
        _count: { id: true },
      }),

      prisma.communication.groupBy({
        by: ['direction'],
        where,
        _count: { id: true },
      }),

      prisma.communication.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),

      prisma.communication.findMany({
        where,
        include: {
          lead: {
            select: {
              id: true,
              name: true,
            },
          },
          sentBy: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: { sentAt: 'desc' },
        take: 10,
      }),
    ]);

    return {
      total,
      byType: byType.reduce((acc, item) => {
        acc[item.type] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      byDirection: byDirection.reduce((acc, item) => {
        acc[item.direction] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      recentCommunications,
    };
  }

  /**
   * Enviar email (integração futura)
   */
  async sendEmail(data: {
    leadId: string;
    subject: string;
    content: string;
    sentById: string;
  }) {
    const { leadId, subject, content, sentById } = data;

    // Verificar se o lead existe e tem email
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      throw new AppError(404, 'Lead não encontrado');
    }
    if (!lead.email) {
      throw new AppError(400, 'Lead não possui email cadastrado');
    }

    // TODO: Implementar integração com serviço de email (SendGrid, AWS SES, etc.)
    // Por enquanto, apenas registra a comunicação

    const communication = await this.createCommunication({
      leadId,
      type: 'email',
      direction: 'outbound',
      subject,
      content,
      sentById,
      metadata: JSON.stringify({ to: lead.email }),
    });

    return communication;
  }

  /**
   * Enviar WhatsApp (integração futura)
   */
  async sendWhatsApp(data: {
    leadId: string;
    content: string;
    sentById: string;
  }) {
    const { leadId, content, sentById } = data;

    // Verificar se o lead existe e tem telefone
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      throw new AppError(404, 'Lead não encontrado');
    }
    if (!lead.phone) {
      throw new AppError(400, 'Lead não possui telefone cadastrado');
    }

    // TODO: Implementar integração com WhatsApp Business API
    // Por enquanto, apenas registra a comunicação

    const communication = await this.createCommunication({
      leadId,
      type: 'whatsapp',
      direction: 'outbound',
      content,
      sentById,
      metadata: JSON.stringify({ to: lead.phone }),
    });

    return communication;
  }
}
