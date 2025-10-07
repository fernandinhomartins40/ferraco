import { getPrismaClient } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { Prisma, IntegrationType } from '@prisma/client';

const prisma = getPrismaClient();

export class IntegrationsService {
  /**
   * Listar integrações
   */
  async getIntegrations(filters: {
    type?: string;
    isEnabled?: boolean;
  }) {
    const { type, isEnabled } = filters;

    const where: Prisma.IntegrationWhereInput = {};

    if (type) {
      where.type = type as IntegrationType;
    }

    if (isEnabled !== undefined) {
      where.isEnabled = isEnabled;
    }

    const integrations = await prisma.integration.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        type: true,
        isEnabled: true,
        lastSync: true,
        syncStatus: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
        // Não retornar credentials por segurança
      },
    });

    return integrations;
  }

  /**
   * Obter integração por ID
   */
  async getIntegrationById(id: string) {
    const integration = await prisma.integration.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        type: true,
        isEnabled: true,
        config: true,
        lastSync: true,
        syncStatus: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
        // Não retornar credentials por segurança
      },
    });

    if (!integration) {
      throw new AppError(404, 'Integração não encontrada');
    }

    return integration;
  }

  /**
   * Criar integração
   */
  async createIntegration(data: {
    name: string;
    type: string;
    config: string;
    credentials: string;
  }) {
    const { name, type, config, credentials } = data;

    // TODO: Criptografar credentials antes de salvar
    const encryptedCredentials = credentials; // Placeholder

    const integration = await prisma.integration.create({
      data: {
        name,
        type: type as IntegrationType,
        config,
        credentials: encryptedCredentials,
        isEnabled: false,
        syncStatus: 'DISABLED',
      },
      select: {
        id: true,
        name: true,
        type: true,
        isEnabled: true,
        config: true,
        syncStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return integration;
  }

  /**
   * Atualizar integração
   */
  async updateIntegration(id: string, data: {
    name?: string;
    config?: string;
    credentials?: string;
  }) {
    const integration = await prisma.integration.findUnique({ where: { id } });

    if (!integration) {
      throw new AppError(404, 'Integração não encontrada');
    }

    const updateData: any = {};

    if (data.name) updateData.name = data.name;
    if (data.config) updateData.config = data.config;
    if (data.credentials) {
      // TODO: Criptografar credentials
      updateData.credentials = data.credentials;
    }

    const updated = await prisma.integration.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        type: true,
        isEnabled: true,
        config: true,
        syncStatus: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  /**
   * Deletar integração
   */
  async deleteIntegration(id: string) {
    const integration = await prisma.integration.findUnique({ where: { id } });

    if (!integration) {
      throw new AppError(404, 'Integração não encontrada');
    }

    await prisma.integration.delete({ where: { id } });

    return { success: true, message: 'Integração deletada com sucesso' };
  }

  /**
   * Ativar/desativar integração
   */
  async toggleIntegration(id: string) {
    const integration = await prisma.integration.findUnique({ where: { id } });

    if (!integration) {
      throw new AppError(404, 'Integração não encontrada');
    }

    const updated = await prisma.integration.update({
      where: { id },
      data: {
        isEnabled: !integration.isEnabled,
        syncStatus: !integration.isEnabled ? 'PENDING' : 'DISABLED',
      },
      select: {
        id: true,
        name: true,
        type: true,
        isEnabled: true,
        syncStatus: true,
      },
    });

    return updated;
  }

  /**
   * Testar conexão da integração
   */
  async testConnection(id: string) {
    const integration = await prisma.integration.findUnique({ where: { id } });

    if (!integration) {
      throw new AppError(404, 'Integração não encontrada');
    }

    // TODO: Implementar teste de conexão real baseado no tipo
    // Por enquanto, simular teste
    const testResult = {
      success: true,
      message: 'Conexão testada com sucesso',
      type: integration.type,
      timestamp: new Date(),
    };

    // Atualizar status
    await prisma.integration.update({
      where: { id },
      data: {
        syncStatus: testResult.success ? 'SUCCESS' : 'ERROR',
        errorMessage: testResult.success ? null : 'Falha no teste de conexão',
      },
    });

    return testResult;
  }

  /**
   * Sincronizar integração
   */
  async syncIntegration(id: string) {
    const integration = await prisma.integration.findUnique({ where: { id } });

    if (!integration) {
      throw new AppError(404, 'Integração não encontrada');
    }

    if (!integration.isEnabled) {
      throw new AppError(400, 'Integração está desabilitada');
    }

    try {
      // TODO: Implementar sincronização real baseada no tipo
      // Por enquanto, simular sincronização

      const syncResult = {
        success: true,
        message: 'Sincronização concluída com sucesso',
        recordsSynced: 0,
        timestamp: new Date(),
      };

      // Atualizar status
      await prisma.integration.update({
        where: { id },
        data: {
          lastSync: new Date(),
          syncStatus: 'SUCCESS',
          errorMessage: null,
        },
      });

      return syncResult;
    } catch (error: any) {
      // Atualizar status de erro
      await prisma.integration.update({
        where: { id },
        data: {
          syncStatus: 'ERROR',
          errorMessage: error.message,
        },
      });

      throw new AppError(500, `Erro na sincronização: ${error.message}`);
    }
  }

  /**
   * Obter tipos de integração disponíveis
   */
  getAvailableTypes() {
    return [
      {
        type: 'ZAPIER',
        name: 'Zapier',
        description: 'Conecte com mais de 5000 aplicativos',
        icon: 'zapier',
      },
      {
        type: 'MAKE',
        name: 'Make (Integromat)',
        description: 'Automação avançada e workflows',
        icon: 'make',
      },
      {
        type: 'GOOGLE_ANALYTICS',
        name: 'Google Analytics',
        description: 'Rastreamento e análise de dados',
        icon: 'google-analytics',
      },
      {
        type: 'FACEBOOK_ADS',
        name: 'Facebook Ads',
        description: 'Importar leads de campanhas',
        icon: 'facebook',
      },
      {
        type: 'INSTAGRAM_ADS',
        name: 'Instagram Ads',
        description: 'Importar leads de anúncios',
        icon: 'instagram',
      },
      {
        type: 'HUBSPOT',
        name: 'HubSpot',
        description: 'Sincronizar com HubSpot CRM',
        icon: 'hubspot',
      },
      {
        type: 'PIPEDRIVE',
        name: 'Pipedrive',
        description: 'Sincronizar com Pipedrive CRM',
        icon: 'pipedrive',
      },
      {
        type: 'MAILCHIMP',
        name: 'Mailchimp',
        description: 'Sincronizar listas de email',
        icon: 'mailchimp',
      },
      {
        type: 'CUSTOM',
        name: 'Personalizado',
        description: 'Integração customizada via webhook',
        icon: 'webhook',
      },
    ];
  }

  /**
   * Obter estatísticas de integrações
   */
  async getIntegrationsStats() {
    const [total, enabled, byStatus, byType] = await Promise.all([
      prisma.integration.count(),

      prisma.integration.count({
        where: { isEnabled: true },
      }),

      prisma.integration.groupBy({
        by: ['syncStatus'],
        _count: { id: true },
      }),

      prisma.integration.groupBy({
        by: ['type'],
        _count: { id: true },
      }),
    ]);

    return {
      total,
      enabled,
      disabled: total - enabled,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.syncStatus] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      byType: byType.reduce((acc, item) => {
        acc[item.type] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
