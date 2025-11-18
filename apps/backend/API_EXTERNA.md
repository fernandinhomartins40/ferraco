# Ferraco CRM - API Externa v1.0

## 📋 Visão Geral

A API Externa do Ferraco CRM permite que aplicações de terceiros integrem-se perfeitamente com o sistema CRM, possibilitando automações, sincronização de dados e construção de aplicações customizadas.

### Características Principais

- ✅ **Autenticação Dual**: Suporte para JWT (usuários) e API Keys (aplicações)
- ✅ **Webhooks em Tempo Real**: Notificações instantâneas de eventos
- ✅ **Operações em Lote**: Execute até 100 operações em uma única requisição
- ✅ **Rate Limiting Configurável**: Controle de uso por API Key
- ✅ **Documentação Interativa**: Swagger UI disponível em `/api-docs`
- ✅ **Versionamento**: API versionada (v1) para compatibilidade futura
- ✅ **Auditoria Completa**: Logs detalhados de todas as operações
- ✅ **Retry Automático**: Webhooks com retry exponencial

---

## 🚀 Quick Start

### 1. Criar API Key

```bash
POST /api/api-keys
Authorization: Bearer <seu-jwt-token>

{
  "name": "Minha Integração",
  "scopes": ["leads:read", "leads:write", "communications:write"],
  "rateLimitPerHour": 1000,
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "clx123456789",
    "name": "Minha Integração",
    "key": "pk_live_abc123def456ghi789jkl012",
    "secret": "sk_live_xyz987wvu654tsr321qpo210",
    "scopes": ["leads:read", "leads:write", "communications:write"],
    "rateLimitPerHour": 1000,
    "createdAt": "2025-11-18T10:30:00Z"
  },
  "message": "API Key created successfully. Save the secret - it will not be shown again!"
}
```

⚠️ **IMPORTANTE**: Salve o `secret` imediatamente! Ele não será exibido novamente.

### 2. Autenticar Requisições

**Método 1: Headers Separados** (Recomendado)
```bash
GET /api/v1/external/leads
X-API-Key: pk_live_abc123def456ghi789jkl012
X-API-Secret: sk_live_xyz987wvu654tsr321qpo210
```

**Método 2: Authorization Header**
```bash
GET /api/v1/external/leads
Authorization: Bearer pk_live_abc123def456ghi789jkl012:sk_live_xyz987wvu654tsr321qpo210
```

### 3. Fazer sua Primeira Requisição

```javascript
// Node.js / JavaScript
const axios = require('axios');

const apiKey = 'pk_live_abc123def456ghi789jkl012';
const apiSecret = 'sk_live_xyz987wvu654tsr321qpo210';

const response = await axios.get('https://api.ferraco.com/api/v1/external/leads', {
  headers: {
    'X-API-Key': apiKey,
    'X-API-Secret': apiSecret,
  },
});

console.log(response.data);
```

```python
# Python
import requests

api_key = 'pk_live_abc123def456ghi789jkl012'
api_secret = 'sk_live_xyz987wvu654tsr321qpo210'

response = requests.get(
    'https://api.ferraco.com/api/v1/external/leads',
    headers={
        'X-API-Key': api_key,
        'X-API-Secret': api_secret,
    }
)

print(response.json())
```

```bash
# cURL
curl -X GET https://api.ferraco.com/api/v1/external/leads \
  -H "X-API-Key: pk_live_abc123def456ghi789jkl012" \
  -H "X-API-Secret: sk_live_xyz987wvu654tsr321qpo210"
```

---

## 📚 Endpoints Disponíveis

### Leads

#### Listar Leads
```
GET /api/v1/external/leads?page=1&limit=20&status=NOVO
```

