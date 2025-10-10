# FASE 9 - IMPLEMENTAÇÃO DAS APIs AVANÇADAS

## 📋 VISÃO GERAL

Esta fase implementa os módulos avançados do CRM:
- **Pipeline/CRM**: Gestão de funil de vendas
- **Comunicações**: WhatsApp, Email, SMS
- **Automações**: Motor de regras e triggers
- **Relatórios**: Analytics e exportações
- **Dashboard**: Widgets e métricas
- **Integrações**: APIs externas

**Duração Estimada**: 2 semanas (10-12 dias úteis)

---

## 📦 MÓDULO 1: PIPELINE/CRM

### 1.1 Endpoints (15 total)

```typescript
// Pipelines
GET    /api/pipelines                      // Listar pipelines
GET    /api/pipelines/:id                  // Buscar pipeline
POST   /api/pipelines                      // Criar pipeline
PUT    /api/pipelines/:id                  // Atualizar pipeline
DELETE /api/pipelines/:id                  // Deletar pipeline

// Estágios
GET    /api/pipelines/:id/stages           // Listar estágios
POST   /api/pipelines/:id/stages           // Criar estágio
PUT    /api/stages/:id                     // Atualizar estágio
DELETE /api/stages/:id                     // Deletar estágio
PUT    /api/stages/:id/reorder             // Reordenar estágios

// Oportunidades
POST   /api/opportunities                  // Criar oportunidade
PUT    /api/opportunities/:id/move         // Mover entre estágios
GET    /api/opportunities/:id/timeline     // Timeline da oportunidade

// Estatísticas
GET    /api/pipelines/:id/stats            // Estatísticas do pipeline
GET    /api/pipelines/:id/funnel           // Funil de conversão
```

### 1.2 Tipos TypeScript

**pipeline.types.ts**:
```typescript
import { Pipeline, Stage, Opportunity, OpportunityStatus } from '@prisma/client';

export interface CreatePipelineDTO {
  name: string;
  description?: string;
  isDefault?: boolean;
  stages: CreateStageDTO[];
}

export interface CreateStageDTO {
  name: string;
  order: number;
  color: string;
  rottenDays?: number;
}

export interface UpdatePipelineDTO extends Partial<CreatePipelineDTO> {
  id: string;
}

export interface CreateOpportunityDTO {
  leadId: string;
  pipelineId: string;
  stageId: string;
  value?: number;
  probability?: number;
  expectedCloseDate?: Date;
  assignedToId?: string;
}

export interface MoveOpportunityDTO {
  opportunityId: string;
  targetStageId: string;
  reason?: string;
}

export interface PipelineStatsResponse {
  totalOpportunities: number;
  totalValue: number;
  averageValue: number;
  conversionRate: number;
  averageTimeInPipeline: number;
  byStage: {
    stageId: string;
    stageName: string;
    count: number;
    value: number;
    averageTime: number;
  }[];
}

export interface FunnelData {
  stage: string;
  count: number;
  value: number;
  conversionRate: number;
}
```

### 1.3 Validações Zod

**pipeline.validators.ts**:
```typescript
import { z } from 'zod';

export const CreateStageSchema = z.object({
  name: z.string().min(2).max(50).trim(),
  order: z.number().int().min(0),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor inválida (formato: #RRGGBB)'),
  rottenDays: z.number().int().positive().optional(),
});

export const CreatePipelineSchema = z.object({
  name: z.string().min(3).max(100).trim(),
  description: z.string().max(500).optional(),
  isDefault: z.boolean().optional(),
  stages: z.array(CreateStageSchema).min(1, 'Pipeline deve ter ao menos 1 estágio'),
});

export const UpdatePipelineSchema = CreatePipelineSchema.partial().extend({
  id: z.string().cuid(),
});

export const CreateOpportunitySchema = z.object({
  leadId: z.string().cuid(),
  pipelineId: z.string().cuid(),
  stageId: z.string().cuid(),
  value: z.number().positive().optional(),
  probability: z.number().min(0).max(100).optional(),
  expectedCloseDate: z.string().datetime().optional(),
  assignedToId: z.string().cuid().optional(),
});

export const MoveOpportunitySchema = z.object({
  opportunityId: z.string().cuid(),
  targetStageId: z.string().cuid(),
  reason: z.string().max(500).optional(),
});
```

