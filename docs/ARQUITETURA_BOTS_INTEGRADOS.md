# Arquitetura de Integração Inteligente dos Chatbots

## 📋 Visão Geral

Sistema integrado de dois chatbots que trabalham em sinergia:

1. **Chatbot Web (/chat)**: Captação inicial de leads
2. **Bot WhatsApp**: Continuação inteligente via WhatsApp + Automações Kanban

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CHATBOT WEB (/chat)                          │
│                                                                     │
│  1. Usuário acessa /chat                                           │
│  2. Conversa com bot web                                           │
│  3. Captura: nome, telefone, interesse em produtos                │
│  4. Opções finais:                                                 │
│     ✅ "Falar com a equipe"                                        │
│     ✅ "Quero orçamento"                                           │
│     ✅ "Ver produtos"                                              │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    LEAD CRIADO NO BANCO                             │
│                                                                     │
│  • status: "NOVO"                                                  │
│  • priority: HIGH/MEDIUM/LOW (baseado em score)                   │
│  • metadata:                                                       │
│    - selectedProducts: ["Bebedouro", "Freestall"]                 │
│    - wantsHumanContact: true                                      │
│    - wantsPricing: true                                           │
│    - interest: "Bebedouro e Freestall"                           │
│    - userResponses: {...}                                         │
│                                                                     │
│  • Tags automáticas adicionadas:                                  │
│    #interesse-bebedouro                                            │
│    #interesse-freestall                                            │
│    #quer-orcamento                                                 │
│    #handoff-humano                                                 │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  SISTEMA DE DECISÃO INTELIGENTE                     │
│                                                                     │
│  IF (wantsHumanContact || wantsPricing) {                         │
│    ┌─────────────────────────────────────┐                        │
│    │   TRIGGER BOT WHATSAPP              │                        │
│    │   • Enviar mensagem inicial         │                        │
│    │   • Enviar materiais dos produtos   │                        │
│    │   • Responder dúvidas (FAQ)         │                        │
│    │   • SEMPRE: handoff para humano     │                        │
│    └─────────────────────────────────────┘                        │
│  }                                                                 │
│                                                                     │
│  IF (lead.status === "NOVO") {                                    │
│    ┌─────────────────────────────────────┐                        │
│    │   ADICIONAR AO KANBAN AUTOMAÇÃO     │                        │
│    │   • Lead entra na coluna "Lead Novo"│                        │
│    │   • Aguarda movimentação manual     │                        │
│    └─────────────────────────────────────┘                        │
│  }                                                                 │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
┌──────────────────────┐  ┌──────────────────────────────┐
│   BOT WHATSAPP       │  │   AUTOMAÇÕES KANBAN          │
│                      │  │                              │
│  • Sessão criada     │  │  • Lead na coluna "Lead Novo"│
│  • contextData:      │  │  • Movimentação manual:      │
│    - interesse       │  │    - Negociação              │
│    - produtos        │  │    - Orçamento Enviado       │
│    - leadName        │  │    - Venda Concluída         │
│                      │  │                              │
│  Fluxo:              │  │  Cada coluna:                │
│  1. Saudação         │  │  • Template de mensagem      │
│  2. Envio materiais  │  │  • Intervalo de envio        │
│  3. Responder dúvidas│  │  • Produtos vinculados       │
│  4. Handoff humano   │  │  • Agendamento (opcional)    │
│                      │  │                              │
│  ⚠️ NÃO interfere    │  │  ⚠️ NÃO interfere            │
│     com Kanban       │  │     com Bot WhatsApp         │
└──────────────────────┘  └──────────────────────────────┘
```

## 🔄 Fluxo Detalhado

### 1. Captação no Chat Web

```typescript
// Usuario completa conversa no /chat
chatbotSession = {
  capturedName: "João Silva",
  capturedPhone: "45999070479",
  capturedEmail: "joao@example.com",
  interest: "Bebedouro e Freestall",
  userResponses: {
    selected_products: ["Bebedouro", "Freestall"],
    wants_pricing: true,
    wants_human: true,
    user_type: "Produtor rural",
    activity: "Pecuária leiteira"
  },
  qualificationScore: 85,
  currentStepId: "human_handoff"
}
```

### 2. Criação do Lead com Metadata Enriquecida

```typescript
lead = {
  id: "abc123",
  name: "João Silva",
  phone: "45999070479",
  status: "NOVO",
  priority: "HIGH", // Score >= 60
  source: "Chatbot",
  leadScore: 85,
  metadata: {
    // Produtos de interesse
    selectedProducts: ["Bebedouro", "Freestall"],
    productsCount: 2,

    // Intenções
    wantsHumanContact: true,
    wantsPricing: true,
    wantsMaterial: false,

    // Contexto da conversa
    sessionId: "session123",
    interest: "Bebedouro e Freestall",
    segment: "Pecuária leiteira",
    userType: "produtor_rural",
    activity: "Pecuária leiteira",

    // Triggers para automação
    shouldTriggerWhatsAppBot: true,
    shouldAddToKanbanAutomation: true,

    // Timestamps
    capturedAt: "2025-10-21T14:30:00Z",
    conversationStage: 7
  }
}
```

### 3. Sistema de Tags Automáticas

```typescript
// Tags criadas automaticamente após criar lead
tags = [
  { name: "interesse-bebedouro", color: "#3B82F6" },
  { name: "interesse-freestall", color: "#10B981" },
  { name: "quer-orcamento", color: "#F59E0B" },
  { name: "handoff-humano", color: "#EF4444" },
  { name: "score-alto", color: "#8B5CF6" } // Score >= 60
]

