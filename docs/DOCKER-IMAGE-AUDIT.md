# DOCKER-IMAGE-AUDIT — Ferraco CRM

**Data:** 2026-09-17 · **Etapa:** AUDITORIA (somente análise) · **Host:** `72.60.10.108`
**Base:** [VPS-OPT-INVENTORY.md](VPS-OPT-INVENTORY.md) · [VPS-OPT-BASELINE.md](VPS-OPT-BASELINE.md) · [CONTAINER-AUDIT.md](CONTAINER-AUDIT.md) · [RUNTIME-RESOURCE-AUDIT.md](RUNTIME-RESOURCE-AUDIT.md)

**Cobertura:** `AUDITED` (analisado, **não corrigido**) · `PENDING` · `BLOCKED` · `NOT APPLICABLE`
**Métricas:** `NOT MEASURED` onde não há medição. Nenhum valor estimado.

> **Nada foi alterado.** Sem prune, sem exclusão de imagens — inclusive as candidatas a rollback foram preservadas.
>
> **Método:** as medições vieram de containers descartáveis (`docker run --rm node:20-alpine`), que instalam pacotes em camada efêmera e não tocam serviços em produção. Foi a única forma de **reproduzir a necessidade real** dos binários do Prisma em vez de presumi-la.
>
> **Limitação:** a imagem `ferraco-crm:latest` **nunca foi construída neste host** (VERIFIED: `docker images | grep ferraco` vazio). Tamanho final, contagem de camadas e espaço recuperável da imagem do Ferraco são `BLOCKED`.

---

## Sumário de achados

| ID | Achado | Severidade | Recurso |
|---|---|---|---|
| **F-28** | **Seed executa `deleteMany()` em 14 tabelas, sem guarda de ambiente** | **CRÍTICA** | **dados** |
| F-29 | Chromium instalado em ambos os stages: ~767 MB desperdiçados no builder | ALTA | disco, tempo de build |
| F-30 | `node_modules` inteiro copiado do builder, com devDependencies | ALTA | disco |
| F-31 | `COPY apps ./apps` invalida cache de `npm ci` a cada mudança de código | ALTA | tempo de build |
| F-32 | `BUILD_TIMESTAMP` como ARG anula o cache de camadas deliberadamente | ALTA | tempo de build |
| F-33 | `binaryTarget` correto, mas engines duplicados (genérico + específico) | MÉDIA | disco |
| F-34 | Seed depende de `tsx` (devDependency) e de `src/` — conflita com F-30 | ALTA | quebra de deploy |
| F-35 | `COPY --from=builder /app/apps/backend` traz `src/`, testes e configs | MÉDIA | disco, superfície |
| F-36 | Segundo stage não é multi-stage real: runtime reinstala tudo | MÉDIA | disco |
| F-37 | `EXPOSE 3050` mas `ENV PORT=3000` — inconsistência semântica | BAIXA | clareza |
| F-38 | Dockerfile do backend (`node:18`) diverge do de produção (`node:20`) | MÉDIA | consistência |
| F-39 | `.dockerignore` não exclui `deploy-*.tar.gz` (2,8 MB de artefatos mortos) | BAIXA | contexto |
| F-40 | `schema-engine` (17,9 MB) é necessário em runtime — não remover | INFORMATIVO | armadilha evitada |
| F-41 | Imagem final roda como `root` | ALTA | segurança |

---

## Parte I — Stack efetivamente encontrada

Verificação antes de qualquer análise, conforme instrução de não presumir.

| Presunção a testar | Resultado | Evidência |
|---|---|---|
| **Next.js?** | **NÃO** | [apps/frontend/package.json](../apps/frontend/package.json): `vite@^5.4.19` + `react@^18.3.1`. Zero ocorrências de `next` |
| Prisma? | **SIM** | `@prisma/client@^5.22.0` + `prisma@^5.22.0` (devDependency) |
| Docker? | **SIM** | 2 Dockerfiles, 2 composes |
| Node? | **SIM** | `node:20-alpine` (produção), `node:18-alpine` (dev) |
| Gerenciador | **npm** | `package-lock.json`. `bun.lockb` presente porém **órfão** e já excluído no `.dockerignore` |

