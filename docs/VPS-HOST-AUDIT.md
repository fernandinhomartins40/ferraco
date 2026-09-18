# VPS-HOST-AUDIT — Ferraco CRM

**Data:** 2026-09-17 · **Etapa:** AUDITORIA (somente leitura) · **Host:** `72.60.10.108` (`srv953800`)
**Base:** [VPS-OPT-INVENTORY.md](VPS-OPT-INVENTORY.md) · [VPS-OPT-BASELINE.md](VPS-OPT-BASELINE.md) · [CONTAINER-AUDIT.md](CONTAINER-AUDIT.md) · [RUNTIME-RESOURCE-AUDIT.md](RUNTIME-RESOURCE-AUDIT.md) · [DOCKER-IMAGE-AUDIT.md](DOCKER-IMAGE-AUDIT.md) · [DATABASE-AUDIT.md](DATABASE-AUDIT.md) · [STORAGE-DISK-AUDIT.md](STORAGE-DISK-AUDIT.md) · [DEPLOY-CICD-AUDIT.md](DEPLOY-CICD-AUDIT.md) · [APPLICATION-RUNTIME-AUDIT.md](APPLICATION-RUNTIME-AUDIT.md)

**Cobertura:** `AUDITED` (analisado, **não corrigido**) · `PENDING` · `BLOCKED` · `NOT APPLICABLE`
**Métricas:** `NOT MEASURED` onde não há medição. Nenhum valor estimado.

> **Nada foi alterado.** Nenhum `sysctl`, kernel, firewall ou serviço tocado. Nenhum controle de segurança ou monitoramento desabilitado. Todas as coletas foram leituras de `/proc`, `/sys`, `systemctl status` e `vmstat` — impacto desprezível.

---

## Sumário de achados

| ID | Achado | Severidade | Recurso |
|---|---|---|---|
| **F-91** | **Cargas fora do Docker não contabilizadas em nenhuma auditoria anterior** | **ALTA** | RAM, CPU |
| **F-92** | **Nenhum certificado TLS para o domínio do Ferraco** | **ALTA** | segurança, deploy |
| F-93 | Steal de CPU persistente (~2,08% acumulado) — contenção do provedor | MÉDIA | CPU |
| F-94 | `Committed_AS` (6,2 GiB) já excede 63% do `CommitLimit` | MÉDIA | RAM |
| F-95 | Firewall inativo — todas as portas publicadas expostas | **ALTA** | segurança |
| F-96 | `ulimit -n` = 1024 para processos de shell | MÉDIA | conexões |
| F-97 | Runner do GitHub Actions self-hosted residente (148 MiB) | BAIXA | RAM |
| F-98 | Swap de 2 GiB com `swappiness=60` — subdimensionada para 16 GiB | BAIXA | I/O |
| F-99 | Sem observabilidade de séries temporais | MÉDIA | diagnóstico |

---

## Parte I — Capacidade real e o que ninguém contou

### M-17 · Memória (`/proc/meminfo`, 2026-09-17)

| Campo | Valor | Interpretação |
|---|---|---|
| `MemTotal` | 16.372.036 kB = **15,61 GiB** | Capacidade física |
| `MemFree` | 966.308 kB = 921 MiB | **Não é a métrica de pressão** |
| `Buffers` | 768.500 kB = 750 MiB | Cache recuperável |
| `Cached` | 11.510.424 kB = **10,98 GiB** | Cache recuperável |
| **`MemAvailable`** | **14.159.408 kB = 13,50 GiB** | **Métrica correta: 86,5% livre** |
| `SwapTotal` / `SwapFree` | 2.097.148 / 2.095.868 kB | **1,25 MiB em uso — praticamente zero** |
| `Dirty` | 920 kB | Páginas sujas irrelevantes |
| `CommitLimit` | 10.283.164 kB = 9,81 GiB | Teto de overcommit heurístico |
| `Committed_AS` | 6.497.648 kB = **6,20 GiB** | **F-94** |

### F-91 · Cargas fora do Docker — lacuna das auditorias anteriores

| Campo | Conteúdo |
|---|---|
| **Evidência** | `ps -eo pid,rss,pcpu,args --sort=-rss` · 2026-09-17 |
| **Achado** | Todas as auditorias anteriores contabilizaram **apenas containers** (17 ativos, ~1,3 GiB via `memory.current`). Existem cargas relevantes **fora** do Docker: |