// Vinculação automática
leadTags = [
  { leadId: "abc123", tagId: "tag1" }, // interesse-bebedouro
  { leadId: "abc123", tagId: "tag2" }, // interesse-freestall
  { leadId: "abc123", tagId: "tag3" }, // quer-orcamento
  { leadId: "abc123", tagId: "tag4" }, // handoff-humano
  { leadId: "abc123", tagId: "tag5" }  // score-alto
]
```

### 4. Trigger do Bot WhatsApp

```typescript
// Condições para trigger
if (metadata.wantsHumanContact || metadata.wantsPricing) {
  await whatsappBotService.startBotConversation(lead.id);
}

// Bot WhatsApp Session criada
whatsappBotSession = {
  id: "bot-session-123",
  leadId: "abc123",
  phone: "45999070479",
  currentStepId: "initial_context",
  contextData: {
    leadName: "João Silva",
    interesse: "Bebedouro e Freestall",
    selectedProducts: ["Bebedouro", "Freestall"],
    companyName: "Ferraco Metalúrgica",
    companyPhone: "(45) 99907-0479",
    // ... config da empresa
  },
  isActive: true,
  handedOffToHuman: false
}
```

### 5. Fluxo do Bot WhatsApp

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: initial_context                                    │
│                                                             │
│ 📱 "Olá, João! Aqui é o assistente da Ferraco!            │
│     Vi que você estava conversando comigo no site há pouco │
│     e demonstrou interesse em Bebedouro e Freestall.       │
│                                                             │
│     Posso te enviar mais informações e materiais?"         │
│                                                             │
│  [✅ Sim, pode enviar!]  [📅 Pode, mas só amanhã]         │
│  [❌ Não, obrigado]                                        │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼ (usuário clica "Sim")
┌─────────────────────────────────────────────────────────────┐
│ Step 2: send_materials                                     │
│                                                             │
│ 📱 "Perfeito! Vou te mandar tudo agora. 📱"               │
│                                                             │
│ [Enviando automaticamente]                                 │
│  📄 Catalogo_Bebedouro.pdf                                │
│  📄 Catalogo_Freestall.pdf                                │
│  🖼️ Foto_Bebedouro_1.jpg                                  │
│  🖼️ Foto_Freestall_1.jpg                                  │
│  💰 Tabela_Precos_2025.pdf                                │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼ (automático)
┌─────────────────────────────────────────────────────────────┐
│ Step 3: after_materials                                    │
│                                                             │
│ 📱 "Pronto! Enviei todo o material. 📦                     │
│     Dá uma olhada e me conta: o que achou?"               │
│                                                             │
│  [💬 Tenho uma dúvida]  [💰 Quero falar sobre preços]     │
│  [📍 Onde fica a loja?]  [✅ Tudo claro, quero comprar]   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼ (eventualmente)
┌─────────────────────────────────────────────────────────────┐
│ Step Final: handoff_to_sales                               │
│                                                             │
│ 📱 "Perfeito, João! 🎉                                     │
│     Vou te conectar com nosso especialista agora.          │
│                                                             │
│     O Fernando vai te atender em instantes via WhatsApp.   │
│     Ele vai tirar todas as suas dúvidas e ajudar com o     │
│     orçamento! 👨‍💼"                                        │
│                                                             │
│ [Sessão marcada como handedOffToHuman: true]              │
└─────────────────────────────────────────────────────────────┘
```

