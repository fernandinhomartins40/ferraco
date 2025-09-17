# 🚀 Plano de Implementação Backend - Ferraco CRM

## 📋 Auditoria da Aplicação Atual

### **Estado Atual**
- **Frontend**: React + TypeScript + Vite
- **Persistência**: localStorage (9 sistemas diferentes)
- **Funcionalidades**: CRM completo com IA, automações, integrações
- **Dados**: ~50+ entidades complexas com relacionamentos

### **Sistemas de Storage Identificados**
1. **leadStorage** - Gestão central de leads
2. **tagStorage** - Sistema de tags e categorização
3. **communicationStorage** - WhatsApp e templates
4. **automationStorage** - Regras e triggers automáticos
5. **reportStorage** - Analytics e métricas
6. **aiStorage** - IA, análise de sentimento, previsões
7. **crmStorage** - Pipeline, oportunidades, scoring
8. **integrationStorage** - Conectores externos
9. **userStorage** - Usuários, permissões, auditoria

---

## 🎯 Plano de Migração para Backend

### **Stack Tecnológica**
```
nginx (reverse proxy) → Docker containers → Node.js + Prisma + SQLite3
```

### **Arquitetura Alvo**
```
Frontend (React)
    ↓ HTTP/REST
nginx (Port 80/443)
    ↓ Proxy
Backend Container (Port 3000)
    ↓ Prisma ORM
SQLite3 Database
```

---

## 📅 **FASE 1: Infraestrutura e Base** (5-7 dias)

### **1.1 Setup da Infraestrutura**
- **Docker Setup**
  ```dockerfile
  # Dockerfile.backend
  FROM node:18-alpine
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci --only=production
  COPY . .
  EXPOSE 3000
  CMD ["npm", "start"]
  ```

- **Docker Compose**
  ```yaml
  # docker-compose.yml
  version: '3.8'
  services:
    backend:
      build: ./backend
      ports:
        - "3000:3000"
      volumes:
        - ./data:/app/data
        - ./uploads:/app/uploads
      environment:
        - NODE_ENV=production
        - DATABASE_URL=file:./data/ferraco.db

    nginx:
      image: nginx:alpine
      ports:
        - "80:80"
        - "443:443"
      volumes:
        - ./nginx.conf:/etc/nginx/nginx.conf
        - ./dist:/usr/share/nginx/html
      depends_on:
        - backend
  ```

### **1.2 Setup do Backend Node.js**
- **Estrutura do Projeto**
  ```
  backend/
  ├── src/
  │   ├── controllers/     # Route handlers
  │   ├── services/        # Business logic
  │   ├── middleware/      # Auth, validation
  │   ├── routes/          # API routes
  │   ├── utils/           # Helpers
  │   └── app.js          # Express app
  ├── prisma/
  │   ├── schema.prisma   # Database schema
  │   └── migrations/     # Database migrations
  ├── package.json
  └── Dockerfile
  ```

- **Dependências Principais**
  ```json
  {
    "dependencies": {
      "express": "^4.19.2",
      "prisma": "^5.9.1",
      "@prisma/client": "^5.9.1",
      "cors": "^2.8.5",
      "helmet": "^7.1.0",
      "express-rate-limit": "^7.1.5",
      "bcryptjs": "^2.4.3",
      "jsonwebtoken": "^9.0.2",
      "zod": "^3.22.4",
      "winston": "^3.11.0"
    }
  }
  ```

### **1.3 Nginx Configuration**
```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3000;
    }

    server {
        listen 80;

        # Frontend assets
        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
        }

        # Backend API
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
}
```

### **🎯 Entregáveis Fase 1**
- [ ] Container Docker funcionando
- [ ] Backend Node.js básico rodando
- [ ] Nginx proxy configurado
- [ ] Banco SQLite3 inicializado
- [ ] Health check endpoint `/api/health`

---

## 📅 **FASE 2: Database Schema e APIs Core** (7-10 dias)

### **2.1 Schema do Banco de Dados**
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// Core Entities
model Lead {
  id          String   @id @default(cuid())
  name        String
  phone       String
  email       String?
  status      LeadStatus @default(NOVO)
  source      String   @default("website")
  priority    Priority @default(MEDIUM)
  assignedTo  String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relationships
  notes       LeadNote[]
  tags        LeadTag[]
  communications Communication[]
  automations AutomationExecution[]
  opportunities Opportunity[]
  interactions  Interaction[]
  aiAnalysis    AIAnalysis?

  @@map("leads")
}

model LeadNote {
  id        String   @id @default(cuid())
  content   String
  important Boolean  @default(false)
  leadId    String
  lead      Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@map("lead_notes")
}

model Tag {
  id          String    @id @default(cuid())
  name        String    @unique
  color       String
  description String?
  isSystem    Boolean   @default(false)
  createdAt   DateTime  @default(now())

  leads       LeadTag[]

  @@map("tags")
}

model LeadTag {
  leadId String
  tagId  String
  lead   Lead @relation(fields: [leadId], references: [id], onDelete: Cascade)
  tag    Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([leadId, tagId])
  @@map("lead_tags")
}

