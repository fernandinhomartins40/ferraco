# 🔄 Sistema de Recorrência de Leads - Implementado

## ✅ Status: **COMPLETO**

---

## 📋 Resumo da Implementação

Sistema completo de detecção e gestão de leads recorrentes, permitindo identificar quando um cliente volta a demonstrar interesse e enviar mensagens personalizadas baseadas em seu histórico.

---

## 🗂️ Arquivos Criados/Modificados

### **Novos Arquivos**

#### **1. Schema do Banco de Dados**
- ✅ `apps/backend/prisma/schema.prisma` - Adicionado:
  - Campos de recorrência na tabela `Lead` (captureCount, firstCapturedAt, lastCapturedAt)
  - Tabela `LeadCapture` - histórico de todas as capturas
  - Tabela `RecurrenceMessageTemplate` - templates de mensagens personalizadas

#### **2. Serviços**
- ✅ `apps/backend/src/services/leadRecurrence.service.ts`
  - Detecção automática de leads recorrentes
  - Registro de histórico de capturas
  - Cálculo de boost de score
  - Estatísticas de recorrência

- ✅ `apps/backend/src/services/recurrenceMessageTemplate.service.ts`
  - Seleção inteligente de templates
  - Sistema de matching com score (0-100)
  - Processamento de variáveis nos templates
  - CRUD completo de templates

#### **3. Controllers e Routes**
- ✅ `apps/backend/src/modules/recurrence/recurrence.controller.ts`
  - Endpoints para gerenciar templates
  - Estatísticas de recorrência
  - Histórico de capturas

- ✅ `apps/backend/src/modules/recurrence/recurrence.routes.ts`
  - Rotas autenticadas sob `/api/recurrence`

#### **4. Seeds**
- ✅ `apps/backend/prisma/seeds/recurrenceTemplates.seed.ts`
  - 6 templates profissionais pré-configurados:
    1. 2ª captura - mesmo interesse
    2. 2ª captura - novo interesse (cross-sell)
    3. 3ª captura - alta prioridade
    4. Recaptura após 30+ dias
    5. Lead recorrente genérico
    6. Alta qualificação (score >= 60)

### **Arquivos Modificados**

- ✅ `apps/backend/src/modules/leads/public-leads.controller.ts`
  - Integrado sistema de recorrência
  - Detecção automática ao capturar lead
  - Criação de automação personalizada

- ✅ `apps/backend/src/modules/chatbot/chatbot-session.service.ts`
  - Integrado sistema de recorrência no chatbot web
  - Detecção durante conversa
  - Automação de recorrência para leads do chatbot

- ✅ `apps/backend/src/services/whatsappAutomation.service.ts`
  - Novo método `createRecurrenceAutomation()`
  - Priorização de leads recorrentes na fila
  - Integração com templates de recorrência

- ✅ `apps/backend/src/app.ts`
  - Registrada rota `/api/recurrence`

---

## 🚀 Como Usar

### **1. Executar Migration**

```bash
cd apps/backend
npx prisma migrate dev --name add_recurrence_system
npx prisma generate
```

### **2. Popular Templates Padrão**

```bash
cd apps/backend
npx ts-node prisma/seeds/recurrenceTemplates.seed.ts
```

### **3. Testar a API**

#### **Listar templates**
```bash
GET /api/recurrence/templates
Authorization: Bearer <token>
```

#### **Criar novo template**
```bash
POST /api/recurrence/templates
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Meu Template Customizado",
  "trigger": "custom_trigger",
  "minCaptures": 2,
  "content": "Olá {{lead.name}}! Esta é sua {{captureNumber}}ª visita!",
  "priority": 5
}
```

#### **Estatísticas de recorrência**
```bash
GET /api/recurrence/stats/leads
Authorization: Bearer <token>
```

#### **Histórico de capturas de um lead**
```bash
GET /api/recurrence/leads/<leadId>/captures
Authorization: Bearer <token>
```

---

## 🔍 Fluxo de Funcionamento

### **1. Captura de Lead (Landing Page)**

```
Lead submete formulário
    ↓
leadRecurrenceService.handleLeadCapture()
    ↓
Verifica se telefone já existe
    ↓
┌─────────────────┬─────────────────┐
│  Lead Novo      │  Lead Recorrente │
├─────────────────┼─────────────────┤
│ Criar lead      │ Atualizar lead  │
│ captureCount=1  │ captureCount++  │
│                 │ boost de score  │
└─────────────────┴─────────────────┘
    ↓
Registrar LeadCapture no histórico
    ↓
whatsappAutomationService.createRecurrenceAutomation()
    ↓
Selecionar melhor template
    ↓
Criar automação WhatsApp personalizada
    ↓
Adicionar à fila com prioridade alta
```

### **2. Seleção de Template**

O sistema calcula um **score de match (0-100)** para cada template baseado em:

- ✅ **Número de capturas** (minCaptures/maxCaptures)
- ✅ **Dias desde última captura** (daysSinceLastCapture)
- ✅ **Mudança de interesse** (sameInterest condition)
- ✅ **Score do lead** (minScore condition)
- ✅ **Prioridade do template** (desempate)

Template com **maior score** é selecionado.

### **3. Processamento de Variáveis**

Templates suportam variáveis dinâmicas:

- `{{lead.name}}` - Nome do lead
- `{{lead.phone}}` - Telefone
- `{{lead.email}}` - Email
- `{{captureNumber}}` - Número da captura (2, 3, 4...)
- `{{daysSinceLastCapture}}` - Dias desde última visita
- `{{previousInterests}}` - Produtos de interesse anteriores
- `{{currentInterest}}` - Produtos de interesse atuais

---

## 📊 Benefícios Implementados

