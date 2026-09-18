# VPS-OPT-INVENTORY — Ferraco CRM

**Data:** 2026-09-17 · **Etapa:** DESCOBERTA (somente inventário) · **Host auditado:** `72.60.10.108`
**Legenda:** VERIFIED (com evidência) · PENDING (indício, sem confirmação) · NOT VERIFIED (não checado) · NOT APPLICABLE (não existe neste contexto)

> **Contexto:** a VPS foi reinstalada; todos os dados anteriores foram perdidos. O Ferraco **não está implantado** no host. Este inventário descreve o que o repositório *declara* e o confronta com o que existe na VPS.

---

## 1. Arquitetura e stack

| ID | Item | Valor | Status |
|---|---|---|---|
| A-01 | Monorepo | npm workspaces (`apps/*`, `packages/*`), `ferraco-monorepo` v3.0.0 | VERIFIED |
| A-02 | Runtime declarado | Node >= 18, npm >= 9 | VERIFIED |
| A-03 | Runtime da imagem | `node:20-alpine` (Dockerfile raiz) | VERIFIED |
| A-04 | Runtime do Dockerfile do backend | `node:18-alpine` — **divergente de A-03** | VERIFIED |
| A-05 | Linguagem | TypeScript 5.8 strict | VERIFIED |
| A-06 | Gerenciador de pacotes | npm (`package-lock.json`). Existe também `bun.lockb` no repositório, **não referenciado por nenhum build** | VERIFIED |
| A-07 | Arquitetura de CPU da imagem | **NOT VERIFIED** — build ocorre na VPS (x86_64), sem `--platform` declarado | NOT VERIFIED |

## 2. Aplicações

| ID | App | Stack | Porta | Status |
|---|---|---|---|---|
| APP-01 | `@ferraco/frontend` | React 18 + Vite + Tailwind + shadcn/ui + Socket.IO client | 3000 dev / estático em prod | VERIFIED |
| APP-02 | `@ferraco/backend` | Express + Prisma + Socket.IO | 3000 | VERIFIED |
| APP-03 | `@ferraco/shared` | Tipos/utils/constantes | — | VERIFIED |

**Contagem: 3 workspaces (2 aplicações + 1 package).**

## 3. Containers e processos

### 3.1 Declarados no compose de produção ([docker-compose.vps.yml](../docker-compose.vps.yml))

| ID | Nome | Imagem | Função | Volumes | Portas | Healthcheck | Limites RAM/CPU | Restart | Status na VPS |
|---|---|---|---|---|---|---|---|---|---|
| C-01 | `ferraco-postgres` | `postgres:16-alpine` | Banco | `postgres-data:/var/lib/postgresql/data` | 5432 interna | `pg_isready` 10s | **NENHUM** | unless-stopped | **NÃO EXISTE** |
| C-02 | `ferraco-crm-vps` | build local → `ferraco-crm:latest` | Nginx + Node + Chromium (container único) | `data`, `logs`, `uploads`, `sessions` | `3050:3050` em 0.0.0.0 | `wget /health` 30s, start 60s | **NENHUM** | unless-stopped | **NÃO EXISTE** |

### 3.2 Declarados no compose de desenvolvimento ([docker-compose.yml](../docker-compose.yml))

| ID | Nome | Observação | Status |
|---|---|---|---|
| C-03 | `ferraco-backend` | target `dev`, `DATABASE_URL=file:./dev.db` (SQLite) — **somente desenvolvimento** | VERIFIED (declarado) |
| C-04 | `ferraco-frontend` | build `./apps/frontend/Dockerfile` target `dev` — **arquivo não existe no repositório** | VERIFIED (referência quebrada) |

### 3.3 Processos dentro de C-02

