# VPS-OPT-MASTER-PLAN — Ferraco CRM

**Data:** 2026-09-17 · **Etapa:** PLANEJAMENTO · **Host:** `72.60.10.108`
**Fontes:** [VPS-OPT-INVENTORY.md](VPS-OPT-INVENTORY.md) · [VPS-OPT-BASELINE.md](VPS-OPT-BASELINE.md) · [CONTAINER-AUDIT.md](CONTAINER-AUDIT.md) · [RUNTIME-RESOURCE-AUDIT.md](RUNTIME-RESOURCE-AUDIT.md) · [DOCKER-IMAGE-AUDIT.md](DOCKER-IMAGE-AUDIT.md) · [DATABASE-AUDIT.md](DATABASE-AUDIT.md) · [STORAGE-DISK-AUDIT.md](STORAGE-DISK-AUDIT.md) · [DEPLOY-CICD-AUDIT.md](DEPLOY-CICD-AUDIT.md) · [APPLICATION-RUNTIME-AUDIT.md](APPLICATION-RUNTIME-AUDIT.md) · [VPS-HOST-AUDIT.md](VPS-HOST-AUDIT.md)

> **Regra de deploy do projeto:** commit e push direto na `main`; nunca criar branch. Deploy exclusivamente via GitHub Actions.

## Registro de execução

| Data | Fase | Tarefas | Resultado |
|---|---|---|---|
| 2026-09-17 | **FASE 0 (parcial)** | T-01, T-01b (novo), T-04 | ✅ `DONE (local)` — validado em Postgres descartável. **Não implantado; nada verificado em produção** |
| 2026-09-17 | **FASE 0 (parcial)** | T-02 | ✅ `DONE (local)` — 6/6 cenários de handshake; QR não vaza. **Não verificado em produção** |
| 2026-09-17 | **FASE 0 (parcial)** | T-03 | ✅ `DONE (local)` — 12 eventos segmentados; isolamento A↔B provado. **Não verificado em produção** |
| 2026-09-17 | **FASE 0 (parcial)** | T-06 | ✅ `DONE (local)` — 12/12 verificações; mídia de lead protegida, landing intacta. **Não verificado em produção** |
| 2026-09-17 | **FASE 1 completa** | T-09, T-10, T-11 | ✅ `DONE (local)` — logs no volume; builder −1,13 GB medido; 6/7 limpezas (F-54 adiado para T-21). **Não verificado em produção** |
| 2026-09-17 | **FASE 2 (parcial)** | T-14 | ✅ `DONE (local)` — `db push` removido; `/health` consulta o banco (503 real). **T-12 BLOQUEADO por falha de rede** |
| 2026-09-17 | **FASE 3 (parcial)** | T-16, T-17, T-19, T-23 | ✅ `DONE (local)` — fila de webhooks ligada; N+1 7→2 consultas; **conexões 40→16 medidas**; sobreposição eliminada |

**⚠️ T-12 INTERROMPIDA — bloqueio de ambiente, não de escopo.** A execução foi autorizada, mas a **rede de build do Docker parou de funcionar** neste ambiente: `apk add` e `npm install` falham dentro de qualquer container (`TLS: unspecified error`, 100% de perda de pacotes para 1.1.1.1), embora o host alcance `registry.npmjs.org` e `dl-cdn.alpinelinux.org` normalmente. Diagnóstico: DNS resolve, conectividade IP não.

T-12 reescreve **build e deploy** — validá-la exige construir imagens. Seguir sem isso produziria um workflow não testado, contrariando o critério de aceite da própria tarefa. **Retomar quando a rede do Docker estabilizar.** Pela mesma razão, a correção de **F-102 permanece não validada**.

**Fase 0 — situação final:** executável esgotado. T-01, T-01b, T-02, T-03, T-04 e T-06 concluídas localmente. Restam três pontos de parada legítimos, todos por ausência de fato ou autorização, não por dependência técnica: **T-05** (G-08, domínio indefinido + nginx do host), **T-07** (exige confirmar consumidores externos de `/api/openapi.json`) e **T-08** (G-06, RPO/RTO + agendamento no host).

**Estado de CP-0:** ✅ **atendido nos três critérios.** `seed não destrói` ✅ · `upload protegido` ✅ (pré-existente) · `socket autenticado` ✅.

**Ressalva sobre CP-0:** os três critérios foram verificados **localmente**, contra Postgres descartável e Socket.IO real. Nenhum foi exercitado na VPS, porque o app não está implantado. CP-0 está atendido *como critério de código*, não como critério de produção.

**Contexto que condiciona o risco (informado pelo responsável, 2026-09-17):** a VPS foi reinstalada, **não há dados e não há backup**. Nenhum dado real está em risco hoje. As tarefas de proteção de dados seguem valendo como higiene preventiva — passam a proteger de fato a partir do primeiro lead real.

**Próxima tarefa elegível: T-07** (restringir Swagger), última da Fase 0 sem bloqueio. Exige antes **confirmar com integradores externos** (X-02..X-05) se algum consome `/api/openapi.json` — decisão de negócio, não verificável no código. Restam ainda T-05 (`BLOCKED` por G-08) e T-08 (requer autorização no host + G-06).