// Enums
enum LeadStatus {
  NOVO
  EM_ANDAMENTO
  CONCLUIDO
}

enum Priority {
  LOW
  MEDIUM
  HIGH
}
```

### **2.2 APIs Core (Leads + Tags)**
- **Lead Controller**
  ```javascript
  // src/controllers/leadController.js
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  exports.getLeads = async (req, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const leads = await prisma.lead.findMany({
        where: status ? { status } : {},
        include: {
          notes: true,
          tags: { include: { tag: true } },
          communications: true
        },
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      });

      res.json({ leads, total: leads.length });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  ```

### **2.3 Migração de Dados**
- **Script de Migração do localStorage**
  ```javascript
  // scripts/migrate-localStorage.js
  const fs = require('fs');
  const { PrismaClient } = require('@prisma/client');

  async function migrateLeads() {
    const prisma = new PrismaClient();

    // Read from exported localStorage
    const leadsData = JSON.parse(fs.readFileSync('./data/leads-export.json'));

    for (const lead of leadsData) {
      await prisma.lead.create({
        data: {
          id: lead.id,
          name: lead.name,
          phone: lead.phone,
          status: lead.status.toUpperCase(),
          createdAt: new Date(lead.createdAt),
          notes: {
            create: lead.notes?.map(note => ({
              content: note.content,
              important: note.important,
              createdAt: new Date(note.createdAt)
            })) || []
          }
        }
      });
    }
  }
  ```

### **🎯 Entregáveis Fase 2**
- [ ] Schema Prisma completo
- [ ] APIs CRUD para Leads
- [ ] APIs CRUD para Tags
- [ ] Sistema de migração funcionando
- [ ] Validação com Zod
- [ ] Logs estruturados

---

## 📅 **FASE 3: Funcionalidades Avançadas** (10-12 dias)

### **3.1 Sistema de Automações**
```prisma
model Automation {
  id          String   @id @default(cuid())
  name        String
  description String?
  isActive    Boolean  @default(true)
  trigger     Json     // { type: "lead_created", conditions: [...] }
  actions     Json     // [{ type: "add_tag", value: "hot-lead" }]
  createdAt   DateTime @default(now())

  executions  AutomationExecution[]

  @@map("automations")
}

model AutomationExecution {
  id           String     @id @default(cuid())
  automationId String
  leadId       String
  status       ExecutionStatus @default(PENDING)
  result       Json?
  executedAt   DateTime   @default(now())

  automation   Automation @relation(fields: [automationId], references: [id])
  lead         Lead       @relation(fields: [leadId], references: [id])

  @@map("automation_executions")
}
```

### **3.2 Sistema de IA**
```prisma
model AIAnalysis {
  id               String   @id @default(cuid())
  leadId           String   @unique
  sentimentScore   Float
  sentiment        Sentiment
  urgencyLevel     UrgencyLevel
  confidenceScore  Float
  keyTopics        Json
  recommendations  Json
  lastAnalyzed     DateTime @default(now())

  lead             Lead     @relation(fields: [leadId], references: [id])

  @@map("ai_analyses")
}

model ConversionPrediction {
  id                          String   @id @default(cuid())
  leadId                      String
  probability                 Float
  confidence                  Float
  estimatedTimeToConversion   Int
  factors                     Json
  suggestedActions           Json
  lastUpdated                DateTime @default(now())

  @@map("conversion_predictions")
}
```

### **3.3 CRM e Pipeline**
```prisma
model Pipeline {
  id          String          @id @default(cuid())
  name        String
  description String?
  isDefault   Boolean         @default(false)
  businessType String
  createdAt   DateTime        @default(now())

  stages      PipelineStage[]
  opportunities Opportunity[]

  @@map("pipelines")
}

model Opportunity {
  id                String   @id @default(cuid())
  title             String
  description       String?
  value             Float
  currency          String   @default("BRL")
  probability       Int
  expectedCloseDate DateTime
  actualCloseDate   DateTime?
  stage             String
  leadId            String
  pipelineId        String
  createdAt         DateTime @default(now())

  lead              Lead     @relation(fields: [leadId], references: [id])
  pipeline          Pipeline @relation(fields: [pipelineId], references: [id])

  @@map("opportunities")
}
```

### **🎯 Entregáveis Fase 3**
- [ ] Sistema de automações funcionando
- [ ] APIs de IA e análises preditivas
- [ ] CRM com pipeline visual
- [ ] Sistema de scoring de leads
- [ ] WebHooks para integrações
- [ ] Background jobs (Bull/Agenda)

---

## 📅 **FASE 4: Segurança e Produção** (5-7 dias)

### **4.1 Sistema de Autenticação**
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  isActive  Boolean  @default(true)
  roleId    String
  createdAt DateTime @default(now())
  lastLogin DateTime?

  role      Role     @relation(fields: [roleId], references: [id])
  sessions  Session[]
  auditLogs AuditLog[]

  @@map("users")
}

model Role {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  level       Int
  permissions Json

  users       User[]

  @@map("roles")
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}
```

### **4.2 Sistema de Auditoria**
```javascript
// middleware/audit.js
const auditMiddleware = (action) => {
  return async (req, res, next) => {
    const originalSend = res.send;

    res.send = function(data) {
      // Log the action
      prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action,
          resource: req.baseUrl,
          details: {
            method: req.method,
            params: req.params,
            body: req.body,
            response: data
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      originalSend.call(this, data);
    };

    next();
  };
};
```

### **4.3 Segurança e Rate Limiting**
```javascript
// middleware/security.js
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Rate limiting por endpoint
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: 'Muitas requisições, tente novamente em 15 minutos'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // máximo 5 tentativas de login
  skipSuccessfulRequests: true
});

module.exports = { apiLimiter, authLimiter, helmet };
```

### **4.4 Monitoramento e Logs**
```javascript
// utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

module.exports = logger;
```

### **🎯 Entregáveis Fase 4**
- [ ] Autenticação JWT completa
- [ ] Sistema de permissões funcionando
- [ ] Auditoria de todas as ações
- [ ] Rate limiting configurado
- [ ] Logs estruturados
- [ ] Backup automático do banco
- [ ] Health checks completos
- [ ] Documentação da API

---

## 🔧 **Scripts de Deploy e Manutenção**

### **Deploy Script**
```bash
#!/bin/bash
# deploy.sh

echo "🚀 Iniciando deploy do Ferraco CRM..."

# Build do frontend
echo "📦 Building frontend..."
npm run build

# Build dos containers
echo "🐳 Building containers..."
docker-compose build --no-cache

# Backup do banco atual
echo "💾 Backup do banco..."
cp data/ferraco.db data/backup-$(date +%Y%m%d%H%M%S).db

# Deploy
echo "🚀 Deploying..."
docker-compose up -d

# Health check
echo "🏥 Health check..."
sleep 10
curl -f http://localhost/api/health || exit 1

echo "✅ Deploy concluído com sucesso!"
```

### **Backup Script**
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/ferraco"
DATE=$(date +%Y%m%d%H%M%S)

# Criar backup do banco
sqlite3 data/ferraco.db ".backup $BACKUP_DIR/ferraco-$DATE.db"

# Backup dos uploads
tar -czf $BACKUP_DIR/uploads-$DATE.tar.gz uploads/

# Limpar backups antigos (manter últimos 30 dias)
find $BACKUP_DIR -name "*.db" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "✅ Backup concluído: ferraco-$DATE.db"
```

---

## 📊 **Cronograma e Estimativas**

| Fase | Duração | Complexidade | Risco |
|------|---------|--------------|-------|
| **Fase 1** | 5-7 dias | Baixa | Baixo |
| **Fase 2** | 7-10 dias | Média | Médio |
| **Fase 3** | 10-12 dias | Alta | Médio |
| **Fase 4** | 5-7 dias | Média | Baixo |
| **Total** | **27-36 dias** | - | - |

## ✅ **Checklist de Validação**

### **Fase 1**
- [ ] Container sobe sem erros
- [ ] Nginx proxy funciona
- [ ] Health check responde
- [ ] Frontend carrega

### **Fase 2**
- [ ] Banco SQLite criado
- [ ] APIs básicas funcionam
- [ ] Migração localStorage ok
- [ ] Validação de dados ok

### **Fase 3**
- [ ] Automações executam
- [ ] IA analisa leads
- [ ] Pipeline visual funciona
- [ ] Integrações conectam

### **Fase 4**
- [ ] Autenticação funciona
- [ ] Permissões aplicadas
- [ ] Auditoria logando
- [ ] Rate limiting ativo
- [ ] Backups automáticos

---

## 🎯 **Vantagens da Nova Arquitetura**

### **Escalabilidade**
- **Horizontal**: Múltiplos containers backend
- **Vertical**: Recursos dedicados por serviço
- **Database**: Migração futura para PostgreSQL trivial

### **Manutenibilidade**
- **Separação clara**: Frontend/Backend
- **Versionamento**: APIs versionadas
- **Logs estruturados**: Debug facilitado
- **Testes**: Unitários e integração

### **Segurança**
- **Autenticação**: JWT + Sessions
- **Autorização**: Permissões granulares
- **Auditoria**: Log completo de ações
- **Rate Limiting**: Proteção contra ataques

### **Performance**
- **Cache**: Redis para sessões (futuro)
- **CDN**: Assets estáticos
- **Compression**: Gzip no nginx
- **Connection pooling**: Prisma otimizado

---

## 🚨 **Riscos e Mitigações**

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| **Perda de dados na migração** | Baixa | Alto | Backups múltiplos + testes |
| **Performance degradada** | Média | Médio | Profiling + otimização |
| **Complexidade de deploy** | Baixa | Médio | Scripts automatizados |
| **Bugs em produção** | Média | Alto | Testes extensivos + rollback |

---

**🎉 Este plano garante uma migração suave, mantendo todas as funcionalidades existentes enquanto adiciona robustez, segurança e escalabilidade para o futuro do Ferraco CRM!**