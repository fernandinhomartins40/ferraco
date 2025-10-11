# 🔐 Credenciais de Acesso - Ferraco CRM

## Usuários de Teste

Após o seed do banco de dados, os seguintes usuários estarão disponíveis:

### 👨‍💼 Administrador (Acesso Total)
- **Email:** `admin@ferraco.com`
- **Senha:** `Admin@123456`
- **Role:** ADMIN
- **Permissões:** Acesso completo ao sistema

### 👔 Gerente (Gerenciamento)
- **Email:** `manager@ferraco.com`
- **Senha:** `User@123456`
- **Role:** MANAGER
- **Permissões:** Gerenciamento de equipe e vendas

### 💼 Vendedor (Vendas)
- **Email:** `vendedor@ferraco.com`
- **Senha:** `User@123456`
- **Role:** SALES
- **Permissões:** Gestão de leads e vendas

### 🎯 Consultor (Consultoria)
- **Email:** `consultor@ferraco.com`
- **Senha:** `User@123456`
- **Role:** CONSULTANT
- **Permissões:** Atendimento e consultoria

### 🛠️ Suporte (Atendimento)
- **Email:** `suporte@ferraco.com`
- **Senha:** `User@123456`
- **Role:** SUPPORT
- **Permissões:** Suporte ao cliente

---

## 🌐 URLs de Acesso

### Produção (VPS)
- **Aplicação:** http://72.60.10.108:3050
- **Login:** http://72.60.10.108:3050/login
- **Admin:** http://72.60.10.108:3050/admin

### Local (Desenvolvimento)
- **Aplicação:** http://localhost:3000
- **Login:** http://localhost:3000/login
- **Admin:** http://localhost:3000/admin

---

## 🔄 Como Rodar o Seed

### Na VPS (via Docker):
```bash
docker exec ferraco-crm-vps sh -c "cd /app/backend && npx prisma db seed"
```

### Local:
```bash
cd apps/backend
npx prisma db seed
```

---

## 📊 Dados Criados pelo Seed

O seed cria automaticamente:
- ✅ 2 Times (Vendas e Suporte)
- ✅ 5 Usuários (com senhas hasheadas)
- ✅ 4 Tags (hot, cold, qualified, novo-cliente)
- ✅ 5 Leads de exemplo
- ✅ 4 Notas
- ✅ 1 Pipeline com 5 Estágios
- ✅ 2 Oportunidades
- ✅ 2 Templates de Comunicação
- ✅ 1 Automação

---

## ⚠️ Importante

- **NÃO** compartilhe estas credenciais publicamente
- Estas são credenciais de **TESTE/DESENVOLVIMENTO**
- Em **PRODUÇÃO**, altere todas as senhas
- O seed **limpa** dados existentes antes de criar novos

---

## 🔒 Segurança

O sistema implementa:
- ✅ Senhas hasheadas com bcrypt (12 rounds)
- ✅ JWT tokens para autenticação
- ✅ Refresh tokens
- ✅ Rate limiting (10 tentativas por minuto)
- ✅ Todas as rotas admin protegidas
- ✅ Validação de permissões por role

---

**Última atualização:** 2025-10-11
**Ferraco CRM v3.0.0**
