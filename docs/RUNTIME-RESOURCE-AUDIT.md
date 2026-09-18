# RUNTIME-RESOURCE-AUDIT — Ferraco CRM

**Data:** 2026-09-17 · **Etapa:** AUDITORIA (somente análise) · **Host:** `72.60.10.108`
**Base:** [VPS-OPT-INVENTORY.md](VPS-OPT-INVENTORY.md) · [VPS-OPT-BASELINE.md](VPS-OPT-BASELINE.md) · [CONTAINER-AUDIT.md](CONTAINER-AUDIT.md)

**Cobertura:** `AUDITED` (analisado, **não corrigido**) · `PENDING` · `BLOCKED` · `NOT APPLICABLE`
**Métricas:** `NOT MEASURED` onde não há medição. Nenhum valor estimado ou inventado.

> **Nada foi alterado.** Sem prune, exclusão, DROP/TRUNCATE. As medições em containers efêmeros (`docker run --rm node:20-alpine`) consomem segundos de CPU e não tocam serviços em produção — é a única forma de determinar empiricamente o dimensionamento de heap.
>
> **Limitação estrutural:** o Ferraco **não está em execução**. RSS, heap, GC, picos e latência **do Ferraco** são `BLOCKED`. Esta auditoria mede (a) o comportamento do runtime Node 20 sob cgroups, empiricamente no host real; (b) o consumo efetivo das 17 aplicações vizinhas, que define o orçamento disponível; (c) as origens de consumo no código do Ferraco.

---

## Parte I — Como o runtime realmente dimensiona memória

Conforme instruído, **verifiquei antes de concluir**. Resultados de medição no host, não de documentação.

### M-01 · Node 20 é cgroup-aware para heap — CONFIRMADO

`docker run --rm [-m LIMITE] node:20-alpine node -e "v8.getHeapStatistics()"` · 2026-09-17 · Node **v20.20.2** · cgroup **v2** (`cgroup2fs`, `memory_recursiveprot`)

| `mem_limit` | `heap_size_limit` medido | Proporção |
|---|---|---|
| **sem limite** | **4.144 MB** | ~25,9% dos 15,6 GB do host |
| 2 GB | 1.048 MB | 51,2% |
| 1 GB | 524 MB | 51,2% |
| 512 MB | 259 MB | 50,6% |

**Conclusões:**

1. **Sem `mem_limit`, o heap do V8 é dimensionado pela RAM do host** — 4.144 MB. Isto corrige a formulação do inventário (RC-03), que dizia "~25% da RAM visível" sem confirmação: está certo em *ausência* de limite, e **errado** quando há limite.
2. **Com `mem_limit`, o V8 respeita o cgroup** e reserva ~51% para o heap antigo. Node 20 lê `memory.max` de cgroup v2 corretamente.
3. **Consequência prática:** declarar `mem_limit` **já resolve** o dimensionamento de heap. `--max-old-space-size` vira ajuste fino, não requisito.

**Status:** `AUDITED`

### M-02 · Node 20 NÃO é cgroup-aware para CPU — CONFIRMADO

Mesmo comando, com `--cpus 1`:

| Medição | Com `--cpus 1` |
|---|---|
| `os.cpus().length` | **4** (não 1) |
| `os.availableParallelism()` | **4** (não 1) |
| `UV_THREADPOOL_SIZE` | unset → default **4** |

**Achado (F-18):** o Node vê 4 CPUs independentemente da cota. Consequências em cadeia:

- **Prisma** dimensiona pool por `num_cpus*2+1` → **9 conexões por cliente**, mesmo com `--cpus 0.5`. Confirma o cálculo de F-01 ([CONTAINER-AUDIT.md](CONTAINER-AUDIT.md#6-achado-de-maior-impacto--f-01--20-instâncias-de-prismaclient)) e mostra que **reduzir `cpus` não reduz conexões**.
- **libuv threadpool** fica em 4 threads; cada uma pode executar trabalho nativo (Sharp, `fs`, `crypto`) em paralelo, **fora do heap V8**.
- Bibliotecas que auto-dimensionam por `os.cpus()` superprovisionam sob cota baixa.

**Proposta:** definir `UV_THREADPOOL_SIZE` explicitamente e configurar o pool do Prisma via `connection_limit` na URL, em vez de confiar no default. **Risco:** threadpool pequeno serializa I/O de arquivo e operações Sharp, aumentando latência de upload. **Teste de aceite:** upload concorrente mantém latência aceitável; `pg_stat_activity` estável. **Rollback:** remover as variáveis. **Métrica esperada:** `NOT MEASURED`.

**Status:** `AUDITED`

### M-03 · RSS ≠ heap — o que `mem_limit` precisa cobrir

`NODE_OPTIONS`/`--max-old-space-size` governa **apenas o heap antigo do V8**. O `mem_limit` do cgroup contabiliza o **RSS inteiro**. Componentes fora do heap identificados no código do Ferraco:

| Componente | Origem | Evidência | Contabiliza em |
|---|---|---|---|
| Heap V8 (old space) | objetos JS | — | heap |
| New space, code space, metadata do V8 | runtime | — | RSS, fora de `max-old-space-size` |
| **Chromium headless (processo filho)** | whatsapp-web.js | [whatsappWebJS.service.ts:112](../apps/backend/src/services/whatsappWebJS.service.ts#L112) | **RSS do cgroup, não do Node** |
| **Sharp (libvips nativo)** | `sharp@0.34.4` | [upload.controller.ts:216](../apps/backend/src/controllers/upload.controller.ts#L216) | memória nativa, fora do heap |
| **Buffers de upload** | `multer.memoryStorage()` | [leads.routes.ts:20](../apps/backend/src/modules/leads/leads.routes.ts#L20) | `Buffer` = memória externa |
| **ExcelJS / PDFKit** | geração de relatório | `reports.service.ts`, `leads.export.service.ts` | heap + externa |
| **Prisma query engine** | binário nativo por cliente | 20 instanciações | **memória nativa × nº de clientes** |
| libuv threadpool (4 threads) | I/O nativo | M-02 | stacks nativas |
| `bcrypt` nativo | hashing de senha | `bcrypt@5.1.1` | nativa, durante o hash |

**Implicação central:** um `mem_limit` calculado só a partir do heap **subestima o necessário**. O Chromium sozinho costuma exceder o heap inteiro do Node.

**Status:** `AUDITED`

---

## Parte II — Medições reais do host (aplicações vizinhas)

O Ferraco está fora do ar; as vizinhas fornecem o orçamento disponível e evidência de como limites se comportam nesta VPS.

### M-04 · Ausência de OOM — CONFIRMADO POR MÚLTIPLAS FONTES

| Fonte | Comando | Resultado |
|---|---|---|
| Contador global do kernel | `grep oom /proc/vmstat` | **`oom_kill 0`** |
| Eventos por cgroup | `memory.events` (smtp, digiurban-vps, ultrazend-api) | `oom 0 oom_kill 0` em todos |
| Estado do Docker | `docker inspect -f {{.State.OOMKilled}}` | `false` |
| dmesg / journal | grep por OOM | zero ocorrências |

**Nenhum OOM ocorreu desde o boot (2026-09-14).** Isto **enfraquece** a hipótese de exaustão de memória registrada no inventário §15 — para o período observável. O incidente que motivou a reinstalação é anterior e permanece `BLOCKED` (logs perdidos).

**Status:** `AUDITED`

### M-05 · Pressão do sistema (PSI) — folga confirmada

`cat /proc/pressure/{memory,cpu,io}` · 2026-09-17 14:4x UTC

| Recurso | some avg10 / avg60 / avg300 | full avg10 |
|---|---|---|
| **memory** | 0,00 / 0,00 / 0,00 | 0,00 |
| **cpu** | 0,12 / 0,33 / 0,22 | 0,00 |
| **io** | 0,01 / 0,09 / 0,02 | 0,01 |

Pressão de memória **zero** em todas as janelas. CPU e I/O desprezíveis. O host está **folgado em repouso**.

**Ressalva obrigatória:** PSI em repouso não descreve pico. Com o Ferraco ausente e as vizinhas ociosas, este é o piso, não o teto.

**Status:** `AUDITED`

### M-06 · Consumo efetivo por container (`memory.current`, cgroup v2)

| Container | current | max | Utilização | Folga |
|---|---|---|---|---|
| digiurban-vps | 321 MiB | 1024 MiB | 31% | 703 MiB |
| digiurban-postgres | 124 MiB | 512 MiB | 24% | 388 MiB |
| ultrazend-postgres | **122 MiB** | **256 MiB** | **48%** | 134 MiB |
| aprenderia-web | 107 MiB | 512 MiB | 21% | 405 MiB |
| ultrazend-api | 102 MiB | 512 MiB | 20% | 410 MiB |
| m2centerauto-alpr-1 | 102 MiB | 1024 MiB | 10% | 922 MiB |
| m2centerauto-postgres-1 | 98 MiB | 768 MiB | 13% | 670 MiB |
| ultrazend-messages | 69 MiB | 384 MiB | 18% | 315 MiB |
| ultrazend-smtp | 62 MiB | 384 MiB | 16% | 322 MiB |
| m2centerauto-backend-1 | 62 MiB | 1024 MiB | 6% | 962 MiB |
| aprenderia-postgres | 62 MiB | 512 MiB | 12% | 450 MiB |
| m2centerauto-plate-scraper-1 | 45 MiB | 1024 MiB | 4% | 979 MiB |
| ultrazend-face | 36 MiB | 384 MiB | 9% | 348 MiB |
| aprenderia-scheduler | 7 MiB | 32 MiB | 22% | 25 MiB |
| m2centerauto-frontend-1 | 6 MiB | 128 MiB | 5% | 122 MiB |
| aprenderia-nginx | 5 MiB | 128 MiB | 4% | 123 MiB |
| digiurban-redis | 4 MiB | 192 MiB | 2% | 188 MiB |
| **TOTAL** | **~1.334 MiB** | **~8.800 MiB** | **15%** | — |

**Swap por container: 0 MiB em todos** — nenhum está sendo empurrado para swap.

**Observação:** `memory.current` inclui page cache do cgroup, então tende a ser **maior** que o `MEM USAGE` do `docker stats` (que desconta parte do cache). Daí a divergência com o baseline (~1.150 MiB) — as duas medidas estão corretas, medem coisas diferentes.

**`memory.peak` não existe no kernel 5.15** deste host — só `memory.max`/`memory.current`. **Portanto o pico histórico por container é `BLOCKED`** por indisponibilidade da interface, não por falta de acesso. Isto é exatamente o dado que permitiria dimensionar limites com rigor.

**Status:** `AUDITED` (corrente) / `BLOCKED` (pico)

### M-07 · Throttling de CPU — achado que contraria a aparência de ociosidade

`cpu.stat` por cgroup. CPU instantânea era ~0% em quase todos.

| Container | `nr_throttled` | `throttled_usec` | `cpus` | CPU instantânea |
|---|---|---|---|---|
| **m2centerauto-plate-scraper-1** | **2.713** | 86,7 s | 1,0 | 0,00% |
| **aprenderia-nginx** | **1.592** | **102,9 s** | **0,25** | 0,00% |
| aprenderia-postgres | 1.435 | 78,0 s | 0,5 | 0,00% |
| m2centerauto-alpr-1 | 1.108 | 2,0 s | 1,0 | 0,19% |
| aprenderia-web | 1.007 | 27,6 s | 1,0 | 0,00% |
| ultrazend-messages | 567 | 10,3 s | 1,0 | 0,00% |
| digiurban-redis | 511 | 25,2 s | 0,5 | 0,43% |
| ultrazend-face | 465 | 2,9 s | 1,0 | 0,00% |
| ultrazend-smtp | 409 | 25,9 s | 0,5 | 0,00% |
| m2centerauto-frontend-1 | 265 | 12,7 s | 0,5 | 0,00% |
| digiurban-postgres | 164 | 12,1 s | 1,0 | 0,00% |
| digiurban-vps | 75 | 5,6 s | 2,0 | 0,02% |
| aprenderia-scheduler | 47 | 4,7 s | 0,05 | 0,00% |
| ultrazend-api | 32 | 2,8 s | 1,5 | 0,01% |
| ultrazend-postgres | 13 | 1,9 s | 1,0 | 0,09% |
| m2centerauto-postgres-1 | 3 | 0,2 s | 1,5 | 5,49% |
| m2centerauto-backend-1 | 7 | 0,08 s | 1,5 | 0,00% |

**Achado (F-19): throttling generalizado num host com load 0,09.** Todos os 17 containers foram throttled. `aprenderia-nginx` acumulou **102,9 s de CPU bloqueada** com `cpus: 0.25`.

**Interpretação:** o CFS quota do Docker opera em janelas de 100 ms. Um processo que precisa de uma rajada curta acima da cota é **suspenso até a próxima janela**, mesmo com 4 vCPU ociosos. Média baixa **não implica ausência de contenção** — mede-se latência, não utilização.

**Impacto:** latência adicional em picos curtos (chegada de requisição, handshake, consulta). Invisível em `docker stats`.

**Relevância direta para o Ferraco:** confirma que **`cpus` apertado prejudica latência sem economizar recurso algum** neste host, que tem CPU sobrando. Para o Ferraco — cujo start envolve Chromium, uma operação intensiva e em rajada — uma cota baixa causaria start lento e possivelmente timeout do healthcheck (`start_period: 60s`).

**Proposta:** preferir cotas de CPU generosas (ou nenhuma) e concentrar o controle na memória, que é o recurso com risco real de exaustão. **Risco de não agir:** latência sob pico. **Risco de agir:** um container pode monopolizar CPU — mitigado por `cpu_shares` (peso relativo) em vez de `cpus` (cota rígida). **Teste de aceite:** `nr_throttled` estabiliza; latência p95 melhora. **Métrica esperada:** `NOT MEASURED`.

**Status:** `AUDITED`

### M-08 · Reinícios

| Container | RestartCount | OOMKilled | ExitCode | Avaliação |
|---|---|---|---|---|
| **ultrazend-smtp** | **22** | **false** | **0** | Não é OOM. Saída limpa (0) repetida sugere o processo **encerrando sozinho** e sendo reerguido pela política `unless-stopped`. Aplicação vizinha — fora do escopo do Ferraco, mas registrado |
| Demais 16 | 0 | false | — | Estáveis |

**Status:** `AUDITED` (o diagnóstico do smtp é de outra aplicação; não investiguei além, para não gerar carga)

---

## Parte III — Origens de consumo no código do Ferraco

Análise estática. Comportamento efetivo: `BLOCKED` (app fora do ar).

### F-20 · Chromium headless — maior consumidor, com flags subotimizadas

**Evidência:** [whatsappWebJS.service.ts:112-122](../apps/backend/src/services/whatsappWebJS.service.ts#L112)

```
headless: true
args: --no-sandbox, --disable-setuid-sandbox, --disable-dev-shm-usage,
      --disable-accelerated-2d-canvas, --no-first-run, --no-zygote, --disable-gpu
```

| Aspecto | Avaliação |
|---|---|
| `--disable-dev-shm-usage` | **Correto.** Evita depender de `/dev/shm` (64 MB por padrão no Docker), causa clássica de crash |
| `--no-zygote` | Reduz processos, mas **desabilita o compartilhamento de memória via fork do zygote** — cada processo filho aloca o próprio conjunto. Combinado a `--no-sandbox`, é a configuração usual em container, com custo de RAM |
| `--disable-gpu`, `--disable-accelerated-2d-canvas` | Corretos para headless |
| **Ausentes** | `--single-process` (reduz drasticamente RSS, ao custo de estabilidade), `--js-flags=--max-old-space-size` (limita o heap **do Chromium**, independente do Node), `--disable-extensions`, `--disable-background-timer-throttling` |
| **Multiprocesso** | Chromium gera **processos filhos** (renderer, network, GPU). Todos contam no `mem_limit` do cgroup, **nenhum** é limitado por `NODE_OPTIONS` |

**Impacto:** o Chromium é a maior fonte de RSS do container e a mais variável — cresce com o volume de conversas e mídia da sessão WhatsApp. **É ele quem define o `mem_limit` necessário**, não o Node.

**Proposta:** medir o RSS do conjunto Chromium sob uso real antes de fixar limite; considerar `--js-flags` para conter o heap do próprio Chromium. **Risco:** `--single-process` reduz memória mas é instável para sessões longas — **não recomendo** para WhatsApp persistente. **Teste de aceite:** sessão sobrevive 72 h sem reconexão; QR não é solicitado novamente. **Rollback:** restaurar os args. **Métrica esperada:** `NOT MEASURED`.

**Status:** `AUDITED`

### F-21 · `multer.memoryStorage()` em importação de leads

**Evidência:** [leads.routes.ts:20-23](../apps/backend/src/modules/leads/leads.routes.ts#L20) — `memoryStorage()`, `fileSize: 10 MB`

O arquivo inteiro vai para um `Buffer` em **memória externa** (fora do heap V8, dentro do RSS). Agravado por [leads.export.service.ts:241](../apps/backend/src/modules/leads/leads.export.service.ts#L241):

```
parse(buffer.toString('utf-8'), { columns: true, ... })   // csv-parse/sync
```

Três cópias simultâneas do mesmo conteúdo: `Buffer` bruto → string UTF-8 (até 2× por conversão) → array de objetos. Um CSV de 10 MB pode ocupar **múltiplas dezenas de MB**. Sendo `parse` **síncrono**, bloqueia o event loop durante o processamento — afeta **todas** as requisições concorrentes.

**Contraste:** os outros dois pontos de upload usam `diskStorage` ([upload.controller.ts:20](../apps/backend/src/controllers/upload.controller.ts#L20), [whatsapp.routes.ts:44](../apps/backend/src/routes/whatsapp.routes.ts#L44)) — abordagem correta.

**Impacto:** N uploads concorrentes multiplicam o pico. Com `mem_limit` justo, é um caminho plausível para OOM.

**Proposta:** migrar para `diskStorage` + parsing por stream (`csv-parse` assíncrono). **Risco:** exige refatorar o fluxo de importação; comportamento de erro muda. **Dependências:** nenhuma. **Teste de aceite:** importar CSV no limite de tamanho sem degradar latência de outras rotas; memória externa estável. **Rollback:** reverter o código. **Métrica esperada:** `NOT MEASURED`.

**Status:** `AUDITED`

### F-22 · Geração de relatórios inteiramente em memória

**Evidência:** `workbook.xlsx.writeBuffer()` / `workbook.csv.writeBuffer()` em [leads.export.service.ts:77,137](../apps/backend/src/modules/leads/leads.export.service.ts#L77) e [reports.service.ts:230,257](../apps/backend/src/modules/reports/reports.service.ts#L230); `new PDFDocument()` em [reports.service.ts:266](../apps/backend/src/modules/reports/reports.service.ts#L266)

ExcelJS monta a planilha inteira em memória e **serializa para um Buffer** antes de enviar. Não há streaming (`WorkbookWriter`). O pico é proporcional ao volume exportado — e **não tem teto**: um relatório de todos os leads escala com a base.

**Impacto:** pico de memória dirigido por **dados**, não por configuração. Invisível em repouso; é exatamente o tipo de evento que derruba um container com limite justo.

**Proposta:** `ExcelJS.stream.xlsx.WorkbookWriter` com resposta em streaming; paginar consultas. **Risco:** muda a assinatura dos métodos e o contrato HTTP (de buffer para stream). **Teste de aceite:** exportar a maior base disponível sem pico proporcional. **Rollback:** reverter. **Métrica esperada:** `NOT MEASURED`.

**Status:** `AUDITED`

### F-23 · Sharp — memória nativa não contabilizada no heap

**Evidência:** [upload.controller.ts:216-222](../apps/backend/src/controllers/upload.controller.ts#L216) — `sharp(buffer).resize(...).jpeg({quality}).toFile(...)`

| Aspecto | Avaliação |
|---|---|
| Origem | `sharp(buffer)` — imagem já em memória |
| Alocação | **libvips, nativa**. Não aparece em `heap_size_limit` nem é contida por `--max-old-space-size` |
| Concorrência | `sharp.concurrency()` **não configurado** → libvips usa o número de CPUs **vistas** = 4 (M-02), mesmo sob `--cpus 0.5` |
| Cache | `sharp.cache()` não configurado → cache de operações padrão ativo, retém memória entre chamadas |
| Limite de entrada | 50 MB (multer) |

**Impacto:** uploads concorrentes de imagens grandes geram picos nativos simultâneos. É o componente que mais facilmente escapa de uma análise baseada só em heap.

**Proposta:** `sharp.concurrency(1..2)` e `sharp.cache({memory: N})` explícitos; avaliar `limitInputPixels`. **Risco:** concorrência 1 serializa o processamento e aumenta latência de upload. **Dependências:** relacionado a F-18 (threadpool). **Teste de aceite:** N uploads simultâneos sem crescimento descontrolado de RSS. **Rollback:** remover as chamadas. **Métrica esperada:** `NOT MEASURED`.

**Status:** `AUDITED`

### F-24 · Query engines nativos do Prisma — multiplicador de memória nativa

Complementa F-01 ([CONTAINER-AUDIT.md](CONTAINER-AUDIT.md)) pela ótica de memória: cada `PrismaClient` carrega **sua própria instância do query engine**, um binário nativo com memória própria fora do heap V8. **12 clientes de runtime ⇒ 12 engines.**

Com M-02 confirmado (Node vê 4 CPUs sob qualquer cota), o pool default permanece 9 por cliente **independentemente de `cpus`** — reduzir CPU **não** mitiga.

**Proposta:** unificar no singleton (F-01) e fixar `connection_limit` na URL do banco. **Métrica esperada:** `NOT MEASURED`.

**Status:** `AUDITED`

### F-25 · Encerramento incompleto — conexões e timers órfãos

**Evidência:** [server.ts:130-160](../apps/backend/src/server.ts#L130)

| Recurso | Encerrado no `shutdown()`? |
|---|---|
| Servidor HTTP | sim (`server.close`) |
| J-01 automationScheduler | sim |
| J-03 chatbotAutosave | sim |
| Cliente WhatsApp / Chromium | sim (`disconnect()`) |
| `prisma` singleton | sim (`disconnectDatabase()`) |
| **J-06 tokenCleanup (CronJob)** | **não** — `stop()` existe e não é chamado |
| **J-02 health check WhatsApp (30 s)** | **não** |
| **J-05 rate limiter (10 min)** | **não** — `setInterval` em escopo de módulo, sem referência exportada |
| **12 PrismaClients locais** | **não** — nunca recebem `$disconnect()` |

**Impacto:** no `SIGTERM`, até 12 pools permanecem abertos até o timeout do Postgres. Em restart rápido (deploy), conexões antigas e novas coexistem — pressão sobre `max_connections`, que está no default. O timeout de 10 s força `exit(1)` se algo travar, o que **mascara** o vazamento em vez de resolvê-lo.

Adicionalmente, `uncaughtException` e `unhandledRejection` chamam `process.exit(1)` **sem** passar pelo `shutdown()` — nesses caminhos, nada é encerrado graciosamente.

**Proposta:** registrar todos os recursos descartáveis e encerrá-los no shutdown; usar `unref()` em timers de manutenção. **Risco:** baixo. **Teste de aceite:** após `SIGTERM`, `pg_stat_activity` zera as conexões da aplicação dentro do período de graça. **Rollback:** reverter. **Métrica esperada:** `NOT MEASURED`.

**Status:** `AUDITED`

### F-26 · Workers residentes e concorrência

| ID | Worker | Residência | Concorrência | Avaliação |
|---|---|---|---|---|
| J-01 | automationScheduler | permanente, 30 s | guarda `isRunning` **por processo** | Consulta o banco 2.880×/dia. Sem lock distribuído: duas instâncias processariam em paralelo |
| J-02 | health check WhatsApp | permanente, 30 s | — | Justificado |
| J-03 | chatbotAutosave | permanente, configurável | `isRunning` | Legítimo |
| J-04 | limpeza statsCache | permanente, 60 s | — | Varre um `Map`; custo desprezível |
| J-05 | limpeza rate limiter | permanente, 10 min | — | Desprezível. **Não parável** (F-25) |
| J-06 | tokenCleanup | cron 03:00 | — | Modelo correto. **Não parado** no shutdown |

**Processos órfãos:** o risco concreto é o **Chromium**. Se o Node morrer sem `disconnect()` limpo — caminho `uncaughtException` → `exit(1)` — os processos do Chromium podem sobreviver. O [startup.sh](../docker/startup.sh) limpa `SingletonLock`/`SingletonSocket`/`SingletonCookie` no start, o que **é evidência de que esse problema já ocorreu**. Como PID 1 do container é o shell do startup, não há reaping adequado de zumbis (não há `--init` nem `tini`).

**Proposta:** adicionar `init: true` ao serviço no compose, para reaping correto de filhos. **Risco:** muito baixo. **Teste de aceite:** após restart, nenhum processo Chromium órfão; sem locks residuais. **Rollback:** remover a chave. **Métrica esperada:** `NOT MEASURED`.

**Status:** `AUDITED`

---

## Parte IV — Orçamento agregado do host

### Situação medida (2026-09-17, repouso)

| Item | Valor |
|---|---|
| RAM física | 15,6 GiB |
| Consumo real das 17 vizinhas (`memory.current`) | **~1.334 MiB** |
| Soma dos limites declarados das vizinhas | ~8.800 MiB |
| Swap em uso | ~0 |
| PSI memory (todas as janelas) | **0,00** |
| OOM desde o boot | **0** |

**Orçamento disponível para o Ferraco:**

- Por **consumo real**: 15,6 GiB − 1,3 GiB − reserva do SO ≈ **13 GiB**
- Por **limites declarados** (pior caso, se todas as vizinhas saturarem simultaneamente): 15,6 − 8,6 ≈ **7 GiB**

O segundo é o número prudente: presume que os limites vizinhos podem ser exercidos. Mesmo assim, **há folga ampla**.

### Sobre dimensionar o `mem_limit` do Ferraco

**Não proponho um número.** Conforme instruído, não aplico limite fixo nem múltiplo do consumo em repouso — e, no caso do Ferraco, **não existe consumo em repouso a multiplicar**: o app está fora do ar.

**O que determina o orçamento, em ordem de peso:**

1. **Chromium + filhos** (F-20) — maior e mais variável; cresce com a sessão WhatsApp
2. **Heap do Node** — ~51% do `mem_limit` que for definido (M-01), auto-ajustável
3. **Picos por dados** — exportação (F-22), importação CSV (F-21), Sharp (F-23): dirigidos por volume, **sem teto atual**
4. **12 query engines do Prisma** (F-24) — elimináveis por F-01
5. **Page cache do cgroup** — inflacionaria `memory.current`

**Método correto, que exige o app no ar:**

| Passo | O que fazer |
|---|---|
| 1 | Subir **sem `mem_limit`** ou com limite deliberadamente folgado |
| 2 | Observar `memory.current` em regime: sessão WhatsApp pareada e estável por 48–72 h |
| 3 | Exercitar os picos: exportação da maior base, importação no limite, uploads concorrentes |
| 4 | Registrar o **máximo observado** (amostragem periódica — `memory.peak` indisponível neste kernel, M-06) |
| 5 | Definir limite = pico observado + folga para variação de carga |
| 6 | Validar 72 h sem OOM e sem reinício |

**Para CPU:** M-07 mostra throttling generalizado com CPU ociosa. Recomendo **não** aplicar `cpus` restritivo — preferir `cpu_shares` (peso relativo), que só age sob contenção real e não introduz latência artificial.

**Status do orçamento do Ferraco:** `BLOCKED` — depende de medição que só existirá após o primeiro deploy.

---

## Parte V — Runtime vs build/deploy

Separação explícita, conforme solicitado.

### Runtime

Consumo permanente: Node + Chromium + nginx + 6 timers + Postgres. Regime contínuo com picos dirigidos por dados (F-21, F-22, F-23). **Medição: `BLOCKED`.**

### Build / deploy

**Evidência:** [deploy-vps.yml](../.github/workflows/deploy-vps.yml); duração 6m22s–20m01s (API do Actions, 15 runs)

| Fase | Consumo | Observação |
|---|---|---|
| `npm ci` | I/O intenso, RAM moderada | Instala **todas** as dependências dos 3 workspaces |
| `prisma generate` | CPU + RAM | Gera cliente TypeScript |
| `tsc` (backend) | **RAM alta** | Compilador TypeScript é notoriamente intensivo |
| `vite build` (frontend) | **RAM alta, CPU alta** | Rollup + minificação; pico do build |
| Instalação do Chromium (2 stages) | disco + rede | F-10: desnecessário no builder |

**F-27 · O build não tem limite algum.** `docker build` executa **fora** do cgroup dos serviços do compose — `mem_limit` no compose **não se aplica ao build**. Na VPS, o build compete diretamente com os 17 containers de produção por RAM, CPU e I/O.

**Este é o achado de maior relevância para a hipótese do incidente.** Runtime sem limite é preocupante; **build sem limite, concorrendo com produção, é a diferença entre o Ferraco e as 4 aplicações vizinhas**, que só fazem `pull` de imagem pronta.

**Proposta:** mover o build para o runner do GitHub Actions e publicar no GHCR (F-03). Elimina integralmente o pico de build da VPS. **Risco:** exige autenticação no registry; primeiro pull mais lento. **Dependências:** habilita rollback por tag (F-14). **Teste de aceite:** deploy conclui; VPS não registra pico durante o deploy; app responde `/health`. **Rollback:** restaurar o workflow. **Métrica esperada:** `NOT MEASURED` — nenhum build do Ferraco ocorreu neste boot.

**Status:** `AUDITED`

---

## Matriz de cobertura — inventário → evidência → status

| Item do inventário | Evidência examinada | Cobertura |
|---|---|---|
| C-01 `ferraco-postgres` (RAM/CPU) | compose sem limites; `memory.current` das 4 instâncias Postgres vizinhas (62–124 MiB) como referência | `AUDITED` (config) / `BLOCKED` (runtime) |
| C-02 `ferraco-crm-vps` (RAM/CPU) | compose; Dockerfile; M-01..M-03; F-20..F-26 | `AUDITED` (config) / `BLOCKED` (runtime) |
| C-03/C-04 (dev) | compose de dev; não executam em produção | `NOT APPLICABLE` — ambiente de dev, fora do escopo de recursos da VPS |
| P-01 nginx no container | `aprenderia-nginx` como proxy de referência: 5 MiB, mas **1.592 throttles** com `cpus 0.25` (M-07) | `AUDITED` |
| P-02 Node `dist/server.js` | M-01 (heap cgroup-aware), M-02 (CPU não), M-03 (RSS) | `AUDITED` |
| P-03 Chromium headless | F-20: args auditados; multiprocesso; sem `--js-flags` | `AUDITED` (config) / `BLOCKED` (RSS real) |
| P-04 `prisma migrate deploy` | job de init, curta duração | `AUDITED` |
| P-05 `prisma db seed` | condicional, curta duração | `AUDITED` |
| R-01..R-06 workers/timers | F-26: 6 timers; J-02/J-05/J-06 não parados | `AUDITED` |
| R-11 heap do Node | **M-01 — medido empiricamente** no host | `AUDITED` |
| RC-01 limites do Ferraco | ausentes; M-06/M-07 dos vizinhos como referência | `AUDITED` |
| RC-02 limites vizinhos | `memory.current`/`memory.max`/`cpu.stat` dos 17 | `AUDITED` |
| RC-03 heap | corrigido por M-01: cgroup-aware, ~51% do limite | `AUDITED` |
| RC-04 pool do Prisma | F-24 + M-02: 9 conexões/cliente, insensível a `cpus` | `AUDITED` |
| Sharp / mídia | F-23: libvips nativo, concorrência e cache não configurados | `AUDITED` |
| Buffers / upload | F-21: `memoryStorage` + parse síncrono | `AUDITED` |
| ExcelJS / PDFKit | F-22: `writeBuffer`, sem streaming | `AUDITED` |
| Threads / filhos | M-02 (threadpool 4); F-20 (filhos do Chromium); F-26 (sem `init`) | `AUDITED` |
| GC | `heap_size_limit` medido (M-01); comportamento do GC sob carga | `BLOCKED` — exige app em execução |
| OOM | `/proc/vmstat`, `memory.events`, `docker inspect`, dmesg — **4 fontes** | `AUDITED` |
| Reinícios | `RestartCount` dos 18; smtp=22, não-OOM | `AUDITED` |
| Throttling | `cpu.stat` dos 17 — **F-19** | `AUDITED` |
| Picos | `memory.peak` **não existe no kernel 5.15** | `BLOCKED` — interface indisponível |
| Latência por processo | sem APM; não gerei carga | `BLOCKED` |
| Concorrência sob carga | exigiria carga em produção — **vedado** | `BLOCKED` |
| Encerramento de conexões | F-25: 12 clientes sem `$disconnect` | `AUDITED` |
| Processos órfãos | F-26: limpeza de locks no startup como evidência histórica | `AUDITED` |
| Orçamento agregado | M-06: 1.334 MiB reais / 8.800 MiB declarados / 15,6 GiB | `AUDITED` |
| Build/deploy | F-27: build sem cgroup; 15 runs medidos | `AUDITED` |
| Consumo de build do Ferraco | nenhum build neste boot | `BLOCKED` |
| Redis / MinIO / filas | inexistentes ([CONTAINER-AUDIT.md §3](CONTAINER-AUDIT.md)) | `NOT APPLICABLE` |
| Provedor de IA (custo/latência) | provedor não identificado | `PENDING` |
| V-05 `ferraco-data` | consumidor ainda não identificado | `PENDING` |

---

## Totais de cobertura

| Status | Total | Observação |
|---|---|---|
| **AUDITED** | **26** | Inclui 8 medições empíricas novas (M-01..M-08) |
| **PENDING** | **2** | Provedor de IA; consumidor de `ferraco-data` |
| **BLOCKED** | **8** | Runtime do Ferraco (RSS, heap, GC, picos, latência, concorrência, orçamento, build) |
| **NOT APPLICABLE** | **4** | Redis, MinIO, filas, containers de dev |

**Achados novos:** F-18 a F-27 (10), somados aos 17 de [CONTAINER-AUDIT.md](CONTAINER-AUDIT.md).

### O que falta medir — e por quê

| Lacuna | Como obter |
|---|---|
| RSS do Chromium sob sessão real | Deploy + sessão pareada + amostragem por 48–72 h |
| Pico do container sob exportação/importação | Exercitar os fluxos com base representativa |
| Curva de GC do Node | `--trace-gc` ou métricas de heap sob carga |
| Latência p50/p95/p99 | APM ou log estruturado de tempo de resposta |
| Pico de build na VPS | Observar um deploy — **ou eliminá-lo** via GHCR (F-27) |
| Pico histórico por container | Indisponível: kernel 5.15 sem `memory.peak`. Alternativa: amostragem periódica contínua |

**A auditoria não está completa.** Os 8 `BLOCKED` derivam todos da mesma causa: **o Ferraco está fora do ar**. Nenhum orçamento de memória foi proposto, porque fazê-lo sem carga representativa seria exatamente o erro que a instrução veda.

**Correção a um documento anterior:** o inventário (§15) apresentou exaustão de memória como hipótese principal. M-04 (zero OOM em 4 fontes independentes) e M-05 (PSI zero) **não a sustentam para o período observável** — embora também não a refutem para o incidente original, cujos logs se perderam. O que a medição **sim** sustenta como diferença estrutural entre o Ferraco e as vizinhas estáveis é **F-27: o build sem limite algum na VPS, concorrendo com produção**.
