# 📁 Estrutura do Projeto Ferraco CRM

## 🎯 Visão Geral

Este documento descreve a estrutura de pastas do projeto Ferraco CRM, seguindo melhores práticas para um monorepo com frontend e backend integrados.

## 🗂️ Estrutura de Diretórios

```
ferraco/                              # Raiz do projeto (monorepo)
│
├── 📦 FRONTEND (React + Vite)
│   ├── src/                          # Código fonte do frontend
│   │   ├── components/               # Componentes React
│   │   ├── pages/                    # Páginas da aplicação
│   │   ├── hooks/                    # React hooks customizados
│   │   ├── contexts/                 # React contexts
│   │   ├── utils/                    # Utilitários e helpers
│   │   ├── types/                    # TypeScript types
│   │   └── tests/                    # Testes do frontend
│   ├── public/                       # Assets estáticos
│   ├── dist/                         # Build do frontend (gerado)
│   ├── index.html                    # HTML principal
│   ├── vite.config.ts                # Configuração Vite
│   ├── tailwind.config.ts            # Configuração Tailwind
│   ├── tsconfig.json                 # TypeScript config frontend
│   └── package.json                  # Dependências frontend
│
├── 📦 BACKEND (Node.js + Express + Prisma)
│   └── ferraco-backend/              # Código do backend
│       ├── src/                      # Código fonte do backend
│       │   ├── controllers/          # Controladores Express
│       │   ├── routes/               # Rotas da API
│       │   ├── middlewares/          # Middlewares
│       │   ├── services/             # Lógica de negócio
│       │   ├── utils/                # Utilitários backend
│       │   └── server.ts             # Servidor Express
│       ├── prisma/                   # Configuração Prisma ORM
│       │   ├── schema.prisma         # Schema do banco
│       │   ├── migrations/           # Migrations
│       │   └── seed.ts               # Seed de dados
│       ├── data/                     # Banco SQLite (desenvolvimento)
│       ├── logs/                     # Logs da aplicação
│       ├── dist/                     # Build do backend (gerado)
│       ├── tsconfig.json             # TypeScript config backend
│       ├── package.json              # Dependências backend
│       └── README.md                 # Documentação do backend
│
├── 🐳 DOCKER (Configuração de Container)
│   └── docker/                       # Arquivos Docker
│       ├── nginx.conf                # Configuração Nginx
│       ├── startup.sh                # Script de inicialização
│       └── README.md                 # Guia de deploy Docker
│   ├── Dockerfile                    # Build multi-stage (raiz)
│   ├── docker-compose.yml            # Orquestração (raiz)
│   └── .dockerignore                 # Arquivos ignorados no build
│
├── 📚 DOCUMENTAÇÃO
│   ├── docs/                         # Documentação técnica
│   │   ├── auditoria-*.md            # Auditorias do código
│   │   ├── guia-*.md                 # Guias de implementação
│   │   └── plano-*.md                # Planos de desenvolvimento
│   ├── README.md                     # README principal
│   ├── README-USUARIOS-TESTE.md      # Credenciais de teste
│   ├── IMPLEMENTACAO-*.md            # Relatórios de implementação
│   └── ESTRUTURA-PROJETO.md          # Este arquivo
│
├── ⚙️ CONFIGURAÇÃO
│   ├── .env                          # Variáveis de ambiente (não commitado)
│   ├── .env.example                  # Template de variáveis
│   ├── .gitignore                    # Arquivos ignorados pelo git
│   ├── .eslintrc                     # Configuração ESLint
│   ├── .prettierrc                   # Configuração Prettier
│   └── .claude/                      # Configuração Claude Code
│
└── 📦 OUTROS
    ├── node_modules/                 # Dependências (não commitado)
    ├── package.json                  # Package principal (frontend)
    ├── package-lock.json             # Lock file
    └── vitest.config.ts              # Configuração de testes
```

## 🎨 Arquitetura do Projeto

### Monorepo Híbrido

O projeto utiliza uma estrutura de **monorepo híbrido**:

- **Frontend na raiz**: Código React/Vite está na raiz do projeto
- **Backend em subdiretório**: Código Node.js está em `ferraco-backend/`
- **Docker centralizado**: Configuração Docker na raiz

### Justificativa da Estrutura

1. **Frontend na raiz**:
   - Facilita desenvolvimento local (`npm run dev` direto)
   - Ferramentas de build (Vite) esperam estar na raiz
   - Simplicidade para desenvolvedores frontend

2. **Backend em subdiretório**:
   - Isolamento claro de responsabilidades
   - Permite independência de versionamento
   - Facilita migração futura para microserviços

