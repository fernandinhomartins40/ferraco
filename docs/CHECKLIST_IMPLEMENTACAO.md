# ✅ CHECKLIST DE IMPLEMENTAÇÃO - FERRACO CRM

**Versão**: 1.0 | **Data**: 01/10/2025

Use este checklist para acompanhar o progresso da refatoração.

---

## 🚀 QUICK WINS (HOJE - 3 HORAS)

### ⚡ Correções Imediatas

- [ ] **P4 - Remover useEffect duplicado** (15 min)
  - [ ] Abrir `src/contexts/AuthContext.tsx`
  - [ ] Remover linhas 413-415
  - [ ] Testar login/logout
  - [ ] Commit: `fix: remove duplicate useEffect in AuthContext`

- [ ] **P1 - Remover hook duplicado** (30 min)
  - [ ] Deletar `src/components/ui/use-toast.ts`
  - [ ] Buscar imports: `from '@/components/ui/use-toast'`
  - [ ] Substituir por: `from '@/hooks/use-toast'`
  - [ ] Testar toasts funcionando
  - [ ] Commit: `refactor: remove duplicate use-toast hook`

- [ ] **P27 - Limpar git** (2 horas)
  - [ ] Revisar arquivos deletados do backend
  - [ ] Commitar deleções: `git add -u`
  - [ ] Commit: `chore: remove deleted backend files`
  - [ ] Verificar se build passa

**✓ Total: 3 problemas resolvidos em 3 horas!**

---

## 📅 SPRINT 1 - CRÍTICO E URGENTE (2 SEMANAS)

### Semana 1 - Correções Críticas

#### Dia 1 (Segunda) ✓ Quick Wins
- [ ] Aplicar Quick Wins acima
- [ ] Setup branch: `git checkout -b refactor/sprint-1`
- [ ] Backup: criar branch backup

#### Dia 2 (Terça) - TypeScript Strict (Parte 1)
- [ ] **Habilitar noImplicitAny**
  - [ ] Editar `tsconfig.json`: `"noImplicitAny": true`
  - [ ] Rodar: `npm run build`
  - [ ] Corrigir erros um por um
  - [ ] Meta: 0 erros `any` implícito

#### Dia 3 (Quarta) - TypeScript Strict (Parte 2)
- [ ] **Habilitar strictNullChecks**
  - [ ] Editar `tsconfig.json`: `"strictNullChecks": true`
  - [ ] Rodar: `npm run build`
  - [ ] Adicionar null checks onde necessário
  - [ ] Meta: 0 erros null/undefined

#### Dia 4 (Quinta) - TypeScript Strict (Parte 3)
- [ ] **Habilitar noUnusedLocals e noUnusedParameters**
  - [ ] Editar `tsconfig.json`:
    - `"noUnusedLocals": true`
    - `"noUnusedParameters": true`
  - [ ] Rodar: `npm run build`
  - [ ] Remover variáveis não usadas
  - [ ] Prefixar parâmetros não usados com `_`

#### Dia 5 (Sexta) - Revisão TypeScript
- [ ] **Build final sem erros**
  - [ ] `npm run build` passa ✅
  - [ ] `npm run lint` passa ✅
  - [ ] Testar app manualmente
  - [ ] Commit: `feat: enable TypeScript strict mode`
- [ ] **Reunião de revisão** (16h)

### Semana 2 - Performance e Testes

#### Dia 1 (Segunda) - React.memo (Parte 1)
- [ ] **Otimizar componentes de lista**
  - [ ] `LeadTable.tsx`:
    - [ ] Envolver com `React.memo()`
    - [ ] Adicionar `useMemo` para dados filtrados
    - [ ] Adicionar `useCallback` para handlers
  - [ ] `StatsCards.tsx`:
    - [ ] Envolver com `React.memo()`
    - [ ] Props comparison function se necessário

#### Dia 2 (Terça) - React.memo (Parte 2)
- [ ] **Otimizar dashboards**
  - [ ] `AdminDashboard.tsx`:
    - [ ] `useMemo` para cálculos de estatísticas
    - [ ] Quebrar em subcomponentes com memo
  - [ ] `CRMPipeline.tsx`:
    - [ ] `React.memo()` no componente
    - [ ] `useMemo` para dados agrupados

#### Dia 3 (Quarta) - React.memo (Parte 3)
- [ ] **Otimizar gerenciamento**
  - [ ] `TagManagement.tsx`: `React.memo()`
  - [ ] `UserManagement.tsx`: `React.memo()`
  - [ ] `WhatsAppCommunication.tsx`: `React.memo()`
