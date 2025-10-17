# Auditoria: Remoção Segura de WPPConnect e WAHA

**Data:** 2025-10-17
**Status Deploy Atual:** ✅ Funcionando (commit 18efb5e)
**API WhatsApp Ativa:** Evolution API v2.1.1

---

## 1. ANÁLISE DE DEPENDÊNCIAS

### 1.1 Evolution API (✅ MANTER - É nossa API principal)
**Arquivos ativos:**
- `apps/backend/src/services/evolutionService.ts` - Serviço principal
- `apps/backend/src/routes/whatsapp.routes.ts` - Rotas principais (/qr, /status, /send)
- `apps/backend/src/routes/evolutionWebhooks.ts` - Recebe webhooks
- `apps/backend/src/routes/evolutionApi.routes.ts` - API REST adicional
- `apps/backend/src/server.ts` - Inicializa Evolution API

**Container:** `ferraco-evolution` (imagem: `atendai/evolution-api:v2.1.1`)

---

### 1.2 WPPConnect (❌ REMOVER - Código legado não utilizado)

**Dependência no package.json:**
```json
"@wppconnect-team/wppconnect": "^1.37.5",
"sharp": "^0.34.4"  // Dependência do WPPConnect
```

**Arquivos que usam WPPConnect:**
1. ❌ `apps/backend/src/services/whatsappService.ts` - Serviço WPPConnect
2. ❌ `apps/backend/src/services/whatsappServiceExtended.ts` - 88 funcionalidades extras
3. ❌ `apps/backend/src/services/whatsappListeners.ts` - Event listeners
4. ❌ `apps/backend/src/routes/whatsappExtended.routes.ts` - Rotas REST estendidas
5. ❌ `apps/backend/src/modules/whatsapp-bot/whatsapp-bot.service.ts` - Bot service

**Arquivos que IMPORTAM whatsappService:**
1. ⚠️  `apps/backend/src/services/whatsappAutomation.service.ts` (linha 9)
2. ⚠️  `apps/backend/src/services/automationScheduler.service.ts` (linha 3)

**Registrado no app.ts:**
```typescript
// Linha 30-31
import whatsappExtendedRoutes from './routes/whatsappExtended.routes';
app.use(`${API_PREFIX}/whatsapp/extended`, whatsappExtendedRoutes);
```

---

### 1.3 WAHA (❌ REMOVER - Código legado não utilizado)

**Arquivos que usam WAHA:**
1. ❌ `apps/backend/src/services/wahaService.ts` - Serviço WAHA
2. ❌ `apps/backend/src/routes/wahaWebhooks.ts` - Webhooks WAHA
3. ⚠️  `apps/backend/src/services/whatsappChatService.ts` - Importa wahaService (linha 10)

---

## 2. ANÁLISE DE IMPACTO

### 2.1 Serviços que DEPENDEM de WPPConnect

#### ⚠️ CRÍTICO: `whatsappAutomation.service.ts`
**Função:** Envia informações de produtos via WhatsApp após captação de leads
**Uso atual:** `whatsappService` (WPPConnect)
**Solução:** Migrar para `evolutionService`

**Métodos usados:**
- `whatsappService.isWhatsAppConnected()` → `evolutionService.getConnectionStatus().isConnected`
- `whatsappService.sendText()` → `evolutionService.sendText()`
- `whatsappService.sendImage()` → `evolutionService.sendMedia()`

#### ⚠️ CRÍTICO: `automationScheduler.service.ts`
**Função:** Processa automações de Kanban e envia mensagens programadas
**Uso atual:** `whatsappService` (WPPConnect)
**Solução:** Migrar para `evolutionService`

**Métodos usados:**
- `whatsappService.isWhatsAppConnected()`
- `whatsappService.sendText()`

---

### 2.2 Serviços que DEPENDEM de WAHA

#### ⚠️ CRÍTICO: `whatsappChatService.ts`
**Função:** Sincroniza mensagens e gerencia conversas
**Uso atual:** `wahaService` (linha 10)
**Status:** Import presente mas **NUNCA USADO** no código

