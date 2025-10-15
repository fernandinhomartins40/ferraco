# Fluxo do Bot WhatsApp - Ferraco CRM

## 📱 Visão Geral

Este é o **Bot WhatsApp** que dá continuidade à conversa iniciada no chat do site. Ele é ativado automaticamente quando um lead solicita "Falar com a equipe" no chat web.

### Objetivo Principal
Automatizar o primeiro contato via WhatsApp, enviando materiais e mantendo engajamento até transferir para atendimento humano real.

### Diferenças do Bot do Chat Web

| Aspecto | Bot Chat Web | Bot WhatsApp |
|---------|--------------|--------------|
| **Objetivo** | Captar lead e qualificar | Nutrir lead e preparar para venda |
| **Captura de dados** | Nome + WhatsApp + qualificação | Já tem todos os dados |
| **Conteúdo** | Apresentação geral | Material específico do interesse |
| **Final** | Handoff para WhatsApp | Handoff para humano real |
| **Mídia** | Apenas texto | Texto + imagens + PDFs + vídeos |
| **Contexto** | Zero (primeira interação) | Completo (sabe tudo da conversa anterior) |

---

## 🔄 Gatilho de Ativação

O Bot WhatsApp é disparado quando:
1. Lead é criado no chat web com `status: "ATENDIMENTO_HUMANO"`
2. Sistema detecta `metadata.requiresHumanAttendance: true`
3. Envia mensagem inicial automaticamente via WhatsApp API

**Dados disponíveis do lead:**
- Nome completo
- Número WhatsApp
- Produtos que visualizou
- Perguntas que fez
- Nível de interesse (score)
- Urgência declarada
- Todo histórico da conversa no site

---

## 💬 FLUXO DO BOT WHATSAPP

### Etapa 1: Mensagem Inicial (Contextualização) ⭐

**Bot envia automaticamente:**

```
Olá, {nome}! 👋

Aqui é o assistente da {companyName}!

Vi que você estava conversando comigo no site há pouco e demonstrou interesse em {interesse}.

Posso te enviar mais informações e materiais sobre {interesse}? 😊
```

**Opções:**
- ✅ "Sim, pode enviar!"
- 📅 "Pode, mas só amanhã"
- ❌ "Não, obrigado"

---

### Etapa 2A: Envio de Material (Se confirmou)

**Bot envia:**

```
Perfeito, {nome}! Vou te mandar tudo agora. 📱

Preparei um material completo sobre {interesse} pra você:
```

**Sequência de envio:**
1. 📄 **PDF técnico** (se cadastrado no produto)
   - Especificações
   - Ficha técnica

2. 📸 **Imagens do produto** (3-5 fotos)
   - Alta resolução
   - Diferentes ângulos

3. 🎥 **Vídeo demonstrativo** (se disponível)
   - Instalação
   - Uso prático

4. 💰 **Tabela de preços** (imagem)
   - Valores
   - Condições de pagamento
   - Promoções ativas

**Mensagem após envio:**

```
Pronto! Enviei todo o material sobre {interesse}. 📦

Dá uma olhada com calma e me conta: o que achou? Ficou alguma dúvida?
```

**Opções:**
- 💬 "Tenho uma dúvida" → Etapa 3
- 💰 "Quero falar sobre preços" → Etapa 4
- 📍 "Onde fica a loja?" → Etapa 5
- ✅ "Tudo claro, quero comprar" → Etapa 6 (Handoff)

---

### Etapa 2B: Reagendamento (Se pediu para depois)

**Bot envia:**

```
Tranquilo, {nome}! 😊

Vou te mandar as informações amanhã então.

Que horas é melhor pra você?
```

**Opções:**
- 🌅 "De manhã (8h-12h)"
- 🌞 "À tarde (13h-17h)"
- 🌙 "À noite (18h-21h)"

**Bot confirma:**

```
Anotado! Amanhã {periodo} eu te mando tudo certinho. 📝

Se precisar antes, é só me chamar aqui! 👋
```

**Sistema agenda:**
- Cria tarefa no CRM
- Notifica equipe
- Dispara mensagem no horário escolhido

