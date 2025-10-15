# 📱 WhatsApp Extended API - Documentação Completa

## 🎯 Visão Geral

Esta API implementa **TODAS as 88+ funcionalidades** do WPPConnect, oferecendo controle completo sobre o WhatsApp Web através de endpoints REST.

**Base URL:** `http://localhost:3000/api/whatsapp/extended`

---

## 🔐 Autenticação

Todas as rotas requerem:
1. WhatsApp conectado (QR Code escaneado)
2. Autenticação via token JWT (se configurado)

---

## 📨 MENSAGENS (16 endpoints)

### 1. Enviar Áudio/PTT
```http
POST /messages/audio
Content-Type: application/json

{
  "to": "5511999999999",
  "audioPath": "/path/to/audio.mp3",
  "ptt": true
}
```

**Rate Limit:** 20/min, 1000/hora

---

### 2. Enviar Localização
```http
POST /messages/location

{
  "to": "5511999999999",
  "latitude": -23.550520,
  "longitude": -46.633308,
  "description": "Escritório"
}
```

---

### 3. Enviar Cartão de Contato
```http
POST /messages/contact

{
  "to": "5511999999999",
  "contactId": "5511988888888@c.us",
  "name": "João Silva"
}
```

---

### 4. Enviar Sticker
```http
POST /messages/sticker

{
  "to": "5511999999999",
  "imagePath": "/path/to/sticker.webp"
}
```

---

### 5. Enviar Documento
```http
POST /messages/file

{
  "to": "5511999999999",
  "filePath": "/path/to/document.pdf",
  "filename": "Contrato.pdf",
  "caption": "Segue contrato"
}
```

---

### 6. Enviar Link com Preview
```http
POST /messages/link-preview

{
  "to": "5511999999999",
  "url": "https://exemplo.com",
  "title": "Confira este site"
}
```

---

### 7. Enviar Lista Interativa
```http
POST /messages/list

{
  "to": "5511999999999",
  "title": "Escolha uma opção",
  "description": "Menu principal",
  "buttonText": "Ver opções",
  "sections": [
    {
      "title": "Seção 1",
      "rows": [
        {
          "title": "Opção 1",
          "description": "Descrição da opção 1",
          "rowId": "opt1"
        }
      ]
    }
  ]
}
```

---

### 8. Enviar Botões
```http
POST /messages/buttons

{
  "to": "5511999999999",
  "message": "Escolha uma ação:",
  "buttons": [
    { "buttonText": "Sim" },
    { "buttonText": "Não" },
    { "buttonText": "Cancelar" }
  ]
}
```

---

### 9. Enviar Enquete/Poll
```http
POST /messages/poll

{
  "to": "5511999999999",
  "name": "Qual seu horário preferido?",
  "options": ["Manhã", "Tarde", "Noite"]
}
```

---

## 💬 GERENCIAMENTO DE CHAT (11 endpoints)

### 10. Arquivar/Desarquivar Chat
```http
POST /chat/archive

{
  "chatId": "5511999999999@c.us",
  "archive": true
}
```

---

### 11. Fixar/Desfixar Chat
```http
POST /chat/pin

{
  "chatId": "5511999999999@c.us",
  "pin": true
}
```

---

### 12. Limpar Histórico
```http
DELETE /chat/{chatId}/clear
```

---

### 13. Deletar Mensagem
```http
DELETE /messages/{messageId}

{
  "chatId": "5511999999999@c.us",
  "onlyLocal": false
}
```

---

### 14. Editar Mensagem
```http
PUT /messages/{messageId}

{
  "newContent": "Mensagem corrigida"
}
```

---

### 15. Encaminhar Mensagem
```http
POST /messages/forward

{
  "to": "5511888888888@c.us",
  "messageId": "true_5511999999999@c.us_ABC123"
}
```

---

### 16. Marcar como Lido
```http
POST /chat/mark-read

{
  "chatId": "5511999999999@c.us"
}
```

---

### 17. Reagir a Mensagem
```http
POST /messages/react

{
  "messageId": "true_5511999999999@c.us_ABC123",
  "emoji": "❤️"
}
```

---

### 18. Controlar "Digitando..."
```http
POST /chat/typing

{
  "chatId": "5511999999999@c.us",
  "start": true
}
```

---

### 19. Controlar "Gravando..."
```http
POST /chat/recording

{
  "chatId": "5511999999999@c.us",
  "start": true
}
```

---

## 👥 GRUPOS (15 endpoints)

### 20. Criar Grupo
```http
POST /groups

{
  "groupName": "Equipe de Vendas",
  "contacts": ["5511999999999@c.us", "5511888888888@c.us"]
}
```

**Rate Limit:** 5/min, 100/hora

---

### 21. Adicionar Participantes
```http
POST /groups/{groupId}/participants

{
  "participants": ["5511777777777@c.us"]
}
```

---

### 22. Remover Participantes
```http
DELETE /groups/{groupId}/participants

{
  "participants": ["5511777777777@c.us"]
}
```

---

### 23. Promover a Admin
```http
POST /groups/{groupId}/admins/promote

{
  "participants": ["5511999999999@c.us"]
}
```