### 1.4 Service Layer

**pipeline.service.ts**:
```typescript
import { PrismaClient, Pipeline, Stage, Opportunity } from '@prisma/client';
import {
  CreatePipelineDTO,
  CreateOpportunityDTO,
  MoveOpportunityDTO,
  PipelineStatsResponse,
  FunnelData
} from './pipeline.types';

export class PipelineService {
  constructor(private prisma: PrismaClient) {}

  async createPipeline(data: CreatePipelineDTO): Promise<Pipeline> {
    // Se for pipeline padrão, remover padrão dos outros
    if (data.isDefault) {
      await this.prisma.pipeline.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.pipeline.create({
      data: {
        name: data.name,
        description: data.description,
        isDefault: data.isDefault || false,
        stages: {
          create: data.stages.map(stage => ({
            name: stage.name,
            order: stage.order,
            color: stage.color,
            rottenDays: stage.rottenDays,
          })),
        },
      },
      include: {
        stages: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async findAll(): Promise<Pipeline[]> {
    return this.prisma.pipeline.findMany({
      include: {
        stages: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { opportunities: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Pipeline | null> {
    return this.prisma.pipeline.findUnique({
      where: { id },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: {
            _count: {
              select: { opportunities: true },
            },
          },
        },
      },
    });
  }

  async createOpportunity(data: CreateOpportunityDTO, userId: string): Promise<Opportunity> {
    return this.prisma.opportunity.create({
      data: {
        leadId: data.leadId,
        pipelineId: data.pipelineId,
        stageId: data.stageId,
        value: data.value,
        probability: data.probability || 10,
        expectedCloseDate: data.expectedCloseDate,
        assignedToId: data.assignedToId || userId,
        status: 'OPEN',
        history: {
          create: {
            stageId: data.stageId,
            enteredAt: new Date(),
          },
        },
      },
      include: {
        lead: true,
        stage: true,
        assignedTo: true,
      },
    });
  }

  async moveOpportunity(data: MoveOpportunityDTO): Promise<Opportunity> {
    const opportunity = await this.prisma.opportunity.findUnique({
      where: { id: data.opportunityId },
      include: { history: true },
    });

    if (!opportunity) throw new Error('Oportunidade não encontrada');

    // Calcular tempo no estágio anterior
    const lastHistory = opportunity.history[opportunity.history.length - 1];
    const timeInStage = Date.now() - lastHistory.enteredAt.getTime();

    // Atualizar oportunidade e criar histórico
    return this.prisma.opportunity.update({
      where: { id: data.opportunityId },
      data: {
        stageId: data.targetStageId,
        history: {
          create: {
            stageId: data.targetStageId,
            enteredAt: new Date(),
            timeInPreviousStage: Math.floor(timeInStage / 1000), // segundos
            reason: data.reason,
          },
        },
      },
      include: {
        lead: true,
        stage: true,
        history: true,
      },
    });
  }

  async getPipelineStats(pipelineId: string): Promise<PipelineStatsResponse> {
    const [opportunities, stages] = await Promise.all([
      this.prisma.opportunity.findMany({
        where: { pipelineId, status: 'OPEN' },
        include: { stage: true, history: true },
      }),
      this.prisma.stage.findMany({
        where: { pipelineId },
        orderBy: { order: 'asc' },
      }),
    ]);

    const totalValue = opportunities.reduce((sum, opp) => sum + (opp.value || 0), 0);
    const avgValue = opportunities.length > 0 ? totalValue / opportunities.length : 0;

    // Estatísticas por estágio
    const byStage = stages.map(stage => {
      const stageOpps = opportunities.filter(opp => opp.stageId === stage.id);
      const stageValue = stageOpps.reduce((sum, opp) => sum + (opp.value || 0), 0);

      // Calcular tempo médio no estágio
      const avgTime = stageOpps.reduce((sum, opp) => {
        const history = opp.history.find(h => h.stageId === stage.id);
        if (history && history.timeInPreviousStage) {
          return sum + history.timeInPreviousStage;
        }
        return sum;
      }, 0) / (stageOpps.length || 1);

      return {
        stageId: stage.id,
        stageName: stage.name,
        count: stageOpps.length,
        value: stageValue,
        averageTime: avgTime,
      };
    });

    return {
      totalOpportunities: opportunities.length,
      totalValue,
      averageValue: avgValue,
      conversionRate: 0, // Calcular baseado em oportunidades fechadas
      averageTimeInPipeline: 0, // Calcular baseado em histórico
      byStage,
    };
  }

  async getFunnel(pipelineId: string): Promise<FunnelData[]> {
    const stages = await this.prisma.stage.findMany({
      where: { pipelineId },
      orderBy: { order: 'asc' },
      include: {
        opportunities: {
          where: { status: 'OPEN' },
        },
      },
    });

    let previousCount = 0;

    return stages.map((stage, index) => {
      const count = stage.opportunities.length;
      const value = stage.opportunities.reduce((sum, opp) => sum + (opp.value || 0), 0);
      const conversionRate = index === 0 ? 100 : (previousCount > 0 ? (count / previousCount) * 100 : 0);

      previousCount = count;

      return {
        stage: stage.name,
        count,
        value,
        conversionRate,
      };
    });
  }
}
```