---

### Etapa 2C: Recusa (Se não quer receber)

**Bot envia:**

```
Sem problemas, {nome}! 😊

Se mudar de ideia e quiser saber mais sobre {interesse}, é só me chamar aqui no WhatsApp.

Fico à disposição! 👋

📞 {companyPhone}
📍 {companyAddress}
```

**Sistema:**
- Lead continua na coluna "ATENDIMENTO HUMANO"
- Equipe pode fazer follow-up manual
- Conversa encerra

---

### Etapa 3: Responder Dúvidas (Inteligente)

**Quando usuário tem dúvida:**

**Bot:**
```
Claro! Pode perguntar, {nome}. Estou aqui pra te ajudar! 😊
```

**Usuário digita a pergunta**

**Bot analisa e responde:**

1. **Se encontrou resposta no FAQ:**
```
Sobre {tema_da_pergunta}:

{resposta_do_faq}

Isso esclarece sua dúvida? 🤔
```

2. **Se NÃO encontrou resposta:**
```
Essa é uma ótima pergunta! 🤔

Mas pra te responder com precisão, vou te conectar com um especialista do time que entende tudo desse produto.

Pode ser? 👨‍💼
```

**Opções após resposta:**
- ✅ "Sim, esclareceu!" → Volta para Etapa 2A (outras dúvidas?)
- ❓ "Tenho outra dúvida" → Loop Etapa 3
- 👤 "Quero falar com alguém" → Etapa 6 (Handoff)

---

### Etapa 4: Conversa sobre Preços

**Bot:**
```
Opa! Vamos falar de valores então. 💰

Vi aqui que você se interessou por {interesse}.

A tabela de preços que enviei está clara? Ou quer que eu explique melhor as condições?
```

**Opções:**
- 📋 "Tabela está clara"
- 💳 "Como funciona o pagamento?"
- 🎁 "Tem desconto?"
- 📊 "Preciso de um orçamento personalizado"

#### 4A: Condições de Pagamento

**Bot:**
```
Beleza! As formas de pagamento são:

💳 **À vista:** {desconto_avista}% de desconto
💰 **Parcelado:** Até {max_parcelas}x no cartão
📝 **Boleto:** Desconto de {desconto_boleto}%
🏢 **Faturado:** Para empresas (consulte condições)

Qual opção te interessa mais?
```

#### 4B: Descontos Disponíveis

**Bot:**
```
Olha que legal, {nome}! 🎉

Temos algumas condições especiais:

✅ Compra à vista: {desconto}% OFF
✅ Compra de {qtd_minima}+ unidades: {desconto_volume}% OFF
✅ Primeira compra: {desconto_primeira_compra}% OFF

E se você decidir hoje, posso falar com o gerente pra ver se consigo mais algum desconto. 😉

Quer que eu consulte?
```

**Se usuário quer consultar:**
```
Perfeito! Vou te conectar direto com nosso time comercial que vai te passar a melhor condição possível. 👨‍💼

Pode ser agora?
```
→ Vai para Etapa 6 (Handoff)

---

### Etapa 5: Informações da Loja

**Bot:**
```
Claro! Aqui estão nossas informações:

📍 **Endereço:** {companyAddress}

🕐 **Horário:** {workingHours}

📞 **Telefone:** {companyPhone}

🌐 **Site:** {companyWebsite}

Quer saber como chegar? Posso te mandar a localização no mapa! 📍
```

**Opções:**
- 📍 "Manda a localização" → Bot envia coordenadas GPS
- 🚗 "Tem estacionamento?" → Info adicional
- 🕐 "Funciona aos sábados?" → Confirma horários
- ↩️ "Voltar pro produto" → Volta Etapa 2A

---

### Etapa 6: Handoff para Atendimento Humano ⭐

**Gatilhos para handoff:**
1. Usuário pediu falar com alguém
2. Bot não conseguiu responder pergunta
3. Usuário quer orçamento personalizado
4. Usuário demonstrou alta intenção de compra
5. Depois de 3+ interações no bot

