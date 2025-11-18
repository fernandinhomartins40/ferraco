# ✅ Deploy Automático - API Externa v1.0

## 🎯 O que o GitHub Actions faz automaticamente

Quando você fizer **`git push`** para a branch `main`, o workflow [.github/workflows/deploy-vps.yml](.github/workflows/deploy-vps.yml) irá:

### 1️⃣ Build da Aplicação
- ✅ Compila TypeScript (backend + frontend)
- ✅ Gera Prisma Client com novos modelos
- ✅ Build do React (Vite)
- ✅ Cria imagem Docker única

### 2️⃣ Deploy na VPS
- ✅ Envia código para VPS (72.60.10.108)
- ✅ Extrai e valida estrutura monorepo
- ✅ Inicia container Docker

### 3️⃣ **Migrations Automáticas da API Externa** 🆕
```bash
# Executado automaticamente no container:
npx prisma migrate deploy   # Aplica todas migrations
npx prisma generate          # Gera Prisma Client atualizado
```

**Tabelas criadas automaticamente:**
- ✅ `api_keys` - Chaves de API
- ✅ `api_usage_logs` - Logs de uso
- ✅ `webhooks` - Webhooks registrados
- ✅ `webhook_deliveries` - Histórico de entregas
- ✅ `event_logs` - Eventos do sistema

### 4️⃣ Validação Automática

O workflow verifica:
- ✅ Container rodando
- ✅ Health check respondendo
- ✅ Swagger UI acessível (`/api-docs`)
- ✅ OpenAPI spec disponível (`/api/openapi.json`)
- ✅ **5 novas tabelas da API Externa criadas**
- ✅ Backend logs sem erros

### 5️⃣ Endpoints Disponíveis Após Deploy

#### API Externa v1.0
```
GET  /api-docs                           # Swagger UI
GET  /api/openapi.json                   # OpenAPI Spec

# API Keys
POST /api/api-keys                       # Criar API Key
GET  /api/api-keys                       # Listar API Keys
GET  /api/api-keys/:id                   # Buscar API Key
PUT  /api/api-keys/:id                   # Atualizar API Key
POST /api/api-keys/:id/revoke            # Revogar API Key
POST /api/api-keys/:id/rotate            # Rotacionar API Key

# External API
GET  /api/v1/external/leads              # Listar leads
POST /api/v1/external/leads              # Criar lead
GET  /api/v1/external/leads/:id          # Buscar lead
PUT  /api/v1/external/leads/:id          # Atualizar lead
DELETE /api/v1/external/leads/:id        # Deletar lead

# Webhooks
POST /api/v1/external/webhooks           # Criar webhook
GET  /api/v1/external/webhooks           # Listar webhooks
GET  /api/v1/external/webhooks/:id       # Buscar webhook
PUT  /api/v1/external/webhooks/:id       # Atualizar webhook
DELETE /api/v1/external/webhooks/:id     # Deletar webhook
POST /api/v1/external/webhooks/:id/test  # Testar webhook

# Batch Operations
POST /api/v1/external/batch              # Executar operações em lote
```

---

## 🚀 Como Fazer Deploy

### Opção 1: Push Automático (Recomendado)

```bash
# 1. Commitar mudanças
git add .
git commit -m "feat: API Externa v1.0 implementada"

# 2. Push para main (dispara deploy automaticamente)
git push origin main

# 3. Acompanhar deploy
# Acesse: https://github.com/seu-usuario/ferraco/actions
```

### Opção 2: Deploy Manual

```bash
# Ir para Actions no GitHub
# Clicar em "🚀 Deploy Ferraco CRM - Full Stack"
# Clicar em "Run workflow"
# Selecionar branch: main
# Clicar em "Run workflow"
```

---

## 📊 Logs de Deploy

Durante o deploy, você verá:

```
========================================
🚀 FERRACO CRM - Deploy Full Stack
========================================
📦 Commit: abc123...
🌿 Branch: main
👤 Actor: seu-usuario
🕐 Timestamp: 2025-11-18 10:30:00
========================================

🏗️  Building imagem Docker...
✅ Build concluído

🚀 Iniciando aplicação...
✅ Container iniciado

🗄️  Aplicando migrations da API Externa...
✅ Migration: api_keys
✅ Migration: api_usage_logs
✅ Migration: webhooks
✅ Migration: webhook_deliveries
✅ Migration: event_logs
✅ Migrations aplicadas com sucesso!

🔄 Gerando Prisma Client...
✅ Prisma Client gerado

✅ Verificando novas tabelas da API Externa...
  api_keys
  api_usage_logs
  event_logs
  webhook_deliveries
  webhooks
✅ Todas as 5 tabelas da API Externa existem

🩺 Health check OK!
✅ DEPLOY CONCLUÍDO COM SUCESSO!
```

---

## 🔍 Verificação Pós-Deploy

O workflow executa verificações automáticas:

### 1. Containers Docker
```bash
docker ps --filter "name=ferraco"
# Deve mostrar: ferraco-crm-vps (RUNNING)
```

### 2. Swagger UI
```bash
curl http://72.60.10.108:3050/api-docs
# Status: 200 OK
```

### 3. OpenAPI Spec
```bash
curl http://72.60.10.108:3050/api/openapi.json
# Retorna JSON com spec completa
```

### 4. Tabelas no Banco
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('api_keys', 'api_usage_logs', 'webhooks', 'webhook_deliveries', 'event_logs');

