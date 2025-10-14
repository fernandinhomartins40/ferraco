# WhatsApp Integration - Venom Bot

Integração WhatsApp Web usando **Venom Bot** rodando dentro do mesmo container Node.js (sem containers separados).

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────┐
│ Container: ferraco-crm-vps              │
│                                         │
│  ┌──────────────┐    ┌───────────────┐ │
│  │   Nginx      │    │   Node.js     │ │
│  │   (3050)     │───>│   (3050)      │ │
│  │              │    │               │ │
│  │  Frontend    │    │  ┌─────────┐  │ │
│  │  Arquivos    │    │  │ Express │  │ │
│  │  Estáticos   │    │  │   API   │  │ │
│  └──────────────┘    │  └─────────┘  │ │
│                      │  ┌─────────┐  │ │
│                      │  │ Venom   │  │ │
│                      │  │  Bot    │  │ │
│                      │  └─────────┘  │ │
│                      └───────────────┘ │
└─────────────────────────────────────────┘
         │
         └──> /app/sessions (volume persistente)
```

## 📦 Dependências

```json
{
  "venom-bot": "^5.0.19"
}
```

## 📁 Estrutura de Arquivos

```
apps/backend/src/
├── services/
│   └── whatsappService.ts      # Serviço principal Venom Bot
├── routes/
│   └── whatsapp.routes.ts      # Rotas da API WhatsApp
└── server.ts                    # Inicializa WhatsApp no startup
```

## 🚀 Como Usar

### 1. Iniciar a Aplicação

O WhatsApp é inicializado automaticamente quando o servidor inicia:

```typescript
// apps/backend/src/server.ts
import { whatsappService } from './services/whatsappService';

// Inicialização assíncrona (não bloqueia servidor)
whatsappService.initialize().catch((error) => {
  logger.error('Erro ao inicializar WhatsApp:', error);
});
```

### 2. Obter QR Code

**Endpoint:** `GET /api/whatsapp/qr`

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "success": true,
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "message": "Escaneie o QR Code com o WhatsApp no seu celular"
}
```

**Frontend (React):**
```typescript
const response = await fetch('/api/whatsapp/qr', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();

// Exibir QR Code
<img src={data.qrCode} alt="QR Code WhatsApp" />
```

### 3. Verificar Status

**Endpoint:** `GET /api/whatsapp/status`

**Resposta:**
```json
{
  "success": true,
  "status": {
    "connected": true,
    "hasQR": false,
    "message": "WhatsApp conectado"
  }
}
```

### 4. Enviar Mensagem

**Endpoint:** `POST /api/whatsapp/send`

**Body:**
```json
{
  "to": "5511999999999",
  "message": "Olá! Esta é uma mensagem de teste do Ferraco CRM."
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Mensagem enviada com sucesso",
  "to": "5511999999999"
}
```

**Frontend (React):**
```typescript
const sendMessage = async (phoneNumber: string, message: string) => {
  const response = await fetch('/api/whatsapp/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: phoneNumber,
      message: message
    })
  });

  return response.json();
};
```

### 5. Obter Informações da Conta

**Endpoint:** `GET /api/whatsapp/account`

**Resposta:**
```json
{
  "success": true,
  "account": {
    "phone": "5511999999999",
    "name": "Ferraco CRM",
    "platform": "android"
  }
}
```

### 6. Desconectar

**Endpoint:** `POST /api/whatsapp/disconnect`

**Resposta:**
```json
{
  "success": true,
  "message": "WhatsApp desconectado com sucesso"
}
```

## 📨 Receber Mensagens

As mensagens recebidas são automaticamente processadas pelo listener:

```typescript
// apps/backend/src/services/whatsappService.ts

this.client.onMessage(async (message: Message) => {
  // Processar mensagem
  logger.info(`Mensagem recebida de ${message.from}: ${message.body}`);

  // Salvar no banco de dados
  await this.saveMessageToDatabase({
    from: message.from,
    to: message.to,
    body: message.body,
    timestamp: new Date(message.timestamp * 1000),
    isGroup: message.isGroupMsg,
    fromMe: message.fromMe
  });
});
```

## 💾 Persistência de Sessão

A sessão do WhatsApp é salva em volume Docker:

