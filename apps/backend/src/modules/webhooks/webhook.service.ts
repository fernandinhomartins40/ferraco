import { PrismaClient, WebhookStatus, WebhookDeliveryStatus } from '@prisma/client';
import crypto from 'crypto';
import axios from 'axios';
import {
  CreateWebhookDTO,
  UpdateWebhookDTO,
  WebhookResponse,
  WebhookDeliveryResponse,
  WebhookPayload,
} from './webhook.types';

const prisma = new PrismaClient();

export class WebhookService {
  /**
   * Gera um secret criptograficamente seguro para webhook
   */
  private generateWebhookSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Cria assinatura HMAC-SHA256 para payload
   */
  private createSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  /**
   * Cria novo webhook
   */
  async createWebhook(apiKeyId: string, data: CreateWebhookDTO): Promise<WebhookResponse> {
    const secret = this.generateWebhookSecret();

    const webhook = await prisma.webhook.create({
      data: {
        apiKeyId,
        url: data.url,
        events: JSON.stringify(data.events),
        secret,
        name: data.name || null,
        description: data.description || null,
        maxRetries: data.maxRetries || 3,
        retryDelay: data.retryDelay || 60000,
        status: WebhookStatus.ACTIVE,
      },
    });

    return this.formatWebhookResponse(webhook, secret);
  }

  /**
   * Lista webhooks de uma API Key
   */
  async listWebhooks(apiKeyId: string): Promise<Omit<WebhookResponse, 'secret'>[]> {
    const webhooks = await prisma.webhook.findMany({
      where: { apiKeyId },
      orderBy: { createdAt: 'desc' },
    });

    return webhooks.map((webhook) => this.formatWebhookResponse(webhook));
  }

  /**
   * Busca webhook por ID
   */
  async getWebhookById(id: string, apiKeyId: string): Promise<Omit<WebhookResponse, 'secret'> | null> {
    const webhook = await prisma.webhook.findFirst({
      where: { id, apiKeyId },
    });

    return webhook ? this.formatWebhookResponse(webhook) : null;
  }

  /**
   * Atualiza webhook
   */
  async updateWebhook(
    id: string,
    apiKeyId: string,
    data: UpdateWebhookDTO
  ): Promise<Omit<WebhookResponse, 'secret'>> {
    const updateData: any = {};

    if (data.url !== undefined) updateData.url = data.url;
    if (data.events !== undefined) updateData.events = JSON.stringify(data.events);
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.maxRetries !== undefined) updateData.maxRetries = data.maxRetries;
    if (data.retryDelay !== undefined) updateData.retryDelay = data.retryDelay;

    const webhook = await prisma.webhook.update({
      where: { id, apiKeyId },
      data: updateData,
    });