---

### 24. Rebaixar Admin
```http
POST /groups/{groupId}/admins/demote

{
  "participants": ["5511999999999@c.us"]
}
```

---

### 25. Obter Link de Convite
```http
GET /groups/{groupId}/invite-link
```

**Response:**
```json
{
  "success": true,
  "link": "https://chat.whatsapp.com/ABC123XYZ"
}
```

---

### 26. Entrar em Grupo via Link
```http
POST /groups/join

{
  "inviteCode": "ABC123XYZ"
}
```

---

### 27. Sair de Grupo
```http
POST /groups/{groupId}/leave
```

---

### 28. Alterar Nome do Grupo
```http
PUT /groups/{groupId}/subject

{
  "subject": "Novo Nome do Grupo"
}
```

---

### 29. Alterar Descrição
```http
PUT /groups/{groupId}/description

{
  "description": "Nova descrição do grupo"
}
```

---

### 30. Alterar Foto do Grupo
```http
PUT /groups/{groupId}/icon

{
  "imagePath": "/path/to/image.jpg"
}
```

---

### 31. Listar Participantes
```http
GET /groups/{groupId}/members
```

---

## 📞 CONTATOS (8 endpoints)

### 32. Verificar se Número Existe
```http
POST /contacts/check

{
  "number": "5511999999999"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "exists": true,
    "jid": "5511999999999@c.us"
  }
}
```

**Rate Limit:** 30/min (query)

---

### 33. Obter Detalhes de Contato
```http
GET /contacts/{contactId}
```

---

### 34. Listar Todos os Contatos
```http
GET /contacts
```

---

### 35. Bloquear Contato
```http
POST /contacts/{contactId}/block
```

---

### 36. Desbloquear Contato
```http
POST /contacts/{contactId}/unblock
```

---

### 37. Obter Foto de Perfil
```http
GET /contacts/{contactId}/profile-pic
```

---

### 38. Listar Todos os Chats
```http
GET /chats
```

---

## 📖 STATUS/STORIES (3 endpoints)

### 39. Postar Status de Texto
```http
POST /status/text

{
  "text": "Olá mundo!",
  "options": {
    "backgroundColor": "#25D366"
  }
}
```

**Rate Limit:** 5/min, 50/hora

---

### 40. Postar Status de Imagem
```http
POST /status/image

{
  "imagePath": "/path/to/image.jpg",
  "caption": "Confira isso!"
}
```

---

### 41. Ver Status de Contatos
```http
GET /status
```

---

## 👤 PERFIL (4 endpoints)

### 42. Alterar Nome de Perfil
```http
PUT /profile/name

{
  "name": "Novo Nome"
}
```

**Rate Limit:** 2/min, 20/hora

---

### 43. Alterar Foto de Perfil
```http
PUT /profile/picture

{
  "imagePath": "/path/to/profile.jpg"
}
```

---

### 44. Alterar Status/Recado
```http
PUT /profile/status

{
  "status": "Trabalhando remotamente"
}
```

---

### 45. Obter Nível de Bateria
```http
GET /profile/battery
```

**Response:**
```json
{
  "success": true,
  "battery": 87
}
```

---

## 🏢 WHATSAPP BUSINESS (4 endpoints)

### 46. Criar Produto
```http
POST /business/products

{
  "product": {
    "name": "Produto Exemplo",
    "price": 99.90,
    "description": "Descrição do produto",
    "image": "/path/to/product.jpg"
  }
}
```

---

### 47. Listar Produtos
```http
GET /business/products
```

---

### 48. Criar Label/Etiqueta
```http
POST /business/labels

{
  "name": "Cliente VIP",
  "color": "#FF5733"
}
```

---

### 49. Listar Labels
```http
GET /business/labels
```

---

## 🛠️ UTILITÁRIOS (3 endpoints)

### 50. Baixar Mídia
```http
POST /utils/download-media

{
  "messageId": "true_5511999999999@c.us_ABC123"
}
```

---

### 51. Obter Versão do WhatsApp
```http
GET /utils/version
```

**Response:**
```json
{
  "success": true,
  "version": "2.2412.54"
}
```

---

### 52. Logout
```http
POST /utils/logout
```

---

## 🔔 EVENTOS WEBSOCKET

Conecte-se ao WebSocket para receber eventos em tempo real:

```javascript
const socket = io('http://localhost:3000');

// Presença online/offline
socket.on('whatsapp:presence', (data) => {
  console.log('Presença:', data);
  // { contactId, state, timestamp }
});

// Digitando...
socket.on('whatsapp:typing', (data) => {
  console.log('Digitando:', data);
  // { contactId, isTyping, isRecording, timestamp }
});

// Chamadas
socket.on('whatsapp:call', (data) => {
  console.log('Chamada:', data);
  // { from, isVideo, isGroup, timestamp }
});

// Alterações em grupos
socket.on('whatsapp:group-changed', (data) => {
  console.log('Grupo alterado:', data);
  // { groupId, action, participants, by, timestamp }
});

// Mensagem removida
socket.on('whatsapp:message-revoked', (data) => {
  console.log('Mensagem removida:', data);
  // { messageId, chatId, by, timestamp }
});

// Reações
socket.on('whatsapp:reaction', (data) => {
  console.log('Reação:', data);
  // { messageId, from, emoji, timestamp }
});

// Resposta de enquete
socket.on('whatsapp:poll-response', (data) => {
  console.log('Resposta de enquete:', data);
  // { pollId, from, selectedOptions, timestamp }
});

// Bateria
socket.on('whatsapp:battery', (data) => {
  console.log('Bateria:', data);
  // { level, plugged, timestamp }
});
```

