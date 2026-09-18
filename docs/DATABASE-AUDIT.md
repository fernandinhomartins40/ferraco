# DATABASE-AUDIT — Ferraco CRM

**Data:** 2026-09-17 · **Etapa:** AUDITORIA (somente análise) · **Host:** `72.60.10.108`
**Base:** [VPS-OPT-INVENTORY.md](VPS-OPT-INVENTORY.md) · [CONTAINER-AUDIT.md](CONTAINER-AUDIT.md) · [RUNTIME-RESOURCE-AUDIT.md](RUNTIME-RESOURCE-AUDIT.md) · [DOCKER-IMAGE-AUDIT.md](DOCKER-IMAGE-AUDIT.md)

**Cobertura:** `AUDITED` (analisado, **não corrigido**) · `PENDING` · `BLOCKED` · `NOT APPLICABLE`
**Métricas:** `NOT MEASURED` onde não há medição. Nenhum valor estimado.

> **Nada foi alterado.** Sem DROP, TRUNCATE, migração de esquema, criação de índice ou consulta pesada. As leituras em bancos vizinhos foram exclusivamente `pg_settings` (catálogo, custo desprezível) e `docker inspect` — nenhuma tabela de negócio foi acessada e nenhum dado pessoal foi lido ou registrado.
>
> **Limitação determinante:** o banco do Ferraco **não existe** — `docker volume ls` sem `ferraco-postgres-data`, container ausente ([VPS-OPT-BASELINE.md §B3](VPS-OPT-BASELINE.md)). Tamanho, estatísticas, planos de execução, índices não utilizados, bloat, locks e consultas lentas reais são **`BLOCKED`**. Esta auditoria analisa o schema declarado, os padrões de consulta no código e os parâmetros que o serviço **passaria** a ter.

---

## Sumário de achados

| ID | Achado | Severidade | Recurso |
|---|---|---|---|
| **F-42** | Postgres sem tuning algum — **as 4 aplicações vizinhas tunam; o Ferraco não** | **ALTA** | RAM, CPU |
| **F-43** | `max_connections=100` (default) vs até ~108 conexões demandadas (F-01) | **CRÍTICA** | conexões |
| F-44 | 77 de 88 `findMany` **sem paginação** | **ALTA** | RAM, I/O, latência |
| F-45 | N+1 no Kanban: N `count()` disparados em paralelo no mesmo pool | ALTA | conexões, CPU |
| F-46 | N+1 em loop sequencial no envio de mídia WhatsApp | MÉDIA | latência |
| F-47 | 166 índices para 63 modelos, sem verificação de uso | MÉDIA | disco, I/O de escrita |
| F-48 | Zero backup — confirmado no host, não só ausente no repositório | **CRÍTICA** | recuperação |
| F-49 | `connection_limit` não declarado na URL; pool implícito | ALTA | conexões |
| F-50 | Scheduler consulta o banco a cada 30 s indefinidamente | MÉDIA | I/O, CPU |
| F-51 | Migration consolidada de 2.173 linhas sem rollback (`down`) | MÉDIA | recuperação |
| F-52 | Sem `statement_timeout` / `idle_in_transaction_session_timeout` | MÉDIA | locks, conexões |
| F-53 | Superusuário do banco usado pela aplicação | MÉDIA | segurança |
| F-54 | `effective_io_concurrency=1` — inadequado para SSD | BAIXA | I/O |

---

## Parte I — Parâmetros do PostgreSQL

### M-11 · Defaults da imagem `postgres:16-alpine` — medidos

`docker run --rm -e POSTGRES_PASSWORD=x postgres:16-alpine` · 2026-09-17 (container efêmero, descartado)

```
selecting default max_connections ... 100
selecting default shared_buffers ... 128MB
```

**É exatamente o que o Ferraco receberia**, já que [docker-compose.vps.yml](../docker-compose.vps.yml) não passa nenhum parâmetro ao serviço `postgres`.

### M-12 · O que as aplicações vizinhas fazem — medido

`docker inspect <container> -f '{{join .Config.Cmd " "}}'` · 2026-09-17

