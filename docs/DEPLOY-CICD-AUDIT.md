# DEPLOY-CICD-AUDIT — Ferraco CRM

**Data:** 2026-09-17 · **Etapa:** AUDITORIA (somente análise) · **Host:** `72.60.10.108`
**Base:** [VPS-OPT-INVENTORY.md](VPS-OPT-INVENTORY.md) · [CONTAINER-AUDIT.md](CONTAINER-AUDIT.md) · [RUNTIME-RESOURCE-AUDIT.md](RUNTIME-RESOURCE-AUDIT.md) · [DOCKER-IMAGE-AUDIT.md](DOCKER-IMAGE-AUDIT.md) · [DATABASE-AUDIT.md](DATABASE-AUDIT.md) · [STORAGE-DISK-AUDIT.md](STORAGE-DISK-AUDIT.md)

**Cobertura:** `AUDITED` (analisado, **não corrigido**) · `PENDING` · `BLOCKED` · `NOT APPLICABLE`
**Métricas:** `NOT MEASURED` onde não há medição. Nenhum valor estimado.

> **Nada foi alterado.** Nenhum deploy disparado, nenhum workflow editado, nenhuma carga gerada.
>
> **Limitação:** nenhum deploy ocorreu desde a reinstalação (último run com sucesso: 2026-02-06 16:27 UTC; boot atual: 2026-09-14). Consumo de CPU/RAM durante build, disco temporário e downtime real são **`BLOCKED`** — medidos apenas por duração agregada via API do Actions.

---

## Sumário de achados

| ID | Achado | Severidade | Recurso |
|---|---|---|---|
| **F-66** | **`docker compose down` antes do build: downtime = duração inteira do build** | **CRÍTICA** | disponibilidade |
| **F-67** | **Imagem anterior é apagada antes do build — rollback impossível** | **CRÍTICA** | recuperação |
| F-68 | `--no-cache --pull` + `builder prune -a` força rebuild total a cada deploy | ALTA | CPU, I/O, tempo |
| F-69 | Senha em argumento de linha de comando (`sshpass -p`) | **ALTA** | segurança |
| F-70 | `StrictHostKeyChecking=no` + `UserKnownHostsFile=/dev/null` | **ALTA** | segurança |
| F-71 | Backup de uploads/sessions existe — **mas não do PostgreSQL** | **CRÍTICA** | dados |
| F-72 | `DATABASE_URL` passado como `--build-arg` sem `ARG` no Dockerfile | MÉDIA | segurança, ruído |
| F-73 | `rm -rf $APP_DIR` destrói o código antes de validar o novo pacote | MÉDIA | recuperação |
| F-74 | Sem verificação de disco livre antes do build | MÉDIA | disponibilidade |
| F-75 | Healthcheck valida só `/health` — não valida migration nem seed | ALTA | confiabilidade |
| F-76 | Sem referência imutável por digest; tag `latest` mutável | MÉDIA | rastreabilidade |
| F-77 | `cancel-in-progress: true` pode abortar deploy no meio da migration | ALTA | integridade |
| F-78 | Rollback de código é insuficiente após migration — sem estratégia | **ALTA** | recuperação |

---

## Parte I — Trace completo: do commit ao healthcheck

**Evidência:** [.github/workflows/deploy-vps.yml](../.github/workflows/deploy-vps.yml), 824 linhas, 10 steps.

