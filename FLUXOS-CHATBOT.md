# Fluxos do Chatbot - Ferraco CRM

## Visão Geral

O fluxo conversacional implementado e em uso é o:
- **V3** (conversationFlowV3.ts) - Fluxo otimizado com qualificação inteligente ✅ **EM USO**

## 🔥 Principais Características do Fluxo Atual (V3)

✅ **Captura antecipada de WhatsApp** - Logo após o nome (Etapa 2)
✅ **Opção "Falar com a equipe" sempre disponível** - Em todas as etapas após captura inicial
✅ **Handoff para atendimento humano** - Lead vai para coluna "ATENDIMENTO HUMANO"
✅ **Bot WhatsApp assume conversa** - Integração futura com bot de WhatsApp
✅ **Sistema de scoring inteligente** - 100 pontos baseado em comportamento
✅ **Qualificação de contexto** - Identifica se é produtor, profissional ou terceiros

## 📊 Resumo do Fluxo

```
Etapas: 1.Nome → 2.WhatsApp → 3.Contexto → 4.Interesse → 5.Produtos → 6.Detalhes → 7-12.Conversão
                       ↓
                A partir da Etapa 3: Opção "💬 Falar com a equipe" disponível em TODAS as telas
                       ↓
                Lead criado → Status "ATENDIMENTO_HUMANO" → Coluna "ATENDIMENTO HUMANO" → Bot WhatsApp
```

---

## FLUXO V3 (Atual - Em Uso)

### Etapa 1: Boas-vindas e Captura de Nome
1. Bot cumprimenta e pede o nome
2. Usuário digita o nome
3. Bot vai para: **Captura de WhatsApp**

### Etapa 2: Captura de WhatsApp (ANTECIPADA)
Bot pergunta: "Para que eu possa deixar anotado aqui, qual o melhor número de WhatsApp para entrarmos em contato?"

1. Usuário digita o número
2. Bot valida o número
3. Bot vai para: **Verificação de Contexto**

### Etapa 3: Verificação de Contexto
Bot pergunta: "Você trabalha com pecuária?"

Opções:
- "Sim, sou produtor rural" → Qualificação Produtor
- "Trabalho no setor agro" → Qualificação Profissional
- "Estou pesquisando pra alguém" → Qualificação Terceiros
- "Só quero conhecer os produtos" → Escolha Inicial
- **"💬 Falar com a equipe"** → Handoff Humano

#### 3.1: Qualificação Produtor
Pergunta: "Qual o seu ramo de atividade?"

Opções sugeridas:
- "Pecuária leiteira" → Escolha Inicial
- "Pecuária de corte" → Escolha Inicial
- "Agricultura" → Escolha Inicial
- "Outros" → Escolha Inicial
- **"💬 Falar com a equipe"** → Handoff Humano

#### 3.2: Qualificação Profissional
Pergunta: "Você atua em qual área?"

Opções:
- "Veterinário/Zootecnista" → Escolha Inicial
- "Engenheiro/Arquiteto Rural" → Escolha Inicial
- "Consultor/Assessor Técnico" → Escolha Inicial
- "Trabalho com revenda" → Escolha Inicial
- **"💬 Falar com a equipe"** → Handoff Humano

#### 3.3: Qualificação Terceiros
Pergunta: "É pra um familiar, amigo ou cliente?"

Opções:
- "É pra família" → Escolha Inicial
- "Pra um amigo" → Escolha Inicial
- "Pra um cliente" → Escolha Inicial
- **"💬 Falar com a equipe"** → Handoff Humano

### Etapa 4: Escolha Inicial
Bot pergunta: "O que te traz aqui hoje?"

Opções:
- "Quero conhecer os produtos" → Mostrar Produtos
- "Preciso de um orçamento" → Pergunta sobre Orçamento
- "Tenho uma dúvida" → FAQ
- **"💬 Falar com a equipe"** → Handoff Humano

#### 4.1: Pergunta sobre Orçamento
Bot: "Você já sabe qual produto precisa?"

Opções:
- "Já sei o que quero" → Mostrar Produtos
- "Me mostra as opções" → Mostrar Produtos
- **"💬 Falar com a equipe"** → Handoff Humano

### Etapa 5: Apresentação de Produtos
Bot lista os produtos cadastrados no sistema + opções:
- [Produtos dinâmicos do banco] → Detalhes do Produto
- "Tenho uma dúvida antes" → FAQ
- **"💬 Falar com a equipe"** → Handoff Humano

