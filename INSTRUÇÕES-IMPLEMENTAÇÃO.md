# Instruções de Implementação - Novo Fluxo do Chatbot

## ✅ O que foi implementado

### 1. Novo Fluxo Conversacional (conversationFlowV3.ts)
- ✅ **Etapa 2 adicionada:** Captura de WhatsApp logo após o nome
- ✅ **Opção "Falar com a equipe":** Disponível em todos os steps após captura inicial (Etapas 3+)
- ✅ **Step `human_handoff`:** Novo step de handoff para atendimento humano
- ✅ **Qualificação atualizada:** Ramo de atividade em vez de tamanho de rebanho
- ✅ **Sistema de scoring ajustado:** Telefone vale 30 pontos (antes 25), prioridades HIGH/MEDIUM/LOW ajustadas

### 2. Service Atualizado (chatbot-session.service.ts)
- ✅ **Detecção de handoff humano:** Verifica se `currentStepId === 'human_handoff'`
- ✅ **Status ATENDIMENTO_HUMANO:** Leads que solicitam atendimento humano recebem este status
- ✅ **Priority HIGH automática:** Handoffs humanos sempre têm prioridade alta
- ✅ **Metadata enriquecido:** Novos campos conforme documento:
  - `userType`: produtor_rural | profissional_agro | terceiros | generico
  - `activity`: Ramo de atividade
  - `profession`: Profissão (se aplicável)
  - `urgency`: 15_dias | 1_2_meses | 3_meses_mais | sem_prazo
  - `requiresHumanAttendance`: true para handoffs
  - `handoffStage`: Step onde pediu atendimento
  - `conversationStage`: Número da etapa (1-12)

### 3. Scripts de Migração Criados
- ✅ SQL direto: `prisma/migrations/add_atendimento_humano_column.sql`
- ✅ Script TypeScript: `src/scripts/seed-atendimento-humano-column.ts`

---

## 🔧 O que você precisa fazer

### Passo 1: Criar a coluna "ATENDIMENTO HUMANO" no banco

**Opção A - Via Script TypeScript (recomendado):**
```bash
cd apps/backend
npx ts-node src/scripts/seed-atendimento-humano-column.ts
```

**Opção B - Via SQL direto:**
```bash
cd apps/backend
psql -U seu_usuario -d ferraco_crm -f prisma/migrations/add_atendimento_humano_column.sql
```

**Opção C - Manualmente pelo Prisma Studio:**
```bash
cd apps/backend
npx prisma studio
```

Então crie um novo registro em `KanbanColumn`:
- **name**: ATENDIMENTO HUMANO
- **color**: #FF6B6B
- **status**: ATENDIMENTO_HUMANO
- **order**: 0
- **isSystem**: false
- **isActive**: true

### Passo 2: Reiniciar o servidor backend

```bash
cd apps/backend
npm run dev
```

### Passo 3: Testar o novo fluxo

1. Acesse o chat da aplicação
2. Inicie uma conversa
3. Forneça nome
4. Forneça WhatsApp
5. Em qualquer etapa após isso, clique em "👤 Falar com a equipe"
6. Verifique se:
   - Lead é criado com status `ATENDIMENTO_HUMANO`
   - Lead aparece na coluna "ATENDIMENTO HUMANO" do Kanban
   - Metadata contém `requiresHumanAttendance: true`
   - Priority é `HIGH`

---

## 📊 Estrutura do novo fluxo

```
Etapa 1: Nome
   ↓
Etapa 2: WhatsApp (NOVA - CAPTURA ANTECIPADA)
   ↓
Etapa 3+: Qualificação / Produtos / FAQ
   ↓
   A partir daqui: Opção "👤 Falar com a equipe" disponível em TODAS as telas
   ↓
Etapa 11: Handoff Humano
   ↓
   Lead criado → Status "ATENDIMENTO_HUMANO" → Coluna "ATENDIMENTO HUMANO" → Bot WhatsApp (futuro)
```

---

## 🎯 Diferenças do fluxo anterior

| Aspecto | Antes | Agora |
|---------|-------|-------|
| **Captura WhatsApp** | No final do funil (Etapa 7) | Logo após o nome (Etapa 2) |
| **Opção atendimento humano** | Só em alguns steps | Em TODOS os steps após Etapa 2 |
| **Qualificação produtor** | Tamanho do rebanho | Ramo de atividade |
| **Status leads** | Sempre "NOVO" | "ATENDIMENTO_HUMANO" para handoffs |
| **Priority** | Baseada apenas no score | HIGH automático para handoffs |
| **Score WhatsApp** | +25 pontos | +30 pontos |
| **Threshold priority** | HIGH ≥50, MEDIUM <50 | HIGH ≥60, MEDIUM ≥40, LOW <40 |

---

## 📝 Variáveis dinâmicas disponíveis

Todas as mensagens do bot podem usar estas variáveis com a sintaxe `{variavel}`:

- `{nome}` - Nome capturado
- `{capturedPhone}` - WhatsApp capturado
- `{interesse}` / `{selectedProduct}` - Produto selecionado
- `{companyName}` - Nome da empresa (do ChatbotConfig)
- `{companyPhone}` - Telefone da empresa
- `{companyAddress}` - Endereço
- `{companyWebsite}` - Site
- `{workingHours}` - Horário de funcionamento
- `{productList}` - Lista formatada de produtos
- `{productDetails}` - Detalhes do produto selecionado
- `{productBenefits}` - Benefícios do produto
- `{relatedProducts}` - Produtos relacionados
- `{faqAnswer}` - Resposta do FAQ

---

## 🔮 Próximos passos (futuro)

1. **Integração WhatsApp API:**
   - Quando lead vai para "ATENDIMENTO_HUMANO", disparar mensagem automática
   - Bot WhatsApp assume conversa
   - Contexto completo da conversa do chat disponível

2. **Dashboard de Atendimento:**
   - Visualização de leads aguardando atendimento humano
   - Tempo médio de espera
   - Taxa de conversão handoff → fechamento

3. **Notificações:**
   - Email/SMS para equipe quando novo handoff ocorre
   - Integração com Slack/Teams

---

## ❓ Troubleshooting

### Coluna não aparece no Kanban
- Verifique se o script de seed foi executado com sucesso
- Confirme no banco: `SELECT * FROM "KanbanColumn" WHERE status = 'ATENDIMENTO_HUMANO';`
- Limpe cache do navegador (Ctrl+Shift+R)

### Leads não estão com status ATENDIMENTO_HUMANO
- Verifique se o fluxo está passando pelo step `human_handoff`
- Confirme que `currentStepId === 'human_handoff'` no momento da criação
- Verifique logs do backend

### Opção "Falar com a equipe" não aparece
- Confirme que o conversationFlowV3.ts foi atualizado
- Reinicie o servidor backend
- Limpe cache do frontend

---

## 📞 Suporte

Se encontrar problemas, verifique:

1. **Logs do backend:** `apps/backend/logs/`
2. **Console do navegador:** F12 → Console
3. **Banco de dados:** Use Prisma Studio para inspecionar dados
4. **Documento de fluxo:** `FLUXOS-CHATBOT.md` tem toda a documentação

---

**Data da implementação:** 2025-01-15
**Versão do fluxo:** V3.1 (WhatsApp antecipado + Handoff humano)