### 6. Automações Kanban (Paralelo)

```
┌────────────────────────────────────────────────────────────┐
│ COLUNA: Lead Novo (status: NOVO)                          │
│ ────────────────────────────────────────────────────────   │
│                                                            │
│  📋 João Silva                                            │
│      #interesse-bebedouro #interesse-freestall            │
│      #quer-orcamento #handoff-humano                      │
│                                                            │
│  [Aguardando movimentação manual do usuário]              │
└────────────────────────────────────────────────────────────┘
           │
           │ (Usuário arrasta para "Negociação")
           ▼
┌────────────────────────────────────────────────────────────┐
│ COLUNA: Negociação (status: NEGOCIACAO)                   │
│ ────────────────────────────────────────────────────────   │
│                                                            │
│  Template configurado:                                     │
│  "Olá {{nome}}! Vi que está interessado em {{produtos}}. │
│   Podemos agendar uma visita técnica?"                    │
│                                                            │
│  Intervalo: 60s entre mensagens                           │
│  Produtos vinculados: Bebedouro, Freestall               │
│                                                            │
│  ⏰ Próximo envio: Hoje às 15:00                          │
│                                                            │
│  [AUTOMAÇÃO ATIVA]                                        │
│  ✅ Mensagem será enviada automaticamente                 │
└────────────────────────────────────────────────────────────┘
```

## 🎯 Inteligência e Sincronização

### Prevenção de Conflitos

1. **Bot WhatsApp vs Automação Kanban**
   - Bot WhatsApp: Ativo apenas se `handedOffToHuman: false`
   - Automação Kanban: Verifica se `whatsappBotSession.isActive: false`
   - Quando bot faz handoff, automações podem assumir

2. **Prioridade de Envio**
   ```typescript
   if (whatsappBotSession?.isActive && !whatsappBotSession?.handedOffToHuman) {
     // Bot WhatsApp está ativo - NÃO enviar automação
     return;
   }

   if (automationLeadPosition?.nextScheduledAt <= now) {
     // Automação deve enviar
     await sendAutomationMessage(lead, template);
   }
   ```

3. **Transição Suave**
   ```typescript
   // Quando bot faz handoff
   await whatsappBotSession.update({
     handedOffToHuman: true,
     handoffAt: new Date()
   });

   // Automações podem assumir após 5 minutos
   const canAutomationTakeover =
     Date.now() - handoffAt.getTime() > 5 * 60 * 1000;
   ```

## 📊 Monitoramento e Logs

```typescript
// Log completo do ciclo de vida
logger.info('📝 Lead criado', {
  leadId,
  source: 'Chatbot',
  selectedProducts: metadata.selectedProducts,
  triggers: {
    whatsappBot: metadata.shouldTriggerWhatsAppBot,
    kanbanAutomation: metadata.shouldAddToKanbanAutomation
  }
});

logger.info('🤖 Bot WhatsApp iniciado', {
  leadId,
  sessionId: whatsappBotSession.id,
  currentStep: 'initial_context'
});

logger.info('📤 Mensagem automação enviada', {
  leadId,
  columnId,
  templateId,
  scheduledAt,
  sentAt: new Date()
});
```

## 🔧 Configurações

### chatbot-session.service.ts
- Criar lead com metadata enriquecida
- Adicionar tags automáticas
- Trigger condicional do bot WhatsApp

### whatsapp-bot.service.ts
- Receber produtos de interesse
- Enviar materiais dinamicamente
- Sempre fazer handoff para humano

### automation-kanban.service.ts
- Verificar bot ativo antes de enviar
- Respeitar horários comerciais
- Limitar envios por hora/dia

## ✅ Benefícios

1. **Captação Inteligente**: Chat web captura intenções claras
2. **Followup Automático**: Bot WhatsApp engaja imediatamente
3. **Nutrição Contínua**: Automações Kanban mantém engajamento
4. **Handoff Perfeito**: Transição suave para atendimento humano
5. **Zero Conflitos**: Sistemas trabalham em harmonia
6. **Rastreabilidade Total**: Tags e metadata permitem análise profunda
