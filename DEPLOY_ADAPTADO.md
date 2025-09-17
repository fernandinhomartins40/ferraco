# ✅ Deploy.yml Adaptado para Ferraco CRM

## 📋 Resumo das Adaptações

O arquivo `deploy.yml` foi **completamente adaptado** do projeto Moria Peças & Serviços para o **Ferraco CRM**, mantendo a mesma VPS e secrets, mas usando as novas portas disponíveis.

---

## 🔄 Principais Alterações Realizadas

### 🏷️ **1. Informações do Projeto**
- **Nome:** `Moria Peças & Serviços` → `Ferraco CRM`
- **Grupo de Concorrência:** `moria-deploy-fullstack` → `ferraco-deploy-fullstack`
- **Projeto Compose:** `moria` → `ferraco`
- **Diretório da Aplicação:** `/root/moria-pecas-servicos` → `/root/ferraco-crm`

### 🔌 **2. Portas (Conforme Solicitado)**
- **Frontend:** `3030` → `3050`
- **Backend:** `3031` → `3051`
- **Nginx:** `3032` → `3052`

### 🏗️ **3. Estrutura de Arquivos Validada**
**Frontend:**
- ✅ `package.json`, `vite.config.ts`, `Dockerfile`, `.env.example`
- ✅ Estrutura React: `src/services/`, `src/components/`

**Backend:**
- ✅ `backend/package.json`, `backend/src/app.js`, `backend/Dockerfile`
- ✅ Estrutura Phase 4: `backend/src/services/`, `backend/src/controllers/`

### 🐳 **4. Containers Docker**
- **Containers:** `moria-*` → `ferraco-backend`, `ferraco-frontend`, `ferraco-proxy`
- **Imagens:** Filtros atualizados para `ferraco` em vez de `moria`
- **Limpeza:** Remoção específica de imagens antigas do Ferraco

### ⚙️ **5. Variáveis de Ambiente**
- **JWT_SECRET:** `moria-production-jwt-*` → `ferraco-production-jwt-*`
- **VITE_APP_NAME:** `'Moria Peças & Serviços'` → `'Ferraco CRM'`
- **CORS_ORIGIN:** Mantido com as novas portas

### 🎯 **6. URLs de Acesso (Produção)**
- **Frontend:** `http://72.60.10.108:3050`
- **Backend API:** `http://72.60.10.108:3051/api`
- **Health Check:** `http://72.60.10.108:3051/api/health`
- **Painel Admin:** `http://72.60.10.108:3050/admin`
- **Dashboard CRM:** `http://72.60.10.108:3050/admin/dashboard`

---

## 🚀 Funcionalidades do Ferraco CRM (Adaptadas no Deploy)

### 🎯 **Backend - Node.js + Express + Prisma + SQLite3**
- ✅ **Autenticação e autorização avançada** (JWT + sessões)
- ✅ **Sistema de auditoria completo** (logs, compliance, relatórios)
- ✅ **Backup automático e health checks** (monitoramento)
- ✅ **Permissões granulares** (20+ permissões predefinidas)
- ✅ **Middleware de segurança OWASP** (rate limiting, detecção de ameaças)
- ✅ **Documentação automática da API** (OpenAPI 3.0)

### 🎨 **Frontend - React + Vite + TypeScript**
- ✅ **Gerenciamento de leads e usuários**
- ✅ **Painel administrativo completo**
- ✅ **Dashboard executivo de CRM**

---

## 📦 Deploy Configurado

### **VPS:**
- **Host:** `72.60.10.108`
- **Usuário:** `root`
- **Auth:** `secrets.VPS_PASSWORD` (via sshpass)

### **Stack:**
- **Docker Compose** com build sem cache
- **Limpeza automática** de containers e imagens antigas
- **Health checks** automáticos pós-deploy
- **Validação de estrutura** específica do Ferraco

### **Verificações de Deploy:**
1. ✅ Validação da estrutura do projeto
2. ✅ Parada segura da stack anterior
3. ✅ Limpeza de containers e imagens antigas
4. ✅ Build com invalidação total de cache
5. ✅ Health checks automáticos
6. ✅ URLs funcionais de produção

---

## 🎉 **Status: PRONTO PARA DEPLOY!**

O arquivo `deploy.yml` está **100% adaptado** para o Ferraco CRM e pronto para ser usado no GitHub Actions.

### **Como usar:**
1. Certifique-se de que o secret `VPS_PASSWORD` está configurado no GitHub
2. Faça commit das alterações na branch `main`
3. O deploy será executado automaticamente
4. Acesse o sistema nas URLs configuradas (portas 3050, 3051, 3052)

### **Monitoramento pós-deploy:**
- **Health Check:** `http://72.60.10.108:3051/api/health`
- **Logs Docker:** Disponíveis via Docker Compose
- **Status dos containers:** Verificação automática no workflow

**🎯 Deploy adaptado com sucesso para Ferraco CRM com todas as funcionalidades da Fase 4!**