**Análise do código:**
- Linha 10: `import wahaService from './wahaService';`
- **NENHUMA chamada** a `wahaService` em todo o arquivo
- Todos os métodos trabalham com `prisma` diretamente

**Solução:** Remover import (não quebra nada)

---

## 3. ROTAS AFETADAS

### 3.1 Rotas que serão REMOVIDAS
❌ `/api/whatsapp/extended/*` - 88 funcionalidades WPPConnect (não usadas)

### 3.2 Rotas que PERMANECEM FUNCIONANDO
✅ `/api/whatsapp/qr` - Evolution API
✅ `/api/whatsapp/status` - Evolution API
✅ `/api/whatsapp/send` - Evolution API
✅ `/api/whatsapp/account` - Evolution API
✅ `/api/whatsapp/disconnect` - Evolution API
✅ `/api/whatsapp/conversations` - whatsappChatService (sem WAHA)
✅ `/webhooks/evolution` - Evolution webhooks

---

## 4. PLANO DE REMOÇÃO SEGURA

### FASE 1: Migrar Automações (OBRIGATÓRIO)
**Objetivo:** Garantir que automações funcionem com Evolution API

1. **Migrar `whatsappAutomation.service.ts`:**
   - Substituir `whatsappService` por `evolutionService`
   - Mapear métodos: `sendText()`, `sendImage()`, `sendVideo()`
   - Testar envio de produtos em ambiente local

2. **Migrar `automationScheduler.service.ts`:**
   - Substituir `whatsappService` por `evolutionService`
   - Validar envio de mensagens agendadas

**Critério de sucesso:** Automações enviando via Evolution API

---

### FASE 2: Remover WAHA (FÁCIL - Sem impacto)
**Objetivo:** Remover código WAHA que não é usado

3. **Remover import não utilizado:**
   - Editar `whatsappChatService.ts` (linha 10)
   - Remover: `import wahaService from './wahaService';`

4. **Deletar arquivos WAHA:**
   - ❌ `apps/backend/src/services/wahaService.ts`
   - ❌ `apps/backend/src/routes/wahaWebhooks.ts`

**Critério de sucesso:** Build TypeScript sem erros

---

### FASE 3: Remover WPPConnect (APÓS FASE 1)
**Objetivo:** Remover código WPPConnect após migração completa

5. **Remover rotas do app.ts:**
   - Linha 30: `import whatsappExtendedRoutes from './routes/whatsappExtended.routes';`
   - Linha 91: `app.use('${API_PREFIX}/whatsapp/extended', whatsappExtendedRoutes);`

6. **Deletar arquivos WPPConnect:**
   - ❌ `apps/backend/src/services/whatsappService.ts`
   - ❌ `apps/backend/src/services/whatsappServiceExtended.ts`
   - ❌ `apps/backend/src/services/whatsappListeners.ts`
   - ❌ `apps/backend/src/routes/whatsappExtended.routes.ts`
   - ❌ `apps/backend/src/modules/whatsapp-bot/whatsapp-bot.service.ts`
   - ❌ `apps/backend/src/middleware/whatsappRateLimit.ts` (se existir)

7. **Remover dependências do package.json:**
   - ❌ `"@wppconnect-team/wppconnect": "^1.37.5"`
   - ❌ `"sharp": "^0.34.4"`

8. **Atualizar package-lock.json:**
   ```bash
   cd apps/backend
   npm install
   ```

9. **Limpar Dockerfile:**
   - Verificar se não tem Chromium (WPPConnect precisa)
   - Já está limpo no commit atual

**Critério de sucesso:**
- Build TypeScript sem erros
- Testes locais passando
- Deploy bem-sucedido na VPS

---

## 5. MAPEAMENTO DE MÉTODOS (Evolution API)

### Métodos WPPConnect → Evolution API