| Processo | RSS | %CPU | Natureza |
|---|---|---|---|
| `dockerd` | 217 MiB | 1,1% | daemon (esperado) |
| **`next-server (v15.5.25)`** | **180 MiB** | 0,1% | **Next.js fora de container** |
| **`next-server (v14.2.32)`** | **164 MiB** | 0,1% | **Next.js fora de container, outra versão** |
| **`Runner.Listener`** | **148 MiB** | 0,0% | GitHub Actions self-hosted (F-97) |
| **`uvicorn app.main:app --port 8000`** | **138 MiB** | 0,1% | **Python/FastAPI fora de container** |
| `RunnerService.js` | 40 MiB | 0,0% | auxiliar do runner |

| Campo | Conteúdo |
|---|---|
| **Impacto** | **~670 MiB de RSS não contabilizados.** Mais relevante que o número: **a premissa de que "tudo roda em container com limite" é falsa**. Esses processos não têm `mem_limit`, não aparecem em `docker stats` e não estão sujeitos a nenhum cgroup de aplicação. Dois `next-server` de versões diferentes (14 e 15) sugerem serviços legados ou em transição. O `uvicorn` na porta 8000 não apareceu em `ss -tlnp` como porta pública — provavelmente bind interno ou já contabilizado como `m2centerauto-alpr` (que expõe 8000 no container), o que exige distinção |
| **Proposta** | Inventariar esses processos: identificar dono, propósito e se ainda são necessários. **Não proponho parar nenhum** — pertencem a outras aplicações e podem estar em uso |
| **Risco** | Parar processo desconhecido pode derrubar aplicação de terceiro no mesmo host |
| **Dependências** | Requer conhecimento do dono sobre quais aplicações rodam fora do Docker |
| **Teste de aceite** | Cada processo mapeado a uma aplicação e a um propósito documentado |
| **Rollback** | N/A (nenhuma ação) |
| **Métrica esperada** | `NOT MEASURED` |
| **Status** | **`PENDING`** — identificação dos serviços exige informação do dono |

### F-94 · `Committed_AS` em 63% do `CommitLimit`

`Committed_AS` = 6,20 GiB · `CommitLimit` = 9,81 GiB · `overcommit_memory` = **0** (heurístico)

Com o modo heurístico, o kernel não recusa alocações por esse teto — ele é indicativo. Mas o dado é útil: **6,20 GiB já estão comprometidos** (reservados por processos, ainda que não residentes), contra 1,3 GiB de containers + 670 MiB fora do Docker ≈ 2 GiB de RSS real. A diferença é reserva virtual não tocada.

**Relevância para o Ferraco:** ao subir, ele adicionará compromisso — e o Chromium é reconhecidamente generoso em reserva virtual. Não é motivo de alarme com `overcommit_memory=0`, mas é o indicador a observar caso surjam falhas de alocação.

**Proposta:** monitorar, não ajustar. **Não recomendo alterar `overcommit_memory`** — mudá-lo para modo estrito (2) poderia causar falhas de alocação nas aplicações vizinhas. **Status:** `AUDITED`

---

## Parte II — CPU: série temporal e atribuição de causa

O escopo é explícito: *"Uma amostra de steal não basta para atribuir causa; registre série/contexto."*

### M-18 · Série temporal (`vmstat`, duas coletas independentes)

**Série A — 10 amostras × 3 s:**

| # | us | sy | id | wa | **st** |
|---|---|---|---|---|---|
| 1 | 1 | 1 | 96 | 0 | **2** |
| 2 | 2 | 1 | 96 | 0 | **1** |
| 3 | 1 | 1 | 97 | 0 | **1** |
| 4 | 1 | 1 | 96 | 0 | **2** |
| 5 | 2 | 2 | 94 | 0 | **3** |
| 6 | 0 | 0 | 99 | 0 | **1** |
| 7 | 1 | 1 | 97 | 0 | **1** |
| 8 | 0 | 0 | 98 | 0 | **1** |
| 9 | 1 | 1 | 98 | 0 | **1** |
| 10 | 0 | 0 | 97 | 0 | **2** |

**Série B — 5 amostras × 2 s (coleta separada):** st = 2, 1, 1, 0, 1

### M-19 · Steal acumulado desde o boot (`/proc/stat`)