### Etapa 6: Detalhes do Produto
Bot mostra especificações, benefícios e produtos relacionados

Opções:
- "Quero saber os valores" → Pergunta de Urgência
- "Me manda mais info no WhatsApp" → Confirmação de Envio
- "Tenho uma pergunta" → Dúvida Específica (responde com base no FAQ cadastrado)
- "Ver outros produtos" → Volta para Produtos
- **"💬 Falar com a equipe"** → Handoff Humano

#### 6.1: Pergunta de Urgência
Bot: "É pra quando?"

Opções:
- "Preciso urgente (15 dias)" → Confirmação de Handoff (Lead enviado ao time)
- "Pra 1 ou 2 meses" → Confirmação de Handoff (Lead enviado ao time)
- "Mais de 3 meses" → Confirmação de Handoff (Lead enviado ao time)
- "Ainda não tenho prazo" → Confirmação de Handoff (Lead enviado ao time)

**Observação:** Como o WhatsApp já foi capturado na Etapa 2, aqui apenas definimos urgência e encaminhamos ao time.

#### 6.2: Confirmação de Envio (Material no WhatsApp)
Bot confirma: "Perfeito! Vou enviar todo o material sobre {produto} no número {capturedPhone}."

Opções:
- "Obrigado, aguardo!" → Consentimento de Marketing
- "Ver outros produtos" → Volta para Produtos

#### 6.3: Dúvida Específica sobre Produto
1. Usuário digita a pergunta
2. Bot busca resposta no FAQ cadastrado
3. Bot responde e sugere:
   - "Respondeu minha dúvida" → Escolha de Próxima Ação
   - **"💬 Falar com a equipe"** → Handoff Humano
   - "Ver outros produtos" → Volta para Produtos

**Escolha de Próxima Ação:**
- "Quero saber os valores" → Pergunta de Urgência
- "Me manda mais info" → Confirmação de Envio
- "Ver outros produtos" → Volta para Produtos
- **"💬 Falar com a equipe"** → Handoff Humano

### Etapa 7: Confirmação de Handoff
Bot confirma que time vai entrar em contato: "Perfeito! Nosso time vai entrar em contato com você no número {capturedPhone} em breve."

**Lead é criado automaticamente neste ponto com:**
- Nome (Etapa 1)
- WhatsApp (Etapa 2)
- Qualificação/Contexto (Etapa 3)
- Interesse/Produto (Etapas 5-6)
- Urgência (Etapa 6.1)
- Score calculado

Bot pergunta: "Posso te avisar quando houver promoções sobre {interesse}?"

Opções:
- "Pode avisar sim" → Encerramento com Lead (marketing_opt_in = true)
- "Não precisa, obrigado" → Encerramento com Lead (marketing_opt_in = false)

### Etapa 8: Consentimento de Marketing
**Usado quando usuário pede material mas não quer atendimento imediato**

Bot pergunta: "Posso te avisar quando houver novidades sobre {interesse}?"

Opções:
- "Pode sim!" → Encerramento (CRIA LEAD com marketing_opt_in = true)
- "Não precisa, valeu" → Encerramento (CRIA LEAD com marketing_opt_in = false)

### Etapa 9: Continuar Navegando
**Usado para usuários que querem explorar sem compromisso**

Bot oferece: "Quer continuar explorando nossos produtos?"

Opções:
- "Quero ver mais produtos" → Volta para Produtos
- "Tenho uma dúvida" → FAQ
- "Vou ficando por aqui" → Encerramento Simples (CRIA LEAD com qualificação baixa)
- **"💬 Falar com a equipe"** → Handoff Humano

### Etapa 10: FAQ Inteligente
1. Bot pede a dúvida
2. Usuário digita
3. Bot busca resposta no banco (similaridade de palavras)
4. Bot mostra resposta e pergunta: "Consegui te ajudar?"

Opções:
- "Sim, obrigado!" → Pós-FAQ
- "Tenho outra dúvida" → Volta para FAQ
- **"💬 Falar com a equipe"** → Handoff Humano

#### 10.1: Pós-FAQ
Bot: "Quer ver os produtos ou prefere deixar pra depois?"

Opções:
- "Quero ver os produtos" → Mostrar Produtos
- "Vou ficando por aqui" → Encerramento Simples
- **"💬 Falar com a equipe"** → Handoff Humano