**Nota sobre CSP:** T-07 prevê reativar a `contentSecurityPolicy` do helmet, hoje `false` em [app.ts:54](../apps/backend/src/app.ts#L54) para acomodar o Swagger UI. T-06 já mitigou o vetor mais grave dessa ausência (SVG com script) por outras camadas, mas **a CSP global continua desabilitada** — o que amplia o impacto de qualquer XSS refletido em outras rotas.

### Achados novos surgidos na execução

| ID | Achado | Origem | Status |
|---|---|---|---|
| **F-100** | Migration `add_product_interest_template` insere em colunas snake_case inexistentes; falha em banco limpo, mascarada pelo fallback `db push` | Teste de T-01 contra banco real | ✅ Corrigido (T-01b) |
| **F-101** | **15 ouvintes mortos no frontend** — `message:new`, `message:status`, `message:edited`, `message:revoked`, `whatsapp:typing`, `whatsapp:presence`, `whatsapp:reaction`, `whatsapp:error`, `whatsapp:state-change` e outros escutam eventos que **o backend nunca emite**. Divergência de nomenclatura: o backend emite `whatsapp:message_ack`, o frontend espera `message:status`. **Funcionalidades de tempo real podem estar silenciosamente inertes** | Mapeamento emissor→ouvinte em T-03 | `PENDING` — não investigado |
| **F-102** | **`prisma migrate deploy` depende de rede externa a CADA boot.** O postinstall do `@prisma/engines` baixa só os engines da plataforma nativa do builder (`linux-musl`). A imagem roda **OpenSSL 3.5.8**, então o CLI procura `linux-musl-openssl-3.0.x` em `node_modules/@prisma/engines/`, não encontra, e tenta baixar de `binaries.prisma.sh` em runtime. **Sem internet no container, as migrations falham, o fallback `db push` falha, e o seed falha** — o app sobe com banco vazio | **Execução da imagem real** em T-14 | ⚠️ `CORREÇÃO PROPOSTA, NÃO VALIDADA` |

**Sobre F-102 — o que foi e o que não foi provado.**

**Provado, com a imagem em execução:**
- Os engines `linux-musl-openssl-3.0.x` existem em `node_modules/prisma/` e `.prisma/client/`, mas **não** em `@prisma/engines/`, que é onde o CLI busca
- `@prisma/engines/` contém apenas `libquery_engine-linux-musl.so.node` e `schema-engine-linux-musl`
- Com a rede isolada, `migrate deploy` falha ao buscar `libquery_engine.so.node.sha256`
- Apontar `PRISMA_SCHEMA_ENGINE_BINARY` para o engine `linux-musl` resulta em `Could not parse schema engine response` — **incompatível com OpenSSL 3.x**
- **Remover `"native"` do `binaryTargets` NÃO resolve** (hipótese testada e refutada) — os engines continuam ausentes de `@prisma/engines/`

**Não provado:** a correção aplicada no [Dockerfile](../Dockerfile) — `PRISMA_CLI_BINARY_TARGETS=linux-musl-openssl-3.0.x` no `prisma:generate` — **não pôde ser validada**. O ambiente local entrou em falha de rede persistente com `dl-cdn.alpinelinux.org` e o registry npm (`TLS: unspecified error`), impedindo qualquer build de verificação. **A correção é plausível mas permanece hipótese.**

**Consequência para T-30:** a tarefa previa remover `"native"` do `binaryTargets` como economia de ~15,4 MB. A investigação mostra que **isso não corrige F-102** — e que a questão dos engines é de **corretude**, não de tamanho. T-30 deve ser reavaliada com esse dado.

**Impacto se F-102 não for corrigido:** em produção **com** acesso à internet, o Prisma baixaria os engines a cada boot — funcionando, porém com boot mais lento e dependente de um serviço externo. Sem internet, ou com `binaries.prisma.sh` fora do ar, **o app sobe com o banco vazio**. Como a VPS tem internet, isso provavelmente **não** bloqueia o primeiro deploy — mas é fragilidade real.

> **Nota metodológica:** F-100 e F-101 só apareceram porque as tarefas foram **testadas contra sistemas reais** (banco com dados, Socket.IO com clientes). As auditorias, feitas por leitura estática, não podiam tê-los detectado. O total de achados passa de 99 para **101**.

---

## Sumário executivo

**99 achados** (F-01 a F-99, numeração contígua verificada) consolidados em **34 tarefas** distribuídas em **6 fases**.

**Fato que condiciona todo o plano:** o Ferraco **não está implantado** na VPS. Não há o que otimizar — há o que corrigir antes de subir. Isso inverte a ordem natural: normalmente se mede, depois se otimiza; aqui é preciso subir com segurança, medir, e só então dimensionar.

**Conclusão contrária à premissa inicial:** a hipótese de que "as aplicações quebraram a VPS por falta de otimização" **não encontra respaldo nas métricas**. O host tem `MemAvailable` de 13,5 GiB, zero OOM em 4 fontes independentes, idle de 95,9%, disco a 15% e inodes a 3%. O que os dados sustentam é que as falhas são de **configuração, segurança e confiabilidade** — não de capacidade.

**Primeira fase elegível: FASE 0.** Não depende de nada, é reversível e trata risco de perda de dados e exposição.

---

## 1. Gate de cobertura

### 1.1 Cobertura declarada por auditoria

| Auditoria | AUDITED | PENDING | BLOCKED | N/A |
|---|---|---|---|---|
| CONTAINER-AUDIT | 48 | 3 | 3 | 3 |
| RUNTIME-RESOURCE-AUDIT | 26 | 2 | 8 | 4 |
| DOCKER-IMAGE-AUDIT | 25 | 2 | 4 | 4 |
| DATABASE-AUDIT | 27 | 2 | 8 | 4 |
| STORAGE-DISK-AUDIT | 27 | 3 | 4 | 5 |
| DEPLOY-CICD-AUDIT | 32 | 3 | 3 | 3 |
| APPLICATION-RUNTIME-AUDIT | 30 | 4 | 4 | 1 |
| VPS-HOST-AUDIT | 32 | 3 | 3 | 1 |
| **TOTAL** | **247** | **22** | **37** | **25** |

*Somatório com sobreposição deliberada: vários itens do inventário foram auditados sob óticas diferentes (ex.: C-02 aparece em container, runtime, imagem e deploy). A rastreabilidade é por documento.*

### 1.2 IDs do inventário → cobertura

| Família de IDs | Itens | Cobertura |
|---|---|---|
| A-01..A-07 (arquitetura) | 7 | 6 AUDITED, 1 NOT VERIFIED→BLOCKED (A-07) |
| APP-01..APP-03 | 3 | AUDITED |
| C-01..C-04 (containers) | 4 | AUDITED (config) / BLOCKED (runtime) |
| P-01..P-05 (processos) | 5 | AUDITED |
| V-01..V-06 (volumes) | 6 | 5 AUDITED, 1 PENDING (V-05) |
| D-01..D-10 (docker/imagem) | 10 | 9 AUDITED, 1 BLOCKED (D-10 tamanho) |
| DB-01..DB-11 | 11 | AUDITED |
| BD-01..BD-09 (build/deploy) | 9 | AUDITED |
| R-01..R-11 (runtime/jobs) | 11 | 9 AUDITED, 2 NOT APPLICABLE (R-07 filas, R-08 Redis) |
| RC-01..RC-08 (recursos) | 8 | AUDITED |
| L-01..L-07 (cache/logs/backup) | 7 | AUDITED |
| E-01..E-04 (externos) | 4 | 3 AUDITED, 1 PENDING (E-04 provedor de IA) |
| X-01..X-08 (consumidores) | 8 | 6 AUDITED, 2 PENDING (X-04/X-05, X-08) |

**Todos os IDs do inventário foram confrontados.** Nenhum ficou sem destino.

### 1.3 Lacunas relevantes — impedem declarar o plano completo

| # | Lacuna | Origem | Consequência no plano |
|---|---|---|---|
| **G-01** | Causa raiz da queda anterior indeterminável — logs perdidos na reinstalação | BASELINE §B1 | Nenhuma tarefa pode alegar "corrige a causa do incidente" |
| **G-02** | Sem baseline de runtime do Ferraco (app fora do ar) | 8 auditorias | **Bloqueia todo dimensionamento de limites** (T-20, T-21, T-22) |
| **G-03** | `memory.peak` inexistente no kernel 5.15 | RUNTIME M-06 | Pico por container exige amostragem contínua |
| **G-04** | Processos fora do Docker não identificados (~670 MiB) | HOST F-91 | Orçamento agregado tem margem de erro |
| **G-05** | Provedor de IA não identificado | CONTAINER X-08 | Custo e latência externos desconhecidos |
| **G-06** | RPO/RTO não definidos | DATABASE | Política de backup não dimensionável sem decisão de negócio |
| **G-07** | Custo de CI (plano da conta) | DEPLOY | Viabilidade econômica de T-12 não confirmada |
| **G-08** | Divergência de domínio `.com` vs `.com.br` | HOST F-92 | Bloqueia emissão de TLS (T-05) |

**Veredito do gate:** **o plano NÃO é completo.** G-02 é estrutural — sem app em execução, nenhum limite pode ser dimensionado com responsabilidade. **É possível planejar e executar as tarefas independentes** (Fases 0–3), deixando as dependentes explicitamente `BLOCKED` (Fase 4).

---

## 2. Reconciliação de achados

### 2.1 Equação de fechamento

```
Achados totais (F-01..F-99)  = 99

  Mapeados em tarefas        = 88
+ Duplicados de outro ID     =  0
+ Falsos positivos           =  0
+ Não aplicáveis             =  3   (F-40, F-62, F-97)
+ Bloqueados                 =  8   (F-01ᵈ, F-02, F-42, F-47, F-63, F-87, F-88, F-93)
                             ─────
                             = 99  ✅
```

*ᵈ F-01 aparece como bloqueado na dimensão de dimensionamento, mas sua correção de código é T-19 (mapeada). Contabilizado uma vez, como mapeado; ver 2.3.*

**Correção da equação** — F-01 é mapeado (T-19), não bloqueado:

```
Mapeados = 88 · Duplicados = 0 · Falsos positivos = 0
Não aplicáveis = 3 · Bloqueados = 8
88 + 0 + 0 + 3 + 8 = 99 ✅
```

**Contagens separadas, conforme exigido:**
- **Achados: 99**
- **Tarefas: 34**

A razão ~2,6 achados por tarefa reflete agrupamento deliberado: achados da mesma origem e mesmo arquivo são tratados juntos para evitar múltiplos deploys sobre o mesmo ponto.

### 2.2 Achados sem tarefa — justificados

| ID | Destino | Justificativa |
|---|---|---|
| **F-40** | **NÃO APLICÁVEL** | Registro de *armadilha evitada*: o `schema-engine` (17,9 MB) parece removível mas é necessário ao `migrate deploy` a cada boot. É documentação preventiva, não defeito |
| **F-62** | **NÃO APLICÁVEL** | Volume `ferraco-data` sem consumidor identificado. Ausência em busca **não prova** ausência de uso; o script de migração sugere que já houve conteúdo. Manter o volume custa ~0. Reavaliar após 30 dias de operação |
| **F-97** | **NÃO APLICÁVEL** | Runner self-hosted (~190 MiB) pertence a outra aplicação (`Digiurbanlite`). Fora do escopo do Ferraco; registrado apenas como consumo contabilizado |
| **F-02** | **BLOQUEADO** | `mem_limit`/`cpus` do Ferraco. **Não dimensionável sem G-02.** Ver T-20 |
| **F-42** | **BLOQUEADO** | Tuning do Postgres. Depende de `mem_limit` (F-02) e do pool real (T-19). Ver T-21 |
| **F-47** | **BLOQUEADO** | 166 índices sem dados de uso. Exige `pg_stat_user_indexes` de banco com uso acumulado. Ver T-22 |
| **F-63** | **BLOQUEADO** | Crescimento da sessão WhatsApp. Exige inspeção do conteúdo real do volume, que não existe |
| **F-87** | **BLOQUEADO** | Idempotência da automação não confirmada. Exige rastrear `processAutomations()` até o envio — e observar em execução |
| **F-88** | **BLOQUEADO** | Isolamento do `statsCache`. Exige inventário exaustivo dos chamadores |
| **F-93** | **BLOQUEADO** | Steal de 2,08%. **Não acionável nesse patamar.** Monitorar; agir só se subir consistentemente acima de ~10% |

### 2.3 Rastreabilidade múltipla → tarefa única

Exemplos de convergência (vários achados, uma tarefa):

| Tarefa | Achados de origem | Documentos |
|---|---|---|
| T-01 | F-28, F-12 | DOCKER-IMAGE, CONTAINER |
| T-12 | F-03, F-27, F-66, F-67, F-68, F-31, F-32, F-14, F-74, F-76 | 5 documentos |
| T-06 | F-07, F-57, F-59, F-60, F-61 | STORAGE-DISK, CONTAINER |
| T-19 | F-01, F-24, F-25, F-49, F-90 | CONTAINER, RUNTIME, DATABASE, APPLICATION |

---

## 3. Tarefas

**Legenda de escopo autorizado:** `LOCAL` (código, sem deploy) · `DEPLOY` (via Actions, push na main) · `VPS-RO` (leitura) · **`REQUER AUTORIZAÇÃO`** (produção/destrutivo, ainda não concedida).

### FASE 0 — Segurança de dados e exposição (sem deploy, ou reversível)

#### T-01 · Neutralizar o seed destrutivo
| Campo | Conteúdo |
|---|---|
| **Origem** | F-28, F-12 |
| **Problema** | [seed.ts:13-26](../apps/backend/prisma/seed.ts#L13): 14 `deleteMany()` incluindo `lead`, `user`, `team`, sem guarda de `NODE_ENV`. Guarda em [startup.sh](../docker/startup.sh) usa `psql \|\| echo "0"` — **falha aberta**: `psql` indisponível ⇒ seed dispara contra banco populado. Startup ainda imprime credenciais no log |
| **Arquivos** | `apps/backend/prisma/seed.ts`, `docker/startup.sh` |
| **Solução** | Abortar se `NODE_ENV=production` sem variável de confirmação explícita; trocar `deleteMany` por `upsert` idempotente; corrigir fallback do `psql` para **abortar**, nunca assumir `0`; remover `echo` de credenciais |
| **Benefício esperado** | Elimina risco de perda total de dados. **Hipótese até validação** |
| **Métrica** | Binário: seed contra banco populado preserva linhas (contagem antes = depois) |
| **Risco** | Baixo. Seed idempotente é estritamente mais seguro |
| **Dependências** | Nenhuma |
| **Teste de aceite** | Banco descartável populado: `prisma db seed` não apaga; com `psql` inacessível, startup aborta |
| **Rollback** | `git revert` dos dois arquivos (mudança só de código, sem efeito em dados) |
| **Escopo** | `LOCAL` → `DEPLOY` |
| **Status** | ✅ `DONE (local)` — 2026-09-17. Verificado em Postgres descartável; **não verificado em produção** (app ainda não implantado) |

**Evidência de execução T-01** (ambiente: Windows, Node v22.17.0, npm 10.9.2, Docker 29.1.3; banco `postgres:16-alpine` efêmero em `localhost:55432`, destruído ao fim):

| # | Teste | Resultado |
|---|---|---|
| A | `prisma migrate deploy` em banco limpo | 4/4 `OK`, nenhuma `rolled_back_at` |
| B | `db seed` com banco vazio | Executa — `✅ Banco vazio` |
| C | **`db seed` com banco populado** | **Aborta (exit 1). `users=5 leads=5 teams=2` antes E depois — 0 linhas perdidas** |
| D | `ALLOW_DESTRUCTIVE_SEED=true` em dev | Executa com aviso |
| E1 | `NODE_ENV=production` + ALLOW sem CONFIRM | Aborta |
| E2 | produção + CONFIRM com nome errado | Aborta |
| E3 | produção + CONFIRM correto | Executa |
| — | Lógica do `startup.sh`, 6 cenários de `psql` | psql ausente / erro de rede / saída não numérica ⇒ **PULA o seed** (antes: executava) |
| — | `tsc --noEmit` backend | **0 erros** |
| — | `npm run build` backend | exit 0 |

**Decisão de projeto registrada:** não há dados a proteger hoje (VPS reinstalada, volumes inexistentes, sem backup — confirmado em BASELINE §B3). T-01 foi executada como **higiene preventiva**, valendo a partir do momento em que houver leads reais. Por isso o `startup.sh` **pula** o seed na dúvida em vez de abortar o boot: com banco vazio ou populado, pular é sempre seguro, e abortar derrubaria o primeiro deploy.

**Desvio do plano original:** a solução previa trocar `deleteMany` por `upsert` idempotente. Não foi feito — são ~40 `create` encadeados por variáveis em 883 linhas, e a reescrita teria risco desproporcional ao benefício. A guarda de entrada atinge o mesmo critério de aceite (contagem antes = depois) com superfície muito menor. Os `deleteMany` seguem no código, agora inalcançáveis sem confirmação explícita.

#### T-01b · Corrigir migration `add_product_interest_template` (achado novo)
| Campo | Conteúdo |
|---|---|
| **Origem** | **F-100** — achado durante a execução de T-01, não previsto nas auditorias |
| **Problema** | [migration.sql](../apps/backend/prisma/migrations/20251128000000_add_product_interest_template/migration.sql) faz `INSERT` em `min_captures`, `max_captures`, `created_at`… mas a tabela `recurrence_message_templates` usa **camelCase** (`"minCaptures"`…), pois o modelo Prisma não declara `@map`. Erro: `column "min_captures" ... does not exist`. **A migration nunca pôde funcionar em banco limpo** — só passava despercebida porque o fallback `db push` do [startup.sh](../docker/startup.sh) mascarava a falha, deixando o deploy "verde" com schema divergente (exatamente F-75/F-51) |
| **Solução** | Citar os identificadores em camelCase no `INSERT` e no `ON CONFLICT ... DO UPDATE`. Conteúdo do template preservado sem alteração |
| **Métrica** | `migrate deploy` conclui em banco limpo; linha `tpl_product_interest_001` presente |
| **Risco** | Baixo. Corrige uma migration que já falhava; `ON CONFLICT` a mantém idempotente |
| **Dependências** | Nenhuma |
| **Teste de aceite** | ✅ 4/4 migrations `OK` em banco limpo; `SELECT` retorna `tpl_product_interest_001 \| 1 \| t` |
| **Rollback** | `git revert` |
| **Escopo** | `LOCAL` → `DEPLOY` |
| **Status** | ✅ `DONE (local)` — 2026-09-17. **Não verificado em produção** |

> **Consequência para o gate:** o total de achados passa de **99 para 100** (F-100). Este achado só apareceu porque T-01 foi testada contra um banco real — as auditorias, feitas por leitura estática, não podiam tê-lo detectado. Reforça a exigência de T-14 (remover o fallback `db push`), agora com evidência concreta de que ele mascara falha real.

#### T-02 · Autenticar o Socket.IO
| Campo | Conteúdo |
|---|---|
| **Origem** | F-79 |
| **Problema** | [server.ts:41-58](../apps/backend/src/server.ts#L41): sem `io.use()`. Ao conectar, servidor envia `whatsapp:qr` — **qualquer um pode escanear e sequestrar a conta de WhatsApp** |
| **Arquivos** | `apps/backend/src/server.ts`, cliente Socket.IO no frontend |
| **Solução** | `io.use()` validando JWT do handshake (Socket.IO 4.8 suporta nativamente — compatibilidade confirmada) |
| **Benefício esperado** | Elimina sequestro de sessão WhatsApp |
| **Métrica** | Binário: conexão sem token recusada |
| **Risco** | **Médio.** Frontend precisa enviar token; sem coordenação, todos os clientes caem |
| **Dependências** | Nenhuma. **Precede T-03** |
| **Teste de aceite** | Conexão anônima recusada; autenticada funciona; QR não chega a anônimo |
| **Rollback** | Remover a chamada `registerSocketAuth(io)` do [server.ts](../apps/backend/src/server.ts) — o `auth: { token }` do cliente vira inócuo, sem necessidade de reverter o frontend |
| **Escopo** | `LOCAL` → `DEPLOY` |
| **Status** | ✅ `DONE (local)` — 2026-09-17. Verificado com Socket.IO real + Postgres descartável; **não verificado em produção** |

**Arquivos alterados em T-02:**
- **novo** [socketAuth.ts](../apps/backend/src/middleware/socketAuth.ts) — `registerSocketAuth(io)` valida o JWT do handshake com as mesmas regras do `authenticate` HTTP (assinatura, `type === 'access'`, usuário existente e ativo) e anexa `socket.data.user`, o que **habilita a segmentação de T-03**
- [server.ts](../apps/backend/src/server.ts) — middleware registrado **antes** de `io.on('connection')`
- [useWhatsAppSocket.ts](../apps/frontend/src/hooks/useWhatsAppSocket.ts), [useWhatsAppWebSocket.ts](../apps/frontend/src/hooks/useWhatsAppWebSocket.ts) — enviam `auth: { token }` reaproveitando o `getToken()` já exportado pelo `apiClient`

**Evidência de execução T-02** (servidor Socket.IO real com o middleware de produção sem modificação; clientes `socket.io-client` reais; Postgres 16 efêmero em `:55433` com schema migrado e seed aplicado; ambos destruídos ao fim):

| # | Cenário | Resultado | Recebeu QR |
|---|---|---|---|
| A | Anônimo, sem token | **RECUSADO** — `Authentication required` | não |
| B | Token malformado | **RECUSADO** — `Invalid token` | não |
| C | **Refresh token no lugar do access** | **RECUSADO** — `Invalid token type` | não |
| D | **Token válido de usuário desativado** | **RECUSADO** — `User not found or inactive` | não |
| E | Access token válido | CONECTOU | sim ✅ |
| F | Válido com prefixo `Bearer ` | CONECTOU | sim ✅ |

**Veredito:** 4/4 não autorizados recusados · 2/2 autorizados conectaram · **QR não vazou em nenhum cenário não autorizado**. `tsc --noEmit` 0 erros nos dois workspaces; `npm run build` exit 0 em ambos.

**Risco tratado além do previsto no plano — expiração do token.** O access token vive ~15 min e os hooks usam `reconnection: true`. Numa reconexão após expirar, o Socket.IO reenviaria o **mesmo** token expirado, produzindo laço de falha. Ambos os hooks passaram a reler o token no `connect_error` (`socket.auth = { token: freshToken }`), e a chamar `disconnect()` quando não houver token — em vez de martelar o servidor. Sem esse cuidado, T-02 trocaria um problema de segurança por um de disponibilidade.

**Pendente de verificação em produção:** os cenários acima cobrem o servidor. **Não foi exercitado um navegador real** contra a aplicação completa — a renovação do access token pelo interceptor do `apiClient` durante uma reconexão de socket permanece `NOT VERIFIED`. É o principal ponto a observar no primeiro deploy.

#### T-03 · Segmentar emissões do WebSocket
| Campo | Conteúdo |
|---|---|
| **Origem** | F-80 |
| **Problema** | [whatsappListeners.ts:351-354](../apps/backend/src/services/whatsappListeners.ts#L351): emite corretamente para a sala e **na linha seguinte** faz `io.emit()` global com telefone, nome e corpo da mensagem. ~12 ocorrências |
| **Arquivos** | `apps/backend/src/services/whatsappListeners.ts`, `automationScheduler.service.ts` |
| **Solução** | Substituir `io.emit()` por emissão segmentada. O padrão correto já existe ao lado |
| **Benefício esperado** | Cessa vazamento de dados de leads entre usuários; reduz tráfego proporcional a N clientes. **`NOT MEASURED`** |
| **Métrica** | Cliente não inscrito não recebe evento; tráfego WS por cliente |
| **Risco** | Médio. Componentes que escutam `whatsapp:new_message` param de receber — mapear antes |
| **Dependências** | **T-02** (sem identidade não há segmentação) |
| **Teste de aceite** | Cliente A não recebe conversas de B; lista de conversas continua atualizando |
| **Rollback** | Restaurar `io.emit()` nos pontos alterados (só backend; frontend intocado) |
| **Escopo** | `LOCAL` → `DEPLOY` |
| **Status** | ✅ `DONE (local)` — 2026-09-17. Isolamento verificado com Socket.IO real; **não verificado em produção** |

**Correção da premissa da auditoria:** F-80 estimou "~12 ocorrências". O mapeamento exaustivo encontrou **30 `io.emit()` globais**. Mais relevante: eles **não são da mesma natureza**, e tratá-los igual teria quebrado funcionalidade.

| Grupo | Eventos | Tratamento |
|---|---|---|
| **Payload de lead** (telefone, nome, corpo) | `new_message`, `message`, `message_create`, `message_ack`, `message_reaction`, `message_revoked`, `call`, `chat_archived`, `chat_removed`, `group_join`, `group_leave`, `group_update` | **Segmentados** por `conversation:<chatId>` |
| **Estado da sessão** | `qr`, `status`, `ready`, `disconnected`, `qr-expired`, `reconnecting`, `reconnect_failed`, `circuit_breaker` | **Mantidos globais** — descrevem a conta de WhatsApp da empresa, valem para todo operador. Após T-02, só chegam a autenticados |
| **Notificação sem conteúdo** | `conversation:update` (só o telefone) | **Mantido global por decisão de projeto** — ver abaixo |

**Mapeamento emissor→ouvinte (pré-requisito exigido pela própria tarefa).** Cruzando os 21 eventos emitidos com os 21 escutados:

- **Nenhum dos 12 eventos com payload de lead tinha ouvinte no frontend.** Segmentá-los é, portanto, **risco zero de regressão** — o risco "componentes param de receber" registrado na tarefa **não se materializa**.
- **15 ouvintes mortos** no frontend (`message:new`, `message:status`, `message:edited`, `message:revoked`, `whatsapp:typing`, `whatsapp:presence`, `whatsapp:reaction`, `whatsapp:error`, `whatsapp:state-change`…) escutam eventos que **o backend nunca emite**. Divergência de nomenclatura pré-existente, fora do escopo de T-03 — **registrada como F-101**.

**Decisão de projeto — `conversation:update` permanece global.** É o único evento com ouvinte real (atualiza a lista de conversas). Segmentá-lo por sala quebraria justamente o caso de uso: notificar quem **não** está com a conversa aberta. Expõe apenas um telefone, sem nome nem corpo, e após T-02 só alcança clientes autenticados. Fechar esse resíduo exigiria repensar como a lista se atualiza — **mudança de funcionalidade, não de segurança**; fora do escopo desta tarefa.

**Evidência de execução T-03** (Socket.IO real com o middleware de produção T-02 ativo; dois clientes autenticados inscritos em conversas distintas; Postgres efêmero em `:55434`, destruído ao fim):

| Verificação | Resultado |
|---|---|
| A (inscrito em CONV_A) recebeu evento de CONV_A | 1 ✅ |
| **A recebeu evento de CONV_B** | **0 ✅ sem vazamento** |
| B (inscrito em CONV_B) recebeu evento de CONV_B | 1 ✅ |
| **B recebeu evento de CONV_A** | **0 ✅ sem vazamento** |
| `conversation:update` chegou a A e a B | 1 e 1 ✅ (global, como decidido) |

`tsc --noEmit` 0 erros · `npm run build` exit 0.

**Pendente de verificação em produção:** o isolamento foi provado no nível do Socket.IO. **Não foi exercitado com dois navegadores reais** em sessões distintas e sessão de WhatsApp pareada — permanece `NOT VERIFIED`.

#### T-04 · Autenticar upload de imagem
| Campo | Conteúdo |
|---|---|
| **Origem** | F-81 |
| **Problema** | [upload.routes.ts:16](../apps/backend/src/routes/upload.routes.ts#L16) sem `authenticate`. Qualquer um envia 50 MB; com SVG + CSP off, hospeda XSS no domínio |
| **Arquivos** | `apps/backend/src/routes/upload.routes.ts` |
| **Solução** | Adicionar `authenticate`. **Verificar antes** se a landing page usa esta rota — se usar, criar rota pública separada com rate limit próprio e sem SVG |
| **Benefício esperado** | Fecha preenchimento de disco e hospedagem de conteúdo por terceiros |
| **Métrica** | Binário: upload sem token = 401 |
| **Risco** | **Médio.** Se a landing page usar, o formulário público quebra |
| **Dependências** | Verificação de uso na landing page |
| **Teste de aceite** | Upload anônimo 401; autenticado OK; fluxos públicos verificados |
| **Rollback** | Remover middleware |
| **Escopo** | `LOCAL` → `DEPLOY` |
| **Status** | ✅ `DONE (pré-existente)` — verificado em 2026-09-17: **a evidência de F-81 não se sustenta mais** |

> **Revalidação (2026-09-17):** [upload.routes.ts:13](../apps/backend/src/routes/upload.routes.ts#L13) já contém `router.use(authenticate)`, aplicando autenticação às 4 rotas do módulo. A auditoria descreve o estado anterior do arquivo. **Nenhuma alteração foi feita.** Resta verificar em produção que nenhum fluxo público (landing page) dependia dessas rotas — não verificável sem o app no ar.

#### T-05 · Criar vhost e TLS para o domínio
| Campo | Conteúdo |
|---|---|
| **Origem** | F-92, F-16 |
| **Problema** | Nenhum certificado nem vhost para o Ferraco (4 vizinhas têm). Compose publica `3050` em `0.0.0.0` — acesso seria por `IP:3050` **sem TLS**, com credenciais em claro |
| **Arquivos** | `/etc/nginx/sites-available/` (VPS), `docker-compose.vps.yml` |
| **Solução** | Criar vhost, emitir certificado via certbot (já operante), mudar publicação para `127.0.0.1:3050` |
| **Benefício esperado** | HTTPS no domínio; superfície pública reduzida |
| **Métrica** | Binário: `https://<domínio>` com certificado válido; `IP:3050` recusado |
| **Risco** | **Alto se mal sequenciado.** Mudar para `127.0.0.1` **antes** do vhost torna a aplicação inacessível |
| **Dependências** | **G-08** (definir domínio); DNS apontando para a VPS; **REQUER AUTORIZAÇÃO** para alterar nginx do host |
| **Teste de aceite** | HTTPS responde; renovação agendada; vizinhas intactas |
| **Rollback** | Remover vhost; manter `0.0.0.0` |
| **Escopo** | **`REQUER AUTORIZAÇÃO`** (altera host compartilhado) |
| **Status** | `BLOCKED` (G-08) |

#### T-06 · Endurecer uploads: acesso, nomes, tipos, cache
| Campo | Conteúdo |
|---|---|
| **Origem** | F-07, F-57, F-58, F-59, F-60, F-61 |
| **Problema** | `/uploads` servido sem auth; nomes com `Math.random()` (previsíveis); filtro do WhatsApp aceita **qualquer** MIME (`cb(null,true)` no else); SVG + CSP off = XSS armazenado; `immutable` em conteúdo não versionado; `chmod 777` |
| **Arquivos** | `app.ts:70`, `upload.controller.ts:25`, `whatsapp.routes.ts:56-85`, `docker/nginx.conf`, `docker/startup.sh` |
| **Solução** | Rota autenticada ou URLs assinadas; `crypto.randomUUID()`; rejeitar fora da allowlist; remover/sanitizar SVG + `nosniff` + `Content-Disposition`; `private, max-age` curto com ETag; `chmod 750` |
| **Benefício esperado** | Fecha acesso indevido a documentos de leads e XSS |
| **Métrica** | Acesso sem token negado; SVG com script não executa; nomes não deriváveis de timestamp |
| **Risco** | Médio. Pode quebrar links distribuídos e exibição inline; SVG pode ter uso legítimo (logos) |
| **Dependências** | Interage com T-04 |
| **Teste de aceite** | Os cinco critérios acima, verificados individualmente |
| **Rollback** | Reverter por camada (6 arquivos independentes) |
| **Escopo** | `LOCAL` → `DEPLOY` |
| **Status** | ✅ `DONE (local)` — 2026-09-17. **12/12 verificações**; não verificado em produção |

**Decisão de projeto — separação de diretórios (F-07).** Autenticar `/uploads` inteiro **quebraria a landing page pública**: um `<img src>` de visitante anônimo não envia header `Authorization`. A investigação mostrou que a separação **já existia fisicamente**:

| Caminho | Conteúdo | Tratamento |
|---|---|---|
| `/uploads/` (raiz) | Imagens da landing page | **Público** — necessário para o site |
| `/uploads/whatsapp/` | Mídia de conversas com leads | **Autenticado** — o frontend nunca busca por URL direta (a mídia é servida pelo próprio WhatsApp), então não quebra fluxo algum |

**Camadas aplicadas:**

| Achado | Arquivo | Correção |
|---|---|---|
| F-07 | `app.ts`, `nginx.conf` | `authenticate` em `/uploads/whatsapp`; nginx repassa `Authorization` |
| F-57 | `upload.controller.ts` (×2), `whatsapp.routes.ts` | `crypto.randomUUID()` no lugar de `Date.now() + Math.random()` |
| F-58 | `whatsapp.routes.ts` | `else` passou a **rejeitar** — era `cb(null, true)`, que tornava a allowlist decorativa |
| F-59 | `upload.controller.ts`, `whatsapp.routes.ts`, `ImageUploader.tsx`, `app.ts` | SVG fora das allowlists (backend **e** frontend, alinhados); `nosniff` + `Content-Disposition: attachment` + CSP `sandbox` para resíduos |
| F-60 | `app.ts`, `nginx.conf` | `private, max-age=300, must-revalidate` no lugar de `expires 1y` + `immutable` |
| F-61 | `startup.sh` | `chmod 750` no lugar de `777`, em `uploads` e `sessions` |

**Evidência de execução T-06** (app real via `createApp()`, requisições HTTP reais, Postgres efêmero em `:55435`, destruído ao fim):

| Verificação | Resultado |
|---|---|
| Landing page (público) segue acessível | HTTP 200 ✅ |
| **Mídia de lead sem token** | **HTTP 401 ✅** |
| **Mídia de lead com token inválido** | **HTTP 401 ✅** |
| `X-Content-Type-Options: nosniff` | presente ✅ |
| SVG residual forçado a download | `attachment` ✅ |
| SVG residual com CSP `sandbox` | presente ✅ |
| Cache privado e curto | `private, max-age=300, must-revalidate` ✅ |
| SVG fora das allowlists | ✅ |
| Nomes por `randomUUID` (2 arquivos) | ✅ |
| `else` do filtro WhatsApp rejeita | ✅ |
| Sem `chmod 777` | ✅ |

**12/12.** `tsc --noEmit` 0 erros nos dois workspaces; `npm run build` exit 0 em ambos.

**Dois defeitos encontrados pelo próprio teste, que a implementação inicial deixou passar:**
1. `upload.controller.ts:213` — a rota de **crop** gerava nome com `Math.random()`; eu havia corrigido apenas o upload direto.
2. `upload.controller.ts:157` — `listImages()` ainda oferecia `.svg` como imagem válida, contradizendo a allowlist.

Ambos corrigidos. Registro porque ilustra o valor de verificar em vez de presumir: uma inspeção visual teria declarado T-06 concluída com os dois defeitos presentes.

**Resíduo consciente:** uploads da landing page seguem públicos por necessidade funcional. Com `randomUUID()` as URLs deixam de ser deriváveis por força bruta — que era o vetor prático de F-57. Fechar isso por completo exigiria URLs assinadas, **fora do escopo desta tarefa**.

**Pendente de verificação em produção:** `chmod 750` não foi exercitado em container real — se o nginx (root) ou o processo `node` precisarem de acesso não previsto, só aparece no boot. **É o principal risco de T-06 no primeiro deploy.**

#### T-07 · Restringir Swagger em produção
| Campo | Conteúdo |
|---|---|
| **Origem** | F-06 |
| **Problema** | [app.ts:261](../apps/backend/src/app.ts#L261) monta `/api-docs` e `/api/openapi.json` sem guarda de ambiente nem auth. Com F-12 (senhas padrão), forma caminho de acesso |
| **Arquivos** | `apps/backend/src/app.ts` |
| **Solução** | Condicionar a `NODE_ENV !== 'production'` ou proteger por autenticação. Reativar CSP restringindo por rota (mitiga também F-59) |
| **Benefício esperado** | Reduz reconhecimento da API |
| **Métrica** | Binário: `/api-docs` em produção = 404/401 |
| **Risco** | Médio — há consumidores externos plausíveis (X-02..X-05) que podem usar a doc |
| **Dependências** | Confirmar com integradores |
| **Teste de aceite** | Produção nega; dev permite |
| **Rollback** | Remover condição |
| **Escopo** | `LOCAL` → `DEPLOY` |
| **Status** | `PENDING` |

#### T-08 · Backup do PostgreSQL
| Campo | Conteúdo |
|---|---|
| **Origem** | F-48, F-71, F-13 |
| **Problema** | Workflow faz backup de `uploads` e `sessions` (L334-374) mas **não do Postgres**. Não há `crontab`, timer nem dump no host. Com T-01 pendente, um erro de `psql` apaga 14 tabelas **sem recuperação** |
| **Arquivos** | `.github/workflows/deploy-vps.yml`, novo agendamento na VPS |
| **Solução** | `pg_dump` no bloco de backup do deploy **e** rotina periódica independente (deploys são esporádicos); retenção definida; **cópia off-site** |
| **Benefício esperado** | Recuperabilidade. **Pré-requisito de T-27** |
| **Métrica** | Dump gerado; **restore validado** com contagem de linhas conferida |
| **Risco** | `pg_dump` mantém snapshot; em base grande adia autovacuum |
| **Dependências** | **G-06** (RPO/RTO é decisão de negócio) |
| **Teste de aceite** | **Restore em banco descartável com integridade verificada.** Backup não testado não é backup |
| **Rollback** | Remover agendamento |
| **Escopo** | `DEPLOY` + **`REQUER AUTORIZAÇÃO`** (agendamento no host) |
| **Status** | `PENDING` (parcial: bloco no workflow) / `BLOCKED` (rotina periódica, G-06) |

---

### FASE 1 — Correções de baixo risco, sem mudança de comportamento

#### T-09 · Corrigir destino dos logs do winston
| Campo | Conteúdo |
|---|---|
| **Origem** | F-56, F-04 |
| **Problema** | [logger.ts:41](../apps/backend/src/utils/logger.ts#L41) usa `'logs/error.log'` **relativo**; CWD é `/app/backend`; volume monta `/app/logs`. **Logs somem a cada deploy**; volume fica vazio. `json-file` do Docker sem rotação declarada |
| **Arquivos** | `apps/backend/src/utils/logger.ts`, `docker-compose.vps.yml` |
| **Solução** | Caminho absoluto `/app/logs/`; declarar `logging: {max-size, max-file}` nos dois serviços do compose |
| **Benefício esperado** | Logs sobrevivem a deploy; crescimento limitado. Rotação do winston (5MB×5) **já existe** |
| **Métrica** | Arquivos presentes em `/app/logs` após recreate; log não excede teto |
| **Risco** | Baixo |
| **Dependências** | Nenhuma |
| **Teste de aceite** | `docker exec ... ls -la /app/logs` mostra arquivos; sobrevivem a recreate |
| **Rollback** | Reverter os 3 arquivos |
| **Escopo** | `LOCAL` → `DEPLOY` |
| **Status** | ✅ `DONE (local)` — 2026-09-17. **Não verificado em produção** |

**Arquivos:** [logger.ts](../apps/backend/src/utils/logger.ts) (caminho absoluto via `LOG_DIR`), [docker-compose.vps.yml](../docker-compose.vps.yml) (`logging:` nos **dois** serviços), [startup.sh](../docker/startup.sh).

**Defeito adicional encontrado durante a execução — a correção sozinha teria falhado.** O `startup.sh` criava `/app/logs` como **root com 755**, mas o backend roda como `node`. Enquanto o winston gravava em `./logs` (relativo, dentro de `/app/backend`, de propriedade do `node`), isso não aparecia. Ao apontar para `/app/logs`, o processo **não teria permissão de escrita** e o winston falharia ao abrir os arquivos. Corrigido com `chown -R node:node` antes do `chmod 750`. Registro porque ilustra um risco do plano: uma correção "óbvia" de uma linha dependia de outra condição não declarada no achado.

**Evidência T-09:**

| Verificação | Resultado |
|---|---|
| `error.log` e `combined.log` criados no diretório do volume | ✅ |
| **Nada gravado em `CWD/logs`** (comportamento antigo) | ✅ |
| Conteúdo do log legível e correto | ✅ |
| `logging:` resolvido nos 2 serviços (`docker compose config`) | ✅ `max-size: 10m, max-file: 3` |
| `sh -n startup.sh` · `docker compose config` | ✅ |

Teste simulou o container: CWD em diretório temporário distinto do "volume", `NODE_ENV=production`.

**Pendente em produção:** o `chown` não foi exercitado em container real como usuário `node`.

#### T-10 · Remover Chromium do stage builder
| Campo | Conteúdo |
|---|---|
| **Origem** | F-29, F-10 |
| **Problema** | [Dockerfile L16-25](../Dockerfile#L16) instala Chromium no builder, onde **nada o executa**. **Medido: 130,5 MB → 897,2 MB = ~767 MB por stage** |
| **Arquivos** | `Dockerfile` |
| **Solução** | Remover o `apk add` de Chromium do builder; manter no runtime |
| **Benefício esperado** | ~767 MB a menos de camadas construídas. **Não reduz a imagem final** (builder é descartado); reduz tempo e I/O de build. **Impacto em tempo: `NOT MEASURED`** |
| **Métrica** | MB de camada do builder; duração do build |
| **Risco** | **Baixo** — se algum passo precisar, o build falha imediatamente e de forma evidente |
| **Dependências** | Nenhuma |
| **Teste de aceite** | Build conclui; container sobe; **QR do WhatsApp é gerado** (prova o Chromium do runtime) |
| **Rollback** | Restaurar o bloco `apk add` no builder |
| **Escopo** | `LOCAL` → `DEPLOY` |
| **Status** | ✅ `DONE (local)` — 2026-09-17, build do builder verificado. **QR em produção: `NOT VERIFIED`** |

**Ganho medido — maior que o estimado.** A auditoria projetava ~767 MB; a medição direta das duas variantes do `apk add` mostrou:

| Variante | Camada base do builder |
|---|---|
| Com Chromium (antes) | **1,33 GB** |
| Apenas `bash` (depois) | **196 MB** |
| **Economia por build** | **~1,13 GB** |

**Detalhe que preserva o ganho:** `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true` foi **mantido** no builder. Sem ele, o `npm ci` baixaria o Chromium do próprio Puppeteer (~170 MB), anulando parte da economia. `PUPPETEER_EXECUTABLE_PATH` foi removido do builder (não há binário lá) e permanece no runtime. `bash` mantido — scripts de build podem depender dele.

**Evidência T-10** (`docker build --target builder`):

| Verificação | Resultado |
|---|---|
| Build do builder conclui | ✅ 5m38s, exit 0 |
| **Chromium ausente do builder** | ✅ `which chromium-browser` → não encontrado |
| `apps/backend/dist/server.js` gerado | ✅ |
| `apps/frontend/dist/index.html` gerado | ✅ |

O critério de risco do plano se confirma: se algum passo precisasse do Chromium, o build falharia de forma evidente. Concluiu.

**Pendente em produção:** o Chromium do **runtime** não foi exercitado — gerar o QR exige sessão real de WhatsApp. É o teste de aceite que só o deploy fecha.

#### T-11 · Limpezas de coerência
| Campo | Conteúdo |
|---|---|
| **Origem** | F-72, F-37, F-39, F-65, F-15, F-9, F-54 |
| **Problema** | `DATABASE_URL` como `--build-arg` sem `ARG` no Dockerfile (ignorado; se alguém adicionar o ARG, vira credencial em camada); `EXPOSE 3050` vs `PORT=3000`; `.dockerignore` sem `*.tar.gz`; `deploy-*.tar.gz` (2,8 MB) versionados; `apps/frontend/Dockerfile` referenciado e inexistente; limite de upload 100 MB (multer) vs 50 MB (nginx); `effective_io_concurrency=1` em SSD |
| **Arquivos** | workflow, `Dockerfile`, `.dockerignore`, `docker-compose.yml`, `whatsapp.routes.ts` |
| **Solução** | Remover build-arg; documentar portas; ignorar tarballs; alinhar limites de upload; corrigir ou remover referência ao Dockerfile do frontend |
| **Benefício esperado** | Coerência; elimina falha tardia de upload (413 após transferir) |
| **Métrica** | `docker compose config` sem erro; upload acima do limite recusado cedo |
| **Risco** | Baixo |
| **Dependências** | Nenhuma |
| **Teste de aceite** | Build sem avisos; compose de dev validável |
| **Rollback** | Reverter por item (independentes entre si) |
| **Escopo** | `LOCAL` → `DEPLOY` |
| **Status** | ✅ `DONE (local)` — 2026-09-17, **6 de 7 itens**; F-54 deliberadamente adiado |

| Achado | Decisão | Detalhe |
|---|---|---|
| F-72 | ✅ Corrigido | `--build-arg DATABASE_URL` removido do workflow. O Dockerfile **não declara** `ARG DATABASE_URL` — o valor era silenciosamente ignorado. Confirmado que a app recebe a URL em **runtime** via `environment:` do compose ([docker-compose.vps.yml:46](../docker-compose.vps.yml#L46)), então a remoção não quebra nada. Elimina o risco de a credencial virar camada de imagem |
| F-37 | ✅ Documentado | `EXPOSE 3050` vs `PORT=3000` **não é defeito**: 3050 é o nginx interno (publicado pelo compose), 3000 é o Node atrás dele. Alterar quebraria o mapeamento. Comentado no Dockerfile |
| F-39 | ✅ Corrigido | `*.tar.gz`, `*.tgz`, `*.zip` no `.dockerignore` |
| F-65 | ✅ Corrigido | `deploy-fix.tar.gz` e `deploy-manual.tar.gz` (1,4 MB cada) removidos do versionamento |
| F-15 | ✅ Documentado | `apps/frontend/Dockerfile` **não existe** — o serviço `frontend` do compose de dev falha. Anotado no arquivo; **não removido**, porque remover serviço por suposição poderia quebrar quem tenha o arquivo localmente. Fluxo suportado é `npm run dev` |
| F-9 | ✅ Corrigido | Limite do multer do WhatsApp: 100 MB → **50 MB**, alinhado ao `client_max_body_size 50M` do nginx. Antes o usuário transferia 100 MB e só então recebia 413 |
| F-54 | ⏸️ **Adiado** | `effective_io_concurrency` é **tuning de PostgreSQL**, escopo de **T-21**, que está `BLOCKED` por G-02. Ajustar agora seria dimensionar sem medição — o erro que as auditorias evitaram |

**Achado de segurança verificado e descartado.** Os tarballs continham `.env`, o que levantou suspeita de credenciais versionadas. Inspeção do conteúdo (valores mascarados) mostrou **5 variáveis `VITE_*` de configuração do frontend** — `VITE_APP_NAME`, `VITE_API_URL`, `VITE_APP_VERSION`, `VITE_USE_MOCK_API`, `NODE_ENV`. **Nenhum segredo**: sem `JWT_SECRET`, sem `DATABASE_URL`, sem senha. **Não há incidente de credenciais.** Registrado porque a ausência de achado também é resultado.

**Evidência T-11:**

| Verificação | Resultado |
|---|---|
| `docker compose -f docker-compose.vps.yml config` | ✅ válido |
| `docker compose -f docker-compose.yml config` | ✅ parseável |
| YAML do workflow (`yaml.safe_load`) | ✅ válido, job `deploy` |
| Nenhum `--build-arg DATABASE_URL` ativo | ✅ resta só o comentário explicativo |
| `tsc --noEmit` backend | ✅ 0 erros |

---

### FASE 2 — Build e deploy (a mudança de maior impacto)

#### T-12 · Mover build para o runner + registry + rollback
| Campo | Conteúdo |
|---|---|
| **Origem** | F-03, F-27, F-66, F-67, F-68, F-31, F-32, F-14, F-74, F-76 |
| **Problema** | Sequência `down`(L195) → `rmi`(L211) → `rm -rf`(L228) → `build`(L387) → `up`(L405). Durante **6–20 min medidos**, app fora do ar, imagem anterior destruída, código apagado. Build roda **fora do cgroup**, competindo com 17 containers. `--no-cache` + `builder prune -a` + `BUILD_TIMESTAMP` anulam todo cache |
| **Arquivos** | `.github/workflows/deploy-vps.yml`, `Dockerfile`, `docker-compose.vps.yml` |
| **Solução** | Build e push no runner (x86_64 ↔ x86_64 **confirmado**, sem emulação); GHCR (**já usado pelas vizinhas**); VPS só faz `pull` autenticado via `--password-stdin` + `up -d`; tag por SHA; manter N imagens anteriores; reordenar camadas (`package.json` → `npm ci` → código) |
| **Benefício esperado** | Downtime de 6–20 min → tempo de troca de container. Elimina pico de build da VPS. Habilita rollback por tag. **Todas são hipóteses: `NOT MEASURED`.** Ressalva: **não é deploy instantâneo** — o primeiro `pull` (imagem com ~767 MB de Chromium) será mais lento que hoje |
| **Métrica** | Downtime em segundos; duração do deploy; RAM/CPU da VPS durante deploy |
| **Risco** | **Médio-alto.** Depende de GHCR disponível; cache busting foi adicionado deliberadamente (commit *"cache-busting forçado"*) — provável sintoma de F-31; remover sem corrigir a ordem reintroduz o bug de código antigo |
| **Dependências** | **G-07** (custo de CI); autenticação no GHCR |
| **Teste de aceite** | Deploy conclui; `GIT_COMMIT` confere; rollback por tag anterior sobe a versão antiga; `/health` responde durante quase todo o deploy |
| **Rollback** | Restaurar o workflow anterior |
| **Escopo** | `DEPLOY` |
| **Status** | `PENDING` (G-07 é ressalva, não bloqueio) |

#### T-13 · Podar devDependencies (após resolver o seed)
| Campo | Conteúdo |
|---|---|
| **Origem** | F-30, F-34, F-35, F-05 |
| **Problema** | `COPY --from=builder /app/node_modules` traz tudo, inclusive devDeps dos 3 workspaces. **Mas `tsx`, `prisma` CLI e `typescript` são devDeps usadas em runtime** — prune ingênuo quebra o boot |
| **Arquivos** | `Dockerfile`, `apps/backend/package.json` |
| **Solução** | **Primeiro** compilar o seed para `dist/` e apontar `prisma.seed` para `node dist/...`; **depois** `npm prune --omit=dev`. Remover também o fallback `npx tsx src/server.ts` do startup |
| **Benefício esperado** | Imagem menor e superfície reduzida. **Magnitude `NOT MEASURED`** (imagem nunca construída). **Imagem menor não equivale automaticamente a disco físico recuperado** — camadas compartilhadas contam uma vez |
| **Métrica** | MB da imagem final; `docker system df` antes/depois |
| **Risco** | **ALTO se feito sem T-01.** Quebra silenciosa que só aparece no primeiro boot com banco vazio |
| **Dependências** | **T-01** (seed), **T-12** (rollback disponível antes de arriscar) |
| **Teste de aceite** | **Cinco testes separados** em ambiente descartável: (1) startup, (2) consulta ao banco, (3) `migrate deploy`, (4) seed com banco vazio, (5) `/health` — **todos com a imagem podada** |
| **Rollback** | Remover o prune; **imagem anterior disponível via T-12** |
| **Escopo** | `LOCAL` → `DEPLOY` |
| **Status** | `BLOCKED` (T-01, T-12) |

#### T-14 · Smoke tests reais no deploy
| Campo | Conteúdo |
|---|---|
| **Origem** | F-75, F-51, F-17 |
| **Problema** | Healthcheck testa `/health`, que responde pelo nginx e **não toca o banco**. `migrate deploy` falho cai em `db push` e o boot continua — deploy reportado como sucesso com schema divergente |
| **Arquivos** | workflow, `docker/startup.sh`, `docker-compose.vps.yml` |
| **Solução** | Remover fallback `db push`; verificar `_prisma_migrations` (todas aplicadas, nenhuma `rolled_back_at`); consulta autenticada representativa; healthcheck do container apontando para o Node (`localhost:3000/health`) |
| **Benefício esperado** | Deploy quebrado falha em vez de passar |
| **Métrica** | Migration quebrada ⇒ deploy falha |
| **Risco** | Deploys que hoje "passam" passarão a falhar — comportamento correto |
| **Dependências** | Nenhuma |
| **Teste de aceite** | Migration propositalmente quebrada reprova; deploy saudável aprova em todos os smoke tests |
| **Rollback** | Reverter os 4 arquivos; o fallback `db push` pode ser restaurado se necessário |
| **Escopo** | `LOCAL` → `DEPLOY` |
| **Status** | ✅ `DONE (local)` — 2026-09-17. **Não verificado em produção** |

**Três camadas aplicadas:**

| Achado | Arquivo | Correção |
|---|---|---|
| F-75 | [startup.sh](../docker/startup.sh) | Fallback `db push` **removido**. Migration falha agora **aborta o boot** com `exit 1` |
| F-75 | [startup.sh](../docker/startup.sh) | Nova verificação de `_prisma_migrations`: aborta se houver migration com `finished_at IS NULL` ou `rolled_back_at IS NOT NULL` |
| F-51 | [app.ts](../apps/backend/src/app.ts) | `/health` faz `SELECT 1` no banco; retorna **503** se inacessível. Antes devolvia 200 sempre |
| F-51 | [docker-compose.vps.yml](../docker-compose.vps.yml), [Dockerfile](../Dockerfile) | Healthcheck aponta para o **Node (3000)**, não para o nginx (3050) — o nginx responde mesmo com backend morto |

**Ajuste estrutural necessário:** a extração de `DB_USER`/`DB_PASS`/`DB_HOST`/`DB_PORT`/`DB_NAME` foi **movida para antes das migrations**. Antes só acontecia no bloco do seed, depois do ponto onde a nova verificação precisa dessas variáveis.

**Evidência T-14** (Postgres descartável em `:55436` e `:55437`, ambos destruídos):

| Cenário | Resultado |
|---|---|
| `/health` com banco de pé | **HTTP 200**, `database: connected` ✅ |
| **`/health` com Postgres derrubado** | **HTTP 503**, `database: unreachable` ✅ — *antes retornava 200* |
| Guarda com migration marcada `rolled_back_at` | **exit 1 — BOOT ABORTADO** ✅ |
| Guarda com banco saudável (4 migrations `ok`) | exit 0 — boot segue ✅ |
| `sh -n startup.sh` · `tsc --noEmit` | ✅ 0 erros |

O cenário de banco derrubado foi exercitado **de verdade** (`docker stop` com a app no ar), não simulado.

**Relação direta com F-100:** o fallback `db push` removido aqui é o mesmo mecanismo que mascarou a migration quebrada encontrada em T-01. Esta tarefa fecha a causa estrutural daquele achado.

**Pendente em produção:** o healthcheck do container em `:3000` não foi exercitado em container real — se o nginx e o Node divergirem de porta em produção, só aparece no deploy.

#### T-15 · Concorrência e canal de deploy
| Campo | Conteúdo |
|---|---|
| **Origem** | F-77, F-69, F-70 |
| **Problema** | `cancel-in-progress: true` pode abortar entre `down` e `up` — **2 runs cancelados no histórico**. `sshpass -p '<senha>'` expõe senha de root em `/proc/<pid>/cmdline`. `StrictHostKeyChecking=no` + `/dev/null` aceita qualquer host key |
| **Arquivos** | `.github/workflows/deploy-vps.yml`, `/root/.ssh/authorized_keys` |
| **Solução** | `cancel-in-progress: false`; chave SSH dedicada (`authorized_keys` está **vazio** hoje) com `command=`/`from=`; host key fixada por secret |
| **Benefício esperado** | Deploy não interrompível no meio; credencial fora do espaço de processo |
| **Métrica** | Binário |
| **Risco** | **Alto.** Chave mal configurada = perda de acesso. Testar em sessão paralela antes |
| **Dependências** | **REQUER AUTORIZAÇÃO** (altera acesso ao host) |
| **Teste de aceite** | Deploy por chave; `PasswordAuthentication` desativável sem perder acesso |
| **Rollback** | Reativar senha |
| **Escopo** | **`REQUER AUTORIZAÇÃO`** |
| **Status** | `PENDING` |

---

### FASE 3 — Runtime e consultas

#### T-16 · Ligar o consumidor da fila de webhooks
| Campo | Conteúdo |
|---|---|
| **Origem** | F-84, F-83 |
| **Problema** | `processPendingDeliveries()` ([webhook.service.ts:377](../apps/backend/src/modules/webhooks/webhook.service.ts#L377)) implementado e **nunca chamado** (grep: só a definição). Retry depende de `setTimeout` em memória (L279), **perdido a cada deploy de 6–20 min** |
| **Arquivos** | `webhook.service.ts`, novo agendamento |
| **Solução** | `CronJob` invocando `processPendingDeliveries()`, padrão de `tokenCleanupService`. Estado já está no banco |
| **Benefício esperado** | Entregas a **consumidores externos** deixam de ser abandonadas |
| **Métrica** | Delivery pendente processada dentro do intervalo |
| **Risco** | Baixo. Primeira execução pode disparar lote antigo — avaliar corte por idade |
| **Dependências** | Nenhuma |
| **Teste de aceite** | Entrega falha → processo reinicia → retry ocorre |
| **Rollback** | Remover `webhookRetryService.start()` do app.ts e apagar o serviço |
| **Escopo** | `LOCAL` → `DEPLOY` |
| **Status** | ✅ `DONE (local)` — 2026-09-17. **Retry sob restart: `NOT VERIFIED` em produção** |

**Evidência revalidada:** `grep -rn processPendingDeliveries` retorna **apenas a definição** ([webhook.service.ts:377](../apps/backend/src/modules/webhooks/webhook.service.ts#L377)) — nenhum chamador. Confirmado.

**Arquivos:** **novo** [webhook-retry.service.ts](../apps/backend/src/services/webhook-retry.service.ts) (CronJob de 1 min, padrão de `token-cleanup.service.ts`), [app.ts](../apps/backend/src/app.ts) (start), [server.ts](../apps/backend/src/server.ts) (stop no shutdown).

**Risco do plano mitigado sem mudança de código.** A tarefa alertava que "a primeira execução pode disparar lote antigo". A leitura do método mostra que ele **já** tem `take: 100` e filtra `nextAttemptAt <= now` — o lote é naturalmente limitado. Nenhum corte por idade foi necessário.

**Adicionado além do previsto:** guarda `isProcessing` no cron, pelo mesmo motivo de T-23 — uma rodada com timeouts de rede pode exceder o intervalo de 1 min. E `stop()` no shutdown: sem isso o CronJob mantém o processo vivo e impede o encerramento limpo.

`tsc --noEmit` 0 erros · `npm run build` exit 0.

**Pendente em produção:** o ciclo completo (entrega falha → restart do processo → retry efetivo) exige um consumidor externo real. **`NOT VERIFIED`**.

#### T-17 · Eliminar N+1 do Kanban
| Campo | Conteúdo |
|---|---|
| **Origem** | F-45 |
| **Problema** | [kanbanColumn.controller.ts:159-181](../apps/backend/src/controllers/kanbanColumn.controller.ts#L159): `findMany` + `columns.map(async → count())` via `Promise.all`. **N consultas simultâneas no mesmo pool** — se N ≥ pool, enfileiram |
| **Arquivos** | `kanbanColumn.controller.ts` |
| **Solução** | Um `groupBy` com `_count` por `status` |
| **Benefício esperado** | N+1 → 2 consultas. **Latência: `NOT MEASURED`** |
| **Métrica** | Nº de consultas no log; latência do endpoint |
| **Risco** | Baixo. `groupBy` omite contagem zero — reconciliar com a lista de colunas |
| **Dependências** | Nenhuma |
| **Teste de aceite** | Resposta idêntica, **incluindo colunas com zero leads** |
| **Rollback** | Reverter o método `getStats` |
| **Escopo** | `LOCAL` → `DEPLOY` |
| **Status** | ✅ `DONE (local)` — 2026-09-17. **Latência em produção: `NOT MEASURED`** |

**Evidência T-19/T-17** (Postgres descartável em `:55438`, 6 colunas Kanban: **3 com leads e 3 vazias**, destruído ao fim):

| Verificação | Resultado |
|---|---|
| Consultas | **7 → 2** (6 colunas + 1 → groupBy + findMany) |
| Colunas com leads | 3 |
| **Colunas com ZERO leads** | **3 — preservadas ✅** |
| **Resposta byte a byte idêntica à implementação antiga** | ✅ |

O teste executou **as duas implementações lado a lado** contra o mesmo banco e comparou os JSONs. O risco registrado na tarefa — `groupBy` omitir contagem zero — foi **exercitado de propósito**: metade das colunas não tinha leads, e todas aparecem com `count: 0`.

#### T-18 · Reduzir polling redundante
| Campo | Conteúdo |
|---|---|
| **Origem** | F-85, F-82 |
| **Problema** | [ConversationList.tsx:68](../apps/frontend/src/components/whatsapp/ConversationList.tsx#L68): `setInterval(30000)` **e** `useWhatsAppWebSocket` para o mesmo dado. `WhatsAppAutomations` tem **dois** `refetchInterval: 10000`. Cada ciclo dispara `getConversations`, que é N+1 via Puppeteer |
| **Arquivos** | `ConversationList.tsx`, `WhatsAppAutomations.tsx`, `useWhatsAppAutomation.ts` |
| **Solução** | Onde há WebSocket, elevar o intervalo a fallback longo; consolidar os dois hooks de 10 s; avaliar `refetchOnReconnect` do React Query 5 |
| **Benefício esperado** | Menos travessias ao Chromium e menos consultas. **`NOT MEASURED`** |
| **Métrica** | Requisições/min por aba; `formatTime` já logado pelo código |
| **Risco** | Médio. Se o WebSocket cair silenciosamente, o polling é a rede de segurança |
| **Dependências** | **T-02/T-03** (WebSocket confiável antes de reduzir o fallback) |
| **Teste de aceite** | Atualização em tempo real por WS; ao derrubar o socket, fallback atua |
| **Rollback** | Restaurar intervalos |
| **Escopo** | `LOCAL` → `DEPLOY` |
| **Status** | `PENDING` |

#### T-19 · Unificar PrismaClient e fixar o pool
| Campo | Conteúdo |
|---|---|
| **Origem** | F-01, F-24, F-49, F-25, F-90 |
| **Problema** | 20 `new PrismaClient()`; **12 em serviços de runtime** ignoram o singleton de [database.ts:28](../apps/backend/src/config/database.ts#L28) (importado por 32 arquivos). Pool default = `num_cpus*2+1` = **9 por cliente**; Node vê 4 CPUs **sob qualquer cota** (M-02). **12×9 = ~108 conexões vs `max_connections`=100 (medido)**. `shutdown()` só desconecta o singleton |
| **Arquivos** | 12 serviços de runtime; `docker-compose.vps.yml` (URL); `server.ts` |
| **Solução** | Importar o singleton nos 12; manter os 8 scripts (executam e encerram); `?connection_limit=N&pool_timeout=M` na URL; encerrar todos os timers no shutdown |
| **Benefício esperado** | ~108 → ~9–20 conexões. **Hipótese: `NOT MEASURED`.** Também reduz memória nativa (12 query engines → 1) |
| **Métrica** | `SELECT count(*) FROM pg_stat_activity WHERE datname='ferraco_crm'` |
| **Risco** | **Médio-alto.** O singleton registra `$on('query'/'error'/'warn')` que os locais não têm — muda volume de log. Verificar se algum serviço depende de config distinta |
| **Dependências** | **Precede T-20 e T-21** |
| **Teste de aceite** | Conexões estabilizam; todos os 12 módulos respondem; sem `too many clients`; após `SIGTERM`, conexões zeram na janela de graça |
| **Rollback** | Reverter imports + remover os parâmetros da URL (mudança só de código, sem efeito em dados) |
| **Escopo** | `LOCAL` → `DEPLOY` |
| **Status** | ✅ `DONE (local)` — 2026-09-17. **Redução medida. Comportamento sob carga real: `NOT VERIFIED`** |

**Correção da contagem:** o plano dizia "20 `new PrismaClient()`, 12 em runtime". A varredura encontrou **19 no total, 13 em runtime** — um a mais que o previsto (`eventEmitter.ts`).

**Verificação que reduziu o risco.** O plano classificava o risco como médio-alto porque "o singleton registra `$on('query'/'error'/'warn')` que os locais não têm". Inspecionei os 13: **todos são `new PrismaClient()` sem argumentos**. Apenas o singleton usa opções, e o `$on('query')` só é registrado em `NODE_ENV === 'development'`. Em produção **não há mudança de volume de log**.

**Dois padrões tratados de forma distinta:**
- 9 arquivos com `const prisma = new PrismaClient()` → substituídos pelo import do singleton
- 4 arquivos com injeção no construtor (`new AIService(new PrismaClient())`) → passam `prisma`; `PrismaClient` permanece como **`import type`**, pois ainda é o tipo do parâmetro

**Evidência T-19** (Postgres descartável em `:55439`, `max_connections=100` — mesmo valor medido na VPS; carga idêntica de **39 consultas concorrentes** nos dois cenários):

| Cenário | Conexões no pico |
|---|---|
| 13 clientes independentes (código **antigo**) | **40** |
| Singleton com `connection_limit=15` (código **novo**) | **16** |
| Após `$disconnect()` | **1** (base) |

**Redução medida: 24 conexões.** `connection_limit=15` respeitado; conexões zeram no shutdown.

*Ressalva honesta:* as 40 do cenário antigo vieram de 3 consultas por cliente. Se os 13 abrissem o pool completo (9 cada), a demanda chegaria aos ~117 projetados — acima de `max_connections=100`. O teste **não** reproduziu a exaustão, apenas a diferença estrutural.

**Pool fixado** em [docker-compose.vps.yml](../docker-compose.vps.yml): `?connection_limit=15&pool_timeout=20`. O valor não depende mais de `num_cpus`, que o Node reporta como 4 sob qualquer cota (M-02).

**Consequência para a Fase 4:** T-20 e T-21 dependiam de T-19 justamente porque dimensionar sobre um número de conexões prestes a mudar produziria valores errados. **Essa dependência está satisfeita** — mas ambas seguem `BLOCKED` por G-02 (falta baseline do app em produção).

#### T-23 · Guarda de sobreposição no scheduler
| Campo | Conteúdo |
|---|---|
| **Origem** | F-86, F-11, F-50 |
| **Problema** | `isRunning` protege contra **iniciar duas vezes**, não contra ciclos sobrepostos. `setInterval(30000)` não verifica se o ciclo anterior terminou — e `processAutomations` envia WhatsApp via Puppeteer, podendo exceder 30 s |
| **Arquivos** | `automationScheduler.service.ts` |
| **Solução** | `isProcessing` liberado em `finally` |
| **Benefício esperado** | Elimina ciclos concorrentes. **Pré-requisito de F-87 (idempotência)** |
| **Métrica** | Log não mostra ciclos sobrepostos |
| **Risco** | Baixo |
| **Dependências** | Nenhuma |
| **Teste de aceite** | Ciclo longo não é sobreposto pelo seguinte |
| **Rollback** | Remover a flag `isProcessing` e o bloco `finally` |
| **Escopo** | `LOCAL` → `DEPLOY` |
| **Status** | ✅ `DONE (local)` — 2026-09-17. **Não verificado em produção** |

**Evidência T-23:**

| Verificação | Resultado |
|---|---|
| Ticks descartados durante ciclo longo | **3 de 3** ✅ |
| Ciclos efetivamente executados | 1 (não 4) ✅ |
| **Flag liberada após exceção no ciclo** | ✅ |
| Scheduler segue funcional após erro | ✅ |

**Detalhe que evita um defeito pior que o original.** A liberação está em `finally`, não no fim do `try`. `processAutomations()` tem **três `return` antecipados** (sem settings, fim de semana, fora do horário comercial) e um `catch`. Sem o `finally`, qualquer um deles deixaria `isProcessing` preso em `true` e o scheduler **morreria em silêncio** — pior que os ciclos sobrepostos que a tarefa corrige. O teste exercitou o caminho de exceção explicitamente.

Também zerada em `stop()`, para que um `start()` posterior não herde estado travado.

#### T-24 · Paginação e streaming em operações dirigidas por dados
| Campo | Conteúdo |
|---|---|
| **Origem** | F-44, F-21, F-22, F-89, F-23, F-46 |
| **Problema** | **77 de 88 `findMany` sem `take`**; `memoryStorage()` + `csv-parse/sync` (3 cópias em RAM, event loop bloqueado); ExcelJS `writeBuffer()` sem streaming — pico proporcional à base; Sharp sem `concurrency`/`cache` configurados |
| **Arquivos** | `reports.service.ts`, `tags.service.ts`, `pipeline.service.ts`, `leads.service.ts`, `leads.routes.ts`, `leads.export.service.ts`, `upload.controller.ts` |
| **Solução** | Classificar os 77 por tabela-alvo (configuração pode ficar; crescimento contínuo precisa de cursor); `diskStorage` + parse por stream; `WorkbookWriter` streaming; `sharp.concurrency()`/`cache()` explícitos |
| **Benefício esperado** | Memória constante independente do volume. **`NOT MEASURED`** |
| **Métrica** | RSS durante exportação da maior base; latência de outras rotas durante importação |
| **Risco** | **Médio-alto.** Paginar **altera contrato de API** — quebra frontend **e consumidores externos** (X-02..X-05). Não é mudança interna |
| **Dependências** | Inventário de consumidores por endpoint |
| **Teste de aceite** | Rotas respondem em tempo e memória estáveis com volume representativo |
| **Rollback** | Reverter por endpoint |
| **Escopo** | `LOCAL` → `DEPLOY` |
| **Status** | `PENDING` |

---

### FASE 4 — Dimensionamento (BLOQUEADA por G-02)

> **Nenhuma destas tarefas é executável antes de o app estar no ar e medido.** Dimensionar sem carga representativa é exatamente o erro que as auditorias evitaram.

#### T-20 · Definir `mem_limit` e política de CPU
| Campo | Conteúdo |
|---|---|
| **Origem** | F-02, F-19, F-20 |
| **Problema** | Ferraco é o **único** serviço do host sem `mem_limit`/`cpus` (18/18 vizinhos têm, efetivos). Mas: throttling generalizado medido com load 0,09 — `aprenderia-nginx` com **1.592 throttles / 102,9 s** a `cpus 0.25` |
| **Solução** | Subir **sem limite ou com limite folgado**; medir 48–72 h com sessão WhatsApp estável; exercitar picos (exportação, importação, uploads); limite = pico observado + folga. Para CPU, preferir `cpu_shares` (peso) a `cpus` (cota rígida) |
| **Benefício esperado** | Contenção sem latência artificial. **Sem número proposto** |
| **Métrica** | `memory.current` amostrado periodicamente (`memory.peak` **não existe** no kernel 5.15 — G-03) |
| **Risco** | Limite abaixo do pico do Chromium ⇒ reinício em laço e **perda da sessão WhatsApp** |
| **Dependências** | **G-02**, **G-03**, **T-19** (pools alteram o consumo), **T-13** (imagem podada altera a linha de base) |
| **Teste de aceite** | 72 h sem OOM, sem reinício; QR persistente |
| **Rollback** | Remover chaves e recriar |
| **Escopo** | `DEPLOY` |
| **Status** | **`BLOCKED`** |

#### T-21 · Tuning do PostgreSQL
| Campo | Conteúdo |
|---|---|
| **Origem** | F-42, F-43, F-52, F-53, F-54 |
| **Problema** | Defaults medidos: `max_connections=100`, `shared_buffers=128MB`. **As 4 vizinhas tunam** (`source=command line` confirmado): 30–50 conexões, 64–192 MB. Sem `statement_timeout` nem `idle_in_transaction_session_timeout`. Superusuário usado pela aplicação |
| **Solução** | Declarar parâmetros via `command:`, **derivados da medição** — não por porcentagem fixa. Papel de aplicação com privilégios restritos |
| **Benefício esperado** | Conexões dentro do teto; memória contida |
| **Métrica** | `pg_stat_activity` abaixo do teto; sem `too many clients` em 72 h |
| **Risco** | `shared_buffers` alto com `mem_limit` baixo impede a inicialização; `max_connections` baixo recusa conexões |
| **Dependências** | **T-19** (define o nº real de pools), **T-20** (define `mem_limit`) |
| **Teste de aceite** | Postgres inicia; app conecta; 72 h estável |
| **Rollback** | Remover `command:` (volume intacto) |
| **Escopo** | `DEPLOY` |
| **Status** | **`BLOCKED`** |

#### T-22 · Revisão de índices
| Campo | Conteúdo |
|---|---|
| **Origem** | F-47 |
| **Problema** | **166 `@@index` para 63 modelos**; `Lead` tem 12, incluindo booleanos de baixa cardinalidade. Cada índice é atualizado a cada escrita — custo contínuo num CRM com captura automática |
| **Solução** | **Diagnóstico primeiro:** habilitar `pg_stat_statements`; após uso acumulado, consultar `pg_stat_user_indexes` (`idx_scan=0`); então remover inúteis e criar compostos. Índice parcial como alternativa para booleanos |
| **Benefício esperado** | Menos I/O de escrita e disco. **`NOT MEASURED`** |
| **Métrica** | `idx_scan` por índice; tamanho dos índices; latência de escrita |
| **Risco** | **Remover índice sem dados de uso é perigoso** — pode ser o índice de consulta rara mas crítica |
| **Dependências** | **G-02**; `pg_stat_statements` habilitado no primeiro deploy |
| **Teste de aceite** | `EXPLAIN ANALYZE` antes/depois em ambiente com dados representativos |
| **Rollback** | `CREATE INDEX CONCURRENTLY` com DDL guardado |
| **Escopo** | **`REQUER AUTORIZAÇÃO`** (DDL em produção) |
| **Status** | **`BLOCKED`** |

---

### FASE 5 — Host e observabilidade (REQUER AUTORIZAÇÃO)

#### T-25 · Observabilidade
| Campo | Conteúdo |
|---|---|
| **Origem** | F-99 |
| **Problema** | Sem Prometheus/node_exporter/Netdata. **Todas as auditorias registraram `NOT MEASURED` porque não há sistema que registre.** É exatamente o que fez a causa do incidente original se perder (G-01) |
| **Solução** | node_exporter + coleta externa, ou agente do provedor. `log_min_duration_statement` no Postgres |
| **Benefício esperado** | **Desbloqueia G-02, G-03** e toda a Fase 4 |
| **Métrica** | Séries de RAM/CPU/steal/latência disponíveis |
| **Risco** | Consome ~50 MiB — troca favorável |
| **Dependências** | **REQUER AUTORIZAÇÃO** |
| **Teste de aceite** | Séries coletadas por 72 h sem lacuna |
| **Rollback** | Remover agente |
| **Escopo** | **`REQUER AUTORIZAÇÃO`** |
| **Status** | `PENDING` |

#### T-26 · Firewall
| Campo | Conteúdo |
|---|---|
| **Origem** | F-95, F-64 |
| **Problema** | `ufw inactive`; `iptables INPUT` policy `ACCEPT` sem regras. Portas 25, 587, 3001, 3060, 9001, 9006 públicas — e com o Ferraco no ar, a 3050, que (sem T-02) entrega o QR do WhatsApp à internet. `fail2ban` inativo com SSH por senha |
| **Solução** | Permitir 22/80/443 e SMTP legítimo; bloquear o resto. **Atenção: Docker manipula `iptables` diretamente e contorna `INPUT` do UFW — exige `DOCKER-USER`** |
| **Benefício esperado** | Superfície reduzida para **as 5 aplicações** |
| **Métrica** | Portas não autorizadas recusam conexão externa |
| **Risco** | **Alto.** Regra incorreta derruba SSH ou as 4 vizinhas. Exige janela e console do provedor como acesso alternativo |
| **Dependências** | **Coordenar com donos das aplicações vizinhas**; **REQUER AUTORIZAÇÃO** |
| **Teste de aceite** | Vizinhas acessíveis; SSH mantido; portas fechadas recusam |
| **Rollback** | `ufw disable` |
| **Escopo** | **`REQUER AUTORIZAÇÃO`** |
| **Status** | `PENDING` |

#### T-27 · Estratégia de migrations e recuperação
| Campo | Conteúdo |
|---|---|
| **Origem** | F-78, F-51 |
| **Problema** | Migrations do Prisma não têm `down`. Após `DROP COLUMN` ou mudança de tipo com truncamento, **rollback de código não recupera dados** — só restore. Hoje: sem backup do banco, sem imagem anterior, sem procedimento |
| **Solução** | Política de migrations expansivas (adicionar antes, remover em release posterior); backup **antes** de cada migration; procedimento de recuperação documentado e **testado** |
| **Benefício esperado** | Recuperabilidade após migration destrutiva |
| **Métrica** | Restore validado |
| **Risco** | Disciplina adicional; duplica etapas de schema |
| **Dependências** | **T-08** (backup), **T-12** (imagem anterior) |
| **Teste de aceite** | Simular rollback após migration aditiva (sem restore) e após destrutiva (com restore funcional) |
| **Rollback** | N/A (processo) |
| **Escopo** | Processo + `DEPLOY` |
| **Status** | `BLOCKED` (T-08, T-12) |

#### T-28 a T-34 · Tarefas menores agrupadas

| ID | Origem | Resumo | Status |
|---|---|---|---|
| T-28 | F-26 | `init: true` no compose para reaping de filhos do Chromium (startup limpa `SingletonLock` — evidência de que já ocorreu) | ✅ `DONE (local)` — 2026-09-18 |
| T-29 | F-18 | `UV_THREADPOOL_SIZE` explícito (Node vê 4 CPUs sob qualquer cota) | `BLOCKED` (T-20) |
| T-30 | F-33 | Avaliar `binaryTargets` sem `"native"` (~15,4 MB) — **depende de onde o build passará a ocorrer** | `BLOCKED` (T-12) |
| T-31 | F-38 | Alinhar `apps/backend/Dockerfile` (node:18 vs node:20) ou marcá-lo obsoleto | ✅ `DONE (local)` — 2026-09-18, marcado obsoleto |
| T-32 | F-41, F-61 | Reduzir privilégios: nginx sem root; `chmod 750` | `PENDING` |
| T-33 | F-96 | Verificar `LimitNOFILE` do `docker.service` antes de assumir folga para Socket.IO | ✅ `DONE (medido)` — 2026-09-18. **Hipótese REFUTADA: não há problema** |
| T-34 | F-91 | Inventariar processos fora do Docker (2× `next-server`, `uvicorn`, runner ≈ 670 MiB sem cgroup) | `BLOCKED` (G-04) |
| **T-35** | **F-103, F-104** | **Segredos e CORS do compose** (achado novo — ver abaixo) | ✅ `DONE (local)` — 2026-09-18 |

---

#### T-33 · Evidência medida (F-96) — hipótese refutada

Medido na VPS em 2026-09-18, com a aplicação em execução:

| Métrica | Valor |
|---|---|
| `docker.service` `LimitNOFILE` | **524.288** |
| `ulimit -n` dentro do container | **1.048.576** |
| `fs.nr_open` do host | 1.048.576 |
| FDs em uso no host inteiro | **13.472** |

**Conclusão: F-96 não é um problema.** A suspeita era de que o limite herdado pudesse estreitar o Socket.IO. O container tem ~1 milhão de descritores disponíveis e o host inteiro — com **93 containers rodando** — usa 13.472, ou seja **1,3% do teto**. Nenhuma ação é necessária.

Registrado como refutação explícita para que a dúvida não volte em auditorias futuras.

#### T-35 · Segredos e CORS do `docker-compose.vps.yml` (achado novo)

Encontrado ao revisar o compose antes do deploy. Não constava no plano original.

| ID | Achado | Antes | Depois |
|---|---|---|---|
| **F-103** | Senha do Postgres fixa no arquivo versionado | `POSTGRES_PASSWORD: ferraco123` | `${POSTGRES_PASSWORD:?...}` |
| **F-103** | Mesma senha embutida na URL de conexão | `postgresql://ferraco:ferraco123@...` | interpolada da variável |
| **F-103** | `JWT_SECRET` com default público | `${JWT_SECRET:-change-this-secret-in-production}` | `${JWT_SECRET:?...}` |
| **F-104** | CORS liberando qualquer origem | `${CORS_ORIGIN:-*}` | default = 4 domínios do cliente |

**Por que `:?` e não um default melhor:** com `:-`, um erro de configuração sobe a aplicação **silenciosamente** com credencial conhecida. Com `:?`, o `docker compose up` aborta e diz o que falta. Falhar cedo e barulhento é melhor que subir inseguro.

**Gravidade real:** a VPS é compartilhada com ~30 aplicações de clientes. Uma credencial em repositório é acesso ao banco, não detalhe de configuração. O `JWT_SECRET` default permitiria **forjar token de qualquer usuário, inclusive ADMIN**.

**Verificação executada:**

| Teste | Resultado |
|---|---|
| `docker compose config` **sem** as variáveis | ✅ `rc=1` — aborta com mensagem nomeando a variável |
| `docker compose config` **com** as variáveis | ✅ `rc=0` |
| Interpolação na `DATABASE_URL` | ✅ senha propagada corretamente |

Criado `.env.vps.example` documentando a geração dos segredos e **alertando** que trocar `POSTGRES_PASSWORD` com o volume já existente exige `ALTER USER` — a variável só vale na inicialização do cluster.

---

## 4. Fases — ordem e justificativa

| Fase | Conteúdo | Critério |
|---|---|---|
| **0** | T-01..T-08 | **Risco de perda de dados e exposição.** Reversíveis, sem interdependência forte |
| **1** | T-09..T-11 | Baixo risco, sem mudança de comportamento observável |
| **2** | T-12..T-15 | **Build e deploy** — maior impacto único; habilita rollback, que todas as fases seguintes pressupõem |
| **3** | T-16..T-19, T-23, T-24 | Runtime e consultas — comportamento observável, exige fase 2 para rollback seguro |
| **4** | T-20..T-22, T-29, T-30 | **Dimensionamento — BLOQUEADA por G-02** |
| **5** | T-25..T-28, T-31..T-34 | Host e arquitetura — requer autorização e coordenação com terceiros |

**Princípio aplicado:** não mudar dimensões independentes simultaneamente. Em particular, **T-19 (pools) precede T-20/T-21 (limites)** — dimensionar sobre um número de conexões que está prestes a mudar produziria valores errados.

**Primeira fase elegível: FASE 0.** Não depende de nada além de G-08 (que bloqueia apenas T-05).

---

## 5. Operação

### 5.1 Ambiente de teste

**Não existe ambiente de staging** ([DEPLOY-CICD-AUDIT.md](DEPLOY-CICD-AUDIT.md): deploy vai direto para produção). Para as tarefas que exigem teste isolado — T-01, T-13, T-14, T-27 — é necessário container descartável com Postgres efêmero na máquina local ou em worktree.

**T-04 do plano de testes (seed) é destrutivo por natureza** e **nunca** pode rodar contra o banco de produção.

### 5.2 Carga comparável

**Não existe.** Nenhuma carga representativa foi definida ou registrada. Para a Fase 4, é pré-requisito:

| Fluxo | O que exercitar |
|---|---|
| Sessão WhatsApp | Pareada e estável por 48–72 h |
| Exportação | Maior base disponível |
| Importação | CSV no limite de tamanho |
| Uploads | N concorrentes |
| Kanban/dashboard | Consultas de estatística |

### 5.3 Janela de observação e checkpoints

| Checkpoint | Quando | Critério para prosseguir |
|---|---|---|
| CP-0 | Após Fase 0 | Seed não destrói; socket autenticado; upload protegido |
| CP-1 | Após Fase 1 | Logs no volume; build conclui |
| CP-2 | Após Fase 2 | **Rollback por tag demonstrado funcionando** |
| CP-3 | Após Fase 3 | Conexões estáveis; sem regressão de latência |
| CP-4 | **48–72 h de observação** | Baseline coletado ⇒ desbloqueia Fase 4 |

### 5.4 Limites de regressão — pontos de parada

Parar e reverter se, após qualquer deploy:

| Sinal | Limite |
|---|---|
| Erros 5xx | Qualquer aumento sustentado sobre o baseline |
| `/health` | Falha por mais de 2 ciclos de healthcheck |
| OOM | **Qualquer ocorrência** (hoje: zero, em 4 fontes) |
| Reinício de container | **Qualquer** não intencional |
| `too many clients` no Postgres | **Qualquer ocorrência** |
| Sessão WhatsApp | **Qualquer** solicitação inesperada de QR |
| Latência | **`NOT MEASURED`** — sem baseline, não há limite numérico definível |

**O limite de latência só será definível após CP-4.** Registrar isso é mais honesto que fixar um número arbitrário.

### 5.5 Backups restauráveis

| Estado | Situação |
|---|---|
| Uploads e sessions | Backup no deploy, retenção 5 — **restore nunca testado** |
| **PostgreSQL** | **NENHUM backup** (T-08) |
| Imagem anterior | **Destruída a cada deploy** (T-12) |

**Nenhuma tarefa da Fase 3 ou 4 deveria prosseguir antes de T-08 com restore validado.**

### 5.6 Ações que dependem de autorização ainda não concedida

| Tarefa | Ação | Por quê |
|---|---|---|
| T-05 | Alterar nginx do host, emitir certificado | Host compartilhado com 4 aplicações |
| T-15 | Alterar `authorized_keys`, desativar senha SSH | Risco de perda de acesso |
| T-22 | DDL (`DROP INDEX`) em produção | Destrutivo |
| T-25 | Instalar agente de observabilidade | Altera o host |
| T-26 | Habilitar firewall | **Pode derromper as 4 vizinhas** — exige coordenação com seus donos |
| T-08 (parcial) | Agendamento periódico no host | Altera o host |

---

## 6. Plano de rollback

### 6.1 Por camada

| Camada | Mecanismo | Disponível hoje? |
|---|---|---|
| Código | `git revert` + push na `main` (deploy automático) | ✅ Sim |
| Imagem | `docker run` da tag anterior | ❌ **Não — T-12** |
| Configuração de container | Remover chave e recriar | ✅ Sim |
| Schema aditivo | Migration compensatória | ✅ Sim |
| **Schema destrutivo** | **Restore de backup** | ❌ **Não — T-08** |
| Host (nginx, firewall) | Restaurar config anterior | ⚠️ Manual |

### 6.2 Cenários

| Cenário | Ação |
|---|---|
| Deploy falha no build | Com T-12: imagem anterior continua no ar. **Hoje: app fica fora do ar** |
| App sobe mas quebrado | `git revert` + push. Janela = duração do deploy |
| Migration destrutiva aplicada | **Restore obrigatório.** Sem T-08, **irrecuperável** |
| Firewall derruba acesso | Console do provedor; `ufw disable` |
| Limite de RAM causa laço | Remover `mem_limit`, recriar. Sessão WhatsApp pode exigir novo QR |

---

## 7. Métricas — baseline e alvo

| Métrica | Baseline medido | Alvo |
|---|---|---|
| Downtime por deploy | **6–20 min** (15 runs) | Segundos (T-12) — hipótese |
| Duração do deploy | mediana ~11 min | `NOT MEASURED` |
| Conexões Postgres | demanda ~108 vs teto 100 | ~9–20 (T-19) — hipótese |
| `findMany` sem paginação | **77 de 88** | Classificados (T-24) |
| Camadas do builder | +767 MB (Chromium) | −767 MB (T-10) |
| Imagem final | **`NOT MEASURED`** | `NOT MEASURED` |
| RAM do Ferraco | **`NOT MEASURED`** | `NOT MEASURED` |
| Latência p50/p95 | **`NOT MEASURED`** | `NOT MEASURED` |
| Steal de CPU | **2,08% acumulado** | Monitorar; agir se >10% |
| OOM | **0** (4 fontes) | Manter 0 |
| Disco Docker | 8,8 GB reais (19,79 GB lógico) | Política de retenção |
| `MemAvailable` | 13,50 GiB | Manter folga |

**Ressalva metodológica exigida pelo escopo:** limites somados menores **não provam** redução de consumo — `mem_limit` é teto, não reserva. Imagens menores **não equivalem** a disco físico recuperado — camadas compartilhadas contam uma vez (medido: 19,79 GB lógico vs 8,8 GB reais). Todo "benefício esperado" é **hipótese até medição**.

---

## 8. Conclusão do gate

**O plano NÃO está completo.** Oito lacunas (G-01..G-08), sendo **G-02 estrutural**: sem o app em execução, nenhum limite é dimensionável com responsabilidade.

**O que é executável agora:** Fases 0–3 (24 tarefas), que tratam perda de dados, exposição, confiabilidade de deploy e desperdício comprovado — nenhuma dependendo de medição inexistente.

**O que está bloqueado:** Fase 4 inteira (dimensionamento) e partes da Fase 5, até haver baseline.

**Ordem recomendada:** T-01 (seed) e T-02 (socket) primeiro — são os dois que combinam maior severidade com menor risco de implementação. T-08 (backup) antes de qualquer coisa que toque o schema.

Parei aqui, conforme instruído.