**Mensagem do Bot:**

```
Perfeito, {nome}! 🤝

Vou encaminhar você para o meu time de atendimento, onde um humano dará continuidade à conversa.

Tenho certeza que eles vão te ajudar com tudo que você precisa!

Só um momento... 👨‍💼
```

**Sistema:**
1. Atualiza status do lead: `"EM_ATENDIMENTO"`
2. Notifica equipe disponível
3. Atribui lead para próximo atendente livre
4. Transfere conversa (contexto completo disponível)

**Mensagem do atendente humano:**

```
Olá, {nome}! Sou {nome_atendente} da equipe {companyName}. 😊

Vi aqui que você está interessado em {interesse}. Vou te ajudar com tudo que precisar!

{contexto_especifico_da_conversa}
```

---

## 🎯 Fluxos Especiais

### Fluxo 1: Lead "Quente" (Alta urgência)

**Se metadata contém `urgency: "15_dias"`:**

**Bot inicia com:**
```
Olá, {nome}! 👋

Vi que você tem uma necessidade urgente de {interesse}.

Vou priorizar seu atendimento e te conectar AGORA com nosso time comercial.

Eles vão te passar as melhores condições e agilizar tudo pra você! 🚀
```

**Ações:**
- Dispara notificação PRIORITÁRIA para equipe
- Lead vai para topo da fila
- Atendente é alertado por SMS
- Handoff imediato (pula Etapas 2-5)

---

### Fluxo 2: Lead "Navegador" (Sem urgência)

**Se metadata contém `urgency: "sem_prazo"`:**

**Bot adiciona após Etapa 2A:**
```
Vi que você ainda está pesquisando, sem pressa. Tudo bem! 😊

Além de {interesse}, temos outros produtos que podem te interessar:

{produtos_relacionados}

Quer dar uma olhada?
```

**Estratégia:**
- Nutrição de lead (não força venda)
- Apresenta produtos complementares
- Agenda follow-up para 7 dias depois
- Mantém engajamento até decisão

---

### Fluxo 3: Reengajamento (Lead não respondeu)

**Se lead não responde em 2 horas:**

**Bot envia:**
```
Oi, {nome}! 😊

Viu o material que te mandei sobre {interesse}?

Se tiver alguma dúvida ou quiser conversar, é só me chamar aqui!

Fico no aguardo. 📱
```

**Se ainda não responde em 24h:**

**Sistema:**
- Notifica equipe
- Move para coluna "FOLLOW-UP PENDENTE"
- Agenda ligação humana

---

## 📊 Fluxo Completo Resumido

```
GATILHO: Lead solicita "Falar com equipe" no chat web
   ↓
SISTEMA: Cria lead com status "ATENDIMENTO_HUMANO"
   ↓
BOT WHATSAPP: Envia mensagem inicial contextualizada
   ↓
USUÁRIO: Confirma receber material
   ↓
BOT: Envia PDFs + Imagens + Vídeos + Preços
   ↓
BOT: Pergunta se tem dúvidas
   ↓
INTERAÇÕES: Responde perguntas / Fala sobre preços / Info da loja
   ↓
BOT: "Vou te conectar com time de atendimento"
   ↓
SISTEMA: Notifica atendente + Transfere conversa
   ↓
HUMANO: Assume conversa com contexto completo
   ↓
FECHAMENTO: Venda ou Follow-up agendado
```

---

## 🔧 Variáveis Dinâmicas Disponíveis

Todas as mensagens podem usar:

### Do Lead (capturado no chat web):
- `{nome}` - Nome do lead
- `{phone}` - WhatsApp
- `{interesse}` - Produto/interesse principal
- `{urgency}` - Nível de urgência
- `{score}` - Pontuação de qualificação
- `{user_type}` - Produtor/Profissional/Terceiro

### Da Empresa (ChatbotConfig):
- `{companyName}` - Nome da empresa
- `{companyPhone}` - Telefone
- `{companyAddress}` - Endereço
- `{companyWebsite}` - Site
- `{workingHours}` - Horário

