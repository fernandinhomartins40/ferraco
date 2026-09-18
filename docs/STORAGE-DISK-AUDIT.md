# STORAGE-DISK-AUDIT — Ferraco CRM

**Data:** 2026-09-17 · **Etapa:** AUDITORIA (somente análise) · **Host:** `72.60.10.108`
**Base:** [VPS-OPT-INVENTORY.md](VPS-OPT-INVENTORY.md) · [CONTAINER-AUDIT.md](CONTAINER-AUDIT.md) · [RUNTIME-RESOURCE-AUDIT.md](RUNTIME-RESOURCE-AUDIT.md) · [DOCKER-IMAGE-AUDIT.md](DOCKER-IMAGE-AUDIT.md) · [DATABASE-AUDIT.md](DATABASE-AUDIT.md)

**Cobertura:** `AUDITED` (analisado, **não corrigido**) · `PENDING` · `BLOCKED` · `NOT APPLICABLE`
**Métricas:** `NOT MEASURED` onde não há medição. Nenhum valor estimado.

> **Nada foi alterado.** Nenhum prune, nenhuma exclusão de volume, arquivo, imagem ou backup. As medições foram `du`, `df` e `docker volume inspect` — leitura pura.
>
> **Limitação determinante:** os 5 volumes de produção do Ferraco **não existem** (`docker volume ls` sem `ferraco-*`). Tamanho, crescimento e conteúdo são **`BLOCKED`**. Esta auditoria reconcilia o que o código e o compose *declaram* com o que o host mostra, e usa as 4 aplicações vizinhas como referência empírica de ordem de grandeza.

---

## Sumário de achados

| ID | Achado | Severidade | Recurso |
|---|---|---|---|
| **F-56** | **Logs do winston gravam fora do volume — perdidos a cada deploy** | **ALTA** | observabilidade |
| **F-57** | Nomes de arquivo previsíveis (`Date.now()` + `Math.random()`) | **ALTA** | segurança |
| **F-58** | Filtro de upload do WhatsApp **aceita qualquer MIME** apesar da allowlist | **ALTA** | segurança |
| F-59 | SVG aceito e servido estático, com CSP desabilitada — XSS armazenado | **ALTA** | segurança |
| F-60 | `Cache-Control: immutable` sobre `/uploads` não versionado | MÉDIA | correção |
| F-61 | `chmod 777` em `/app/uploads` e `/app/sessions` | MÉDIA | segurança |
| F-62 | `ferraco-data` (V-05): volume sem consumidor identificado | BAIXA | clareza |
| F-63 | Sessão do WhatsApp cresce sem retenção definida | MÉDIA | disco |
| F-64 | Sem limite de cota por volume; disco é recurso compartilhado com 4 apps | MÉDIA | disco |
| F-65 | `deploy-*.tar.gz` versionados no repositório (2,8 MB) | BAIXA | disco |

---

## Parte I — Reconciliação: volume → consumidor → proprietário

Cada volume declarado, confrontado com quem realmente o usa no código.

### V-01 · `ferraco-postgres-data` → `/var/lib/postgresql/data`

| Campo | Conteúdo |
|---|---|
| **Evidência** | [docker-compose.vps.yml L8](../docker-compose.vps.yml); `docker volume ls` — **ausente** |
| **Consumidor** | C-01 `ferraco-postgres`, exclusivo |
| **Proprietário** | usuário `postgres` (UID 70 no alpine), gerenciado pela imagem |
| **Criticidade** | **CRÍTICA** — fonte de verdade do negócio |
| **Classificação de limpeza** | **DADO PERSISTENTE.** Nunca descartável |
| **Tamanho** | `BLOCKED`. **Referência medida** nas vizinhas: 50–92 MB (`digiurban_postgres_data` 92M, `ultrazend-postgres-data` 81M, `aprenderia_postgres_data` 68M, `m2centerauto-postgres-data` 50M) |
| **Crescimento** | Proporcional a leads, comunicações e `AuditLog`. Sem particionamento nem política de expurgo ([DATABASE-AUDIT.md](DATABASE-AUDIT.md)) |
| **Backup** | **NENHUM** — [DATABASE-AUDIT.md F-48](DATABASE-AUDIT.md) confirmou ausência no host inteiro |
| **Status** | `AUDITED` |

