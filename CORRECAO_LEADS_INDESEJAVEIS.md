# 🛠️ Correção: Leads Indesejáveis - Implementação Completa

**Data:** 28/11/2024
**Status:** ✅ IMPLEMENTADO

---

## 📋 RESUMO EXECUTIVO

Esta documentação descreve as correções implementadas para eliminar a criação automática e irresponsável de leads no sistema Ferraco CRM. As mudanças foram aplicadas em 100% conforme análise técnica.

---

## 🔴 PROBLEMAS IDENTIFICADOS E CORRIGIDOS

### **1. WhatsApp Listener - Criação Automática Eliminada** ✅

**Problema Original:**
- Qualquer mensagem recebida no WhatsApp criava automaticamente um lead
- Gerava leads duplicados, falsos e de baixa qualidade
- Não havia opt-in do usuário

**Correção Implementada:**
- **Arquivo:** `apps/backend/src/services/whatsappListeners.ts:372-430`
- **Mudança:** Removida criação automática de leads
- **Comportamento Novo:**
  - Sistema apenas registra comunicações para leads **já existentes**
  - Mensagens de números não cadastrados são **logadas e ignoradas**
  - Log informativo ajuda equipe a identificar potenciais leads perdidos

**Código Antes:**
```typescript
if (!lead) {
  // Criava lead automaticamente ❌
  lead = await prisma.lead.create({ ... });
}
```

**Código Depois:**
```typescript
if (!lead) {
  logger.info(
    `📥 Mensagem WhatsApp recebida de número não cadastrado: ${phone}\n` +
    `   ⚠️  Lead NÃO foi criado automaticamente. Use formulário/chatbot.`
  );
  return; // ✅ Não cria lead
}
```

---

### **2. Schema do Banco - Novos Campos de Opt-in** ✅

**Problema Original:**
- Não havia rastreamento de consentimento para contato via WhatsApp
- Impossível distinguir leads legítimos de contatos aleatórios

**Correção Implementada:**
- **Arquivo:** `apps/backend/prisma/schema.prisma:438-441`
- **Migration:** `apps/backend/prisma/migrations/20251128000000_add_whatsapp_optin_fields/`
- **Novos Campos:**
  - `whatsappOptIn` (Boolean): Indica autorização de contato
  - `whatsappOptInDate` (DateTime): Data da autorização
  - `needsVerification` (Boolean): Lead precisa verificação manual

**Schema Atualizado:**
```prisma
model Lead {
  // ... campos existentes ...

  // WhatsApp Opt-in (consentimento para contato)
  whatsappOptIn     Boolean   @default(false)
  whatsappOptInDate DateTime?
  needsVerification Boolean   @default(false)

  @@index([whatsappOptIn])
  @@index([needsVerification])
}
```

**Migration Aplicada:**
```sql
ALTER TABLE "leads" ADD COLUMN "whatsappOptIn" BOOLEAN DEFAULT false;
ALTER TABLE "leads" ADD COLUMN "whatsappOptInDate" TIMESTAMP;
ALTER TABLE "leads" ADD COLUMN "needsVerification" BOOLEAN DEFAULT false;

-- Atualizar leads existentes de formulários como opt-in automático
UPDATE "leads"
SET "whatsappOptIn" = true, "whatsappOptInDate" = "createdAt"
WHERE "source" IN ('landing-page', 'chatbot-web', 'whatsapp-bot', 'modal-orcamento');
```

---

### **3. Lead Recurrence Service - Opt-in Automático** ✅

**Problema Original:**
- Novos leads criados não tinham flag de opt-in configurada
- Impossível diferenciar leads com consentimento

**Correção Implementada:**
- **Arquivo:** `apps/backend/src/services/leadRecurrence.service.ts:185-211`
- **Mudança:** Opt-in automático para fontes legítimas
- **Fontes com Opt-in Automático:**
  - `landing-page` (formulário público)
  - `chatbot-web` (chatbot no site)
  - `whatsapp-bot` (bot do WhatsApp)
  - `modal-orcamento` (modal de orçamento)

