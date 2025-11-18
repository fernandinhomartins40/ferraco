import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../package.json';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ferraco CRM External API',
      version: version || '1.0.0',
      description: `
# Ferraco CRM External API

API externa para integração com o Ferraco CRM. Esta API permite que aplicações de terceiros interajam com o sistema de CRM para gerenciar leads, comunicações, automações e muito mais.

## Autenticação

A API suporta dois métodos de autenticação:

### 1. API Key (Recomendado para integrações)

Utilize o par de chaves API Key + Secret nos headers:

\`\`\`
X-API-Key: pk_live_abc123...
X-API-Secret: sk_live_xyz789...
\`\`\`

Ou no header Authorization:

\`\`\`
Authorization: Bearer pk_live_abc123...:sk_live_xyz789...
\`\`\`

### 2. JWT Bearer Token (Para usuários)

\`\`\`
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

## Scopes (Permissões)

Cada API Key possui scopes que definem as permissões:

- \`leads:read\` - Listar e visualizar leads
- \`leads:write\` - Criar e atualizar leads
- \`leads:delete\` - Deletar leads
- \`communications:read\` - Visualizar comunicações
- \`communications:write\` - Enviar comunicações (WhatsApp, Email, SMS)
- \`tags:read\` - Listar tags
- \`tags:write\` - Criar e atualizar tags
- \`tags:delete\` - Deletar tags
- \`automations:read\` - Listar automações
- \`automations:execute\` - Executar automações
- \`webhooks:manage\` - Gerenciar webhooks
- \`*:*\` - Acesso total (Admin)

## Rate Limiting

- **Default**: 1000 requisições/hora
- **Headers de resposta**:
  - \`X-RateLimit-Remaining\`: Requisições restantes
  - \`X-RateLimit-Reset\`: Timestamp do reset do limite

## Formato de Resposta

Todas as respostas seguem o padrão:

**Sucesso:**
\`\`\`json
{
  "success": true,
  "data": {...},
  "meta": {
    "timestamp": "2025-11-18T10:30:00Z",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
\`\`\`

**Erro:**
\`\`\`json
{
  "success": false,
  "error": "Mensagem de erro",
  "code": "ERROR_CODE",
  "details": {...},
  "meta": {
    "timestamp": "2025-11-18T10:30:00Z"
  }
}
\`\`\`

## Webhooks

Você pode registrar webhooks para receber notificações em tempo real de eventos:

- \`lead.created\` - Lead criado
- \`lead.updated\` - Lead atualizado
- \`lead.status_changed\` - Status do lead alterado
- \`communication.sent\` - Comunicação enviada
- \`whatsapp.message_received\` - Mensagem WhatsApp recebida
- \`automation.executed\` - Automação executada

## Suporte

- **Documentação**: https://docs.ferraco.com
- **GitHub**: https://github.com/ferraco/crm
- **Email**: suporte@ferraco.com
      `,
      contact: {
        name: 'Ferraco CRM Support',
        email: 'suporte@ferraco.com',
      },
      license: {
        name: 'Proprietário',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.ferraco.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API Key (formato: pk_live_xxx). Requer também X-API-Secret header.',
        },
        ApiSecretAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Secret',
          description: 'API Secret (formato: sk_live_xxx). Usado em conjunto com X-API-Key.',
        },
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT ou API_KEY:SECRET',
          description: 'JWT Token ou API Key:Secret no formato Bearer pk_live_xxx:sk_live_xxx',
        },
      },
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                },
              },
            },
            message: {
              type: 'string',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Error message',
            },
            code: {
              type: 'string',
              example: 'ERROR_CODE',
            },
            details: {
              type: 'object',
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                },
              },
            },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              example: 1,
            },
            limit: {
              type: 'integer',
              example: 20,
            },
            total: {
              type: 'integer',
              example: 150,
            },
            totalPages: {
              type: 'integer',
              example: 8,
            },
          },
        },
        Lead: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'clx1234567890',
            },
            name: {
              type: 'string',
              example: 'João Silva',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'joao@example.com',
            },
            phone: {
              type: 'string',
              example: '+5511999999999',
            },
            status: {
              type: 'string',
              enum: ['NOVO', 'QUALIFICADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'PERDIDO', 'ARQUIVADO'],
              example: 'NOVO',
            },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
              example: 'MEDIUM',
            },
            leadScore: {
              type: 'integer',
              example: 75,
            },
            company: {
              type: 'string',
              example: 'Empresa XYZ',
            },
            position: {
              type: 'string',
              example: 'Gerente de TI',
            },
            source: {
              type: 'string',
              enum: ['WEBSITE', 'WHATSAPP', 'FACEBOOK', 'INSTAGRAM', 'MANUAL', 'IMPORT', 'API', 'REFERRAL'],
              example: 'WEBSITE',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        CreateLeadInput: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            name: {
              type: 'string',
              example: 'João Silva',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'joao@example.com',
            },
            phone: {
              type: 'string',
              example: '+5511999999999',
            },
            company: {
              type: 'string',
              example: 'Empresa XYZ',
            },
            position: {
              type: 'string',
              example: 'Gerente de TI',
            },
            source: {
              type: 'string',
              enum: ['WEBSITE', 'WHATSAPP', 'FACEBOOK', 'INSTAGRAM', 'MANUAL', 'IMPORT', 'API', 'REFERRAL'],
              example: 'API',
            },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
              example: 'MEDIUM',
            },
          },
        },
        Tag: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            name: {
              type: 'string',
              example: 'Cliente Premium',
            },
            color: {
              type: 'string',
              example: '#FF5733',
            },
            isSystem: {
              type: 'boolean',
              example: false,
            },
          },
        },
        Webhook: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            url: {
              type: 'string',
              format: 'uri',
              example: 'https://example.com/webhook',
            },
            events: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['lead.created', 'lead.updated'],
            },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'PAUSED', 'FAILED'],
              example: 'ACTIVE',
            },
            secret: {
              type: 'string',
              description: 'Secret usado para assinar payloads (HMAC-SHA256)',
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Credenciais inválidas ou ausentes',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                error: 'Invalid API credentials',
                code: 'INVALID_API_CREDENTIALS',
                meta: {
                  timestamp: '2025-11-18T10:30:00Z',
                },
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Permissão insuficiente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                error: 'Missing required scope: leads:write',
                code: 'INSUFFICIENT_SCOPE',
                meta: {
                  timestamp: '2025-11-18T10:30:00Z',
                },
              },
            },
          },
        },
        RateLimitError: {
          description: 'Limite de requisições excedido',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                error: 'Rate limit exceeded',
                code: 'RATE_LIMIT_EXCEEDED',
                meta: {
                  timestamp: '2025-11-18T10:30:00Z',
                  remaining: 0,
                  resetAt: '2025-11-18T11:30:00Z',
                },
              },
            },
          },
        },
        NotFoundError: {
          description: 'Recurso não encontrado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                error: 'Lead not found',
                code: 'LEAD_NOT_FOUND',
                meta: {
                  timestamp: '2025-11-18T10:30:00Z',
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
      {
        ApiKeyAuth: [],
        ApiSecretAuth: [],
      },
    ],
    tags: [
      {
        name: 'API Keys',
        description: 'Gerenciamento de chaves de API',
      },
      {
        name: 'Leads',
        description: 'Operações com leads',
      },
      {
        name: 'Communications',
        description: 'Envio de comunicações (WhatsApp, Email, SMS)',
      },
      {
        name: 'Tags',
        description: 'Gerenciamento de tags',
      },
      {
        name: 'Automations',
        description: 'Automações e workflows',
      },
      {
        name: 'Webhooks',
        description: 'Webhooks e eventos',
      },
      {
        name: 'Batch Operations',
        description: 'Operações em lote',
      },
    ],
  },
  apis: [
    './src/modules/external/*.ts',
    './src/modules/api-keys/*.ts',
    './src/modules/webhooks/*.ts',
    './src/modules/batch/*.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