```
push main
  │
  ├─ [runner ubuntu-latest] checkout @v4
  ├─ [runner] apt-get install sshpass
  ├─ [runner] valida secrets (VPS_PASSWORD obrigatório, DATABASE_URL opcional)
  ├─ [runner] valida estrutura do monorepo (ls dos arquivos esperados)
  ├─ [runner] tar -czf deploy.tar.gz (exclui .git, node_modules, dist)
  ├─ [runner] scp → /tmp/deploy.tar.gz            ← StrictHostKeyChecking=no
  │
  ├─ [VPS] ssh heredoc DEPLOY_SCRIPT:             ← sshpass -p '<senha>'
  │    ├─ instala curl/wget/docker se ausente
  │    ├─ L195  docker compose down --remove-orphans      ◄── APP CAI AQUI
  │    ├─ L199  docker rm -f ferraco-crm-vps / ferraco-postgres
  │    ├─ L204  fuser -k 3050/tcp ; sleep 2
  │    ├─ L211  docker rmi -f <todas as imagens ferraco>  ◄── ROLLBACK PERDIDO
  │    ├─ L215  docker builder prune -a -f
  │    ├─ L218  docker network prune -f
  │    ├─ L228  rm -rf /root/ferraco-crm                  ◄── CÓDIGO ANTERIOR PERDIDO
  │    ├─ L235  mkdir + tar -xzf
  │    ├─ L249  valida estrutura extraída
  │    ├─ L313  valida/cria named volumes
  │    ├─ L334  BACKUP: uploads.tar.gz + sessions.tar.gz  ◄── SEM POSTGRES
  │    ├─ L374  retenção: mantém últimos 5 backups
  │    ├─ L387  docker compose build --no-cache --pull    ◄── 6–20 MIN DE DOWNTIME
  │    └─ L405  docker compose up -d
  │
  ├─ [VPS] verificação: logs, volumes, permissões de escrita
  ├─ [VPS] healthcheck: 20 tentativas × 5s = até 100s     ◄── SÓ /health
  ├─ [VPS] post-deploy: curl em /health, /api/landing-page/config, /api-docs
  └─ Deploy Success
```

### F-66 · Downtime = duração inteira do build

| Campo | Conteúdo |
|---|---|
| **Evidência** | Workflow L195 (`down`) precede L387 (`build`) e L405 (`up -d`). Duração medida via API do Actions, 15 runs: **6m22s a 20m01s**, mediana ~11 min |
| **Ambiente** | produção |
| **Achado** | A aplicação é derrubada **antes** do build começar. Como o build ocorre na VPS e é forçado a ser completo (F-68), o downtime **não é a troca de container** — é a compilação inteira: `npm ci` + `prisma generate` + `tsc` + `vite build` |
| **Impacto** | **Indisponibilidade de 6 a 20 minutos por deploy.** Pior: se o build falhar, o serviço permanece fora do ar e não há imagem anterior para restaurar (F-67). Um erro de TypeScript derruba a produção até alguém corrigir e reimplantar |
| **Proposta** | Construir a imagem **antes** de parar o serviço. A forma correta: build no runner, publicar no registry, e na VPS apenas `pull` + `up -d` — reduz a janela ao tempo de troca do container |
| **Risco** | Exige registry e autenticação (ver Parte III) |
| **Dependências** | Resolve-se junto com F-67 e F-68 |
| **Teste de aceite** | Durante o deploy, requisições a `/health` continuam respondendo até o instante da troca; janela de indisponibilidade medida em segundos |
| **Rollback** | Restaurar o workflow anterior |
| **Métrica esperada** | Downtime atual: **6–20 min medidos**. Esperado após correção: **`NOT MEASURED`** |
| **Status** | `AUDITED` |

### F-67 · A imagem anterior é destruída antes do build

| Campo | Conteúdo |
|---|---|
| **Evidência** | L211-212: `docker images --filter "reference=*ferraco*" -q \| xargs -r docker rmi -f` e `docker images \| grep ferraco \| awk '{print $3}' \| xargs -r docker rmi -f`. Executado **antes** do build (L387) |
| **Achado** | Todas as imagens do Ferraco são removidas à força antes de existir qualquer imagem nova. O comentário do próprio workflow declara a intenção: *"Limpando COMPLETAMENTE Docker para rebuild zero"* |
| **Impacto** | **Rollback por imagem é impossível.** Se o build falhar ou a versão nova estiver quebrada, não há artefato anterior para reiniciar — só reimplantar o commit antigo, pagando outro ciclo de build de 6–20 min. É a diferença estrutural para as aplicações vizinhas, que mantêm 3–4 tags históricas ([STORAGE-DISK-AUDIT.md](STORAGE-DISK-AUDIT.md)) |
| **Proposta** | Manter as N imagens anteriores com tag por commit SHA; nunca remover a imagem em execução |
| **Risco** | Consome disco — mas o host tem 165 GB livres e 3% de inodes ([STORAGE-DISK-AUDIT.md M-15](STORAGE-DISK-AUDIT.md)) |
| **Dependências** | Habilitado por F-76 (tags por digest/SHA) |
| **Teste de aceite** | Após o deploy, a imagem anterior ainda existe; `docker run` da tag anterior sobe a versão antiga |
| **Rollback** | N/A |
| **Métrica esperada** | `NOT MEASURED` |
| **Status** | `AUDITED` |

