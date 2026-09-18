# VPS-OPT-BASELINE — Ferraco CRM

**Coleta:** 2026-09-17 ~14:35 UTC · **Host:** `72.60.10.108` (`srv953800`) · **Método:** SSH root, somente leitura (paramiko)
**Etapa:** DESCOBERTA — nenhuma alteração aplicada.

> Unidades conforme reportadas pelas ferramentas. Snapshot em repouso: **não representa pico**.

---

## B1. Host

| Item | Valor | Status |
|---|---|---|
| SO | Ubuntu 22.04.5 LTS, kernel 5.15.0-191 | VERIFIED |
| vCPU | 4 | VERIFIED |
| RAM total | 15 Gi | VERIFIED |
| Swap | 2,0 Gi (1,3 MB em uso) | VERIFIED |
| Disco `/` | 194 G total, 29 G usados, 165 G livres (15%) | VERIFIED |
| Uptime | 2 dias 17h43m | VERIFIED |
| Load average | 0,00 / 0,09 / 0,13 | VERIFIED |
| Docker | 29.8.0 | VERIFIED |
| Docker Compose | v5.5.1 | VERIFIED |
| Node no host | ausente (builds ocorrem dentro de container) | VERIFIED |
| Git no host | 2.34.1 | VERIFIED |

### Memória (`free -h`, instante único)

| total | used | free | shared | buff/cache | available |
|---|---|---|---|---|---|
| 15 Gi | 1,6 Gi | 458 Mi | 149 Mi | 13 Gi | **13 Gi** |

`free` baixo com `buff/cache` alto é cache recuperável, não pressão. A métrica de pressão é **available: 13 Gi**.

### Boots e OOM

| Item | Resultado | Status |
|---|---|---|
| Boots registrados no journal | **1 apenas** — desde 2026-09-14 20:51 UTC | VERIFIED |
| OOM killer em `dmesg` | nenhuma ocorrência | VERIFIED |
| OOM / `oom-kill` / `Killed process` no journal (14 dias) | nenhuma ocorrência | VERIFIED |

**Limitação:** o journal só tem o boot atual (pós-reinstalação). **O histórico do incidente que derrubou a VPS foi perdido junto com a reinstalação** — não há evidência forense disponível. Causa raiz da queda anterior: **NOT MEASURED**.

---

## B2. Containers em execução — 17 no total, 1 encerrado

Todos os 18 têm limites de RAM **e** CPU declarados e efetivos (`HostConfig.Memory` / `NanoCpus` != 0).

| Container | CPU% | RAM usada / limite | RAM% | PIDs | Restart | CPUs |
|---|---|---|---|---|---|---|
| digiurban-vps | 0,02% | 295,5 MiB / 1 GiB | 28,86% | 31 | unless-stopped | 2,0 |
| digiurban-postgres | 0,00% | 107,0 MiB / 512 MiB | 20,90% | 26 | unless-stopped | 1,0 |
| aprenderia-web | 0,00% | 106,9 MiB / 512 MiB | 20,88% | 13 | unless-stopped | 1,0 |
| m2centerauto-alpr-1 | 0,19% | 94,25 MiB / 1 GiB | 9,20% | 14 | unless-stopped | 1,0 |
| ultrazend-api | 0,01% | 89,82 MiB / 512 MiB | 17,54% | 12 | unless-stopped | 1,5 |
| ultrazend-messages | 0,00% | 69,62 MiB / 384 MiB | 18,13% | 14 | unless-stopped | 1,0 |
| ultrazend-postgres | 0,09% | 66,00 MiB / 256 MiB | 25,78% | 13 | unless-stopped | 1,0 |
| m2centerauto-postgres-1 | 5,49% | 61,37 MiB / 768 MiB | 7,99% | 16 | unless-stopped | 1,5 |
| m2centerauto-backend-1 | 0,00% | 60,19 MiB / 1 GiB | 5,88% | 15 | **on-failure** | 1,5 |
| ultrazend-smtp | 0,00% | 53,91 MiB / 384 MiB | 14,04% | 14 | unless-stopped | 0,5 |
| aprenderia-postgres | 0,00% | 47,19 MiB / 512 MiB | 9,22% | 11 | unless-stopped | 0,5 |
| m2centerauto-plate-scraper-1 | 0,00% | 44,53 MiB / 1 GiB | 4,35% | 20 | unless-stopped | 1,0 |
| ultrazend-face | 0,00% | 36,92 MiB / 384 MiB | 9,61% | 14 | unless-stopped | 1,0 |
| m2centerauto-frontend-1 | 0,00% | 6,20 MiB / 128 MiB | 4,84% | 5 | unless-stopped | 0,5 |
| aprenderia-nginx | 0,00% | 5,09 MiB / 128 MiB | 3,97% | 5 | unless-stopped | 0,25 |
| aprenderia-scheduler | 0,00% | 4,92 MiB / 32 MiB | 15,37% | 2 | unless-stopped | 0,05 |
| digiurban-redis | 0,43% | 4,58 MiB / 192 MiB | 2,38% | 6 | unless-stopped | 0,5 |
| aprenderia-media-init | — | — / 64 MiB | — | — | `no` (job, Exited 0) | 0,25 |