```
cpu  1173935 12362 851911 92986330 97007 0 146970 2014222 0 0
     user    nice  system idle     iowait irq sirq  STEAL
```

| Métrica | Ticks | % do total |
|---|---|---|
| user | 1.173.935 | 1,21% |
| system | 851.911 | 0,88% |
| idle | 92.986.330 | **95,9%** |
| iowait | 97.007 | 0,10% |
| softirq | 146.970 | 0,15% |
| **steal** | **2.014.222** | **2,08%** |
| **Total** | 96.982.746 | — |

**Contexto de virtualização:** `systemd-detect-virt` = **kvm** · CPU física: **AMD EPYC 9354P 32-Core** · 4 vCPU alocados.

### F-93 · Steal persistente — contenção do provedor, não saturação local

| Campo | Conteúdo |
|---|---|
| **Evidência** | M-18 (duas séries independentes, 15 amostras) + M-19 (acumulado desde 2026-09-14) |
| **Achado** | O steal **não é uma amostra isolada**: aparece em 15 de 15 amostras, e o acumulado desde o boot é 2,08% — **maior que user (1,21%) e que system (0,88%) somados**. A VPS gasta mais tempo esperando o hipervisor do que executando trabalho próprio |
| **Atribuição de causa — as três hipóteses do escopo** | **(1) Saturação da aplicação:** ❌ descartada. `us`+`sy` ≤ 4% em toda a série; `r` (runqueue) = 0–1 com 4 vCPU. **(2) Concorrência entre clientes locais:** ❌ descartada. Não há disputa interna: idle 95,9%, iowait 0,10%. **(3) Contenção do provedor:** ✅ **é a explicação consistente.** Steal é, por definição, tempo em que a vCPU estava pronta e o hipervisor a alocou a outro hóspede. Com o host local ocioso, a causa está fora dele |
| **Impacto** | 2,08% é **baixo em termos absolutos** e não explica nenhum incidente. Mas é o piso: sob carga real, a contenção tende a se manifestar mais, porque a demanda coincide com a de outros hóspedes. Interage com [RUNTIME-RESOURCE-AUDIT.md F-19](RUNTIME-RESOURCE-AUDIT.md): containers com `cpus` apertado já sofrem throttling do CFS; somando steal do hipervisor, a latência efetiva em rajadas é pior do que a média sugere |
| **Proposta** | **Registrar e monitorar, não agir agora.** 2% não justifica contato com provedor nem migração. Se subir consistentemente acima de ~10% sob carga, aí sim: abrir chamado com a série temporal como evidência, ou considerar plano com vCPU dedicada |
| **Risco** | Atribuir prematuramente a "VPS ruim" desviaria atenção dos problemas reais, que são de configuração |
| **Dependências** | Requer observabilidade contínua (F-99) para detectar agravamento |
| **Teste de aceite** | Série sob carga real mantém steal em patamar semelhante |
| **Rollback** | N/A |
| **Métrica esperada** | Baseline registrado: **2,08% acumulado**. Evolução sob carga: `NOT MEASURED` |
| **Status** | `AUDITED` |

### Load e concorrência

`load average: 0,00 / 0,09 / 0,13` em 4 vCPU. `r` (processos executáveis) = 0–1. `b` (bloqueados) = 0 em todas as amostras.

**264 processos, 754 threads.** `file-nr` = 3.904 descritores abertos de máximo praticamente ilimitado — sem pressão.

### F-96 · `ulimit -n` = 1024

O limite de descritores para processos de shell é 1024 (default do Ubuntu). Containers herdam o limite do `dockerd`, não do shell, então **não afeta diretamente** os serviços em container. Relevante se algum processo for iniciado manualmente por SSH — o que inclui, hoje, os processos fora do Docker (F-91).

Para o Ferraco: Socket.IO com muitas conexões simultâneas consome descritores; o container não está sujeito a este limite, mas vale confirmar `LimitNOFILE` do `docker.service` antes de assumir folga.

**Status:** `AUDITED` · verificação do `LimitNOFILE`: **`PENDING`**

---

## Parte III — I/O e disco

### M-20 · I/O acumulado (`/proc/diskstats`, device `sda`)

| Métrica | Valor |
|---|---|
| Leituras completadas | 101.162 |
| **Escritas completadas** | **1.210.057** |
| Tempo em I/O | 1.769.416 ms ≈ 29,5 min |

