# ✅ API Externa v1.0 - Deploy Automático Configurado

## 🎉 Status: PRONTO PARA DEPLOY

Tudo está implementado e configurado. Agora quando você fizer **`git push origin main`**, o sistema irá:

---

## 🚀 O que acontece automaticamente no deploy:

### 1. Build (GitHub Actions)
```
✅ Compila TypeScript
✅ Build React + Vite
✅ Gera Prisma Client (com novos modelos)
✅ Cria imagem Docker
```

### 2. Deploy na VPS (72.60.10.108:3050)
```
✅ Envia código
✅ Extrai aplicação
✅ Valida estrutura monorepo
✅ Inicia container Docker
```

### 3. **Migrations Automáticas** (NOVO!)
```bash
# Executado automaticamente dentro do container:
npx prisma migrate deploy

# Cria 5 novas tabelas:
✅ api_keys
✅ api_usage_logs
✅ webhooks
✅ webhook_deliveries
✅ event_logs
```

### 4. Validações Automáticas
```
✅ Container rodando?
✅ Health check passou?
✅ Swagger UI acessível?
✅ OpenAPI spec disponível?
✅ 5 tabelas criadas no banco?
✅ Logs sem erros?
```

### 5. Endpoints Disponíveis
```
✅ http://72.60.10.108:3050/api-docs (Swagger UI)
✅ http://72.60.10.108:3050/api/openapi.json (OpenAPI Spec)
✅ http://72.60.10.108:3050/api/api-keys (Gerenciar API Keys)
✅ http://72.60.10.108:3050/api/v1/external/leads (API Externa)
✅ http://72.60.10.108:3050/api/v1/external/webhooks (Webhooks)
✅ http://72.60.10.108:3050/api/v1/external/batch (Batch Ops)
```

---

## 📝 Como fazer deploy:

### Opção 1: Push Automático (Recomendado)
```bash
git push origin main
```

**Isso vai:**
1. Disparar GitHub Actions automaticamente
2. Build + Deploy + Migrations
3. Em ~5 minutos está no ar
4. Você recebe notificação de sucesso/erro

### Opção 2: Deploy Manual
```bash
# Ir para: https://github.com/seu-usuario/ferraco/actions
# Clicar: "🚀 Deploy Ferraco CRM - Full Stack"
# Clicar: "Run workflow"
# Selecionar: main
# Clicar: "Run workflow"
```

---

## ✅ Checklist Pós-Deploy

Após o push, verifique:

1. **GitHub Actions passou?**
   - Acesse: https://github.com/seu-usuario/ferraco/actions
   - Última execução deve ter ✅ verde

2. **Swagger UI acessível?**
   ```bash
   curl http://72.60.10.108:3050/api-docs
   # Status: 200 OK
   ```

3. **Tabelas criadas?**
   - O workflow mostra no log:
   ```
   ✅ Todas as 5 tabelas da API Externa existem
   ```

4. **Frontend funcionando?**
   - Abra: http://72.60.10.108:3050
   - Faça login
   - Verifique dashboard

---

## 🔑 Primeiro Uso da API Externa

### 1. Login no Sistema
```bash
curl -X POST http://72.60.10.108:3050/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ferraco.com",
    "password": "sua-senha"
  }'
```

### 2. Criar API Key
```bash
curl -X POST http://72.60.10.108:3050/api/api-keys \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sistema Externo",
    "scopes": ["leads:read", "leads:write", "webhooks:manage"]
  }'

# ⚠️ SALVAR "key" e "secret" da resposta!
```

### 3. Testar API Externa
```bash
curl http://72.60.10.108:3050/api/v1/external/leads \
  -H "X-API-Key: pk_live_..." \
  -H "X-API-Secret: sk_live_..."
```

### 4. Acessar Documentação Interativa
```
Abrir no navegador:
http://72.60.10.108:3050/api-docs

- Testar endpoints
- Ver exemplos
- Gerar código
```

---

## 📚 Documentação Completa

- **[API_EXTERNA.md](apps/backend/API_EXTERNA.md)** - Guia completo do desenvolvedor
- **[DEPLOY_API_EXTERNA.md](DEPLOY_API_EXTERNA.md)** - Como fazer deploy
- **[IMPLEMENTACAO_API_EXTERNA.md](apps/backend/IMPLEMENTACAO_API_EXTERNA.md)** - Resumo técnico

---

## 🔧 Troubleshooting

### Deploy falhou?

**1. Ver logs do GitHub Actions:**
```
https://github.com/seu-usuario/ferraco/actions
> Clicar na última execução
> Ver qual step falhou
```

**2. SSH na VPS e verificar:**
```bash
ssh root@72.60.10.108

# Ver logs do container
docker logs ferraco-crm-vps --tail 100

# Ver se container está rodando
docker ps | grep ferraco

# Verificar tabelas
docker exec ferraco-crm-vps sh -c "cd /app/backend && npx prisma db execute --stdin" <<'SQL'
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
SQL
```

**3. Aplicar migrations manualmente (se necessário):**
```bash
docker exec ferraco-crm-vps sh -c "cd /app/backend && npx prisma migrate deploy"
```

---

## 📊 O que foi implementado:

### Backend
- ✅ 23 novos arquivos TypeScript
- ✅ 5 novas tabelas no banco
- ✅ 30+ endpoints da API Externa
- ✅ Sistema de API Keys completo
- ✅ Webhooks com retry automático
- ✅ Batch operations (até 100 ops)
- ✅ Swagger/OpenAPI 3.0
- ✅ Event emitters
- ✅ Rate limiting por API key
- ✅ Analytics de uso

### Deploy Automático
- ✅ Migrations automáticas
- ✅ Validação de tabelas
- ✅ Verificação de Swagger
- ✅ Health checks
- ✅ Logs detalhados

### Documentação
- ✅ README completo
- ✅ Guia do desenvolvedor
- ✅ Exemplos de código
- ✅ Troubleshooting

---

## 🎯 Próximo Passo:

```bash
# Fazer push para disparar deploy
git push origin main

# Aguardar ~5 minutos

# Acessar e testar
http://72.60.10.108:3050/api-docs
```

---

**Status**: ✅ Pronto para deploy
**Ação necessária**: Apenas `git push origin main`
**Tempo estimado**: 5 minutos
**Resultado**: API Externa v1.0 funcionando em produção