| Container | Parâmetros efetivos |
|---|---|
| **m2centerauto-postgres-1** | `shared_buffers=192MB` `effective_cache_size=512MB` `work_mem=8MB` `maintenance_work_mem=64MB` `max_connections=50` `autovacuum_max_workers=1` `max_worker_processes=2` `max_parallel_workers=1` `max_parallel_workers_per_gather=0` |
| **digiurban-postgres** | `shared_buffers=128MB` `effective_cache_size=256MB` `work_mem=4MB` `maintenance_work_mem=32MB` `max_connections=50` |
| **ultrazend-postgres** | `shared_buffers=64MB` `effective_cache_size=192MB` `work_mem=4MB` `max_connections=50` |
| **aprenderia-postgres** | `shared_buffers=128MB` `effective_cache_size=384MB` `work_mem=4MB` `max_connections=30` |

Confirmado via `pg_settings` em `m2centerauto-postgres-1` (`source = command line` em todos): o tuning é **efetivo**, não apenas declarado.

### F-42 · O Ferraco é o único sem tuning

| Campo | Conteúdo |
|---|---|
| **Evidência** | [docker-compose.vps.yml L2-L20](../docker-compose.vps.yml) — serviço `postgres` sem `command:`. M-11 (defaults) vs M-12 (4 vizinhas tunadas) |
| **Ambiente** | produção (declarado); serviço ausente |
| **Achado** | Todas as 4 aplicações vizinhas reduzem `max_connections` para 30–50 e ajustam memória; o Ferraco herdaria `max_connections=100`, `shared_buffers=128MB`, `work_mem=4MB` (default do Postgres 16) |
| **Impacto** | `max_connections=100` com **9 processos backend por conexão potencial** e `work_mem` alocável **por operação**, não por conexão. É o mesmo padrão já identificado nas etapas anteriores: o Ferraco é o único serviço do host sem contenção declarada |
| **Proposta** | Declarar parâmetros via `command:`, seguindo o padrão das vizinhas. **Não derivo por porcentagem fixa** — ver método em §Parte II |
| **Risco** | `shared_buffers` alto demais com `mem_limit` baixo causa falha de inicialização; `max_connections` baixo demais causa recusa de conexão sob carga — **e F-01 torna isso provável se não for corrigido antes** |
| **Dependências** | **F-01 precede**: o número de pools determina `max_connections`. F-02 (`mem_limit`) precede `shared_buffers` |
| **Teste de aceite** | Postgres inicia; `pg_isready` OK; aplicação conecta; `pg_stat_activity` abaixo do teto sob uso normal |
| **Rollback** | Remover `command:`; volta aos defaults sem tocar em dados |
| **Métrica esperada** | `NOT MEASURED` |
| **Status** | `AUDITED` |

### F-43 · `max_connections` insuficiente para a demanda do próprio código

| Campo | Conteúdo |
|---|---|
| **Evidência** | M-11: `max_connections=100`. [CONTAINER-AUDIT.md F-01](CONTAINER-AUDIT.md): 12 `PrismaClient` de runtime. [RUNTIME-RESOURCE-AUDIT.md M-02](RUNTIME-RESOURCE-AUDIT.md): Node vê 4 CPUs sob qualquer cota → pool default `num_cpus*2+1` = **9 por cliente** |
| **Achado** | Demanda potencial: 12 × 9 = **~108 conexões**, contra teto de **100**. Somam-se: conexões do `migrate deploy` no boot, do seed, do `psql` do `startup.sh` e de administração. **A aplicação pode esgotar o banco sozinha** |
| **Impacto** | `FATAL: sorry, too many clients already`. Não é degradação gradual — é indisponibilidade. Cada backend do Postgres também consome memória própria, então 100 conexões ativas pressionam o `mem_limit` do container do banco |
| **Proposta** | Ordem obrigatória: (1) unificar no singleton (F-01); (2) fixar `connection_limit` explícito na URL (F-49); (3) só então dimensionar `max_connections` com folga para administração e migrations |
| **Risco** | Ajustar `max_connections` **sem** corrigir F-01 apenas desloca o ponto de falha |
| **Dependências** | **Bloqueado por F-01 e F-49** |
| **Teste de aceite** | Sob uso normal, `SELECT count(*) FROM pg_stat_activity WHERE datname='ferraco_crm'` permanece bem abaixo do teto; nenhum erro `too many clients` em 72 h |
| **Rollback** | Restaurar parâmetro anterior |
| **Métrica esperada** | Redução esperada de ~108 para ~9–20 conexões. **Valor real `NOT MEASURED`** |
| **Status** | `AUDITED` |