**Parâmetros de Query:**
- `page` (int): Página (default: 1)
- `limit` (int): Itens por página (default: 20, max: 100)
- `status` (string): Filtrar por status (NOVO, QUALIFICADO, EM_ANDAMENTO, etc.)
- `priority` (string): Filtrar por prioridade (LOW, MEDIUM, HIGH, URGENT)
- `search` (string): Buscar por nome, email ou telefone
- `tags` (string): Filtrar por tags (separadas por vírgula)

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx123",
      "name": "João Silva",
      "email": "joao@example.com",
      "phone": "+5511999999999",
      "status": "NOVO",
      "priority": "MEDIUM",
      "leadScore": 75,
      "createdAt": "2025-11-18T10:00:00Z"
    }
  ],
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
```

#### Criar Lead
```
POST /api/v1/external/leads
```

**Body:**
```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "phone": "+5511999999999",
  "company": "Empresa XYZ",
  "position": "Gerente de TI",
  "source": "API",
  "priority": "HIGH",
  "customFields": {
    "budget": "R$ 50.000",
    "industry": "Tecnologia"
  }
}
```

#### Atualizar Lead
```
PUT /api/v1/external/leads/:id
```

#### Buscar Lead
```
GET /api/v1/external/leads/:id
```

#### Deletar Lead
```
DELETE /api/v1/external/leads/:id
```

#### Importar Leads
```
POST /api/v1/external/leads/import
Content-Type: multipart/form-data
```

#### Exportar Leads
```
GET /api/v1/external/leads/export?format=csv
```

### Comunicações

#### Enviar WhatsApp
```
POST /api/v1/external/communications/whatsapp
```

**Body:**
```json
{
  "leadId": "clx123",
  "to": "+5511999999999",
  "message": "Olá! Tudo bem?"
}
```

#### Enviar Email
```
POST /api/v1/external/communications/email
```

**Body:**
```json
{
  "leadId": "clx123",
  "to": "joao@example.com",
  "subject": "Proposta Comercial",
  "body": "<h1>Sua proposta está pronta!</h1>"
}
```

#### Enviar SMS
```
POST /api/v1/external/communications/sms
```

#### Histórico de Comunicações
```
GET /api/v1/external/communications/history/:leadId
```

### Tags

#### Listar Tags
```
GET /api/v1/external/tags
```

#### Criar Tag
```
POST /api/v1/external/tags
```

**Body:**
```json
{
  "name": "Cliente Premium",
  "color": "#FF5733",
  "description": "Clientes com alto valor"
}
```

### Automações

#### Listar Automações
```
GET /api/v1/external/automations
```

#### Executar Automação
```
POST /api/v1/external/automations/:id/execute
```

**Body:**
```json
{
  "leadId": "clx123",
  "variables": {
    "nome": "João",
    "produto": "CRM Premium"
  }
}
```

---

## 🔔 Webhooks

### Criar Webhook

```
POST /api/v1/external/webhooks
```

**Body:**
```json
{
  "name": "Meu Webhook",
  "url": "https://meusite.com/webhook",
  "events": [
    "lead.created",
    "lead.updated",
    "communication.sent",
    "whatsapp.message_received"
  ],
  "maxRetries": 3,
  "retryDelay": 60000
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "webhook_123",
    "url": "https://meusite.com/webhook",
    "events": ["lead.created", "lead.updated"],
    "secret": "whsec_abc123xyz789...",
    "status": "ACTIVE"
  },
  "message": "Webhook created successfully. Save the secret - it will not be shown again!"
}
```

### Eventos Disponíveis

| Evento | Descrição |
|--------|-----------|
| `lead.created` | Lead criado |
| `lead.updated` | Lead atualizado |
| `lead.status_changed` | Status do lead alterado |
| `lead.deleted` | Lead deletado |
| `communication.sent` | Comunicação enviada com sucesso |
| `communication.failed` | Falha no envio de comunicação |
| `whatsapp.message_received` | Mensagem WhatsApp recebida |
| `whatsapp.message_sent` | Mensagem WhatsApp enviada |
| `automation.executed` | Automação executada |
| `automation.failed` | Falha na execução de automação |

### Payload do Webhook

```json
{
  "event": "lead.created",
  "timestamp": "2025-11-18T10:30:00Z",
  "data": {
    "id": "clx123",
    "name": "João Silva",
    "email": "joao@example.com",
    "status": "NOVO"
  },
  "metadata": {
    "leadId": "clx123",
    "userId": "user_456"
  }
}
```

### Verificar Assinatura

Todos os webhooks incluem um header `X-Webhook-Signature` com HMAC-SHA256:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return signature === expectedSignature;
}

// No seu endpoint
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = JSON.stringify(req.body);

  if (!verifyWebhook(payload, signature, 'whsec_abc123xyz789...')) {
    return res.status(401).send('Invalid signature');
  }

  // Processar evento
  console.log('Evento recebido:', req.body.event);
  res.status(200).send('OK');
});
```

### Gerenciar Webhooks

```
GET    /api/v1/external/webhooks          # Listar
GET    /api/v1/external/webhooks/:id      # Buscar
PUT    /api/v1/external/webhooks/:id      # Atualizar
DELETE /api/v1/external/webhooks/:id      # Deletar
POST   /api/v1/external/webhooks/:id/pause   # Pausar
POST   /api/v1/external/webhooks/:id/activate # Ativar
POST   /api/v1/external/webhooks/:id/test     # Testar
GET    /api/v1/external/webhooks/:id/deliveries # Histórico
```

---

## 📦 Operações em Lote (Batch)

Execute até 100 operações em uma única requisição:

```
POST /api/v1/external/batch
```

**Body:**
```json
{
  "operations": [
    {
      "id": "op1",
      "method": "POST",
      "path": "/leads",
      "body": {
        "name": "João Silva",
        "email": "joao@example.com"
      }
    },
    {
      "id": "op2",
      "method": "PUT",
      "path": "/leads/clx123",
      "body": {
        "status": "QUALIFICADO"
      }
    },
    {
      "id": "op3",
      "method": "GET",
      "path": "/leads/clx456"
    }
  ],
  "atomic": false,
  "continueOnError": true
}
```

