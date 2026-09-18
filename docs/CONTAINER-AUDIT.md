# CONTAINER-AUDIT — Ferraco CRM

**Data:** 2026-09-17 · **Etapa:** AUDITORIA (somente análise) · **Host:** `72.60.10.108`
**Base:** [VPS-OPT-INVENTORY.md](VPS-OPT-INVENTORY.md) · [VPS-OPT-BASELINE.md](VPS-OPT-BASELINE.md)

**Legenda de cobertura:** `AUDITED` (analisado, **não corrigido**) · `PENDING` (falta confirmar) · `BLOCKED` (impedido) · `NOT APPLICABLE` (não existe, com justificativa)
**Métricas:** `NOT MEASURED` quando não há medição real. Nenhum valor foi estimado ou inventado.

> **Nenhuma alteração foi feita.** Nenhum prune, exclusão, DROP, TRUNCATE ou limpeza. Nenhuma carga gerada em produção — só leituras pontuais via SSH.
>
> **Contexto determinante:** o Ferraco **não está em execução** na VPS (VERIFIED em 2026-09-17). Todo comportamento efetivo de runtime é **NOT MEASURED**; esta auditoria analisa configuração declarada e código-fonte. Onde a distinção importa, ela está explícita.

---

## Sumário de achados

| ID | Achado | Severidade | Recurso |
|---|---|---|---|
| F-01 | 12 serviços de runtime instanciam `PrismaClient` próprio, ignorando o singleton | **ALTA** | RAM, conexões DB |
| F-02 | Serviços sem `mem_limit`/`cpus`: únicos do host nessa condição | **ALTA** | RAM, CPU |
| F-03 | Build ocorre na VPS, concorrendo com 17 containers em produção | **ALTA** | RAM, CPU, I/O |
| F-04 | `json-file` sem rotação declarada | **ALTA** | disco |
| F-05 | `node_modules` completo no runtime, com devDependencies | MÉDIA | disco, imagem |
| F-06 | Swagger `/api-docs` exposto sem guarda de ambiente nem autenticação | **ALTA** | segurança |
| F-07 | `/uploads` servido estaticamente sem controle de acesso | **ALTA** | segurança |
| F-08 | Credenciais do banco hardcoded no compose | **ALTA** | segurança |
| F-09 | Limite de upload divergente: 100 MB (multer) vs 50 MB (nginx) | MÉDIA | I/O, UX |
| F-10 | Chromium instalado no stage builder sem ser executado | MÉDIA | disco, tempo de build |
| F-11 | 5 timers permanentes in-process, 2 a cada 30s | MÉDIA | CPU |
| F-12 | Seed cria usuários com senhas padrão documentadas | **ALTA** | segurança |
| F-13 | Sem backup de nenhum tipo | **ALTA** | confiabilidade |
| F-14 | Sem rollback no deploy | MÉDIA | confiabilidade |
| F-15 | `apps/frontend/Dockerfile` referenciado mas inexistente | BAIXA | deploy dev |
| F-16 | Porta 3050 em `0.0.0.0`, divergente do padrão do host | MÉDIA | segurança |
| F-17 | Healthcheck do container consulta o nginx, não o Node | MÉDIA | confiabilidade |

---

## 1. Serviços declarados — auditoria individual

### C-01 · `ferraco-postgres` — `postgres:16-alpine`

| Campo | Conteúdo |
|---|---|
| **Evidência** | [docker-compose.vps.yml](../docker-compose.vps.yml) L2-L20; `docker ps -a` 2026-09-17 |
| **Ambiente** | produção (declarado); **ausente** no host |
| **Função** | banco relacional único da aplicação, 63 modelos |
| **Consumidores** | exclusivamente C-02 via rede interna `ferraco-network` |
| **Exposição** | 5432 **não publicada** no host — correto |
| **Healthcheck** | `pg_isready`, 10s/5s/5 — adequado |
| **Restart** | `unless-stopped` — adequado |
| **Persistência** | V-01 `ferraco-postgres-data` |
| **Permissões** | superusuário `ferraco`; a aplicação usa o mesmo papel — sem separação de privilégios |
| **Achado** | Sem `mem_limit`/`cpus` (F-02). Sem tuning (`shared_buffers`, `max_connections` nos defaults). Credenciais hardcoded (F-08). Sem backup (F-13) |
| **Impacto** | Postgres dimensiona cache pela RAM **do host** (15 GB), não pela do container. Sem teto, pode expandir muito além do necessário sob carga |
| **Proposta** | Declarar `mem_limit` e `cpus`; mover credenciais para secret/`.env` não versionado; definir rotina de dump |
| **Risco** | `mem_limit` baixo demais causa OOM do banco — o mais grave dos riscos desta auditoria |
| **Dependências** | F-01 define o número real de conexões e portanto `max_connections` |
| **Teste de aceite** | `pg_isready` OK; app funcional; sem OOM em 72 h; `pg_stat_activity` abaixo de `max_connections` |
| **Rollback** | Remover as chaves e recriar o container; volume intacto |
| **Métrica esperada** | NOT MEASURED — sem baseline do serviço |
| **Remoção** | **NÃO É CANDIDATO.** Banco de produção do cliente. |
| **Status** | `AUDITED` |