### F-49 · Pool implícito na URL de conexão

**Evidência:** `grep "connection_limit\|pool_timeout\|connect_timeout" docker-compose.vps.yml .env.example` → **zero ocorrências**. A URL é `postgresql://ferraco:***@postgres:5432/ferraco_crm`, sem parâmetros.

Sem `connection_limit`, o Prisma aplica `num_cpus*2+1`. Como M-02 provou que `os.cpus()` ignora a cota de CPU, **o pool não diminui ao reduzir `cpus`** — o único controle é explícito na URL.

Também ausentes: `pool_timeout` (espera na fila do pool) e `connect_timeout`. Com os defaults, uma saturação de pool gera espera antes de erro, aparecendo como latência e não como falha — difícil de diagnosticar.

**Proposta:** declarar `?connection_limit=N&pool_timeout=M` após resolver F-01. **Teste de aceite:** sob concorrência, fila do pool não excede o timeout; conexões estáveis. **Status:** `AUDITED`

### F-52 · Timeouts de sessão ausentes

Não há `statement_timeout` nem `idle_in_transaction_session_timeout` (nem no compose, nem na URL, nem no código). Consequências: uma consulta patológica — por exemplo, um `findMany` sem paginação sobre tabela grande (F-44) — pode rodar indefinidamente ocupando conexão; uma transação aberta e esquecida (`$transaction` em 3 pontos) bloqueia `VACUUM` e retém locks indefinidamente.

**Proposta:** definir ambos com valores compatíveis com as operações mais longas (exportação de relatório é a candidata). **Risco:** timeout curto demais aborta exportações legítimas — F-22 mostra que elas não são streaming e podem demorar. **Dependência:** medir a duração real das exportações antes de fixar o valor. **Status:** `AUDITED`

### Parâmetros do planner — observação técnica

Conforme o escopo pede: `effective_cache_size` **não reserva memória** — é estimativa que o planner usa para decidir entre index scan e seq scan. Um valor artificialmente baixo induz a escolha errada mesmo com cache de SO abundante. As vizinhas declaram 192–512 MB.

`work_mem` é **por operação de ordenação/hash**, não por conexão: uma consulta com múltiplos sorts pode alocar vários múltiplos de `work_mem`. Por isso as vizinhas o mantêm conservador (4–8 MB) enquanto elevam `shared_buffers`.

**F-54:** `effective_io_concurrency=1` (default, medido) é o valor adequado a disco rotacional. O host usa SSD (`/dev/sda1`, 194 GB, latência de I/O PSI ~0). Impacto pequeno mas real em leituras de bitmap heap scan. **Status:** `AUDITED`

---

## Parte II — Método para dimensionar (sem inventar números)

O escopo veda derivar parâmetros por porcentagem fixa. **Não proponho valores.** Registro o que precisa ser conhecido:

| Parâmetro | Do que depende | Estado |
|---|---|---|
| `max_connections` | Pools reais após F-01 + migrations + administração | `BLOCKED` — depende de F-01 |
| `shared_buffers` | `mem_limit` do container (F-02), que depende de baseline | `BLOCKED` |
| `work_mem` | Concorrência real × nº de operações de sort por consulta | `BLOCKED` — sem medição |
| `effective_cache_size` | RAM disponível ao page cache do SO, não reserva | `BLOCKED` — depende de F-02 |
| `maintenance_work_mem` | Tamanho das maiores tabelas (VACUUM/CREATE INDEX) | `BLOCKED` — banco vazio |

**Referência útil e legítima:** as 4 vizinhas rodam estáveis, sem OOM ([RUNTIME-RESOURCE-AUDIT.md M-04](RUNTIME-RESOURCE-AUDIT.md)) e consumindo 62–124 MiB com `shared_buffers` de 64–192 MB. Isso indica a **ordem de grandeza** adequada a este host — não um valor a copiar, já que a carga do Ferraco é desconhecida.

---

## Parte III — Schema e índices

