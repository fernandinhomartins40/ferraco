# 🔧 Plano de Refatoração: Usar Funcionalidades Nativas do WPPConnect

**Data:** 2025-10-20
**Objetivo:** Simplificar código usando recursos nativos do WPPConnect ao invés de reimplementações customizadas

---

## 📋 Problemas Identificados

### 1. **Eventos Nativos NÃO Utilizados**

| Evento | Benefício | Prioridade |
|--------|-----------|------------|
| `onAnyMessage()` | Captura TODAS mensagens (enviadas + recebidas) | 🔴 ALTA |
| `onStateChange()` | Detecta mudanças de estado (CONNECTED, DISCONNECTED, etc) | 🔴 ALTA |
| `onRevokedMessage()` | Mensagens deletadas | 🟡 MÉDIA |
| `onReactionMessage()` | Reações nativas | 🟡 MÉDIA |
| `onMessageEdit()` | Edições de mensagens | 🟢 BAIXA |
| `onPollResponse()` | Respostas de enquetes | 🟢 BAIXA |
| `onNotificationMessage()` | Notificações de grupo | 🟡 MÉDIA |

### 2. **Métodos Nativos Ignorados**

| Método | O que fazemos | Deveria usar |
|--------|---------------|--------------|
| `listChats(options)` | `getAllChats()` (deprecated) | `listChats({onlyUsers: true})` |
| `sendText(to, msg, options)` | Implementação própria | Nativo com botões/reply |
| `subscribePresence(ids)` | Não usado | Para `onPresenceChanged` funcionar |

---

## 🎯 Refatoração Fase 1: Eventos Críticos

### **1.1 - Usar `onAnyMessage()` ao invés de `onMessage()`**

**Problema Atual:**
```typescript
// ❌ Captura APENAS mensagens recebidas
this.client.onMessage(async (message: Message) => {
  // Perde mensagens enviadas
});
```

**Solução:**
```typescript
// ✅ Captura TODAS mensagens (enviadas + recebidas)
this.client.onAnyMessage(async (message: Message) => {
  // message.fromMe indica se é enviada ou recebida

  if (message.fromMe) {
    // Mensagem enviada por nós
    await this.handleOutgoingMessage(message);
  } else {
    // Mensagem recebida
    await this.handleIncomingMessage(message);
  }
});
```

**Benefícios:**
- ✅ Sincronização automática de mensagens enviadas
- ✅ Elimina necessidade de `saveOutgoingMessage()` manual
- ✅ Consistência com WhatsApp Web

---

### **1.2 - Usar `onStateChange()` para Status da Conexão**

**Problema Atual:**
```typescript
// ❌ Callback complexo com strings não tipadas
(statusSession: string, session: string) => {
  switch (statusSession) {
    case 'inChat': // Não tipado
    case 'isLogged': // Strings mágicas
    // ...
  }
}
```

**Solução:**
```typescript
// ✅ Enum tipado do WPPConnect
this.client.onStateChange((state: SocketState) => {
  // SocketState.CONNECTED, DISCONNECTED, OPENING, etc

  switch (state) {
    case SocketState.CONNECTED:
      this.isConnected = true;
      this.emitReady();
      break;

    case SocketState.DISCONNECTED:
      this.isConnected = false;
      this.emitDisconnected('Connection lost');
      break;
  }
});
```

**Benefícios:**
- ✅ Type-safe (TypeScript)
- ✅ Menos erros de strings mágicas
- ✅ Alinhado com padrão do WPPConnect

---

### **1.3 - Usar `onRevokedMessage()` para Mensagens Deletadas**

**Não Implementado Atualmente**

**Solução:**
```typescript
// ✅ Nativo
this.client.onRevokedMessage((data) => {
  // data.id: ID da mensagem deletada
  // data.from: Remetente
  // data.refId: Referência original

  // Emitir WebSocket
  if (this.io) {
    this.io.sockets.emit('message:revoked', {
      messageId: data.id,
      from: data.from,
    });
  }

  logger.info(`🗑️ Mensagem deletada: ${data.id}`);
});
```

**Benefícios:**
- ✅ Sincronização com WhatsApp Web
- ✅ UX idêntica ao app oficial

---

### **1.4 - Usar `onReactionMessage()` para Reações**

**Problema Atual:** Implementação parcial

**Solução:**
```typescript
// ✅ Nativo
this.client.onReactionMessage((reaction) => {
  // reaction.msgId: ID da mensagem
  // reaction.reactionText: Emoji (ou '' para remover)
  // reaction.timestamp: Timestamp

  if (this.io) {
    this.io.sockets.emit('whatsapp:reaction', {
      messageId: reaction.msgId,
      emoji: reaction.reactionText,
      timestamp: new Date(reaction.timestamp * 1000),
    });
  }
});
```

---

## 🎯 Refatoração Fase 2: Presença e Typing

### **2.1 - Usar `onPresenceChanged()` Nativo**