---

## 📦 MÓDULO 2: COMUNICAÇÕES

### 2.1 Endpoints (12 total)

```typescript
// Envio de mensagens
POST   /api/communications/whatsapp          // Enviar WhatsApp
POST   /api/communications/email             // Enviar Email
POST   /api/communications/sms               // Enviar SMS
POST   /api/communications/call              // Registrar chamada

// Templates
GET    /api/communications/templates         // Listar templates
POST   /api/communications/templates         // Criar template
PUT    /api/communications/templates/:id     // Atualizar template
DELETE /api/communications/templates/:id     // Deletar template

// Histórico
GET    /api/communications/history/:leadId   // Histórico de um lead
GET    /api/communications/:id               // Buscar comunicação

// Webhooks
POST   /api/communications/webhook/whatsapp  // Webhook WhatsApp
POST   /api/communications/webhook/sendgrid  // Webhook SendGrid
```

### 2.2 Service Layer

**communications.service.ts**:
```typescript
import { PrismaClient, Communication, CommunicationType, CommunicationStatus } from '@prisma/client';
import axios from 'axios';

export interface SendWhatsAppDTO {
  leadId: string;
  phone: string;
  message: string;
  templateId?: string;
  variables?: Record<string, string>;
}

export interface SendEmailDTO {
  leadId: string;
  to: string;
  subject: string;
  body: string;
  templateId?: string;
  attachments?: Array<{ filename: string; content: string }>;
}

export interface SendSMSDTO {
  leadId: string;
  phone: string;
  message: string;
}

export interface RegisterCallDTO {
  leadId: string;
  duration: number;
  notes?: string;
  outcome?: string;
}

export class CommunicationsService {
  constructor(private prisma: PrismaClient) {}

  async sendWhatsApp(data: SendWhatsAppDTO, userId: string): Promise<Communication> {
    // Processar template se fornecido
    let message = data.message;
    if (data.templateId && data.variables) {
      const template = await this.prisma.communicationTemplate.findUnique({
        where: { id: data.templateId },
      });

      if (template) {
        message = this.processTemplate(template.content, data.variables);
      }
    }

    // Enviar via WhatsApp Business API
    const whatsappResponse = await this.sendWhatsAppMessage(data.phone, message);

    // Registrar comunicação
    return this.prisma.communication.create({
      data: {
        leadId: data.leadId,
        type: 'WHATSAPP',
        direction: 'OUTBOUND',
        content: message,
        recipient: data.phone,
        status: whatsappResponse.success ? 'SENT' : 'FAILED',
        externalId: whatsappResponse.messageId,
        sentById: userId,
        sentAt: new Date(),
        metadata: {
          templateId: data.templateId,
          variables: data.variables,
        },
      },
    });
  }

  async sendEmail(data: SendEmailDTO, userId: string): Promise<Communication> {
    // Processar template se fornecido
    let { subject, body } = data;
    if (data.templateId) {
      const template = await this.prisma.communicationTemplate.findUnique({
        where: { id: data.templateId },
      });

      if (template) {
        body = template.content;
        subject = template.subject || subject;
      }
    }

    // Enviar via SendGrid/SMTP
    const emailResponse = await this.sendEmailMessage({
      to: data.to,
      subject,
      body,
      attachments: data.attachments,
    });

    return this.prisma.communication.create({
      data: {
        leadId: data.leadId,
        type: 'EMAIL',
        direction: 'OUTBOUND',
        content: body,
        recipient: data.to,
        subject,
        status: emailResponse.success ? 'SENT' : 'FAILED',
        externalId: emailResponse.messageId,
        sentById: userId,
        sentAt: new Date(),
        metadata: {
          attachments: data.attachments?.map(a => a.filename),
        },
      },
    });
  }

  async sendSMS(data: SendSMSDTO, userId: string): Promise<Communication> {
    // Enviar via Twilio
    const smsResponse = await this.sendSMSMessage(data.phone, data.message);

    return this.prisma.communication.create({
      data: {
        leadId: data.leadId,
        type: 'SMS',
        direction: 'OUTBOUND',
        content: data.message,
        recipient: data.phone,
        status: smsResponse.success ? 'SENT' : 'FAILED',
        externalId: smsResponse.messageId,
        sentById: userId,
        sentAt: new Date(),
      },
    });
  }

  async registerCall(data: RegisterCallDTO, userId: string): Promise<Communication> {
    return this.prisma.communication.create({
      data: {
        leadId: data.leadId,
        type: 'CALL',
        direction: 'OUTBOUND',
        content: data.notes || '',
        status: 'COMPLETED',
        duration: data.duration,
        sentById: userId,
        sentAt: new Date(),
        metadata: {
          outcome: data.outcome,
        },
      },
    });
  }

  async getHistory(leadId: string): Promise<Communication[]> {
    return this.prisma.communication.findMany({
      where: { leadId },
      orderBy: { sentAt: 'desc' },
      include: {
        sentBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  // Integrações externas
  private async sendWhatsAppMessage(
    phone: string,
    message: string
  ): Promise<{ success: boolean; messageId?: string }> {
    try {
      const response = await axios.post(
        `${process.env.WHATSAPP_API_URL}/messages`,
        {
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: { body: message },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        messageId: response.data.messages[0].id,
      };
    } catch (error) {
      console.error('WhatsApp send error:', error);
      return { success: false };
    }
  }

  private async sendEmailMessage(data: {
    to: string;
    subject: string;
    body: string;
    attachments?: Array<{ filename: string; content: string }>;
  }): Promise<{ success: boolean; messageId?: string }> {
    try {
      const response = await axios.post(
        'https://api.sendgrid.com/v3/mail/send',
        {
          personalizations: [{ to: [{ email: data.to }] }],
          from: { email: process.env.EMAIL_FROM },
          subject: data.subject,
          content: [{ type: 'text/html', value: data.body }],
          attachments: data.attachments,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        messageId: response.headers['x-message-id'],
      };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false };
    }
  }

  private async sendSMSMessage(
    phone: string,
    message: string
  ): Promise<{ success: boolean; messageId?: string }> {
    try {
      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
        new URLSearchParams({
          To: phone,
          From: process.env.TWILIO_PHONE_NUMBER!,
          Body: message,
        }),
        {
          auth: {
            username: process.env.TWILIO_ACCOUNT_SID!,
            password: process.env.TWILIO_AUTH_TOKEN!,
          },
        }
      );

      return {
        success: true,
        messageId: response.data.sid,
      };
    } catch (error) {
      console.error('SMS send error:', error);
      return { success: false };
    }
  }

  private processTemplate(template: string, variables: Record<string, string>): string {
    let processed = template;

    Object.entries(variables).forEach(([key, value]) => {
      processed = processed.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    return processed;
  }
}
```