### M-13 · Inventário do schema

`grep` em [apps/backend/prisma/schema.prisma](../apps/backend/prisma/schema.prisma) · 2026-09-17

| Item | Quantidade |
|---|---|
| Modelos | **63** |
| `@@index` | **166** |
| `@unique` / `@@unique` | 22 |
| Relações (`@relation`) | 79 |
| Migrations | 4 |

**Divergência documental:** o cabeçalho do próprio schema diz *"Database: SQLite (Development) · Total Tables: 45 · Total Enums: 21"* enquanto o `datasource` declara `postgresql` e há 63 modelos. Comentário desatualizado — mesma divergência já registrada no CLAUDE.md.

### F-47 · 166 índices declarados, nenhum verificado quanto a uso

| Campo | Conteúdo |
|---|---|
| **Evidência** | 166 `@@index` no schema; 2,6 índices por modelo em média. Exemplos em `Lead`: `email`, `phone`, `status`, `assignedToId`, `createdById`, `createdAt`, `priority`, `leadScore`, `captureCount`, `lastCapturedAt`, `whatsappOptIn`, `needsVerification` — **12 índices numa só tabela** |
| **Achado** | Índices em colunas de **baixa cardinalidade** (`isActive`, `whatsappOptIn`, `needsVerification` — booleanos) raramente são escolhidos pelo planner: em colunas booleanas, seq scan costuma vencer. Não há índices compostos correspondendo a filtros combinados (ex.: `status` + `assignedToId`), que é o padrão real de um CRM |
| **Impacto** | Cada índice: (a) ocupa disco; (b) **é atualizado a cada INSERT/UPDATE/DELETE** — 12 índices em `Lead` significam 12 escritas extras por lead criado; (c) aumenta trabalho do autovacuum. Em tabela de escrita intensa — que é o caso de `Lead` num CRM com captura automática — o custo é contínuo |
| **Proposta** | Após o sistema acumular uso real, consultar `pg_stat_user_indexes` (`idx_scan = 0` indica índice nunca usado) e `pg_stat_statements` para identificar os filtros reais; então remover os inúteis e criar compostos onde couber |
| **Risco** | **Remover índice sem dados de uso é perigoso** — pode ser o índice de uma consulta rara porém crítica. Por isso a proposta é diagnóstica, não corretiva. Índice parcial (`WHERE isActive = true`) é alternativa melhor que remoção para booleanos |
| **Dependências** | Exige banco em produção com uso acumulado; considerar habilitar `pg_stat_statements` |
| **Teste de aceite** | Após ajuste, consultas do CRM mantêm ou melhoram o plano (`EXPLAIN ANALYZE` antes/depois em ambiente de teste com dados representativos) |
| **Rollback** | `CREATE INDEX CONCURRENTLY` recria sem bloquear; guardar o DDL original |
| **Métrica esperada** | `NOT MEASURED` — sem dados de uso |
| **Status** | `AUDITED` |

**Nota:** o Prisma cria índice automaticamente para `@unique`, mas **não** para chaves estrangeiras no Postgres. Com 79 relações, convém confirmar que os FKs usados em JOIN têm índice. Vários `@@index([userId])`, `@@index([leadId])` e `@@index([teamId])` sugerem que isso foi feito deliberadamente — **evidência a favor da qualidade do schema**, não contra.

### F-51 · Migration consolidada sem rollback

**Evidência:** `20251127180000_consolidated_schema/migration.sql` = **2.173 linhas**; as outras 3 somam 116 linhas.

Migrations do Prisma não têm `down` — o rollback de esquema é manual. Uma consolidada de 2.173 linhas aplicada num banco vazio é aceitável (é o caso atual), mas **não é reversível** se falhar no meio: o Postgres executa DDL em transação, então falha causa rollback completo, deixando o banco vazio e o container em laço de restart.

Agrava: o `startup.sh` tem fallback para `prisma db push --skip-generate` quando `migrate deploy` falha. `db push` **sincroniza o schema ignorando o histórico de migrations**, podendo divergir permanentemente do controle de versão — e em certos casos remove colunas para "ajustar" ao schema.