Razão escrita/leitura ≈ **12:1** — perfil consistente com bancos de dados e logs, e com o `Cached` de 11 GiB absorvendo as leituras.

**PSI de I/O** ([RUNTIME-RESOURCE-AUDIT.md M-05](RUNTIME-RESOURCE-AUDIT.md)): `some avg10=0.01`, `full avg10=0.01` — desprezível. `iowait` de 0,10% no acumulado confirma: **não há gargalo de I/O**.

**Disco:** 194 GB, 29 GB usados (15%), 165 GB livres. **Inodes: 601.757 de 25.804.800 (3%)** — nenhuma pressão.

**Status:** `AUDITED`

### F-98 · Swap de 2 GiB com `swappiness=60`

`SwapTotal` = 2 GiB para 15,61 GiB de RAM; uso atual: **1,25 MiB** (essencialmente zero); `swappiness` = 60 (default).

O escopo adverte contra tratar swap como RAM extra. **Concordo e não proponho aumentá-la.** A avaliação:

- **Não é cura para falta de capacidade** — e não há falta: `MemAvailable` = 13,5 GiB
- **`swappiness=60` é agressivo** para servidor com RAM abundante: o kernel pode paginar páginas anônimas mesmo com memória livre, trocando latência de RAM por latência de disco
- **2 GiB é pouco** para absorver um pico de 15,61 GiB, mas **isso é adequado**: swap grande em servidor apenas prolonga a agonia antes do OOM, em vez de falhar rápido

**Proposta:** nenhuma ação agora. Se surgir paginação sob carga, avaliar `swappiness` menor — **mas isso é `sysctl`, vedado nesta etapa**, e só faria sentido com evidência de swap-in/swap-out, que hoje é zero (`si`/`so` = 0 em todas as amostras).

**Status:** `AUDITED`

---

## Parte IV — Proxy, TLS e segurança do host

### F-92 · Nenhum certificado TLS para o domínio do Ferraco

| Campo | Conteúdo |
|---|---|
| **Evidência** | `ls /etc/letsencrypt/live/` → `aprenderia.site`, `digiurban.com.br`, `m2centerauto.com.br`, `velomail.com.br`. `certbot certificates` confirma 4 certificados válidos (expiram 14–15/12/2026, 87–88 dias). **Nenhum para `metalurgicaferraco.com`** |
| **Achado** | As 4 aplicações vizinhas têm TLS gerenciado por certbot, com renovação automática. O Ferraco **não tem certificado**, e também **não tem vhost** em `/etc/nginx/sites-enabled/` ([VPS-OPT-BASELINE.md §B6](VPS-OPT-BASELINE.md): apenas `000-ultrazend`, `aprenderia`, `digiurban`, `m2centerauto`) |
| **Impacto** | **Mesmo que o deploy funcione, a aplicação não estará acessível pelo domínio via HTTPS.** O compose publica `3050` em `0.0.0.0` ([CONTAINER-AUDIT.md F-16](CONTAINER-AUDIT.md)), então o acesso seria por `IP:3050` **sem TLS** — tráfego em claro, incluindo credenciais de login e tokens JWT |
| **Proposta** | Criar vhost nginx para o domínio, emitir certificado via certbot (mecanismo já operante no host) e mudar a publicação para `127.0.0.1:3050`, seguindo o padrão das vizinhas |
| **Risco** | Emissão de certificado requer DNS apontando para a VPS e porta 80 acessível. Se o DNS não estiver configurado, o certbot falha — verificar antes |
| **Dependências** | **Bloqueia F-16**: mudar para `127.0.0.1` sem o vhost torna a aplicação inacessível |
| **Teste de aceite** | `https://<domínio>` responde com certificado válido; acesso direto a `IP:3050` é recusado; renovação automática agendada |
| **Rollback** | Remover vhost; manter publicação em `0.0.0.0` |
| **Métrica esperada** | `NOT MEASURED` |
| **Status** | `AUDITED` |

**Nota sobre o domínio:** o workflow declara `DOMAIN: metalurgicaferraco.com`, mas a instrução inicial mencionou `metalurgicaferraco.com.br`. A divergência permanece **`PENDING`** — não verifiquei resolução DNS para não gerar tráfego externo desnecessário.

