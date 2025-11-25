# Nomenclatura do Sistema de Recorrência

Este documento esclarece a nomenclatura utilizada no sistema de detecção e rastreamento de leads recorrentes.

---

## 📋 Termos Principais

### **captureCount** (Total de Capturas do Lead)
- **Tipo**: `number` (inteiro)
- **Localização**: `Lead.captureCount` (tabela `leads`)
- **Descrição**: Contador total de quantas vezes o lead demonstrou interesse desde a primeira captura
- **Escopo**: **Lead inteiro** (soma de todas as capturas)
- **Quando incrementa**: Toda vez que `leadRecurrenceService.handleLeadCapture()` é chamado
- **Valor inicial**: `1` (primeira captura)
- **Exemplo**:
  - Lead capturado pela 1ª vez → `captureCount = 1`
  - Lead capturado pela 2ª vez → `captureCount = 2`
  - Lead capturado pela 5ª vez → `captureCount = 5`

**Uso no código**:
```typescript
// leadRecurrence.service.ts:59
const captureNumber = isRecurrent ? existingLead.captureCount + 1 : 1;

// Atualizar lead
await prisma.lead.update({
  data: { captureCount: captureNumber }
});
```

---

### **captureNumber** (Número Sequencial da Captura Específica)
- **Tipo**: `number` (inteiro)
- **Localização**: `LeadCapture.captureNumber` (tabela `lead_captures`)
- **Descrição**: Número sequencial que identifica qual captura específica foi esta
- **Escopo**: **Captura individual** (registro único em `lead_captures`)
- **Quando definido**: Ao criar registro em `LeadCapture` (linha 210-221)
- **Valor**: Sempre igual ao `captureCount` no momento da captura
- **Exemplo**:
  ```
  LeadCapture #1 → captureNumber = 1
  LeadCapture #2 → captureNumber = 2
  LeadCapture #3 → captureNumber = 3
  ```

**Uso no código**:
```typescript
// leadRecurrence.service.ts:210-221
await prisma.leadCapture.create({
  data: {
    leadId,
    captureNumber,  // ← Número sequencial desta captura
    source: data.source,
    interest: JSON.stringify(currentInterest),
    // ...
  },
});
```

---

### **firstCapturedAt** (Data da Primeira Captura)
- **Tipo**: `DateTime`
- **Localização**: `Lead.firstCapturedAt`
- **Descrição**: Timestamp da primeira vez que o lead foi capturado
- **Quando definido**: Apenas ao **criar** novo lead (nunca atualizado)
- **Uso**: Calcular idade do lead, análise de lifetime value

**Código**:
```typescript
// leadRecurrence.service.ts:194
await prisma.lead.create({
  data: {
    firstCapturedAt: new Date(),  // ← Definido uma única vez
    lastCapturedAt: new Date(),
    // ...
  },
});
```

---

### **lastCapturedAt** (Data da Última Captura)
- **Tipo**: `DateTime`
- **Localização**: `Lead.lastCapturedAt`
- **Descrição**: Timestamp da captura mais recente
- **Quando atualizado**: **Toda vez** que o lead é capturado
- **Uso**:
  - Calcular `daysSinceLastCapture` (linha 64)
  - Ordenar leads por recência
  - Filtrar leads inativos

**Código**:
```typescript
// leadRecurrence.service.ts:64-66
const diffMs = Date.now() - new Date(existingLead.lastCapturedAt).getTime();
daysSinceLastCapture = Math.floor(diffMs / (1000 * 60 * 60 * 24));

// leadRecurrence.service.ts:146
await prisma.lead.update({
  data: {
    lastCapturedAt: new Date(),  // ← Atualizado sempre
  },
});
```

---

## 🔄 Fluxo de Atualização

### Cenário 1: **Nova Captura (Lead Novo)**
```
Input: João Silva, tel: +5511999999999

1. Buscar lead por telefone → NÃO encontrado
2. captureNumber = 1
3. Criar Lead:
   - captureCount = 1
   - firstCapturedAt = 2025-11-25 10:00
   - lastCapturedAt = 2025-11-25 10:00
4. Criar LeadCapture:
   - captureNumber = 1
   - createdAt = 2025-11-25 10:00
```