---

## 📦 MÓDULO 3: AUTOMAÇÕES

### 3.1 Endpoints (10 total)

```typescript
GET    /api/automations                   // Listar automações
GET    /api/automations/:id               // Buscar automação
POST   /api/automations                   // Criar automação
PUT    /api/automations/:id               // Atualizar automação
DELETE /api/automations/:id               // Deletar automação
PUT    /api/automations/:id/toggle        // Ativar/desativar
POST   /api/automations/:id/test          // Testar automação
GET    /api/automations/:id/executions    // Histórico de execuções
GET    /api/automations/stats             // Estatísticas
POST   /api/automations/execute           // Executar manualmente
```

### 3.2 Service Layer

**automations.service.ts**:
```typescript
import { PrismaClient, Automation, AutomationExecution } from '@prisma/client';

export interface CreateAutomationDTO {
  name: string;
  description?: string;
  trigger: {
    type: 'LEAD_CREATED' | 'LEAD_UPDATED' | 'STAGE_CHANGED' | 'TAG_ADDED' | 'SCHEDULED';
    config?: Record<string, unknown>;
  };
  conditions: Array<{
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: string | number;
  }>;
  actions: Array<{
    type: 'SEND_EMAIL' | 'SEND_WHATSAPP' | 'ADD_TAG' | 'ASSIGN_TO' | 'CREATE_TASK' | 'UPDATE_FIELD' | 'SEND_WEBHOOK' | 'MOVE_TO_STAGE';
    config: Record<string, unknown>;
  }>;
  isActive?: boolean;
}

export class AutomationsService {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateAutomationDTO): Promise<Automation> {
    return this.prisma.automation.create({
      data: {
        name: data.name,
        description: data.description,
        trigger: data.trigger as any,
        conditions: data.conditions as any,
        actions: data.actions as any,
        isActive: data.isActive !== false,
      },
    });
  }

  async findAll(): Promise<Automation[]> {
    return this.prisma.automation.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggle(id: string): Promise<Automation> {
    const automation = await this.prisma.automation.findUnique({
      where: { id },
    });

    if (!automation) throw new Error('Automação não encontrada');

    return this.prisma.automation.update({
      where: { id },
      data: { isActive: !automation.isActive },
    });
  }

  async execute(automationId: string, context: Record<string, unknown>): Promise<AutomationExecution> {
    const automation = await this.prisma.automation.findUnique({
      where: { id: automationId },
    });

    if (!automation) throw new Error('Automação não encontrada');

    const startTime = Date.now();
    let success = false;
    let error: string | undefined;
    const results: unknown[] = [];

    try {
      // Avaliar condições
      const conditionsMet = this.evaluateConditions(
        automation.conditions as any,
        context
      );

      if (!conditionsMet) {
        throw new Error('Condições não atendidas');
      }

      // Executar ações
      for (const action of automation.actions as any[]) {
        const result = await this.executeAction(action, context);
        results.push(result);
      }

      success = true;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Erro desconhecido';
    }

    const executionTime = Date.now() - startTime;

    // Registrar execução
    return this.prisma.automationExecution.create({
      data: {
        automationId,
        success,
        error,
        context: context as any,
        results: results as any,
        executionTime,
      },
    });
  }

  private evaluateConditions(
    conditions: Array<{
      field: string;
      operator: string;
      value: string | number;
    }>,
    context: Record<string, unknown>
  ): boolean {
    return conditions.every(condition => {
      const fieldValue = context[condition.field];

      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'not_equals':
          return fieldValue !== condition.value;
        case 'contains':
          return String(fieldValue).includes(String(condition.value));
        case 'greater_than':
          return Number(fieldValue) > Number(condition.value);
        case 'less_than':
          return Number(fieldValue) < Number(condition.value);
        default:
          return false;
      }
    });
  }

  private async executeAction(
    action: { type: string; config: Record<string, unknown> },
    context: Record<string, unknown>
  ): Promise<unknown> {
    switch (action.type) {
      case 'SEND_EMAIL':
        // Implementar envio de email
        return { sent: true };

      case 'SEND_WHATSAPP':
        // Implementar envio de WhatsApp
        return { sent: true };

      case 'ADD_TAG':
        // Adicionar tag ao lead
        if (context.leadId) {
          await this.prisma.lead.update({
            where: { id: context.leadId as string },
            data: {
              tags: {
                connect: { id: action.config.tagId as string },
              },
            },
          });
        }
        return { tagAdded: true };

      case 'ASSIGN_TO':
        // Atribuir lead a usuário
        if (context.leadId) {
          await this.prisma.lead.update({
            where: { id: context.leadId as string },
            data: { assignedToId: action.config.userId as string },
          });
        }
        return { assigned: true };

      case 'UPDATE_FIELD':
        // Atualizar campo do lead
        if (context.leadId) {
          await this.prisma.lead.update({
            where: { id: context.leadId as string },
            data: {
              [action.config.field as string]: action.config.value,
            },
          });
        }
        return { updated: true };

      default:
        throw new Error(`Tipo de ação desconhecido: ${action.type}`);
    }
  }

  async getStats(): Promise<{
    total: number;
    active: number;
    totalExecutions: number;
    successRate: number;
  }> {
    const [total, active, executions] = await Promise.all([
      this.prisma.automation.count(),
      this.prisma.automation.count({ where: { isActive: true } }),
      this.prisma.automationExecution.groupBy({
        by: ['success'],
        _count: true,
      }),
    ]);

    const totalExecutions = executions.reduce((sum, e) => sum + e._count, 0);
    const successfulExecutions = executions.find(e => e.success)?._count || 0;
    const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;

    return {
      total,
      active,
      totalExecutions,
      successRate,
    };
  }
}
```

