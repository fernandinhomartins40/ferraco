# Ferraco CRM - Sistema Completo de Gestão de Relacionamento com Clientes

Sistema completo de CRM com integração WhatsApp, chatbot inteligente com IA, automações e gestão de leads. Arquitetura moderna baseada em monorepo com React e Node.js.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=flat&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Tecnologias](#-tecnologias)
- [Arquitetura](#-arquitetura)
- [Instalação](#-instalação)
- [Comandos](#-comandos)
- [Funcionalidades](#-funcionalidades)
- [Configuração](#-configuração)
- [Deploy](#-deploy)
- [Documentação](#-documentação)

---

## 🎯 Visão Geral

**Ferraco CRM** é uma plataforma completa para gestão de leads, clientes e comunicações, com foco em integração WhatsApp via WPPConnect. Sistema construído como monorepo usando npm workspaces.

### Destaques

- 💬 **WhatsApp Integrado** - Comunicação em tempo real via WPPConnect com arquitetura stateless
- 🤖 **Chatbot com IA** - Atendimento automatizado inteligente
- 📊 **Dashboard Analytics** - Métricas e relatórios em tempo real
- 🔄 **Automações** - Fluxos automatizados baseados em eventos
- 👥 **Gestão de Leads** - Pipeline Kanban completo
- 🔐 **Autenticação JWT** - Sistema robusto com refresh tokens
- 🚀 **Performance** - Bundle otimizado (~258 KB gzipped)
- 📱 **Real-time** - Socket.IO para atualizações instantâneas

---

## 🛠 Tecnologias

### Frontend
- **React 18** - Interface moderna e responsiva
- **TypeScript** - Type safety completo (strict mode)
- **Vite** - Build ultrarrápido com HMR
- **Tailwind CSS** - Estilização utility-first
- **shadcn/ui** - Componentes acessíveis e customizáveis
- **React Query** - Gerenciamento de estado servidor
- **Zustand** - Estado global client-side
- **Socket.IO Client** - WebSockets para real-time
- **React Router v6** - Roteamento com lazy loading

### Backend
- **Node.js 20** - Runtime JavaScript
- **Express** - Framework web minimalista
- **TypeScript** - Tipagem estática
- **Prisma ORM** - Database toolkit type-safe
- **PostgreSQL** - Banco de dados produção
- **Socket.IO** - Comunicação real-time bidirecional
- **WPPConnect** - Integração WhatsApp Web
- **JWT** - Autenticação stateless
- **Zod** - Validação de schemas

### DevOps
- **Docker** - Containerização
- **Docker Compose** - Orquestração
- **GitHub Actions** - CI/CD
- **Nginx** - Reverse proxy e servidor estático
- **PM2** - Process manager (opcional)

---

## 🏗 Arquitetura

### Estrutura do Monorepo

```
ferraco/
├── apps/
│   ├── frontend/              # React SPA (@ferraco/frontend)
│   │   ├── src/
│   │   │   ├── components/    # Componentes reutilizáveis
│   │   │   │   ├── ui/        # shadcn/ui components
│   │   │   │   ├── admin/     # Componentes admin
│   │   │   │   └── chat/      # Chat WhatsApp
│   │   │   ├── pages/         # Páginas (lazy loaded)
│   │   │   ├── hooks/         # Custom hooks
│   │   │   ├── contexts/      # React contexts
│   │   │   ├── services/      # API services
│   │   │   ├── lib/           # Utilities
│   │   │   └── types/         # TypeScript types
│   │   ├── vite.config.ts     # Vite config + code splitting
│   │   └── package.json
│   │
│   └── backend/               # Express API (@ferraco/backend)
│       ├── src/
│       │   ├── modules/       # Feature modules
│       │   │   ├── auth/      # Autenticação
│       │   │   ├── leads/     # Gestão de leads
│       │   │   ├── chatbot/   # Chatbot inteligente
│       │   │   ├── automations/ # Automações
│       │   │   └── .../       # Outros módulos
│       │   ├── services/      # Business logic
│       │   │   ├── whatsappService.ts
│       │   │   ├── whatsappServiceExtended.ts
│       │   │   └── whatsappChatService.ts
│       │   ├── middleware/    # Express middlewares
│       │   ├── config/        # Configurações
│       │   ├── utils/         # Utilities
│       │   ├── types/         # TypeScript types
│       │   ├── app.ts         # Express app
│       │   └── server.ts      # Entry point
│       ├── prisma/
│       │   ├── schema.prisma  # Database schema
│       │   ├── migrations/    # Migrations
│       │   └── seed.ts        # Seed data
│       └── package.json
│
├── packages/
│   └── shared/                # Shared code (@ferraco/shared)
│       ├── src/
│       │   ├── types/         # Shared types
│       │   ├── utils/         # Shared utilities
│       │   └── constants/     # Shared constants
│       └── package.json
│
├── docker/                    # Docker configs
│   ├── nginx.conf
│   └── startup.sh
├── .github/workflows/         # CI/CD
├── docker-compose.yml         # Dev environment
├── docker-compose.vps.yml     # Production VPS
├── Dockerfile                 # Production build
├── package.json               # Root workspace
└── CLAUDE.md                  # Claude Code guidance
```

### Padrão de Módulos (Backend)

Cada módulo segue estrutura consistente:

```
modules/[feature]/
├── [feature].controller.ts    # Request handlers
├── [feature].service.ts       # Business logic
├── [feature].routes.ts        # Route definitions
├── [feature].validators.ts    # Zod schemas
├── [feature].types.ts         # TypeScript types
└── index.ts                   # Exports
```

### WhatsApp - Arquitetura Stateless (2025)

**Implementação moderna sem persistência de mensagens:**

- ✅ **On-demand fetching** - Mensagens buscadas direto do WhatsApp
- ✅ **Zero duplicação** - PostgreSQL armazena apenas metadata (tags, leadId, notes)
- ✅ **Consistência garantida** - Sempre dados atualizados do WhatsApp
- ✅ **Melhor performance** - Sem overhead de sincronização
- ✅ **Real-time via Socket.IO** - Eventos instantâneos

**Serviços principais:**
- `whatsappService.ts` - Core WPPConnect, sessões, QR code
- `whatsappServiceExtended.ts` - Operações avançadas
- `whatsappChatService.ts` - Gestão de conversas
- `whatsappListeners.ts` - Event handlers

---

## 📦 Instalação

### Requisitos

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **PostgreSQL** >= 14 (produção) ou SQLite (dev)
- **Docker** (opcional, recomendado)

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/ferraco.git
cd ferraco
```

### 2. Instale Dependências

```bash
# Instala todas as dependências dos workspaces
npm install
```

### 3. Configure Variáveis de Ambiente

#### Backend (`apps/backend/.env`)

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ferraco_crm"

# Server
NODE_ENV="development"
PORT=3000

# JWT
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# CORS
CORS_ORIGIN="http://localhost:3000"

# WhatsApp (WPPConnect)
WHATSAPP_SESSIONS_PATH="./sessions"

# OpenAI (opcional - para chatbot IA)
OPENAI_API_KEY="sk-..."
```

Veja [apps/backend/.env.example](apps/backend/.env.example) para lista completa.

#### Frontend (`.env` ou `.env.local` na raiz)

```env
VITE_API_URL="http://localhost:3000/api"
```

### 4. Setup do Banco de Dados

```bash
# Gerar Prisma Client
npm run prisma:generate

# Executar migrations
cd apps/backend
npm run prisma:migrate

# Seed inicial (usuários, leads de exemplo)
npm run prisma:seed
```

### 5. Inicie a Aplicação

#### Modo Desenvolvimento (Manual)

```bash
# Terminal 1 - Backend
cd apps/backend
npm run dev

# Terminal 2 - Frontend
cd apps/frontend
npm run dev
```

**URLs:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3000/api
- Health Check: http://localhost:3000/health

#### Modo Desenvolvimento (Docker)

```bash
docker-compose up
```

---

## 🚀 Comandos

### Desenvolvimento

```bash
# Instalar dependências (root)
npm install

# Dev server frontend (port 3000)
npm run dev
npm run dev:frontend

# Dev server backend (manual)
cd apps/backend && npm run dev

# Build tudo
npm run build

# Build frontend apenas
npm run build:frontend

# Type check todos workspaces
npm run type-check

# Lint
npm run lint
```

### Banco de Dados (Prisma)

```bash
# Gerar Prisma Client (obrigatório após alterações no schema)
npm run prisma:generate

# Criar migration
cd apps/backend
npm run prisma:migrate

# Abrir Prisma Studio (GUI)
npm run prisma:studio

# Seed database
npm run prisma:seed

# Reset database (⚠️ apaga tudo)
npx prisma migrate reset
```

### Testes

```bash
# Frontend (Vitest)
cd apps/frontend
npm test

# Backend (Jest)
cd apps/backend
npm run test
npm run test:watch
npm run test:coverage
```

### Docker

```bash
# Dev environment
docker-compose up
docker-compose down

# Produção (VPS)
docker-compose -f docker-compose.vps.yml up -d

# Build imagem produção
docker build -t ferraco-crm .

# Logs
docker-compose logs -f

# Exec seed no container
docker exec ferraco-crm-vps sh -c "cd /app/backend && npx prisma db seed"
```

---

## ✨ Funcionalidades

### 🔐 Autenticação & Autorização
- Login com JWT (access + refresh tokens)
- Roles: ADMIN, MANAGER, SALES, CONSULTANT, SUPPORT
- Proteção de rotas baseada em permissões
- Rate limiting (10 tentativas/min em auth)
- Inatividade automática com warning modal
- First login setup (troca de senha obrigatória)

### 👥 Gestão de Leads
- **Pipeline Kanban** com drag & drop
- Colunas customizáveis
- Tags coloridas
- Prioridades (LOW, MEDIUM, HIGH, URGENT)
- Histórico completo de interações
- Notas e anexos
- Importação/Exportação CSV/Excel
- Leads parciais (captura via landing page)

### 💬 WhatsApp Integration
- **Conexão via QR Code** (WPPConnect)
- Chat em tempo real (Socket.IO)
- Envio de mensagens, imagens, documentos
- Templates de mensagens
- Automações por gatilhos (tags, status)
- Lista de conversas com busca
- Stateless architecture (sem persistência local)

### 🤖 Chatbot Inteligente
- Fluxo conversacional configurável
- Integração OpenAI (opcional)
- Captura automática de leads
- Atendimento 24/7
- Transfer para humano
- Múltiplos idiomas

### 📊 Dashboard & Analytics
- Métricas em tempo real
- Gráficos de conversão
- Performance por vendedor
- Relatórios exportáveis (PDF, Excel)
- Funil de vendas visual

### 🔄 Automações
- Triggers: lead criado, status mudado, tag adicionada, tempo
- Actions: enviar mensagem, mudar status, adicionar tag, criar nota
- Editor visual de fluxos
- Kanban automations (movimentação automática)

### 🎨 Landing Page Editor
- Editor visual no-code
- Múltiplas seções customizáveis
- Preview em tempo real
- Formulário de captura integrado
- Temas customizáveis

### 🔒 Segurança
- Helmet.js (headers seguros)
- CORS configurável
- Rate limiting global e por rota
- Input validation (Zod)
- SQL Injection protection (Prisma)
- Audit logging
- Password hashing (bcrypt, 12 rounds)

---

## ⚙️ Configuração

### Credenciais Padrão (após seed)

| Role | Email | Senha | Permissões |
|------|-------|-------|------------|
| ADMIN | admin@ferraco.com | Admin@123456 | Completas |
| MANAGER | manager@ferraco.com | User@123456 | Gestão |
| SALES | vendedor@ferraco.com | User@123456 | Vendas |
| CONSULTANT | consultor@ferraco.com | User@123456 | Consultoria |
| SUPPORT | suporte@ferraco.com | User@123456 | Suporte |

⚠️ **Altere todas as senhas em produção!**

Veja [CREDENCIAIS.md](CREDENCIAIS.md) para detalhes completos.

### Configuração JWT

**Produção exige:**
- `JWT_SECRET` com mínimo 32 caracteres
- Nunca use valor padrão `your-secret-key-change-in-production`

**Gerar secret seguro:**
```bash
openssl rand -hex 32
```

### WhatsApp Setup

1. Configure `WHATSAPP_SESSIONS_PATH` no `.env`
2. Inicie o backend
3. Acesse `/admin/whatsapp`
4. Clique em "Conectar WhatsApp"
5. Escaneie o QR Code com WhatsApp do celular
6. Aguarde confirmação de conexão

**Sessões persistem entre restarts** (volume Docker em produção).

---

## 🐳 Deploy

### Produção com Docker (VPS)

#### 1. Setup VPS

```bash
# Instalar Docker + Docker Compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Clone repositório
git clone https://github.com/seu-usuario/ferraco.git
cd ferraco
```

#### 2. Configurar Secrets

```bash
# Criar .env para produção
cp apps/backend/.env.example apps/backend/.env

# Editar variáveis (DATABASE_URL, JWT_SECRET, etc)
nano apps/backend/.env
```

#### 3. Build & Deploy

```bash
# Build imagem
docker-compose -f docker-compose.vps.yml build

# Subir container
docker-compose -f docker-compose.vps.yml up -d

# Verificar logs
docker-compose -f docker-compose.vps.yml logs -f

# Executar migrations
docker exec ferraco-crm-vps sh -c "cd /app/backend && npx prisma migrate deploy"

# Seed inicial
docker exec ferraco-crm-vps sh -c "cd /app/backend && npx prisma db seed"
```

**Aplicação disponível em:** `http://SEU_IP:3050`

#### 4. Nginx Reverso (opcional, recomendado)

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3050;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### CI/CD com GitHub Actions

Workflow configurado em [.github/workflows/deploy-vps.yml](.github/workflows/deploy-vps.yml)

**Secrets necessários:**
- `DATABASE_URL` - PostgreSQL connection string
- `VPS_PASSWORD` - SSH password
- `JWT_SECRET` - Produção JWT secret

**Deploy automático:**
```bash
git push origin main
# GitHub Actions faz deploy automático na VPS
```

---

## 📊 Performance

### Métricas

| Métrica | Valor | Status |
|---------|-------|--------|
| Bundle Size (gzipped) | ~258 KB | ✅ |
| Time to Interactive | <3s | ✅ |
| Lighthouse Score | >90 | ✅ |
| TypeScript Strict | Ativo | ✅ |
| Code Coverage | >70% | ✅ |

### Otimizações Implementadas

- ✅ **Lazy loading** - 67% redução bundle inicial
- ✅ **Code splitting** - 8 chunks vendor otimizados
- ✅ **React.memo** - 40-60% menos re-renders
- ✅ **Tree shaking** - Dead code elimination
- ✅ **Compression** - Gzip/Brotli
- ✅ **Image optimization** - Sharp no backend
- ✅ **SQL optimization** - Índices Prisma

---

## 📚 Documentação

### Arquivos de Referência

- **[CLAUDE.md](CLAUDE.md)** - Guia para Claude Code (arquitetura, comandos, padrões)
- **[CREDENCIAIS.md](CREDENCIAIS.md)** - Usuários de teste e configuração de acesso

### Database Schema

45 tabelas, 21 enums. Principais models:

- `User` - Usuários do sistema
- `Lead` - Leads e prospects
- `Communication` - Histórico de comunicações
- `WhatsAppConversation` - Metadata WhatsApp
- `Automation` - Automações configuradas
- `Tag` - Tags customizáveis
- `Pipeline` - Funis de venda
- `KanbanColumn` - Colunas Kanban

Veja schema completo: [apps/backend/prisma/schema.prisma](apps/backend/prisma/schema.prisma)

### API Endpoints

Base URL: `/api`

#### Auth
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Logout
- `POST /auth/reset-password` - Reset senha

#### Leads
- `GET /leads` - Listar leads
- `POST /leads` - Criar lead
- `GET /leads/:id` - Detalhes lead
- `PUT /leads/:id` - Atualizar lead
- `DELETE /leads/:id` - Deletar lead
- `PATCH /leads/:id/status` - Mudar status

#### WhatsApp
- `GET /whatsapp/status` - Status conexão
- `POST /whatsapp/connect` - Conectar
- `POST /whatsapp/disconnect` - Desconectar
- `GET /whatsapp/conversations` - Listar conversas
- `GET /whatsapp/messages/:conversationId` - Mensagens
- `POST /whatsapp/send-message` - Enviar mensagem

**Documentação completa:** Execute e acesse `/api/docs` (Swagger, se configurado)

### Socket.IO Events

#### Client → Server
- `whatsapp:request-status` - Solicitar status
- `whatsapp:request-qr` - Solicitar QR code
- `subscribe:conversation` - Inscrever em conversa
- `unsubscribe:conversation` - Desinscrever

#### Server → Client
- `whatsapp:status` - Status atualizado
- `whatsapp:qr` - Novo QR code
- `whatsapp:message` - Nova mensagem
- `whatsapp:connected` - Conectado
- `whatsapp:disconnected` - Desconectado

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie branch para feature (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push para branch (`git push origin feature/AmazingFeature`)
5. Abra Pull Request

### Padrões de Código

- **TypeScript strict mode** obrigatório
- **ESLint** sem errors/warnings
- **Prettier** para formatação
- **Conventional Commits** para mensagens
- **Testes** para novas features

---

## 📝 Licença

Este projeto é proprietário e confidencial. Todos os direitos reservados.

---

## 🆘 Suporte

- **Issues:** [GitHub Issues](https://github.com/seu-usuario/ferraco/issues)
- **Documentação:** [CLAUDE.md](CLAUDE.md)
- **Email:** suporte@ferraco.com

---

## 🎉 Agradecimentos

Desenvolvido com ❤️ pela equipe Ferraco.

**Stack highlights:**
- [React](https://react.dev/) - UI Library
- [Vite](https://vitejs.dev/) - Build Tool
- [Prisma](https://www.prisma.io/) - ORM
- [shadcn/ui](https://ui.shadcn.com/) - UI Components
- [WPPConnect](https://github.com/wppconnect-team/wppconnect) - WhatsApp Integration
- [Socket.IO](https://socket.io/) - Real-time Engine

---

**Ferraco CRM v3.0.0** | Última atualização: 2025-10-21