**Somatórios (VERIFIED):**
- RAM efetivamente em uso pelos 17 ativos: **~1.150 MiB (~1,1 GiB)**
- Soma dos limites declarados dos 18: **~10,0 GiB** — *limite reservado, não consumo*
- Soma de CPUs declaradas: **~17,0** em 4 vCPU físicos — oversubscription de ~4,3x, tolerável porque são tetos, não reservas
- CPU agregada observada: **< 7%**

---

## B3. Ferraco na VPS — AUSENTE

| Verificação | Resultado | Status |
|---|---|---|
| Containers `ferraco*` | **nenhum** | VERIFIED |
| Imagens `ferraco*` | **nenhuma** | VERIFIED |
| Volumes `ferraco*` | **nenhum** (os 5 do compose não existem) | VERIFIED |
| `APP_DIR` `/root/ferraco-crm` | **não existe** | VERIFIED |
| Portas 3050 / 3000 | **livres** | VERIFIED |

**O Ferraco CRM não está implantado nesta VPS.** A reinstalação apagou tudo e nenhum deploy ocorreu desde então. Último run do Actions com sucesso: 2026-02-06 16:27 UTC — anterior à reinstalação (boot atual: 2026-09-14).

**Consequência para persistência:** os 5 volumes nomeados (`ferraco-postgres-data`, `-uploads`, `-sessions`, `-logs`, `-data`) não existem. Banco, uploads e sessão do WhatsApp serão criados do zero no próximo deploy; a sessão exigirá novo pareamento por QR code.

---

## B4. Disco Docker (`docker system df`)

| Tipo | Total | Ativos | Tamanho | Recuperável |
|---|---|---|---|---|
| Imagens | 45 | 18 | 19,79 GB | **9,22 GB (46%)** |
| Containers | 18 | 17 | 84,37 MB | 4,1 kB (0%) |
| Volumes locais | 17 | 17 | 306 MB | 0 B (0%) |
| **Build cache** | 100 | 28 | **5,73 GB** | **1,99 GB** |

Tamanho lógico ≠ disco ocupado: `aprenderia-web` tem 14 tags de 744 MB cada, mas 232 MB são camada compartilhada — o custo real por tag extra é ~512 MB único.

**Desperdício recuperável identificado: ~11,2 GB** (9,22 imagens órfãs + 1,99 build cache). Sobre 165 GB livres, é folga, não risco — mas é acúmulo sem retenção definida.

Maiores ofensores: 14 tags antigas de `aprenderia-web` (~512 MB únicos cada, **1 em uso**), `digiurban-app` 2,98 GB, 4 tags de `m2centerauto-plate-scraper` a 1,95 GB.

---

## B5. Logs

| Item | Valor | Status |
|---|---|---|
| Driver | `json-file`, `max-size=10m`, `max-file=3` (amostra `aprenderia-web`) | VERIFIED |
| `/etc/docker/daemon.json` | **ausente** — rotação vem do compose por serviço, não do daemon | VERIFIED |
| Total `/var/lib/docker/containers` | 22 MB | VERIFIED |
| Maior log | digiurban-postgres 6,9 MB | VERIFIED |

Rotação funciona nos serviços amostrados. Sem `daemon.json`, um serviço novo que não declare `logging:` herda o padrão **sem limite** — é o risco para o Ferraco, cujo compose não declara `logging:`.

---

## B6. Rede e portas

Nginx **no host** (systemd, ativo) termina 80/443 e faz proxy para os containers. 4 sites habilitados: `000-ultrazend`, `aprenderia`, `digiurban`, `m2centerauto` — **nenhum para Ferraco/metalurgicaferraco**.

| Porta | Processo | Exposição |
|---|---|---|
| 80, 443 | nginx (host) | pública |
| 25, 587 | docker-proxy → ultrazend-smtp | pública |
| 3001 | docker-proxy → ultrazend-api | pública |
| 3060 | docker-proxy → digiurban-vps | pública |
| 9001 / 9006 | docker-proxy → messages / face | pública |
| 3092 / 3130 | docker-proxy | **127.0.0.1** |
| 65529 | monarx-agent (segurança do provedor) | 127.0.0.1 |

O compose do Ferraco publica `3050:3050` em `0.0.0.0` — divergente do padrão do host, onde o app fica em 127.0.0.1 atrás do nginx. Também **falta o vhost nginx** para o domínio.

---

## B7. Métricas não medidas

| Métrica | Status | Motivo |
|---|---|---|
| Pico de RAM/CPU | NOT MEASURED | Sem série temporal; journal só do boot atual |
| Causa raiz da queda anterior | NOT MEASURED | Logs perdidos na reinstalação |
| Latência / throughput / erros HTTP | NOT MEASURED | Sem APM; nginx do host não amostrado |
| Conexões PostgreSQL | NOT MEASURED | Requer consulta ao banco |
| I/O por processo | NOT MEASURED | `iotop` / `pidstat` não verificados |
| Duração/consumo do build na VPS | NOT MEASURED | Nenhum build do Ferraco neste boot |
| Baseline do Ferraco | **NOT APPLICABLE** | App ausente da VPS |

Duração dos deploys (GitHub Actions, medido via API): 6m22s a 20m01s, mediana ~11 min, nos 15 runs mais recentes — todos anteriores à reinstalação.
