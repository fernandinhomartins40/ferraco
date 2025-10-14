# 📱 Sistema de Chat WhatsApp - Plano de Implementação

## 📋 Visão Geral

Implementação de um sistema de chat completo estilo WhatsApp Web, com lista de conversas à esquerda e área de chat à direita, com persistência em PostgreSQL e sincronização em tempo real.

---

## 🎯 Objetivos

- ✅ Interface estilo WhatsApp Web (sidebar + chat)
- ✅ Persistência de todas as mensagens no PostgreSQL
- ✅ Sincronização automática com WPPConnect
- ✅ Atualização em tempo real via WebSocket
- ✅ Suporte a texto e mídia (imagens, vídeos, documentos)
- ✅ Status de leitura e entrega
- ✅ Busca e filtros

---

## 📊 Arquitetura

```
┌─────────────────────────────────────────┐
│         FRONTEND (React)                 │
│  ┌─────────────┐    ┌─────────────┐    │
│  │  Lista de   │    │   Área de   │    │
│  │  Conversas  │───▶│    Chat     │    │
│  │  (Sidebar)  │    │  (Mensagens)│    │
│  └─────────────┘    └─────────────┘    │
└─────────┬────────────────────┬───────────┘
          │    WebSocket       │
┌─────────┼────────────────────┼───────────┐
│         │    BACKEND API     ▼           │
│  ┌──────▼──────────┐  ┌─────────────┐  │
│  │  WebSocket      │  │  REST API   │  │
│  │  (Socket.io)    │  │  Endpoints  │  │
│  └────────┬────────┘  └─────┬───────┘  │
│      ┌────▼──────────────────▼──────┐  │
│      │  WhatsApp Chat Service       │  │
│      │  ↕️  WPPConnect               │  │
│      └────┬─────────────────────────┘  │
└───────────┼───────────────────────────┘
┌───────────▼───────────────────────────┐
│   PostgreSQL Database                  │
│  • WhatsAppContact                     │
│  • WhatsAppConversation                │
│  • WhatsAppMessage                     │
└───────────────────────────────────────┘
```

---

## 📦 Fases de Implementação

### **FASE 1: Database & Models** (30% do projeto)

**Objetivo:** Criar estrutura de dados e migrations

**Tarefas:**
1. ✅ Criar schema Prisma (3 novos models + enums)
2. ✅ Gerar migration
3. ✅ Aplicar no banco
4. ✅ Testar criação de dados

**Models:**
- `WhatsAppContact` - Contatos do WhatsApp
- `WhatsAppConversation` - Conversas
- `WhatsAppMessage` - Mensagens individuais

**Enums:**
- `MessageType` (TEXT, IMAGE, VIDEO, AUDIO, etc)
- `MessageStatus` (PENDING, SENT, DELIVERED, READ)

**Duração estimada:** 1-2 horas

---

### **FASE 2: Backend API & Integration** (35% do projeto)

**Objetivo:** API REST + Integração com WPPConnect + WebSocket

**Tarefas:**
1. ✅ Instalar dependências (socket.io, multer)
2. ✅ Criar WhatsAppChatService
3. ✅ Integrar WPPConnect.onMessage() → salvar no banco
4. ✅ Criar REST API endpoints
5. ✅ Setup WebSocket server
6. ✅ Implementar eventos real-time

**Endpoints:**
```
GET    /api/whatsapp/conversations
GET    /api/whatsapp/conversations/:id
GET    /api/whatsapp/conversations/:id/messages
POST   /api/whatsapp/conversations/:id/messages
PATCH  /api/whatsapp/messages/:id/read
POST   /api/whatsapp/media/upload
```

**WebSocket Events:**
```
message:new      - Nova mensagem recebida
message:status   - Status mudou (sent/delivered/read)
conversation:update - Conversa atualizada
```

**Duração estimada:** 2-3 horas

---

### **FASE 3: Frontend UI** (30% do projeto)

**Objetivo:** Interface completa estilo WhatsApp Web

**Tarefas:**
1. ✅ Criar estrutura de páginas e componentes
2. ✅ ConversationList (sidebar com lista)
3. ✅ ChatArea (área de mensagens)
4. ✅ MessageInput (input + botões)
5. ✅ Hooks (useConversations, useMessages, useWebSocket)
6. ✅ Conectar com API REST
7. ✅ Integrar WebSocket para real-time