### F-68 · Rebuild total forçado

L387-397: `docker compose build --no-cache --pull`, precedido de `docker builder prune -a -f` (L215).

Três mecanismos independentes garantem que **nenhum cache seja aproveitado**: `--no-cache`, `builder prune -a` e `BUILD_TIMESTAMP` como ARG ([DOCKER-IMAGE-AUDIT.md F-32](DOCKER-IMAGE-AUDIT.md)). Somados a `COPY apps` antes de `npm ci` (F-31), o resultado é: **todo deploy reinstala tudo e recompila tudo**.

Na VPS, esse custo compete com 17 containers de produção ([RUNTIME-RESOURCE-AUDIT.md F-27](RUNTIME-RESOURCE-AUDIT.md): o build roda **fora** do cgroup dos serviços, sem `mem_limit`).

**Proposta:** corrigir a ordem das camadas e permitir cache. **Risco:** o cache busting foi adicionado deliberadamente (há commit: *"Adicionar cache-busting forçado no Dockerfile para garantir deploy"*), provavelmente para contornar imagem servindo código antigo — sintoma cuja causa provável é justamente a ordem das camadas. Remover sem corrigir a causa reintroduz o bug. **Status:** `AUDITED`

---

## Parte II — Segurança do canal de deploy

### F-69 · Senha em argumento de linha de comando

| Campo | Conteúdo |
|---|---|
| **Evidência** | L108, L119, L412, L715: `sshpass -p '${{ secrets.VPS_PASSWORD }}'` |
| **Achado** | O escopo pede explicitamente evitar SSH com credenciais em argumentos. Argumentos de processo são visíveis em `/proc/<pid>/cmdline` e em `ps` para qualquer usuário do runner durante a execução. O GitHub Actions mascara o valor no log, mas **não** no espaço de processo |
| **Impacto** | Exposição da senha de **root** da VPS durante cada execução. No modelo atual, a mesma credencial dá acesso total ao host — que abriga **4 outras aplicações em produção** |
| **Proposta** | Chave SSH dedicada ao deploy (`sshpass -f` como paliativo, `ssh -i` como solução), com `authorized_keys` restrito por `command=` e `from=`. Observação: `/root/.ssh/authorized_keys` existe mas está **vazio** (0 bytes, verificado) — hoje só há autenticação por senha |
| **Risco** | Perda de acesso se a chave for mal configurada. Testar em sessão paralela antes de desativar a senha |
| **Dependências** | Requer acesso administrativo à VPS |
| **Teste de aceite** | Deploy conclui usando chave; `PasswordAuthentication` pode ser desabilitado sem perder acesso |
| **Rollback** | Reativar autenticação por senha |
| **Métrica esperada** | `NOT MEASURED` (segurança) |
| **Status** | `AUDITED` |

### F-70 · Host key checking desabilitado

**Evidência:** L109-110 e equivalentes: `-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null`

Aceita qualquer chave de host sem verificação e descarta o registro. O deploy fica vulnerável a interposição: um atacante capaz de redirecionar o tráfego recebe **a senha de root** e o pacote de deploy. O escopo pede explicitamente evitar isso.

**Proposta:** fixar a chave pública do host via secret e usar `ssh-keyscan` validado uma vez, com `UserKnownHostsFile` apontando para arquivo controlado. **Risco:** reinstalação da VPS troca a chave e quebra o deploy até atualizar o secret — o que é o comportamento desejado, não um defeito. **Status:** `AUDITED`

### F-72 · `DATABASE_URL` como build-arg inexistente

| Campo | Conteúdo |
|---|---|
| **Evidência** | L393: `--build-arg DATABASE_URL="${{ secrets.DATABASE_URL }}"`. `grep -nE "ARG" Dockerfile` → apenas `BUILD_TIMESTAMP` e `GIT_COMMIT`. **Não há `ARG DATABASE_URL`** |
| **Achado** | O build-arg é passado mas **nunca declarado** no Dockerfile — o Docker emite aviso e ignora o valor. Funcionalmente inócuo hoje; conceitualmente errado. Se alguém adicionar `ARG DATABASE_URL` no futuro, a credencial passa a ficar **gravada no histórico de camadas da imagem**, recuperável por `docker history` |
| **Impacto** | Hoje: ruído e falsa impressão de que o build precisa do banco. Futuro: vazamento de credencial em camada |
| **Proposta** | Remover o build-arg. O build **não precisa** de `DATABASE_URL` — o `prisma generate` lê apenas o schema, e as migrations rodam em runtime pelo `startup.sh`. A variável já é fornecida corretamente pelo compose |
| **Risco** | Nenhum — o valor já é ignorado |
| **Teste de aceite** | Build conclui sem o argumento; `prisma generate` funciona |
| **Rollback** | Restaurar a linha |
| **Métrica esperada** | `NOT MEASURED` |
| **Status** | `AUDITED` |