    return this.formatWebhookResponse(webhook);
  }

  /**
   * Deleta webhook
   */
  async deleteWebhook(id: string, apiKeyId: string): Promise<void> {
    await prisma.webhook.delete({
      where: { id, apiKeyId },
    });
  }

  /**
   * Pausa webhook
   */
  async pauseWebhook(id: string, apiKeyId: string): Promise<void> {
    await prisma.webhook.update({
      where: { id, apiKeyId },
      data: { status: WebhookStatus.PAUSED },
    });
  }

  /**
   * Ativa webhook
   */
  async activateWebhook(id: string, apiKeyId: string): Promise<void> {
    await prisma.webhook.update({
      where: { id, apiKeyId },
      data: { status: WebhookStatus.ACTIVE, failureCount: 0 },
    });
  }

  /**
   * Dispara evento para todos os webhooks subscritos
   */
  async triggerEvent(event: string, payload: any): Promise<void> {
    const webhooks = await prisma.webhook.findMany({
      where: {
        status: WebhookStatus.ACTIVE,
      },
    });

    const webhooksForEvent = webhooks.filter((webhook) => {
      const events = JSON.parse(webhook.events);
      return events.includes(event) || events.includes('*');
    });

    // Cria deliveries para todos os webhooks
    const deliveryPromises = webhooksForEvent.map((webhook) =>
      this.createDelivery(webhook.id, event, payload)
    );

    await Promise.all(deliveryPromises);
  }

  /**
   * Cria delivery de webhook
   */
  private async createDelivery(webhookId: string, event: string, data: any): Promise<void> {
    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
    });

    if (!webhook) return;

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    const delivery = await prisma.webhookDelivery.create({
      data: {
        webhookId,
        event,
        payload: JSON.stringify(payload),
        maxAttempts: webhook.maxRetries,
        nextAttemptAt: new Date(),
      },
    });

    // Agenda entrega imediata (assíncrona)
    this.executeDelivery(delivery.id).catch((error) => {
      console.error(`Failed to execute delivery ${delivery.id}:`, error);
    });
  }

  /**
   * Executa delivery de webhook
   */
  async executeDelivery(deliveryId: string): Promise<void> {
    const delivery = await prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
      include: { webhook: true },
    });

    if (!delivery || delivery.status === WebhookDeliveryStatus.SUCCESS) {
      return;
    }

    const { webhook } = delivery;
    const payload = delivery.payload;
    const signature = this.createSignature(payload, webhook.secret);

    const startTime = Date.now();
    let success = false;
    let statusCode: number | undefined;
    let errorMessage: string | undefined;

    try {
      const response = await axios.post(webhook.url, JSON.parse(payload), {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': delivery.event,
          'X-Webhook-Delivery-ID': delivery.id,
          'User-Agent': 'Ferraco-CRM-Webhook/1.0',
        },
        timeout: 30000, // 30 segundos
      });

      statusCode = response.status;
      success = statusCode >= 200 && statusCode < 300;
    } catch (error: any) {
      statusCode = error.response?.status;
      errorMessage = error.message;
      success = false;
    }

    const responseTime = Date.now() - startTime;
    const attempts = delivery.attempts + 1;

    // Atualiza delivery
    const shouldRetry = !success && attempts < delivery.maxAttempts;
    const nextAttemptAt = shouldRetry
      ? new Date(Date.now() + webhook.retryDelay * attempts) // Exponential backoff
      : null;

    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: success
          ? WebhookDeliveryStatus.SUCCESS
          : shouldRetry
          ? WebhookDeliveryStatus.RETRYING
          : WebhookDeliveryStatus.FAILED,
        attempts,
        statusCode,
        errorMessage,
        responseTime,
        lastAttemptAt: new Date(),
        nextAttemptAt,
        completedAt: success || !shouldRetry ? new Date() : null,
      },
    });

    // Atualiza webhook stats
    if (success) {
      await prisma.webhook.update({
        where: { id: webhook.id },
        data: {
          successCount: { increment: 1 },
          lastTriggeredAt: new Date(),
        },
      });
    } else {
      const failureCount = webhook.failureCount + 1;
      const shouldDisable = failureCount >= 10; // Desabilita após 10 falhas consecutivas

      await prisma.webhook.update({
        where: { id: webhook.id },
        data: {
          failureCount: { increment: 1 },
          status: shouldDisable ? WebhookStatus.FAILED : webhook.status,
        },
      });
    }

    // Agenda retry se necessário
    if (shouldRetry && nextAttemptAt) {
      const delay = nextAttemptAt.getTime() - Date.now();
      setTimeout(() => {
        this.executeDelivery(deliveryId).catch((error) => {
          console.error(`Failed to retry delivery ${deliveryId}:`, error);
        });
      }, delay);
    }
  }

  /**
   * Lista deliveries de um webhook
   */
  async listDeliveries(
    webhookId: string,
    options?: {
      status?: WebhookDeliveryStatus;
      limit?: number;
      offset?: number;
    }
  ): Promise<WebhookDeliveryResponse[]> {
    const where: any = { webhookId };
    if (options?.status) {
      where.status = options.status;
    }

    const deliveries = await prisma.webhookDelivery.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });

    return deliveries.map((delivery) => ({
      id: delivery.id,
      webhookId: delivery.webhookId,
      event: delivery.event,
      status: delivery.status,
      attempts: delivery.attempts,
      maxAttempts: delivery.maxAttempts,
      statusCode: delivery.statusCode,
      errorMessage: delivery.errorMessage,
      responseTime: delivery.responseTime,
      createdAt: delivery.createdAt,
      lastAttemptAt: delivery.lastAttemptAt,
      nextAttemptAt: delivery.nextAttemptAt,
      completedAt: delivery.completedAt,
    }));
  }

  /**
   * Testa webhook enviando evento de teste
   */
  async testWebhook(id: string, apiKeyId: string): Promise<{ success: boolean; message: string }> {
    const webhook = await prisma.webhook.findFirst({
      where: { id, apiKeyId },
    });

    if (!webhook) {
      return { success: false, message: 'Webhook not found' };
    }

    const testPayload: WebhookPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook',
        webhookId: webhook.id,
      },
    };

    const payloadString = JSON.stringify(testPayload);
    const signature = this.createSignature(payloadString, webhook.secret);

    try {
      const response = await axios.post(webhook.url, testPayload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': 'webhook.test',
          'User-Agent': 'Ferraco-CRM-Webhook/1.0',
        },
        timeout: 10000,
      });

      return {
        success: response.status >= 200 && response.status < 300,
        message: `Webhook test successful. Status: ${response.status}`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Webhook test failed: ${error.message}`,
      };
    }
  }

  /**
   * Processa deliveries pendentes (retry queue)
   */
  async processPendingDeliveries(): Promise<void> {
    const pendingDeliveries = await prisma.webhookDelivery.findMany({
      where: {
        status: {
          in: [WebhookDeliveryStatus.PENDING, WebhookDeliveryStatus.RETRYING],
        },
        nextAttemptAt: {
          lte: new Date(),
        },
      },
      take: 100,
    });

    const promises = pendingDeliveries.map((delivery) => this.executeDelivery(delivery.id));
    await Promise.allSettled(promises);
  }

  /**
   * Formata resposta de webhook
   */
  private formatWebhookResponse(webhook: any, includeSecret?: string): any {
    const response: any = {
      id: webhook.id,
      url: webhook.url,
      events: JSON.parse(webhook.events),
      status: webhook.status,
      name: webhook.name,
      description: webhook.description,
      maxRetries: webhook.maxRetries,
      retryDelay: webhook.retryDelay,
      lastTriggeredAt: webhook.lastTriggeredAt,
      failureCount: webhook.failureCount,
      successCount: webhook.successCount,
      createdAt: webhook.createdAt,
      updatedAt: webhook.updatedAt,
    };

    if (includeSecret) {
      response.secret = includeSecret;
    }

    return response;
  }
}

export const webhookService = new WebhookService();