| WPPConnect | Evolution API | Notas |
|------------|---------------|-------|
| `isWhatsAppConnected()` | `getConnectionStatus().isConnected` | Verificar conexão |
| `sendText(to, message)` | `sendText(to, message)` | ✅ Método idêntico |
| `sendImage(to, path, caption)` | `sendMedia(to, 'image', base64, caption)` | Converter arquivo para base64 |
| `sendVideo(to, path, caption)` | `sendMedia(to, 'video', base64, caption)` | Converter arquivo para base64 |
| `sendFile(to, path)` | `sendMedia(to, 'document', base64, filename)` | Converter arquivo para base64 |

---

## 6. RISCOS E MITIGAÇÕES

### Risco 1: Automações pararem de funcionar
**Probabilidade:** ALTA se não migrar corretamente
**Impacto:** CRÍTICO (leads não recebem informações)
**Mitigação:**
- Testar migração localmente antes
- Fazer deploy incremental (FASE por FASE)
- Ter rollback preparado

### Risco 2: Quebrar build do Docker
**Probabilidade:** BAIXA (Dockerfile já está limpo)
**Impacto:** ALTO (deploy falha)
**Mitigação:**
- Testar `npm run build:frontend` local
- Validar TypeScript: `npm run type-check`
- GitHub Actions valida antes de deploy

### Risco 3: Perder funcionalidades
**Probabilidade:** MUITO BAIXA
**Impacto:** MÉDIO
**Mitigação:**
- WPPConnect não está sendo usado em produção
- Evolution API já é a API ativa
- Rotas `/api/whatsapp/*` principais usam Evolution

---

## 7. CHECKLIST DE VALIDAÇÃO

### Antes do Deploy:
- [ ] Build local TypeScript sem erros
- [ ] `npm run build:frontend` funciona
- [ ] Testes de automação locais (enviar produto via Evolution)
- [ ] Verificar que `evolutionService` tem todos os métodos necessários

### Depois do Deploy:
- [ ] Health check passou (`/health`)
- [ ] WhatsApp conectado (`/api/whatsapp/status`)
- [ ] Envio de mensagem manual funciona (`/api/whatsapp/send`)
- [ ] Automação de produtos funciona (criar lead com interesse)
- [ ] Automação Kanban funciona (mover lead para coluna com template)
- [ ] Conversas listam corretamente (`/api/whatsapp/conversations`)

---

## 8. ORDEM DE EXECUÇÃO RECOMENDADA

### 🔴 ORDEM SEGURA (Recomendada):
1. **FASE 1** - Migrar automações (commit separado)
2. Deploy e validar automações
3. **FASE 2** - Remover WAHA (commit separado)
4. Deploy e validar
5. **FASE 3** - Remover WPPConnect (commit separado)
6. Deploy final

### ⚠️ ORDEM RÁPIDA (Mais arriscada):
1. Fazer FASE 1 + FASE 2 + FASE 3 juntas
2. Deploy único
3. Ter rollback pronto caso falhe

---

## 9. COMANDOS ÚTEIS

### Testar localmente:
```bash
cd apps/backend
npm run type-check  # Validar TypeScript
npm run build       # Build backend
cd ../../
npm run build:frontend  # Build frontend
```

### Após remoção de dependências:
```bash
cd apps/backend
npm install  # Atualiza package-lock.json
```

### Rollback de emergência:
```bash
git reset --hard 18efb5e  # Voltar para último deploy OK
git push --force
```

---

## 10. CONCLUSÃO

**Viabilidade:** ✅ TOTALMENTE VIÁVEL
**Complexidade:** 🟡 MÉDIA (requer migração de 2 serviços)
**Risco:** 🟢 BAIXO (se feito em fases)

**Maior desafio:** Migrar `whatsappAutomation.service.ts` e `automationScheduler.service.ts` para Evolution API.

**Recomendação:** Executar em **3 fases separadas** com validação entre cada uma.

---

**Próximos passos:** Iniciar FASE 1 (Migração de Automações)