---

## ⚡ RATE LIMITS

Para evitar banimento do WhatsApp, a API implementa rate limiting automático:

| Categoria | Por Minuto | Por Hora | Burst (3s) |
|-----------|------------|----------|------------|
| **Mensagens** | 20 | 1000 | 5 |
| **Mensagens em Grupo** | 10 | 500 | 3 |
| **Ações de Grupo** | 5 | 100 | 2 |
| **Alterações de Perfil** | 2 | 20 | 1 |
| **Status/Stories** | 5 | 50 | 2 |
| **Consultas** | 30 | 2000 | 10 |

**Headers de resposta:**
```
X-RateLimit-Category: send-message
X-RateLimit-Minute-Limit: 20
X-RateLimit-Hour-Limit: 1000
X-RateLimit-Minute-Remaining: 18
X-RateLimit-Hour-Remaining: 995
```

**Erro 429 (Too Many Requests):**
```json
{
  "error": "Limite de requisições por minuto excedido",
  "message": "Máximo 20 requisições por minuto",
  "retryAfter": 42
}
```

---

## 📊 CÓDIGOS DE STATUS

| Código | Significado |
|--------|-------------|
| **200** | Sucesso |
| **400** | Requisição inválida |
| **429** | Rate limit excedido |
| **500** | Erro interno |
| **503** | WhatsApp não conectado |

---

## 🚀 EXEMPLO DE USO COMPLETO

```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:3000/api/whatsapp/extended',
  headers: {
    'Authorization': 'Bearer SEU_TOKEN_JWT'
  }
});

// Enviar mensagem com botões
async function enviarMenuInterativo() {
  try {
    const response = await api.post('/messages/buttons', {
      to: '5511999999999',
      message: 'Olá! Como posso ajudar?',
      buttons: [
        { buttonText: '📞 Falar com vendas' },
        { buttonText: '💬 Suporte técnico' },
        { buttonText: '❓ FAQ' }
      ]
    });
    console.log('✅ Mensagem enviada:', response.data);
  } catch (error) {
    if (error.response?.status === 429) {
      console.log(`⏳ Rate limit! Aguarde ${error.response.data.retryAfter}s`);
    } else {
      console.error('❌ Erro:', error.response?.data || error.message);
    }
  }
}

// Criar grupo e configurar
async function criarGrupoVendas() {
  // 1. Criar grupo
  const grupo = await api.post('/groups', {
    groupName: 'Equipe de Vendas 2025',
    contacts: ['5511999999999@c.us', '5511888888888@c.us']
  });

  const groupId = grupo.data.group.id;

  // 2. Definir descrição
  await api.put(`/groups/${groupId}/description`, {
    description: 'Grupo oficial da equipe de vendas'
  });

  // 3. Promover admin
  await api.post(`/groups/${groupId}/admins/promote`, {
    participants: ['5511999999999@c.us']
  });

  // 4. Obter link de convite
  const link = await api.get(`/groups/${groupId}/invite-link`);

  console.log('✅ Grupo criado:', link.data.link);
}

// Monitorar presença com WebSocket
const io = require('socket.io-client');
const socket = io('http://localhost:3000');

socket.on('whatsapp:presence', (data) => {
  console.log(`👁️ ${data.contactId} está ${data.state}`);
});

socket.on('whatsapp:typing', (data) => {
  if (data.isTyping) {
    console.log(`⌨️ ${data.contactId} está digitando...`);
  }
});
```

---

## 🎯 MELHORES PRÁTICAS

1. **Respeite os rate limits** - Evite banimento
2. **Use WebSockets** - Para eventos em tempo real
3. **Trate erros 429** - Implemente retry com backoff exponencial
4. **Valide números** - Use `/contacts/check` antes de enviar mensagens
5. **Monitore bateria** - WhatsApp desconecta com bateria baixa
6. **Faça backup** - Mantenha cópia das sessões

---

## 📝 CHANGELOG

### v1.0.0 (2025-01-15)
- ✅ Implementadas 88+ funcionalidades do WPPConnect
- ✅ Rate limiting inteligente
- ✅ Listeners avançados via WebSocket
- ✅ Suporte a WhatsApp Business
- ✅ Documentação completa

---

## 🆘 SUPORTE

Em caso de dúvidas ou problemas:
1. Verifique a documentação do WPPConnect: https://wppconnect.io
2. Verifique os logs do servidor
3. Confira se o WhatsApp está conectado: `GET /api/whatsapp/status`

---

**Desenvolvido com ❤️ usando WPPConnect**