### Cenário 2: **Captura Recorrente (Lead Existente)**
```
Input: João Silva, tel: +5511999999999 (já existe com captureCount = 2)

1. Buscar lead por telefone → ENCONTRADO
2. captureNumber = existingLead.captureCount + 1 = 3
3. daysSinceLastCapture = diff(now, existingLead.lastCapturedAt) = 7 dias
4. Atualizar Lead:
   - captureCount = 3 (incrementado)
   - lastCapturedAt = 2025-11-25 18:00 (atualizado)
   - firstCapturedAt = 2025-11-10 10:00 (NUNCA muda)
5. Criar LeadCapture:
   - captureNumber = 3
   - createdAt = 2025-11-25 18:00
```

---

## 📊 Exemplos de Queries

### Contar leads recorrentes (2+ capturas)
```typescript
await prisma.lead.count({
  where: { captureCount: { gt: 1 } }
});
```

### Buscar todas as capturas de um lead
```typescript
await prisma.leadCapture.findMany({
  where: { leadId: 'lead-xyz' },
  orderBy: { captureNumber: 'asc' }
});
// Retorna: [{ captureNumber: 1 }, { captureNumber: 2 }, { captureNumber: 3 }]
```

### Leads capturados nos últimos 7 dias
```typescript
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

await prisma.lead.findMany({
  where: {
    lastCapturedAt: { gte: sevenDaysAgo }
  }
});
```

### Leads inativos há mais de 30 dias
```typescript
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

await prisma.lead.findMany({
  where: {
    lastCapturedAt: { lt: thirtyDaysAgo },
    captureCount: { gt: 1 }
  }
});
```

---

## ⚠️ Armadilhas Comuns

### ❌ **NÃO CONFUNDA**:
```typescript
// ERRADO: Usar captureNumber para contar total de capturas
const totalCaptures = leadCapture.captureNumber; // ❌ Isso é apenas o número desta captura

// CORRETO: Usar captureCount do Lead
const totalCaptures = lead.captureCount; // ✅ Total real de capturas
```

### ❌ **NÃO FAÇA**:
```typescript
// ERRADO: Atualizar firstCapturedAt
await prisma.lead.update({
  data: { firstCapturedAt: new Date() } // ❌ NUNCA atualizar!
});

// CORRETO: Apenas definir ao criar
await prisma.lead.create({
  data: { firstCapturedAt: new Date() } // ✅ Definir uma única vez
});
```

---

## 🎯 Resumo Visual

```
Lead (Tabela: leads)
├── captureCount: 5          ← Total de capturas (agregado)
├── firstCapturedAt: 2025-01 ← Primeira captura (imutável)
└── lastCapturedAt: 2025-11  ← Última captura (sempre atualizado)

LeadCaptures (Tabela: lead_captures)
├── Captura #1
│   ├── captureNumber: 1     ← Sequencial desta captura
│   └── createdAt: 2025-01
├── Captura #2
│   ├── captureNumber: 2
│   └── createdAt: 2025-03
├── Captura #3
│   ├── captureNumber: 3
│   └── createdAt: 2025-06
├── Captura #4
│   ├── captureNumber: 4
│   └── createdAt: 2025-09
└── Captura #5
    ├── captureNumber: 5
    └── createdAt: 2025-11
```

---

## 📚 Referências no Código

| Campo | Arquivo | Linha |
|-------|---------|-------|
| `captureCount` (definição) | `prisma/schema.prisma` | ~425 |
| `captureNumber` (definição) | `prisma/schema.prisma` | ~484 |
| `firstCapturedAt` (uso) | `leadRecurrence.service.ts` | 194 |
| `lastCapturedAt` (cálculo dias) | `leadRecurrence.service.ts` | 64-66 |
| `handleLeadCapture` (fluxo completo) | `leadRecurrence.service.ts` | 42-109 |

---

**Última atualização**: 2025-11-25
**Versão**: 1.0.0