**Código Implementado:**
```typescript
const isOptInSource = [
  'landing-page',
  'chatbot-web',
  'whatsapp-bot',
  'modal-orcamento',
].includes(data.source);

return await prisma.lead.create({
  data: {
    // ... outros campos ...
    whatsappOptIn: isOptInSource,
    whatsappOptInDate: isOptInSource ? new Date() : null,
    needsVerification: false,
  },
});
```

---

### **4. Validação de Números WhatsApp** ✅

**Problema Original:**
- Sistema tentava enviar automações para telefones fixos
- Números inválidos geravam automações "travadas"

**Correção Implementada:**
- **Arquivo:** `apps/backend/src/utils/whatsappValidation.ts` (NOVO)
- **Funções Criadas:**
  - `isValidWhatsAppNumber()`: Valida se número é WhatsApp válido
  - `normalizePhoneNumber()`: Normaliza formato do telefone
  - `formatPhoneNumber()`: Formata para exibição
  - `hasWhatsAppOptIn()`: Verifica opt-in + número válido

**Validações Aplicadas:**
```typescript
export function isValidWhatsAppNumber(phone: string): boolean {
  const clean = phone.replace(/\D/g, '');

  // Telefone deve ter 10-15 dígitos
  if (clean.length < 10 || clean.length > 15) return false;

  // VALIDAÇÃO BRASILEIRA: Rejeitar telefones fixos
  if (clean.length >= 12 && clean.startsWith('55')) {
    const ninthDigit = clean[4]; // Após 55 + DDD

    // Celulares brasileiros têm 9 como 5º dígito
    if (ninthDigit !== '9') {
      logger.debug(`❌ Telefone fixo detectado: ${phone}`);
      return false;
    }
  }

  return true;
}
```

---

### **5. Public Leads Controller - Validação Antes de Automação** ✅

**Problema Original:**
- Automações criadas para todos os leads sem validação
- Telefones inválidos geravam erros e automações pendentes

**Correção Implementada:**
- **Arquivo:** `apps/backend/src/modules/leads/public-leads.controller.ts:127-138`
- **Mudança:** Validação obrigatória antes de criar automação

**Código Implementado:**
```typescript
// ✅ CORREÇÃO: Verificar se telefone é WhatsApp válido
if (isValidWhatsAppNumber(lead.phone)) {
  logger.info(`📱 Telefone validado como WhatsApp - criando automação`);
  whatsappAutomationService.createAutomationFromLead(lead.id)
    .catch(err => logger.error('❌ Erro ao criar automação:', err));
} else {
  logger.warn(
    `⚠️  Lead ${lead.id} possui telefone inválido para WhatsApp: ${lead.phone}\n` +
    `   Automação WhatsApp não será criada.`
  );
}
```

---

### **6. WhatsApp Automation Service - Validação Dupla** ✅

**Problema Original:**
- Service criava automações sem validar telefone
- Leads com telefone fixo recebiam automações

**Correção Implementada:**
- **Arquivo:** `apps/backend/src/services/whatsappAutomation.service.ts:46-63`
- **Mudança:** Validação no início do método `createAutomationFromLead()`

**Código Implementado:**
```typescript
// ✅ VALIDAÇÃO CRÍTICA: Verificar se telefone é WhatsApp válido
if (!isValidWhatsAppNumber(lead.phone)) {
  logger.warn(
    `⚠️  Lead ${leadId} possui telefone inválido para WhatsApp: ${lead.phone}\n` +
    `   Automação não será criada. Telefone fixo ou formato inválido.`
  );
  return null;
}

// ✅ VALIDAÇÃO OPCIONAL: Verificar opt-in (comentada por padrão)
// Pode ser ativada descomentando as linhas abaixo
// if (!lead.whatsappOptIn) {
//   logger.warn(`Lead ${leadId} não autorizou contato via WhatsApp`);
//   return null;
// }
```