---

## Parte III — Mover o build para runner + registry

Avaliação com as ressalvas que o escopo exige — sem prometer CI gratuito nem deploy instantâneo.

### Viabilidade confirmada

| Requisito | Verificação | Resultado |
|---|---|---|
| **Arquitetura compatível** | VPS: `x86_64` (`uname -a`). Runner `ubuntu-latest`: x86_64 | ✅ Compatível. **Sem necessidade de emulação** |
| **Registry disponível** | GHCR já em uso pelas vizinhas: `ghcr.io/fernandinhomartins40/aprenderia-web`, `digiurban-app`, `velomail-api` | ✅ Padrão estabelecido no mesmo host |
| **Autenticação** | `/root/.docker` existe (config de login prévio ao GHCR) | ✅ Mecanismo já operante |
| **Custo** | GitHub Actions tem cota gratuita para repositórios públicos; repositórios privados consomem minutos da conta. **Não afirmo que é gratuito** — depende do plano | ⚠️ **`PENDING`** — verificar plano |
| **Disponibilidade** | Depende de GitHub Actions e GHCR estarem no ar. Introduz dependência externa que hoje não existe | ⚠️ Trade-off real |
| **Tempo de build** | Runner tem 4 vCPU / 16 GB. A VPS tem 4 vCPU / 15 GB — **capacidade semelhante**. O ganho **não é build mais rápido**: é o build deixar de competir com 17 containers de produção | ⚠️ Expectativa a calibrar |

### O ganho real — e o que não é

**É:** eliminar o pico de build da VPS (F-27); reduzir downtime de 6–20 min para o tempo de `pull` + troca (F-66); habilitar rollback por tag (F-67); permitir cache de camadas entre builds no runner.

**Não é:** deploy instantâneo — o `pull` de uma imagem com Chromium (~767 MB de camadas, [DOCKER-IMAGE-AUDIT.md F-29](DOCKER-IMAGE-AUDIT.md)) leva tempo proporcional à banda da VPS, e o **primeiro** pull será mais lento que hoje. Também **não é** CI gratuito garantido.

**Proposta:** build e push no runner; na VPS, `docker login` por token de escopo mínimo via stdin (`--password-stdin`, nunca em argumento), `pull` por digest e `up -d`.

**Risco:** dependência de GHCR; se o registry estiver indisponível, não há deploy. Mitigável mantendo as N imagens anteriores localmente (F-67).

**Teste de aceite:** imagem publicada com tag por SHA; VPS faz pull autenticado sem expor token em `ps` ou log; `up -d` sobe a versão correta (confirmar por `GIT_COMMIT`); rollback por tag anterior funciona.

**Status:** `AUDITED` · **Custo: `PENDING`**

### F-76 · Referência imutável

O compose declara `image: ferraco-crm:latest` — tag **mutável**. Não há garantia de que "latest" na VPS seja o que o build produziu, nem forma de identificar qual commit está em execução além do `ENV GIT_COMMIT`.

**Proposta:** tag por SHA do commit e referência por digest (`image@sha256:...`) no deploy. **Risco:** baixo; exige atualizar o compose a cada deploy (via variável de ambiente). **Status:** `AUDITED`

---

## Parte IV — Migration, seed e recuperação de dados

### F-75 · O healthcheck não prova que migration e seed funcionaram