---

## 📦 MÓDULO 4: RELATÓRIOS

### 4.1 Endpoints (12 total)

```typescript
GET    /api/reports                       // Listar relatórios
GET    /api/reports/:id                   // Buscar relatório
POST   /api/reports                       // Criar relatório
PUT    /api/reports/:id                   // Atualizar relatório
DELETE /api/reports/:id                   // Deletar relatório
POST   /api/reports/:id/generate          // Gerar relatório
GET    /api/reports/:id/download          // Download
POST   /api/reports/:id/schedule          // Agendar geração
GET    /api/reports/scheduled             // Listar agendados
GET    /api/reports/analytics/funnel      // Funil de conversão
GET    /api/reports/analytics/cohort      // Análise de cohort
GET    /api/reports/analytics/performance // Performance de equipe
```

### 4.2 Service Layer

**reports.service.ts**:
```typescript
import { PrismaClient, Report } from '@prisma/client';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export interface CreateReportDTO {
  name: string;
  type: 'LEADS' | 'OPPORTUNITIES' | 'COMMUNICATIONS' | 'CUSTOM';
  filters: Record<string, unknown>;
  columns: string[];
  groupBy?: string;
  sortBy?: string;
  format: 'JSON' | 'CSV' | 'EXCEL' | 'PDF';
}

export class ReportsService {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateReportDTO, userId: string): Promise<Report> {
    return this.prisma.report.create({
      data: {
        name: data.name,
        type: data.type,
        filters: data.filters as any,
        columns: data.columns,
        groupBy: data.groupBy,
        sortBy: data.sortBy,
        format: data.format,
        createdById: userId,
      },
    });
  }

  async generate(reportId: string): Promise<Buffer> {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) throw new Error('Relatório não encontrado');

    // Buscar dados baseado no tipo
    const data = await this.fetchReportData(report);

    // Gerar no formato solicitado
    switch (report.format) {
      case 'JSON':
        return Buffer.from(JSON.stringify(data, null, 2));
      case 'CSV':
        return this.generateCSV(data, report.columns);
      case 'EXCEL':
        return this.generateExcel(data, report.columns);
      case 'PDF':
        return this.generatePDF(data, report.columns, report.name);
      default:
        throw new Error('Formato não suportado');
    }
  }

  private async fetchReportData(report: Report): Promise<unknown[]> {
    const filters = report.filters as any;

    switch (report.type) {
      case 'LEADS':
        return this.prisma.lead.findMany({
          where: filters,
          select: this.buildSelectObject(report.columns),
        });

      case 'OPPORTUNITIES':
        return this.prisma.opportunity.findMany({
          where: filters,
          select: this.buildSelectObject(report.columns),
        });

      case 'COMMUNICATIONS':
        return this.prisma.communication.findMany({
          where: filters,
          select: this.buildSelectObject(report.columns),
        });

      default:
        return [];
    }
  }

  private buildSelectObject(columns: string[]): Record<string, boolean> {
    return Object.fromEntries(columns.map(col => [col, true]));
  }

  private generateCSV(data: unknown[], columns: string[]): Buffer {
    const header = columns.join(',');
    const rows = data.map(row =>
      columns.map(col => (row as any)[col]).join(',')
    );

    return Buffer.from([header, ...rows].join('\n'));
  }

  private async generateExcel(data: unknown[], columns: string[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Relatório');

    // Adicionar cabeçalhos
    worksheet.addRow(columns);

    // Adicionar dados
    data.forEach(row => {
      worksheet.addRow(columns.map(col => (row as any)[col]));
    });

    // Estilizar cabeçalhos
    worksheet.getRow(1).font = { bold: true };
    worksheet.columns.forEach(col => {
      col.width = 15;
    });

    return workbook.xlsx.writeBuffer() as Promise<Buffer>;
  }

  private async generatePDF(
    data: unknown[],
    columns: string[],
    title: string
  ): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Título
      doc.fontSize(16).text(title, { align: 'center' });
      doc.moveDown();

      // Tabela
      doc.fontSize(10);
      data.forEach((row, index) => {
        if (index === 0) {
          doc.text(columns.join(' | '), { underline: true });
        }
        doc.text(columns.map(col => (row as any)[col]).join(' | '));
      });

      doc.end();
    });
  }

  async getFunnelAnalytics(dateFrom?: Date, dateTo?: Date) {
    const opportunities = await this.prisma.opportunity.findMany({
      where: {
        createdAt: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      include: {
        stage: true,
        history: true,
      },
    });

    // Análise de funil por estágios
    const stageStats = new Map();

    opportunities.forEach(opp => {
      const stageName = opp.stage.name;
      if (!stageStats.has(stageName)) {
        stageStats.set(stageName, { count: 0, value: 0 });
      }

      const stats = stageStats.get(stageName);
      stats.count++;
      stats.value += opp.value || 0;
    });

    return Array.from(stageStats.entries()).map(([stage, stats]) => ({
      stage,
      ...stats,
    }));
  }

  async getCohortAnalysis(metric: 'retention' | 'conversion') {
    // Análise de cohort por mês de criação
    const leads = await this.prisma.lead.findMany({
      select: {
        createdAt: true,
        status: true,
        opportunities: true,
      },
    });

    const cohorts = new Map();

    leads.forEach(lead => {
      const cohortMonth = lead.createdAt.toISOString().substring(0, 7);

      if (!cohorts.has(cohortMonth)) {
        cohorts.set(cohortMonth, { total: 0, converted: 0 });
      }

      const cohort = cohorts.get(cohortMonth);
      cohort.total++;

      if (lead.opportunities.length > 0) {
        cohort.converted++;
      }
    });

    return Array.from(cohorts.entries()).map(([month, data]) => ({
      month,
      total: data.total,
      converted: data.converted,
      conversionRate: (data.converted / data.total) * 100,
    }));
  }
}
```

