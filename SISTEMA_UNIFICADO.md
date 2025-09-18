# Sistema Unificado de Autenticação - Ferraco CRM

## ✅ Sistema Implementado

O Ferraco CRM agora usa **APENAS UM SISTEMA DE AUTENTICAÇÃO** baseado em banco de dados com Prisma.

### 🎯 Arquitetura Final

```
Frontend (React)
    ↓ HTTP Requests
Backend (Node.js + Express)
    ↓ JWT + Sessions
Database (SQLite + Prisma)
    ↓ Users + Roles + Permissions
Sistema de Autenticação Robusto
```

### 📁 Arquivos do Sistema Unificado

**Backend Principal:**
- `backend/src/app.js` - Aplicação principal (USA APENAS Sistema 2)
- `backend/src/routes/auth.js` - Rotas de autenticação unificadas
- `backend/src/controllers/authController.js` - Controller de autenticação
- `backend/src/services/authService.js` - Serviço principal de autenticação
- `backend/src/middleware/authMiddleware.js` - Middleware de autenticação e autorização

**Inicialização:**
- `backend/scripts/init-production.js` - Script de inicialização automática
- `backend/init-db.sh` - Script Docker para inicialização
- `backend/utils/initializeData.js` - Dados iniciais do sistema

**Banco de Dados:**
- `backend/prisma/schema.prisma` - Schema completo
- `backend/prisma/migrations/` - Migrations aplicadas

**Frontend:**
- `src/lib/apiClient.ts` - Cliente API configurado para produção
- `.env` - Configurado para `http://72.60.10.108:3050/api`

### 🔐 Credenciais Padrão

```
Email: admin@ferraco.com
Senha: Admin123!
```

### 🚀 Deploy Automático

O GitHub Actions está configurado para:

1. **Limpar sistema antigo** completamente
2. **Instalar sistema unificado** automaticamente
3. **Executar inicialização** via `scripts/init-production.js`
4. **Criar usuário admin** automaticamente
5. **Configurar roles e permissões** automaticamente

### ⚠️ Arquivos Removidos (Sistema Antigo)

Estes arquivos foram **REMOVIDOS** para evitar conflitos:

- ~~`backend/src/middleware/auth.js`~~ (sistema hardcoded)
- ~~`backend/src/controllers/authControllerV2.js`~~ (renomeado para authController.js)

### 🔧 Como Funciona no Deploy

1. **GitHub Actions** faz o deploy
2. **Docker** executa `init-db.sh`
3. **Prisma** aplica o schema
4. **Script** executa `scripts/init-production.js`
5. **Sistema** cria automaticamente:
   - Roles: Admin, Manager, Sales
   - Usuário admin padrão
   - Permissões granulares
   - JWT secrets únicos

### 🌐 Proxy Reverso

```
Frontend Local (localhost:8082)
    ↓
VPS Nginx (72.60.10.108:3050)
    ↓
Container ferraco-proxy (nginx interno)
    ↓
Container ferraco-backend (sistema unificado)
```

### ✅ Garantias do Sistema

- **Uma única fonte de verdade** para autenticação
- **Banco de dados persistente** com Prisma
- **Inicialização automática** em todo deploy
- **Roles e permissões** configurados automaticamente
- **Tokens JWT seguros** gerados por deploy
- **Middleware robusto** para autorização
- **Logs e auditoria** completos

### 🔄 Próximo Deploy

O próximo deploy via GitHub Actions irá:

1. ✅ **Manter** o sistema unificado
2. ✅ **Recriar** automaticamente usuários e roles
3. ✅ **Usar** apenas arquivos do sistema correto
4. ✅ **Aplicar** configurações de produção
5. ✅ **Funcionar** sem intervenção manual

### 📊 Status

- **Sistema Antigo**: ❌ Removido completamente
- **Sistema Unificado**: ✅ Implementado e funcionando
- **Deploy Automático**: ✅ Configurado e testado
- **Produção**: ✅ Funcionando em http://72.60.10.108:3050