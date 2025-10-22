# 📱 Feedback Visual de Automação de Produtos nos Cards de Leads

## 🎯 Visão Geral

Sistema de **feedback visual em tempo real** que mostra o status de envio automático de materiais de produtos via WhatsApp **diretamente nos cards de leads**, independente do sistema de colunas Kanban de automação.

---

## ✨ Características

### **1. Badge de Status Visual**
Cada lead que possui automação de envio de materiais exibe um badge na parte inferior do card com:

- **Ícone de Pacote** (`📦`) - Identifica visualmente automações de produtos
- **Cor dinâmica** baseada no status:
  - 🟢 **Verde** - Material enviado com sucesso (SENT)
  - 🔴 **Vermelho** - Falha no envio (FAILED)
  - 🔵 **Azul** - Enviando agora (PROCESSING)
  - 🟡 **Amarelo** - Na fila de envio (PENDING)

### **2. Botão de Retry Inteligente**
- Aparece **apenas** para automações com status:
  - `FAILED` - Falha no envio
  - `PENDING` - Aguardando envio
- Permite **reenvio imediato** com um clique
- Animação de loading durante o processamento
- Toast de confirmação/erro

### **3. Indicador de Progresso**
Para automações em processamento (`PROCESSING`):
- Exibe **contador de mensagens**: `5/12`
- Atualiza em tempo real conforme mensagens são enviadas

### **4. Tooltip Informativo**
Ao passar o mouse sobre o badge, exibe:
- **Produtos** que serão/foram enviados
- **Progresso** detalhado (mensagens enviadas/total)
- **Data de conclusão** (se concluído)
- **Mensagem de erro** (se falhou)

---

## 🎨 Exemplos Visuais

### Card com Material Enviado ✅
```
┌─────────────────────────────┐
│ 👤 João Silva              │
│ 📱 (11) 99999-9999         │
│ 📅 15/10                   │
│ 🏷️ Cliente | Interessado   │
├─────────────────────────────┤
│ 📦 Material Enviado   🟢   │ ← Badge verde
└─────────────────────────────┘
```

### Card com Envio em Andamento ⏳
```
┌─────────────────────────────┐
│ 👤 Maria Santos            │
│ 📱 (11) 98888-8888         │
│ 📅 16/10                   │
│ 🏷️ Lead Quente             │
├─────────────────────────────┤
│ 📦 Enviando...  🔵  7/12   │ ← Badge azul + progresso
└─────────────────────────────┘
```

### Card com Falha + Retry 🔴
```
┌─────────────────────────────┐
│ 👤 Carlos Souza            │
│ 📱 (11) 97777-7777         │
│ 📅 14/10                   │
│ 🏷️ Novo Lead               │
├─────────────────────────────┤
│ 📦 Falha no Envio  🔴  🔄  │ ← Badge vermelho + botão retry
└─────────────────────────────┘
```

### Card com Fila de Envio ⏸️
```
┌─────────────────────────────┐
│ 👤 Ana Paula               │
│ 📱 (11) 96666-6666         │
│ 📅 17/10                   │
│ 🏷️ Chatbot                 │
├─────────────────────────────┤
│ 📦 Na Fila          🟡  🔄 │ ← Badge amarelo + botão retry
└─────────────────────────────┘
```

---

## 🔧 Implementação Técnica

### **Arquivos Modificados/Criados**

1. **Hook Customizado**
   - `apps/frontend/src/hooks/useWhatsAppAutomation.ts`
   - Funções: `useLeadLastAutomation()`, `useRetryAutomation()`

2. **Componente LeadCard**
   - `apps/frontend/src/components/kanban/LeadCard.tsx`
   - Badge visual + botão retry + tooltip

3. **Service Layer**
   - Já existente: `apps/frontend/src/services/whatsappAutomation.service.ts`

### **Fluxo de Dados**

```
Lead Card (Render)
    ↓
useLeadLastAutomation(leadId)
    ↓
React Query (Cache 30s + Auto-refresh)
    ↓
API: GET /api/whatsapp-automations/lead/:leadId
    ↓
Backend: whatsappAutomationService.list()
    ↓
PostgreSQL: whatsapp_automations
```

### **Performance**

- ✅ **Cache inteligente**: 30 segundos de staleTime
- ✅ **Auto-refresh**: Atualiza a cada 30s automaticamente
- ✅ **Lazy loading**: Só busca se o lead estiver visível
- ✅ **Query deduplication**: React Query evita requisições duplicadas
- ✅ **Optimistic updates**: UI atualiza instantaneamente no retry

---

## 🚀 Como Usar

