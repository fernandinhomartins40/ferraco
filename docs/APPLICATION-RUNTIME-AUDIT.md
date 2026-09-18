# APPLICATION-RUNTIME-AUDIT — Ferraco CRM

**Data:** 2026-09-17 · **Etapa:** AUDITORIA (somente análise) · **Host:** `72.60.10.108`
**Base:** [VPS-OPT-INVENTORY.md](VPS-OPT-INVENTORY.md) · [CONTAINER-AUDIT.md](CONTAINER-AUDIT.md) · [RUNTIME-RESOURCE-AUDIT.md](RUNTIME-RESOURCE-AUDIT.md) · [DOCKER-IMAGE-AUDIT.md](DOCKER-IMAGE-AUDIT.md) · [DATABASE-AUDIT.md](DATABASE-AUDIT.md) · [STORAGE-DISK-AUDIT.md](STORAGE-DISK-AUDIT.md) · [DEPLOY-CICD-AUDIT.md](DEPLOY-CICD-AUDIT.md)

**Cobertura:** `AUDITED` (analisado, **não corrigido**) · `PENDING` · `BLOCKED` · `NOT APPLICABLE`
**Métricas:** `NOT MEASURED` onde não há medição. Nenhum valor estimado.

> **Nada foi alterado.** Nenhuma carga gerada, nenhuma requisição à aplicação (que está fora do ar).
>
> **Stack confirmada:** Express 4.18 + Socket.IO 4.8 + Prisma 5.22 + whatsapp-web.js 1.34 + React 18/Vite 5. **Sem SSR** — o frontend é SPA servida como estático pelo nginx. Recomendações ajustadas a essas versões.
>
> **Limitação:** a aplicação não está em execução. Latência, throughput e volume de eventos são **`BLOCKED`**. Esta auditoria percorre o código executado e identifica causas antes de propor refatoração, conforme o escopo.

---

## Sumário de achados

| ID | Achado | Severidade | Recurso |
|---|---|---|---|
| **F-79** | **Socket.IO sem autenticação — QR code do WhatsApp enviado a qualquer conectante** | **CRÍTICA** | segurança |
| **F-80** | **`io.emit()` global vaza mensagens de todos os leads para todos os clientes** | **CRÍTICA** | segurança, rede |
| **F-81** | **Upload de imagem sem `authenticate`** | **CRÍTICA** | segurança |
| F-82 | N+1 sequencial via Puppeteer em `getConversations` | ALTA | CPU, latência |
| F-83 | Retry de webhook via `setTimeout` — perdido em restart | ALTA | confiabilidade |
| F-84 | `processPendingDeliveries()` nunca é chamado — fila sem consumidor | ALTA | confiabilidade |
| F-85 | Polling do frontend sobreposto ao WebSocket (10s/30s) | MÉDIA | CPU, rede |
| F-86 | `isRunning` não previne sobreposição real do scheduler | MÉDIA | integridade |
| F-87 | Automação sem marca de idempotência confirmada | ALTA | duplicidade |
| F-88 | `statsCache` sem isolamento por usuário nem limite de entradas | ALTA | segurança, RAM |
| F-89 | Sharp processa upload de forma síncrona no ciclo da requisição | MÉDIA | latência |
| F-90 | Timers não parados no shutdown — trabalho em voo perdido | MÉDIA | integridade |

---

## Parte I — WebSocket: o fluxo mais crítico

### F-79 · Socket.IO aceita qualquer conexão sem autenticação