**Resposta:**
```json
{
  "success": true,
  "results": [
    {
      "id": "op1",
      "success": true,
      "statusCode": 201,
      "data": { "id": "clx789", "name": "João Silva" }
    },
    {
      "id": "op2",
      "success": true,
      "statusCode": 200,
      "data": { "id": "clx123", "status": "QUALIFICADO" }
    },
    {
      "id": "op3",
      "success": false,
      "statusCode": 404,
      "error": "Lead not found",
      "code": "LEAD_NOT_FOUND"
    }
  ],
  "summary": {
    "total": 3,
    "successful": 2,
    "failed": 1,
    "executionTime": 250
  }
}
```

**Opções:**
- `atomic`: Se `true`, reverte todas as operações em caso de erro
- `continueOnError`: Se `false`, para na primeira falha

---

## 🔐 Scopes (Permissões)

Cada API Key possui scopes que definem suas permissões:

| Scope | Descrição |
|-------|-----------|
| `leads:read` | Listar e visualizar leads |
| `leads:write` | Criar e atualizar leads |
| `leads:delete` | Deletar leads |
| `communications:read` | Visualizar comunicações |
| `communications:write` | Enviar comunicações |
| `tags:read` | Listar tags |
| `tags:write` | Criar e atualizar tags |
| `tags:delete` | Deletar tags |
| `automations:read` | Listar automações |
| `automations:execute` | Executar automações |
| `webhooks:manage` | Gerenciar webhooks |
| `*:*` | Acesso total (Admin) |

---

## ⚡ Rate Limiting

### Limites Padrão
- **1000 requisições/hora** (configurável por API Key)
- **10.000 requisições/dia** (configurável por API Key)

### Headers de Response
```
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 2025-11-18T11:30:00Z
```

### Quando Exceder o Limite
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "meta": {
    "remaining": 0,
    "resetAt": "2025-11-18T11:30:00Z"
  }
}
```

---

## 📊 Monitoramento e Analytics

### Obter Estatísticas de Uso

```
GET /api/api-keys/:id/usage?periodStart=2025-11-01T00:00:00Z&periodEnd=2025-11-30T23:59:59Z
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "apiKeyId": "clx123",
    "apiKeyName": "Minha Integração",
    "totalRequests": 5432,
    "successfulRequests": 5280,
    "failedRequests": 152,
    "averageResponseTime": 145,
    "lastUsedAt": "2025-11-18T10:30:00Z",
    "periodStart": "2025-11-01T00:00:00Z",
    "periodEnd": "2025-11-30T23:59:59Z"
  }
}
```

---

## 🛡️ Segurança

### Boas Práticas

1. **Nunca exponha seu API Secret**
   - Armazene em variáveis de ambiente
   - Use gestores de secrets (AWS Secrets Manager, Azure Key Vault, etc.)

2. **Rotacione suas chaves regularmente**
   ```
   POST /api/api-keys/:id/rotate
   ```

3. **Use HTTPS sempre**
   - Nunca envie credenciais por HTTP

4. **Configure IP Whitelist** (opcional)
   ```json
   {
     "ipWhitelist": ["203.0.113.0/24", "198.51.100.10"]
   }
   ```

5. **Monitore uso suspeito**
   - Acompanhe logs de uso
   - Configure alertas para padrões anormais

### Revogar API Key

```
POST /api/api-keys/:id/revoke
```

---

## 🐛 Erros Comuns

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Invalid API credentials",
  "code": "INVALID_API_CREDENTIALS"
}
```
**Solução**: Verifique se o API Key e Secret estão corretos.

### 403 Forbidden
```json
{
  "success": false,
  "error": "Missing required scope: leads:write",
  "code": "INSUFFICIENT_SCOPE"
}
```
**Solução**: Sua API Key não possui o scope necessário. Atualize os scopes.

### 429 Rate Limit Exceeded
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED"
}
```
**Solução**: Aguarde o reset do limite ou solicite aumento.

### 404 Not Found
```json
{
  "success": false,
  "error": "Lead not found",
  "code": "LEAD_NOT_FOUND"
}
```
**Solução**: Verifique se o ID do recurso está correto.

---

## 📖 Recursos Adicionais

- **Documentação Interativa**: https://api.ferraco.com/api-docs
- **OpenAPI Spec**: https://api.ferraco.com/api/openapi.json
- **Status da API**: https://status.ferraco.com
- **Suporte**: suporte@ferraco.com
- **GitHub**: https://github.com/ferraco/crm

---

## 🔄 Versionamento

A API utiliza versionamento via URL:
- **v1** (atual): `/api/v1/external/*`
- **v2** (futuro): `/api/v2/external/*`

Mudanças breaking serão introduzidas apenas em novas versões. A v1 será mantida por pelo menos 12 meses após lançamento da v2.

---

## 📝 Changelog

### v1.0.0 (2025-11-18)
- ✨ Lançamento inicial da API Externa
- ✅ Suporte para Leads, Comunicações, Tags, Automações
- ✅ Sistema de Webhooks com retry automático
- ✅ Operações em lote (Batch)
- ✅ Documentação Swagger
- ✅ Rate limiting configurável
- ✅ Auditoria completa

---

Desenvolvido com ❤️ pela equipe Ferraco
