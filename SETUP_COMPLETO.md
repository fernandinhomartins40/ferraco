# 🚀 Setup Completo - Ferraco CRM com API Externa

## ⚠️ STATUS ATUAL

A API Externa foi **implementada no código**, mas **NÃO está funcional** ainda porque:

1. ❌ Banco de dados PostgreSQL não está configurado
2. ❌ Migrations não foram rodadas
3. ❌ Servidor não está iniciando
4. ❌ Frontend não foi testado

---

## 📋 Checklist de Setup

### PASSO 1: Configurar Banco de Dados PostgreSQL

#### Opção A: Usar PostgreSQL Local

```bash
# 1. Instalar PostgreSQL (se não tiver)
# Windows: https://www.postgresql.org/download/windows/
# Linux: sudo apt-get install postgresql
# Mac: brew install postgresql

# 2. Criar banco de dados
psql -U postgres
CREATE DATABASE ferraco_crm;
CREATE USER ferraco WITH PASSWORD 'ferraco';
GRANT ALL PRIVILEGES ON DATABASE ferraco_crm TO ferraco;
\q

# 3. Atualizar .env
DATABASE_URL="postgresql://ferraco:ferraco@localhost:5432/ferraco_crm?schema=public"
```

#### Opção B: Usar Docker (RECOMENDADO)

```bash
# 1. Criar docker-compose.yml para PostgreSQL
cd "c:\Projetos Cursor\ferraco"

# 2. Criar arquivo docker-compose.dev.yml
cat > docker-compose.dev.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: ferraco-postgres
    environment:
      POSTGRES_USER: ferraco
      POSTGRES_PASSWORD: ferraco
      POSTGRES_DB: ferraco_crm
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ferraco"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
EOF

# 3. Iniciar PostgreSQL
docker-compose -f docker-compose.dev.yml up -d

# 4. Verificar se está rodando
docker ps | grep ferraco-postgres
```

#### Opção C: Usar SQLite (Para testes rápidos)

```bash
# 1. Atualizar apps/backend/.env
DATABASE_URL="file:./dev.db"

# 2. Atualizar apps/backend/prisma/schema.prisma
# Trocar de:
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

# Para:
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

---

### PASSO 2: Rodar Migrations

```bash
cd apps/backend

# 1. Gerar Prisma Client
npx prisma generate

# 2. Rodar migrations (cria todas as tabelas)
npx prisma migrate deploy

# OU se der erro, forçar reset
npx prisma migrate reset --force
npx prisma migrate deploy

# 3. Verificar tabelas criadas
npx prisma studio
# Abrir http://localhost:5555 e verificar se as tabelas existem
```

**Tabelas que devem ser criadas:**
- ✅ users
- ✅ leads
- ✅ communications
- ✅ tags
- ✅ webhooks
- ✅ webhook_deliveries
- ✅ api_keys
- ✅ api_usage_logs
- ✅ event_logs
- ✅ (+ 36 outras tabelas existentes)

---

### PASSO 3: Seed do Banco (Usuário Admin)

```bash
cd apps/backend

# Criar seed script (se não existir)
cat > prisma/seed.ts << 'EOF'
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Criar usuário admin
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ferraco.com' },
    update: {},
    create: {
      email: 'admin@ferraco.com',
      username: 'admin',
      name: 'Administrador',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
      isFirstLogin: false,
    },
  });

  console.log('✅ Usuário admin criado:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
EOF

# Rodar seed
npx tsx prisma/seed.ts
```

---

### PASSO 4: Iniciar Backend

```bash
cd apps/backend

# Modo desenvolvimento
npm run dev

# Verificar logs
# Deve aparecer:
# ✅ Database connected successfully
# ✅ All routes registered successfully
# 📚 API Documentation available at /api-docs
# 🚀 Server running on port 3001
```

**Se der erro:**
- Verificar se PostgreSQL está rodando: `docker ps` ou `pg_isready`
- Verificar credenciais no .env
- Verificar logs: `tail -f logs/app.log`

---

### PASSO 5: Testar API

```bash
# 1. Health check
curl http://localhost:3001/health

# 2. Login admin
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ferraco.com",
    "password": "admin123"
  }'

# Copiar o token da resposta

# 3. Criar API Key
curl -X POST http://localhost:3001/api/api-keys \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste API Key",
    "scopes": ["leads:read", "leads:write", "webhooks:manage"],
    "rateLimitPerHour": 1000
  }'

# Salvar o "key" e "secret" retornados

# 4. Testar API Externa
curl http://localhost:3001/api/v1/external/leads \
  -H "X-API-Key: pk_live_..." \
  -H "X-API-Secret: sk_live_..."