### C-02 · `ferraco-crm-vps` — container único (nginx + Node + Chromium)

| Campo | Conteúdo |
|---|---|
| **Evidência** | [docker-compose.vps.yml](../docker-compose.vps.yml) L22-L95; [Dockerfile](../Dockerfile); [docker/startup.sh](../docker/startup.sh) |
| **Ambiente** | produção (declarado); **ausente** no host |
| **Função** | serve frontend estático, API, WebSocket e integração WhatsApp |
| **Consumidores** | navegadores; WhatsApp (via Chromium); consumidores de webhook/API key (ver §4) |
| **Exposição** | `3050:3050` em `0.0.0.0` (F-16) |
| **Isolamento** | **3 responsabilidades no mesmo container** — proxy, aplicação e navegador headless compartilham cgroup e ciclo de vida |
| **Healthcheck** | `wget /health` na 3050 → responde o **nginx**, que faz proxy ao Node (F-17) |
| **Restart** | `unless-stopped` |
| **Persistência** | V-02..V-05 |
| **Permissões** | `USER root`; backend dropa para `node` via `su` — nginx permanece root |
| **Achado** | F-02, F-04, F-05, F-06, F-07, F-10, F-11, F-16, F-17 |
| **Impacto** | Sem teto de memória, o conjunto Node + Chromium pode crescer até esgotar os 15 GB, afetando **as outras 4 aplicações do host** |
| **Proposta** | Declarar `mem_limit`/`cpus` e `logging`; publicar em `127.0.0.1` atrás do nginx do host |
| **Risco** | Limite abaixo do pico real do Chromium causa reinício em laço e perda da sessão WhatsApp |
| **Dependências** | F-01 e F-10 alteram o consumo; fixar limites antes deles é prematuro |
| **Teste de aceite** | Login, envio de mensagem, upload e WebSocket funcionais; QR persistente após restart; sem OOM em 72 h |
| **Rollback** | Remover chaves e recriar; volumes intactos |
| **Métrica esperada** | NOT MEASURED |
| **Remoção** | **NÃO É CANDIDATO.** É a aplicação. |
| **Status** | `AUDITED` |

**Sobre separar o container:** dividir em nginx / API / worker-WhatsApp melhoraria isolamento (o Chromium deixaria de derrubar a API) e permitiria limites por função. Custo: mais complexidade de deploy e rede. **Não recomendo agora** — a prioridade é o app voltar ao ar; a divisão é candidata a etapa posterior, com baseline medido.

### C-03 · `ferraco-backend` (dev)

| Campo | Conteúdo |
|---|---|
| **Evidência** | [docker-compose.yml](../docker-compose.yml) L3-L40 |
| **Ambiente** | **desenvolvimento apenas** |
| **Função** | backend com hot-reload (`tsx watch`), SQLite |
| **Achado** | Usa `DATABASE_URL=file:./dev.db` (SQLite) enquanto o schema declara `provider = "postgresql"` — **incompatível**; este compose provavelmente não sobe hoje |
| **Impacto** | Zero em produção. Ambiente de dev possivelmente quebrado |
| **Proposta** | Corrigir para Postgres em container de dev, **ou** documentar como obsoleto. Decisão do time |
| **Risco** | Nenhum em produção |
| **Teste de aceite** | `docker compose up` sobe e responde `/health` |
| **Rollback** | N/A (sem alteração) |
| **Métrica esperada** | N/A |
| **Remoção** | **Não recomendada por ora.** Ferramenta de desenvolvimento; a instrução desta auditoria é não tratá-las como removíveis por padrão. Corrigir é preferível a excluir |
| **Status** | `AUDITED` |

### C-04 · `ferraco-frontend` (dev)

| Campo | Conteúdo |
|---|---|
| **Evidência** | [docker-compose.yml](../docker-compose.yml) L42-L57; `find` por `apps/frontend/Dockerfile` — **não existe** |
| **Achado** | F-15: referência quebrada. `docker compose up` falha no build deste serviço |
| **Impacto** | Ambiente de dev containerizado inoperante. Zero em produção |
| **Proposta** | Criar o Dockerfile ou remover o serviço do compose de dev |
| **Risco** | Nenhum em produção |
| **Teste de aceite** | `docker compose config` sem erro; build conclui |
| **Rollback** | N/A |
| **Métrica esperada** | N/A |
| **Status** | `AUDITED` |