| Campo | Conteúdo |
|---|---|
| **Evidência** | L602: `curl -f -s http://127.0.0.1:3050/health`, 20 tentativas × 5 s. Post-deploy (L753-762): `/health`, `/api/landing-page/config`, `/api-docs`, `/api/openapi.json` |
| **Achado** | O escopo adverte: *"App saudável não prova migration/seed funcionais"* — e é exatamente o caso. O `/health` responde pelo nginx→Node ([CONTAINER-AUDIT.md F-17](CONTAINER-AUDIT.md)); não consulta o banco. No `startup.sh`, `migrate deploy` falho cai em `db push` e o boot **continua**; a falha só aparece como aviso no log, sem abortar |
| **Impacto** | Um deploy pode ser reportado como sucesso com o schema divergente do esperado. `/api/landing-page/config` toca o banco e dá alguma cobertura acidental, mas não valida migrations aplicadas nem integridade do seed |
| **Proposta** | Smoke test explícito: verificar `_prisma_migrations` (todas aplicadas, nenhuma com `rolled_back_at`), executar uma consulta representativa autenticada, e falhar o deploy se qualquer uma não passar |
| **Risco** | Deploys que hoje "passam" podem passar a falhar — o que é o comportamento correto |
| **Dependências** | Remover o fallback `db push` ([DATABASE-AUDIT.md F-51](DATABASE-AUDIT.md)) |
| **Teste de aceite** | Migration propositalmente quebrada faz o deploy falhar; deploy saudável passa em todos os smoke tests |
| **Rollback** | Remover os testes adicionais |
| **Métrica esperada** | `NOT MEASURED` |
| **Status** | `AUDITED` |

### Migration como job controlado

| Aspecto | Estado atual | Avaliação |
|---|---|---|
| Onde roda | Dentro do `startup.sh`, a cada boot do container | Não é job isolado; falha mistura-se ao start da aplicação |
| Idempotência | `migrate deploy` é idempotente | ✅ Correto |
| Fallback | `db push --skip-generate` se falhar | ❌ **Perigoso** — sincroniza ignorando histórico, pode remover coluna |
| Compatibilidade com versão anterior | **Não avaliada em lugar nenhum** | ❌ Com `down` antes do `up`, não há coexistência de versões — o que *reduz* o risco de incompatibilidade, ao custo de downtime (F-66) |
| Concorrência | `cancel-in-progress: true` | ❌ **F-77** |

### F-77 · Cancelamento pode abortar a migration

`concurrency: { group: ferraco-deploy-vps, cancel-in-progress: true }` (L5-7). Dois pushes seguidos cancelam o primeiro run **a qualquer momento** — inclusive durante `migrate deploy`.

O Postgres executa DDL em transação, então uma migration interrompida faz rollback e não deixa schema parcial. Mas o **processo do workflow** morre no meio: o container pode ficar em estado indeterminado, com o `down` já executado e o `up` nunca alcançado — **aplicação fora do ar sem ninguém observando**.

Dois runs no histórico constam como `cancelled` (12m21s e 11m51s, API do Actions) — **isto já aconteceu**.

**Proposta:** `cancel-in-progress: false` para deploy, enfileirando em vez de cancelar. **Risco:** deploys se acumulam; com build de 6–20 min, a fila cresce. Resolve-se junto com F-66/F-68. **Status:** `AUDITED`

### Seed condicional

O escopo determina: *"Não rode seed automaticamente se seu efeito não estiver confirmado."* **O efeito está confirmado — e é destrutivo.**

[DOCKER-IMAGE-AUDIT.md F-28](DOCKER-IMAGE-AUDIT.md): 14 `deleteMany()` incluindo `lead`, `user` e `team`, sem guarda de `NODE_ENV`. A condição de guarda é `USER_COUNT` via `psql` no `startup.sh`, com `|| echo "0"` — **falha aberta**: `psql` indisponível ⇒ `USER_COUNT=0` ⇒ seed dispara contra banco populado.

**Conclusão desta auditoria:** o seed **não deveria** rodar automaticamente no fluxo de deploy no estado atual. `AUDITED`

### F-71 · Backup existe para uploads e sessions — não para o banco