# 5. Acessar Swagger
# Abrir: http://localhost:3001/api-docs
```

---

### PASSO 6: Iniciar Frontend

```bash
cd apps/frontend

# Instalar dependências
npm install

# Iniciar dev server
npm run dev

# Abrir http://localhost:3000
```

**Verificar:**
- ✅ Página de login aparece
- ✅ Fazer login com admin@ferraco.com / admin123
- ✅ Dashboard carrega
- ✅ Leads podem ser criados/editados

---

### PASSO 7: Testar Integração Completa

#### Criar Lead via API Externa

```bash
curl -X POST http://localhost:3001/api/v1/external/leads \
  -H "X-API-Key: pk_live_..." \
  -H "X-API-Secret: sk_live_..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "+5511999999999",
    "source": "API"
  }'
```

#### Verificar no Frontend

1. Abrir http://localhost:3000/leads
2. Lead "João Silva" deve aparecer na lista
3. Verificar que source = "API"

#### Criar Webhook

```bash
curl -X POST http://localhost:3001/api/v1/external/webhooks \
  -H "X-API-Key: pk_live_..." \
  -H "X-API-Secret: sk_live_..." \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://webhook.site/seu-unique-id",
    "events": ["lead.created", "lead.updated"]
  }'
```

#### Testar Webhook

1. Criar lead via API (como acima)
2. Verificar em https://webhook.site se recebeu o evento
3. Validar payload e signature

---

## 🐛 Troubleshooting

### Erro: "User ferraco was denied access"

```bash
# Conectar no PostgreSQL como superuser
psql -U postgres

# Dar permissões
GRANT ALL PRIVILEGES ON DATABASE ferraco_crm TO ferraco;
GRANT ALL ON SCHEMA public TO ferraco;
ALTER DATABASE ferraco_crm OWNER TO ferraco;
```

### Erro: "relation does not exist"

```bash
# Deletar e recriar migrations
cd apps/backend
rm -rf prisma/migrations
npx prisma migrate dev --name init
```

### Erro: "Port 3001 already in use"

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3001 | xargs kill -9
```

### Erro: "Cannot find module bcryptjs"

```bash
cd apps/backend
npm install bcryptjs
npm install -D @types/bcryptjs
```

### Frontend não conecta ao backend

Verificar CORS em `apps/backend/.env`:
```
CORS_ORIGIN="http://localhost:3000"
```

---

## ✅ Checklist Final

Antes de considerar a implementação completa:

- [ ] PostgreSQL rodando e acessível
- [ ] Migrations aplicadas (todas as 45+ tabelas criadas)
- [ ] Usuário admin criado via seed
- [ ] Backend inicia sem erros
- [ ] Health check responde: `curl http://localhost:3001/health`
- [ ] Login funciona: POST /api/auth/login
- [ ] API Key pode ser criada: POST /api/api-keys
- [ ] API Externa responde: GET /api/v1/external/leads
- [ ] Swagger acessível: http://localhost:3001/api-docs
- [ ] Frontend inicia: npm run dev
- [ ] Login no frontend funciona
- [ ] Dashboard carrega dados
- [ ] Lead criado via API aparece no frontend
- [ ] Webhook recebe eventos

---

## 📊 Status Real Atual

### ✅ Código Implementado (100%)
- Todos os arquivos TypeScript criados
- Modelos Prisma definidos
- Migrations SQL geradas
- Documentação escrita

### ❌ Sistema Funcional (0%)
- Banco de dados não configurado
- Servidor não inicia
- Nenhum teste foi executado
- Frontend não validado

### 🎯 Próximos Passos Obrigatórios

1. **CONFIGURAR PostgreSQL** (escolher opção A, B ou C acima)
2. **RODAR MIGRATIONS** (`npx prisma migrate deploy`)
3. **CRIAR USUÁRIO ADMIN** (`npx tsx prisma/seed.ts`)
4. **INICIAR BACKEND** (`npm run dev`)
5. **TESTAR ENDPOINTS** (seguir comandos curl acima)
6. **VALIDAR FRONTEND** (verificar integração)

---

## 💡 Recomendação

**Use Docker (Opção B)** para setup mais rápido:

```bash
# 1. PostgreSQL via Docker
docker-compose -f docker-compose.dev.yml up -d

# 2. Migrations
cd apps/backend
npx prisma migrate deploy

# 3. Seed
npx tsx prisma/seed.ts

# 4. Iniciar backend
npm run dev

# 5. Testar
curl http://localhost:3001/health
```

Isso deve fazer tudo funcionar em **5 minutos**.

---

**Última atualização**: 18/11/2025
**Status**: Código completo, mas sistema NÃO funcional ainda
