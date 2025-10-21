# Sistema de Proteção Anti-Spam WhatsApp

## Problema Identificado

Um lead estava recebendo **mais de 13 mensagens duplicadas** da mesma automação, o que poderia resultar em **banimento do WhatsApp** por envio em massa.

### Causa Raiz

O scheduler de automações (`automationScheduler.service.ts`) processava leads baseado apenas em:
- `nextScheduledAt == null` (nunca enviado)
- `nextScheduledAt <= now` (hora de enviar)

**Não havia verificação** se o lead já havia recebido a mensagem recentemente dentro do mesmo período de recorrência configurado.

## Solução Implementada

### 1. Verificação de Período de Recorrência

Adicionado método `isWithinRecurrencePeriod()` que verifica se o lead já recebeu mensagem recentemente:

```typescript
private isWithinRecurrencePeriod(lastSentAt: Date, recurrenceType: string, column: any): boolean
```

**Comportamento por tipo de recorrência:**

- **NONE** (envio único): Se já enviou uma vez, **bloqueia permanentemente**
- **DAILY**: Permite apenas 1 envio por dia
- **WEEKLY**: Permite 1 envio por dia nos dias da semana configurados
- **MONTHLY**: Permite 1 envio por mês no dia configurado
- **CUSTOM_DATES**: Permite 1 envio por data customizada
- **DAYS_FROM_NOW**: Bloqueia até completar o número de dias configurado

### 2. Remoção Automática de Leads sem Recorrência

Quando `recurrenceType === 'NONE'`:
- Após envio bem-sucedido, o lead é **automaticamente removido** da coluna de automação
- Evita reprocessamento infinito
- Log: `"Lead removido da automação (envio único sem recorrência)"`

### 3. Proteção no Retry

Modificado `retryLead()` para:
- Aceitar retry **APENAS** para status `FAILED` ou `WHATSAPP_DISCONNECTED`
- Rejeitar retry para leads com status `SENT` ou `PENDING`
- Log de aviso quando retry é negado

### 4. Logs Detalhados

```
⏭️  Lead [Nome] já recebeu mensagem recentemente (último envio: [data]).
    Aguardando próximo período de recorrência.

✅ Mensagem enviada com sucesso para [Nome].
   Lead removido da automação (envio único sem recorrência).

✅ Mensagem enviada com sucesso para [Nome].
   Próximo envio: [data/hora]

🔄 Retry solicitado para lead [id] (status anterior: FAILED)

⚠️  Retry ignorado para lead [id]: status atual é SENT.
    Retry é permitido apenas para leads com status FAILED ou WHATSAPP_DISCONNECTED.
```

## Fluxo de Proteção

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. Scheduler busca leads com nextScheduledAt <= now                │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. Para cada lead:                                                  │
│    ✓ Tem lastSentAt?                                                │
│    ✓ RecurrenceType != NONE?                                        │
│    ✓ isWithinRecurrencePeriod()?                                    │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
    ┌───────────────────┐   ┌───────────────────────┐
    │ JÁ ENVIOU         │   │ PODE ENVIAR           │
    │ (skip)            │   │ (processa)            │
    └───────────────────┘   └───────────┬───────────┘
                                        │
                                        ▼
                            ┌───────────────────────┐
                            │ Envia mensagem        │
                            └───────────┬───────────┘
                                        │
                            ┌───────────┴────────────┐
                            │                        │
                            ▼                        ▼
                ┌───────────────────┐    ┌──────────────────────┐
                │ RecurrenceType    │    │ RecurrenceType       │
                │ == NONE?          │    │ != NONE?             │
                │                   │    │                      │
                │ ✓ DELETE position │    │ ✓ UPDATE position    │
                │ ✓ Remove da       │    │ ✓ Calcula próximo    │
                │   automação       │    │   agendamento        │
                └───────────────────┘    └──────────────────────┘
