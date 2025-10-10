# Ferraco CRM - Backend API

Backend RESTful API construído com Node.js, TypeScript, Express, Prisma e SQLite.

## 🚀 Quick Start

### Pré-requisitos

- Node.js >= 18.0.0
- npm >= 9.0.0

### Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env

# Gerar Prisma Client
npm run prisma:generate

# Executar migrations
npm run prisma:migrate

# (Opcional) Seed do banco de dados
npm run prisma:seed
```

### Desenvolvimento

```bash
# Iniciar servidor em modo desenvolvimento
npm run dev

# Servidor rodando em http://localhost:3000
# API disponível em http://localhost:3000/api
# Health check em http://localhost:3000/health
```

### Build e Produção

```bash
# Build para produção
npm run build

# Iniciar servidor de produção
npm start
```

### Docker

```bash
# Desenvolvimento
docker-compose up

# Produção
docker-compose -f docker-compose.prod.yml up -d
```

## 📁 Estrutura do Projeto

```
src/
├── config/              # Configurações (database, jwt, constants)
├── middleware/          # Middlewares (auth, validation, error-handler, audit)
├── modules/            # Módulos da aplicação
│   ├── auth/           # Autenticação e autorização
│   ├── leads/          # Gestão de leads
│   ├── notes/          # Notas
│   ├── tags/           # Tags e categorização
│   ├── pipeline/       # Pipeline/CRM
│   ├── communications/ # WhatsApp, Email, SMS
│   ├── automations/    # Automações
│   ├── reports/        # Relatórios
│   ├── dashboard/      # Dashboard
│   ├── integrations/   # Integrações externas
│   └── ai/             # IA e Analytics
├── utils/              # Utilitários (logger, response, password)
├── types/              # Tipos TypeScript globais
├── app.ts              # Configuração do Express
└── server.ts           # Entry point

prisma/
└── schema.prisma       # Schema do banco de dados

tests/
├── unit/               # Testes unitários
├── integration/        # Testes de integração
└── e2e/                # Testes end-to-end
```

## 🔒 Autenticação

A API usa JWT (JSON Web Tokens) para autenticação.

### Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@ferraco.com",
  "password": "Admin@123456"
}
```

Resposta:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "admin@ferraco.com",
      "name": "Admin",
      "role": "ADMIN"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": "15m"
  }
}
```

### Usar o Token

```bash
GET /api/leads
Authorization: Bearer eyJhbGc...
```

## 📚 Endpoints Principais

### Auth
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Renovar token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Dados do usuário logado
- `PUT /api/auth/change-password` - Trocar senha

### Leads
- `GET /api/leads` - Listar leads (paginado, com filtros)
- `GET /api/leads/:id` - Buscar lead por ID
- `POST /api/leads` - Criar lead
- `PUT /api/leads/:id` - Atualizar lead
- `DELETE /api/leads/:id` - Deletar lead (soft delete)
- `GET /api/leads/stats` - Estatísticas de leads
- `GET /api/leads/duplicates` - Detectar duplicatas
- `POST /api/leads/merge` - Merge de leads duplicados

## 🔐 Permissões

O sistema possui 5 roles com permissões granulares:

- **ADMIN**: Acesso total ao sistema
- **MANAGER**: Gestão de equipe e relatórios
- **SALES**: Gestão de leads e oportunidades
- **CONSULTANT**: Consulta e atualização de leads próprios
- **SUPPORT**: Suporte e visualização limitada

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Testes em modo watch
npm run test:watch

# Coverage
npm run test:coverage
```

## 🛠️ Scripts Disponíveis

- `npm run dev` - Desenvolvimento com hot reload
- `npm run build` - Build para produção
- `npm start` - Iniciar servidor de produção
- `npm run prisma:generate` - Gerar Prisma Client
- `npm run prisma:migrate` - Executar migrations
- `npm run prisma:studio` - Abrir Prisma Studio (GUI do banco)
- `npm run prisma:seed` - Seed do banco de dados
- `npm test` - Executar testes
- `npm run lint` - Linter
- `npm run type-check` - Type check do TypeScript

## 📊 Monitoramento

### Health Check

```bash
GET /health

{
  "status": "ok",
  "timestamp": "2025-10-10T12:00:00.000Z",
  "uptime": 123.45
}
```

## 🐛 Debug

### Prisma Studio

```bash
npm run prisma:studio
# Abrir navegador em http://localhost:5555
```

### Logs

Os logs são gravados em:
- Console (desenvolvimento)
- `logs/error.log` (erros em produção)
- `logs/combined.log` (todos os logs em produção)

## 🔧 Variáveis de Ambiente

Ver `.env.example` para todas as variáveis disponíveis.

Principais:
- `DATABASE_URL` - URL do banco de dados
- `JWT_SECRET` - Secret para JWT
- `PORT` - Porta do servidor
- `NODE_ENV` - Ambiente (development/production)
- `CORS_ORIGIN` - Origins permitidas

## 📝 Documentação Adicional

- [PLANO-IMPLEMENTACAO-BACKEND.md](../../docs/backend/PLANO-IMPLEMENTACAO-BACKEND.md) - Plano completo de implementação
- [FASE-7-AUTENTICACAO.md](../../docs/backend/FASE-7-AUTENTICACAO.md) - Sistema de autenticação
- [FASE-8-APIS-CORE.md](../../docs/backend/FASE-8-APIS-CORE.md) - APIs Core (Leads, Notes, Tags)
- [FASE-9-APIS-AVANCADAS.md](../../docs/backend/FASE-9-APIS-AVANCADAS.md) - APIs Avançadas
- [README-BACKEND.md](../../README-BACKEND.md) - Índice completo

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Add: nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é proprietário da Ferraco.

---

**Desenvolvido com ❤️ pela equipe Ferraco**