| Campo | Conteúdo |
|---|---|
| **Evidência** | L334-368: backup de `ferraco-uploads` → `uploads.tar.gz` e `ferraco-sessions` → `sessions.tar.gz`, via container alpine com `:ro`. L374: retenção dos últimos 5. `grep -nE "pg_dump\|postgres-data" workflow` → **`ferraco-postgres-data` aparece apenas em `REQUIRED_VOLUMES` (L313), nunca em rotina de backup** |
| **Achado** | **Correção a [DATABASE-AUDIT.md F-48](DATABASE-AUDIT.md):** aquele documento afirmou ausência total de backup baseando-se em `crontab`, `systemd timers` e `/var/backups`. Estava certo quanto ao **host**, mas incompleto: o workflow **faz** backup de dois volumes a cada deploy. A lacuna é mais específica e igualmente grave — **o banco de dados é o único dado crítico sem backup algum** |
| **Impacto** | Uploads e sessão do WhatsApp são recuperáveis do último deploy. **Leads, usuários, comunicações e todo o histórico não são.** Combinado ao seed destrutivo, uma falha de `psql` no boot apaga 14 tabelas sem recuperação possível |
| **Proposta** | Acrescentar `pg_dump` ao mesmo bloco de backup, com a mesma política de retenção; validar restore |
| **Risco** | `pg_dump` mantém snapshot aberto durante a execução; em base grande, adia autovacuum. Em deploy, o banco já está parado por F-66 — o dump precisaria ocorrer **antes** do `down`, ou com o serviço no ar |
| **Dependências** | Backup no deploy **não substitui** backup periódico: deploys são esporádicos, e um dia sem deploy é um dia sem backup |
| **Teste de aceite** | Dump gerado a cada deploy; restore validado em banco descartável com contagem de linhas conferida |
| **Rollback** | Remover o bloco |
| **Métrica esperada** | `NOT MEASURED` — nenhum backup existe hoje (`ls -dt /root/ferraco-volumes-backup-*` → vazio, esperado: nenhum deploy desde a reinstalação) |
| **Status** | `AUDITED` |

### F-78 · Rollback de código é insuficiente após migration

Item exigido explicitamente pelo escopo.

**Situação:** migrations do Prisma não têm `down`. Se a versão N aplicar uma migration destrutiva — `DROP COLUMN`, mudança de tipo com perda, `NOT NULL` com default — reverter o **código** para N-1 não reverte o **schema**. A aplicação antiga encontra um banco que já não corresponde ao que ela espera.

**Consequências por tipo de migration:**

| Tipo | Rollback de código basta? | Recuperação |
|---|---|---|
| Aditiva (nova coluna nullable, nova tabela) | ✅ Sim — código antigo ignora o que não conhece | Nenhuma ação |
| Aditiva com `NOT NULL` sem default | ❌ Não | Migration compensatória |
| Renomeação de coluna | ❌ Não | Migration compensatória; dados preservados |
| `DROP COLUMN` / `DROP TABLE` | ❌ **Não — dados perdidos** | **Só restauração de backup** |
| Mudança de tipo com truncamento | ❌ **Não — dados perdidos** | **Só restauração de backup** |

**Estratégia de recuperação — inexistente hoje.** Não há backup do banco (F-71), não há imagem anterior (F-67) e não há procedimento documentado. Para os dois últimos casos da tabela, **a recuperação é impossível no estado atual**.

**Proposta:** (1) backup do banco antes de cada migration, com restore validado; (2) política de migrations expansivas — adicionar antes, remover em release posterior, mantendo compatibilidade com a versão anterior; (3) procedimento de recuperação documentado e testado.

**Risco:** migrations expansivas exigem disciplina e duplicam etapas. É o custo de poder reverter.

**Teste de aceite:** simular rollback após migration aditiva (deve funcionar sem restore) e após destrutiva (deve exigir restore, e o restore deve funcionar).

**Status:** `AUDITED`

---

## Parte V — Recursos, disco e recuperação de falha

### Medições disponíveis

| Métrica | Valor | Fonte |
|---|---|---|
| **Duração total do deploy** | 6m22s – 20m01s, mediana ~11 min | API do Actions, 15 runs |
| Runs cancelados no histórico | 2 de 15 | idem |
| Timeout do job | 40 min | workflow L26 |
| Healthcheck: janela máxima | 20 × 5 s = **100 s** | workflow L596-611 |
| `start_period` do container | 60 s | compose |
| **CPU/RAM durante o build** | **`NOT MEASURED`** | Nenhum deploy neste boot |
| **Disco temporário do build** | **`NOT MEASURED`** | idem |
| **Downtime real** | **`NOT MEASURED`** — inferido ≈ duração do build (F-66) | idem |
| Disco livre na VPS | 165 GB, inodes 3% | `df`, `df -i` |

### F-74 · Sem verificação de disco antes do build