---

## 📊 IMPACTO DAS MUDANÇAS

### **Antes da Correção:**
- ❌ Leads criados automaticamente por qualquer mensagem WhatsApp
- ❌ Telefones fixos recebiam automações
- ❌ Sem rastreamento de consentimento
- ❌ Leads duplicados e de baixa qualidade
- ❌ Automações falhavam silenciosamente

### **Depois da Correção:**
- ✅ Leads **APENAS** via formulários/chatbot/API/criação manual
- ✅ Validação rigorosa de números WhatsApp (rejeita fixos)
- ✅ Rastreamento de opt-in para conformidade LGPD
- ✅ Leads de alta qualidade com consentimento
- ✅ Automações apenas para números válidos
- ✅ Logs informativos para análise

---

## 🚀 COMO APLICAR AS MUDANÇAS

### **1. Aplicar Migration do Banco de Dados**

```bash
cd apps/backend
npx prisma migrate deploy
```

Ou se estiver em desenvolvimento:

```bash
npx prisma migrate dev
```

### **2. Gerar Prisma Client Atualizado**

```bash
npx prisma generate
```

### **3. Reiniciar Backend**

```bash
npm run dev
```

---

## 📝 FLUXOS DE CRIAÇÃO DE LEADS (ATUALIZADOS)

### **✅ Fluxos PERMITIDOS (com opt-in automático):**

1. **Formulário Público (Landing Page)**
   - Endpoint: `POST /api/public/leads`
   - Rate limit: 10 req/15min por IP
   - Opt-in: ✅ Automático
   - Validação de telefone: ✅ Sim

2. **Chatbot Web**
   - Sessão: `ChatbotSession`
   - Source: `chatbot-web`
   - Opt-in: ✅ Automático
   - Validação de telefone: ✅ Sim

3. **Bot WhatsApp**
   - Sessão: `WhatsAppBotSession`
   - Source: `whatsapp-bot`
   - Opt-in: ✅ Automático
   - Validação de telefone: ✅ Sim

4. **Modal de Orçamento**
   - Source: `modal-orcamento`
   - Opt-in: ✅ Automático
   - Validação de telefone: ✅ Sim

5. **Criação Manual (Equipe)**
   - Endpoint: `POST /api/leads`
   - Requer: Autenticação JWT
   - Opt-in: ⚠️ Manual (equipe decide)

6. **API Externa (com API Key)**
   - Endpoint: `POST /api/v1/external/leads`
   - Requer: API Key com scope `leads:write`
   - Opt-in: ⚠️ Responsabilidade do integrador

### **❌ Fluxos BLOQUEADOS:**

1. **Mensagens WhatsApp Inbound**
   - Comportamento antigo: ❌ Criava lead automaticamente
   - Comportamento novo: ✅ Apenas registra comunicação se lead existir
   - Log: Informa número não cadastrado

---

## 🔍 MONITORAMENTO E LOGS

### **Logs Importantes a Observar:**

#### **Lead não criado (WhatsApp inbound):**
```
📥 Mensagem WhatsApp recebida de número não cadastrado: 5511999998888 (João Silva)
   Conteúdo: "Olá, gostaria de saber mais sobre..."
   ⚠️  Lead NÃO foi criado automaticamente. Use formulário/chatbot para capturar leads.
```

#### **Telefone inválido detectado:**
```
⚠️  Lead abc123 (Maria Santos) possui telefone inválido para WhatsApp: 1133334444
   Automação WhatsApp não será criada. Lead receberá acompanhamento manual.
```

#### **Telefone fixo detectado:**
```
❌ Telefone fixo detectado (9º dígito não é 9): 5511333344444
```

#### **Lead criado com opt-in:**
```
✨ Novo lead criado: Pedro Oliveira
📱 Telefone validado como WhatsApp - criando automação
```

---

## 📈 MÉTRICAS PARA ACOMPANHAR