### V-02 · `ferraco-uploads` → `/app/uploads`

| Campo | Conteúdo |
|---|---|
| **Evidência** | compose L59; [app.ts:67-70](../apps/backend/src/app.ts#L67) resolve `/app/uploads` em produção; [upload.controller.ts:20](../apps/backend/src/controllers/upload.controller.ts#L20) e [whatsapp.routes.ts:44](../apps/backend/src/routes/whatsapp.routes.ts#L44) gravam via `diskStorage` |
| **Consumidores** | **Dois fluxos distintos:** (a) upload de imagens do CRM — só imagens, 50 MB; (b) mídia do WhatsApp — **todos os tipos**, 100 MB |
| **Proprietário** | `node:node` via `chown` no startup, com `chmod 777` (F-61) |
| **Criticidade** | **CRÍTICA** — arquivos de usuário, insubstituíveis |
| **Classificação de limpeza** | **DADO PERSISTENTE** |
| **Tamanho** | `BLOCKED`. Referência: `m2centerauto-uploads` 16K, `digiurban_messages_uploads` 24K — vizinhas praticamente não usam upload |
| **Crescimento** | **Sem teto.** Mídia do WhatsApp a 100 MB por arquivo é o vetor dominante. Sem expurgo, sem deduplicação |
| **Backup** | **NENHUM** |
| **Status** | `AUDITED` |

### V-03 · `ferraco-sessions` → `/app/sessions`

| Campo | Conteúdo |
|---|---|
| **Evidência** | compose L61; `WHATSAPP_SESSIONS_PATH=/app/sessions`; [whatsappWebJS.service.ts:110](../apps/backend/src/services/whatsappWebJS.service.ts#L110) `LocalAuth({ dataPath })`; [startup.sh](../docker/startup.sh) limpa `SingletonLock`/`SingletonSocket`/`SingletonCookie` |
| **Consumidor** | whatsapp-web.js / Chromium (perfil do navegador) |
| **Proprietário** | `node:node`, `chmod 777` (F-61) |
| **Criticidade** | **ALTA** — perda exige novo pareamento por QR, com interrupção de atendimento |
| **Classificação de limpeza** | **DADO PERSISTENTE** com componente descartável: os arquivos `Singleton*` **são descartáveis confirmados** (o próprio startup os apaga), mas o perfil do Chromium não |
| **Conteúdo** | Perfil completo do Chromium: `IndexedDB`, `Local Storage`, `Cache`, `Service Worker`, `Code Cache` — **mistura credencial de sessão com cache de navegador** |
| **Crescimento** | **F-63** — ver abaixo |
| **Backup** | Nenhum. **Nota:** backup de sessão do WhatsApp é de valor duvidoso — restaurar sessão antiga costuma invalidar o pareamento |
| **Status** | `AUDITED` |

### V-04 · `ferraco-logs` → `/app/logs`

**F-56 · Os logs não chegam neste volume.** Ver Parte II. `AUDITED`

### V-05 · `ferraco-data` → `/app/data`

| Campo | Conteúdo |
|---|---|
| **Evidência** | compose L58; [startup.sh:13-14](../docker/startup.sh#L13) cria e ajusta permissão; [docker/migrate-to-named-volumes.sh:166](../docker/migrate-to-named-volumes.sh#L166) migra conteúdo. **`grep -rn "/app/data" apps/backend/src` → zero ocorrências** |
| **Achado** | **F-62** — nenhum código da aplicação lê ou escreve em `/app/data`. O diretório é criado, tem permissão ajustada, é montado como volume nomeado e migrado por script — mas nenhum consumidor foi identificado. Provável resquício da arquitetura anterior com SQLite (`DATABASE_URL=file:./dev.db`) |
| **Classificação de limpeza** | **USO DESCONHECIDO** — explicitamente **não** classificado como descartável |
| **Proposta** | Investigar no primeiro deploy: montar, operar o sistema e verificar se algo é gravado. Só então decidir |
| **Risco** | **Remover agora seria precipitado.** O script de migração sugere que já houve conteúdo real ali. Ausência de referência numa busca **não prova** ausência de uso — pode ser gravado por biblioteca, por caminho construído dinamicamente ou por operação manual |
| **Teste de aceite** | Após 30 dias de operação, `ls -la /app/data` permanece vazio |
| **Rollback** | Manter o volume declarado custa ~0 |
| **Métrica esperada** | `NOT MEASURED` |
| **Status** | `PENDING` |

### V-06 · Volumes de desenvolvimento

`backend-data`, `whatsapp-sessions`, `whatsapp-tokens` ([docker-compose.yml](../docker-compose.yml)) — ambiente local, não existem na VPS. `NOT APPLICABLE` para o consumo da VPS.

### Bind mounts

**Produção:** nenhum. Os 5 volumes são **nomeados** — decisão correta, documentada em [MIGRACAO-NAMED-VOLUMES.md](../MIGRACAO-NAMED-VOLUMES.md). Named volumes sobrevivem a `docker compose down` e não dependem de caminho do host. **Evidência positiva.**

**Desenvolvimento:** `./apps/backend:/app` + `/app/node_modules` (anonymous volume para preservar os módulos do container). Padrão correto para hot-reload. `AUDITED`

---

## Parte II — F-56: os logs não vão para o volume

| Campo | Conteúdo |
|---|---|
| **Evidência** | [logger.ts:41-53](../apps/backend/src/utils/logger.ts#L41): `filename: 'logs/error.log'` e `'logs/combined.log'` — **caminhos relativos**. [startup.sh:108](../docker/startup.sh#L108): `cd /app/backend` antes de iniciar o Node. Compose L60: volume montado em **`/app/logs`** |
| **Ambiente** | produção (`NODE_ENV === 'production'` é a condição que ativa os transports de arquivo) |
| **Achado** | O CWD do processo é `/app/backend`, então o winston grava em **`/app/backend/logs/`**. O volume está montado em **`/app/logs`**. São diretórios diferentes: os logs de aplicação são escritos na **camada de escrita do container**, não no volume |
| **Impacto** | **(1) Perda de observabilidade** — a cada `docker compose up -d --build`, o container é recriado e todo o histórico de log desaparece. Justamente quando se quer investigar o deploy anterior. **(2) Crescimento na camada do container**, que não tem cota. **(3) O volume `ferraco-logs` permanece vazio**, dando falsa sensação de que há retenção configurada |
| **Nuance positiva** | O winston **tem** rotação declarada: `maxsize: 5242880` (5 MB) e `maxFiles: 5` por transport → teto de ~50 MB para os dois arquivos. Isso é melhor que o `json-file` do Docker sem rotação ([CONTAINER-AUDIT.md F-04](CONTAINER-AUDIT.md)). O problema é o **destino**, não a política |
| **Proposta** | Usar caminho absoluto (`/app/logs/error.log`), ou definir o destino por variável de ambiente. Tratar também o log do nginx do container, que grava em `/var/log/nginx/` — igualmente **fora** de qualquer volume, e **sem** logrotate dentro do container |
| **Risco** | Baixo. Após a correção, o volume passa a crescer de fato — daí a importância de a rotação já existir |
| **Dependências** | Relaciona-se a F-04 (rotação do `json-file`), que é camada distinta: `json-file` captura stdout/stderr; o winston grava arquivos próprios. **As duas precisam de política** |
| **Teste de aceite** | Após deploy, `docker exec ... ls -la /app/logs` mostra os arquivos; sobrevivem a um recreate do container; rotação atua ao passar de 5 MB |
| **Rollback** | Restaurar o caminho relativo |
| **Métrica esperada** | `NOT MEASURED` |
| **Status** | `AUDITED` |

---

## Parte III — Uploads: segurança antes de arquitetura

O escopo condiciona a proposta de "local + proxy" a preservar autenticação, nomes seguros, validação e backup. **Três das quatro condições falham hoje.**

### F-57 · Nomes de arquivo previsíveis

| Campo | Conteúdo |
|---|---|
| **Evidência** | [upload.controller.ts:25-29](../apps/backend/src/controllers/upload.controller.ts#L25): `` `${file.fieldname}-${Date.now()}-${Math.round(Math.random()*1e9)}${ext}` ``. [whatsapp.routes.ts:48-53](../apps/backend/src/routes/whatsapp.routes.ts#L48): mesmo padrão com `baseName` sanitizado |
| **Achado** | O nome combina `Date.now()` (milissegundo, conhecido aproximadamente por quem faz o upload ou observa o sistema) com `Math.random()` — **PRNG não criptográfico**. `Math.random()` não é imprevisível e o V8 não o trata como fonte de segurança. O espaço é 1e9 por milissegundo |
| **Impacto** | Combinado com **F-07** (`/uploads` servido por `express.static` **sem autenticação**), o nome do arquivo **é** o controle de acesso. Nome adivinhável = documento de lead acessível por terceiros. Não é vulnerabilidade teórica: é enumeração viável |
| **Proposta** | `crypto.randomUUID()` ou `crypto.randomBytes(16).toString('hex')` — **e**, independentemente disso, corrigir F-07, porque segurança por obscuridade de nome não é controle de acesso aceitável para dado de cliente |
| **Risco** | Baixo. Arquivos já existentes mantêm os nomes antigos; a mudança vale para novos |
| **Dependências** | **Não substitui F-07.** São camadas complementares |
| **Teste de aceite** | Nomes gerados não são deriváveis de timestamp; upload e leitura seguem funcionando |
| **Rollback** | Reverter a função `filename` |
| **Métrica esperada** | `NOT MEASURED` (segurança) |
| **Status** | `AUDITED` |

### F-58 · O filtro do WhatsApp aceita tudo

| Campo | Conteúdo |
|---|---|
| **Evidência** | [whatsapp.routes.ts:56-85](../apps/backend/src/routes/whatsapp.routes.ts#L56): define `allowedTypes` com ~30 MIME types; ao final: `else { logger.warn(...); cb(null, true); // Aceitar mesmo assim (WhatsApp valida depois) }` |
| **Achado** | A allowlist é **decorativa**: o `else` aceita o arquivo de qualquer forma. Qualquer MIME type passa — executáveis, scripts, HTML. O comentário delega a validação ao WhatsApp, mas **o arquivo já foi gravado no volume da VPS** antes de qualquer validação externa |
| **Impacto** | Gravação irrestrita de conteúdo arbitrário, até 100 MB por arquivo, em disco compartilhado com 4 outras aplicações. Combinado a F-07 (servido sem autenticação) e F-57 (nome previsível), a VPS pode ser usada para hospedar e distribuir conteúdo arbitrário |
| **Proposta** | Rejeitar o que não está na allowlist (`cb(new Error(...))`). Se a intenção for permissividade deliberada, validar por **conteúdo** (magic bytes), não por MIME declarado pelo cliente — que é trivialmente forjável |
| **Risco** | Médio: pode rejeitar tipos legítimos hoje aceitos. Exige inventariar o que os usuários realmente enviam |
| **Dependências** | Interage com F-07 e F-59 |
| **Teste de aceite** | Upload de tipo fora da allowlist retorna erro claro; tipos legítimos continuam funcionando |
| **Rollback** | Restaurar `cb(null, true)` |
| **Métrica esperada** | `NOT MEASURED` |
| **Status** | `AUDITED` |

### F-59 · SVG + CSP desabilitada + servido estático

| Campo | Conteúdo |
|---|---|
| **Evidência** | [upload.controller.ts:33](../apps/backend/src/controllers/upload.controller.ts#L33): `'image/svg+xml'` na allowlist do CRM. [app.ts:55](../apps/backend/src/app.ts#L55): `contentSecurityPolicy: false` no helmet, com o comentário *"Desabilita CSP para permitir Swagger UI"*. [app.ts:70](../apps/backend/src/app.ts#L70): `express.static` sem `Content-Disposition` nem `X-Content-Type-Options` |
| **Achado** | SVG é XML e **pode conter `<script>`**. Servido pela mesma origem da aplicação, com CSP desabilitada e sem `X-Content-Type-Options: nosniff`, um SVG malicioso executa JavaScript **no contexto do domínio da aplicação** ao ser aberto. Acesso a `localStorage`, cookies e à sessão do usuário |
| **Impacto** | XSS armazenado. O CRM autentica por JWT — o vetor é direto |
| **Proposta** | Três camadas: (1) remover SVG da allowlist, ou sanitizar o conteúdo; (2) servir uploads com `Content-Disposition: attachment` e `X-Content-Type-Options: nosniff`; (3) reativar CSP e restringir Swagger por rota, em vez de desabilitar globalmente — o que também mitiga [CONTAINER-AUDIT.md F-06](CONTAINER-AUDIT.md) |
| **Risco** | Remover SVG quebra logos vetoriais na landing page — verificar se há uso legítimo. `attachment` muda o comportamento de exibição inline de imagens: precisa de rota separada para preview |
| **Dependências** | F-07 (autenticação), F-58 (validação) |
| **Teste de aceite** | SVG com `<script>` não executa ao ser acessado; imagens legítimas continuam exibindo |
| **Rollback** | Reverter por camada |
| **Métrica esperada** | `NOT MEASURED` |
| **Status** | `AUDITED` |

### F-60 · `immutable` sobre conteúdo não versionado

| Campo | Conteúdo |
|---|---|
| **Evidência** | [docker/nginx.conf](../docker/nginx.conf) — bloco `location /uploads`: `expires 1y; add_header Cache-Control "public, immutable";` |
| **Achado** | O escopo é explícito: *"Cache immutable apenas para conteúdo versionado que não muda na mesma URL"*. Os uploads **não são versionados** — a URL é `/uploads/<nome>`. Se um arquivo for substituído mantendo o nome, navegadores e proxies servirão a versão antiga por **até um ano**, sem revalidar |
| **Impacto** | Conteúdo desatualizado sem caminho de correção do lado do servidor. Agravante: `public` autoriza caches **compartilhados** (CDN, proxy corporativo) a reter arquivos que podem ser privados — dado de lead cacheado em infraestrutura de terceiros |
| **Distinção importante** | O mesmo padrão aplicado aos **assets do frontend** (`location ~* \.(js|css|...)$`) **está correto**: o Vite gera nomes com hash de conteúdo, então são genuinamente imutáveis. O erro está apenas em `/uploads` |
| **Proposta** | Para `/uploads`: `Cache-Control: private, max-age=<curto>` com validação por `ETag`; `immutable` só se os nomes passarem a conter hash de conteúdo |
| **Risco** | Aumenta requisições ao backend para imagens. Mitigável com `ETag`/`If-None-Match` (304) |
| **Dependências** | Se F-07 for corrigido (uploads autenticados), `public` torna-se incorreto por definição |
| **Teste de aceite** | Substituir arquivo mantendo o nome reflete a mudança sem limpar cache do navegador |
| **Rollback** | Restaurar o bloco |
| **Métrica esperada** | `NOT MEASURED` |
| **Status** | `AUDITED` |

### F-61 · `chmod 777`

[startup.sh](../docker/startup.sh) aplica `chmod 777` a `/app/uploads` e `/app/sessions`. Como o container roda com `USER root` e o backend faz `su node`, a permissão correta seria `750` com `chown node:node` — já feito logo em seguida no mesmo script. O `777` é redundante e concede escrita a qualquer usuário do container, incluindo processos do Chromium.

**Proposta:** `chmod 750` após o `chown`. **Risco:** baixo; se algum processo rodar com outro UID, falha de escrita aparece imediatamente. **Status:** `AUDITED`

---

## Parte IV — Local vs MinIO vs S3

Comparação por **requisitos**, não por volume de dados — conforme o escopo determina.

| Requisito | Estado atual do Ferraco | Local (atual) | MinIO (self-hosted) | S3 / compatível |
|---|---|---|---|---|
| **Múltiplas instâncias da API** | Instância única; sem lock distribuído ([CONTAINER-AUDIT.md §3](CONTAINER-AUDIT.md)) | ❌ Impede escalar | ✅ | ✅ |
| **Disponibilidade** | Container único; sem HA | = disponibilidade do container | + 1 serviço a manter | ✅ Gerenciado |
| **Acesso privado** | ❌ **Falha hoje** (F-07) | Exige rota autenticada | ✅ Nativo | ✅ Nativo |
| **URLs assinadas** | ❌ Inexistentes | Implementação própria | ✅ Nativo | ✅ Nativo |
| **Backup/restore** | ❌ **Nenhum** | `tar` do volume | Replicação/versionamento | ✅ Versionamento nativo |
| **Portabilidade** | Acoplado ao host | ❌ | ✅ API S3 | ✅ |
| **Custo** | Incluso na VPS | Menor | + RAM/CPU/disco na mesma VPS | Recorrente, por uso |
| **Complexidade operacional** | Mínima | Menor | **Maior** — 1 container, credenciais, backup próprio | Média |

### Recomendação — e por que não é MinIO

**Manter armazenamento local**, com as correções de segurança. Fundamentos:

1. **MinIO na mesma VPS não resolve o problema central.** Se o objetivo é durabilidade, MinIO no mesmo disco tem exatamente o mesmo ponto único de falha. Adiciona um container, consumo de RAM ([RUNTIME-RESOURCE-AUDIT.md](RUNTIME-RESOURCE-AUDIT.md) mostra o host com folga, mas não é de graça) e mais um serviço sem backup.
2. **O requisito que justificaria object storage — múltiplas instâncias — não existe.** A aplicação é instância única por decisão arquitetural (sessão WhatsApp em disco, locks in-process).
3. **Os problemas reais não são de tecnologia de storage.** Acesso privado (F-07), nomes seguros (F-57), validação (F-58) e backup (F-48) são falhas que **persistiriam** numa migração para MinIO mal configurado — e que se resolvem no arranjo atual.
4. **S3 gerenciado é a opção correta se e quando** houver requisito de durabilidade off-site ou múltiplas instâncias. Aí o ganho é real: versionamento, replicação e URLs assinadas nativas.

**Condição do escopo para "local + proxy" — situação atual:**

| Condição | Estado |
|---|---|
| Autenticação de arquivos privados | ❌ **F-07** |
| Nomes seguros | ❌ **F-57** |
| Permissões | ⚠️ **F-61** |
| Validação de uploads | ❌ **F-58**, ⚠️ **F-59** |
| Backup | ❌ **F-48** |

**Nenhuma das cinco está satisfeita.** A recomendação de manter local é condicionada a corrigi-las — não é aprovação do estado atual.

**Status:** `AUDITED`

### Next/image

**`NOT APPLICABLE`** — não há Next.js. Confirmado em [DOCKER-IMAGE-AUDIT.md](DOCKER-IMAGE-AUDIT.md): o frontend é Vite + React. Não existe cache de otimização de imagem do Next a mapear. O processamento de imagem é feito por Sharp **no upload** ([upload.controller.ts:216](../apps/backend/src/controllers/upload.controller.ts#L216)), gravando o resultado — não é cache, é o próprio artefato.

---

## Parte V — Disco do host: medições

### M-15 · Ocupação (2026-09-17)

| Item | Tamanho |
|---|---|
| `/` total | 194 GB (29 GB usados, **165 GB livres**, 15%) |
| **`/var/lib/docker` total** | **8,8 GB** |
| `/var/lib/docker/volumes` | **294 MB** |
| `/var/lib/docker/image` | 84 KB |
| `/var/log` (host) | 107 MB |
| journald | 64 MB |
| `/tmp` | 428 KB |
| **Inodes** | 601.757 de 25.804.800 — **3%** |

**Observação:** `docker system df` reporta 19,79 GB em imagens, mas `du` do diretório mostra 8,8 GB. A diferença é **camadas compartilhadas contadas uma vez em disco e múltiplas vezes no somatório lógico** — exatamente a distinção que o escopo pede. **O disco real ocupado pelo Docker é 8,8 GB, não 19,79 GB.**

### M-16 · Volumes por tamanho real (`du` no mountpoint)

| Volume | Tamanho | Classificação |
|---|---|---|
| `digiurban_postgres_data` | 92 MB | dado persistente |
| `ultrazend-postgres-data` | 81 MB | dado persistente |
| `aprenderia_postgres_data` | 68 MB | dado persistente |
| `m2centerauto-postgres-data` | 50 MB | dado persistente |
| `digiurban_digiurban_logs` | 3,7 MB | retenção a definir |
| `digiurban_messages_logs` | 388 KB | retenção a definir |
| `digiurban_messages_uploads` | 24 KB | dado persistente |
| `m2centerauto-uploads` | 16 KB | dado persistente |
| `aprenderia_notification_media` | 16 KB | dado persistente |
| 8 volumes restantes | 4–8 KB | vazios ou mínimos |
| **Total** | **294 MB** | |

**Leitura:** os volumes **não são** o consumo de disco desta VPS. 294 MB contra 8,8 GB de imagens e camadas. O desperdício está em imagens e build cache, não em dados.

### Classificação dos candidatos a limpeza — nenhuma executada

| Item | Tamanho | Classificação | Ação |
|---|---|---|---|
| Imagens sem container | 9,22 GB (lógico) | **Retenção vencida** — parcialmente | Política de retenção, não prune avulso |
| Tags de `m2centerauto` (3–4 por serviço) | — | **NECESSÁRIO AO ROLLBACK** | **Não tocar** |
| 14 tags de `aprenderia-web` | ~512 MB únicos cada | Retenção vencida **provável** | Decisão do dono da aplicação, não desta auditoria |
| Build cache | 5,73 GB (1,99 recuperável) | **Descartável confirmado** | Reconstruível; limpeza segura quando necessário |
| `aprenderia-media-init` (Exited 0) | — | **Descartável confirmado** — job concluído | Sem urgência |
| Volumes com 4–8 KB | — | **USO DESCONHECIDO** | Não classificar como descartável |
| `deploy-fix.tar.gz`, `deploy-manual.tar.gz` | 2,8 MB no repositório | **Retenção vencida** (F-65) | Artefatos de deploy manual, versionados no Git |
| `/var/log` do host, journald | 171 MB | Sob logrotate/journald | Gerenciado |
| **Backups** | **Não existem** | — | O escopo veda reduzir backup sem política demonstrada. **Não há o que reduzir** |

**Nenhuma limpeza foi executada.** O host tem 165 GB livres e 3% de inodes: **não há urgência de disco**. O desperdício é real mas não é risco operacional hoje.

### F-63 · Crescimento da sessão do WhatsApp

O diretório `LocalAuth` contém o perfil completo do Chromium, incluindo `Cache`, `Code Cache` e `Service Worker` — que crescem com o uso e **não são credenciais**. Sem retenção definida, o volume acumula cache de navegador indefinidamente.

**Proposta:** avaliar limpeza periódica dos subdiretórios de cache do perfil, **preservando** os arquivos de autenticação. **Risco: alto se feito sem cuidado** — apagar o diretório errado invalida a sessão e exige novo QR, interrompendo atendimento. Exige identificar com precisão quais subdiretórios são descartáveis. **Classificação: dado persistente com componente descartável não delimitado.** **Status:** `PENDING` — requer inspeção do conteúdo real, indisponível.

### F-64 · Sem cota por volume

Nenhum volume tem limite de tamanho. Um upload descontrolado (F-58: qualquer tipo, 100 MB) ou log sem rotação pode consumir os 165 GB e **afetar as 4 aplicações vizinhas**, que compartilham `/dev/sda1`. Não há isolamento de disco entre aplicações.

**Proposta:** monitoramento de disco com alerta, já que cota por volume no driver `local` não é trivial. **Status:** `AUDITED`

---

## Matriz de cobertura — inventário → evidência → status

| Item do inventário | Evidência examinada | Cobertura |
|---|---|---|
| V-01 `ferraco-postgres-data` | compose L8; `docker volume ls`; M-16 (referência vizinhas) | `AUDITED` (config) / `BLOCKED` (tamanho) |
| V-02 `ferraco-uploads` | compose L59; app.ts:67-70; 2 fluxos de upload; F-57..F-61 | `AUDITED` (config) / `BLOCKED` (tamanho) |
| V-03 `ferraco-sessions` | compose L61; whatsappWebJS.service.ts:110; startup.sh | `AUDITED` / F-63 `PENDING` |
| V-04 `ferraco-logs` | compose L60; **logger.ts:41-53 — F-56** | `AUDITED` |
| V-05 `ferraco-data` | compose L58; startup.sh:13; grep sem consumidor — **F-62** | **`PENDING`** |
| V-06 volumes de dev | docker-compose.yml | `NOT APPLICABLE` |
| Bind mounts (produção) | Nenhum — só named volumes | `AUDITED` |
| Bind mounts (dev) | `./apps/backend:/app` + anonymous `/app/node_modules` | `AUDITED` |
| Uploads — nomeação | upload.controller.ts:25; whatsapp.routes.ts:48 — **F-57** | `AUDITED` |
| Uploads — validação | whatsapp.routes.ts:56-85 — **F-58**; SVG — **F-59** | `AUDITED` |
| Uploads — permissões | startup.sh `chmod 777` — **F-61** | `AUDITED` |
| Uploads — autenticação | app.ts:70 `express.static` — **F-07** (CONTAINER-AUDIT) | `AUDITED` |
| Uploads — backup | Nenhum ([DATABASE-AUDIT.md F-48](DATABASE-AUDIT.md)) | `AUDITED` |
| Artefatos de build | `dist/` dentro da imagem, não em volume | `AUDITED` |
| Logs de aplicação | winston, rotação 5MB×5 — destino errado (F-56) | `AUDITED` |
| Logs do nginx (container) | `/var/log/nginx/`, **fora de volume, sem logrotate** | `AUDITED` |
| Logs do Docker (`json-file`) | Sem rotação declarada ([CONTAINER-AUDIT.md F-04](CONTAINER-AUDIT.md)) | `AUDITED` |
| Temporários | `/tmp` do host: 428 KB. Multer usa `diskStorage` no destino final | `AUDITED` |
| Cache de imagens (Next/image) | **Next.js inexistente** | `NOT APPLICABLE` |
| Cache de build do Docker | 5,73 GB, 1,99 recuperável — descartável confirmado | `AUDITED` |
| Cache HTTP (`immutable`) | nginx.conf — **F-60** em `/uploads`; correto nos assets | `AUDITED` |
| Cache de aplicação | `statsCache` em memória, não em disco | `NOT APPLICABLE` (disco) |
| Dumps | **Nenhum existe** — `crontab`, timers e `/var/backups` verificados | `AUDITED` |
| Snapshots | Nenhum mecanismo (LVM/ZFS/provedor) identificado | **`PENDING`** |
| Tamanho dos volumes do Ferraco | Volumes não existem | **`BLOCKED`** |
| Crescimento real | Idem | **`BLOCKED`** |
| Conteúdo de `ferraco-sessions` | Idem — F-63 | **`BLOCKED`** |
| Disco do host | M-15: 8,8 GB Docker, 294 MB volumes, 3% inodes | `AUDITED` |
| Tamanho individual vs compartilhado | M-15: 19,79 GB lógico vs 8,8 GB real | `AUDITED` |
| Espaço recuperável | 9,22 GB imagens + 1,99 GB cache; **nada removido** | `AUDITED` |
| Imagens de rollback | Identificadas e **preservadas** | `AUDITED` |
| MinIO | Ausente; comparado por requisitos na Parte IV | `NOT APPLICABLE` (ausente) / `AUDITED` (avaliação) |
| S3 | Ausente; avaliado | `NOT APPLICABLE` / `AUDITED` |
| URLs assinadas | Inexistentes | `AUDITED` |
| `deploy-*.tar.gz` | 2,8 MB versionados — F-65 | `AUDITED` |

---

## Totais de cobertura

| Status | Total |
|---|---|
| **AUDITED** | **27** |
| **PENDING** | **3** |
| **BLOCKED** | **4** |
| **NOT APPLICABLE** | **5** |

**Achados novos:** F-56 a F-65 (10). **Medições novas:** M-15, M-16.

### Ordem de dependência

```
F-07 (autenticar /uploads) ──┬── F-57 (nomes seguros) ── camadas complementares
                             ├── F-59 (SVG/CSP)
                             └── F-60 (public/immutable vira incorreto)
F-58 (validação)           ──── independente
F-56 (destino dos logs)    ──── independente, baixo risco
F-48 (backup)              ──── pré-requisito para confiar em storage local
```

### Por que a auditoria não está completa

Os 4 `BLOCKED` derivam do mesmo fato: **os volumes do Ferraco não existem**. Sem eles não há tamanho, crescimento nem conteúdo — e nenhum valor foi estimado. Usei as vizinhas apenas como ordem de grandeza, sempre identificada como tal.

Os 3 `PENDING` exigem observação: `ferraco-data` (consumidor não identificado), o componente descartável da sessão WhatsApp, e a existência de snapshots no nível do provedor — que não é verificável de dentro da VPS.

**Achado que atravessa esta auditoria:** a decisão "local vs object storage" **não é o problema**. As cinco condições que o próprio escopo exige para aprovar armazenamento local — autenticação, nomes seguros, permissões, validação, backup — **falham todas hoje**. Migrar para MinIO sem corrigi-las reproduziria os mesmos defeitos com mais um serviço para manter. Recomendo corrigir as condições e permanecer local; reavaliar object storage apenas se surgir requisito de múltiplas instâncias ou durabilidade off-site.

Parei aqui.