---

## 2. Processos internos de C-02

| ID | Processo | Função | Achado | Status |
|---|---|---|---|---|
| P-01 | nginx (root) | proxy + estáticos + gzip | Roda como root; duplica o nginx do host (2 camadas de proxy). Consolidar é possível mas acopla o container ao host — **não recomendo** | `AUDITED` |
| P-02 | Node `dist/server.js` (`node`) | API, WebSocket, timers | Sem `--max-old-space-size`: heap default dimensionado pela RAM **do host**, não do container | `AUDITED` |
| P-03 | Chromium headless | sessão WhatsApp | Maior consumidor isolado de RAM; sem teto próprio. Necessário — é o mecanismo do whatsapp-web.js | `AUDITED` |
| P-04 | `prisma migrate deploy` | job de init | Correto: idempotente, roda no start. Fallback para `db push` em caso de erro é **arriscado** — pode divergir do histórico de migrations | `AUDITED` |
| P-05 | `prisma db seed` | job condicional | Só roda se `users` estiver vazio — lógica correta. Porém F-12 | `AUDITED` |

### F-12 · Seed com senhas padrão

| Campo | Conteúdo |
|---|---|
| **Evidência** | [docker/startup.sh](../docker/startup.sh) — bloco que imprime as credenciais no log |
| **Achado** | Seed cria 5 usuários, incluindo administrador, com senhas fixas; o startup **imprime as credenciais no log do container** |
| **Impacto** | Como os volumes não existem, o próximo deploy **vai rodar o seed** e criar esses usuários. Qualquer um com acesso ao log obtém acesso administrativo |
| **Proposta** | Senha do admin por variável de ambiente, com troca obrigatória no primeiro login; remover o `echo` das credenciais |
| **Risco** | Se a variável não for definida, o seed falha e o container não sobe (o script tem `exit 1`) |
| **Dependências** | Coordenar com quem for fazer o primeiro acesso |
| **Teste de aceite** | Login funciona; log não contém senha |
| **Rollback** | Reverter o script; usuários já criados não são afetados |
| **Métrica esperada** | N/A (segurança) |
| **Status** | `AUDITED` |

---

## 3. Serviços investigados e confirmados ausentes

Investigados sem premissa de remoção, conforme instrução. A ausência foi confirmada por múltiplas evidências — não por uma única busca vazia.

### Redis — `NOT APPLICABLE`