O workflow não checa espaço livre antes de construir. Um build que esgote o disco falha no meio, **com a aplicação já derrubada** (F-66) e **sem imagem anterior** (F-67) — indisponibilidade total até intervenção manual.

Hoje o risco é baixo (165 GB livres), mas o host é compartilhado com 4 aplicações que também acumulam imagens.

**Proposta:** verificar espaço mínimo antes do `down` e abortar cedo se insuficiente. **Risco:** nenhum. **Status:** `AUDITED`

### F-73 · `rm -rf` antes de validar

L228-231: `rm -rf "${{ env.APP_DIR }}"` — o código anterior é apagado **antes** da extração do novo. A validação de estrutura (L249) só ocorre **depois**. Se o `tar` estiver corrompido, não há código antigo nem novo no disco.

Mitigado por o código ser reconstruível do Git, mas o padrão correto é extrair em diretório novo, validar e só então trocar (rename atômico) — o que também habilitaria coexistência de releases.

**Status:** `AUDITED`

### Coexistência de releases

**Inexistente.** O modelo é destrutivo: `down` → apaga imagem → apaga diretório → extrai → build → `up`. Não há dois releases no disco simultaneamente, e portanto nenhuma possibilidade de troca rápida ou de retorno imediato.

As aplicações vizinhas mantêm 3–4 tags de imagem por serviço — modelo que permite `docker run` da tag anterior em segundos.

**Status:** `AUDITED`

### Recuperação de falha

| Cenário | Comportamento atual | Avaliação |
|---|---|---|
| Build falha | Workflow falha; **app permanece fora do ar**; sem imagem anterior | ❌ Crítico |
| Healthcheck falha | Mostra logs (L668-672) e falha o deploy (L703); **não restaura nada** | ❌ Sem recuperação automática |
| Migration falha | `db push` como fallback; boot continua | ❌ Mascara o erro |
| Run cancelado | Pode parar entre `down` e `up` | ❌ F-77 |
| Falha de rede no scp | Falha cedo, **antes** do `down` | ✅ Ordem correta |
| Volumes | `down` sem `-v`; comentários explícitos preservando volumes | ✅ **Correto e deliberado** |

**Evidência positiva:** o workflow demonstra cuidado consistente com volumes — `down --remove-orphans` sem `-v`, `volume prune` explicitamente comentado como desabilitado com a justificativa *"remove banco!"*. A preservação de dados foi pensada. O que falta é preservar o **artefato** e a **disponibilidade**.

---

## Matriz de cobertura — inventário → evidência → status