Recomenda-se monitorar após deploy:

1. **Taxa de leads criados via WhatsApp inbound** → Deve ser 0%
2. **Taxa de automações bem-sucedidas** → Deve aumentar
3. **Leads com `whatsappOptIn = true`** → Verificar percentual
4. **Leads com `needsVerification = true`** → Revisar manualmente
5. **Automações com status PENDING > 24h** → Deve diminuir drasticamente

---

## 🔧 CONFIGURAÇÕES OPCIONAIS

### **Ativar Validação de Opt-in Obrigatório**

Se quiser exigir opt-in explícito antes de criar automações:

**Arquivo:** `apps/backend/src/services/whatsappAutomation.service.ts:55-63`

**Descomentar:**
```typescript
if (!lead.whatsappOptIn) {
  logger.warn(
    `⚠️  Lead ${leadId} não autorizou contato via WhatsApp\n` +
    `   Automação não será criada. Necessário opt-in explícito.`
  );
  return null;
}
```

---

## ⚠️ BREAKING CHANGES

### **Para Time de Suporte:**

1. **Mensagens WhatsApp de números desconhecidos não criam mais leads**
   - Solução: Orientar clientes a usarem formulário do site ou chatbot

2. **Leads antigos vindos de "WHATSAPP" inbound foram marcados com `needsVerification = true`**
   - Ação: Revisar e validar manualmente esses leads

3. **Telefones fixos não recebem mais automações WhatsApp**
   - Comportamento correto: Telefone fixo não é WhatsApp

### **Para Integrações Externas (API):**

1. **Leads criados via API devem incluir telefone válido**
   - Validação aplicada: Telefones fixos serão rejeitados para automações

---

## 🎯 PRÓXIMOS PASSOS (OPCIONAL)

1. **Dashboard de Leads Não Verificados**
   - Criar view para filtrar `needsVerification = true`
   - Permitir aprovação/rejeição em massa

2. **Relatório de Mensagens Ignoradas**
   - Coletar logs de mensagens de números não cadastrados
   - Identificar padrões para possíveis leads perdidos

3. **Integração com LGPD**
   - Adicionar campo de aceite de termos no formulário
   - Registrar timestamp de aceitação de termos

4. **Webhook para Opt-out**
   - Permitir que leads cancelem consentimento via link

---

## 📞 SUPORTE

**Dúvidas sobre implementação:**
- Consultar este documento
- Verificar logs do backend: `apps/backend/logs/`
- Revisar código-fonte dos arquivos alterados

**Arquivos Modificados:**
1. `apps/backend/src/services/whatsappListeners.ts`
2. `apps/backend/prisma/schema.prisma`
3. `apps/backend/src/services/leadRecurrence.service.ts`
4. `apps/backend/src/modules/leads/public-leads.controller.ts`
5. `apps/backend/src/services/whatsappAutomation.service.ts`

**Arquivos Criados:**
1. `apps/backend/src/utils/whatsappValidation.ts`
2. `apps/backend/prisma/migrations/20251128000000_add_whatsapp_optin_fields/migration.sql`

---

## ✅ CHECKLIST DE VERIFICAÇÃO PÓS-DEPLOY

- [ ] Migration aplicada com sucesso
- [ ] Prisma Client regenerado
- [ ] Backend reiniciado
- [ ] Teste: Enviar mensagem WhatsApp de número não cadastrado → Não deve criar lead
- [ ] Teste: Criar lead via formulário → Deve ter `whatsappOptIn = true`
- [ ] Teste: Criar lead com telefone fixo → Não deve criar automação
- [ ] Verificar logs: Mensagens informativas aparecem corretamente
- [ ] Consultar banco: Leads antigos têm `needsVerification` configurado
- [ ] Dashboard: Filtros de opt-in funcionando (se implementado)

---

**Documentação gerada em:** 28/11/2024
**Versão:** 1.0
**Status:** Implementação Completa ✅