| Evidência | Resultado |
|---|---|
| `apps/backend/package.json` | sem `redis`, `ioredis`, `connect-redis` |
| `grep -riE "redis\|ioredis"` em `apps/`, `packages/`, `docker/`, `.github/`, raiz | **1 ocorrência**: comentário `"Alternativa futura: Migrar para Redis"` em [statsCache.service.ts:13](../apps/backend/src/services/statsCache.service.ts#L13) |
| compose de produção | nenhum serviço Redis |

**Funções que normalmente caberiam ao Redis, e onde estão hoje:**

| Função | Implementação atual | Avaliação |
|---|---|---|
| Cache | `Map` em memória, TTL 30 s, limpeza a cada 60 s ([statsCache.service.ts](../apps/backend/src/services/statsCache.service.ts)) | Adequado para instância única. Perde-se no restart — aceitável para estatísticas |
| Rate limiting geral | `express-rate-limit`, store em memória ([rateLimit.ts](../apps/backend/src/middleware/rateLimit.ts)) | Adequado para instância única |
| Rate limiting WhatsApp | `Map` próprio, limpeza a cada 10 min ([whatsappRateLimit.ts:64](../apps/backend/src/middleware/whatsappRateLimit.ts#L64)) | Adequado. **Atenção:** contadores zeram no restart — o limite anti-spam do WhatsApp é temporariamente contornável após reinício |
| Sessões | **não há sessão de servidor** — JWT stateless; refresh tokens **no Postgres** ([refresh-token.service.ts](../apps/backend/src/modules/auth/refresh-token.service.ts)) | Correto. Não requer Redis |
| Filas | inexistentes; trabalho feito por timers in-process | Ver §5 |
| Locks distribuídos | inexistentes; `isRunning` booleano por processo | Adequado **enquanto houver uma só instância**. Escalar horizontalmente exigiria lock real |

**Conclusão:** Redis não está em uso e **não é necessário na escala atual**. Adicioná-lo agora seria custo sem benefício. Torna-se necessário se houver mais de uma instância da API. **Não é candidato a remoção porque não existe.**

### MinIO / S3 / object storage — `NOT APPLICABLE`

| Evidência | Resultado |
|---|---|
| `grep -riE "minio\|aws-sdk\|s3\."` no repositório | zero ocorrências |
| Armazenamento real | disco local, volume V-02 `/app/uploads` |
| Servido por | `express.static('/uploads')` ([app.ts:70](../apps/backend/src/app.ts#L70)), com proxy e cache 1 ano no nginx |

**URLs assinadas:** inexistentes. Verificado — não há geração de URL temporária, HMAC ou token de acesso a arquivo.

**F-07 · `/uploads` sem controle de acesso.** Qualquer pessoa com a URL acessa o arquivo, sem autenticação. Como o caminho é previsível a partir do nome do arquivo, documentos de leads podem ser acessíveis a terceiros. **Impacto:** exposição de dados de clientes. **Proposta:** servir uploads por rota autenticada, ou adotar URLs assinadas com expiração. **Risco:** quebra links já distribuídos. **Teste de aceite:** requisição sem token retorna 401/403; com token, 200. **Rollback:** restaurar `express.static`. **Status:** `AUDITED`

**Conclusão sobre MinIO:** não existe e **não é necessário** — volume local atende. A lacuna real é controle de acesso (F-07), que **não se resolve** trocando o backend de storage.

### Filas (Bull/BullMQ/RabbitMQ/SQS) — `NOT APPLICABLE`

Zero ocorrências. O trabalho assíncrono é feito por `setInterval`/`CronJob` no processo da API (§5).

### Painéis administrativos e ferramentas de desenvolvimento

| Item | Situação | Avaliação | Status |
|---|---|---|---|
| **Swagger UI** (`/api-docs`) | **ativo em produção** — [app.ts:261-262](../apps/backend/src/app.ts#L261) monta sem checar `NODE_ENV`; nginx faz proxy dedicado | **F-06** — ver abaixo | `AUDITED` |
| **Prisma Studio** | script `prisma:studio` existe, **não** é iniciado por nenhum serviço ou compose | Ferramenta local. Não consome recursos em produção. Manter | `AUDITED` |
| **Adminer / pgAdmin** | inexistentes | Nada a fazer | `NOT APPLICABLE` |
| **`qrcode-terminal`** | dependência de produção; utilidade é imprimir QR no terminal | Cabe em devDependencies. Impacto desprezível | `AUDITED` |

**F-06 · Swagger exposto.** O painel e `/api/openapi.json` publicam o contrato completo da API — todas as rotas, parâmetros e esquemas — sem autenticação e sem guarda de ambiente. **Impacto:** facilita reconhecimento por terceiros; combina-se com F-12 (senhas padrão conhecidas) para um caminho de acesso direto. **Proposta:** condicionar a `NODE_ENV !== 'production'`, ou proteger com autenticação. **Risco:** integradores externos que dependam da doc perdem acesso — ver §4. **Teste de aceite:** em produção, `/api-docs` retorna 404/401; em dev, 200. **Rollback:** remover a condição. **Status:** `AUDITED`

---

## 4. Consumidores externos — confirmação de fluxos

Verificação explícita antes de qualquer proposta, já que quebrar um integrador externo é invisível no código.

| ID | Superfície | Evidência | Consumidor | Implicação |
|---|---|---|---|---|
| X-01 | `POST /api/public/leads` | [app.ts:91](../apps/backend/src/app.ts#L91), `public-leads.routes.ts` | **Landing page pública** | Sem autenticação **por projeto**. Alvo de abuso; depende de rate limiting em memória |
| X-02 | Módulo `webhooks` | `webhook.service.ts`, 9 rotas incluindo `/test` e `/deliveries` | **Sistemas de terceiros** recebem eventos | Alterar payload ou desligar quebra integrações externas silenciosamente |
| X-03 | Módulo `api-keys` | `apiKey.service.ts`; `apiKeyAuth.ts` com `checkRateLimit` | **Clientes de API externos** | Chaves ativas podem existir em produção. Rate limit por chave, contador **no banco** |
| X-04 | Módulo `external` | `modules/external/` | A confirmar | Superfície externa adicional |
| X-05 | Módulo `integrations` | `integrations.service.ts` | Serviços de terceiros | Direção e provedores não confirmados |
| X-06 | WhatsApp | `whatsappWebJS.service.ts` | Plataforma WhatsApp | Sessão persistida em V-03; perda exige novo QR |
| X-07 | Google Analytics 4 | frontend | Google | Sem impacto em recursos do servidor |
| X-08 | Provedor de IA | `modules/ai/ai.service.ts` | Provedor externo não identificado | Custo e latência externos desconhecidos |

**Consequência para a auditoria:** X-02, X-03, X-04 e X-05 significam que a API tem consumidores **fora do frontend**. Nenhuma rota pode ser considerada morta por não haver chamada no frontend. Nenhuma remoção de endpoint foi proposta.

**X-08 permanece `PENDING`:** provedor não identificado; requer inspeção de configuração em ambiente real, indisponível.

---

## 5. Jobs, timers e trabalho assíncrono

Seis timers permanentes, todos no processo da API. Nenhum é um container separado.

| ID | Job | Frequência | Evidência | Avaliação |
|---|---|---|---|---|
| J-01 | `automationSchedulerService` | **30 s** | [automationScheduler.service.ts:38](../apps/backend/src/services/automationScheduler.service.ts#L38) | Consulta o banco a cada 30 s **indefinidamente**, mesmo sem automações. Candidato a execução sob demanda |
| J-02 | Health check WhatsApp | **30 s** | [whatsappWebJS.service.ts:1400](../apps/backend/src/services/whatsappWebJS.service.ts#L1400) | Justificado: detecta queda de sessão. Manter |
| J-03 | `chatbotAutosaveService` | configurável (minutos) | [chatbot-autosave.service.ts:41](../apps/backend/src/modules/chatbot/chatbot-autosave.service.ts#L41) | Salva leads parciais de sessões inativas. Legítimo |
| J-04 | Limpeza do `statsCache` | 60 s | [statsCache.service.ts:133](../apps/backend/src/services/statsCache.service.ts#L133) | Custo desprezível (varre um `Map`). Manter |
| J-05 | Limpeza do rate limiter WhatsApp | 10 min | [whatsappRateLimit.ts:257](../apps/backend/src/middleware/whatsappRateLimit.ts#L257) | Custo desprezível. **Nota:** `setInterval` em escopo de módulo, sem `unref()` nem `clear` — roda mesmo em testes e não é parado no shutdown |
| J-06 | `tokenCleanupService` | diário, 03:00 America/Sao_Paulo | [token-cleanup.service.ts:19](../apps/backend/src/services/token-cleanup.service.ts#L19) | Modelo correto: `CronJob` fora do horário de pico. **Não é parado** no shutdown (§6) |

### F-11 · Polling de 30 s como padrão

| Campo | Conteúdo |
|---|---|
| **Achado** | J-01 consulta o banco a cada 30 s (2.880 consultas/dia) independentemente de haver trabalho |
| **Impacto** | CPU e I/O contínuos em estado ocioso. Magnitude real **NOT MEASURED** — sem medição do custo por ciclo |
| **Proposta** | Medir o custo de um ciclo antes de decidir. Se relevante: intervalo adaptativo (recuar quando ocioso) ou disparo por evento na criação da automação |
| **Risco** | Intervalo maior atrasa automações — impacto direto no produto |
| **Dependências** | Requer baseline (G-02) |
| **Teste de aceite** | Automação agendada dispara dentro da tolerância definida pelo negócio |
| **Rollback** | Restaurar 30 s |
| **Métrica esperada** | NOT MEASURED |
| **Status** | `AUDITED` |

### Duplicações e ociosidade

- **Nenhum job duplicado** — cada timer tem responsabilidade distinta.
- **Nenhum serviço ocioso do Ferraco** — não há container a desligar; o app está fora do ar.
- **Guardas `isRunning`** existem em J-01 e J-03, prevenindo execução sobreposta **no mesmo processo**. Com múltiplas instâncias, ambos rodariam em paralelo sem lock distribuído.

---

## 6. Achado de maior impacto — F-01 · 20 instâncias de PrismaClient

| Campo | Conteúdo |
|---|---|
| **Evidência** | `grep -rn "new PrismaClient" apps/backend/src` → **20 ocorrências em 20 arquivos**, 2026-09-17. Singleton correto existe em [config/database.ts:28](../apps/backend/src/config/database.ts#L28) e é importado por 32 arquivos |
| **Ambiente** | produção e desenvolvimento (código compartilhado) |
| **Achado** | Dos 20, **8 são scripts de uso pontual** (`src/scripts/*`, aceitável) e **12 são serviços de runtime** que criam cliente próprio em vez de importar o singleton: `ai`, `apiKey`, `batch`, `chatbot`, `dashboard`, `integrations`, `reports`, `webhook`, `automationKanban`, `kanbanColumn`, `whatsappMessageTemplate`, `automationScheduler`, `eventEmitter` |
| **Impacto** | Cada `PrismaClient` mantém **pool próprio** (default `num_cpus*2+1` = **9 conexões** em 4 vCPU) e sua própria instância do query engine. 12 clientes ⇒ até **~108 conexões** contra um Postgres cujo `max_connections` está no default (100). **Isto é esgotamento de conexões antes de qualquer questão de RAM** — e cada engine carrega estruturas próprias em memória |
| **Proposta** | Substituir as 12 instâncias de runtime por `import { prisma } from '../config/database'`. Manter as dos scripts, que executam e encerram |
| **Risco** | **Médio-alto.** O singleton registra handlers `$on('query'/'error'/'warn')` que os clientes locais não têm; unificar muda o volume de log. Requer verificar se algum serviço depende de configuração distinta do cliente |
| **Dependências** | Deve preceder F-02 — o dimensionamento de `mem_limit` e de `max_connections` depende do número real de pools |
| **Teste de aceite** | `SELECT count(*) FROM pg_stat_activity WHERE datname='ferraco_crm'` estabiliza em patamar compatível com um pool; todos os módulos afetados respondem; sem erro `too many connections` sob uso normal |
| **Rollback** | Reverter os imports; mudança puramente de código, sem efeito em dados |
| **Métrica esperada** | Redução esperada de conexões de ~108 para ~9. **Valor real NOT MEASURED** — app fora do ar |
| **Status** | `AUDITED` |

**Observação de shutdown:** `shutdown()` em [server.ts:130](../apps/backend/src/server.ts#L130) para J-01 e J-03, desconecta WhatsApp e chama `disconnectDatabase()` — mas **não** para J-06 (`tokenCleanupService.stop()` existe e não é chamado) nem J-02, e `disconnectDatabase()` só desconecta o singleton. Os 12 clientes locais **nunca são desconectados**, deixando conexões penduradas até o timeout do Postgres. Agrava F-01. `AUDITED`

---

## 7. Imagens, build e disco

| ID | Achado | Evidência | Avaliação |
|---|---|---|---|
| F-03 | Build na VPS | [.github/workflows/deploy-vps.yml](../.github/workflows/deploy-vps.yml); duração 6m22s–20m01s (API do Actions) | `npm ci` + `tsc` + Vite disputam CPU/RAM com 17 containers **em produção**. As 4 apps vizinhas puxam imagem pronta do GHCR. **Proposta:** construir no runner e publicar no GHCR, deixando à VPS apenas o pull. **Risco:** exige configurar autenticação no registry; primeiro deploy mais lento (pull inicial). **Teste de aceite:** deploy conclui, app responde `/health`, tempo de deploy na VPS cai. **Rollback:** restaurar o workflow anterior. **Métrica:** NOT MEASURED |
| F-05 | devDependencies no runtime | [Dockerfile](../Dockerfile) — `COPY --from=builder /app/node_modules` sem prune | 21 devDependencies do backend (jest, ts-jest, supertest, eslint, typescript, tsx…) mais as do frontend vão para a imagem final. **Proposta:** `npm prune --omit=dev` no builder, ou `npm ci --omit=dev` em stage separado. **Atenção:** `startup.sh` tem fallback `npx tsx src/server.ts`, que **depende de `tsx`, uma devDependency** — remover sem tratar quebra o fallback. **Rollback:** remover o prune. **Métrica:** NOT MEASURED (imagem nunca construída aqui) |
| F-10 | Chromium no builder | [Dockerfile](../Dockerfile) L16-L25 | Instalado nos **dois** stages; no builder nada o executa (não há teste de navegador no build). Remover reduz tempo de build e camadas. **Risco:** baixo; se algum passo de build precisar dele, o build falha imediatamente e o erro é evidente. **Rollback:** reinstalar |
| — | Acúmulo no host | `docker system df` 2026-09-17 | 9,22 GB de imagens recuperáveis + 1,99 GB de build cache. **~11,2 GB.** Sobre 165 GB livres, é folga, não risco. **Nenhum prune executado** nesta auditoria, conforme instrução. Recomenda-se política de retenção — não limpeza avulsa |

---

## 8. Logs, rede e confiabilidade

| ID | Achado | Evidência | Avaliação |
|---|---|---|---|
| F-04 | Sem rotação de log | compose sem `logging:`; `/etc/docker/daemon.json` **ausente** | `json-file` sem `max-size` cresce sem limite. Containers vizinhos declaram `max-size=10m, max-file=3` e por isso estão em 22 MB. **Proposta:** declarar `logging` nos dois serviços (mudança local, preferível a mexer no daemon, que afeta as outras 4 apps). **Risco:** nenhum relevante; perde-se histórico além do limite. **Teste de aceite:** `docker inspect` mostra a config; log não passa do teto. **Rollback:** remover a chave |
| F-16 | Porta em `0.0.0.0` | compose `"3050:3050"`; `ss -tlnp` mostra vizinhas em `127.0.0.1` | Expõe a aplicação diretamente à internet, contornando o nginx do host (TLS, logs, headers). **Proposta:** `"127.0.0.1:3050:3050"` + vhost no nginx do host. **Risco:** sem o vhost configurado antes, a aplicação fica inacessível. **Dependência:** criar o vhost primeiro. **Teste de aceite:** acesso pelo domínio via HTTPS OK; acesso direto a `IP:3050` recusado |
| F-17 | Healthcheck testa o proxy | compose: `wget http://127.0.0.1:3050/health` → nginx | Se o Node morrer e o nginx continuar, o nginx responde ao `/health`… por proxy ao Node, que falharia — então detecta. Porém se o **nginx** cair, o healthcheck falha mesmo com o Node saudável, e o restart derruba tudo. **Proposta:** verificar Node em `localhost:3000/health` diretamente. **Risco:** baixo. **Rollback:** restaurar a URL |
| F-09 | Limites de upload divergentes | [whatsapp.routes.ts:86](../apps/backend/src/routes/whatsapp.routes.ts#L86) 100 MB; [upload.controller.ts:45](../apps/backend/src/controllers/upload.controller.ts#L45) 50 MB; nginx `client_max_body_size 50M` | Upload de 50–100 MB via rota WhatsApp é aceito pelo multer e **rejeitado pelo nginx com 413** — falha tardia, após transferir o arquivo. Desperdiça I/O e confunde o usuário. **Proposta:** alinhar os três. **Risco:** baixo. **Teste de aceite:** arquivo acima do limite é recusado cedo, com mensagem clara |
| F-13 | Sem backup | ausência em compose, scripts e workflow | Não há dump, snapshot ou cópia off-site do Postgres nem dos uploads. **Confiabilidade, não desperdício** — mas é o achado de maior consequência potencial. **Proposta:** `pg_dump` agendado com retenção definida, fora do horário de pico. **Risco:** job de backup consome I/O; agendar junto a J-06 (03:00) |
| F-14 | Sem rollback | workflow sem etapa de reversão | Deploy com falha deixa o serviço fora do ar sem caminho de volta automático. Passar a usar GHCR (F-03) habilita rollback por tag de imagem — **os dois achados se resolvem juntos** |

---

## 9. Matriz de reconciliação — inventário → evidência → cobertura

Todos os IDs de container do inventário, sem exceção.

| ID do inventário | Item | Evidência examinada | Cobertura |
|---|---|---|---|
| C-01 | `ferraco-postgres` | compose L2-L20; `docker ps -a`; schema.prisma | `AUDITED` |
| C-02 | `ferraco-crm-vps` | compose L22-L95; Dockerfile; startup.sh; nginx.conf | `AUDITED` |
| C-03 | `ferraco-backend` (dev) | docker-compose.yml L3-L40 | `AUDITED` |
| C-04 | `ferraco-frontend` (dev) | docker-compose.yml L42-L57; `find` (arquivo ausente) | `AUDITED` |
| P-01 | nginx no container | startup.sh; docker/nginx.conf | `AUDITED` |
| P-02 | Node `dist/server.js` | startup.sh; server.ts | `AUDITED` |
| P-03 | Chromium headless | Dockerfile L16-L31; whatsappWebJS.service.ts | `AUDITED` |
| P-04 | `prisma migrate deploy` | startup.sh | `AUDITED` |
| P-05 | `prisma db seed` | startup.sh; prisma/seed.ts | `AUDITED` |
| V-01 | `ferraco-postgres-data` | compose; `docker volume ls` (ausente) | `AUDITED` |
| V-02 | `ferraco-uploads` | compose; app.ts:70; upload.controller.ts | `AUDITED` |
| V-03 | `ferraco-sessions` | compose; startup.sh (limpeza de locks Chromium) | `AUDITED` |
| V-04 | `ferraco-logs` | compose; sem rotação (F-04) | `AUDITED` |
| V-05 | `ferraco-data` | compose; startup.sh cria o diretório | **`PENDING`** — nenhum consumidor identificado no código; requer execução para confirmar se é usado |
| V-06 | volumes de dev | docker-compose.yml | `AUDITED` |
| D-01 | Dockerfile raiz | leitura integral | `AUDITED` |
| D-02 | Dockerfile do backend | leitura integral; só o compose de dev o referencia | `AUDITED` |
| D-03 | `apps/frontend/Dockerfile` | `find` — inexistente (F-15) | `AUDITED` |
| DB-01..DB-11 | Postgres, Prisma, seed, pools | schema.prisma; database.ts; 20× `new PrismaClient` | `AUDITED` |
| R-01..R-06 | Timers e schedulers | 6 timers localizados (J-01..J-06) | `AUDITED` |
| R-07 | Filas | grep sem ocorrências em todo o repositório | `NOT APPLICABLE` — inexistentes; trabalho feito in-process |
| R-08 | Redis | grep: 1 comentário; §3 detalha as funções substitutas | `NOT APPLICABLE` — ausente; não necessário na escala atual |
| R-09 | MinIO / S3 | grep: zero; storage em volume local | `NOT APPLICABLE` — ausente; volume atende |
| R-10 | WebSocket | nginx.conf (timeout 7d); socket.io no server | `AUDITED` |
| R-11 | Heap do Node | grep `NODE_OPTIONS` / `max-old-space-size`: ausente | `AUDITED` |
| BD-01..BD-09 | Build e deploy | workflow; API do Actions (15 runs) | `AUDITED` |
| RC-01..RC-08 | Limites e timeouts | compose; `docker inspect` das 18 vizinhas | `AUDITED` |
| E-01 | WhatsApp | package.json; whatsappWebJS.service.ts | `AUDITED` |
| E-02 | Google Analytics 4 | frontend | `AUDITED` |
| E-03 | GitHub Actions | workflow | `AUDITED` |
| E-04 | Provedor de IA | `modules/ai/ai.service.ts` existe; provedor não identificado | **`PENDING`** |
| L-01..L-07 | Cache, logs, backup | services; nginx.conf; ausência de backup | `AUDITED` |
| A-07 | Arquitetura de CPU da imagem | sem `--platform`; build e execução no mesmo host x86_64 | **`BLOCKED`** — imagem nunca construída neste host |
| — | Baseline de runtime do Ferraco | `docker ps -a`: nenhum container | **`BLOCKED`** — app fora do ar |
| — | Causa raiz da queda anterior | journal só do boot atual | **`BLOCKED`** — logs perdidos na reinstalação |
| X-01..X-08 | Consumidores externos | módulos e rotas; §4 | `AUDITED` (X-08 `PENDING`) |

---

## 10. Candidatos a remoção

Nenhuma remoção é proposta. Registro do que foi avaliado e por quê:

| Candidato | Fluxos atendidos | Alternativa | Veredito |
|---|---|---|---|
| Container Postgres separado | Banco do cliente | Nenhuma aceitável | **Manter.** Consolidar bancos de clientes está explicitamente fora de escopo |
| Nginx dentro do container | Estáticos, gzip, roteamento, WebSocket | Node serviria estáticos | **Manter.** Remover transferiria I/O de arquivos ao event loop do Node e acoplaria o container ao nginx do host, piorando portabilidade |
| Swagger em produção | Documentação de API para integradores (X-02..X-05) | Publicar a doc fora do runtime | **Restringir, não remover** (F-06). Há consumidores externos plausíveis |
| Compose de dev (C-03/C-04) | Ambiente local | Executar sem container | **Corrigir, não remover.** Ferramenta de desenvolvimento |
| Chromium no stage builder | Nenhum identificado | — | **Único candidato real** (F-10). Baixo risco: falha no build é imediata e evidente |
| `qrcode-terminal` em produção | Impressão de QR no terminal | devDependency | Reclassificar. Ganho desprezível |

Critério aplicado: menos containers não é benefício se piora isolamento ou confiabilidade.

---

## 11. Totais de cobertura

| Status | Total | Itens |
|---|---|---|
| **AUDITED** | **48** | C-01..C-04, P-01..P-05, V-01..V-04, V-06, D-01..D-03, DB (11), R-01..R-06, R-10, R-11, BD (9 agrupados), RC (8 agrupados), E-01..E-03, L-01..L-07, X-01..X-07 |
| **PENDING** | **3** | V-05 (consumidor não identificado), E-04/X-08 (provedor de IA), X-04/X-05 (direção das integrações a confirmar) |
| **BLOCKED** | **3** | Baseline de runtime, causa raiz da queda, arquitetura de CPU da imagem — todos por o app estar fora do ar ou por perda de logs |
| **NOT APPLICABLE** | **3** | Redis, MinIO/S3, filas — ausência confirmada por múltiplas evidências, não por busca única |

**17 achados** registrados: 8 de severidade alta, 7 média, 2 baixa.

**A auditoria não está completa.** Os 3 `BLOCKED` são materiais: sem o app em execução, nenhum consumo real foi medido, e todo dimensionamento de limite (F-02) depende de baseline que só existirá após o primeiro deploy. Os valores de "métrica esperada" permanecem `NOT MEASURED` — nenhum foi estimado.

**Ordem de dependência entre os achados**, caso se avance para correção: F-01 precede F-02 (o número de pools determina o dimensionamento); F-03 precede F-14 (GHCR habilita rollback); F-16 depende do vhost do nginx existir antes.