| Item do inventário | Evidência examinada | Cobertura |
|---|---|---|
| BD-01 Gatilho | Workflow L9-12: `push main` + `workflow_dispatch` | `AUDITED` |
| BD-02 Concorrência | L5-7: `cancel-in-progress: true` — **F-77** | `AUDITED` |
| BD-03 Timeout | L26: 40 min | `AUDITED` |
| BD-04 Onde ocorre o build | L387: na VPS, `--no-cache --pull` — F-68 | `AUDITED` |
| BD-05 Registry | Nenhum; GHCR usado pelas vizinhas — Parte III | `AUDITED` · custo `PENDING` |
| BD-06 Autenticação | `sshpass -p` — **F-69**; `StrictHostKeyChecking=no` — **F-70** | `AUDITED` |
| BD-07 Rollback | Imagem destruída antes do build — **F-67**, **F-78** | `AUDITED` |
| BD-08 Duração | 6m22s–20m01s, 15 runs (API do Actions) | `AUDITED` |
| BD-09 Último deploy | 2026-02-06, anterior à reinstalação | `AUDITED` |
| Scripts de deploy | Workflow 824 linhas + `startup.sh` — trace completo na Parte I | `AUDITED` |
| Empacotamento | L86-99: `tar` com exclusões adequadas | `AUDITED` |
| Transferência | L108: `scp` — F-70 | `AUDITED` |
| Extração | L235-237; `rm -rf` prévio — **F-73** | `AUDITED` |
| Validação pré-deploy | L60-75 (runner) e L249-260 (VPS) — cobertura boa | `AUDITED` |
| Build | L387-397 — F-68, F-72 | `AUDITED` |
| Start | L405: `up -d` | `AUDITED` |
| Healthcheck | L596-611: 20×5s, só `/health` — **F-75** | `AUDITED` |
| Readiness | Não distinguido de liveness; `start_period` 60s no compose | `AUDITED` |
| Smoke tests | L753-762: `/health`, landing-page, `/api-docs` — parciais | `AUDITED` |
| Downtime | Inferido ≈ duração do build (F-66) | `AUDITED` (mecanismo) / **`BLOCKED`** (medição) |
| CPU/RAM no build | Nenhum deploy neste boot | **`BLOCKED`** |
| Disco temporário | Idem | **`BLOCKED`** |
| Disco livre (verificação) | Ausente no workflow — **F-74** | `AUDITED` |
| Coexistência de releases | Inexistente | `AUDITED` |
| Referência imutável | `latest` mutável — **F-76** | `AUDITED` |
| Pull autenticado | N/A hoje; `/root/.docker` existe | `AUDITED` |
| Migration como job | Dentro do `startup.sh`; fallback `db push` | `AUDITED` |
| Compatibilidade com versão anterior | Não avaliada; sem coexistência | `AUDITED` |
| Seed condicional | Efeito **confirmado destrutivo** (F-28) | `AUDITED` |
| Backup no deploy | uploads + sessions sim; **Postgres não** — **F-71** | `AUDITED` |
| Retenção de backup | Últimos 5 (L374) | `AUDITED` |
| **Restore validado** | Nunca testado | **`PENDING`** |
| Rollback pós-migration | **F-78** — insuficiente; sem estratégia | `AUDITED` |
| Recuperação de dados | Impossível para migration destrutiva hoje | `AUDITED` |
| Recuperação de falha | Tabela na Parte V | `AUDITED` |
| Custo de CI | Depende do plano da conta | **`PENDING`** |
| Arquitetura de CPU | x86_64 em ambos — compatível | `AUDITED` |
| Emulação / cross-build | Desnecessária | `NOT APPLICABLE` |
| Blue-green / canary | Inexistente; não justificado nesta escala | `NOT APPLICABLE` |
| Múltiplos ambientes (staging) | Inexistente — deploy direto para produção | `NOT APPLICABLE` (ausente) |

---

## Totais de cobertura

| Status | Total |
|---|---|
| **AUDITED** | **32** |
| **PENDING** | **3** |
| **BLOCKED** | **3** |
| **NOT APPLICABLE** | **3** |

**Achados novos:** F-66 a F-78 (13).

### Correção a documento anterior

[DATABASE-AUDIT.md F-48](DATABASE-AUDIT.md) afirmou ausência **total** de backup. Estava correto quanto ao host (`crontab`, timers, `/var/backups`), mas **incompleto**: o workflow faz backup de `ferraco-uploads` e `ferraco-sessions` a cada deploy, com retenção de 5. A lacuna real é mais específica: **o PostgreSQL é o único dado crítico sem backup algum**. Registrado como F-71.

### Ordem de dependência

```
F-66 (downtime) ─┬─ resolvidos juntos por build-no-runner + registry
F-67 (rollback) ─┤
F-68 (cache)    ─┘
F-71 (backup do banco) ──── PRÉ-REQUISITO de F-78 (recuperação pós-migration)
F-75 (smoke tests)     ──── DEPENDE DE remover fallback db push
F-77 (concorrência)    ──── mitigado quando o build sair da VPS
F-69 / F-70 (SSH)      ──── independentes, alta prioridade
```

### Por que a auditoria não está completa

Os 3 `BLOCKED` derivam de **nenhum deploy ter ocorrido neste boot**: CPU/RAM durante o build, disco temporário e downtime real não foram medidos — e não foram estimados. A duração agregada (6–20 min) veio da API do Actions e é o único dado firme.

Os 3 `PENDING` exigem informação externa: custo de CI (depende do plano da conta), validação de restore (nunca testada) e confirmação do plano do GitHub.

**Achado que atravessa esta auditoria:** a sequência `down` → `rmi` → `rm -rf` → `build` → `up` concentra três falhas simultâneas. Durante 6 a 20 minutos, **a aplicação está fora do ar, a imagem anterior não existe mais e o código anterior foi apagado**. Se o build falhar nesse intervalo, não há caminho de volta que não seja outro ciclo completo. É o oposto de um deploy seguro — e explica por que um erro de compilação derruba a produção por dezenas de minutos.

Parei aqui.