### F-95 · Firewall inativo

| Campo | Conteúdo |
|---|---|
| **Evidência** | `ufw status` → **`Status: inactive`**. `iptables -L INPUT -n` → `Chain INPUT (policy ACCEPT)` sem regras |
| **Achado** | Não há filtragem no host. A única proteção são as regras que o Docker insere para NAT de portas publicadas. **Toda porta publicada em `0.0.0.0` está acessível da internet** |
| **Impacto** | Portas atualmente expostas ([VPS-OPT-BASELINE.md §B6](VPS-OPT-BASELINE.md)): 25, 587 (SMTP), 3001, 3060, 9001, 9006, além de 80/443 e SSH 22. **Com o Ferraco no ar, somam-se 3050** — e, por [APPLICATION-RUNTIME-AUDIT.md F-79](APPLICATION-RUNTIME-AUDIT.md), o Socket.IO nessa porta entrega o QR code do WhatsApp sem autenticação a qualquer conectante da internet |
| **Proposta** | Habilitar firewall permitindo apenas 22, 80, 443 e as portas SMTP legitimamente públicas; bloquear o restante. **Atenção:** o Docker manipula `iptables` diretamente e contorna regras `INPUT` do UFW — a configuração correta exige `DOCKER-USER` |
| **Risco** | **Alto se mal feito.** Regra incorreta derruba o acesso SSH ou as 4 aplicações vizinhas. Exige janela de manutenção e acesso alternativo (console do provedor) |
| **Dependências** | Coordenar com os donos das aplicações vizinhas |
| **Teste de aceite** | Portas não autorizadas recusam conexão externa; aplicações vizinhas continuam acessíveis; SSH mantido |
| **Rollback** | `ufw disable` |
| **Métrica esperada** | `NOT MEASURED` (segurança) |
| **Status** | `AUDITED` |

**`fail2ban`: `inactive`.** Com autenticação SSH por senha ([DEPLOY-CICD-AUDIT.md F-69](DEPLOY-CICD-AUDIT.md)) e sem firewall, não há proteção contra força bruta na porta 22. Registrado; **não desabilitei nem alterei nada**.

### Serviços do host — inventário

| Serviço | Avaliação |
|---|---|
| `docker.service`, `containerd.service` | Essenciais |
| `nginx.service` | Proxy reverso, TLS, 4 vhosts |
| **`monarx-agent.service`** | **Scanner de segurança do provedor — ativo.** O escopo veda desabilitar controles de segurança. **Mantido, nenhuma ação proposta** |
| **`actions.runner...digiurban-vps.service`** | **F-97** — runner self-hosted |
| `qemu-guest-agent` | Agente do hipervisor (KVM). Necessário |
| `cron`, `rsyslog`, `systemd-journald` | Base do sistema |
| `snapd`, `packagekit`, `polkit` | Padrão do Ubuntu; `snapd` é candidato a remoção em servidor, mas ganho marginal e risco de dependências |
| `irqbalance` | Distribui interrupções — útil em multi-core |

**Nenhum serviço foi parado, desabilitado ou alterado.**

### F-97 · Runner do GitHub Actions residente

`Runner.Listener` (148 MiB) + `RunnerService.js` (40 MiB) + `runsvc.sh` = **~190 MiB residentes permanentemente**, para a aplicação `Digiurbanlite`.

**Observação relevante para o Ferraco:** existe infraestrutura de runner self-hosted neste host. Isso **não** é recomendação de usá-la para o Ferraco — ao contrário: [DEPLOY-CICD-AUDIT.md F-27](DEPLOY-CICD-AUDIT.md) recomenda tirar o build da VPS, e um runner self-hosted traria o build **de volta** para cá, agravando a contenção. Registrado apenas como consumo contabilizado.

**Status:** `AUDITED`

### F-99 · Sem observabilidade de séries temporais

Não há Prometheus, node_exporter, Netdata, Zabbix ou equivalente. As únicas séries disponíveis são as que coletei manualmente nesta auditoria.

**Consequência direta:** todas as auditorias anteriores registraram `NOT MEASURED` para pico, latência e throughput — **porque não há sistema que os registre**. O journal só tem o boot atual; `memory.peak` não existe no kernel 5.15 ([RUNTIME-RESOURCE-AUDIT.md M-06](RUNTIME-RESOURCE-AUDIT.md)).