---

## 📦 MÓDULO 5: DASHBOARD

### 5.1 Service Layer

**dashboard.service.ts**:
```typescript
import { PrismaClient } from '@prisma/client';

export class DashboardService {
  constructor(private prisma: PrismaClient) {}

  async getMetrics(userId?: string) {
    const where = userId ? { assignedToId: userId } : {};

    const [
      totalLeads,
      newLeadsToday,
      openOpportunities,
      totalOpportunityValue,
      communicationsToday,
      activeAutomations,
    ] = await Promise.all([
      this.prisma.lead.count({ where }),
      this.prisma.lead.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      this.prisma.opportunity.count({
        where: { ...where, status: 'OPEN' },
      }),
      this.prisma.opportunity.aggregate({
        where: { ...where, status: 'OPEN' },
        _sum: { value: true },
      }),
      this.prisma.communication.count({
        where: {
          sentAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      this.prisma.automation.count({ where: { isActive: true } }),
    ]);

    return {
      totalLeads,
      newLeadsToday,
      openOpportunities,
      totalOpportunityValue: totalOpportunityValue._sum.value || 0,
      communicationsToday,
      activeAutomations,
    };
  }

  async getLeadsByStatus(userId?: string) {
    const where = userId ? { assignedToId: userId } : {};

    const leads = await this.prisma.lead.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    return Object.fromEntries(
      leads.map(l => [l.status, l._count])
    );
  }

  async getLeadsBySource(userId?: string) {
    const where = userId ? { assignedToId: userId } : {};

    const leads = await this.prisma.lead.groupBy({
      by: ['source'],
      where,
      _count: true,
    });

    return Object.fromEntries(
      leads.map(l => [l.source || 'Desconhecido', l._count])
    );
  }
}
```