```

## Benefícios

### ✅ Anti-Spam
- **Impossível** enviar múltiplas mensagens no mesmo período
- Proteção contra loops infinitos
- Respeita configuração de recorrência

### ✅ Evita Banimento WhatsApp
- Controle rigoroso de frequência
- Logs detalhados para auditoria
- Retry limitado apenas a falhas reais

### ✅ Limpeza Automática
- Leads de envio único são removidos automaticamente
- Banco de dados mais limpo
- Melhor performance do scheduler

### ✅ Rastreabilidade
- Logs detalhados de cada decisão
- Timestamp de último envio
- Contador de mensagens enviadas

## Configuração

### Tipos de Recorrência

Configurados na tabela `AutomationKanbanColumn`:

```typescript
recurrenceType: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM_DATES' | 'DAYS_FROM_NOW'
```

### Limites Globais

Configurados na tabela `AutomationSettings`:

```typescript
maxMessagesPerHour: 30    // Máximo 30 mensagens por hora
maxMessagesPerDay: 200    // Máximo 200 mensagens por dia
sendOnlyBusinessHours: true
businessHourStart: 8      // 8h
businessHourEnd: 18       // 18h
```

## Casos de Uso

### Caso 1: Envio Único de Boas-Vindas
```
recurrenceType: 'NONE'
Comportamento: Envia 1 vez e remove lead da automação
```

### Caso 2: Lembrete Semanal
```
recurrenceType: 'WEEKLY'
weekDays: [1, 3, 5] // Segunda, Quarta, Sexta
Comportamento: Envia 1 vez por dia nos dias configurados
```

### Caso 3: Cobrança Mensal
```
recurrenceType: 'MONTHLY'
monthDay: 5 // Dia 5 de cada mês
Comportamento: Envia 1 vez por mês no dia 5
```

### Caso 4: Follow-up Semestral
```
recurrenceType: 'DAYS_FROM_NOW'
daysFromNow: 180
Comportamento: Envia a cada 180 dias
```

## Monitoramento

### Logs a Observar

**Normal (sucesso):**
```
✅ Mensagem enviada com sucesso para João Silva.
   Próximo envio: 21/11/2025, 10:00:00
```

**Proteção ativada:**
```
⏭️  Lead João Silva já recebeu mensagem recentemente (último envio: 2025-10-21T10:00:00Z).
    Aguardando próximo período de recorrência.
```

**Retry negado:**
```
⚠️  Retry ignorado para lead abc123: status atual é SENT.
    Retry é permitido apenas para leads com status FAILED ou WHATSAPP_DISCONNECTED.
```

## Testes Recomendados

### 1. Teste de Envio Único
1. Criar coluna com `recurrenceType: NONE`
2. Adicionar lead
3. Aguardar envio
4. Verificar que lead foi removido da automação
5. Confirmar que não há reenvio

### 2. Teste de Proteção Diária
1. Criar coluna com `recurrenceType: DAILY`
2. Adicionar lead
3. Aguardar primeiro envio
4. Forçar scheduler a rodar novamente no mesmo dia
5. Verificar que mensagem NÃO é reenviada

### 3. Teste de Retry
1. Simular falha (desconectar WhatsApp)
2. Lead deve ficar com status `WHATSAPP_DISCONNECTED`
3. Chamar retry
4. Verificar que lead volta para `PENDING`
5. Reconectar WhatsApp e verificar envio

## Arquivos Modificados

- `apps/backend/src/services/automationScheduler.service.ts`
  - Adicionado `isWithinRecurrencePeriod()`
  - Modificado `processPosition()` para verificar duplicatas
  - Modificado `retryLead()` para aceitar apenas falhas
  - Adicionada lógica de remoção automática para envio único

## Banco de Dados

### Campos Importantes

**AutomationLeadPosition:**
```typescript
lastSentAt: DateTime?        // Timestamp do último envio BEM-SUCEDIDO
nextScheduledAt: DateTime?    // Próximo envio agendado
messagesSentCount: Int        // Contador total de mensagens enviadas
status: AutomationSendStatus  // PENDING, SENDING, SENT, FAILED, WHATSAPP_DISCONNECTED
lastError: String?            // Última mensagem de erro
lastAttemptAt: DateTime?      // Última TENTATIVA (sucesso ou falha)
```

**AutomationKanbanColumn:**
```typescript
recurrenceType: RecurrenceType  // NONE, DAILY, WEEKLY, MONTHLY, CUSTOM_DATES, DAYS_FROM_NOW
weekDays: String?               // JSON: [0,1,2,3,4,5,6]
monthDay: Int?                  // 1-31
customDates: String?            // JSON: ["2025-11-15T10:00:00Z", ...]
daysFromNow: Int?               // Exemplo: 180
sendIntervalSeconds: Int        // Intervalo entre envios (padrão: 60s)
```

## Considerações de Performance

- A verificação `isWithinRecurrencePeriod()` é executada em memória (não acessa BD)
- Índices existentes em `nextScheduledAt`, `status`, `columnId` otimizam queries
- Remoção automática de leads sem recorrência reduz tamanho da tabela

## Próximos Passos (Opcional)

1. **Dashboard de Monitoramento:**
   - Gráfico de mensagens enviadas por hora/dia
   - Alertas quando próximo dos limites

2. **Métricas:**
   - Taxa de entrega (SENT / TOTAL)
   - Taxa de falha (FAILED / TOTAL)
   - Tempo médio de processamento

3. **Testes Automatizados:**
   - Unit tests para `isWithinRecurrencePeriod()`
   - Integration tests para fluxo completo

---

**Última atualização:** 2025-10-21
**Versão:** 1.0