### **1. Visualizar Status**
- Basta abrir a página de Leads (`/admin/leads`)
- Cards com automação de materiais exibirão o badge automaticamente

### **2. Reenviar Materiais**
- Clique no botão 🔄 no badge de leads com status `FAILED` ou `PENDING`
- Confirmação via toast
- Automação volta para a fila de processamento

### **3. Monitorar Progresso**
- Leads em processamento mostram `X/Y` mensagens
- Atualiza em tempo real conforme o backend envia

### **4. Ver Detalhes**
- Passe o mouse sobre o badge
- Tooltip exibe produtos, progresso e erros

---

## 🔍 Cenários de Uso

### **Cenário 1: Lead Novo com Interesse em Produtos**
1. Lead preenche chatbot manifestando interesse em "Bebedouro" e "Purificador"
2. Sistema cria lead no PostgreSQL
3. `chatbot-session.service.ts` chama `whatsappAutomationService.createAutomationFromLead()`
4. Automação criada com status `PENDING`
5. **Card do lead exibe**: 📦 Na Fila 🟡 🔄
6. Fila processa automação
7. **Card atualiza para**: 📦 Enviando... 🔵 3/8
8. Envio completo
9. **Card atualiza para**: 📦 Material Enviado 🟢

### **Cenário 2: Falha no Envio**
1. Automação tenta enviar mas WhatsApp está desconectado
2. Status muda para `FAILED`
3. **Card exibe**: 📦 Falha no Envio 🔴 🔄
4. Usuário clica no botão retry
5. Automação volta para `PENDING`
6. Sistema tenta novamente

### **Cenário 3: Lead sem Automação**
- Lead criado manualmente sem interesse em produtos
- Nenhum badge de automação aparece
- Card permanece normal

---

## 🆚 Diferenças do Sistema de Colunas Kanban

| **Automação de Produtos** | **Automação de Colunas** |
|---------------------------|--------------------------|
| Badge visual no card | Lead movido entre colunas |
| Independente de posição no Kanban | Depende da coluna |
| Envio baseado em interesse manifestado | Envio baseado em movimentação manual |
| Automático ao criar lead | Manual (arrastando lead) |
| Produtos configurados no chatbot | Templates configurados nas colunas |
| Sistema **stateless** (dados no card) | Sistema **stateful** (posição no Kanban) |

**✅ Ambos sistemas coexistem perfeitamente!**

Um lead pode:
- Estar em uma coluna Kanban recebendo mensagens agendadas
- **E** ter um badge de automação de produtos no card
- São sistemas complementares e independentes

---

## 📊 Estatísticas Disponíveis

### **No Dashboard** (`/admin/whatsapp-automations`)
- Total de automações criadas
- Taxa de sucesso
- Automações pendentes/processando/enviadas/falhadas
- Últimas execuções

### **Nos Cards** (em tempo real)
- Status atual da automação
- Progresso de envio
- Produtos sendo enviados
- Botão de retry se necessário

---

## 🐛 Troubleshooting

### **Badge não aparece no card**
1. Verificar se lead tem automação criada:
   ```sql
   SELECT * FROM whatsapp_automations WHERE leadId = '<ID_DO_LEAD>';
   ```

2. Verificar se hook está sendo chamado:
   - Abrir DevTools → Network
   - Procurar por `/api/whatsapp-automations/lead/`

3. Verificar cache do React Query:
   - Instalar React Query DevTools
   - Ver se query está em cache

### **Retry não funciona**
1. Verificar se automação existe:
   ```sql
   SELECT * FROM whatsapp_automations WHERE id = '<ID_AUTOMACAO>';
   ```

2. Verificar logs do backend durante retry

3. Verificar se toast de erro aparece

### **Progresso não atualiza**
- Auto-refresh está ativo (30s)
- Forçar refresh manual mudando de aba e voltando
- Verificar se backend está processando a fila

---

## 🎁 Benefícios

✅ **Visibilidade Imediata** - Ver status sem abrir dashboards
✅ **Ação Rápida** - Retry com 1 clique
✅ **Sem Confusão** - Independente do Kanban de automação
✅ **Tempo Real** - Atualiza automaticamente
✅ **Performance** - Cache inteligente
✅ **UX Intuitiva** - Cores e ícones claros

---

## 🔮 Próximas Melhorias (Sugestões)

- [ ] Badge compacto quando há muitas tags
- [ ] Filtro por status de automação na página de leads
- [ ] Notificação push quando automação completa
- [ ] Histórico de tentativas de envio no tooltip
- [ ] Botão para criar automação manual no card
- [ ] Indicador de WhatsApp conectado/desconectado

---

**Implementado por:** Claude Code
**Data:** 2025-10-22
**Status:** ✅ Produção