---

## 📦 MÓDULO 6: INTEGRAÇÕES

### 6.1 Endpoints (10 total)

```typescript
GET    /api/integrations                    // Listar integrações
GET    /api/integrations/:id                // Buscar integração
POST   /api/integrations                    // Criar integração
PUT    /api/integrations/:id                // Atualizar integração
DELETE /api/integrations/:id                // Deletar integração
POST   /api/integrations/:id/test           // Testar conexão
POST   /api/integrations/zapier/webhook     // Webhook Zapier
POST   /api/integrations/make/webhook       // Webhook Make
POST   /api/integrations/sync/:id           // Sincronizar dados
GET    /api/integrations/:id/logs           // Logs de integração
```

### 6.2 Service Layer

**integrations.service.ts**:
```typescript
import { PrismaClient, Integration } from '@prisma/client';
import axios from 'axios';

export interface CreateIntegrationDTO {
  name: string;
  type: 'ZAPIER' | 'MAKE' | 'GOOGLE_ANALYTICS' | 'FACEBOOK_ADS' | 'HUBSPOT' | 'PIPEDRIVE' | 'MAILCHIMP' | 'WEBHOOK';
  config: Record<string, unknown>;
  isActive?: boolean;
}

export class IntegrationsService {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateIntegrationDTO): Promise<Integration> {
    return this.prisma.integration.create({
      data: {
        name: data.name,
        type: data.type,
        config: data.config as any,
        isActive: data.isActive !== false,
      },
    });
  }

  async test(id: string): Promise<{ success: boolean; message: string }> {
    const integration = await this.prisma.integration.findUnique({
      where: { id },
    });

    if (!integration) throw new Error('Integração não encontrada');

    try {
      switch (integration.type) {
        case 'WEBHOOK':
          const config = integration.config as any;
          const response = await axios.post(config.url, {
            test: true,
            timestamp: new Date().toISOString(),
          });
          return {
            success: response.status === 200,
            message: 'Webhook testado com sucesso',
          };

        case 'HUBSPOT':
          // Testar API do HubSpot
          return { success: true, message: 'Conexão com HubSpot OK' };

        default:
          return { success: true, message: 'Integração ativa' };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  async sync(id: string): Promise<{ synced: number }> {
    const integration = await this.prisma.integration.findUnique({
      where: { id },
    });

    if (!integration) throw new Error('Integração não encontrada');

    // Implementar sincronização baseada no tipo
    let synced = 0;

    switch (integration.type) {
      case 'HUBSPOT':
        synced = await this.syncHubSpot(integration.config as any);
        break;

      case 'PIPEDRIVE':
        synced = await this.syncPipedrive(integration.config as any);
        break;

      default:
        throw new Error('Tipo de integração não suporta sincronização');
    }

    // Registrar log
    await this.prisma.integrationLog.create({
      data: {
        integrationId: id,
        action: 'SYNC',
        success: true,
        recordsAffected: synced,
      },
    });

    return { synced };
  }

  private async syncHubSpot(config: any): Promise<number> {
    // Implementar sincronização com HubSpot
    return 0;
  }

  private async syncPipedrive(config: any): Promise<number> {
    // Implementar sincronização com Pipedrive
    return 0;
  }
}
```

