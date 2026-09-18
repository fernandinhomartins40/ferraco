---
description: Executa o VPS-OPT-MASTER-PLAN em sequência, respeitando bloqueios e reavaliando-os a cada tarefa concluída
---

# Goal — Execução sequencial do VPS-OPT-MASTER-PLAN

Você está executando o plano de otimização do Ferraco CRM documentado em
[docs/VPS-OPT-MASTER-PLAN.md](../../docs/VPS-OPT-MASTER-PLAN.md).

**Objetivo:** avançar pelas tarefas na ordem das fases, executando tudo que
estiver desbloqueado, e **reavaliar os bloqueios após cada conclusão** — uma
tarefa bloqueada se torna elegível assim que aquilo que a bloqueava foi
satisfeito. Você não para em tarefa desbloqueada; encadeia.

## Antes de qualquer coisa

1. Leia o MASTER-PLAN inteiro, incluindo o **Registro de execução** no topo.
2. Reconstrua o estado real: quais tarefas estão `DONE (local)`, `PENDING`,
   `BLOCKED`, e **por que** cada bloqueio existe.
3. Confirme ambiente: branch `main`, working tree, `node -v`, Docker disponível.
4. **Revalide a evidência** da tarefa que vai executar antes de mudar código.
   O plano foi escrito por leitura estática e já se provou desatualizado — T-04
   estava corrigida, e a auditoria estimou 12 `io.emit()` onde havia 30.
   Se a evidência não se sustenta, registre `DONE (pré-existente)` e siga.

## Regra de elegibilidade

Execute a próxima tarefa que satisfaça **todas** estas condições:

- Status `PENDING` (ou `BLOCKED` cujo bloqueador já esteja resolvido)
- Escopo `LOCAL` ou `DEPLOY` — **nunca** `REQUER AUTORIZAÇÃO`
- Nenhuma dependência técnica pendente

**Ordem:** Fase 0 → 1 → 2 → 3 → 4 → 5, e dentro da fase, a ordem numérica.
Exceção explícita do plano (§4): **T-19 precede T-20 e T-21.**

### Reavaliação de bloqueios — o núcleo deste goal

Após concluir cada tarefa, percorra as `BLOCKED` e verifique se o bloqueio caiu:

| Bloqueada | Espera por | Torna-se elegível quando |
|---|---|---|
| T-13 | T-01, T-12 | ✅ T-01 feita · falta T-12 |
| T-27 | T-08, T-12 | ambas concluídas |
| T-29 | T-20 | T-20 concluída |
| T-30 | T-12 | T-12 concluída |
| T-20 | G-02, G-03, T-19, T-13 | **exige app em produção medido 48–72 h** |
| T-21 | T-19, T-20 | T-20 concluída |
| T-22 | G-02 + `pg_stat_statements` | exige uso acumulado em produção |
| T-34 | G-04 | exige inventário de processos na VPS |

Se um bloqueio caiu, **execute a tarefa** — não pergunte.

## O que exige PARAR e perguntar

Pare e pergunte apenas nestes casos, que **não** são falta de autonomia sua e
sim ausência de um fato ou de uma autorização:

| Situação | Por quê |
|---|---|
| **T-05** | G-08: domínio `.com` vs `.com.br` indefinido + altera nginx de host compartilhado |
| **T-07** | Exige saber se integradores externos (X-02..X-05) consomem `/api/openapi.json` — informação fora do código |
| **T-08** (rotina periódica) | G-06: RPO/RTO é decisão de negócio + agendamento no host |
| **T-15, T-22, T-25, T-26** | `REQUER AUTORIZAÇÃO` — alteram host compartilhado com **4 aplicações de terceiros**; T-26 pode derrubá-las, T-15 pode custar o acesso SSH |
| **Fase 4 (T-20, T-21, T-22, T-29)** | `BLOCKED` por G-02 — dimensionar sem app rodando e medido é precisamente o erro que as auditorias evitaram |
| **T-24** | Paginar **altera contrato de API** e quebra consumidores externos; exige o inventário por endpoint que não existe |