| Campo | Conteúdo |
|---|---|
| **Evidência** | [server.ts:41-60](../apps/backend/src/server.ts#L41) — `io.on('connection', (socket) => {...})`. **Não há `io.use()` com middleware de autenticação**; nenhuma verificação de JWT em nenhum ponto do handler |
| **Ambiente** | produção |
| **Achado** | Qualquer cliente que alcance `/socket.io/` estabelece conexão. Pior: nas linhas 45-58, **imediatamente após conectar**, o servidor envia o estado atual — incluindo `socket.emit('whatsapp:qr', { qr: currentQR })`. O handler `whatsapp:request-qr` (L79) reenvia sob demanda |
| **Impacto** | **Sequestro de sessão do WhatsApp.** Quem conectar ao socket durante a janela de pareamento recebe o QR code e pode escaneá-lo, assumindo a conta de WhatsApp da empresa. O nginx faz proxy de `/socket.io/` com `proxy_read_timeout 7d` e a porta 3050 está em `0.0.0.0` ([CONTAINER-AUDIT.md F-16](CONTAINER-AUDIT.md)) — a superfície é pública |
| **Proposta** | `io.use()` validando o JWT no handshake (`socket.handshake.auth.token`), rejeitando conexões não autenticadas. Socket.IO 4.8 suporta isso nativamente — compatibilidade confirmada com a versão real |
| **Risco** | Frontend precisa enviar o token no handshake; sem isso, todos os clientes legítimos são desconectados. Exige mudança coordenada front+back |
| **Dependências** | Precede F-80 — sem identidade no socket não há como segmentar emissões |
| **Teste de aceite** | Conexão sem token é recusada; conexão com token válido funciona; QR não é entregue a cliente anônimo |
| **Rollback** | Remover o middleware |
| **Métrica esperada** | `NOT MEASURED` (segurança) |
| **Status** | `AUDITED` |

### F-80 · Broadcast global de mensagens

| Campo | Conteúdo |
|---|---|
| **Evidência** | ~12 ocorrências de `io.emit()` em [whatsappListeners.ts](../apps/backend/src/services/whatsappListeners.ts): L41 `message_create`, L64 `message_ack`, L82 `message_revoked`, L110 `message_reaction`, L131/147 chat events, L166-200 group events, L263 `call`, **L354 `whatsapp:new_message`**. Também [automationScheduler.service.ts:288,320](../apps/backend/src/services/automationScheduler.service.ts#L288) |
| **Achado** | O código **tem** segmentação por sala: L351 emite corretamente para `conversation:${message.from}`. Mas **na linha seguinte (L354) emite o mesmo payload globalmente** com `io.emit('whatsapp:new_message', ...)`. O payload inclui `contact.phone`, `contact.name`, `chat.name` e o corpo da mensagem ([whatsappListeners.ts:330-350](../apps/backend/src/services/whatsappListeners.ts#L330)) |
| **Impacto** | **Dois problemas simultâneos.** (1) **Vazamento de dados:** toda mensagem de todo lead chega a todo cliente conectado — e, por F-79, clientes não autenticados inclusive. Dados pessoais de clientes expostos entre usuários do CRM e a terceiros. (2) **Custo de rede e CPU:** cada mensagem é serializada e transmitida N vezes (N = clientes conectados), em vez de apenas aos interessados |
| **Proposta** | Substituir os `io.emit()` por emissão segmentada: sala da conversa para eventos de mensagem, e sala por papel/usuário para eventos administrativos. A sala `conversation:` já existe e funciona — o padrão correto já está implementado ao lado |
| **Risco** | Componentes do frontend que escutam `whatsapp:new_message` para atualizar a lista de conversas deixariam de receber. Exige mapear os consumidores antes |
| **Dependências** | **Depende de F-79** — sem identidade no socket, não há critério de segmentação |
| **Teste de aceite** | Cliente A não recebe mensagens de conversas às quais não está inscrito; a lista de conversas continua atualizando |
| **Rollback** | Restaurar os `io.emit()` |
| **Métrica esperada** | Redução de tráfego proporcional a N. **Valor real `NOT MEASURED`** |
| **Status** | `AUDITED` |

---

## Parte II — Fluxos de upload e autenticação

### F-81 · Upload de imagem sem autenticação

| Campo | Conteúdo |
|---|---|
| **Evidência** | [upload.routes.ts:16](../apps/backend/src/routes/upload.routes.ts#L16): `router.post('/image', upload.single('image'), uploadController.uploadImage.bind(uploadController));` — **sem `authenticate` na cadeia**. Contraste: [whatsapp.routes.ts:1675](../apps/backend/src/routes/whatsapp.routes.ts#L1675) aplica `authenticate` nas rotas de mídia do WhatsApp |
| **Achado** | Qualquer pessoa pode fazer upload de imagens até 50 MB, sem credencial. O arquivo é gravado no volume, processado por Sharp e servido publicamente ([CONTAINER-AUDIT.md F-07](CONTAINER-AUDIT.md)) |
| **Impacto** | **Três vetores combinados:** (1) preenchimento de disco por terceiros — e o disco é compartilhado com 4 aplicações ([STORAGE-DISK-AUDIT.md F-64](STORAGE-DISK-AUDIT.md)); (2) consumo de CPU/RAM nativa via Sharp, sem limite de taxa específico; (3) com SVG na allowlist e CSP desabilitada ([STORAGE-DISK-AUDIT.md F-59](STORAGE-DISK-AUDIT.md)), um agente anônimo **pode hospedar XSS no domínio da aplicação** |
| **Proposta** | Adicionar `authenticate` à rota. Se houver necessidade legítima de upload público (ex.: anexo em formulário de lead), criar rota separada com rate limit próprio, validação estrita e sem SVG |
| **Risco** | Se a landing page usar esta rota, o formulário público quebra. **Verificar antes** — é exatamente o tipo de uso que uma busca no frontend pode não revelar |
| **Dependências** | Interage com F-07, F-57, F-58, F-59 |
| **Teste de aceite** | Upload sem token retorna 401; upload autenticado funciona; fluxos da landing page verificados |
| **Rollback** | Remover o middleware |
| **Métrica esperada** | `NOT MEASURED` |
| **Status** | `AUDITED` |

### F-89 · Processamento de imagem síncrono na requisição

**Evidência:** [upload.controller.ts:216-222](../apps/backend/src/controllers/upload.controller.ts#L216) — `await sharp(buffer).resize(...).jpeg({quality}).toFile(filePath)` dentro do handler.

O escopo pede identificar trabalho síncrono custoso. Sharp não bloqueia o event loop (usa a threadpool do libuv), mas **ocupa uma das 4 threads** ([RUNTIME-RESOURCE-AUDIT.md M-02](RUNTIME-RESOURCE-AUDIT.md): `UV_THREADPOOL_SIZE` default 4, e o Node vê 4 CPUs sob qualquer cota). Com 4 uploads concorrentes, a threadpool satura e **todo outro I/O de arquivo do processo espera** — incluindo leitura de estáticos e operações de log.

**Proposta:** manter síncrono se o volume for baixo, mas configurar `sharp.concurrency()` explicitamente e avaliar fila com limite se o volume crescer. **Não proponho processamento assíncrono agora** — adicionaria fila persistente a uma aplicação que não tem uma, custo desproporcional ao problema atual. **Status:** `AUDITED`

---

## Parte III — Consultas repetidas e N+1

### F-82 · N+1 sequencial via Puppeteer em `getConversations`

| Campo | Conteúdo |
|---|---|
| **Evidência** | [whatsappWebJS.service.ts:757-810](../apps/backend/src/services/whatsappWebJS.service.ts#L757) — `getChats()` retorna todos os chats; depois `for (const chat of privateChats) { const messages = await chat.fetchMessages({ limit: 1 }); }` |
| **Achado** | Laço **sequencial** com uma chamada por chat. Cada `fetchMessages` não é consulta a banco: é uma travessia da ponte Node→Puppeteer→Chromium→WhatsApp Web, ordem de magnitude mais cara. Com `limit` chats, são `limit` travessias em série |
| **Impacto** | Latência linear no número de conversas. **Evidência de que já foi sentido:** o próprio código instrumenta os tempos (`getChatsTime`, `formatTime`) com logs dedicados — alguém já investigou lentidão aqui. Combinado ao polling de 30 s do frontend (F-85), o custo se repete continuamente |
| **Proposta** | Avaliar se `chat.lastMessage` está disponível no objeto retornado por `getChats()` na versão 1.34 do whatsapp-web.js — se estiver, elimina o laço inteiro. **Não prescrevo a API sem confirmar compatibilidade**, conforme o escopo: isso exige testar contra a versão real |
| **Risco** | A API do whatsapp-web.js é instável — o próprio código tem tratamento para *"WhatsApp Web API mudou"* (L765-767). Qualquer mudança aqui precisa de teste em sessão real |
| **Dependências** | Mitigado também por F-85 (reduzir a frequência de chamada) |
| **Teste de aceite** | Lista de conversas idêntica, com última mensagem correta, em tempo menor; medir `formatTime` antes/depois |
| **Rollback** | Restaurar o laço |
| **Métrica esperada** | `NOT MEASURED` — o código já loga os tempos; a medição existirá no primeiro deploy |
| **Status** | `AUDITED` |

### Evidência positiva — tratamento de erro por item

O laço captura erro por chat e continua (L806-809), em vez de falhar a lista inteira. É o padrão correto para integração instável.

---

## Parte IV — Polling e sobreposição

### F-85 · Polling redundante com WebSocket ativo

| Campo | Conteúdo |
|---|---|
| **Evidência** | [ConversationList.tsx:68-75](../apps/frontend/src/components/whatsapp/ConversationList.tsx#L68): `setInterval(() => fetchConversations(true), 30000)` — **e, logo abaixo (L78), `useWhatsAppWebSocket({ onConversationUpdate })`**. Também: [WhatsAppAutomations.tsx:86,96](../apps/frontend/src/pages/admin/WhatsAppAutomations.tsx#L86) `refetchInterval: 10000` (dois hooks), [useWhatsAppAutomation.ts:13](../apps/frontend/src/hooks/useWhatsAppAutomation.ts#L13) `refetchInterval: 30000` |
| **Achado** | O mesmo componente mantém polling de 30 s **e** assinatura WebSocket para o mesmo dado. O WebSocket existe justamente para eliminar o polling; manter os dois duplica o trabalho. `WhatsAppAutomations` tem **dois** `refetchInterval: 10000` simultâneos |
| **Impacto** | Cada ciclo de 30 s dispara `getConversations`, que é o N+1 de F-82. Com M abas abertas, são M × (1 + N) travessias ao Chromium a cada 30 s. Os `refetchInterval: 10000` batem no banco 6×/min por aba, por hook |
| **Proposta** | Onde há WebSocket cobrindo o dado, remover o polling ou elevar o intervalo para fallback (ex.: vários minutos). Consolidar os dois hooks de 10 s de `WhatsAppAutomations` |
| **Risco** | Se o WebSocket cair silenciosamente, o polling é a rede de segurança. Remover sem detecção de reconexão degrada a experiência. React Query 5 tem `refetchOnReconnect` — alternativa mais econômica que intervalo fixo |
| **Dependências** | Amplifica F-82; mitigado por ele também |
| **Teste de aceite** | Lista de conversas atualiza em tempo real por WebSocket; ao derrubar o socket, o fallback atua |
| **Rollback** | Restaurar os intervalos |
| **Métrica esperada** | `NOT MEASURED` |
| **Status** | `AUDITED` |

**Timers do frontend sem problema:** `HeroSection` (carrossel), `LazyLoadingSpinner` (animação), `AudioRecorder` (cronômetro), `useInactivityTimer` e `useTokenValidator` (sessão) são de UI/sessão, não geram carga no servidor. `AUDITED`

**`RecurrenceNotification.tsx:54`** — `setInterval(simulateRecurrenceDetection, 120000)`. O nome sugere **simulação**, não fluxo real. Não confirmei se dispara requisições. `PENDING`

---

## Parte V — Jobs, filas, retries e idempotência

### F-83 · Retry de webhook em `setTimeout` — não durável

| Campo | Conteúdo |
|---|---|
| **Evidência** | [webhook.service.ts:277-284](../apps/backend/src/modules/webhooks/webhook.service.ts#L277): `if (shouldRetry && nextAttemptAt) { const delay = ...; setTimeout(() => { this.executeDelivery(deliveryId) }, delay); }` |
| **Achado** | O agendamento do retry vive **apenas em memória**. O estado da entrega **é** persistido no banco (`attempts`, `nextAttemptAt`, `maxAttempts`) — a modelagem está correta —, mas o disparo depende de um `setTimeout` que morre com o processo |
| **Impacto** | **Todo deploy perde os retries pendentes.** Com `retryDelay` default de 60.000 ms e backoff multiplicativo (`retryDelay * attempts`), um retry de terceira tentativa está agendado para 3 minutos à frente; o deploy leva 6–20 min ([DEPLOY-CICD-AUDIT.md F-66](DEPLOY-CICD-AUDIT.md)). Entregas a **consumidores externos** ([CONTAINER-AUDIT.md X-02](CONTAINER-AUDIT.md)) são silenciosamente abandonadas. Também: `delay` pode ser negativo se `nextAttemptAt` já passou, fazendo o `setTimeout` disparar imediatamente |
| **Proposta** | Consumir a fila a partir do banco — que já tem os dados necessários — em vez de depender de temporizador em memória. **Ver F-84: o consumidor já existe e não é chamado** |
| **Risco** | Um consumidor por varredura precisa de proteção contra processamento duplo se houver mais de uma instância (hoje há uma só) |
| **Dependências** | **F-84 é a outra metade deste achado** |
| **Teste de aceite** | Entrega falha, processo reinicia, retry ocorre na janela esperada |
| **Rollback** | Restaurar o `setTimeout` |
| **Métrica esperada** | `NOT MEASURED` |
| **Status** | `AUDITED` |

### F-84 · `processPendingDeliveries()` existe e nunca é chamado

| Campo | Conteúdo |
|---|---|
| **Evidência** | `grep -rn "processPendingDeliveries" apps/backend/src` → **uma única ocorrência**: a própria definição em [webhook.service.ts:377](../apps/backend/src/modules/webhooks/webhook.service.ts#L377). Nenhum scheduler, rota, cron ou serviço a invoca |
| **Achado** | O método documentado como *"Processa deliveries pendentes (retry queue)"* está implementado mas **não tem nenhum chamador**. É exatamente o consumidor que F-83 precisaria |
| **Impacto** | Entregas marcadas como pendentes no banco após perda do `setTimeout` **nunca são reprocessadas** — ficam paradas indefinidamente. A tabela de deliveries acumula registros pendentes que ninguém consome |
| **Cautela metodológica** | O escopo adverte que ausência de referência numa busca não prova ausência de uso. Verifiquei chamada dinâmica (`this[...]`, reflexão, string) — não encontrei. Ainda assim, registro como **alta confiança, não certeza**: confirmar observando a aplicação em execução |
| **Proposta** | Invocar periodicamente por `CronJob`, seguindo o padrão já usado por `tokenCleanupService` |
| **Risco** | Baixo. Passar a processar uma fila até então parada pode disparar um lote de entregas antigas na primeira execução — avaliar corte por idade |
| **Dependências** | Resolve F-83 |
| **Teste de aceite** | Delivery pendente no banco é processada dentro do intervalo do job |
| **Rollback** | Remover o agendamento |
| **Métrica esperada** | `NOT MEASURED` |
| **Status** | `AUDITED` |

**Evidência positiva:** o webhook implementa backoff (`retryDelay * attempts`), teto de tentativas (`maxAttempts`), contagem de falhas e desativação automática (`shouldDisable`). O desenho de confiabilidade está correto — falta o mecanismo de disparo.

### F-86 · `isRunning` não previne sobreposição

**Evidência:** [automationScheduler.service.ts:13,29,35,58](../apps/backend/src/services/automationScheduler.service.ts#L13) — `isRunning` é marcado `true` em `start()` e `false` em `stop()`. O `setInterval` (L38) chama `processAutomations()` a cada 30 s **sem verificar** se a execução anterior terminou.

`isRunning` protege contra **iniciar o scheduler duas vezes**, não contra **ciclos sobrepostos**. Se `processAutomations()` levar mais de 30 s — plausível, já que envia mensagens WhatsApp via Puppeteer —, um segundo ciclo começa sobre o primeiro.

**Proposta:** guarda de execução separada (`isProcessing`), liberada em `finally`. **Risco:** baixo. **Status:** `AUDITED`

### F-87 · Idempotência da automação não confirmada

Com ciclos sobrepostos (F-86), dois ciclos podem selecionar o mesmo lead e **enviar a mesma mensagem duas vezes**. Não localizei marca de idempotência (`sentAt`, flag de processado) aplicada atomicamente antes do envio.

**Risco de produto:** mensagem duplicada ao cliente final, o que em WhatsApp conta como spam e pode custar a conta. Interage com a proteção anti-spam documentada em [WHATSAPP_ANTI_SPAM_PROTECTION.md](../WHATSAPP_ANTI_SPAM_PROTECTION.md).

**Proposta:** marcar a intenção de envio no banco **antes** de enviar, em transação, e filtrar por essa marca na seleção. **Status:** `PENDING` — exige rastrear o corpo de `processAutomations()` até o envio para confirmar se já há proteção.

### F-90 · Shutdown não para todos os timers

Complementa [RUNTIME-RESOURCE-AUDIT.md F-25](RUNTIME-RESOURCE-AUDIT.md) pela ótica de integridade: J-02 (health check WhatsApp), J-05 (rate limiter) e J-06 (`tokenCleanup`) não são parados no `shutdown()`. Um ciclo de automação em voo durante o `SIGTERM` é interrompido pelo `process.exit` após 10 s, **sem finalizar o envio nem registrar o estado** — mensagem pode ter sido enviada sem persistir a marca, ou vice-versa.

**Status:** `AUDITED`

---

## Parte VI — Cache: isolamento, invalidação e limites

### F-88 · `statsCache` sem isolamento por usuário nem teto

| Campo | Conteúdo |
|---|---|
| **Evidência** | [statsCache.service.ts:25-46](../apps/backend/src/services/statsCache.service.ts#L25) — `private cache = new Map<string, CacheEntry<any>>()`; `set(key, data, ttl)` usa a chave fornecida pelo chamador; TTL default 30 s; limpeza a cada 60 s |
| **Achado** | O escopo exige que cache tenha invalidação, limites, consistência e **isolamento entre usuários**. Situação por critério: **invalidação** ✅ (TTL + métodos manuais); **consistência** ✅ (30 s é aceitável para estatísticas); **limite de memória** ❌ (o `Map` não tem teto de entradas — só expiração; chaves variadas crescem sem limite); **isolamento** ❌ (a chave é uma string livre; se um chamador não incluir o identificador de usuário/papel, dados computados no contexto de um usuário são servidos a outro) |
| **Impacto** | (1) Potencial vazamento entre usuários em estatísticas sensíveis a papel — o CRM tem RBAC (`ADMIN`, `SALES`, `CONSULTANT`), então "meus leads" difere por usuário. (2) Crescimento não limitado de memória, dentro de um container sem `mem_limit` ([CONTAINER-AUDIT.md F-02](CONTAINER-AUDIT.md)) |
| **Proposta** | Auditar cada chamador de `set()`/`get()` e exigir o identificador de escopo na chave; adicionar teto de entradas com política de descarte |
| **Risco** | Incluir usuário na chave reduz a taxa de acerto — o cache passa a ser por usuário. É o custo correto da segurança |
| **Dependências** | Requer inventário dos chamadores |
| **Teste de aceite** | Usuários de papéis distintos recebem estatísticas distintas; o `Map` não excede o teto sob chaves variadas |
| **Rollback** | Reverter a chave |
| **Métrica esperada** | `NOT MEASURED` |
| **Status** | **`PENDING`** — a existência do vazamento depende dos chamadores, que não inventariei exaustivamente |

---

## Parte VII — Sobre remover código inativo

O escopo adverte: *"Remover código inativo não garante redução de memória ou CPU; avalie artefato e processos afetados."*

Aplicando ao caso concreto — F-84 (`processPendingDeliveries` sem chamador):

| Consideração | Análise |
|---|---|
| Remover reduz RAM? | **Não.** O método é código carregado no módulo; removê-lo economiza bytes irrelevantes |
| Remover reduz CPU? | **Não.** Não é executado |
| Remover reduz o artefato? | Marginalmente — irrelevante frente aos ~767 MB de Chromium |
| **Conclusão** | **Não é candidato a remoção — é candidato a ser chamado.** É funcionalidade faltante, não código morto |

O mesmo raciocínio vale para os 8 scripts em `src/scripts/` que instanciam `PrismaClient` próprio ([CONTAINER-AUDIT.md F-01](CONTAINER-AUDIT.md)): são ferramentas operacionais executadas sob demanda, não consomem recurso em runtime, e removê-los não traz ganho mensurável.

**Status:** `AUDITED`

---

## Matriz de cobertura — inventário → evidência → status

| Item do inventário | Evidência examinada | Cobertura |
|---|---|---|
| **SSR** | Frontend é SPA Vite/React; nginx serve `dist/` estático | `NOT APPLICABLE` |
| APIs REST | 23 módulos em `src/modules/`; rotas montadas em `app.ts` | `AUDITED` |
| Rota pública de leads | `app.ts:91` — sem auth por projeto; rate limit em memória | `AUDITED` |
| Upload — imagem | `upload.routes.ts:16` — **F-81** | `AUDITED` |
| Upload — mídia WhatsApp | `whatsapp.routes.ts:1675` — **com** `authenticate` | `AUDITED` |
| Download / estáticos | `express.static('/uploads')` sem auth ([CONTAINER-AUDIT.md F-07](CONTAINER-AUDIT.md)) | `AUDITED` |
| Autenticação | JWT stateless; refresh tokens no banco; rotação implementada | `AUDITED` |
| Permissões / RBAC | `ProtectedRoute` no front; `authorize` no back; papéis no schema | `AUDITED` |
| Consultas | 88 `findMany`, 77 sem paginação ([DATABASE-AUDIT.md F-44](DATABASE-AUDIT.md)) | `AUDITED` |
| N+1 — banco | Kanban ([DATABASE-AUDIT.md F-45](DATABASE-AUDIT.md)), mídia (F-46) | `AUDITED` |
| N+1 — Puppeteer | `getConversations` — **F-82** | `AUDITED` |
| Cache | `statsCache` — **F-88** | **`PENDING`** |
| Jobs / cron | 6 timers (J-01..J-06) mapeados | `AUDITED` |
| Sobreposição de cron | **F-86** | `AUDITED` |
| Filas | Nenhuma fila externa; retry de webhook em memória — **F-83**, **F-84** | `AUDITED` |
| Retries / backoff | Webhook implementa backoff e teto — desenho correto | `AUDITED` |
| Idempotência | Automação — **F-87** | **`PENDING`** |
| Graceful shutdown | **F-90**; complementa [RUNTIME-RESOURCE-AUDIT.md F-25](RUNTIME-RESOURCE-AUDIT.md) | `AUDITED` |
| WebSocket — autenticação | **F-79** | `AUDITED` |
| WebSocket — emissão | **F-80**; salas existem e funcionam | `AUDITED` |
| WebSocket — timeouts | nginx `proxy_read_timeout 7d` | `AUDITED` |
| Imagens (Sharp) | **F-89**; threadpool compartilhada | `AUDITED` |
| Arquivos | `diskStorage` em 2 rotas, `memoryStorage` em 1 ([RUNTIME-RESOURCE-AUDIT.md F-21](RUNTIME-RESOURCE-AUDIT.md)) | `AUDITED` |
| Integrações — WhatsApp | whatsapp-web.js 1.34 via Puppeteer | `AUDITED` |
| Integrações — webhooks | 9 rotas; consumidores externos | `AUDITED` |
| Integrações — API keys | `apiKeyAuth` com rate limit no banco | `AUDITED` |
| Integrações — IA | `modules/ai/`; provedor não identificado | **`PENDING`** |
| Polling — frontend | **F-85**; 13 timers classificados | `AUDITED` |
| `RecurrenceNotification` | Nome sugere simulação; efeito não confirmado | **`PENDING`** |
| Operações intensivas | Exportação ([RUNTIME-RESOURCE-AUDIT.md F-22](RUNTIME-RESOURCE-AUDIT.md)), importação CSV (F-21), Sharp (F-89) | `AUDITED` |
| Serialização | `io.emit` global serializa N vezes — F-80 | `AUDITED` |
| Concorrência sem limite | `Promise.all` no Kanban; threadpool do Sharp | `AUDITED` |
| Trabalho síncrono custoso | `csv-parse/sync` ([RUNTIME-RESOURCE-AUDIT.md F-21](RUNTIME-RESOURCE-AUDIT.md)) | `AUDITED` |
| Código inativo | `processPendingDeliveries`; análise na Parte VII | `AUDITED` |
| Latência real | Aplicação fora do ar | **`BLOCKED`** |
| Throughput | Idem | **`BLOCKED`** |
| Volume de eventos WebSocket | Idem | **`BLOCKED`** |
| Perfil de CPU sob carga | Exigiria gerar carga — **vedado** | **`BLOCKED`** |

---

## Totais de cobertura

| Status | Total |
|---|---|
| **AUDITED** | **30** |
| **PENDING** | **4** |
| **BLOCKED** | **4** |
| **NOT APPLICABLE** | **1** |

**Achados novos:** F-79 a F-90 (12).

### Ordem de dependência

```
F-79 (auth no socket) ──> F-80 (segmentar emissões)   ← sem identidade não há segmentação
F-84 (chamar o consumidor) ──> resolve F-83 (retry durável)
F-86 (guarda de execução) ──> pré-requisito de F-87 (idempotência)
F-82 (N+1 Puppeteer) ←── amplificado por F-85 (polling)
F-81 (auth no upload) ──── independente, alta prioridade
```

### Por que a auditoria não está completa

Os 4 `BLOCKED` derivam de a aplicação estar fora do ar: latência, throughput, volume de eventos e perfil de CPU sob carga não foram medidos — e gerar carga em produção é vedado pelo escopo. Nenhum valor foi estimado.

Os 4 `PENDING` exigem rastreamento adicional: chamadores do `statsCache` (F-88), corpo completo de `processAutomations` para confirmar idempotência (F-87), efeito real de `RecurrenceNotification`, e o provedor de IA.

**Achado que atravessa esta auditoria:** F-79 + F-80 + F-81 formam um conjunto coerente — **três superfícies de runtime sem autenticação**. O WebSocket entrega o QR code do WhatsApp a qualquer conectante, transmite todas as mensagens de todos os leads a todos os clientes, e a rota de upload aceita arquivos sem credencial. Nenhum é problema de desempenho; todos são de exposição. Recomendo tratá-los antes das otimizações de recurso — especialmente F-79, porque o sequestro da sessão de WhatsApp compromete o canal principal do negócio.

Parei aqui.