**Problema Atual:** Implementação customizada complexa

**Solução:**
```typescript
// 1. Subscribe para contatos/grupos que queremos monitorar
await this.client.subscribePresence([
  '5511999999999@c.us',
  // ... outros contatos
]);

// 2. Listener nativo
this.client.onPresenceChanged((event: PresenceEvent) => {
  // event.id: ID do contato
  // event.state: 'available', 'unavailable', 'composing', 'recording'
  // event.isOnline: boolean
  // event.isGroup: boolean

  if (this.io) {
    this.io.sockets.emit('whatsapp:presence', {
      contactId: event.id,
      state: event.state,
      isOnline: event.isOnline,
      isTyping: event.state === 'composing',
      isRecording: event.state === 'recording',
    });
  }
});
```

**Substituir:**
- ❌ `whatsappListeners.setupPresenceListeners()`
- ❌ `whatsappListeners.setupTypingListeners()`

**Por:**
- ✅ `onPresenceChanged()` nativo

---

## 🎯 Refatoração Fase 3: Métodos de Busca

### **3.1 - Usar `listChats()` ao invés de `getAllChats()`**

**Problema Atual:**
```typescript
// ❌ Deprecated
const allChats = await this.client.getAllChats();
```

**Solução:**
```typescript
// ✅ Recomendado
const chats = await this.client.listChats({
  onlyUsers: true,      // Apenas conversas privadas
  onlyGroups: false,    // Excluir grupos
  count: 50,            // Limitar a 50
  withLabels: ['VIP'],  // Apenas com label VIP
});
```

---

## 🎯 Refatoração Fase 4: Funcionalidades Avançadas

### **4.1 - Live Location**

```typescript
this.client.onLiveLocation((location: LiveLocation) => {
  // location.id: ID do compartilhamento
  // location.lat, location.lng: Coordenadas

  if (this.io) {
    this.io.sockets.emit('whatsapp:live-location', location);
  }
});
```

### **4.2 - Edição de Mensagens**

```typescript
this.client.onMessageEdit((chatId, msgId, newMessage) => {
  if (this.io) {
    this.io.sockets.emit('message:edited', {
      chatId: chatId._serialized,
      messageId: msgId,
      newContent: newMessage.body,
    });
  }
});
```

### **4.3 - Respostas de Enquetes**

```typescript
this.client.onPollResponse((response) => {
  // response.msgId: ID da enquete
  // response.selectedOptions: Opções escolhidas

  if (this.io) {
    this.io.sockets.emit('poll:response', {
      pollId: response.msgId,
      options: response.selectedOptions,
      sender: response.sender._serialized,
    });
  }
});
```

---

## 📊 Comparação: Antes vs Depois

### **Antes (Customizado):**
```typescript
class WhatsAppListeners {
  setupAllListeners() { /* 300 linhas */ }
  setupPresenceListeners() { /* 150 linhas */ }
  setupTypingListeners() { /* 100 linhas */ }
  setupCallListeners() { /* 80 linhas */ }
  // Total: ~630 linhas de código customizado
}
```

### **Depois (Nativo):**
```typescript
setupNativeListeners() {
  // onAnyMessage (10 linhas)
  // onStateChange (8 linhas)
  // onPresenceChanged (12 linhas)
  // onRevokedMessage (8 linhas)
  // onReactionMessage (10 linhas)
  // Total: ~50 linhas
}
```

**Redução:** ~92% de código
**Ganho:** Mais estável, menos bugs, alinhado com WPPConnect oficial

---

## 🚀 Priorização de Implementação

### **Sprint 1 (Crítico):**
1. ✅ Migrar `onMessage` → `onAnyMessage`
2. ✅ Implementar `onStateChange`
3. ✅ Usar `listChats()` ao invés de `getAllChats()`

### **Sprint 2 (Importante):**
4. ✅ Implementar `onRevokedMessage`
5. ✅ Implementar `onReactionMessage`
6. ✅ Refatorar presença para `onPresenceChanged` + `subscribePresence`

### **Sprint 3 (Desejável):**
7. ✅ Implementar `onMessageEdit`
8. ✅ Implementar `onPollResponse`
9. ✅ Implementar `onLiveLocation`

---

## 📝 Notas de Implementação

1. **Backward Compatibility:** Manter WebSocket events iguais para não quebrar frontend
2. **Testing:** Testar cada evento isoladamente antes de merge
3. **Logging:** Adicionar logs detalhados para debugging
4. **Documentation:** Atualizar docs com novos eventos disponíveis

---

## ✅ Checklist de Validação

- [ ] Todos eventos nativos implementados
- [ ] Listeners customizados removidos
- [ ] WebSocket events atualizados
- [ ] Frontend adaptado para novos eventos
- [ ] Testes E2E passando
- [ ] Performance igual ou melhor
- [ ] Logs estruturados
- [ ] Documentação atualizada

---

**Autor:** Claude AI
**Revisão:** Pending