- [ ] **Testar performance**
  - [ ] React DevTools Profiler
  - [ ] Verificar redução de re-renders
  - [ ] Commit: `perf: add React.memo to improve performance`

#### Dia 4 (Quinta) - Setup de Testes
- [ ] **Configurar ambiente de testes**
  - [ ] Verificar Vitest configurado
  - [ ] Criar `src/tests/setup.ts` se não existe
  - [ ] Instalar `@testing-library/react` e `@testing-library/user-event`
- [ ] **Testes para AuthContext**
  - [ ] Criar `src/contexts/AuthContext.test.tsx`
  - [ ] Teste: Login bem-sucedido
  - [ ] Teste: Logout
  - [ ] Teste: Token refresh
  - [ ] Teste: Session expiration

#### Dia 5 (Sexta) - Testes Críticos
- [ ] **Testes para apiClient**
  - [ ] Criar `src/lib/apiClient.test.ts`
  - [ ] Teste: GET request
  - [ ] Teste: POST request
  - [ ] Teste: Error handling
  - [ ] Teste: Token injection
- [ ] **Testes para componentes**
  - [ ] Criar `src/components/admin/LeadTable.test.tsx`
  - [ ] Teste: Renderização da tabela
  - [ ] Teste: Filtros
  - [ ] Teste: Ações (editar, deletar)
- [ ] **Rodar cobertura**
  - [ ] `npm run test:coverage`
  - [ ] Meta: ≥ 30%
- [ ] **Commit**: `test: add critical test suite`

#### Weekend - Revisão Sprint 1
- [ ] **Validação**
  - [ ] Build passa ✅
  - [ ] Testes passam ✅
  - [ ] Cobertura ≥ 30% ✅
  - [ ] TypeScript strict ✅
  - [ ] Performance melhorou ✅
- [ ] **Preparação Sprint 2**
  - [ ] Criar branch: `refactor/sprint-2`

---

## 📅 SPRINT 2 - ARQUITETURA E QUALIDADE (2 SEMANAS)

### Semana 3 - Refatoração Storage Layer

#### Dia 1 (Segunda) - BaseStorage Design
- [ ] **Criar BaseStorage<T>**
  - [ ] Criar `src/lib/BaseStorage.ts`
  - [ ] Implementar:
    ```typescript
    export abstract class BaseStorage<T> {
      protected key: string;
      protected data: T[] = [];

      constructor(key: string) { /* ... */ }

      protected load(): void { /* ... */ }
      protected save(): void { /* ... */ }
      public getAll(): T[] { /* ... */ }
      public getById(id: string): T | null { /* ... */ }
      public add(item: T): void { /* ... */ }
      public update(id: string, updates: Partial<T>): void { /* ... */ }
      public delete(id: string): void { /* ... */ }
      public search(query: string): T[] { /* ... */ }
      public filter(predicate: (item: T) => boolean): T[] { /* ... */ }
    }
    ```
  - [ ] Criar testes: `src/lib/BaseStorage.test.ts`

#### Dia 2 (Terça) - BaseStorage Implementação
- [ ] **Completar BaseStorage**
  - [ ] Adicionar métodos auxiliares
  - [ ] Adicionar validação
  - [ ] Adicionar eventos (onChange)
  - [ ] Testes passando 100%
  - [ ] Commit: `feat: create BaseStorage generic class`

#### Dia 3 (Quarta) - Migrar Storages (Parte 1)
- [ ] **Migrar storages pequenos**
  - [ ] `tagStorage.ts`: Estender BaseStorage
  - [ ] `communicationStorage.ts`: Estender BaseStorage
  - [ ] `automationStorage.ts`: Estender BaseStorage
  - [ ] Manter API pública compatível
  - [ ] Rodar testes
  - [ ] Commit: `refactor: migrate tag, communication, automation storages`

#### Dia 4 (Quinta) - Migrar Storages (Parte 2)
- [ ] **Migrar storages médios**
  - [ ] `leadStorage.ts`: Estender BaseStorage
  - [ ] `reportStorage.ts`: Estender BaseStorage
  - [ ] `aiStorage.ts`: Estender BaseStorage
  - [ ] Resolver dependências circulares
  - [ ] Commit: `refactor: migrate lead, report, ai storages`

#### Dia 5 (Sexta) - Migrar Storages (Parte 3)
- [ ] **Migrar storages grandes**
  - [ ] `crmStorage.ts`: Estender BaseStorage
  - [ ] `integrationStorage.ts`: Estender BaseStorage
  - [ ] `userStorage.ts`: Estender BaseStorage