**Proposta:** instrumentação leve (node_exporter + coleta externa, ou um agente do provedor). **Risco:** consome recursos — mas ~50 MiB para ter diagnóstico é troca favorável, especialmente dado que a causa do incidente original foi perdida por falta exatamente disso.

**Status:** `AUDITED`

---

## Parte V — Capacidade agregada com folga

Cálculo com folga para deploy, backup e falhas, conforme o escopo.

### Consumo atual medido

| Componente | RSS / uso real |
|---|---|
| 17 containers (`memory.current`) | ~1.334 MiB |
| Processos fora do Docker (F-91) | ~670 MiB |
| `dockerd` + base do SO | ~400 MiB |
| **Total residente** | **~2,4 GiB** |
| **`MemAvailable`** | **13,50 GiB** |

### Reservas necessárias

| Reserva | Justificativa |
|---|---|
| **Pico de build** | Se o build permanecer na VPS ([DEPLOY-CICD-AUDIT.md F-68](DEPLOY-CICD-AUDIT.md)): `npm ci` + `tsc` + `vite build` sem cgroup. **Magnitude `NOT MEASURED`** |
| **Backup** | `pg_dump` + `tar` dos volumes durante o deploy ([DEPLOY-CICD-AUDIT.md F-71](DEPLOY-CICD-AUDIT.md)) |
| **Falha de container vizinho** | Um container em laço de restart pode consumir seu limite continuamente |
| **Limites declarados das vizinhas** | ~8,8 GiB se todas saturarem simultaneamente |

### Veredito de capacidade

**A VPS é adequada.** Não recomendo upgrade, separação de cargas nem contato com provedor. Fundamentos:

1. `MemAvailable` de 13,5 GiB com 2,4 GiB residentes — **folga de ~5,6×**
2. Swap praticamente não utilizada (1,25 MiB), `si`/`so` = 0
3. PSI de memória **0,00** em todas as janelas
4. Zero OOM desde o boot ([RUNTIME-RESOURCE-AUDIT.md M-04](RUNTIME-RESOURCE-AUDIT.md), 4 fontes)
5. CPU idle 95,9%, iowait 0,10%, load 0,09
6. Disco 15%, inodes 3%

**O gargalo não é capacidade — é configuração.** Mesmo no pior caso (todas as vizinhas saturando seus limites: 8,8 GiB), restariam ~5 GiB para o Ferraco, que precisará de uma fração disso em runtime.

**Ressalva honesta:** este é o quadro **em repouso**. Nenhuma das 5 aplicações está sob carga real. Uma auditoria de capacidade sem carga representativa tem valor limitado — por isso F-99 (observabilidade) é a recomendação estrutural.

**Se algo justificar upgrade no futuro**, será o steal (F-93) se subir consistentemente, ou a soma de picos simultâneos de build — resolvível tirando o build da VPS, a custo zero de infraestrutura.

**Status:** `AUDITED`

---

## Matriz de cobertura — inventário → evidência → status