Ao parar, diga o que falta, apresente as opções e **não decida por conta própria**.

### Duas tarefas de risco alto — confirme antes, execute depois

- **T-12** (build no runner + registry): reescreve o deploy. Sem ela não há
  rollback por imagem. Confirme antes de começar, mas não trate como bloqueio.
- **T-13** (prune de devDeps): o plano marca **risco ALTO** — `tsx`, `prisma` CLI
  e `typescript` são devDeps **usadas em runtime**. Exige os **5 testes
  separados** em ambiente descartável, com a imagem podada. Se qualquer um
  falhar, `BLOCKED`, sem exceção.

## Durante a execução

- **Mudanças pequenas, rastreáveis por ID** (T-xx, F-xx nos comentários).
- Preserve funcionalidade, isolamento, persistência e integrações.
- **Não** troque banco por memória/localStorage, **não** use mock em fluxo real,
  **não** remova serviço por suposição.
- Mantenha runtime/ORM compatíveis e módulos nativos necessários ao ciclo.
- **Não** limpe volumes ou imagens de rollback para produzir ganho artificial.
- Ao alterar contrato visível (backend ↔ frontend), **ajuste os dois lados** —
  ver T-06, onde o `ImageUploader` oferecia SVG que o backend passou a rejeitar.

## Depois de cada tarefa — obrigatório

1. `tsc --noEmit` nos workspaces afetados + `npm run build`.
2. **Teste funcional real do fluxo alterado**, não inspeção visual.
   Em T-06 o teste pegou dois defeitos que a implementação deixou passar.
   Use Postgres descartável (`docker run postgres:16-alpine`, porta alta),
   harness em diretório temporário do workspace, **destruído ao final**.
   **Nunca** contamine produção. Seed destrutivo **jamais** contra banco real.
3. Teste também autenticação, uploads/downloads, jobs, filas e permissões
   quando afetados. Para imagem/deploy: startup, consulta real ao banco,
   `migrate deploy` em banco descartável e seed.
4. **Atualize o MASTER-PLAN**: status, evidência com números, comandos sem
   segredos, ambiente, rollback, e o que permanece `NOT VERIFIED` em produção.
   Acrescente uma linha ao **Registro de execução**.
5. Marque `DONE` **apenas** conforme o critério de aceite da tarefa. Se o
   critério não foi atendido, não marque.
6. Achado novo fora do escopo → registre como **F-1xx** com status próprio.
   Já surgiram assim F-100 (migration quebrada) e F-101 (15 ouvintes mortos).

**Se um teste falhar:** interrompa a mudança dependente, corrija dentro da
própria tarefa **ou** faça rollback e registre `BLOCKED` com o motivo.
**Nunca** esconda regressão para concluir.

## Commits e deploy

- Regra do projeto: commit e push **direto na `main`**; **nunca** criar branch.
  Deploy exclusivamente via GitHub Actions.
- **Push dispara deploy em produção.** Por isso: **não faça push sem pedir**,
  mesmo com tudo verde. Commitar localmente é aceitável; publicar não é.
- Assine os commits com:
  `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`

## Contexto que condiciona o risco

- A VPS foi reinstalada: **sem dados, sem backup, app não implantado**
  (BASELINE §B3). Nenhum dado real corre risco hoje — as tarefas de proteção
  valem a partir do primeiro lead real.
- **Nada foi verificado em produção.** Tudo que está `DONE (local)` foi provado
  em ambiente descartável. Diga isso sempre; não apresente como verificado.
- O host é **compartilhado com 4 aplicações de terceiros** (`aprenderia`,
  `ultrazend`, `digiurban`, `m2centerauto`). É a razão de várias tarefas
  exigirem autorização — um erro não afeta só o Ferraco.

## Ao encerrar o turno

Informe: diffs/resumo, IDs tratados, testes executados com resultado,
pendências, o que permanece não verificado em produção, e o próximo passo.

Quando chegar num ponto de parada legítimo (autorização, decisão de negócio,
ou Fase 4 sem baseline), **pare e pergunte** — não implemente por suposição.