- [ ] **Validação final**
  - [ ] Todos storages migrados ✅
  - [ ] Testes passando ✅
  - [ ] Build funcionando ✅
  - [ ] Testar app manualmente
  - [ ] Commit: `refactor: complete storage layer migration`
- [ ] **Medir redução**
  - [ ] Contar linhas antes/depois
  - [ ] Meta: -3000 linhas (-55%)

### Semana 4 - Segurança e Logs

#### Dia 1 (Segunda) - Limpeza Window
- [ ] **Remover window exposures**
  - [ ] Buscar: `(window as any)`
  - [ ] Remover ou mover para DEV mode:
    ```typescript
    if (import.meta.env.DEV) {
      (window as any).__DEBUG__ = {
        storages: { leadStorage, tagStorage, /* ... */ }
      };
    }
    ```
  - [ ] Verificar 0 exposures em produção
  - [ ] Commit: `security: remove window object pollution`

#### Dia 2 (Terça) - Token Management
- [ ] **Melhorar gerenciamento de tokens**
  - [ ] Escolher um storage: sessionStorage (mais seguro)
  - [ ] Remover duplicação localStorage
  - [ ] Minimizar parsing JWT:
    - Mover validação para backend onde possível
    - Usar apenas para expiração no client
  - [ ] Commit: `security: improve token management`

#### Dia 3 (Quarta) - Logger Service
- [ ] **Criar Logger Service**
  - [ ] Criar `src/lib/logger.ts`:
    ```typescript
    export const logger = {
      debug: (msg: string, ...args: any[]) => {
        if (import.meta.env.DEV) console.log(`[DEBUG] ${msg}`, ...args);
      },
      info: (msg: string, ...args: any[]) => {
        console.info(`[INFO] ${msg}`, ...args);
      },
      warn: (msg: string, ...args: any[]) => {
        console.warn(`[WARN] ${msg}`, ...args);
      },
      error: (msg: string, ...args: any[]) => {
        console.error(`[ERROR] ${msg}`, ...args);
      },
    };
    ```
  - [ ] Commit: `feat: create logger service`

#### Dia 4 (Quinta) - Substituir Logs
- [ ] **Substituir console.log por logger**
  - [ ] AuthContext (14 logs)
  - [ ] apiClient (5 logs)
  - [ ] App.tsx (12 logs)
  - [ ] Storages (diversos)
  - [ ] Componentes (diversos)
  - [ ] Buscar: `console.log` - Meta: 0 em produção
  - [ ] Commit: `refactor: replace console.log with logger service`

#### Dia 5 (Sexta) - Reduzir `any`
- [ ] **Criar tipos específicos**
  - [ ] Criar `src/types/api.ts`:
    ```typescript
    export interface ApiError {
      message: string;
      status: number;
      code?: string;
    }

    export interface ApiResponse<T> {
      data: T;
      success: boolean;
      message?: string;
    }
    ```
  - [ ] Refatorar `apiClient.ts`:
    - Substituir `any` por tipos específicos
    - Remover `<T = any>`, forçar tipo genérico
  - [ ] Refatorar storages principais
  - [ ] Buscar: `any` - Meta: <50 ocorrências
  - [ ] Commit: `refactor: reduce any types by 70%`

#### Weekend - Revisão Sprint 2
- [ ] **Validação**
  - [ ] Storage refatorado ✅
  - [ ] Redução -55% linhas ✅
  - [ ] Sem window pollution ✅
  - [ ] Logger implementado ✅
  - [ ] <50 ocorrências `any` ✅
- [ ] **Preparação Sprint 3**

---

## 📅 SPRINT 3 - OTIMIZAÇÃO E POLIMENTO (2 SEMANAS)

### Semana 5 - Otimizações

#### Dia 1 (Segunda) - Lazy Loading (Parte 1)
- [ ] **Analisar bundle atual**
  - [ ] Rodar: `npm run build`
  - [ ] Verificar size: `dist/assets/*.js`
  - [ ] Baseline: ~800kb

- [ ] **Implementar lazy loading de storages**
  - [ ] Refatorar `App.tsx`:
    ```typescript
    useEffect(() => {
      const init = async () => {
        // Paralelo + assíncrono
        await Promise.all([
          import('@/utils/tagStorage').then(m => m.tagStorage.initialize()),
          import('@/utils/leadStorage').then(m => m.leadStorage.initialize()),
          // ... outros
        ]);
      };
      init().catch(console.error);
    }, []);
    ```

#### Dia 2 (Terça) - Lazy Loading (Parte 2)
- [ ] **Code splitting de rotas**
  - [ ] Verificar lazy loading em `App.tsx`
  - [ ] Adicionar Suspense boundaries
  - [ ] Adicionar fallback loaders