**Componentes:**
```
WhatsAppChatPage/
├── ConversationList       (sidebar esquerda)
│   └── ConversationItem   (item da lista)
├── ChatArea               (área central)
│   ├── ChatHeader         (cabeçalho)
│   ├── MessageList        (lista de mensagens)
│   │   └── MessageItem    (balão de mensagem)
│   └── MessageInput       (input de texto)
└── EmptyState            (quando não há chat selecionado)
```

**Layout:**
- Sidebar 30% largura (lista de conversas)
- Chat 70% largura (mensagens + input)
- Responsivo (mobile: full width)

**Duração estimada:** 2-3 horas

---

### **FASE 4: Features & Polish** (5% do projeto)

**Objetivo:** Funcionalidades avançadas e refinamentos

**Tarefas:**
1. ✅ Upload/preview de mídia (imagens, vídeos, docs)
2. ✅ Indicador de digitação ("João está digitando...")
3. ✅ Status de leitura (checks azuis ✓✓)
4. ✅ Busca de conversas
5. ✅ Scroll automático para última mensagem
6. ✅ Loading states e skeleton
7. ✅ Error handling
8. ✅ Testes básicos

**Features Opcionais (Futuro):**
- Emoji picker
- Arquivar conversas
- Fixar conversas importantes
- Notificações de desktop
- Áudio de voz
- Grupos

**Duração estimada:** 1-2 horas

---

## 🗂️ Schema do Banco de Dados

### **Enums**

```prisma
enum MessageType {
  TEXT
  IMAGE
  VIDEO
  AUDIO
  DOCUMENT
  STICKER
  LOCATION
  CONTACT
  LINK
}

enum MessageStatus {
  PENDING
  SENT
  DELIVERED
  READ
  FAILED
}
```

### **Models**

```prisma
model WhatsAppContact {
  id              String   @id @default(cuid())
  phone           String   @unique
  name            String?
  profilePicUrl   String?
  leadId          String?  @unique
  isBlocked       Boolean  @default(false)
  lastSeenAt      DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  lead            Lead?    @relation(fields: [leadId], references: [id])
  conversations   WhatsAppConversation[]
  messages        WhatsAppMessage[]

  @@index([phone])
  @@map("whatsapp_contacts")
}

model WhatsAppConversation {
  id                  String   @id @default(cuid())
  contactId           String
  lastMessageAt       DateTime @default(now())
  lastMessagePreview  String?
  unreadCount         Int      @default(0)
  isArchived          Boolean  @default(false)
  isPinned            Boolean  @default(false)
  assignedToId        String?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  contact             WhatsAppContact @relation(fields: [contactId], references: [id], onDelete: Cascade)
  assignedTo          User?           @relation(fields: [assignedToId], references: [id])
  messages            WhatsAppMessage[]

  @@index([contactId])
  @@index([lastMessageAt])
  @@map("whatsapp_conversations")
}

model WhatsAppMessage {
  id                String        @id @default(cuid())
  conversationId    String
  contactId         String
  type              MessageType
  content           String
  mediaUrl          String?
  mediaType         String?
  mediaSize         Int?
  thumbnailUrl      String?
  fromMe            Boolean
  status            MessageStatus @default(PENDING)
  whatsappMessageId String?       @unique
  timestamp         DateTime      @default(now())
  deliveredAt       DateTime?
  readAt            DateTime?
  metadata          String?
  isDeleted         Boolean       @default(false)

  conversation      WhatsAppConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  contact           WhatsAppContact      @relation(fields: [contactId], references: [id])

  @@index([conversationId])
  @@index([timestamp])
  @@map("whatsapp_messages")
}
```

---

## 🔌 API Endpoints

### **Conversas**

| Method | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/whatsapp/conversations` | Listar conversas |
| GET | `/api/whatsapp/conversations/:id` | Obter conversa específica |
| PATCH | `/api/whatsapp/conversations/:id` | Atualizar conversa |

### **Mensagens**

| Method | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/whatsapp/conversations/:id/messages` | Listar mensagens |
| POST | `/api/whatsapp/conversations/:id/messages` | Enviar mensagem |
| PATCH | `/api/whatsapp/messages/:id/read` | Marcar como lida |

### **Mídia**