### **Para o Negócio**
- ✅ **Aumento de conversão**: leads recorrentes recebem mensagens personalizadas
- ✅ **Priorização inteligente**: leads que voltam múltiplas vezes têm prioridade
- ✅ **Cross-sell automático**: detecta mudança de interesse e oferece combos
- ✅ **Reengajamento**: identifica leads que voltam após longo tempo

### **Para a Operação**
- ✅ **Histórico completo**: todas as capturas registradas
- ✅ **Métricas de recorrência**: quantos leads voltam, quando, com que interesse
- ✅ **Automação total**: não requer intervenção manual
- ✅ **Templates gerenciáveis**: fácil criar/editar mensagens via API

### **Para o Lead**
- ✅ **Mensagens relevantes**: baseadas em histórico e contexto
- ✅ **Ofertas especiais**: descontos para clientes recorrentes
- ✅ **Atendimento VIP**: leads recorrentes têm prioridade

---

## 🔧 Configurações e Personalizações

### **Criar Template Customizado**

```typescript
{
  name: "Black Friday - Lead Recorrente",
  description: "Template especial para Black Friday",
  trigger: "blackfriday_recurrence",
  minCaptures: 2,
  maxCaptures: null,
  daysSinceLastCapture: 7, // Última visita há 7 dias
  conditions: {
    sameInterest: true,
    minScore: 50
  },
  content: `🎉 BLACK FRIDAY ESPECIAL! 🎉

{{lead.name}}, você voltou no momento certo!

Como cliente recorrente, você tem:
🔥 30% OFF em {{currentInterest}}
📦 Frete grátis
⚡ Entrega expressa

Oferta válida até meia-noite! ⏰`,
  priority: 20, // Alta prioridade
  isActive: true
}
```

### **Ajustar Boost de Score**

Editar `leadRecurrence.service.ts` método `calculateRecurrenceScoreBoost()`:

```typescript
// Valores padrão:
// 2ª captura: +10 pontos
// 3ª captura: +20 pontos
// 4ª+ captura: +30 pontos
```

### **Modificar Priorização na Fila**

Editar `whatsappAutomation.service.ts` método `createRecurrenceAutomation()`:

```typescript
// Prioridade atual:
const priorityBoost = Math.min(captureNumber * 2, 10);
this.addToQueue(automation.id, 5 + priorityBoost);

// Prioridade base = 5
// 2ª captura = prioridade 9
// 3ª captura = prioridade 11
// 5ª+ captura = prioridade 15 (máximo)
```

---

## 📈 Monitoramento e Métricas

### **Dashboard de Recorrência (via API)**

```bash
# Estatísticas gerais
GET /api/recurrence/stats/leads
Response:
{
  "totalLeads": 1500,
  "recurrentLeads": 450,
  "avgCapturesPerLead": 1.8,
  "topRecurrentLeads": [...]
}

# Uso de templates
GET /api/recurrence/stats/templates
Response:
{
  "totalUsage": 230,
  "templates": [
    {
      "name": "2ª Captura - Mesmo Interesse",
      "usageCount": 85,
      "usagePercentage": 36.96
    },
    ...
  ]
}
```

---

## 🧪 Testes Recomendados

### **Teste 1: Lead novo**
1. Submeter formulário pela primeira vez
2. Verificar que `captureCount = 1`
3. Verificar automação padrão criada

### **Teste 2: Lead recorrente (2ª captura)**
1. Submeter formulário novamente com mesmo telefone
2. Verificar que `captureCount = 2`
3. Verificar template de recorrência usado
4. Verificar prioridade aumentada

### **Teste 3: Mudança de interesse**
1. Capturar lead com produto A
2. Recapturar lead com produto B
3. Verificar template de cross-sell selecionado

### **Teste 4: Recaptura após 30+ dias**
1. Criar lead manualmente
2. Alterar `lastCapturedAt` para 35 dias atrás
3. Recapturar lead
4. Verificar template de reengajamento

---

## 🔐 Segurança

- ✅ Todas as rotas sob `/api/recurrence` requerem autenticação JWT
- ✅ Histórico de capturas registra IP e User-Agent
- ✅ Validação de dados com Zod (pode ser adicionada)
- ✅ Rate limiting aplicado (via middleware global)
- ✅ Logs detalhados de todas as operações

---

## 📝 Próximos Passos Recomendados

1. **Frontend**:
   - Dashboard de leads recorrentes
   - Editor visual de templates
   - Gráficos de recorrência

2. **IA/ML**:
   - Predição de probabilidade de recaptura
   - Sugestão automática de templates
   - A/B testing de mensagens

3. **Integrações**:
   - Webhook ao detectar lead recorrente
   - Notificação Slack/Teams para equipe
   - Sincronização com CRM externo

4. **Analytics**:
   - Tempo médio entre capturas
   - Taxa de conversão por número de capturas
   - ROI de campanhas de reengajamento

---

## 🆘 Troubleshooting

### **Erro: "Migration failed"**
```bash
# Resetar banco (CUIDADO EM PRODUÇÃO!)
npx prisma migrate reset

# Ou criar nova migration
npx prisma migrate dev --name fix_recurrence
```

### **Templates não sendo selecionados**
- Verificar se templates estão ativos (`isActive = true`)
- Verificar prioridade dos templates
- Checar logs para ver score de matching

### **Automação não disparando**
- Verificar se WhatsApp está conectado
- Checar fila de automações
- Ver logs do `whatsappAutomation.service.ts`

---

## 📞 Suporte

Para dúvidas ou problemas, verificar logs em:
- `apps/backend/logs/` (se configurado)
- Console do backend (ver logs com emoji 🔄)

---

**✅ Sistema de Recorrência Implementado com Sucesso!**

Desenvolvido com 💚 para maximizar conversões e fidelizar clientes.
