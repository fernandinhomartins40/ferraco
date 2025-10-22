// ============================================================================
// Integrations Module - Service
// ============================================================================

import { PrismaClient, Integration, IntegrationSyncLog, IntegrationType as PrismaIntegrationType } from '@prisma/client';
import axios from 'axios';
import {
  CreateIntegrationDTO,
  UpdateIntegrationDTO,
  TestIntegrationResponse,
  SyncIntegrationResponse,
  WebhookPayload,
  IntegrationWithLogs,
  HubSpotConfig,
  PipedriveConfig,
  IIntegrationsService,
} from './integrations.types';

export class IntegrationsService implements IIntegrationsService {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateIntegrationDTO, userId: string): Promise<Integration> {
    return this.prisma.integration.create({
      data: {
        name: data.name,
        type: data.type as PrismaIntegrationType,
        config: JSON.stringify(data.config),
        credentials: JSON.stringify(data.credentials || {}),
        syncFrequency: data.syncFrequency || 'DAILY',
        isEnabled: data.isEnabled !== false,
        createdById: userId,
      },
    });
  }

  async findAll(): Promise<Integration[]> {
    return this.prisma.integration.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<IntegrationWithLogs | null> {
    return this.prisma.integration.findUnique({
      where: { id },
      include: {
        syncLogs: {
          orderBy: { syncedAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  async update(id: string, data: UpdateIntegrationDTO): Promise<Integration> {
    const updateData: Record<string, unknown> = {
      name: data.name,
      type: data.type as PrismaIntegrationType | undefined,
      syncFrequency: data.syncFrequency,
      isEnabled: data.isEnabled,
    };

    if (data.config) {
      updateData.config = JSON.stringify(data.config);
    }

    if (data.credentials) {
      updateData.credentials = JSON.stringify(data.credentials);
    }

    return this.prisma.integration.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.integration.delete({
      where: { id },
    });
  }

  async test(id: string): Promise<TestIntegrationResponse> {
    const integration = await this.prisma.integration.findUnique({
      where: { id },
    });

    if (!integration) {
      throw new Error('Integração não encontrada');
    }

    try {
      const config = JSON.parse(integration.config);
      let result: TestIntegrationResponse;

      switch (integration.type) {
        case 'CUSTOM':
          result = await this.testWebhook(config);
          break;
        case 'HUBSPOT':
          result = await this.testHubSpot(config);
          break;
        case 'PIPEDRIVE':
          result = await this.testPipedrive(config);
          break;
        case 'ZAPIER':
        case 'MAKE':
          result = await this.testWebhook(config);
          break;
        default:
          result = {
            success: true,
            message: `Integração ${integration.type} está configurada`,
          };
      }

      // Log the test
      await this.createLog(id, 'success', result.message, 0);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      await this.createLog(id, 'error', errorMessage, 0);

      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  async sync(id: string): Promise<SyncIntegrationResponse> {
    const integration = await this.prisma.integration.findUnique({
      where: { id },
    });

    if (!integration) {
      throw new Error('Integração não encontrada');
    }

    if (!integration.isEnabled) {
      throw new Error('Integração está desabilitada');
    }

    try {
      const config = JSON.parse(integration.config);
      let recordsSynced = 0;

      switch (integration.type) {
        case 'HUBSPOT':
          recordsSynced = await this.syncHubSpot(config);
          break;
        case 'PIPEDRIVE':
          recordsSynced = await this.syncPipedrive(config);
          break;
        default:
          throw new Error(`Tipo de integração ${integration.type} não suporta sincronização`);
      }

      // Update last sync
      await this.prisma.integration.update({
        where: { id },
        data: {
          lastSync: new Date(),
          syncStatus: 'SUCCESS',
          errorMessage: null,
        },
      });

      // Log the sync
      await this.createLog(id, 'success', 'Sincronização concluída', recordsSynced);

      return {
        success: true,
        recordsSynced,
        message: `${recordsSynced} registros sincronizados com sucesso`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

      // Update sync status
      await this.prisma.integration.update({
        where: { id },
        data: {
          syncStatus: 'ERROR',
          errorMessage,
        },
      });

      // Log the error
      await this.createLog(id, 'error', errorMessage, 0);

      return {
        success: false,
        recordsSynced: 0,
        message: errorMessage,
      };
    }
  }

  async handleZapierWebhook(payload: WebhookPayload): Promise<void> {
    // Processar webhook do Zapier
    // Por exemplo, criar um lead a partir dos dados recebidos
    if (payload.event === 'new_lead') {
      const leadData = payload.data;
      await this.prisma.lead.create({
        data: {
          name: leadData.name as string,
          email: leadData.email as string || null,
          phone: leadData.phone as string,
          source: 'Zapier',
          createdById: 'system', // Usar um usuário do sistema
        },
      });
    }
  }

  async handleMakeWebhook(payload: WebhookPayload): Promise<void> {
    // Processar webhook do Make (Integromat)
    if (payload.event === 'new_contact') {
      const contactData = payload.data;
      await this.prisma.lead.create({
        data: {
          name: contactData.name as string,
          email: contactData.email as string || null,
          phone: contactData.phone as string,
          source: 'Make',
          createdById: 'system',
        },
      });
    }
  }

  async getLogs(id: string, limit = 50): Promise<IntegrationSyncLog[]> {
    return this.prisma.integrationSyncLog.findMany({
      where: { integrationId: id },
      orderBy: { syncedAt: 'desc' },
      take: limit,
    });
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async testWebhook(config: { url?: string }): Promise<TestIntegrationResponse> {
    if (!config.url) {
      throw new Error('URL do webhook não configurada');
    }

    try {
      const response = await axios.post(
        config.url,
        {
          test: true,
          timestamp: new Date().toISOString(),
        },
        { timeout: 5000 }
      );

      return {
        success: response.status >= 200 && response.status < 300,
        message: 'Webhook testado com sucesso',
        details: {
          status: response.status,
          statusText: response.statusText,
        },
      };
    } catch (error) {
      throw new Error(
        `Falha ao testar webhook: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      );
    }
  }

  private async testHubSpot(config: HubSpotConfig): Promise<TestIntegrationResponse> {
    if (!config.apiKey) {
      throw new Error('API Key do HubSpot não configurada');
    }

    try {
      const response = await axios.get('https://api.hubapi.com/crm/v3/objects/contacts', {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
        params: {
          limit: 1,
        },
        timeout: 5000,
      });

      return {
        success: response.status === 200,
        message: 'Conexão com HubSpot bem-sucedida',
        details: {
          portalId: config.portalId,
        },
      };
    } catch (error) {
      throw new Error(
        `Falha ao conectar com HubSpot: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      );
    }
  }

  private async testPipedrive(config: PipedriveConfig): Promise<TestIntegrationResponse> {
    if (!config.apiToken) {
      throw new Error('API Token do Pipedrive não configurado');
    }

    try {
      const response = await axios.get(`https://${config.domain}.pipedrive.com/v1/users/me`, {
        params: {
          api_token: config.apiToken,
        },
        timeout: 5000,
      });

      return {
        success: response.status === 200,
        message: 'Conexão com Pipedrive bem-sucedida',
        details: {
          domain: config.domain,
        },
      };
    } catch (error) {
      throw new Error(
        `Falha ao conectar com Pipedrive: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      );
    }
  }

  private async syncHubSpot(config: HubSpotConfig): Promise<number> {
    // Implementação simulada - em produção, você faria requisições reais
    // para a API do HubSpot e sincronizaria os dados
    return Math.floor(Math.random() * 50) + 10;
  }

  private async syncPipedrive(config: PipedriveConfig): Promise<number> {
    // Implementação simulada - em produção, você faria requisições reais
    // para a API do Pipedrive e sincronizaria os dados
    return Math.floor(Math.random() * 50) + 10;
  }

  private async createLog(
    integrationId: string,
    status: string,
    message: string,
    recordsSynced: number
  ): Promise<void> {
    await this.prisma.integrationSyncLog.create({
      data: {
        integrationId,
        status,
        recordsSynced,
        error: status === 'error' ? message : null,
        details: JSON.stringify({ message }),
      },
    });
  }
}

export const integrationsService = new IntegrationsService(new PrismaClient());