| Method | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/whatsapp/media/upload` | Upload de arquivo |

---

## 🌐 WebSocket Events

### **Cliente → Servidor**

```typescript
socket.emit('message:send', {
  conversationId: string,
  content: string,
  type: MessageType
});

socket.emit('typing:start', { conversationId: string });
socket.emit('typing:stop', { conversationId: string });
```

### **Servidor → Cliente**

```typescript
socket.on('message:new', (message: WhatsAppMessage) => {});
socket.on('message:status', (update: MessageStatusUpdate) => {});
socket.on('conversation:update', (conversation: WhatsAppConversation) => {});
socket.on('typing:indicator', (data: { conversationId, contactName }) => {});
```

---

## 📦 Dependências

### **Backend**

```json
{
  "socket.io": "^4.7.5",
  "multer": "^1.4.5-lts.1",
  "@types/multer": "^1.4.11",
  "@types/socket.io": "^3.0.0"
}
```

### **Frontend**

```json
{
  "socket.io-client": "^4.7.5",
  "react-virtualized-auto-sizer": "^1.0.24",
  "react-window": "^1.8.10"
}
```

---

## ✅ Checklist de Implementação

### **Fase 1: Database** ⏳
- [ ] Criar enums no schema.prisma
- [ ] Criar model WhatsAppContact
- [ ] Criar model WhatsAppConversation
- [ ] Criar model WhatsAppMessage
- [ ] Adicionar relação Lead ↔ WhatsAppContact
- [ ] Gerar migration
- [ ] Aplicar migration
- [ ] Testar criação de dados

### **Fase 2: Backend** ⏳
- [ ] Instalar socket.io e multer
- [ ] Criar WhatsAppChatService
- [ ] Integrar onMessage do WPPConnect
- [ ] Criar conversationRepository
- [ ] Criar messageRepository
- [ ] Criar REST endpoints
- [ ] Setup WebSocket server
- [ ] Implementar eventos real-time
- [ ] Testar envio/recebimento

### **Fase 3: Frontend** ⏳
- [ ] Criar estrutura de arquivos
- [ ] Criar ConversationList
- [ ] Criar ChatArea
- [ ] Criar MessageInput
- [ ] Criar hooks (useConversations, useMessages)
- [ ] Setup WebSocket client
- [ ] Conectar com API
- [ ] Implementar real-time updates
- [ ] Estilização

### **Fase 4: Features** ⏳
- [ ] Upload de mídia
- [ ] Preview de mídia
- [ ] Indicador de digitação
- [ ] Status de leitura
- [ ] Busca
- [ ] Loading states
- [ ] Error handling
- [ ] Polish final

---

## 🚀 Começar Implementação

```bash
# Fase 1 - Database
cd apps/backend
npx prisma format
npx prisma migrate dev --name add_whatsapp_chat_system

# Fase 2 - Backend
npm install socket.io multer @types/multer @types/socket.io

# Fase 3 - Frontend
cd ../frontend
npm install socket.io-client

# Iniciar desenvolvimento
npm run dev
```

---

## 📈 Timeline

| Fase | Duração | Status |
|------|---------|--------|
| Fase 1: Database | 1-2h | ⏳ Pendente |
| Fase 2: Backend | 2-3h | ⏳ Pendente |
| Fase 3: Frontend | 2-3h | ⏳ Pendente |
| Fase 4: Polish | 1-2h | ⏳ Pendente |
| **TOTAL** | **6-10h** | ⏳ Pendente |

---

## 📝 Notas Importantes

1. **Compatibilidade:** Mantém estrutura existente (Lead, Communication)
2. **Escalabilidade:** Índices otimizados para queries rápidas
3. **Real-time:** WebSocket garante UX fluida
4. **Segurança:** Authenticate middleware em todas as rotas
5. **Extensível:** Fácil adicionar grupos, chamadas, etc no futuro

---

## 🎯 Resultado Final Esperado

Interface completa de chat WhatsApp Web com:
- ✅ Lista de conversas em tempo real
- ✅ Chat funcional com balões de mensagens
- ✅ Envio/recebimento instantâneo
- ✅ Status de leitura visual
- ✅ Suporte a mídia
- ✅ Tudo persistido no PostgreSQL

---

**Criado em:** 2025-01-14
**Versão:** 1.0
**Autor:** Claude Code + Ferraco Team