### Etapa 11: Handoff Humano (NOVO FLUXO) ⭐

**Disponível em todas as etapas após captura de nome e WhatsApp (Etapas 3 em diante)**

Quando o usuário escolhe "💬 Falar com a equipe":

1. **Bot confirma transferência:**
   - "Perfeito, {nome}! Vou te conectar com nossa equipe de atendimento."
   - "Você será atendido por um especialista em breve via WhatsApp no número {capturedPhone}."

2. **Lead é criado automaticamente com:**
   - **status**: "ATENDIMENTO_HUMANO"
   - **column**: "ATENDIMENTO HUMANO" (coluna específica no Kanban)
   - Todos os dados capturados até o momento
   - Flag `requiresHumanAttendance: true` no metadata

3. **Sistema envia mensagem automática via WhatsApp:**
   - Para o número capturado na Etapa 2
   - Mensagem inicial do Bot WhatsApp
   - **Bot WhatsApp assume a conversa** (será implementado posteriormente)

4. **Bot do chat encerra:**
   - "Pronto! Nossa equipe vai te chamar no WhatsApp em instantes."
   - "Fique de olho nas mensagens! 📱"
   - FIM da conversa no chat web

**Observações importantes:**
- Lead sempre tem nome + WhatsApp garantidos (capturados nas Etapas 1 e 2)
- Score é calculado com base no estágio onde solicitou atendimento humano
- Quanto mais avançado no funil, maior o score
- Metadata inclui: `handoffStage` (etapa onde pediu humano), `handoffReason` (contexto)

### Etapa 12: Encerramentos

**Encerramento com Lead:**
- Confirma que time vai entrar em contato
- Oferece ver mais produtos ou encerrar

**Encerramento Padrão:**
- Agradece e mostra contatos da empresa
- Oferece ver produtos ou encerrar

**Encerramento Simples:**
- Agradece e mostra contatos
- FIM

**Encerramento Final:**
- Despedida completa com todos os dados da empresa
- FIM

---

## Sistema de Pontuação (Scoring V3)

### Dados Básicos (50 pontos)
- Nome (Etapa 1): +10
- Telefone (Etapa 2): +30 ⭐ (capturado antecipadamente)
- Email (se capturado): +10

### Engajamento (30 pontos)
- 5+ mensagens: +10
- 10+ mensagens: +5
- 15+ mensagens: +5
- Mais de 2 minutos: +10

### Interesse (40 pontos)
- Tem interesse/produto selecionado: +10
- Passou por qualificação (Etapa 3): +10
- Viu produtos (Etapa 5): +5
- Viu detalhes do produto (Etapa 6): +10
- Informou urgência (Etapa 6.1): +5

### Qualificadores Especiais (até 30 pontos extras)
- Perguntou preço: +15
- Pediu material no WhatsApp: +10
- É produtor rural: +10
- Profissional do agro (Veterinário/Consultor): +15
- Ramo pecuária leiteira: +10
- Ramo pecuária de corte: +8
- Ramo agricultura: +5
- Urgente (15 dias): +20 ⭐
- Urgência 1-2 meses: +12
- Urgência 3+ meses: +5
- Sem urgência definida: +2
- Opt-in marketing: +5

**Score máximo:** 100 pontos

---

## Quando o Lead é Criado no Banco

### Momento da Criação

O lead é criado automaticamente quando o usuário completa uma das seguintes etapas:

1. **Etapa 11 - Handoff Humano** ⭐ (PRIORIDADE MÁXIMA)
   - Usuário solicitou falar com a equipe
   - Pode ocorrer em qualquer etapa após captura de nome/WhatsApp
   - Lead vai para coluna "ATENDIMENTO HUMANO"
   - **Status:** "ATENDIMENTO_HUMANO"
   - **Priority:** HIGH (independente do score)
   - Bot WhatsApp assume a conversa

2. **Etapa 7 - Confirmação de Handoff** (Alta prioridade)
   - Usuário perguntou sobre preço
   - Informou urgência
   - Será contatado pelo time

3. **Etapa 8 - Consentimento de Marketing** (Média prioridade)
   - Usuário pediu material no WhatsApp
   - Mostrou interesse mas sem urgência imediata

4. **Etapa 9 - Continuar Navegando** (Baixa prioridade)
   - Usuário explorou produtos mas não demonstrou urgência
   - Lead capturado para futuro follow-up