| Item do inventário | Evidência examinada | Cobertura |
|---|---|---|
| RAM total / disponível | `/proc/meminfo` — M-17 | `AUDITED` |
| Swap | `SwapTotal`/`SwapFree`; `si`/`so` = 0 — F-98 | `AUDITED` |
| `swappiness` | 60 (default). **Não alterado** | `AUDITED` |
| `overcommit_memory` | 0 (heurístico); `Committed_AS` 63% — F-94 | `AUDITED` |
| Pressão de memória (PSI) | `0.00` em todas as janelas | `AUDITED` |
| Pressão de I/O (PSI) | `some/full avg10=0.01` | `AUDITED` |
| Load average | 0,00 / 0,09 / 0,13; `r`=0–1 | `AUDITED` |
| CPU user | 1,21% acumulado — M-19 | `AUDITED` |
| CPU system | 0,88% acumulado | `AUDITED` |
| CPU iowait | 0,10% acumulado | `AUDITED` |
| **CPU steal** | **2,08% acumulado + 15 amostras em 2 séries** — F-93 | `AUDITED` |
| Virtualização | KVM; AMD EPYC 9354P; 4 vCPU | `AUDITED` |
| Disco | 194 GB, 15% usado | `AUDITED` |
| Inodes | 3% usados | `AUDITED` |
| I/O por device | `/proc/diskstats`: 12:1 escrita/leitura — M-20 | `AUDITED` |
| Processos / threads | 264 / 754 | `AUDITED` |
| **Processos fora do Docker** | `ps --sort=-rss` — **F-91** | **`PENDING`** |
| Limites (`ulimit -n`) | 1024 para shell — F-96 | `AUDITED` |
| `LimitNOFILE` do docker.service | Não verificado | **`PENDING`** |
| Descritores abertos | `file-nr` 3.904; sem pressão | `AUDITED` |
| Aplicações vizinhas | 17 containers + cargas fora do Docker | `AUDITED` |
| Proxy (nginx do host) | Ativo; 4 vhosts; **nenhum para Ferraco** | `AUDITED` |
| **TLS** | 4 certificados válidos; **nenhum para Ferraco** — **F-92** | `AUDITED` |
| Renovação de certificado | certbot operante (87–88 dias) | `AUDITED` |
| DNS do domínio | Divergência `.com` vs `.com.br` não resolvida | **`PENDING`** |
| **Firewall** | `ufw inactive`; `INPUT ACCEPT` sem regras — **F-95** | `AUDITED` |
| `fail2ban` | `inactive`. **Não alterado** | `AUDITED` |
| Monitoramento de segurança | `monarx-agent` **ativo e preservado** | `AUDITED` |
| Serviços do host | 20 unidades running, inventariadas | `AUDITED` |
| Runner self-hosted | ~190 MiB — F-97 | `AUDITED` |
| Logs do host | `/var/log` 107 MB; journald 64 MB; logrotate ativo | `AUDITED` |
| Observabilidade | Inexistente — **F-99** | `AUDITED` |
| Recuperação do host | `restart: unless-stopped` nos containers; sem plano documentado | `AUDITED` |
| Capacidade agregada | Parte V | `AUDITED` |
| Séries sob carga real | Aplicações em repouso | **`BLOCKED`** |
| Pico histórico | `memory.peak` ausente (kernel 5.15); journal só do boot atual | **`BLOCKED`** |
| Contenção do provedor sob carga | Exigiria carga representativa | **`BLOCKED`** |
| `sysctl` / kernel / firewall (alteração) | **Vedado nesta etapa** | `NOT APPLICABLE` |
| Necessidade de VPS maior | Avaliada: **não justificada** | `AUDITED` |
| Separação de cargas | Avaliada: não justificada pela capacidade | `AUDITED` |

---

## Totais de cobertura

| Status | Total |
|---|---|
| **AUDITED** | **32** |
| **PENDING** | **3** |
| **BLOCKED** | **3** |
| **NOT APPLICABLE** | **1** |

**Achados novos:** F-91 a F-99 (9). **Medições novas:** M-17 a M-20.

### Correção/complemento a documentos anteriores

Todas as auditorias anteriores trataram o consumo do host como **soma dos containers**. F-91 mostra que isso é incompleto: há ~670 MiB em processos fora do Docker — dois `next-server`, um `uvicorn` e o runner do Actions — **sem cgroup, sem limite e invisíveis em `docker stats`**. Não muda o veredito de capacidade (a folga permanece ampla), mas invalida a premissa de que "tudo no host está contido".

### Por que a auditoria não está completa

Os 3 `BLOCKED` derivam de as aplicações estarem em repouso e de o kernel 5.15 não expor `memory.peak`. Séries sob carga real, pico histórico e comportamento da contenção sob demanda não foram medidos — e não foram estimados.

Os 3 `PENDING` exigem informação externa: identificação dos serviços fora do Docker (F-91), `LimitNOFILE` do daemon, e a divergência de domínio `.com` vs `.com.br`.

**Achado que atravessa esta auditoria:** a VPS **não é o problema**. Steal de 2%, idle de 96%, `MemAvailable` de 13,5 GiB, zero OOM, disco a 15%. A narrativa de que "as aplicações quebraram a VPS por falta de otimização" não encontra respaldo nas métricas do host — o que os dados sustentam é que as falhas são de **configuração e segurança**, não de capacidade. Dois achados desta etapa são de exposição, não de recurso: firewall inativo (F-95) e ausência de TLS para o domínio (F-92) — este último significando que, do jeito que está, o Ferraco subiria servindo credenciais em texto claro.

Parei aqui.
