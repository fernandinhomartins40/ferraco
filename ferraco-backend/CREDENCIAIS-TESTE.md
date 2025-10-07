# 🔐 Credenciais de Teste - Ferraco CRM

**⚠️ IMPORTANTE:** Estas são credenciais de TESTE apenas. Não usar em produção!

---

## 👤 Usuários Criados

### 1. Administrador

- **Email:** `admin@ferraco.com`
- **Username:** `admin`
- **Senha:** `admin123`
- **Role:** `ADMIN`
- **Status:** Ativo ✅

**Permissões:**
- Acesso total ao sistema
- Gerenciamento de usuários
- Configurações globais
- Relatórios avançados
- AI e Analytics

---

### 2. Vendedor

- **Email:** `vendedor@ferraco.com`
- **Username:** `vendedor`
- **Senha:** `admin123`
- **Role:** `SALES`
- **Status:** Ativo ✅

**Permissões:**
- Gerenciar leads atribuídos
- Criar comunicações
- Ver relatórios básicos
- Usar chatbot

---

## 🔑 Hash Bcrypt Usado

```
Senha: admin123
Hash: $2a$10$P9lRAKvUr/7l7B8AATqz9Or87v0rGOubf.9OGUSj3uXtD9RDf1vkO
Rounds: 10
```

---

## 📊 Dados de Teste Criados

### Leads
1. **João Silva** - NOVO, HIGH priority, score 85
2. **Maria Santos** - EM_ANDAMENTO, MEDIUM priority, score 72

### Tags
1. **Urgente** (vermelho) - Sistema
2. **VIP** (dourado)

### Features Testadas
- ✅ AI Analysis (Lead João Silva)
- ✅ Conversion Prediction (78% probabilidade)
- ✅ Lead Scoring (85 pontos)
- ✅ Chatbot Config (3 perguntas)
- ✅ Digital Signature
- ✅ User Preferences
- ✅ Message Templates
- ✅ Pipeline (5 estágios)

---

## 🚀 Como Testar

### 1. Login via API

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@ferraco.com",
  "password": "admin123"
}
```

### 2. Ver Dados no Prisma Studio

```bash
cd ferraco-backend
npx prisma studio
# Abre em http://localhost:5555
```

### 3. Verificar Usuários

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const users = await prisma.user.findMany();
  console.log(users);
}

test();
```

---

## 🔄 Resetar Dados (se necessário)

```bash
cd ferraco-backend

# Método 1: Apenas popular novamente (idempotente)
node prisma/seed.js

# Método 2: Resetar tudo (⚠️ APAGA TUDO)
npx prisma migrate reset
# Depois: node prisma/seed.js
```

---

## 📝 Notas de Segurança

### ⚠️ NUNCA em Produção

- ❌ Não usar `admin123` como senha real
- ❌ Não commitar senhas no código
- ❌ Não usar usuários de teste em produção

### ✅ Para Produção

- ✅ Usar senhas fortes (min 12 caracteres)
- ✅ Implementar 2FA
- ✅ Rotacionar senhas periodicamente
- ✅ Usar variáveis de ambiente
- ✅ Auditar acessos

---

## 🎯 Próximos Passos

1. **Implementar autenticação** no backend
   - JWT tokens
   - Refresh tokens
   - Bcrypt para validação

2. **Criar endpoints de teste**
   ```
   GET  /api/users/me
   POST /api/auth/login
   POST /api/auth/logout
   POST /api/auth/refresh
   ```

3. **Integrar com frontend**
   - AuthContext
   - Login page
   - Protected routes

---

**Criado:** 06/10/2025
**Ambiente:** Desenvolvimento/Teste
**Database:** SQLite (ferraco-backend/prisma/dev.db)