| ID | Processo | Tipo | Evidência |
|---|---|---|---|
| P-01 | Nginx (root) | permanente | [docker/startup.sh](../docker/startup.sh) |
| P-02 | Node `dist/server.js` (usuário `node`) | permanente | idem |
| P-03 | Chromium headless (WhatsApp) | permanente, filho do Node | `PUPPETEER_EXECUTABLE_PATH` no Dockerfile |
| P-04 | `prisma migrate deploy` | job de inicialização | startup.sh |
| P-05 | `prisma db seed` | job condicional (só se `users` vazio) | startup.sh |

**Contagem: 4 containers declarados (2 prod + 2 dev), 0 em execução, 3 processos permanentes + 2 jobs.**

### 3.4 Containers de outras aplicações no host — 17 ativos + 1 job encerrado

Não pertencem ao Ferraco, mas **compartilham os recursos**. Todos com limites de RAM e CPU efetivos. Detalhamento em [VPS-OPT-BASELINE.md](VPS-OPT-BASELINE.md#b2). Aplicações vizinhas: `aprenderia` (4), `ultrazend`/`velomail` (5), `digiurban` (4), `m2centerauto` (5).

## 4. Banco de dados e ORM

| ID | Item | Valor | Status |
|---|---|---|---|
| DB-01 | SGBD produção | PostgreSQL 16 (alpine) | VERIFIED |
| DB-02 | SGBD desenvolvimento | SQLite (`file:./dev.db`) via compose dev | VERIFIED |
| DB-03 | Provider do schema | `postgresql` | VERIFIED |
| DB-04 | ORM | Prisma 5.22 | VERIFIED |
| DB-05 | Modelos | **63** (CLAUDE.md afirma 45 tabelas — **desatualizado**) | VERIFIED |
| DB-06 | Migrations | 4 diretórios em `apps/backend/prisma/migrations` | VERIFIED |
| DB-07 | Seed | `tsx prisma/seed.ts`, cria 5 usuários com senhas padrão | VERIFIED |
| DB-08 | Pool de conexões | **não configurado** — Prisma usa default (`num_cpus*2+1`) | VERIFIED |
| DB-09 | Tuning do Postgres | **nenhum** — imagem sem `shared_buffers`/`max_connections` customizados | VERIFIED |
| DB-10 | Credenciais do banco | `ferraco:ferraco123` **hardcoded** no compose | VERIFIED |
| DB-11 | Backup automatizado | **nenhum** mecanismo declarado | VERIFIED |

## 5. Storage e volumes

| ID | Volume | Caminho | Proprietário | Criticidade | Retenção | Existe na VPS |
|---|---|---|---|---|---|---|
| V-01 | `ferraco-postgres-data` | `/var/lib/postgresql/data` | C-01 | **CRÍTICA** | indefinida | NÃO |
| V-02 | `ferraco-uploads` | `/app/uploads` | C-02 | **CRÍTICA** (arquivos de usuário) | indefinida | NÃO |
| V-03 | `ferraco-sessions` | `/app/sessions` | C-02 | **ALTA** (sessão WhatsApp; perda = novo QR) | indefinida | NÃO |
| V-04 | `ferraco-logs` | `/app/logs` | C-02 | baixa | **sem rotação declarada** | NÃO |
| V-05 | `ferraco-data` | `/app/data` | C-02 | média (consumidor não identificado) | indefinida | NÃO |
| V-06 | `backend-data`, `whatsapp-sessions`, `whatsapp-tokens` | dev | C-03 | NOT APPLICABLE (dev) | — | NÃO |

**Contagem: 5 volumes de produção declarados, 0 existentes.** Tamanhos: NOT APPLICABLE (não existem).

## 6. Docker e imagens

| ID | Item | Valor | Status |
|---|---|---|---|
| D-01 | Dockerfiles | **2**: [Dockerfile](../Dockerfile) (raiz, produção) e [apps/backend/Dockerfile](../apps/backend/Dockerfile) | VERIFIED |
| D-02 | Uso do Dockerfile do backend | referenciado **apenas** pelo compose de dev; não participa da produção | VERIFIED |
| D-03 | `apps/frontend/Dockerfile` | **ausente** — compose dev o referencia e falharia | VERIFIED |
| D-04 | Estratégia | multi-stage: builder (build) → runtime | VERIFIED |
| D-05 | Chromium | instalado em **ambos** os stages; no builder é desnecessário (nada o executa em build) | VERIFIED |
| D-06 | `node_modules` copiado para runtime | **completo, incluindo devDependencies** — nenhum `npm prune --omit=dev` | VERIFIED |
| D-07 | Cache busting | `BUILD_TIMESTAMP` como ARG antes do `npm ci` | VERIFIED |
| D-08 | `.dockerignore` | presente | VERIFIED |
| D-09 | Usuário do container | `USER root` (nginx); backend dropa para `node` via `su` | VERIFIED |
| D-10 | Tamanho da imagem | **NOT VERIFIED** — nunca construída neste host |

## 7. Build e deploy

Fluxo declarado em [.github/workflows/deploy-vps.yml](../.github/workflows/deploy-vps.yml):

```
push main → Actions (ubuntu-latest) → sshpass SSH root@72.60.10.108
  → rsync/checkout em /root/ferraco-crm
  → docker compose build NA VPS (npm ci + build backend + build frontend)
  → docker compose up -d
  → startup.sh: migrate deploy → seed condicional → nginx → node
  → healthcheck
```

| ID | Item | Valor | Status |
|---|---|---|---|
| BD-01 | Gatilho | `push` em `main` + `workflow_dispatch`. **Regra do projeto: deploy só por push na main; nunca criar branch** | VERIFIED |
| BD-02 | Concorrência | `ferraco-deploy-vps`, `cancel-in-progress: true` | VERIFIED |
| BD-03 | Timeout | 40 min | VERIFIED |
| BD-04 | **Onde ocorre o build** | **na VPS** — `npm ci` + 2 builds TypeScript/Vite disputam CPU/RAM com 17 containers em produção | VERIFIED |
| BD-05 | Registry | **nenhum** — não usa GHCR, ao contrário das apps vizinhas, que puxam imagem pronta | VERIFIED |
| BD-06 | Autenticação | senha de root via `sshpass` + secret `VPS_PASSWORD` | VERIFIED |
| BD-07 | Rollback | **não implementado** | VERIFIED |
| BD-08 | Duração observada | 6m22s–20m01s, mediana ~11 min (15 runs) | VERIFIED |
| BD-09 | Último deploy | 2026-02-06 16:27 UTC, sucesso — **anterior à reinstalação** | VERIFIED |

## 8. Runtime, workers, cron e filas

| ID | Item | Evidência | Status |
|---|---|---|---|
| R-01 | Agendador | `cron` ^3.1.6 + `setInterval`, **in-process** | VERIFIED |
| R-02 | `automationScheduler.service.ts` | agendador de automações | VERIFIED |
| R-03 | `statsCache.service.ts` | cache de estatísticas em memória | VERIFIED |
| R-04 | `whatsappAutomation.service.ts` | automações WhatsApp | VERIFIED |
| R-05 | `chatbot-autosave.service.ts` | autosave do chatbot | VERIFIED |
| R-06 | `whatsappWebJS.service.ts` | integração WhatsApp | VERIFIED |
| R-07 | Fila externa (Bull/BullMQ) | **nenhuma** | VERIFIED |
| R-08 | Redis | **não é dependência do Ferraco** (o `digiurban-redis` do host é de outra app) | VERIFIED |
| R-09 | MinIO / S3 | **nenhum** — uploads em disco local | VERIFIED |
| R-10 | WebSocket | Socket.IO, proxy com timeout 7d no nginx | VERIFIED |
| R-11 | Heap do Node | **não configurado** — sem `--max-old-space-size` | VERIFIED |

**Divergência crítica de documentação:** CLAUDE.md descreve **WPPConnect**; a dependência real em `apps/backend/package.json` é **`whatsapp-web.js`**, e o compose define `USE_WHATSAPP_WEB_JS: "true"`. O nome dos serviços (`whatsappService.ts`) reflete a nomenclatura antiga.

## 9. Cache, logs e backups

| ID | Item | Valor | Status |
|---|---|---|---|
| L-01 | Cache de aplicação | em memória (`statsCache`), sem Redis | VERIFIED |
| L-02 | Cache HTTP | nginx: `expires 1y` para assets e uploads | VERIFIED |
| L-03 | Gzip | ativo no nginx do container | VERIFIED |
| L-04 | **Rotação de logs do container** | **NÃO declarada** no compose — sem `logging:` e sem `daemon.json` no host, o `json-file` cresce **sem limite** | VERIFIED |
| L-05 | Logs do nginx do container | `/var/log/nginx/*.log`, **sem logrotate** | VERIFIED |
| L-06 | Volume de logs | V-04, sem política de retenção | VERIFIED |
| L-07 | Backups | **nenhum** — sem dump, snapshot ou cópia off-site | VERIFIED |

## 10. Configurações de recursos — resumo

| ID | Parâmetro | Declarado | Efetivo | Status |
|---|---|---|---|---|
| RC-01 | `mem_limit` / `cpus` do Ferraco | **ausente nos 2 serviços** | sem teto: pode consumir os 15 GB | VERIFIED |
| RC-02 | Limites das apps vizinhas | presentes | efetivos (`Memory`/`NanoCpus` != 0) | VERIFIED |
| RC-03 | Heap do Node | ausente | default (~25% da RAM visível) | VERIFIED |
| RC-04 | Pool do Prisma | ausente | default | VERIFIED |
| RC-05 | Tuning do Postgres | ausente | defaults da imagem | VERIFIED |
| RC-06 | Rotação de log do Ferraco | ausente | ilimitada | VERIFIED |
| RC-07 | Timeouts do nginx | 60s API, 7d WebSocket | efetivos | VERIFIED |
| RC-08 | Healthchecks | ambos os serviços | efetivos | VERIFIED |

## 11. Serviços externos

| ID | Serviço | Uso | Status |
|---|---|---|---|
| E-01 | WhatsApp (whatsapp-web.js) | mensageria, núcleo do produto | VERIFIED |
| E-02 | Google Analytics 4 | rastreamento no frontend | VERIFIED |
| E-03 | GitHub Actions | CI/CD | VERIFIED |
| E-04 | Provedor de IA (chatbot) | módulo `chatbot` presente; provider **NOT VERIFIED** | PENDING |

## 12. Matriz de cobertura

| Área | Encontrada | Inventariada | IDs | Evidência | Status |
|---|---|---|---|---|---|
| Frontend | sim | sim | APP-01 | package.json, vite.config | VERIFIED |
| Backend | sim | sim | APP-02 | package.json, src/ | VERIFIED |
| Shared package | sim | sim | APP-03 | packages/shared | VERIFIED |
| Containers | sim | sim | C-01..C-04 | compose ×2, `docker ps -a` | VERIFIED |
| Dockerfiles | sim (2) | sim | D-01..D-03 | find | VERIFIED |
| Compose | sim (2) | sim | C-01..C-04 | leitura direta | VERIFIED |
| Banco / ORM | sim | sim | DB-01..DB-11 | schema.prisma, compose | VERIFIED |
| Redis | não (Ferraco) | sim | R-08 | grep em package.json | NOT APPLICABLE |
| MinIO / S3 | não | sim | R-09 | grep | NOT APPLICABLE |
| Storage / volumes | sim | sim | V-01..V-06 | compose, `docker volume ls` | VERIFIED |
| Workers | in-process | sim | R-01..R-06 | grep no src | VERIFIED |
| Cron | in-process | sim | R-01, R-02 | dep `cron`, services | VERIFIED |
| Filas | não | sim | R-07 | grep | NOT APPLICABLE |
| WebSocket | sim | sim | R-10 | nginx.conf, server.ts | VERIFIED |
| Proxy | sim (2 camadas) | sim | P-01, B6 | nginx.conf, sites-enabled | VERIFIED |
| Healthchecks | sim | sim | RC-08 | compose, Dockerfile | VERIFIED |
| Logs | sim | sim | L-04..L-06 | compose, `docker inspect` | VERIFIED |
| Backups | **não existem** | sim | L-07 | ausência em compose/scripts/workflow | VERIFIED |
| Cache | sim | sim | L-01..L-03 | services, nginx.conf | VERIFIED |
| Build / deploy / CI-CD | sim | sim | BD-01..BD-09 | workflow, API do Actions | VERIFIED |
| Migrations / seed | sim | sim | DB-06, DB-07, P-04, P-05 | startup.sh, prisma/ | VERIFIED |
| Runtime | sim | sim | A-02..A-04 | Dockerfiles | VERIFIED |
| Limites RAM/CPU | **ausentes no Ferraco** | sim | RC-01 | compose, `docker inspect` | VERIFIED |
| Heap | ausente | sim | RC-03 | grep NODE_OPTIONS | VERIFIED |
| Pools | ausente | sim | RC-04, DB-08 | schema.prisma, DATABASE_URL | VERIFIED |

## 13. Gate — segunda passagem

| Reconciliação | Resultado |
|---|---|
| Serviços declarados ↔ inventariados | 4 declarados, 4 inventariados. **0 em execução** — divergência explicada pela reinstalação |
| Dockerfiles encontrados ↔ catalogados | 2 ↔ 2. D-03 é referência quebrada no compose de dev |
| Volumes ↔ persistência | 5 de produção declarados ↔ 0 existentes. Nenhum dado a preservar |
| Scripts ↔ fluxo de deploy | workflow → compose → Dockerfile → startup.sh: cadeia íntegra e coerente |
| `bun.lockb` | presente mas órfão — nenhum build o consome (A-06) |

**Justificativa dos NOT APPLICABLE:** Redis, MinIO/S3 e filas foram marcados por **ausência confirmada de dependência** em `package.json` e código, não por falta de acesso.

## 14. Lacunas relevantes

| # | Lacuna | Impacto |
|---|---|---|
| G-01 | Causa raiz da queda anterior não determinável — logs perdidos | Impede confirmar a hipótese |
| G-02 | Sem baseline de pico do Ferraco (app ausente) | Limites terão de partir de estimativa e ser ajustados após observação |
| G-03 | Provider de IA do chatbot não identificado (E-04) | Custo/latência externos desconhecidos |
| G-04 | Arquitetura de CPU da imagem não verificada (A-07) | Baixo — build e execução no mesmo host x86_64 |
| G-05 | Sem APM / série temporal | Regressões futuras não serão detectáveis |

**Auditoria NÃO declarada completa** — G-01 e G-02 são lacunas materiais.

---

## 15. Hipótese sobre a queda da VPS — não confirmada

Evidência circunstancial, com G-01 em aberto:

1. **RC-01** — o Ferraco é o **único** conjunto de serviços da VPS sem `mem_limit`/`cpus`. As 4 aplicações vizinhas têm limites efetivos em 100% dos containers.
2. **BD-04** — é também a única que **compila na própria VPS**: `npm ci` + `tsc` + Vite, processos de pico de RAM, concorrendo com 17 containers em produção. As vizinhas puxam imagem pronta do GHCR (BD-05).
3. **L-04** — único com `json-file` sem rotação, crescendo indefinidamente.
4. **D-06** — runtime carrega devDependencies desnecessárias.
5. **P-03** — Chromium headless é consumidor de RAM notoriamente elevado e sem teto.

A combinação *build sem limite na VPS* + *runtime sem teto com Chromium* é consistente com exaustão de memória. **Não é prova** — sem os logs do incidente, permanece hipótese.

Contraponto que enfraquece a versão de "VPS subdimensionada": com 15 GB de RAM, 13 GB disponíveis, load 0,09 e ~1,1 GiB em uso pelas 4 aplicações vizinhas, **o host tem folga substancial**. O problema é de contenção e limites, não de capacidade.
