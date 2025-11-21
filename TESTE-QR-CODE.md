# 🧪 Guia de Teste: QR Code WhatsApp

## ✅ Pré-requisitos

1. **Backend rodando:**
   ```bash
   cd apps/backend
   npm run dev
   ```

2. **Frontend rodando:**
   ```bash
   cd apps/frontend
   npm run dev
   ```

3. **Banco de dados:**
   - PostgreSQL ou SQLite configurado
   - Prisma migrations aplicadas

---

## 🔐 Passo 1: Fazer Login

### Erro 401 - Não Autenticado
Se você ver erro **401** ao acessar `/admin/whatsapp`, significa que não está logado.

**Solução:**
1. Abrir `http://localhost:3000/login`
2. Fazer login com usuário administrador
3. Depois acessar `http://localhost:3000/admin/whatsapp`

### Criar Usuário Admin (se necessário)
```bash
cd apps/backend
npm run prisma:studio

# Ou via seed:
npm run prisma:seed
```

---

## 📱 Passo 2: Testar QR Code

### Cenário 1: Primeira Vez (Sem Sessão)
1. Abrir `http://localhost:3000/admin/whatsapp`
2. **Card amarelo** deve aparecer: "WhatsApp Desconectado"
3. Clicar em **"Gerar QR Code"**
4. Botão mostra **"Gerando QR Code..."** (loading)
5. Aguardar **2-5 segundos**
6. **QR Code verde** deve aparecer

### Cenário 2: QR Code Não Aparece
**Verificar logs do backend:**
```bash
# Deve mostrar:
📱 QR Code gerado! Tentativa 1
✅ Tamanho: 45KB
📡 Emitindo QR Code via Socket.IO para 1 cliente(s)
✅ QR Code emitido com sucesso via Socket.IO
```

**Verificar console do frontend (F12):**
```javascript
✅ [Socket.IO] Conectado - solicitando status e QR Code automaticamente
📱 QR Code recebido via Socket.IO
```

### Cenário 3: Erro manual_disconnect
Se aparecer mensagem de `manual_disconnect`, significa que a correção não foi aplicada.

**Verificar commit:**
```bash
git log --oneline | head -5
# Deve incluir: e089a55 fix: Corrigir reinicialização sem emitir manual_disconnect
```

---

## 🐛 Debug

### 1. Backend Não Inicia
```bash
# Verificar porta
netstat -ano | findstr :3000

# Matar processo
taskkill /PID <PID> /F

# Reiniciar
npm run dev
```

### 2. Socket.IO Não Conecta
**Backend:**
```typescript
// apps/backend/src/server.ts:41-47
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    // ...
  },
});
```

**Frontend:**
```typescript
// apps/frontend/src/hooks/useWhatsAppSocket.ts:19
const BACKEND_URL = import.meta.env.VITE_API_URL || window.location.origin;
```

### 3. QR Code Não É Gerado pelo WPPConnect
```bash
# Verificar Chromium/Puppeteer
node -e "console.log(require('puppeteer-core'))"

# Limpar sessão
rm -rf apps/backend/sessions/*

# Reiniciar backend
npm run dev
```

---

## ✅ Checklist Final

- [ ] Login feito em `/login`
- [ ] Backend rodando sem erros
- [ ] Frontend conectado ao backend
- [ ] Socket.IO conectado (console mostra ✅)
- [ ] Card amarelo aparece quando desconectado
- [ ] Botão "Gerar QR Code" funciona
- [ ] QR Code aparece após 2-5 segundos
- [ ] Logs do backend confirmam geração

---

## 📊 Logs Esperados

### Backend
```
🚀 Server running on port 3000
📡 API available at http://localhost:3000/api
🔌 WebSocket server ready for real-time chat
📱 WhatsApp Service inicializado com Socket.IO configurado
🔌 Cliente WebSocket conectado: abc123
📡 Cliente solicitou QR Code via Socket.IO
🔄 Sem QR Code e desconectado - reinicializando automaticamente...
🚀 Inicializando WhatsApp com WPPConnect em background...
📱 QR Code gerado! Tentativa 1
✅ Tamanho: 45KB
📡 Emitindo QR Code via Socket.IO para 1 cliente(s)
✅ QR Code emitido com sucesso via Socket.IO
```

### Frontend (Console)
```
🔌 [Socket.IO] VITE_API_URL: undefined
🔌 [Socket.IO] window.location.origin: http://localhost:3000
🔌 [Socket.IO] BACKEND_URL final: http://localhost:3000
🔌 [Socket.IO] Conectando ao backend: http://localhost:3000
✅ [Socket.IO] Conectado com ID: abc123
✅ [Socket.IO] Transport: polling
✅ [Socket.IO] Conectado - solicitando status e QR Code automaticamente
📱 QR Code recebido via Socket.IO
```

---

**Documento gerado por Claude Code**
**Última atualização:** 21/11/2025