3. **Docker na raiz**:
   - Build único para deployment
   - Gerenciamento centralizado de containers
   - Simplifica CI/CD

## 🏗️ Fluxo de Build

### Desenvolvimento Local

```bash
# Frontend (raiz)
npm install          # Instala dependências do frontend
npm run dev          # Inicia dev server na porta 3000

# Backend (ferraco-backend/)
cd ferraco-backend
npm install          # Instala dependências do backend
npm run dev          # Inicia API na porta 3002
```

### Build de Produção (Docker)

```bash
# Na raiz do projeto
docker-compose build
docker-compose up -d
```

O Dockerfile multi-stage faz:
1. **Stage 1**: Build do frontend (React + Vite) → `/frontend/dist`
2. **Stage 2**: Build do backend (TypeScript → JavaScript) → `/backend/dist`
3. **Stage 3**: Combina tudo em uma imagem Nginx + Node.js

## 📋 Melhores Práticas Aplicadas

### ✅ O que está CORRETO:

1. **Separação clara frontend/backend**
2. **Docker multi-stage build** (otimização de tamanho)
3. **Configuração centralizada** (.env na raiz)
4. **Documentação organizada** (pasta docs/)
5. **TypeScript em ambos os lados**
6. **Prisma para ORM** (type-safety)
7. **Git ignore adequado**
8. **Health checks no Docker**
9. **Volume persistente para dados**
10. **Nginx como reverse proxy**

### ⚠️ Pontos de Atenção:

1. **Nome da pasta backend**: `ferraco-backend` é redundante
   - **Atual**: `ferraco-backend/`
   - **Ideal**: `backend/` ou `server/`
   - **Razão**: Mantido por compatibilidade com código existente

2. **Package.json duplicado**: Normal em monorepos
   - Raiz: dependências do frontend
   - Backend: dependências do backend

3. **Node_modules duplicado**: Normal em monorepos
   - Cada parte tem suas dependências isoladas

## 🔄 Migração Futura Sugerida

Para seguir 100% as melhores práticas, considere:

### Opção 1: Monorepo Tradicional
```
ferraco/
├── apps/
│   ├── frontend/       # Todo código React
│   └── backend/        # Todo código Node.js
├── packages/           # Código compartilhado
│   └── shared-types/   # Types compartilhados
├── docker/             # Configs Docker
└── package.json        # Root workspace
```

### Opção 2: Repositórios Separados
```
ferraco-frontend/       # Repo separado para frontend
ferraco-backend/        # Repo separado para backend
ferraco-docker/         # Repo separado para infra
```

### Opção 3: Manter Estrutura Atual (Recomendado)
A estrutura atual é **funcional e adequada** para um projeto de médio porte. Mudanças devem ser feitas apenas se o projeto crescer significativamente.

## 🚀 Comandos Úteis

### Frontend
```bash
npm run dev                    # Desenvolvimento
npm run build                  # Build produção
npm test                       # Rodar testes
npm run lint                   # Verificar código
```

### Backend
```bash
cd ferraco-backend
npm run dev                    # Desenvolvimento
npm run build                  # Build produção
npm run prisma:migrate         # Migrations
npm run prisma:studio          # Interface do BD
```

### Docker
```bash
npm run docker:build           # Build da imagem
npm run docker:up              # Iniciar container
npm run docker:down            # Parar container
npm run docker:logs            # Ver logs
npm run docker:shell           # Acessar shell
npm run docker:rebuild         # Rebuild completo
```

## 📊 Tamanhos Aproximados

- **Frontend build**: ~2-3 MB (comprimido)
- **Backend build**: ~500 KB
- **Imagem Docker final**: ~150 MB
- **Node_modules (frontend)**: ~300 MB
- **Node_modules (backend)**: ~80 MB
- **Database SQLite**: ~1-10 MB (dependendo dos dados)

## 🔒 Arquivos Sensíveis (NÃO commitar)

```
.env                    # Variáveis de ambiente
*.db                    # Banco de dados local
*.log                   # Logs
node_modules/           # Dependências
dist/                   # Builds
.DS_Store              # MacOS
Thumbs.db              # Windows
```

## 📝 Convenções de Nomenclatura

- **Pastas**: `kebab-case` ou `camelCase`
- **Componentes React**: `PascalCase.tsx`
- **Utilitários**: `camelCase.ts`
- **Tipos**: `PascalCase` (interfaces/types)
- **Constantes**: `UPPER_SNAKE_CASE`
- **Variáveis/Funções**: `camelCase`

---

**Última atualização**: 2025-10-07
**Versão do projeto**: 2.0.0