### Dos Produtos (banco de dados):
- `{productList}` - Lista de produtos
- `{productDetails}` - Detalhes do produto
- `{productPrice}` - Preço
- `{productImages}` - URLs das imagens
- `{productPDF}` - URL do PDF técnico
- `{productVideo}` - URL do vídeo

### Do Contexto (conversa anterior):
- `{chat_history}` - Resumo da conversa no site
- `{questions_asked}` - Perguntas feitas
- `{products_viewed}` - Produtos visualizados

---

## 🎨 Tipos de Mídia Suportados

### 1. Imagens (.jpg, .png)
- **Produtos:** Fotos de alta resolução
- **Tabelas:** Preços formatados
- **Certificados:** Qualidade, garantias
- **Comparativos:** Antes/depois

### 2. Documentos (.pdf)
- **Catálogos:** Linha completa
- **Fichas técnicas:** Especificações
- **Manuais:** Instalação/uso
- **Contratos:** Modelos

### 3. Vídeos (.mp4, .avi)
- **Demonstrações:** Como usar
- **Instalação:** Passo a passo
- **Depoimentos:** Clientes satisfeitos
- **Tour virtual:** Loja/fábrica

### 4. Áudios (.mp3, .ogg)
- **Depoimentos:** Clientes (voz)
- **Instruções:** Rápidas e objetivas

---

## 📱 Integração com Painel Admin

### Página "WhatsApp" do Painel

**Funcionalidades necessárias:**

1. **Configuração do Bot:**
   - Ativar/Desativar bot automático
   - Customizar mensagens iniciais
   - Definir horário de operação do bot
   - Configurar tempo até handoff

2. **Gestão de Materiais:**
   - Upload de PDFs por produto
   - Upload de imagens (múltiplas)
   - Upload de vídeos
   - Organização por categoria

3. **Templates de Mensagem:**
   - Criar templates customizados
   - Variáveis dinâmicas
   - Preview antes de enviar
   - Biblioteca de mensagens

4. **Dashboard de Conversas:**
   - Leads aguardando resposta
   - Conversas ativas (bot)
   - Conversas ativas (humano)
   - Histórico completo

5. **Configurações de Handoff:**
   - Regras de transferência
   - Atendentes disponíveis
   - Horário de atendimento humano
   - Mensagem fora do horário

---

## 🚀 Comportamento Inteligente

### 1. Detecção de Intenção

**Bot analisa mensagens do usuário:**

- **"Quanto custa?"** → Envia tabela de preços
- **"Tem em estoque?"** → Consulta disponibilidade
- **"Pode parcelar?"** → Explica condições de pagamento
- **"Onde fica?"** → Envia localização
- **Palavras-chave negativas** → Handoff imediato

### 2. Aprendizado de Contexto

**Bot lembra da conversa:**
```
Você: "Quanto custa?"
Bot: "O {interesse} está R$ {preco}"

[5 mensagens depois]

Você: "E o prazo de entrega?"
Bot: "O {interesse} que te mostrei tem entrega em {prazo} dias"
```

### 3. Evita Repetição

**Se já enviou algo:**
```
Você: "Manda o catálogo de novo"
Bot: "Já enviei o catálogo há 5 minutos, {nome}. Dá uma olhada lá em cima nas mensagens! 😊"
```

---

## ⚙️ Configurações Técnicas

### Limites e Controles

- **Máximo de mensagens do bot:** 10 interações
- **Tempo até handoff forçado:** 15 minutos
- **Delay entre mensagens:** 2-3 segundos (parece humano)
- **Horário de operação do bot:** 24/7
- **Horário de handoff humano:** Conforme {workingHours}

### Fora do Horário de Atendimento Humano

**Bot avisa:**
```
Olá, {nome}! 😊

No momento nosso time está fora do horário de atendimento.

Mas pode deixar sua mensagem que amanhã às {horario_abertura} alguém te responde!

Ou se preferir, posso continuar te ajudando com informações sobre nossos produtos. 📱
```

---

## 📈 Métricas e Analytics

### Indicadores do Bot:

1. **Taxa de resposta:** % leads que respondem mensagem inicial
2. **Taxa de engajamento:** Média de mensagens trocadas
3. **Tempo até handoff:** Quanto tempo no bot antes de ir pra humano
4. **Taxa de conversão:** % que viram clientes após bot
5. **Satisfação:** Pesquisa NPS após atendimento

### Relatórios:

- **Diário:** Leads atendidos, handoffs realizados
- **Semanal:** Performance por produto, horários de pico
- **Mensal:** ROI do bot, economia de tempo da equipe

---

## 🎯 Objetivos do Bot WhatsApp

### Objetivos Principais:
1. ✅ **Automatizar primeiro contato** (economia de tempo da equipe)
2. ✅ **Enviar materiais automaticamente** (lead recebe info na hora)
3. ✅ **Manter engajamento** (lead não esfria)
4. ✅ **Qualificar ainda mais** (detecta intenção real de compra)
5. ✅ **Preparar para humano** (contexto completo para vendedor)

### Objetivos Secundários:
- Educar lead sobre produtos
- Esclarecer dúvidas simples (FAQ)
- Agendar visitas/reuniões
- Coletar feedback

---

## 🔮 Futuras Evoluções

### Fase 2 (Futuro):
- **Agendamento de visitas** via bot
- **Pagamento direto no WhatsApp** (WhatsApp Pay)
- **Rastreamento de pedido** automatizado
- **Pós-venda automatizado** (avaliação, suporte)

### Fase 3 (Futuro):
- **IA Generativa** para respostas mais naturais
- **Voz** (áudios gerados automaticamente)
- **Multi-idiomas** (inglês, espanhol)
- **Integração com ERP** (estoque real-time)

---

## 📝 Observações Importantes

1. **Bot NUNCA promete descontos** sem aprovação humana
2. **Bot NUNCA fecha vendas** sozinho (só prepara)
3. **Bot sempre menciona** que vai transferir para humano
4. **Bot é educado e amigável** (tom conversacional)
5. **Bot respeita LGPD** (não compartilha dados)

---

## 🎬 Exemplo de Conversa Completa

```
[SISTEMA DISPARA AUTOMATICAMENTE]

Bot: Olá, Maria! 👋
Vi que você estava conversando comigo no site e demonstrou interesse em Bebedouro Automático.
Posso te enviar mais informações? 😊

Maria: Sim, pode!

Bot: Perfeito! Vou te mandar tudo agora. 📱

[BOT ENVIA]
- 📄 Catálogo_Bebedouro.pdf
- 📸 Foto1.jpg, Foto2.jpg, Foto3.jpg
- 🎥 Video_Instalacao.mp4
- 💰 Tabela_Precos.jpg

Bot: Pronto! Enviei todo o material sobre Bebedouro Automático. 📦
Dá uma olhada com calma e me conta: o que achou?

Maria: Muito bom! Mas quanto custa?

Bot: Opa! Os valores estão na tabela que acabei de enviar. 💰
Temos:
- Modelo Standard: R$ 2.500
- Modelo Premium: R$ 3.800

Qual te interessou mais?

Maria: O Premium. Posso parcelar?

Bot: Pode sim! Até 12x no cartão. 💳
E se for à vista, tem 10% de desconto!

Maria: Legal! E a instalação?

Bot: Essa é uma ótima pergunta! 🤔
Pra te passar todos os detalhes de instalação e condições, vou te conectar com um especialista do time.
Pode ser? 👨‍💼

Maria: Pode!

Bot: Perfeito, Maria! 🤝
Vou encaminhar você para o meu time, onde um humano dará continuidade.
Só um momento...

[SISTEMA NOTIFICA ATENDENTE]

Atendente João: Olá, Maria! Sou João da equipe Ferraco. 😊
Vi que você se interessou pelo Bebedouro Premium!
Vou te passar tudo sobre instalação e a gente fecha esse negócio. 🚀

[CONVERSA CONTINUA COM HUMANO]
```

---

**Data da criação:** 2025-01-15
**Versão:** 1.0 (Proposta inicial)
**Status:** 📝 Aguardando aprovação e implementação
