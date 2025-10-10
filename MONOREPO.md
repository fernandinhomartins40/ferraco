# Ferraco CRM - Estrutura Monorepo

## 📁 Estrutura do Projeto

```
ferraco/
├── apps/
│   ├── frontend/              # Aplicação React (Vite + TypeScript)
│   │   ├── src/               # Código fonte do frontend
│   │   ├── public/            # Assets públicos
│   │   ├── package.json       # Dependências específicas do frontend
│   │   ├── vite.config.ts     # Configuração do Vite
│   │   └── tsconfig.json      # TypeScript config do frontend
│   │
│   └── backend/               # Futuro backend Node.js (placeholder)
│
├── packages/
│   ├── shared/                # Código compartilhado entre apps
│   │   ├── src/
│   │   │   ├── types/         # TypeScript types compartilhados
│   │   │   ├── utils/         # Funções utilitárias
│   │   │   └── constants/     # Constantes compartilhadas
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── ui/                    # Biblioteca de componentes UI (futuro)
│   └── config/                # Configurações compartilhadas (futuro)
│
├── package.json               # Root package.json com workspaces
├── tsconfig.base.json         # TypeScript config base
├── README.md                  # Documentação principal
└── MONOREPO.md               # Este arquivo
```

## 🚀 Scripts Disponíveis

### Na raiz do projeto:

```bash
# Desenvolvimento
npm run dev                    # Inicia o frontend em modo dev
npm run dev:frontend           # Alias para npm run dev

# Build
npm run build                  # Build de todos os workspaces
npm run build:frontend         # Build apenas do frontend

# Qualidade de código
npm run lint                   # Lint em todos os workspaces
npm run type-check             # Type check em todos os workspaces
```

### No workspace frontend (apps/frontend):

```bash
cd apps/frontend
npm run dev                    # Modo desenvolvimento
npm run build                  # Build produção
npm run preview                # Preview do build
npm run lint                   # ESLint
```

## 📦 Workspaces

Este projeto usa **npm workspaces** para gerenciar múltiplos pacotes:

### Apps

- **@ferraco/frontend**: Aplicação React principal
- **@ferraco/backend**: Backend Node.js (futuro)

### Packages

- **@ferraco/shared**: Código compartilhado (types, utils, constants)
- **@ferraco/ui**: Componentes UI compartilhados (futuro)
- **@ferraco/config**: Configurações ESLint/TypeScript compartilhadas (futuro)

## 🔗 Dependências entre Workspaces

O frontend depende do pacote shared:

```json
{
  "dependencies": {
    "@ferraco/shared": "file:../../packages/shared"
  }
}
```

## 🛠️ Adicionando Dependências

### Dependência global (raiz):
```bash
npm install -D <package> -w root
```

### Dependência específica de um workspace:
```bash
npm install <package> -w @ferraco/frontend
npm install <package> -w @ferraco/backend
npm install <package> -w @ferraco/shared
```

## 📝 TypeScript

### Configuração em Cascata

1. **tsconfig.base.json** (raiz): Configuração base compartilhada
2. **apps/frontend/tsconfig.json**: Estende o base + config específica do frontend
3. **packages/shared/tsconfig.json**: Estende o base + config do pacote shared

### Path Aliases

O frontend usa path aliases configurados em `tsconfig.app.json`:

```typescript
"@/": "./src/"
```

Exemplo de uso:
```typescript
import { Button } from '@/components/ui/button';
import { formatDate } from '@ferraco/shared/utils';
```

## 🔄 Fluxo de Trabalho

### Desenvolvimento Local

1. Clone o repositório
2. Instale as dependências: `npm install`
3. Inicie o dev server: `npm run dev`
4. Acesse: `http://localhost:3000`

### Adicionar novo workspace

1. Crie a pasta em `apps/` ou `packages/`
2. Adicione `package.json` com nome scoped: `@ferraco/<nome>`
3. Os workspaces são auto-descobertos pelo npm

### Integração Backend (Futuro)

Quando o backend for implementado:

1. Backend será em `apps/backend/`
2. Compartilhará types com `packages/shared/`
3. API e Frontend rodarão em portas diferentes
4. Use `@ferraco/shared` para types compartilhados

## ✅ Benefícios desta Estrutura

- ✅ **Separação clara**: Apps vs Packages
- ✅ **Code sharing**: Pacotes compartilhados entre apps
- ✅ **Type safety**: Types compartilhados garantem consistência
- ✅ **Escalabilidade**: Fácil adicionar novos apps/packages
- ✅ **DX melhorada**: Hot reload funciona entre workspaces
- ✅ **Build otimizado**: Apenas rebuilda o que mudou
- ✅ **Preparado para backend**: Estrutura pronta para integração

## 🔍 Troubleshooting

### "Cannot find module @ferraco/shared"

```bash
npm install  # Reinstala os workspaces
```

### Mudanças no shared não refletem no frontend

```bash
# O Vite faz hot reload automático, mas se não funcionar:
npm run dev  # Restart do dev server
```

### TypeScript errors após adicionar novo package

```bash
npm run type-check  # Verifica todos os workspaces
```

## 📚 Referências

- [npm workspaces](https://docs.npmjs.com/cli/v8/using-npm/workspaces)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [Vite](https://vitejs.dev/)