-- Resultado:
--  api_keys
--  api_usage_logs
--  event_logs
--  webhook_deliveries
--  webhooks
```

---

## 🔐 Primeiro Uso da API Externa

### 1. Fazer Login

```bash
curl -X POST http://72.60.10.108:3050/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ferraco.com",
    "password": "sua-senha"
  }'

# Copiar o "accessToken" da resposta
```

### 2. Criar API Key

```bash
curl -X POST http://72.60.10.108:3050/api/api-keys \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Produção - Sistema Externo",
    "scopes": ["leads:read", "leads:write", "webhooks:manage"],
    "rateLimitPerHour": 5000,
    "rateLimitPerDay": 50000
  }'

# IMPORTANTE: Salvar "key" e "secret" da resposta!
# O secret NÃO será mostrado novamente!
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "clx123...",
    "name": "Produção - Sistema Externo",
    "key": "pk_live_abc123def456...",
    "secret": "sk_live_xyz789uvw012...",
    "scopes": ["leads:read", "leads:write", "webhooks:manage"],
    "rateLimitPerHour": 5000,
    "rateLimitPerDay": 50000,
    "createdAt": "2025-11-18T10:30:00Z"
  },
  "message": "API Key created successfully. Save the secret - it will not be shown again!"
}
```

### 3. Testar API Externa

```bash
# Usar API Key criada
curl http://72.60.10.108:3050/api/v1/external/leads \
  -H "X-API-Key: pk_live_abc123def456..." \
  -H "X-API-Secret: sk_live_xyz789uvw012..."
```

### 4. Criar Webhook

```bash
curl -X POST http://72.60.10.108:3050/api/v1/external/webhooks \
  -H "X-API-Key: pk_live_abc123def456..." \
  -H "X-API-Secret: sk_live_xyz789uvw012..." \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://seu-sistema.com/webhook",
    "events": ["lead.created", "lead.updated"],
    "name": "Webhook Sistema Externo"
  }'
```

---

## 🎯 URLs de Acesso (Produção)

Após o deploy, acesse:

| Recurso | URL |
|---------|-----|
| **Aplicação** | http://72.60.10.108:3050 |
| **API Backend** | http://72.60.10.108:3050/api |
| **Health Check** | http://72.60.10.108:3050/health |
| **Swagger UI** | http://72.60.10.108:3050/api-docs |
| **OpenAPI Spec** | http://72.60.10.108:3050/api/openapi.json |
| **API Keys** | http://72.60.10.108:3050/api/api-keys |
| **External Leads** | http://72.60.10.108:3050/api/v1/external/leads |
| **Webhooks** | http://72.60.10.108:3050/api/v1/external/webhooks |

---

## 🐛 Troubleshooting

### Erro: "Migrations failed"

O deploy retenta automaticamente. Se persistir:

```bash
# SSH na VPS
ssh root@72.60.10.108

# Verificar logs
docker logs ferraco-crm-vps

# Aplicar migrations manualmente
docker exec ferraco-crm-vps sh -c "cd /app/backend && npx prisma migrate deploy"
```

### Erro: "Health check não passou"

```bash
# SSH na VPS
ssh root@72.60.10.108

# Ver logs completos
docker logs ferraco-crm-vps --tail 100

# Reiniciar container
cd /root/ferraco-crm
docker compose -f docker-compose.vps.yml restart
```

### Swagger não acessível

```bash
# Verificar se rota existe
docker exec ferraco-crm-vps sh -c "curl -s http://localhost:3001/api-docs"

# Verificar logs de startup
docker logs ferraco-crm-vps | grep -i swagger
```

### Tabelas não criadas

```bash
# Verificar banco de dados
docker exec ferraco-crm-vps sh -c "cd /app/backend && npx prisma db execute --stdin" <<'SQL'
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
SQL

# Forçar migrations
docker exec ferraco-crm-vps sh -c "cd /app/backend && npx prisma migrate deploy --force"
```

---

## ✅ Checklist de Sucesso

Após o deploy, verifique:

- [ ] GitHub Actions passou com ✅
- [ ] Container `ferraco-crm-vps` está rodando
- [ ] Health check retorna 200: `curl http://72.60.10.108:3050/health`
- [ ] Swagger UI acessível: http://72.60.10.108:3050/api-docs
- [ ] OpenAPI spec acessível: http://72.60.10.108:3050/api/openapi.json
- [ ] 5 novas tabelas criadas no banco
- [ ] Login no frontend funciona
- [ ] API Key pode ser criada via /api/api-keys
- [ ] External API responde com API Key

---

## 📝 Resumo

### O que você NÃO precisa fazer manualmente:

❌ Rodar migrations
❌ Configurar banco de dados
❌ Criar tabelas
❌ Instalar dependências
❌ Build da aplicação
❌ Configurar Swagger

### O que o GitHub Actions faz automaticamente:

✅ Tudo acima
✅ Deploy completo
✅ Validação de saúde
✅ Verificação de tabelas
✅ Logs de sucesso/erro

### Você só precisa:

1. ✅ Fazer `git push origin main`
2. ✅ Aguardar ~5 minutos
3. ✅ Acessar http://72.60.10.108:3050/api-docs
4. ✅ Começar a usar! 🎉

---

**Status**: ✅ Deploy 100% Automatizado
**Última atualização**: 18/11/2025
**Versão**: API Externa v1.0
