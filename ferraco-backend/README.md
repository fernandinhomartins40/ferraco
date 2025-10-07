# Ferraco CRM - Backend API

Backend REST API para o sistema Ferraco CRM, construído com Node.js, TypeScript, Prisma e SQLite.

## 🚀 Stack Tecnológica

- **Runtime**: Node.js 20+
- **Linguagem**: TypeScript 5.3+
- **Framework**: Express.js
- **ORM**: Prisma
- **Banco de Dados**: SQLite 3 (PostgreSQL-ready)
- **Autenticação**: JWT (JSON Web Tokens)
- **Validação**: Zod
- **Logging**: Winston
- **Containerização**: Docker + Docker Compose
- **Reverse Proxy**: Nginx

## 📋 Pré-requisitos

- Node.js >= 20.0.0
- npm >= 9.0.0
- Docker e Docker Compose (opcional, para deploy)

## 🛠️ Instalação

### 1. Clonar o repositório

```bash
git clone <repository-url>
cd ferraco-backend
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` e configure as variáveis:

```env
NODE_ENV=development
PORT=3002
DATABASE_URL=file:./data/ferraco.db
JWT_SECRET=seu-secret-super-seguro-aqui-min-32-chars
```

⚠️ **IMPORTANTE**: Em produção, use um `JWT_SECRET` forte e aleatório com no mínimo 32 caracteres.

### 4. Gerar Prisma Client

```bash
npm run prisma:generate
```

### 5. Executar migrations

```bash
npm run prisma:migrate
```

### 6. Popular o banco de dados (seed)

```bash
npm run prisma:seed
```

Este comando criará:
- ✅ Usuário admin: `admin@ferraco.com` / `admin123`
- ✅ Usuário vendas: `vendas@ferraco.com` / `sales123`
- ✅ Permissões do sistema
- ✅ Tags padrão

## 🏃 Executar o projeto

### Modo desenvolvimento

```bash
npm run dev
```

A API estará disponível em: `http://localhost:3002`

### Modo produção

```bash
npm run build
npm start
```

## 🐳 Deploy com Docker

### Build e iniciar containers

```bash
npm run docker:build
npm run docker:up
```

A API estará disponível através do Nginx em: `http://localhost`

### Ver logs

```bash
npm run docker:logs
```

### Parar containers

```bash
npm run docker:down
```

## 📚 Endpoints da API

### Health Check

```
GET /api/health
```

### Autenticação

```
POST /api/auth/login         - Login
POST /api/auth/register      - Registro
GET  /api/auth/me           - Usuário autenticado
POST /api/auth/logout       - Logout
POST /api/auth/change-password - Alterar senha
```

### Usuários (Admin only)

```
GET    /api/users           - Listar usuários
GET    /api/users/:id       - Obter usuário
POST   /api/users           - Criar usuário
PUT    /api/users/:id       - Atualizar usuário
DELETE /api/users/:id       - Deletar usuário
```

## 🔐 Autenticação

A API usa JWT (JSON Web Tokens) para autenticação. Inclua o token no header:

```
Authorization: Bearer <seu-token>
```

## 🗄️ Banco de Dados

### Prisma Studio (GUI para o banco)

```bash
npm run prisma:studio
```

Abrirá em: `http://localhost:5555`

### Criar nova migration

```bash
npm run prisma:migrate
```

### Reset do banco (⚠️ apaga todos os dados)

```bash
npx prisma migrate reset
```

## 📦 Scripts disponíveis

```bash
npm run dev              # Desenvolvimento com hot reload
npm run build            # Build para produção
npm start                # Iniciar servidor produção
npm run prisma:generate  # Gerar Prisma Client
npm run prisma:migrate   # Executar migrations
npm run prisma:deploy    # Deploy migrations (produção)
npm run prisma:seed      # Popular banco de dados
npm run prisma:studio    # Abrir Prisma Studio
npm run docker:build     # Build Docker images
npm run docker:up        # Iniciar containers
npm run docker:down      # Parar containers
npm run docker:logs      # Ver logs dos containers
```

## 🏗️ Estrutura do Projeto

```
ferraco-backend/
├── prisma/
│   ├── schema.prisma          # Schema do banco de dados
│   ├── migrations/            # Migrations do Prisma
│   └── seed.ts               # Dados iniciais
├── src/
│   ├── config/               # Configurações (DB, JWT, etc)
│   ├── middleware/           # Middlewares (auth, error, etc)
│   ├── modules/              # Módulos da aplicação
│   │   ├── auth/            # Autenticação
│   │   └── users/           # Usuários
│   ├── utils/               # Utilitários (logger, etc)
│   ├── types/               # Tipos TypeScript
│   ├── app.ts               # Configuração Express
│   └── server.ts            # Inicialização do servidor
├── docker/
│   ├── Dockerfile           # Dockerfile da aplicação
│   └── nginx.conf           # Configuração Nginx
├── docker-compose.yml       # Docker Compose
├── package.json
├── tsconfig.json
└── README.md
```

## 🔒 Segurança

- ✅ JWT com expiração configurável
- ✅ Hash de senhas com bcrypt (10 rounds)
- ✅ Sistema de permissões granular
- ✅ Helmet.js para headers de segurança
- ✅ CORS configurável
- ✅ Rate limiting (10 req/s por IP)
- ✅ Validação de entrada com Zod
- ✅ Prisma ORM (previne SQL injection)
- ✅ Logs centralizados com Winston

## 🚧 Próximas Fases

### Fase 2: Core Features
- [ ] CRUD completo de Leads
- [ ] CRUD completo de Notes
- [ ] CRUD completo de Tags
- [ ] Dashboard metrics endpoint

### Fase 3: Features Avançadas
- [ ] Automações básicas
- [ ] Templates de mensagem
- [ ] Comunicações (WhatsApp/Email)
- [ ] Relatórios básicos

### Fase 4: Advanced
- [ ] Pipeline/CRM completo
- [ ] Lead scoring
- [ ] Detecção de duplicatas
- [ ] Integrações externas

## 📝 Licença

MIT

## 👥 Equipe

Ferraco CRM Team

---

**Versão**: 1.0.0
**Última atualização**: 2025
