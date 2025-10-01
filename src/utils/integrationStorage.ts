import {
  Integration,
  IntegrationConfig,
  IntegrationCredentials,
  DataMapping,
  IntegrationFilter,
  IntegrationAction,
  GoogleAnalyticsConfig,
  GAEvent,
  GAGoal,
  FacebookAdsConfig,
  FBCampaign,
  FBLeadForm,
  Lead
} from '@/types/lead';
import { logger } from '@/lib/logger';

export class IntegrationStorage {
  private readonly STORAGE_KEYS = {
    INTEGRATIONS: 'ferraco_integrations',
    SYNC_LOGS: 'ferraco_sync_logs',
    WEBHOOKS: 'ferraco_webhooks',
    API_CACHE: 'ferraco_api_cache'
  };

  // 🔌 Core Integration Management
  getIntegrations(): Integration[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.INTEGRATIONS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      logger.error('Erro ao carregar integrações:', error);
      return [];
    }
  }

  createIntegration(
    name: string,
    type: Integration['type'],
    config: Partial<IntegrationConfig>,
    credentials: Partial<IntegrationCredentials>
  ): Integration {
    try {
      const integration: Integration = {
        id: `int_${Date.now()}`,
        name,
        type,
        isEnabled: false,
        config: {
          syncFrequency: 'daily',
          dataMapping: [],
          filters: [],
          actions: [],
          ...config
        },
        credentials: {
          ...credentials
        },
        syncStatus: 'disabled',
        createdAt: new Date().toISOString(),
        createdBy: 'current_user'
      };

      const integrations = this.getIntegrations();
      integrations.push(integration);
      this.saveIntegrations(integrations);

      return integration;
    } catch (error) {
      logger.error('Erro ao criar integração:', error);
      throw error;
    }
  }

  updateIntegration(integrationId: string, updates: Partial<Integration>): boolean {
    try {
      const integrations = this.getIntegrations();
      const index = integrations.findIndex(i => i.id === integrationId);

      if (index === -1) return false;

      integrations[index] = { ...integrations[index], ...updates };
      this.saveIntegrations(integrations);
      return true;
    } catch (error) {
      logger.error('Erro ao atualizar integração:', error);
      return false;
    }
  }

  enableIntegration(integrationId: string): boolean {
    try {
      const integration = this.getIntegrations().find(i => i.id === integrationId);
      if (!integration) return false;

      // Validate credentials before enabling
      const isValid = this.validateCredentials(integration);
      if (!isValid) {
        this.updateIntegration(integrationId, {
          syncStatus: 'error',
          errorMessage: 'Credenciais inválidas'
        });
        return false;
      }

      this.updateIntegration(integrationId, {
        isEnabled: true,
        syncStatus: 'success',
        lastSync: new Date().toISOString(),
        errorMessage: undefined
      });

      return true;
    } catch (error) {
      logger.error('Erro ao ativar integração:', error);
      return false;
    }
  }

  disableIntegration(integrationId: string): boolean {
    return this.updateIntegration(integrationId, {
      isEnabled: false,
      syncStatus: 'disabled'
    });
  }

  deleteIntegration(integrationId: string): boolean {
    try {
      const integrations = this.getIntegrations();
      const filtered = integrations.filter(i => i.id !== integrationId);
      this.saveIntegrations(filtered);
      return true;
    } catch (error) {
      logger.error('Erro ao deletar integração:', error);
      return false;
    }
  }

  // 🔄 Synchronization
  async syncIntegration(integrationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const integration = this.getIntegrations().find(i => i.id === integrationId);
      if (!integration || !integration.isEnabled) {
        return { success: false, error: 'Integração não encontrada ou desabilitada' };
      }

      this.updateIntegration(integrationId, { syncStatus: 'pending' });

      // Simulate API call based on integration type
      const result = await this.performSync(integration);

      this.updateIntegration(integrationId, {
        syncStatus: result.success ? 'success' : 'error',
        lastSync: new Date().toISOString(),
        errorMessage: result.error
      });

      this.logSyncOperation(integrationId, result);

      return result;
    } catch (error) {
      logger.error('Erro na sincronização:', error);
      return { success: false, error: 'Erro interno na sincronização' };
    }
  }

  async syncAllIntegrations(): Promise<{ processed: number; successful: number; errors: string[] }> {
    const integrations = this.getIntegrations().filter(i => i.isEnabled);
    const errors: string[] = [];
    let successful = 0;

    for (const integration of integrations) {
      try {
        const result = await this.syncIntegration(integration.id);
        if (result.success) {
          successful++;
        } else {
          errors.push(`${integration.name}: ${result.error}`);
        }
      } catch (error) {
        errors.push(`${integration.name}: Erro inesperado`);
      }
    }

    return {
      processed: integrations.length,
      successful,
      errors
    };
  }

  private async performSync(integration: Integration): Promise<{ success: boolean; error?: string }> {
    // Simulate different sync behaviors based on integration type
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay

    switch (integration.type) {
      case 'zapier':
        return this.syncZapier(integration);
      case 'make':
        return this.syncMake(integration);
      case 'google_analytics':
        return this.syncGoogleAnalytics(integration);
      case 'facebook_ads':
        return this.syncFacebookAds(integration);
      case 'hubspot':
        return this.syncHubSpot(integration);
      case 'pipedrive':
        return this.syncPipedrive(integration);
      case 'mailchimp':
        return this.syncMailchimp(integration);
      default:
        return this.syncCustom(integration);
    }
  }

  // 🔗 Zapier Integration
  private async syncZapier(integration: Integration): Promise<{ success: boolean; error?: string }> {
    try {
      // Simulate Zapier webhook trigger
      const webhookUrl = integration.config.webhookUrl;
      if (!webhookUrl) {
        return { success: false, error: 'URL do webhook não configurada' };
      }

      // In a real implementation, this would send data to Zapier
      logger.debug('Enviando dados para Zapier:', webhookUrl);

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erro na integração com Zapier' };
    }
  }

  // 🛠️ Make (Integromat) Integration
  private async syncMake(integration: Integration): Promise<{ success: boolean; error?: string }> {
    try {
      const webhookUrl = integration.config.webhookUrl;
      if (!webhookUrl) {
        return { success: false, error: 'URL do webhook não configurada' };
      }

      logger.debug('Enviando dados para Make:', webhookUrl);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erro na integração com Make' };
    }
  }

  // 📊 Google Analytics Integration
  private async syncGoogleAnalytics(integration: Integration): Promise<{ success: boolean; error?: string }> {
    try {
      const config = integration.credentials;
      if (!config.apiKey) {
        return { success: false, error: 'API Key do Google Analytics não configurada' };
      }

      // Simulate sending events to GA
      logger.debug('Sincronizando com Google Analytics');

      // In a real implementation, this would:
      // 1. Send lead events to GA4
      // 2. Track conversion goals
      // 3. Update custom dimensions

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erro na integração com Google Analytics' };
    }
  }

  // 📱 Facebook Ads Integration
  private async syncFacebookAds(integration: Integration): Promise<{ success: boolean; error?: string }> {
    try {
      const credentials = integration.credentials;
      if (!credentials.accessToken) {
        return { success: false, error: 'Access Token do Facebook não configurado' };
      }

      logger.debug('Sincronizando com Facebook Ads');

      // In a real implementation, this would:
      // 1. Send conversion events to Facebook
      // 2. Update custom audiences
      // 3. Sync lead data from Lead Ads

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erro na integração com Facebook Ads' };
    }
  }

  // 🎯 HubSpot Integration
  private async syncHubSpot(integration: Integration): Promise<{ success: boolean; error?: string }> {
    try {
      const credentials = integration.credentials;
      if (!credentials.apiKey) {
        return { success: false, error: 'API Key do HubSpot não configurada' };
      }

      logger.debug('Sincronizando com HubSpot');

      // In a real implementation, this would:
      // 1. Sync leads to HubSpot contacts
      // 2. Create deals for opportunities
      // 3. Sync interaction history

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erro na integração com HubSpot' };
    }
  }

  // 🎪 Pipedrive Integration
  private async syncPipedrive(integration: Integration): Promise<{ success: boolean; error?: string }> {
    try {
      const credentials = integration.credentials;
      if (!credentials.apiKey) {
        return { success: false, error: 'API Key do Pipedrive não configurada' };
      }

      logger.debug('Sincronizando com Pipedrive');

      // In a real implementation, this would:
      // 1. Sync leads to Pipedrive persons
      // 2. Create deals in pipeline
      // 3. Sync activities and notes

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erro na integração com Pipedrive' };
    }
  }

  // 📧 Mailchimp Integration
  private async syncMailchimp(integration: Integration): Promise<{ success: boolean; error?: string }> {
    try {
      const credentials = integration.credentials;
      if (!credentials.apiKey) {
        return { success: false, error: 'API Key do Mailchimp não configurada' };
      }

      logger.debug('Sincronizando com Mailchimp');

      // In a real implementation, this would:
      // 1. Add leads to mailing lists
      // 2. Trigger automated campaigns
      // 3. Update subscriber preferences

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erro na integração com Mailchimp' };
    }
  }

  // 🔧 Custom Integration
  private async syncCustom(integration: Integration): Promise<{ success: boolean; error?: string }> {
    try {
      const webhookUrl = integration.config.webhookUrl;
      if (!webhookUrl) {
        return { success: false, error: 'URL do webhook não configurada' };
      }

      logger.debug('Sincronizando integração customizada:', webhookUrl);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erro na integração customizada' };
    }
  }

  // 📤 Webhook Management
  sendWebhook(url: string, data: any, headers?: Record<string, string>): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      // Simulate webhook sending
      setTimeout(() => {
        logger.debug('Enviando webhook:', { url, data, headers });

        // Simulate random success/failure
        const success = Math.random() > 0.1; // 90% success rate
        resolve({
          success,
          error: success ? undefined : 'Erro no envio do webhook'
        });
      }, 500);
    });
  }

  async triggerWebhooks(event: string, data: any): Promise<void> {
    const integrations = this.getIntegrations().filter(i =>
      i.isEnabled &&
      i.config.actions.some(action => action.trigger === event)
    );

    for (const integration of integrations) {
      try {
        if (integration.config.webhookUrl) {
          await this.sendWebhook(integration.config.webhookUrl, {
            event,
            data,
            timestamp: new Date().toISOString(),
            source: 'ferraco_crm'
          });
        }
      } catch (error) {
        logger.error(`Erro ao enviar webhook para ${integration.name}:`, error);
      }
    }
  }

  // 🔑 Credential Validation
  private validateCredentials(integration: Integration): boolean {
    const credentials = integration.credentials;

    switch (integration.type) {
      case 'zapier':
      case 'make':
      case 'custom':
        return !!integration.config.webhookUrl;

      case 'google_analytics':
        return !!(credentials.apiKey && credentials.customFields?.trackingId);

      case 'facebook_ads':
        return !!(credentials.accessToken && credentials.customFields?.accountId);

      case 'hubspot':
      case 'pipedrive':
      case 'mailchimp':
        return !!credentials.apiKey;

      default:
        return false;
    }
  }

  // 📊 Data Transformation
  transformLeadData(lead: Lead, mapping: DataMapping[]): Record<string, any> {
    const transformed: Record<string, any> = {};

    mapping.forEach(map => {
      let value = this.getLeadValue(lead, map.localField);

      // Apply transformation if specified
      if (map.transformation && value !== undefined) {
        value = this.applyTransformation(value, map.transformation);
      }

      if (value !== undefined || map.isRequired) {
        transformed[map.externalField] = value;
      }
    });

    return transformed;
  }

  private getLeadValue(lead: Lead, field: string): any {
    const fieldMap: Record<string, any> = {
      'name': lead.name,
      'phone': lead.phone,
      'status': lead.status,
      'priority': lead.priority,
      'source': lead.source,
      'createdAt': lead.createdAt,
      'updatedAt': lead.updatedAt,
      'assignedTo': lead.assignedTo,
      'tags': lead.tags,
      'notesCount': lead.notes?.length || 0,
      'communicationsCount': lead.communications?.length || 0
    };

    return fieldMap[field];
  }

  private applyTransformation(value: any, transformation: string): any {
    switch (transformation) {
      case 'uppercase':
        return typeof value === 'string' ? value.toUpperCase() : value;
      case 'lowercase':
        return typeof value === 'string' ? value.toLowerCase() : value;
      case 'date_iso':
        return new Date(value).toISOString();
      case 'boolean':
        return Boolean(value);
      case 'number':
        return Number(value);
      default:
        return value;
    }
  }

  // 📋 Predefined Integrations
  getAvailableIntegrations(): Array<{
    type: Integration['type'];
    name: string;
    description: string;
    category: string;
    icon: string;
    requiredFields: string[];
  }> {
    return [
      {
        type: 'zapier',
        name: 'Zapier',
        description: 'Conecte com mais de 5.000 aplicativos',
        category: 'Automação',
        icon: '⚡',
        requiredFields: ['webhookUrl']
      },
      {
        type: 'make',
        name: 'Make (Integromat)',
        description: 'Automação visual avançada',
        category: 'Automação',
        icon: '🔧',
        requiredFields: ['webhookUrl']
      },
      {
        type: 'google_analytics',
        name: 'Google Analytics',
        description: 'Rastreamento e análise de conversões',
        category: 'Analytics',
        icon: '📊',
        requiredFields: ['apiKey', 'trackingId']
      },
      {
        type: 'facebook_ads',
        name: 'Facebook Ads',
        description: 'Sincronização com campanhas do Facebook',
        category: 'Publicidade',
        icon: '📱',
        requiredFields: ['accessToken', 'accountId']
      },
      {
        type: 'instagram_ads',
        name: 'Instagram Ads',
        description: 'Gestão de leads do Instagram',
        category: 'Publicidade',
        icon: '📸',
        requiredFields: ['accessToken', 'accountId']
      },
      {
        type: 'hubspot',
        name: 'HubSpot',
        description: 'CRM e marketing automation',
        category: 'CRM',
        icon: '🎯',
        requiredFields: ['apiKey']
      },
      {
        type: 'pipedrive',
        name: 'Pipedrive',
        description: 'CRM focado em vendas',
        category: 'CRM',
        icon: '🎪',
        requiredFields: ['apiKey']
      },
      {
        type: 'mailchimp',
        name: 'Mailchimp',
        description: 'Email marketing e automação',
        category: 'Email Marketing',
        icon: '📧',
        requiredFields: ['apiKey']
      },
      {
        type: 'custom',
        name: 'Integração Customizada',
        description: 'Webhook personalizado para APIs próprias',
        category: 'Desenvolvimento',
        icon: '🔗',
        requiredFields: ['webhookUrl']
      }
    ];
  }

  // 📈 Integration Analytics
  getIntegrationStats(): {
    totalIntegrations: number;
    activeIntegrations: number;
    successfulSyncs: number;
    failedSyncs: number;
    lastSyncDate?: string;
  } {
    const integrations = this.getIntegrations();
    const active = integrations.filter(i => i.isEnabled);
    const successful = integrations.filter(i => i.syncStatus === 'success').length;
    const failed = integrations.filter(i => i.syncStatus === 'error').length;

    const lastSyncs = integrations
      .filter(i => i.lastSync)
      .map(i => new Date(i.lastSync!))
      .sort((a, b) => b.getTime() - a.getTime());

    return {
      totalIntegrations: integrations.length,
      activeIntegrations: active.length,
      successfulSyncs: successful,
      failedSyncs: failed,
      lastSyncDate: lastSyncs.length > 0 ? lastSyncs[0].toISOString() : undefined
    };
  }

  // 📝 Sync Logging
  private logSyncOperation(integrationId: string, result: { success: boolean; error?: string }): void {
    try {
      const logs = this.getSyncLogs();
      const log = {
        id: `log_${Date.now()}`,
        integrationId,
        timestamp: new Date().toISOString(),
        success: result.success,
        error: result.error,
        duration: Math.floor(Math.random() * 5000) + 500 // Simulate duration
      };

      logs.push(log);

      // Keep only last 100 logs
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }

      localStorage.setItem(this.STORAGE_KEYS.SYNC_LOGS, JSON.stringify(logs));
    } catch (error) {
      logger.error('Erro ao registrar log de sincronização:', error);
    }
  }

  getSyncLogs(integrationId?: string): any[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.SYNC_LOGS);
      const logs = stored ? JSON.parse(stored) : [];

      if (integrationId) {
        return logs.filter((log: any) => log.integrationId === integrationId);
      }

      return logs;
    } catch (error) {
      logger.error('Erro ao carregar logs de sincronização:', error);
      return [];
    }
  }

  // 💾 Storage Methods
  private saveIntegrations(integrations: Integration[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.INTEGRATIONS, JSON.stringify(integrations));
    } catch (error) {
      logger.error('Erro ao salvar integrações:', error);
    }
  }

  // 🔄 Initialize
  initializeIntegrationSystem(): void {
    try {
      // Initialize default integrations if needed
      const integrations = this.getIntegrations();

      if (integrations.length === 0) {
        logger.debug('Sistema de integrações inicializado sem integrações padrão');
      }

      logger.debug('✅ Sistema de integrações inicializado com sucesso');
    } catch (error) {
      logger.error('❌ Erro ao inicializar sistema de integrações:', error);
    }
  }
}

export const integrationStorage = new IntegrationStorage();