- [ ] **Medir melhoria**
  - [ ] Rodar build
  - [ ] Meta bundle: <500kb
  - [ ] Meta TTI: <3s (Lighthouse)
  - [ ] Commit: `perf: implement lazy loading and code splitting`

#### Dia 3 (Quarta) - Refatorar LeadTable
- [ ] **Quebrar LeadTable.tsx (320 linhas)**
  - [ ] Criar `LeadTable/index.tsx` (container ~80 linhas)
  - [ ] Criar `LeadTable/LeadTableHeader.tsx` (~50 linhas)
  - [ ] Criar `LeadTable/LeadTableRow.tsx` (~80 linhas)
  - [ ] Criar `LeadTable/LeadTableActions.tsx` (~60 linhas)
  - [ ] Cada componente com React.memo
  - [ ] Commit: `refactor: split LeadTable into subcomponents`

#### Dia 4 (Quinta) - Refatorar AdminDashboard
- [ ] **Quebrar AdminDashboard.tsx (288 linhas)**
  - [ ] Criar `AdminDashboard/index.tsx` (container ~60 linhas)
  - [ ] Criar `AdminDashboard/DashboardStats.tsx` (~80 linhas)
  - [ ] Criar `AdminDashboard/DashboardCharts.tsx` (~100 linhas)
  - [ ] Usar useMemo para cálculos
  - [ ] Commit: `refactor: split AdminDashboard into subcomponents`

#### Dia 5 (Sexta) - Refatorar ProtectedRoute
- [ ] **Quebrar ProtectedRoute.tsx (297 linhas)**
  - [ ] Criar `ProtectedRoute/index.tsx` (lógica ~120 linhas)
  - [ ] Criar `ProtectedRoute/PermissionChecker.tsx` (UI ~80 linhas)
  - [ ] Simplificar lógica
- [ ] **Validar componentes**
  - [ ] Todos < 200 linhas ✅
  - [ ] Commit: `refactor: split ProtectedRoute and simplify logic`

### Semana 6 - Testes e Finalização

#### Dia 1 (Segunda) - Testes Storage
- [ ] **Testes para BaseStorage**
  - [ ] `src/lib/BaseStorage.test.ts`
  - [ ] Cobertura 100%
- [ ] **Testes para storages**
  - [ ] `leadStorage.test.ts`
  - [ ] `tagStorage.test.ts`
  - [ ] Principais métodos cobertos

#### Dia 2 (Terça) - Testes Hooks
- [ ] **Testes para hooks API**
  - [ ] `useLeads.test.tsx`
  - [ ] `useTags.test.tsx`
  - [ ] `useUsers.test.tsx`
  - [ ] Mock de React Query

#### Dia 3 (Quarta) - Testes Componentes
- [ ] **Testes para componentes principais**
  - [ ] `LeadModal.test.tsx`
  - [ ] `TagManagement.test.tsx`
  - [ ] Snapshot tests para UI
- [ ] **Rodar cobertura final**
  - [ ] `npm run test:coverage`
  - [ ] Meta: ≥ 60% ✅

#### Dia 4 (Quinta) - Resolver Restantes
- [ ] **P13 - Dependências circulares**
  - [ ] Refatorar leadStorage para injeção de deps
  - [ ] Ou criar sistema de eventos
- [ ] **P18 - Dividir AuthContext**
  - [ ] Criar `AuthStateContext`
  - [ ] Criar `AuthActionsContext`
  - [ ] Otimizar re-renders
- [ ] **P21 - Retry logic**
  - [ ] Adicionar retry em apiClient
  - [ ] Exponential backoff
- [ ] **P23 - Hook de data**
  - [ ] Criar `useDateFormat.ts`
  - [ ] Substituir formatações duplicadas
- [ ] **Commits**: Um por problema resolvido

#### Dia 5 (Sexta) - Validação Final
- [ ] **Testes completos**
  - [ ] `npm run test` - 100% passa ✅
  - [ ] `npm run test:coverage` - ≥60% ✅
  - [ ] `npm run lint` - 0 erros ✅
  - [ ] `npm run build` - sucesso ✅

- [ ] **Performance testing**
  - [ ] Lighthouse (desktop):
    - [ ] Performance > 90
    - [ ] Accessibility > 90
    - [ ] Best Practices > 90
    - [ ] SEO > 90
  - [ ] TTI < 3s ✅
  - [ ] Bundle < 500kb ✅