**Consequência:** toda a seção de Next.js do escopo (standalone, tracing de monorepo, `public/`, imports dinâmicos) é **`NOT APPLICABLE`**. O frontend é SPA Vite: produz `dist/` estático servido pelo nginx, sem servidor Node próprio e sem tracing de dependências. Registrado na matriz com justificativa.

---

## Parte II — Achado crítico: o seed é destrutivo

### F-28 · `prisma db seed` apaga 14 tabelas sem guarda de ambiente

| Campo | Conteúdo |
|---|---|
| **Evidência** | [apps/backend/prisma/seed.ts:13-26](../apps/backend/prisma/seed.ts#L13) — 14 chamadas `deleteMany()` consecutivas; `grep -nE "NODE_ENV\|production\|process.env" prisma/seed.ts` → **zero ocorrências** |
| **Ambiente** | produção (o `startup.sh` invoca em toda inicialização) |
| **Achado** | O seed começa apagando, em ordem de FK: `auditLog`, `refreshToken`, `note`, `messageTemplate`, `automation`, `opportunity`, `pipelineStage`, `pipeline`, `leadTag`, **`lead`**, `tag`, `teamMember`, **`user`**, `team`. O comentário no código diz *"optional - comment out if you want to keep existing data"* — a proteção é um comentário, não código |
| **Impacto** | **Perda total de dados de negócio.** A única barreira é a checagem em [docker/startup.sh](../docker/startup.sh): `USER_COUNT` via `psql`; o seed só roda se for `0`. Essa checagem é frágil por três caminhos: (a) se o `psql` falhar por rede ou autenticação, o `|| echo "0"` faz `USER_COUNT=0` e **dispara o seed contra um banco populado**; (b) a tabela `users` pode existir vazia com outras tabelas populadas; (c) qualquer execução manual de `npx prisma db seed` apaga tudo, sem aviso |
| **Proposta** | Guarda explícita no próprio seed: abortar se `NODE_ENV === 'production'` salvo variável de confirmação explícita; substituir `deleteMany` por `upsert` idempotente; corrigir o fallback do `startup.sh` para **abortar** em erro de `psql`, nunca assumir `0` |
| **Risco de agir** | Baixo. Um seed idempotente é estritamente mais seguro |
| **Risco de NÃO agir** | **Perda de dados de produção.** É o achado de maior severidade de toda a auditoria |
| **Dependências** | Relaciona-se a F-34 (seed depende de `tsx`) e a F-12 (senhas padrão) |
| **Teste de aceite** | Em banco descartável populado, `prisma db seed` **não** apaga dados preexistentes; com `psql` inacessível, o startup aborta em vez de semear |
| **Rollback** | Reverter o arquivo; nenhum efeito sobre dados já existentes |
| **Métrica esperada** | `NOT MEASURED` (correção de segurança de dados, não de recurso) |
| **Status** | `AUDITED` |

**Nota de contexto:** hoje o risco é nulo — o banco não existe ([VPS-OPT-BASELINE.md §B3](VPS-OPT-BASELINE.md)). Ele se materializa **no primeiro deploy**, e cresce a cada dia de dados acumulados depois disso.

---

## Parte III — Prisma: engine, plataforma e o que é realmente necessário

Reproduzi a instalação e o `generate` em container descartável, em vez de presumir.

### M-09 · Engines medidos (Prisma 5.22.0 em `node:20-alpine`)

`docker run --rm node:20-alpine` · `npm i @prisma/client@5.22.0 prisma@5.22.0` · 2026-09-17

| Pacote | Tamanho |
|---|---|
| `@prisma/engines` | **33,4 MB** |
| `prisma` (CLI) | 10,6 MB |
| `@prisma/client` | 8,1 MB |
| `@prisma/fetch-engine` | 1.016 KB |
| `@prisma/get-platform` | 708 KB |
| **`node_modules` só do Prisma** | **54,0 MB** |

Binários dentro de `@prisma/engines`:

| Binário | Tamanho | Função |
|---|---|---|
| `libquery_engine-linux-musl.so.node` | **15,4 MB** | consultas em runtime |
| `schema-engine-linux-musl` | **17,9 MB** | `migrate deploy` / `db push` |

### M-10 · `binaryTarget` e plataforma — verificado, não presumido

**Evidência:** [schema.prisma:8-11](../apps/backend/prisma/schema.prisma#L8) declara `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]`

Reproduzi `prisma generate` com esse mesmo bloco em `node:20-alpine`:

```
node_modules/.prisma/client/libquery_engine-linux-musl-openssl-3.0.x.so.node   15,4 MB
```

| Verificação | Resultado |
|---|---|
| OpenSSL da imagem | **`/usr/lib/libssl.so.3`** presente (CLI `openssl` ausente, irrelevante — o que importa é a lib) |
| `binaryTarget` declarado | `linux-musl-openssl-3.0.x` — **correto** para `node:20-alpine`, que usa OpenSSL 3 |
| Engine baixado por padrão | `linux-musl` (genérico, sem sufixo) |
| Engine gerado pelo `generate` | `linux-musl-openssl-3.0.x` (específico) — **adicional**, não substituto |

**F-33 · Engines duplicados.** A imagem final carrega o genérico (em `@prisma/engines`) **e** o específico (em `.prisma/client`): ~30,8 MB em query engines onde ~15,4 MB bastariam.

**Advertência explícita (F-40):** **não** proponho remover binários. A instrução alerta contra "remoções de binários sem reproduzir a necessidade", e a necessidade aqui **é real**:

- `libquery_engine-*` — necessário em **toda** consulta em runtime
- `schema-engine-linux-musl` (17,9 MB) — necessário porque o [startup.sh](../docker/startup.sh) executa `prisma migrate deploy` **a cada inicialização do container**

Um caminho comum de "otimização" seria remover o `schema-engine` da imagem de runtime por parecer ferramenta de build. **Isso quebraria o deploy** nesta arquitetura. Registrado como armadilha.

**Proposta para F-33:** avaliar se `binaryTargets` pode listar apenas o específico (removendo `"native"`, que só serve para desenvolvimento local em outra plataforma). **Risco:** se o build passar a ocorrer em ambiente não-musl (ex.: runner Ubuntu do GitHub Actions ao adotar GHCR — F-03), remover `"native"` quebra o `generate` local. **Dependência direta de F-03.** **Teste de aceite:** container sobe, consulta o banco e roda `migrate deploy` em ambiente descartável. **Rollback:** restaurar a lista. **Métrica esperada:** `NOT MEASURED`.

**Status:** `AUDITED`

### F-34 · O seed depende de `tsx` e de `src/` — conflito direto com F-30

| Campo | Conteúdo |
|---|---|
| **Evidência** | [package.json:77-79](../apps/backend/package.json#L77): `"prisma": { "seed": "npx tsx prisma/seed.ts" }`. [seed.ts:2](../apps/backend/prisma/seed.ts#L2): `import { hashPassword } from '../src/utils/password'`. `tsx@^4.7.0` é **devDependency** |
| **Achado** | O seed **não** roda a partir de `dist/`: executa TypeScript cru via `tsx` e importa de `src/`. Portanto o runtime precisa de: (a) `tsx` instalado, (b) `prisma/seed.ts`, (c) a árvore `src/` |
| **Impacto** | **Isto é o que torna F-30 perigoso.** Aplicar `npm prune --omit=dev` — a otimização óbvia — **remove `tsx` e quebra o seed**, fazendo o `startup.sh` sair com `exit 1` e o container não subir. O mesmo vale para o fallback `npx tsx src/server.ts` do startup |
| **Proposta** | Antes de qualquer prune: compilar o seed para `dist/` e apontar `prisma.seed` para `node dist/prisma/seed.js`, **ou** manter `tsx` explicitamente como dependência de produção. Decisão consciente, não implícita |
| **Risco** | Alto se ignorado: quebra silenciosa que só aparece no primeiro boot com banco vazio |
| **Dependências** | **Bloqueia F-30.** Relaciona-se a F-28 e F-35 |
| **Teste de aceite** | Em ambiente descartável com banco vazio: container sobe, `migrate deploy` aplica, seed executa, aplicação responde `/health` — **com a imagem podada** |
| **Rollback** | Restaurar `node_modules` completo |
| **Métrica esperada** | `NOT MEASURED` |
| **Status** | `AUDITED` |

---

## Parte IV — Dockerfile de produção, camada a camada

**Evidência:** [Dockerfile](../Dockerfile) · base `node:20-alpine` (**194 MB**, medido no host)

### Stage 1 — builder

| Linha | Instrução | Avaliação |
|---|---|---|
| L3 | `FROM node:20-alpine AS builder` | Base adequada |
| L6-7 | `ARG BUILD_TIMESTAMP`, `ARG GIT_COMMIT` | **F-32** — ver abaixo |
| L16-25 | `apk add ... chromium nss freetype ...` | **F-29** — Chromium no builder |
| L32 | `RUN echo "Build timestamp: ${BUILD_TIMESTAMP}"` | Invalida cache a partir daqui, por construção |
| L36 | `COPY package*.json tsconfig.base.json ./` | Correto: manifestos antes do código |
| **L39-40** | `COPY packages ./packages` + `COPY apps ./apps` | **F-31** — copia **todo o código** antes do `npm ci` |
| L43 | `RUN npm ci` | Cache invalidado por qualquer mudança em L39-40 |
| L46 | `RUN npm run prisma:generate` | Correto: antes do `tsc`, que precisa dos tipos |
| L49 | `RUN rm -rf apps/*/dist` | Redundante — `.dockerignore` já exclui `**/dist` |
| L55, L61 | builds de backend e frontend | Corretos; mensagens de erro úteis |

### F-29 · Chromium em ambos os stages — **767 MB medidos**

| Campo | Conteúdo |
|---|---|
| **Evidência** | [Dockerfile L16-25](../Dockerfile#L16) (builder) e [L79-91](../Dockerfile#L79) (runtime). **Medição:** `docker run --rm node:20-alpine` → `/usr` = **130,5 MB**; após `apk add chromium nss freetype harfbuzz ca-certificates ttf-freefont font-noto-emoji` → **897,2 MB**. Custo do conjunto: **~767 MB por stage** |
| **Ambiente** | build e runtime |
| **Achado** | O Chromium é instalado nos **dois** stages. No builder, **nada o executa**: não há teste de navegador, e `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true` já impede o download pelo npm — o `apk add` do builder é puro desperdício |
| **Impacto** | ~767 MB de camadas construídas e descartadas a cada build. Na VPS (onde o build ocorre — F-27), consome disco, I/O e tempo de rede. Não afeta o tamanho da imagem **final** (o builder é descartado), mas afeta o **build** |
| **Proposta** | Remover o bloco `apk add` de Chromium do stage builder; manter integralmente no runtime |
| **Risco** | **Baixo.** Se algum passo do build precisar do binário, o build falha imediatamente e de forma evidente — não há falha silenciosa |
| **Dependências** | Nenhuma |
| **Teste de aceite** | Build conclui; container sobe; QR do WhatsApp é gerado (prova que o Chromium do runtime funciona) |
| **Rollback** | Restaurar o bloco |
| **Métrica esperada** | Redução de ~767 MB nas camadas do builder. **Impacto em tempo: `NOT MEASURED`** |
| **Status** | `AUDITED` |

### F-31 e F-32 · O cache de camadas está anulado por construção

| Campo | Conteúdo |
|---|---|
| **Evidência** | [Dockerfile L39-43](../Dockerfile#L39): `COPY apps ./apps` **antes** de `RUN npm ci`. [L6, L32](../Dockerfile#L6): `ARG BUILD_TIMESTAMP` + `RUN echo` deliberadamente invalidam o cache |
| **Achado** | Duas causas independentes de cache miss total: (1) **F-31** — como todo o código é copiado antes do `npm ci`, qualquer alteração de uma linha em qualquer arquivo invalida a camada de instalação, forçando `npm ci` completo dos 3 workspaces; (2) **F-32** — o `BUILD_TIMESTAMP` muda a cada deploy e invalida tudo a partir de L32, **por design**. O comentário do arquivo declara isso: *"Cache busting: usar BUILD_TIMESTAMP para forçar rebuild"* |
| **Impacto** | **Todo deploy reinstala todas as dependências e recompila tudo.** Explica a duração medida de 6m22s–20m01s (15 runs, API do Actions). Na VPS, esse custo compete com 17 containers de produção (F-27) |
| **Proposta** | Ordenar como `COPY package*.json` + `COPY apps/*/package.json packages/*/package.json` → `npm ci` → **depois** `COPY` do código. Mover o cache busting para o mais tarde possível, ou substituí-lo por `--no-cache` explícito quando de fato necessário |
| **Risco** | **Médio.** O cache busting existe porque houve problema real de imagem servindo código antigo (há um commit: *"Adicionar cache-busting forçado no Dockerfile para garantir deploy"*). Removê-lo sem entender a causa original pode reintroduzir o bug. **A causa provável é justamente a ordem das camadas** — corrigida a ordem, o busting deixa de ser necessário |
| **Dependências** | Se F-03 (build no runner + GHCR) for adotado, o cache do runner torna este ganho ainda maior |
| **Teste de aceite** | Alterar uma linha em `apps/backend/src`; rebuild **não** reexecuta `npm ci`; imagem contém o código novo (verificar via `GIT_COMMIT`) |
| **Rollback** | Restaurar a ordem anterior |
| **Métrica esperada** | `NOT MEASURED` — nenhum build do Ferraco ocorreu neste host |
| **Status** | `AUDITED` |

### Stage 2 — runtime

| Linha | Instrução | Avaliação |
|---|---|---|
| L64 | `FROM node:20-alpine` | 194 MB |
| L79-91 | `apk add nginx openssl postgresql-client chromium ...` | +767 MB (Chromium) + nginx + `postgresql-client` (necessário: o `startup.sh` usa `psql`) |
| **L97** | `COPY --from=builder /app/apps/backend ./backend` | **F-35** |
| **L98** | `COPY --from=builder /app/node_modules ./node_modules` | **F-30** |
| L102 | `COPY --from=builder /app/apps/frontend/dist ./frontend/dist` | **Correto** — só o `dist/` do frontend |
| L110 | `mkdir` + `chown -R node:node /app` | `chown -R` sobre `node_modules` cria camada pesada duplicando metadados |
| L119-120 | `HEALTHCHECK ... localhost:3050` | Ver F-37 |
| **L124** | `USER root` | **F-41** |

### F-30 · `node_modules` completo no runtime

| Campo | Conteúdo |
|---|---|
| **Evidência** | [Dockerfile L98](../Dockerfile#L98) — `COPY --from=builder /app/node_modules`. Nenhum `npm prune --omit=dev` em nenhum stage |
| **Achado** | Vão para a imagem final as dependências de **todos os 3 workspaces**, incluindo 21 devDependencies do backend (jest, ts-jest, supertest, eslint, typescript, @types/*) e todo o toolchain do frontend (vite, rollup, @vitejs/*, tailwind) — que **nada** faz em runtime, já que o frontend é servido como `dist/` estático pelo nginx |
| **Impacto** | Disco na imagem e superfície de ataque ampliada. Magnitude exata `NOT MEASURED` (imagem nunca construída) |
| **Proposta** | `npm prune --omit=dev` no builder antes do `COPY`, **ou** stage dedicado com `npm ci --omit=dev` |
| **Risco** | **ALTO — e este é o ponto central.** Três dependências de runtime são formalmente devDependencies: **`tsx`** (seed, F-34, e fallback do `startup.sh`), **`prisma` CLI** (`migrate deploy` a cada boot) e **`typescript`** (transitivamente exigida por `tsx`). Um prune ingênuo **quebra o deploy** |
| **Dependências** | **Bloqueado por F-34.** Exige resolver o seed antes |
| **Teste de aceite** | Em ambiente descartável: (1) container sobe com a imagem podada; (2) `migrate deploy` aplica migrations; (3) seed executa com banco vazio; (4) consulta ao banco responde; (5) `/health` retorna 200 — **os cinco, separadamente**, conforme a instrução |
| **Rollback** | Remover o prune; manter a imagem anterior disponível para rollback |
| **Métrica esperada** | `NOT MEASURED` |
| **Status** | `AUDITED` |

### F-35 · `apps/backend` inteiro no runtime

`COPY --from=builder /app/apps/backend ./backend` traz `dist/`, `node_modules` local, `prisma/`, **`src/`**, `tsconfig.json`, `jest.config.js` e demais configs.

**Nuance importante:** `src/` **não é removível hoje** — o seed importa `../src/utils/password` (F-34). Só se torna removível depois de compilar o seed. Registrado para evitar a "otimização óbvia" que quebraria o boot.

`prisma/` **é necessário** (schema + migrations para `migrate deploy`). Removível com segurança: `jest.config.js`, `tsconfig.json`, arquivos de teste (estes já excluídos pelo `.dockerignore`). Ganho pequeno.

**Status:** `AUDITED`

### F-36 · Multi-stage sem o benefício principal

O padrão multi-stage existe para que o runtime receba **apenas artefatos**. Aqui o runtime recebe `node_modules` inteiro (F-30) e o `apps/backend` inteiro (F-35) — o único artefato genuinamente isolado é o `frontend/dist`. Some-se a reinstalação de ~767 MB de Chromium no segundo stage, e o ganho do multi-stage fica restrito a não carregar as camadas de build do `tsc`/Vite.

**Status:** `AUDITED`

### F-41 · Imagem roda como root

[Dockerfile L124](../Dockerfile#L124): `USER root`, justificado por o nginx precisar de privilégio. O [startup.sh](../docker/startup.sh) dropa apenas o backend para `node` via `su`; **nginx e PID 1 permanecem root**. O `chmod 777` em `/app/uploads` e `/app/sessions` amplia a exposição.

**Proposta:** nginx pode rodar sem root com `listen` acima de 1024 (já é 3050) e diretórios com propriedade ajustada. **Risco:** médio — exige ajustar permissões de `/var/lib/nginx` e `/run/nginx`. **Teste de aceite:** container sobe sem root; nginx serve; uploads gravam. **Status:** `AUDITED`

---

## Parte V — Contexto de build e `.dockerignore`

| Item | Medição | Avaliação |
|---|---|---|
| Repositório sem `node_modules`/`.git` | **21 MB** | Contexto enxuto |
| `.git` | 7,9 MB | **Excluído** (`.dockerignore` L2) — correto |
| `node_modules` | — | **Excluído** — correto e essencial |
| `deploy-fix.tar.gz` + `deploy-manual.tar.gz` | **2,8 MB** | **F-39** — não excluídos; artefatos mortos de deploy manual |
| `bun.lockb` | 197 KB | Excluído — correto |
| Docs `*.md` | — | Excluídos com `!README.md` — correto |

**`.dockerignore` — avaliação geral:** bem construído. Exclui `node_modules`, `dist`, `.git`, `.github`, testes, coverage, IDE, `.env` (**correto**, evita segredos em camadas), e traz um comentário acertado preservando `prisma/migrations`. Duas observações:

- **F-39** — adicionar `deploy-*.tar.gz` e `*.tar.gz`
- A exclusão `Dockerfile` + `docker-compose*.yml` com `!docker-compose.vps.yml` é inócua para o build (o Dockerfile não os copia), mas inofensiva

**Segredos em camadas:** verificado — nenhum `COPY .env*` no Dockerfile; `**/.env` excluído no `.dockerignore`; nenhum `ARG`/`ENV` com segredo. **As credenciais do banco estão no [docker-compose.vps.yml](../docker-compose.vps.yml) (F-08), não nas camadas da imagem** — distinção relevante: a imagem é distribuível sem vazar credencial. `AUDITED`

---

## Parte VI — Dockerfile do backend e consistência

### F-38 · [apps/backend/Dockerfile](../apps/backend/Dockerfile)

| Aspecto | Valor | Avaliação |
|---|---|---|
| Base | `node:18-alpine` | **Diverge** do `node:20-alpine` de produção |
| Uso | apenas `docker-compose.yml` (dev) | Não participa da produção |
| Stages | `base`, `deps`, `dev`, `builder`, `runner` | Estrutura correta — inclusive com `npm ci --only=production` e usuário não-root, **o que o Dockerfile de produção não faz** |
| Contexto | `./apps/backend` | **Incompatível com o monorepo**: `COPY package.json package-lock.json*` copiaria os do workspace, não os da raiz. `npm ci` provavelmente falharia por falta do lock raiz |

**Ironia registrada:** o Dockerfile *não usado* aplica boas práticas (prune de dev, usuário não-root, stages separados) que faltam ao usado em produção. Serve de referência para F-30 e F-41.

**Proposta:** alinhar a base para Node 20 e corrigir o contexto, **ou** documentá-lo como obsoleto. Não removê-lo por padrão — é ferramenta de desenvolvimento. **Status:** `AUDITED`

### F-37 · `EXPOSE 3050` com `ENV PORT=3000`

`PORT=3000` é a porta do Node; `3050` é a do nginx. Ambos corretos isoladamente, mas a leitura do arquivo sugere contradição. O `HEALTHCHECK` consulta `localhost:3050` — o **nginx**, não o Node (já registrado como F-17). Apenas clareza. **Status:** `AUDITED`

---

## Parte VII — Tamanho, camadas compartilhadas e espaço recuperável

Distinção exigida pelo escopo. Dados de `docker system df -v` (2026-09-17).

| Conceito | Definição | Exemplo medido no host |
|---|---|---|
| **Tamanho individual** | Soma de todas as camadas da imagem | `aprenderia-web:b36aeb7` = 744 MB |
| **Camada compartilhada** | Camadas comuns a outras imagens; contam **uma vez** no disco | 232 MB das 14 tags de `aprenderia-web` |
| **Tamanho único** | Exclusivo daquela imagem | 512,4 MB por tag de `aprenderia-web` |
| **Recuperável** | Imagens sem container associado | **9,22 GB (46%)** de 19,79 GB |

**Estado do host:** 45 imagens, 18 ativas, 19,79 GB, **9,22 GB recuperáveis**; build cache 5,73 GB com 1,99 GB recuperável. Total ~11,2 GB sobre 165 GB livres.

**Advertência sobre rollback — cumprida:** a instrução veda apagar imagens necessárias ao rollback. Observo que `m2centerauto` mantém 3–4 tags por serviço (`73e771e`, `3a09c8d`, `a33fd76`) — **isto é histórico de rollback legítimo**, não lixo. As 14 tags de `aprenderia-web` são mais do que qualquer política razoável exigiria, mas a decisão é do dono daquela aplicação, não desta auditoria. **Nenhum prune foi executado** e nenhuma imagem específica é recomendada para exclusão aqui.

**Projeção para a imagem do Ferraco:** `BLOCKED`. Componentes conhecidos: base 194 MB + Chromium ~767 MB + nginx/openssl/postgresql-client + `node_modules` completo + Prisma ~54 MB. A soma não é calculável com precisão sem construir, e não vou estimar.

---

## Parte VIII — Testes exigidos antes de qualquer otimização

A instrução exige testes **separados** em ambiente descartável. Nenhum foi executado (etapa de auditoria, e não há imagem). Especificação para a etapa de correção:

| ID | Teste | Procedimento | Critério |
|---|---|---|---|
| T-01 | **Startup** | Subir a imagem com banco vazio acessível | Container atinge `healthy`; `/health` = 200 |
| T-02 | **Consulta ao banco** | Autenticar e listar leads | Resposta correta; sem erro de engine |
| T-03 | **Migrations** | `prisma migrate deploy` em banco vazio e em banco já migrado | Aplica; idempotente na segunda execução |
| T-04 | **Seed** | `prisma db seed` em banco vazio | Cria usuários; **e**, com banco populado, **não apaga** (F-28) |
| T-05 | **Chromium/WhatsApp** | Iniciar sessão | QR gerado — valida o Chromium do runtime após F-29 |
| T-06 | **Imagem podada** | T-01..T-05 com `npm prune --omit=dev` | Todos passam — valida F-30/F-34 |

**Ambiente:** container descartável com Postgres efêmero. **Nunca** contra o banco de produção — T-04 é destrutivo por natureza.

---

## Matriz de cobertura — inventário → evidência → status

| Item do inventário | Evidência examinada | Cobertura |
|---|---|---|
| D-01 Dockerfile raiz | Leitura integral (127 linhas); 27 instruções mapeadas; F-29..F-37, F-41 | `AUDITED` |
| D-02 Dockerfile do backend | Leitura integral; F-38 | `AUDITED` |
| D-03 `apps/frontend/Dockerfile` | `find` — inexistente (F-15) | `AUDITED` |
| `.dockerignore` | Leitura integral; contexto medido (21 MB); F-39 | `AUDITED` |
| Contexto de build | `du -sh --exclude=node_modules --exclude=.git` = 21 MB | `AUDITED` |
| Base image | `docker images node:20-alpine` = **194 MB** | `AUDITED` |
| Camadas / cache | Ordem de `COPY`/`RUN`; F-31, F-32 | `AUDITED` |
| Multi-stage | 2 stages; F-36 | `AUDITED` |
| Deps runtime vs build | 28 prod + 21 dev; F-30, F-34 | `AUDITED` |
| Chromium | **Medido: 130,5 MB → 897,2 MB** (~767 MB) | `AUDITED` |
| **Prisma — versão** | `5.22.0` (client e CLI) | `AUDITED` |
| **Prisma — engine real** | **Medido:** `libquery_engine` 15,4 MB + `schema-engine` 17,9 MB | `AUDITED` |
| **Prisma — plataforma** | **Reproduzido:** `generate` produz `linux-musl-openssl-3.0.x`; `libssl.so.3` presente | `AUDITED` |
| **Prisma — cliente gerado** | `.prisma/client/libquery_engine-linux-musl-openssl-3.0.x.so.node` | `AUDITED` |
| **Prisma — CLI p/ migration** | `prisma` (devDep) + `schema-engine` — **necessários em runtime** (F-40) | `AUDITED` |
| **Prisma — seed** | `tsx` + `src/` — F-34; **destrutivo** — F-28 | `AUDITED` |
| Imagem de migration separada | Avaliada: **não recomendada** — exigiria duplicar schema, migrations e engine; integridade não comprovada; ganho não medido | `AUDITED` |
| Usuário / permissões | `USER root`; `su node`; `chmod 777`; F-41 | `AUDITED` |
| Segredos em camadas | Sem `COPY .env`; `**/.env` ignorado; credenciais só no compose | `AUDITED` |
| Tamanho individual | `docker system df -v` das 45 imagens do host | `AUDITED` |
| Camadas compartilhadas | Colunas SHARED/UNIQUE analisadas | `AUDITED` |
| Espaço recuperável | 9,22 GB imagens + 1,99 GB cache; **nada removido** | `AUDITED` |
| Imagens de rollback | Identificadas (tags de `m2centerauto`); **preservadas** | `AUDITED` |
| **Next.js — standalone** | Ausente: frontend é Vite/React | `NOT APPLICABLE` |
| **Next.js — tracing monorepo** | Ausente | `NOT APPLICABLE` |
| **Next.js — estáticos/public** | Ausente; `dist/` servido pelo nginx | `NOT APPLICABLE` |
| **Next.js — imports dinâmicos** | Ausente; code splitting do Vite (fora deste escopo) | `NOT APPLICABLE` |
| Módulos nativos (musl) | `sharp` (libvips) e `bcrypt` compilam em Alpine; **compatibilidade não testada** | **`PENDING`** |
| Tamanho da imagem do Ferraco | Nunca construída neste host | **`BLOCKED`** |
| Contagem de camadas | Idem | **`BLOCKED`** |
| Tempo de build por camada | Nenhum build neste boot | **`BLOCKED`** |
| Eficácia real do cache | Idem | **`BLOCKED`** |
| T-01..T-06 | Especificados; não executados (auditoria) | **`PENDING`** |

---

## Totais de cobertura

| Status | Total |
|---|---|
| **AUDITED** | **25** |
| **PENDING** | **2** |
| **BLOCKED** | **4** |
| **NOT APPLICABLE** | **4** |

**Achados novos:** F-28 a F-41 (14). **Medições novas:** M-09, M-10.

### Ordem de dependência

```
F-28 (seed destrutivo)  ──── independente, PRIORIDADE MÁXIMA
F-34 (seed usa tsx/src) ──── BLOQUEIA ──> F-30 (prune de devDeps)
F-31/F-32 (cache)       ──── potencializado por ──> F-03 (build no runner)
F-33 (binaryTargets)    ──── DEPENDE DE ──> F-03 (plataforma do build muda)
F-29 (Chromium builder) ──── independente, baixo risco
```

### Por que a auditoria não está completa

Os 4 `BLOCKED` derivam de um único fato: **a imagem nunca foi construída neste host**. Sem isso não há tamanho final, contagem de camadas, tempo por camada nem eficácia de cache — e nenhum desses valores foi estimado.

Os 2 `PENDING` exigem execução: compatibilidade musl de `sharp`/`bcrypt` (que só se prova executando, não lendo) e os testes T-01..T-06.

**Achado que atravessa toda a auditoria:** F-28. Não é desperdício de recurso — é risco de perda de dados de produção, hoje inerte porque o banco não existe, e que **se materializa no primeiro deploy**. Recomendo tratá-lo antes de qualquer otimização de imagem.
