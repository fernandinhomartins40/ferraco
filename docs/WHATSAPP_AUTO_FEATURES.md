# WhatsApp - Funcionalidades Automáticas

## Problema Resolvido

**Antes:**
- ❌ Toda vez que abria a aplicação, precisava clicar no ícone de refresh na aba "Configurações" para gerar o QR Code
- ❌ Conversas não carregavam automaticamente - precisava clicar em refresh para atualizar
- ❌ Experiência ruim do usuário com muitos cliques manuais

**Agora:**
- ✅ QR Code gera automaticamente quando WhatsApp está desconectado
- ✅ Conversas carregam automaticamente ao abrir a aba Chat
- ✅ Conversas atualizam automaticamente a cada 30 segundos (polling)
- ✅ Botão de refresh manual ainda disponível para atualização imediata
- ✅ Indicador visual de carregamento durante refresh

## Implementações

### 1. Geração Automática de QR Code

**Arquivo:** [`apps/frontend/src/pages/admin/AdminWhatsApp.tsx:145-155`](../apps/frontend/src/pages/admin/AdminWhatsApp.tsx#L145)

```typescript
// ✅ AUTO-GENERATE QR: Solicitar QR Code automaticamente quando desconectado
useEffect(() => {
  if (!isConnected && connectionState.type === 'disconnected' && !qrCode && !isAuthenticating) {
    console.log('🔄 Não conectado e sem QR Code - solicitando automaticamente...');
    const timer = setTimeout(() => {
      handleReinitialize();
    }, 1000);

    return () => clearTimeout(timer);
  }
}, [isConnected, connectionState.type, qrCode, isAuthenticating]);
```

**Comportamento:**
1. Detecta quando WhatsApp está desconectado
2. Verifica se não há QR Code disponível
3. Aguarda 1 segundo (evitar múltiplas chamadas)
4. Chama `handleReinitialize()` automaticamente
5. Backend gera novo QR Code e emite via Socket.IO
6. Frontend recebe e exibe automaticamente

### 2. Auto-Refresh de Conversas

**Arquivo:** [`apps/frontend/src/components/whatsapp/ConversationList.tsx:67-75`](../apps/frontend/src/components/whatsapp/ConversationList.tsx#L67)

```typescript
// ✅ AUTO-REFRESH: Atualizar conversas automaticamente a cada 30 segundos
useEffect(() => {
  const interval = setInterval(() => {
    console.log('🔄 Auto-refresh de conversas...');
    fetchConversations(true); // Usar indicador de refresh
  }, 30000); // 30 segundos

  return () => clearInterval(interval);
}, [fetchConversations]);
```

**Comportamento:**
1. Polling a cada 30 segundos
2. Busca conversas diretamente do WhatsApp via API (`/whatsapp/conversations/v2`)
3. Usa indicador visual (ícone de refresh girando)
4. Não interrompe a navegação do usuário
5. Cleanup automático ao desmontar componente

### 3. Botão de Refresh Manual

**Arquivo:** [`apps/frontend/src/components/whatsapp/ConversationList.tsx:149-161`](../apps/frontend/src/components/whatsapp/ConversationList.tsx#L149)

```tsx
<div className="flex items-center gap-2 mb-3">
  <h3 className="text-sm font-semibold flex-1">Conversas</h3>
  <Button
    variant="ghost"
    size="sm"
    onClick={() => fetchConversations(true)}
    disabled={isRefreshing}
    className="h-8 w-8 p-0"
    title="Atualizar conversas"
  >
    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
  </Button>
</div>
```

**Comportamento:**
1. Ícone de refresh no header da lista de conversas
2. Animação de rotação durante carregamento
3. Desabilitado durante refresh (evita cliques duplos)
4. Força atualização imediata (não precisa esperar os 30 segundos)

### 4. Indicadores de Estado

**Arquivo:** [`apps/frontend/src/components/whatsapp/ConversationList.tsx:46-61`](../apps/frontend/src/components/whatsapp/ConversationList.tsx#L46)

```typescript
const fetchConversations = useCallback(async (showRefreshIndicator = false) => {
  try {
    if (showRefreshIndicator) {
      setIsRefreshing(true);  // Spinner no botão
    } else {
      setIsLoading(true);      // Loading screen completo
    }
    const response = await api.get('/whatsapp/conversations/v2');
    setConversations(response.data.conversations);
  } catch (error) {
    console.error('Erro ao buscar conversas:', error);
  } finally {
    setIsLoading(false);
    setIsRefreshing(false);
  }
}, []);
```

**Comportamento:**
- **Carregamento inicial:** Tela de loading completa
- **Auto-refresh:** Apenas ícone girando (não bloqueia UI)
- **Refresh manual:** Apenas ícone girando (não bloqueia UI)

## Fluxo Completo

### Cenário 1: Usuário Abre a Aplicação Desconectado

```
1. AdminWhatsApp carrega
2. useWhatsAppSocket conecta ao Socket.IO
3. requestStatus() é chamado automaticamente (500ms delay)
4. Backend responde: { connected: false, hasQR: false }
5. useEffect detecta: !isConnected && !qrCode && connectionState === 'disconnected'
6. handleReinitialize() é chamado automaticamente (1s delay)
7. Backend gera novo QR Code
8. Socket.IO emite 'whatsapp:qr' com base64
9. Frontend recebe e exibe QR Code automaticamente
✅ Usuário vê QR Code sem clicar em nada
```

### Cenário 2: Usuário Abre a Aba Chat

```
1. TabsContent "chat" é renderizado
2. ConversationList é lazy-loaded
3. useEffect chama fetchConversations() automaticamente
4. API /whatsapp/conversations/v2 busca conversas do WhatsApp
5. Conversas são exibidas
6. Polling inicia: auto-refresh a cada 30 segundos
7. WebSocket escuta novas mensagens: atualiza instantaneamente
✅ Usuário vê conversas atualizadas sem clicar em nada
```

### Cenário 3: Nova Mensagem Chega

```
1. WhatsApp recebe mensagem
2. Backend emite 'whatsapp:message' via Socket.IO
3. useWhatsAppWebSocket detecta nova mensagem
4. onNewMessage callback chama fetchConversations()
5. Lista de conversas atualiza instantaneamente
✅ Conversa com nova mensagem sobe para o topo automaticamente
```

## Configurações

### Intervalos de Polling

Você pode ajustar o intervalo de auto-refresh:

**Padrão:** 30 segundos
**Localização:** [`apps/frontend/src/components/whatsapp/ConversationList.tsx:72`](../apps/frontend/src/components/whatsapp/ConversationList.tsx#L72)

```typescript
}, 30000); // ← Altere este valor (em milissegundos)
```

**Recomendações:**
- **10-15s:** Alta frequência de mensagens, muitos usuários
- **30s:** Uso moderado (padrão)
- **60s:** Uso leve, economizar recursos

### Delays de Inicialização

**Delay para requestStatus:**
- **Valor:** 500ms
- **Razão:** Garantir que Socket.IO conectou antes de solicitar status
- **Localização:** [`apps/frontend/src/pages/admin/AdminWhatsApp.tsx:139`](../apps/frontend/src/pages/admin/AdminWhatsApp.tsx#L139)

**Delay para auto-generate QR:**
- **Valor:** 1000ms (1 segundo)
- **Razão:** Evitar múltiplas chamadas ao `handleReinitialize()`
- **Localização:** [`apps/frontend/src/pages/admin/AdminWhatsApp.tsx:150`](../apps/frontend/src/pages/admin/AdminWhatsApp.tsx#L150)

## Performance

### Otimizações Implementadas

1. **React.memo:** `ConversationList` só re-renderiza quando props mudam
2. **useCallback:** Funções de fetch não são recriadas em cada render
3. **useMemo:** Ordenação de conversas é memoizada
4. **Lazy Loading:** Componente só carrega quando aba Chat é acessada
5. **Debouncing:** Delays previnem chamadas excessivas à API

### Impacto de Recursos

- **Polling a cada 30s:** ~120 requests/hora
- **Payload médio:** ~5-10 KB por request
- **Tráfego total:** ~600 KB/hora (~14 MB/dia)
- **CPU:** Impacto mínimo (ordenação memoizada)
- **Memória:** Impacto mínimo (lista limitada a 50 conversas)

## Melhorias Futuras (Opcional)

### 1. Polling Inteligente

Reduzir frequência quando usuário está inativo:

```typescript
// Detectar inatividade do usuário
let isUserActive = true;
let inactivityTimer: NodeJS.Timeout;

const resetInactivityTimer = () => {
  isUserActive = true;
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    isUserActive = false;
  }, 60000); // 1 minuto sem atividade
};

// Ajustar intervalo de polling
const pollingInterval = isUserActive ? 30000 : 120000; // 30s ativo, 2min inativo
```

### 2. Notificações de Novas Mensagens

```typescript
if ('Notification' in window && Notification.permission === 'granted') {
  new Notification('Nova mensagem no WhatsApp', {
    body: `${contact.name}: ${messagePreview}`,
    icon: contact.profilePicUrl,
  });
}
```

### 3. Badge de Contagem de Não Lidas

```typescript
// Atualizar favicon com número de não lidas
const updateFaviconBadge = (unreadCount: number) => {
  const favicon = document.querySelector('link[rel="icon"]');
  if (favicon && unreadCount > 0) {
    // Desenhar badge no canvas e substituir favicon
  }
};
```

## Testes

### Teste Manual 1: Auto-Generate QR

1. Desconectar WhatsApp (clicar em "Desconectar")
2. Aguardar 2 segundos
3. ✅ QR Code deve aparecer automaticamente sem clicar em nada

### Teste Manual 2: Auto-Refresh de Conversas

1. Abrir aba Chat com WhatsApp conectado
2. Enviar mensagem do celular para um contato
3. Aguardar até 30 segundos
4. ✅ Nova conversa deve aparecer automaticamente na lista

### Teste Manual 3: Refresh Manual

1. Abrir aba Chat
2. Clicar no ícone de refresh (↻)
3. ✅ Ícone deve girar durante carregamento
4. ✅ Lista deve atualizar imediatamente

### Teste Manual 4: WebSocket Real-Time

1. Abrir aba Chat
2. Enviar mensagem do celular
3. ✅ Conversa deve atualizar **instantaneamente** (não aguardar 30s)

## Troubleshooting

### QR Code não gera automaticamente

**Sintoma:** Após desconectar, QR Code não aparece

**Diagnóstico:**
1. Abrir Console do navegador (F12)
2. Verificar logs:
   - `🔄 Não conectado e sem QR Code - solicitando automaticamente...`
   - `📡 Cliente solicitou QR Code via Socket.IO`

**Soluções:**
- Verificar se Socket.IO está conectado: `✅ [Socket.IO] Conectado com ID: ...`
- Verificar se backend está rodando: `http://localhost:3000/health`
- Limpar sessão antiga: Deletar pasta `apps/backend/sessions`

### Conversas não atualizam automaticamente

**Sintoma:** Lista de conversas está desatualizada

**Diagnóstico:**
1. Abrir Console do navegador (F12)
2. Verificar logs:
   - `🔄 Auto-refresh de conversas...` (a cada 30s)

**Soluções:**
- Verificar se WhatsApp está conectado: Status deve ser "Conectado"
- Forçar refresh manual: Clicar no ícone ↻
- Recarregar página: F5

### Ícone de refresh girando infinitamente

**Sintoma:** Ícone ↻ fica girando sem parar

**Diagnóstico:**
1. Verificar erro no Console: `Erro ao buscar conversas: ...`

**Soluções:**
- Verificar conexão com backend
- Verificar se WhatsApp está conectado
- Recarregar página

---

**Última atualização:** 2025-10-21
**Versão:** 1.0