- [ ] **Testes manuais**
  - [ ] Login/logout
  - [ ] CRUD de leads
  - [ ] Filtros e busca
  - [ ] Dashboard carrega rápido
  - [ ] Toasts funcionam
  - [ ] Permissões funcionam

- [ ] **Documentação**
  - [ ] Atualizar README.md
  - [ ] Documentar BaseStorage
  - [ ] Documentar logger
  - [ ] Criar CHANGELOG.md

- [ ] **Deploy**
  - [ ] Merge para main
  - [ ] Tag: `v2.0.0`
  - [ ] Deploy produção
  - [ ] Monitorar erros

---

## 📊 MÉTRICAS DE ACOMPANHAMENTO

Use esta seção para registrar progresso:

### Sprint 1 - Métricas

| Métrica | Baseline | Meta | Atual | Status |
|---------|----------|------|-------|--------|
| Erros TypeScript | ? | 0 | | ⏳ |
| Componentes com memo | 0 | 15+ | | ⏳ |
| Cobertura testes | 0% | 30% | | ⏳ |
| Strict mode | ❌ | ✅ | | ⏳ |

### Sprint 2 - Métricas

| Métrica | Baseline | Meta | Atual | Status |
|---------|----------|------|-------|--------|
| Linhas storage | 5573 | ~2500 | | ⏳ |
| Uso de `any` | 150 | <50 | | ⏳ |
| Console logs | 217 | 0 (prod) | | ⏳ |
| window exposures | 14 | 0 (prod) | | ⏳ |

### Sprint 3 - Métricas

| Métrica | Baseline | Meta | Atual | Status |
|---------|----------|------|-------|--------|
| TTI (segundos) | ~5-7s | <3s | | ⏳ |
| Bundle size | ~800kb | <500kb | | ⏳ |
| Cobertura testes | 30% | 60%+ | | ⏳ |
| Componentes >200L | 4 | 0 | | ⏳ |
| Lighthouse score | ? | >90 | | ⏳ |

---

## 🎯 COMANDOS ÚTEIS

### Durante Desenvolvimento

```bash
# Rodar testes
npm run test

# Rodar testes com UI
npm run test:ui

# Cobertura de testes
npm run test:coverage

# Lint
npm run lint

# Build
npm run build

# Build dev (para verificar erros)
npm run build:dev

# Dev server
npm run dev
```

### Análise de Bundle

```bash
# Instalar analyzer
npm install -D rollup-plugin-visualizer

# Analisar bundle
npm run build && npx vite-bundle-visualizer
```

### Performance Testing

```bash
# Lighthouse
npx lighthouse http://localhost:5173 --view

# Lighthouse CI
npm install -g @lhci/cli
lhci autorun
```

---

## 📝 NOTAS E OBSERVAÇÕES

Use esta seção para anotações durante a implementação:

### Sprint 1

```
[Data] - [Nota]
______ - ____________________________________________
______ - ____________________________________________
______ - ____________________________________________
```

### Sprint 2

```
[Data] - [Nota]
______ - ____________________________________________
______ - ____________________________________________
______ - ____________________________________________
```

### Sprint 3

```
[Data] - [Nota]
______ - ____________________________________________
______ - ____________________________________________
______ - ____________________________________________
```

---

## ✅ VALIDAÇÃO FINAL

Antes de considerar completo, verificar:

### Qualidade de Código
- [ ] TypeScript strict mode ativo
- [ ] 0 erros de lint
- [ ] 0 warnings críticos
- [ ] <30 ocorrências de `any`
- [ ] 0 console.log em produção

### Performance
- [ ] TTI < 3s
- [ ] Bundle size < 500kb
- [ ] Lighthouse score > 90
- [ ] React.memo em componentes críticos
- [ ] useMemo/useCallback adequados

### Testes
- [ ] Cobertura ≥ 60%
- [ ] Todos testes passam
- [ ] Testes para código crítico
- [ ] CI/CD configurado

### Arquitetura
- [ ] Storage layer refatorado
- [ ] Componentes < 200 linhas
- [ ] Sem dependências circulares
- [ ] Logger implementado
- [ ] Sem window pollution

### Segurança
- [ ] Tokens gerenciados corretamente
- [ ] Sem dados sensíveis expostos
- [ ] Validação adequada
- [ ] Sem vulnerabilidades conhecidas

### Documentação
- [ ] README atualizado
- [ ] CHANGELOG criado
- [ ] Código comentado onde necessário
- [ ] ADRs documentados

---

**🎉 Parabéns! Se todos os itens acima estão ✅, a refatoração está completa!**

---

_Checklist criado por Claude Code_
_Data: 01/10/2025 | Versão: 1.0_