**Proposta:** remover o fallback `db push` do caminho de produção; falha de migration deve **parar** o deploy, não improvisar. **Risco de manter:** divergência silenciosa de schema e perda potencial de coluna. **Teste de aceite:** falha simulada de migration aborta o boot com erro claro. **Status:** `AUDITED`

---

## Parte IV — Padrões de consulta no código

### M-14 · Quantificação

`grep -rn` em `apps/backend/src` · 2026-09-17

| Padrão | Ocorrências |
|---|---|
| `findMany` | **88** |
| `findMany` com `take:` nas 6 linhas seguintes | **11** |
| **`findMany` sem paginação** | **77 (87,5%)** |
| `include:` | 79 |
| `select:` | 86 |
| `$transaction` | 3 |

### F-44 · 77 consultas sem paginação

| Campo | Conteúdo |
|---|---|
| **Evidência** | M-14. Concentração por arquivo: `reports.service.ts` (8), `tags.service.ts` (7), `pipeline.service.ts` (6), `leads.service.ts` (6), `communications.service.ts` (4), `automations.service.ts` (4) |
| **Ambiente** | produção |
| **Achado** | A maioria das leituras traz **o resultado inteiro**. Em tabelas pequenas e estáveis (`tags`, `kanbanColumn`, `pipeline`) isso é aceitável e até preferível. O risco está nas que crescem sem limite: `Lead`, `Communication`, `AuditLog`, `WhatsAppMessage` |
| **Impacto** | Consumo de memória **proporcional ao volume de dados**, não à configuração — exatamente o padrão de [RUNTIME-RESOURCE-AUDIT.md F-22](RUNTIME-RESOURCE-AUDIT.md). Hoje inofensivo (banco vazio); degrada continuamente com o uso. Combinado a `include:` (79 ocorrências), materializa também as relações |
| **Proposta** | Classificar as 77 por tabela-alvo: tabelas de configuração podem permanecer; tabelas de crescimento contínuo exigem paginação por cursor. Priorizar as que atendem rotas HTTP |
| **Risco** | Paginar altera contrato de API — quebra o frontend e **consumidores externos** ([CONTAINER-AUDIT.md §4](CONTAINER-AUDIT.md): webhooks, api-keys, módulo `external`). Não é mudança puramente interna |
| **Dependências** | Requer inventário de consumidores por endpoint |
| **Teste de aceite** | Com volume representativo, as rotas respondem em tempo estável e memória constante, independentemente do total de registros |
| **Rollback** | Reverter por endpoint |
| **Métrica esperada** | `NOT MEASURED` |
| **Status** | `AUDITED` |

**Sobre seleção de campos:** 86 `select:` contra 79 `include:` é proporção **saudável** — o código já usa projeção seletiva em boa parte dos casos. Registro como evidência positiva; a oportunidade está nos pontos que combinam `include` aninhado sem `select`.

### F-45 · N+1 no endpoint de estatísticas do Kanban

