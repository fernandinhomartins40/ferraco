# 🔍 Debug WhatsApp APIs - Guia de Uso

Este documento explica como usar as ferramentas de debug criadas para explorar e testar as APIs do WhatsApp Web.

## 📋 Objetivo

Encontrar as APIs nativas corretas do `window.Store` e `window.WPP` que funcionam em 2025 sem causar stack overflow.

## 🛠️ Ferramentas Disponíveis

### 1. Explorar APIs Disponíveis

**Endpoint:** `GET /api/whatsapp/debug/explore-apis`

**Descrição:** Mapeia toda a estrutura disponível no browser:
- `window.WPP` - Módulos injetados pelo WPPConnect
- `window.Store` - APIs nativas do WhatsApp Web
- `window.webpackChunkwhatsapp_web_client` - Módulos Webpack
- Globals importantes

**Exemplo de uso:**

```bash
# Obter token de autenticação
TOKEN="seu_token_jwt"

# Explorar APIs
curl -X GET "http://ferraco.com.br/api/whatsapp/debug/explore-apis" \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta esperada:**

```json
{
  "success": true,
  "data": {
    "timestamp": "2025-01-25T...",
    "wpp": {
      "available": true,
      "modules": ["chat", "conn", "msg", "contact", ...],
      "details": {
        "chat": {
          "type": "object",
          "functions": ["sendTextMessage", "sendFileMessage", ...],
          "properties": [...]
        }
      }
    },
    "store": {
      "available": true,
      "modules": ["Chat", "Msg", "Contact", "Conn", ...],
      "totalModules": 150,
      "details": {
        "Chat": {
          "functions": ["find", "get", ...],
          "properties": [...]
        }
      }
    },
    "webpack": {
      "available": true,
      "chunksCount": 500
    },
    "globals": ["WPP", "Store", ...]
  }
}
```

### 2. Testar Métodos de Envio

**Endpoint:** `POST /api/whatsapp/debug/test-send-methods`

**Descrição:** Testa diferentes métodos de envio de mensagem para identificar qual funciona sem stack overflow.

**Body:**

```json
{
  "to": "5511999999999",
  "message": "Teste de API"
}
```

**Exemplo de uso:**

```bash
curl -X POST "http://ferraco.com.br/api/whatsapp/debug/test-send-methods" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "message": "Teste"
  }'
```

**Resposta esperada:**

```json
{
  "success": true,
  "data": {
    "timestamp": "2025-01-25T...",
    "chatId": "5511999999999@c.us",
    "tests": [
      {
        "method": "WPP.chat.sendTextMessage",
        "status": "failed",
        "error": "Maximum call stack size exceeded"
      },
      {
        "method": "WPP.conn",
        "status": "explored",
        "available": true,
        "functions": ["sendMessage", "query", ...]
      },
      {
        "method": "WPP.msg",
        "status": "explored",
        "available": true,
        "functions": ["create", "send", ...]
      },
      {
        "method": "Store.sendMessage (raw)",
        "status": "found",
        "available": true
      }
    ]
  }
}
```

## 🎯 Fluxo de Trabalho

### Passo 1: Explorar APIs Disponíveis

1. Garantir que WhatsApp está conectado na VPS
2. Chamar `GET /api/whatsapp/debug/explore-apis`
3. Analisar a resposta para identificar:
   - Módulos disponíveis no `WPP`
   - Módulos disponíveis no `Store`
   - Funções de cada módulo

### Passo 2: Testar Métodos Alternativos

1. Chamar `POST /api/whatsapp/debug/test-send-methods` com número de teste
2. Verificar quais métodos causam stack overflow
3. Identificar métodos que funcionam

### Passo 3: Implementar Solução

Com base nos resultados:
- Se encontrarmos função do `WPP` que funciona → Substituir `WPP.chat.sendTextMessage()`
- Se não houver no `WPP` → Usar `Store` direto
- Se nenhum funcionar → Migrar para `whatsapp-web.js`

## 📝 Notas Importantes

1. **Autenticação:** Todas as rotas requerem token JWT válido
2. **Conexão:** WhatsApp deve estar conectado (QR Code lido)
3. **Número de teste:** Use seu próprio número ou número de teste válido
4. **Rate limiting:** Rotas de debug podem ter rate limiting aplicado

## 🔍 Análise Esperada

Ao executar a exploração, devemos encontrar:

### window.WPP (esperado)
- `WPP.chat` - Funções de chat
- `WPP.conn` - Conexão/WebSocket
- `WPP.msg` - Mensagens
- `WPP.contact` - Contatos
- E outros módulos...

### window.Store (esperado - ofuscado)
- Módulos com nomes como `aZ`, `rK2`, `l5R` (ofuscados)
- Funções importantes podem estar em módulos aleatórios
- Total de 100-200 módulos

## 🚀 Próximos Passos

1. ✅ Deploy feito via GitHub Actions
2. ⏳ Aguardar deploy na VPS (2-3 minutos)
3. 🔍 Executar exploração de APIs
4. 🧪 Testar métodos alternativos
5. ✏️ Implementar solução baseada nos resultados
6. 🎉 Resolver problema de stack overflow definitivamente

## 📊 Logs

Os logs das operações ficam disponíveis em:
- Backend: `docker logs ferraco-backend-1`
- GitHub Actions: https://github.com/fernandinhomartins40/ferraco/actions