```yaml
# docker-compose.vps.yml
volumes:
  - ./data/ferraco-whatsapp-sessions:/app/sessions
```

Isso permite:
- ✅ Reconexão automática após reiniciar container
- ✅ Não precisar escanear QR Code novamente
- ✅ Manter histórico de mensagens

## 🗄️ Schema Supabase (Opcional)

Para armazenar mensagens no Supabase:

```sql
CREATE TABLE whatsapp_messages (
  id SERIAL PRIMARY KEY,
  from_number VARCHAR(50) NOT NULL,
  to_number VARCHAR(50) NOT NULL,
  message_body TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  is_group BOOLEAN DEFAULT false,
  from_me BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_whatsapp_from ON whatsapp_messages(from_number);
CREATE INDEX idx_whatsapp_to ON whatsapp_messages(to_number);
CREATE INDEX idx_whatsapp_timestamp ON whatsapp_messages(timestamp DESC);
```

Implementar integração em `whatsappService.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

private async saveMessageToDatabase(message: WhatsAppMessage): Promise<void> {
  const { error } = await supabase
    .from('whatsapp_messages')
    .insert({
      from_number: message.from,
      to_number: message.to,
      message_body: message.body,
      timestamp: message.timestamp,
      is_group: message.isGroup,
      from_me: message.fromMe
    });

  if (error) {
    logger.error('Erro ao salvar mensagem no Supabase:', error);
  }
}
```

## 🔧 Variáveis de Ambiente

```bash
# .env ou docker-compose.vps.yml
WHATSAPP_SESSIONS_PATH=/app/sessions  # Caminho das sessões
PORT=3050                              # Porta do servidor
```

## 🐳 Docker

O Venom Bot roda dentro do container Node.js existente, sem necessidade de container separado:

```dockerfile
# Dockerfile já configurado com:
FROM node:20-alpine

# Dependências do Puppeteer (necessárias para Venom Bot)
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

## ⚠️ Considerações Importantes

1. **Headless Mode**: O Venom Bot roda em modo headless (sem interface gráfica)
2. **Multidevice**: Suporte a WhatsApp multidevice habilitado
3. **Persistência**: Sessões são salvas em volume para reconexão automática
4. **Autenticação**: Todas as rotas exigem token JWT
5. **Não Bloqueia**: A inicialização do WhatsApp não bloqueia o servidor
6. **Logs**: Todos os eventos são logados via Winston
7. **Graceful Shutdown**: WhatsApp desconecta corretamente ao parar o servidor

## 🧪 Testar Localmente

```bash
# 1. Instalar dependências
cd apps/backend
npm install

# 2. Iniciar servidor
npm run dev

# 3. Obter QR Code
curl http://localhost:3000/api/whatsapp/qr \
  -H "Authorization: Bearer <seu-token>"

# 4. Enviar mensagem de teste
curl -X POST http://localhost:3000/api/whatsapp/send \
  -H "Authorization: Bearer <seu-token>" \
  -H "Content-Type: application/json" \
  -d '{"to": "5511999999999", "message": "Teste!"}'
```

## 🚀 Deploy

```bash
# 1. Fazer push
git add .
git commit -m "feat: Adicionar integração WhatsApp com Venom Bot"
git push origin main

# 2. GitHub Actions fará deploy automaticamente

# 3. Na VPS, as sessões serão criadas em:
# /root/ferraco/data/ferraco-whatsapp-sessions/

# 4. Acessar no navegador:
# http://metalurgicaferraco.com/admin/whatsapp
```

## 📚 Recursos

- [Venom Bot Documentation](https://github.com/orkestral/venom)
- [WhatsApp Web.js](https://wwebjs.dev/)
- [Puppeteer](https://pptr.dev/)

## ✅ Checklist de Implementação

- [x] Instalar venom-bot no package.json
- [x] Criar whatsappService.ts com Venom Bot
- [x] Criar rotas /api/whatsapp/*
- [x] Adicionar volume /sessions no Docker
- [x] Inicializar WhatsApp no server.ts
- [x] Registrar rotas no app.ts
- [x] Configurar variável WHATSAPP_SESSIONS_PATH
- [x] Implementar graceful shutdown
- [ ] Criar frontend para exibir QR Code
- [ ] Integrar com Supabase (opcional)
- [ ] Adicionar auto-resposta/chatbot (opcional)