| Campo | Conteúdo |
|---|---|
| **Evidência** | [kanbanColumn.controller.ts:159-181](../apps/backend/src/controllers/kanbanColumn.controller.ts#L159) — `findMany` das colunas, depois `columns.map(async ...)` com `prisma.lead.count()` por coluna, resolvido via `Promise.all` |
| **Achado** | **1 + N consultas.** Com N colunas de Kanban, são N `COUNT` disparados **simultaneamente** |
| **Impacto** | O escopo alerta que paralelizar aumenta pressão no pool — este é o caso exato. `Promise.all` emite N consultas de uma vez contra o mesmo pool; se N ≥ tamanho do pool, as excedentes **enfileiram**, e a latência do endpoint vira a soma das ondas. Cada `COUNT` sem índice adequado em `status` é um scan |
| **Proposta** | Substituir por **um** `groupBy` com `_count` por `status`, resolvendo em uma consulta. Ganho de N-1 idas ao banco |
| **Risco** | Baixo — `groupBy` não retorna colunas com contagem zero; é preciso reconciliar com a lista de colunas em memória |
| **Dependências** | Nenhuma |
| **Teste de aceite** | Resposta idêntica à atual, incluindo colunas com zero leads; uma única consulta no log |
| **Rollback** | Reverter o método |
| **Métrica esperada** | De N+1 para 2 consultas. **Latência real `NOT MEASURED`** |
| **Status** | `AUDITED` |

### F-46 · N+1 sequencial no envio de mídia

**Evidência:** [whatsappAutomation.service.ts:1446-1447](../apps/backend/src/services/whatsappAutomation.service.ts#L1446) — `for (const mediaUrl of mediaUrls) { await prisma.whatsAppAutomationMessage.create(...) }`

Inserções **sequenciais**, uma ida ao banco por mídia. Menos grave que F-45 (não satura o pool), mas a latência acumula linearmente.

**Proposta:** `createMany` numa chamada. **Risco:** `createMany` não retorna os registros criados — verificar se o código subsequente depende dos IDs. **Status:** `AUDITED`

### F-50 · Polling do scheduler

Já registrado como J-01/F-11. Sob a ótica do banco: `automationScheduler` consulta a cada 30 s, **2.880 consultas/dia** mesmo sem automações pendentes. Cada ciclo ocupa conexão do pool. Em repouso, é a principal fonte de I/O do banco.

**Proposta:** intervalo adaptativo ou disparo por evento. **Risco:** atraso na execução de automações — impacto de produto. **Dependência:** medir custo por ciclo antes de decidir. **Status:** `AUDITED`

### Transações e locks

3 usos de `$transaction` ([automationKanban.controller.ts:181](../apps/backend/src/controllers/automationKanban.controller.ts#L181), [kanbanColumn.controller.ts:134](../apps/backend/src/controllers/kanbanColumn.controller.ts#L134), [pipeline.service.ts:162](../apps/backend/src/modules/pipeline/pipeline.service.ts#L162)) — todos em reordenação de colunas, uso apropriado.

**Risco não mitigado:** sem `idle_in_transaction_session_timeout` (F-52), uma transação que trave mantém locks indefinidamente. **Locks e contenção reais: `BLOCKED`** — exigiria `pg_locks` num banco em uso.

---

## Parte V — Backup e recuperação

### F-48 · Zero backup — confirmado no host

| Campo | Conteúdo |
|---|---|
| **Evidência** | `crontab -l` → **vazio**. `systemctl list-timers` → apenas `dpkg-db-backup.timer` e `apt-daily-upgrade.timer` (do SO, não de banco). `/var/backups` contém só `dpkg.*` e `apt.*`. `/root/backups` e `/backup` **não existem**. Nenhum `pg_dump` em compose, workflow ou scripts |
| **Ambiente** | host inteiro |
| **Achado** | **Não há backup de banco de dados algum nesta VPS** — nem do Ferraco, nem das 4 aplicações vizinhas. Isto amplia o achado: não é lacuna do Ferraco, é lacuna do host |
| **Impacto** | Perda total e irrecuperável em caso de falha de disco, erro humano ou — relevante aqui — **execução acidental do seed destrutivo** ([DOCKER-IMAGE-AUDIT.md F-28](DOCKER-IMAGE-AUDIT.md)). F-28 + F-48 combinados significam: um `psql` indisponível no boot apaga 14 tabelas **sem possibilidade de recuperação** |
| **Proposta** | `pg_dump` agendado com retenção definida e **cópia fora da VPS**; agendar fora do pico (03:00, junto a J-06) |
| **Risco** | Job de backup consome I/O e CPU; `pg_dump` mantém conexão e snapshot aberto durante a execução — em base grande, adiar autovacuum |
| **Dependências** | Requer definir RPO/RTO com o negócio. **Não posso definir por você** |
| **Teste de aceite** | **Restore validado**: restaurar o dump em banco descartável e confirmar integridade e contagem de linhas. Backup não testado não é backup |
| **Rollback** | Desativar o agendamento |
| **Métrica esperada** | `NOT MEASURED` |
| **Status** | `AUDITED` |

**Requisitos de recuperação — `PENDING`:** RPO (perda tolerável) e RTO (tempo tolerável) não estão definidos em nenhum documento do repositório. Sem eles não há como dimensionar frequência nem estratégia (dump lógico vs PITR com WAL). É decisão de negócio.

### F-53 · Superusuário para a aplicação

O compose define `POSTGRES_USER: ferraco`, que é o superusuário criado pela imagem, e a mesma credencial é usada pela aplicação. Sem separação de privilégios: uma injeção ou credencial vazada dá controle total, incluindo `DROP DATABASE`.

**Proposta:** papel de aplicação com privilégios restritos a DML e ao schema necessário; reservar o superusuário para migrations e administração. **Risco:** `migrate deploy` precisa de DDL — exige papel próprio ou concessão pontual. **Status:** `AUDITED`

---

## Parte VI — Manutenção, I/O e tamanho

| Item | Estado | Status |
|---|---|---|
| `autovacuum` | `on` (default, medido) — adequado | `AUDITED` |
| `autovacuum_max_workers` | Default 3. Vizinha m2centerauto reduziu para 1 — contenção de CPU | `AUDITED` |
| Bloat de tabelas/índices | Requer banco em uso | `BLOCKED` |
| Tamanho do banco | Banco não existe | `BLOCKED` |
| Tamanho por tabela/índice | Idem | `BLOCKED` |
| `pg_stat_statements` | Não habilitado (não está em `shared_preload_libraries`) | `AUDITED` — **habilitar é pré-requisito** para identificar consultas lentas |
| Consultas lentas reais | Sem banco e sem `pg_stat_statements` | `BLOCKED` |
| `log_min_duration_statement` | Não configurado | `AUDITED` — habilitar daria visibilidade imediata sem overhead relevante |
| Locks reais | Requer banco em uso | `BLOCKED` |
| I/O do banco | `docker stats` das vizinhas mostra BLOCK I/O relevante (digiurban-postgres 481 MB, aprenderia-postgres 207 MB acumulados) | `AUDITED` (vizinhas) / `BLOCKED` (Ferraco) |
| Réplicas | Nenhuma declarada ou observada | `NOT APPLICABLE` |
| Sharding / particionamento | Ausente; não justificado nesta escala | `NOT APPLICABLE` |
| Connection pooler externo (PgBouncer) | Ausente. **Não recomendo adicionar** — resolver F-01 elimina a necessidade nesta escala | `NOT APPLICABLE` |

---

## Parte VII — Sobre cache

O escopo adverte contra criar cache sem escopo de autorização, invalidação, consistência e limite de memória. **Não proponho novo cache.**

O cache existente (`statsCache`, `Map` com TTL 30 s — [statsCache.service.ts](../apps/backend/src/services/statsCache.service.ts)) merece registro por um risco específico:

**F-55 · `statsCache` sem escopo de autorização.** A chave é a string passada pelo chamador. Se alguma estatística for sensível a papel ou a usuário e a chave não incluir esse discriminador, um usuário pode receber dados computados no contexto de outro. **Não confirmei** se isso ocorre — exigiria rastrear cada chamador. **Status: `PENDING`.** Limite de memória também ausente: o `Map` não tem teto de entradas, só expiração por TTL — crescimento ilimitado se as chaves forem variadas.

---

## Matriz de cobertura — inventário → evidência → status

| Item do inventário | Evidência examinada | Cobertura |
|---|---|---|
| DB-01 SGBD produção | `postgres:16-alpine`; M-11 defaults medidos | `AUDITED` |
| DB-02 SGBD desenvolvimento | SQLite no compose de dev, **incompatível** com `provider = postgresql` | `AUDITED` |
| DB-03 Provider | `postgresql` no schema | `AUDITED` |
| DB-04 ORM | Prisma 5.22.0; engine medido ([DOCKER-IMAGE-AUDIT.md M-09](DOCKER-IMAGE-AUDIT.md)) | `AUDITED` |
| DB-05 Modelos | **63** (`grep -c "^model "`) | `AUDITED` |
| DB-06 Migrations | 4 dirs; consolidada de 2.173 linhas; F-51 | `AUDITED` |
| DB-07 Seed | Destrutivo ([DOCKER-IMAGE-AUDIT.md F-28](DOCKER-IMAGE-AUDIT.md)) | `AUDITED` |
| DB-08 Pool | F-49: `connection_limit` ausente; pool implícito 9/cliente | `AUDITED` |
| DB-09 Tuning | F-42: nenhum; M-12 mostra as 4 vizinhas tunadas | `AUDITED` |
| DB-10 Credenciais | Hardcoded no compose; superusuário (F-53) | `AUDITED` |
| DB-11 Backup | **F-48 — confirmado ausente no host inteiro** | `AUDITED` |
| Índices declarados | 166 `@@index`, 22 unique, 79 relações | `AUDITED` |
| Índices **utilizados** | Requer `pg_stat_user_indexes` em banco com uso | `BLOCKED` |
| Consultas lentas | Sem `pg_stat_statements`, sem banco | `BLOCKED` |
| N+1 | F-45 (Kanban, paralelo), F-46 (mídia, sequencial) | `AUDITED` |
| Paginação | M-14: 77/88 sem `take` | `AUDITED` |
| Seleção de campos | 86 `select` vs 79 `include` — proporção saudável | `AUDITED` |
| Conexões | F-43: ~108 demandadas vs teto 100 | `AUDITED` |
| Pools por instância/worker | Instância única; 6 timers no mesmo processo; 12 clientes | `AUDITED` |
| Transações | 3 `$transaction`, uso apropriado | `AUDITED` |
| Locks | Requer banco em uso | `BLOCKED` |
| I/O do banco | `docker stats` das vizinhas | `AUDITED` (vizinhas) / `BLOCKED` (Ferraco) |
| Manutenção / autovacuum | `autovacuum on` medido; workers no default | `AUDITED` |
| Tamanho do banco | Banco não existe | `BLOCKED` |
| Bloat | Idem | `BLOCKED` |
| `shared_buffers` | M-11 default 128MB; M-12 vizinhas 64–192MB | `AUDITED` |
| `work_mem` | Default 4MB; por operação, não por conexão | `AUDITED` |
| `max_connections` | M-11 = 100; F-43 | `AUDITED` |
| `effective_cache_size` | Estimativa do planner, não reserva; F-54 | `AUDITED` |
| Timeouts de sessão | F-52: ausentes | `AUDITED` |
| Backup/restore validado | Nenhum backup existe para validar | `BLOCKED` |
| RPO / RTO | Não definidos em nenhum documento | `PENDING` |
| Escopo de autorização do cache | F-55: não confirmado | `PENDING` |
| Réplicas | Inexistentes | `NOT APPLICABLE` |
| Particionamento / sharding | Inexistente; não justificado | `NOT APPLICABLE` |
| PgBouncer | Ausente; desnecessário após F-01 | `NOT APPLICABLE` |
| SQLite (dev) | Incompatível com o provider declarado | `NOT APPLICABLE` (produção) |

---

## Totais de cobertura

| Status | Total |
|---|---|
| **AUDITED** | **27** |
| **PENDING** | **2** |
| **BLOCKED** | **8** |
| **NOT APPLICABLE** | **4** |

**Achados novos:** F-42 a F-55 (14). **Medições novas:** M-11, M-12, M-13, M-14.

### Ordem de dependência

```
F-01 (unificar PrismaClient) ──> F-49 (connection_limit) ──> F-43 (max_connections)
F-02 (mem_limit)             ──> F-42 (shared_buffers)
F-48 (backup)                ──── independente, e PRÉ-REQUISITO de segurança para F-28
F-45 / F-46 (N+1)            ──── independentes, baixo risco
F-47 (índices)               ──── exige uso acumulado; diagnóstico antes de ação
```

### Por que a auditoria não está completa

Os 8 `BLOCKED` derivam de um único fato: **o banco não existe**. Sem ele não há estatísticas de índice, planos de execução, bloat, locks, tamanho nem consultas lentas — e nenhum desses valores foi estimado. Recomendo habilitar `pg_stat_statements` e `log_min_duration_statement` **no primeiro deploy**, para que a próxima auditoria tenha dados em vez de inferências.

Os 2 `PENDING` exigem decisão ou investigação: RPO/RTO é definição de negócio; o escopo de autorização do `statsCache` (F-55) exige rastrear cada chamador.

**Achado que atravessa a auditoria:** **F-48 combinado com F-28**. O seed apaga 14 tabelas se a checagem de `psql` falhar, e **não existe backup nenhum nesta VPS** para recuperar. Isoladamente, cada um é sério; juntos, são perda de dados irreversível. Recomendo tratar ambos antes do primeiro deploy com dados reais.