---

## ✅ CHECKLIST COMPLETO

### Pipeline/CRM
- [ ] Implementar service completo
- [ ] Criar controller e routes
- [ ] Implementar cálculo de estatísticas
- [ ] Testes unitários e integração

### Comunicações
- [ ] Integrar WhatsApp Business API
- [ ] Integrar SendGrid/SMTP
- [ ] Integrar Twilio SMS
- [ ] Implementar sistema de templates
- [ ] Webhooks de status
- [ ] Testes de integração

### Automações
- [ ] Motor de automação
- [ ] Sistema de triggers
- [ ] Avaliador de condições
- [ ] Executor de ações
- [ ] Histórico e logs
- [ ] Testes end-to-end

### Relatórios
- [ ] Geradores de relatórios (JSON, CSV, Excel, PDF)
- [ ] Analytics (funil, cohort, performance)
- [ ] Agendamento
- [ ] Testes de geração

### Dashboard
- [ ] Métricas em tempo real
- [ ] Widgets configuráveis
- [ ] Cache de métricas
- [ ] Testes de performance

### Integrações
- [ ] Webhooks genéricos
- [ ] Zapier integration
- [ ] Make integration
- [ ] Testes de cada integração

---

**Última atualização**: 2025-10-10
**Status**: Documentação completa - Pronta para implementação
