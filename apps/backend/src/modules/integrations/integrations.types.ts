// ============================================================================
// Integrations Module - Types
// ============================================================================

import { Integration, IntegrationSyncLog } from '@prisma/client';

export type IntegrationType =
  | 'ZAPIER'
  | 'MAKE'
  | 'GOOGLE_ANALYTICS'
  | 'FACEBOOK_ADS'
  | 'INSTAGRAM_ADS'
  | 'HUBSPOT'
  | 'PIPEDRIVE'
  | 'MAILCHIMP'
  | 'WEBHOOK'
  | 'CUSTOM';

export interface CreateIntegrationDTO {
  name: string;
  type: IntegrationType;
  config: Record<string, unknown>;
  credentials?: Record<string, unknown>;
  syncFrequency?: 'REALTIME' | 'HOURLY' | 'DAILY' | 'WEEKLY';
  isEnabled?: boolean;
}

export interface UpdateIntegrationDTO extends Partial<CreateIntegrationDTO> {
  id: string;
}

export interface TestIntegrationResponse {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}

export interface SyncIntegrationResponse {
  success: boolean;
  recordsSynced: number;
  message: string;
  errors?: string[];
}

export interface WebhookPayload {
  event: string;
  data: Record<string, unknown>;
  timestamp: Date;
  source: string;
}

export interface IntegrationWithLogs extends Integration {
  syncLogs?: IntegrationSyncLog[];
}

export interface IntegrationLog {
  id: string;
  integrationId: string;
  action: 'SYNC' | 'TEST' | 'WEBHOOK' | 'ERROR';
  status: 'SUCCESS' | 'ERROR' | 'PENDING';
  message?: string;
  details?: Record<string, unknown>;
  recordsAffected?: number;
  timestamp: Date;
}

export interface HubSpotConfig {
  apiKey: string;
  portalId: string;
  syncContacts?: boolean;
  syncDeals?: boolean;
}

export interface PipedriveConfig {
  apiToken: string;
  domain: string;
  syncPersons?: boolean;
  syncDeals?: boolean;
}

export interface ZapierConfig {
  webhookUrl: string;
  events: string[];
}

export interface MakeConfig {
  webhookUrl: string;
  scenarioId?: string;
}

export interface WebhookConfig {
  url: string;
  method: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  events: string[];
}

export interface IIntegrationsService {
  create(data: CreateIntegrationDTO, userId: string): Promise<Integration>;
  findAll(): Promise<Integration[]>;
  findById(id: string): Promise<IntegrationWithLogs | null>;
  update(id: string, data: UpdateIntegrationDTO): Promise<Integration>;
  delete(id: string): Promise<void>;
  test(id: string): Promise<TestIntegrationResponse>;
  sync(id: string): Promise<SyncIntegrationResponse>;
  handleZapierWebhook(payload: WebhookPayload): Promise<void>;
  handleMakeWebhook(payload: WebhookPayload): Promise<void>;
  getLogs(id: string, limit?: number): Promise<IntegrationSyncLog[]>;
}