### Dados Salvos no Lead:

#### Campos Principais:
- **name**: Nome capturado (Etapa 1)
- **phone**: Telefone WhatsApp (Etapa 2) ⭐ **CAPTURADO LOGO NO INÍCIO**
- **email**: Email (se capturado)
- **source**: Origem da campanha (ex: "facebook", "instagram", "website")
- **status**: "NOVO"
- **priority**:
  - HIGH se score ≥ 60
  - MEDIUM se score ≥ 40
  - LOW se score < 40
- **leadScore**: Score calculado (máximo 100 pontos)

#### Metadata (JSON):
- **sessionId**: ID da sessão do chatbot
- **interest**: Produto/interesse capturado
- **userType**: "produtor_rural" | "profissional_agro" | "terceiros" | "generico"
- **activity**: Ramo de atividade (pecuária leiteira, corte, agricultura, etc)
- **profession**: Profissão (se profissional)
- **relation**: Relação (se terceiros)
- **urgency**: Urgência informada ("15_dias" | "1_2_meses" | "3_meses_mais" | "sem_prazo")
- **wantsPrice**: true/false - se perguntou sobre preço
- **wantsMaterial**: true/false - se pediu material
- **marketingOptIn**: true/false - se aceitou receber promoções
- **requiresHumanAttendance**: true/false ⭐ - se solicitou atendimento humano
- **handoffStage**: Etapa onde solicitou atendimento humano (ex: "context_check", "show_products", "product_details")
- **handoffReason**: Contexto do handoff (ex: "usuario_pediu_equipe", "nao_encontrou_resposta_faq")
- **userResponses**: Objeto com todas as respostas do usuário
- **campaign**: Nome da campanha (se vier de link rastreado)
- **capturedAt**: Timestamp da criação
- **conversationStage**: Estágio onde parou (1-12)

---

## Variáveis Dinâmicas Disponíveis

As seguintes variáveis podem ser usadas nas mensagens com a sintaxe `{variavel}`:

- `{nome}` - Nome do usuário
- `{interesse}` - Produto/interesse capturado
- `{companyName}` - Nome da empresa
- `{companyDescription}` - Descrição da empresa
- `{companyAddress}` - Endereço
- `{companyPhone}` - Telefone
- `{companyWebsite}` - Site
- `{workingHours}` - Horário de funcionamento
- `{capturedPhone}` - Telefone capturado do usuário
- `{productList}` - Lista formatada de produtos
- `{productDetails}` - Detalhes do produto selecionado
- `{productBenefits}` - Benefícios do produto
- `{relatedProducts}` - Produtos relacionados
- `{selectedProduct}` - Nome do produto escolhido
- `{faqAnswer}` - Resposta do FAQ

---

## Observações Técnicas

1. **Produtos são carregados do banco** (ChatbotConfig.products)
2. **FAQs vêm do banco** (ChatbotConfig.faqs)
3. **Busca de FAQ** usa similaridade de palavras (threshold 40 pontos)
4. **Opções dinâmicas** de produtos são inseridas em tempo real
5. **Score é recalculado** a cada interação
6. **Automação WhatsApp** é criada automaticamente ao criar lead

### Coluna "ATENDIMENTO HUMANO" no Kanban ⭐

**Nova coluna criada na página `/admin/leads`:**

- **Nome:** "ATENDIMENTO HUMANO"
- **Cor:** Laranja ou Vermelho (destaque visual)
- **Ordem:** Primeira coluna (prioridade máxima)
- **Função:** Recebe leads que solicitaram atendimento humano

**Comportamento:**
- Leads nesta coluna têm `status: "ATENDIMENTO_HUMANO"`
- São automaticamente priorizados (HIGH priority)
- Disparam envio de mensagem WhatsApp automática
- Bot WhatsApp assume conversa (implementação futura)
- Equipe pode visualizar todo histórico da conversa no chat

**Campos especiais no lead:**
- `metadata.requiresHumanAttendance`: true
- `metadata.handoffStage`: Step ID onde pediu atendimento
- `metadata.handoffReason`: Motivo do handoff

**Integração futura (Bot WhatsApp):**
- Sistema envia mensagem inicial via WhatsApp API
- Bot WhatsApp identifica lead existente pelo número
- Continua conversa com contexto completo
- Histórico do chat web fica disponível para o bot
